import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Pencil, Truck, Calendar, Package, RefreshCcw } from "lucide-react";
import SortableTableHead, { toggleSort, sortData } from "@/components/shared/SortableTableHead";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

const statusOptions = [
  { value: "pending", label: "Pending", color: "bg-amber-50 text-amber-700" },
  { value: "confirmed", label: "Confirmed", color: "bg-blue-50 text-blue-700" },
  { value: "processing", label: "Processing", color: "bg-indigo-50 text-indigo-700" },
  { value: "shipped", label: "Shipped", color: "bg-purple-50 text-purple-700" },
  { value: "delivered", label: "Delivered", color: "bg-emerald-50 text-emerald-700" },
  { value: "cancelled", label: "Cancelled", color: "bg-red-50 text-red-700" },
];

export default function OrdersPanel({ orders, onOrderUpdate }) {
  const [editingOrder, setEditingOrder] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    status: "",
    tracking_number: "",
    current_location: "",
    estimated_delivery: ""
  });
  const [refundDialog, setRefundDialog] = useState(false);
  const [refundOrder, setRefundOrder] = useState(null);
  const [refundReason, setRefundReason] = useState("");
  const [refunding, setRefunding] = useState(false);

  const handleEditOrder = (order) => {
    setEditingOrder(order);
    setFormData({
      status: order.status,
      tracking_number: order.tracking_number || "",
      current_location: order.current_location || "",
      estimated_delivery: order.estimated_delivery || ""
    });
    setShowDialog(true);
  };

  const handleSaveOrder = async () => {
    try {
      const updates = {
        status: formData.status,
        tracking_number: formData.tracking_number,
        current_location: formData.current_location,
        estimated_delivery: formData.estimated_delivery
      };

      await base44.entities.Order.update(editingOrder.id, updates);
      
      const updatedOrder = { ...editingOrder, ...updates };
      onOrderUpdate(updatedOrder);
      
      setShowDialog(false);
      setEditingOrder(null);
      toast.success("Order updated successfully");
    } catch (error) {
      toast.error("Failed to update order");
    }
  };

  const handleRefund = async () => {
    if (!refundReason.trim()) { toast.error("Please provide a reason for the refund"); return; }
    setRefunding(true);
    try {
      await base44.functions.invoke('refundOrder', { order_id: refundOrder.id, reason: refundReason });
      const updated = { ...refundOrder, status: 'cancelled', cancellation_reason: refundReason, refunded: true };
      onOrderUpdate(updated);
      toast.success("Refund processed and order cancelled");
      setRefundDialog(false);
      setRefundReason("");
    } catch (error) {
      toast.error(error?.response?.data?.error || "Failed to process refund");
    }
    setRefunding(false);
  };

  const getStatusColor = (status) => {
    return statusOptions.find(s => s.value === status)?.color || "bg-slate-50 text-slate-700";
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Order Management</h1>

      <Card className="border-slate-100 dark:border-slate-700">
        <CardContent className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-800">
                  <TableHead>Order</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Shop</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tracking</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map(order => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-xs text-slate-500">{order.id?.slice(0, 8)}</TableCell>
                    <TableCell className="text-sm">{order.buyer_name || order.buyer_email}</TableCell>
                    <TableCell className="text-sm text-slate-500 dark:text-slate-400">{order.shop_name}</TableCell>
                    <TableCell className="font-medium">K{order.total_amount?.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {order.tracking_number ? (
                        <span className="text-xs font-mono text-blue-600">{order.tracking_number}</span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-8 gap-1.5" onClick={() => handleEditOrder(order)}>
                          <Pencil className="w-3.5 h-3.5" /> Edit
                        </Button>
                        {order.status !== 'cancelled' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 gap-1.5 text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => { setRefundOrder(order); setRefundReason(""); setRefundDialog(true); }}
                          >
                            <RefreshCcw className="w-3.5 h-3.5" /> Refund
                          </Button>
                        )}
                        {order.refunded && <Badge className="bg-red-50 text-red-700 text-[10px]">Refunded</Badge>}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={refundDialog} onOpenChange={setRefundDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Refund Order #{refundOrder?.id?.slice(0, 8)}</DialogTitle>
            <DialogDescription>
              This will cancel the order and attempt a Stripe refund if the order was paid online. Please provide a reason.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Reason for Refund *</Label>
              <Textarea
                value={refundReason}
                onChange={e => setRefundReason(e.target.value)}
                placeholder="e.g. Item not available, customer dispute, wrong item shipped..."
                className="mt-1"
                rows={3}
              />
            </div>
            <div className="text-sm text-slate-500 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <strong>Order:</strong> K{refundOrder?.total_amount?.toLocaleString()} from {refundOrder?.shop_name}<br />
              <strong>Payment:</strong> {refundOrder?.stripe_session_id ? "Stripe (online)" : "Cash/Manual"}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundDialog(false)}>Cancel</Button>
            <Button onClick={handleRefund} disabled={refunding} className="bg-red-600 hover:bg-red-700">
              {refunding ? "Processing..." : "Process Refund & Cancel Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Update Order #{editingOrder?.id?.slice(0, 8)}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Order Status *</Label>
              <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v})}>
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

            {(formData.status === "shipped" || formData.status === "delivered") && (
              <>
                <div>
                  <Label className="flex items-center gap-2"><Package className="w-4 h-4" /> Tracking Number</Label>
                  <Input
                    value={formData.tracking_number}
                    onChange={e => setFormData({...formData, tracking_number: e.target.value})}
                    placeholder="e.g., ZM2024001234"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="flex items-center gap-2"><Truck className="w-4 h-4" /> Current Location</Label>
                  <Input
                    value={formData.current_location}
                    onChange={e => setFormData({...formData, current_location: e.target.value})}
                    placeholder="e.g., Lusaka Hub, Transit"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="flex items-center gap-2"><Calendar className="w-4 h-4" /> Estimated Delivery</Label>
                  <Input
                    type="date"
                    value={formData.estimated_delivery}
                    onChange={e => setFormData({...formData, estimated_delivery: e.target.value})}
                    className="mt-1"
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveOrder} className="bg-blue-600 hover:bg-blue-700">Update Order</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}