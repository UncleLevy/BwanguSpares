import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'shop_owner') {
      return Response.json({ error: 'Forbidden: Shop owners only' }, { status: 403 });
    }

    const { orderId } = await req.json();
    const now = new Date().toISOString();

    // Get order details
    const order = await base44.asServiceRole.entities.Order.get(orderId);
    
    if (!order) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.payout_status !== 'delivery_confirmed') {
      return Response.json({ error: 'Delivery not yet confirmed' }, { status: 400 });
    }

    // Update order payout status
    await base44.asServiceRole.entities.Order.update(orderId, {
      payout_status: 'payout_requested',
      payout_request_date: now
    });

    return Response.json({ 
      success: true, 
      message: 'Payout request submitted. Admin will review and approve.' 
    });
  } catch (error) {
    console.error('Payout request error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});