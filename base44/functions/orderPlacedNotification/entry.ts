import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    // Only process order creation events
    if (event.type !== 'create' || !data) {
      return Response.json({ success: true });
    }

    const order = data;

    // Get shop owner details
    const shops = await base44.asServiceRole.entities.Shop.filter({ id: order.shop_id });
    if (!shops || shops.length === 0) {
      return Response.json({ success: true });
    }

    const shop = shops[0];
    if (!shop.owner_email) {
      return Response.json({ success: true });
    }

    // Format order items
    const itemsList = order.items
      .map(item => `• ${item.product_name} (Qty: ${item.quantity}) - K${(item.price * item.quantity).toLocaleString('en-US', { minimumFractionDigits: 2 })}`)
      .join('\n');

    // Send email notification
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: shop.owner_email,
      subject: `New Order #${order.id?.slice(0, 8)} Received – ${shop.name}`,
      body: `
Hello ${shop.owner_name || 'Shop Owner'},

A new order has been placed for your shop!

ORDER DETAILS:
Order ID: ${order.id}
Customer: ${order.buyer_name} (${order.buyer_email})
Order Date: ${new Date(order.created_date).toLocaleDateString()}
Phone: ${order.delivery_phone || 'N/A'}

ITEMS ORDERED:
${itemsList}

DELIVERY:
Method: ${order.shipping_option === 'deliver' ? 'Delivery' : 'Collection'}
Address: ${order.delivery_address || 'N/A'}
Shipping Cost: K${(order.shipping_cost || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}

TOTAL: K${order.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
${order.coupon_code ? `Coupon Applied: ${order.coupon_code} (Discount: K${order.discount_amount})` : ''}

Payment Method: ${order.payment_method || 'Unknown'}

LOG IN TO YOUR DASHBOARD: Visit BwanguSpares to confirm and process this order.

Best regards,
BwanguSpares Team
      `
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Email notification error:', error);
    // Don't fail the automation on email errors
    return Response.json({ success: true, error: error.message });
  }
});