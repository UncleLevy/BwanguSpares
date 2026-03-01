import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ShoppingCart, Trash2, Minus, Plus, ArrowRight, Package, CreditCard, Wallet } from "lucide-react";
import AppHeader from "@/components/shared/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Breadcrumbs from "@/components/shared/Breadcrumbs";

export default function Cart() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [checkout, setCheckout] = useState(false);
  const [form, setForm] = useState({ address: "", phone: "", notes: "", coupon: "", region: "", town: "" });
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("card"); // "card" | "mobile_money"
  const [mobileNetwork, setMobileNetwork] = useState("MTN");
  const [mobileNumber, setMobileNumber] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [regions, setRegions] = useState([]);
  const [towns, setTowns] = useState([]);
  const [filteredTowns, setFilteredTowns] = useState([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [useWallet, setUseWallet] = useState(false);
  const [walletAmount, setWalletAmount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    loadCart();
    loadRegionsAndTowns();
    const unsubscribe = base44.entities.CartItem.subscribe((event) => {
      loadCart();
    });
    return unsubscribe;
  }, []);

  const loadRegionsAndTowns = async () => {
    const [r, t] = await Promise.all([
      base44.entities.Region.list(),
      base44.entities.Town.list(),
    ]);
    setRegions(r || []);
    setTowns(t || []);
  };

  const handleRegionChange = (regionId) => {
    const region = regions.find(r => r.id === regionId);
    setForm(f => ({ ...f, region: regionId, town: "" }));
    setFilteredTowns(towns.filter(t => t.region_id === regionId || t.region === regionId || t.region === region?.name));
  };

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
      
      // Load wallet balance
      const wallets = await base44.entities.BuyerWallet.filter({ buyer_email: u.email });
      if (wallets.length > 0) {
        setWalletBalance(wallets[0].balance || 0);
      }
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

  const subtotal = items.reduce((sum, i) => sum + (i.price || 0) * (i.quantity || 1), 0);
  
  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discount_type === "percentage") {
      discountAmount = Math.floor((subtotal * appliedCoupon.discount_value) / 100);
      if (appliedCoupon.max_discount_amount) {
        discountAmount = Math.min(discountAmount, appliedCoupon.max_discount_amount);
      }
    } else {
      discountAmount = appliedCoupon.discount_value;
    }
  }
  
  const total = Math.max(0, subtotal - discountAmount);

  const groupedByShop = items.reduce((acc, item) => {
    if (!acc[item.shop_id]) acc[item.shop_id] = { shop_name: item.shop_name, items: [] };
    acc[item.shop_id].items.push(item);
    return acc;
  }, {});

  const applyCoupon = async () => {
    if (!form.coupon.trim()) {
      setCouponError("Please enter a coupon code");
      return;
    }

    try {
      const coupons = await base44.entities.DiscountCode.filter({ code: form.coupon });
      if (coupons.length === 0) {
        setCouponError("Invalid coupon code");
        setAppliedCoupon(null);
        return;
      }

      const coupon = coupons[0];
      const now = new Date();

      if (coupon.status !== "active") {
        setCouponError("This coupon is inactive");
        setAppliedCoupon(null);
        return;
      }

      if (coupon.valid_from && new Date(coupon.valid_from) > now) {
        setCouponError("This coupon is not yet valid");
        setAppliedCoupon(null);
        return;
      }

      if (coupon.valid_until && new Date(coupon.valid_until) < now) {
        setCouponError("This coupon has expired");
        setAppliedCoupon(null);
        return;
      }

      if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
        setCouponError("This coupon has reached its usage limit");
        setAppliedCoupon(null);
        return;
      }

      if (coupon.min_purchase_amount && subtotal < coupon.min_purchase_amount) {
        setCouponError(`Minimum purchase of K${coupon.min_purchase_amount} required`);
        setAppliedCoupon(null);
        return;
      }

      setAppliedCoupon(coupon);
      setCouponError("");
      toast.success("Coupon applied successfully!");
    } catch (error) {
      setCouponError("Failed to apply coupon");
      setAppliedCoupon(null);
    }
  };

  const handleCheckout = async () => {
    if (!form.region) { 
      toast.error("Please select your region"); 
      return; 
    }
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
    if (useWallet && walletAmount <= 0) {
      toast.error("Please enter a valid wallet amount");
      return;
    }
    if (useWallet && walletAmount > walletBalance) {
      toast.error("Insufficient wallet balance");
      return;
    }

    // Block checkout inside iframe (preview) - open in new tab instead
    if (window.self !== window.top) {
      window.open(window.location.href, "_blank");
      toast.info("Opening the app in a new tab — please complete your checkout there.");
      return;
    }
    
    setSubmitting(true);
    try {
      const allItems = items.map(i => ({
        product_id: i.product_id,
        product_name: i.product_name,
        shop_id: i.shop_id,
        shop_name: i.shop_name,
        price: i.price || 0,
        quantity: i.quantity || 1,
        image_url: i.image_url || '',
      }));

      const amountToChargeCard = useWallet ? Math.max(0, total - walletAmount) : total;

      const response = await base44.functions.invoke('stripeCheckout', {
        items: allItems,
        delivery_address: `${form.town ? form.town + ", " : ""}${regions.find(r => r.id === form.region)?.name || ""} - ${form.address}`,
        delivery_phone: form.phone,
        notes: form.notes,
        coupon_code: appliedCoupon?.code || "",
        discount_amount: discountAmount,
        total,
        useWallet: useWallet,
        walletAmount: useWallet ? walletAmount : 0,
        cardAmount: amountToChargeCard,
      });

      if (response.data.url) {
        // Clear cart before redirecting
        if (appliedCoupon) {
          await base44.entities.DiscountCode.update(appliedCoupon.id, { usage_count: (appliedCoupon.usage_count || 0) + 1 });
        }
        for (const item of items) {
          await base44.entities.CartItem.delete(item.id);
        }
        window.location.href = response.data.url;
      } else {
        toast.error(response.data.error || "Failed to initiate payment");
      }
    } catch (error) {
      toast.error("Failed to initiate payment. Please try again.");
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
      <div className="max-w-3xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
      <Breadcrumbs items={[{ label: "Cart" }]} />
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
                      <div className="flex items-center gap-0.5">
                        <button onClick={() => updateQty(item, -1)} className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"><Minus className="w-3 h-3" /></button>
                        <span className="w-8 text-center text-sm font-medium dark:text-slate-200">{item.quantity || 1}</span>
                        <button onClick={() => updateQty(item, 1)} className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"><Plus className="w-3 h-3" /></button>
                      </div>
                      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 ml-2 text-right min-w-max">K{((item.price||0)*(item.quantity||1)).toLocaleString()}</span>
                      <button onClick={() => removeItem(item)} className="ml-1 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
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
                 <span>K{subtotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
               </div>
               {discountAmount > 0 && (
                 <div className="flex justify-between text-sm text-emerald-600">
                   <span>Discount ({appliedCoupon.discount_type === "percentage" ? `${appliedCoupon.discount_value}%` : "Fixed"})</span>
                   <span>-K{discountAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                 </div>
               )}
               <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                 <span>VAT (16%)</span>
                 <span>K{(total - total / 1.16).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
               </div>
               <div className="flex justify-between text-lg font-bold text-slate-900 dark:text-slate-100">
                 <span>Total</span>
                 <span className="text-blue-600">K{total.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
               </div>
             </div>

            {!checkout ? (
              <Button onClick={() => setCheckout(true)} className="w-full h-12 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm gap-2">
                Proceed to Checkout <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <div className="space-y-4">
                 <div className="grid grid-cols-2 gap-3">
                   <div>
                     <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Region *</Label>
                     <select
                       value={form.region}
                       onChange={e => handleRegionChange(e.target.value)}
                       className="mt-2 w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                     >
                       <option value="">Select region</option>
                       {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                     </select>
                   </div>
                   <div>
                     <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">City / Town</Label>
                     <select
                       value={form.town}
                       onChange={e => setForm({...form, town: e.target.value})}
                       disabled={!form.region}
                       className="mt-2 w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
                     >
                       <option value="">Select city</option>
                       {filteredTowns.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                     </select>
                   </div>
                 </div>
                 <div>
                    <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Delivery Address *</Label>
                    <Input value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="Street / house number" className="mt-2 rounded-xl bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600" />
                  </div>
                 <div>
                   <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Phone Number *</Label>
                   <Input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+260 7XX XXX XXX" className="mt-2 rounded-xl bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600" />
                 </div>
                 <div>
                    <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Coupon Code (optional)</Label>
                    <div className="flex flex-col sm:flex-row gap-2 mt-2">
                      <Input value={form.coupon} onChange={e => { setForm({...form, coupon: e.target.value}); setCouponError(""); }} placeholder="Enter coupon code" className="rounded-xl bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600" />
                      <Button onClick={applyCoupon} variant="outline" className="rounded-xl sm:w-auto">Apply</Button>
                    </div>
                    {couponError && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{couponError}</p>}
                    {appliedCoupon && <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">✓ {appliedCoupon.code} applied</p>}
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Notes (optional)</Label>
                    <Textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Any special instructions" className="mt-2 rounded-xl bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600" rows={2} />
                  </div>
                {/* Payment Method Selector */}
                 <div>
                   <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Payment Method</Label>
                   <div className="grid grid-cols-3 gap-3 mt-2">
                     <button
                       type="button"
                       onClick={() => setPaymentMethod("card")}
                       className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition-all ${paymentMethod === "card" ? "border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" : "border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-slate-300"}`}
                     >
                       <CreditCard className="w-4 h-4" /> Card
                     </button>
                     <button
                       type="button"
                       onClick={() => setPaymentMethod("mobile_money")}
                       className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition-all ${paymentMethod === "mobile_money" ? "border-green-600 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400" : "border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-slate-300"}`}
                     >
                       📱 Mobile Money
                     </button>
                     {walletBalance > 0 && (
                       <button
                         type="button"
                         onClick={() => setPaymentMethod("wallet")}
                         className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition-all ${paymentMethod === "wallet" ? "border-purple-600 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400" : "border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-slate-300"}`}
                       >
                         <Wallet className="w-4 h-4" /> Wallet
                       </button>
                     )}
                   </div>
                 </div>

                 {paymentMethod === "mobile_money" && (
                   <div className={`space-y-3 p-4 rounded-xl border transition-all ${
                     mobileNetwork === "MTN" ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700" :
                     mobileNetwork === "Airtel" ? "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700" :
                     "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700"
                   }`}>
                     <div>
                       <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Network</Label>
                       <div className="grid grid-cols-3 gap-2 mt-2">
                         {[
                           { name: "MTN", active: "bg-yellow-400 border-yellow-400 text-black", inactive: "border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800" },
                           { name: "Airtel", active: "bg-red-600 border-red-600 text-white", inactive: "border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800" },
                           { name: "Zamtel", active: "bg-green-600 border-green-600 text-white", inactive: "border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800" },
                         ].map(n => (
                           <button key={n.name} type="button" onClick={() => setMobileNetwork(n.name)}
                             className={`p-2 rounded-lg border text-sm font-medium transition-all ${mobileNetwork === n.name ? n.active : n.inactive}`}>
                             {n.name}
                           </button>
                         ))}
                       </div>
                     </div>
                     <div>
                       <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Mobile Money Number</Label>
                       <Input
                         type="tel"
                         value={mobileNumber}
                         onChange={e => setMobileNumber(e.target.value)}
                         placeholder="e.g. 0976 000 000"
                         className="mt-2 rounded-xl bg-white dark:bg-slate-700/50 border-slate-200 dark:border-slate-600"
                       />
                     </div>
                     <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                       <span className="text-amber-600 text-sm">⚠️</span>
                       <p className="text-xs text-amber-700 dark:text-amber-400">
                         Mobile money payments via <strong>Flutterwave</strong> — coming soon. Add your Flutterwave API keys in settings to enable this.
                       </p>
                     </div>
                   </div>
                 )}

                 {paymentMethod === "wallet" && (
                   <div className="space-y-3 p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-300 dark:border-purple-700">
                     <div>
                       <div className="flex justify-between items-baseline mb-2">
                         <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Wallet Balance</Label>
                         <span className="text-sm font-bold text-purple-600 dark:text-purple-400">K{walletBalance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                       </div>
                       <div className="flex items-center gap-2 mb-3">
                         <input
                           type="checkbox"
                           checked={useWallet}
                           onChange={e => {
                             setUseWallet(e.target.checked);
                             if (e.target.checked) setWalletAmount(Math.min(walletBalance, total));
                             else setWalletAmount(0);
                           }}
                           className="w-4 h-4 rounded"
                         />
                         <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Use wallet credit for this order</label>
                       </div>
                     </div>
                     {useWallet && (
                       <div>
                         <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Amount to use from wallet (K)</Label>
                         <Input
                           type="number"
                           value={walletAmount}
                           onChange={e => setWalletAmount(Math.min(walletBalance, Math.max(0, Number(e.target.value))))}
                           min={0}
                           max={walletBalance}
                           className="mt-2 rounded-xl bg-white dark:bg-slate-700/50 border-slate-200 dark:border-slate-600"
                         />
                         <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                           Remaining to pay with card: <strong>K{Math.max(0, total - walletAmount).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong>
                         </p>
                       </div>
                     )}
                   </div>
                 )}

                 <Button
                   onClick={paymentMethod === "card" || paymentMethod === "wallet" ? handleCheckout : () => toast.info("Mobile money coming soon! Add your Flutterwave API keys to enable.")}
                   disabled={submitting || (paymentMethod === "wallet" && !useWallet)}
                   className={`w-full h-12 rounded-xl text-sm gap-2 ${
                     paymentMethod === "card" ? "bg-blue-600 hover:bg-blue-700" :
                     paymentMethod === "wallet" ? "bg-purple-600 hover:bg-purple-700" :
                     mobileNetwork === "MTN" ? "bg-yellow-400 hover:bg-yellow-500 text-black" :
                     mobileNetwork === "Airtel" ? "bg-red-600 hover:bg-red-700" :
                     "bg-green-600 hover:bg-green-700"
                   }`}
                 >
                   {paymentMethod === "card" ? <CreditCard className="w-4 h-4" /> : paymentMethod === "wallet" ? <Wallet className="w-4 h-4" /> : <span>📱</span>}
                   {submitting ? "Processing..." : paymentMethod === "card" ? "Pay with Card" : paymentMethod === "wallet" ? "Complete Payment" : `Pay with ${mobileNetwork} Mobile Money`}
                 </Button>
                 <p className="text-center text-xs text-slate-400 mt-1">
                   {paymentMethod === "card" ? "Powered by Stripe · Secure payment" : paymentMethod === "wallet" ? "Pay using your wallet credit" : "Powered by Flutterwave · Supports MTN, Airtel & Zamtel"}
                 </p>
              </div>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}