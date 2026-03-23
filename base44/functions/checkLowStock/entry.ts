import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all products for this shop owner
    const shops = await base44.asServiceRole.entities.Shop.filter({ owner_email: user.email });
    const lowStockProducts = [];

    for (const shop of shops) {
      const products = await base44.asServiceRole.entities.Product.filter({ shop_id: shop.id });
      
      for (const product of products) {
        const threshold = product.low_stock_threshold ?? 5;
        if (product.stock_quantity <= threshold) {
          lowStockProducts.push({
            product_id: product.id,
            name: product.name,
            stock: product.stock_quantity,
            threshold,
            shop_id: shop.id,
            shop_name: shop.name
          });
        }
      }
    }

    // Create dashboard notifications for each low-stock product
    for (const item of lowStockProducts) {
      const existingNotif = await base44.asServiceRole.entities.Notification.filter({
        user_email: user.email,
        related_id: item.product_id,
        type: "low_stock",
        read: false
      });

      if (existingNotif.length === 0) {
        await base44.asServiceRole.entities.Notification.create({
          user_email: user.email,
          type: 'low_stock',
          title: 'Low Stock Alert',
          message: `${item.name} in ${item.shop_name} is running low (${item.stock} / ${item.threshold})`,
          related_id: item.product_id,
          action_url: `/shop-dashboard?view=inventory`
        });
      }
    }

    // Send email notification
    if (lowStockProducts.length > 0) {
      const productsList = lowStockProducts
        .map(p => `- ${p.name} (${p.stock}/${p.threshold}) in ${p.shop_name}`)
        .join('\n');

      await base44.integrations.Core.SendEmail({
        to: user.email,
        subject: `Low Stock Alert - ${lowStockProducts.length} Product(s)`,
        body: `The following products are running low on stock:\n\n${productsList}\n\nPlease restock your inventory.`
      });
    }

    return Response.json({ success: true, lowStockCount: lowStockProducts.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});