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
    <section className="relative py-16 md:py-20 overflow-hidden">
      {/* Background with animated gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-red-900/20 to-slate-900 dark:from-slate-950 dark:via-red-950/40 dark:to-slate-950" />
      <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(199,39,39,0.1)_25%,rgba(199,39,39,0.1)_50%,transparent_50%,transparent_75%,rgba(199,39,39,0.1)_75%,rgba(199,39,39,0.1))] bg-[length:40px_40px] opacity-30" />
      
      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Premium Header */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="h-1 w-8 bg-gradient-to-r from-red-500 to-orange-500 rounded-full" />
            <span className="text-sm font-semibold tracking-wider text-red-500 uppercase">Limited Time Offers</span>
            <div className="h-1 w-8 bg-gradient-to-l from-red-500 to-orange-500 rounded-full" />
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-3">
            Mega Discounts
          </h2>
          <p className="text-base md:text-lg text-slate-300 max-w-2xl mx-auto">
            Score incredible deals on premium auto parts. Limited stock available!
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {discountedProducts.map((product, idx) => {
            const discountPercent = Math.round(((product.original_price - product.price) / product.original_price) * 100);
            return (
              <Link key={product.id} to={createPageUrl("ProductDetail") + `?id=${product.id}`}>
                <div className="group h-full">
                  {/* Card with premium styling */}
                  <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-800/80 dark:to-slate-900/80 rounded-2xl overflow-hidden border border-slate-700 dark:border-slate-600 hover:border-red-500/50 transition-all duration-300 h-full flex flex-col shadow-2xl hover:shadow-red-500/20">
                    {/* Image Container */}
                    <div className="relative h-48 sm:h-56 bg-slate-700/50 overflow-hidden">
                      {product.image_url ? (
                        <img 
                          src={product.image_url} 
                          alt={product.name} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 brightness-90 group-hover:brightness-100" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-600 to-slate-700">
                          <Package className="w-16 h-16 text-slate-500 opacity-50" />
                        </div>
                      )}
                      
                      {/* Premium Discount Badge */}
                      <div className="absolute inset-0 flex items-end justify-end p-4">
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-br from-red-600 to-orange-600 rounded-full blur-lg opacity-60" />
                          <div className="relative w-16 h-16 bg-gradient-to-br from-red-500 via-red-600 to-orange-500 rounded-full flex flex-col items-center justify-center shadow-2xl border-2 border-white/20">
                            <span className="text-lg font-black text-white leading-tight">-{discountPercent}%</span>
                          </div>
                        </div>
                      </div>

                      {/* Flash Icon Badge */}
                      <div className="absolute top-4 left-4">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg">
                          <Zap className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-5 flex flex-col justify-between">
                      {/* Title and Shop */}
                      <div>
                        <h3 className="font-bold text-sm md:text-base text-white line-clamp-2 group-hover:text-red-400 transition-colors mb-2">
                          {product.name}
                        </h3>
                        <p className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors truncate">{product.shop_name}</p>
                      </div>

                      {/* Price Section */}
                      <div className="mt-4 pb-4 border-b border-slate-700/50">
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-slate-400 line-through">K{product.original_price?.toLocaleString()}</span>
                          <span className="text-xl font-black text-transparent bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text">
                            K{product.price?.toLocaleString()}
                          </span>
                        </div>
                        <div className="mt-2 text-xs text-emerald-400 font-semibold">
                          Save K{(product.original_price - product.price).toLocaleString()}
                        </div>
                      </div>

                      {/* Add to Cart Button */}
                      {canAddToCart && (
                        <Button
                          className="w-full mt-4 bg-gradient-to-r from-red-500 via-red-600 to-orange-600 hover:from-red-600 hover:via-red-700 hover:to-orange-700 text-white font-bold h-10 rounded-xl gap-2 text-sm shadow-lg hover:shadow-red-500/40 transition-all duration-300 border border-red-400/30"
                          onClick={(e) => {
                            e.preventDefault();
                            onAddToCart?.(product);
                          }}
                        >
                          <ShoppingCart className="w-4 h-4" /> Quick Add
                        </Button>
                      )}
                    </div>
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