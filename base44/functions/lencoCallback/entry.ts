import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const LENCO_API_KEY = Deno.env.get("LENCO_API_KEY");
const LENCO_BASE_URL = "https://api.lenco.co/access/v2";

/**
 * Lenco Broadpay payment verification & order fulfilment handler.
 *
 * Called from the frontend after:
 *   - Lenco hosted checkout returns to callback_url
 *   - 3DS redirect returns to the app
 *   - Frontend polls for card/momo status and wants server-side confirmation
 *
 * Payload: { reference }
 *
 * This function is IDEMPOTENT — if the order is already "confirmed" it returns
 * success immediately without re-processing.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { reference } = await req.json();
    if (!reference) {
      return Response.json({ error: "reference is required" }, { status: 400 });
    }

    // --- 1. Find the pending order by reference (stored in stripe_session_id) ---
    const orders = await base44.asServiceRole.entities.Order.filter({ stripe_session_id: reference });
    if (orders.length === 0) {
      return Response.json({ error: "Order not found for this reference" }, { status: 404 });
    }
    const order = orders[0];

    // --- 2. Idempotency: already confirmed → return success immediately ---
    if (order.status !== "pending") {
      return Response.json({
        success: true,
        already_processed: true,
        order_id: order.id,
        status: order.status,
      });
    }

    // --- 3. Verify payment status from Lenco API ---
    const verifyRes = await fetch(`${LENCO_BASE_URL}/collections/${reference}`, {
      headers: {
        "Authorization": `Bearer ${LENCO_API_KEY}`,
        "accept": "application/json",
      },
    });

    const verifyData = await verifyRes.json();
    console.log("Lenco verify response:", JSON.stringify(verifyData));

    if (!verifyRes.ok || !verifyData.status) {
      console.error("Lenco verification failed:", verifyData?.message);
      return Response.json({ error: "Payment verification failed", details: verifyData?.message }, { status: 400 });
    }

    const paymentStatus = verifyData.data?.status;
    console.log(`Payment ${reference} status from Lenco: ${paymentStatus}`);

    if (paymentStatus !== "successful") {
      return Response.json({
        success: false,
        payment_status: paymentStatus,
        message: `Payment is ${paymentStatus}. Order not confirmed.`,
      });
    }

    // --- 4. Payment confirmed — update order ---
    const actualShopId = order.items?.[0]?.shop_id || order.shop_id;
    const actualShopName = order.items?.[0]?.shop_name || order.shop_name;

    await base44.asServiceRole.entities.Order.update(order.id, {
      status: "confirmed",
      shop_id: actualShopId !== "PENDING_PAYMENT" ? actualShopId : (order.items?.[0]?.shop_id || "unknown"),
      shop_name: actualShopName !== "Payment Pending" ? actualShopName : (order.items?.[0]?.shop_name || ""),
    });
    console.log(`Order ${order.id} confirmed for payment ${reference}`);

    // --- 5. Clear the buyer's cart ---
    const cartItems = await base44.asServiceRole.entities.CartItem.filter({ buyer_email: order.buyer_email });
    for (const item of cartItems) {
      await base44.asServiceRole.entities.CartItem.delete(item.id);
    }
    console.log(`Cleared ${cartItems.length} cart items for ${order.buyer_email}`);

    // --- 6. Notify shop owner ---
    try {
      const shopNotifications = await base44.asServiceRole.entities.Notification.filter({ });
      await base44.asServiceRole.entities.Notification.create({
        user_email: order.buyer_email,
        type: "order_update",
        title: "Order Confirmed",
        message: `Your order has been confirmed. Reference: ${reference}`,
        related_id: order.id,
        action_url: `/BuyerDashboard?view=orders`,
        read: false,
      });
    } catch (notifErr) {
      console.warn("Notification creation failed:", notifErr.message);
    }

    return Response.json({
      success: true,
      order_id: order.id,
      payment_status: "successful",
      message: "Order confirmed and cart cleared.",
    });

  } catch (error) {
    console.error("lencoCallback error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});