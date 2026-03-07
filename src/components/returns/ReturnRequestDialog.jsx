import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";
import { RotateCcw } from "lucide-react";

const RETURN_REASONS = [
  { value: "defective", label: "Defective / Not working" },
  { value: "not_as_described", label: "Not as described" },
  { value: "damaged", label: "Damaged during delivery" },
  { value: "incorrect_item", label: "Incorrect item sent" },
  { value: "unsatisfied", label: "Not satisfied" },
  { value: "other", label: "Other" },
];

export default function ReturnRequestDialog({ open, onClose, order, user }) {
  const [form, setForm] = useState({ item_index: "0", reason: "", description: "" });
  const [submitting, setSubmitting] = useState(false);

  const items = order?.items || [];

  const handleSubmit = async () => {
    if (!form.reason) { toast.error("Please select a reason"); return; }
    if (!form.description.trim()) { toast.error("Please describe the issue"); return; }

    setSubmitting(true);
    const selectedItem = items[parseInt(form.item_index)];

    // Check if return already exists for this item
    const existingReturn = await base44.entities.Return.filter({
      order_id: order.id,
      product_id: selectedItem?.product_id,
      status: { $in: ["pending", "approved", "return_received"] }
    });

    if (existingReturn.length > 0) {
      toast.error("A return request for this item is already in progress");
      setSubmitting(false);
      return;
    }

    const returnData = {
      order_id: order.id,
      buyer_email: user.email,
      buyer_name: user.full_name,
      shop_id: order.shop_id,
      shop_name: order.shop_name,
      product_id: selectedItem?.product_id || "",
      product_name: selectedItem?.product_name || "",
      reason: form.reason,
      description: form.description,
      quantity: selectedItem?.quantity || 1,
      refund_amount: selectedItem?.price * (selectedItem?.quantity || 1),
      status: "pending",
    };

    await base44.entities.Return.create(returnData);

    // Send emails
    const emailNotifications = await import("@/components/lib/emailNotifications");
    emailNotifications.emailReturnInitiated(user.email, user.full_name, returnData);
    
    // Get shop owner email for return notification to shop
    const shop = await base44.entities.Shop.filter({ id: order.shop_id });
    if (shop.length > 0) {
      emailNotifications.emailReturnToShop(shop[0].owner_email, shop[0].name, returnData);
    }

    // Notify the shop via notification
    await base44.entities.Notification.create({
      user_email: order.shop_owner_email || order.shop_id,
      type: "system_alert",
      title: "New Return Request",
      message: `${user.full_name} has requested a return for order #${order.id?.slice(0,8)}. Reason: ${RETURN_REASONS.find(r => r.value === form.reason)?.label}.`,
      related_id: order.id,
    });

    toast.success("Return request submitted. The shop will review it shortly.");
    setForm({ item_index: "0", reason: "", description: "" });
    onClose();
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-orange-500" />
            Request Return
          </DialogTitle>
          <DialogDescription>
            Order #{order?.id?.slice(0,8)} from {order?.shop_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {items.length > 1 && (
            <div>
              <Label>Which item?</Label>
              <Select value={form.item_index} onValueChange={v => setForm(f => ({ ...f, item_index: v }))}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {items.map((item, i) => (
                    <SelectItem key={i} value={String(i)}>
                      {item.product_name} (Qty: {item.quantity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label>Reason *</Label>
            <Select value={form.reason} onValueChange={v => setForm(f => ({ ...f, reason: v }))}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select a reason..." />
              </SelectTrigger>
              <SelectContent>
                {RETURN_REASONS.map(r => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Description *</Label>
            <Textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Describe the issue in detail..."
              className="mt-1"
              rows={3}
            />
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-xs text-amber-800 dark:text-amber-300">
            The shop owner will review your request and either approve or reject it. You'll be notified of their decision.
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {submitting ? "Submitting..." : "Submit Return Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}