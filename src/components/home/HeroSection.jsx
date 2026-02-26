import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Search, MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function HeroSection() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(createPageUrl("BrowseProducts") + `?q=${encodeURIComponent(query)}`);
  };

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=1920&q=80')] bg-cover bg-center" />
      <div className="absolute inset-0 gradient-blue opacity-85" />
      <div className="absolute inset-0 bg-gradient-to-t from-blue-900/80 to-transparent" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-36">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm text-white/90 text-xs font-medium mb-6">
            <MapPin className="w-3.5 h-3.5" />
            Zambia's Auto Parts Marketplace
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight">
            Find the right parts,<br />
            <span className="text-blue-200">close to you.</span>
          </h1>
          
          <p className="mt-5 text-lg text-blue-100/80 leading-relaxed max-w-lg">
            Browse thousands of auto spare parts from verified shops across Zambia. Get expert mechanics and fast delivery.
          </p>

          <form onSubmit={handleSearch} className="mt-8 flex gap-2 max-w-lg">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search brake pads, filters, batteries..."
                className="pl-11 h-12 bg-white border-0 text-slate-900 placeholder:text-slate-400 rounded-xl shadow-lg"
              />
            </div>
            <Button type="submit" className="h-12 px-6 bg-slate-900 hover:bg-slate-800 rounded-xl shadow-lg">
              Search
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </form>

          <div className="mt-6 flex items-center gap-4 text-sm text-blue-200/70">
            <span>Popular:</span>
            {["Brake Pads", "Oil Filters", "Batteries", "Tyres"].map(t => (
              <button key={t} onClick={() => { setQuery(t); navigate(createPageUrl("BrowseProducts") + `?q=${encodeURIComponent(t)}`); }}
                className="hover:text-white transition-colors underline underline-offset-2">
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}