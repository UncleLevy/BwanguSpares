import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Package, ShoppingCart, Store, ArrowLeft, Check, FileSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import PartsRequestForm from "@/components/parts/PartsRequestForm";

const conditionColors = {
  new: "bg-emerald-50 text-emerald-700 border-emerald-200",
  used: "bg-amber-50 text-amber-700 border-amber-200",
  refurbished: "bg-blue-50 text-blue-700 border-blue-200",
};
const categoryLabels = {
  engine: "Engine", brakes: "Brakes", suspension: "Suspension", electrical: "Electrical",
  body: "Body", transmission: "Transmission", exhaust: "Exhaust", cooling: "Cooling",
  steering: "Steering", interior: "Interior", accessories: "Accessories", tyres: "Tyres",
  filters: "Filters", oils_fluids: "Oils & Fluids", other: "Other",
};

export default function ProductDetail() {
  const id = new URLSearchParams(window.location.search).get("id");
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [requestOpen, setRequestOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const data = await base44.entities.Product.filter({ id });
      setProduct(data[0]);
      setLoading(false);
    })();
  }, [id]);

  const handleAddToCart = async () => {
    const isAuth = await base44.auth.isAuthenticated();
    if (!isAuth) { base44.auth.redirectToLogin(createPageUrl("ProductDetail") + `?id=${id}`); return; }
    const user = await base44.auth.me();
    const existing = await base44.entities.CartItem.filter({ buyer_email: user.email, product_id: product.id });
    if (existing.length > 0) {
      await base44.entities.CartItem.update(existing[0].id, { quantity: (existing[0].quantity || 1) + qty });
    } else {
      await base44.entities.CartItem.create({
        buyer_email: user.email, product_id: product.id, product_name: product.name,
        shop_id: product.shop_id, shop_name: product.shop_name, price: product.price,
        quantity: qty, image_url: product.image_url,
      });
    }
    toast.success("Added to cart");
  };

  if (loading) return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="h-96 bg-slate-100 rounded-2xl animate-pulse" />
        <div className="space-y-4"><div className="h-8 bg-slate-100 rounded w-2/3 animate-pulse" /><div className="h-4 bg-slate-100 rounded w-1/3 animate-pulse" /></div>
      </div>
    </div>
  );

  if (!product) return <div className="text-center py-20 text-slate-500">Product not found</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to={createPageUrl("BrowseProducts")} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to results
      </Link>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-slate-50 rounded-2xl overflow-hidden aspect-square flex items-center justify-center">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <Package className="w-20 h-20 text-slate-200" />
          )}
        </div>

        <div>
          <div className="flex gap-2 mb-3">
            <Badge className={`border ${conditionColors[product.condition] || conditionColors.new}`}>{product.condition}</Badge>
            <Badge variant="outline">{categoryLabels[product.category] || product.category}</Badge>
          </div>

          <h1 className="text-2xl font-bold text-slate-900">{product.name}</h1>

          <Link to={createPageUrl("ShopProfile") + `?id=${product.shop_id}`}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 mt-2">
            <Store className="w-4 h-4" /> {product.shop_name}
          </Link>

          <div className="mt-6">
            <span className="text-3xl font-bold text-blue-600">K{product.price?.toLocaleString()}</span>
          </div>

          <div className="mt-4 space-y-2 text-sm text-slate-600">
            {product.brand && <p><span className="text-slate-400">Brand:</span> {product.brand}</p>}
            {product.compatible_vehicles && <p><span className="text-slate-400">Fits:</span> {product.compatible_vehicles}</p>}
            <p className="flex items-center gap-1.5">
              <span className="text-slate-400">Stock:</span>
              {product.stock_quantity > 0 ? (
                <span className="text-emerald-600 flex items-center gap-1"><Check className="w-4 h-4" /> {product.stock_quantity} in stock</span>
              ) : (
                <span className="text-red-500">Out of stock</span>
              )}
            </p>
          </div>

          {product.description && (
            <p className="mt-4 text-sm text-slate-600 leading-relaxed">{product.description}</p>
          )}

          <div className="mt-6 flex items-center gap-3">
            <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden">
              <button onClick={() => setQty(Math.max(1, qty-1))} className="px-3 py-2 text-slate-600 hover:bg-slate-50">−</button>
              <span className="px-4 py-2 text-sm font-medium border-x border-slate-200">{qty}</span>
              <button onClick={() => setQty(qty+1)} className="px-3 py-2 text-slate-600 hover:bg-slate-50">+</button>
            </div>
            <Button onClick={handleAddToCart} className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 rounded-xl gap-2"
              disabled={product.stock_quantity === 0}>
              <ShoppingCart className="w-4 h-4" /> Add to Cart
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}