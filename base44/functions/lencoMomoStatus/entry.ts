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

    const res = await fetch(`${LENCO_BASE_URL}/collections/status/${reference}`, {
      headers: {
        "Authorization": `Bearer ${LENCO_API_KEY}`,
        "accept": "application/json",
      },
    });

    const data = await res.json();
    console.log("Lenco MoMo status:", JSON.stringify(data));

    const status = data?.data?.status; // "pending" | "successful" | "failed" | "pay-offline"

    // If successful, update order status
    if (status === "successful") {
      const orders = await base44.asServiceRole.entities.Order.filter({ stripe_session_id: reference });
      if (orders.length > 0) {
        const order = orders[0];
        await base44.asServiceRole.entities.Order.update(order.id, { status: "confirmed" });
        console.log(`Order ${order.id} confirmed for reference ${reference}`);
      }
    }

    return Response.json({ status, data: data?.data });
  } catch (error) {
    console.error("lencoMomoStatus error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});