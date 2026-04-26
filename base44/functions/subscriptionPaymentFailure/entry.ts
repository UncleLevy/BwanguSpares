import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const sendEmail = async (to, subject, body) => {
  try {
    const base44 = createClientFromRequest(new Request('http://localhost', { method: 'POST' }));
    await base44.integrations.Core.SendEmail({ from_name: 'BwanguSpares', to, subject, body });
  } catch (e) {
    console.warn('Email notification failed:', e.message);
  }
};

const emailTemplate = (title, badgeText, badgeColor, content, cta) => `
<!DOCTYPE html>
<html><head><meta charset="UTF-8"/><title>${title} – BwanguSpares</title></head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:32px 0;">
<tr><td align="center">
<table width="100%" style="max-width:600px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(26,63,168,0.10);">
<tr><td style="background:linear-gradient(135deg, #1a3fa8 0%, #0891b2 100%);padding:24px 32px;">
<img src="https://media.base44.com/images/public/699f775333a30acfe3b73c4e/097f0a26f_DynamicBlueSwooshwithCohesiveTypography9.jpg" alt="Logo" width="40" height="40" style="border-radius:10px;vertical-align:middle;margin-right:10px;"/>
<span style="color:#fff;font-size:20px;font-weight:700;">Bwangu<span style="color:#7dd3fc;">Spares</span></span>
</td></tr>
<tr><td style="background:${badgeColor}18;border-bottom:3px solid ${badgeColor};padding:20px 32px;">
<span style="display:inline-block;background:${badgeColor};color:#fff;font-size:11px;font-weight:700;padding:4px 12px;border-radius:20px;">${badgeText}</span>
<h1 style="margin:10px 0 0;font-size:22px;font-weight:700;color:#0f172a;">${title}</h1>
</td></tr>
<tr><td style="padding:28px 32px;color:#374151;font-size:14px;line-height:1.7;">${content}</td></tr>
${cta ? `<tr><td align="center" style="padding:0 32px 28px;"><a href="${cta.url}" style="display:inline-block;background:linear-gradient(135deg, #1a3fa8 0%, #0891b2 100%);color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:13px 32px;border-radius:10px;">${cta.text}</a></td></tr>` : ''}
<tr><td style="height:1px;background:#e2e8f0;"></td></tr>
<tr><td style="background:#f8fafc;padding:20px 32px;text-align:center;font-size:11px;color:#cbd5e1;">© 2026 BwanguSpares. All rights reserved.</td></tr>
</table>
</td></tr>
</table>
</body>
</html>
`;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { shopEmail, shopName, tier, failureReason } = await req.json();

    if (!shopEmail || !shopName || !tier) {
      return Response.json({ error: 'shopEmail, shopName, and tier are required' }, { status: 400 });
    }

    const reason = failureReason || 'Payment processing failed. Please try again or contact support.';
    const content = `
      <p style="margin:0 0 16px;">Hi <strong>${shopName}</strong> team,</p>
      <p style="margin:0 0 16px;">We attempted to renew your <strong>${tier}</strong> subscription but the payment failed.</p>
      <div style="background:#fef2f2;border-radius:10px;border:1px solid #fecaca;padding:14px 18px;margin:16px 0;color:#dc2626;font-size:13px;font-weight:600;">${reason}</div>
      <div style="background:#fef2f2;border-radius:10px;padding:16px;margin:16px 0;border-left:4px solid #dc2626;">
        <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#dc2626;">Next Steps:</p>
        <p style="margin:4px 0;font-size:13px;color:#374151;">1. Log in to your Shop Dashboard</p>
        <p style="margin:4px 0;font-size:13px;color:#374151;">2. Go to Billing → Subscription</p>
        <p style="margin:4px 0;font-size:13px;color:#374151;">3. Retry payment or update payment method</p>
      </div>
    `;
    const htmlBody = emailTemplate('Payment Failed', 'Subscription', '#dc2626', content, { text: 'Retry Payment', url: 'https://bwanguspares.com' });
    await sendEmail(shopEmail, '❌ Subscription Renewal Failed – Action Required', htmlBody);

    return Response.json({ success: true, message: 'Subscription failure notification sent' });
  } catch (error) {
    console.error('subscriptionPaymentFailure error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});