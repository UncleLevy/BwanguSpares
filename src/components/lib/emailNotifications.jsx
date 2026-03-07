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

// ─── Parts Requests ─────────────────────────────────────────────────────────

export const emailPartsRequestReceived = (buyerEmail, buyerName, partName) =>
  send({
    to: buyerEmail,
    subject: `Parts Request Received – ${partName}`,
    body: `Hi ${buyerName || "there"},\n\nYour request for "${partName}" has been submitted. Verified shops will review your request and reach out to you directly.\n\nMake sure your phone number is up to date so shops can contact you.\n\nBwanguSpares Team`,
  });

export const emailPartsRequestCounterOffer = (buyerEmail, buyerName, partName, shopName, counterBudget, message) =>
  send({
    to: buyerEmail,
    subject: `Counter Offer on Your Parts Request – "${partName}"`,
    body: `Hi ${buyerName || "there"},\n\n${shopName} has made a counter offer on your parts request for "${partName}".\n\nCounter Offer: K${counterBudget?.toLocaleString() || "N/A"}\nMessage: ${message || "No message provided."}\n\nLog in to your Buyer Dashboard to accept or decline.\n\nBwanguSpares Team`,
  });

// ─── Shop Registration ───────────────────────────────────────────────────────

export const emailShopStatusUpdate = (ownerEmail, ownerName, shopName, status) => {
  const messages = {
    approved: `Great news! Your shop "${shopName}" has been approved. You can now start listing products and receiving orders.`,
    rejected: `Unfortunately, your shop registration for "${shopName}" has been rejected. Please contact support for more information.`,
    suspended: `Your shop "${shopName}" has been temporarily suspended. Please contact support to resolve any outstanding issues.`,
  };
  return send({
    to: ownerEmail,
    subject: `Shop ${status.charAt(0).toUpperCase() + status.slice(1)}: ${shopName} – BwanguSpares`,
    body: `Hi ${ownerName || "there"},\n\n${messages[status] || `Your shop status has been updated to: ${status}.`}\n\nIf you have questions, please contact us via the support section.\n\nBwanguSpares Admin Team`,
  });
};

export const emailShopRegistrationReceived = (ownerEmail, ownerName, shopName) =>
  send({
    to: ownerEmail,
    subject: `Shop Registration Received – ${shopName}`,
    body: `Hi ${ownerName || "there"},\n\nThank you for registering "${shopName}" on BwanguSpares! 🏪\n\nOur admin team will review your application and you'll receive an email once a decision has been made (usually within 24 hours).\n\nBwanguSpares Team`,
  });

// ─── Reviews ─────────────────────────────────────────────────────────────────

export const emailNewReviewToShop = (shopOwnerEmail, shopName, reviewerName, rating, comment) =>
  send({
    to: shopOwnerEmail,
    subject: `New Review for ${shopName} – ${rating}⭐`,
    body: `Hi ${shopName} team,\n\nYou've received a new review!\n\nReviewer: ${reviewerName}\nRating: ${"⭐".repeat(rating)} (${rating}/5)\nComment: ${comment || "No comment provided."}\n\nLog in to your Shop Dashboard to view all reviews.\n\nBwanguSpares Team`,
  });

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