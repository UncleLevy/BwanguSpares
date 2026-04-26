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

    const {
      phone,
      operator, // "airtel" | "mtn"
      amount,
      items,
      delivery_address,
      delivery_phone,
      notes,
      coupon_code,
      discount_amount,
      total,
      shippingOption = "collect",
      shippingCost = 0,
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
    const reference = `BW-${Date.now()}-${crypto.randomUUID().replace(/-/g, "").slice(0, 8)}`;

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
    console.log("Lenco MoMo collect response:", JSON.stringify(momoData));

    if (!momoRes.ok || !momoData.status) {
      const msg = momoData?.message || "Failed to initiate mobile money payment";
      console.error("Lenco MoMo error:", msg);
      return Response.json({ error: msg }, { status: 400 });
    }

    const collectionId = momoData?.data?.id;
    const status = momoData?.data?.status;

    // Derive shop from items (all items in one checkout are from one shop)
    const shopId = items?.[0]?.shop_id || "PENDING_PAYMENT";
    const shopName = items?.[0]?.shop_name || "Payment Pending";

    // Create pending order record
    await base44.asServiceRole.entities.Order.create({
      buyer_email: user.email,
      buyer_name: user.full_name,
      shop_id: shopId,
      shop_name: shopName,
      items,
      total_amount: total,
      status: "pending",
      delivery_address,
      delivery_phone: delivery_phone || phone,
      notes: notes || "",
      payment_method: `mobile_money_${operator}`,
      stripe_session_id: reference,
      coupon_code: coupon_code || "",
      discount_amount: discount_amount || 0,
      shipping_option: shippingOption,
      shipping_cost: shippingCost || 0,
      payout_status: "pending",
    });

    console.log(`Lenco MoMo initiated: ref=${reference}, collectionId=${collectionId}, status=${status}`);

    return Response.json({
      success: true,
      reference,
      collectionId,
      status,
      message: "Payment request sent. Please approve on your phone.",
    });
  } catch (error) {
    console.error("lencoMomoCollect error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});