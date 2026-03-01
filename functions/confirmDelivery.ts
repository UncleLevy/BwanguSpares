import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin only' }, { status: 403 });
    }

    const { orderId } = await req.json();
    const now = new Date().toISOString();

    // Update order to delivery confirmed
    await base44.asServiceRole.entities.Order.update(orderId, {
      status: 'delivered',
      delivery_confirmed_at: now,
      payout_status: 'delivery_confirmed'
    });

    return Response.json({ 
      success: true, 
      message: 'Delivery confirmed. Payout will be released in 7 days or when shop requests.' 
    });
  } catch (error) {
    console.error('Delivery confirmation error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});