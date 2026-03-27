import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Package, ShoppingCart, MapPin, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import WishlistButton from "@/components/products/WishlistButton";
import WatchlistPartButton from "@/components/products/WatchlistPartButton";

const conditionColors = {
  new: "bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700",
  used: "bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-700",
  refurbished: "bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-700",
};

export default function ProductCard({ product, onAddToCart, user }) {
  const canAddToCart = !user || (user.role !== 'shop_owner' && user.role !== 'admin');
  const isOutOfStock = (product.stock_quantity || 0) === 0;

  return (
    <div className="group bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden active:scale-[0.97] transition-transform duration-150 flex flex-col">
      {/* Image */}
      <Link to={createPageUrl("ProductDetail") + `?id=${product.id}`} className="relative block">
        <div className="relative h-40 sm:h-44 bg-slate-50 dark:bg-slate-700/50 overflow-hidden">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-10 h-10 text-slate-200 dark:text-slate-600" />
            </div>
          )}

          {/* Overlays */}
          <div className="absolute top-2.5 left-2.5">
            <Badge className={`text-[10px] border font-medium ${conditionColors[product.condition] || conditionColors.new}`}>
              {product.condition || "new"}
            </Badge>
          </div>

          {isOutOfStock && (
            <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center">
              <span className="text-white text-xs font-semibold bg-slate-900/70 px-2.5 py-1 rounded-full">Out of stock</span>
            </div>
          )}

          <div className="absolute top-2 right-2">
            <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-full p-1.5 shadow-sm">
              <WishlistButton product={product} />
            </div>
          </div>
        </div>
      </Link>

      {/* Body */}
      <div className="p-3 flex flex-col flex-1">
        <Link to={createPageUrl("ProductDetail") + `?id=${product.id}`} className="flex-1">
          <h3 className="font-semibold text-[13px] text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-center gap-1 mt-1.5">
          <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{product.shop_name}</p>
        </div>

        {/* Price */}
        <div className="mt-2.5 flex items-baseline gap-1.5 flex-wrap">
          <span className="text-base font-bold text-blue-600">K{product.price?.toLocaleString()}</span>
          {product.original_price && product.original_price > product.price && (
            <>
              <span className="text-[11px] text-slate-400 line-through">K{product.original_price?.toLocaleString()}</span>
              <span className="text-[9px] font-bold px-1 py-0.5 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded">
                -{Math.round(((product.original_price - product.price) / product.original_price) * 100)}%
              </span>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-1.5 mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-700">
          <WatchlistPartButton product={product} userEmail={user?.email} disabled={!canAddToCart} />
          {canAddToCart && (
            <Button
              size="sm"
              variant="outline"
              disabled={isOutOfStock}
              className="flex-1 h-9 text-xs border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400
                         hover:bg-blue-50 dark:hover:bg-blue-900/30 active:scale-95 transition-transform"
              onClick={(e) => { e.preventDefault(); onAddToCart?.(product); }}
            >
              <ShoppingCart className="w-3.5 h-3.5 mr-1" />
              <span>{isOutOfStock ? "Out of stock" : "Add"}</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}