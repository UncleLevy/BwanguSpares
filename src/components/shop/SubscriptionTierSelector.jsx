import React from "react";
import { Check, Zap, Crown, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const TIERS = [
  {
    id: "basic",
    name: "Basic",
    price: 0,
    period: "Forever Free",
    listings: 10,
    description: "Perfect for getting started",
    features: [
      "10 product listings",
      "Basic shop profile",
      "Order management",
      "Customer messaging",
    ],
    icon: Sparkles,
    color: "from-slate-400 to-slate-500",
    borderColor: "border-slate-200 dark:border-slate-700",
  },
  {
    id: "standard",
    name: "Standard",
    price: 100,
    period: "per month",
    listings: 500,
    description: "For growing shops",
    features: [
      "500 product listings",
      "Advanced analytics",
      "Email campaigns",
      "Bulk operations",
      "Priority support",
      "Custom shop branding",
    ],
    icon: Zap,
    color: "from-blue-400 to-cyan-500",
    borderColor: "border-blue-200 dark:border-blue-700",
    popular: true,
  },
  {
    id: "premium",
    name: "Premium",
    price: 250,
    period: "per month",
    listings: "Unlimited",
    description: "For high-volume sellers",
    features: [
      "Unlimited product listings",
      "Advanced market insights",
      "API access",
      "Dedicated account manager",
      "Custom integrations",
      "White-label options",
      "Premium support 24/7",
    ],
    icon: Crown,
    color: "from-amber-400 to-orange-500",
    borderColor: "border-amber-200 dark:border-amber-700",
  },
];

export default function SubscriptionTierSelector({ selected, onChange }) {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Choose Your Plan
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Pick the perfect plan for your shop. Upgrade or downgrade anytime.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {TIERS.map((tier, idx) => {
          const Icon = tier.icon;
          const isSelected = selected === tier.id;

          return (
            <motion.button
              key={tier.id}
              onClick={() => onChange(tier.id)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`relative text-left rounded-2xl overflow-hidden transition-all duration-300 ${
                isSelected
                  ? `ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-slate-900 shadow-xl transform scale-105`
                  : "hover:shadow-lg"
              } ${tier.popular ? "md:scale-105 md:-translate-y-2" : ""}`}
            >
              {/* Background gradient */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${tier.color} opacity-10`}
              />

              {/* Border */}
              <div
                className={`absolute inset-0 border-2 ${tier.borderColor} rounded-2xl`}
              />

              {/* Popular badge */}
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <span className="inline-block bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-1 rounded-full text-xs font-bold shadow-lg">
                    MOST POPULAR
                  </span>
                </div>
              )}

              <div className="relative p-6 sm:p-8">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className={`p-2.5 rounded-xl bg-gradient-to-br ${tier.color}`}
                      >
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                      {tier.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {tier.description}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>

                {/* Price */}
                <div className="mb-6 pb-6 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-slate-900 dark:text-slate-100">
                      K{tier.price}
                    </span>
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      {tier.period}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
                    {typeof tier.listings === "number"
                      ? `Up to ${tier.listings.toLocaleString()} listings`
                      : `${tier.listings} listings`}
                  </p>
                </div>

                {/* Features */}
                <ul className="space-y-3">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* Selection indicator */}
                <div
                  className={`mt-6 pt-6 border-t border-slate-200 dark:border-slate-700 text-center transition-all ${
                    isSelected
                      ? "text-blue-600 dark:text-blue-400 font-semibold"
                      : "text-slate-500 dark:text-slate-400 text-sm"
                  }`}
                >
                  {isSelected ? "✓ Selected" : "Click to select"}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Info message */}
      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
        <p className="text-sm text-blue-900 dark:text-blue-300">
          <strong>💳 Payment Required:</strong> Standard and Premium tiers require
          payment upon registration. You'll be prompted to pay after completing
          your shop details.
        </p>
      </div>
    </div>
  );
}