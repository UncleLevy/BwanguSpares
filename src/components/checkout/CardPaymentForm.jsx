import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Lock } from "lucide-react";

function formatCardNumber(val) {
  return val.replace(/\D/g, "").replace(/(.{4})/g, "$1 ").trim().slice(0, 19);
}

function formatExpiry(val) {
  const digits = val.replace(/\D/g, "").slice(0, 4);
  if (digits.length >= 3) return digits.slice(0, 2) + "/" + digits.slice(2);
  return digits;
}

export default function CardPaymentForm({ value, onChange }) {
  const handleCardNumber = (e) => {
    onChange({ ...value, cardNumber: formatCardNumber(e.target.value) });
  };

  const handleExpiry = (e) => {
    const formatted = formatExpiry(e.target.value);
    const [month, year] = formatted.split("/");
    onChange({
      ...value,
      expiry: formatted,
      cardExpiryMonth: month || "",
      cardExpiryYear: year ? "20" + year : "",
    });
  };

  const handleCvv = (e) => {
    onChange({ ...value, cardCvv: e.target.value.replace(/\D/g, "").slice(0, 4) });
  };

  return (
    <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-2 mb-1">
        <Lock className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-xs text-slate-500 dark:text-slate-400">Encrypted & secure — powered by Lenco</span>
      </div>

      <div>
        <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Card Number *</Label>
        <div className="relative mt-1">
          <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <Input
            value={value.cardNumber || ""}
            onChange={handleCardNumber}
            placeholder="1234 5678 9012 3456"
            className="pl-9 rounded-xl font-mono tracking-wide"
            inputMode="numeric"
            maxLength={19}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Expiry *</Label>
          <Input
            value={value.expiry || ""}
            onChange={handleExpiry}
            placeholder="MM/YY"
            className="mt-1 rounded-xl font-mono"
            inputMode="numeric"
            maxLength={5}
          />
        </div>
        <div>
          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">CVV *</Label>
          <Input
            value={value.cardCvv || ""}
            onChange={handleCvv}
            placeholder="123"
            type="password"
            className="mt-1 rounded-xl font-mono"
            inputMode="numeric"
            maxLength={4}
          />
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Billing City</Label>
        <Input
          value={value.billingCity || ""}
          onChange={e => onChange({ ...value, billingCity: e.target.value })}
          placeholder="e.g. Lusaka"
          className="mt-1 rounded-xl"
        />
      </div>
    </div>
  );
}