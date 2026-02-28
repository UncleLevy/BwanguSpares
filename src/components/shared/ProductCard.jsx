import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Package, ShoppingCart, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const conditionColors = {
  new: "bg-emerald-50 text-emerald-700 border-emerald-200",
  used: "bg-amber-50 text-amber-700 border-amber-200",
  refurbished: "bg-blue-50 text-blue-700 border-blue-200",
};

export default function ProductCard({ product, onAddToCart }) {
  return (
    <div className="group bg-white dark:bg-slate-800 rounded-2xl border border-slate-400 dark:border-slate-700 overflow-hidden hover-lift">
      <Link to={createPageUrl("ProductDetail") + `?id=${product.id}`}>
        <div className="relative h-44 bg-slate-50 dark:bg-slate-700/50 overflow-hidden">
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
        {product.compatible_vehicles && (
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 truncate">Fits: {product.compatible_vehicles}</p>
        )}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50 dark:border-slate-700">
          <span className="text-lg font-bold text-blue-600">K{product.price?.toLocaleString()}</span>
          <Button size="sm" variant="outline" className="h-8 text-xs border-blue-200 text-blue-600 hover:bg-blue-50"
            onClick={(e) => { e.preventDefault(); onAddToCart?.(product); }}>
            <ShoppingCart className="w-3.5 h-3.5 mr-1" /> Add
          </Button>
        </div>
      </div>
    </div>
  );
}