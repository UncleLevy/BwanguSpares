import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { MapPin, Plus, Pencil, Trash2, Clock, User, Phone } from "lucide-react";
import { toast } from "sonner";

const EMPTY_FORM = {
  name: "",
  address: "",
  town: "",
  region: "",
  phone: "",
  primary_contact_name: "",
  primary_contact_phone: "",
  primary_contact_email: "",
  operational_hours: "",
  latitude: "",
  longitude: "",
};

export default function BranchManager({ shopId, compact = false }) {
  const [branches, setBranches] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editBranch, setEditBranch] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (shopId) loadBranches();
  }, [shopId]);

  const loadBranches = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.Branch.filter({ shop_id: shopId });
      setBranches(data);
    } catch {
      toast.error("Failed to load branches");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.address || !formData.town || !formData.region) {
      toast.error("Please fill in all required fields (name, address, town, region)");
      return;
    }
    setSaving(true);
    try {
      const branchData = {
        shop_id: shopId,
        ...formData,
        latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
        longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
      };

      if (editBranch) {
        const updated = await base44.entities.Branch.update(editBranch.id, branchData);
        setBranches(prev => prev.map(b => b.id === editBranch.id ? { ...b, ...branchData } : b));
        toast.success("Branch updated");
      } else {
        const created = await base44.entities.Branch.create({ ...branchData, status: "approved" });
        setBranches(prev => [...prev, created]);
        toast.success("Branch added successfully");
      }
      setShowDialog(false);
      resetForm();
    } catch {
      toast.error("Failed to save branch");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (branchId) => {
    if (!window.confirm("Delete this branch?")) return;
    try {
      await base44.entities.Branch.delete(branchId);
      setBranches(prev => prev.filter(b => b.id !== branchId));
      toast.success("Branch deleted");
    } catch {
      toast.error("Failed to delete branch");
    }
  };

  const openEdit = (branch) => {
    setEditBranch(branch);
    setFormData({
      name: branch.name || "",
      address: branch.address || "",
      town: branch.town || "",
      region: branch.region || "",
      phone: branch.phone || "",
      primary_contact_name: branch.primary_contact_name || "",
      primary_contact_phone: branch.primary_contact_phone || "",
      primary_contact_email: branch.primary_contact_email || "",
      operational_hours: branch.operational_hours || "",
      latitude: branch.latitude ?? "",
      longitude: branch.longitude ?? "",
    });
    setShowDialog(true);
  };

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setEditBranch(null);
  };

  const statusColor = (status) =>
    status === "approved"
      ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400"
      : "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400";

  if (loading) {
    return <div className="flex items-center justify-center h-24 text-slate-400 text-sm">Loading branches...</div>;
  }

  // ── Compact preview for Overview ─────────────────────────────────────────
  if (compact) {
    if (branches.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-8 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-center gap-2">
          <MapPin className="w-8 h-8 text-slate-300 dark:text-slate-600" />
          <p className="text-sm text-slate-500 dark:text-slate-400">No branches yet.</p>
          <p className="text-xs text-slate-400 dark:text-slate-500">Go to <strong>Branches</strong> in the sidebar to add one.</p>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {branches.map(b => (
          <Card key={b.id} className="border-slate-100 dark:border-slate-700 dark:bg-slate-900">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate flex-1 mr-2">{b.name}</p>
                <Badge className={statusColor(b.status) + " text-[10px] shrink-0"}>{b.status}</Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate">
                <MapPin className="w-3 h-3 shrink-0" /> {b.town}, {b.region}
              </p>
              {b.operational_hours && (
                <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3 shrink-0" /> {b.operational_hours}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // ── Full Branch Management view ───────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold dark:text-slate-100">Branch Management</h2>
        <Button onClick={() => { resetForm(); setShowDialog(true); }} className="bg-blue-600 hover:bg-blue-700 gap-1.5">
          <Plus className="w-4 h-4" /> Add Branch
        </Button>
      </div>

      {branches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-center gap-3">
          <MapPin className="w-12 h-12 text-slate-200 dark:text-slate-700" />
          <p className="font-semibold text-slate-600 dark:text-slate-300">No branches yet</p>
          <p className="text-sm text-slate-400 dark:text-slate-500">Add your first branch location to get started.</p>
          <Button onClick={() => { resetForm(); setShowDialog(true); }} className="bg-blue-600 hover:bg-blue-700 gap-1.5 mt-2">
            <Plus className="w-4 h-4" /> Add First Branch
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {branches.map(b => (
            <Card key={b.id} className="border-slate-100 dark:border-slate-700 dark:bg-slate-900">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0 mr-3">
                    <h3 className="font-semibold text-base text-slate-900 dark:text-slate-100 truncate">{b.name}</h3>
                    <Badge className={statusColor(b.status) + " mt-1 text-[11px]"}>{b.status}</Badge>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(b)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => handleDelete(b.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <p className="flex items-start gap-2 text-slate-600 dark:text-slate-400">
                    <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-slate-400" />
                    <span>{b.address}, {b.town}, {b.region}</span>
                  </p>
                  {b.phone && (
                    <p className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <Phone className="w-4 h-4 shrink-0 text-slate-400" /> {b.phone}
                    </p>
                  )}
                  {b.operational_hours && (
                    <p className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <Clock className="w-4 h-4 shrink-0 text-slate-400" /> {b.operational_hours}
                    </p>
                  )}
                  {b.primary_contact_name && (
                    <div className="flex items-start gap-2 pt-2 border-t border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                      <User className="w-4 h-4 shrink-0 mt-0.5 text-slate-400" />
                      <div>
                        <p className="font-medium text-slate-800 dark:text-slate-200">{b.primary_contact_name}</p>
                        {b.primary_contact_phone && <p className="text-xs">{b.primary_contact_phone}</p>}
                        {b.primary_contact_email && <p className="text-xs">{b.primary_contact_email}</p>}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={open => { setShowDialog(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editBranch ? "Edit Branch" : "Add New Branch"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-auto pr-1">
            <div>
              <Label>Branch Name *</Label>
              <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="mt-1" placeholder="e.g. Ndola Branch" />
            </div>
            <div>
              <Label>Address *</Label>
              <Input value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className="mt-1" placeholder="Street address" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Town *</Label>
                <Input value={formData.town} onChange={e => setFormData({ ...formData, town: e.target.value })} className="mt-1" placeholder="e.g. Ndola" />
              </div>
              <div>
                <Label>Region *</Label>
                <Input value={formData.region} onChange={e => setFormData({ ...formData, region: e.target.value })} className="mt-1" placeholder="e.g. Copperbelt" />
              </div>
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="mt-1" placeholder="+260 ..." />
            </div>
            <div>
              <Label>Operational Hours</Label>
              <Input value={formData.operational_hours} onChange={e => setFormData({ ...formData, operational_hours: e.target.value })} className="mt-1" placeholder="e.g. Mon–Fri 9AM–5PM" />
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
              <h4 className="text-sm font-semibold dark:text-slate-200 mb-3">Primary Contact (optional)</h4>
              <div className="space-y-3">
                <div>
                  <Label>Contact Name</Label>
                  <Input value={formData.primary_contact_name} onChange={e => setFormData({ ...formData, primary_contact_name: e.target.value })} className="mt-1" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Contact Phone</Label>
                    <Input value={formData.primary_contact_phone} onChange={e => setFormData({ ...formData, primary_contact_phone: e.target.value })} className="mt-1" />
                  </div>
                  <div>
                    <Label>Contact Email</Label>
                    <Input type="email" value={formData.primary_contact_email} onChange={e => setFormData({ ...formData, primary_contact_email: e.target.value })} className="mt-1" />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
              <h4 className="text-sm font-semibold dark:text-slate-200 mb-3">Coordinates (optional)</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Latitude</Label>
                  <Input type="number" step="0.0001" value={formData.latitude} onChange={e => setFormData({ ...formData, latitude: e.target.value })} className="mt-1" placeholder="e.g. -12.9715" />
                </div>
                <div>
                  <Label>Longitude</Label>
                  <Input type="number" step="0.0001" value={formData.longitude} onChange={e => setFormData({ ...formData, longitude: e.target.value })} className="mt-1" placeholder="e.g. 28.6355" />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDialog(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 gap-2">
              {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {saving ? "Saving..." : (editBranch ? "Update Branch" : "Add Branch")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}