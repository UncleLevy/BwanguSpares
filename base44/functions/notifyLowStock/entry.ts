import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data, old_data } = await req.json();

    const threshold = data.low_stock_threshold ?? 5;
    const crossedThreshold = data.stock_quantity <= threshold && (old_data?.stock_quantity ?? threshold + 1) > threshold;

    if (event.type === 'update' && crossedThreshold) {
      const shops = await base44.asServiceRole.entities.Shop.filter({ id: data.shop_id });
      if (shops.length > 0) {
        const shop = shops[0];
        const message = data.stock_quantity === 0
          ? `"${data.name}" is now OUT OF STOCK in your shop.`
          : `"${data.name}" is running low — only ${data.stock_quantity} unit(s) left in stock.`;

        // In-app notification
        await base44.asServiceRole.entities.Notification.create({
          user_email: shop.owner_email,
          type: 'low_stock',
          title: data.stock_quantity === 0 ? 'Out of Stock Alert' : 'Low Stock Alert',
          message,
          related_id: data.id,
          action_url: '/ShopDashboard',
        });

        // Email notification
        await base44.asServiceRole.integrations.Core.SendEmail({
          from_name: 'Bwangu Spares',
          to: shop.owner_email,
          subject: data.stock_quantity === 0
            ? `⚠️ Out of Stock: ${data.name} — ${shop.name}`
            : `🔔 Low Stock Alert: ${data.name} — ${shop.name}`,
          body: `
            <p>Hi ${shop.owner_name || 'Shop Owner'},</p>
            <p>${message}</p>
            <p>Please restock soon to avoid missing sales.</p>
            <p>
              <strong>Product:</strong> ${data.name}<br/>
              <strong>Current Stock:</strong> ${data.stock_quantity}<br/>
              <strong>Alert Threshold:</strong> ≤${threshold}
            </p>
            <p>Log in to your <a href="/ShopDashboard">Shop Dashboard → Inventory</a> to update stock levels.</p>
            <p>— BwanguSpares</p>
          `,
        });
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});