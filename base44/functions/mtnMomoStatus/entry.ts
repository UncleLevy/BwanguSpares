import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const MOMO_BASE_URL = "https://sandbox.momodeveloper.mtn.com";
const TARGET_ENV = "sandbox"; // Change to "zambia" for production

async function getAccessToken() {
  const userId = Deno.env.get("MTN_MOMO_API_USER_ID");
  const apiKey = Deno.env.get("MTN_MOMO_API_KEY");
  const subscriptionKey = Deno.env.get("MTN_MOMO_SUBSCRIPTION_KEY");
  const credentials = btoa(`${userId}:${apiKey}`);

  const res = await fetch(`${MOMO_BASE_URL}/collection/token/`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${credentials}`,
      "Ocp-Apim-Subscription-Key": subscriptionKey,
    },
  });

  if (!res.ok) throw new Error(`Token error: ${res.status}`);
  const data = await res.json();
  return data.access_token;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { referenceId } = body;
    if (!referenceId) return Response.json({ error: "referenceId required" }, { status: 400 });

    const subscriptionKey = Deno.env.get("MTN_MOMO_SUBSCRIPTION_KEY");
    const accessToken = await getAccessToken();

    const res = await fetch(`${MOMO_BASE_URL}/collection/v1_0/requesttopay/${referenceId}`, {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "X-Target-Environment": TARGET_ENV,
        "Ocp-Apim-Subscription-Key": subscriptionKey,
      },
    });

    const data = await res.json();
    console.log("MTN MoMo status check:", JSON.stringify(data));

    // status: PENDING | SUCCESSFUL | FAILED
    return Response.json({ success: true, status: data.status, data });
  } catch (error) {
    console.error("mtnMomoStatus error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});