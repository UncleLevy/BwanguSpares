import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { RotateCcw, Banknote, Package, Clock, CheckCircle2 } from "lucide-react";

const REASON_LABELS = {
  defective: "Defective / Not working",
  not_as_described: "Not as described",
  damaged: "Damaged during delivery",
  incorrect_item: "Incorrect item sent",
  unsatisfied: "Not satisfied",
  other: "Other",
};

const STATUS_STYLES = {
  pending: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
  approved: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
  return_received: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
  refunded: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
  rejected: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
};

const STATUS_LABELS = {
  pending: "Pending Review",
  approved: "Approved – Awaiting Return",
  return_received: "Item Received – Release Refund",
  refunded: "Refunded",
  rejected: "Rejected",
};

export default function AdminReturnsPanel({ adminUser }) {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState("return_received");

  const load = async () => {
    const data = await base44.entities.Return.list("-created_date", 100);
    setReturns(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleReleaseRefund = async () => {
    setSubmitting(true);
    const amount = selected.refund_amount || 0;
    const buyerEmail = selected.buyer_email;

    // Credit buyer wallet
    const wallets = await base44.entities.BuyerWallet.filter({ buyer_email: buyerEmail });
    if (wallets.length > 0) {
      const w = wallets[0];
      await base44.entities.BuyerWallet.update(w.id, {
        balance: (w.balance || 0) + amount,
        total_credited: (w.total_credited || 0) + amount,
      });
    } else {
      await base44.entities.BuyerWallet.create({
        buyer_email: buyerEmail,
        buyer_name: selected.buyer_name || buyerEmail,
        balance: amount,
        total_credited: amount,
        total_spent: 0,
      });
    }

    const txn = await base44.entities.WalletTransaction.create({
      buyer_email: buyerEmail,
      type: "credit",
      amount,
      reason: `Return refund released – ${selected.product_name} (Order #${selected.order_id?.slice(0,8)})`,
      order_id: selected.order_id,
      shop_name: selected.shop_name,
    });

    // Mark return as refunded
    await base44.entities.Return.update(selected.id, {
      status: "refunded",
      refund_id: txn.id,
      refund_released_at: new Date().toISOString(),
      refund_released_by: adminUser?.email || "admin",
    });

    // Notify buyer
    await base44.entities.Notification.create({
      user_email: buyerEmail,
      type: "order_update",
      title: "Refund Released",
      message: `Your refund of K${amount.toFixed(2)} for the return of ${selected.product_name} has been credited to your wallet.`,
      related_id: selected.order_id,
    });

    toast.success(`Refund of K${amount.toFixed(2)} released to ${selected.buyer_name}'s wallet.`);
    setSelected(null);
    setNotes("");
    load();
    setSubmitting(false);
  };

  const filtered = filter === "all" ? returns : returns.filter(r => r.status === filter);

  const pendingRefundCount = returns.filter(r => r.status === "return_received").length;

  if (loading) return <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Returns & Refunds</h1>
        {pendingRefundCount > 0 && (
          <Badge className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm px-3 py-1">
            {pendingRefundCount} awaiting refund release
          </Badge>
        )}
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
        Manage held refunds. Refunds are released only after the shop confirms item receipt.
      </p>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {[
          { key: "return_received", label: "Awaiting Refund" },
          { key: "pending", label: "Pending" },
          { key: "approved", label: "Approved" },
          { key: "refunded", label: "Refunded" },
          { key: "rejected", label: "Rejected" },
          { key: "all", label: "All" },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              filter === tab.key
                ? "bg-blue-600 text-white"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            {tab.label}
            {tab.key === "return_received" && pendingRefundCount > 0 && (
              <span className="ml-1.5 bg-white/30 rounded-full px-1">{pendingRefundCount}</span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <RotateCcw className="w-14 h-14 text-slate-200 dark:text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400">No returns in this category</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => (
            <Card key={r.id} className={`border-slate-100 dark:border-slate-700 dark:bg-slate-900 ${r.status === "return_received" ? "ring-2 ring-purple-300 dark:ring-purple-700" : ""}`}>
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${r.status === "return_received" ? "bg-purple-100 dark:bg-purple-900/30" : "bg-orange-100 dark:bg-orange-900/30"}`}>
                      {r.status === "return_received"
                        ? <Banknote className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        : <Package className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                      }
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{r.product_name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Buyer: <span className="font-medium">{r.buyer_name}</span>
                        <span className="mx-1.5">·</span>
                        Shop: <span className="font-medium">{r.shop_name}</span>
                        <span className="mx-1.5">·</span>
                        Order #{r.order_id?.slice(0,8)}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        <span className="font-medium">Reason:</span> {REASON_LABELS[r.reason] || r.reason}
                        <span className="mx-1.5">·</span>
                        {new Date(r.created_date).toLocaleDateString()}
                      </p>
                      {r.received_notes && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 italic">
                          Shop note: "{r.received_notes}"
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">K{(r.refund_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                      <Badge className={STATUS_STYLES[r.status] || STATUS_STYLES.pending}>
                        {STATUS_LABELS[r.status] || r.status}
                      </Badge>
                    </div>
                    {r.status === "return_received" && (
                      <Button
                        size="sm"
                        onClick={() => { setSelected(r); setNotes(""); }}
                        className="bg-purple-600 hover:bg-purple-700 text-xs gap-1.5"
                      >
                        <Banknote className="w-3.5 h-3.5" /> Release Refund
                      </Button>
                    )}
                  </div>
                </div>
                {r.status === "refunded" && r.refund_released_at && (
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Refund released on {new Date(r.refund_released_at).toLocaleDateString()} by {r.refund_released_by || "admin"}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Release Refund Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Banknote className="w-4 h-4 text-purple-600" /> Release Refund to Buyer
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 space-y-2 text-sm">
                <p><span className="text-slate-500">Product:</span> <span className="font-medium">{selected.product_name}</span></p>
                <p><span className="text-slate-500">Buyer:</span> <span className="font-medium">{selected.buyer_name}</span></p>
                <p><span className="text-slate-500">Shop:</span> <span className="font-medium">{selected.shop_name}</span></p>
                <p><span className="text-slate-500">Order:</span> #{selected.order_id?.slice(0,8)}</p>
                <p><span className="text-slate-500">Refund Amount:</span> <span className="font-bold text-emerald-600 text-base">K{(selected.refund_amount || 0).toFixed(2)}</span></p>
                {selected.received_notes && (
                  <p><span className="text-slate-500">Shop notes:</span> {selected.received_notes}</p>
                )}
              </div>
              <div className="text-xs text-purple-800 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border border-purple-100 dark:border-purple-800">
                The shop has <strong>confirmed receipt</strong> of the returned item. Releasing the refund will credit <strong>K{(selected.refund_amount || 0).toFixed(2)}</strong> directly to <strong>{selected.buyer_name}'s wallet</strong>.
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
            <Button onClick={handleReleaseRefund} disabled={submitting} className="bg-purple-600 hover:bg-purple-700 gap-1.5">
              <Banknote className="w-4 h-4" /> {submitting ? "Releasing..." : "Release Refund"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}