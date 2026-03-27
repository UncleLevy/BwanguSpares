import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const ACCOUNT_ID = Deno.env.get("CF_R2_ACCOUNT_ID");
const ACCESS_KEY_ID = Deno.env.get("CF_R2_ACCESS_KEY_ID");
const SECRET_ACCESS_KEY = Deno.env.get("CF_R2_SECRET_ACCESS_KEY");
const BUCKET_NAME = Deno.env.get("CF_R2_BUCKET_NAME");

// AWS S3-compatible signing for Cloudflare R2
async function sign(key, msg) {
  const cryptoKey = await crypto.subtle.importKey(
    "raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(msg)));
}

async function getSignatureKey(key, dateStamp, region, service) {
  const kDate = await sign(new TextEncoder().encode("AWS4" + key), dateStamp);
  const kRegion = await sign(kDate, region);
  const kService = await sign(kRegion, service);
  return await sign(kService, "aws4_request");
}

function toHex(buf) {
  return Array.from(buf).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function sha256Hex(data) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(data));
  return toHex(new Uint8Array(buf));
}

async function uploadToR2(key, body) {
  const endpoint = `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`;
  const region = "auto";
  const service = "s3";
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "").slice(0, 15) + "Z";
  const dateStamp = amzDate.slice(0, 8);
  const host = `${ACCOUNT_ID}.r2.cloudflarestorage.com`;
  const payloadHash = await sha256Hex(body);

  const canonicalHeaders = `host:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
  const signedHeaders = "host;x-amz-content-sha256;x-amz-date";
  const canonicalUri = `/${BUCKET_NAME}/${key}`;
  const canonicalRequest = `PUT\n${canonicalUri}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;

  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n${await sha256Hex(canonicalRequest)}`;
  const signingKey = await getSignatureKey(SECRET_ACCESS_KEY, dateStamp, region, service);
  const signature = toHex(await sign(signingKey, stringToSign));

  const authHeader = `AWS4-HMAC-SHA256 Credential=${ACCESS_KEY_ID}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const res = await fetch(`${endpoint}${canonicalUri}`, {
    method: "PUT",
    headers: {
      "Authorization": authHeader,
      "x-amz-date": amzDate,
      "x-amz-content-sha256": payloadHash,
      "Content-Type": "application/json",
    },
    body,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`R2 upload failed for ${key}: ${err}`);
  }
}

const ENTITIES = [
  "Order", "Product", "Shop", "CartItem", "Review", "Notification",
  "PartsRequest", "Conversation", "Message", "Report", "BannedUser",
  "AuditLog", "TechnicianHireRequest", "Subscription", "ProductVariation",
  "Town", "Region", "Technician", "ShopWallet", "Payout", "BuyerWallet",
  "WalletTransaction", "Return", "ShippingRate", "LoyaltyPoints",
  "LoyaltyTransaction", "Appointment", "SupportTicket", "Vehicle",
  "WatchlistPart", "Courier", "Shipment", "DiscountCode", "Wishlist",
  "Customer", "Branch", "Campaign"
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const results = { success: [], failed: [] };

    for (const entity of ENTITIES) {
      try {
        const data = await base44.asServiceRole.entities[entity].list();
        const key = `backups/${timestamp}/${entity}.json`;
        await uploadToR2(key, JSON.stringify(data, null, 2));
        results.success.push(entity);
        console.log(`Backed up ${entity}: ${data.length} records`);
      } catch (err) {
        results.failed.push({ entity, error: err.message });
        console.error(`Failed to backup ${entity}:`, err.message);
      }
    }

    // Write a manifest file
    const manifest = { timestamp, ...results };
    await uploadToR2(`backups/${timestamp}/manifest.json`, JSON.stringify(manifest, null, 2));

    console.log(`Backup complete. Success: ${results.success.length}, Failed: ${results.failed.length}`);
    return Response.json({ ok: true, timestamp, ...results });
  } catch (error) {
    console.error("Backup error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});