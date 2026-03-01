import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { order_id, reason } = await req.json();

    if (!order_id) {
      return Response.json({ error: 'order_id is required' }, { status: 400 });
    }

    const order = await base44.asServiceRole.entities.Order.get(order_id);
    if (!order) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    let refund = null;

    // Attempt Stripe refund if there's a session ID
    if (order.stripe_session_id) {
      const session = await stripe.checkout.sessions.retrieve(order.stripe_session_id);
      if (session.payment_intent) {
        refund = await stripe.refunds.create({
          payment_intent: session.payment_intent,
          reason: 'requested_by_customer',
        });
        console.log(`Stripe refund created: ${refund.id} for order ${order_id}`);
      }
    }

    // Update order status and log the refund
    await base44.asServiceRole.entities.Order.update(order_id, {
      status: 'cancelled',
      cancellation_reason: reason || 'Refunded by admin',
      refund_id: refund?.id || null,
      refunded: true,
    });

    return Response.json({ success: true, refund_id: refund?.id || null });
  } catch (error) {
    console.error('Refund error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});