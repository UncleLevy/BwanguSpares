import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import AddressInput from "@/components/shared/AddressInput";
import { CheckCircle2 } from "lucide-react";

export default function ProfileCompletion() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    region: "",
    town: "",
    address: "",
    use_default_address: true
  });

  useEffect(() => {
    (async () => {
      const u = await base44.auth.me();
      if (!u) {
        navigate(createPageUrl("Home"));
        return;
      }
      setUser(u);
      
      // If profile is already completed, redirect
      if (u.profile_completed) {
        navigate(createPageUrl("Home"));
        return;
      }

      // Pre-fill form if user has partial data
      setForm({
        first_name: u.first_name || "",
        last_name: u.last_name || "",
        phone: u.phone || "",
        region: u.region || "",
        town: u.town || "",
        address: u.address || "",
        use_default_address: u.use_default_address !== false
      });
      setLoading(false);
    })();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!form.first_name.trim()) newErrors.first_name = "First name is required";
    if (!form.last_name.trim()) newErrors.last_name = "Last name is required";
    if (!form.region) newErrors.region = "Region is required";
    if (!form.town) newErrors.town = "Town is required";
    if (!form.address.trim()) newErrors.address = "Address is required";
    if (form.phone && !/^\+?\d{7,15}$/.test(form.phone.replace(/\s/g, ""))) {
      newErrors.phone = "Enter a valid phone number";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      await base44.auth.updateMe({
        first_name: form.first_name,
        last_name: form.last_name,
        phone: form.phone,
        region: form.region,
        town: form.town,
        address: form.address,
        use_default_address: form.use_default_address,
        profile_completed: true
      });

      toast.success("Profile completed successfully!");
      navigate(createPageUrl("Home"));
    } catch (error) {
      toast.error("Failed to save profile. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg border-slate-200 dark:border-slate-700">
        <CardHeader className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            We need some information to get you started
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Personal Information */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                Personal Information
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input
                    id="first_name"
                    value={form.first_name}
                    onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                    placeholder="John"
                    className={`mt-1.5 ${errors.first_name ? "border-red-400" : ""}`}
                  />
                  {errors.first_name && (
                    <p className="text-xs text-red-500 mt-1">{errors.first_name}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input
                    id="last_name"
                    value={form.last_name}
                    onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                    placeholder="Doe"
                    className={`mt-1.5 ${errors.last_name ? "border-red-400" : ""}`}
                  />
                  {errors.last_name && (
                    <p className="text-xs text-red-500 mt-1">{errors.last_name}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+260 7XX XXX XXX"
                  className={`mt-1.5 ${errors.phone ? "border-red-400" : ""}`}
                />
                {errors.phone && (
                  <p className="text-xs text-red-500 mt-1">{errors.phone}</p>
                )}
              </div>
            </div>

            {/* Address Information */}
            <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                Delivery Address
              </h3>
              
              <AddressInput
                value={{ region: form.region, town: form.town, address: form.address }}
                onChange={(newAddr) =>
                  setForm({
                    ...form,
                    region: newAddr.region,
                    town: newAddr.town,
                    address: newAddr.address
                  })
                }
                errors={errors}
              />

              {/* Use Default Address Checkbox */}
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="use_default"
                  checked={form.use_default_address}
                  onChange={(e) =>
                    setForm({ ...form, use_default_address: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-slate-300"
                />
                <Label htmlFor="use_default" className="text-sm font-normal cursor-pointer">
                  Use this address by default during checkout
                </Label>
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 h-10 mt-6"
            >
              {submitting ? "Completing..." : "Complete Profile"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}