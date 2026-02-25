import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Store, MapPin, Upload, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function RegisterShop() {
  const [user, setUser] = useState(null);
  const [regions, setRegions] = useState([]);
  const [existingShop, setExistingShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "", description: "", phone: "", address: "",
    region: "", slot_type: "basic", logo_url: "", cover_url: ""
  });

  useEffect(() => {
    (async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) { base44.auth.redirectToLogin(createPageUrl("RegisterShop")); return; }
      const u = await base44.auth.me();
      setUser(u);
      const [r, shops] = await Promise.all([
        base44.entities.Region.list(),
        base44.entities.Shop.filter({ owner_email: u.email }),
      ]);
      setRegions(r);
      if (shops.length > 0) setExistingShop(shops[0]);
      setLoading(false);
    })();
  }, []);

  const handleFileUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm({ ...form, [field]: file_url });
      toast.success("Photo uploaded");
    } catch (error) {
      toast.error("Failed to upload photo");
    }
    setUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.address || !form.region) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSubmitting(true);

    const regionObj = regions.find(r => r.id === form.region);

    // geocode address
    let lat = null, lng = null;
    const geoRes = await base44.integrations.Core.InvokeLLM({
      prompt: `Return approximate GPS coordinates for this address in Zambia: "${form.address}". Return only the coordinates.`,
      response_json_schema: {
        type: "object",
        properties: { latitude: { type: "number" }, longitude: { type: "number" } }
      }
    });
    if (geoRes?.latitude) { lat = geoRes.latitude; lng = geoRes.longitude; }

    const shop = await base44.entities.Shop.create({
      ...form,
      owner_email: user.email,
      owner_name: user.full_name,
      region_name: regionObj?.name || "",
      latitude: lat,
      longitude: lng,
      status: "pending",
    });

    await base44.auth.updateMe({ role: "shop_owner", shop_id: shop.id });
    toast.success("Shop registration submitted! Awaiting admin approval.");
    navigate(createPageUrl("ShopDashboard"));
  };

  if (loading) return <div className="max-w-2xl mx-auto px-4 py-12"><div className="h-96 bg-slate-100 rounded-2xl animate-pulse" /></div>;

  if (existingShop) {
    const statusConfig = {
      pending: { icon: Clock, color: "text-amber-600", bg: "bg-amber-50", label: "Pending Approval" },
      approved: { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", label: "Approved" },
      rejected: { icon: Clock, color: "text-red-600", bg: "bg-red-50", label: "Rejected" },
      suspended: { icon: Clock, color: "text-red-600", bg: "bg-red-50", label: "Suspended" },
    };
    const st = statusConfig[existingShop.status] || statusConfig.pending;
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className={`w-16 h-16 mx-auto rounded-2xl ${st.bg} flex items-center justify-center mb-4`}>
          <st.icon className={`w-8 h-8 ${st.color}`} />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Shop: {existingShop.name}</h2>
        <p className="text-slate-500 mt-2">Status: <span className={`font-semibold ${st.color}`}>{st.label}</span></p>
        {existingShop.status === "approved" && (
          <Button onClick={() => navigate(createPageUrl("ShopDashboard"))} className="mt-6 bg-blue-600 hover:bg-blue-700">
            Go to Dashboard
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <div className="text-center mb-8">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
          <Store className="w-7 h-7 text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Register Your Shop</h1>
        <p className="text-slate-500 mt-1">Join AutoPartsZM and reach customers across Zambia</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 p-6 space-y-5">
        <div>
          <Label>Shop Name *</Label>
          <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Your shop name" className="mt-1 rounded-xl" />
        </div>
        <div>
          <Label>Description</Label>
          <Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Tell customers about your shop" className="mt-1 rounded-xl" rows={3} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Phone</Label>
            <Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+260..." className="mt-1 rounded-xl" />
          </div>
          <div>
            <Label>Region *</Label>
            <Select value={form.region} onValueChange={v => setForm({...form, region: v})}>
              <SelectTrigger className="mt-1 rounded-xl"><SelectValue placeholder="Select region" /></SelectTrigger>
              <SelectContent>
                {regions.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label>Address *</Label>
          <Input value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="Full physical address" className="mt-1 rounded-xl" />
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> We'll use this to show your location on the map</p>
        </div>
        <div>
          <Label>Slot Plan</Label>
          <Select value={form.slot_type} onValueChange={v => setForm({...form, slot_type: v})}>
            <SelectTrigger className="mt-1 rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="basic">Basic – Free</SelectItem>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Shop Logo</Label>
            <Input type="file" accept="image/*" onChange={e => handleFileUpload(e, "logo_url")} disabled={uploading} className="mt-1 rounded-xl cursor-pointer" />
            {form.logo_url && <img src={form.logo_url} alt="Logo" className="mt-2 w-20 h-20 object-cover rounded-lg border" />}
          </div>
          <div>
            <Label>Cover Image</Label>
            <Input type="file" accept="image/*" onChange={e => handleFileUpload(e, "cover_url")} disabled={uploading} className="mt-1 rounded-xl cursor-pointer" />
            {form.cover_url && <img src={form.cover_url} alt="Cover" className="mt-2 w-full h-20 object-cover rounded-lg border" />}
          </div>
        </div>
        <Button type="submit" disabled={submitting || uploading} className="w-full h-12 bg-blue-600 hover:bg-blue-700 rounded-xl">
          {submitting ? "Submitting..." : "Submit Registration"}
        </Button>
      </form>
    </div>
  );
}