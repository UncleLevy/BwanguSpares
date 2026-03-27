/**
 * archiveFinancialRecords
 *
 * Automatically archives completed financial records to Cloudflare R2 for
 * long-term storage and compliance. Runs on a schedule.
 *
 * Archives:
 *   - Payout records (completed or failed, older than 30 days)
 *   - WalletTransaction records (older than 30 days)
 *
 * R2 key format:
 *   payouts/YYYY/MM/payout-<id>.json
 *   wallet-transactions/YYYY/MM/txn-<id>.json
 *
 * After a successful upload to R2 we tag the Base44 record with
 * archived_at so we never re-archive the same record.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import { S3Client, PutObjectCommand } from 'npm:@aws-sdk/client-s3@3.540.0';

const getS3 = () => new S3Client({
  region: 'auto',
  endpoint: Deno.env.get('CF_R2_FINANCE_ENDPOINT'),
  credentials: {
    accessKeyId: Deno.env.get('CF_R2_ACCESS_KEY_ID'),
    secretAccessKey: Deno.env.get('CF_R2_SECRET_ACCESS_KEY'),
  },
});

const BUCKET = Deno.env.get('CF_R2_FINANCE_BUCKET_NAME');
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

async function uploadToR2(s3, key, data) {
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: JSON.stringify(data, null, 2),
    ContentType: 'application/json',
    Metadata: {
      archived_at: new Date().toISOString(),
      record_id: data.id || '',
    },
  }));
}

function r2Key(prefix, date, id) {
  const d = new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${prefix}/${yyyy}/${mm}/${prefix.replace('/', '-')}-${id}.json`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const cutoff = new Date(Date.now() - THIRTY_DAYS_MS).toISOString();
    const s3 = getS3();

    console.log(`[ArchiveFinance] Starting archive. Cutoff: ${cutoff}`);

    const results = { payouts: { archived: 0, skipped: 0, errors: 0 }, walletTxns: { archived: 0, skipped: 0, errors: 0 } };

    // ── 1. Archive Payouts ─────────────────────────────────────────────────────
    const payouts = await base44.asServiceRole.entities.Payout.list('-created_date', 500);
    const payoutsToArchive = payouts.filter(p => {
      if (p.archived_at) return false; // already archived
      if (!p.created_date) return false;
      const age = new Date(p.created_date);
      return age < new Date(cutoff) && (p.status === 'completed' || p.status === 'failed');
    });

    console.log(`[ArchiveFinance] Payouts to archive: ${payoutsToArchive.length}`);

    for (const payout of payoutsToArchive) {
      try {
        const key = r2Key('payouts', payout.created_date, payout.id);
        await uploadToR2(s3, key, { ...payout, _archived_at: new Date().toISOString() });

        await base44.asServiceRole.entities.Payout.update(payout.id, {
          archived_at: new Date().toISOString(),
          r2_key: key,
        });

        console.log(`[ArchiveFinance] ✅ Payout archived: ${payout.id} → ${key}`);
        results.payouts.archived++;
      } catch (err) {
        console.error(`[ArchiveFinance] ❌ Payout ${payout.id} failed:`, err.message);
        results.payouts.errors++;
      }
    }

    // ── 2. Archive Wallet Transactions ────────────────────────────────────────
    const walletTxns = await base44.asServiceRole.entities.WalletTransaction.list('-created_date', 500);
    const txnsToArchive = walletTxns.filter(t => {
      if (t.archived_at) return false;
      if (!t.created_date) return false;
      return new Date(t.created_date) < new Date(cutoff);
    });

    console.log(`[ArchiveFinance] WalletTransactions to archive: ${txnsToArchive.length}`);

    for (const txn of txnsToArchive) {
      try {
        const key = r2Key('wallet-transactions', txn.created_date, txn.id);
        await uploadToR2(s3, key, { ...txn, _archived_at: new Date().toISOString() });

        await base44.asServiceRole.entities.WalletTransaction.update(txn.id, {
          archived_at: new Date().toISOString(),
          r2_key: key,
        });

        console.log(`[ArchiveFinance] ✅ WalletTxn archived: ${txn.id} → ${key}`);
        results.walletTxns.archived++;
      } catch (err) {
        console.error(`[ArchiveFinance] ❌ WalletTxn ${txn.id} failed:`, err.message);
        results.walletTxns.errors++;
      }
    }

    console.log('[ArchiveFinance] Done.', JSON.stringify(results));
    return Response.json({ success: true, cutoff, results });

  } catch (error) {
    console.error('[ArchiveFinance] Fatal error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});