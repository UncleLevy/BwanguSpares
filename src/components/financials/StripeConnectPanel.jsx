import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExternalLink, CheckCircle2, AlertCircle, Link2, RefreshCw, Settings } from "lucide-react";
import { toast } from "sonner";

export default function StripeConnectPanel({ shop, onShopUpdate }) {
  const [status, setStatus] = useState(shop?.stripe_account_status || "not_connected");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [threshold, setThreshold] = useState(shop?.payout_threshold || 500);
  const [savingThreshold, setSavingThreshold] = useState(false);

  useEffect(() => {
    if (shop?.stripe_account_id && shop?.stripe_account_status === "onboarding") {
      checkStatus();
    }
  }, [shop?.id]);

  const checkStatus = async () => {
    if (!shop?.stripe_account_id) return;
    setChecking(true);
    try {
      const res = await base44.functions.invoke("stripeConnect", {
        action: "check_account_status",
        shop_id: shop.id,
      });
      setStatus(res.data.status);
      if (onShopUpdate) onShopUpdate({ ...shop, stripe_account_status: res.data.status });
    } catch (e) {
      toast.error("Could not check account status");
    }
    setChecking(false);
  };

  const startOnboarding = async () => {
    setLoading(true);
    try {
      const currentUrl = window.location.href;
      const res = await base44.functions.invoke("stripeConnect", {
        action: "create_onboarding_link",
        shop_id: shop.id,
        return_url: currentUrl,
        refresh_url: currentUrl,
      });
      window.open(res.data.url, "_blank");
      toast.info("Complete the Stripe onboarding in the new tab, then click 'Refresh Status'.");
    } catch (e) {
      toast.error(e.message || "Failed to create onboarding link");
    }
    setLoading(false);
  };

  const saveThreshold = async () => {
    if (!threshold || threshold < 100) { toast.error("Minimum threshold is K100"); return; }
    setSavingThreshold(true);
    await base44.entities.Shop.update(shop.id, { payout_threshold: Number(threshold) });
    toast.success("Payout threshold updated");
    if (onShopUpdate) onShopUpdate({ ...shop, payout_threshold: Number(threshold) });
    setSavingThreshold(false);
  };

  const statusConfig = {
    not_connected: { label: "Not Connected", color: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400", icon: AlertCircle },
    onboarding: { label: "Onboarding Pending", color: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400", icon: AlertCircle },
    active: { label: "Active", color: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400", icon: CheckCircle2 },
    restricted: { label: "Restricted", color: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400", icon: AlertCircle },
  };

  const cfg = statusConfig[status] || statusConfig.not_connected;
  const Icon = cfg.icon;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
        <Link2 className="w-5 h-5 text-blue-600" /> Stripe Connect — Automated Payouts
      </h2>

      <Card className="border-slate-100 dark:border-slate-700 dark:bg-slate-900">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Icon className={`w-5 h-5 ${status === "active" ? "text-emerald-600" : status === "restricted" ? "text-red-500" : "text-amber-500"}`} />
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Account Status</p>
                {shop?.stripe_account_id && (
                  <p className="text-xs text-slate-400 font-mono">{shop.stripe_account_id}</p>
                )}
              </div>
            </div>
            <Badge className={cfg.color}>{cfg.label}</Badge>
          </div>

          <div className="flex gap-2 flex-wrap">
            {status === "not_connected" && (
              <Button onClick={startOnboarding} disabled={loading} className="bg-blue-600 hover:bg-blue-700 gap-2">
                <ExternalLink className="w-4 h-4" />
                {loading ? "Preparing..." : "Connect Stripe Account"}
              </Button>
            )}
            {(status === "onboarding" || status === "restricted") && (
              <>
                <Button onClick={startOnboarding} disabled={loading} variant="outline" className="gap-2">
                  <ExternalLink className="w-4 h-4" />
                  {loading ? "Preparing..." : "Continue Onboarding"}
                </Button>
                <Button onClick={checkStatus} disabled={checking} variant="outline" className="gap-2">
                  <RefreshCw className={`w-4 h-4 ${checking ? "animate-spin" : ""}`} />
                  Refresh Status
                </Button>
              </>
            )}
            {status === "active" && (
              <Button onClick={checkStatus} disabled={checking} variant="outline" size="sm" className="gap-2">
                <RefreshCw className={`w-4 h-4 ${checking ? "animate-spin" : ""}`} />
                Refresh Status
              </Button>
            )}
          </div>

          {status === "active" && (
            <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-3 text-sm text-emerald-700 dark:text-emerald-300">
              ✅ Your Stripe account is active. Payouts will be automatically transferred when your pending balance reaches the threshold below.
            </div>
          )}

          {status === "not_connected" && (
            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 text-sm text-blue-700 dark:text-blue-300">
              Connect your Stripe account to receive automated payouts directly to your bank when your wallet balance exceeds the threshold.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Threshold Setting */}
      <Card className="border-slate-100 dark:border-slate-700 dark:bg-slate-900">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Settings className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Auto-Payout Threshold</p>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">When your pending balance reaches this amount, a payout is automatically initiated.</p>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Label className="text-xs text-slate-500 dark:text-slate-400">Threshold (ZMW)</Label>
              <Input
                type="number"
                min="100"
                value={threshold}
                onChange={e => setThreshold(e.target.value)}
                className="mt-1"
                placeholder="500"
              />
            </div>
            <Button onClick={saveThreshold} disabled={savingThreshold} className="mt-5 bg-blue-600 hover:bg-blue-700">
              {savingThreshold ? "Saving..." : "Save"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}