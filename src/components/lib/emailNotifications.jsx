import { base44 } from "@/api/base44Client";

/**
 * Central email notification helper for BwanguSpares.
 * Failures are silently swallowed so they never block the main flow.
 */

const BRAND = {
  primary: "#1a3fa8",       // Deep BwanguSpares blue
  accent: "#0891b2",        // Cyan accent
  gradient: "linear-gradient(135deg, #1a3fa8 0%, #0891b2 100%)",
  logo: "https://media.base44.com/images/public/699f775333a30acfe3b73c4e/097f0a26f_DynamicBlueSwooshwithCohesiveTypography9.jpg",
  appUrl: "https://bwanguspares.com",
};

const send = async ({ to, subject, htmlBody, body }) => {
  try {
    await base44.integrations.Core.SendEmail({
      from_name: "BwanguSpares",
      to,
      subject,
      body: htmlBody || body,
    });
  } catch (e) {
    console.warn("Email notification failed:", e?.message);
  }
};

// ─── Master branded template ─────────────────────────────────────────────────
const template = ({ title, badgeText, badgeColor = BRAND.primary, content, cta }) => `
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

        <!-- Header / Navbar -->
        <tr>
          <td style="background:${BRAND.gradient};padding:24px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <img src="${BRAND.logo}" alt="BwanguSpares" width="40" height="40" style="border-radius:10px;vertical-align:middle;display:inline-block;margin-right:10px;" />
                  <span style="color:#fff;font-size:20px;font-weight:700;vertical-align:middle;letter-spacing:-0.3px;">Bwangu<span style="color:#7dd3fc;">Spares</span></span>
                </td>
                <td align="right" style="color:rgba(255,255,255,0.75);font-size:12px;">Zambia's Auto Spares Marketplace</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Badge / Title bar -->
        <tr>
          <td style="background:${badgeColor}18;border-bottom:3px solid ${badgeColor};padding:20px 32px 16px;">
            <span style="display:inline-block;background:${badgeColor};color:#fff;font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;padding:4px 12px;border-radius:20px;">${badgeText}</span>
            <h1 style="margin:10px 0 0;font-size:22px;font-weight:700;color:#0f172a;line-height:1.3;">${title}</h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:28px 32px;color:#374151;font-size:14px;line-height:1.7;">
            ${content}
          </td>
        </tr>

        <!-- CTA -->
        ${cta ? `
        <tr>
          <td align="center" style="padding:0 32px 28px;">
            <a href="${cta.url || BRAND.appUrl}" style="display:inline-block;background:${BRAND.gradient};color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:13px 32px;border-radius:10px;letter-spacing:0.3px;">${cta.text}</a>
          </td>
        </tr>` : ''}

        <!-- Divider -->
        <tr><td style="height:1px;background:#e2e8f0;"></td></tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:20px 32px;text-align:center;">
            <p style="margin:0 0 4px;font-size:12px;color:#64748b;font-weight:600;">BwanguSpares — Zambia's Auto Spares Marketplace</p>
            <p style="margin:0 0 4px;font-size:11px;color:#94a3b8;">Flat 15C Kalewa Complex, Ndola · <a href="mailto:admin@bwangu.com" style="color:#0891b2;text-decoration:none;">admin@bwangu.com</a> · +260 763 109 823</p>
            <p style="margin:0;font-size:11px;color:#cbd5e1;">© 2026 BwanguSpares. All rights reserved.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
`;

// ─── Info box helpers ─────────────────────────────────────────────────────────
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

// ─── Orders ──────────────────────────────────────────────────────────────────

export const emailOrderConfirmation = (buyerEmail, buyerName, order) => {
  const itemsList = (order.items || []).map(i =>
    `<tr>
      <td style="padding:8px 12px;font-size:13px;color:#374151;">${i.product_name}</td>
      <td style="padding:8px 12px;font-size:13px;text-align:center;color:#374151;">×${i.quantity}</td>
      <td style="padding:8px 12px;font-size:13px;text-align:right;font-weight:600;color:#0f172a;">K${(i.price || 0).toLocaleString()}</td>
    </tr>`).join('');

  const content = `
    <p style="margin:0 0 16px;">Hi <strong>${buyerName || "there"}</strong>,</p>
    <p style="margin:0 0 16px;">Your order has been placed and is being prepared by the shop. 🎉</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:10px;overflow:hidden;border:1px solid #e2e8f0;margin:18px 0;">
      <tr style="background:#1a3fa8;color:#fff;">
        <th style="padding:10px 12px;text-align:left;font-size:12px;font-weight:600;letter-spacing:0.5px;">ITEM</th>
        <th style="padding:10px 12px;text-align:center;font-size:12px;font-weight:600;letter-spacing:0.5px;">QTY</th>
        <th style="padding:10px 12px;text-align:right;font-size:12px;font-weight:600;letter-spacing:0.5px;">PRICE</th>
      </tr>
      ${itemsList}
      <tr style="background:#f0f4f8;border-top:2px solid #e2e8f0;">
        <td colspan="2" style="padding:12px;font-size:14px;font-weight:700;color:#0f172a;">Total</td>
        <td style="padding:12px;font-size:16px;font-weight:800;text-align:right;color:#1a3fa8;">K${(order.total_amount || 0).toLocaleString()}</td>
      </tr>
    </table>
    ${infoBox([
      ["Shop", order.shop_name || "—"],
      ["Delivery", order.delivery_address || "Collect in-store"],
      ["Payment", order.payment_method || "—"],
    ])}
    <p style="margin:12px 0 0;font-size:13px;color:#64748b;">You'll receive updates as your order progresses. Track it anytime from your Buyer Dashboard.</p>
  `;
  return send({
    to: buyerEmail,
    subject: `✓ Order Confirmed – BwanguSpares`,
    htmlBody: template({ title: "Order Confirmed!", badgeText: "New Order", badgeColor: "#059669", content, cta: { text: "View My Orders", url: BRAND.appUrl } }),
  });
};

export const emailOrderStatusUpdate = (buyerEmail, buyerName, order, newStatus) => {
  const statusConfig = {
    confirmed:  { color: "#0891b2", msg: "Your order has been confirmed by the shop and is being prepared.", badge: "Confirmed" },
    processing: { color: "#7c3aed", msg: "Your order is being packed and will ship very soon.", badge: "Processing" },
    shipped:    { color: "#0891b2", msg: `Your order is on its way!${order.tracking_number ? ` Tracking: <strong>${order.tracking_number}</strong>` : ""}`, badge: "Shipped" },
    delivered:  { color: "#059669", msg: "Your order has been delivered successfully. We hope you enjoy your parts! ⭐", badge: "Delivered" },
    cancelled:  { color: "#dc2626", msg: `Your order was cancelled.${order.cancellation_reason ? ` Reason: ${order.cancellation_reason}` : ""}`, badge: "Cancelled" },
  };
  const cfg = statusConfig[newStatus] || { color: BRAND.primary, msg: `Status updated to ${newStatus}.`, badge: newStatus };

  const content = `
    <p style="margin:0 0 16px;">Hi <strong>${buyerName || "there"}</strong>,</p>
    ${alertBox(cfg.msg, cfg.color)}
    ${infoBox([
      ["Shop", order.shop_name || "—"],
      ["Total", `K${(order.total_amount || 0).toLocaleString()}`],
      ...(order.tracking_number ? [["Tracking #", order.tracking_number]] : []),
    ], cfg.color)}
    <p style="font-size:13px;color:#64748b;margin:12px 0 0;">Visit your Buyer Dashboard to view full order details.</p>
  `;
  return send({
    to: buyerEmail,
    subject: `📦 Order ${cfg.badge} – BwanguSpares`,
    htmlBody: template({ title: `Order ${cfg.badge}`, badgeText: cfg.badge, badgeColor: cfg.color, content, cta: { text: "Track My Order", url: BRAND.appUrl } }),
  });
};

export const emailNewOrderToShop = (shopOwnerEmail, shopName, order) => {
  const itemsList = (order.items || []).map(i =>
    `<tr>
      <td style="padding:8px 12px;font-size:13px;color:#374151;">${i.product_name}</td>
      <td style="padding:8px 12px;font-size:13px;text-align:center;color:#374151;">×${i.quantity}</td>
      <td style="padding:8px 12px;font-size:13px;text-align:right;font-weight:600;color:#0f172a;">K${(i.price || 0).toLocaleString()}</td>
    </tr>`).join('');

  const content = `
    <p style="margin:0 0 16px;">Hi <strong>${shopName}</strong> team,</p>
    <p style="margin:0 0 16px;">You have received a new order. Please confirm it as soon as possible.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:10px;overflow:hidden;border:1px solid #e2e8f0;margin:18px 0;">
      <tr style="background:#059669;color:#fff;">
        <th style="padding:10px 12px;text-align:left;font-size:12px;font-weight:600;">ITEM</th>
        <th style="padding:10px 12px;text-align:center;font-size:12px;font-weight:600;">QTY</th>
        <th style="padding:10px 12px;text-align:right;font-size:12px;font-weight:600;">PRICE</th>
      </tr>
      ${itemsList}
      <tr style="background:#f0fdf4;border-top:2px solid #e2e8f0;">
        <td colspan="2" style="padding:12px;font-size:14px;font-weight:700;color:#0f172a;">Order Total</td>
        <td style="padding:12px;font-size:16px;font-weight:800;text-align:right;color:#059669;">K${(order.total_amount || 0).toLocaleString()}</td>
      </tr>
    </table>
    ${infoBox([
      ["Customer", order.buyer_name || "—"],
      ["Phone", order.delivery_phone || "—"],
      ["Delivery", order.delivery_address || "Collect in-store"],
      ...(order.notes ? [["Notes", order.notes]] : []),
    ], "#059669")}
  `;
  return send({
    to: shopOwnerEmail,
    subject: `🎉 New Order – K${(order.total_amount || 0).toLocaleString()} – ${shopName}`,
    htmlBody: template({ title: "New Order Received!", badgeText: "New Order", badgeColor: "#059669", content, cta: { text: "Confirm Order Now", url: BRAND.appUrl } }),
  });
};

// ─── Wallet / Transaction Notifications ──────────────────────────────────────

export const emailWalletCredited = (buyerEmail, buyerName, amount, reason, newBalance) => {
  const content = `
    <p style="margin:0 0 16px;">Hi <strong>${buyerName || "there"}</strong>,</p>
    <p style="margin:0 0 16px;">Your BwanguSpares wallet has been credited.</p>
    <div style="background:${BRAND.gradient};border-radius:12px;padding:24px;text-align:center;margin:20px 0;">
      <p style="margin:0;color:rgba(255,255,255,0.8);font-size:13px;text-transform:uppercase;letter-spacing:1px;">Amount Credited</p>
      <p style="margin:8px 0;color:#fff;font-size:36px;font-weight:800;">+K${amount.toLocaleString()}</p>
      <p style="margin:0;color:rgba(255,255,255,0.7);font-size:13px;">${reason}</p>
    </div>
    ${infoBox([
      ["Transaction Type", "Wallet Credit"],
      ["Amount", `+K${amount.toLocaleString()}`],
      ["New Balance", `K${(newBalance || 0).toLocaleString()}`],
      ["Date", new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })],
    ])}
    <p style="font-size:13px;color:#64748b;margin:12px 0 0;">You can use your wallet balance on your next order at checkout.</p>
  `;
  return send({
    to: buyerEmail,
    subject: `💰 Wallet Credited – K${amount.toLocaleString()} – BwanguSpares`,
    htmlBody: template({ title: "Wallet Credited", badgeText: "Wallet", badgeColor: BRAND.primary, content, cta: { text: "Shop Now", url: BRAND.appUrl } }),
  });
};

export const emailWalletDebited = (buyerEmail, buyerName, amount, reason, newBalance) => {
  const content = `
    <p style="margin:0 0 16px;">Hi <strong>${buyerName || "there"}</strong>,</p>
    <p style="margin:0 0 16px;">A debit has been made from your BwanguSpares wallet.</p>
    <div style="background:#f8fafc;border-radius:12px;border:2px solid #e2e8f0;padding:24px;text-align:center;margin:20px 0;">
      <p style="margin:0;color:#64748b;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Amount Debited</p>
      <p style="margin:8px 0;color:#dc2626;font-size:36px;font-weight:800;">-K${amount.toLocaleString()}</p>
      <p style="margin:0;color:#64748b;font-size:13px;">${reason}</p>
    </div>
    ${infoBox([
      ["Transaction Type", "Wallet Debit"],
      ["Amount", `-K${amount.toLocaleString()}`],
      ["Remaining Balance", `K${(newBalance || 0).toLocaleString()}`],
      ["Date", new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })],
    ], "#dc2626")}
    <p style="font-size:13px;color:#64748b;margin:12px 0 0;">If you didn't authorise this transaction, please contact our support team immediately.</p>
  `;
  return send({
    to: buyerEmail,
    subject: `🔔 Wallet Debit – K${amount.toLocaleString()} – BwanguSpares`,
    htmlBody: template({ title: "Wallet Debited", badgeText: "Wallet", badgeColor: "#dc2626", content, cta: { text: "View Wallet", url: BRAND.appUrl } }),
  });
};

export const emailPayoutRequested = (shopOwnerEmail, shopName, amount) => {
  const content = `
    <p style="margin:0 0 16px;">Hi <strong>${shopName}</strong> team,</p>
    <p style="margin:0 0 16px;">Your payout request has been received and is now pending admin approval.</p>
    <div style="background:${BRAND.gradient};border-radius:12px;padding:24px;text-align:center;margin:20px 0;">
      <p style="margin:0;color:rgba(255,255,255,0.8);font-size:13px;text-transform:uppercase;letter-spacing:1px;">Payout Requested</p>
      <p style="margin:8px 0;color:#fff;font-size:36px;font-weight:800;">K${amount.toLocaleString()}</p>
    </div>
    ${infoBox([
      ["Status", "Pending Approval"],
      ["Amount", `K${amount.toLocaleString()}`],
      ["Date Requested", new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })],
    ])}
    <p style="font-size:13px;color:#64748b;margin:12px 0 0;">Payouts are typically processed within 1–3 business days. You'll receive another email once it's approved and sent.</p>
  `;
  return send({
    to: shopOwnerEmail,
    subject: `⏳ Payout Request Received – K${amount.toLocaleString()} – BwanguSpares`,
    htmlBody: template({ title: "Payout Requested", badgeText: "Payout", badgeColor: BRAND.primary, content, cta: { text: "View Shop Wallet", url: BRAND.appUrl } }),
  });
};

export const emailPayoutCompleted = (shopOwnerEmail, shopName, amount, method, reference) => {
  const content = `
    <p style="margin:0 0 16px;">Hi <strong>${shopName}</strong> team,</p>
    <p style="margin:0 0 16px;">Great news — your payout has been approved and processed! 🎉</p>
    <div style="background:linear-gradient(135deg,#059669 0%,#0891b2 100%);border-radius:12px;padding:24px;text-align:center;margin:20px 0;">
      <p style="margin:0;color:rgba(255,255,255,0.8);font-size:13px;text-transform:uppercase;letter-spacing:1px;">Amount Paid Out</p>
      <p style="margin:8px 0;color:#fff;font-size:36px;font-weight:800;">K${amount.toLocaleString()}</p>
      <p style="margin:0;color:rgba(255,255,255,0.7);font-size:13px;">via ${method || "bank transfer"}</p>
    </div>
    ${infoBox([
      ["Status", "Completed ✓"],
      ["Amount", `K${amount.toLocaleString()}`],
      ["Method", method || "Bank Transfer"],
      ...(reference ? [["Reference", reference]] : []),
      ["Date", new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })],
    ], "#059669")}
    <p style="font-size:13px;color:#64748b;margin:12px 0 0;">Funds should reflect in your account within 1 business day depending on your bank.</p>
  `;
  return send({
    to: shopOwnerEmail,
    subject: `✓ Payout Completed – K${amount.toLocaleString()} – BwanguSpares`,
    htmlBody: template({ title: "Payout Completed!", badgeText: "Payout", badgeColor: "#059669", content, cta: { text: "View Financials", url: BRAND.appUrl } }),
  });
};

export const emailPaymentReceived = (buyerEmail, buyerName, amount, method, orderId) => {
  const content = `
    <p style="margin:0 0 16px;">Hi <strong>${buyerName || "there"}</strong>,</p>
    <p style="margin:0 0 16px;">We've received your payment. Your order is now being processed.</p>
    <div style="background:${BRAND.gradient};border-radius:12px;padding:24px;text-align:center;margin:20px 0;">
      <p style="margin:0;color:rgba(255,255,255,0.8);font-size:13px;text-transform:uppercase;letter-spacing:1px;">Payment Received</p>
      <p style="margin:8px 0;color:#fff;font-size:36px;font-weight:800;">K${amount.toLocaleString()}</p>
      <p style="margin:0;color:rgba(255,255,255,0.7);font-size:13px;">via ${method || "online payment"}</p>
    </div>
    ${infoBox([
      ["Status", "Payment Confirmed ✓"],
      ["Amount", `K${amount.toLocaleString()}`],
      ["Method", method || "Online Payment"],
      ...(orderId ? [["Order Reference", orderId]] : []),
      ["Date", new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })],
    ])}
    <p style="font-size:13px;color:#64748b;margin:12px 0 0;">Keep this email as your payment receipt. Track your order from the Buyer Dashboard.</p>
  `;
  return send({
    to: buyerEmail,
    subject: `✓ Payment Confirmed – K${amount.toLocaleString()} – BwanguSpares`,
    htmlBody: template({ title: "Payment Confirmed!", badgeText: "Payment", badgeColor: "#059669", content, cta: { text: "Track My Order", url: BRAND.appUrl } }),
  });
};

// ─── Support Tickets ─────────────────────────────────────────────────────────

export const emailSupportTicketReceived = (userEmail, userName, ticket) => {
  const content = `
    <p style="margin:0 0 16px;">Hi <strong>${userName || "there"}</strong>,</p>
    <p style="margin:0 0 16px;">We've received your support request and our team will get back to you within 24 hours.</p>
    ${infoBox([
      ["Subject", ticket.subject],
      ["Category", ticket.category?.replace("_", " ") || "General"],
      ["Status", "Open"],
      ["Date", new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })],
    ])}
    <p style="font-size:13px;color:#64748b;margin:12px 0 0;">Keep an eye on your inbox — we'll follow up shortly.</p>
  `;
  return send({
    to: userEmail,
    subject: `🎫 Support Ticket Received – ${ticket.subject}`,
    htmlBody: template({ title: "We Got Your Message!", badgeText: "Support", badgeColor: BRAND.accent, content }),
  });
};

export const emailSupportTicketReply = (userEmail, userName, ticket, adminReply) => {
  const content = `
    <p style="margin:0 0 16px;">Hi <strong>${userName || "there"}</strong>,</p>
    <p style="margin:0 0 16px;">Our support team has replied to your ticket.</p>
    ${infoBox([["Ticket Subject", ticket.subject]], BRAND.accent)}
    <div style="background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;padding:16px 20px;margin:16px 0;">
      <p style="margin:0 0 8px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Support Reply</p>
      <p style="margin:0;font-size:14px;color:#0f172a;line-height:1.7;">${adminReply}</p>
    </div>
    <p style="font-size:13px;color:#64748b;margin:12px 0 0;">Log in to your dashboard to view the full conversation and reply.</p>
  `;
  return send({
    to: userEmail,
    subject: `💬 Support Reply – ${ticket.subject}`,
    htmlBody: template({ title: "Support Team Replied", badgeText: "Support", badgeColor: BRAND.accent, content, cta: { text: "View Ticket", url: BRAND.appUrl } }),
  });
};

export const emailNewTicketToAdmin = async (ticket) => {
  try {
    const admins = await base44.entities.User.filter({ role: "admin" });
    for (const admin of admins) {
      const content = `
        <p style="margin:0 0 16px;">A new support ticket has been submitted and requires your attention.</p>
        ${infoBox([
          ["From", `${ticket.user_name} (${ticket.user_email})`],
          ["Category", ticket.category?.replace("_", " ") || "General"],
          ["Subject", ticket.subject],
        ])}
        <div style="background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;padding:16px 20px;margin:16px 0;">
          <p style="margin:0 0 8px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Message</p>
          <p style="margin:0;font-size:14px;color:#0f172a;line-height:1.7;">${ticket.message}</p>
        </div>
      `;
      await send({
        to: admin.email,
        subject: `🎫 New Support Ticket: ${ticket.subject}`,
        htmlBody: template({ title: "New Support Ticket", badgeText: "Admin Alert", badgeColor: BRAND.primary, content, cta: { text: "Respond in Admin Panel", url: BRAND.appUrl } }),
      });
    }
  } catch (e) {
    console.warn("emailNewTicketToAdmin failed:", e?.message);
  }
};

// ─── Low Stock Alerts ─────────────────────────────────────────────────────────

export const emailLowStockAlert = (shopOwnerEmail, shopName, lowStockItems) => {
  const rows = lowStockItems.map(p =>
    `<tr>
      <td style="padding:8px 12px;font-size:13px;color:#374151;">${p.name}</td>
      <td style="padding:8px 12px;font-size:13px;text-align:center;font-weight:700;color:${p.stock_quantity === 0 ? '#dc2626' : '#d97706'};">${p.stock_quantity}</td>
      <td style="padding:8px 12px;font-size:13px;text-align:right;color:#64748b;">${p.low_stock_threshold ?? 5}</td>
    </tr>`).join('');

  const content = `
    <p style="margin:0 0 16px;">Hi <strong>${shopName}</strong> team,</p>
    <p style="margin:0 0 16px;">The following products are running low or out of stock. Restock them promptly to avoid missed sales.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:10px;overflow:hidden;border:1px solid #e2e8f0;margin:18px 0;">
      <tr style="background:#d97706;color:#fff;">
        <th style="padding:10px 12px;text-align:left;font-size:12px;font-weight:600;">PRODUCT</th>
        <th style="padding:10px 12px;text-align:center;font-size:12px;font-weight:600;">STOCK</th>
        <th style="padding:10px 12px;text-align:right;font-size:12px;font-weight:600;">THRESHOLD</th>
      </tr>
      ${rows}
    </table>
    <p style="font-size:13px;color:#64748b;margin:12px 0 0;">Update your stock levels in the Inventory section of your Shop Dashboard.</p>
  `;
  return send({
    to: shopOwnerEmail,
    subject: `⚠️ Low Stock Alert – ${lowStockItems.length} item${lowStockItems.length > 1 ? 's' : ''} need restocking`,
    htmlBody: template({ title: "Low Stock Alert", badgeText: "Inventory", badgeColor: "#d97706", content, cta: { text: "Update Inventory", url: BRAND.appUrl } }),
  });
};

// ─── Parts Requests ──────────────────────────────────────────────────────────

export const emailPartsRequestReceived = (buyerEmail, buyerName, partName) => {
  const content = `
    <p style="margin:0 0 16px;">Hi <strong>${buyerName || "there"}</strong>,</p>
    <p style="margin:0 0 16px;">Your parts request is live! Verified shops across Zambia are reviewing it now.</p>
    ${infoBox([["Part Requested", partName], ["Status", "Open – Awaiting Shop Offers"]])}
    <p style="font-size:13px;color:#64748b;margin:12px 0 0;">Make sure your phone number is up to date so shops can reach you directly with offers.</p>
  `;
  return send({
    to: buyerEmail,
    subject: `🔧 Parts Request Posted – ${partName}`,
    htmlBody: template({ title: "Parts Request Live!", badgeText: "Parts Request", badgeColor: "#d97706", content, cta: { text: "View My Request", url: BRAND.appUrl } }),
  });
};

export const emailNewPartsRequestToShops = async (partName, category, budget, buyerRegion) => {
  try {
    const shops = await base44.entities.Shop.filter({ status: "approved" });
    for (const shop of shops) {
      if (!shop.owner_email) continue;
      const content = `
        <p style="margin:0 0 16px;">Hi <strong>${shop.name}</strong> team,</p>
        <p style="margin:0 0 16px;">A buyer has submitted a new parts request that may match your inventory.</p>
        ${infoBox([
          ["Part", partName],
          ["Category", category || "Not specified"],
          ["Budget", budget ? `K${Number(budget).toLocaleString()}` : "Open"],
          ["Buyer Region", buyerRegion || "Not specified"],
        ])}
        <p style="font-size:13px;color:#64748b;margin:12px 0 0;">Log in to your Shop Dashboard → Parts Requests to respond and win this customer.</p>
      `;
      await send({
        to: shop.owner_email,
        subject: `🔧 New Parts Request – "${partName}"`,
        htmlBody: template({ title: "New Parts Request", badgeText: "Parts Request", badgeColor: "#d97706", content, cta: { text: "Respond Now", url: BRAND.appUrl } }),
      });
    }
  } catch (e) {
    console.warn("emailNewPartsRequestToShops failed:", e?.message);
  }
};

export const emailPartsRequestCounterOffer = (buyerEmail, buyerName, partName, shopName, counterBudget, message) => {
  const content = `
    <p style="margin:0 0 16px;">Hi <strong>${buyerName || "there"}</strong>,</p>
    <p style="margin:0 0 16px;"><strong>${shopName}</strong> has made a counter offer on your parts request.</p>
    ${infoBox([
      ["Part", partName],
      ["Shop", shopName],
      ["Counter Offer", `K${counterBudget?.toLocaleString() || "N/A"}`],
      ...(message ? [["Message", message]] : []),
    ], "#d97706")}
    <p style="font-size:13px;color:#64748b;margin:12px 0 0;">Log in to your Buyer Dashboard to accept or decline this offer.</p>
  `;
  return send({
    to: buyerEmail,
    subject: `💬 Counter Offer on "${partName}" – BwanguSpares`,
    htmlBody: template({ title: "Counter Offer Received", badgeText: "Parts Request", badgeColor: "#d97706", content, cta: { text: "View Offer", url: BRAND.appUrl } }),
  });
};

// ─── Shop Registration ────────────────────────────────────────────────────────

export const emailShopStatusUpdate = (ownerEmail, ownerName, shopName, status) => {
  const cfg = {
    approved: { color: "#059669", msg: "Congratulations! Your shop has been approved and is now live on BwanguSpares. Start listing products and reach customers today!", badge: "Approved" },
    rejected: { color: "#dc2626", msg: "Thank you for your interest. Your shop registration was not approved at this time. Please contact our support team for feedback.", badge: "Not Approved" },
    suspended: { color: "#f59e0b", msg: "Your shop has been temporarily suspended due to a policy violation. Please contact support to discuss next steps.", badge: "Suspended" },
  }[status] || { color: BRAND.primary, msg: `Your shop status has been updated to ${status}.`, badge: status };

  const content = `
    <p style="margin:0 0 16px;">Hi <strong>${ownerName || "there"}</strong>,</p>
    ${alertBox(cfg.msg, cfg.color)}
    ${infoBox([["Shop Name", shopName], ["Status", cfg.badge]], cfg.color)}
    <p style="font-size:13px;color:#64748b;margin:12px 0 0;">${status === "approved" ? "Next steps: Set up your products, configure shipping, and start receiving orders!" : "Contact our support team at admin@bwangu.com if you have any questions."}</p>
  `;
  return send({
    to: ownerEmail,
    subject: `${status === "approved" ? "🎉" : status === "rejected" ? "❌" : "⚠️"} Shop ${cfg.badge} – ${shopName}`,
    htmlBody: template({ title: `Shop ${cfg.badge}`, badgeText: "Shop Registration", badgeColor: cfg.color, content, cta: status === "approved" ? { text: "Go to Shop Dashboard", url: BRAND.appUrl } : null }),
  });
};

export const emailShopRegistrationReceived = (ownerEmail, ownerName, shopName) => {
  const content = `
    <p style="margin:0 0 16px;">Hi <strong>${ownerName || "there"}</strong>,</p>
    <p style="margin:0 0 16px;">Thank you for registering <strong>${shopName}</strong> on BwanguSpares! Our admin team will review your application shortly.</p>
    ${infoBox([
      ["Shop Name", shopName],
      ["Status", "Under Review"],
      ["Expected Decision", "Within 24–48 hours"],
    ])}
    <p style="font-size:13px;color:#64748b;margin:12px 0 0;">We'll send you an email as soon as a decision has been made. Make sure to check your inbox (and spam folder).</p>
  `;
  return send({
    to: ownerEmail,
    subject: `🏪 Shop Registration Received – ${shopName}`,
    htmlBody: template({ title: "Application Received!", badgeText: "Shop Registration", badgeColor: BRAND.primary, content }),
  });
};

// ─── Reviews ──────────────────────────────────────────────────────────────────

export const emailNewReviewToShop = (shopOwnerEmail, shopName, reviewerName, rating, comment) => {
  const stars = Array.from({ length: 5 }, (_, i) =>
    `<span style="font-size:20px;color:${i < rating ? '#f59e0b' : '#d1d5db'};">★</span>`).join('');

  const content = `
    <p style="margin:0 0 16px;">Hi <strong>${shopName}</strong> team,</p>
    <p style="margin:0 0 16px;">A customer has left you a new review!</p>
    <div style="background:#fffbeb;border-radius:12px;border:1px solid #fde68a;padding:20px;margin:20px 0;">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
        <div style="width:42px;height:42px;background:${BRAND.gradient};border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:18px;font-weight:700;flex-shrink:0;">${reviewerName?.charAt(0)?.toUpperCase() || "?"}</div>
        <div>
          <p style="margin:0;font-weight:600;color:#0f172a;">${reviewerName}</p>
          <div style="margin-top:2px;">${stars}</div>
        </div>
        <div style="margin-left:auto;background:#f59e0b;color:#fff;font-size:18px;font-weight:800;padding:6px 12px;border-radius:8px;">${rating}/5</div>
      </div>
      ${comment ? `<p style="margin:0;color:#374151;font-size:14px;line-height:1.6;padding-top:12px;border-top:1px solid #fde68a;">"${comment}"</p>` : ''}
    </div>
    <p style="font-size:13px;color:#64748b;margin:12px 0 0;">Great reviews help attract more customers. Keep up the excellent service!</p>
  `;
  return send({
    to: shopOwnerEmail,
    subject: `⭐ New Review – ${rating}/5 Stars – ${shopName}`,
    htmlBody: template({ title: "New Customer Review!", badgeText: "Review", badgeColor: "#f59e0b", content, cta: { text: "View Reviews", url: BRAND.appUrl } }),
  });
};

// ─── Returns & Refunds ────────────────────────────────────────────────────────

export const emailReturnInitiated = (buyerEmail, buyerName, returnRequest) => {
  const content = `
    <p style="margin:0 0 16px;">Hi <strong>${buyerName || "there"}</strong>,</p>
    <p style="margin:0 0 16px;">Your return request has been submitted and the shop has been notified.</p>
    ${infoBox([
      ["Product", returnRequest.product_name],
      ["Quantity", returnRequest.quantity],
      ["Refund Amount", `K${(returnRequest.refund_amount || 0).toLocaleString()}`],
      ["Reason", returnRequest.reason?.replace("_", " ")],
      ["Status", "Pending Shop Review"],
    ], "#d97706")}
    <p style="font-size:13px;color:#64748b;margin:12px 0 0;">The shop will review your return within 24–48 hours. We'll notify you once they respond.</p>
  `;
  return send({
    to: buyerEmail,
    subject: `📦 Return Submitted – K${(returnRequest.refund_amount || 0).toLocaleString()} – BwanguSpares`,
    htmlBody: template({ title: "Return Request Submitted", badgeText: "Return", badgeColor: "#d97706", content, cta: { text: "Track Return", url: BRAND.appUrl } }),
  });
};

export const emailReturnApproved = (buyerEmail, buyerName, returnRequest) => {
  const content = `
    <p style="margin:0 0 16px;">Hi <strong>${buyerName || "there"}</strong>,</p>
    <p style="margin:0 0 16px;">Great news — your return request has been approved!</p>
    ${infoBox([
      ["Product", returnRequest.product_name],
      ["Refund Amount", `K${(returnRequest.refund_amount || 0).toLocaleString()}`],
      ["Status", "Approved ✓"],
      ...(returnRequest.approval_notes ? [["Shop Notes", returnRequest.approval_notes]] : []),
    ], "#059669")}
    <div style="background:#f0fdf4;border-radius:10px;padding:16px;margin:16px 0;">
      <p style="margin:0 0 8px;font-weight:700;color:#059669;font-size:13px;">Next Steps:</p>
      <p style="margin:4px 0;font-size:13px;color:#374151;">1. Pack the item securely (with original packaging if possible)</p>
      <p style="margin:4px 0;font-size:13px;color:#374151;">2. Ship it to the shop's address</p>
      <p style="margin:4px 0;font-size:13px;color:#374151;">3. Your refund will be processed once the shop receives it</p>
    </div>
  `;
  return send({
    to: buyerEmail,
    subject: `✓ Return Approved – K${(returnRequest.refund_amount || 0).toLocaleString()} – BwanguSpares`,
    htmlBody: template({ title: "Return Approved!", badgeText: "Return", badgeColor: "#059669", content, cta: { text: "View Details", url: BRAND.appUrl } }),
  });
};

export const emailRefundReleased = (buyerEmail, buyerName, returnRequest) => {
  const content = `
    <p style="margin:0 0 16px;">Hi <strong>${buyerName || "there"}</strong>,</p>
    <p style="margin:0 0 16px;">Your refund has been processed and credited to your BwanguSpares wallet!</p>
    <div style="background:${BRAND.gradient};border-radius:12px;padding:24px;text-align:center;margin:20px 0;">
      <p style="margin:0;color:rgba(255,255,255,0.8);font-size:13px;text-transform:uppercase;letter-spacing:1px;">Refund Amount</p>
      <p style="margin:8px 0;color:#fff;font-size:36px;font-weight:800;">K${(returnRequest.refund_amount || 0).toLocaleString()}</p>
      <p style="margin:0;color:rgba(255,255,255,0.7);font-size:13px;">Credited to your wallet</p>
    </div>
    ${infoBox([
      ["Product", returnRequest.product_name],
      ["Refund", `K${(returnRequest.refund_amount || 0).toLocaleString()}`],
      ["Credited To", "BwanguSpares Wallet"],
    ], "#059669")}
    <p style="font-size:13px;color:#64748b;margin:12px 0 0;">You can use your wallet balance on your next purchase at checkout.</p>
  `;
  return send({
    to: buyerEmail,
    subject: `💰 Refund Processed – K${(returnRequest.refund_amount || 0).toLocaleString()} – BwanguSpares`,
    htmlBody: template({ title: "Refund Released!", badgeText: "Refund", badgeColor: "#059669", content, cta: { text: "Shop Again", url: BRAND.appUrl } }),
  });
};

export const emailReturnRejected = (buyerEmail, buyerName, returnRequest) => {
  const content = `
    <p style="margin:0 0 16px;">Hi <strong>${buyerName || "there"}</strong>,</p>
    <p style="margin:0 0 16px;">Unfortunately, your return request has been declined by the shop.</p>
    ${infoBox([
      ["Product", returnRequest.product_name],
      ["Status", "Declined"],
      ["Reason", returnRequest.approval_notes || "See shop feedback"],
    ], "#dc2626")}
    <p style="font-size:13px;color:#64748b;margin:12px 0 0;">If you believe this is incorrect, please contact the shop directly or submit a support ticket for further assistance.</p>
  `;
  return send({
    to: buyerEmail,
    subject: `❌ Return Request Declined – BwanguSpares`,
    htmlBody: template({ title: "Return Declined", badgeText: "Return", badgeColor: "#dc2626", content, cta: { text: "Contact Support", url: BRAND.appUrl } }),
  });
};

export const emailReturnToShop = (shopOwnerEmail, shopName, returnRequest) => {
  const content = `
    <p style="margin:0 0 16px;">Hi <strong>${shopName}</strong> team,</p>
    <p style="margin:0 0 16px;">A customer has submitted a return request. Please review and respond promptly.</p>
    ${infoBox([
      ["Customer", returnRequest.buyer_name],
      ["Product", returnRequest.product_name],
      ["Reason", returnRequest.reason?.replace("_", " ")],
      ["Refund Requested", `K${(returnRequest.refund_amount || 0).toLocaleString()}`],
      ...(returnRequest.description ? [["Note", returnRequest.description]] : []),
    ], "#d97706")}
    <p style="font-size:13px;color:#64748b;margin:12px 0 0;">Log in to your Shop Dashboard to approve or decline this return request.</p>
  `;
  return send({
    to: shopOwnerEmail,
    subject: `📦 Return Request – ${returnRequest.product_name}`,
    htmlBody: template({ title: "New Return Request", badgeText: "Return", badgeColor: "#d97706", content, cta: { text: "Review Return", url: BRAND.appUrl } }),
  });
};

// ─── Watchlist ────────────────────────────────────────────────────────────────

export const emailPriceDropNotification = (buyerEmail, buyerName, watchlist) => {
  const savings = (watchlist.last_notified_price || 0) - (watchlist.current_price || 0);
  const pct = watchlist.last_notified_price ? ((savings / watchlist.last_notified_price) * 100).toFixed(1) : "0";
  const content = `
    <p style="margin:0 0 16px;">Hi <strong>${buyerName || "there"}</strong>,</p>
    <p style="margin:0 0 16px;">A part on your watchlist just dropped in price!</p>
    <div style="background:#f0fdf4;border-radius:12px;border:2px solid #059669;padding:20px;text-align:center;margin:20px 0;">
      <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#0f172a;">${watchlist.product_name}</p>
      <p style="margin:0;color:#64748b;font-size:13px;"><s>K${(watchlist.last_notified_price || 0).toLocaleString()}</s></p>
      <p style="margin:6px 0;color:#059669;font-size:30px;font-weight:800;">K${(watchlist.current_price || 0).toLocaleString()}</p>
      <span style="background:#059669;color:#fff;font-size:12px;font-weight:700;padding:4px 12px;border-radius:20px;">Save K${savings.toFixed(2)} (${pct}% off)</span>
    </div>
    ${infoBox([["Shop", watchlist.shop_name]], "#059669")}
  `;
  return send({
    to: buyerEmail,
    subject: `💰 Price Drop! ${watchlist.product_name} – K${watchlist.current_price?.toLocaleString()}`,
    htmlBody: template({ title: "Price Drop Alert!", badgeText: "Watchlist", badgeColor: "#059669", content, cta: { text: "Buy Now", url: BRAND.appUrl } }),
  });
};

export const emailBackInStockNotification = (buyerEmail, buyerName, watchlist) => {
  const content = `
    <p style="margin:0 0 16px;">Hi <strong>${buyerName || "there"}</strong>,</p>
    <p style="margin:0 0 16px;">Good news! A part you're watching is back in stock.</p>
    <div style="background:${BRAND.gradient};border-radius:12px;padding:24px;text-align:center;margin:20px 0;">
      <p style="margin:0;color:rgba(255,255,255,0.8);font-size:13px;text-transform:uppercase;letter-spacing:1px;">Back in Stock</p>
      <p style="margin:10px 0;color:#fff;font-size:18px;font-weight:700;">${watchlist.product_name}</p>
      <p style="margin:0;color:#7dd3fc;font-size:24px;font-weight:800;">K${(watchlist.current_price || 0).toLocaleString()}</p>
    </div>
    ${infoBox([["Shop", watchlist.shop_name]], BRAND.primary)}
    <p style="font-size:13px;color:#64748b;margin:12px 0 0;">Don't miss out — add it to your cart before it sells out again!</p>
  `;
  return send({
    to: buyerEmail,
    subject: `✓ ${watchlist.product_name} Back in Stock – BwanguSpares`,
    htmlBody: template({ title: "Back in Stock!", badgeText: "Watchlist", badgeColor: BRAND.primary, content, cta: { text: "Add to Cart", url: BRAND.appUrl } }),
  });
};

// ─── Technician Hire Requests ─────────────────────────────────────────────────

export const emailHireRequestToShop = (shopOwnerEmail, shopName, buyerName, problemType, description) => {
  const content = `
    <p style="margin:0 0 16px;">Hi <strong>${shopName}</strong> team,</p>
    <p style="margin:0 0 16px;">A customer is requesting a technician from your shop.</p>
    ${infoBox([
      ["Customer", buyerName],
      ["Problem Type", problemType?.replace("_", " ")],
      ...(description ? [["Description", description]] : []),
    ])}
    <p style="font-size:13px;color:#64748b;margin:12px 0 0;">Log in to your Shop Dashboard to respond to this hire request.</p>
  `;
  return send({
    to: shopOwnerEmail,
    subject: `🔧 New Technician Hire Request – ${shopName}`,
    htmlBody: template({ title: "Technician Hire Request", badgeText: "Hire Request", badgeColor: BRAND.primary, content, cta: { text: "Respond Now", url: BRAND.appUrl } }),
  });
};

export const emailHireRequestResponseToBuyer = (buyerEmail, buyerName, shopName, status, counterBudget, message) => {
  const isCounter = status === "counter_offered";
  const content = `
    <p style="margin:0 0 16px;">Hi <strong>${buyerName || "there"}</strong>,</p>
    <p style="margin:0 0 16px;"><strong>${shopName}</strong> has ${isCounter ? "made a counter offer on" : "responded to"} your technician hire request.</p>
    ${infoBox([
      ["Shop", shopName],
      ["Response", isCounter ? "Counter Offer" : "Response Sent"],
      ...(isCounter && counterBudget ? [["Counter Budget", `K${counterBudget.toLocaleString()}`]] : []),
      ...(message ? [["Message", message]] : []),
    ], isCounter ? "#d97706" : BRAND.primary)}
    <p style="font-size:13px;color:#64748b;margin:12px 0 0;">Log in to your Buyer Dashboard to accept, decline, or reply.</p>
  `;
  return send({
    to: buyerEmail,
    subject: `${isCounter ? "💬 Counter Offer" : "✓ Response"} on Your Technician Request – ${shopName}`,
    htmlBody: template({ title: isCounter ? "Counter Offer Received" : "Hire Request Update", badgeText: "Technician", badgeColor: isCounter ? "#d97706" : BRAND.primary, content, cta: { text: "View Request", url: BRAND.appUrl } }),
  });
};

// ─── Shipping & Courier ───────────────────────────────────────────────────────

export const emailCourierAssigned = (buyerEmail, buyerName, shipment, courier) => {
  const content = `
    <p style="margin:0 0 16px;">Hi <strong>${buyerName || "there"}</strong>,</p>
    <p style="margin:0 0 16px;">A courier has been assigned to your shipment and will be picking it up soon.</p>
    ${infoBox([
      ["Courier Name", courier.full_name],
      ["Courier Phone", courier.phone],
      ["Vehicle", courier.vehicle_type],
      ["Tracking #", shipment.tracking_number],
      ["Est. Delivery", new Date(shipment.estimated_delivery_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })],
    ])}
    <p style="font-size:13px;color:#64748b;margin:12px 0 0;">Track your shipment in real-time from your Buyer Dashboard.</p>
  `;
  return send({
    to: buyerEmail,
    subject: `🚚 Courier Assigned – Track ${shipment.tracking_number}`,
    htmlBody: template({ title: "Courier Assigned!", badgeText: "Shipping", badgeColor: BRAND.accent, content, cta: { text: "Track Shipment", url: BRAND.appUrl } }),
  });
};

export const emailShipmentPickedUp = (buyerEmail, buyerName, shipment, courier) => {
  const content = `
    <p style="margin:0 0 16px;">Hi <strong>${buyerName || "there"}</strong>,</p>
    <p style="margin:0 0 16px;">Your package has been picked up and is now in transit!</p>
    ${infoBox([
      ["Courier", courier.full_name],
      ["Courier Phone", courier.phone],
      ["Tracking #", shipment.tracking_number],
      ["Status", "In Transit"],
    ], "#059669")}
    <p style="font-size:13px;color:#64748b;margin:12px 0 0;">Track your shipment in real-time from your Buyer Dashboard.</p>
  `;
  return send({
    to: buyerEmail,
    subject: `📦 Package Picked Up – In Transit – ${shipment.tracking_number}`,
    htmlBody: template({ title: "Package In Transit!", badgeText: "Shipping", badgeColor: "#059669", content, cta: { text: "Track Package", url: BRAND.appUrl } }),
  });
};

export const emailShipmentDelivered = (buyerEmail, buyerName, shipment) => {
  const content = `
    <p style="margin:0 0 16px;">Hi <strong>${buyerName || "there"}</strong>,</p>
    <p style="margin:0 0 16px;">Your package has been successfully delivered! 🎉</p>
    <div style="background:linear-gradient(135deg,#059669 0%,#0891b2 100%);border-radius:12px;padding:28px;text-align:center;margin:20px 0;">
      <div style="font-size:48px;margin-bottom:8px;">✓</div>
      <p style="margin:0;color:#fff;font-size:18px;font-weight:700;">Delivered Successfully</p>
      <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">Tracking: ${shipment.tracking_number}</p>
    </div>
    ${shipment.delivery_address ? infoBox([["Delivered To", shipment.delivery_address]], "#059669") : ""}
    <p style="font-size:13px;color:#64748b;margin:12px 0 0;">We hope you're satisfied with your purchase. Please consider leaving a review!</p>
  `;
  return send({
    to: buyerEmail,
    subject: `🎉 Package Delivered – ${shipment.tracking_number}`,
    htmlBody: template({ title: "Package Delivered!", badgeText: "Delivered", badgeColor: "#059669", content, cta: { text: "Leave a Review", url: BRAND.appUrl } }),
  });
};

export const emailCourierHandoff = (buyerEmail, buyerName, shipment, fromCourier, toCourier, handoffLocation) => {
  const content = `
    <p style="margin:0 0 16px;">Hi <strong>${buyerName || "there"}</strong>,</p>
    <p style="margin:0 0 16px;">Your package has arrived at <strong>${handoffLocation}</strong> and has been transferred to a local courier for final delivery.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0;">
      <tr>
        <td width="45%" style="background:#f8fafc;border-radius:10px;padding:14px;border:1px solid #e2e8f0;">
          <p style="margin:0 0 4px;font-size:11px;color:#64748b;text-transform:uppercase;font-weight:600;">Intercity Courier</p>
          <p style="margin:0;font-weight:700;color:#0f172a;">${fromCourier.full_name}</p>
          <p style="margin:2px 0 0;font-size:13px;color:#64748b;">${fromCourier.phone}</p>
        </td>
        <td width="10%" align="center" style="font-size:20px;color:#94a3b8;">→</td>
        <td width="45%" style="background:${BRAND.primary}10;border-radius:10px;padding:14px;border:1px solid ${BRAND.primary}30;">
          <p style="margin:0 0 4px;font-size:11px;color:${BRAND.primary};text-transform:uppercase;font-weight:600;">Local Courier (Final)</p>
          <p style="margin:0;font-weight:700;color:#0f172a;">${toCourier.full_name}</p>
          <p style="margin:2px 0 0;font-size:13px;color:#64748b;">${toCourier.phone}</p>
        </td>
      </tr>
    </table>
    ${infoBox([["Tracking #", shipment.tracking_number], ["Status", "Handoff Complete"]], "#d97706")}
    <p style="font-size:13px;color:#64748b;margin:12px 0 0;">Your local courier will deliver the package within the next 1–2 days.</p>
  `;
  return send({
    to: buyerEmail,
    subject: `📍 Courier Handoff – ${shipment.tracking_number}`,
    htmlBody: template({ title: "Courier Handoff Complete", badgeText: "Shipping", badgeColor: "#d97706", content, cta: { text: "Track Package", url: BRAND.appUrl } }),
  });
};