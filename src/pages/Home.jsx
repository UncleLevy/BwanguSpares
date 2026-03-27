import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Wrench, Shield, Truck, MapPin } from "lucide-react";
import { toast } from "sonner";
import { useScrollReveal } from "@/hooks/useScrollReveal";

import HeroSection from "@/components/home/HeroSection";
import BannerAdsSection from "@/components/home/HeroBannerSlider";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import MegaDiscounts from "@/components/home/MegaDiscounts";
import NearbyShops from "@/components/home/NearbyShops";
import PartnersSection from "@/components/home/PartnersSection";
import TechPartnersSection from "@/components/home/TechPartnersSection";

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

export default function Home() {
  const [products, setProducts] = useState([]);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        if (currentUser.role === "admin") {
          navigate(createPageUrl("AdminDashboard"));
          return;
        }
        if (currentUser.role === "shop_owner") {
          navigate(createPageUrl("ShopDashboard"));
          return;
        }
      }
    })();
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [prods, allShops] = await Promise.all([
          base44.entities.Product.filter({ status: "active" }, "-created_date", 8),
          base44.entities.Shop.filter({ status: "approved" }, "-created_date", 20),
        ]);
        setProducts(prods);

        let sortedShops = allShops;
        if (userLocation) {
          sortedShops = allShops
            .map(s => ({
              ...s,
              distance: s.latitude && s.longitude
                ? getDistance(userLocation.lat, userLocation.lng, s.latitude, s.longitude)
                : 9999
            }))
            .sort((a, b) => a.distance - b.distance);
        }
        setShops(sortedShops.slice(0, 6));
      } catch (error) {
        console.error("Failed to load products and shops:", error);
        setProducts([]);
        setShops([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [userLocation]);

  const handleAddToCart = async (product) => {
    const isAuth = await base44.auth.isAuthenticated();
    if (!isAuth) {
      base44.auth.redirectToLogin(createPageUrl("Home"));
      return;
    }
    const user = await base44.auth.me();
    const existing = await base44.entities.CartItem.filter({ buyer_email: user.email, product_id: product.id });
    if (existing.length > 0) {
      await base44.entities.CartItem.update(existing[0].id, { quantity: (existing[0].quantity || 1) + 1 });
    } else {
      await base44.entities.CartItem.create({
        buyer_email: user.email,
        product_id: product.id,
        product_name: product.name,
        shop_id: product.shop_id,
        shop_name: product.shop_name,
        price: product.price,
        quantity: 1,
        image_url: product.image_url,
      });
    }
    toast.success("Added to cart");
  };

  const features = [
    { icon: MapPin, title: "Location-Based", desc: "Find parts from shops nearest to you" },
    { icon: Shield, title: "Verified Shops", desc: "All shops are vetted and approved" },
    { icon: Wrench, title: "Expert Mechanics", desc: "Book skilled technicians directly" },
    { icon: Truck, title: "Fast Delivery", desc: "Get parts delivered to your door" },
  ];

  const [featuresRef, featuresVisible] = useScrollReveal();
  const [productsRef, productsVisible] = useScrollReveal();
  const [discountsRef, discountsVisible] = useScrollReveal();
  const [shopsRef, shopsVisible] = useScrollReveal();
  const [partnersRef, partnersVisible] = useScrollReveal();

  return (
    <div className="bg-white dark:bg-slate-950">
      <HeroSection />
      <BannerAdsSection />

      {/* Features Section */}
      <section
        ref={featuresRef}
        className="py-10 md:py-14 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900/50 dark:to-slate-950 border-b border-slate-100 dark:border-slate-800"
      >
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {features.map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-3 md:flex-col md:items-center md:text-center p-4 md:p-5 rounded-xl bg-gradient-to-br from-blue-50/50 to-cyan-50/50 md:bg-transparent dark:from-blue-900/20 dark:to-cyan-900/20 md:dark:from-transparent md:dark:to-transparent hover:shadow-md transition-all duration-500"
                style={{
                  opacity: featuresVisible ? 1 : 0,
                  transform: featuresVisible ? "translateY(0)" : "translateY(32px)",
                  transitionDelay: `${i * 100}ms`,
                }}
              >
                <div className="w-12 h-12 md:w-14 md:h-14 shrink-0 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center md:mb-3 shadow-lg shadow-cyan-500/20">
                  <f.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm md:text-base text-slate-900 dark:text-slate-100">{f.title}</h3>
                  <p className="text-[11px] md:text-sm text-slate-600 dark:text-slate-400 mt-1 leading-snug">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <div
        ref={productsRef}
        className="bg-white dark:bg-slate-950 transition-all duration-700"
        style={{
          opacity: productsVisible ? 1 : 0,
          transform: productsVisible ? "translateY(0)" : "translateY(40px)",
        }}
      >
        <FeaturedProducts products={products} onAddToCart={handleAddToCart} loading={loading} user={user} />
      </div>

      {/* Mega Discounts Section */}
      <div
        ref={discountsRef}
        className="transition-all duration-700"
        style={{
          opacity: discountsVisible ? 1 : 0,
          transform: discountsVisible ? "translateX(0)" : "translateX(-40px)",
        }}
      >
        <MegaDiscounts onAddToCart={handleAddToCart} user={user} />
      </div>

      {/* Nearby Shops Section */}
      <div
        ref={shopsRef}
        className="bg-white dark:bg-slate-950 transition-all duration-700"
        style={{
          opacity: shopsVisible ? 1 : 0,
          transform: shopsVisible ? "translateX(0)" : "translateX(40px)",
        }}
      >
        <NearbyShops shops={shops} loading={loading} />
      </div>

      {/* Partners Sections */}
      <div
        ref={partnersRef}
        className="transition-all duration-700"
        style={{
          opacity: partnersVisible ? 1 : 0,
          transform: partnersVisible ? "translateY(0)" : "translateY(32px)",
        }}
      >
        <TechPartnersSection />
        <PartnersSection />
      </div>
    </div>
  );
}