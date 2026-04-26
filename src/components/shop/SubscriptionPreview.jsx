import React from "react";
import { AlertCircle, Check, X } from "lucide-react";

const TIER_DETAILS = {
  basic: {
    name: "Basic",
    price: 0,
    period: "Forever Free",
    listings: 10,
    features: [
      { name: "Product listings", included: true, limit: "Up to 10" },
      { name: "Basic shop profile", included: true },
      { name: "Order management", included: true },
      { name: "Customer messaging", included: true },
      { name: "Sales analytics", included: false, premium: true },
      { name: "Market insights", included: false, premium: true },
      { name: "Revenue tracking", included: false, premium: true },
      { name: "Customer behavior reports", included: false, premium: true },
      { name: "Email campaigns", included: false, premium: true },
      { name: "API access", included: false, premium: true },
      { name: "Bulk operations", included: false, premium: true },
      { name: "Priority support", included: false, premium: true },
    ],
  },
  standard: {
    name: "Standard",
    price: 100,
    period: "per month",
    listings: 500,
    features: [
      { name: "Product listings", included: true, limit: "Up to 500" },
      { name: "Basic shop profile", included: true },
      { name: "Order management", included: true },
      { name: "Customer messaging", included: true },
      { name: "Sales analytics", included: true },
      { name: "Market insights", included: true, premium: true },
      { name: "Revenue tracking", included: true },
      { name: "Customer behavior reports", included: true, premium: true },
      { name: "Email campaigns", included: true },
      { name: "API access", included: false, premium: true },
      { name: "Bulk operations", included: true },
      { name: "Priority support", included: true },
    ],
  },
  premium: {
    name: "Premium",
    price: 250,
    period: "per month",
    listings: "Unlimited",
    features: [
      { name: "Product listings", included: true, limit: "Unlimited" },
      { name: "Basic shop profile", included: true },
      { name: "Order management", included: true },
      { name: "Customer messaging", included: true },
      { name: "Sales analytics", included: true },
      { name: "Market insights", included: true, premium: true },
      { name: "Revenue tracking", included: true },
      { name: "Customer behavior reports", included: true, premium: true },
      { name: "Email campaigns", included: true },
      { name: "API access", included: true, premium: true },
      { name: "Bulk operations", included: true },
      { name: "Priority support", included: true },
    ],
  },
};

export default function SubscriptionPreview({ selectedTier, shopName }) {
  const tier = TIER_DETAILS[selectedTier];
  if (!tier) return null;

  const renewalDate = new Date();
  renewalDate.setMonth(renewalDate.getMonth() + 1);
  const formattedDate = renewalDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 sm:p-8 mb-6">
      <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">
        Order Summary
      </h3>

      {/* Plan Overview */}
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-xl p-6 mb-6 border border-slate-200 dark:border-slate-700">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Plan Type
            </p>
            <h4 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {tier.name} Plan
            </h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Shop: <strong>{shopName}</strong>
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Monthly Fee
            </p>
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              K{tier.price}
            </p>
            {tier.price > 0 && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                Charged every month
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-300 dark:border-slate-600">
          <div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Product Listings
            </p>
            <p className="font-bold text-slate-900 dark:text-slate-100 mt-1">
              {typeof tier.listings === "number"
                ? tier.listings.toLocaleString()
                : tier.listings}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Renewal Date
            </p>
            <p className="font-bold text-slate-900 dark:text-slate-100 mt-1">
              {formattedDate}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Auto-Renewal
            </p>
            <p className="font-bold text-slate-900 dark:text-slate-100 mt-1">
              Enabled
            </p>
          </div>
        </div>
      </div>

      {/* Features Included */}
      <div className="mb-6">
        <h5 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">
          What's Included
        </h5>
        <div className="space-y-3">
          {tier.features.map((feature, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              {feature.included ? (
                <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              ) : (
                <X className="w-5 h-5 text-slate-300 dark:text-slate-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-medium ${
                      feature.included
                        ? "text-slate-900 dark:text-slate-100"
                        : "text-slate-400 dark:text-slate-600"
                    }`}
                  >
                    {feature.name}
                  </span>
                  {feature.premium && (
                    <span className="inline-block bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded text-xs font-semibold">
                      Premium Analytics
                    </span>
                  )}
                </div>
                {feature.limit && feature.included && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {feature.limit}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info Messages */}
      {selectedTier === "basic" && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
              Upgrade Anytime
            </p>
            <p className="text-sm text-blue-800 dark:text-blue-400 mt-1">
              You can upgrade to Standard or Premium plans at any time to unlock
              advanced analytics and market insights.
            </p>
          </div>
        </div>
      )}

      {selectedTier === "standard" && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-900 dark:text-amber-300">
              Unlock Premium Features
            </p>
            <p className="text-sm text-amber-800 dark:text-amber-400 mt-1">
              Upgrade to Premium (K250/month) for API access, white-label options,
              and advanced market insights.
            </p>
          </div>
        </div>
      )}

      {selectedTier === "premium" && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4 flex gap-3">
          <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-emerald-900 dark:text-emerald-300">
              Full Access to Premium Analytics
            </p>
            <p className="text-sm text-emerald-800 dark:text-emerald-400 mt-1">
              You have unlimited listings and access to all market insights,
              customer behavior analytics, and advanced tools.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}