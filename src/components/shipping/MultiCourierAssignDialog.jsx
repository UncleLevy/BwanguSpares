import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { MapPin, DollarSign, Calendar, Truck, ArrowRight, AlertCircle, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function MultiCourierAssignDialog({ order, shop, couriers, onClose, onAssigned }) {
  const [loading, setLoading] = useState(false);
  const [towns, setTowns] = useState([]);
  const [regions, setRegions] = useState([]);
  const [shippingRates, setShippingRates] = useState([]);
  const [deliveryInfo, setDeliveryInfo] = useState(null);
  const [formData, setFormData] = useState({
    intercity_courier_id: "",
    local_courier_id: "",
    estimated_days: "2",
    delivery_notes: "",
    intercity_cost: 0,
    local_cost: 0,
    handoff_location: ""
  });

  useEffect(() => {
    loadShippingData();
  }, []);

  const loadShippingData = async () => {
    const [townsData, regionsData, ratesData] = await Promise.all([
      base44.entities.Town.list(),
      base44.entities.Region.list(),
      base44.entities.ShippingRate.list()
    ]);
    setTowns(townsData);
    setRegions(regionsData);
    setShippingRates(ratesData);
    
    analyzeDeliveryRoute(townsData, regionsData, ratesData);
  };

  const analyzeDeliveryRoute = (townsData, regionsData, ratesData) => {
    const addressLower = order.delivery_address?.toLowerCase() || "";
    
    // Find delivery town from address
    const deliveryTown = townsData.find(t => addressLower.includes(t.name.toLowerCase()));
    const deliveryRegion = deliveryTown ? regionsData.find(r => r.id === deliveryTown.region_id) : null;
    
    // Get shop location - prioritize shop.town for matching
    const shopTown = townsData.find(t => t.name.toLowerCase() === shop.town?.toLowerCase());
    const shopRegion = shopTown ? regionsData.find(r => r.id === shopTown.region_id) : regionsData.find(r => r.id === shop.region);
    
    // Determine if intercity delivery is needed (different regions)
    const isIntercity = shopRegion && deliveryRegion && shopRegion.id !== deliveryRegion.id;
    
    // Calculate costs
    let intercityCost = 0;
    let localCost = 0;
    let totalCost = 0;
    
    if (isIntercity) {
      // Base intercity cost (distance-based estimate)
      intercityCost = 150; // Base rate for intercity transport
      
      // Local delivery cost at destination
      const rate = ratesData.find(r => r.town_id === deliveryTown?.id);
      localCost = rate?.default_rate || 50;
      
      totalCost = intercityCost + localCost;
    } else {
      // Same region - only local delivery needed
      const rate = ratesData.find(r => r.town_id === deliveryTown?.id);
      localCost = rate?.default_rate || 50;
      totalCost = localCost;
    }
    
    setDeliveryInfo({
      isIntercity,
      shopTown: shop.town || "Unknown",
      shopRegion: shopRegion?.name || "Unknown",
      deliveryTown: deliveryTown?.name || "Unknown",
      deliveryRegion: deliveryRegion?.name || "Unknown",
      requiresHandoff: isIntercity,
      totalCost,
      intercityCost,
      localCost
    });
    
    setFormData(prev => ({
      ...prev,
      intercity_cost: intercityCost,
      local_cost: localCost,
      handoff_location: deliveryTown?.name || deliveryRegion?.name || ""
    }));
  };

  const generateTrackingNumber = () => {
    const prefix = "BW";
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}${timestamp}${random}`;
  };

  const getEligibleCouriers = (type) => {
    return couriers.filter(c => 
      c.status === "active" && 
      (c.courier_type === type || c.courier_type === "both")
    );
  };

  const handleAssign = async () => {
    if (deliveryInfo?.isIntercity && !formData.intercity_courier_id) {
      toast.error("Please select an intercity courier");
      return;
    }
    if (deliveryInfo?.isIntercity && !formData.local_courier_id) {
      toast.error("Please select a local courier for final delivery");
      return;
    }
    if (!deliveryInfo?.isIntercity && !formData.local_courier_id) {
      toast.error("Please select a courier");
      return;
    }

    setLoading(true);
    try {
      const trackingNumber = generateTrackingNumber();
      const estimatedDelivery = new Date();
      estimatedDelivery.setDate(estimatedDelivery.getDate() + parseInt(formData.estimated_days));

      const shipmentData = {
        order_id: order.id,
        shop_id: shop.id,
        shop_name: shop.name,
        shop_town: shop.town || deliveryInfo.shopTown,
        shop_region: deliveryInfo.shopRegion,
        buyer_email: order.buyer_email,
        buyer_name: order.buyer_name,
        buyer_phone: order.delivery_phone,
        delivery_address: order.delivery_address,
        delivery_town: deliveryInfo.deliveryTown,
        delivery_region: deliveryInfo.deliveryRegion,
        tracking_number: trackingNumber,
        is_intercity: deliveryInfo.isIntercity,
        requires_handoff: deliveryInfo.requiresHandoff,
        shipping_cost: deliveryInfo.totalCost,
        intercity_cost: deliveryInfo.isIntercity ? formData.intercity_cost : 0,
        local_delivery_cost: formData.local_cost,
        estimated_delivery_date: estimatedDelivery.toISOString().split("T")[0],
        delivery_notes: formData.delivery_notes,
        tracking_updates: []
      };

      if (deliveryInfo.isIntercity) {
        // Multi-courier intercity delivery
        const intercityCourier = couriers.find(c => c.id === formData.intercity_courier_id);
        const localCourier = couriers.find(c => c.id === formData.local_courier_id);

        shipmentData.intercity_courier_id = intercityCourier.id;
        shipmentData.intercity_courier_name = intercityCourier.full_name;
        shipmentData.intercity_courier_phone = intercityCourier.phone;
        shipmentData.local_courier_id = localCourier.id;
        shipmentData.local_courier_name = localCourier.full_name;
        shipmentData.local_courier_phone = localCourier.phone;
        shipmentData.current_courier_id = intercityCourier.id;
        shipmentData.current_courier_name = intercityCourier.full_name;
        shipmentData.handoff_location = formData.handoff_location;
        shipmentData.status = "assigned";
        
        shipmentData.tracking_updates = [
          {
            timestamp: new Date().toISOString(),
            status: "assigned",
            location: shop.town,
            courier_name: intercityCourier.full_name,
            notes: `Intercity courier assigned: ${intercityCourier.full_name}. Will hand off to local courier ${localCourier.full_name} at ${formData.handoff_location}`
          }
        ];

        // Send email to buyer
        await base44.integrations.Core.SendEmail({
          to: order.buyer_email,
          subject: `Your Order Has Been Shipped - Tracking #${trackingNumber}`,
          body: `
            <h2>🚚 Your order is on its way!</h2>
            <p>Dear ${order.buyer_name},</p>
            <p>Great news! Your order has been assigned for delivery with a two-stage courier system.</p>
            
            <h3>📦 Multi-Stage Delivery Details:</h3>
            <ul>
              <li><strong>Tracking Number:</strong> ${trackingNumber}</li>
              <li><strong>From:</strong> ${shop.town}, ${deliveryInfo.shopRegion}</li>
              <li><strong>To:</strong> ${deliveryInfo.deliveryTown}, ${deliveryInfo.deliveryRegion}</li>
            </ul>

            <h3>🚛 Stage 1 - Intercity Transport:</h3>
            <ul>
              <li><strong>Courier:</strong> ${intercityCourier.full_name}</li>
              <li><strong>Phone:</strong> ${intercityCourier.phone}</li>
              <li><strong>Vehicle:</strong> ${intercityCourier.vehicle_type}</li>
            </ul>

            <h3>🏍️ Stage 2 - Local Delivery:</h3>
            <ul>
              <li><strong>Courier:</strong> ${localCourier.full_name}</li>
              <li><strong>Phone:</strong> ${localCourier.phone}</li>
              <li><strong>Vehicle:</strong> ${localCourier.vehicle_type}</li>
              <li><strong>Handoff Location:</strong> ${formData.handoff_location}</li>
            </ul>

            <h3>💰 Shipping Breakdown:</h3>
            <ul>
              <li>Intercity Transport: K${formData.intercity_cost}</li>
              <li>Local Delivery: K${formData.local_cost}</li>
              <li><strong>Total Shipping:</strong> K${deliveryInfo.totalCost}</li>
              <li><strong>Estimated Delivery:</strong> ${estimatedDelivery.toLocaleDateString()}</li>
            </ul>
            
            <p>The intercity courier will transport your package to ${formData.handoff_location}, where the local courier will complete the final delivery to your address.</p>
            <p>You'll receive updates as your package moves between couriers.</p>
            
            <p>Thank you for shopping with ${shop.name}!</p>
          `
        });
      } else {
        // Single courier local delivery
        const localCourier = couriers.find(c => c.id === formData.local_courier_id);
        
        shipmentData.local_courier_id = localCourier.id;
        shipmentData.local_courier_name = localCourier.full_name;
        shipmentData.local_courier_phone = localCourier.phone;
        shipmentData.current_courier_id = localCourier.id;
        shipmentData.current_courier_name = localCourier.full_name;
        shipmentData.status = "assigned";
        
        shipmentData.tracking_updates = [
          {
            timestamp: new Date().toISOString(),
            status: "assigned",
            location: shop.town,
            courier_name: localCourier.full_name,
            notes: `Local delivery assigned to ${localCourier.full_name}`
          }
        ];

        // Send email to buyer
        await base44.integrations.Core.SendEmail({
          to: order.buyer_email,
          subject: `Your Order Has Been Shipped - Tracking #${trackingNumber}`,
          body: `
            <h2>🚚 Your order is on its way!</h2>
            <p>Dear ${order.buyer_name},</p>
            <p>Great news! Your order has been assigned to a local courier for delivery.</p>
            
            <h3>📦 Delivery Details:</h3>
            <ul>
              <li><strong>Tracking Number:</strong> ${trackingNumber}</li>
              <li><strong>Courier:</strong> ${localCourier.full_name}</li>
              <li><strong>Contact:</strong> ${localCourier.phone}</li>
              <li><strong>Vehicle:</strong> ${localCourier.vehicle_type}</li>
              <li><strong>Shipping Cost:</strong> K${deliveryInfo.totalCost}</li>
              <li><strong>Estimated Delivery:</strong> ${estimatedDelivery.toLocaleDateString()}</li>
            </ul>
            
            <p>Your courier will contact you before delivery. You can also reach them at ${localCourier.phone}.</p>
            
            <p>Thank you for shopping with ${shop.name}!</p>
          `
        });
      }

      // Create shipment
      await base44.entities.Shipment.create(shipmentData);

      // Update order status
      await base44.entities.Order.update(order.id, {
        status: "processing",
        tracking_number: trackingNumber,
        current_location: shop.town,
        estimated_delivery: estimatedDelivery.toISOString().split("T")[0]
      });

      toast.success("Shipment assigned successfully with courier handoff plan");
      onAssigned();
      onClose();
    } catch (error) {
      toast.error(error.message || "Failed to assign shipment");
    } finally {
      setLoading(false);
    }
  };

  const intercityCouriers = getEligibleCouriers("intercity");
  const localCouriers = getEligibleCouriers("local");

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Assign Courier & Create Shipment</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Route Analysis */}
          {deliveryInfo && (
            <Alert className={deliveryInfo.isIntercity ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30" : "border-green-500 bg-green-50 dark:bg-green-950/30"}>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 font-semibold">
                    <span>{deliveryInfo.shopTown}, {deliveryInfo.shopRegion}</span>
                    <ArrowRight className="w-4 h-4" />
                    <span>{deliveryInfo.deliveryTown}, {deliveryInfo.deliveryRegion}</span>
                  </div>
                  {deliveryInfo.isIntercity ? (
                    <div className="text-sm space-y-1">
                      <p className="font-medium text-blue-700 dark:text-blue-400">⚡ Intercity Delivery - Multi-Courier Required</p>
                      <p>This shipment will use a 2-stage courier system:</p>
                      <ol className="list-decimal ml-5 space-y-0.5">
                        <li>Intercity courier transports from {deliveryInfo.shopTown} to {deliveryInfo.deliveryTown}</li>
                        <li>Local courier completes final delivery to customer address</li>
                      </ol>
                      <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-800">
                        <p className="font-medium">Cost Breakdown:</p>
                        <p>Intercity: K{formData.intercity_cost} + Local: K{formData.local_cost} = <strong>K{deliveryInfo.totalCost}</strong></p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm font-medium text-green-700 dark:text-green-400">✓ Local Delivery - Single Courier</p>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

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

          {/* Intercity Courier (if needed) */}
          {deliveryInfo?.isIntercity && (
            <div className="border-2 border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-blue-900 dark:text-blue-100">Stage 1: Intercity Transport</h4>
              </div>
              
              <div>
                <Label>Intercity Courier *</Label>
                <Select value={formData.intercity_courier_id} onValueChange={v => setFormData({ ...formData, intercity_courier_id: v })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select intercity courier" />
                  </SelectTrigger>
                  <SelectContent>
                    {intercityCouriers.map(courier => (
                      <SelectItem key={courier.id} value={courier.id}>
                        {courier.full_name} - {courier.vehicle_type} ({courier.phone})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {intercityCouriers.length === 0 && (
                  <p className="text-xs text-red-600 mt-1">No intercity couriers available</p>
                )}
              </div>

              <div>
                <Label>Intercity Transport Cost (ZMW)</Label>
                <div className="relative mt-1">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="number"
                    value={formData.intercity_cost}
                    onChange={e => setFormData({ ...formData, intercity_cost: parseFloat(e.target.value) })}
                    className="pl-9"
                  />
                </div>
              </div>

              <div>
                <Label>Handoff Location</Label>
                <Input
                  value={formData.handoff_location}
                  onChange={e => setFormData({ ...formData, handoff_location: e.target.value })}
                  placeholder="e.g., Central Bus Station, Lusaka"
                  className="mt-1"
                />
              </div>
            </div>
          )}

          {/* Local Courier */}
          <div className="border-2 border-green-200 dark:border-green-800 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-green-600" />
              <h4 className="font-semibold text-green-900 dark:text-green-100">
                {deliveryInfo?.isIntercity ? "Stage 2: Local Delivery" : "Local Delivery"}
              </h4>
            </div>
            
            <div>
              <Label>Local Courier *</Label>
              <Select value={formData.local_courier_id} onValueChange={v => setFormData({ ...formData, local_courier_id: v })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select local courier" />
                </SelectTrigger>
                <SelectContent>
                  {localCouriers.map(courier => (
                    <SelectItem key={courier.id} value={courier.id}>
                      {courier.full_name} - {courier.vehicle_type} ({courier.phone})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {localCouriers.length === 0 && (
                <p className="text-xs text-red-600 mt-1">No local couriers available</p>
              )}
            </div>

            <div>
              <Label>Local Delivery Cost (ZMW)</Label>
              <div className="relative mt-1">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="number"
                  value={formData.local_cost}
                  onChange={e => setFormData({ ...formData, local_cost: parseFloat(e.target.value) })}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          {/* Total Cost Display */}
          <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-950/30 dark:to-green-950/30 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-900 dark:text-slate-100">Total Shipping Cost:</span>
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                K{(formData.intercity_cost + formData.local_cost).toFixed(2)}
              </span>
            </div>
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
            <p className="text-xs text-slate-500 mt-1">Add 1-2 days for intercity deliveries</p>
          </div>

          {/* Delivery Notes */}
          <div>
            <Label>Delivery Instructions (Optional)</Label>
            <Textarea
              value={formData.delivery_notes}
              onChange={e => setFormData({ ...formData, delivery_notes: e.target.value })}
              placeholder="Special instructions for courier(s)..."
              className="mt-1"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button 
            onClick={handleAssign} 
            disabled={loading || (deliveryInfo?.isIntercity && (!formData.intercity_courier_id || !formData.local_courier_id)) || (!deliveryInfo?.isIntercity && !formData.local_courier_id)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? "Assigning..." : "Assign & Notify Buyer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}