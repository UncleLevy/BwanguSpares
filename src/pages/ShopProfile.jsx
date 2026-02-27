import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { MapPin, Star, Phone, Package, Wrench, ShoppingCart, Store, User, ShieldCheck } from "lucide-react";
import MessageShopButton from "@/components/messaging/MessageShopButton";
import ReportButton from "@/components/reports/ReportButton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import ProductCard from "@/components/shared/ProductCard";
import ReviewList from "@/components/reviews/ReviewList";

export default function ShopProfile() {
  const params = new URLSearchParams(window.location.search);
  const shopId = params.get("id");

  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    if (!shopId) return;
    (async () => {
      const [s, p, t, r] = await Promise.all([
        base44.entities.Shop.filter({ id: shopId }),
        base44.entities.Product.filter({ shop_id: shopId, status: "active" }),
        base44.entities.Technician.filter({ shop_id: shopId }),
        base44.entities.Review.filter({ shop_id: shopId, type: "shop" }, "-created_date", 50),
      ]);
      setShop(s[0]);
      setProducts(p);
      setTechnicians(t);
      setReviews(r);
      setLoading(false);
    })();
  }, [shopId]);

  const handleAddToCart = async (product) => {
    const isAuth = await base44.auth.isAuthenticated();
    if (!isAuth) {
      base44.auth.redirectToLogin(createPageUrl("ShopProfile") + `?id=${shopId}`);
      return;
    }
    const user = await base44.auth.me();
    const existing = await base44.entities.CartItem.filter({ buyer_email: user.email, product_id: product.id });
    if (existing.length > 0) {
      await base44.entities.CartItem.update(existing[0].id, { quantity: (existing[0].quantity || 1) + 1 });
    } else {
      await base44.entities.CartItem.create({
        buyer_email: user.email, product_id: product.id, product_name: product.name,
        shop_id: product.shop_id, shop_name: product.shop_name, price: product.price,
        quantity: 1, image_url: product.image_url,
      });
    }
    toast.success("Added to cart");
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="h-48 bg-slate-100 rounded-2xl animate-pulse mb-6" />
        <div className="space-y-3">
          <div className="h-8 bg-slate-100 rounded w-1/3 animate-pulse" />
          <div className="h-4 bg-slate-100 rounded w-1/2 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!shop) return <div className="text-center py-20 text-slate-500">Shop not found</div>;

  const specLabels = {
    engine: "Engine", electrical: "Electrical", body_work: "Body Work", transmission: "Transmission",
    brakes: "Brakes", general: "General", diagnostics: "Diagnostics", ac_heating: "AC/Heating", tyres: "Tyres"
  };

  return (
    <div>
      <div className="relative h-48 md:h-64 bg-gradient-to-br from-blue-600 to-blue-800">
        {shop.cover_url && <img src={shop.cover_url} alt="" className="w-full h-full object-cover opacity-40" />}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <div className="w-20 h-20 rounded-2xl bg-blue-50 border-4 border-white shadow-md flex items-center justify-center overflow-hidden">
              {shop.logo_url ? <img src={shop.logo_url} alt="" className="w-full h-full object-cover" /> : <Store className="w-8 h-8 text-blue-400" />}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-slate-900">{shop.name}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm text-slate-500">
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {shop.address}</span>
                {shop.rating > 0 && <span className="flex items-center gap-1"><Star className="w-4 h-4 fill-amber-400 text-amber-400" /> {shop.rating.toFixed(1)}</span>}
                {shop.phone && <span className="flex items-center gap-1"><Phone className="w-4 h-4" /> {shop.phone}</span>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {user?.role === "admin" ? (
                <Badge className="bg-blue-50 text-blue-700 border-blue-200 capitalize">{shop.slot_type || "basic"} plan</Badge>
              ) : (shop.slot_type === "premium" || shop.slot_type === "standard") ? (
                <Badge className="bg-amber-50 text-amber-700 border-amber-200 gap-1"><ShieldCheck className="w-3 h-3" /> Pro Shop</Badge>
              ) : null}
              <MessageShopButton shop={shop} />
            </div>
          </div>
          {shop.description && <p className="text-slate-600 text-sm mt-4 leading-relaxed">{shop.description}</p>}
        </div>

        <Tabs defaultValue="products">
          <TabsList className="bg-slate-100 mb-6">
            <TabsTrigger value="products" className="gap-1.5"><Package className="w-4 h-4" /> Parts ({products.length})</TabsTrigger>
            <TabsTrigger value="technicians" className="gap-1.5"><Wrench className="w-4 h-4" /> Technicians ({technicians.length})</TabsTrigger>
            <TabsTrigger value="reviews" className="gap-1.5"><Star className="w-4 h-4" /> Reviews ({reviews.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            {products.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <Package className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>No parts listed yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {products.map(p => <ProductCard key={p.id} product={p} onAddToCart={handleAddToCart} />)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="technicians">
            {technicians.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <Wrench className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>No technicians listed yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {technicians.map(tech => (
                  <div key={tech.id} className="bg-white rounded-2xl border border-slate-100 p-5 hover-lift">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {tech.photo_url ? <img src={tech.photo_url} alt="" className="w-full h-full object-cover" /> : <User className="w-6 h-6 text-slate-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900">{tech.name}</h3>
                        <Badge variant="outline" className="mt-1 text-[11px]">{specLabels[tech.specialization] || tech.specialization}</Badge>
                        <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                          {tech.experience_years && <span>{tech.experience_years} yrs exp</span>}
                          {tech.hourly_rate && <span className="font-medium text-blue-600">K{tech.hourly_rate}/hr</span>}
                        </div>
                        <div className="mt-2">
                          <Badge className={tech.available ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}>
                            {tech.available ? "Available" : "Unavailable"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="reviews">
            <ReviewList reviews={reviews} loading={false} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}