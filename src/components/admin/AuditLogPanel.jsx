import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { ScrollText, Search } from "lucide-react";

const ACTION_COLORS = {
  ban_user: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
  suspend_user: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400",
  unban_user: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
  approve_shop: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
  reject_shop: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
  suspend_shop: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400",
  resolve_report: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
  dismiss_report: "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400",
  update_order_status: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
  delete_product: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
  create_product: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
  update_product: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400",
  place_order: "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400",
  cancel_order: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
  register_shop: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
  add_region: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
  delete_region: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
  submit_report: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
  leave_review: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400",
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Audit Log</h1>
          <Badge className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">{logs.length} entries</Badge>
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
        <>
          {/* Mobile: card list */}
          <div className="md:hidden space-y-3">
            {filtered.map(log => (
              <div key={log.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700 p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <Badge className={ACTION_COLORS[log.action] || "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"}>
                    {ACTION_LABELS[log.action] || log.action}
                  </Badge>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 whitespace-nowrap">
                    {new Date(log.created_date).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{log.actor_name || log.actor_email}</span>
                  {log.actor_role && <span className="ml-2 text-xs text-slate-400 capitalize">({log.actor_role})</span>}
                </div>
                {(log.entity_label || log.entity_type) && (
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Record: <span className="font-medium text-slate-700 dark:text-slate-300">{log.entity_label || log.entity_type}</span>
                  </div>
                )}
                {log.details && <p className="text-xs text-slate-400 dark:text-slate-500 line-clamp-2">{log.details}</p>}
              </div>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden md:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-800">
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
                  <TableRow key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <TableCell className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">
                      {new Date(log.created_date).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="font-medium text-slate-900 dark:text-slate-100">{log.actor_name || log.actor_email}</div>
                      {log.actor_name && <div className="text-xs text-slate-400 dark:text-slate-500">{log.actor_email}</div>}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 dark:text-slate-400 capitalize">{log.actor_role || "—"}</TableCell>
                    <TableCell>
                      <Badge className={ACTION_COLORS[log.action] || "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"}>
                        {ACTION_LABELS[log.action] || log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {log.entity_label ? (
                        <span className="font-medium text-slate-900 dark:text-slate-100">{log.entity_label}</span>
                      ) : log.entity_type ? (
                        <span className="text-slate-400 dark:text-slate-500 text-xs">{log.entity_type}</span>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 dark:text-slate-400 max-w-[220px] truncate">{log.details || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}