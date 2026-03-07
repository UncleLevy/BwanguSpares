import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { TicketCheck, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { emailSupportTicketReply } from "@/components/lib/emailNotifications";
import { toast } from "sonner";

const CATEGORIES = {
  order_issue: "Order Issue",
  payment_issue: "Payment Issue",
  account_issue: "Account Issue",
  shop_issue: "Shop Issue",
  technical: "Technical",
  other: "Other",
};

const statusColors = {
  open: "bg-amber-100 text-amber-700",
  in_progress: "bg-blue-100 text-blue-700",
  resolved: "bg-emerald-100 text-emerald-700",
  closed: "bg-slate-100 text-slate-600",
};

const priorityColors = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-red-100 text-red-700",
};

export default function SupportTicketsPanel({ adminUser }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("open");
  const [selected, setSelected] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    setLoading(true);
    const t = await base44.entities.SupportTicket.list("-created_date", 100);
    setTickets(t);
    setLoading(false);
  };

  const openTicket = (ticket) => {
    setSelected(ticket);
    setReplyText(ticket.admin_reply || "");
  };

  const handleUpdateStatus = async (ticket, status) => {
    const updates = { status };
    if (status === "resolved") updates.resolved_at = new Date().toISOString();
    await base44.entities.SupportTicket.update(ticket.id, updates);
    setTickets(prev => prev.map(t => t.id === ticket.id ? { ...t, ...updates } : t));
    if (selected?.id === ticket.id) setSelected(prev => ({ ...prev, ...updates }));
    toast.success(`Ticket marked as ${status}`);
  };

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setReplying(true);
    const updates = { admin_reply: replyText, status: "in_progress", admin_email: adminUser?.email };
    await base44.entities.SupportTicket.update(selected.id, updates);
    setTickets(prev => prev.map(t => t.id === selected.id ? { ...t, ...updates } : t));
    setSelected(prev => ({ ...prev, ...updates }));
    toast.success("Reply sent!");
    setReplying(false);
  };

  const filtered = tickets.filter(t => filter === "all" ? true : t.status === filter);
  const openCount = tickets.filter(t => t.status === "open").length;

  const FILTERS = [
    { value: "open", label: "Open", count: tickets.filter(t => t.status === "open").length },
    { value: "in_progress", label: "In Progress", count: tickets.filter(t => t.status === "in_progress").length },
    { value: "resolved", label: "Resolved", count: tickets.filter(t => t.status === "resolved").length },
    { value: "all", label: "All", count: tickets.length },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <TicketCheck className="w-6 h-6 text-blue-600" /> Support Tickets
          {openCount > 0 && <Badge className="bg-amber-100 text-amber-700 ml-1">{openCount} open</Badge>}
        </h1>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === f.value ? "bg-blue-600 text-white" : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50"}`}
          >
            {f.label} {f.count > 0 && <span className="ml-1">({f.count})</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <TicketCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No tickets in this category</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(ticket => (
            <Card key={ticket.id} className="border-slate-100 dark:border-slate-700 dark:bg-slate-900 hover:shadow-md transition-shadow cursor-pointer" onClick={() => openTicket(ticket)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">{ticket.subject}</span>
                      <Badge className={`text-[10px] ${statusColors[ticket.status]}`}>{ticket.status.replace("_", " ")}</Badge>
                      <Badge className={`text-[10px] ${priorityColors[ticket.priority]}`}>{ticket.priority}</Badge>
                    </div>
                    <p className="text-xs text-slate-500 mb-1">
                      {ticket.user_name} · {ticket.user_email} · {CATEGORIES[ticket.category]}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{ticket.message}</p>
                  </div>
                  <p className="text-[10px] text-slate-400 shrink-0">{new Date(ticket.created_date).toLocaleDateString()}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Ticket Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={open => !open && setSelected(null)}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <TicketCheck className="w-5 h-5 text-blue-600" />
              {selected?.subject}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <Badge className={`text-[11px] ${statusColors[selected.status]}`}>{selected.status.replace("_", " ")}</Badge>
                <Badge className={`text-[11px] ${priorityColors[selected.priority]}`}>{selected.priority} priority</Badge>
                <Badge variant="outline" className="text-[11px]">{CATEGORIES[selected.category]}</Badge>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-sm space-y-1">
                <p><span className="text-slate-400 text-xs">From:</span> <span className="font-medium">{selected.user_name}</span> ({selected.user_email})</p>
                <p><span className="text-slate-400 text-xs">Submitted:</span> {new Date(selected.created_date).toLocaleString()}</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Message</p>
                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl p-3">{selected.message}</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Reply to User</p>
                <Textarea
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder="Type your reply here..."
                  className="rounded-xl resize-none"
                  rows={4}
                />
              </div>

              <div className="flex flex-wrap gap-2 justify-between">
                <div className="flex gap-2 flex-wrap">
                  {selected.status !== "resolved" && (
                    <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={() => handleUpdateStatus(selected, "resolved")}>
                      <CheckCircle2 className="w-4 h-4 mr-1" /> Mark Resolved
                    </Button>
                  )}
                  {selected.status !== "closed" && (
                    <Button size="sm" variant="outline" className="text-slate-600 hover:bg-slate-50" onClick={() => handleUpdateStatus(selected, "closed")}>
                      Close Ticket
                    </Button>
                  )}
                  {selected.status === "open" && (
                    <Button size="sm" variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => handleUpdateStatus(selected, "in_progress")}>
                      <Clock className="w-4 h-4 mr-1" /> Mark In Progress
                    </Button>
                  )}
                </div>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700" disabled={replying || !replyText.trim()} onClick={handleReply}>
                  {replying ? "Sending..." : "Send Reply"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}