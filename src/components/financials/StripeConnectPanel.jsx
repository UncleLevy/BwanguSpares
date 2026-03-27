import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function StripeConnectPanel({ shop, onShopUpdate }) {
  return (
    <Card className="border-slate-200 dark:border-slate-700 dark:bg-slate-900">
      <CardContent className="p-5 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Payment Gateway Not Configured</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Stripe has been removed. A new Zambia-compatible payment gateway will be configured soon. Payouts are currently processed manually by the admin team.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}