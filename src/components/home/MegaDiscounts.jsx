import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Zap, ShoppingCart, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function MegaDiscounts({ onAddToCart, user }) {
  const [discountedProducts, setDiscountedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const canAddToCart = !user || (user.role !== 'shop_owner' && user.role !== 'admin');

  useEffect(() => {
    (async () => {
      try {
        const prods = await base44.entities.Product.filter({ status: "active" }, "-created_date", 50);
        const discounted = prods
          .filter(p => p.original_price && p.original_price > p.price)
          .sort((a, b) => {
            const discountA = ((a.original_price - a.price) / a.original_price) * 100;
            const discountB = ((b.original_price - b.price) / b.original_price) * 100;
            return discountB - discountA;
          })
          .slice(0, 6);
        setDiscountedProducts(discounted);
      } catch (error) {
        console.error("Failed to load discounted products:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading || discountedProducts.length === 0) return null;

  return (
    <section className="py-12 md:py-16 bg-gradient-to-r from-red-50 via-orange-50 to-yellow-50 dark:from-red-950/30 dark:via-orange-950/30 dark:to-yellow-950/30 border-b border-red-200 dark:border-red-900/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100">Mega Discounts</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">Limited time deals on auto parts</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {discountedProducts.map((product) => {
            const discountPercent = Math.round(((product.original_price - product.price) / product.original_price) * 100);
            return (
              <Link key={product.id} to={createPageUrl("ProductDetail") + `?id=${product.id}`}>
                <div className="group bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden hover-lift transition-all h-full">
                  {/* Image */}
                  <div className="relative h-40 sm:h-48 bg-slate-100 dark:bg-slate-700/50 overflow-hidden">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-12 h-12 text-slate-300 dark:text-slate-600" />
                      </div>
                    )}
                    {/* Discount Badge - Large */}
                    <div className="absolute top-3 right-3 bg-gradient-to-br from-red-500 to-orange-500 text-white rounded-full w-14 h-14 flex flex-col items-center justify-center shadow-lg">
                      <span className="text-lg font-black">-{discountPercent}%</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">{product.shop_name}</p>

                    {/* Price Section */}
                    <div className="flex items-baseline gap-2 mt-3">
                      <span className="text-xs text-slate-400 line-through">K{product.original_price?.toLocaleString()}</span>
                      <span className="text-lg font-bold text-red-600 dark:text-red-400">K{product.price?.toLocaleString()}</span>
                    </div>

                    {/* Add to Cart Button */}
                    {canAddToCart && (
                      <Button
                        className="w-full mt-4 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white h-9 rounded-xl gap-2 text-sm font-semibold shadow-lg"
                        onClick={(e) => {
                          e.preventDefault();
                          onAddToCart?.(product);
                        }}
                      >
                        <ShoppingCart className="w-4 h-4" /> Add to Cart
                      </Button>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}