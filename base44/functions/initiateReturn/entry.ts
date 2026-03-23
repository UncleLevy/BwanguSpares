import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId, productId, reason, description, quantity } = await req.json();

    // Get order details
    const order = await base44.asServiceRole.entities.Order.get(orderId);
    if (!order) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.buyer_email !== user.email) {
      return Response.json({ error: 'Can only return your own orders' }, { status: 403 });
    }

    // Find the product in order items
    const item = order.items.find(i => i.product_id === productId);
    if (!item) {
      return Response.json({ error: 'Product not found in order' }, { status: 404 });
    }

    if (quantity > item.quantity) {
      return Response.json({ error: 'Cannot return more than ordered' }, { status: 400 });
    }

    const refundAmount = item.price * quantity;

    // Create return request
    const returnRequest = await base44.asServiceRole.entities.Return.create({
      order_id: orderId,
      buyer_email: user.email,
      buyer_name: user.full_name,
      shop_id: order.shop_id,
      shop_name: order.shop_name,
      product_id: productId,
      product_name: item.product_name,
      reason,
      description,
      quantity,
      refund_amount: refundAmount,
      status: 'pending'
    });

    // Notify shop
    await base44.asServiceRole.entities.Notification.create({
      user_email: order.shop_id,
      type: 'system_alert',
      title: 'New Return Request',
      message: `Buyer requested return for ${item.product_name} from order #${orderId}`,
      related_id: returnRequest.id,
      action_url: `/shop-dashboard?tab=returns&id=${returnRequest.id}`
    });

    return Response.json({ 
      success: true,
      returnId: returnRequest.id,
      message: 'Return request submitted. Shop will review shortly.'
    });
  } catch (error) {
    console.error('Return initiation error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});