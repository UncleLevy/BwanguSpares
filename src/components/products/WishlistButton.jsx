import React, { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function WishlistButton({ product, className = "" }) {
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    checkAuth();
  }, [product.id]);

  const checkAuth = async () => {
    const authed = await base44.auth.isAuthenticated();
    if (authed) {
      const u = await base44.auth.me();
      setUser(u);
      checkWishlistStatus(u.email);
    }
  };

  const checkWishlistStatus = async (email) => {
    try {
      const wishlist = await base44.entities.Wishlist.filter({
        buyer_email: email,
        product_id: product.id
      });
      setIsInWishlist(wishlist.length > 0);
    } catch (error) {
      console.error("Error checking wishlist status:", error);
    }
  };

  const handleWishlist = async () => {
    if (!user) {
      base44.auth.redirectToLogin();
      return;
    }

    setLoading(true);
    try {
      if (isInWishlist) {
        const wishlist = await base44.entities.Wishlist.filter({
          buyer_email: user.email,
          product_id: product.id
        });
        if (wishlist.length > 0) {
          await base44.entities.Wishlist.delete(wishlist[0].id);
          setIsInWishlist(false);
          toast.success("Removed from wishlist");
        }
      } else {
        await base44.entities.Wishlist.create({
          buyer_email: user.email,
          product_id: product.id,
          product_name: product.name,
          shop_id: product.shop_id,
          shop_name: product.shop_name,
          price: product.price,
          image_url: product.image_url,
          category: product.category
        });
        setIsInWishlist(true);
        toast.success("Added to wishlist");
      }
    } catch (error) {
      toast.error("Failed to update wishlist");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleWishlist}
      disabled={loading}
      className={`transition-all duration-200 ${className}`}
      title={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
    >
      <Heart
        className={`w-5 h-5 transition-all duration-200 ${
          isInWishlist
            ? "fill-red-500 text-red-500"
            : "text-slate-400 hover:text-red-500"
        }`}
      />
    </button>
  );
}