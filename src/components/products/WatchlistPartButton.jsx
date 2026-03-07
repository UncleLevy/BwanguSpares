import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function WatchlistPartButton({ product, userEmail, disabled = false }) {
  const [isWatched, setIsWatched] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userEmail) return;
    (async () => {
      const watched = await base44.entities.WatchlistPart.filter({
        buyer_email: userEmail,
        product_id: product.id
      });
      setIsWatched(watched.length > 0);
    })();
  }, [userEmail, product.id]);

  const handleToggle = async () => {
    if (!userEmail) {
      toast.error("Please sign in to watch parts");
      return;
    }

    setLoading(true);
    try {
      if (isWatched) {
        const watched = await base44.entities.WatchlistPart.filter({
          buyer_email: userEmail,
          product_id: product.id
        });
        if (watched.length > 0) {
          await base44.entities.WatchlistPart.delete(watched[0].id);
        }
        setIsWatched(false);
        toast.success("Removed from watchlist");
      } else {
        await base44.entities.WatchlistPart.create({
          buyer_email: userEmail,
          product_id: product.id,
          product_name: product.name,
          shop_id: product.shop_id,
          shop_name: product.shop_name,
          current_price: product.price,
          last_notified_price: product.price,
          last_stock_status: product.stock_quantity > 0 ? "in_stock" : "out_of_stock",
          notify_price_drop: true,
          notify_stock: true,
          price_drop_threshold: 5
        });
        setIsWatched(true);
        toast.success("Added to watchlist! You'll get notified on price drops or stock updates.");
      }
    } catch (e) {
      toast.error("Failed to update watchlist");
    }
    setLoading(false);
  };

  return (
    <Button
      variant={isWatched ? "default" : "ghost"}
      size="sm"
      onClick={handleToggle}
      disabled={loading || disabled}
      className={`gap-2 ${isWatched ? "bg-red-100 text-red-600 hover:bg-red-200" : "text-slate-500 hover:text-red-500"}`}
    >
      <Heart className={`w-4 h-4 ${isWatched ? "fill-current" : ""}`} />
      {isWatched ? "Following" : "Follow"}
    </Button>
  );
}