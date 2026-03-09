import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { FileSearch } from "lucide-react";
import { emailPartsRequestReceived, emailNewPartsRequestToShops } from "@/components/lib/emailNotifications";

const CATEGORIES = [
  { value: "engine", label: "Engine" }, { value: "brakes", label: "Brakes" },
  { value: "suspension", label: "Suspension" }, { value: "electrical", label: "Electrical" },
  { value: "body", label: "Body" }, { value: "transmission", label: "Transmission" },
  { value: "exhaust", label: "Exhaust" }, { value: "cooling", label: "Cooling" },
  { value: "steering", label: "Steering" }, { value: "interior", label: "Interior" },
  { value: "accessories", label: "Accessories" }, { value: "tyres", label: "Tyres" },
  { value: "filters", label: "Filters" }, { value: "oils_fluids", label: "Oils & Fluids" },
  { value: "other", label: "Other" },
];

export default function PartsRequestForm({ open, onClose, onSuccess, prefill = {} }) {
  const [form, setForm] = useState({
    part_name: "", description: "", category: "other",
    compatible_vehicles: "", budget: "", phone: "", buyer_region: ""
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      (async () => {
        const authed = await base44.auth.isAuthenticated();
        if (authed) {
          const u = await base44.auth.me();
          setForm(f => ({ ...f, phone: u.phone || f.phone, ...prefill }));
        } else {
          setForm(f => ({ ...f, ...prefill }));
        }
      })();
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!form.part_name.trim()) { toast.error("Please enter the part name"); return; }
    if (!form.phone.trim()) { toast.error("Phone number is required"); return; }
    if (!/^\+?\d{7,15}$/.test(form.phone.replace(/\s/g, ""))) { toast.error("Enter a valid phone number (e.g. +260 7XX XXX XXX)"); return; }

    const isAuth = await base44.auth.isAuthenticated();
    if (!isAuth) {
      base44.auth.redirectToLogin();
      return;
    }

    setSubmitting(true);
    const user = await base44.auth.me();

    await base44.entities.PartsRequest.create({
      buyer_email: user.email,
      buyer_name: user.full_name,
      buyer_phone: form.phone,
      buyer_region: form.buyer_region,
      part_name: form.part_name,
      description: form.description,
      category: form.category,
      compatible_vehicles: form.compatible_vehicles,
      budget: form.budget ? parseFloat(form.budget) : undefined,
      status: "open",
    });
    emailPartsRequestReceived(user.email, user.full_name, form.part_name);
    toast.success("Request submitted! Shops will contact you shortly.");
    setForm({ part_name: "", description: "", category: "other", compatible_vehicles: "", budget: "", phone: "", buyer_region: "" });
    setSubmitting(false);
    onClose();
    if (onSuccess) onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSearch className="w-5 h-5 text-blue-600" />
            Request a Part
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-slate-500 -mt-1">
          Can't find your part? Submit a request and verified shops will get back to you on a first-come basis.
        </p>
        <div className="space-y-4 mt-1">
          <div>
            <Label>Part Name *</Label>
            <Input value={form.part_name} onChange={e => setForm({ ...form, part_name: e.target.value })}
              placeholder="e.g. Front Brake Pads" className="mt-1 rounded-xl" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Additional details, part number, condition preference..." className="mt-1 rounded-xl" rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Category</Label>
              <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                <SelectTrigger className="mt-1 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Budget (ZMW)</Label>
              <Input type="number" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })}
                placeholder="Optional" className="mt-1 rounded-xl" />
            </div>
          </div>
          <div>
            <Label>Compatible Vehicles</Label>
            <Input value={form.compatible_vehicles} onChange={e => setForm({ ...form, compatible_vehicles: e.target.value })}
              placeholder="e.g. Toyota Corolla 2018" className="mt-1 rounded-xl" />
          </div>
          <div>
            <Label>Your Phone Number *</Label>
            <Input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
              placeholder="+260 7XX XXX XXX" className="mt-1 rounded-xl" />
          </div>
          <div>
            <Label>Your Town / Region</Label>
            <Input value={form.buyer_region} onChange={e => setForm({ ...form, buyer_region: e.target.value })}
              placeholder="e.g. Lusaka, Kitwe, Ndola..." className="mt-1 rounded-xl" />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting} className="bg-blue-600 hover:bg-blue-700">
            {submitting ? "Submitting..." : "Submit Request"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}