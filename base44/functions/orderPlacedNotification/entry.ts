import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const BRAND_GRADIENT = "linear-gradient(135deg, #1a3fa8 0%, #0891b2 100%)";
const BRAND_LOGO = "https://media.base44.com/images/public/699f775333a30acfe3b73c4e/097f0a26f_DynamicBlueSwooshwithCohesiveTypography9.jpg";
const APP_URL = "https://bwanguspares.com";

const emailTemplate = ({ title, badgeText, badgeColor, content, ctaText, ctaUrl }) => `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${title} – BwanguSpares</title></head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:32px 0;">
  <tr><td align="center">
    <table width="100%" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(26,63,168,0.10);">
      <tr><td style="background:${BRAND_GRADIENT};padding:24px 32px;">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td><img src="${BRAND_LOGO}" alt="BwanguSpares" width="40" height="40" style="border-radius:10px;vertical-align:middle;margin-right:10px;"/><span style="color:#fff;font-size:20px;font-weight:700;vertical-align:middle;">Bwangu<span style="color:#7dd3fc;">Spares</span></span></td>
          <td align="right" style="color:rgba(255,255,255,0.75);font-size:12px;">Zambia's Auto Spares Marketplace</td>
        </tr></table>
      </td></tr>
      <tr><td style="background:${badgeColor}18;border-bottom:3px solid ${badgeColor};padding:20px 32px 16px;">
        <span style="display:inline-block;background:${badgeColor};color:#fff;font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;padding:4px 12px;border-radius:20px;">${badgeText}</span>
        <h1 style="margin:10px 0 0;font-size:22px;font-weight:700;color:#0f172a;line-height:1.3;">${title}</h1>
      </td></tr>
      <tr><td style="padding:28px 32px;color:#374151;font-size:14px;line-height:1.7;">${content}</td></tr>
      ${ctaText ? `<tr><td align="center" style="padding:0 32px 28px;"><a href="${ctaUrl || APP_URL}" style="display:inline-block;background:${BRAND_GRADIENT};color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:13px 32px;border-radius:10px;">${ctaText}</a></td></tr>` : ''}
      <tr><td style="height:1px;background:#e2e8f0;"></td></tr>
      <tr><td style="background:#f8fafc;padding:20px 32px;text-align:center;">
        <p style="margin:0 0 4px;font-size:12px;color:#64748b;font-weight:600;">BwanguSpares — Zambia's Auto Spares Marketplace</p>
        <p style="margin:0 0 4px;font-size:11px;color:#94a3b8;">Flat 15C Kalewa Complex, Ndola · <a href="mailto:admin@bwangu.com" style="color:#0891b2;text-decoration:none;">admin@bwangu.com</a> · +260 763 109 823</p>
        <p style="margin:0;font-size:11px;color:#cbd5e1;">© 2026 BwanguSpares. All rights reserved.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    if (event.type !== 'create' || !data) {
      return Response.json({ success: true });
    }

    const order = data;

    const shops = await base44.asServiceRole.entities.Shop.filter({ id: order.shop_id });
    if (!shops || shops.length === 0) return Response.json({ success: true });
    const shop = shops[0];
    if (!shop.owner_email) return Response.json({ success: true });

    const itemRows = (order.items || []).map(item =>
      `<tr>
        <td style="padding:10px 12px;font-size:13px;color:#374151;border-bottom:1px solid #f1f5f9;">${item.product_name}</td>
        <td style="padding:10px 12px;font-size:13px;text-align:center;border-bottom:1px solid #f1f5f9;">×${item.quantity}</td>
        <td style="padding:10px 12px;font-size:13px;text-align:right;font-weight:600;color:#0891b2;border-bottom:1px solid #f1f5f9;">K${((item.price || 0) * (item.quantity || 1)).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
      </tr>`).join('');

    const content = `
      <p style="margin:0 0 18px;">Hi <strong>${shop.name}</strong> team,</p>
      <p style="margin:0 0 20px;">You have received a new order! Review the details below and confirm it promptly to begin fulfillment.</p>

      <div style="background:#f0f9ff;border-radius:12px;border-left:4px solid #0891b2;padding:16px;margin:20px 0;">
        <p style="margin:0 0 6px;font-size:12px;color:#0891b2;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">&#128100; Customer</p>
        <p style="margin:0;font-size:14px;color:#0f172a;font-weight:600;">${order.buyer_name || "Guest"}</p>
        <p style="margin:4px 0 0;font-size:13px;color:#64748b;">${order.delivery_phone || "No phone provided"}</p>
      </div>

      <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:10px;overflow:hidden;border:1px solid #e2e8f0;margin:20px 0;">
        <tr style="background:${BRAND_GRADIENT};color:#fff;">
          <th style="padding:12px;text-align:left;font-size:12px;font-weight:700;text-transform:uppercase;">&#128230; Item</th>
          <th style="padding:12px;text-align:center;font-size:12px;font-weight:700;text-transform:uppercase;">Qty</th>
          <th style="padding:12px;text-align:right;font-size:12px;font-weight:700;text-transform:uppercase;">Price</th>
        </tr>
        ${itemRows}
        <tr style="background:#f8fafc;">
          <td colspan="2" style="padding:14px 12px;font-size:14px;font-weight:700;color:#0f172a;text-align:right;">Total:</td>
          <td style="padding:14px 12px;font-size:18px;font-weight:800;text-align:right;color:#0891b2;">K${(order.total_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
        </tr>
      </table>

      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:10px;border-left:4px solid #1a3fa8;margin:18px 0;">
        <tr><td style="padding:8px 16px;font-size:13px;color:#64748b;width:40%;">&#128205; Delivery Method</td><td style="padding:8px 16px;font-size:13px;color:#0f172a;font-weight:600;">${order.shipping_option === 'deliver' ? '&#128666; Delivery' : '&#128203; Collection'}</td></tr>
        <tr><td colspan="2" style="height:1px;background:#e2e8f0;padding:0;"></td></tr>
        <tr><td style="padding:8px 16px;font-size:13px;color:#64748b;">&#128235; Address</td><td style="padding:8px 16px;font-size:13px;color:#0f172a;font-weight:600;">${order.delivery_address || "Collect in-store"}</td></tr>
        <tr><td colspan="2" style="height:1px;background:#e2e8f0;padding:0;"></td></tr>
        <tr><td style="padding:8px 16px;font-size:13px;color:#64748b;">&#128179; Payment</td><td style="padding:8px 16px;font-size:13px;color:#0f172a;font-weight:600;">${order.payment_method || "Online"}</td></tr>
      </table>

      ${order.notes ? `<div style="background:#fef9c3;border-radius:10px;border:1px solid #fde68a;padding:14px;margin:16px 0;"><p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#b45309;text-transform:uppercase;">&#128221; Customer Notes</p><p style="margin:0;font-size:13px;color:#78350f;">"${order.notes}"</p></div>` : ''}

      <div style="background:#dbeafe;border-radius:10px;border:1px solid #bfdbfe;padding:14px;margin:20px 0;">
        <p style="margin:0;font-size:13px;color:#1e3a8a;">&#9889; Log in to your <strong>Shop Dashboard</strong> to confirm and process this order immediately.</p>
      </div>
    `;

    await base44.asServiceRole.integrations.Core.SendEmail({
      from_name: "BwanguSpares",
      to: shop.owner_email,
      subject: `&#127881; New Order – K${(order.total_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} – ${shop.name}`,
      body: emailTemplate({ title: "New Order Received!", badgeText: "New Order", badgeColor: "#0891b2", content, ctaText: "Confirm Order Now", ctaUrl: APP_URL }),
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Email notification error:', error);
    return Response.json({ success: true, error: error.message });
  }
});