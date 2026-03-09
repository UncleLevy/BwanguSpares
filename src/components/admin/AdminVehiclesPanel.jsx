import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Edit2, ChevronDown, ChevronRight, Car } from "lucide-react";
import { toast } from "sonner";

export default function AdminVehiclesPanel() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedBrands, setExpandedBrands] = useState({});

  // Brand dialog
  const [showBrandDialog, setShowBrandDialog] = useState(false);
  const [brandName, setBrandName] = useState("");

  // Model dialog
  const [showModelDialog, setShowModelDialog] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState("");
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [modelForm, setModelForm] = useState({ model: "", years: "" });

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

  // Group vehicles by brand
  const grouped = useMemo(() => {
    const map = {};
    vehicles.forEach(v => {
      const brand = v.brand || "Unknown";
      if (!map[brand]) map[brand] = [];
      map[brand].push(v);
    });
    return map;
  }, [vehicles]);

  const filteredBrands = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return Object.entries(grouped).filter(([brand, models]) =>
      brand.toLowerCase().includes(q) || models.some(m => m.model?.toLowerCase().includes(q))
    );
  }, [grouped, searchTerm]);

  const toggleBrand = (brand) => {
    setExpandedBrands(prev => ({ ...prev, [brand]: !prev[brand] }));
  };

  // Add brand — just opens model dialog with new brand
  const openAddBrand = () => {
    setBrandName("");
    setShowBrandDialog(true);
  };

  const handleBrandConfirm = () => {
    if (!brandName.trim()) { toast.error("Enter a brand name"); return; }
    setShowBrandDialog(false);
    setSelectedBrand(brandName.trim());
    setEditingVehicle(null);
    setModelForm({ model: "", years: "" });
    setShowModelDialog(true);
  };

  const openAddModel = (brand) => {
    setSelectedBrand(brand);
    setEditingVehicle(null);
    setModelForm({ model: "", years: "" });
    setShowModelDialog(true);
  };

  const openEditModel = (vehicle) => {
    setSelectedBrand(vehicle.brand);
    setEditingVehicle(vehicle);
    setModelForm({ model: vehicle.model, years: vehicle.years?.join(", ") || "" });
    setShowModelDialog(true);
  };

  const handleSaveModel = async () => {
    if (!modelForm.model.trim()) { toast.error("Model name is required"); return; }
    const years = modelForm.years.trim()
      ? modelForm.years.split(",").map(y => parseInt(y.trim())).filter(y => !isNaN(y))
      : [];

    try {
      if (editingVehicle) {
        await base44.entities.Vehicle.update(editingVehicle.id, {
          brand: selectedBrand,
          model: modelForm.model.trim(),
          years,
        });
        toast.success("Model updated");
      } else {
        await base44.entities.Vehicle.create({
          brand: selectedBrand,
          model: modelForm.model.trim(),
          years,
          status: "active",
        });
        toast.success(`Model added to ${selectedBrand}`);
        // Keep dialog open to add another model, just reset model fields
        setModelForm({ model: "", years: "" });
        setEditingVehicle(null);
        loadVehicles();
        setExpandedBrands(prev => ({ ...prev, [selectedBrand]: true }));
        return;
      }
      setShowModelDialog(false);
      loadVehicles();
      setExpandedBrands(prev => ({ ...prev, [selectedBrand]: true }));
    } catch {
      toast.error("Failed to save");
    }
  };

  const handleDeleteModel = async (id) => {
    if (!confirm("Delete this model?")) return;
    await base44.entities.Vehicle.delete(id);
    toast.success("Model deleted");
    loadVehicles();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Vehicles</h2>
          <p className="text-sm text-slate-500 mt-1">Manage brands and their models for product compatibility</p>
        </div>
        <Button onClick={openAddBrand} className="gap-2 bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4" /> Add Brand
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Search</label>
              <Input placeholder="Brand or model..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="mt-1" />
            </div>
            <span className="text-sm text-slate-500">{filteredBrands.length} brands</span>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-slate-500 py-8 text-center">Loading...</p>
          ) : filteredBrands.length === 0 ? (
            <p className="text-slate-500 py-8 text-center">No vehicles found</p>
          ) : (
            <div className="space-y-2">
              {filteredBrands.map(([brand, models]) => (
                <div key={brand} className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                  {/* Brand row */}
                  <div
                    className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    onClick={() => toggleBrand(brand)}
                  >
                    <div className="flex items-center gap-3">
                      {expandedBrands[brand] ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                      <Car className="w-4 h-4 text-blue-500" />
                      <span className="font-semibold text-slate-800 dark:text-slate-100">{brand}</span>
                      <Badge variant="outline" className="text-xs">{models.length} model{models.length !== 1 ? "s" : ""}</Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1 text-xs text-blue-600 hover:bg-blue-50"
                      onClick={e => { e.stopPropagation(); openAddModel(brand); }}
                    >
                      <Plus className="w-3 h-3" /> Add Model
                    </Button>
                  </div>

                  {/* Models list */}
                  {expandedBrands[brand] && (
                    <div className="divide-y divide-slate-100 dark:divide-slate-700">
                      {models.map(v => (
                        <div key={v.id} className="flex items-center justify-between px-6 py-2.5 bg-white dark:bg-slate-800/50">
                          <div className="flex items-center gap-4">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{v.model}</span>
                            {v.years?.length > 0 && (
                              <span className="text-xs text-slate-400">
                                {Math.min(...v.years)} – {Math.max(...v.years)}
                              </span>
                            )}
                            <Badge variant={v.status === "active" ? "default" : "outline"} className="text-xs">
                              {v.status}
                            </Badge>
                          </div>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" onClick={() => openEditModel(v)} className="w-7 h-7">
                              <Edit2 className="w-3 h-3" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => handleDeleteModel(v.id)} className="w-7 h-7 text-red-500 hover:bg-red-50">
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Brand Name Dialog */}
      <Dialog open={showBrandDialog} onOpenChange={setShowBrandDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add New Brand</DialogTitle>
          </DialogHeader>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Brand Name</label>
            <Input
              placeholder="e.g. Toyota, Ford, Nissan"
              value={brandName}
              onChange={e => setBrandName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleBrandConfirm()}
              className="mt-2"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBrandDialog(false)}>Cancel</Button>
            <Button onClick={handleBrandConfirm} className="bg-blue-600 hover:bg-blue-700">Next: Add Models</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Model Dialog */}
      <Dialog open={showModelDialog} onOpenChange={setShowModelDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {editingVehicle ? `Edit Model — ${selectedBrand}` : `Add Models to ${selectedBrand}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!editingVehicle && (
              <p className="text-xs text-slate-500 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                💡 After saving, the form stays open so you can add more models to <strong>{selectedBrand}</strong>.
              </p>
            )}
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Model Name</label>
              <Input
                placeholder="e.g. Corolla, Ranger, Hilux"
                value={modelForm.model}
                onChange={e => setModelForm({ ...modelForm, model: e.target.value })}
                className="mt-2"
                autoFocus
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Compatible Years <span className="text-slate-400 font-normal">(comma-separated)</span></label>
              <Input
                placeholder="e.g. 2015, 2016, 2017, 2018"
                value={modelForm.years}
                onChange={e => setModelForm({ ...modelForm, years: e.target.value })}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowModelDialog(false)}>Done</Button>
            <Button onClick={handleSaveModel} className="bg-blue-600 hover:bg-blue-700">
              {editingVehicle ? "Update Model" : "Save & Add Another"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}