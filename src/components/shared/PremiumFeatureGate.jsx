import React, { useState } from "react";
import { Lock, Crown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function PremiumFeatureGate({ isUnlocked, children, featureName = "This feature" }) {
  const [showDialog, setShowDialog] = useState(false);

  if (isUnlocked) {
    return children;
  }

  return (
    <>
      <div
        onClick={() => setShowDialog(true)}
        className="relative cursor-pointer opacity-60 pointer-events-none"
      >
        {children}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/10 to-slate-900/30 rounded-2xl flex items-center justify-center backdrop-blur-sm pointer-events-auto">
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-2">
              <Lock className="w-7 h-7 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="text-sm font-semibold text-white">Premium Only</p>
            <p className="text-xs text-slate-200 mt-0.5">Upgrade to unlock</p>
          </div>
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-600" />
              Premium Feature
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
              <p className="font-semibold text-amber-900 dark:text-amber-300 mb-1">
                {featureName}
              </p>
              <p className="text-sm text-amber-800 dark:text-amber-400">
                This feature is only available on the Premium plan (K250/month).
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                Premium Features Include:
              </h4>
              <ul className="space-y-1.5 text-sm text-slate-700 dark:text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 dark:text-amber-400 font-bold mt-0.5">✓</span>
                  Advanced market insights & analytics
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 dark:text-amber-400 font-bold mt-0.5">✓</span>
                  Email campaigns & customer targeting
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 dark:text-amber-400 font-bold mt-0.5">✓</span>
                  Unlimited product listings
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 dark:text-amber-400 font-bold mt-0.5">✓</span>
                  API access & integrations
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 dark:text-amber-400 font-bold mt-0.5">✓</span>
                  24/7 priority support
                </li>
              </ul>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-800 dark:text-blue-400">
                <strong>Currently:</strong> You're on the{" "}
                <span className="font-semibold">Basic/Standard</span> plan.
                Upgrade to Premium to access all marketing and analytics tools.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Close
            </Button>
            <Button className="bg-amber-600 hover:bg-amber-700 gap-2">
              <Crown className="w-4 h-4" /> Upgrade Now
              <ArrowRight className="w-4 h-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}