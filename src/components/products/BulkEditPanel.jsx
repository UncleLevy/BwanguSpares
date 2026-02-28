import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

const CATEGORIES = [
  { value: "engine", label: "Engine" }, { value: "brakes", label: "Brakes" },
  { value: "suspension", label: "Suspension" }, { value: "electrical", label: "Electrical" },
  { value: "body", label: "Body" }, { value: "transmission", label: "Transmission" },
  { value: "exhaust", label: "Exhaust" }, { value: "cooling", label: "Cooling" },
  { value: "steering", label: "Steering" }, { value: "interior", label: "Interior" },
  { value: "accessories", label: "Accessories" }, { value: "tyres", label: "Tyres" },
  { value: "filters", label: "Filters" }, { value: "oils_fluids", label: "Oils & Fluids" },
];

export default function BulkEditPanel({ products, onUpdate }) {
  const [selected, setSelected] = useState(new Set());
  const [showDialog, setShowDialog] = useState(false);
  const [fields, setFields] = useState({
    price: "", stock: "", status: "", category: "", tags: "", description: ""
  });
  const [applyFields, setApplyFields] = useState({
    price: false, stock: false, status: false, category: false, tags: false, description: false
  });

  const handleSelectAll = () => {
    if (selected.size === products.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(products.map(p => p.id)));
    }
  };

  const handleToggleProduct = (id) => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelected(newSelected);
  };

  const handleApplyChanges = async () => {
    if (selected.size === 0) {
      toast.error("Select products to edit");
      return;
    }

    try {
      const updates = {};
      if (applyFields.price && fields.price) updates.price = parseFloat(fields.price);
      if (applyFields.stock && fields.stock) updates.stock_quantity = parseInt(fields.stock);
      if (applyFields.status && fields.status) updates.status = fields.status;
      if (applyFields.category && fields.category) updates.category = fields.category;
      if (applyFields.description && fields.description) updates.description = fields.description;
      if (applyFields.tags && fields.tags) updates.tags = fields.tags.split(",").map(t => t.trim());

      for (const productId of selected) {
        await base44.entities.Product.update(productId, updates);
      }

      const updated = products.map(p => selected.has(p.id) ? { ...p, ...updates } : p);
      onUpdate(updated);
      setShowDialog(false);
      setSelected(new Set());
      toast.success(`Updated ${selected.size} product(s)`);
    } catch (error) {
      toast.error("Failed to update products");
    }
  };

  return (
    <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Checkbox checked={selected.size === products.length && products.length > 0} onCheckedChange={handleSelectAll} />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{selected.size} selected</span>
        </div>
        <Button onClick={() => setShowDialog(true)} disabled={selected.size === 0} className="bg-blue-600 hover:bg-blue-700 h-8">Bulk Edit</Button>
      </div>

      <div className="space-y-2 max-h-40 overflow-y-auto">
        {products.map(p => (
          <div key={p.id} className="flex items-center gap-2 p-2 bg-white dark:bg-slate-800 rounded border border-slate-100 dark:border-slate-700">
            <Checkbox checked={selected.has(p.id)} onCheckedChange={() => handleToggleProduct(p.id)} />
            <span className="text-sm font-medium flex-1 text-slate-900 dark:text-slate-100">{p.name}</span>
            <span className="text-xs text-slate-500">K{p.price} • Stock: {p.stock_quantity}</span>
          </div>
        ))}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Bulk Edit {selected.size} Product(s)</DialogTitle></DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-auto pr-2">
            {/* Price */}
            <div className="flex items-start gap-3">
              <Checkbox checked={applyFields.price} onCheckedChange={c => setApplyFields({...applyFields, price: c})} className="mt-2.5" />
              <div className="flex-1">
                <Label className="text-sm">Price (ZMW)</Label>
                <Input type="number" value={fields.price} onChange={e => setFields({...fields, price: e.target.value})} placeholder="0" className="mt-1 h-8" disabled={!applyFields.price} />
              </div>
            </div>

            {/* Stock */}
            <div className="flex items-start gap-3">
              <Checkbox checked={applyFields.stock} onCheckedChange={c => setApplyFields({...applyFields, stock: c})} className="mt-2.5" />
              <div className="flex-1">
                <Label className="text-sm">Stock Quantity</Label>
                <Input type="number" value={fields.stock} onChange={e => setFields({...fields, stock: e.target.value})} placeholder="0" className="mt-1 h-8" disabled={!applyFields.stock} />
              </div>
            </div>

            {/* Status */}
            <div className="flex items-start gap-3">
              <Checkbox checked={applyFields.status} onCheckedChange={c => setApplyFields({...applyFields, status: c})} className="mt-2.5" />
              <div className="flex-1">
                <Label className="text-sm">Status</Label>
                <Select value={fields.status} onValueChange={v => setFields({...fields, status: v})} disabled={!applyFields.status}>
                  <SelectTrigger className="mt-1 h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Category */}
            <div className="flex items-start gap-3">
              <Checkbox checked={applyFields.category} onCheckedChange={c => setApplyFields({...applyFields, category: c})} className="mt-2.5" />
              <div className="flex-1">
                <Label className="text-sm">Category</Label>
                <Select value={fields.category} onValueChange={v => setFields({...fields, category: v})} disabled={!applyFields.category}>
                  <SelectTrigger className="mt-1 h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            {/* Tags */}
            <div className="flex items-start gap-3">
              <Checkbox checked={applyFields.tags} onCheckedChange={c => setApplyFields({...applyFields, tags: c})} className="mt-2.5" />
              <div className="flex-1">
                <Label className="text-sm">Tags (comma-separated)</Label>
                <Input value={fields.tags} onChange={e => setFields({...fields, tags: e.target.value})} placeholder="e.g., new, popular, sale" className="mt-1 h-8" disabled={!applyFields.tags} />
              </div>
            </div>

            {/* Description */}
            <div className="flex items-start gap-3">
              <Checkbox checked={applyFields.description} onCheckedChange={c => setApplyFields({...applyFields, description: c})} className="mt-2.5" />
              <div className="flex-1">
                <Label className="text-sm">Description</Label>
                <Textarea value={fields.description} onChange={e => setFields({...fields, description: e.target.value})} placeholder="New description for all selected products" className="mt-1 text-sm" disabled={!applyFields.description} rows={2} />
              </div>
            </div>
          </div>
          <DialogFooter><Button onClick={handleApplyChanges} className="bg-blue-600 hover:bg-blue-700">Apply Changes</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}