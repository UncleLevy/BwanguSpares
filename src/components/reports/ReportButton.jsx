import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Flag, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const REASONS = [
  { value: "fraud", label: "Fraud / Scam" },
  { value: "fake_listing", label: "Fake or Misleading Listing" },
  { value: "harassment", label: "Harassment or Abuse" },
  { value: "spam", label: "Spam" },
  { value: "counterfeit_parts", label: "Counterfeit / Low-quality Parts" },
  { value: "non_delivery", label: "Non-delivery of Order" },
  { value: "poor_quality", label: "Poor Quality / Misrepresentation" },
  { value: "other", label: "Other" },
];

export default function ReportButton({
  reportedEmail,
  reportedName,
  reportedType,
  reportedId,
  variant = "ghost",
  size = "sm",
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    setUploading(true);
    try {
      for (const file of files) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        setAttachments(prev => [...prev, file_url]);
      }
      toast.success(`${files.length} file(s) uploaded`);
    } catch (error) {
      toast.error("Failed to upload file");
    }
    setUploading(false);
  };

  const removeAttachment = (url) => {
    setAttachments(prev => prev.filter(a => a !== url));
  };

  const handleSubmit = async () => {
    if (!reason) { toast.error("Please select a reason"); return; }
    setSubmitting(true);
    const authed = await base44.auth.isAuthenticated();
    if (!authed) {
      base44.auth.redirectToLogin();
      return;
    }
    const user = await base44.auth.me();
    await base44.entities.Report.create({
      reporter_email: user.email,
      reporter_name: user.full_name,
      reported_email: reportedEmail,
      reported_name: reportedName,
      reported_type: reportedType,
      reported_id: reportedId || "",
      reason,
      description: description.substring(0, 400),
      attachments,
      status: "pending",
    });
    toast.success("Report submitted. Our team will review it shortly.");
    setOpen(false);
    setReason("");
    setDescription("");
    setAttachments([]);
    setSubmitting(false);
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className="text-slate-400 hover:text-red-500 hover:bg-red-50 gap-1.5"
        onClick={() => setOpen(true)}
      >
        <Flag className="w-3.5 h-3.5" />
        Report
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Flag className="w-4 h-4" /> Report {reportedName}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-slate-500">
              Your report will be reviewed by our admin team. False reports may result in action against your account.
            </p>
            <div>
              <Label>Reason *</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a reason…" />
                </SelectTrigger>
                <SelectContent>
                  {REASONS.map(r => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
               <Label>Additional Details</Label>
               <Textarea
                 className="mt-1"
                 rows={4}
                 placeholder="Describe the issue in detail…"
                 value={description}
                 onChange={e => setDescription(e.target.value.substring(0, 400))}
                 maxLength={400}
               />
               <p className="text-xs text-slate-400 mt-1">{description.length}/400 characters</p>
             </div>
             <div>
               <Label>Photos & Documents</Label>
               <div className="mt-1 border-2 border-dashed border-slate-200 rounded-lg p-4 text-center">
                 <input
                   type="file"
                   multiple
                   accept="image/*,.pdf,.doc,.docx"
                   onChange={handleFileUpload}
                   disabled={uploading}
                   className="hidden"
                   id="file-upload"
                 />
                 <label htmlFor="file-upload" className="cursor-pointer">
                   <div className="flex justify-center mb-2">
                     <Upload className="w-5 h-5 text-slate-400" />
                   </div>
                   <p className="text-sm font-medium text-slate-700">
                     {uploading ? "Uploading…" : "Click to upload or drag files"}
                   </p>
                   <p className="text-xs text-slate-500 mt-1">Images, PDFs, DOC files</p>
                 </label>
               </div>
               {attachments.length > 0 && (
                 <div className="mt-3 space-y-2">
                   {attachments.map(url => (
                     <div key={url} className="flex items-center justify-between bg-slate-50 p-2 rounded text-sm">
                       <span className="text-slate-600 truncate">{url.split('/').pop()}</span>
                       <button
                         onClick={() => removeAttachment(url)}
                         className="text-red-500 hover:text-red-700"
                       >
                         <X className="w-4 h-4" />
                       </button>
                     </div>
                   ))}
                 </div>
               )}
             </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {submitting ? "Submitting…" : "Submit Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}