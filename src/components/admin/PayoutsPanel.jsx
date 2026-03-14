import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, CheckCircle2, Clock, Store, Plus, Wallet, Zap, Link2, Eye } from "lucide-react";
import { toast } from "sonner";
import { usePagination } from "@/components/shared/usePagination";
import TablePagination from "@/components/shared/TablePagination";

export default function PayoutsPanel({ adminUser }) {
  const [wallets, setWallets] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payoutDialog, setPayoutDialog] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [form, setForm] = useState({ amount: "", method: "bank_transfer", reference: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [autoRunning, setAutoRunning] = useState(false);
  const [viewTransaction, setViewTransaction] = useState(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const [w, p] = await Promise.all([
      base44.entities.ShopWallet.list("-created_date", 100),
      base44.entities.Payout.list("-created_date", 100),
    ]);
    setWallets(w);
    setPayouts(p);
    setLoading(false);
  };

  const openPayoutDialog = (wallet) => {
    setSelectedWallet(wallet);
    setForm({ amount: String(wallet.pending_balance || ""), method: "bank_transfer", reference: "", notes: "" });
    setPayoutDialog(true);
  };

  const runAutoPayout = async () => {
    setAutoRunning(true);
    try {
      const res = await base44.functions.invoke("autoPayoutShops", {});
      const { processed, results } = res.data;
      if (processed === 0) {
        toast.info("No shops currently meet the payout threshold or have an active Stripe account.");
      } else {
        const success = results.filter(r => r.status === "success").length;
        const failed = results.filter(r => r.status === "failed").length;
        toast.success(`Auto-payout complete: ${success} succeeded, ${failed} failed.`);
      }
      load();
    } catch (e) {
      toast.error(e.message || "Auto-payout failed");
    }
    setAutoRunning(false);
  };

  const submitStripePayout = async () => {
    if (!form.amount || parseFloat(form.amount) <= 0) { toast.error("Enter a valid amount"); return; }
    const amount = parseFloat(form.amount);
    if (amount > selectedWallet.pending_balance) { toast.error("Amount exceeds pending balance"); return; }
    setSaving(true);
    try {
      const res = await base44.functions.invoke("stripeConnect", {
        action: "payout_shop",
        wallet_id: selectedWallet.id,
        amount_zmw: amount,
      });
      if (res.data.success) {
        toast.success(`Stripe payout of K${amount.toLocaleString()} sent to ${selectedWallet.shop_name}`);
        setPayoutDialog(false);
        load();
      } else {
        toast.error(res.data.error || "Payout failed");
      }
    } catch (e) {
      toast.error(e.message || "Stripe payout failed");
    }
    setSaving(false);
  };

  const submitPayout = async () => {
    if (!form.amount || parseFloat(form.amount) <= 0) { toast.error("Enter a valid amount"); return; }
    const amount = parseFloat(form.amount);
    if (amount > selectedWallet.pending_balance) { toast.error("Amount exceeds pending balance"); return; }
    setSaving(true);

    const now = new Date().toISOString();
    await base44.entities.Payout.create({
      shop_id: selectedWallet.shop_id,
      shop_name: selectedWallet.shop_name,
      owner_email: selectedWallet.owner_email,
      amount,
      method: form.method,
      reference: form.reference,
      notes: form.notes,
      status: "completed",
      processed_by: adminUser?.email,
      processed_at: now,
    });

    const newPaidOut = (selectedWallet.total_paid_out || 0) + amount;
    const newPending = Math.max(0, (selectedWallet.pending_balance || 0) - amount);
    await base44.entities.ShopWallet.update(selectedWallet.id, {
      total_paid_out: newPaidOut,
      pending_balance: newPending,
    });

    toast.success(`Payout of K${amount.toLocaleString()} recorded for ${selectedWallet.shop_name}`);
    setPayoutDialog(false);
    setSaving(false);
    load();
  };

  const payoutStatusColors = {
    pending: "bg-amber-50 text-amber-700",
    completed: "bg-emerald-50 text-emerald-700",
    failed: "bg-red-50 text-red-700",
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" /></div>;

  const totalPending = wallets.reduce((s, w) => s + (w.pending_balance || 0), 0);
  const totalPaidOut = wallets.reduce((s, w) => s + (w.total_paid_out || 0), 0);
  const totalFees = wallets.reduce((s, w) => s + (w.total_fees_deducted || 0), 0);

  const walletsPagination = usePagination(wallets, 15);
  const payoutsPagination = usePagination(payouts, 15);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Shop Payouts</h1>
        <Button onClick={runAutoPayout} disabled={autoRunning} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
          <Zap className="w-4 h-4" />
          {autoRunning ? "Running..." : "Run Auto-Payout"}
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-100 dark:border-slate-800">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600">K{totalPending.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              <p className="text-xs text-slate-500">Total Pending Payouts</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-100 dark:border-slate-800">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-600">K{totalPaidOut.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              <p className="text-xs text-slate-500">Total Paid Out</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-100 dark:border-slate-800">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">K{totalFees.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              <p className="text-xs text-slate-500">Platform Fees Collected</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Shop Wallets */}
      <Card className="border-slate-100 dark:border-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Wallet className="w-4 h-4 text-blue-600" /> Shop Wallets
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {wallets.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-sm">No shop wallets yet. Wallets are created automatically when shops earn from delivered orders.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-800">
                  <TableHead>Shop</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Total Earned</TableHead>
                  <TableHead>Fees ({"%"})</TableHead>
                  <TableHead>Paid Out</TableHead>
                  <TableHead>Pending</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {walletsPagination.paginatedItems.map(w => (
                  <TableRow key={w.id}>
                    <TableCell className="font-medium">
                      <div>{w.shop_name}</div>
                    </TableCell>
                     <TableCell className="text-sm text-slate-500">{w.owner_email}</TableCell>
                    <TableCell className="font-medium">K{(w.total_earned || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-sm text-amber-600">K{(w.total_fees_deducted || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({w.platform_fee_rate ?? 5}%)</TableCell>
                    <TableCell className="text-emerald-600 font-medium">K{(w.total_paid_out || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                    <TableCell>
                      <span className={`font-bold ${w.pending_balance > 0 ? 'text-blue-600' : 'text-slate-400'}`}>
                        K{(w.pending_balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1.5 flex-wrap">
                        <Button
                          size="sm"
                          disabled={!(w.pending_balance > 0)}
                          className="bg-blue-600 hover:bg-blue-700 h-8 gap-1 text-xs"
                          onClick={() => openPayoutDialog(w)}
                        >
                          <Plus className="w-3 h-3" /> Manual
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {wallets.length > 15 && (
            <TablePagination
              currentPage={walletsPagination.currentPage}
              totalItems={walletsPagination.totalItems}
              itemsPerPage={walletsPagination.itemsPerPage}
              onPageChange={walletsPagination.setCurrentPage}
            />
          )}
        </CardContent>
      </Card>

      {/* Payout History */}
      <Card className="border-slate-100 dark:border-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Store className="w-4 h-4 text-blue-600" /> Payout History
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {payouts.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-sm">No payouts recorded yet.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-800">
                  <TableHead>Date</TableHead>
                  <TableHead>Shop</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Processed By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payoutsPagination.paginatedItems.map(p => (
                  <TableRow key={p.id} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50" onClick={() => setViewTransaction(p)}>
                    <TableCell className="text-sm">{new Date(p.created_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</TableCell>
                    <TableCell className="font-medium">{p.shop_name}</TableCell>
                    <TableCell className="font-bold text-emerald-600">K{p.amount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                    <TableCell className="capitalize text-sm">{p.method?.replace('_', ' ')}</TableCell>
                    <TableCell className="font-mono text-xs">{p.reference || '—'}</TableCell>
                    <TableCell><Badge className={payoutStatusColors[p.status]}>{p.status}</Badge></TableCell>
                    <TableCell className="text-xs text-slate-500">{p.processed_by || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {payouts.length > 15 && (
            <TablePagination
              currentPage={payoutsPagination.currentPage}
              totalItems={payoutsPagination.totalItems}
              itemsPerPage={payoutsPagination.itemsPerPage}
              onPageChange={payoutsPagination.setCurrentPage}
            />
          )}
        </CardContent>
      </Card>

      {/* Payout Dialog */}
      <Dialog open={payoutDialog} onOpenChange={setPayoutDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Payout — {selectedWallet?.shop_name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 text-sm text-blue-700 dark:text-blue-300">
              Pending balance: <strong>K{(selectedWallet?.pending_balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
            </div>
            <div>
              <Label>Amount (ZMW) *</Label>
              <Input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="mt-1" placeholder="0.00" />
            </div>
            <div>
              <Label>Payment Method</Label>
              <Select value={form.method} onValueChange={v => setForm({ ...form, method: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Reference / Transaction No.</Label>
              <Input value={form.reference} onChange={e => setForm({ ...form, reference: e.target.value })} className="mt-1" placeholder="e.g. TXN-12345" />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="mt-1" rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayoutDialog(false)}>Cancel</Button>
            <Button onClick={submitPayout} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? "Saving..." : "Record Payout"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}