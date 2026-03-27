import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Search, MapPin, ArrowRight } from "lucide-react";

const QUICK_SEARCHES = ["Brake Pads", "Oil Filters", "Batteries", "Tyres", "Spark Plugs"];

export default function HeroSection() {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const navigate = useNavigate();
  const bgRef = useRef(null);
  const textRef = useRef(null);

  // Parallax on desktop only
  useEffect(() => {
    const onScroll = () => {
      if (window.innerWidth < 768) return;
      const y = window.scrollY;
      if (bgRef.current) bgRef.current.style.transform = `translateY(${y * 0.35}px)`;
      if (textRef.current) textRef.current.style.transform = `translateY(${y * 0.12}px)`;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) navigate(createPageUrl("BrowseProducts") + `?q=${encodeURIComponent(query.trim())}`);
  };

  const handleQuick = (term) => {
    navigate(createPageUrl("BrowseProducts") + `?q=${encodeURIComponent(term)}`);
  };

  return (
    <section className="relative overflow-hidden">
      {/* Background with parallax */}
      <div ref={bgRef} className="absolute inset-0 will-change-transform" style={{ top: "-20%", bottom: "-20%" }}>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=1920&q=80')] bg-cover bg-center" />
        <div className="absolute inset-0 gradient-blue opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-t from-blue-950/70 via-transparent to-transparent" />
      </div>

      <div
        className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-36"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 3.5rem)" }}
      >
        <div ref={textRef} className="max-w-2xl will-change-transform">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm text-white/90 text-xs font-medium mb-4 md:mb-6 border border-white/10">
            <MapPin className="w-3 h-3" />
            Zambia's Auto Spares Marketplace
          </div>

          {/* Headline */}
          <h1
            className="text-[2rem] leading-tight md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight"
            style={{ textShadow: "0 2px 12px rgba(0,0,0,0.45)" }}
          >
            Find the right parts,<br />
            <span className="text-blue-200">close to you.</span>
          </h1>

          <p
            className="mt-3 text-sm md:text-lg text-blue-100/80 leading-relaxed max-w-md"
            style={{ textShadow: "0 1px 6px rgba(0,0,0,0.4)" }}
          >
            Browse thousands of auto spare parts from verified shops across Zambia.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="mt-6 md:mt-8 flex gap-2 max-w-lg">
            <div
              className={`relative flex-1 transition-all duration-200 ${focused ? "scale-[1.01]" : ""}`}
            >
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="Search parts, brands, SKU..."
                className="w-full pl-11 pr-4 h-12 bg-white text-slate-900 placeholder:text-slate-400
                           rounded-xl shadow-xl border-0 text-[15px] outline-none
                           focus:ring-2 focus:ring-white/60"
                enterKeyHint="search"
                autoComplete="off"
              />
            </div>
            <button
              type="submit"
              className="h-12 px-5 bg-slate-900 hover:bg-slate-800 active:bg-slate-950
                         text-white rounded-xl shadow-xl shrink-0 flex items-center gap-1.5
                         transition-colors text-sm font-medium"
            >
              <span className="hidden sm:inline">Search</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick search chips */}
          <div className="mt-3.5 flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-blue-200/60 mr-0.5">Popular:</span>
            {QUICK_SEARCHES.map((t) => (
              <button
                key={t}
                onClick={() => handleQuick(t)}
                className="text-[11px] px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20
                           active:bg-white/30 text-white/80 transition-colors border border-white/10"
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}