import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, MapPin, Calendar, Truck } from "lucide-react";
import { format } from "date-fns";

export default function TrackingInfo({ order }) {
  const hasTracking = order.tracking_number || order.current_location || order.estimated_delivery;

  if (!hasTracking) {
    return (
      <Card className="border-slate-100">
        <CardContent className="p-6 text-center text-slate-500 text-sm">
          <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p>No tracking information available yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-100">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Truck className="w-4 h-4 text-blue-600" />
          Order Tracking
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {order.tracking_number && (
          <div className="flex items-start gap-3">
            <Package className="w-4 h-4 text-slate-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-slate-500">Tracking Number</p>
              <p className="font-mono text-sm font-medium text-slate-900">{order.tracking_number}</p>
            </div>
          </div>
        )}
        {order.current_location && (
          <div className="flex items-start gap-3">
            <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-slate-500">Current Location</p>
              <p className="text-sm text-slate-900">{order.current_location}</p>
            </div>
          </div>
        )}
        {order.estimated_delivery && (
          <div className="flex items-start gap-3">
            <Calendar className="w-4 h-4 text-slate-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-slate-500">Estimated Delivery</p>
              <p className="text-sm text-slate-900">
                {format(new Date(order.estimated_delivery), "MMMM d, yyyy")}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}