import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { notifySuccess, notifyError } from "@/components/shared/NotificationToast";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import AppHeader from "@/components/shared/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, CheckCircle2, MapPin, Phone, Mail, Truck } from "lucide-react";
import MobileSelect from "@/components/shared/MobileSelect";

export default function BuyerSettings() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [regions, setRegions] = useState([]);
  const [towns, setTowns] = useState([]);
  const [filteredTowns, setFilteredTowns] = useState([]);
  
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    address: "",
    region: "",
    town: "",
    use_default_address: false,
    preferred_shipping_method: "collect",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      if (!currentUser) {
        navigate(createPageUrl("Home"));
        return;
      }

      setUser(currentUser);
      setFormData({
        full_name: currentUser.full_name || "",
        email: currentUser.email || "",
        phone: currentUser.phone || "",
        address: currentUser.address || "",
        region: currentUser.region || "",
        town: currentUser.town || "",
        use_default_address: currentUser.use_default_address !== false,
        preferred_shipping_method: currentUser.preferred_shipping_method || "collect",
      });

      // Load regions and towns
      const [r, t] = await Promise.all([
        base44.entities.Region.list(),
        base44.entities.Town.list(),
      ]);

      setRegions(r || []);
      setTowns(t || []);

      // Filter towns for selected region
      if (currentUser.region) {
        setFilteredTowns((t || []).filter(town => town.region_id === currentUser.region));
      }
    } catch (error) {
      notifyError("Load Error", "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleRegionChange = (regionId) => {
    setFormData(f => ({ ...f, region: regionId, town: "" }));
    setFilteredTowns(towns.filter(t => t.region_id === regionId));
  };

  const handleSave = async () => {
    if (!formData.phone.trim()) {
      notifyError("Phone Required", "Please enter your phone number");
      return;
    }

    if (formData.address && !formData.region) {
      notifyError("Region Required", "Please select a region for your address");
      return;
    }

    if (!/^\+?\d{7,15}$/.test(formData.phone.replace(/\s/g, ""))) {
      notifyError("Invalid Phone", "Enter a valid phone number (e.g. +260 7XX XXX XXX)");
      return;
    }

    setSaving(true);
    try {
      await base44.auth.updateMe({
        phone: formData.phone,
        address: formData.address,
        region: formData.region,
        town: formData.town,
        use_default_address: formData.use_default_address,
        preferred_shipping_method: formData.preferred_shipping_method,
      });

      notifySuccess("Settings Updated", "Your preferences have been saved");
      setUser(prev => ({ ...prev, ...formData }));
    } catch (error) {
      notifyError("Save Failed", "Could not update your settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <AppHeader title="Settings" backTo="BuyerDashboard" />
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <AppHeader title="Settings" backTo="BuyerDashboard" />
      
      <div className="max-w-2xl mx-auto px-4 py-6 safe-pb">
        <div className="space-y-6">
          {/* Contact Information */}
          <Card className="border-slate-200 dark:border-slate-700">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <CardTitle>Contact Information</CardTitle>
                  <CardDescription>Update your contact details</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Full Name</Label>
                <Input
                  value={formData.full_name}
                  disabled
                  className="mt-2 bg-slate-50 dark:bg-slate-700/50 cursor-not-allowed opacity-60"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Managed by your account</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email Address</Label>
                <Input
                  value={formData.email}
                  disabled
                  className="mt-2 bg-slate-50 dark:bg-slate-700/50 cursor-not-allowed opacity-60"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Cannot be changed</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Phone Number *</Label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+260 7XX XXX XXX"
                  className="mt-2 rounded-xl bg-white dark:bg-slate-700/50 border-slate-200 dark:border-slate-600"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Used for delivery coordination</p>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Address */}
          <Card className="border-slate-200 dark:border-slate-700">
            <CardHeader>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <CardTitle>Delivery Address</CardTitle>
                  <CardDescription>Set your default delivery location</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Region</Label>
                  <MobileSelect
                    value={formData.region}
                    onValueChange={handleRegionChange}
                    placeholder="Select region"
                    triggerClassName="mt-2 w-full"
                    options={regions.map(r => ({ value: r.id, label: r.name }))}
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">City / Town</Label>
                  <MobileSelect
                    value={formData.town}
                    onValueChange={val => setFormData({ ...formData, town: val })}
                    placeholder={!formData.region ? "Select region first" : "Select city"}
                    triggerClassName="mt-2 w-full"
                    options={filteredTowns.map(t => ({ value: t.name, label: t.name }))}
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Street Address</Label>
                <Input
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  placeholder="House number, street name"
                  className="mt-2 rounded-xl bg-white dark:bg-slate-700/50 border-slate-200 dark:border-slate-600"
                />
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-600">
                <Checkbox
                  checked={formData.use_default_address}
                  onCheckedChange={checked => setFormData({ ...formData, use_default_address: checked })}
                  id="default-address"
                />
                <label htmlFor="default-address" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                  Use this as my default delivery address
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Preferences */}
          <Card className="border-slate-200 dark:border-slate-700">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                <div>
                  <CardTitle>Shipping Preferences</CardTitle>
                  <CardDescription>Choose your preferred delivery method</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setFormData({ ...formData, preferred_shipping_method: "collect" })}
                  className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 text-sm font-medium transition-all ${
                    formData.preferred_shipping_method === "collect"
                      ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                      : "border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                  }`}
                >
                  📍 Collect
                </button>
                <button
                  onClick={() => setFormData({ ...formData, preferred_shipping_method: "deliver" })}
                  className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 text-sm font-medium transition-all ${
                    formData.preferred_shipping_method === "deliver"
                      ? "border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                      : "border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                  }`}
                >
                  🚚 Delivery
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex gap-3">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-blue-600 hover:bg-blue-700 rounded-xl h-11 gap-2"
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
            <Button
              onClick={() => navigate(createPageUrl("BuyerDashboard"))}
              variant="outline"
              className="flex-1 rounded-xl h-11"
            >
              Cancel
            </Button>
          </div>

          {/* Info Box */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-900 dark:text-blue-100">Pro Tip</p>
              <p className="text-blue-800 dark:text-blue-200 mt-1">Enable "Use as default" to speed up future checkouts. Your settings will be pre-filled on the Cart page.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}