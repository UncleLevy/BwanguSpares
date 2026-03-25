import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import { AwsClient } from 'npm:aws4fetch@1.0.20';

const ACCOUNT_ID = Deno.env.get("CF_R2_ACCOUNT_ID");
const ACCESS_KEY_ID = Deno.env.get("CF_R2_ACCESS_KEY_ID");
const SECRET_ACCESS_KEY = Deno.env.get("CF_R2_SECRET_ACCESS_KEY");
const BUCKET_NAME = Deno.env.get("CF_R2_BUCKET_NAME");

const R2_ENDPOINT = `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`;

const ENTITIES = [
  "Order", "Product", "Shop", "CartItem", "Review", "Notification",
  "PartsRequest", "Conversation", "Message", "Report", "BannedUser",
  "AuditLog", "TechnicianHireRequest", "Subscription", "ProductVariation",
  "Town", "Region", "Technician", "ShopWallet", "Payout", "BuyerWallet",
  "WalletTransaction", "Return", "ShippingRate", "LoyaltyPoints",
  "LoyaltyTransaction", "Appointment", "SupportTicket", "Vehicle",
  "WatchlistPart", "Courier", "Shipment", "Wishlist", "DiscountCode",
  "Campaign", "Customer", "Branch"
];

async function uploadToR2(aws, key, data) {
  const body = JSON.stringify(data, null, 2);
  const url = `${R2_ENDPOINT}/${BUCKET_NAME}/${key}`;
  const res = await aws.fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`R2 upload failed for ${key}: ${err}`);
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const aws = new AwsClient({
      accessKeyId: ACCESS_KEY_ID,
      secretAccessKey: SECRET_ACCESS_KEY,
      service: "s3",
      region: "auto",
    });

    const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const timestamp = new Date().toISOString();
    const results = [];

    for (const entity of ENTITIES) {
      try {
        const records = await base44.asServiceRole.entities[entity].list();
        const key = `backups/${date}/${entity}.json`;
        await uploadToR2(aws, key, { entity, count: records.length, backed_up_at: timestamp, records });
        console.log(`✅ Backed up ${entity}: ${records.length} records`);
        results.push({ entity, count: records.length, status: "ok" });
      } catch (err) {
        console.error(`❌ Failed to backup ${entity}:`, err.message);
        results.push({ entity, status: "error", error: err.message });
      }
    }

    // Write a manifest file
    const manifestKey = `backups/${date}/manifest.json`;
    await uploadToR2(aws, manifestKey, { date, backed_up_at: timestamp, entities: results });

    const success = results.filter(r => r.status === "ok").length;
    const failed = results.filter(r => r.status === "error").length;

    console.log(`Backup complete: ${success} succeeded, ${failed} failed`);
    return Response.json({ success: true, date, backed_up_at: timestamp, results });
  } catch (error) {
    console.error("Backup error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});