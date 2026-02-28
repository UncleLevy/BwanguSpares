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
      className="bg-white p-8 text-slate-900 max-w-2xl mx-auto"
    >
      {/* Header */}
      <div className="border-b-2 border-slate-200 pb-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">RECEIPT</h1>
            <p className="text-sm text-slate-500 mt-1">Order ID: {order.id.slice(0, 12)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-900">{shop?.name}</p>
            {shop?.phone && <p className="text-xs text-slate-600">{shop.phone}</p>}
            {shop?.address && <p className="text-xs text-slate-600">{shop.address}</p>}
          </div>
        </div>
      </div>

      {/* Customer & Order Info */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Customer</p>
          <p className="font-semibold text-slate-900">{order.buyer_name}</p>
          <p className="text-sm text-slate-600">{order.buyer_email}</p>
          {order.delivery_phone && <p className="text-sm text-slate-600">{order.delivery_phone}</p>}
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Order Date</p>
          <p className="font-semibold text-slate-900">{format(orderDate, "MMM dd, yyyy")}</p>
          <p className="text-sm text-slate-600">{format(orderDate, "hh:mm a")}</p>
        </div>
      </div>

      {/* Delivery Address */}
      {order.delivery_address && (
        <div className="bg-slate-50 p-4 rounded-lg mb-8">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Delivery Address</p>
          <p className="text-sm text-slate-700">{order.delivery_address}</p>
        </div>
      )}

      {/* Items Table */}
      <div className="mb-8">
        <table className="w-full">
          <thead className="bg-slate-100">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-700">Item</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-slate-700">Qty</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-700">Price</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-700">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items?.map((item, idx) => (
              <tr key={idx} className="border-b border-slate-200">
                <td className="px-4 py-3 text-sm text-slate-900">{item.product_name}</td>
                <td className="px-4 py-3 text-sm text-center text-slate-600">{item.quantity}</td>
                <td className="px-4 py-3 text-sm text-right text-slate-600">K{item.price?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="px-4 py-3 text-sm text-right font-semibold text-slate-900">K{(item.price * item.quantity).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-end mb-8">
        <div className="w-64">
          <div className="flex justify-between text-sm text-slate-600 mb-2">
            <span>Subtotal:</span>
            <span>K{order.total_amount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="border-t-2 border-slate-900 pt-3 flex justify-between text-lg font-bold text-slate-900">
            <span>Total:</span>
            <span>K{order.total_amount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      {/* Order Status */}
      <div className="bg-slate-50 p-4 rounded-lg text-center">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Order Status</p>
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
      <div className="border-t-2 border-slate-200 mt-8 pt-6 text-center">
        <p className="text-xs text-slate-500">Thank you for your purchase!</p>
        <p className="text-xs text-slate-500 mt-1">This is a computer-generated receipt</p>
      </div>
    </div>
  );
}