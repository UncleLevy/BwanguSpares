import React, { useState } from "react";
import { Lock, Crown, ArrowRight, Sparkles, Zap, TrendingUp, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function PremiumFeatureGate({ isUnlocked, children, featureName = "This feature" }) {
  const [showDialog, setShowDialog] = useState(false);
  const navigate = useNavigate();

  if (isUnlocked) {
    return children;
  }

  const handleUpgrade = () => {
    setShowDialog(false);
    navigate(createPageUrl("ShopDashboard") + "?view=shop_info&upgrade=true");
  };

  return (
    <>
      <div
        onClick={() => setShowDialog(true)}
        className="relative cursor-pointer opacity-50 pointer-events-none"
      >
        {children}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/40 via-slate-900/50 to-slate-900/60 rounded-2xl flex items-center justify-center backdrop-blur-md pointer-events-auto">
          <div className="text-center">
            <div className="relative inline-flex mb-4">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full blur-lg opacity-50 animate-pulse" />
              <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <Lock className="w-8 h-8 text-white" />
              </div>
            </div>
            <p className="text-base font-bold text-white">Premium Only</p>
            <p className="text-sm text-slate-200 mt-1">Unlock exclusive features</p>
          </div>
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Crown className="w-6 h-6 text-amber-500" />
              Upgrade to Premium
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            {/* Feature Being Locked */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 rounded-xl border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-blue-900 dark:text-blue-300">{featureName}</p>
                  <p className="text-sm text-blue-800 dark:text-blue-400 mt-0.5">
                    Available exclusively on the Premium plan (K250/month)
                  </p>
                </div>
              </div>
            </div>

            {/* Premium Benefits Grid */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wide text-slate-500 dark:text-slate-400">
                What Premium Includes
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-start gap-2 mb-1.5">
                    <TrendingUp className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">Market Insights</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Advanced analytics & trends</p>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-start gap-2 mb-1.5">
                    <Mail className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">Campaigns</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Email & customer targeting</p>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-start gap-2 mb-1.5">
                    <Zap className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">Unlimited Listings</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Sell unlimited products</p>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-start gap-2 mb-1.5">
                    <Crown className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">Priority Support</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">24/7 dedicated help</p>
                </div>
              </div>
            </div>

            {/* Pricing Summary */}
            <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/15 dark:to-orange-900/15 rounded-xl border border-amber-200 dark:border-amber-800">
              <div className="flex items-baseline justify-between">
                <div>
                  <p className="text-xs text-amber-800 dark:text-amber-400 font-semibold uppercase">Premium Plan</p>
                  <p className="text-3xl font-bold text-amber-900 dark:text-amber-300 mt-1">K250<span className="text-sm">/month</span></p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-amber-800 dark:text-amber-400 font-semibold">Auto-renews monthly</p>
                  <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">Cancel anytime</p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDialog(false)} className="flex-1">
              Maybe Later
            </Button>
            <Button 
              onClick={handleUpgrade}
              className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white gap-2 font-semibold"
            >
              <Crown className="w-4 h-4" /> 
              Upgrade Now
              <ArrowRight className="w-4 h-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}