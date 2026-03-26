import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } from 'npm:@aws-sdk/client-s3@3.540.0';
import { getSignedUrl } from 'npm:@aws-sdk/s3-request-presigner@3.540.0';

const getS3Client = () => new S3Client({
  region: 'auto',
  endpoint: Deno.env.get('CF_R2_FINANCE_ENDPOINT'),
  credentials: {
    accessKeyId: Deno.env.get('CF_R2_ACCESS_KEY_ID'),
    secretAccessKey: Deno.env.get('CF_R2_SECRET_ACCESS_KEY'),
  },
});

const BUCKET = Deno.env.get('CF_R2_FINANCE_BUCKET_NAME');

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { action } = body;
    const s3 = getS3Client();

    // Upload a financial document (JSON data or base64 file)
    if (action === 'upload') {
      const { key, content, contentType = 'application/json' } = body;

      if (!key || content === undefined) {
        return Response.json({ error: 'key and content are required' }, { status: 400 });
      }

      const bodyContent = typeof content === 'string' ? content : JSON.stringify(content);

      await s3.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: bodyContent,
        ContentType: contentType,
        Metadata: {
          uploaded_by: user.email,
          uploaded_at: new Date().toISOString(),
        },
      }));

      console.log(`Finance file uploaded: ${key} by ${user.email}`);
      return Response.json({ success: true, key });
    }

    // Generate a signed URL to securely download a financial document
    if (action === 'get_signed_url') {
      const { key, expiresIn = 300 } = body;

      if (!key) {
        return Response.json({ error: 'key is required' }, { status: 400 });
      }

      const signedUrl = await getSignedUrl(
        s3,
        new GetObjectCommand({ Bucket: BUCKET, Key: key }),
        { expiresIn }
      );

      return Response.json({ signed_url: signedUrl });
    }

    // List files in a folder/prefix
    if (action === 'list') {
      const { prefix = '', maxKeys = 100 } = body;

      let files = [];
      try {
        const result = await s3.send(new ListObjectsV2Command({
          Bucket: BUCKET,
          Prefix: prefix,
          MaxKeys: maxKeys,
        }));
        files = (result.Contents || []).map(obj => ({
          key: obj.Key,
          size: obj.Size,
          last_modified: obj.LastModified,
        }));
      } catch (err) {
        // R2 returns NoSuchKey on empty bucket/prefix — treat as empty list
        if (err.name !== 'NoSuchKey') throw err;
      }

      return Response.json({ files, count: files.length });
    }

    return Response.json({ error: 'Invalid action. Use: upload, get_signed_url, list' }, { status: 400 });

  } catch (error) {
    console.error('financeR2Upload error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});