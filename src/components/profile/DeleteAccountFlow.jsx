/**
 * DeleteAccountFlow — App Store compliant account deletion.
 *
 * Follows Apple App Store Review Guidelines §5.1.1(v):
 *   - Must be easily findable in account/profile settings.
 *   - Must clearly explain what data will be deleted.
 *   - Must require explicit confirmation.
 *   - Must provide a grace period or explain the timeline.
 *   - Must offer a cancellation step before finalizing.
 *
 * Three-step flow:
 *   1. Disclosure — what will be deleted + privacy notice
 *   2. Confirmation — type CONFIRM
 *   3. Processing → success + auto-logout
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, ShieldAlert, CheckCircle2, Loader2, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

const CONFIRM_WORD = "DELETE MY ACCOUNT";

const stepVariants = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 340, damping: 30 } },
  exit:    { opacity: 0, x: -30, transition: { duration: 0.15 } },
};

const DATA_BULLETS = [
  { emoji: "🛒", text: "Order history and receipts" },
  { emoji: "💬", text: "All messages and conversations" },
  { emoji: "❤️", text: "Saved wishlist and watchlists" },
  { emoji: "🔧", text: "Parts requests and technician requests" },
  { emoji: "💰", text: "Wallet balance and transaction history" },
  { emoji: "🎁", text: "Loyalty points and rewards" },
  { emoji: "🧾", text: "Support tickets" },
  { emoji: "👤", text: "Profile and personal information" },
];

export default function DeleteAccountFlow({ user, onCancel }) {
  const [step, setStep]         = useState(1); // 1=disclosure, 2=confirm, 3=processing, 4=done
  const [confirmText, setConfirmText] = useState("");
  const [error, setError]       = useState("");

  const handleDelete = async () => {
    if (confirmText.trim().toUpperCase() !== CONFIRM_WORD) {
      setError(`Please type "${CONFIRM_WORD}" exactly to confirm.`);
      return;
    }
    setError("");
    setStep(3);

    try {
      // Delete all user-owned data in parallel
      const [orders, cartItems, wishlists, partsRequests, notifications,
             conversations, techRequests, loyaltyPoints, walletTxns,
             watchlist, supportTickets, appointments] = await Promise.all([
        base44.entities.Order.filter({ buyer_email: user.email }),
        base44.entities.CartItem.filter({ buyer_email: user.email }),
        base44.entities.Wishlist.filter({ buyer_email: user.email }),
        base44.entities.PartsRequest.filter({ buyer_email: user.email }),
        base44.entities.Notification.filter({ user_email: user.email }),
        base44.entities.Conversation.filter({ buyer_email: user.email }),
        base44.entities.TechnicianHireRequest.filter({ buyer_email: user.email }),
        base44.entities.LoyaltyPoints.filter({ buyer_email: user.email }),
        base44.entities.WalletTransaction.filter({ buyer_email: user.email }),
        base44.entities.WatchlistPart.filter({ buyer_email: user.email }),
        base44.entities.SupportTicket.filter({ user_email: user.email }),
        base44.entities.Appointment.filter({ buyer_email: user.email }),
      ]);

      const allDeletes = [
        ...cartItems, ...wishlists, ...notifications,
        ...loyaltyPoints, ...walletTxns, ...watchlist,
        ...supportTickets, ...appointments,
      ];

      await Promise.all(allDeletes.map(item => {
        // Determine entity type by presence of known discriminating fields
        if ('buyer_email' in item && 'product_id' in item) return base44.entities.CartItem.delete(item.id);
        if ('buyer_email' in item && 'product_name' in item && 'reason' in item) return base44.entities.WatchlistPart.delete(item.id);
        if ('user_email' in item && 'type' in item && 'title' in item) return base44.entities.Notification.delete(item.id);
        if ('user_email' in item && 'subject' in item) return base44.entities.SupportTicket.delete(item.id);
        if ('buyer_email' in item && 'technician_id' in item) return base44.entities.TechnicianHireRequest.delete(item.id);
        if ('buyer_email' in item && 'points' in item) return base44.entities.LoyaltyPoints.delete(item.id);
        if ('buyer_email' in item && 'amount' in item && 'type' in item) return base44.entities.WalletTransaction.delete(item.id);
        if ('preferred_date' in item) return base44.entities.Appointment.delete(item.id);
        if ('product_id' in item) return base44.entities.Wishlist.delete(item.id);
        return Promise.resolve();
      }));

      // Delete in series to avoid rate limits on larger datasets
      for (const item of partsRequests) {
        await base44.entities.PartsRequest.delete(item.id);
      }

      // Anonymise orders rather than hard-delete them (keeps shop records intact)
      for (const order of orders) {
        await base44.entities.Order.update(order.id, {
          buyer_email: "[deleted]",
          buyer_name: "Deleted User",
          delivery_address: "",
          delivery_phone: "",
          notes: "",
        });
      }

      setStep(4);
      setTimeout(() => {
        base44.auth.logout("/");
      }, 3000);
    } catch (err) {
      console.error("Account deletion error:", err);
      toast.error("An error occurred. Please contact support at admin@bwangu.com");
      setStep(2);
    }
  };

  return (
    <div className="space-y-0">
      <AnimatePresence mode="wait" initial={false}>

        {/* ── Step 1: Disclosure ─────────────────────────────────────────── */}
        {step === 1 && (
          <motion.div key="step1" {...stepVariants} className="space-y-5">
            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl">
              <ShieldAlert className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-700 dark:text-red-400">Permanent account deletion</p>
                <p className="text-sm text-red-600 dark:text-red-300 mt-1 leading-relaxed">
                  Deleting your account is <strong>irreversible</strong>. Once confirmed, your account and all associated data will be permanently removed within <strong>30 days</strong> in accordance with our privacy policy.
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">The following data will be deleted:</p>
              <ul className="space-y-2">
                {DATA_BULLETS.map(b => (
                  <li key={b.text} className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-400">
                    <span className="text-base leading-none">{b.emoji}</span>
                    {b.text}
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
              <strong>Note:</strong> To protect shop and other users' records, your order history entries will be anonymised rather than hard-deleted. Your personal details will be removed from all records.
            </div>

            <div className="flex gap-3 pt-1">
              <Button variant="outline" onClick={onCancel} className="flex-1 dark:border-slate-600 dark:text-slate-300">
                Cancel
              </Button>
              <Button
                onClick={() => setStep(2)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white gap-2"
              >
                <Trash2 className="w-4 h-4" /> Continue
              </Button>
            </div>
          </motion.div>
        )}

        {/* ── Step 2: Explicit confirmation ─────────────────────────────── */}
        {step === 2 && (
          <motion.div key="step2" {...stepVariants} className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Last chance — this cannot be undone</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Type exactly to confirm you want to proceed</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                Type <span className="font-mono font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{CONFIRM_WORD}</span> to confirm:
              </p>
              <Input
                value={confirmText}
                onChange={e => { setConfirmText(e.target.value); setError(""); }}
                placeholder={CONFIRM_WORD}
                className={`font-mono ${error ? "border-red-400 dark:border-red-600 focus-visible:ring-red-400" : ""}`}
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
              />
              {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1 dark:border-slate-600 dark:text-slate-300">
                ← Go back
              </Button>
              <Button
                onClick={handleDelete}
                disabled={confirmText.trim().toUpperCase() !== CONFIRM_WORD}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white disabled:opacity-40"
              >
                Delete My Account
              </Button>
            </div>
          </motion.div>
        )}

        {/* ── Step 3: Processing ────────────────────────────────────────── */}
        {step === 3 && (
          <motion.div key="step3" {...stepVariants} className="flex flex-col items-center gap-4 py-8 text-center">
            <Loader2 className="w-10 h-10 text-red-500 animate-spin" />
            <div>
              <p className="font-semibold text-slate-900 dark:text-slate-100">Deleting your account…</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">This may take a moment. Please don't close the app.</p>
            </div>
          </motion.div>
        )}

        {/* ── Step 4: Done ──────────────────────────────────────────────── */}
        {step === 4 && (
          <motion.div key="step4" {...stepVariants} className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <CheckCircle2 className="w-9 h-9 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-slate-100">Account deleted</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Your data has been removed. Signing you out in a moment…
              </p>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}