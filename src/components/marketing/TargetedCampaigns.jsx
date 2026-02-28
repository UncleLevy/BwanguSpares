import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Send, Eye, Trash2 } from "lucide-react";

export default function TargetedCampaigns({ shopId, customers = [], segments = [] }) {
  const [campaigns, setCampaigns] = useState([]);
  const [dialog, setDialog] = useState(false);
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({
    name: "",
    subject: "",
    content: "",
    segment_id: ""
  });

  const getSegmentMembers = (segmentId) => {
    const segment = segments.find(s => s.id === segmentId);
    if (!segment) return [];

    let filtered = [...customers];
    if (segment.criteria.type === "spending") {
      filtered = filtered.filter(c => (c.total_spent || 0) >= segment.criteria.minAmount);
    } else if (segment.criteria.type === "recency") {
      const cutoffDate = new Date(Date.now() - segment.criteria.days * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(c => new Date(c.created_date) > cutoffDate);
    } else if (segment.criteria.type === "location") {
      if (segment.criteria.region) filtered = filtered.filter(c => c.region === segment.criteria.region);
      if (segment.criteria.town) filtered = filtered.filter(c => c.town === segment.criteria.town);
    }
    return filtered;
  };

  const previewMembers = useMemo(() => {
    return form.segment_id ? getSegmentMembers(form.segment_id) : [];
  }, [form.segment_id, customers, segments]);

  const handleSave = async () => {
    if (!form.name || !form.subject || !form.content || !form.segment_id) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (previewMembers.length === 0) {
      toast.error("Selected segment has no customers");
      return;
    }

    try {
      const newCampaign = {
        id: `campaign_${Date.now()}`,
        name: form.name,
        subject: form.subject,
        content: form.content,
        segment_id: form.segment_id,
        segment_name: segments.find(s => s.id === form.segment_id)?.name,
        recipient_count: previewMembers.length,
        status: "draft",
        created_date: new Date().toISOString()
      };

      setCampaigns([newCampaign, ...campaigns]);
      setDialog(false);
      setForm({ name: "", subject: "", content: "", segment_id: "" });
      toast.success("Campaign created");
    } catch (error) {
      toast.error("Failed to create campaign");
    }
  };

  const handleSend = async (campaign) => {
    if (!confirm(`Send to ${campaign.recipient_count} customers?`)) return;
    setSending(true);

    try {
      const members = getSegmentMembers(campaign.segment_id);
      const emails = members.map(c => c.email).filter(e => e);

      if (emails.length === 0) {
        toast.error("No valid emails in segment");
        setSending(false);
        return;
      }

      // Simulate sending (in real app, call backend function)
      await new Promise(resolve => setTimeout(resolve, 1000));

      setCampaigns(campaigns.map(c =>
        c.id === campaign.id ? { ...c, status: "sent", sent_at: new Date().toISOString() } : c
      ));
      toast.success(`Campaign sent to ${emails.length} customers`);
    } catch (error) {
      toast.error("Failed to send campaign");
    }
    setSending(false);
  };

  const handleDelete = (id) => {
    if (!confirm("Delete this campaign?")) return;
    setCampaigns(campaigns.filter(c => c.id !== id));
    toast.success("Campaign deleted");
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Targeted Campaigns</h2>
          <p className="text-sm text-slate-500 mt-1">Send personalized campaigns to specific customer segments</p>
        </div>
        <Button
          onClick={() => { setForm({ name: "", subject: "", content: "", segment_id: "" }); setDialog(true); }}
          className="bg-blue-600 hover:bg-blue-700 gap-1.5"
        >
          <Plus className="w-4 h-4" /> New Campaign
        </Button>
      </div>

      <Card className="border-slate-100">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-800">
                  <TableHead>Campaign</TableHead>
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
                      <TableCell className="text-sm">{c.segment_name}</TableCell>
                      <TableCell>{c.recipient_count}</TableCell>
                      <TableCell>
                        <Badge className={c.status === "sent" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}>
                          {c.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {new Date(c.created_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => { setSelectedCampaign(c); setDetailsDialog(true); }}
                            className="h-8 gap-1"
                          >
                            <Eye className="w-3 h-3" /> View
                          </Button>
                          {c.status === "draft" && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 text-emerald-600"
                                onClick={() => handleSend(c)}
                                disabled={sending}
                              >
                                <Send className="w-3 h-3" />
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 text-red-500"
                            onClick={() => handleDelete(c.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
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
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Create Targeted Campaign</DialogTitle></DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-auto pr-2">
            <div>
              <Label>Campaign Name *</Label>
              <Input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="mt-1"
                placeholder="e.g., Spring Sale for High-Value Customers"
              />
            </div>
            <div>
              <Label>Target Segment *</Label>
              <Select value={form.segment_id} onValueChange={v => setForm({ ...form, segment_id: v })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {segments.map(seg => (
                    <SelectItem key={seg.id} value={seg.id}>
                      {seg.name} ({getSegmentMembers(seg.id).length})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Email Subject *</Label>
              <Input
                value={form.subject}
                onChange={e => setForm({ ...form, subject: e.target.value })}
                className="mt-1"
                placeholder="e.g., Exclusive offer just for you"
              />
            </div>
            <div>
              <Label>Email Content *</Label>
              <Textarea
                value={form.content}
                onChange={e => setForm({ ...form, content: e.target.value })}
                rows={5}
                className="mt-1"
                placeholder="Write your campaign message..."
              />
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold">PREVIEW</p>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mt-1">
                Will reach: <span className="text-blue-600">{previewMembers.length}</span> customer{previewMembers.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">Create Campaign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailsDialog} onOpenChange={setDetailsDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{selectedCampaign?.name}</DialogTitle></DialogHeader>
          {selectedCampaign && (
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold">Segment</p>
                <p className="text-sm font-medium mt-1">{selectedCampaign.segment_name}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold">Subject</p>
                <p className="text-sm font-medium mt-1">{selectedCampaign.subject}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold">Content</p>
                <p className="text-sm text-slate-700 dark:text-slate-300 mt-1 whitespace-pre-wrap">{selectedCampaign.content}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold">Recipients</p>
                  <p className="text-lg font-bold mt-1">{selectedCampaign.recipient_count}</p>
                </div>
                    <p className="text-xs text-slate-500 uppercase font-semibold">Status</p>
                  <Badge className={selectedCampaign.status === "sent" ? "bg-emerald-50 text-emerald-700 mt-1" : "bg-amber-50 text-amber-700 mt-1"}>
                    {selectedCampaign.status}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}