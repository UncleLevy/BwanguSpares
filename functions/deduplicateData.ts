import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== "admin") {
      return Response.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const report = {
      shops: { duplicates: [], removed: 0 },
      towns: { duplicates: [], removed: 0 },
      regions: { duplicates: [], removed: 0 },
      stripe_accounts: { duplicates: [], removed: 0 },
    };

    // ── 1. DUPLICATE SHOPS (same owner_email + same name) ─────────────────
    {
      const shops = await base44.asServiceRole.entities.Shop.list("-created_date", 500);
      const seen = {};
      for (const shop of shops) {
        const key = `${shop.owner_email?.toLowerCase()}|${shop.name?.toLowerCase().trim()}`;
        if (seen[key]) {
          // Keep the oldest (first created), remove the newer duplicate
          report.shops.duplicates.push({ kept: seen[key].id, removed: shop.id, name: shop.name, owner: shop.owner_email });
          await base44.asServiceRole.entities.Shop.delete(shop.id);
          report.shops.removed++;
          console.log(`[Dedup] Removed duplicate shop: "${shop.name}" (${shop.id})`);
        } else {
          seen[key] = shop;
        }
      }
    }

    // ── 2. DUPLICATE TOWNS (same name + same region) ──────────────────────
    {
      const towns = await base44.asServiceRole.entities.Town.list("-created_date", 500);
      const seen = {};
      for (const town of towns) {
        const key = `${town.name?.toLowerCase().trim()}|${town.region_id || town.region_name?.toLowerCase().trim()}`;
        if (seen[key]) {
          report.towns.duplicates.push({ kept: seen[key].id, removed: town.id, name: town.name });
          await base44.asServiceRole.entities.Town.delete(town.id);
          report.towns.removed++;
          console.log(`[Dedup] Removed duplicate town: "${town.name}" (${town.id})`);
        } else {
          seen[key] = town;
        }
      }
    }

    // ── 3. DUPLICATE REGIONS (same name) ──────────────────────────────────
    {
      const regions = await base44.asServiceRole.entities.Region.list("-created_date", 200);
      const seen = {};
      for (const region of regions) {
        const key = region.name?.toLowerCase().trim();
        if (seen[key]) {
          report.regions.duplicates.push({ kept: seen[key].id, removed: region.id, name: region.name });
          await base44.asServiceRole.entities.Region.delete(region.id);
          report.regions.removed++;
          console.log(`[Dedup] Removed duplicate region: "${region.name}" (${region.id})`);
        } else {
          seen[key] = region;
        }
      }
    }

    // ── 4. DUPLICATE STRIPE ACCOUNTS (multiple shops with same stripe_account_id) ─
    {
      const shops = await base44.asServiceRole.entities.Shop.list("-created_date", 500);
      const stripeMap = {};
      for (const shop of shops) {
        if (!shop.stripe_account_id) continue;
        if (stripeMap[shop.stripe_account_id]) {
          // Remove stripe linkage from the duplicate (don't delete the shop)
          report.stripe_accounts.duplicates.push({
            stripe_account_id: shop.stripe_account_id,
            shop_kept: stripeMap[shop.stripe_account_id].name,
            shop_cleared: shop.name,
          });
          await base44.asServiceRole.entities.Shop.update(shop.id, {
            stripe_account_id: null,
            stripe_account_status: "not_connected",
          });
          report.stripe_accounts.removed++;
          console.log(`[Dedup] Cleared duplicate Stripe account ${shop.stripe_account_id} from shop "${shop.name}"`);
        } else {
          stripeMap[shop.stripe_account_id] = shop;
        }
      }
    }

    const totalRemoved = report.shops.removed + report.towns.removed + report.regions.removed + report.stripe_accounts.removed;
    console.log(`[Dedup] Done. Total removed/fixed: ${totalRemoved}`);

    return Response.json({ success: true, total_fixed: totalRemoved, report });

  } catch (error) {
    console.error("[Dedup] Error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});