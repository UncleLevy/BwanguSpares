import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data, old_data } = await req.json();

    if (event.type === 'update' && data.stock_quantity <= 5 && old_data?.stock_quantity > 5) {
      const shops = await base44.asServiceRole.entities.Shop.filter({ id: data.shop_id });
      if (shops.length > 0) {
        await base44.asServiceRole.entities.Notification.create({
          user_email: shops[0].owner_email,
          type: 'low_stock',
          title: 'Low Stock Alert',
          message: `${data.name} is running low (${data.stock_quantity} left in stock)`,
          related_id: data.id,
          action_url: '/ShopDashboard',
        });
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});