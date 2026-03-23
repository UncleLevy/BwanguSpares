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

  if (!res.ok) {
    const err = await res.text();
    console.error("MTN MoMo token error:", err);
    throw new Error(`Failed to get access token: ${res.status}`);
  }

  const data = await res.json();
  return data.access_token;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { phone, amount, orderId, externalId } = body;

    if (!phone || !amount) {
      return Response.json({ error: "phone and amount are required" }, { status: 400 });
    }

    // Normalize phone: strip +, spaces, leading 0 → use country code 260
    let msisdn = phone.replace(/\s+/g, "").replace(/^\+/, "");
    if (msisdn.startsWith("0")) {
      msisdn = "260" + msisdn.slice(1);
    }

    const subscriptionKey = Deno.env.get("MTN_MOMO_SUBSCRIPTION_KEY");
    const accessToken = await getAccessToken();

    // Generate a UUID for this transaction
    const referenceId = crypto.randomUUID();

    const requestBody = {
      amount: String(Math.round(Number(amount))), // MTN expects string, whole ZMW
      currency: "ZMW",
      externalId: externalId || orderId || crypto.randomUUID(),
      payer: {
        partyIdType: "MSISDN",
        partyId: msisdn,
      },
      payerMessage: "BwanguSpares Order Payment",
      payeeNote: `Order from BwanguSpares`,
    };

    console.log("MTN MoMo requestToPay body:", JSON.stringify(requestBody));
    console.log("Payer MSISDN:", msisdn, "Amount:", requestBody.amount);

    const res = await fetch(`${MOMO_BASE_URL}/collection/v1_0/requesttopay`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "X-Reference-Id": referenceId,
        "X-Target-Environment": TARGET_ENV,
        "Ocp-Apim-Subscription-Key": subscriptionKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await res.text();
    console.log("MTN MoMo requestToPay response status:", res.status, "body:", responseText);

    if (res.status === 202) {
      // Accepted - payment request sent to user's phone
      return Response.json({
        success: true,
        referenceId,
        message: "Payment request sent to your MTN MoMo number. Please approve on your phone.",
      });
    } else {
      console.error("MTN MoMo requestToPay failed:", res.status, responseText);
      return Response.json({
        success: false,
        error: `Payment request failed (${res.status}). Please check your number and try again.`,
      }, { status: 400 });
    }
  } catch (error) {
    console.error("mtnMomoCollect error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});