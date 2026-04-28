import React, { useState, useEffect, useCallback, useRef } from "react";
import { useOptimisticList } from "@/components/shared/useOptimistic";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ShoppingCart, Trash2, Minus, Plus, ArrowRight, Package, CreditCard, Wallet, Truck, MapPin, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import CardPaymentForm from "@/components/checkout/CardPaymentForm";
import AppHeader from "@/components/shared/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { notifySuccess, notifyError, notifyInfo, notifyPaymentProcessing, notifyPaymentSuccess } from "@/components/shared/NotificationToast";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { useGeoLock } from "@/components/shared/useGeoLock";
import MobileSelect from "@/components/shared/MobileSelect";
import PullToRefresh from "@/components/shared/PullToRefresh";
import { useNetworkStatus, savePaymentState, getPaymentState, clearPaymentState } from "@/hooks/useNetworkStatus";

export default function Cart() {
  const { isZambia, loading: geoLoading } = useGeoLock();
  const isOnline = useNetworkStatus();
  const [items, setItems, updateItemOptimistic, removeItemOptimistic] = useOptimisticList([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [checkout, setCheckout] = useState(false);
  const [form, setForm] = useState({ address: "", phone: "", notes: "", coupon: "", region: "", town: "" });
  const [usingDefaultAddress, setUsingDefaultAddress] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("card"); // "card" | "mobile_money" | "wallet"
  const [momoOperator, setMomoOperator] = useState("mtn"); // "mtn" | "airtel"
  const [momoPhone, setMomoPhone] = useState("");
  const [cardDetails, setCardDetails] = useState({ cardNumber: "", expiry: "", cardExpiryMonth: "", cardExpiryYear: "", cardCvv: "", billingCity: "" });
  const [cardStatus, setCardStatus] = useState(null); // null | "pending" | "3ds" | "successful" | "failed"
  const [momoStatus, setMomoStatus] = useState(null); // null | "pending" | "pay-offline" | "successful" | "failed"
  const [momoPolling, setMomoPolling] = useState(false);
  const [paymentOverlay, setPaymentOverlay] = useState(null); // null | { status: "processing"|"success"|"failed"|"timeout", reference, message }
  const pollingRef = useRef(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [regions, setRegions] = useState([]);
  const [towns, setTowns] = useState([]);
  const [filteredTowns, setFilteredTowns] = useState([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [useWallet, setUseWallet] = useState(false);
  const [walletAmount, setWalletAmount] = useState(0);
  const [shippingOption, setShippingOption] = useState("collect");
  const [shippingRates, setShippingRates] = useState([]);
  const [dynamicShippingCost, setDynamicShippingCost] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    loadCart();
    loadRegionsAndTowns();
    const unsubscribe = base44.entities.CartItem.subscribe((event) => {
      // Only reload on create events (e.g. item added from another tab).
      // Delete and update are handled optimistically to avoid race conditions.
      if (event.type === "create") loadCart();
    });
    return unsubscribe;
  }, []);

  const loadRegionsAndTowns = async () => {
    const [r, t, sr] = await Promise.all([
      base44.entities.Region.list(),
      base44.entities.Town.list(),
      base44.entities.ShippingRate.list(),
    ]);
    setRegions(r || []);
    setTowns(t || []);
    setShippingRates(sr || []);
    // If a region is already pre-filled (from saved address), populate filteredTowns
    setForm(f => {
      if (f.region) {
        setFilteredTowns((t || []).filter(town => town.region_id === f.region));
      }
      return f;
    });
  };

  const handleRegionChange = (regionId) => {
    setForm(f => ({ ...f, region: regionId, town: "" }));
    setFilteredTowns(towns.filter(t => t.region_id === regionId));
    setDynamicShippingCost(0); // Reset shipping cost when region changes
  };

  const handleTownChange = (townName) => {
    setForm(f => ({ ...f, town: townName }));
    // Look up shipping rate for this town
    const town = towns.find(t => t.name === townName);
    if (town) {
      // Check if any cart item's shop has a product-specific or town-specific shipping cost
      // First look for a ShippingRate entry for this town
      const rate = shippingRates.find(sr => sr.town_id === town.id || sr.town_name?.toLowerCase() === townName.toLowerCase());
      if (rate) {
        setDynamicShippingCost(rate.default_rate || 0);
      } else {
        setDynamicShippingCost(0);
      }
    } else {
      setDynamicShippingCost(0);
    }
  };

  const loadCart = async () => {
    try {
      const u = await base44.auth.me();
      if (!u) {
        navigate(createPageUrl('Home'));
        return;
      }
      
      setUser(u);
      // Pre-fill address from user profile if use_default_address is enabled
      if (u.use_default_address !== false && (u.address || u.region || u.town)) {
        setForm(f => ({
          ...f,
          address: u.address || "",
          region: u.region || "",
          town: u.town || "",
          phone: u.phone || "",
        }));
        setUsingDefaultAddress(true);
      }
      const cart = await base44.entities.CartItem.filter({ buyer_email: u.email });
      setItems(cart || []);
      
      // Load wallet balance
      const wallets = await base44.entities.BuyerWallet.filter({ buyer_email: u.email });
      if (wallets.length > 0) {
        setWalletBalance(wallets[0].balance || 0);
      }
    } catch (error) {
      notifyError("Cart Error", "Failed to load cart");
    } finally {
      setLoading(false);
    }
  };

  const updateQty = async (item, delta) => {
    const newQty = Math.max(1, (item.quantity || 1) + delta);
    // Optimistically update UI immediately
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, quantity: newQty } : i));
    try {
      await base44.entities.CartItem.update(item.id, { quantity: newQty });
    } catch (e) {
      // Rollback on failure
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, quantity: item.quantity || 1 } : i));
      notifyError("Update Failed", "Could not update item quantity");
    }
  };

  const removeItem = async (item) => {
    // Optimistically remove from UI immediately
    setItems(prev => prev.filter(i => i.id !== item.id));
    try {
      await base44.entities.CartItem.delete(item.id);
      notifySuccess("Item Removed", "Product removed from cart");
    } catch (e) {
      // Restore item on failure
      setItems(prev => [...prev, item]);
      notifyError("Removal Failed", "Could not remove item from cart");
    }
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
  
  const shippingCost = shippingOption === "deliver" ? (dynamicShippingCost > 0 ? dynamicShippingCost : 50) : 0;
  const total = Math.max(0, subtotal - discountAmount + shippingCost);

  const groupedByShop = items.reduce((acc, item) => {
    if (!acc[item.shop_id]) acc[item.shop_id] = { shop_name: item.shop_name, items: [] };
    acc[item.shop_id].items.push(item);
    return acc;
  }, {});

  const applyCoupon = async () => {
    if (!form.coupon.trim()) {
      notifyError("Invalid Coupon", "Please enter a coupon code");
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
      notifySuccess("Coupon Applied", `${coupon.code} - ${coupon.discount_type === "percentage" ? coupon.discount_value + "% off" : "K" + coupon.discount_value + " off"}`);
    } catch (error) {
      setCouponError("Failed to apply coupon");
      setAppliedCoupon(null);
    }
  };

  /**
   * Poll the DB order (by stripe_session_id = reference) every 2.5s for up to 2 min.
   * The webhook (lencoCallback) will update order.status → "confirmed" when payment lands.
   * Returns "confirmed" | "failed" | "timeout".
   */
  const pollOrderStatus = async (reference) => {
    const POLL_INTERVAL = 2500;
    const MAX_WAIT_MS = 120_000; // 2 minutes
    const startTime = Date.now();
    pollingRef.current = true;

    while (pollingRef.current && Date.now() - startTime < MAX_WAIT_MS) {
      await new Promise(r => setTimeout(r, POLL_INTERVAL));
      try {
        const orders = await base44.entities.Order.filter({ stripe_session_id: reference });
        if (orders.length > 0) {
          const status = orders[0].status;
          if (status === "confirmed") return "confirmed";
          if (status === "failed" || status === "cancelled") return "failed";
        }
      } catch (_) {
        // network blip — keep polling
      }
    }
    return pollingRef.current ? "timeout" : "cancelled";
  };

  const handleCheckout = async () => {
    if (!form.region) { notifyError("Region Required", "Please select your region"); return; }
    if (!form.address.trim()) { notifyError("Address Required", "Please enter your delivery address"); return; }
    if (!form.phone.trim()) { notifyError("Phone Required", "Please enter your phone number"); return; }
    if (!/^\+?\d{7,15}$/.test(form.phone.replace(/\s/g, ""))) {
      notifyError("Invalid Phone", "Enter a valid phone number (e.g. +260 7XX XXX XXX)"); return;
    }
    if (paymentMethod === "mobile_money" && !momoPhone.trim()) {
      notifyError("Mobile Money Required", "Please enter your mobile money number"); return;
    }
    if (useWallet && walletAmount <= 0) { notifyError("Invalid Amount", "Please enter a valid wallet amount"); return; }
    if (useWallet && walletAmount > walletBalance) { notifyError("Insufficient Balance", "Your wallet doesn't have enough balance"); return; }
    if (isZambia === false) { notifyError("Orders Unavailable", "Orders are only available within Zambia."); return; }

    if (window.self !== window.top) {
      window.open(window.location.href, "_blank");
      notifyInfo("Opening New Tab", "Please complete your checkout in the new tab");
      return;
    }

    setSubmitting(true);

    try {
      const allItems = items.map(i => ({
        product_id: i.product_id, product_name: i.product_name,
        shop_id: i.shop_id, shop_name: i.shop_name,
        price: i.price || 0, quantity: i.quantity || 1, image_url: i.image_url || '',
      }));
      const deliveryAddress = `${form.town ? form.town + ", " : ""}${regions.find(r => r.id === form.region)?.name || ""} - ${form.address}`;

      // ── WALLET-ONLY ────────────────────────────────────────────────────────
      if (paymentMethod === "wallet" && useWallet && walletAmount >= total) {
        const response = await base44.functions.invoke('walletPaymentCheckout', {
          items: allItems, deliveryAddress, deliveryPhone: form.phone,
          notes: form.notes, couponCode: appliedCoupon?.code || "",
          discountAmount, total, shippingOption, shippingCost,
        });
        if (response.data.success) {
          if (appliedCoupon) {
            await base44.entities.DiscountCode.update(appliedCoupon.id, { usage_count: (appliedCoupon.usage_count || 0) + 1 }).catch(() => {});
          }
          clearPaymentState();
          notifyPaymentSuccess();
          setSubmitting(false);
          setTimeout(() => navigate(createPageUrl("OrderSuccess")), 1500);
        } else {
          notifyError("Payment Failed", response.data.error || "Wallet payment could not be processed");
          setSubmitting(false);
        }
        return;
      }

      // ── MOBILE MONEY ───────────────────────────────────────────────────────
      if (paymentMethod === "mobile_money") {
        const response = await base44.functions.invoke('lencoMomoCollect', {
          phone: momoPhone, operator: momoOperator, amount: total,
          items: allItems, delivery_address: deliveryAddress,
          delivery_phone: form.phone, notes: form.notes,
          coupon_code: appliedCoupon?.code || "", discount_amount: discountAmount,
          total, shippingOption, shippingCost,
        });

        if (!response.data.success) {
          notifyError("Payment Failed", response.data.error || "Failed to initiate mobile money payment");
          setSubmitting(false);
          return;
        }

        const { reference } = response.data;
        savePaymentState({ reference, type: 'momo', items, total });
        setSubmitting(false);

        // Show processing overlay and poll the DB
        setPaymentOverlay({ status: "processing", reference, message: "Approve the payment prompt on your phone…" });
        const result = await pollOrderStatus(reference);

        if (result === "confirmed") {
          if (appliedCoupon) {
            await base44.entities.DiscountCode.update(appliedCoupon.id, { usage_count: (appliedCoupon.usage_count || 0) + 1 }).catch(() => {});
          }
          clearPaymentState();
          setPaymentOverlay({ status: "success", reference, message: "Payment confirmed! Redirecting…" });
          setTimeout(() => navigate(createPageUrl("OrderSuccess") + `?order=${reference}`), 1500);
        } else if (result === "failed") {
          setPaymentOverlay({ status: "failed", reference, message: "Payment was declined. Please try again." });
        } else {
          setPaymentOverlay({ status: "timeout", reference, message: "Payment confirmation timed out. If you were charged, contact support with ref: " + reference });
        }
        return;
      }

      // ── CARD ───────────────────────────────────────────────────────────────
      if (!cardDetails.cardNumber || !cardDetails.cardExpiryMonth || !cardDetails.cardExpiryYear || !cardDetails.cardCvv) {
        notifyError("Card Details Missing", "Please enter your full card details");
        setSubmitting(false);
        return;
      }

      const amountToChargeCard = useWallet ? Math.max(0, total - walletAmount) : total;

      // Show processing overlay immediately
      setPaymentOverlay({ status: "processing", reference: null, message: "Sending payment to bank…" });

      const response = await base44.functions.invoke('lencoCardCollect', {
        cardNumber: cardDetails.cardNumber, cardExpiryMonth: cardDetails.cardExpiryMonth,
        cardExpiryYear: cardDetails.cardExpiryYear, cardCvv: cardDetails.cardCvv,
        billingCity: cardDetails.billingCity, amount: amountToChargeCard, currency: "ZMW",
        items: allItems, delivery_address: deliveryAddress,
        delivery_phone: form.phone, notes: form.notes,
        coupon_code: appliedCoupon?.code || "", discount_amount: discountAmount,
        total, shippingOption, shippingCost, useWallet, walletAmount: useWallet ? walletAmount : 0,
      });

      const result = response.data;

      if (result.error) {
        setPaymentOverlay({ status: "failed", reference: null, message: result.error });
        setSubmitting(false);
        return;
      }

      if (result.reference) savePaymentState({ ...result, type: 'card', items, total });

      // 3DS redirect
      if (result.status === "3ds-auth-required" && result.redirectUrl) {
        if (appliedCoupon) {
          await base44.entities.DiscountCode.update(appliedCoupon.id, { usage_count: (appliedCoupon.usage_count || 0) + 1 }).catch(() => {});
        }
        savePaymentState({ reference: result.reference, type: 'card_3ds', items, total });
        setPaymentOverlay({ status: "processing", reference: result.reference, message: "Redirecting to 3D Secure verification…" });
        setSubmitting(false);
        setTimeout(() => { window.location.replace(result.redirectUrl); }, 1000);
        return;
      }

      if (result.status === "failed") {
        setPaymentOverlay({ status: "failed", reference: result.reference, message: "Your card was declined. Please try again." });
        setSubmitting(false);
        return;
      }

      // status is "successful" or "pending" — poll DB for webhook confirmation
      const reference = result.reference;
      setPaymentOverlay({ status: "processing", reference, message: "Processing payment… waiting for bank confirmation." });
      setSubmitting(false);

      const dbResult = await pollOrderStatus(reference);

      if (dbResult === "confirmed") {
        if (appliedCoupon) {
          await base44.entities.DiscountCode.update(appliedCoupon.id, { usage_count: (appliedCoupon.usage_count || 0) + 1 }).catch(() => {});
        }
        clearPaymentState();
        setPaymentOverlay({ status: "success", reference, message: "Payment confirmed! Redirecting…" });
        setTimeout(() => navigate(createPageUrl("OrderSuccess") + `?order=${reference}`), 1500);
      } else if (dbResult === "failed") {
        setPaymentOverlay({ status: "failed", reference, message: "Payment was declined. Please try again." });
      } else {
        setPaymentOverlay({ status: "timeout", reference, message: "Confirmation timed out. If you were charged, contact support with ref: " + reference });
      }

    } catch (error) {
      console.error("Checkout error:", error);
      notifyError("Checkout Error", "Payment failed. Please try again.");
      setPaymentOverlay(null);
      setSubmitting(false);
    }
  };

  // Payment processing full-screen overlay
  if (paymentOverlay) {
    const isProcessing = paymentOverlay.status === "processing";
    const isSuccess = paymentOverlay.status === "success";
    const isFailed = paymentOverlay.status === "failed" || paymentOverlay.status === "timeout";

    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white dark:bg-slate-900 px-6 text-center">
        <div className="mb-6">
          {isProcessing && (
            <div className="w-20 h-20 mx-auto rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-4">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            </div>
          )}
          {isSuccess && (
            <div className="w-20 h-20 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
          )}
          {isFailed && (
            <div className="w-20 h-20 mx-auto rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-4">
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
          )}
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          {isProcessing ? "Processing Payment" : isSuccess ? "Payment Confirmed!" : "Payment Failed"}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mb-6">{paymentOverlay.message}</p>
        {paymentOverlay.reference && (
          <p className="text-xs text-slate-400 mb-6">Ref: {paymentOverlay.reference}</p>
        )}
        {isProcessing && (
          <div className="flex gap-1 mt-2">
            {[0,1,2].map(i => (
              <div key={i} className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        )}
        {isFailed && (
          <Button
            onClick={() => { setPaymentOverlay(null); pollingRef.current = false; }}
            className="bg-blue-600 hover:bg-blue-700 rounded-xl"
          >
            Try Again
          </Button>
        )}
      </div>
    );
  }

  if (loading) return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />)}</div>
    </div>
  );

  return (
    <PullToRefresh onRefresh={loadCart}>
    <div>
      <AppHeader title="Shopping Cart" backTo="BrowseProducts" />
      <div className="max-w-3xl mx-auto px-3 sm:px-6 py-4 sm:py-6 safe-pb">
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
                      <div className="flex items-center gap-1">
                         <button onClick={() => updateQty(item, -1)} className="w-9 h-9 md:w-7 md:h-7 rounded-lg border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors active:scale-95"><Minus className="w-4 md:w-3 h-4 md:h-3" /></button>
                         <span className="w-10 md:w-8 text-center text-sm font-medium dark:text-slate-200">{item.quantity || 1}</span>
                         <button onClick={() => updateQty(item, 1)} className="w-9 h-9 md:w-7 md:h-7 rounded-lg border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors active:scale-95"><Plus className="w-4 md:w-3 h-4 md:h-3" /></button>
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
               {shippingCost > 0 && (
                 <div className="flex justify-between text-sm text-blue-600">
                   <span>Shipping</span>
                   <span>+K{shippingCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
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
              isZambia === false ? (
                <div className="text-center py-3 px-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                  <p className="text-sm font-semibold text-red-700 dark:text-red-400">🌍 Orders are only available within Zambia.</p>
                  <p className="text-xs text-red-500 dark:text-red-400 mt-1">We currently only ship to Zambian addresses.</p>
                </div>
              ) : (
              <Button onClick={() => setCheckout(true)} className="w-full h-12 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm gap-2">
                Proceed to Checkout <ArrowRight className="w-4 h-4" />
              </Button>
              )
            ) : (
              <div className="space-y-4">
                 {/* Default address toggle */}
                 {user?.address && (
                   <div className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all ${usingDefaultAddress ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20" : "border-slate-200 dark:border-slate-600"}`}>
                     <div className="flex items-center gap-2">
                       <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0" />
                       <div>
                         <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Saved Address</p>
                         <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[200px]">{user.town ? `${user.town}, ` : ""}{user.address}</p>
                       </div>
                     </div>
                     <button
                       type="button"
                       onClick={() => {
                         if (!usingDefaultAddress) {
                           setForm(f => ({ ...f, address: user.address || "", region: user.region || "", town: user.town || "", phone: user.phone || "" }));
                         } else {
                           setForm(f => ({ ...f, address: "", region: "", town: "", phone: "" }));
                         }
                         setUsingDefaultAddress(!usingDefaultAddress);
                       }}
                       className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${usingDefaultAddress ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200"}`}
                     >
                       {usingDefaultAddress ? "Using saved" : "Use saved"}
                     </button>
                   </div>
                 )}
                 <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Region *</Label>
                    <MobileSelect
                      value={form.region}
                      onValueChange={handleRegionChange}
                      placeholder="Select region"
                      triggerClassName="mt-2 w-full"
                      options={regions.map(r => ({ value: r.id, label: r.name }))}
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">City / Town</Label>
                    <MobileSelect
                      value={form.town}
                      onValueChange={handleTownChange}
                      placeholder={!form.region ? "Select region first" : "Select city"}
                      triggerClassName="mt-2 w-full"
                      options={filteredTowns.map(t => ({ value: t.name, label: t.name }))}
                    />
                  </div>
                 </div>
                 <div>
                    <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">{shippingOption === "deliver" ? "Delivery" : "Billing"} Address *</Label>
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

                  {/* Shipping Option */}
                  <div>
                    <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Delivery Method</Label>
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      <button
                        type="button"
                        onClick={() => setShippingOption("collect")}
                        className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition-all ${shippingOption === "collect" ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" : "border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-slate-300"}`}
                      >
                        📍 Collect
                      </button>
                      <button
                        type="button"
                        onClick={() => setShippingOption("deliver")}
                        className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition-all ${shippingOption === "deliver" ? "border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" : "border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-slate-300"}`}
                      >
                        <Truck className="w-4 h-4" /> Deliver ({form.town ? `K${(dynamicShippingCost > 0 ? dynamicShippingCost : 50).toLocaleString()}` : "select town"})
                      </button>
                    </div>
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
                   {paymentMethod === "mobile_money" && (
                     <div className="mt-3 space-y-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                       <div>
                         <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Network</Label>
                         <div className="grid grid-cols-2 gap-2 mt-2">
                           {[
                             { id: "mtn", label: "MTN MoMo", color: "border-yellow-400 bg-yellow-400 text-black", inactive: "border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400" },
                             { id: "airtel", label: "Airtel Money", color: "border-red-600 bg-red-600 text-white", inactive: "border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400" },
                           ].map(n => (
                             <button key={n.id} type="button" onClick={() => setMomoOperator(n.id)}
                               className={`p-2 rounded-lg border-2 text-sm font-medium transition-all ${momoOperator === n.id ? n.color : n.inactive + " bg-white dark:bg-slate-800"}`}>
                               {n.label}
                             </button>
                           ))}
                         </div>
                       </div>
                       <div>
                         <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Mobile Money Number *</Label>
                         <Input
                           type="tel"
                           value={momoPhone}
                           onChange={e => setMomoPhone(e.target.value)}
                           placeholder="e.g. 0976 000 000"
                           className="mt-2 rounded-xl bg-white dark:bg-slate-700/50 border-slate-200 dark:border-slate-600"
                         />
                       </div>

                       <p className="text-xs text-green-700 dark:text-green-400">
                         📲 A payment prompt of <strong>K{total.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong> will be sent to your phone. Approve it to complete the order.
                       </p>
                     </div>
                   )}
                 </div>

                 {/* Card payment form */}
                 {paymentMethod === "card" && (
                   <div className="space-y-2">
                     <CardPaymentForm value={cardDetails} onChange={setCardDetails} />
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
                   onClick={handleCheckout}
                   disabled={submitting || (paymentMethod === "wallet" && !useWallet) || !isOnline}
                   className={`w-full h-12 md:h-10 rounded-xl text-sm md:text-base gap-2 font-semibold transition-all active:scale-95 ${
                     !isOnline ? "bg-slate-400 cursor-not-allowed opacity-60" :
                     paymentMethod === "card" ? "bg-blue-600 hover:bg-blue-700" :
                     paymentMethod === "mobile_money" ? "bg-green-600 hover:bg-green-700" :
                     "bg-purple-600 hover:bg-purple-700"
                   }`}
                 >
                   {submitting ? (
                     <>
                       <Loader2 className="w-4 h-4 animate-spin" />
                       <span className="hidden sm:inline">Processing…</span>
                     </>
                   ) : !isOnline ? (
                     "Offline - No connection"
                   ) : (
                     <>
                       {paymentMethod === "card" ? <CreditCard className="w-5 h-5 md:w-4 md:h-4" /> : paymentMethod === "wallet" ? <Wallet className="w-5 h-5 md:w-4 md:h-4" /> : <span>📱</span>}
                       <span className="hidden sm:inline">
                         {paymentMethod === "card" ? "Pay with Card" : paymentMethod === "mobile_money" ? `Pay K${total.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : "Complete Payment"}
                       </span>
                       <span className="sm:hidden">
                         {paymentMethod === "card" ? "Card" : paymentMethod === "mobile_money" ? "MoMo" : "Pay"}
                       </span>
                     </>
                   )}
                 </Button>
                 <p className="text-center text-xs text-slate-400 mt-1">
                   Powered by Lenco · Secure payment
                 </p>
              </div>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
    </PullToRefresh>
  );
}