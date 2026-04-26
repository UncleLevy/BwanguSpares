import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Crown, CreditCard, Smartphone, ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import CardPaymentForm from "@/components/checkout/CardPaymentForm";
import { notifySuccess, notifyError, notifyInfo, notifyPaymentProcessing } from "@/components/shared/NotificationToast";
import AppHeader from "@/components/shared/AppHeader";

export default function SubscriptionCheckout() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [shop, setShop] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [cardDetails, setCardDetails] = useState({ cardNumber: "", expiry: "", cardExpiryMonth: "", cardExpiryYear: "", cardCvv: "", billingCity: "" });
  const [momoPhone, setMomoPhone] = useState("");
  const [momoOperator, setMomoOperator] = useState("mtn");
  const [submitting, setSubmitting] = useState(false);
  const [momoStatus, setMomoStatus] = useState(null);
  const [momoPolling, setMomoPolling] = useState(false);
  const [cardStatus, setCardStatus] = useState(null);

  useEffect(() => {
    (async () => {
      const u = await base44.auth.me();
      if (!u) {
        navigate(createPageUrl("Home"));
        return;
      }
      setUser(u);
      // Get first shop
      const shops = await base44.entities.Shop.filter({ owner_email: u.email });
      if (shops.length > 0) {
        setShop(shops[0]);
      }
    })();
  }, []);

  const PLAN_AMOUNT = 250; // K250 for premium

  const handleCardPayment = async () => {
    if (!cardDetails.cardNumber || !cardDetails.cardExpiryMonth || !cardDetails.cardExpiryYear || !cardDetails.cardCvv) {
      notifyError("Card Details Missing", "Please enter your full card details");
      return;
    }

    setSubmitting(true);
    notifyPaymentProcessing();
    setCardStatus("pending");

    try {
      const response = await base44.functions.invoke('lencoSubscriptionCardCollect', {
        cardNumber: cardDetails.cardNumber,
        cardExpiryMonth: cardDetails.cardExpiryMonth,
        cardExpiryYear: cardDetails.cardExpiryYear,
        cardCvv: cardDetails.cardCvv,
        billingCity: cardDetails.billingCity,
        amount: PLAN_AMOUNT,
        currency: "ZMW",
        tier: "premium",
      });

      const result = response.data;

      if (result.error) {
        setCardStatus("failed");
        notifyError("Card Error", result.error);
        setSubmitting(false);
        return;
      }

      if (result.status === "3ds-auth-required" && result.redirectUrl) {
        setCardStatus("3ds");
        // Update subscription before redirect
        const subs = await base44.entities.Subscription.filter({ user_email: user.email });
        if (subs.length > 0) {
          await base44.entities.Subscription.update(subs[0].id, { tier: "premium" });
        } else {
          await base44.entities.Subscription.create({
            user_email: user.email,
            tier: "premium",
            status: "active",
            max_shops: 5,
          });
        }
        notifyInfo("Verifying Payment", "Redirecting to 3D Secure verification…");
        setSubmitting(false);
        setTimeout(() => { window.location.replace(result.redirectUrl); }, 1000);
        return;
      }

      if (result.status === "successful") {
        setCardStatus("successful");
        // Update subscription
        const subs = await base44.entities.Subscription.filter({ user_email: user.email });
        if (subs.length > 0) {
          await base44.entities.Subscription.update(subs[0].id, { tier: "premium" });
        } else {
          await base44.entities.Subscription.create({
            user_email: user.email,
            tier: "premium",
            status: "active",
            max_shops: 5,
          });
        }
        notifySuccess("Upgrade Successful", "Welcome to Premium!");
        setSubmitting(false);
        setTimeout(() => { window.location.reload(); }, 1500);
        return;
      }
    } catch (error) {
      notifyError("Payment Error", "Payment processing failed. Please try again.");
      setSubmitting(false);
    }
  };

  const handleMomoPayment = async () => {
    if (!momoPhone.trim()) {
      notifyError("Mobile Money Required", "Please enter your mobile money number");
      return;
    }

    setSubmitting(true);
    notifyInfo("Payment Pending", "Approval required on your phone");
    setMomoStatus("pay-offline");

    try {
      const response = await base44.functions.invoke('lencoSubscriptionMomoCollect', {
        phone: momoPhone,
        operator: momoOperator,
        amount: PLAN_AMOUNT,
        tier: "premium",
      });

      if (!response.data.success) {
        notifyError("Payment Failed", response.data.error || "Failed to initiate mobile money payment");
        setSubmitting(false);
        return;
      }

      const { reference } = response.data;
      setMomoPolling(true);
      setSubmitting(false);

      // Poll for status every 5s for up to 2 minutes
      const maxAttempts = 24;
      for (let i = 0; i < maxAttempts; i++) {
        await new Promise(r => setTimeout(r, 5000));
        const statusRes = await base44.functions.invoke('lencoSubscriptionMomoStatus', { reference, tier: "premium" });
        const txStatus = statusRes.data?.status;
        setMomoStatus(txStatus);

        if (txStatus === "successful") {
          // Update subscription
          const subs = await base44.entities.Subscription.filter({ user_email: user.email });
          if (subs.length > 0) {
            await base44.entities.Subscription.update(subs[0].id, { tier: "premium" });
          } else {
            await base44.entities.Subscription.create({
              user_email: user.email,
              tier: "premium",
              status: "active",
              max_shops: 5,
            });
          }
          notifySuccess("Upgrade Successful", "Welcome to Premium!");
          setMomoPolling(false);
          setTimeout(() => { window.location.reload(); }, 1500);
          break;
        } else if (txStatus === "failed") {
          notifyError("Payment Declined", "Mobile money payment was declined. Please try again.");
          break;
        }
      }

      setMomoPolling(false);
    } catch (error) {
      notifyError("Payment Error", "Payment processing failed. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div>
      <AppHeader title="Upgrade to Premium" backTo="ShopDashboard" />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 safe-pb">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 mb-4">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Unlock Premium</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">Get exclusive features and analytics tools</p>
        </div>

        {/* Plan Summary */}
        <Card className="border-slate-200 dark:border-slate-700 mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <p className="text-sm text-slate-600 dark:text-slate-400">Plan</p>
                <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">Premium</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-slate-600 dark:text-slate-400">Price</p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">K{PLAN_AMOUNT}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-slate-600 dark:text-slate-400">Billing</p>
                <p className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">Monthly</p>
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-3">Includes</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">Unlimited product listings</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">Market insights & analytics</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">Email campaigns & targeting</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">Up to 5 shop branches</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">Priority 24/7 support</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Method Selection */}
        <div className="mb-6">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">Choose Payment Method</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setPaymentMethod("card")}
              className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                paymentMethod === "card"
                  ? "border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                  : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300"
              }`}
            >
              <CreditCard className="w-4 h-4" /> Card
            </button>
            <button
              onClick={() => setPaymentMethod("momo")}
              className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                paymentMethod === "momo"
                  ? "border-green-600 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                  : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300"
              }`}
            >
              <Smartphone className="w-4 h-4" /> Mobile Money
            </button>
          </div>
        </div>

        {/* Card Payment */}
        {paymentMethod === "card" && (
          <Card className="border-slate-200 dark:border-slate-700 mb-6">
            <CardContent className="p-6 space-y-4">
              <CardPaymentForm value={cardDetails} onChange={setCardDetails} />
              {cardStatus && (
                <div
                  className={`p-3 rounded-lg border text-center text-sm font-medium ${
                    cardStatus === "successful"
                      ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 text-emerald-700 dark:text-emerald-300"
                      : cardStatus === "failed"
                      ? "bg-red-50 dark:bg-red-900/20 border-red-300 text-red-700 dark:text-red-400"
                      : "bg-blue-50 dark:bg-blue-900/20 border-blue-300 text-blue-700 dark:text-blue-300 animate-pulse"
                  }`}
                >
                  {cardStatus === "successful" && "✅ Payment successful!"}
                  {cardStatus === "failed" && "❌ Card was declined. Please try again."}
                  {cardStatus === "3ds" && "🔐 Redirecting to 3D Secure verification…"}
                  {cardStatus === "pending" && "⏳ Processing payment…"}
                </div>
              )}
              <Button
                onClick={handleCardPayment}
                disabled={submitting}
                className="w-full bg-blue-600 hover:bg-blue-700 gap-2"
              >
                <CreditCard className="w-4 h-4" />
                {submitting ? "Processing..." : `Pay K${PLAN_AMOUNT} with Card`}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Mobile Money Payment */}
        {paymentMethod === "momo" && (
          <Card className="border-slate-200 dark:border-slate-700 mb-6">
            <CardContent className="p-6 space-y-4">
              <div>
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Network</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {[
                    { id: "mtn", label: "MTN MoMo" },
                    { id: "airtel", label: "Airtel Money" },
                  ].map(n => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => setMomoOperator(n.id)}
                      className={`p-2 rounded-lg border-2 text-sm font-medium transition-all ${
                        momoOperator === n.id
                          ? `border-${n.id === "mtn" ? "yellow" : "red"}-600 bg-${n.id === "mtn" ? "yellow" : "red"}-600 text-white`
                          : "border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800"
                      }`}
                    >
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
                  className="mt-2 rounded-xl"
                />
              </div>

              {momoStatus && (
                <div
                  className={`p-3 rounded-lg border text-center text-sm font-medium ${
                    momoStatus === "successful"
                      ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 text-emerald-700 dark:text-emerald-300"
                      : momoStatus === "failed"
                      ? "bg-red-50 dark:bg-red-900/20 border-red-300 text-red-700 dark:text-red-400"
                      : "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 text-yellow-700 dark:text-yellow-300 animate-pulse"
                  }`}
                >
                  {momoStatus === "successful" && "✅ Payment successful!"}
                  {momoStatus === "failed" && "❌ Payment failed or was declined."}
                  {(momoStatus === "pay-offline" || momoStatus === "pending") && "⏳ Waiting for approval on your phone…"}
                </div>
              )}

              <Button
                onClick={handleMomoPayment}
                disabled={submitting || momoPolling}
                className="w-full bg-green-600 hover:bg-green-700 gap-2"
              >
                <Smartphone className="w-4 h-4" />
                {submitting || momoPolling ? "Processing..." : `Pay K${PLAN_AMOUNT} via Mobile Money`}
              </Button>

              <p className="text-xs text-slate-600 dark:text-slate-400 text-center">
                📲 A payment prompt of <strong>K{PLAN_AMOUNT}</strong> will be sent to your phone. Approve it to complete the upgrade.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Info */}
        <div className="text-center text-xs text-slate-600 dark:text-slate-400">
          <p>Your subscription will auto-renew monthly. You can cancel anytime from your shop settings.</p>
        </div>
      </div>
    </div>
  );
}