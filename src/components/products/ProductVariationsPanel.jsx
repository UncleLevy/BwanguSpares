import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function ProductVariationsPanel({ product }) {
  const [variations, setVariations] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editingVar, setEditingVar] = useState(null);
  const [form, setForm] = useState({
    name: "",
    attributes: {},
    price: "",
    sku: ""
  });
  const [attributeKey, setAttributeKey] = useState("");
  const [attributeValue, setAttributeValue] = useState("");

  useEffect(() => {
    const loadVariations = async () => {
      const vars = await base44.entities.ProductVariation.filter({ product_id: product.id });
      setVariations(vars);
    };
    loadVariations();
  }, [product.id]);

  const handleAddAttribute = () => {
    if (attributeKey && attributeValue) {
      setForm({
        ...form,
        attributes: { ...form.attributes, [attributeKey]: attributeValue }
      });
      setAttributeKey("");
      setAttributeValue("");
    }
  };

  const handleSaveVariation = async () => {
    if (!form.name) {
      toast.error("Variation name is required");
      return;
    }
    try {
      if (editingVar) {
        await base44.entities.ProductVariation.update(editingVar.id, {
          name: form.name,
          attributes: form.attributes,
          price: form.price ? parseFloat(form.price) : null,
          sku: form.sku
        });
        setVariations(variations.map(v => v.id === editingVar.id ? { ...v, ...form } : v));
        toast.success("Variation updated");
      } else {
        const newVar = await base44.entities.ProductVariation.create({
          product_id: product.id,
          name: form.name,
          attributes: form.attributes,
          price: form.price ? parseFloat(form.price) : null,
          sku: form.sku,
          status: "active"
        });
        setVariations([...variations, newVar]);
        toast.success("Variation added");
      }
      setShowDialog(false);
      setForm({ name: "", attributes: {}, price: "", sku: "" });
      setEditingVar(null);
    } catch (error) {
      toast.error("Failed to save variation");
    }
  };

  const handleDelete = async (id) => {
    try {
      await base44.entities.ProductVariation.delete(id);
      setVariations(variations.filter(v => v.id !== id));
      toast.success("Variation deleted");
    } catch (error) {
      toast.error("Failed to delete variation");
    }
  };

  const handleEdit = (variation) => {
    setEditingVar(variation);
    setForm({
      name: variation.name,
      attributes: variation.attributes || {},
      price: variation.price ? String(variation.price) : "",
      sku: variation.sku || ""
    });
    setShowDialog(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100">Product Variations</h3>
        <Button onClick={() => {
          setEditingVar(null);
          setForm({ name: "", attributes: {}, price: "", sku: "" });
          setShowDialog(true);
        }} className="bg-blue-600 hover:bg-blue-700 gap-1 h-8"><Plus className="w-3.5 h-3.5" /> Add Variation</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {variations.map(v => (
          <Card key={v.id} className="border-slate-100 dark:border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-medium text-sm text-slate-900 dark:text-slate-100">{v.name}</p>
                  {v.price && <p className="text-xs text-blue-600 font-semibold">K{v.price}</p>}
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleEdit(v)}><Pencil className="w-3 h-3" /></Button>
                  <Button size="icon" variant="ghost" className="h-6 w-6 text-red-500" onClick={() => handleDelete(v.id)}><Trash2 className="w-3 h-3" /></Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {Object.entries(v.attributes || {}).map(([key, val]) => (
                  <Badge key={key} variant="outline" className="text-[10px]">{key}: {val}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingVar ? "Edit Variation" : "Add Variation"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Variation Name *</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Red - Large" className="mt-1" /></div>
            <div><Label>Price (ZMW)</Label><Input type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} placeholder="Leave blank to use parent price" className="mt-1" /></div>
            <div><Label>SKU</Label><Input value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} className="mt-1" /></div>
            <div>
              <Label>Attributes</Label>
              <div className="space-y-2 mt-1">
                {Object.entries(form.attributes).map(([key, val]) => (
                  <Badge key={key} variant="secondary" className="mr-1">{key}: {val}</Badge>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <Input placeholder="e.g., Size" value={attributeKey} onChange={e => setAttributeKey(e.target.value)} className="h-8" />
                <Input placeholder="e.g., Large" value={attributeValue} onChange={e => setAttributeValue(e.target.value)} className="h-8" />
                <Button onClick={handleAddAttribute} size="sm" variant="outline">Add</Button>
              </div>
            </div>
          </div>
          <DialogFooter><Button onClick={handleSaveVariation} className="bg-blue-600 hover:bg-blue-700">{editingVar ? "Update" : "Add"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}