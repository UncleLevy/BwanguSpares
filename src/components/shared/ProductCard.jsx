import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Package, ShoppingCart, MapPin } from "lucide-react";
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
  return (
    <div className="group bg-white dark:bg-slate-800 rounded-2xl border border-slate-300 dark:border-slate-700 overflow-hidden hover-lift active:scale-[0.98] transition-transform">
      <Link to={createPageUrl("ProductDetail") + `?id=${product.id}`}>
        <div className="relative h-40 sm:h-44 bg-slate-50 dark:bg-slate-700/50 overflow-hidden">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-10 h-10 text-slate-200" />
            </div>
          )}
          <Badge className={`absolute top-3 left-3 text-[10px] border ${conditionColors[product.condition] || conditionColors.new}`}>
            {product.condition}
          </Badge>
          <div className="absolute top-3 right-3 bg-white dark:bg-slate-800 rounded-full p-2 shadow-md">
            <WishlistButton product={product} />
          </div>
          </div>
      </Link>
      <div className="p-4">
        <Link to={createPageUrl("ProductDetail") + `?id=${product.id}`}>
          <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 line-clamp-1 group-hover:text-blue-600 transition-colors">{product.name}</h3>
        </Link>
        <div className="flex items-center gap-1.5 mt-1">
          <MapPin className="w-3 h-3 text-slate-400" />
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{product.shop_name}</p>
        </div>
        {product.compatible_vehicles && (() => {
          const cv = product.compatible_vehicles;
          const display = Array.isArray(cv)
            ? cv.map(v => v.brand === "All Vehicles" ? "All Vehicles" : `${v.brand} ${v.model}`.trim()).join(", ")
            : String(cv);
          return display ? <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 truncate">Fits: {display}</p> : null;
        })()}
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
           <div className="flex items-baseline gap-1.5 sm:gap-2 mb-2">
              {product.original_price && product.original_price > product.price && (
                <span className="text-[10px] sm:text-sm text-slate-400 line-through">K{product.original_price?.toLocaleString()}</span>
              )}
              <span className="text-sm sm:text-lg font-bold text-blue-600">K{product.price?.toLocaleString()}</span>
              {product.original_price && product.original_price > product.price && (
                <span className="text-[9px] sm:text-xs font-semibold px-1 sm:px-1.5 py-0.5 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 rounded">
                  -{Math.round(((product.original_price - product.price) / product.original_price) * 100)}%
                </span>
              )}
            </div>
            <div className="flex gap-1.5">
              <WatchlistPartButton product={product} userEmail={user?.email} disabled={!canAddToCart} />
              {canAddToCart && (
                <Button size="sm" variant="outline" className="flex-1 h-9 text-xs border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                  onClick={(e) => { e.preventDefault(); onAddToCart?.(product); }}>
                  <ShoppingCart className="w-3.5 h-3.5 sm:mr-1" /> <span className="hidden sm:inline">Add to Cart</span>
                </Button>
              )}
            </div>
          </div>
      </div>
    </div>
  );
}