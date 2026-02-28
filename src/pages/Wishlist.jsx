import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Heart, ShoppingCart, Trash2, ArrowRight } from "lucide-react";
import AppHeader from "@/components/shared/AppHeader";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function WishlistPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = async () => {
    try {
      const authed = await base44.auth.isAuthenticated();
      if (!authed) {
        navigate(createPageUrl("Home"));
        return;
      }

      const u = await base44.auth.me();
      setUser(u);
      const wishlist = await base44.entities.Wishlist.filter({
        buyer_email: u.email
      });
      setItems(wishlist || []);
    } catch (error) {
      toast.error("Failed to load wishlist");
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (item) => {
    try {
      await base44.entities.Wishlist.delete(item.id);
      setItems(items.filter(i => i.id !== item.id));
      toast.success("Removed from wishlist");
    } catch (error) {
      toast.error("Failed to remove item");
    }
  };

  const addToCart = async (item) => {
    try {
      await base44.entities.CartItem.create({
        buyer_email: user.email,
        product_id: item.product_id,
        product_name: item.product_name,
        shop_id: item.shop_id,
        shop_name: item.shop_name,
        price: item.price,
        image_url: item.image_url,
        quantity: 1
      });
      toast.success("Added to cart");
      await removeItem(item);
    } catch (error) {
      toast.error("Failed to add to cart");
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />)}</div>
      </div>
    );
  }

  return (
    <div>
      <AppHeader title="Wishlist" backTo="BrowseProducts" />
      <div className="max-w-3xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
        <h1 className="hidden md:block text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">My Wishlist</h1>

        {items.length === 0 ? (
          <div className="text-center py-16 sm:py-20">
            <Heart className="w-16 h-16 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
            <h3 className="font-semibold text-slate-700 dark:text-slate-300">Your wishlist is empty</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-6">Save products you like for later</p>
            <Button onClick={() => navigate(createPageUrl("BrowseProducts"))} className="bg-blue-600 hover:bg-blue-700">
              Browse Parts
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{items.length} item{items.length !== 1 ? "s" : ""} in your wishlist</p>
            {items.map(item => (
              <div key={item.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex items-start gap-4">
                <div className="w-20 h-20 rounded-lg bg-slate-50 dark:bg-slate-700 flex-shrink-0 overflow-hidden flex items-center justify-center">
                  {item.image_url ? (
                    <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Heart className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-slate-900 dark:text-slate-100 truncate">{item.product_name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{item.shop_name}</p>
                  <p className="text-lg font-semibold text-blue-600 dark:text-blue-400 mt-2">K{item.price?.toLocaleString()}</p>
                </div>
                <div className="flex gap-2 flex-col">
                  <Button
                    onClick={() => addToCart(item)}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 gap-1 whitespace-nowrap"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span className="hidden sm:inline">Add to Cart</span>
                  </Button>
                  <button
                    onClick={() => removeItem(item)}
                    className="text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors p-2"
                    title="Remove from wishlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}