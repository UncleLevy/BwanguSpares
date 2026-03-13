import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, User, Phone, Truck, Star, Edit, Trash2 } from "lucide-react";

export default function CourierManagement({ shop, couriers, onUpdate }) {
  const [showDialog, setShowDialog] = useState(false);
  const [editingCourier, setEditingCourier] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    email: "",
    vehicle_type: "motorcycle",
    vehicle_registration: "",
    license_number: "",
    photo_url: ""
  });

  const resetForm = () => {
    setFormData({
      full_name: "",
      phone: "",
      email: "",
      vehicle_type: "motorcycle",
      vehicle_registration: "",
      license_number: "",
      photo_url: ""
    });
    setEditingCourier(null);
  };

  const handleEdit = (courier) => {
    setEditingCourier(courier);
    setFormData({
      full_name: courier.full_name,
      phone: courier.phone,
      email: courier.email || "",
      vehicle_type: courier.vehicle_type,
      vehicle_registration: courier.vehicle_registration || "",
      license_number: courier.license_number || "",
      photo_url: courier.photo_url || ""
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!formData.full_name || !formData.phone || !formData.vehicle_type) {
      toast.error("Please fill all required fields");
      return;
    }

    setLoading(true);
    try {
      if (editingCourier) {
        await base44.entities.Courier.update(editingCourier.id, formData);
        toast.success("Courier updated successfully");
      } else {
        await base44.entities.Courier.create({
          ...formData,
          shop_id: shop.id,
          shop_name: shop.name,
          status: "active",
          rating: 0,
          total_deliveries: 0
        });
        toast.success("Courier added successfully");
      }
      onUpdate();
      setShowDialog(false);
      resetForm();
    } catch (error) {
      toast.error(error.message || "Failed to save courier");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (courier) => {
    if (!confirm(`Delete courier ${courier.full_name}?`)) return;

    try {
      await base44.entities.Courier.delete(courier.id);
      toast.success("Courier deleted");
      onUpdate();
    } catch (error) {
      toast.error(error.message || "Failed to delete courier");
    }
  };

  const handleToggleStatus = async (courier) => {
    try {
      const newStatus = courier.status === "active" ? "inactive" : "active";
      await base44.entities.Courier.update(courier.id, { status: newStatus });
      toast.success(`Courier ${newStatus === "active" ? "activated" : "deactivated"}`);
      onUpdate();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100">Courier Fleet</h3>
        <Button onClick={() => { resetForm(); setShowDialog(true); }} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Courier
        </Button>
      </div>

      <div className="grid gap-4">
        {couriers.map(courier => (
          <Card key={courier.id} className="border-slate-200 dark:border-slate-700 dark:bg-slate-900">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-3 flex-1">
                  {courier.photo_url && (
                    <img src={courier.photo_url} alt="" className="w-12 h-12 rounded-full object-cover" />
                  )}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-slate-900 dark:text-slate-100">{courier.full_name}</h4>
                      <Badge variant={courier.status === "active" ? "default" : "secondary"}>
                        {courier.status}
                      </Badge>
                      {courier.rating > 0 && (
                        <div className="flex items-center gap-1 text-xs text-amber-500">
                          <Star className="w-3 h-3 fill-amber-500" />
                          {courier.rating.toFixed(1)}
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-slate-400" />
                        {courier.phone}
                      </div>
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-slate-400" />
                        {courier.vehicle_type} - {courier.vehicle_registration}
                      </div>
                      {courier.email && (
                        <div className="text-slate-500 dark:text-slate-400 text-xs">{courier.email}</div>
                      )}
                      <div className="text-slate-500 dark:text-slate-400 text-xs">
                        {courier.total_deliveries} deliveries
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(courier)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleToggleStatus(courier)}>
                    {courier.status === "active" ? "Deactivate" : "Activate"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(courier)} className="text-red-600 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {couriers.length === 0 && (
          <Card className="border-slate-200 dark:border-slate-700 dark:bg-slate-900">
            <CardContent className="p-12 text-center">
              <User className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400">No couriers added yet</p>
              <Button onClick={() => setShowDialog(true)} variant="outline" className="mt-3">
                Add Your First Courier
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCourier ? "Edit Courier" : "Add New Courier"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Full Name *</Label>
              <Input value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label>Phone Number *</Label>
              <Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label>Vehicle Type *</Label>
              <Select value={formData.vehicle_type} onValueChange={v => setFormData({ ...formData, vehicle_type: v })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="motorcycle">Motorcycle</SelectItem>
                  <SelectItem value="car">Car</SelectItem>
                  <SelectItem value="van">Van</SelectItem>
                  <SelectItem value="truck">Truck</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Vehicle Registration</Label>
              <Input value={formData.vehicle_registration} onChange={e => setFormData({ ...formData, vehicle_registration: e.target.value })} className="mt-1" placeholder="e.g., BAZ 1234" />
            </div>
            <div>
              <Label>License Number</Label>
              <Input value={formData.license_number} onChange={e => setFormData({ ...formData, license_number: e.target.value })} className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDialog(false); resetForm(); }} disabled={loading}>Cancel</Button>
            <Button onClick={handleSave} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading ? "Saving..." : editingCourier ? "Update" : "Add Courier"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}