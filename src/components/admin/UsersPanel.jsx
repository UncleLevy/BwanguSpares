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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import MobileSelect from "@/components/shared/MobileSelect";
import { toast } from "sonner";
import {
  ShieldOff, RotateCcw, Ban, Users, Search, UserPlus,
  ShieldCheck, User, Store, Shield, Mail
} from "lucide-react";
import SortableTableHead, { toggleSort, sortData } from "@/components/shared/SortableTableHead";
import { logAudit } from "@/components/shared/auditLog";
import { usePagination } from "@/components/shared/usePagination";
import TablePagination from "@/components/shared/TablePagination";
import { useOptimisticList } from "@/components/shared/useOptimistic";

const ROLE_COLORS = {
  admin: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
  shop_owner: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
  user: "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300",
};

const ROLE_ICONS = {
  admin: Shield,
  shop_owner: Store,
  user: User,
};

export default function UsersPanel({ adminUser }) {
  const [users, setUsers, updateUser] = useOptimisticList([]);
  const [bannedUsers, setBannedUsers, , removeBannedItem] = useOptimisticList([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");

  // Ban dialog
  const [banDialog, setBanDialog] = useState(false);
  const [banTarget, setBanTarget] = useState(null); // prefilled user
  const [banForm, setBanForm] = useState({ email: "", phone: "", full_name: "", ban_type: "suspended", reason: "", ban_expires: "" });
  const [submitting, setSubmitting] = useState(false);

  // Invite dialog
  const [inviteDialog, setInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("user");
  const [inviting, setInviting] = useState(false);

  const [sort, setSort] = useState(null);

  // Role change dialog
  const [roleDialog, setRoleDialog] = useState(null);
  const [newRole, setNewRole] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const u = await base44.entities.User.list("-created_date", 200);
    setUsers(u);
    const b = await base44.entities.BannedUser.list("-created_date", 200);
    setBannedUsers(b);
    setLoading(false);
  };


  const bannedEmails = new Set(bannedUsers.map(b => b.email));

  const filtered = users.filter(u => {
    const matchSearch = !search
      || u.full_name?.toLowerCase().includes(search.toLowerCase())
      || u.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === "all" || u.role === filterRole;
    return matchSearch && matchRole;
  });

  // ── Role change ──
  const openRoleChange = (u) => {
    setRoleDialog(u);
    setNewRole(u.role || "user");
  };

  const saveRole = async () => {
    const target = roleDialog;
    setRoleDialog(null);
    await updateUser(
      target.id,
      { role: newRole },
      () => base44.entities.User.update(target.id, { role: newRole }),
      () => toast.error("Failed to update role")
    );
    toast.success(`${target.full_name}'s role updated to ${newRole}`);
  };

  // ── Invite ──
  const handleInvite = async () => {
    if (!inviteEmail) { toast.error("Email is required"); return; }
    setInviting(true);
    await base44.users.inviteUser(inviteEmail, inviteRole);
    toast.success(`Invitation sent to ${inviteEmail}`);
    setInviteEmail("");
    setInviteRole("user");
    setInviting(false);
    setInviteDialog(false);
  };

  // ── Ban ──
  const openBanForUser = (u) => {
    setBanTarget(u);
    setBanForm({ email: u.email, phone: "", full_name: u.full_name || "", ban_type: "suspended", reason: "", ban_expires: "" });
    setBanDialog(true);
  };

  const openBanBlank = () => {
    setBanTarget(null);
    setBanForm({ email: "", phone: "", full_name: "", ban_type: "suspended", reason: "", ban_expires: "" });
    setBanDialog(true);
  };

  const handleBan = async () => {
    if (!banForm.email || !banForm.reason) { toast.error("Email and reason are required"); return; }
    setSubmitting(true);
    const existing = await base44.entities.BannedUser.filter({ email: banForm.email });
    if (existing.length > 0) { toast.error("This email is already on the banned list"); setSubmitting(false); return; }
    await base44.entities.BannedUser.create({ ...banForm, banned_by: adminUser?.email });
    await logAudit(adminUser, banForm.ban_type === "banned" ? "ban_user" : "suspend_user", {
      entity_type: "User", entity_id: banForm.email, entity_label: banForm.full_name || banForm.email, details: banForm.reason,
    });
    const isPermBan = banForm.ban_type === "banned";
    const expiryLine = !isPermBan && banForm.ban_expires
      ? `\n\nYour suspension will expire on ${new Date(banForm.ban_expires).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}.`
      : "";
    await base44.integrations.Core.SendEmail({
      from_name: 'Bwangu Spares',
      to: banForm.email,
      subject: `Your Bwangu Spares account has been ${isPermBan ? "banned" : "suspended"}`,
      body: `Dear ${banForm.full_name || "User"},\n\nYour account has been ${isPermBan ? "permanently banned" : "temporarily suspended"}.\n\nReason:\n${banForm.reason}${expiryLine}\n\nIf you believe this is an error, contact admin@bwangu.com.\n\nRegards,\nThe Bwangu Spares Team`,
    }).catch(() => {});
    toast.success(`User ${isPermBan ? "banned" : "suspended"} — notification email sent`);
    setBanDialog(false);
    setSubmitting(false);
    loadData();
  };

  // ── Unban ──
  const removeBan = async (id, email) => {
    await removeBannedItem(
      id,
      () => base44.entities.BannedUser.delete(id),
      () => toast.error("Failed to unblock user")
    );
    await logAudit(adminUser, "unban_user", { entity_type: "User", entity_id: email, entity_label: email, details: "Removed by admin" });
    toast.success(`${email} has been unblocked`);
  };

  if (loading) return <div className="animate-pulse h-40 bg-slate-100 rounded-xl" />;

  const sortedFiltered = sortData(filtered, sort);
  const pagination = usePagination(sortedFiltered, 15);
  const sortedBanned = sortData(bannedUsers, sort);
  const bannedPagination = usePagination(sortedBanned, 15);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">User Management</h1>
          <Badge className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">{users.length} accounts</Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={openBanBlank} className="gap-2 text-red-600 border-red-200 hover:bg-red-50">
            <Ban className="w-4 h-4" /> Ban User
          </Button>
          <Button onClick={() => setInviteDialog(true)} className="bg-blue-600 hover:bg-blue-700 gap-2">
            <UserPlus className="w-4 h-4" /> Invite User
          </Button>
        </div>
      </div>

      <Tabs defaultValue="accounts">
        <TabsList className="mb-4">
          <TabsTrigger value="accounts" className="gap-2"><Users className="w-4 h-4" /> All Accounts ({users.length})</TabsTrigger>
          <TabsTrigger value="banned" className="gap-2"><ShieldOff className="w-4 h-4" /> Banned / Suspended ({bannedUsers.length})</TabsTrigger>
        </TabsList>

        {/* ── Accounts Tab ── */}
        <TabsContent value="accounts">
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input className="pl-9" placeholder="Search by name or email…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <MobileSelect
              value={filterRole}
              onValueChange={setFilterRole}
              placeholder="All Roles"
              triggerClassName="w-40"
              options={[
                { value: "all", label: "All Roles" },
                { value: "admin", label: "Admin" },
                { value: "shop_owner", label: "Shop Owner" },
                { value: "user", label: "User" },
              ]}
            />
          </div>

          {/* Mobile cards (< 768px) */}
          <div className="md:hidden space-y-3">
            {pagination.paginatedItems.length === 0 ? (
              <p className="text-center py-12 text-slate-400">No users found</p>
            ) : pagination.paginatedItems.map(u => {
              const RoleIcon = ROLE_ICONS[u.role] || User;
              const isBanned = bannedEmails.has(u.email);
              const isSelf = u.email === adminUser?.email;
              return (
                <Card key={u.id} className={`border-slate-100 dark:border-slate-700 dark:bg-slate-900 ${isBanned ? "ring-1 ring-red-300 dark:ring-red-700" : ""}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm truncate">{u.full_name || "—"}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{u.email}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Joined {new Date(u.created_date).toLocaleDateString()}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <Badge className={`${ROLE_COLORS[u.role] || "bg-slate-100 text-slate-600"} flex items-center gap-1 text-[10px]`}>
                          <RoleIcon className="w-2.5 h-2.5" /> {u.role || "user"}
                        </Badge>
                        {isBanned
                          ? <Badge className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-[10px]">Banned</Badge>
                          : <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px]">Active</Badge>
                        }
                      </div>
                    </div>
                    {!isSelf && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" className="flex-1 h-8 text-xs text-blue-600 hover:bg-blue-50" onClick={() => openRoleChange(u)}>
                          <ShieldCheck className="w-3 h-3 mr-1" /> Role
                        </Button>
                        {!isBanned ? (
                          <Button size="sm" variant="ghost" className="flex-1 h-8 text-xs text-red-600 hover:bg-red-50" onClick={() => openBanForUser(u)}>
                            <Ban className="w-3 h-3 mr-1" /> Ban
                          </Button>
                        ) : (
                          <Button size="sm" variant="ghost" className="flex-1 h-8 text-xs text-emerald-600 hover:bg-emerald-50"
                            onClick={() => { const b = bannedUsers.find(b => b.email === u.email); if (b) removeBan(b.id, b.email); }}>
                            <RotateCcw className="w-3 h-3 mr-1" /> Unblock
                          </Button>
                        )}
                      </div>
                    )}
                    {isSelf && <p className="text-xs text-slate-400 text-center">Your account</p>}
                  </CardContent>
                </Card>
              );
            })}
            {filtered.length > 15 && (
              <TablePagination currentPage={pagination.currentPage} totalItems={pagination.totalItems} itemsPerPage={pagination.itemsPerPage} onPageChange={pagination.setCurrentPage} />
            )}
          </div>

          {/* Desktop table (≥ 768px) */}
          <div className="hidden md:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-800">
                  <SortableTableHead field="full_name" sort={sort} onSort={f => setSort(prev => toggleSort(prev, f))}>Name</SortableTableHead>
                  <SortableTableHead field="email" sort={sort} onSort={f => setSort(prev => toggleSort(prev, f))}>Email</SortableTableHead>
                  <SortableTableHead field="role" sort={sort} onSort={f => setSort(prev => toggleSort(prev, f))}>Role</SortableTableHead>
                  <SortableTableHead field="created_date" sort={sort} onSort={f => setSort(prev => toggleSort(prev, f))}>Joined</SortableTableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagination.paginatedItems.map(u => {
                  const RoleIcon = ROLE_ICONS[u.role] || User;
                  const isBanned = bannedEmails.has(u.email);
                  const isSelf = u.email === adminUser?.email;
                  return (
                    <TableRow key={u.id} className={isBanned ? "bg-red-50/40 dark:bg-red-900/10" : "hover:bg-slate-50 dark:hover:bg-slate-800/50"}>
                      <TableCell className="font-medium text-sm text-slate-900 dark:text-slate-100">{u.full_name || "—"}</TableCell>
                      <TableCell className="text-sm text-slate-500 dark:text-slate-400">{u.email}</TableCell>
                      <TableCell>
                        <Badge className={`${ROLE_COLORS[u.role] || "bg-slate-100 text-slate-600"} flex items-center gap-1 w-fit text-[11px]`}>
                          <RoleIcon className="w-3 h-3" /> {u.role || "user"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-400 dark:text-slate-500">{new Date(u.created_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {isBanned
                          ? <Badge className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-[11px]">Banned/Suspended</Badge>
                          : <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[11px]">Active</Badge>
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {!isSelf && (
                            <>
                              <Button size="sm" variant="ghost" className="h-8 text-blue-600 hover:bg-blue-50" onClick={() => openRoleChange(u)}>
                                <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Role
                              </Button>
                              {!isBanned ? (
                                <Button size="sm" variant="ghost" className="h-8 text-red-600 hover:bg-red-50" onClick={() => openBanForUser(u)}>
                                  <Ban className="w-3.5 h-3.5 mr-1" /> Ban
                                </Button>
                              ) : (
                                <Button size="sm" variant="ghost" className="h-8 text-emerald-600 hover:bg-emerald-50"
                                  onClick={() => { const b = bannedUsers.find(b => b.email === u.email); if (b) removeBan(b.id, b.email); }}>
                                  <RotateCcw className="w-3.5 h-3.5 mr-1" /> Unblock
                                </Button>
                              )}
                            </>
                          )}
                          {isSelf && <span className="text-xs text-slate-400 px-2">You</span>}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center py-12 text-slate-400 dark:text-slate-500">No users found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
            {filtered.length > 15 && (
              <TablePagination currentPage={pagination.currentPage} totalItems={pagination.totalItems} itemsPerPage={pagination.itemsPerPage} onPageChange={pagination.setCurrentPage} />
            )}
          </div>
        </TabsContent>

        {/* ── Banned Tab ── */}
        <TabsContent value="banned">
          {bannedUsers.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No banned or suspended users</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-800">
                    <SortableTableHead field="full_name" sort={sort} onSort={f => setSort(prev => toggleSort(prev, f))}>Name</SortableTableHead>
                    <SortableTableHead field="email" sort={sort} onSort={f => setSort(prev => toggleSort(prev, f))}>Email</SortableTableHead>
                    <SortableTableHead field="ban_type" sort={sort} onSort={f => setSort(prev => toggleSort(prev, f))}>Type</SortableTableHead>
                    <TableHead>Reason</TableHead>
                    <SortableTableHead field="ban_expires" sort={sort} onSort={f => setSort(prev => toggleSort(prev, f))}>Expires</SortableTableHead>
                    <TableHead>Banned By</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bannedPagination.paginatedItems.map(b => (
                    <TableRow key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <TableCell className="font-medium text-sm text-slate-900 dark:text-slate-100">{b.full_name || "—"}</TableCell>
                      <TableCell className="text-sm text-slate-700 dark:text-slate-300">{b.email}</TableCell>
                      <TableCell>
                        <Badge className={b.ban_type === "banned" ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400" : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"}>
                          {b.ban_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600 dark:text-slate-400 max-w-[180px] truncate">{b.reason}</TableCell>
                      <TableCell className="text-xs text-slate-400 dark:text-slate-500">{b.ban_expires ? new Date(b.ban_expires).toLocaleDateString() : "Permanent"}</TableCell>
                      <TableCell className="text-xs text-slate-400 dark:text-slate-500">{b.banned_by}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" className="h-8 text-emerald-600 hover:bg-emerald-50" onClick={() => removeBan(b.id, b.email)}>
                          <RotateCcw className="w-3.5 h-3.5 mr-1" /> Unblock
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {bannedUsers.length > 15 && (
                <TablePagination
                  currentPage={bannedPagination.currentPage}
                  totalItems={bannedPagination.totalItems}
                  itemsPerPage={bannedPagination.itemsPerPage}
                  onPageChange={bannedPagination.setCurrentPage}
                />
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Role Change Dialog ── */}
      <Dialog open={!!roleDialog} onOpenChange={() => setRoleDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-blue-600" /> Change Role</DialogTitle></DialogHeader>
          <div className="py-2 space-y-3">
            <p className="text-sm text-slate-600">Update role for <strong>{roleDialog?.full_name || roleDialog?.email}</strong></p>
            <div>
              <Label>Role</Label>
              <MobileSelect value={newRole} onValueChange={setNewRole} placeholder="Select role" triggerClassName="mt-1 w-full"
                options={[{ value: "user", label: "User (Buyer)" }, { value: "shop_owner", label: "Shop Owner" }, { value: "admin", label: "Admin" }]}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialog(null)}>Cancel</Button>
            <Button onClick={saveRole} className="bg-blue-600 hover:bg-blue-700">Save Role</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Invite Dialog ── */}
      <Dialog open={inviteDialog} onOpenChange={setInviteDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Mail className="w-5 h-5 text-blue-600" /> Invite User</DialogTitle></DialogHeader>
          <div className="py-2 space-y-3">
            <div>
              <Label>Email Address *</Label>
              <Input className="mt-1" placeholder="user@example.com" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} />
            </div>
            <div>
              <Label>Role</Label>
              <MobileSelect value={inviteRole} onValueChange={setInviteRole} placeholder="Select role" triggerClassName="mt-1 w-full"
                options={[{ value: "user", label: "User (Buyer)" }, { value: "shop_owner", label: "Shop Owner" }, { value: "admin", label: "Admin" }]}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteDialog(false)}>Cancel</Button>
            <Button onClick={handleInvite} disabled={inviting} className="bg-blue-600 hover:bg-blue-700">
              {inviting ? "Sending…" : "Send Invite"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Ban Dialog ── */}
      <Dialog open={banDialog} onOpenChange={setBanDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <ShieldOff className="w-5 h-5" /> Ban or Suspend User
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-slate-500 bg-amber-50 border border-amber-200 rounded-lg p-3">
              The user will be blocked from the platform and notified by email.
            </p>
            <div>
              <Label>Email Address *</Label>
              <Input className="mt-1" placeholder="user@example.com" value={banForm.email} onChange={e => setBanForm({...banForm, email: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Phone</Label>
                <Input className="mt-1" placeholder="+260…" value={banForm.phone} onChange={e => setBanForm({...banForm, phone: e.target.value})} />
              </div>
              <div>
                <Label>Full Name</Label>
                <Input className="mt-1" placeholder="Optional" value={banForm.full_name} onChange={e => setBanForm({...banForm, full_name: e.target.value})} />
              </div>
            </div>
            <div>
              <Label>Restriction Type *</Label>
              <MobileSelect value={banForm.ban_type} onValueChange={v => setBanForm({...banForm, ban_type: v})} placeholder="Select type" triggerClassName="mt-1 w-full"
                options={[{ value: "suspended", label: "Suspended (temporary)" }, { value: "banned", label: "Banned (permanent)" }]}
              />
            </div>
            {banForm.ban_type === "suspended" && (
              <div>
                <Label>Suspension Expires</Label>
                <Input type="date" className="mt-1" value={banForm.ban_expires} onChange={e => setBanForm({...banForm, ban_expires: e.target.value})} />
              </div>
            )}
            <div>
              <Label>Reason *</Label>
              <Textarea className="mt-1" rows={3} placeholder="Reason for ban/suspension…" value={banForm.reason} onChange={e => setBanForm({...banForm, reason: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBanDialog(false)}>Cancel</Button>
            <Button onClick={handleBan} disabled={submitting} className="bg-red-600 hover:bg-red-700 text-white">
              {submitting ? "Processing…" : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}