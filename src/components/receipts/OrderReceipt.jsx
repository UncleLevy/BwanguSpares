import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Package, Calendar, MapPin, User, Phone, DollarSign } from "lucide-react";

export default function OrderReceipt({ order, shop }) {
  const orderDate = new Date(order.created_date);

  return (
    <div
      id={`receipt-${order.id}`}
      className="bg-white dark:bg-slate-900 p-4 sm:p-8 text-slate-900 dark:text-slate-100 max-w-2xl mx-auto"
    >
      {/* Header */}
      <div className="border-b-2 border-slate-200 dark:border-slate-700 pb-4 sm:pb-6 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">RECEIPT</h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">Order ID: {order.id.slice(0, 12)}</p>
          </div>
          <div className="text-right text-xs sm:text-sm w-full sm:w-auto">
            <p className="font-semibold text-slate-900 dark:text-slate-100">{shop?.name}</p>
            {shop?.phone && <p className="text-slate-600 dark:text-slate-400">{shop.phone}</p>}
            {shop?.address && <p className="text-slate-600 dark:text-slate-400">{shop.address}</p>}
          </div>
        </div>
      </div>

      {/* Customer & Order Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-8">
        <div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Customer</p>
          <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm sm:text-base">{order.buyer_name}</p>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">{order.buyer_email}</p>
          {order.delivery_phone && <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">{order.delivery_phone}</p>}
        </div>
        <div className="text-left sm:text-right">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Order Date</p>
          <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm sm:text-base">{format(orderDate, "MMM dd, yyyy")}</p>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">{format(orderDate, "hh:mm a")}</p>
        </div>
      </div>

      {/* Delivery Address */}
      {order.delivery_address && (
        <div className="bg-slate-50 dark:bg-slate-800 p-3 sm:p-4 rounded-lg mb-4 sm:mb-8">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Delivery Address</p>
          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">{order.delivery_address}</p>
        </div>
      )}

      {/* Items Table */}
      <div className="mb-4 sm:mb-8 overflow-x-auto">
        <table className="w-full text-xs sm:text-sm">
          <thead className="bg-slate-100 dark:bg-slate-800">
            <tr>
              <th className="text-left px-2 sm:px-4 py-2 sm:py-3 font-semibold text-slate-700 dark:text-slate-300">Item</th>
              <th className="text-center px-2 sm:px-4 py-2 sm:py-3 font-semibold text-slate-700 dark:text-slate-300">Qty</th>
              <th className="text-right px-2 sm:px-4 py-2 sm:py-3 font-semibold text-slate-700 dark:text-slate-300">Price</th>
              <th className="text-right px-2 sm:px-4 py-2 sm:py-3 font-semibold text-slate-700 dark:text-slate-300">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items?.map((item, idx) => (
              <tr key={idx} className="border-b border-slate-200 dark:border-slate-700">
                <td className="px-2 sm:px-4 py-2 sm:py-3 text-slate-900 dark:text-slate-100">{item.product_name}</td>
                <td className="px-2 sm:px-4 py-2 sm:py-3 text-center text-slate-600 dark:text-slate-400">{item.quantity}</td>
                <td className="px-2 sm:px-4 py-2 sm:py-3 text-right text-slate-600 dark:text-slate-400">K{item.price?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="px-2 sm:px-4 py-2 sm:py-3 text-right font-semibold text-slate-900 dark:text-slate-100">K{(item.price * item.quantity).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-end mb-4 sm:mb-8">
        <div className="w-full sm:w-64 text-xs sm:text-sm">
          {/* Calculate subtotal from items */}
          {(() => {
            const itemsSubtotal = order.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
            const shippingCost = order.shippingCost || 0;
            const subtotal = itemsSubtotal + shippingCost;
            const vat = (subtotal / 1.16) * 0.16;
            const total = subtotal;

            return (
              <>
                <div className="flex justify-between text-slate-600 dark:text-slate-400 mb-2">
                  <span>Subtotal:</span>
                  <span>K{itemsSubtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                {shippingCost > 0 && (
                  <div className="flex justify-between text-slate-600 dark:text-slate-400 mb-2">
                    <span>Shipping:</span>
                    <span>K{shippingCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                )}
                {order.coupon_code && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 mb-2">
                    <span>Coupon ({order.coupon_code}):</span>
                    <span>Applied</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600 dark:text-slate-400 mb-2">
                  <span>VAT (16%):</span>
                  <span>K{vat.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="border-t-2 border-slate-900 dark:border-slate-700 pt-2 sm:pt-3 flex justify-between font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-lg">
                  <span>Total:</span>
                  <span>K{total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </>
            );
          })()}
        </div>
      </div>

      {/* Order Status */}
      <div className="bg-slate-50 dark:bg-slate-800 p-3 sm:p-4 rounded-lg text-center">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Order Status</p>
        <Badge className={
          order.status === "delivered" ? "bg-emerald-100 text-emerald-800" :
          order.status === "shipped" ? "bg-blue-100 text-blue-800" :
          order.status === "cancelled" ? "bg-red-100 text-red-800" :
          "bg-amber-100 text-amber-800"
        }>
          {order.status.toUpperCase()}
        </Badge>
      </div>

      {/* Footer */}
      <div className="border-t-2 border-slate-200 dark:border-slate-700 mt-4 sm:mt-8 pt-4 sm:pt-6 text-center">
        <p className="text-xs text-slate-500 dark:text-slate-400">Thank you for your purchase!</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">This is a computer-generated receipt</p>
      </div>
    </div>
  );
}