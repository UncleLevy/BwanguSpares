import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowRight, Package, User, Phone, MapPin, Clock, CheckCircle } from "lucide-react";

export default function CourierHandoffPanel({ shipment, onHandoffComplete }) {
  const [showHandoffDialog, setShowHandoffDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [handoffData, setHandoffData] = useState({
    location: shipment.handoff_location || "",
    notes: ""
  });

  const handleCompleteHandoff = async () => {
    setLoading(true);
    try {
      const handoffTime = new Date().toISOString();
      
      // Update shipment with handoff completion
      await base44.entities.Shipment.update(shipment.id, {
        status: "handoff_complete",
        handoff_time: handoffTime,
        handoff_notes: handoffData.notes,
        current_courier_id: shipment.local_courier_id,
        current_courier_name: shipment.local_courier_name,
        tracking_updates: [
          ...shipment.tracking_updates,
          {
            timestamp: handoffTime,
            status: "handoff_complete",
            location: handoffData.location,
            courier_name: shipment.local_courier_name,
            notes: `Package handed off from ${shipment.intercity_courier_name} to ${shipment.local_courier_name}. ${handoffData.notes}`
          }
        ]
      });

      // Notify buyer
      await base44.integrations.Core.SendEmail({
        to: shipment.buyer_email,
        subject: `Courier Handoff Complete - Tracking #${shipment.tracking_number}`,
        body: `
          <h2>📦 Your package is now with the local courier!</h2>
          <p>Dear ${shipment.buyer_name},</p>
          <p>Great news! Your package has successfully been handed off to the local delivery courier.</p>
          
          <h3>Handoff Details:</h3>
          <ul>
            <li><strong>Tracking Number:</strong> ${shipment.tracking_number}</li>
            <li><strong>Location:</strong> ${handoffData.location}</li>
            <li><strong>Time:</strong> ${new Date(handoffTime).toLocaleString()}</li>
            <li><strong>From:</strong> ${shipment.intercity_courier_name} (${shipment.intercity_courier_phone})</li>
            <li><strong>To:</strong> ${shipment.local_courier_name} (${shipment.local_courier_phone})</li>
          </ul>
          
          <h3>What's Next:</h3>
          <p>Your local courier ${shipment.local_courier_name} will now deliver to your address:</p>
          <p><strong>${shipment.delivery_address}</strong></p>
          
          <p>You can contact the local courier at: ${shipment.local_courier_phone}</p>
          <p>Expected delivery: ${new Date(shipment.estimated_delivery_date).toLocaleDateString()}</p>
          
          <p>Thank you for your patience!</p>
        `
      });

      toast.success("Handoff completed successfully");
      setShowHandoffDialog(false);
      onHandoffComplete?.();
    } catch (error) {
      toast.error(error.message || "Failed to complete handoff");
    } finally {
      setLoading(false);
    }
  };

  const canCompleteHandoff = shipment.status === "in_transit" && shipment.requires_handoff;

  return (
    <>
      <Card className="border-2 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ArrowRight className="w-5 h-5 text-blue-600" />
            Multi-Courier Handoff
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Handoff Status:</span>
            <Badge className={
              shipment.handoff_time 
                ? "bg-green-600" 
                : shipment.status === "in_transit" 
                ? "bg-yellow-600" 
                : "bg-slate-600"
            }>
              {shipment.handoff_time ? "Completed" : shipment.status === "in_transit" ? "Pending" : "Not Started"}
            </Badge>
          </div>

          {/* Intercity Courier Info */}
          <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-blue-900 dark:text-blue-100">
              <Package className="w-4 h-4" />
              Stage 1: Intercity Transport
            </div>
            <div className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <User className="w-3 h-3" />
                <span>{shipment.intercity_courier_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3 h-3" />
                <span>{shipment.intercity_courier_phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3 h-3" />
                <span>{shipment.shop_town} → {shipment.handoff_location}</span>
              </div>
            </div>
          </div>

          {/* Handoff Location */}
          <div className="flex items-center justify-center py-2">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <div className="h-px w-8 bg-slate-300 dark:bg-slate-600"></div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-sm font-medium">
                <MapPin className="w-4 h-4" />
                {shipment.handoff_location}
              </div>
              <div className="h-px w-8 bg-slate-300 dark:bg-slate-600"></div>
            </div>
          </div>

          {/* Local Courier Info */}
          <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-green-900 dark:text-green-100">
              <Package className="w-4 h-4" />
              Stage 2: Local Delivery
            </div>
            <div className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <User className="w-3 h-3" />
                <span>{shipment.local_courier_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3 h-3" />
                <span>{shipment.local_courier_phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3 h-3" />
                <span>{shipment.handoff_location} → {shipment.delivery_town}</span>
              </div>
            </div>
          </div>

          {/* Handoff Time */}
          {shipment.handoff_time && (
            <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="font-medium">Handoff Completed:</span>
              </div>
              <div className="mt-1 ml-6 text-sm text-slate-700 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(shipment.handoff_time).toLocaleString()}</span>
                </div>
                {shipment.handoff_notes && (
                  <p className="mt-2 text-xs italic">{shipment.handoff_notes}</p>
                )}
              </div>
            </div>
          )}

          {/* Action Button */}
          {canCompleteHandoff && !shipment.handoff_time && (
            <Button 
              onClick={() => setShowHandoffDialog(true)}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Complete Handoff
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Handoff Dialog */}
      <Dialog open={showHandoffDialog} onOpenChange={setShowHandoffDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Courier Handoff</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label>Handoff Location</Label>
              <Input
                value={handoffData.location}
                onChange={e => setHandoffData({ ...handoffData, location: e.target.value })}
                placeholder="e.g., Central Bus Station"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Handoff Notes (Optional)</Label>
              <Textarea
                value={handoffData.notes}
                onChange={e => setHandoffData({ ...handoffData, notes: e.target.value })}
                placeholder="Any notes about the handoff..."
                className="mt-1"
                rows={3}
              />
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 text-sm">
              <p className="font-medium mb-2">This will:</p>
              <ul className="list-disc ml-5 space-y-1 text-slate-700 dark:text-slate-300">
                <li>Transfer responsibility to {shipment.local_courier_name}</li>
                <li>Update tracking status to "Handoff Complete"</li>
                <li>Notify the buyer via email</li>
                <li>Record the handoff time and location</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHandoffDialog(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleCompleteHandoff} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading ? "Completing..." : "Complete Handoff"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}