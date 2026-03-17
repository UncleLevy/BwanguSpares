import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Package, MapPin, Phone, CreditCard, Hash, Calendar, User, Store, Tag } from "lucide-react";
import { useOptimisticValue } from "@/components/shared/useOptimistic";
import AppHeader from "@/components/shared/AppHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";
import OrderTrackingTimeline from "@/components/orders/OrderTrackingTimeline";
import { emailOrderStatusUpdate } from "@/components/lib/emailNotifications";

const orderStatusColors = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  confirmed: "bg-blue-50 text-blue-700 border-blue-200",
  processing: "bg-indigo-50 text-indigo-700 border-indigo-200",
  shipped: "bg-purple-50 text-purple-700 border-purple-200",
  delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
};

export default function OrderDetails() {
  const [order, setOrder, applyOptimistic] = useOptimisticValue(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get("id");

  useEffect(() => {
    (async () => {
      if (!orderId) { navigate(createPageUrl("ShopDashboard")); return; }
      const u = await base44.auth.me();
      setUser(u);
      const orders = await base44.entities.Order.filter({ id: orderId });
      if (orders.length === 0) {
        toast.error("Order not found");
        navigate(createPageUrl("ShopDashboard"));
        return;
      }
      setOrder(orders[0]);
      setLoading(false);
    })();
  }, [orderId]);

  const updateStatus = async (status) => {
    const prevStatus = order.status;
    await applyOptimistic(
      { status },
      () => base44.entities.Order.update(order.id, { status }),
      () => toast.error("Failed to update status")
    );
    emailOrderStatusUpdate(order.buyer_email, order.buyer_name, { ...order, status }, status);
    toast.success("Order status updated");
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
    </div>
  );

  const subtotal = order.items?.reduce((s, i) => s + (i.price || 0) * (i.quantity || 1), 0) || 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      <AppHeader title={`Order #${order.id?.slice(0,8)}`} backTo="ShopDashboard" />
      <div className="p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="hidden md:flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(createPageUrl("ShopDashboard") + "?view=orders")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Order Details</h1>
            <p className="text-sm text-slate-500 font-mono">#{order.id}</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <Badge className={`${orderStatusColors[order.status]} border text-sm px-3 py-1`}>{order.status}</Badge>
            <Select value={order.status} onValueChange={updateStatus}>
              <SelectTrigger className="h-9 w-36 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"].map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Order Items */}
          <div className="lg:col-span-2 space-y-5">
            <Card className="border-slate-100 dark:border-slate-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-600" /> Items Ordered
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {order.items?.map((item, i) => (
                    <div key={i} className="flex items-center gap-4 px-6 py-4">
                      <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {item.image_url
                          ? <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                          : <Package className="w-5 h-5 text-slate-400" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{item.product_name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">Qty: {item.quantity || 1} × K{item.price?.toLocaleString()}</p>
                      </div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        K{((item.price || 0) * (item.quantity || 1)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  ))}
                </div>
                {/* Totals */}
                <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                  <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                    <span>Subtotal</span>
                    <span>K{subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  {order.coupon_code && (
                    <div className="flex justify-between text-sm text-emerald-600">
                      <span>Coupon: <span className="font-mono font-bold">{order.coupon_code}</span></span>
                      <span>Applied</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold text-slate-900 dark:text-slate-100 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <span>Total</span>
                    <span className="text-blue-600">K{order.total_amount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tracking Timeline */}
            <OrderTrackingTimeline order={order} />

            {/* Delivery Info */}
            <Card className="border-slate-100 dark:border-slate-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-600" /> Delivery Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {order.delivery_address && (
                  <div className="flex gap-3">
                    <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Address</p>
                      <p className="text-sm text-slate-900 dark:text-slate-100 mt-0.5">{order.delivery_address}</p>
                    </div>
                  </div>
                )}
                {order.delivery_phone && (
                  <div className="flex gap-3">
                    <Phone className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Phone</p>
                      <p className="text-sm text-slate-900 dark:text-slate-100 mt-0.5">{order.delivery_phone}</p>
                    </div>
                  </div>
                )}
                {order.notes && (
                  <div className="flex gap-3">
                    <Tag className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Notes</p>
                      <p className="text-sm text-slate-900 dark:text-slate-100 mt-0.5">{order.notes}</p>
                    </div>
                  </div>
                )}
                {order.tracking_number && (
                  <div className="flex gap-3">
                    <Hash className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Tracking Number</p>
                      <p className="text-sm font-mono text-slate-900 dark:text-slate-100 mt-0.5">{order.tracking_number}</p>
                    </div>
                  </div>
                )}
                {order.current_location && (
                  <div className="flex gap-3">
                    <MapPin className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Current Location</p>
                      <p className="text-sm text-slate-900 dark:text-slate-100 mt-0.5">{order.current_location}</p>
                    </div>
                  </div>
                )}
                {order.estimated_delivery && (
                  <div className="flex gap-3">
                    <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Estimated Delivery</p>
                      <p className="text-sm text-slate-900 dark:text-slate-100 mt-0.5">{order.estimated_delivery}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar: Buyer & Payment */}
          <div className="space-y-5">
            <Card className="border-slate-100 dark:border-slate-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" /> Buyer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{order.buyer_name || "—"}</p>
                <p className="text-sm text-slate-500">{order.buyer_email}</p>
              </CardContent>
            </Card>

            <Card className="border-slate-100 dark:border-slate-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Store className="w-4 h-4 text-blue-600" /> Shop
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{order.shop_name}</p>
              </CardContent>
            </Card>

            <Card className="border-slate-100 dark:border-slate-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-600" /> Payment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Method</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mt-0.5 capitalize">
                    {order.payment_method || "—"}
                  </p>
                </div>
                {order.stripe_session_id && (
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Transaction ID</p>
                    <p className="text-xs font-mono text-slate-700 dark:text-slate-300 mt-0.5 break-all bg-slate-50 dark:bg-slate-800 p-2 rounded-lg">
                      {order.stripe_session_id}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Order Date</p>
                  <p className="text-sm text-slate-900 dark:text-slate-100 mt-0.5">
                    {new Date(order.created_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      </div>
      </div>
    </div>
  );
}