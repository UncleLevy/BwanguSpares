/**
 * GCS Upload function — uploads a file to both Cloudflare R2 and Google Cloud Storage.
 * POST with multipart/form-data: { file: File, path?: string }
 * Returns: { r2_url, gcs_url, path }
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

  // Import private key
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

  const jwt = `${signingInput}.${sigB64}`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });
  const tokenData = await tokenRes.json();
  return tokenData.access_token;
}

async function uploadToR2(fileBuffer, contentType, filePath) {
  const accountId = Deno.env.get("CF_R2_ACCOUNT_ID");
  const bucketName = Deno.env.get("CF_R2_BUCKET_NAME");
  const accessKey = Deno.env.get("CF_R2_ACCESS_KEY_ID");
  const secretKey = Deno.env.get("CF_R2_SECRET_ACCESS_KEY");

  const url = `https://${accountId}.r2.cloudflarestorage.com/${bucketName}/${filePath}`;

  // AWS Signature V4 for R2
  const now = new Date();
  const dateStr = now.toISOString().replace(/[:-]|\.\d{3}/g, "").substring(0, 8);
  const timeStr = now.toISOString().replace(/[:-]|\.\d{3}/g, "").substring(0, 15) + "Z";
  const region = "auto";
  const service = "s3";

  const hash = async (data) => {
    const buf = typeof data === "string" ? new TextEncoder().encode(data) : data;
    const hashBuf = await crypto.subtle.digest("SHA-256", buf);
    return Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, "0")).join("");
  };

  const hmac = async (key, data) => {
    const k = typeof key === "string" ? new TextEncoder().encode(key) : key;
    const cryptoKey = await crypto.subtle.importKey("raw", k, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const sig = await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(data));
    return new Uint8Array(sig);
  };

  const payloadHash = await hash(fileBuffer);
  const canonicalHeaders = `content-type:${contentType}\nhost:${accountId}.r2.cloudflarestorage.com\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${timeStr}\n`;
  const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";
  const canonicalRequest = `PUT\n/${bucketName}/${filePath}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
  const credentialScope = `${dateStr}/${region}/${service}/aws4_request`;
  const stringToSign = `AWS4-HMAC-SHA256\n${timeStr}\n${credentialScope}\n${await hash(canonicalRequest)}`;

  const signingKey = await hmac(
    await hmac(await hmac(await hmac(`AWS4${secretKey}`, dateStr), region), service),
    "aws4_request"
  );
  const cryptoKey2 = await crypto.subtle.importKey("raw", signingKey, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signatureBuf = await crypto.subtle.sign("HMAC", cryptoKey2, new TextEncoder().encode(stringToSign));
  const signature = Array.from(new Uint8Array(signatureBuf)).map(b => b.toString(16).padStart(2, "0")).join("");

  const authHeader = `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": contentType,
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": timeStr,
      "Authorization": authHeader,
    },
    body: fileBuffer,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`R2 upload failed: ${res.status} ${text}`);
  }

  return `https://${accountId}.r2.cloudflarestorage.com/${bucketName}/${filePath}`;
}

async function uploadToGCS(fileBuffer, contentType, filePath) {
  const bucket = Deno.env.get("GCS_BUCKET_NAME");
  const serviceAccountJson = Deno.env.get("GCS_SERVICE_ACCOUNT_JSON");
  const accessToken = await getGCSAccessToken(serviceAccountJson);

  const encodedPath = encodeURIComponent(filePath);
  const uploadUrl = `https://storage.googleapis.com/upload/storage/v1/b/${bucket}/o?uploadType=media&name=${encodedPath}`;

  const res = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": contentType,
    },
    body: fileBuffer,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GCS upload failed: ${res.status} ${text}`);
  }

  return `https://storage.googleapis.com/${bucket}/${encodedPath}`;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("file");
    const customPath = formData.get("path");

    if (!file) return Response.json({ error: "No file provided" }, { status: 400 });

    const fileBuffer = await file.arrayBuffer();
    const contentType = file.type || "application/octet-stream";
    const ext = file.name?.split(".").pop() || "bin";
    const filePath = customPath || `uploads/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    console.log(`Uploading file: ${filePath} (${contentType}, ${fileBuffer.byteLength} bytes)`);

    const [r2Url, gcsUrl] = await Promise.all([
      uploadToR2(fileBuffer, contentType, filePath),
      uploadToGCS(fileBuffer, contentType, filePath),
    ]);

    console.log(`Upload success — R2: ${r2Url}, GCS: ${gcsUrl}`);
    return Response.json({ r2_url: r2Url, gcs_url: gcsUrl, path: filePath });

  } catch (error) {
    console.error("Upload error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});