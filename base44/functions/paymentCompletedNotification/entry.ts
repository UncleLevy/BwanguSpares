import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    
    // Only process when order transitions to "confirmed" (payment completed)
    if (payload.event.type !== 'update' || payload.data.status !== 'confirmed') {
      return Response.json({ success: true });
    }

    const order = payload.data;
    const shop = await base44.asServiceRole.entities.Shop.list().then(shops => 
      shops.find(s => s.id === order.shop_id)
    );

    if (!shop || !shop.owner_email) {
      return Response.json({ success: true });
    }

    const itemsList = order.items
      .map(item => `• ${item.product_name} (Qty: ${item.quantity}) - K${(item.price * item.quantity).toLocaleString('en-ZM', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)
      .join('\n');

    const totalAmount = order.total_amount.toLocaleString('en-ZM', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const htmlBody = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #0891b2 0%, #0369a1 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }
            .content { background: #f9fafb; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .section { margin: 20px 0; }
            .section-title { font-weight: 600; color: #1f2937; margin-bottom: 10px; font-size: 14px; }
            .item { color: #4b5563; font-size: 14px; line-height: 1.6; }
            .total-box { background: white; border: 2px solid #0891b2; border-radius: 6px; padding: 15px; margin: 15px 0; }
            .total-amount { font-size: 24px; font-weight: 700; color: #0891b2; }
            .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
            .button { display: inline-block; background: #0891b2; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 600; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2 style="margin: 0; font-size: 24px;">💳 Payment Received!</h2>
              <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Order #${order.id.substring(0, 8).toUpperCase()}</p>
            </div>
            
            <div class="content">
              <div class="section">
                <p style="margin: 0; color: #4b5563; font-size: 14px;">
                  Hi ${shop.owner_name || 'Shop Owner'},
                </p>
              </div>
              
              <div class="section">
                <p style="margin: 0; color: #4b5563; font-size: 14px;">
                  ✅ A payment of <strong>K${totalAmount}</strong> has been completed for the order below.
                </p>
              </div>
              
              <div class="section">
                <div class="section-title">📦 Order Details</div>
                <div style="background: white; padding: 12px; border-radius: 6px; border-left: 3px solid #0891b2;">
                  <div style="font-size: 13px; margin-bottom: 8px;"><strong>Customer:</strong> ${order.buyer_name}</div>
                  <div style="font-size: 13px; margin-bottom: 8px;"><strong>Email:</strong> ${order.buyer_email}</div>
                  <div style="font-size: 13px;"><strong>Phone:</strong> ${order.delivery_phone}</div>
                </div>
              </div>
              
              <div class="section">
                <div class="section-title">📋 Items Ordered</div>
                <div style="background: white; padding: 12px; border-radius: 6px;">
                  ${itemsList.split('\n').map(item => `<div class="item">${item}</div>`).join('')}
                </div>
              </div>
              
              <div class="total-box">
                <div style="color: #6b7280; font-size: 12px; margin-bottom: 5px;">Total Amount</div>
                <div class="total-amount">K${totalAmount}</div>
              </div>
              
              <div class="section">
                <div class="section-title">🚚 Delivery Information</div>
                <div style="background: white; padding: 12px; border-radius: 6px; border-left: 3px solid #10b981;">
                  <div style="font-size: 13px; margin-bottom: 8px;"><strong>Method:</strong> ${order.shipping_option === 'deliver' ? '🚚 Delivery' : '📍 Collection'}</div>
                  <div style="font-size: 13px;"><strong>Address:</strong> ${order.delivery_address}</div>
                </div>
              </div>
              
              <div style="text-align: center; margin-top: 20px;">
                <a href="${process.env.SHOP_DASHBOARD_URL || 'https://bwanguspares.com'}" class="button">View Order Details</a>
              </div>
            </div>
            
            <div class="footer">
              <p style="margin: 0; margin-bottom: 10px;">BwanguSpares • Zambia's Virtual Marketplace for Auto Spare Parts</p>
              <p style="margin: 0; color: #9ca3af;">© 2026 BwanguSpares. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await base44.integrations.Core.SendEmail({
      to: shop.owner_email,
      from_name: 'BwanguSpares',
      subject: `💳 Payment Received - Order #${order.id.substring(0, 8).toUpperCase()}`,
      body: htmlBody,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Payment notification error:', error);
    // Don't fail the automation, just log the error
    return Response.json({ success: true });
  }
});