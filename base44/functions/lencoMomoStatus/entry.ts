import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const LENCO_API_KEY = Deno.env.get("LENCO_API_KEY");
const LENCO_BASE_URL = "https://api.lenco.co/access/v2";

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

    const res = await fetch(`${LENCO_BASE_URL}/collections/${reference}`, {
      headers: {
        "Authorization": `Bearer ${LENCO_API_KEY}`,
        "accept": "application/json",
      },
    });

    const data = await res.json();
    console.log("Lenco MoMo status:", JSON.stringify(data));

    // Lenco v2: status lives at data.data.status OR data.data.collection.status
    const collection = data?.data?.collection ?? data?.data;
    const status = collection?.status; // "pending" | "successful" | "failed" | "pay-offline"

    console.log(`MoMo status for ${reference}: ${status}`);

    // If successful, update order status + credit shop wallet
    if (status === "successful") {
      const orders = await base44.asServiceRole.entities.Order.filter({ stripe_session_id: reference });
      if (orders.length > 0) {
        const order = orders[0];
        if (order.status === "pending") {
          const finalShopId = (order.shop_id && order.shop_id !== "PENDING_PAYMENT") ? order.shop_id : (order.items?.[0]?.shop_id || "unknown");
          const finalShopName = (order.shop_name && order.shop_name !== "Payment Pending") ? order.shop_name : (order.items?.[0]?.shop_name || "");

          await base44.asServiceRole.entities.Order.update(order.id, {
            status: "confirmed",
            shop_id: finalShopId,
            shop_name: finalShopName,
          });

          // Clear cart
          const cartItems = await base44.asServiceRole.entities.CartItem.filter({ buyer_email: order.buyer_email });
          for (const item of cartItems) {
            await base44.asServiceRole.entities.CartItem.delete(item.id);
          }

          // Credit shop wallet
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
            console.log(`ShopWallet credited: shop=${finalShopId}, net=K${netEarned}, ref=${reference}`);
          } catch (walletErr) {
            console.warn("ShopWallet credit failed:", walletErr.message);
          }

          console.log(`Order ${order.id} confirmed and cart cleared for ${reference}`);
        }
      }
    }

    return Response.json({ status, data: collection });
  } catch (error) {
    console.error("lencoMomoStatus error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});