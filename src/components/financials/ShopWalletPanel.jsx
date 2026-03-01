import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, ArrowDownCircle, Clock, CheckCircle2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import StripeConnectPanel from "@/components/financials/StripeConnectPanel";

export default function ShopWalletPanel({ shop: initialShop, orders }) {
  const [shop, setShop] = useState(initialShop);
  const [wallet, setWallet] = useState(null);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!shop?.id) return;
    (async () => {
      // Sync wallet from delivered orders
      const deliveredOrders = orders.filter(o => o.status === "delivered" && o.payment_method === "stripe");
      const totalEarned = deliveredOrders.reduce((s, o) => s + (o.total_amount || 0), 0);

      let wallets = await base44.entities.ShopWallet.filter({ shop_id: shop.id });
      let w = wallets[0];

      const feeRate = w?.platform_fee_rate ?? 5;
      const fees = totalEarned * (feeRate / 100);
      const netEarned = totalEarned - fees;
      const paidOutAmount = w?.total_paid_out || 0;
      const pending = Math.max(0, netEarned - paidOutAmount);

      if (!w) {
        w = await base44.entities.ShopWallet.create({
          shop_id: shop.id,
          shop_name: shop.name,
          owner_email: shop.owner_email,
          total_earned: netEarned,
          total_paid_out: 0,
          pending_balance: pending,
          platform_fee_rate: 5,
          total_fees_deducted: fees,
        });
      } else {
        await base44.entities.ShopWallet.update(w.id, {
          total_earned: netEarned,
          pending_balance: pending,
          total_fees_deducted: fees,
        });
        w = { ...w, total_earned: netEarned, pending_balance: pending, total_fees_deducted: fees };
      }

      setWallet(w);
      const p = await base44.entities.Payout.filter({ shop_id: shop.id }, "-created_date", 20);
      setPayouts(p);
      setLoading(false);
    })();
  }, [initialShop?.id, orders]);

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" /></div>;

  const payoutStatusColors = {
    pending: "bg-amber-50 text-amber-700",
    completed: "bg-emerald-50 text-emerald-700",
    failed: "bg-red-50 text-red-700",
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Wallet & Earnings</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-100 dark:border-slate-800">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">K{(wallet?.total_earned || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              <p className="text-xs text-slate-500">Total Earned (Net)</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 dark:border-slate-800">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">K{(wallet?.pending_balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              <p className="text-xs text-slate-500">Pending Payout</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 dark:border-slate-800">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">K{(wallet?.total_paid_out || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              <p className="text-xs text-slate-500">Total Paid Out</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 dark:border-slate-800">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">K{(wallet?.total_fees_deducted || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              <p className="text-xs text-slate-500">Platform Fee ({wallet?.platform_fee_rate ?? 5}%)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stripe Connect */}
      <StripeConnectPanel shop={shop} onShopUpdate={setShop} />

      {/* Info note */}
      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-sm text-blue-700 dark:text-blue-300">
        💡 Earnings are calculated from <strong>delivered Stripe orders</strong>. A platform fee of <strong>{wallet?.platform_fee_rate ?? 5}%</strong> is deducted. Connect your Stripe account above to receive automated payouts.
      </div>

      {/* Payout History */}
      <Card className="border-slate-100 dark:border-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ArrowDownCircle className="w-4 h-4 text-blue-600" /> Payout History
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {payouts.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-sm">No payouts yet.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-800">
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payouts.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="text-sm">{new Date(p.created_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</TableCell>
                    <TableCell className="font-semibold text-emerald-600">K{p.amount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                    <TableCell className="capitalize text-sm">{p.method?.replace('_', ' ')}</TableCell>
                    <TableCell className="font-mono text-xs">{p.reference || '—'}</TableCell>
                    <TableCell><Badge className={payoutStatusColors[p.status]}>{p.status}</Badge></TableCell>
                    <TableCell className="text-xs text-slate-500">{p.notes || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}