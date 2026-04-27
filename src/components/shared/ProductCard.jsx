import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Package, ShoppingCart, MapPin, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import WishlistButton from "@/components/products/WishlistButton";

const conditionColors = {
  new: "bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700",
  used: "bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-700",
  refurbished: "bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-700",
};

export default function ProductCard({ product, onAddToCart, user, listView = false }) {
  const canAddToCart = !user || (user.role !== 'shop_owner' && user.role !== 'admin');
  const isOutOfStock = (product.stock_quantity || 0) === 0;

  if (listView) {
    return (
      <div className="group bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-100 dark:border-slate-700/60 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 active:scale-[0.99] flex flex-row">
        {/* Image */}
        <Link to={createPageUrl("ProductDetail") + `?id=${product.id}`} className="relative block flex-shrink-0 w-28 sm:w-36">
          <div className="relative h-full min-h-[112px] bg-slate-50 dark:bg-slate-700/50 overflow-hidden">
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-8 h-8 text-slate-200 dark:text-slate-600" />
              </div>
            )}
            {isOutOfStock && (
              <div className="absolute inset-0 bg-slate-900/40 flex items-end justify-center pb-2">
                <span className="text-white text-[10px] font-semibold bg-slate-900/70 px-2 py-0.5 rounded-full">Out of stock</span>
              </div>
            )}
            <div className="absolute top-1.5 right-1.5" onClick={(e) => e.preventDefault()}>
              <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-full p-1 shadow-sm">
                <WishlistButton product={product} />
              </div>
            </div>
          </div>
        </Link>

        {/* Body */}
        <div className="flex flex-col flex-1 p-3 gap-1 min-w-0">
          <Link to={createPageUrl("ProductDetail") + `?id=${product.id}`}>
            <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
              {product.name}
            </h3>
          </Link>

          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
            <Badge className={`text-[10px] border font-medium ${conditionColors[product.condition] || conditionColors.new}`}>
              {product.condition || "new"}
            </Badge>
            <span className="text-[11px] text-slate-400">·</span>
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{product.shop_name}</p>
            </div>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-2 flex-wrap mt-1">
            <span className="text-base font-bold text-blue-600">K{product.price?.toLocaleString()}</span>
            {product.original_price && product.original_price > product.price && (
              <>
                <span className="text-xs text-slate-400 line-through">K{product.original_price?.toLocaleString()}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded">
                  -{Math.round(((product.original_price - product.price) / product.original_price) * 100)}%
                </span>
              </>
            )}
          </div>

          {/* Actions */}
          {canAddToCart && (
            <div className="mt-auto pt-2">
              <Button
                size="sm"
                variant="outline"
                disabled={isOutOfStock}
                className="h-8 text-xs border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400
                           hover:bg-blue-50 dark:hover:bg-blue-900/30 active:scale-95 transition-transform px-3"
                onClick={(e) => { e.preventDefault(); onAddToCart?.(product); }}
              >
                <ShoppingCart className="w-3 h-3 shrink-0 mr-1" />
                {isOutOfStock ? "Out of stock" : "Add to Cart"}
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="group bg-white dark:bg-slate-800/90 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 active:scale-[0.97] flex flex-col">
      {/* Image - eBay style: centered, white bg */}
      <Link to={createPageUrl("ProductDetail") + `?id=${product.id}`} className="relative block">
        <div className="relative aspect-square bg-white dark:bg-slate-50 overflow-hidden flex items-center justify-center">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500 p-4"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-12 h-12 text-slate-200 dark:text-slate-400" />
            </div>
          )}

          {/* Discount badge */}
          {product.original_price && product.original_price > product.price && (
            <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
              {Math.round(((product.original_price - product.price) / product.original_price) * 100)}% OFF
            </div>
          )}

          {isOutOfStock && (
            <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center">
              <span className="text-white text-xs font-semibold bg-slate-900/70 px-2.5 py-1 rounded-full">Out of stock</span>
            </div>
          )}

          <div className="absolute top-2 right-2" onClick={(e) => e.preventDefault()}>
            <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-full p-1.5 shadow-sm">
              <WishlistButton product={product} />
            </div>
          </div>
        </div>
      </Link>

      {/* Body - minimal */}
      <div className="p-3 flex flex-col flex-1 gap-1">
        <Link to={createPageUrl("ProductDetail") + `?id=${product.id}`} className="flex-1">
          <h3 className="font-medium text-sm text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
            {product.name}
          </h3>
        </Link>

        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{product.shop_name}</p>

        {/* Price */}
        <div className="flex items-baseline gap-2 flex-wrap mt-2">
          <span className="text-sm font-bold text-slate-900 dark:text-slate-100">K{product.price?.toLocaleString()}</span>
          {product.original_price && product.original_price > product.price && (
            <span className="text-xs text-slate-400 line-through">K{product.original_price?.toLocaleString()}</span>
          )}
        </div>

        {/* Actions */}
        {canAddToCart && (
          <div className="mt-auto pt-2">
            <Button
              size="sm"
              disabled={isOutOfStock}
              className="w-full h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white active:scale-95 transition-transform"
              onClick={(e) => { e.preventDefault(); onAddToCart?.(product); }}
            >
              <ShoppingCart className="w-3 h-3 shrink-0 mr-1" />
              {isOutOfStock ? "Out of stock" : "Add to Cart"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}