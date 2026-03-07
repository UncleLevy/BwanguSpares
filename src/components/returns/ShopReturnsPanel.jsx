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
import { RotateCcw, CheckCircle2, XCircle, Package } from "lucide-react";

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
  approved: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
  rejected: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
  refunded: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
};

export default function ShopReturnsPanel({ shop }) {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    if (!shop?.id) return;
    const data = await base44.entities.Return.filter({ shop_id: shop.id }, "-created_date", 50);
    setReturns(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [shop?.id]);

  const handleDecision = async (returnItem, decision) => {
    setSubmitting(true);
    const newStatus = decision === "approve" ? "approved" : "rejected";

    await base44.entities.Return.update(returnItem.id, {
      status: newStatus,
      approval_notes: notes,
    });

    // If approved, credit the buyer's wallet with the refund amount
    if (decision === "approve") {
      const amount = returnItem.refund_amount || 0;
      const buyerEmail = returnItem.buyer_email;

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
          buyer_name: returnItem.buyer_name || buyerEmail,
          balance: amount,
          total_credited: amount,
          total_spent: 0,
        });
      }

      await base44.entities.WalletTransaction.create({
        buyer_email: buyerEmail,
        type: "credit",
        amount,
        reason: `Return approved – ${returnItem.product_name} (Order #${returnItem.order_id?.slice(0,8)})`,
        order_id: returnItem.order_id,
        shop_name: shop.name,
      });

      // Update Return status to refunded
      await base44.entities.Return.update(returnItem.id, { status: "refunded", refund_id: returnItem.id });
    }

    // Notify buyer
    await base44.entities.Notification.create({
      user_email: returnItem.buyer_email,
      type: "order_update",
      title: `Return Request ${newStatus === "approved" ? "Approved" : "Rejected"}`,
      message: decision === "approve"
        ? `Your return for ${returnItem.product_name} has been approved. K${(returnItem.refund_amount || 0).toFixed(2)} has been credited to your wallet.`
        : `Your return request for ${returnItem.product_name} was rejected. ${notes ? `Reason: ${notes}` : ""}`,
      related_id: returnItem.order_id,
    });

    toast.success(`Return ${decision === "approve" ? "approved & refund issued" : "rejected"} successfully.`);
    setSelected(null);
    setNotes("");
    load();
    setSubmitting(false);
  };

  if (loading) return <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">Return Requests</h1>

      {returns.length === 0 ? (
        <div className="text-center py-20">
          <RotateCcw className="w-14 h-14 text-slate-200 dark:text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400">No return requests yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {returns.map(r => (
            <Card key={r.id} className="border-slate-100 dark:border-slate-700 dark:bg-slate-900">
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
                      <Package className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{r.product_name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        By <span className="font-medium">{r.buyer_name}</span>
                        <span className="mx-1.5">·</span>
                        Order #{r.order_id?.slice(0,8)}
                        <span className="mx-1.5">·</span>
                        {new Date(r.created_date).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        <span className="font-medium">Reason:</span> {REASON_LABELS[r.reason] || r.reason}
                      </p>
                      {r.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 italic">"{r.description}"</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">K{(r.refund_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                      <Badge className={STATUS_STYLES[r.status] || STATUS_STYLES.pending}>{r.status}</Badge>
                    </div>
                    {r.status === "pending" && (
                      <Button
                        size="sm"
                        onClick={() => { setSelected(r); setNotes(""); }}
                        className="bg-blue-600 hover:bg-blue-700 text-xs"
                      >
                        Review
                      </Button>
                    )}
                  </div>
                </div>
                {r.approval_notes && r.status !== "pending" && (
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-medium">Shop notes:</span> {r.approval_notes}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Review Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Review Return Request</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 space-y-2 text-sm">
                <p><span className="text-slate-500 dark:text-slate-400">Product:</span> <span className="font-medium text-slate-900 dark:text-slate-100">{selected.product_name}</span></p>
                <p><span className="text-slate-500 dark:text-slate-400">Buyer:</span> <span className="font-medium text-slate-900 dark:text-slate-100">{selected.buyer_name}</span></p>
                <p><span className="text-slate-500 dark:text-slate-400">Reason:</span> {REASON_LABELS[selected.reason] || selected.reason}</p>
                <p><span className="text-slate-500 dark:text-slate-400">Description:</span> {selected.description}</p>
                <p><span className="text-slate-500 dark:text-slate-400">Refund Amount:</span> <span className="font-bold text-emerald-600">K{(selected.refund_amount || 0).toFixed(2)}</span></p>
              </div>

              <div>
                <Label>Notes (optional)</Label>
                <Textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Add a note to the buyer (e.g. reason for rejection, instructions for return)..."
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div className="text-xs text-slate-500 dark:text-slate-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
                If you <strong>approve</strong>, K{(selected.refund_amount || 0).toFixed(2)} will be automatically credited to the buyer's wallet.
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
            <Button
              variant="outline"
              onClick={() => handleDecision(selected, "reject")}
              disabled={submitting}
              className="border-red-200 text-red-600 hover:bg-red-50 gap-1.5"
            >
              <XCircle className="w-4 h-4" /> Reject
            </Button>
            <Button
              onClick={() => handleDecision(selected, "approve")}
              disabled={submitting}
              className="bg-emerald-600 hover:bg-emerald-700 gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" /> {submitting ? "Processing..." : "Approve & Refund"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}