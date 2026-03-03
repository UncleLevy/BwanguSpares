import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { User, Wrench, DollarSign } from "lucide-react";
import { toast } from "sonner";

export default function HireTechnicianDialog({ technician, shop, open, onClose }) {
  const [form, setForm] = useState({
    buyer_name: "",
    buyer_phone: "",
    description: "",
    preferred_date: "",
    location: "",
    buyer_budget: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.buyer_name.trim()) { toast.error("Please enter your name"); return; }
    if (!form.buyer_phone.trim()) { toast.error("Phone number is required"); return; }
    if (!/^\+?\d{7,15}$/.test(form.buyer_phone.replace(/\s/g, ""))) { toast.error("Enter a valid phone number (e.g. +260...)"); return; }
    if (!form.description.trim()) { toast.error("Please describe the problem"); return; }
    if (!form.preferred_date) { toast.error("Please select a preferred date"); return; }
    setLoading(true);
    const user = await base44.auth.me();
    await base44.entities.TechnicianHireRequest.create({
      technician_id: technician.id,
      technician_name: technician.name,
      shop_id: shop.id,
      shop_name: shop.name,
      shop_owner_email: shop.owner_email,
      buyer_email: user.email,
      buyer_name: form.buyer_name || user.full_name,
      buyer_phone: form.buyer_phone,
      problem_type: technician.specialization,
      description: form.description,
      preferred_date: form.preferred_date,
      location: form.location,
      buyer_budget: form.buyer_budget ? parseFloat(form.buyer_budget) : undefined,
      status: "pending",
    });

    // Notify shop owner
    await base44.entities.Notification.create({
      user_email: shop.owner_email,
      type: "system_alert",
      title: "New Technician Hire Request",
      message: `${form.buyer_name || user.full_name} has requested ${technician.name} for ${technician.specialization} work.`,
      action_url: "ShopDashboard?view=hire_requests",
    });

    toast.success("Hire request sent to the shop!");
    setLoading(false);
    onClose();
    setForm({ buyer_name: "", buyer_phone: "", description: "", preferred_date: "", location: "", buyer_budget: "" });
  };

  const specLabels = {
    engine: "Engine", electrical: "Electrical", body_work: "Body Work", transmission: "Transmission",
    brakes: "Brakes", general: "General", diagnostics: "Diagnostics", ac_heating: "AC/Heating", tyres: "Tyres"
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Request Technician</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl mb-2">
          <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden">
            {technician?.photo_url
              ? <img src={technician.photo_url} alt="" className="w-full h-full object-cover" />
              : <User className="w-5 h-5 text-slate-400" />}
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{technician?.name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="outline" className="text-[11px]"><Wrench className="w-3 h-3 mr-1" />{specLabels[technician?.specialization] || technician?.specialization}</Badge>
              {technician?.hourly_rate && <span className="text-xs text-blue-600 font-medium">K{technician.hourly_rate}/hr</span>}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <Label>Your Name *</Label>
            <Input value={form.buyer_name} onChange={e => setForm({ ...form, buyer_name: e.target.value })} className="mt-1" placeholder="Full name" />
          </div>
          <div>
            <Label>Phone Number *</Label>
            <Input type="tel" value={form.buyer_phone} onChange={e => setForm({ ...form, buyer_phone: e.target.value })} className="mt-1" placeholder="+260 7XX XXX XXX" />
          </div>
          <div>
            <Label>Describe the Problem *</Label>
            <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="mt-1" rows={3} placeholder="Describe what needs to be fixed..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Preferred Date *</Label>
              <Input type="date" min={new Date().toISOString().split("T")[0]} value={form.preferred_date} onChange={e => setForm({ ...form, preferred_date: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label>Your Location</Label>
              <Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="mt-1" placeholder="e.g. Lusaka" />
            </div>
          </div>
          <div>
            <Label>Your Budget (ZMW) — optional</Label>
            <Input type="number" min="0" value={form.buyer_budget} onChange={e => setForm({ ...form, buyer_budget: e.target.value })} className="mt-1" placeholder="e.g. 300" />
            <p className="text-xs text-slate-400 mt-1">The shop may counter-offer if the budget is too low.</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
            {loading ? "Sending..." : "Send Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}