import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  LayoutDashboard, ShoppingCart, Package,
  Clock, CheckCircle2, Truck, XCircle, Star, Eye, RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import PullToRefresh from "@/components/shared/PullToRefresh";
import ReportButton from "@/components/reports/ReportButton";
import TrackingInfo from "@/components/orders/TrackingInfo";
import OrderTrackingBar from "@/components/orders/OrderTrackingBar";

const orderStatusConfig = {
  pending: { icon: Clock, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/20", border: "border-amber-200 dark:border-amber-800" },
  confirmed: { icon: CheckCircle2, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20", border: "border-blue-200 dark:border-blue-800" },
  processing: { icon: Package, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-900/20", border: "border-indigo-200 dark:border-indigo-800" },
  shipped: { icon: Truck, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-900/20", border: "border-purple-200 dark:border-purple-800" },
  delivered: { icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20", border: "border-emerald-200 dark:border-emerald-800" },
  cancelled: { icon: XCircle, color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-900/20", border: "border-red-200 dark:border-red-800" },
};

export default function BuyerOrdersView({ orders, setOrders, user, onReview, onReceipt, onReturn, onRetryPayment }) {
  return (
    <PullToRefresh onRefresh={async () => {
      const o = await base44.entities.Order.filter({ buyer_email: user.email }, "-created_date", 50);
      setOrders(o);
    }}>
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">My Orders</h1>
        {orders.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingCart className="w-16 h-16 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
            <h3 className="font-semibold text-slate-700 dark:text-slate-300">No orders yet</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Browse parts and place your first order</p>
            <Link to={createPageUrl("BrowseProducts")}>
              <Button className="mt-4 bg-blue-600 hover:bg-blue-700">Browse Parts</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => {
              const sc = orderStatusConfig[order.status] || orderStatusConfig.pending;
              return (
                <Card key={order.id} className={`border ${sc.border} bg-white dark:bg-slate-900 overflow-hidden`}>
                  <CardContent className="p-4 sm:p-5">
                    {/* Header: Order ID & Status */}
                    <div className="flex items-center gap-2 mb-3 min-w-0">
                      <span className="font-mono text-xs text-slate-400 dark:text-slate-500 shrink-0">#{order.id?.slice(0, 8)}</span>
                      <Badge className={`${sc.bg} ${sc.color} shrink-0`}>
                        <sc.icon className="w-3 h-3 mr-1" /> {order.status}
                      </Badge>
                    </div>
                    
                    {/* Info & Amount Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="min-w-0">
                        <p className="text-xs text-slate-500 dark:text-slate-400">Shop</p>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{order.shop_name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{new Date(order.created_date).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500 dark:text-slate-400">Total</p>
                        <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                          K{order.total_amount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {order.status === "confirmed" && (
                        <Button size="sm" variant="outline" onClick={() => onReceipt(order)}
                          className="gap-1 text-xs px-2 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 whitespace-nowrap">
                          <Eye className="w-3 h-3" /> Receipt
                        </Button>
                      )}
                      {order.status === "pending" && (
                        <Button size="sm" variant="outline" onClick={() => onRetryPayment(order)}
                          className="gap-1 text-xs px-2 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 whitespace-nowrap">
                          💳 Pay
                        </Button>
                      )}
                      {order.status === "delivered" && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => onReview(order)}
                            className="gap-1 text-xs px-2 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 whitespace-nowrap">
                            <Star className="w-3 h-3" /> Review
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => onReturn(order)}
                            className="gap-1 text-xs px-2 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/30 whitespace-nowrap">
                            <RotateCcw className="w-3 h-3" /> Return
                          </Button>
                        </>
                      )}
                      <ReportButton
                        reportedEmail={order.shop_name}
                        reportedName={order.shop_name}
                        reportedType="shop"
                        reportedId={order.shop_id}
                        size="sm"
                      />
                    </div>
                    <div className="mb-4 pb-4 border-b border-slate-100 dark:border-slate-700">
                      <OrderTrackingBar status={order.status} />
                    </div>
                    <div className="space-y-2">
                      {order.items?.map((item, i) => (
                        <div key={i} className="flex items-center gap-3 py-2 border-t border-slate-50 dark:border-slate-700/50 first:border-0">
                          <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {item.image_url
                              ? <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                              : <Package className="w-4 h-4 text-slate-300 dark:text-slate-600" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{item.product_name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Qty: {item.quantity} × K{item.price?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    {order.status === "cancelled" && (
                      <div className="mt-3 p-3 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/40 rounded-lg text-sm text-red-700 dark:text-red-400">
                        {order.cancellation_reason && <p><span className="font-medium">Reason: </span>{order.cancellation_reason}</p>}
                      </div>
                    )}
                    {(order.status === "shipped" || order.status === "delivered") && (
                      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                        <TrackingInfo order={order} />
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </PullToRefresh>
  );
}