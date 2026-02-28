import React from "react";
import { Package, CheckCircle2, Truck, Home, Clock } from "lucide-react";

const ORDER_STEPS = [
  { key: "pending", label: "Pending", icon: Clock },
  { key: "confirmed", label: "Confirmed", icon: CheckCircle2 },
  { key: "processing", label: "Processing", icon: Package },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "delivered", label: "Delivered", icon: Home },
];

export default function OrderTrackingBar({ status }) {
  const currentStepIndex = ORDER_STEPS.findIndex(step => step.key === status);
  const isDelivered = status === "delivered";
  const isCancelled = status === "cancelled";

  if (isCancelled) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <p className="text-sm font-semibold text-red-700">Order Cancelled</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        {ORDER_STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isActive = idx <= currentStepIndex;
          const isCurrent = idx === currentStepIndex;

          return (
            <React.Fragment key={step.key}>
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "bg-slate-200 text-slate-500"
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`text-xs font-medium whitespace-nowrap ${
                  isCurrent
                    ? "text-blue-600"
                    : isActive ? "text-slate-700" : "text-slate-400"
                }`}>
                  {step.label}
                </span>
              </div>
              {idx < ORDER_STEPS.length - 1 && (
                <div className={`flex-1 h-1 mx-2 rounded-full mb-6 transition-all ${
                  idx < currentStepIndex
                    ? "bg-blue-600"
                    : "bg-slate-200"
                }`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}