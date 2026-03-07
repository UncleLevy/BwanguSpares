import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { User, ShoppingBag, Star, Package, Clock, CheckCircle2 } from "lucide-react";

export default function BuyerProfileModal({ open, onClose, buyerEmail, buyerName, shopId }) {
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open || !buyerEmail) return;
    setLoading(true);
    const orderFilter = shopId
      ? { buyer_email: buyerEmail, shop_id: shopId }
      : { buyer_email: buyerEmail };
    Promise.all([
      base44.entities.Order.filter(orderFilter, "-created_date", 100),
      base44.entities.Review.filter({ reviewer_email: buyerEmail }),
    ]).then(([o, r]) => {
      setOrders(o);
      setReviews(r);
      setLoading(false);
    });
  }, [open, buyerEmail, shopId]);

  const totalSpent = orders.reduce((s, o) => s + (o.total_amount || 0), 0);
  const deliveredOrders = orders.filter(o => o.status === "delivered").length;
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;
  const memberSince = orders.length
    ? new Date(Math.min(...orders.map(o => new Date(o.created_date)))).getFullYear()
    : null;

  const initials = buyerName?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">Buyer Profile</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-10 flex justify-center">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-5">
            {/* Avatar + name */}
            <div className="flex flex-col items-center gap-2 pt-2">
              <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-xl font-bold text-blue-600 dark:text-blue-400">
                {initials}
              </div>
              <div className="text-center">
                <p className="font-semibold text-slate-900 dark:text-slate-100">{buyerName}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">{buyerEmail}</p>
                {memberSince && (
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 flex items-center justify-center gap-1">
                    <Clock className="w-3 h-3" /> Member since {memberSince}
                  </p>
                )}
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-center">
                <ShoppingBag className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{orders.length}</p>
                <p className="text-[10px] text-slate-500">Orders</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
                <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{deliveredOrders}</p>
                <p className="text-[10px] text-slate-500">Delivered</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-center">
                <Star className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{avgRating || "—"}</p>
                <p className="text-[10px] text-slate-500">Avg Rating</p>
              </div>
            </div>

            {/* Total spent */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <Package className="w-4 h-4" />
                Total Spent
              </div>
              <span className="font-bold text-blue-700 dark:text-blue-400">
                K{totalSpent.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* Recent reviews given */}
            {reviews.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Recent Reviews</p>
                <div className="space-y-2 max-h-36 overflow-y-auto">
                  {reviews.slice(0, 5).map(r => (
                    <div key={r.id} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                      <div className="flex gap-0.5 mt-0.5 flex-shrink-0">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} className={`w-3 h-3 ${s <= r.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
                        ))}
                      </div>
                      <p className="line-clamp-2 text-slate-600 dark:text-slate-400">{r.comment || "No comment"}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}