import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Wrench, Shield, Truck, MapPin } from "lucide-react";
import { toast } from "sonner";

import HeroSection from "@/components/home/HeroSection";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import NearbyShops from "@/components/home/NearbyShops";

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

  return (
    <div>
      <HeroSection />

      <section className="py-12 border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <div key={i} className="text-center">
                <div className="w-12 h-12 mx-auto rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mb-3">
                  <f.icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">{f.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <FeaturedProducts products={products} onAddToCart={handleAddToCart} loading={loading} user={user} />
      <NearbyShops shops={shops} loading={loading} />
    </div>
  );
}