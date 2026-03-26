import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import MobileSelect from "@/components/shared/MobileSelect";
import { toast } from "sonner";
import { Eye, Flag } from "lucide-react";
import { logAudit } from "@/components/shared/auditLog";
import { useOptimisticList } from "@/components/shared/useOptimistic";

const STATUS_COLORS = {
  pending: "bg-amber-50 text-amber-700",
  reviewed: "bg-blue-50 text-blue-700",
  resolved: "bg-emerald-50 text-emerald-700",
  dismissed: "bg-slate-100 text-slate-500",
};

const REASON_LABELS = {
  fraud: "Fraud / Scam",
  fake_listing: "Fake Listing",
  harassment: "Harassment",
  spam: "Spam",
  counterfeit_parts: "Counterfeit Parts",
  non_delivery: "Non-delivery",
  poor_quality: "Poor Quality",
  other: "Other",
};

export default function ReportsPanel({ adminUser }) {
  const [reports, setReports, updateReport] = useOptimisticList([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [adminNote, setAdminNote] = useState("");
  const [newStatus, setNewStatus] = useState("");

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    const r = await base44.entities.Report.list("-created_date", 100);
    setReports(r);
    setLoading(false);
  };

  const openReport = (report) => {
    setSelected(report);
    setAdminNote(report.admin_note || "");
    setNewStatus(report.status);
  };

  const saveReport = async () => {
    const target = selected;
    const patch = { status: newStatus, admin_note: adminNote };
    setSelected(null);
    await updateReport(
      target.id,
      patch,
      async () => {
        await base44.entities.Report.update(target.id, patch);
        const actionMap = { resolved: "resolve_report", dismissed: "dismiss_report" };
        if (actionMap[newStatus]) {
          await logAudit(adminUser, actionMap[newStatus], {
            entity_type: "Report",
            entity_id: target.id,
            entity_label: `Report on ${target.reported_name || target.reported_email}`,
            details: adminNote || `Status changed to ${newStatus}`,
          });
        }
      },
      () => toast.error("Failed to update report")
    );
    toast.success("Report updated");
  };

  if (loading) return <div className="animate-pulse h-40 bg-slate-100 rounded-xl" />;

  const pending = reports.filter(r => r.status === "pending").length;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
        {pending > 0 && (
          <Badge className="bg-red-100 text-red-700">{pending} pending</Badge>
        )}
      </div>
      {reports.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <Flag className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No reports yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>Reporter</TableHead>
                <TableHead>Reported</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="text-sm">{r.reporter_name || r.reporter_email}</TableCell>
                  <TableCell className="text-sm font-medium">{r.reported_name || r.reported_email}</TableCell>
                  <TableCell><Badge variant="outline" className="text-[11px] capitalize">{r.reported_type}</Badge></TableCell>
                  <TableCell className="text-sm">{REASON_LABELS[r.reason] || r.reason}</TableCell>
                  <TableCell><Badge className={STATUS_COLORS[r.status]}>{r.status}</Badge></TableCell>
                  <TableCell className="text-xs text-slate-400">{new Date(r.created_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost" className="h-8" onClick={() => openReport(r)}>
                      <Eye className="w-4 h-4 mr-1" /> Review
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Report</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 py-2">
              <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
                <p><span className="text-slate-500">Reporter:</span> <span className="font-medium">{selected.reporter_name} ({selected.reporter_email})</span></p>
                <p><span className="text-slate-500">Reported:</span> <span className="font-medium">{selected.reported_name} ({selected.reported_email})</span></p>
                <p><span className="text-slate-500">Type:</span> <span className="capitalize">{selected.reported_type}</span></p>
                <p><span className="text-slate-500">Reason:</span> {REASON_LABELS[selected.reason] || selected.reason}</p>
                {selected.description && (
                  <p><span className="text-slate-500">Details:</span> {selected.description}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Update Status</label>
                <MobileSelect 
                  value={newStatus} 
                  onValueChange={setNewStatus}
                  placeholder="Select status"
                  options={[
                    {value:"pending",label:"Pending"},
                    {value:"reviewed",label:"Reviewed"},
                    {value:"resolved",label:"Resolved"},
                    {value:"dismissed",label:"Dismissed"}
                  ]}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Admin Note</label>
                <Textarea
                  rows={3}
                  placeholder="Record action taken or notes…"
                  value={adminNote}
                  onChange={e => setAdminNote(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
            <Button onClick={saveReport} className="bg-blue-600 hover:bg-blue-700">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}