import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Copy, Pencil, Trash2, Zap } from "lucide-react";

export default function DiscountCodeManager({ shopId, codes, onCodesChange }) {
  const [dialog, setDialog] = useState(false);
  const [editingCode, setEditingCode] = useState(null);
  const [form, setForm] = useState({
    code: "",
    discount_type: "percentage",
    discount_value: "",
    max_discount_amount: "",
    min_purchase_amount: "",
    usage_limit: "",
    description: "",
    valid_from: new Date().toISOString().split('T')[0],
    valid_until: ""
  });

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setForm({...form, code});
    toast.success("Code generated!");
  };

  const handleSave = async () => {
    if (!form.code || !form.discount_value) {
      toast.error("Code and discount value are required");
      return;
    }

    if (form.discount_type === "percentage" && (form.discount_value < 0 || form.discount_value > 100)) {
      toast.error("Percentage must be between 0 and 100");
      return;
    }

    try {
      const data = {
        shop_id: shopId,
        code: form.code.toUpperCase(),
        discount_type: form.discount_type,
        discount_value: parseFloat(form.discount_value),
        max_discount_amount: form.max_discount_amount ? parseFloat(form.max_discount_amount) : null,
        min_purchase_amount: form.min_purchase_amount ? parseFloat(form.min_purchase_amount) : null,
        usage_limit: form.usage_limit ? parseInt(form.usage_limit) : null,
        description: form.description,
        valid_from: form.valid_from,
        valid_until: form.valid_until || null
      };

      if (editingCode) {
        await base44.entities.DiscountCode.update(editingCode.id, data);
        onCodesChange(codes.map(c => c.id === editingCode.id ? { ...editingCode, ...data } : c));
        toast.success("Discount code updated");
      } else {
        const newCode = await base44.entities.DiscountCode.create(data);
        onCodesChange([newCode, ...codes]);
        toast.success("Discount code created");
      }
      setDialog(false);
      setEditingCode(null);
      setForm({ code: "", discount_type: "percentage", discount_value: "", max_discount_amount: "", min_purchase_amount: "", usage_limit: "", description: "", valid_from: new Date().toISOString().split('T')[0], valid_until: "" });
    } catch (error) {
      toast.error("Failed to save discount code");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this discount code?")) return;
    try {
      await base44.entities.DiscountCode.delete(id);
      onCodesChange(codes.filter(c => c.id !== id));
      toast.success("Code deleted");
    } catch (error) {
      toast.error("Failed to delete code");
    }
  };

  const openEdit = (code) => {
    setEditingCode(code);
    setForm({
      code: code.code,
      discount_type: code.discount_type,
      discount_value: String(code.discount_value),
      max_discount_amount: code.max_discount_amount ? String(code.max_discount_amount) : "",
      min_purchase_amount: code.min_purchase_amount ? String(code.min_purchase_amount) : "",
      usage_limit: code.usage_limit ? String(code.usage_limit) : "",
      description: code.description || "",
      valid_from: code.valid_from?.split('T')[0] || new Date().toISOString().split('T')[0],
      valid_until: code.valid_until?.split('T')[0] || ""
    });
    setDialog(true);
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Discount Codes</h2>
        <Button onClick={() => { setEditingCode(null); setForm({ code: "", discount_type: "percentage", discount_value: "", max_discount_amount: "", min_purchase_amount: "", usage_limit: "", description: "", valid_from: new Date().toISOString().split('T')[0], valid_until: "" }); setDialog(true); }} className="bg-blue-600 hover:bg-blue-700 gap-1.5">
          <Plus className="w-4 h-4" /> Create Code
        </Button>
      </div>

      <Card className="border-slate-100">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-800">
                  <TableHead>Code</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Valid Period</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {codes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan="6" className="text-center py-8 text-slate-500">No discount codes yet</TableCell>
                  </TableRow>
                ) : (
                  codes.map(c => {
                    const isExpired = c.valid_until && new Date(c.valid_until) < new Date();
                    const isActive = !isExpired && new Date(c.valid_from) <= new Date();
                    const status = c.status === "inactive" ? "inactive" : isExpired ? "expired" : isActive ? "active" : "pending";
                    
                    return (
                      <TableRow key={c.id}>
                        <TableCell className="font-mono font-bold text-blue-600">{c.code}</TableCell>
                        <TableCell className="font-medium">{c.discount_type === "percentage" ? `${c.discount_value}%` : `K${c.discount_value.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}</TableCell>
                        <TableCell className="text-sm">{new Date(c.valid_from).toLocaleDateString()} {c.valid_until ? `- ${new Date(c.valid_until).toLocaleDateString()}` : "- No expiry"}</TableCell>
                        <TableCell className="text-sm">{c.usage_count || 0}{c.usage_limit ? ` / ${c.usage_limit}` : ""}</TableCell>
                        <TableCell><Badge className={status === "active" ? "bg-emerald-50 text-emerald-700" : status === "expired" ? "bg-red-50 text-red-700" : status === "inactive" ? "bg-slate-100 text-slate-600" : "bg-amber-50 text-amber-700"}>{status}</Badge></TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(c.code); toast.success("Code copied!"); }} className="h-8 gap-1"><Copy className="w-3 h-3" /> Copy</Button>
                            <Button size="sm" variant="ghost" onClick={() => openEdit(c)} className="h-8"><Pencil className="w-3 h-3" /></Button>
                            <Button size="sm" variant="ghost" className="h-8 text-red-500" onClick={() => handleDelete(c.id)}><Trash2 className="w-3 h-3" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-auto">
          <DialogHeader><DialogTitle>{editingCode ? "Edit Discount Code" : "Create Discount Code"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Code *</Label>
              <div className="flex gap-2 mt-1">
                <Input value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} placeholder="e.g., SAVE20" className="flex-1" />
                {!editingCode && <Button onClick={generateCode} variant="outline" className="gap-1"><Zap className="w-4 h-4" /> Generate</Button>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div><Label>Type *</Label><Select value={form.discount_type} onValueChange={v => setForm({...form, discount_type: v})}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="percentage">Percentage (%)</SelectItem><SelectItem value="fixed_amount">Fixed Amount (K)</SelectItem></SelectContent></Select></div>
              <div><Label>{form.discount_type === "percentage" ? "Discount (%)" : "Discount Amount (K)"} *</Label><Input type="number" value={form.discount_value} onChange={e => setForm({...form, discount_value: e.target.value})} className="mt-1" min="0" /></div>
            </div>

            {form.discount_type === "percentage" && (
              <div><Label>Max Discount Amount (K)</Label><Input type="number" value={form.max_discount_amount} onChange={e => setForm({...form, max_discount_amount: e.target.value})} className="mt-1" placeholder="Optional cap on discount" min="0" /></div>
            )}

            <div><Label>Minimum Purchase Amount (K)</Label><Input type="number" value={form.min_purchase_amount} onChange={e => setForm({...form, min_purchase_amount: e.target.value})} className="mt-1" placeholder="Optional minimum purchase required" min="0" /></div>

            <div><Label>Usage Limit</Label><Input type="number" value={form.usage_limit} onChange={e => setForm({...form, usage_limit: e.target.value})} className="mt-1" placeholder="Leave empty for unlimited" min="0" /></div>

            <div><Label>Description</Label><Input value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="mt-1" placeholder="e.g., Summer Sale - 20% off all parts" /></div>

            <div className="grid grid-cols-2 gap-3">
              <div><Label>Valid From *</Label><Input type="date" value={form.valid_from} onChange={e => setForm({...form, valid_from: e.target.value})} className="mt-1" /></div>
              <div><Label>Valid Until</Label><Input type="date" value={form.valid_until} onChange={e => setForm({...form, valid_until: e.target.value})} className="mt-1" placeholder="Leave empty for no expiry" /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">{editingCode ? "Update" : "Create"} Code</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}