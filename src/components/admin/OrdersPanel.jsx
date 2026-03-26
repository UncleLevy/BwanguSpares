import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Pencil, Truck, Calendar, Package, RefreshCcw } from "lucide-react";
import SortableTableHead, { toggleSort, sortData } from "@/components/shared/SortableTableHead";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import MobileSelect from "@/components/shared/MobileSelect";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { usePagination } from "@/components/shared/usePagination";
import TablePagination from "@/components/shared/TablePagination";
import { useOptimisticList } from "@/components/shared/useOptimistic";

const statusOptions = [
  { value: "pending", label: "Pending", color: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400" },
  { value: "confirmed", label: "Confirmed", color: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400" },
  { value: "processing", label: "Processing", color: "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400" },
  { value: "shipped", label: "Shipped", color: "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400" },
  { value: "collected", label: "Collected", color: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400" },
  { value: "cancelled", label: "Cancelled", color: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400" },
];

export default function OrdersPanel({ orders: initialOrders, onOrderUpdate }) {
  const [orders, setOrders, updateOrderItem] = useOptimisticList(initialOrders);
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
  const [sort, setSort] = useState(null);

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
    const updates = {
      status: formData.status,
      tracking_number: formData.tracking_number,
      current_location: formData.current_location,
      estimated_delivery: formData.estimated_delivery
    };
    const target = editingOrder;
    setShowDialog(false);
    setEditingOrder(null);
    await updateOrderItem(
      target.id,
      updates,
      () => base44.entities.Order.update(target.id, updates),
      () => toast.error("Failed to update order")
    );
    onOrderUpdate({ ...target, ...updates });
    toast.success("Order updated successfully");
  };

  const handleRefund = async () => {
    if (!refundReason.trim()) { toast.error("Please provide a reason for the refund"); return; }
    setRefunding(true);
    const target = refundOrder;
    const patch = { status: 'cancelled', cancellation_reason: refundReason, refunded: true };
    setRefundDialog(false);
    setRefundReason("");
    await updateOrderItem(
      target.id,
      patch,
      () => base44.functions.invoke('refundOrder', { order_id: target.id, reason: refundReason }),
      (err) => toast.error(err?.response?.data?.error || "Failed to process refund")
    );
    onOrderUpdate({ ...target, ...patch });
    toast.success("Refund processed and order cancelled");
    setRefunding(false);
  };

  const getStatusColor = (status) => {
    return statusOptions.find(s => s.value === status)?.color || "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300";
  };

  const sortedOrders = sortData(orders, sort);
  const pagination = usePagination(sortedOrders, 15);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Order Management</h1>

      {/* Mobile: card list */}
      <div className="md:hidden space-y-3">
        {pagination.paginatedItems.map(order => (
          <div key={order.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700 p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="font-mono text-xs text-slate-400 dark:text-slate-500">#{order.id?.slice(0, 8)}</span>
                <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm mt-0.5">{order.buyer_name || order.buyer_email}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{order.shop_name}</p>
              </div>
              <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-slate-900 dark:text-slate-100">K{order.total_amount?.toLocaleString()}</span>
              <span className="text-xs text-slate-400 dark:text-slate-500">{order.created_date ? new Date(order.created_date).toLocaleDateString() : "—"}</span>
            </div>
            {order.tracking_number && (
              <p className="text-xs font-mono text-blue-600 dark:text-blue-400">📦 {order.tracking_number}</p>
            )}
            {order.refunded && <Badge className="bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 text-[10px]">Refunded</Badge>}
            <div className="flex gap-2 pt-1 border-t border-slate-100 dark:border-slate-700">
              <Button size="sm" variant="outline" className="flex-1 gap-1.5 h-9" onClick={() => handleEditOrder(order)}>
                <Pencil className="w-3.5 h-3.5" /> Edit
              </Button>
              {order.status !== 'cancelled' && (
                <Button size="sm" variant="outline" className="flex-1 gap-1.5 h-9 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800"
                  onClick={() => { setRefundOrder(order); setRefundReason(""); setRefundDialog(true); }}>
                  <RefreshCcw className="w-3.5 h-3.5" /> Refund
                </Button>
              )}
            </div>
          </div>
        ))}
        {orders.length > 15 && (
          <TablePagination
            currentPage={pagination.currentPage}
            totalItems={pagination.totalItems}
            itemsPerPage={pagination.itemsPerPage}
            onPageChange={pagination.setCurrentPage}
          />
        )}
      </div>

      {/* Desktop: table */}
      <Card className="hidden md:block border-slate-100 dark:border-slate-700 dark:bg-slate-900">
        <CardContent className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-800">
                  <TableHead>Order</TableHead>
                  <SortableTableHead field="buyer_name" sort={sort} onSort={f => setSort(prev => toggleSort(prev, f))}>Buyer</SortableTableHead>
                  <SortableTableHead field="shop_name" sort={sort} onSort={f => setSort(prev => toggleSort(prev, f))}>Shop</SortableTableHead>
                  <SortableTableHead field="total_amount" sort={sort} onSort={f => setSort(prev => toggleSort(prev, f))}>Amount</SortableTableHead>
                  <SortableTableHead field="status" sort={sort} onSort={f => setSort(prev => toggleSort(prev, f))}>Status</SortableTableHead>
                  <TableHead>Tracking</TableHead>
                  <SortableTableHead field="created_date" sort={sort} onSort={f => setSort(prev => toggleSort(prev, f))}>Date</SortableTableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagination.paginatedItems.map(order => (
                  <TableRow key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <TableCell className="font-mono text-xs text-slate-500 dark:text-slate-400">{order.id?.slice(0, 8)}</TableCell>
                    <TableCell className="text-sm text-slate-900 dark:text-slate-100">{order.buyer_name || order.buyer_email}</TableCell>
                    <TableCell className="text-sm text-slate-500 dark:text-slate-400">{order.shop_name}</TableCell>
                    <TableCell className="font-medium text-slate-900 dark:text-slate-100">K{order.total_amount?.toLocaleString()}</TableCell>
                    <TableCell><Badge className={getStatusColor(order.status)}>{order.status}</Badge></TableCell>
                    <TableCell>
                      {order.tracking_number ? (
                        <span className="text-xs font-mono text-blue-600 dark:text-blue-400">{order.tracking_number}</span>
                      ) : (
                        <span className="text-xs text-slate-400 dark:text-slate-500">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-slate-400 dark:text-slate-500">{order.created_date ? new Date(order.created_date).toLocaleDateString() : "—"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-8 gap-1.5" onClick={() => handleEditOrder(order)}>
                          <Pencil className="w-3.5 h-3.5" /> Edit
                        </Button>
                        {order.status !== 'cancelled' && (
                          <Button size="sm" variant="ghost"
                            className="h-8 gap-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-700"
                            onClick={() => { setRefundOrder(order); setRefundReason(""); setRefundDialog(true); }}>
                            <RefreshCcw className="w-3.5 h-3.5" /> Refund
                          </Button>
                        )}
                        {order.refunded && <Badge className="bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 text-[10px]">Refunded</Badge>}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {orders.length > 15 && (
            <TablePagination
              currentPage={pagination.currentPage}
              totalItems={pagination.totalItems}
              itemsPerPage={pagination.itemsPerPage}
              onPageChange={pagination.setCurrentPage}
            />
          )}
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
            <div className="text-sm text-slate-500 dark:text-slate-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
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
              <div className="mt-1">
                <MobileSelect 
                  value={formData.status} 
                  onValueChange={v => setFormData({...formData, status: v})}
                  placeholder="Select status"
                  options={statusOptions}
                />
              </div>
            </div>

            {formData.status === "shipped" && (
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm text-slate-600 dark:text-slate-300">
                ℹ️ Shipping and delivery tracking is managed in the <strong>Shipping Module</strong> of the shop's dashboard.
              </div>
            )}
            
            {formData.status === "collected" && (
              <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3 text-sm text-slate-600 dark:text-slate-300">
                ✓ Customer has collected this order from the shop.
              </div>
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