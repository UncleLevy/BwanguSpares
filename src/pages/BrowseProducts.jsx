import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Search, SlidersHorizontal, X, FileSearch } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import ProductCard from "@/components/shared/ProductCard";
import PartsRequestForm from "@/components/parts/PartsRequestForm";
import PullToRefresh from "@/components/shared/PullToRefresh";
import MobileSelect from "@/components/shared/MobileSelect";

const CATEGORIES = [
  { value: "engine", label: "Engine" },
  { value: "brakes", label: "Brakes" },
  { value: "suspension", label: "Suspension" },
  { value: "electrical", label: "Electrical" },
  { value: "body", label: "Body" },
  { value: "transmission", label: "Transmission" },
  { value: "exhaust", label: "Exhaust" },
  { value: "cooling", label: "Cooling" },
  { value: "steering", label: "Steering" },
  { value: "interior", label: "Interior" },
  { value: "accessories", label: "Accessories" },
  { value: "tyres", label: "Tyres" },
  { value: "filters", label: "Filters" },
  { value: "oils_fluids", label: "Oils & Fluids" },
  { value: "other", label: "Other" },
];

export default function BrowseProducts() {
  const params = new URLSearchParams(window.location.search);
  const initialQ = params.get("q") || "";

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialQ);
  const [category, setCategory] = useState("all");
  const [condition, setCondition] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [requestFormOpen, setRequestFormOpen] = useState(false);

  useEffect(() => {
    loadProducts();
  }, [category, condition, sortBy]);

  const loadProducts = async () => {
    setLoading(true);
    const filter = { status: "active" };
    if (category !== "all") filter.category = category;
    if (condition !== "all") filter.condition = condition;
    
    const sort = sortBy === "newest" ? "-created_date" : sortBy === "price_low" ? "price" : "-price";
    const data = await base44.entities.Product.filter(filter, sort, 50);
    setProducts(data);
    setLoading(false);
  };

  const filteredProducts = products.filter(p =>
    !search || p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase()) ||
    p.compatible_vehicles?.toLowerCase().includes(search.toLowerCase()) ||
    p.brand?.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddToCart = async (product) => {
    if ((product.stock_quantity || 0) === 0) {
      toast.error("Out of stock — submit a parts request instead");
      return;
    }
    const isAuth = await base44.auth.isAuthenticated();
    if (!isAuth) {
      base44.auth.redirectToLogin(createPageUrl("BrowseProducts"));
      return;
    }
    const user = await base44.auth.me();
    const existing = await base44.entities.CartItem.filter({ buyer_email: user.email, product_id: product.id });
    if (existing.length > 0) {
      const newQty = Math.min(product.stock_quantity, (existing[0].quantity || 1) + 1);
      await base44.entities.CartItem.update(existing[0].id, { quantity: newQty });
    } else {
      await base44.entities.CartItem.create({
        buyer_email: user.email, product_id: product.id, product_name: product.name,
        shop_id: product.shop_id, shop_name: product.shop_name, price: product.price,
        quantity: 1, image_url: product.image_url,
      });
    }
    toast.success("Added to cart");
  };

  return (
    <PullToRefresh onRefresh={loadProducts}>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Browse Auto Parts</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Find the spares you need from verified shops across Zambia</p>
      </div>

      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search parts, brands, vehicles..."
            className="pl-10 h-11 rounded-xl" />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          )}
        </div>
        <MobileSelect
          value={category}
          onValueChange={setCategory}
          placeholder="Category"
          triggerClassName="w-full md:w-44"
          options={[{ value: "all", label: "All Categories" }, ...CATEGORIES]}
        />
        <MobileSelect
          value={condition}
          onValueChange={setCondition}
          placeholder="Condition"
          triggerClassName="w-full md:w-36"
          options={[
            { value: "all", label: "All Conditions" },
            { value: "new", label: "New" },
            { value: "used", label: "Used" },
            { value: "refurbished", label: "Refurbished" },
          ]}
        />
        <MobileSelect
          value={sortBy}
          onValueChange={setSortBy}
          placeholder="Sort"
          triggerClassName="w-full md:w-40"
          options={[
            { value: "newest", label: "Newest First" },
            { value: "price_low", label: "Price: Low to High" },
            { value: "price_high", label: "Price: High to Low" },
          ]}
        />
      </div>

      {(category !== "all" || condition !== "all") && (
        <div className="flex gap-2 mb-4">
          {category !== "all" && (
            <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => setCategory("all")}>
              {CATEGORIES.find(c=>c.value===category)?.label} <X className="w-3 h-3" />
            </Badge>
          )}
          {condition !== "all" && (
            <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => setCondition("all")}>
              {condition} <X className="w-3 h-3" />
            </Badge>
          )}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
              <div className="h-44 bg-slate-100" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-slate-100 rounded w-3/4" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-20">
          <SlidersHorizontal className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="font-semibold text-slate-700">No parts found</h3>
          <p className="text-sm text-slate-500 mt-1">Try adjusting your search or filters</p>
          <div className="mt-6 p-5 bg-blue-50 rounded-2xl border border-blue-100 max-w-sm mx-auto">
            <FileSearch className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-800">Can't find what you need?</p>
            <p className="text-xs text-slate-500 mt-1 mb-3">Submit a parts request and verified shops will contact you directly.</p>
            <Button onClick={() => setRequestFormOpen(true)} className="bg-blue-600 hover:bg-blue-700 gap-2">
              <FileSearch className="w-4 h-4" /> Request this Part
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {filteredProducts.map(p => <ProductCard key={p.id} product={p} onAddToCart={handleAddToCart} />)}
        </div>
      )}

      {filteredProducts.length > 0 && (
        <div className="mt-12 p-6 bg-blue-50 rounded-2xl border border-blue-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-slate-800">Can't find the exact part?</p>
            <p className="text-sm text-slate-500 mt-0.5">Submit a request and verified shops will contact you directly.</p>
          </div>
          <Button onClick={() => setRequestFormOpen(true)} className="bg-blue-600 hover:bg-blue-700 gap-2 shrink-0">
            <FileSearch className="w-4 h-4" /> Request a Part
          </Button>
        </div>
      )}

      <PartsRequestForm open={requestFormOpen} onClose={() => setRequestFormOpen(false)} />
    </div>
    </PullToRefresh>
  );
}