import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";
import { ShieldOff, RotateCcw, Ban, Users } from "lucide-react";
import { logAudit } from "@/components/shared/auditLog";

export default function UsersPanel({ adminUser }) {
  const [bannedUsers, setBannedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [banDialog, setBanDialog] = useState(false);
  const [banForm, setBanForm] = useState({ email: "", phone: "", full_name: "", ban_type: "suspended", reason: "", ban_expires: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadBanned();
  }, []);

  const loadBanned = async () => {
    const b = await base44.entities.BannedUser.list("-created_date", 200);
    setBannedUsers(b);
    setLoading(false);
  };

  const handleBan = async () => {
    if (!banForm.email || !banForm.reason) {
      toast.error("Email and reason are required");
      return;
    }
    setSubmitting(true);
    // Check if already banned
    const existing = await base44.entities.BannedUser.filter({ email: banForm.email });
    if (existing.length > 0) {
      toast.error("This email is already on the banned list");
      setSubmitting(false);
      return;
    }
    await base44.entities.BannedUser.create({
      ...banForm,
      banned_by: adminUser?.email,
    });
    await logAudit(adminUser, banForm.ban_type === "banned" ? "ban_user" : "suspend_user", {
      entity_type: "User",
      entity_id: banForm.email,
      entity_label: banForm.full_name || banForm.email,
      details: banForm.reason,
    });

    // Send notification email to the banned user
    const isPermBan = banForm.ban_type === "banned";
    const expiryLine = !isPermBan && banForm.ban_expires
      ? `\n\nYour suspension will expire on ${new Date(banForm.ban_expires).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}.`
      : "";
    await base44.integrations.Core.SendEmail({
      to: banForm.email,
      subject: `Your BwanguSpares account has been ${isPermBan ? "banned" : "suspended"}`,
      body: `Dear ${banForm.full_name || "User"},\n\nFollowing an investigation into a report made against your account on BwanguSpares, your account has been ${isPermBan ? "permanently banned" : "temporarily suspended"}.\n\nReason:\n${banForm.reason}${expiryLine}\n\nIf you believe this action was taken in error, please contact our support team at admin@bwangu.com.\n\nRegards,\nThe BwanguSpares Team`,
    }).catch(() => {}); // fire-and-forget, don't block on email failure

    toast.success(`User ${isPermBan ? "banned" : "suspended"} successfully — notification email sent`);
    setBanDialog(false);
    setBanForm({ email: "", phone: "", full_name: "", ban_type: "suspended", reason: "", ban_expires: "" });
    setSubmitting(false);
    loadBanned();
  };

  const removeBan = async (id, email) => {
    await base44.entities.BannedUser.delete(id);
    setBannedUsers(bannedUsers.filter(b => b.id !== id));
    await logAudit(adminUser, "unban_user", {
      entity_type: "User",
      entity_id: email,
      entity_label: email,
      details: "Ban/suspension removed by admin",
    });
    toast.success(`${email} has been unblocked`);
  };

  const BAN_COLORS = {
    banned: "bg-red-100 text-red-700",
    suspended: "bg-amber-100 text-amber-700",
  };

  if (loading) return <div className="animate-pulse h-40 bg-slate-100 rounded-xl" />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900">Banned / Suspended Users</h1>
          <Badge className="bg-slate-100 text-slate-700">{bannedUsers.length} records</Badge>
        </div>
        <Button onClick={() => setBanDialog(true)} className="bg-red-600 hover:bg-red-700 text-white gap-2">
          <Ban className="w-4 h-4" /> Ban / Suspend User
        </Button>
      </div>

      {bannedUsers.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No banned or suspended users</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Banned By</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bannedUsers.map(b => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium text-sm">{b.full_name || "—"}</TableCell>
                  <TableCell className="text-sm">{b.email}</TableCell>
                  <TableCell className="text-sm text-slate-500">{b.phone || "—"}</TableCell>
                  <TableCell><Badge className={BAN_COLORS[b.ban_type]}>{b.ban_type}</Badge></TableCell>
                  <TableCell className="text-sm max-w-[180px] truncate">{b.reason}</TableCell>
                  <TableCell className="text-xs text-slate-400">{b.ban_expires ? new Date(b.ban_expires).toLocaleDateString() : "Permanent"}</TableCell>
                  <TableCell className="text-xs text-slate-400">{b.banned_by}</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 text-emerald-600 hover:bg-emerald-50"
                      onClick={() => removeBan(b.id, b.email)}
                    >
                      <RotateCcw className="w-3.5 h-3.5 mr-1" /> Unblock
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Ban Dialog */}
      <Dialog open={banDialog} onOpenChange={setBanDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <ShieldOff className="w-5 h-5" /> Ban or Suspend User
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-slate-500 bg-amber-50 border border-amber-200 rounded-lg p-3">
              Once banned, the user's email and phone will be blocked from registering a new account.
            </p>
            <div>
              <Label>Email Address *</Label>
              <Input className="mt-1" placeholder="user@example.com" value={banForm.email} onChange={e => setBanForm({...banForm, email: e.target.value})} />
            </div>
            <div>
              <Label>Phone Number</Label>
              <Input className="mt-1" placeholder="+260..." value={banForm.phone} onChange={e => setBanForm({...banForm, phone: e.target.value})} />
            </div>
            <div>
              <Label>Full Name</Label>
              <Input className="mt-1" placeholder="Full name (optional)" value={banForm.full_name} onChange={e => setBanForm({...banForm, full_name: e.target.value})} />
            </div>
            <div>
              <Label>Restriction Type *</Label>
              <Select value={banForm.ban_type} onValueChange={v => setBanForm({...banForm, ban_type: v})}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="suspended">Suspended (temporary)</SelectItem>
                  <SelectItem value="banned">Banned (permanent)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {banForm.ban_type === "suspended" && (
              <div>
                <Label>Suspension Expires</Label>
                <Input type="date" className="mt-1" value={banForm.ban_expires} onChange={e => setBanForm({...banForm, ban_expires: e.target.value})} />
              </div>
            )}
            <div>
              <Label>Reason *</Label>
              <Textarea
                className="mt-1"
                rows={3}
                placeholder="Reason for ban/suspension…"
                value={banForm.reason}
                onChange={e => setBanForm({...banForm, reason: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBanDialog(false)}>Cancel</Button>
            <Button onClick={handleBan} disabled={submitting} className="bg-red-600 hover:bg-red-700 text-white">
              {submitting ? "Processing…" : "Confirm Ban"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}