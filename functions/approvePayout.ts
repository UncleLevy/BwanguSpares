import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin only' }, { status: 403 });
    }

    const { orderId, paymentMethod = 'bank_transfer', reference = '' } = await req.json();

    // Get order
    const order = await base44.asServiceRole.entities.Order.get(orderId);
    
    if (!order) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    // Create payout record
    const payout = await base44.asServiceRole.entities.Payout.create({
      shop_id: order.shop_id,
      shop_name: order.shop_name,
      owner_email: order.shop_id,
      amount: order.total_amount,
      method: paymentMethod,
      reference: reference,
      status: 'completed',
      processed_by: user.email,
      processed_at: new Date().toISOString()
    });

    // Update order
    await base44.asServiceRole.entities.Order.update(orderId, {
      payout_status: 'payout_completed',
      payout_id: payout.id
    });

    return Response.json({ 
      success: true, 
      payoutId: payout.id,
      message: 'Payout approved and processed.' 
    });
  } catch (error) {
    console.error('Payout approval error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});