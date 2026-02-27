import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { ScrollText, Search } from "lucide-react";

const ACTION_COLORS = {
  ban_user: "bg-red-100 text-red-700",
  suspend_user: "bg-orange-100 text-orange-700",
  unban_user: "bg-emerald-100 text-emerald-700",
  approve_shop: "bg-emerald-100 text-emerald-700",
  reject_shop: "bg-red-100 text-red-700",
  suspend_shop: "bg-orange-100 text-orange-700",
  resolve_report: "bg-blue-100 text-blue-700",
  dismiss_report: "bg-slate-100 text-slate-500",
  update_order_status: "bg-blue-100 text-blue-700",
  delete_product: "bg-red-100 text-red-700",
  create_product: "bg-green-100 text-green-700",
  update_product: "bg-yellow-100 text-yellow-700",
  place_order: "bg-cyan-100 text-cyan-700",
  cancel_order: "bg-red-100 text-red-700",
  register_shop: "bg-purple-100 text-purple-700",
  add_region: "bg-green-100 text-green-700",
  delete_region: "bg-red-100 text-red-700",
  submit_report: "bg-amber-100 text-amber-700",
  leave_review: "bg-indigo-100 text-indigo-700",
};

const ACTION_LABELS = {
  ban_user: "Ban User",
  suspend_user: "Suspend User",
  unban_user: "Unban User",
  approve_shop: "Approve Shop",
  reject_shop: "Reject Shop",
  suspend_shop: "Suspend Shop",
  resolve_report: "Resolve Report",
  dismiss_report: "Dismiss Report",
  update_order_status: "Update Order",
  delete_product: "Delete Product",
  create_product: "Create Product",
  update_product: "Update Product",
  place_order: "Place Order",
  cancel_order: "Cancel Order",
  register_shop: "Register Shop",
  add_region: "Add Region",
  delete_region: "Delete Region",
  submit_report: "Submit Report",
  leave_review: "Leave Review",
};

export default function AuditLogPanel() {
  const [logs, setLogs] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      const data = await base44.entities.AuditLog.list("-created_date", 500);
      setLogs(data);
      setFiltered(data);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!search.trim()) { setFiltered(logs); return; }
    const q = search.toLowerCase();
    setFiltered(logs.filter(l =>
      l.actor_email?.toLowerCase().includes(q) ||
      l.actor_name?.toLowerCase().includes(q) ||
      l.action?.toLowerCase().includes(q) ||
      l.entity_label?.toLowerCase().includes(q) ||
      l.details?.toLowerCase().includes(q)
    ));
  }, [search, logs]);

  if (loading) return <div className="animate-pulse h-40 bg-slate-100 rounded-xl" />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900">Audit Log</h1>
          <Badge className="bg-slate-100 text-slate-700">{logs.length} entries</Badge>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            className="pl-9"
            placeholder="Search by user, action…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <ScrollText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No audit log entries found</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>When</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Record</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(log => (
                <TableRow key={log.id}>
                  <TableCell className="text-xs text-slate-400 whitespace-nowrap">
                    {new Date(log.created_date).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="font-medium">{log.actor_name || log.actor_email}</div>
                    {log.actor_name && <div className="text-xs text-slate-400">{log.actor_email}</div>}
                  </TableCell>
                  <TableCell className="text-xs text-slate-500 capitalize">{log.actor_role || "—"}</TableCell>
                  <TableCell>
                    <Badge className={ACTION_COLORS[log.action] || "bg-slate-100 text-slate-600"}>
                      {ACTION_LABELS[log.action] || log.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {log.entity_label ? (
                      <span className="font-medium">{log.entity_label}</span>
                    ) : log.entity_type ? (
                      <span className="text-slate-400 text-xs">{log.entity_type}</span>
                    ) : "—"}
                  </TableCell>
                  <TableCell className="text-xs text-slate-500 max-w-[220px] truncate">{log.details || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}