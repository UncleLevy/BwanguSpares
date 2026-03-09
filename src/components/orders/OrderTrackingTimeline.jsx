import React from "react";
import { CheckCircle2, Circle, Clock, Package, Truck, MapPin, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const STEPS = [
  { key: "ordered",    label: "Order Placed",  statuses: ["pending"],                          icon: Package },
  { key: "confirmed",  label: "Confirmed",     statuses: ["confirmed"],                         icon: CheckCircle2 },
  { key: "processing", label: "Processing",    statuses: ["processing"],                        icon: Clock },
  { key: "shipped",    label: "Shipped",       statuses: ["shipped"],                           icon: Truck },
  { key: "delivered",  label: "Delivered",     statuses: ["delivered"],                         icon: Star },
];

const STATUS_ORDER = ["pending", "confirmed", "processing", "shipped", "delivered"];

function getStepState(stepStatuses, currentStatus) {
  if (currentStatus === "cancelled") return "cancelled";
  const currentIdx = STATUS_ORDER.indexOf(currentStatus);
  const stepIdx = Math.max(...stepStatuses.map(s => STATUS_ORDER.indexOf(s)));
  if (currentIdx >= stepIdx) return "done";
  if (currentIdx === stepIdx - 1) return "active";
  return "upcoming";
}

export default function OrderTrackingTimeline({ order }) {
  if (!order) return null;

  const isCancelled = order.status === "cancelled";
  const currentIdx = STATUS_ORDER.indexOf(order.status);

  return (
    <Card className="border-slate-100 dark:border-slate-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Truck className="w-4 h-4 text-blue-600" /> Order Tracking
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isCancelled ? (
          <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800">
            <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center flex-shrink-0">
              <Circle className="w-4 h-4 text-red-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-red-700 dark:text-red-400">Order Cancelled</p>
              {order.cancellation_reason && (
                <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">{order.cancellation_reason}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="relative">
            {STEPS.map((step, i) => {
              const state = getStepState(step.statuses, order.status);
              const Icon = step.icon;
              const isLast = i === STEPS.length - 1;

              // Timestamp logic: use order created_date for first step, updated_date for current
              const isCurrentStep = STATUS_ORDER.indexOf(order.status) === Math.max(...step.statuses.map(s => STATUS_ORDER.indexOf(s)));
              const isDone = state === "done";
              const showDate = isDone || isCurrentStep;

              // Date display
              let dateStr = null;
              if (i === 0) {
                dateStr = new Date(order.created_date).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
              } else if (isCurrentStep || (isDone && i === currentIdx)) {
                dateStr = new Date(order.updated_date || order.created_date).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
              }

              return (
                <div key={step.key} className="flex gap-4">
                  {/* Icon + vertical line */}
                  <div className="flex flex-col items-center">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all ${
                      state === "done"
                        ? "bg-blue-600 border-blue-600 text-white"
                        : state === "active"
                          ? "bg-white dark:bg-slate-800 border-blue-500 text-blue-600 shadow-md shadow-blue-200 dark:shadow-blue-900/40"
                          : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400"
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    {!isLast && (
                      <div className={`w-0.5 flex-1 my-1 min-h-[28px] rounded-full ${
                        state === "done" ? "bg-blue-500" : "bg-slate-200 dark:bg-slate-700"
                      }`} />
                    )}
                  </div>

                  {/* Content */}
                  <div className={`pb-5 min-w-0 ${isLast ? "" : ""}`}>
                    <p className={`text-sm font-semibold leading-tight ${
                      state === "done" ? "text-blue-600 dark:text-blue-400"
                      : state === "active" ? "text-slate-900 dark:text-slate-100"
                      : "text-slate-400 dark:text-slate-500"
                    }`}>{step.label}</p>

                    {dateStr && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{dateStr}</p>
                    )}

                    {/* Extra info for shipped step */}
                    {step.key === "shipped" && (state === "done" || state === "active") && (
                      <div className="mt-2 space-y-1">
                        {order.tracking_number && (
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            <span className="font-medium">Tracking #:</span>{" "}
                            <span className="font-mono">{order.tracking_number}</span>
                          </p>
                        )}
                        {order.current_location && (
                          <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-blue-500 flex-shrink-0" />
                            {order.current_location}
                          </p>
                        )}
                        {order.estimated_delivery && (
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            <span className="font-medium">Est. delivery:</span> {order.estimated_delivery}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}