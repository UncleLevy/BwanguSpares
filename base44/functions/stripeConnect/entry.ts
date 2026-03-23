import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"), { apiVersion: "2023-10-16" });

// ZMW to USD conversion rate (approximate - update as needed)
const ZMW_TO_USD = 0.038;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { action } = body;

    // ── Create onboarding link for a shop ──────────────────────────────────
    if (action === "create_onboarding_link") {
      const { shop_id, return_url, refresh_url } = body;

      const shops = await base44.entities.Shop.filter({ id: shop_id });
      const shop = shops[0];
      if (!shop) return Response.json({ error: "Shop not found" }, { status: 404 });

      // Verify the user owns this shop
      if (shop.owner_email !== user.email && user.role !== "admin") {
        return Response.json({ error: "Forbidden" }, { status: 403 });
      }

      let accountId = shop.stripe_account_id;

      // Create a new Stripe Connect account if not already connected
      if (!accountId) {
        const account = await stripe.accounts.create({
          type: "express",
          email: shop.owner_email,
          metadata: { shop_id, shop_name: shop.name },
        });
        accountId = account.id;
        await base44.entities.Shop.update(shop_id, {
          stripe_account_id: accountId,
          stripe_account_status: "onboarding",
        });
        console.log(`[StripeConnect] Created account ${accountId} for shop ${shop.name}`);
      }

      const link = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: refresh_url || return_url,
        return_url: return_url,
        type: "account_onboarding",
      });

      return Response.json({ url: link.url, account_id: accountId });
    }

    // ── Check account status ───────────────────────────────────────────────
    if (action === "check_account_status") {
      const { shop_id } = body;
      const shops = await base44.entities.Shop.filter({ id: shop_id });
      const shop = shops[0];
      if (!shop?.stripe_account_id) {
        return Response.json({ status: "not_connected" });
      }

      const account = await stripe.accounts.retrieve(shop.stripe_account_id);
      const status = account.charges_enabled && account.payouts_enabled ? "active" : "restricted";

      await base44.entities.Shop.update(shop_id, { stripe_account_status: status });
      console.log(`[StripeConnect] Account ${shop.stripe_account_id} status: ${status}`);

      return Response.json({ status, details_submitted: account.details_submitted, payouts_enabled: account.payouts_enabled });
    }

    // ── Manual payout to a specific shop ──────────────────────────────────
    if (action === "payout_shop") {
      if (user.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });

      const { wallet_id, amount_zmw } = body;
      const wallets = await base44.asServiceRole.entities.ShopWallet.filter({ id: wallet_id });
      const wallet = wallets[0];
      if (!wallet) return Response.json({ error: "Wallet not found" }, { status: 404 });

      const shops = await base44.asServiceRole.entities.Shop.filter({ id: wallet.shop_id });
      const shop = shops[0];

      if (!shop?.stripe_account_id) {
        return Response.json({ error: "Shop has no linked Stripe account" }, { status: 400 });
      }

      const result = await executeStripePayout(base44, stripe, wallet, shop, amount_zmw, user.email);
      return Response.json(result);
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });

  } catch (error) {
    console.error("[StripeConnect] Error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function executeStripePayout(base44client, stripeClient, wallet, shop, amountZmw, triggeredBy = "system") {
  const amountUsd = Math.round(amountZmw * ZMW_TO_USD * 100); // cents

  if (amountUsd < 100) {
    console.warn(`[StripeConnect] Payout amount too small for ${shop.name}: $${(amountUsd/100).toFixed(2)} USD`);
    return { success: false, error: "Amount too small for payout (min $1 USD)" };
  }

  console.log(`[StripeConnect] Initiating payout of K${amountZmw} (~$${(amountUsd/100).toFixed(2)}) to ${shop.name} (${shop.stripe_account_id})`);

  // First transfer from platform to connected account
  let transfer;
  try {
    transfer = await stripeClient.transfers.create({
      amount: amountUsd,
      currency: "usd",
      destination: shop.stripe_account_id,
      metadata: {
        shop_id: shop.id,
        shop_name: shop.name,
        amount_zmw: String(amountZmw),
        base44_app_id: Deno.env.get("BASE44_APP_ID"),
      },
    });
    console.log(`[StripeConnect] Transfer created: ${transfer.id}`);
  } catch (err) {
    console.error(`[StripeConnect] Transfer failed for ${shop.name}:`, err.message);
    await base44client.asServiceRole.entities.Payout.create({
      shop_id: shop.id,
      shop_name: shop.name,
      owner_email: shop.owner_email,
      amount: amountZmw,
      method: "stripe",
      reference: null,
      notes: `Auto Stripe payout FAILED: ${err.message}`,
      status: "failed",
      processed_by: triggeredBy,
      processed_at: new Date().toISOString(),
    });
    return { success: false, error: err.message };
  }

  // Record successful payout
  const newPaidOut = (wallet.total_paid_out || 0) + amountZmw;
  const newPending = Math.max(0, (wallet.pending_balance || 0) - amountZmw);

  await Promise.all([
    base44client.asServiceRole.entities.Payout.create({
      shop_id: shop.id,
      shop_name: shop.name,
      owner_email: shop.owner_email,
      amount: amountZmw,
      method: "stripe",
      reference: transfer.id,
      notes: `Stripe Connect transfer. USD equivalent: $${(amountUsd / 100).toFixed(2)}`,
      status: "completed",
      processed_by: triggeredBy,
      processed_at: new Date().toISOString(),
    }),
    base44client.asServiceRole.entities.ShopWallet.update(wallet.id, {
      total_paid_out: newPaidOut,
      pending_balance: newPending,
    }),
  ]);

  console.log(`[StripeConnect] Payout complete for ${shop.name}. Transfer: ${transfer.id}`);
  return { success: true, transfer_id: transfer.id, amount_zmw: amountZmw, amount_usd: amountUsd / 100 };
}