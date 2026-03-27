import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data, old_data } = await req.json();

    if (event.type === 'create') {
      // Deduct stock for each ordered item — wrapped in try/catch so bad product IDs don't crash the function
      const items = data.items || [];
      for (const item of items) {
        if (item.product_id) {
          try {
            const product = await base44.asServiceRole.entities.Product.get(item.product_id);
            if (product) {
              const newQty = Math.max(0, (product.stock_quantity || 0) - (item.quantity || 1));
              await base44.asServiceRole.entities.Product.update(product.id, {
                stock_quantity: newQty,
                status: newQty === 0 ? 'out_of_stock' : product.status === 'out_of_stock' ? 'active' : product.status,
              });
            }
          } catch (err) {
            console.warn(`Stock deduction skipped for product ${item.product_id}:`, err.message);
          }
        }
      }

      // Notify shop owner about new order — wrapped so bad shop_id doesn't crash
      let shop = null;
      try {
        shop = await base44.asServiceRole.entities.Shop.get(data.shop_id);
      } catch (err) {
        console.warn(`Shop lookup skipped for ${data.shop_id}:`, err.message);
      }
      if (shop) {
        await base44.asServiceRole.entities.Notification.create({
          user_email: shop.owner_email,
          type: 'new_order',
          title: 'New Order Received',
          message: `You have a new order from ${data.buyer_name} worth K${data.total_amount}`,
          related_id: data.id,
          action_url: 'ShopDashboard?view=orders',
        });

        // Auto-send receipt email to buyer
        const docNumber = `REC-${data.id.slice(0, 6).toUpperCase()}-${Date.now().toString().slice(-4)}`;
        const items = data.items || [];
        const subtotal = items.reduce((s, i) => s + (i.price || 0) * (i.quantity || 1), 0);
        const color = '#065f46';

        const itemRows = items.map((item, i) => `
          <tr style="background:${i % 2 === 0 ? '#fff' : '#f9fafb'}">
            <td style="padding:10px 12px;font-size:13px;border-bottom:1px solid #e5e7eb">${item.product_name || 'Item'}</td>
            <td style="padding:10px 12px;text-align:center;font-size:13px;border-bottom:1px solid #e5e7eb">${item.quantity || 1}</td>
            <td style="padding:10px 12px;text-align:right;font-size:13px;border-bottom:1px solid #e5e7eb">K${(item.price || 0).toLocaleString()}</td>
            <td style="padding:10px 12px;text-align:right;font-size:13px;border-bottom:1px solid #e5e7eb">K${((item.price || 0) * (item.quantity || 1)).toLocaleString()}</td>
          </tr>`).join('');

        const shippingCost = data.shipping_cost || 0;
        const discountAmount = data.discount_amount || 0;
        const subtotalExVat = (subtotal + shippingCost - discountAmount) / 1.16;
        const vatAmount = (subtotal + shippingCost - discountAmount) - subtotalExVat;
        const grandTotal = data.total_amount || (subtotal + shippingCost - discountAmount);
        
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
              ${data.delivery_address ? `<p style="margin:2px 0;font-size:13px;color:#555">Delivery: ${data.delivery_address}</p>` : ''}
              ${data.shipping_option ? `<p style="margin:2px 0;font-size:13px;color:#555">Shipping: ${data.shipping_option === 'deliver' ? '🚚 Delivery' : '🏪 Collect in-store'}</p>` : ''}
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
                <tr><td colspan="2"></td><td style="padding:4px 12px;font-size:13px;color:#555">Subtotal (items)</td><td style="padding:4px 12px;text-align:right;font-size:13px;color:#555">K${subtotal.toLocaleString()}</td></tr>
                ${shippingCost > 0 ? `<tr><td colspan="2"></td><td style="padding:4px 12px;font-size:13px;color:#555">Shipping</td><td style="padding:4px 12px;text-align:right;font-size:13px;color:#555">K${shippingCost.toLocaleString()}</td></tr>` : ''}
                ${discountAmount > 0 ? `<tr><td colspan="2"></td><td style="padding:4px 12px;font-size:13px;color:#059669">Discount${data.coupon_code ? ` (${data.coupon_code})` : ''}</td><td style="padding:4px 12px;text-align:right;font-size:13px;color:#059669">-K${discountAmount.toLocaleString()}</td></tr>` : ''}
                <tr><td colspan="2"></td><td style="padding:4px 12px;font-size:13px;color:#555">Subtotal (excl. VAT)</td><td style="padding:4px 12px;text-align:right;font-size:13px;color:#555">K${subtotalExVat.toFixed(2)}</td></tr>
                <tr><td colspan="2"></td><td style="padding:4px 12px;font-size:13px;color:#555">VAT (16%)</td><td style="padding:4px 12px;text-align:right;font-size:13px;color:#555">K${vatAmount.toFixed(2)}</td></tr>
                <tr>
                  <td colspan="2"></td>
                  <td colspan="2" style="padding:10px 12px;background:${color};color:#fff;font-weight:bold;font-size:15px;border-radius:6px;text-align:right">TOTAL: K${grandTotal.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
            ${data.notes ? `<div style="background:#fef3c7;padding:12px;border-radius:8px;margin:20px 0"><p style="margin:0;font-size:12px;color:#666"><strong>Note:</strong> ${data.notes}</p></div>` : ''}
            <div style="margin-top:36px;padding-top:16px;border-top:1px solid #e5e7eb;text-align:center;font-size:11px;color:#aaa">
              <p style="margin:0 0 4px">Thank you for your purchase — ${shop.name}</p>
              <p style="margin:0;font-size:10px">Payment Method: ${data.payment_method?.toUpperCase() || 'N/A'} | This is a computer-generated receipt</p>
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
        action_url: 'BuyerDashboard?view=orders',
      });

      // Send review reminder when delivered
      if (data.status === 'delivered') {
        await base44.asServiceRole.entities.Notification.create({
          user_email: data.buyer_email,
          type: 'review_reminder',
          title: 'How was your experience?',
          message: `Your order from ${data.shop_name} was delivered. Leave a review!`,
          related_id: data.id,
          action_url: 'BuyerDashboard?view=orders',
        });

        // Award loyalty points: 1 point per K1 spent (with tier multiplier)
        const amountSpent = Math.floor(data.total_amount || 0);
        if (amountSpent > 0) {
          const accounts = await base44.asServiceRole.entities.LoyaltyPoints.filter({ buyer_email: data.buyer_email });
          const currentTier = accounts[0]?.tier || 'bronze';
          const multiplier = { bronze: 1, silver: 1.2, gold: 1.5, platinum: 2 }[currentTier] || 1;
          const pointsEarned = Math.round(amountSpent * multiplier);
          const newBalance = (accounts[0]?.points_balance || 0) + pointsEarned;
          const newTotal = (accounts[0]?.total_earned || 0) + pointsEarned;

          // Calculate tier
          let newTier = 'bronze';
          if (newTotal >= 3500) newTier = 'platinum';
          else if (newTotal >= 1500) newTier = 'gold';
          else if (newTotal >= 500) newTier = 'silver';

          if (accounts.length > 0) {
            await base44.asServiceRole.entities.LoyaltyPoints.update(accounts[0].id, {
              points_balance: newBalance,
              total_earned: newTotal,
              tier: newTier,
            });
          } else {
            await base44.asServiceRole.entities.LoyaltyPoints.create({
              buyer_email: data.buyer_email,
              buyer_name: data.buyer_name || data.buyer_email,
              points_balance: pointsEarned,
              total_earned: pointsEarned,
              total_redeemed: 0,
              tier: newTier,
            });
          }
          await base44.asServiceRole.entities.LoyaltyTransaction.create({
            buyer_email: data.buyer_email,
            type: 'earn',
            points: pointsEarned,
            reason: `Purchase from ${data.shop_name}`,
            order_id: data.id,
          });

          // Notify buyer of points earned
          await base44.asServiceRole.entities.Notification.create({
            user_email: data.buyer_email,
            type: 'system_alert',
            title: `+${pointsEarned} Loyalty Points Earned! 🎉`,
            message: `You earned ${pointsEarned} points for your order from ${data.shop_name}. Total: ${newBalance} pts`,
            action_url: 'BuyerDashboard?view=loyalty',
          });
        }
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});