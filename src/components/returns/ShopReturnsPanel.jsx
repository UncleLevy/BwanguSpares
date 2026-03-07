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
import { RotateCcw, CheckCircle2, XCircle, Package, PackageCheck } from "lucide-react";

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
  return_received: "Item Received – Awaiting Refund",
  refunded: "Refunded",
  rejected: "Rejected",
};

export default function ShopReturnsPanel({ shop }) {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [mode, setMode] = useState("review"); // "review" | "received"
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    if (!shop?.id) return;
    const data = await base44.entities.Return.filter({ shop_id: shop.id }, "-created_date", 50);
    setReturns(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [shop?.id]);

  const openReview = (r) => { setSelected(r); setMode("review"); setNotes(""); };
  const openReceived = (r) => { setSelected(r); setMode("received"); setNotes(""); };

  const handleDecision = async (decision) => {
    setSubmitting(true);
    const newStatus = decision === "approve" ? "approved" : "rejected";

    await base44.entities.Return.update(selected.id, {
      status: newStatus,
      approval_notes: notes,
    });

    await base44.entities.Notification.create({
      user_email: selected.buyer_email,
      type: "order_update",
      title: `Return Request ${decision === "approve" ? "Approved" : "Rejected"}`,
      message: decision === "approve"
        ? `Your return for ${selected.product_name} has been approved. Please send the item back to the shop. You will be refunded once the item is received and confirmed.`
        : `Your return request for ${selected.product_name} was rejected.${notes ? ` Reason: ${notes}` : ""}`,
      related_id: selected.order_id,
    });

    toast.success(`Return ${decision === "approve" ? "approved" : "rejected"}. ${decision === "approve" ? "Buyer notified to send item back." : ""}`);
    setSelected(null);
    setNotes("");
    load();
    setSubmitting(false);
  };

  const handleMarkReceived = async () => {
    setSubmitting(true);

    await base44.entities.Return.update(selected.id, {
      status: "return_received",
      received_notes: notes,
      received_at: new Date().toISOString(),
    });

    // Notify admin
    await base44.entities.Notification.create({
      user_email: "admin",
      type: "system_alert",
      title: "Return Item Received – Refund Pending",
      message: `Shop "${shop.name}" has confirmed receipt of returned item: ${selected.product_name} (Order #${selected.order_id?.slice(0,8)}). Please release the refund of K${(selected.refund_amount || 0).toFixed(2)} to the buyer.`,
      related_id: selected.id,
    });

    // Notify buyer
    await base44.entities.Notification.create({
      user_email: selected.buyer_email,
      type: "order_update",
      title: "Returned Item Received",
      message: `The shop has confirmed receipt of your returned item (${selected.product_name}). Your refund of K${(selected.refund_amount || 0).toFixed(2)} is now being processed by the admin.`,
      related_id: selected.order_id,
    });

    toast.success("Item marked as received. Admin has been notified to release the refund.");
    setSelected(null);
    setNotes("");
    load();
    setSubmitting(false);
  };

  if (loading) return <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Return Requests</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
        Approve or reject returns. Once the item is physically received back, mark it as received — the admin will then release the refund to the buyer.
      </p>

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
                      <Badge className={STATUS_STYLES[r.status] || STATUS_STYLES.pending}>
                        {STATUS_LABELS[r.status] || r.status}
                      </Badge>
                    </div>
                    {r.status === "pending" && (
                      <Button size="sm" onClick={() => openReview(r)} className="bg-blue-600 hover:bg-blue-700 text-xs">
                        Review
                      </Button>
                    )}
                    {r.status === "approved" && (
                      <Button size="sm" onClick={() => openReceived(r)} className="bg-purple-600 hover:bg-purple-700 text-xs gap-1.5">
                        <PackageCheck className="w-3.5 h-3.5" /> Mark Received
                      </Button>
                    )}
                  </div>
                </div>
                {r.approval_notes && (
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-medium">Shop notes:</span> {r.approval_notes}
                  </div>
                )}
                {r.status === "return_received" && (
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 text-xs text-purple-600 dark:text-purple-400">
                    <span className="font-medium">Item received.</span> Awaiting admin to release the refund of K{(r.refund_amount || 0).toFixed(2)}.
                  </div>
                )}
                {r.status === "refunded" && r.refund_released_at && (
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 text-xs text-emerald-600 dark:text-emerald-400">
                    <span className="font-medium">Refund released</span> on {new Date(r.refund_released_at).toLocaleDateString()}.
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Review Dialog */}
      <Dialog open={!!selected && mode === "review"} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Review Return Request</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 space-y-2 text-sm">
                <p><span className="text-slate-500">Product:</span> <span className="font-medium">{selected.product_name}</span></p>
                <p><span className="text-slate-500">Buyer:</span> <span className="font-medium">{selected.buyer_name}</span></p>
                <p><span className="text-slate-500">Reason:</span> {REASON_LABELS[selected.reason] || selected.reason}</p>
                {selected.description && <p><span className="text-slate-500">Details:</span> {selected.description}</p>}
                <p><span className="text-slate-500">Refund Amount:</span> <span className="font-bold text-emerald-600">K{(selected.refund_amount || 0).toFixed(2)}</span></p>
              </div>
              <div>
                <Label>Notes for buyer (optional)</Label>
                <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Instructions, rejection reason, etc." className="mt-1" rows={3} />
              </div>
              <div className="text-xs text-blue-800 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
                <strong>Approving</strong> tells the buyer to send the item back. The refund of K{(selected.refund_amount || 0).toFixed(2)} will only be released <strong>after you confirm receipt</strong> of the item and the admin approves it.
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
            <Button variant="outline" onClick={() => handleDecision("reject")} disabled={submitting} className="border-red-200 text-red-600 hover:bg-red-50 gap-1.5">
              <XCircle className="w-4 h-4" /> Reject
            </Button>
            <Button onClick={() => handleDecision("approve")} disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700 gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> {submitting ? "Processing..." : "Approve Return"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark Received Dialog */}
      <Dialog open={!!selected && mode === "received"} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PackageCheck className="w-4 h-4 text-purple-600" /> Confirm Item Received
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 space-y-2 text-sm">
                <p><span className="text-slate-500">Product:</span> <span className="font-medium">{selected.product_name}</span></p>
                <p><span className="text-slate-500">Buyer:</span> <span className="font-medium">{selected.buyer_name}</span></p>
                <p><span className="text-slate-500">Refund to be released:</span> <span className="font-bold text-emerald-600">K{(selected.refund_amount || 0).toFixed(2)}</span></p>
              </div>
              <div>
                <Label>Notes (optional)</Label>
                <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Condition of returned item, any notes..." className="mt-1" rows={3} />
              </div>
              <div className="text-xs text-purple-800 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border border-purple-100 dark:border-purple-800">
                Confirming receipt will notify the <strong>admin to release the refund</strong> of K{(selected.refund_amount || 0).toFixed(2)} to the buyer's wallet. The funds are held securely until released.
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
            <Button onClick={handleMarkReceived} disabled={submitting} className="bg-purple-600 hover:bg-purple-700 gap-1.5">
              <PackageCheck className="w-4 h-4" /> {submitting ? "Confirming..." : "Confirm Receipt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}