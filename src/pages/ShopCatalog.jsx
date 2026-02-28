import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Search, Filter, MapPin, Star, Sliders } from "lucide-react";
import AppHeader from "@/components/shared/AppHeader";
import ProductCard from "@/components/shared/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const CATEGORIES = [
  "engine", "brakes", "suspension", "electrical", "body", "transmission",
  "exhaust", "cooling", "steering", "interior", "accessories", "tyres", "filters", "oils_fluids"
];

export default function ShopCatalog() {
  const params = new URLSearchParams(window.location.search);
  const shopId = params.get("id");

  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedCondition, setSelectedCondition] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    if (!shopId) return;
    (async () => {
      const [s, p] = await Promise.all([
        base44.entities.Shop.filter({ id: shopId }),
        base44.entities.Product.filter({ shop_id: shopId, status: "active" }),
      ]);
      setShop(s[0]);
      setProducts(p);
      setFilteredProducts(p);
      setLoading(false);
    })();
  }, [shopId]);

  useEffect(() => {
    let filtered = products;

    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    if (selectedCondition !== "all") {
      filtered = filtered.filter(p => p.condition === selectedCondition);
    }

    // Sort
    if (sortBy === "price-low") {
      filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortBy === "price-high") {
      filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (sortBy === "newest") {
      filtered.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    }

    setFilteredProducts(filtered);
  }, [searchTerm, selectedCategory, selectedCondition, sortBy, products]);

  const handleAddToCart = async (product) => {
    const isAuth = await base44.auth.isAuthenticated();
    if (!isAuth) {
      base44.auth.redirectToLogin(createPageUrl("ShopCatalog") + `?id=${shopId}`);
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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="h-8 bg-slate-100 rounded w-1/3 animate-pulse mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-48 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!shop) return <div className="text-center py-20 text-slate-500">Shop not found</div>;

  return (
    <div>
      <AppHeader title={`${shop.name} - Parts Catalog`} backTo="BrowseShops" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Shop Header */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{shop.name}</h1>
            {shop.rating > 0 && (
              <span className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                {shop.rating.toFixed(1)}
              </span>
            )}
          </div>
          <p className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
            <MapPin className="w-4 h-4" />
            {shop.address}
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search parts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat.replace('_', ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedCondition} onValueChange={setSelectedCondition}>
              <SelectTrigger>
                <SelectValue placeholder="Condition" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Conditions</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="used">Used</SelectItem>
                <SelectItem value="refurbished">Refurbished</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <Filter className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p>No parts found matching your filters</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Showing {filteredProducts.length} part{filteredProducts.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {filteredProducts.map(p => (
                <ProductCard key={p.id} product={p} onAddToCart={handleAddToCart} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}