import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data, old_data } = await req.json();

    if (event.type === 'create') {
      // Notify shop owner about new order
      const shops = await base44.asServiceRole.entities.Shop.filter({ id: data.shop_id });
      const shop = shops[0];
      if (shop) {
        await base44.asServiceRole.entities.Notification.create({
          user_email: shop.owner_email,
          type: 'new_order',
          title: 'New Order Received',
          message: `You have a new order from ${data.buyer_name} worth K${data.total_amount}`,
          related_id: data.id,
          action_url: '/ShopDashboard',
        });

        // Auto-send receipt email to buyer
        const docNumber = `REC-${data.id.slice(0, 6).toUpperCase()}-${Date.now().toString().slice(-4)}`;
        const items = data.items || [];
        const subtotal = items.reduce((s, i) => s + (i.price || 0) * (i.quantity || 1), 0);
        const vat = subtotal * 0.16;
        const total = subtotal + vat;
        const color = '#065f46';

        const itemRows = items.map((item, i) => `
          <tr style="background:${i % 2 === 0 ? '#fff' : '#f9fafb'}">
            <td style="padding:10px 12px;font-size:13px;border-bottom:1px solid #e5e7eb">${item.product_name || 'Item'}</td>
            <td style="padding:10px 12px;text-align:center;font-size:13px;border-bottom:1px solid #e5e7eb">${item.quantity || 1}</td>
            <td style="padding:10px 12px;text-align:right;font-size:13px;border-bottom:1px solid #e5e7eb">K${(item.price || 0).toLocaleString()}</td>
            <td style="padding:10px 12px;text-align:right;font-size:13px;border-bottom:1px solid #e5e7eb">K${((item.price || 0) * (item.quantity || 1)).toLocaleString()}</td>
          </tr>`).join('');

        const receiptHtml = `
          <div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;background:#fff;padding:32px;color:#1a1a1a">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;border-bottom:3px solid ${color};padding-bottom:18px">
              <div>
                <h1 style="font-size:24px;font-weight:bold;color:${color};margin:0">${shop.name}</h1>
                ${shop.address ? `<p style="margin:4px 0 0;font-size:13px;color:#555">${shop.address}</p>` : ''}
                ${shop.region_name ? `<p style="margin:2px 0 0;font-size:13px;color:#555">${shop.region_name}, Zambia</p>` : ''}
                ${shop.phone ? `<p style="margin:2px 0 0;font-size:13px;color:#555">Tel: ${shop.phone}</p>` : ''}
              </div>
              <div style="text-align:right">
                <div style="background:${color};color:#fff;padding:8px 18px;border-radius:6px;font-size:17px;font-weight:bold;letter-spacing:1px">RECEIPT</div>
                <p style="margin:8px 0 2px;font-size:13px;color:#555">No: <strong>${docNumber}</strong></p>
                <p style="margin:2px 0;font-size:13px;color:#555">Date: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
              </div>
            </div>
            <div style="margin-bottom:24px;background:#f8f9fa;padding:16px;border-radius:8px">
              <p style="font-size:11px;text-transform:uppercase;color:#999;font-weight:bold;margin:0 0 8px">Bill To</p>
              <p style="font-weight:bold;font-size:15px;margin:0 0 4px">${data.buyer_name || data.buyer_email}</p>
              ${data.delivery_phone ? `<p style="margin:2px 0;font-size:13px;color:#555">Phone: ${data.delivery_phone}</p>` : ''}
              ${data.delivery_address ? `<p style="margin:2px 0;font-size:13px;color:#555">Address: ${data.delivery_address}</p>` : ''}
            </div>
            <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
              <thead>
                <tr style="background:${color}">
                  <th style="padding:10px 12px;text-align:left;color:#fff;font-size:12px">Description</th>
                  <th style="padding:10px 12px;text-align:center;color:#fff;font-size:12px;width:70px">Qty</th>
                  <th style="padding:10px 12px;text-align:right;color:#fff;font-size:12px;width:110px">Unit Price</th>
                  <th style="padding:10px 12px;text-align:right;color:#fff;font-size:12px;width:110px">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemRows}
                <tr><td colspan="4" style="height:8px"></td></tr>
                <tr><td colspan="2"></td><td style="padding:4px 12px;font-size:13px;color:#555">Subtotal</td><td style="padding:4px 12px;text-align:right;font-size:13px;color:#555">K${subtotal.toLocaleString()}</td></tr>
                <tr><td colspan="2"></td><td style="padding:4px 12px;font-size:13px;color:#555">VAT (16%)</td><td style="padding:4px 12px;text-align:right;font-size:13px;color:#555">K${vat.toLocaleString()}</td></tr>
                <tr>
                  <td colspan="2"></td>
                  <td colspan="2" style="padding:10px 12px;background:${color};color:#fff;font-weight:bold;font-size:15px;border-radius:6px;text-align:right">TOTAL: K${total.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
            <div style="margin-top:36px;padding-top:16px;border-top:1px solid #e5e7eb;text-align:center;font-size:11px;color:#aaa">
              <p style="margin:0">Thank you for your purchase — ${shop.name}</p>
            </div>
          </div>`;

        await base44.asServiceRole.integrations.Core.SendEmail({
          from_name: 'Bwangu Spares',
          to: data.buyer_email,
          subject: `Your Receipt ${docNumber} — ${shop.name}`,
          body: receiptHtml,
        }).catch(() => {});
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