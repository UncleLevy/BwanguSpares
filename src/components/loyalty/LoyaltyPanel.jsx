import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { Star, Gift, TrendingUp, Award, Zap, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { createPageUrl } from "@/utils";

const TIERS = {
  bronze:   { label: "Bronze",   color: "text-amber-700",  bg: "bg-amber-50",   border: "border-amber-200",  min: 0,    max: 500,   next: "silver",   icon: "🥉" },
  silver:   { label: "Silver",   color: "text-slate-600",  bg: "bg-slate-50",   border: "border-slate-200",  min: 500,  max: 1500,  next: "gold",     icon: "🥈" },
  gold:     { label: "Gold",     color: "text-yellow-600", bg: "bg-yellow-50",  border: "border-yellow-200", min: 1500, max: 3500,  next: "platinum", icon: "🥇" },
  platinum: { label: "Platinum", color: "text-blue-700",   bg: "bg-blue-50",    border: "border-blue-200",   min: 3500, max: 3500,  next: null,       icon: "💎" },
};

const REWARDS = [
  { id: "r50",   points: 100,  discount: 50,  label: "K50 Discount",   description: "Get K50 off your next order", icon: "🎁" },
  { id: "r150",  points: 300,  discount: 150, label: "K150 Discount",  description: "Get K150 off your next order", icon: "💰" },
  { id: "r400",  points: 750,  discount: 400, label: "K400 Discount",  description: "Get K400 off your next order", icon: "🔥" },
  { id: "r1000", points: 1800, discount: 1000, label: "K1000 Discount", description: "Big reward for loyal customers", icon: "⭐" },
];

function getTier(totalEarned) {
  if (totalEarned >= 3500) return "platinum";
  if (totalEarned >= 1500) return "gold";
  if (totalEarned >= 500)  return "silver";
  return "bronze";
}

export default function LoyaltyPanel({ user }) {
  const [loyalty, setLoyalty] = useState(null);
  const [txns, setTxns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [redeemDialog, setRedeemDialog] = useState(false);
  const [selectedReward, setSelectedReward] = useState(null);
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    if (user?.email) loadData();
  }, [user]);

  const loadData = async () => {
    const [accounts, transactions] = await Promise.all([
      base44.entities.LoyaltyPoints.filter({ buyer_email: user.email }),
      base44.entities.LoyaltyTransaction.filter({ buyer_email: user.email }, "-created_date", 30),
    ]);
    setLoyalty(accounts[0] || null);
    setTxns(transactions);
    setLoading(false);
  };

  const handleRedeem = async () => {
    if (!selectedReward || !loyalty) return;
    if (loyalty.points_balance < selectedReward.points) {
      toast.error("Not enough points");
      return;
    }
    setRedeeming(true);
    const newBalance = loyalty.points_balance - selectedReward.points;
    const newRedeemed = (loyalty.total_redeemed || 0) + selectedReward.points;

    await Promise.all([
      base44.entities.LoyaltyPoints.update(loyalty.id, {
        points_balance: newBalance,
        total_redeemed: newRedeemed,
      }),
      base44.entities.LoyaltyTransaction.create({
        buyer_email: user.email,
        type: "redeem",
        points: selectedReward.points,
        reason: `Redeemed for ${selectedReward.label}`,
        discount_amount: selectedReward.discount,
      }),
      // Credit the wallet with the discount amount
      (async () => {
        const wallets = await base44.entities.BuyerWallet.filter({ buyer_email: user.email });
        if (wallets.length > 0) {
          const w = wallets[0];
          await base44.entities.BuyerWallet.update(w.id, {
            balance: (w.balance || 0) + selectedReward.discount,
            total_credited: (w.total_credited || 0) + selectedReward.discount,
          });
        } else {
          await base44.entities.BuyerWallet.create({
            buyer_email: user.email,
            buyer_name: user.full_name,
            balance: selectedReward.discount,
            total_credited: selectedReward.discount,
            total_spent: 0,
          });
        }
        await base44.entities.WalletTransaction.create({
          buyer_email: user.email,
          type: "credit",
          amount: selectedReward.discount,
          reason: `Loyalty reward: ${selectedReward.label}`,
        });
      })(),
    ]);

    await loadData();
    setRedeemDialog(false);
    setSelectedReward(null);
    setRedeeming(false);
    toast.success(`🎉 Reward redeemed! K${selectedReward.discount} added to your wallet.`);
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
    </div>
  );

  const tier = TIERS[loyalty?.tier || "bronze"];
  const nextTier = tier.next ? TIERS[tier.next] : null;
  const totalEarned = loyalty?.total_earned || 0;
  const pointsBalance = loyalty?.points_balance || 0;
  const progressToNext = nextTier
    ? Math.min(100, ((totalEarned - tier.min) / (nextTier.min - tier.min)) * 100)
    : 100;
  const pointsToNext = nextTier ? Math.max(0, nextTier.min - totalEarned) : 0;

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Loyalty Rewards</h1>

      {/* Main points card */}
      <Card className={`border-2 ${tier.border} overflow-hidden`}>
        <div className={`${tier.bg} px-6 pt-6 pb-4`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{tier.icon}</span>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Tier</p>
                <p className={`text-lg font-bold ${tier.color}`}>{tier.label} Member</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Points Balance</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-800">{pointsBalance.toLocaleString()}</p>
            </div>
          </div>

          {nextTier && (
            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>{tier.label}</span>
                <span>{pointsToNext > 0 ? `${pointsToNext.toLocaleString()} pts to ${nextTier.label}` : `${nextTier.label} reached!`}</span>
              </div>
              <Progress value={progressToNext} className="h-2" />
            </div>
          )}
          {!nextTier && (
            <p className="text-sm font-medium text-blue-700 flex items-center gap-1.5">
              <Award className="w-4 h-4" /> You've reached the highest tier! 💎
            </p>
          )}
        </div>

        <CardContent className="px-6 py-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{totalEarned.toLocaleString()}</p>
              <p className="text-xs text-slate-400">Total Earned</p>
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{(loyalty?.total_redeemed || 0).toLocaleString()}</p>
              <p className="text-xs text-slate-400">Total Redeemed</p>
            </div>
            <div>
              <p className="text-xl font-bold text-emerald-600">{pointsBalance.toLocaleString()}</p>
              <p className="text-xs text-slate-400">Available</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* How points work */}
      <Card className="border-slate-100 dark:border-slate-700">
        <CardContent className="p-5">
          <h2 className="font-semibold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" /> How to Earn Points
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-slate-600 dark:text-slate-400">
            <div className="flex items-start gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <ShoppingCart className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
              <div><p className="font-medium text-slate-800 dark:text-slate-200">Make a Purchase</p><p className="text-xs mt-0.5">Earn 1 point per K1 spent</p></div>
            </div>
            <div className="flex items-start gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <Star className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <div><p className="font-medium text-slate-800 dark:text-slate-200">Leave a Review</p><p className="text-xs mt-0.5">+50 bonus points per review</p></div>
            </div>
            <div className="flex items-start gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <TrendingUp className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <div><p className="font-medium text-slate-800 dark:text-slate-200">Tier Bonuses</p><p className="text-xs mt-0.5">Higher tiers earn 1.5× – 2× points</p></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rewards */}
      <div>
        <h2 className="font-semibold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
          <Gift className="w-5 h-5 text-blue-600" /> Available Rewards
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {REWARDS.map(reward => {
            const canRedeem = pointsBalance >= reward.points;
            return (
              <Card key={reward.id} className={`border transition-all ${canRedeem ? "border-blue-200 hover:shadow-md" : "border-slate-100 opacity-60"}`}>
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{reward.icon}</span>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{reward.label}</p>
                      <p className="text-xs text-slate-400">{reward.description}</p>
                      <Badge variant="outline" className="text-[10px] mt-1">{reward.points.toLocaleString()} pts required</Badge>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    disabled={!canRedeem}
                    onClick={() => { setSelectedReward(reward); setRedeemDialog(true); }}
                    className={canRedeem ? "bg-blue-600 hover:bg-blue-700 shrink-0" : "shrink-0"}
                  >
                    Redeem
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Transaction History */}
      <Card className="border-slate-100 dark:border-slate-700">
        <CardContent className="p-5">
          <h2 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">Points History</h2>
          {txns.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No transactions yet. Start shopping to earn points!</p>
          ) : (
            <div className="space-y-2">
              {txns.map(txn => (
                <div key={txn.id} className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-700 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{txn.reason}</p>
                    <p className="text-xs text-slate-400">{new Date(txn.created_date).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-sm font-bold ${txn.type === "earn" ? "text-emerald-600" : "text-blue-600"}`}>
                    {txn.type === "earn" ? "+" : "-"}{txn.points.toLocaleString()} pts
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Redeem Confirm Dialog */}
      <Dialog open={redeemDialog} onOpenChange={setRedeemDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redeem Reward</DialogTitle>
            <DialogDescription>
              You are about to redeem <strong>{selectedReward?.points.toLocaleString()} points</strong> for a <strong>{selectedReward?.label}</strong>. The K{selectedReward?.discount} will be credited to your wallet instantly.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-sm text-blue-700 dark:text-blue-300">
            Points after redemption: <strong>{(pointsBalance - (selectedReward?.points || 0)).toLocaleString()}</strong>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRedeemDialog(false)}>Cancel</Button>
            <Button onClick={handleRedeem} disabled={redeeming} className="bg-blue-600 hover:bg-blue-700">
              {redeeming ? "Redeeming..." : "Confirm Redemption"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}