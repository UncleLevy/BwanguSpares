import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Pencil, Trash2, Upload, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

const DEVICE_TYPES = [
  { id: "mobile", label: "Mobile", size: "375×667px" },
  { id: "tablet", label: "Tablet", size: "768×1024px" },
  { id: "web", label: "Web/Desktop", size: "1920×800px" },
];

export default function BannerManager() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [editBanner, setEditBanner] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewDialog, setPreviewDialog] = useState(false);
  const [previewBanner, setPreviewBanner] = useState(null);

  const [form, setForm] = useState({
    name: "",
    mobile_image_url: "",
    tablet_image_url: "",
    web_image_url: "",
    offer_description: "",
    action_url: "",
    is_active: true,
  });

  useEffect(() => {
    (async () => {
      const b = await base44.entities.Banner.list("-display_order", 100);
      setBanners(b);
      setLoading(false);
    })();
  }, []);

  const handleImageUpload = async (e, deviceType) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm(prev => ({
        ...prev,
        [`${deviceType}_image_url`]: file_url
      }));
      toast.success(`${deviceType.charAt(0).toUpperCase() + deviceType.slice(1)} image uploaded`);
    } catch (error) {
      toast.error("Upload failed");
    }
    setUploading(false);
  };

  const saveBanner = async () => {
    if (!form.name || !form.mobile_image_url || !form.tablet_image_url || !form.web_image_url) {
      toast.error("Please fill all required fields and upload all images");
      return;
    }
    setSaving(true);
    try {
      if (editBanner) {
        await base44.entities.Banner.update(editBanner.id, form);
        setBanners(prev => prev.map(b => b.id === editBanner.id ? { ...b, ...form } : b));
        toast.success("Banner updated");
      } else {
        const created = await base44.entities.Banner.create(form);
        setBanners(prev => [created, ...prev]);
        toast.success("Banner created");
      }
      setDialog(false);
      setEditBanner(null);
      setForm({ name: "", mobile_image_url: "", tablet_image_url: "", web_image_url: "", offer_description: "", action_url: "", is_active: true });
    } catch (error) {
      toast.error("Failed to save banner");
    }
    setSaving(false);
  };

  const deleteBanner = async (id) => {
    if (!confirm("Delete this banner?")) return;
    try {
      await base44.entities.Banner.delete(id);
      setBanners(prev => prev.filter(b => b.id !== id));
      toast.success("Banner deleted");
    } catch (error) {
      toast.error("Failed to delete banner");
    }
  };

  const openEdit = (banner) => {
    setEditBanner(banner);
    setForm({
      name: banner.name,
      mobile_image_url: banner.mobile_image_url,
      tablet_image_url: banner.tablet_image_url,
      web_image_url: banner.web_image_url,
      offer_description: banner.offer_description || "",
      action_url: banner.action_url || "",
      is_active: banner.is_active !== false,
    });
    setDialog(true);
  };

  if (loading) return <div className="flex h-20 items-center justify-center"><div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Hero Banners</h2>
        <Button onClick={() => { setEditBanner(null); setForm({ name: "", mobile_image_url: "", tablet_image_url: "", web_image_url: "", offer_description: "", action_url: "", is_active: true }); setDialog(true); }} className="bg-blue-600 hover:bg-blue-700 gap-1.5">
          <Plus className="w-4 h-4" /> Add Banner
        </Button>
      </div>

      <Card className="border-slate-100 dark:border-slate-700 dark:bg-slate-900">
        <CardContent className="p-0">
          {banners.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">No banners yet</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-800">
                    <TableHead className="dark:text-slate-300">Name</TableHead>
                    <TableHead className="dark:text-slate-300">Mobile</TableHead>
                    <TableHead className="dark:text-slate-300">Tablet</TableHead>
                    <TableHead className="dark:text-slate-300">Web</TableHead>
                    <TableHead className="dark:text-slate-300">Status</TableHead>
                    <TableHead className="dark:text-slate-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {banners.map(banner => (
                    <TableRow key={banner.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <TableCell className="font-medium text-slate-900 dark:text-slate-100">{banner.name}</TableCell>
                      <TableCell>{banner.mobile_image_url ? <span className="text-xs text-emerald-600 dark:text-emerald-400">✓ Uploaded</span> : <span className="text-xs text-red-600 dark:text-red-400">✗ Missing</span>}</TableCell>
                      <TableCell>{banner.tablet_image_url ? <span className="text-xs text-emerald-600 dark:text-emerald-400">✓ Uploaded</span> : <span className="text-xs text-red-600 dark:text-red-400">✗ Missing</span>}</TableCell>
                      <TableCell>{banner.web_image_url ? <span className="text-xs text-emerald-600 dark:text-emerald-400">✓ Uploaded</span> : <span className="text-xs text-red-600 dark:text-red-400">✗ Missing</span>}</TableCell>
                      <TableCell><Badge className={banner.is_active !== false ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400"}>{banner.is_active !== false ? "Active" : "Inactive"}</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setPreviewBanner(banner); setPreviewDialog(true); }}><Eye className="w-3.5 h-3.5" /></Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(banner)}><Pencil className="w-3.5 h-3.5" /></Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => deleteBanner(banner.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editBanner ? "Edit Banner" : "Add Banner"}</DialogTitle></DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-auto pr-2">
            <div><Label>Banner Name *</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Summer Sale" className="mt-1" /></div>
            <div><Label>Offer Description</Label><Input value={form.offer_description} onChange={e => setForm({...form, offer_description: e.target.value})} placeholder="e.g. 30% off all parts" className="mt-1" /></div>
            <div><Label>Action URL (optional)</Label><Input value={form.action_url} onChange={e => setForm({...form, action_url: e.target.value})} placeholder="e.g. /BrowseProducts?category=engine" className="mt-1" /></div>

            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
              <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">Upload Images</h3>
              {DEVICE_TYPES.map(device => (
                <div key={device.id} className="mb-4">
                  <Label className="text-sm text-slate-600 dark:text-slate-400">{device.label} ({device.size}) *</Label>
                  <Input type="file" accept="image/*" onChange={e => handleImageUpload(e, device.id)} disabled={uploading} className="mt-1 cursor-pointer" />
                  {form[`${device.id}_image_url`] && (
                    <div className="mt-2 p-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs text-emerald-700 dark:text-emerald-400">
                      ✓ Image uploaded
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <input type="checkbox" id="is_active" checked={form.is_active} onChange={e => setForm({...form, is_active: e.target.checked})} className="w-4 h-4 rounded accent-blue-600" />
              <label htmlFor="is_active" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">Active</label>
            </div>
          </div>
          <DialogFooter><Button onClick={saveBanner} disabled={saving || uploading} className="bg-blue-600 hover:bg-blue-700 gap-2">{saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}{saving ? "Saving..." : (editBanner ? "Update" : "Create") + " Banner"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={previewDialog} onOpenChange={setPreviewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Banner Preview - {previewBanner?.name}</DialogTitle></DialogHeader>
          {previewBanner && (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Mobile (375×667)</p>
                <img src={previewBanner.mobile_image_url} alt="Mobile" className="w-full max-h-96 object-cover rounded-lg border border-slate-200 dark:border-slate-700" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Tablet (768×1024)</p>
                <img src={previewBanner.tablet_image_url} alt="Tablet" className="w-full max-h-96 object-cover rounded-lg border border-slate-200 dark:border-slate-700" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Web/Desktop (1920×800)</p>
                <img src={previewBanner.web_image_url} alt="Web" className="w-full max-h-96 object-cover rounded-lg border border-slate-200 dark:border-slate-700" />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}