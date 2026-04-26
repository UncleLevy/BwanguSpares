import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { event, data, old_data } = await req.json();

    // Only process update events
    if (event.type !== 'update') {
      return Response.json({ success: true, message: 'Not an update event' });
    }

    // Check if status actually changed
    if (!old_data || old_data.status === data.status) {
      return Response.json({ success: true, message: 'Status unchanged' });
    }

    const order = data;
    const previousStatus = old_data?.status;
    const newStatus = order.status;

    // Build email subject and body based on status
    const statusMessages = {
      pending: "Your order has been received and is being processed",
      confirmed: "Your order has been confirmed by the shop",
      processing: "Your order is being prepared for shipment",
      shipped: "Your order is on its way to you",
      delivered: "Your order has been delivered",
      cancelled: "Your order has been cancelled"
    };

    const subject = `Order #${order.id?.slice(0, 8)} - Status: ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`;
    const statusMessage = statusMessages[newStatus] || `Your order status has been updated to ${newStatus}`;

    const locationInfo = order.current_location ? `Current Location: ${order.current_location}` : '';
    const trackingInfo = order.tracking_number ? `Tracking Number: ${order.tracking_number}` : '';

    const body = `
Dear ${order.buyer_name || 'Valued Customer'},

${statusMessage}

Order Details:
- Order ID: ${order.id}
- Shop: ${order.shop_name}
- Total Amount: K${order.total_amount?.toLocaleString()}
- Status: ${newStatus.toUpperCase()}
${trackingInfo ? `- ${trackingInfo}` : ''}
${locationInfo ? `- ${locationInfo}` : ''}

If you have any questions about your order, please visit your dashboard or contact us.

Best regards,
BwanguSpares Team
    `;

    // Send email via Core integration
    const emailResult = await base44.integrations.Core.SendEmail({
      to: order.buyer_email,
      subject: subject,
      body: body,
      from_name: "BwanguSpares"
    });

    return Response.json({
      success: true,
      message: `Notification sent to ${order.buyer_email} for status change: ${previousStatus} → ${newStatus}`
    });
  } catch (error) {
    console.error('Order status notification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});