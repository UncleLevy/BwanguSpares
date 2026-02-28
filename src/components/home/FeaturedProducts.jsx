import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowRight, Package, Star, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const conditionColors = {
  new: "bg-emerald-50 text-emerald-700 border-emerald-200",
  used: "bg-amber-50 text-amber-700 border-amber-200",
  refurbished: "bg-blue-50 text-blue-700 border-blue-200",
};

export default function FeaturedProducts({ products, onAddToCart, loading }) {
  if (loading) {
    return (
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden animate-pulse">
                <div className="h-48 bg-slate-100 dark:bg-slate-700" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded w-1/2" />
                  <div className="h-6 bg-slate-100 dark:bg-slate-700 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Featured Parts</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Top-selling parts from verified shops</p>
          </div>
          <Link to={createPageUrl("BrowseProducts")} className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {products.map(product => (
            <div key={product.id} className="group bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden hover-lift">
              <Link to={createPageUrl("ProductDetail") + `?id=${product.id}`}>
                <div className="relative h-48 bg-slate-50 dark:bg-slate-700/50 overflow-hidden">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-12 h-12 text-slate-200" />
                    </div>
                  )}
                  <Badge className={`absolute top-3 left-3 text-[10px] border ${conditionColors[product.condition] || conditionColors.new}`}>
                    {product.condition}
                  </Badge>
                </div>
              </Link>
              <div className="p-4">
                <Link to={createPageUrl("ProductDetail") + `?id=${product.id}`}>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm line-clamp-1 group-hover:text-blue-600 transition-colors">{product.name}</h3>
                </Link>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{product.shop_name}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-lg font-bold text-blue-600">K{product.price?.toLocaleString()}</span>
                  <Button size="sm" variant="outline" className="h-8 text-xs border-blue-200 text-blue-600 hover:bg-blue-50"
                    onClick={() => onAddToCart(product)}>
                    <ShoppingCart className="w-3.5 h-3.5 mr-1" /> Add
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}