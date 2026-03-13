import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { MapPin, Clock, Package, CheckCircle, Upload } from "lucide-react";

export default function ShipmentTrackingPanel({ shipment, onClose, onUpdate }) {
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState(shipment.status);
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [proofFile, setProofFile] = useState(null);

  const statusOptions = [
    { value: "assigned", label: "Assigned" },
    { value: "picked_up", label: "Picked Up" },
    { value: "in_transit", label: "In Transit" },
    { value: "out_for_delivery", label: "Out for Delivery" },
    { value: "delivered", label: "Delivered" },
    { value: "failed", label: "Failed Delivery" }
  ];

  const statusColors = {
    assigned: "bg-blue-100 text-blue-700",
    picked_up: "bg-purple-100 text-purple-700",
    in_transit: "bg-amber-100 text-amber-700",
    out_for_delivery: "bg-orange-100 text-orange-700",
    delivered: "bg-emerald-100 text-emerald-700",
    failed: "bg-red-100 text-red-700"
  };

  const handleUpdateStatus = async () => {
    if (!location.trim()) {
      toast.error("Please enter current location");
      return;
    }

    setUpdating(true);
    try {
      let proofUrl = shipment.proof_of_delivery_url;

      // Upload proof if provided and status is delivered
      if (proofFile && newStatus === "delivered") {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: proofFile });
        proofUrl = file_url;
      }

      const newUpdate = {
        timestamp: new Date().toISOString(),
        status: newStatus,
        location: location.trim(),
        notes: notes.trim()
      };

      const updatedTracking = [...(shipment.tracking_updates || []), newUpdate];

      const updateData = {
        status: newStatus,
        tracking_updates: updatedTracking
      };

      if (newStatus === "picked_up" && !shipment.pickup_time) {
        updateData.pickup_time = new Date().toISOString();
      }

      if (newStatus === "delivered") {
        updateData.actual_delivery_date = new Date().toISOString();
        if (proofUrl) {
          updateData.proof_of_delivery_url = proofUrl;
        }
      }

      await base44.entities.Shipment.update(shipment.id, updateData);

      // Update order status
      const orderStatus = newStatus === "delivered" ? "delivered" : newStatus === "failed" ? "cancelled" : "shipped";
      await base44.entities.Order.update(shipment.order_id, {
        status: orderStatus,
        current_location: location.trim()
      });

      // Send email notification to buyer
      const currentCourierName = shipment.current_courier_name || shipment.local_courier_name || shipment.intercity_courier_name || shipment.courier_name || "Your courier";
      const currentCourierPhone = shipment.requires_handoff 
        ? (shipment.status === "in_transit" || shipment.status === "picked_up" ? shipment.intercity_courier_phone : shipment.local_courier_phone)
        : (shipment.local_courier_phone || shipment.courier_phone);
      
      await base44.integrations.Core.SendEmail({
        to: shipment.buyer_email,
        subject: `Shipment Update - ${newStatus.replace(/_/g, " ")}`,
        body: `
          <h2>Shipment Status Update</h2>
          <p>Dear ${shipment.buyer_name},</p>
          <p>Your shipment tracking has been updated:</p>
          
          <ul>
            <li><strong>Status:</strong> ${newStatus.replace(/_/g, " ").toUpperCase()}</li>
            <li><strong>Current Location:</strong> ${location}</li>
            <li><strong>Tracking #:</strong> ${shipment.tracking_number}</li>
            ${notes ? `<li><strong>Notes:</strong> ${notes}</li>` : ""}
          </ul>
          
          ${newStatus === "delivered" ? "<p><strong>Your order has been successfully delivered!</strong></p>" : ""}
          
          <div style="background: #f5f5f5; padding: 12px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 0 0 6px; font-weight: 600;">Current Courier:</p>
            <p style="margin: 0 0 4px;"><strong>Name:</strong> ${currentCourierName}</p>
            <p style="margin: 0;"><strong>Contact:</strong> ${currentCourierPhone || "Contact shop for details"}</p>
          </div>
          
          ${shipment.requires_handoff && shipment.is_intercity ? `
          <p style="font-size: 13px; color: #666;">
            📍 This is a multi-courier delivery. ${shipment.handoff_time ? "Your package was handed off to the local courier." : "Your package will be handed off to a local courier for final delivery."}
          </p>
          ` : ""}
        `
      });

      toast.success("Tracking updated successfully");
      setLocation("");
      setNotes("");
      setProofFile(null);
      onUpdate();
      onClose();
    } catch (error) {
      toast.error(error.message || "Failed to update tracking");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Shipment Tracking - {shipment.tracking_number}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current Status */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100">Current Status</h4>
              <Badge className={statusColors[shipment.status]}>{shipment.status.replace(/_/g, " ")}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-slate-500 dark:text-slate-400">Courier</p>
                <p className="font-medium text-slate-900 dark:text-slate-100">{shipment.courier_name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{shipment.courier_phone}</p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400">Estimated Delivery</p>
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  {shipment.estimated_delivery_date ? new Date(shipment.estimated_delivery_date).toLocaleDateString() : "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Tracking History */}
          <div>
            <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 mb-3">Tracking History</h4>
            <div className="space-y-3">
              {(shipment.tracking_updates || []).slice().reverse().map((update, idx) => (
                <div key={idx} className="flex gap-3 border-l-2 border-blue-200 dark:border-blue-800 pl-4 pb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">{update.status.replace(/_/g, " ")}</Badge>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {new Date(update.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {update.location}
                    </p>
                    {update.notes && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{update.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Update Status Form */}
          {shipment.status !== "delivered" && shipment.status !== "failed" && (
            <div className="border-t border-slate-200 dark:border-slate-700 pt-4 space-y-4">
              <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100">Add Tracking Update</h4>

              <div>
                <Label>New Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Current Location *</Label>
                <div className="relative mt-1">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g., Lusaka Distribution Center" className="pl-9" />
                </div>
              </div>

              <div>
                <Label>Notes (Optional)</Label>
                <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Additional information..." className="mt-1" />
              </div>

              {newStatus === "delivered" && (
                <div>
                  <Label>Proof of Delivery (Optional)</Label>
                  <Input type="file" accept="image/*" onChange={e => setProofFile(e.target.files?.[0])} className="mt-1" />
                  <p className="text-xs text-slate-500 mt-1">Upload a photo of the delivered package</p>
                </div>
              )}

              <Button onClick={handleUpdateStatus} disabled={updating || !location.trim()} className="w-full bg-blue-600 hover:bg-blue-700">
                {updating ? "Updating..." : "Update Tracking Status"}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}