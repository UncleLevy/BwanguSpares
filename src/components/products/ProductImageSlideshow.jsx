import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Package, ZoomIn } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ProductImageSlideshow({ product }) {
  const allImages = [
    ...(product.image_url ? [product.image_url] : []),
    ...(product.image_urls || []),
  ]
    .filter(Boolean)
    .filter((url, i, arr) => arr.indexOf(url) === i)
    .slice(0, 5);

  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState(1);
  const [zoomed, setZoomed] = useState(false);

  const goTo = (idx) => {
    setDirection(idx > active ? 1 : -1);
    setActive(idx);
  };
  const prev = () => goTo(active === 0 ? allImages.length - 1 : active - 1);
  const next = () => goTo(active === allImages.length - 1 ? 0 : active + 1);

  if (allImages.length === 0) {
    return (
      <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl overflow-hidden aspect-square flex items-center justify-center">
        <Package className="w-20 h-20 text-slate-200" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Main image */}
      <div className="relative bg-slate-50 dark:bg-slate-800 rounded-2xl overflow-hidden aspect-square group cursor-zoom-in"
        onClick={() => setZoomed(true)}>
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.img
            key={active}
            src={allImages[active]}
            alt={`Product photo ${active + 1}`}
            className="w-full h-full object-cover"
            custom={direction}
            initial={{ opacity: 0, x: direction * 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -60 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          />
        </AnimatePresence>

        {/* Navigation arrows */}
        {allImages.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); prev(); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 dark:bg-slate-700/80 rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
            >
              <ChevronLeft className="w-5 h-5 text-slate-700 dark:text-slate-200" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); next(); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 dark:bg-slate-700/80 rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
            >
              <ChevronRight className="w-5 h-5 text-slate-700 dark:text-slate-200" />
            </button>
          </>
        )}

        {/* Dots */}
        {allImages.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {allImages.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); goTo(i); }}
                className={`w-2 h-2 rounded-full transition-all ${i === active ? "bg-blue-600 w-4" : "bg-white/70"}`}
              />
            ))}
          </div>
        )}

        {/* Zoom hint */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-white/80 dark:bg-slate-700/80 rounded-full p-1.5">
            <ZoomIn className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          </div>
        </div>

        {/* Counter badge */}
        {allImages.length > 1 && (
          <div className="absolute top-3 left-3 bg-black/40 text-white text-xs px-2 py-0.5 rounded-full">
            {active + 1}/{allImages.length}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {allImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {allImages.map((url, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                i === active
                  ? "border-blue-500 shadow-md"
                  : "border-slate-200 dark:border-slate-600 opacity-60 hover:opacity-100"
              }`}
            >
              <img src={url} alt={`Thumb ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen lightbox */}
      {zoomed && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setZoomed(false)}
        >
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <img
            src={allImages[active]}
            alt={`Zoomed photo ${active + 1}`}
            className="max-w-full max-h-full object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
          <button onClick={() => setZoomed(false)}
            className="absolute top-4 right-4 text-white/70 hover:text-white text-3xl font-light leading-none">
            ✕
          </button>
        </div>
      )}
    </div>
  );
}