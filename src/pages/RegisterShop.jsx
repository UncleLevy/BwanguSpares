import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Store, MapPin, Upload, CheckCircle2, Clock, ShieldOff, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import MobileSelect from "@/components/shared/MobileSelect";
import { toast } from "sonner";
import TermsAndConditionsModal from "@/components/shop/TermsAndConditionsModal";
import AddressInput from "@/components/shared/AddressInput";
import { emailShopRegistrationReceived } from "@/components/lib/emailNotifications";

export default function RegisterShop() {
  const [user, setUser] = useState(null);
  const [regions, setRegions] = useState([]);
  const [existingShop, setExistingShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [banRecord, setBanRecord] = useState(null);
  const [step, setStep] = useState(1);
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "", description: "", phone: "", address: "", town: "",
    region: "", slot_type: "basic", logo_url: "", cover_url: "",
    business_registration_number: "", tax_identification_number: "", pacra_certificate_url: "", terms_accepted: false
  });

  useEffect(() => {
    (async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) { base44.auth.redirectToLogin(createPageUrl("RegisterShop")); return; }
      const u = await base44.auth.me();
      setUser(u);
      const [r, shops, bannedCheck] = await Promise.all([
        base44.entities.Region.list(),
        base44.entities.Shop.filter({ owner_email: u.email }),
        base44.entities.BannedUser.filter({ email: u.email }),
      ]);
      setRegions(r);
      if (bannedCheck.length > 0) {
        const ban = bannedCheck[0];
        const isExpired = ban.ban_expires && new Date(ban.ban_expires) < new Date();
        if (!isExpired) {
          setBanRecord(ban);
          setLoading(false);
          return;
        }
      }
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

  const validateStep = (currentStep) => {
    if (currentStep === 1) {
      if (!form.name.trim()) { toast.error("Shop name is required"); return false; }
      if (!form.phone) { toast.error("Phone number is required"); return false; }
      if (!/^\+?\d{7,15}$/.test(form.phone.replace(/\s/g, ""))) {
        toast.error("Enter a valid phone number"); return false;
      }
      return true;
    }
    if (currentStep === 2) {
       if (!form.region) { toast.error("Please select a region"); return false; }
       if (!form.town) { toast.error("Please select a town"); return false; }
       if (!form.address.trim()) { toast.error("Address is required"); return false; }
       return true;
    }
    if (currentStep === 3) {
      if (!form.logo_url) { toast.error("Shop logo is required"); return false; }
      return true;
    }
    if (currentStep === 4) {
      if (!form.business_registration_number.trim()) { toast.error("Business registration number is required"); return false; }
      if (!/^\d{12}$/.test(form.business_registration_number)) { toast.error("Business registration number must be exactly 12 digits"); return false; }
      if (!form.tax_identification_number.trim()) { toast.error("Tax identification number is required"); return false; }
      if (!/^\d{10}$/.test(form.tax_identification_number)) { toast.error("Tax identification number must be exactly 10 digits"); return false; }
      if (!form.pacra_certificate_url) { toast.error("PACRA certificate is required"); return false; }
      if (!form.terms_accepted) { toast.error("You must accept the terms and conditions"); return false; }
      return true;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) setStep(step + 1);
  };

  const handlePrevious = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(4)) return;
    setSubmitting(true);

    const regionObj = regions.find(r => r.id === form.region);
    let lat = null, lng = null;
    
    const geoRes = await base44.integrations.Core.InvokeLLM({
      prompt: `Return approximate GPS coordinates for this address in Zambia: "${form.address}". Return only the coordinates.`,
      response_json_schema: {
        type: "object",
        properties: { latitude: { type: "number" }, longitude: { type: "number" } }
      }
    });
    if (geoRes?.latitude) { lat = geoRes.latitude; lng = geoRes.longitude; }

    try {
      const shop = await base44.entities.Shop.create({
        name: form.name,
        description: form.description,
        phone: form.phone,
        address: form.address,
        town: form.town,
        region: form.region,
        slot_type: form.slot_type,
        logo_url: form.logo_url,
        cover_url: form.cover_url,
        business_registration_number: form.business_registration_number,
        tax_identification_number: form.tax_identification_number,
        pacra_certificate_url: form.pacra_certificate_url,
        owner_email: user.email,
        owner_name: user.full_name,
        region_name: regionObj?.name || "",
        latitude: lat,
        longitude: lng,
        status: "pending",
      });

      await base44.auth.updateMe({ role: "shop_owner", shop_id: shop.id });
      emailShopRegistrationReceived(user.email, user.full_name, form.name);
      toast.success("✓ Shop registered successfully! Awaiting admin approval.");
      navigate(createPageUrl("ShopDashboard"));
    } catch (error) {
      toast.error("✗ Failed to register shop. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="max-w-2xl mx-auto px-4 py-12"><div className="h-96 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" /></div>;

  if (banRecord) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-4">
          <ShieldOff className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Account {banRecord.ban_type === "banned" ? "Banned" : "Suspended"}</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Your account has been {banRecord.ban_type} from this platform.</p>
        <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Reason: {banRecord.reason}</p>
        {banRecord.ban_expires && (
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Expires: {new Date(banRecord.ban_expires).toLocaleDateString()}</p>
        )}
      </div>
    );
  }

  if (existingShop) {
    const statusConfig = {
      pending: { icon: Clock, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/20", label: "Pending Approval" },
      approved: { icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20", label: "Approved" },
      rejected: { icon: Clock, color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-900/20", label: "Rejected" },
      suspended: { icon: Clock, color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-900/20", label: "Suspended" },
    };
    const st = statusConfig[existingShop.status] || statusConfig.pending;
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className={`w-16 h-16 mx-auto rounded-2xl ${st.bg} flex items-center justify-center mb-4`}>
          <st.icon className={`w-8 h-8 ${st.color}`} />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Shop: {existingShop.name}</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Status: <span className={`font-semibold ${st.color}`}>{st.label}</span></p>
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
        <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mb-4">
          <Store className="w-7 h-7 text-blue-600 dark:text-blue-400" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Register Your Shop</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Step {step} of 4: {["Basic Info", "Location", "Images", "Compliance"][step - 1]}</p>
      </div>

      {/* Progress bar */}
      <div className="flex gap-2 mb-8">
        {[1, 2, 3, 4].map(s => (
          <div key={s} className={`flex-1 h-1 rounded-full transition-colors ${s <= step ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-700"}`} />
        ))}
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 space-y-5">
        {/* Step 1: Basic Info */}
        {step === 1 && (
          <>
            <div>
              <Label className="dark:text-slate-300">Shop Name *</Label>
              <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Your shop name" className="mt-1 rounded-xl dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100 dark:placeholder-slate-500" />
            </div>
            <div>
              <Label className="dark:text-slate-300">Description</Label>
              <Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Tell customers about your shop" className="mt-1 rounded-xl dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100 dark:placeholder-slate-500" rows={3} />
            </div>
            <div>
              <Label className="dark:text-slate-300">Phone *</Label>
              <Input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+260 7XX XXX XXX" className="mt-1 rounded-xl dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100 dark:placeholder-slate-500" />
            </div>
          </>
        )}

        {/* Step 2: Location */}
         {step === 2 && (
           <>
             <AddressInput 
               value={{ region: form.region, town: form.town, address: form.address }}
               onChange={(newAddr) => setForm({...form, region: newAddr.region, town: newAddr.town, address: newAddr.address})}
             />
             <div>
               <Label className="dark:text-slate-300">Slot Plan</Label>
               <div className="mt-1">
                 <MobileSelect
                   value={form.slot_type}
                   onValueChange={v => setForm({...form, slot_type: v})}
                   placeholder="Select plan"
                   options={[
                     { value: "basic", label: "Basic – Free" },
                     { value: "standard", label: "Standard" },
                     { value: "premium", label: "Premium" },
                   ]}
                 />
               </div>
             </div>
           </>
         )}

        {/* Step 3: Images */}
        {step === 3 && (
          <>
            <div>
              <Label className="dark:text-slate-300">Shop Logo *</Label>
              <Input type="file" accept="image/*" onChange={e => handleFileUpload(e, "logo_url")} disabled={uploading} className="mt-1 rounded-xl cursor-pointer dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300 file:dark:text-slate-300" />
              {form.logo_url && <img src={form.logo_url} alt="Logo" className="mt-2 w-20 h-20 object-cover rounded-lg border dark:border-slate-600" />}
            </div>
            <div>
              <Label className="dark:text-slate-300">Cover Image</Label>
              <Input type="file" accept="image/*" onChange={e => handleFileUpload(e, "cover_url")} disabled={uploading} className="mt-1 rounded-xl cursor-pointer dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300 file:dark:text-slate-300" />
              {form.cover_url && <img src={form.cover_url} alt="Cover" className="mt-2 w-full h-20 object-cover rounded-lg border dark:border-slate-600" />}
            </div>
          </>
        )}

        {/* Step 4: Compliance */}
        {step === 4 && (
          <>
            <div>
              <Label className="dark:text-slate-300">Business Registration Number (12 digits) *</Label>
              <Input 
                value={form.business_registration_number} 
                onChange={e => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 12);
                  setForm({...form, business_registration_number: value});
                }} 
                placeholder="e.g., 123456789012" 
                className="mt-1 rounded-xl dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100 dark:placeholder-slate-500" 
                maxLength="12"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{form.business_registration_number.length}/12 digits</p>
            </div>
            <div>
              <Label className="dark:text-slate-300">Tax Identification Number - TPIN (10 digits) *</Label>
              <Input 
                value={form.tax_identification_number} 
                onChange={e => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                  setForm({...form, tax_identification_number: value});
                }} 
                placeholder="e.g., 1234567890" 
                className="mt-1 rounded-xl dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100 dark:placeholder-slate-500" 
                maxLength="10"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{form.tax_identification_number.length}/10 digits</p>
            </div>
            <div>
              <Label className="dark:text-slate-300">PACRA Certificate *</Label>
              <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => handleFileUpload(e, "pacra_certificate_url")} disabled={uploading} className="mt-1 rounded-xl cursor-pointer dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300 file:dark:text-slate-300" />
              {form.pacra_certificate_url && (
                <div className="mt-2 flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  Certificate uploaded
                </div>
              )}
            </div>
            <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <Checkbox
                id="terms"
                checked={form.terms_accepted}
                onCheckedChange={checked => setForm({...form, terms_accepted: checked})}
                className="mt-1"
              />
              <div className="flex-1">
                <label htmlFor="terms" className="text-sm font-medium text-slate-900 dark:text-slate-100 cursor-pointer">
                  I accept the terms and conditions *
                </label>
                <button
                  type="button"
                  onClick={() => setTermsModalOpen(true)}
                  className="block text-sm text-blue-600 dark:text-blue-400 hover:underline mt-1"
                >
                  Read full terms
                </button>
              </div>
            </div>
          </>
        )}

        {/* Navigation buttons */}
        <div className="flex gap-3 pt-6">
          {step > 1 && (
            <Button type="button" onClick={handlePrevious} variant="outline" className="flex-1 h-11 rounded-xl dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800">
              Previous
            </Button>
          )}
          {step < 4 ? (
            <Button type="button" onClick={handleNext} className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 rounded-xl flex items-center justify-center gap-2">
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button type="submit" disabled={submitting || uploading} className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 rounded-xl">
              {submitting ? "Submitting..." : "Submit Registration"}
            </Button>
          )}
        </div>
      </form>

      <TermsAndConditionsModal
        open={termsModalOpen}
        onOpenChange={setTermsModalOpen}
        onAccept={() => {
          setForm({...form, terms_accepted: true});
          setTermsModalOpen(false);
        }}
      />
    </div>
  );
}