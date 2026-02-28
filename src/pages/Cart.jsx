import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ShoppingCart, Trash2, Minus, Plus, ArrowRight, Package } from "lucide-react";
import AppHeader from "@/components/shared/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function Cart() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [checkout, setCheckout] = useState(false);
  const [form, setForm] = useState({ address: "", phone: "", notes: "", coupon: "" });
  const [submitting, setSubmitting] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      const u = await base44.auth.me();
      if (!u) {
        navigate(createPageUrl('Home'));
        return;
      }
      
      setUser(u);
      const cart = await base44.entities.CartItem.filter({ buyer_email: u.email });
      setItems(cart || []);
    } catch (error) {
      toast.error("Failed to load cart");
    } finally {
      setLoading(false);
    }
  };

  const updateQty = async (item, delta) => {
    const newQty = Math.max(1, (item.quantity || 1) + delta);
    try {
      await base44.entities.CartItem.update(item.id, { quantity: newQty });
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, quantity: newQty } : i));
    } catch (error) {
      toast.error("Failed to update quantity");
    }
  };

  const removeItem = async (item) => {
    await base44.entities.CartItem.delete(item.id);
    setItems(items.filter(i => i.id !== item.id));
    toast.success("Item removed");
  };

  const total = items.reduce((sum, i) => sum + (i.price || 0) * (i.quantity || 1), 0);

  const groupedByShop = items.reduce((acc, item) => {
    if (!acc[item.shop_id]) acc[item.shop_id] = { shop_name: item.shop_name, items: [] };
    acc[item.shop_id].items.push(item);
    return acc;
  }, {});

  const handleCheckout = async () => {
    if (!form.address.trim()) { 
      toast.error("Please enter your delivery address"); 
      return; 
    }
    if (!form.phone.trim()) { 
      toast.error("Please enter your phone number"); 
      return; 
    }
    if (!/^\+?\d{7,15}$/.test(form.phone.replace(/\s/g, ""))) { 
      toast.error("Enter a valid phone number (e.g. +260 7XX XXX XXX)"); 
      return; 
    }
    
    setSubmitting(true);
    try {
      for (const [shopId, group] of Object.entries(groupedByShop)) {
        const shopTotal = group.items.reduce((s, i) => s + (i.price||0)*(i.quantity||1), 0);
        await base44.entities.Order.create({
          buyer_email: user.email,
          buyer_name: user.full_name,
          shop_id: shopId,
          shop_name: group.shop_name,
          items: group.items.map(i => ({
            product_id: i.product_id,
            product_name: i.product_name,
            quantity: i.quantity || 1,
            price: i.price,
            image_url: i.image_url,
          })),
          total_amount: shopTotal,
          delivery_address: form.address,
          delivery_phone: form.phone,
          notes: form.notes,
          coupon_code: form.coupon,
          status: "pending",
        });
      }

      for (const item of items) {
        await base44.entities.CartItem.delete(item.id);
      }

      toast.success("Order placed successfully!");
      navigate(createPageUrl("BuyerDashboard"));
    } catch (error) {
      toast.error("Failed to place order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />)}</div>
    </div>
  );

  return (
    <div>
      <AppHeader title="Shopping Cart" backTo="BrowseProducts" />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="hidden md:block text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">Shopping Cart</h1>

      {items.length === 0 ? (
        <div className="text-center py-20">
          <ShoppingCart className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h3 className="font-semibold text-slate-700 dark:text-slate-300">Your cart is empty</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-4">Browse parts and add them to your cart</p>
          <Button onClick={() => navigate(createPageUrl("BrowseProducts"))} className="bg-blue-600 hover:bg-blue-700">
            Browse Parts
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByShop).map(([shopId, group]) => (
            <div key={shopId} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-300 dark:border-slate-700 overflow-hidden">
              <div className="px-5 py-3 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-300 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300">
                {group.shop_name}
              </div>
              <div className="divide-y divide-slate-50">
                {group.items.map(item => (
                  <div key={item.id} className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-xl bg-slate-50 dark:bg-slate-700 flex-shrink-0 overflow-hidden flex items-center justify-center">
                        {item.image_url ? <img src={item.image_url} alt="" className="w-full h-full object-cover" /> : <Package className="w-6 h-6 text-slate-300" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{item.product_name}</h4>
                        <p className="text-sm font-semibold text-blue-600 mt-0.5">K{item.price?.toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => updateQty(item, -1)} className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"><Minus className="w-3 h-3" /></button>
                        <span className="w-8 text-center text-sm font-medium dark:text-slate-200">{item.quantity || 1}</span>
                        <button onClick={() => updateQty(item, 1)} className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"><Plus className="w-3 h-3" /></button>
                      </div>
                      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 w-20 text-right">K{((item.price||0)*(item.quantity||1)).toLocaleString()}</span>
                      <button onClick={() => removeItem(item)} className="text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-300 dark:border-slate-700 p-6">
            <div className="space-y-2 mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                <span>Subtotal</span>
                <span>K{(total / 1.16).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                <span>VAT (16%)</span>
                <span>K{(total - total / 1.16).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-slate-900 dark:text-slate-100">
                <span>Total</span>
                <span className="text-blue-600">K{total.toLocaleString()}</span>
              </div>
            </div>

            {!checkout ? (
              <Button onClick={() => setCheckout(true)} className="w-full h-12 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm gap-2">
                Proceed to Checkout <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm text-slate-700 dark:text-slate-300">Delivery Address *</Label>
                  <Input value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="Enter your delivery address" className="mt-1 rounded-xl" />
                </div>
                <div>
                  <Label className="text-sm text-slate-700 dark:text-slate-300">Phone Number *</Label>
                  <Input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+260 7XX XXX XXX" className="mt-1 rounded-xl" />
                </div>
                <div>
                   <Label className="text-sm text-slate-700 dark:text-slate-300">Coupon Code (optional)</Label>
                   <Input value={form.coupon} onChange={e => setForm({...form, coupon: e.target.value})} placeholder="Enter coupon or discount code" className="mt-1 rounded-xl" />
                 </div>
                 <div>
                   <Label className="text-sm text-slate-700 dark:text-slate-300">Notes (optional)</Label>
                   <Textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Any special instructions" className="mt-1 rounded-xl" rows={2} />
                 </div>
                <Button onClick={handleCheckout} disabled={submitting} className="w-full h-12 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm gap-2">
                  {submitting ? "Placing Order..." : "Place Order"}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}