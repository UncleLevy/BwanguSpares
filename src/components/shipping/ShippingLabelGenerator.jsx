import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Download, Printer } from "lucide-react";
import QRCode from "qrcode.react";

export default function ShippingLabelGenerator({ order, shipment, shop }) {
  const [showLabel, setShowLabel] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <Button variant="outline" onClick={() => setShowLabel(true)}>
        <FileText className="w-4 h-4 mr-2" />
        Shipping Label
      </Button>

      <Dialog open={showLabel} onOpenChange={setShowLabel}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Shipping Label</span>
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div id="shipping-label" className="bg-white p-8 space-y-6 border-2 border-slate-900">
            {/* Header */}
            <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">{shop.name}</h1>
                <p className="text-sm text-slate-600 mt-1">{shop.address}</p>
                <p className="text-sm text-slate-600">{shop.phone}</p>
              </div>
              <div className="text-right">
                <QRCode value={shipment.tracking_number} size={80} />
                <p className="text-xs font-mono mt-1">{shipment.tracking_number}</p>
              </div>
            </div>

            {/* Addresses */}
            <div className="grid grid-cols-2 gap-6">
              <div className="border-2 border-slate-900 p-4">
                <h3 className="font-bold text-sm text-slate-700 mb-2">FROM:</h3>
                <p className="font-semibold text-slate-900">{shop.name}</p>
                <p className="text-sm text-slate-700 mt-1">{shop.address}</p>
                <p className="text-sm text-slate-700">{shop.town}, {shop.region_name}</p>
                <p className="text-sm text-slate-700 mt-2">Contact: {shop.phone}</p>
              </div>

              <div className="border-2 border-slate-900 p-4 bg-amber-50">
                <h3 className="font-bold text-sm text-slate-700 mb-2">DELIVER TO:</h3>
                <p className="font-bold text-lg text-slate-900">{order.buyer_name}</p>
                <p className="text-sm text-slate-700 mt-1">{shipment.delivery_address}</p>
                <p className="text-sm text-slate-700 mt-2">Phone: {shipment.buyer_phone}</p>
              </div>
            </div>

            {/* Shipment Details */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-600">Order ID:</p>
                <p className="font-semibold text-slate-900">{order.id.slice(0, 8)}</p>
              </div>
              <div>
                <p className="text-slate-600">Weight:</p>
                <p className="font-semibold text-slate-900">Standard Package</p>
              </div>
              <div>
                <p className="text-slate-600">Estimated Delivery:</p>
                <p className="font-semibold text-slate-900">
                  {shipment.estimated_delivery_date ? new Date(shipment.estimated_delivery_date).toLocaleDateString() : "TBD"}
                </p>
              </div>
              <div>
                <p className="text-slate-600">Shipping Cost:</p>
                <p className="font-semibold text-slate-900">K{shipment.shipping_cost}</p>
              </div>
            </div>

            {/* Courier Info */}
            <div className="border-t-2 border-slate-900 pt-4">
              <h3 className="font-bold text-sm text-slate-700 mb-2">COURIER DETAILS:</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-600">Name:</p>
                  <p className="font-semibold text-slate-900">{shipment.courier_name}</p>
                </div>
                <div>
                  <p className="text-slate-600">Contact:</p>
                  <p className="font-semibold text-slate-900">{shipment.courier_phone}</p>
                </div>
                <div>
                  <p className="text-slate-600">Vehicle:</p>
                  <p className="font-semibold text-slate-900">{shipment.courier_vehicle}</p>
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="border-t-2 border-slate-900 pt-4">
              <h3 className="font-bold text-sm text-slate-700 mb-2">PACKAGE CONTENTS:</h3>
              <div className="space-y-1">
                {order.items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-slate-700">{item.product_name} x{item.quantity}</span>
                    <span className="font-semibold text-slate-900">K{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-300 mt-2 pt-2 flex justify-between font-bold">
                <span>Total Value:</span>
                <span>K{order.total_amount?.toFixed(2)}</span>
              </div>
            </div>

            {/* Special Instructions */}
            {shipment.delivery_notes && (
              <div className="bg-amber-50 border-2 border-amber-500 p-3 rounded">
                <p className="font-bold text-sm text-amber-900">SPECIAL INSTRUCTIONS:</p>
                <p className="text-sm text-amber-800 mt-1">{shipment.delivery_notes}</p>
              </div>
            )}

            {/* Footer */}
            <div className="text-center text-xs text-slate-500 border-t border-slate-300 pt-4">
              <p>This label was generated on {new Date().toLocaleString()}</p>
              <p className="mt-1">For tracking updates, use tracking number: {shipment.tracking_number}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}