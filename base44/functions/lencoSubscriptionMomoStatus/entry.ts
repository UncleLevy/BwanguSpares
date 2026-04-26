import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const LENCO_API_KEY = Deno.env.get("LENCO_SUBSCRIPTION_API_KEY");
const LENCO_BASE_URL = "https://api.lenco.co/access/v2";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { reference, tier = "premium" } = await req.json();
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
    console.log("Lenco subscription MoMo status:", JSON.stringify(data));

    const status = data?.data?.status; // "pending" | "successful" | "failed" | "pay-offline"
    
    // If successful, update subscription
    if (status === "successful") {
      const subs = await base44.asServiceRole.entities.Subscription.filter({ user_email: user.email });
      if (subs.length > 0) {
        await base44.asServiceRole.entities.Subscription.update(subs[0].id, { tier });
      } else {
        await base44.asServiceRole.entities.Subscription.create({
          user_email: user.email,
          tier,
          status: "active",
          max_shops: tier === "premium" ? 5 : 1,
        });
      }
    }
    
    return Response.json({ status, data: data?.data });
  } catch (error) {
    console.error("lencoSubscriptionMomoStatus error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});