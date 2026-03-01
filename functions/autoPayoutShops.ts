import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"), { apiVersion: "2023-10-16" });
const ZMW_TO_USD = 0.038;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow both scheduled (no auth) and admin-triggered calls
    let isAdmin = false;
    try {
      const user = await base44.auth.me();
      isAdmin = user?.role === "admin";
    } catch (_) {
      // scheduled call — proceed with service role
    }

    console.log("[AutoPayout] Starting auto-payout check...");

    const wallets = await base44.asServiceRole.entities.ShopWallet.list("-created_date", 200);
    console.log(`[AutoPayout] Found ${wallets.length} wallets to check`);

    const results = [];

    for (const wallet of wallets) {
      const threshold = 500; // K500 default threshold
      const pending = wallet.pending_balance || 0;

      if (pending < threshold) {
        console.log(`[AutoPayout] Skipping ${wallet.shop_name}: K${pending} < K${threshold} threshold`);
        continue;
      }

      // Get the shop's Stripe account
      const shops = await base44.asServiceRole.entities.Shop.filter({ id: wallet.shop_id });
      const shop = shops[0];

      if (!shop) {
        console.warn(`[AutoPayout] Shop not found for wallet ${wallet.id}`);
        continue;
      }

      const shopThreshold = shop.payout_threshold || 500;
      if (pending < shopThreshold) {
        console.log(`[AutoPayout] Skipping ${shop.name}: K${pending} < shop threshold K${shopThreshold}`);
        continue;
      }

      if (!shop.stripe_account_id || shop.stripe_account_status !== "active") {
        console.log(`[AutoPayout] Skipping ${shop.name}: no active Stripe account (status: ${shop.stripe_account_status})`);
        continue;
      }

      console.log(`[AutoPayout] Processing payout for ${shop.name}: K${pending}`);

      const amountUsd = Math.round(pending * ZMW_TO_USD * 100); // cents
      if (amountUsd < 100) {
        console.warn(`[AutoPayout] Amount too small for ${shop.name}: $${(amountUsd/100).toFixed(2)}`);
        continue;
      }

      try {
        const transfer = await stripe.transfers.create({
          amount: amountUsd,
          currency: "usd",
          destination: shop.stripe_account_id,
          metadata: {
            shop_id: shop.id,
            shop_name: shop.name,
            amount_zmw: String(pending),
            trigger: "auto_threshold",
            base44_app_id: Deno.env.get("BASE44_APP_ID"),
          },
        });

        const newPaidOut = (wallet.total_paid_out || 0) + pending;
        await Promise.all([
          base44.asServiceRole.entities.Payout.create({
            shop_id: shop.id,
            shop_name: shop.name,
            owner_email: shop.owner_email,
            amount: pending,
            method: "stripe",
            reference: transfer.id,
            notes: `Auto-payout triggered at K${shopThreshold} threshold. USD: $${(amountUsd/100).toFixed(2)}`,
            status: "completed",
            processed_by: "system",
            processed_at: new Date().toISOString(),
          }),
          base44.asServiceRole.entities.ShopWallet.update(wallet.id, {
            total_paid_out: newPaidOut,
            pending_balance: 0,
          }),
        ]);

        console.log(`[AutoPayout] ✅ Success: ${shop.name} K${pending} → Transfer ${transfer.id}`);
        results.push({ shop: shop.name, status: "success", amount: pending, transfer_id: transfer.id });

      } catch (err) {
        console.error(`[AutoPayout] ❌ Failed for ${shop.name}:`, err.message);

        await base44.asServiceRole.entities.Payout.create({
          shop_id: shop.id,
          shop_name: shop.name,
          owner_email: shop.owner_email,
          amount: pending,
          method: "stripe",
          reference: null,
          notes: `Auto-payout FAILED: ${err.message}`,
          status: "failed",
          processed_by: "system",
          processed_at: new Date().toISOString(),
        });

        results.push({ shop: shop.name, status: "failed", error: err.message });
      }
    }

    console.log(`[AutoPayout] Done. Processed: ${results.length} payouts`);
    return Response.json({ success: true, processed: results.length, results });

  } catch (error) {
    console.error("[AutoPayout] Fatal error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});