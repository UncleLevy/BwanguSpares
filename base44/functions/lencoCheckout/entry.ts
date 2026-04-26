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
      items,
      delivery_address,
      delivery_phone,
      notes,
      coupon_code,
      discount_amount,
      total,
      useWallet = false,
      walletAmount = 0,
      cardAmount = 0,
      shippingOption = "collect",
      shippingCost = 0,
      payment_method = "card", // "card" or "mobile_money"
    } = await req.json();

    if (!items || items.length === 0) {
      return Response.json({ error: "No items provided" }, { status: 400 });
    }

    if (cardAmount <= 0) {
      return Response.json({ error: "No payment amount specified" }, { status: 400 });
    }

    const appUrl =
      req.headers.get("origin") ||
      req.headers.get("referer")?.split("/").slice(0, 3).join("/") ||
      "https://app.base44.com";

    const reference = crypto.randomUUID();

    // Build Lenco payload — channels controls card vs mobile money
    const lencoPayload = {
      amount: cardAmount,
      reference,
      country: "zm",
      currency: "ZMW",
      email: user.email,
      name: user.full_name,
      callback_url: `${appUrl}/BuyerDashboard?payment=success`,
      cancel_url: `${appUrl}/Cart?payment=cancelled`,
      metadata: {
        buyer_email: user.email,
        buyer_name: user.full_name,
      },
    };

    // Use Lenco hosted checkout (works on all plans)
    const paymentRes = await fetch(`${LENCO_BASE_URL}/checkout`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LENCO_API_KEY}`,
        "Content-Type": "application/json",
        "accept": "application/json",
      },
      body: JSON.stringify(lencoPayload),
    });

    const paymentData = await paymentRes.json();
    console.log("Lenco checkout response:", JSON.stringify(paymentData));

    if (!paymentRes.ok || !paymentData.status) {
      const errMsg = paymentData?.message || "Failed to initialize Lenco payment";
      console.error("Lenco checkout error:", errMsg);
      throw new Error(errMsg);
    }

    const paymentUrl = paymentData?.data?.url || paymentData?.data?.authorization_url || paymentData?.data?.checkout_url || paymentData?.data?.link;

    if (!paymentUrl) {
      console.error("No payment URL in Lenco response:", JSON.stringify(paymentData));
      throw new Error("No payment URL returned from Lenco");
    }

    // Deduct wallet if applicable
    if (useWallet && walletAmount > 0) {
      const wallets = await base44.asServiceRole.entities.BuyerWallet.filter({ buyer_email: user.email });
      if (wallets.length > 0) {
        const wallet = wallets[0];
        if ((wallet.balance || 0) < walletAmount) {
          return Response.json({ error: "Insufficient wallet balance" }, { status: 400 });
        }
        await base44.asServiceRole.entities.BuyerWallet.update(wallet.id, {
          balance: (wallet.balance || 0) - walletAmount,
          total_spent: (wallet.total_spent || 0) + walletAmount,
        });
        await base44.asServiceRole.entities.WalletTransaction.create({
          buyer_email: user.email,
          type: "debit",
          amount: walletAmount,
          reason: "Partial payment (wallet + card)",
        });
      }
    }

    // Create pending order record
    await base44.asServiceRole.entities.Order.create({
      buyer_email: user.email,
      buyer_name: user.full_name,
      shop_id: "PENDING_PAYMENT",
      shop_name: "Payment Pending",
      items,
      total_amount: total,
      status: "pending",
      delivery_address,
      delivery_phone,
      notes: notes || "",
      payment_method,
      stripe_session_id: reference,
      coupon_code: coupon_code || "",
      discount_amount: discount_amount || 0,
      shipping_option: shippingOption,
      shipping_cost: shippingCost || 0,
      payout_status: "pending",
    });

    console.log(`Lenco payment initialized (${payment_method}): ${reference} for ${user.email}`);
    return Response.json({ url: paymentUrl, reference });
  } catch (error) {
    console.error("Lenco checkout error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});