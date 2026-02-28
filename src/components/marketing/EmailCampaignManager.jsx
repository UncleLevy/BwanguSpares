import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Send, Pencil, Trash2, Eye } from "lucide-react";

export default function EmailCampaignManager({ shopId, campaigns, customers = [], onCampaignsChange }) {
  const [dialog, setDialog] = useState(false);
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({
    name: "",
    subject: "",
    content: "",
    target_segment: "all_customers",
    location_filter: { region: "", town: "" },
    promo_code: ""
  });

  const getFilteredCustomers = () => {
    let filtered = [...customers];
    const segment = form.target_segment;

    if (segment === "high_spenders") {
      filtered = filtered.filter(c => (c.total_spent || 0) >= 500000);
    } else if (segment === "medium_spenders") {
      filtered = filtered.filter(c => (c.total_spent || 0) >= 100000 && (c.total_spent || 0) < 500000);
    } else if (segment === "low_spenders") {
      filtered = filtered.filter(c => (c.total_spent || 0) < 100000);
    } else if (segment === "recent_customers") {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(c => new Date(c.created_date) > thirtyDaysAgo);
    } else if (segment === "by_location") {
      if (form.location_filter.region) {
        filtered = filtered.filter(c => c.region === form.location_filter.region);
      }
      if (form.location_filter.town) {
        filtered = filtered.filter(c => c.town === form.location_filter.town);
      }
    }

    return filtered;
  };

  const previewCustomers = useMemo(() => getFilteredCustomers(), [form.target_segment, form.location_filter, customers]);

  const handleSave = async () => {
    if (!form.name || !form.subject || !form.content) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (previewCustomers.length === 0) {
      toast.error("No customers match this segment");
      return;
    }

    try {
      const data = {
        ...form,
        shop_id: shopId,
        recipient_count: previewCustomers.length,
        status: form.scheduled_for ? "scheduled" : "draft"
      };

      if (editingCampaign) {
        await base44.entities.Campaign.update(editingCampaign.id, data);
        onCampaignsChange(campaigns.map(c => c.id === editingCampaign.id ? { ...editingCampaign, ...data } : c));
        toast.success("Campaign updated");
      } else {
        const newCampaign = await base44.entities.Campaign.create(data);
        onCampaignsChange([newCampaign, ...campaigns]);
        toast.success("Campaign created");
      }
      setDialog(false);
      setEditingCampaign(null);
      setForm({ name: "", subject: "", content: "", target_segment: "all_customers", location_filter: { region: "", town: "" }, promo_code: "" });
    } catch (error) {
      toast.error("Failed to save campaign");
    }
  };

  const handleSend = async (campaign) => {
    if (!confirm(`Send campaign to ${campaign.recipient_count} customers?`)) return;
    setSending(true);
    try {
      // In production, you'd send actual emails via backend function
      await base44.entities.Campaign.update(campaign.id, {
        status: "sent",
        sent_at: new Date().toISOString()
      });
      onCampaignsChange(campaigns.map(c => c.id === campaign.id ? { ...c, status: "sent", sent_at: new Date().toISOString() } : c));
      toast.success("Campaign sent successfully");
    } catch (error) {
      toast.error("Failed to send campaign");
    }
    setSending(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this campaign?")) return;
    try {
      await base44.entities.Campaign.delete(id);
      onCampaignsChange(campaigns.filter(c => c.id !== id));
      toast.success("Campaign deleted");
    } catch (error) {
      toast.error("Failed to delete campaign");
    }
  };

  const openEdit = (campaign) => {
    setEditingCampaign(campaign);
    setForm({
      name: campaign.name,
      subject: campaign.subject,
      content: campaign.content,
      target_segment: campaign.target_segment,
      location_filter: campaign.location_filter || { region: "", town: "" },
      promo_code: campaign.promo_code || ""
    });
    setDialog(true);
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Email Campaigns</h2>
        <Button onClick={() => { setEditingCampaign(null); setForm({ name: "", subject: "", content: "", target_segment: "all_customers", location_filter: { region: "", town: "" }, promo_code: "" }); setDialog(true); }} className="bg-blue-600 hover:bg-blue-700 gap-1.5">
          <Plus className="w-4 h-4" /> Create Campaign
        </Button>
      </div>

      <Card className="border-slate-100">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-800">
                  <TableHead>Campaign Name</TableHead>
                  <TableHead>Target Segment</TableHead>
                  <TableHead>Recipients</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan="6" className="text-center py-8 text-slate-500">No campaigns yet</TableCell>
                  </TableRow>
                ) : (
                  campaigns.map(c => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="text-sm capitalize">{c.target_segment.replace(/_/g, " ")}</TableCell>
                      <TableCell>{c.recipient_count}</TableCell>
                      <TableCell><Badge className={c.status === "sent" ? "bg-emerald-50 text-emerald-700" : c.status === "scheduled" ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600"}>{c.status}</Badge></TableCell>
                      <TableCell className="text-sm text-slate-500">{new Date(c.created_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => { setSelectedCampaign(c); setDetailsDialog(true); }} className="h-8 gap-1"><Eye className="w-3 h-3" /> View</Button>
                          {c.status === "draft" && (
                            <>
                              <Button size="sm" variant="ghost" onClick={() => openEdit(c)} className="h-8"><Pencil className="w-3 h-3" /></Button>
                              <Button size="sm" variant="ghost" className="h-8 text-emerald-600" onClick={() => handleSend(c)} disabled={sending}><Send className="w-3 h-3" /></Button>
                            </>
                          )}
                          <Button size="sm" variant="ghost" className="h-8 text-red-500" onClick={() => handleDelete(c.id)}><Trash2 className="w-3 h-3" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader><DialogTitle>{editingCampaign ? "Edit Campaign" : "Create Campaign"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Campaign Name *</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="mt-1" placeholder="e.g., Summer Sale 2026" /></div>
            <div><Label>Email Subject *</Label><Input value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} className="mt-1" placeholder="e.g., Special Discount Inside!" /></div>
            <div><Label>Email Content *</Label><Textarea value={form.content} onChange={e => setForm({...form, content: e.target.value})} rows={5} className="mt-1" placeholder="Write your promotional message..." /></div>
            
            <div><Label>Target Segment *</Label><Select value={form.target_segment} onValueChange={v => setForm({...form, target_segment: v})}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>
              <SelectItem value="all_customers">All Customers</SelectItem>
              <SelectItem value="recent_customers">Recent Customers (Last 30 days)</SelectItem>
              <SelectItem value="high_spenders">High Spenders (K500,000+)</SelectItem>
              <SelectItem value="medium_spenders">Medium Spenders (K100,000-K500,000)</SelectItem>
              <SelectItem value="low_spenders">Low Spenders (&lt;K100,000)</SelectItem>
              <SelectItem value="by_location">By Location</SelectItem>
            </SelectContent></Select></div>

            {form.target_segment === "by_location" && (
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Region (optional)</Label><Input value={form.location_filter.region} onChange={e => setForm({...form, location_filter: {...form.location_filter, region: e.target.value}})} className="mt-1" placeholder="e.g., Lusaka" /></div>
                <div><Label>Town (optional)</Label><Input value={form.location_filter.town} onChange={e => setForm({...form, location_filter: {...form.location_filter, town: e.target.value}})} className="mt-1" placeholder="e.g., Chaisa" /></div>
              </div>
            )}

            <div><Label>Promo Code (optional)</Label><Input value={form.promo_code} onChange={e => setForm({...form, promo_code: e.target.value})} className="mt-1" placeholder="Add a discount code to include in the email" /></div>

            <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
              <p className="text-xs text-slate-500 font-semibold">PREVIEW</p>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mt-1">Recipients: <span className="text-blue-600">{previewCustomers.length}</span> customer{previewCustomers.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">{editingCampaign ? "Update" : "Create"} Campaign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailsDialog} onOpenChange={setDetailsDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{selectedCampaign?.name}</DialogTitle></DialogHeader>
          {selectedCampaign && (
            <div className="space-y-4">
              <div><p className="text-xs text-slate-500 uppercase font-semibold">Subject</p><p className="text-sm font-medium mt-1">{selectedCampaign.subject}</p></div>
              <div><p className="text-xs text-slate-500 uppercase font-semibold">Content</p><p className="text-sm text-slate-700 dark:text-slate-300 mt-1 whitespace-pre-wrap">{selectedCampaign.content}</p></div>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-slate-500 uppercase font-semibold">Recipients</p><p className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">{selectedCampaign.recipient_count}</p></div>
                <div><p className="text-xs text-slate-500 uppercase font-semibold">Status</p><Badge className={selectedCampaign.status === "sent" ? "bg-emerald-50 text-emerald-700 mt-1" : "bg-slate-100 text-slate-600 mt-1"}>{selectedCampaign.status}</Badge></div>
              </div>
              {selectedCampaign.promo_code && (
                <div><p className="text-xs text-slate-500 uppercase font-semibold">Promo Code</p><p className="text-sm font-mono font-bold text-blue-600 mt-1">{selectedCampaign.promo_code}</p></div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}