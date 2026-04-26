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

    const {
      phone,
      operator, // "airtel" | "mtn"
      amount,
      tier = "premium",
    } = await req.json();

    if (!phone || !operator || !amount) {
      return Response.json({ error: "phone, operator and amount are required" }, { status: 400 });
    }

    if (!["airtel", "mtn"].includes(operator)) {
      return Response.json({ error: "Operator must be 'airtel' or 'mtn'" }, { status: 400 });
    }

    // Normalize phone to local format (Lenco expects local number for ZM)
    let normalizedPhone = phone.replace(/\s+/g, "").replace(/^\+260/, "0").replace(/^260/, "0");

    // Reference: only alphanumeric, dash, dot, underscore allowed by Lenco
    const reference = `BW-SUB-${Date.now()}-${crypto.randomUUID().replace(/-/g, "").slice(0, 8)}`;

    const momoRes = await fetch(`${LENCO_BASE_URL}/collections/mobile-money`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LENCO_API_KEY}`,
        "Content-Type": "application/json",
        "accept": "application/json",
      },
      body: JSON.stringify({
        amount,
        reference,
        phone: normalizedPhone,
        operator,
        country: "zm",
        bearer: "merchant",
      }),
    });

    const momoData = await momoRes.json();
    console.log("Lenco subscription MoMo collect response:", JSON.stringify(momoData));

    if (!momoRes.ok || !momoData.status) {
      const msg = momoData?.message || "Failed to initiate mobile money payment";
      console.error("Lenco MoMo error:", msg);
      return Response.json({ error: msg }, { status: 400 });
    }

    const collectionId = momoData?.data?.id;
    const status = momoData?.data?.status;

    console.log(`Lenco subscription MoMo initiated: ref=${reference}, collectionId=${collectionId}, status=${status}`);

    return Response.json({
      success: true,
      reference,
      collectionId,
      status,
      message: "Payment request sent. Please approve on your phone.",
    });
  } catch (error) {
    console.error("lencoSubscriptionMomoCollect error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});