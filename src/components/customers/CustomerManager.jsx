import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Eye, Mail, Phone, MapPin } from "lucide-react";

export default function CustomerManager({ shopId }) {
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState(false);
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    address: "",
    town: "",
    region: "",
    notes: "",
    status: "active"
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [customersData, ordersData] = await Promise.all([
        base44.entities.Customer.filter({ shop_id: shopId }),
        base44.entities.Order.filter({ shop_id: shopId })
      ]);
      setCustomers(customersData);
      setOrders(ordersData);
    } catch (error) {
      toast.error("Failed to load data");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (shopId) fetchData();
  }, [shopId]);

  const handleSave = async () => {
    if (!form.full_name || !form.email) {
      toast.error("Name and email are required");
      return;
    }

    try {
      if (editingCustomer) {
        await base44.entities.Customer.update(editingCustomer.id, form);
        setCustomers(customers.map(c => c.id === editingCustomer.id ? { ...editingCustomer, ...form } : c));
        toast.success("Customer updated");
      } else {
        const newCustomer = await base44.entities.Customer.create({
          ...form,
          shop_id: shopId
        });
        setCustomers([...customers, newCustomer]);
        toast.success("Customer added");
      }
      setDialog(false);
      setEditingCustomer(null);
      setForm({ full_name: "", email: "", phone: "", address: "", town: "", region: "", notes: "", status: "active" });
    } catch (error) {
      toast.error("Failed to save customer");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this customer?")) return;
    try {
      await base44.entities.Customer.delete(id);
      setCustomers(customers.filter(c => c.id !== id));
      toast.success("Customer deleted");
    } catch (error) {
      toast.error("Failed to delete customer");
    }
  };

  const openEdit = (customer) => {
    setEditingCustomer(customer);
    setForm(customer);
    setDialog(true);
  };

  const openDetails = (customer) => {
    setSelectedCustomer(customer);
    setDetailsDialog(true);
  };

  const customerOrders = selectedCustomer ? orders.filter(o => o.buyer_email === selectedCustomer.email) : [];

  if (loading) return <div className="flex items-center justify-center p-8"><div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full" /></div>;

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Customers</h1>
          <Button onClick={() => { setEditingCustomer(null); setForm({ full_name: "", email: "", phone: "", address: "", town: "", region: "", notes: "", status: "active" }); setDialog(true); }} className="bg-blue-600 hover:bg-blue-700 gap-1.5">
            <Plus className="w-4 h-4" /> Add Customer
          </Button>
        </div>

        <Card className="border-slate-100 dark:border-slate-700 dark:bg-slate-900">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-800">
                    <TableHead className="dark:text-slate-300">Name</TableHead>
                    <TableHead className="dark:text-slate-300">Email</TableHead>
                    <TableHead className="dark:text-slate-300">Phone</TableHead>
                    <TableHead className="dark:text-slate-300">Total Orders</TableHead>
                    <TableHead className="dark:text-slate-300">Total Spent</TableHead>
                    <TableHead className="dark:text-slate-300">Status</TableHead>
                    <TableHead className="dark:text-slate-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan="7" className="text-center py-8 text-slate-500 dark:text-slate-400">No customers yet</TableCell>
                    </TableRow>
                  ) : (
                    customers.map(c => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium dark:text-slate-100">{c.full_name}</TableCell>
                        <TableCell className="text-sm dark:text-slate-400">{c.email}</TableCell>
                        <TableCell className="text-sm dark:text-slate-400">{c.phone || "-"}</TableCell>
                        <TableCell className="dark:text-slate-300">{c.total_orders || 0}</TableCell>
                        <TableCell className="dark:text-slate-300">K{(c.total_spent || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                        <TableCell><Badge className={c.status === "active" ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400" : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400"}>{c.status}</Badge></TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => openDetails(c)} className="h-8 gap-1"><Eye className="w-3 h-3" /> View</Button>
                            <Button size="sm" variant="ghost" onClick={() => openEdit(c)} className="h-8"><Pencil className="w-3 h-3" /></Button>
                            <Button size="sm" variant="ghost" className="h-8 text-red-500" onClick={() => handleDelete(c.id)}><Trash2 className="w-3 h-3" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingCustomer ? "Edit Customer" : "Add Customer"}</DialogTitle></DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-auto">
            <div><Label>Full Name *</Label><Input value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} className="mt-1" /></div>
            <div><Label>Email *</Label><Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="mt-1" /></div>
            <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="mt-1" /></div>
            <div><Label>Address</Label><Input value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="mt-1" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Town</Label><Input value={form.town} onChange={e => setForm({...form, town: e.target.value})} className="mt-1" /></div>
              <div><Label>Region</Label><Input value={form.region} onChange={e => setForm({...form, region: e.target.value})} className="mt-1" /></div>
            </div>
            <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={3} className="mt-1" placeholder="Add internal notes about this customer..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">{editingCustomer ? "Update" : "Add"} Customer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailsDialog} onOpenChange={setDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{selectedCustomer?.full_name}</DialogTitle></DialogHeader>
          {selectedCustomer && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-slate-400 dark:text-slate-500" /><div><p className="text-xs text-slate-500 dark:text-slate-400">Email</p><p className="text-sm font-medium dark:text-slate-200">{selectedCustomer.email}</p></div></div>
                <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-slate-400 dark:text-slate-500" /><div><p className="text-xs text-slate-500 dark:text-slate-400">Phone</p><p className="text-sm font-medium dark:text-slate-200">{selectedCustomer.phone || "-"}</p></div></div>
                {selectedCustomer.address && (
                  <div className="flex items-start gap-2 col-span-2"><MapPin className="w-4 h-4 text-slate-400 dark:text-slate-500 mt-0.5" /><div><p className="text-xs text-slate-500 dark:text-slate-400">Address</p><p className="text-sm font-medium dark:text-slate-200">{selectedCustomer.address}{selectedCustomer.town ? `, ${selectedCustomer.town}` : ""}</p></div></div>
                )}
              </div>

              {selectedCustomer.notes && (
                <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">NOTES</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{selectedCustomer.notes}</p>
                </div>
              )}

              <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 font-semibold">ORDER HISTORY</p>
                {customerOrders.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">No orders yet</p>
                ) : (
                  <div className="space-y-2">
                    {customerOrders.map(o => (
                      <div key={o.id} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm">
                        <div>
                          <p className="font-medium dark:text-slate-200">{o.items?.length || 0} items</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(o.created_date).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium dark:text-slate-200">K{o.total_amount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                          <Badge className={o.status === "delivered" ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-[10px]" : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-400 text-[10px]"}>{o.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsDialog(false)}>Close</Button>
            <Button onClick={() => { setDetailsDialog(false); openEdit(selectedCustomer); }} className="bg-blue-600 hover:bg-blue-700">Edit Customer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}