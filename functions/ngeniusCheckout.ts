import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const NGENIUS_API_KEY = Deno.env.get("NGENIUS_API_KEY");
const NGENIUS_OUTLET_REF = Deno.env.get("NGENIUS_OUTLET_REF");
const NGENIUS_BASE_URL = "https://api-gateway.sandbox.ngenius-payments.com";

async function getAccessToken() {
  const res = await fetch(`${NGENIUS_BASE_URL}/identity/auth/access-token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/vnd.ni-identity.v1+json",
      "Authorization": `Basic ${NGENIUS_API_KEY}`,
    },
    body: JSON.stringify({ realmName: "ni" }),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error("N-Genius token error:", err);
    throw new Error("Failed to get N-Genius access token");
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

    // Step 1: Get access token
    const accessToken = await getAccessToken();

    // Step 2: Create order — amount in minor units (ZMW has 2 decimal places, multiply by 100)
    const amountMinor = Math.round(cardAmount * 100);

    const orderBody = {
      action: "PURCHASE",
      amount: {
        currencyCode: "ZMW",
        value: amountMinor,
      },
      emailAddress: user.email,
      merchantAttributes: {
        redirectUrl: `${appUrl}/BuyerDashboard?payment=success`,
        cancelUrl: `${appUrl}/Cart?payment=cancelled`,
        skipConfirmationPage: true,
      },
      description: `BwanguSpares order for ${user.full_name}`,
    };

    const orderRes = await fetch(
      `${NGENIUS_BASE_URL}/transactions/outlets/${NGENIUS_OUTLET_REF}/orders`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/vnd.ni-payment.v2+json",
          Accept: "application/vnd.ni-payment.v2+json",
        },
        body: JSON.stringify(orderBody),
      }
    );

    if (!orderRes.ok) {
      const err = await orderRes.text();
      console.error("N-Genius create order error:", err);
      throw new Error("Failed to create N-Genius payment order");
    }

    const orderData = await orderRes.json();
    const paymentUrl = orderData._links?.payment?.href;
    const orderRef = orderData.reference;

    if (!paymentUrl) {
      console.error("No payment URL in N-Genius response:", JSON.stringify(orderData));
      throw new Error("No payment URL returned from N-Genius");
    }

    // Step 3: Deduct wallet if applicable
    if (useWallet && walletAmount > 0) {
      const wallets = await base44.asServiceRole.entities.BuyerWallet.filter({
        buyer_email: user.email,
      });
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

    // Step 4: Create a pending order record (will be confirmed when buyer returns)
    await base44.asServiceRole.entities.Order.create({
      buyer_email: user.email,
      buyer_name: user.full_name,
      shop_id: "PENDING_PAYMENT",
      shop_name: "Payment Pending",
      items: items,
      total_amount: total,
      status: "pending",
      delivery_address,
      delivery_phone,
      notes: notes || "",
      payment_method: "card",
      stripe_session_id: orderRef, // reusing this field to store N-Genius order ref
      coupon_code: coupon_code || "",
      discount_amount: discount_amount || 0,
      shipping_option: shippingOption,
      shipping_cost: shippingCost || 0,
      payout_status: "pending",
    });

    console.log(`N-Genius order created: ${orderRef} for ${user.email}, redirecting to payment page`);
    return Response.json({ url: paymentUrl, orderRef });
  } catch (error) {
    console.error("N-Genius checkout error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});