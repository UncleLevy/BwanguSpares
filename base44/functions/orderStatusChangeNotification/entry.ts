import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const BRAND = {
  primary: "#1a3fa8",
  accent: "#0891b2",
  appUrl: "https://bwanguspares.com",
};

const statusConfig = {
  confirmed:  { color: "#0891b2", msg: "Your order has been confirmed by the shop and is being prepared.", badge: "Confirmed" },
  processing: { color: "#7c3aed", msg: "Your order is being packed and will ship very soon.", badge: "Processing" },
  shipped:    { color: "#0891b2", msg: "Your order is on its way!", badge: "Shipped" },
  delivered:  { color: "#059669", msg: "Your order has been delivered successfully. We hope you enjoy your parts! ⭐", badge: "Delivered" },
  cancelled:  { color: "#dc2626", msg: "Your order was cancelled.", badge: "Cancelled" },
};

const infoBox = (rows, borderColor = BRAND.primary) => `
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:10px;border-left:4px solid ${borderColor};margin:18px 0;overflow:hidden;">
    ${rows.map(([label, value]) => `
      <tr>
        <td style="padding:8px 16px;font-size:13px;color:#64748b;width:40%;">${label}</td>
        <td style="padding:8px 16px;font-size:13px;color:#0f172a;font-weight:600;">${value}</td>
      </tr>`).join('<tr><td colspan="2" style="height:1px;background:#e2e8f0;padding:0;"></td></tr>')}
  </table>`;

const alertBox = (message, color = BRAND.primary) => `
  <div style="background:${color}12;border-radius:10px;border:1px solid ${color}30;padding:14px 18px;margin:16px 0;color:${color};font-size:13px;font-weight:600;">${message}</div>`;

const emailTemplate = ({ title, badgeText, badgeColor = BRAND.primary, content, cta, shopLogo = null, shopName = null }) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title} – BwanguSpares</title>
</head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:32px 0;">
    <tr><td align="center">
      <table width="100%" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(26,63,168,0.10);">
        <tr>
          <td style="background:linear-gradient(135deg, #1a3fa8 0%, #0891b2 100%);padding:24px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <span style="color:#fff;font-size:20px;font-weight:700;vertical-align:middle;letter-spacing:-0.3px;">Bwangu<span style="color:#7dd3fc;">Spares</span></span>
                </td>
                <td align="right" style="color:rgba(255,255,255,0.75);font-size:12px;">Zambia's Auto Spares Marketplace</td>
              </tr>
            </table>
          </td>
        </tr>
        ${shopLogo ? `
        <tr>
          <td style="background:#f8fafc;padding:16px 32px;border-bottom:1px solid #e2e8f0;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td><img src="${shopLogo}" alt="Shop Logo" style="width:48px;height:48px;border-radius:8px;object-fit:cover;display:block;" /></td>
                <td style="padding-left:16px;">
                  <p style="margin:0;font-size:13px;color:#64748b;">Sold by</p>
                  <p style="margin:4px 0 0;font-size:15px;font-weight:700;color:#0f172a;">${shopName}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>` : ''}
        <tr>
          <td style="background:${badgeColor}18;border-bottom:3px solid ${badgeColor};padding:20px 32px 16px;">
            <span style="display:inline-block;background:${badgeColor};color:#fff;font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;padding:4px 12px;border-radius:20px;">${badgeText}</span>
            <h1 style="margin:10px 0 0;font-size:22px;font-weight:700;color:#0f172a;line-height:1.3;">${title}</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px;color:#374151;font-size:14px;line-height:1.7;">
            ${content}
          </td>
        </tr>
        ${cta ? `
        <tr>
          <td align="center" style="padding:0 32px 28px;">
            <a href="${cta.url || BRAND.appUrl}" style="display:inline-block;background:linear-gradient(135deg, #1a3fa8 0%, #0891b2 100%);color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:13px 32px;border-radius:10px;letter-spacing:0.3px;">${cta.text}</a>
          </td>
        </tr>` : ''}
        <tr><td style="height:1px;background:#e2e8f0;"></td></tr>
        <tr>
          <td style="background:#f8fafc;padding:20px 32px;text-align:center;">
            <p style="margin:0 0 4px;font-size:12px;color:#64748b;font-weight:600;">BwanguSpares — Zambia's Auto Spares Marketplace</p>
            <p style="margin:0;font-size:11px;color:#cbd5e1;">© 2026 BwanguSpares. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
`;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    if (!event || event.type !== 'update') {
      return Response.json({ success: true, skipped: 'Not an update event' });
    }

    if (!data || !data.id) {
      return Response.json({ success: true, skipped: 'Missing order data' });
    }

    // Fetch the full order details to get all info
    const order = await base44.asServiceRole.entities.Order.get(data.id);
    if (!order) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    // Only send email if status is defined and valid
    const validStatuses = ['confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!order.status || !validStatuses.includes(order.status)) {
      return Response.json({ success: true, skipped: 'Invalid or missing status' });
    }

    const cfg = statusConfig[order.status] || { color: BRAND.primary, msg: `Status updated to ${order.status}.`, badge: order.status };
    
    // Fetch shop details including logo
    let shopAddress = "—";
    let shopLogo = null;
    let shopPhone = null;
    try {
      const shops = await base44.asServiceRole.entities.Shop.filter({ id: order.shop_id });
      if (shops.length > 0) {
        const shop = shops[0];
        shopAddress = [shop.address, shop.town, shop.region_name].filter(Boolean).join(", ");
        shopLogo = shop.logo_url;
        shopPhone = shop.phone;
      }
    } catch (e) {
      console.warn("Failed to fetch shop details:", e?.message);
    }

    const content = `
      <p style="margin:0 0 16px;">Hi <strong>${order.buyer_name || "there"}</strong>,</p>
      ${alertBox(cfg.msg, cfg.color)}
      ${infoBox([
        ["Shop", order.shop_name || "—"],
        ["Shop Address", shopAddress],
        ...(shopPhone ? [["Shop Phone", shopPhone]] : []),
        ["Total", `K${(order.total_amount || 0).toLocaleString()}`],
        ...(order.tracking_number ? [["Tracking #", order.tracking_number]] : []),
      ], cfg.color)}
      <p style="font-size:13px;color:#64748b;margin:12px 0 0;">Visit your Buyer Dashboard to view full order details.</p>
    `;

    const htmlBody = emailTemplate({
      title: `Order ${cfg.badge}`,
      badgeText: cfg.badge,
      badgeColor: cfg.color,
      content,
      cta: { text: "Track My Order", url: BRAND.appUrl },
      shopLogo,
      shopName: order.shop_name,
    });

    // Send email
    await base44.integrations.Core.SendEmail({
      from_name: "BwanguSpares",
      to: order.buyer_email,
      subject: `📦 Order ${cfg.badge} – BwanguSpares`,
      body: htmlBody,
    });

    console.log(`Order status notification sent to ${order.buyer_email} for order ${order.id} - Status: ${order.status}`);

    return Response.json({
      success: true,
      message: 'Status update email sent',
      order_id: order.id,
      status: order.status,
      buyer_email: order.buyer_email,
    });
  } catch (error) {
    console.error('Order status notification error:', error);
    return Response.json({
      error: error.message || 'Failed to send status notification',
    }, { status: 500 });
  }
});