/**
 * GCS Backup function — exports app entity data and uploads to GCS.
 * POST { entities?: string[] }  — list of entity names to back up (defaults to all key entities)
 * Admin only.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

async function getGCSAccessToken(serviceAccountJson) {
  const sa = JSON.parse(serviceAccountJson);
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/devstorage.read_write",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const encode = (obj) => btoa(JSON.stringify(obj)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const signingInput = `${encode(header)}.${encode(payload)}`;

  const pemContents = sa.private_key
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");
  const keyData = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8", keyData.buffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false, ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(signingInput)
  );
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

  return `${signingInput}.${sigB64}`;
}

async function uploadJsonToGCS(accessToken, bucket, filePath, data) {
  const body = JSON.stringify(data, null, 2);
  const encodedPath = encodeURIComponent(filePath);
  const res = await fetch(
    `https://storage.googleapis.com/upload/storage/v1/b/${bucket}/o?uploadType=media&name=${encodedPath}`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body,
    }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GCS upload failed for ${filePath}: ${res.status} ${text}`);
  }
  return `https://storage.googleapis.com/${bucket}/${encodedPath}`;
}

const DEFAULT_ENTITIES = [
  "Shop", "Product", "Order", "CartItem", "Review",
  "User", "Notification", "PartsRequest", "Conversation",
  "ShopWallet", "Payout", "BuyerWallet", "WalletTransaction",
  "Return", "Technician", "TechnicianHireRequest",
];

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Forbidden: Admin only" }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const entitiesToBackup = body.entities || DEFAULT_ENTITIES;

    const serviceAccountJson = Deno.env.get("GCS_SERVICE_ACCOUNT_JSON");
    const bucket = Deno.env.get("GCS_BUCKET_NAME");

    // Get JWT token for GCS
    const sa = JSON.parse(serviceAccountJson);
    const now = Math.floor(Date.now() / 1000);
    const headerB64 = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" })).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    const payloadB64 = btoa(JSON.stringify({
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/devstorage.read_write",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    })).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

    const signingInput = `${headerB64}.${payloadB64}`;
    const pemContents = sa.private_key.replace("-----BEGIN PRIVATE KEY-----", "").replace("-----END PRIVATE KEY-----", "").replace(/\s/g, "");
    const keyData = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
    const cryptoKey = await crypto.subtle.importKey("pkcs8", keyData.buffer, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
    const signatureBuf = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cryptoKey, new TextEncoder().encode(signingInput));
    const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signatureBuf))).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    const jwt = `${signingInput}.${sigB64}`;

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
    });
    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    if (!accessToken) throw new Error("Failed to get GCS access token: " + JSON.stringify(tokenData));

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const results = [];

    for (const entityName of entitiesToBackup) {
      try {
        const data = await base44.asServiceRole.entities[entityName].list("-created_date", 5000);
        const filePath = `backups/${timestamp}/${entityName}.json`;
        const url = await uploadJsonToGCS(accessToken, bucket, filePath, {
          entity: entityName,
          exported_at: new Date().toISOString(),
          exported_by: user.email,
          count: data.length,
          data,
        });
        console.log(`Backed up ${entityName}: ${data.length} records → ${filePath}`);
        results.push({ entity: entityName, count: data.length, url });
      } catch (e) {
        console.error(`Failed to backup ${entityName}:`, e.message);
        results.push({ entity: entityName, error: e.message });
      }
    }

    // Upload a manifest file
    const manifestPath = `backups/${timestamp}/_manifest.json`;
    await uploadJsonToGCS(accessToken, bucket, manifestPath, {
      backup_timestamp: timestamp,
      exported_by: user.email,
      entities: results,
    });

    const successCount = results.filter(r => !r.error).length;
    console.log(`Backup complete: ${successCount}/${entitiesToBackup.length} entities backed up to GCS`);

    return Response.json({
      success: true,
      timestamp,
      bucket,
      backed_up: successCount,
      total: entitiesToBackup.length,
      results,
    });

  } catch (error) {
    console.error("Backup error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});