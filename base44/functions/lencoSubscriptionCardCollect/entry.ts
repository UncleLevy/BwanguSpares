import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import * as jose from 'npm:jose@5.9.6';

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
      // Card details
      cardNumber,
      cardExpiryMonth,
      cardExpiryYear,
      cardCvv,
      // Billing
      billingStreet,
      billingCity,
      billingPostalCode,
      billingCountry,
      // Subscription
      amount,
      currency = "ZMW",
      tier = "premium",
    } = await req.json();

    if (!cardNumber || !cardExpiryMonth || !cardExpiryYear || !cardCvv) {
      return Response.json({ error: "Card details are required" }, { status: 400 });
    }

    if (!amount || amount <= 0) {
      return Response.json({ error: "Amount is required" }, { status: 400 });
    }

    // Step 1: Fetch RSA public key from Lenco
    const keyRes = await fetch(`${LENCO_BASE_URL}/encryption-key`, {
      headers: {
        "Authorization": `Bearer ${LENCO_API_KEY}`,
        "accept": "application/json",
      },
    });
    const keyData = await keyRes.json();
    console.log("Encryption key response:", JSON.stringify(keyData));

    if (!keyRes.ok || !keyData.status) {
      throw new Error(keyData.message || "Failed to fetch encryption key");
    }

    const jwkData = keyData.data;

    // Step 2: Build payload
    const reference = `BW-SUB-${Date.now()}-${crypto.randomUUID().replace(/-/g, "").slice(0, 8)}`;
    const nameParts = (user.full_name || "").split(" ");
    const firstName = nameParts[0] || "Customer";
    const lastName = nameParts.slice(1).join(" ") || "User";

    const payload = {
      reference,
      email: user.email,
      amount: String(amount),
      currency,
      bearer: "merchant",
      customer: {
        firstName,
        lastName,
      },
      billing: {
        streetAddress: billingStreet || "123 Main St",
        city: billingCity || "Lusaka",
        postalCode: billingPostalCode || "10101",
        country: billingCountry || "ZM",
      },
      card: {
        number: cardNumber.replace(/\s+/g, ""),
        expiryMonth: String(cardExpiryMonth).padStart(2, "0"),
        expiryYear: String(cardExpiryYear),
        cvv: String(cardCvv),
      },
    };

    // Step 3: Encrypt payload using JWE (RSA-OAEP-256 + A256GCM)
    const rsaPublicKey = await jose.importJWK(jwkData, "RSA-OAEP-256");
    const encryptedPayload = await new jose.CompactEncrypt(
      new TextEncoder().encode(JSON.stringify(payload))
    )
      .setProtectedHeader({
        alg: "RSA-OAEP-256",
        enc: "A256GCM",
        cty: "application/json",
        kid: jwkData.kid,
      })
      .encrypt(rsaPublicKey);

    // Step 4: Submit to Lenco card collection endpoint
    const cardRes = await fetch(`${LENCO_BASE_URL}/collections/card`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LENCO_API_KEY}`,
        "Content-Type": "application/json",
        "accept": "application/json",
      },
      body: JSON.stringify({ encryptedPayload }),
    });

    const cardData = await cardRes.json();
    console.log("Lenco subscription card collection response:", JSON.stringify(cardData));

    if (!cardRes.ok || !cardData.status) {
      const msg = cardData?.message || "Card payment initiation failed";
      console.error("Lenco card error:", msg);
      return Response.json({ error: msg }, { status: 400 });
    }

    const collectionData = cardData.data;
    const status = collectionData.status;

    // If 3DS required, return the redirect URL
    if (status === "3ds-auth-required") {
      const redirectUrl = cardData.data?.meta?.authorization?.redirect;
      return Response.json({
        success: true,
        status: "3ds-auth-required",
        redirectUrl,
        reference,
      });
    }

    // If immediate success
    if (status === "successful") {
      // Update subscription to premium
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

    return Response.json({
      success: true,
      status,
      reference,
      lencoReference: collectionData.lencoReference,
      message: cardData.message,
    });
  } catch (error) {
    console.error("lencoSubscriptionCardCollect error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});