import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Edit2, X } from "lucide-react";
import { toast } from "sonner";

export default function AdminVehiclesPanel() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ brand: "", model: "", years: "" });
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadVehicles();
    const unsub = base44.entities.Vehicle.subscribe(() => loadVehicles());
    return unsub;
  }, []);

  const loadVehicles = async () => {
    setLoading(true);
    const data = await base44.entities.Vehicle.list("-updated_date", 500);
    setVehicles(data);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!formData.brand.trim() || !formData.model.trim()) {
      toast.error("Brand and model are required");
      return;
    }
    const years = formData.years.trim()
      ? formData.years.split(",").map(y => parseInt(y.trim())).filter(y => !isNaN(y))
      : [];

    try {
      if (editingId) {
        await base44.entities.Vehicle.update(editingId, {
          brand: formData.brand.trim(),
          model: formData.model.trim(),
          years,
        });
        toast.success("Vehicle updated");
      } else {
        await base44.entities.Vehicle.create({
          brand: formData.brand.trim(),
          model: formData.model.trim(),
          years,
        });
        toast.success("Vehicle added");
      }
      resetForm();
      loadVehicles();
    } catch (err) {
      toast.error("Failed to save vehicle");
    }
  };

  const handleEdit = (vehicle) => {
    setEditingId(vehicle.id);
    setFormData({
      brand: vehicle.brand,
      model: vehicle.model,
      years: vehicle.years?.join(", ") || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure?")) {
      await base44.entities.Vehicle.delete(id);
      toast.success("Vehicle deleted");
      loadVehicles();
    }
  };

  const resetForm = () => {
    setFormData({ brand: "", model: "", years: "" });
    setEditingId(null);
    setShowForm(false);
  };

  const filtered = vehicles.filter(v =>
    `${v.brand} ${v.model}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Vehicles</h2>
          <p className="text-sm text-slate-500 mt-1">Manage vehicle brands and models for product compatibility</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }} className="gap-2 bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4" /> Add Vehicle
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Search vehicles</label>
              <Input placeholder="Brand or model..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="mt-1" />
            </div>
            <span className="text-sm text-slate-500">{filtered.length} vehicles</span>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-slate-500 py-8 text-center">Loading...</p>
          ) : filtered.length === 0 ? (
            <p className="text-slate-500 py-8 text-center">No vehicles found</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Brand</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Years</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(v => (
                    <TableRow key={v.id}>
                      <TableCell className="font-medium">{v.brand}</TableCell>
                      <TableCell>{v.model}</TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {v.years?.length > 0 ? `${Math.min(...v.years)} - ${Math.max(...v.years)}` : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={v.status === "active" ? "default" : "outline"}>
                          {v.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="icon" variant="ghost" onClick={() => handleEdit(v)} className="w-8 h-8">
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDelete(v.id)} className="w-8 h-8 text-red-600 hover:bg-red-50">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Vehicle" : "Add New Vehicle"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Brand</label>
              <Input
                placeholder="e.g. Toyota, Ford"
                value={formData.brand}
                onChange={e => setFormData({ ...formData, brand: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Model</label>
              <Input
                placeholder="e.g. Corolla, Ranger"
                value={formData.model}
                onChange={e => setFormData({ ...formData, model: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Years (comma-separated)</label>
              <Input
                placeholder="e.g. 2015, 2016, 2017, 2018"
                value={formData.years}
                onChange={e => setFormData({ ...formData, years: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>Cancel</Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
              {editingId ? "Update" : "Add"} Vehicle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}