import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { MapPin, Plus, Pencil, Trash2, Clock, User, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function BranchManager({ shopId }) {
  const [branches, setBranches] = useState([]);
  const [branchProducts, setBranchProducts] = useState({});
  const [showDialog, setShowDialog] = useState(false);
  const [editBranch, setEditBranch] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    town: "",
    region: "",
    phone: "",
    primary_contact_name: "",
    primary_contact_phone: "",
    primary_contact_email: "",
    operational_hours: "",
    latitude: 0,
    longitude: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBranches();
  }, [shopId]);

  const loadBranches = async () => {
    try {
      const data = await base44.entities.Branch.filter({ shop_id: shopId });
      setBranches(data);

      // Load products for each branch
      const productsMap = {};
      for (const branch of data) {
        const prods = await base44.entities.Product.filter({
          shop_id: shopId,
          branch_id: branch.id
        });
        productsMap[branch.id] = prods;
      }
      setBranchProducts(productsMap);
    } catch (error) {
      console.error("Failed to load branches:", error);
      toast.error("Failed to load branches");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.address || !formData.town || !formData.region) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const branchData = {
        shop_id: shopId,
        ...formData,
        latitude: parseFloat(formData.latitude) || 0,
        longitude: parseFloat(formData.longitude) || 0
      };

      if (editBranch) {
        await base44.entities.Branch.update(editBranch.id, branchData);
        setBranches(branches.map(b => b.id === editBranch.id ? { ...b, ...branchData } : b));
        toast.success("Branch updated");
      } else {
        const created = await base44.entities.Branch.create({...branchData, status: "pending"});
        setBranches([...branches, created]);
        toast.success("Branch added - pending approval");
      }
      setShowDialog(false);
      resetForm();
    } catch (error) {
      toast.error("Failed to save branch");
    }
  };

  const handleDelete = async (branchId) => {
    if (window.confirm("Are you sure?")) {
      try {
        await base44.entities.Branch.delete(branchId);
        setBranches(branches.filter(b => b.id !== branchId));
        toast.success("Branch deleted");
      } catch (error) {
        toast.error("Failed to delete branch");
      }
    }
  };

  const handleApprove = async (branchId) => {
    try {
      await base44.entities.Branch.update(branchId, { status: "approved" });
      setBranches(branches.map(b => b.id === branchId ? { ...b, status: "approved" } : b));
      toast.success("Branch approved");
    } catch (error) {
      toast.error("Failed to approve branch");
    }
  };

  const handleReject = async (branchId) => {
    try {
      await base44.entities.Branch.delete(branchId);
      setBranches(branches.filter(b => b.id !== branchId));
      toast.success("Branch rejected and removed");
    } catch (error) {
      toast.error("Failed to reject branch");
    }
  };

  const openEdit = (branch) => {
    setEditBranch(branch);
    setFormData({
      name: branch.name,
      address: branch.address,
      town: branch.town,
      region: branch.region,
      phone: branch.phone || "",
      primary_contact_name: branch.primary_contact_name || "",
      primary_contact_phone: branch.primary_contact_phone || "",
      primary_contact_email: branch.primary_contact_email || "",
      operational_hours: branch.operational_hours || "",
      latitude: branch.latitude || 0,
      longitude: branch.longitude || 0
    });
    setShowDialog(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      town: "",
      region: "",
      phone: "",
      primary_contact_name: "",
      primary_contact_phone: "",
      primary_contact_email: "",
      operational_hours: "",
      latitude: 0,
      longitude: 0
    });
    setEditBranch(null);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading branches...</div>;
  }

  // Valid branches for map
  const validBranches = branches.filter(b => b.latitude && b.longitude);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Branch Management</h2>
        <Button onClick={() => { resetForm(); setShowDialog(true); }} className="bg-blue-600 hover:bg-blue-700 gap-1.5">
          <Plus className="w-4 h-4" /> Add Branch
        </Button>
      </div>

      {/* Map View */}
      {validBranches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><MapPin className="w-5 h-5" /> Branch Locations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96 rounded-lg overflow-hidden border">
              <MapContainer center={[validBranches[0].latitude, validBranches[0].longitude]} zoom={8} style={{ height: "100%" }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
                {validBranches.map(branch => (
                  <Marker key={branch.id} position={[branch.latitude, branch.longitude]}>
                    <Popup>
                      <div className="text-sm">
                        <h4 className="font-semibold">{branch.name}</h4>
                        <p className="text-xs text-slate-500">{branch.town}, {branch.region}</p>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Branches Grid */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
         {branches.map(branch => (
           <Card key={branch.id} className={`border-slate-100 ${branch.status === "pending" ? "border-amber-200 bg-amber-50/30" : ""}`}>
             <CardHeader className="pb-3">
               <div className="flex items-start justify-between">
                 <div>
                   <CardTitle className="text-lg">{branch.name}</CardTitle>
                   <Badge className={branch.status === "approved" ? "bg-emerald-50 text-emerald-700 mt-2" : "bg-amber-50 text-amber-700 mt-2"}>
                     {branch.status}
                   </Badge>
                 </div>
                 <div className="flex gap-1">
                   {branch.status === "pending" && (
                     <>
                       <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-600 hover:text-emerald-700" onClick={() => handleApprove(branch.id)} title="Approve">
                         <CheckCircle2 className="w-4 h-4" />
                       </Button>
                       <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-700" onClick={() => handleReject(branch.id)} title="Reject">
                         <XCircle className="w-4 h-4" />
                       </Button>
                     </>
                   )}
                   {branch.status === "approved" && (
                     <>
                       <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(branch)}>
                         <Pencil className="w-4 h-4" />
                       </Button>
                       <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => handleDelete(branch.id)}>
                         <Trash2 className="w-4 h-4" />
                       </Button>
                     </>
                   )}
                 </div>
               </div>
             </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-slate-500 mb-1">Location</p>
                <p className="text-sm font-medium">{branch.address}</p>
                <p className="text-xs text-slate-500">{branch.town}, {branch.region}</p>
              </div>

              {branch.operational_hours && (
                <div className="flex items-start gap-2 text-sm">
                  <Clock className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500">Operating Hours</p>
                    <p className="font-medium">{branch.operational_hours}</p>
                  </div>
                </div>
              )}

              {branch.primary_contact_name && (
                <div className="flex items-start gap-2 text-sm border-t pt-3">
                  <User className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Primary Contact</p>
                    <p className="font-medium">{branch.primary_contact_name}</p>
                    {branch.primary_contact_phone && <p className="text-xs text-slate-500">{branch.primary_contact_phone}</p>}
                    {branch.primary_contact_email && <p className="text-xs text-slate-500">{branch.primary_contact_email}</p>}
                  </div>
                </div>
              )}

              {branchProducts[branch.id]?.length > 0 && (
                <div className="border-t pt-3">
                  <p className="text-xs text-slate-500 mb-2">Products ({branchProducts[branch.id].length})</p>
                  <div className="flex flex-wrap gap-1">
                    {branchProducts[branch.id].slice(0, 3).map(p => (
                      <Badge key={p.id} variant="secondary" className="text-[11px]">{p.name}</Badge>
                    ))}
                    {branchProducts[branch.id].length > 3 && (
                      <Badge variant="outline" className="text-[11px]">+{branchProducts[branch.id].length - 3} more</Badge>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editBranch ? "Edit Branch" : "Add New Branch"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-auto pr-2">
            <div>
              <Label>Branch Name *</Label>
              <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="mt-1" />
            </div>
            <div>
              <Label>Address *</Label>
              <Input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Town *</Label>
                <Input value={formData.town} onChange={e => setFormData({...formData, town: e.target.value})} className="mt-1" />
              </div>
              <div>
                <Label>Region *</Label>
                <Input value={formData.region} onChange={e => setFormData({...formData, region: e.target.value})} className="mt-1" />
              </div>
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="mt-1" />
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold mb-3">Primary Contact</h4>
              <div>
                <Label>Contact Name</Label>
                <Input value={formData.primary_contact_name} onChange={e => setFormData({...formData, primary_contact_name: e.target.value})} className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <Label>Contact Phone</Label>
                  <Input value={formData.primary_contact_phone} onChange={e => setFormData({...formData, primary_contact_phone: e.target.value})} className="mt-1" />
                </div>
                <div>
                  <Label>Contact Email</Label>
                  <Input type="email" value={formData.primary_contact_email} onChange={e => setFormData({...formData, primary_contact_email: e.target.value})} className="mt-1" />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold mb-3">Operations</h4>
              <div>
                <Label>Operational Hours</Label>
                <Input value={formData.operational_hours} onChange={e => setFormData({...formData, operational_hours: e.target.value})} placeholder="e.g. 9AM-5PM Monday-Friday" className="mt-1" />
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold mb-3">Map Coordinates (Optional)</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Latitude</Label>
                  <Input type="number" step="0.0001" value={formData.latitude} onChange={e => setFormData({...formData, latitude: e.target.value})} className="mt-1" />
                </div>
                <div>
                  <Label>Longitude</Label>
                  <Input type="number" step="0.0001" value={formData.longitude} onChange={e => setFormData({...formData, longitude: e.target.value})} className="mt-1" />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
              {editBranch ? "Update" : "Add"} Branch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}