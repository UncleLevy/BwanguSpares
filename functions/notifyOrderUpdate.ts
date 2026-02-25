import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data, old_data } = await req.json();

    if (event.type === 'create') {
      // Notify shop owner about new order
      const shops = await base44.asServiceRole.entities.Shop.filter({ id: data.shop_id });
      if (shops.length > 0) {
        await base44.asServiceRole.entities.Notification.create({
          user_email: shops[0].owner_email,
          type: 'new_order',
          title: 'New Order Received',
          message: `You have a new order from ${data.buyer_name} worth K${data.total_amount}`,
          related_id: data.id,
          action_url: '/ShopDashboard',
        });
      }
    } else if (event.type === 'update' && old_data?.status !== data.status) {
      // Notify buyer about order status change
      await base44.asServiceRole.entities.Notification.create({
        user_email: data.buyer_email,
        type: 'order_update',
        title: 'Order Status Updated',
        message: `Your order from ${data.shop_name} is now ${data.status}`,
        related_id: data.id,
        action_url: '/BuyerDashboard',
      });

      // Send review reminder when delivered
      if (data.status === 'delivered') {
        await base44.asServiceRole.entities.Notification.create({
          user_email: data.buyer_email,
          type: 'review_reminder',
          title: 'How was your experience?',
          message: `Your order from ${data.shop_name} was delivered. Leave a review!`,
          related_id: data.id,
          action_url: '/BuyerDashboard',
        });
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});