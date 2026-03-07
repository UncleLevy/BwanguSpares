import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TicketCheck, Plus, ChevronDown, ChevronUp, Paperclip, X, ImageIcon } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = [
  { value: "order_issue", label: "Order Issue" },
  { value: "payment_issue", label: "Payment Issue" },
  { value: "account_issue", label: "Account Issue" },
  { value: "shop_issue", label: "Shop Issue" },
  { value: "technical", label: "Technical Problem" },
  { value: "other", label: "Other" },
];

const statusColors = {
  open: "bg-amber-100 text-amber-700",
  in_progress: "bg-blue-100 text-blue-700",
  resolved: "bg-emerald-100 text-emerald-700",
  closed: "bg-slate-100 text-slate-600",
};

export default function SupportTicketForm({ user }) {
  const [tickets, setTickets] = useState(null);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showTickets, setShowTickets] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ subject: "", category: "other", message: "" });

  const loadTickets = async () => {
    setLoadingTickets(true);
    const t = await base44.entities.SupportTicket.filter({ user_email: user.email }, "-created_date", 20);
    setTickets(t);
    setLoadingTickets(false);
  };

  const handleToggleTickets = () => {
    if (!showTickets && tickets === null) loadTickets();
    setShowTickets(!showTickets);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    setSubmitting(true);
    await base44.entities.SupportTicket.create({
      user_email: user.email,
      user_name: user.full_name,
      user_role: user.role || "buyer",
      subject: form.subject,
      category: form.category,
      message: form.message,
      status: "open",
      priority: "medium",
    });
    toast.success("Ticket submitted! Admin will respond shortly.");
    setForm({ subject: "", category: "other", message: "" });
    setShowForm(false);
    // Reload tickets
    const t = await base44.entities.SupportTicket.filter({ user_email: user.email }, "-created_date", 20);
    setTickets(t);
    setShowTickets(true);
    setSubmitting(false);
  };

  return (
    <div className="max-w-lg space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Support</h1>
        <Button onClick={() => { setShowForm(!showForm); setShowTickets(false); }} className="bg-blue-600 hover:bg-blue-700 gap-2">
          <Plus className="w-4 h-4" /> New Ticket
        </Button>
      </div>

      {showForm && (
        <Card className="border-blue-100 dark:border-slate-700 dark:bg-slate-900">
          <CardContent className="p-5">
            <h2 className="font-semibold text-slate-800 dark:text-slate-200 mb-4">Submit a Support Ticket</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Subject *</Label>
                <Input
                  value={form.subject}
                  onChange={e => setForm({ ...form, subject: e.target.value })}
                  placeholder="Briefly describe your issue"
                  className="mt-1 rounded-xl"
                />
              </div>
              <div>
                <Label>Category</Label>
                <select
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
                >
                  {CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Message *</Label>
                <Textarea
                  value={form.message}
                  onChange={e => setForm({ ...form, message: e.target.value })}
                  placeholder="Please describe your issue in detail..."
                  className="mt-1 rounded-xl resize-none"
                  rows={5}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700">
                  {submitting ? "Submitting..." : "Submit Ticket"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <button
        onClick={handleToggleTickets}
        className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
      >
        <span className="flex items-center gap-2"><TicketCheck className="w-4 h-4 text-blue-500" /> My Tickets</span>
        {showTickets ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {showTickets && (
        <div className="space-y-3">
          {loadingTickets ? (
            <div className="flex justify-center py-8"><div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" /></div>
          ) : tickets?.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No tickets yet.</p>
          ) : (
            tickets?.map(ticket => (
              <Card key={ticket.id} className="border-slate-100 dark:border-slate-700 dark:bg-slate-900">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">{ticket.subject}</p>
                    <Badge className={`text-[11px] shrink-0 ${statusColors[ticket.status]}`}>{ticket.status.replace("_", " ")}</Badge>
                  </div>
                  <p className="text-xs text-slate-500">{new Date(ticket.created_date).toLocaleDateString()} · {CATEGORIES.find(c => c.value === ticket.category)?.label}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{ticket.message}</p>
                  {ticket.admin_reply && (
                    <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                      <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">Admin Reply:</p>
                      <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{ticket.admin_reply}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}