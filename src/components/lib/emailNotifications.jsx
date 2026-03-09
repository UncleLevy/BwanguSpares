import { base44 } from "@/api/base44Client";

/**
 * Central email notification helper for BwanguSpares.
 * Failures are silently swallowed so they never block the main flow.
 */

const send = async ({ to, subject, body, htmlBody }) => {
  try {
    // If HTML body provided, use it; otherwise fall back to text
    if (htmlBody) {
      await base44.integrations.Core.SendEmail({ from_name: "BwanguSpares", to, subject, body: htmlBody });
    } else {
      await base44.integrations.Core.SendEmail({ from_name: "BwanguSpares", to, subject, body });
    }
  } catch (e) {
    console.warn("Email notification failed:", e?.message);
  }
};

// Email template builder with modern, minimalistic design
const createEmailTemplate = (title, emoji, color, content, cta) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
</head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, ${color}20, ${color}05); padding: 30px 20px; text-align: center; border-bottom: 1px solid ${color}30;">
      <div style="display: inline-block; width: 60px; height: 60px; background: ${color}; border-radius: 12px; font-size: 32px; line-height: 60px; text-align: center; margin-bottom: 12px;">
        ${emoji}
      </div>
      <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #1a1a1a;">${title}</h1>
    </div>
    
    <!-- Content -->
    <div style="padding: 30px 20px; color: #555; line-height: 1.6;">
      ${content}
    </div>
    
    <!-- CTA Button -->
    ${cta ? `
    <div style="padding: 0 20px; text-align: center;">
      <a href="${cta.url}" style="display: inline-block; padding: 12px 28px; background: ${color}; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; margin-bottom: 20px;">
        ${cta.text}
      </a>
    </div>
    ` : ''}
    
    <!-- Footer -->
    <div style="background: #f9f9f9; padding: 20px; text-align: center; border-top: 1px solid #e5e5e5; font-size: 12px; color: #888;">
      <p style="margin: 0;">BwanguSpares — Zambia's Auto Spares Marketplace</p>
      <p style="margin: 4px 0 0;">© 2026 All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

// ─── Orders ────────────────────────────────────────────────────────────────

export const emailOrderConfirmation = (buyerEmail, buyerName, order) => {
  const itemsList = order.items?.map(i => `<li style="margin: 6px 0;">${i.product_name} <strong>×${i.quantity}</strong></li>`).join("") || "";
  const content = `
    <p style="margin: 0 0 16px;">Hi ${buyerName || "there"},</p>
    <p style="margin: 0 0 16px;">Your order has been confirmed and is ready for processing! 🎉</p>
    
    <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
      <p style="margin: 0 0 8px; font-weight: 600; color: #1a1a1a;">📦 Order Summary</p>
      <p style="margin: 0 0 4px;"><strong>Shop:</strong> ${order.shop_name}</p>
      <p style="margin: 8px 0 0; font-size: 13px;"><strong>Items:</strong></p>
      <ul style="margin: 6px 0 0; padding-left: 20px; color: #666;">${itemsList}</ul>
      <p style="margin: 12px 0 0; border-top: 1px solid #ddd; padding-top: 8px; font-size: 16px; font-weight: 600; color: #0891b2;">Total: K${(order.total_amount || 0).toLocaleString()}</p>
    </div>
    
    <p style="margin: 16px 0; font-size: 13px; color: #888;">You'll receive updates as your order progresses. Track it anytime from your Buyer Dashboard.</p>
  `;
  return send({
    to: buyerEmail,
    subject: `✓ Order Confirmed – BwanguSpares`,
    htmlBody: createEmailTemplate("Order Confirmed", "✓", "#0891b2", content, { text: "View Your Order", url: "https://bwangu.com" }),
  });
};

export const emailOrderStatusUpdate = (buyerEmail, buyerName, order, newStatus) => {
  const statusEmojis = { confirmed: "📋", processing: "⚙️", shipped: "🚚", delivered: "✓", cancelled: "❌" };
  const statusMessages = {
    confirmed: "Your order has been confirmed by the shop and is being prepared for shipment.",
    processing: "Your order is being packed and will ship soon.",
    shipped: `Your order is on its way to you!${order.tracking_number ? ` 📍 Tracking: ${order.tracking_number}` : ""}`,
    delivered: "Your order has been delivered! We hope you enjoy your parts. Please leave a review! ⭐",
    cancelled: `Your order has been cancelled.${order.cancellation_reason ? ` Reason: ${order.cancellation_reason}` : ""}`,
  };
  const content = `
    <p style="margin: 0 0 16px;">Hi ${buyerName || "there"},</p>
    <p style="margin: 0 0 16px; font-size: 16px; color: #1a1a1a;"><strong>Your order status has been updated:</strong></p>
    
    <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; border-left: 4px solid #0891b2; margin: 16px 0;">
      <p style="margin: 0; font-size: 14px; color: #666;">${statusMessages[newStatus] || `Status: ${newStatus}`}</p>
    </div>
    
    <div style="background: #fafafa; padding: 12px; border-radius: 8px; margin: 16px 0; font-size: 13px;">
      <p style="margin: 0 0 6px;"><strong>Shop:</strong> ${order.shop_name}</p>
      <p style="margin: 0;"><strong>Total:</strong> K${(order.total_amount || 0).toLocaleString()}</p>
    </div>
  `;
  return send({
    to: buyerEmail,
    subject: `${statusEmojis[newStatus] || "📦"} Order ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)} – BwanguSpares`,
    htmlBody: createEmailTemplate(`Order ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`, statusEmojis[newStatus], "#0891b2", content, { text: "View Tracking", url: "https://bwangu.com" }),
  });
};

export const emailNewOrderToShop = (shopOwnerEmail, shopName, order) => {
  const itemsList = order.items?.map(i => `<li style="margin: 6px 0;">${i.product_name} <strong>×${i.quantity}</strong> – K${i.price?.toLocaleString()}</li>`).join("") || "";
  const content = `
    <p style="margin: 0 0 16px;">Hi ${shopName} team,</p>
    <p style="margin: 0 0 16px; font-size: 16px; font-weight: 600; color: #059669;">🎉 You have received a new order!</p>
    
    <div style="background: #f0fdf4; padding: 16px; border-radius: 8px; border-left: 4px solid #059669; margin: 16px 0;">
      <p style="margin: 0 0 12px; font-weight: 600; color: #1a1a1a;">📦 Order Details</p>
      <p style="margin: 0 0 8px;"><strong>Customer:</strong> ${order.buyer_name}</p>
      <ul style="margin: 8px 0 0; padding-left: 20px; color: #666;">${itemsList}</ul>
      <p style="margin: 12px 0 0; border-top: 1px solid #ddd; padding-top: 8px; font-size: 16px; font-weight: 600; color: #059669;">Total: K${(order.total_amount || 0).toLocaleString()}</p>
    </div>
    
    <p style="margin: 12px 0 0; font-size: 13px; color: #666;">📍 <strong>Delivery:</strong> ${order.delivery_address || "Collect in-store"}</p>
    <p style="margin: 12px 0 0; font-size: 13px; color: #888;">Please confirm this order in your Shop Dashboard as soon as possible.</p>
  `;
  return send({
    to: shopOwnerEmail,
    subject: `🎉 New Order Received – ${shopName}`,
    htmlBody: createEmailTemplate("New Order", "🛍️", "#059669", content, { text: "View Order", url: "https://bwangu.com" }),
  });
};

// ─── Support Tickets ────────────────────────────────────────────────────────

export const emailSupportTicketReceived = (userEmail, userName, ticket) => {
  const content = `
    <p style="margin: 0 0 16px;">Hi ${userName || "there"},</p>
    <p style="margin: 0 0 16px;">Thank you for reaching out! We've received your support ticket and our team will review it shortly.</p>
    
    <div style="background: #eff6ff; padding: 16px; border-radius: 8px; border-left: 4px solid #0284c7; margin: 16px 0;">
      <p style="margin: 0 0 8px; font-weight: 600; color: #1a1a1a;">🎫 Ticket Details</p>
      <p style="margin: 6px 0;"><strong>Subject:</strong> ${ticket.subject}</p>
      <p style="margin: 6px 0;"><strong>Category:</strong> ${ticket.category?.replace("_", " ") || "General"}</p>
      <p style="margin: 6px 0;"><strong>Status:</strong> <span style="background: #fef3c7; padding: 2px 8px; border-radius: 4px; color: #92400e;">Open</span></p>
    </div>
    
    <p style="margin: 12px 0 0; font-size: 13px; color: #888;">We typically respond within 24 hours. Keep an eye on your inbox for updates!</p>
  `;
  return send({
    to: userEmail,
    subject: `🎫 Support Ticket Received – ${ticket.subject}`,
    htmlBody: createEmailTemplate("Ticket Received", "🎫", "#0284c7", content),
  });
};

export const emailSupportTicketReply = (userEmail, userName, ticket, adminReply) =>
  send({
    to: userEmail,
    subject: `Reply to Your Support Ticket – ${ticket.subject}`,
    body: `Hi ${userName || "there"},\n\nOur support team has replied to your ticket.\n\nTicket: ${ticket.subject}\n\nAdmin Reply:\n${adminReply}\n\nLog in to your dashboard to view the full conversation.\n\nBwanguSpares Support Team`,
  });

export const emailNewTicketToAdmin = async (ticket) => {
  try {
    const admins = await base44.entities.User.filter({ role: "admin" });
    for (const admin of admins) {
      await send({
        to: admin.email,
        subject: `New Support Ticket: ${ticket.subject}`,
        body: `A new support ticket has been submitted.\n\nFrom: ${ticket.user_name} (${ticket.user_email})\nCategory: ${ticket.category?.replace("_", " ")}\nSubject: ${ticket.subject}\n\nMessage:\n${ticket.message}\n\nLog in to the Admin Panel to respond.\n\nBwanguSpares System`,
      });
    }
  } catch (e) {
    console.warn("emailNewTicketToAdmin failed:", e?.message);
  }
};

// ─── Low Stock Alerts ────────────────────────────────────────────────────────

export const emailLowStockAlert = (shopOwnerEmail, shopName, lowStockItems) => {
  const itemsList = lowStockItems.map(p =>
    `<li style="margin: 6px 0;"><strong>${p.name}</strong> — <span style="${p.stock_quantity === 0 ? 'color:#dc2626' : 'color:#d97706'}">Stock: ${p.stock_quantity}</span> (threshold: ${p.low_stock_threshold ?? 5})</li>`
  ).join("");
  const content = `
    <p style="margin: 0 0 16px;">Hi ${shopName} team,</p>
    <p style="margin: 0 0 16px;">The following products are running low or out of stock. Please restock soon to avoid missed orders.</p>
    
    <div style="background: #fffbeb; padding: 16px; border-radius: 8px; border-left: 4px solid #d97706; margin: 16px 0;">
      <p style="margin: 0 0 10px; font-weight: 600; color: #1a1a1a;">⚠️ Low / Out-of-Stock Items</p>
      <ul style="margin: 0; padding-left: 20px; color: #555;">${itemsList}</ul>
    </div>
    
    <p style="margin: 12px 0 0; font-size: 13px; color: #888;">Update your stock levels in the Inventory section of your Shop Dashboard.</p>
  `;
  return send({
    to: shopOwnerEmail,
    subject: `⚠️ Low Stock Alert – ${lowStockItems.length} item${lowStockItems.length > 1 ? 's' : ''} need restocking`,
    htmlBody: createEmailTemplate("Low Stock Alert", "⚠️", "#d97706", content, { text: "Update Inventory", url: "https://bwangu.com" }),
  });
};

// ─── Parts Requests ─────────────────────────────────────────────────────────

export const emailPartsRequestReceived = (buyerEmail, buyerName, partName) => {
  const content = `
    <p style="margin: 0 0 16px;">Hi ${buyerName || "there"},</p>
    <p style="margin: 0 0 16px;">Your parts request has been posted and verified shops will start reviewing it right away!</p>
    
    <div style="background: #fef3c7; padding: 16px; border-radius: 8px; border-left: 4px solid #d97706; margin: 16px 0;">
      <p style="margin: 0 0 8px; font-weight: 600; color: #1a1a1a;">🔧 Part Requested</p>
      <p style="margin: 0; color: #666; font-size: 15px;">${partName}</p>
    </div>
    
    <p style="margin: 12px 0 0; font-size: 13px; color: #666;">💡 <strong>Tip:</strong> Make sure your phone number is up to date so shops can reach you with offers.</p>
  `;
  return send({
    to: buyerEmail,
    subject: `🔧 Parts Request Posted – ${partName}`,
    htmlBody: createEmailTemplate("Request Received", "🔧", "#d97706", content, { text: "Track Request", url: "https://bwangu.com" }),
  });
};

export const emailNewPartsRequestToShops = async (partName, category, budget, buyerRegion) => { // notify all shops of new parts request
  try {
    const shops = await base44.entities.Shop.filter({ status: "approved" });
    for (const shop of shops) {
      if (!shop.owner_email) continue;
      await send({
        to: shop.owner_email,
        subject: `🔧 New Parts Request – "${partName}"`,
        body: `Hi ${shop.name} team,\n\nA buyer has submitted a new parts request that may match your inventory.\n\nPart: ${partName}\nCategory: ${category || "Not specified"}\nBudget: ${budget ? `K${Number(budget).toLocaleString()}` : "Open"}\nBuyer Region: ${buyerRegion || "Not specified"}\n\nLog in to your Shop Dashboard → Parts Requests to respond.\n\nBwanguSpares Team`,
      });
    }
  } catch (e) {
    console.warn("emailNewPartsRequestToShops failed:", e?.message);
  }
};

export const emailPartsRequestCounterOffer = (buyerEmail, buyerName, partName, shopName, counterBudget, message) =>
  send({
    to: buyerEmail,
    subject: `Counter Offer on Your Parts Request – "${partName}"`,
    body: `Hi ${buyerName || "there"},\n\n${shopName} has made a counter offer on your parts request for "${partName}".\n\nCounter Offer: K${counterBudget?.toLocaleString() || "N/A"}\nMessage: ${message || "No message provided."}\n\nLog in to your Buyer Dashboard to accept or decline.\n\nBwanguSpares Team`,
  });

// ─── Shop Registration ───────────────────────────────────────────────────────

export const emailShopStatusUpdate = (ownerEmail, ownerName, shopName, status) => {
  const messages = {
    approved: "Congratulations! Your shop has been approved and is now live on BwanguSpares. Start listing products and reach customers today!",
    rejected: "Thank you for your interest in BwanguSpares. Your shop registration was not approved at this time. Please contact support for feedback.",
    suspended: "Your shop has been temporarily suspended due to policy violations. Please contact support to discuss next steps.",
  };
  const colors = { approved: "#059669", rejected: "#dc2626", suspended: "#f59e0b" };
  const emojis = { approved: "🎉", rejected: "❌", suspended: "⚠️" };
  const content = `
    <p style="margin: 0 0 16px;">Hi ${ownerName || "there"},</p>
    <p style="margin: 0 0 16px; font-size: 16px; font-weight: 600; color: #1a1a1a;">${messages[status]}</p>
    
    <div style="background: ${colors[status]}10; padding: 16px; border-radius: 8px; border-left: 4px solid ${colors[status]}; margin: 16px 0; font-size: 13px; color: #666;">
      <p style="margin: 0; font-weight: 600;">📌 Shop: ${shopName}</p>
    </div>
    
    ${status === "approved" ? `<p style="margin: 12px 0 0; font-size: 13px; color: #888;">Next steps: Set up your products, configure shipping, and start receiving orders!</p>` : `<p style="margin: 12px 0 0; font-size: 13px; color: #888;">Please contact our support team if you have any questions.</p>`}
  `;
  return send({
    to: ownerEmail,
    subject: `${emojis[status]} Shop ${status.charAt(0).toUpperCase() + status.slice(1)} – ${shopName}`,
    htmlBody: createEmailTemplate(`Shop ${status.charAt(0).toUpperCase() + status.slice(1)}`, emojis[status], colors[status], content, status === "approved" ? { text: "Go to Dashboard", url: "https://bwangu.com" } : null),
  });
};

export const emailShopRegistrationReceived = (ownerEmail, ownerName, shopName) =>
  send({
    to: ownerEmail,
    subject: `Shop Registration Received – ${shopName}`,
    body: `Hi ${ownerName || "there"},\n\nThank you for registering "${shopName}" on BwanguSpares! 🏪\n\nOur admin team will review your application and you'll receive an email once a decision has been made (usually within 24 hours).\n\nBwanguSpares Team`,
  });

// ─── Reviews ─────────────────────────────────────────────────────────────────

export const emailNewReviewToShop = (shopOwnerEmail, shopName, reviewerName, rating, comment) => {
  const stars = "⭐".repeat(rating) + "☆".repeat(5 - rating);
  const content = `
    <p style="margin: 0 0 16px;">Hi ${shopName} team,</p>
    <p style="margin: 0 0 16px;">Congratulations! You've received a new review from a customer.</p>
    
    <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
        <div style="width: 40px; height: 40px; background: #d97706; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 18px; flex-shrink: 0;">
          ${reviewerName?.charAt(0)?.toUpperCase() || "?"}
        </div>
        <div>
          <p style="margin: 0; font-weight: 600; color: #1a1a1a;">${reviewerName}</p>
          <p style="margin: 2px 0 0; color: #d97706; font-size: 16px;">${stars}</p>
        </div>
      </div>
      ${comment ? `<p style="margin: 12px 0 0; color: #666; font-size: 13px; line-height: 1.5;">"${comment}"</p>` : ""}
    </div>
    
    <p style="margin: 12px 0 0; font-size: 13px; color: #888;">Great reviews help attract more customers. Thanks for providing excellent service!</p>
  `;
  return send({
    to: shopOwnerEmail,
    subject: `⭐ New Review for ${shopName} – ${rating}/5 Stars`,
    htmlBody: createEmailTemplate("New Review", "⭐", "#d97706", content, { text: "View Review", url: "https://bwangu.com" }),
  });
};

// Return/Refund Notifications
export const emailReturnInitiated = (buyerEmail, buyerName, returnRequest) => {
  const content = `
    <p style="margin: 0 0 16px;">Hi ${buyerName || "there"},</p>
    <p style="margin: 0 0 16px;">Your return request has been submitted and is now pending shop review.</p>
    
    <div style="background: #fef3c7; padding: 16px; border-radius: 8px; border-left: 4px solid #d97706; margin: 16px 0;">
      <p style="margin: 0 0 8px; font-weight: 600; color: #1a1a1a;">📦 Return Details</p>
      <p style="margin: 6px 0;"><strong>Product:</strong> ${returnRequest.product_name}</p>
      <p style="margin: 6px 0;"><strong>Qty:</strong> ${returnRequest.quantity}</p>
      <p style="margin: 6px 0;"><strong>Refund Amount:</strong> K${(returnRequest.refund_amount || 0).toLocaleString()}</p>
      <p style="margin: 6px 0;"><strong>Reason:</strong> ${returnRequest.reason?.replace("_", " ")}</p>
    </div>
    
    <p style="margin: 12px 0 0; font-size: 13px; color: #888;">The shop will review your request within 24-48 hours. We'll notify you once they respond.</p>
  `;
  return send({
    to: buyerEmail,
    subject: `📦 Return Request Submitted – K${(returnRequest.refund_amount || 0).toLocaleString()}`,
    htmlBody: createEmailTemplate("Return Submitted", "📦", "#d97706", content, { text: "Track Return", url: "https://bwangu.com" }),
  });
};

export const emailReturnApproved = (buyerEmail, buyerName, returnRequest) => {
  const content = `
    <p style="margin: 0 0 16px;">Hi ${buyerName || "there"},</p>
    <p style="margin: 0 0 16px; font-size: 16px; font-weight: 600; color: #059669;">✓ Your return has been approved!</p>
    
    <div style="background: #f0fdf4; padding: 16px; border-radius: 8px; border-left: 4px solid #059669; margin: 16px 0;">
      <p style="margin: 0 0 12px; font-weight: 600; color: #1a1a1a;">📦 Next Steps</p>
      <p style="margin: 6px 0; color: #666; font-size: 13px;">1. Pack the item securely with original packaging if possible</p>
      <p style="margin: 6px 0; color: #666; font-size: 13px;">2. Ship to the shop's address</p>
      <p style="margin: 6px 0; color: #666; font-size: 13px;">3. Your refund will be processed once the shop receives it</p>
    </div>
    
    <p style="margin: 12px 0 0; font-size: 13px; color: #888;"><strong>Note:</strong> Shop approval: ${returnRequest.approval_notes || "No specific notes"}</p>
  `;
  return send({
    to: buyerEmail,
    subject: `✓ Return Approved – K${(returnRequest.refund_amount || 0).toLocaleString()}`,
    htmlBody: createEmailTemplate("Return Approved", "✓", "#059669", content, { text: "View Details", url: "https://bwangu.com" }),
  });
};

export const emailRefundReleased = (buyerEmail, buyerName, returnRequest) => {
  const content = `
    <p style="margin: 0 0 16px;">Hi ${buyerName || "there"},</p>
    <p style="margin: 0 0 16px; font-size: 16px; font-weight: 600; color: #059669;">💰 Your refund has been processed!</p>
    
    <div style="background: #f0fdf4; padding: 16px; border-radius: 8px; border-left: 4px solid #059669; margin: 16px 0;">
      <p style="margin: 0 0 8px; font-weight: 600; color: #1a1a1a;">Refund Details</p>
      <p style="margin: 6px 0;"><strong>Amount:</strong> K${(returnRequest.refund_amount || 0).toLocaleString()}</p>
      <p style="margin: 6px 0;"><strong>Product:</strong> ${returnRequest.product_name}</p>
      <p style="margin: 6px 0; font-size: 13px; color: #666;">Credited to your BwanguSpares wallet</p>
    </div>
    
    <p style="margin: 12px 0 0; font-size: 13px; color: #888;">You can use your wallet balance for future purchases or request a withdrawal.</p>
  `;
  return send({
    to: buyerEmail,
    subject: `💰 Refund Processed – K${(returnRequest.refund_amount || 0).toLocaleString()}`,
    htmlBody: createEmailTemplate("Refund Released", "💰", "#059669", content, { text: "View Wallet", url: "https://bwangu.com" }),
  });
};

export const emailReturnRejected = (buyerEmail, buyerName, returnRequest) => {
  const content = `
    <p style="margin: 0 0 16px;">Hi ${buyerName || "there"},</p>
    <p style="margin: 0 0 16px;">Unfortunately, your return request has been declined.</p>
    
    <div style="background: #fee2e2; padding: 16px; border-radius: 8px; border-left: 4px solid #dc2626; margin: 16px 0;">
      <p style="margin: 0 0 8px; font-weight: 600; color: #1a1a1a;">❌ Return Decision</p>
      <p style="margin: 6px 0;"><strong>Product:</strong> ${returnRequest.product_name}</p>
      <p style="margin: 6px 0;"><strong>Reason for Rejection:</strong> ${returnRequest.approval_notes || "See shop feedback"}</p>
    </div>
    
    <p style="margin: 12px 0 0; font-size: 13px; color: #888;">If you believe this is incorrect, please contact the shop directly or submit a support ticket for further assistance.</p>
  `;
  return send({
    to: buyerEmail,
    subject: `❌ Return Request Declined`,
    htmlBody: createEmailTemplate("Return Rejected", "❌", "#dc2626", content, { text: "Contact Support", url: "https://bwangu.com" }),
  });
};

export const emailReturnToShop = (shopOwnerEmail, shopName, returnRequest) => {
  const content = `
    <p style="margin: 0 0 16px;">Hi ${shopName} team,</p>
    <p style="margin: 0 0 16px;">A customer has submitted a return request for one of your products. Please review and respond promptly.</p>
    
    <div style="background: #fef3c7; padding: 16px; border-radius: 8px; border-left: 4px solid #d97706; margin: 16px 0;">
      <p style="margin: 0 0 12px; font-weight: 600; color: #1a1a1a;">📦 Return Request</p>
      <p style="margin: 6px 0;"><strong>Customer:</strong> ${returnRequest.buyer_name}</p>
      <p style="margin: 6px 0;"><strong>Product:</strong> ${returnRequest.product_name}</p>
      <p style="margin: 6px 0;"><strong>Reason:</strong> ${returnRequest.reason?.replace("_", " ")}</p>
      <p style="margin: 6px 0;"><strong>Refund:</strong> K${(returnRequest.refund_amount || 0).toLocaleString()}</p>
      ${returnRequest.description ? `<p style="margin: 12px 0 0; padding-top: 12px; border-top: 1px solid #e5e7eb; color: #666; font-size: 13px;"><strong>Customer Note:</strong> ${returnRequest.description}</p>` : ""}
    </div>
    
    <p style="margin: 12px 0 0; font-size: 13px; color: #888;">Log in to your Shop Dashboard to approve or decline this return request.</p>
  `;
  return send({
    to: shopOwnerEmail,
    subject: `📦 New Return Request – ${returnRequest.product_name}`,
    htmlBody: createEmailTemplate("Return Request", "📦", "#d97706", content, { text: "Review Return", url: "https://bwangu.com" }),
  });
};

// Watchlist Notifications
export const emailPriceDropNotification = (buyerEmail, buyerName, watchlist) => {
  const priceSavings = watchlist.last_notified_price - watchlist.current_price;
  const percentDrop = ((priceSavings / watchlist.last_notified_price) * 100).toFixed(1);
  const content = `
    <p style="margin: 0 0 16px;">Hi ${buyerName || "there"},</p>
    <p style="margin: 0 0 16px;">Great news! A part you're following has dropped in price.</p>
    
    <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; border-left: 4px solid #059669; margin: 20px 0;">
      <p style="margin: 0 0 12px; font-weight: 600; color: #1a1a1a;">💰 Price Drop Alert</p>
      <p style="margin: 8px 0; font-size: 14px;"><strong>${watchlist.product_name}</strong></p>
      <p style="margin: 8px 0; color: #666; font-size: 13px;">From <span style="text-decoration: line-through;">K${watchlist.last_notified_price?.toLocaleString()}</span> → <span style="color: #059669; font-weight: 600; font-size: 16px;">K${watchlist.current_price?.toLocaleString()}</span></p>
      <p style="margin: 12px 0 0; font-size: 13px; color: #059669; font-weight: 600;">You save K${priceSavings.toFixed(2)} (${percentDrop}% off)</p>
    </div>
    
    <p style="margin: 12px 0 0; font-size: 13px; color: #888;">Shop: ${watchlist.shop_name}</p>
  `;
  return send({
    to: buyerEmail,
    subject: `💰 Price Drop! ${watchlist.product_name} – K${watchlist.current_price?.toLocaleString()}`,
    htmlBody: createEmailTemplate("Price Drop Alert", "💰", "#059669", content, { text: "View Product", url: "https://bwangu.com" }),
  });
};

export const emailBackInStockNotification = (buyerEmail, buyerName, watchlist) => {
  const content = `
    <p style="margin: 0 0 16px;">Hi ${buyerName || "there"},</p>
    <p style="margin: 0 0 16px; font-size: 16px; font-weight: 600; color: #059669;">✓ Back in stock!</p>
    
    <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; border-left: 4px solid #059669; margin: 20px 0;">
      <p style="margin: 0 0 12px; font-weight: 600; color: #1a1a1a;">📦 Stock Alert</p>
      <p style="margin: 8px 0; font-size: 14px;"><strong>${watchlist.product_name}</strong> is now available again.</p>
      <p style="margin: 12px 0 0; font-size: 15px; color: #059669; font-weight: 600;">K${watchlist.current_price?.toLocaleString()}</p>
      <p style="margin: 6px 0; color: #666; font-size: 13px;">Shop: ${watchlist.shop_name}</p>
    </div>
    
    <p style="margin: 12px 0 0; font-size: 13px; color: #888;">Don't miss out—add it to your cart before it sells out again!</p>
  `;
  return send({
    to: buyerEmail,
    subject: `✓ ${watchlist.product_name} Back in Stock – K${watchlist.current_price?.toLocaleString()}`,
    htmlBody: createEmailTemplate("Back in Stock", "✓", "#059669", content, { text: "Buy Now", url: "https://bwangu.com" }),
  });
};

// ─── Technician Hire Requests ────────────────────────────────────────────────

export const emailHireRequestToShop = (shopOwnerEmail, shopName, buyerName, problemType, description) =>
  send({
    to: shopOwnerEmail,
    subject: `New Technician Hire Request – ${shopName}`,
    body: `Hi ${shopName} team,\n\nA customer has requested a technician from your shop.\n\nCustomer: ${buyerName}\nProblem Type: ${problemType?.replace("_", " ")}\nDescription: ${description || "Not provided."}\n\nLog in to your Shop Dashboard to respond.\n\nBwanguSpares Team`,
  });

export const emailHireRequestResponseToBuyer = (buyerEmail, buyerName, shopName, status, counterBudget, message) => {
  const isCounter = status === "counter_offered";
  return send({
    to: buyerEmail,
    subject: `${isCounter ? "Counter Offer" : "Response"} on Your Technician Request – ${shopName}`,
    body: `Hi ${buyerName || "there"},\n\n${shopName} has ${isCounter ? `made a counter offer on` : `responded to`} your technician hire request.\n\n${isCounter ? `Counter Budget: K${counterBudget?.toLocaleString() || "N/A"}\n` : ""}${message ? `Message: ${message}\n` : ""}\nLog in to your Buyer Dashboard to respond.\n\nBwanguSpares Team`,
  });
};