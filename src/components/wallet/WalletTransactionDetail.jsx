import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ArrowDownCircle, ArrowUpCircle, Hash, Calendar, CreditCard, ShoppingBag, FileText } from "lucide-react";
import { format } from "date-fns";

function maskAccount(email) {
  if (!email) return null;
  // Generate a pseudo account number from email hash
  const hash = email.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const digits = String(hash * 7919).padStart(16, "0").slice(0, 16);
  return `**** **** **** ${digits.slice(-4)}`;
}

function formatTransactionId(id) {
  if (!id) return "N/A";
  return id.toUpperCase().slice(0, 18);
}

export default function WalletTransactionDetail({ txn, open, onClose, userEmail }) {
  if (!txn) return null;

  const isCredit = txn.type === "credit";

  const rows = [
    {
      icon: Hash,
      label: "Transaction ID",
      value: formatTransactionId(txn.id),
      mono: true,
    },
    {
      icon: Calendar,
      label: "Date & Time",
      value: txn.created_date
        ? format(new Date(txn.created_date), "dd MMM yyyy, hh:mm a")
        : "—",
    },
    {
      icon: CreditCard,
      label: "Account / Reference",
      value: maskAccount(userEmail),
      mono: true,
    },
    {
      icon: ShoppingBag,
      label: "Related Order",
      value: txn.order_id ? `#${txn.order_id.slice(0, 8).toUpperCase()}` : "—",
      mono: !!txn.order_id,
    },
    {
      icon: FileText,
      label: "Description",
      value: txn.reason || "—",
    },
    {
      icon: ShoppingBag,
      label: "Shop",
      value: txn.shop_name || "—",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">Transaction Details</DialogTitle>
        </DialogHeader>

        {/* Amount banner */}
        <div className={`rounded-2xl p-5 flex flex-col items-center gap-2 ${isCredit ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-red-50 dark:bg-red-900/20"}`}>
          {isCredit
            ? <ArrowDownCircle className="w-8 h-8 text-emerald-500" />
            : <ArrowUpCircle className="w-8 h-8 text-red-500" />}
          <p className={`text-3xl font-bold ${isCredit ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
            {isCredit ? "+" : "-"}K{txn.amount?.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
          <Badge className={isCredit
            ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200"
            : "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-200"}>
            {isCredit ? "Credit" : "Debit"}
          </Badge>
        </div>

        {/* Detail rows */}
        <div className="space-y-0 divide-y divide-slate-100 dark:divide-slate-700">
          {rows.map(({ icon: Icon, label, value, mono }) => (
            <div key={label} className="flex items-start justify-between py-3 gap-4">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 min-w-0 shrink-0">
                <Icon className="w-3.5 h-3.5" />
                <span className="text-xs">{label}</span>
              </div>
              <span className={`text-xs text-right font-medium text-slate-800 dark:text-slate-200 break-all ${mono ? "font-mono" : ""}`}>
                {value}
              </span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}