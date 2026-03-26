import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";

export default function HeroBannerSlider() {
  const [banners, setBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const b = await base44.entities.Banner.filter({ is_active: true }, "display_order", 100);
      setBanners(b);
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
  const isMobile = window.innerWidth < 768;
  const isTablet = window.innerWidth < 1024;
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
    <div className="relative w-full overflow-hidden rounded-2xl bg-slate-900 group">
      {/* Slide */}
      <div className="relative w-full h-96 sm:h-[500px] lg:h-[600px]">
        <img
          src={imageUrl}
          alt={currentBanner.name}
          className="w-full h-full object-cover cursor-pointer transition-opacity duration-500"
          onClick={handleBannerClick}
        />
        {/* Overlay gradient for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
      </div>

      {/* Navigation arrows */}
      {banners.length > 1 && (
        <>
          <Button
            onClick={handlePrev}
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white text-slate-900 opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button
            onClick={handleNext}
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white text-slate-900 opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </>
      )}

      {/* Indicator dots */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
              className={`h-2.5 rounded-full transition-all ${
                index === currentIndex
                  ? "bg-white w-8"
                  : "bg-white/50 w-2.5 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}