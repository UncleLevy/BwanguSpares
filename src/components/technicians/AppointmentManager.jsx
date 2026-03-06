import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, User, Wrench, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const STATUS_STYLES = {
  pending:   { label: "Pending",   class: "bg-amber-50 text-amber-700" },
  confirmed: { label: "Confirmed", class: "bg-blue-50 text-blue-700" },
  completed: { label: "Completed", class: "bg-emerald-50 text-emerald-700" },
  cancelled: { label: "Cancelled", class: "bg-red-50 text-red-700" },
};

const PROBLEM_LABELS = {
  engine: "Engine", electrical: "Electrical", body_work: "Body Work", transmission: "Transmission",
  brakes: "Brakes", general: "General", diagnostics: "Diagnostics", ac_heating: "AC/Heating", tyres: "Tyres"
};

export default function AppointmentManager({ shop }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDate, setFilterDate] = useState("");
  const [selected, setSelected] = useState(null);
  const [shopNotes, setShopNotes] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    if (!shop?.id) return;
    loadAppointments();
    const unsub = base44.entities.Appointment.subscribe(() => loadAppointments());
    return unsub;
  }, [shop?.id]);

  const loadAppointments = async () => {
    const data = await base44.entities.Appointment.filter({ shop_id: shop.id }, "-appointment_date", 100);
    setAppointments(data || []);
    setLoading(false);
  };

  const updateStatus = async (appt, newStatus) => {
    await base44.entities.Appointment.update(appt.id, { status: newStatus });
    setAppointments(prev => prev.map(a => a.id === appt.id ? { ...a, status: newStatus } : a));
    // Notify buyer
    await base44.entities.Notification.create({
      user_email: appt.buyer_email,
      type: "order_update",
      title: `Appointment ${newStatus}`,
      message: `Your appointment with ${appt.technician_name} on ${appt.appointment_date} at ${appt.time_slot} has been ${newStatus}.`,
    });
    toast.success(`Appointment marked as ${newStatus}`);
    if (selected?.id === appt.id) setSelected({ ...selected, status: newStatus });
  };

  const saveNotes = async () => {
    await base44.entities.Appointment.update(selected.id, { shop_notes: shopNotes });
    setAppointments(prev => prev.map(a => a.id === selected.id ? { ...a, shop_notes: shopNotes } : a));
    toast.success("Notes saved");
    setDetailOpen(false);
  };

  const openDetail = (appt) => {
    setSelected(appt);
    setShopNotes(appt.shop_notes || "");
    setDetailOpen(true);
  };

  const filtered = appointments.filter(a => {
    if (filterStatus !== "all" && a.status !== filterStatus) return false;
    if (filterDate && a.appointment_date !== filterDate) return false;
    return true;
  });

  const todayStr = new Date().toISOString().split("T")[0];
  const todayCount = appointments.filter(a => a.appointment_date === todayStr && a.status !== "cancelled").length;
  const pendingCount = appointments.filter(a => a.status === "pending").length;

  if (loading) return (
    <div className="space-y-3">
      {[1,2,3].map(i => <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />)}
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Appointments</h1>
        <div className="flex gap-3">
          <div className="text-center px-4 py-2 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
            <p className="text-xl font-bold text-amber-700 dark:text-amber-400">{pendingCount}</p>
            <p className="text-xs text-amber-600 dark:text-amber-500">Pending</p>
          </div>
          <div className="text-center px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <p className="text-xl font-bold text-blue-700 dark:text-blue-400">{todayCount}</p>
            <p className="text-xs text-blue-600 dark:text-blue-500">Today</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={filterDate}
          onChange={e => setFilterDate(e.target.value)}
          className="w-44"
          placeholder="Filter by date"
        />
        {filterDate && (
          <Button variant="ghost" size="sm" onClick={() => setFilterDate("")} className="text-slate-500">Clear date</Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="font-medium">No appointments found</p>
          <p className="text-sm mt-1">Bookings from customers will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(appt => (
            <Card key={appt.id} className="border-slate-100 dark:border-slate-700 hover:shadow-md transition-shadow cursor-pointer" onClick={() => openDetail(appt)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                      <Wrench className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{appt.buyer_name}</p>
                        <Badge className={STATUS_STYLES[appt.status]?.class}>{STATUS_STYLES[appt.status]?.label}</Badge>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        <span className="font-medium text-slate-700 dark:text-slate-300">{appt.technician_name}</span> · {PROBLEM_LABELS[appt.problem_type] || appt.problem_type}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{appt.appointment_date}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{appt.time_slot}</span>
                        {appt.location && <span className="flex items-center gap-1">📍 {appt.location}</span>}
                      </div>
                    </div>
                  </div>

                  {appt.status === "pending" && (
                    <div className="flex gap-1.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
                      <Button size="sm" className="h-8 bg-blue-600 hover:bg-blue-700 gap-1 text-xs" onClick={() => updateStatus(appt, "confirmed")}>
                        <CheckCircle2 className="w-3 h-3" /> Confirm
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 text-red-600 border-red-200 hover:bg-red-50 gap-1 text-xs" onClick={() => updateStatus(appt, "cancelled")}>
                        <XCircle className="w-3 h-3" /> Decline
                      </Button>
                    </div>
                  )}
                  {appt.status === "confirmed" && (
                    <div onClick={e => e.stopPropagation()}>
                      <Button size="sm" className="h-8 bg-emerald-600 hover:bg-emerald-700 gap-1 text-xs" onClick={() => updateStatus(appt, "completed")}>
                        <CheckCircle2 className="w-3 h-3" /> Mark Done
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">{selected.buyer_name}</p>
                  <p className="text-xs text-slate-500">{selected.buyer_email} · {selected.buyer_phone}</p>
                </div>
                <Badge className={`ml-auto ${STATUS_STYLES[selected.status]?.class}`}>{STATUS_STYLES[selected.status]?.label}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-1">Technician</p>
                  <p className="font-medium text-slate-900 dark:text-slate-100">{selected.technician_name}</p>
                  <p className="text-xs text-slate-500">{PROBLEM_LABELS[selected.problem_type]}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-1">Schedule</p>
                  <p className="font-medium text-slate-900 dark:text-slate-100">{selected.appointment_date}</p>
                  <p className="text-xs text-slate-500">{selected.time_slot}</p>
                </div>
              </div>

              {selected.description && (
                <div>
                  <p className="text-xs text-slate-400 mb-1">Problem Description</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 rounded-lg p-3">{selected.description}</p>
                </div>
              )}

              {selected.location && (
                <p className="text-sm text-slate-600 dark:text-slate-400">📍 {selected.location}</p>
              )}

              <div>
                <Label className="text-sm">Internal Notes</Label>
                <Textarea
                  value={shopNotes}
                  onChange={e => setShopNotes(e.target.value)}
                  placeholder="Add internal notes about this appointment..."
                  className="mt-1"
                  rows={2}
                />
              </div>

              <div className="flex gap-2 flex-wrap">
                {selected.status === "pending" && (
                  <>
                    <Button className="flex-1 bg-blue-600 hover:bg-blue-700 gap-1.5" onClick={() => { updateStatus(selected, "confirmed"); setDetailOpen(false); }}>
                      <CheckCircle2 className="w-4 h-4" /> Confirm
                    </Button>
                    <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 gap-1.5" onClick={() => { updateStatus(selected, "cancelled"); setDetailOpen(false); }}>
                      <XCircle className="w-4 h-4" /> Decline
                    </Button>
                  </>
                )}
                {selected.status === "confirmed" && (
                  <Button className="bg-emerald-600 hover:bg-emerald-700 gap-1.5" onClick={() => { updateStatus(selected, "completed"); setDetailOpen(false); }}>
                    <CheckCircle2 className="w-4 h-4" /> Mark as Completed
                  </Button>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailOpen(false)}>Close</Button>
            <Button onClick={saveNotes} className="bg-blue-600 hover:bg-blue-700">Save Notes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}