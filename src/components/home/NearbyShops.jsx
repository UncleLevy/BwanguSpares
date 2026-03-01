import React, { useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { MapPin, Star, ArrowRight, Store, ChevronLeft, ChevronRight } from "lucide-react";

export default function NearbyShops({ shops, loading }) {
  const scrollRef = useRef(null);

  const scroll = (dir) => {
    scrollRef.current?.scrollBy({ left: dir * 320, behavior: "smooth" });
  };

  if (loading) {
    return (
      <section className="py-16 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-5 overflow-hidden">
            {[1,2,3].map(i => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden animate-pulse min-w-[300px]">
                <div className="h-32 bg-slate-100 dark:bg-slate-700" />
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-slate-100 dark:bg-slate-700 rounded w-2/3" />
                  <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-slate-50/50 dark:bg-slate-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Shops Near You</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Verified auto spares dealers in your area</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex gap-1">
              <button onClick={() => scroll(-1)} className="p-2 rounded-full border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => scroll(1)} className="p-2 rounded-full border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <Link to={createPageUrl("BrowseShops")} className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div ref={scrollRef} className="flex gap-5 overflow-x-auto pb-3 scroll-smooth snap-x snap-mandatory" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
          {shops.map(shop => (
            <Link key={shop.id} to={createPageUrl("ShopProfile") + `?id=${shop.id}`}
              className="group bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden hover-lift snap-start shrink-0 w-[300px]">
              <div className="relative h-32 bg-gradient-to-br from-blue-500 to-blue-700 overflow-hidden">
                {shop.cover_url ? (
                  <img src={shop.cover_url} alt={shop.name} className="w-full h-full object-cover opacity-80" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Store className="w-12 h-12 text-white/30" />
                  </div>
                )}
                {shop.logo_url && (
                  <img src={shop.logo_url} alt="" className="absolute bottom-3 left-4 w-12 h-12 rounded-xl border-2 border-white object-cover" />
                )}
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors">{shop.name}</h3>
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> {shop.region_name || shop.address}
                  </span>
                  {shop.rating > 0 && (
                    <span className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> {shop.rating.toFixed(1)}
                    </span>
                  )}
                </div>
                {shop.distance && (
                  <span className="inline-block mt-2 text-[11px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                    {shop.distance.toFixed(1)} km away
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}