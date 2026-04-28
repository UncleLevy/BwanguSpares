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

    // If successful, update order status
    if (status === "successful") {
      const orders = await base44.asServiceRole.entities.Order.filter({ stripe_session_id: reference });
      if (orders.length > 0) {
        const order = orders[0];
        if (order.status === "pending") {
          const actualShopId = order.items?.[0]?.shop_id || order.shop_id;
          const actualShopName = order.items?.[0]?.shop_name || order.shop_name;
          await base44.asServiceRole.entities.Order.update(order.id, {
            status: "confirmed",
            shop_id: actualShopId !== "PENDING_PAYMENT" ? actualShopId : order.items?.[0]?.shop_id,
            shop_name: actualShopName !== "Payment Pending" ? actualShopName : order.items?.[0]?.shop_name,
          });
          // Clear cart
          const cartItems = await base44.asServiceRole.entities.CartItem.filter({ buyer_email: order.buyer_email });
          for (const item of cartItems) {
            await base44.asServiceRole.entities.CartItem.delete(item.id);
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