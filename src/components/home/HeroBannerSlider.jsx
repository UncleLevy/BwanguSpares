import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function BannerAdsSection() {
  const [banners, setBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const b = await base44.entities.Banner.filter({ is_active: true }, "display_order", 100);
        setBanners(b || []);
      } catch (e) {
        console.warn("Banner fetch error:", e);
      }
      setLoading(false);
    })();
  }, []);

  // Auto-advance slides every 6 seconds
  useEffect(() => {
    if (banners.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [banners.length]);

  if (loading || banners.length === 0) return null;

  const currentBanner = banners[currentIndex];
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const isTablet = typeof window !== "undefined" && window.innerWidth < 1024;
  const imageUrl = isMobile ? currentBanner.mobile_image_url : isTablet ? currentBanner.tablet_image_url : currentBanner.web_image_url;

  const handlePrev = () => {
    setCurrentIndex(prev => (prev - 1 + banners.length) % banners.length);
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev + 1) % banners.length);
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  const handleBannerClick = () => {
    if (currentBanner.action_url) {
      window.location.href = currentBanner.action_url;
    }
  };

  return (
    <section className="w-full py-6 md:py-10 bg-gradient-to-b from-transparent to-slate-50/30 dark:to-slate-900/20">
      <div className="flex items-center justify-between mb-4 max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
          Special Offers
        </h2>
        {banners.length > 1 && (
          <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>{currentIndex + 1}</span>
            <span>/</span>
            <span>{banners.length}</span>
          </div>
        )}
      </div>
        
      <div
        className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 group shadow-2xl"
        style={{ width: "100vw", position: "relative", left: "50%", transform: "translateX(-50%)" }}
      >
          {/* Animated slide */}
          <motion.div 
            className="relative w-full h-64 sm:h-80 lg:h-96 overflow-hidden"
            key={currentIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.img
              src={imageUrl}
              alt={currentBanner.name}
              className="w-full h-full object-cover cursor-pointer"
              onClick={handleBannerClick}
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.6 }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
            
            {/* Offer badge */}
            {currentBanner.offer_description && (
              <motion.div
                className="absolute top-4 left-4 sm:top-6 sm:left-6 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 sm:px-6 py-2 rounded-full shadow-lg"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
              >
                <p className="font-bold text-sm sm:text-base">{currentBanner.offer_description}</p>
              </motion.div>
            )}
            
            {/* CTA Button */}
            {currentBanner.action_url && (
              <motion.div
                className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.4 }}
              >
                <Button
                  onClick={handleBannerClick}
                  className="bg-white hover:bg-slate-100 text-slate-900 font-bold shadow-lg group/cta gap-2"
                >
                  Shop Now <ArrowRight className="w-4 h-4 group-hover/cta:translate-x-1 transition-transform" />
                </Button>
              </motion.div>
            )}
          </motion.div>

          {/* Navigation arrows - Always visible on mobile, hover on desktop */}
          {banners.length > 1 && (
            <>
              <Button
                onClick={handlePrev}
                size="icon"
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white text-slate-900 shadow-lg sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-300"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
              <Button
                onClick={handleNext}
                size="icon"
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white text-slate-900 shadow-lg sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-300"
                aria-label="Next slide"
              >
                <ChevronRight className="w-6 h-6" />
              </Button>
            </>
          )}

          {/* Indicator dots with enhanced styling */}
          {banners.length > 1 && (
            <motion.div 
              className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2 sm:gap-3 bg-black/20 backdrop-blur-sm px-4 py-2 rounded-full"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {banners.map((_, index) => (
                <motion.button
                  key={index}
                  onClick={() => goToSlide(index)}
                  aria-label={`Go to slide ${index + 1}`}
                  className={`transition-all rounded-full ${
                    index === currentIndex
                      ? "bg-white"
                      : "bg-white/40 hover:bg-white/60"
                  }`}
                  initial={false}
                  animate={{
                    width: index === currentIndex ? 24 : 8,
                    height: 8,
                  }}
                  transition={{ duration: 0.3 }}
                />
              ))}
            </motion.div>
          )}
      </div>
    </section>
  );
}