import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { MapPin, DollarSign, Calendar, Truck } from "lucide-react";

export default function ShipmentAssignDialog({ order, shop, couriers, onClose, onAssigned }) {
  const [loading, setLoading] = useState(false);
  const [towns, setTowns] = useState([]);
  const [shippingRates, setShippingRates] = useState([]);
  const [formData, setFormData] = useState({
    courier_id: "",
    estimated_days: "2",
    delivery_notes: "",
    calculated_cost: 0
  });

  useEffect(() => {
    loadShippingData();
  }, []);

  const loadShippingData = async () => {
    const [townsData, ratesData] = await Promise.all([
      base44.entities.Town.list(),
      base44.entities.ShippingRate.list()
    ]);
    setTowns(townsData);
    setShippingRates(ratesData);
    
    // Calculate shipping cost with loaded data
    const addressLower = order.delivery_address?.toLowerCase() || "";
    const matchedTown = townsData.find(t => addressLower.includes(t.name.toLowerCase()));
    
    if (matchedTown) {
      const rate = ratesData.find(r => r.town_id === matchedTown.id);
      if (rate) {
        setFormData(prev => ({ ...prev, calculated_cost: rate.default_rate }));
        return;
      }
    }
    
    // Default fallback rate
    setFormData(prev => ({ ...prev, calculated_cost: 50 }));
  };

  const generateTrackingNumber = () => {
    const prefix = "BW";
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}${timestamp}${random}`;
  };

  const handleAssign = async () => {
    if (!formData.courier_id) {
      toast.error("Please select a courier");
      return;
    }

    setLoading(true);
    try {
      const selectedCourier = couriers.find(c => c.id === formData.courier_id);
      const trackingNumber = generateTrackingNumber();
      const estimatedDelivery = new Date();
      estimatedDelivery.setDate(estimatedDelivery.getDate() + parseInt(formData.estimated_days));

      // Create shipment
      const shipment = await base44.entities.Shipment.create({
        order_id: order.id,
        shop_id: shop.id,
        shop_name: shop.name,
        buyer_email: order.buyer_email,
        buyer_name: order.buyer_name,
        buyer_phone: order.delivery_phone,
        delivery_address: order.delivery_address,
        town: order.delivery_address.split(",").pop().trim(),
        region: "",
        courier_id: selectedCourier.id,
        courier_name: selectedCourier.full_name,
        courier_phone: selectedCourier.phone,
        courier_vehicle: `${selectedCourier.vehicle_type} - ${selectedCourier.vehicle_registration}`,
        tracking_number: trackingNumber,
        status: "assigned",
        shipping_cost: formData.calculated_cost,
        estimated_delivery_date: estimatedDelivery.toISOString().split("T")[0],
        delivery_notes: formData.delivery_notes,
        tracking_updates: [
          {
            timestamp: new Date().toISOString(),
            status: "assigned",
            location: shop.address || shop.town,
            notes: `Shipment assigned to ${selectedCourier.full_name}`
          }
        ]
      });

      // Update order status
      await base44.entities.Order.update(order.id, {
        status: "processing",
        tracking_number: trackingNumber,
        current_location: shop.address || shop.town,
        estimated_delivery: estimatedDelivery.toISOString().split("T")[0]
      });

      // Send email notification to buyer
      await base44.integrations.Core.SendEmail({
        to: order.buyer_email,
        subject: `Your Order Has Been Shipped - Tracking #${trackingNumber}`,
        body: `
          <h2>Your order is on its way!</h2>
          <p>Dear ${order.buyer_name},</p>
          <p>Great news! Your order has been assigned to a courier and will be delivered soon.</p>
          
          <h3>Delivery Details:</h3>
          <ul>
            <li><strong>Tracking Number:</strong> ${trackingNumber}</li>
            <li><strong>Courier:</strong> ${selectedCourier.full_name}</li>
            <li><strong>Contact:</strong> ${selectedCourier.phone}</li>
            <li><strong>Vehicle:</strong> ${selectedCourier.vehicle_type} - ${selectedCourier.vehicle_registration}</li>
            <li><strong>Estimated Delivery:</strong> ${estimatedDelivery.toLocaleDateString()}</li>
            <li><strong>Shipping Cost:</strong> K${formData.calculated_cost}</li>
          </ul>
          
          <p>Your courier will contact you before delivery. You can also reach them at ${selectedCourier.phone}.</p>
          
          <p>Thank you for shopping with ${shop.name}!</p>
        `
      });

      toast.success("Shipment assigned successfully");
      onAssigned();
      onClose();
    } catch (error) {
      toast.error(error.message || "Failed to assign shipment");
    } finally {
      setLoading(false);
    }
  };

  const activeCouriers = couriers.filter(c => c.status === "active");

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Assign Courier & Create Shipment</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Order Info */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg space-y-2">
            <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100">Order Details</h4>
            <div className="text-sm space-y-1">
              <p className="text-slate-600 dark:text-slate-300"><strong>Order ID:</strong> {order.id.slice(0, 8)}</p>
              <p className="text-slate-600 dark:text-slate-300"><strong>Buyer:</strong> {order.buyer_name}</p>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                <span className="text-slate-600 dark:text-slate-300">{order.delivery_address}</span>
              </div>
            </div>
          </div>

          {/* Courier Selection */}
          <div>
            <Label>Select Courier *</Label>
            <Select value={formData.courier_id} onValueChange={v => setFormData({ ...formData, courier_id: v })}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Choose a courier" />
              </SelectTrigger>
              <SelectContent>
                {activeCouriers.map(courier => (
                  <SelectItem key={courier.id} value={courier.id}>
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4" />
                      <span>{courier.full_name} - {courier.vehicle_type} ({courier.phone})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {activeCouriers.length === 0 && (
              <p className="text-xs text-red-600 mt-1">No active couriers available. Please add couriers first.</p>
            )}
          </div>

          {/* Shipping Cost */}
          <div>
            <Label>Calculated Shipping Cost (ZMW)</Label>
            <div className="relative mt-1">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="number"
                value={formData.calculated_cost}
                onChange={e => setFormData({ ...formData, calculated_cost: parseFloat(e.target.value) })}
                className="pl-9"
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">Based on delivery location</p>
          </div>

          {/* Estimated Delivery */}
          <div>
            <Label>Estimated Delivery (Days)</Label>
            <div className="relative mt-1">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="number"
                min="1"
                max="14"
                value={formData.estimated_days}
                onChange={e => setFormData({ ...formData, estimated_days: e.target.value })}
                className="pl-9"
              />
            </div>
          </div>

          {/* Delivery Notes */}
          <div>
            <Label>Delivery Instructions (Optional)</Label>
            <Textarea
              value={formData.delivery_notes}
              onChange={e => setFormData({ ...formData, delivery_notes: e.target.value })}
              placeholder="Any special instructions for the courier..."
              className="mt-1"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleAssign} disabled={loading || !formData.courier_id} className="bg-blue-600 hover:bg-blue-700">
            {loading ? "Assigning..." : "Assign & Notify Buyer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}