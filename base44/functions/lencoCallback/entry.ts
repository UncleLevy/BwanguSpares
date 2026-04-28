import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const LENCO_API_KEY = Deno.env.get("LENCO_API_KEY");
const LENCO_BASE_URL = "https://api.lenco.co/access/v2";
const WEBHOOK_SECRET = Deno.env.get("LENCO_WEBHOOK_SECRET");

/**
 * Lenco Broadpay webhook + manual callback handler.
 *
 * Handles two call modes:
 *   1. Webhook from Lenco (no auth header, has X-Lenco-Signature or body.reference)
 *   2. Manual call from frontend (has Base44 auth token, body.reference)
 *
 * Always idempotent — if order is already "confirmed" returns success immediately.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Parse body once
    const body = await req.json().catch(() => ({}));
    const reference = body.reference || body.data?.reference || body.transactionRef;

    if (!reference) {
      return Response.json({ error: "reference is required" }, { status: 400 });
    }

    // Determine if this is an authenticated frontend call or a webhook call
    const authHeader = req.headers.get("Authorization") || "";
    const isWebhook = !authHeader.startsWith("Bearer ") || authHeader === "Bearer undefined";

    if (!isWebhook) {
      // Frontend-initiated: verify the user is authenticated
      const user = await base44.auth.me();
      if (!user) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
    } else {
      // Webhook call: verify Lenco signature
      const signature = req.headers.get("X-Lenco-Signature") || req.headers.get("x-lenco-signature");
      if (WEBHOOK_SECRET && signature) {
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
          "raw", encoder.encode(WEBHOOK_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
        );
        const rawBody = JSON.stringify(body);
        const sigBytes = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody));
        const expected = Array.from(new Uint8Array(sigBytes)).map(b => b.toString(16).padStart(2, "0")).join("");
        if (signature !== expected) {
          console.warn("Invalid webhook signature");
          return Response.json({ error: "Invalid signature" }, { status: 401 });
        }
      }
    }

    // --- 1. Find the order by reference ---
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
    const finalShopId = (actualShopId && actualShopId !== "PENDING_PAYMENT") ? actualShopId : (order.items?.[0]?.shop_id || "unknown");
    const finalShopName = (actualShopName && actualShopName !== "Payment Pending") ? actualShopName : (order.items?.[0]?.shop_name || "");

    await base44.asServiceRole.entities.Order.update(order.id, {
      status: "confirmed",
      shop_id: finalShopId,
      shop_name: finalShopName,
    });
    console.log(`Order ${order.id} confirmed for payment ${reference}`);

    // --- 5. Clear the buyer's cart ---
    const cartItems = await base44.asServiceRole.entities.CartItem.filter({ buyer_email: order.buyer_email });
    for (const item of cartItems) {
      await base44.asServiceRole.entities.CartItem.delete(item.id);
    }
    console.log(`Cleared ${cartItems.length} cart items for ${order.buyer_email}`);

    // --- 6. Credit the shop wallet ---
    try {
      const orderTotal = order.total_amount || 0;
      const wallets = await base44.asServiceRole.entities.ShopWallet.filter({ shop_id: finalShopId });
      const feeRate = wallets[0]?.platform_fee_rate ?? 5;
      const feeAmount = parseFloat(((orderTotal * feeRate) / 100).toFixed(2));
      const netEarned = parseFloat((orderTotal - feeAmount).toFixed(2));

      if (wallets.length > 0) {
        const w = wallets[0];
        await base44.asServiceRole.entities.ShopWallet.update(w.id, {
          total_earned: parseFloat(((w.total_earned || 0) + netEarned).toFixed(2)),
          pending_balance: parseFloat(((w.pending_balance || 0) + netEarned).toFixed(2)),
          total_fees_deducted: parseFloat(((w.total_fees_deducted || 0) + feeAmount).toFixed(2)),
        });
      } else {
        const shop = await base44.asServiceRole.entities.Shop.get(finalShopId).catch(() => null);
        await base44.asServiceRole.entities.ShopWallet.create({
          shop_id: finalShopId,
          shop_name: finalShopName,
          owner_email: shop?.owner_email || "",
          total_earned: netEarned,
          pending_balance: netEarned,
          total_paid_out: 0,
          platform_fee_rate: feeRate,
          total_fees_deducted: feeAmount,
        });
      }
      console.log(`ShopWallet credited: shop=${finalShopId}, net=K${netEarned}, fee=K${feeAmount}, ref=${reference}`);
    } catch (walletErr) {
      console.warn("ShopWallet credit failed:", walletErr.message);
    }

    // --- 7. Notify buyer ---
    try {
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
      message: "Order confirmed, cart cleared, and shop wallet credited.",
    });

  } catch (error) {
    console.error("lencoCallback error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});