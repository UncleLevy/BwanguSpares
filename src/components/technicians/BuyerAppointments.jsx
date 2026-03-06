import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, Wrench, MapPin } from "lucide-react";

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

export default function BuyerAppointments({ user }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.email) return;
    (async () => {
      const data = await base44.entities.Appointment.filter({ buyer_email: user.email }, "-appointment_date", 50);
      setAppointments(data || []);
      setLoading(false);
    })();
  }, [user?.email]);

  if (loading) return (
    <div className="space-y-3">
      {[1,2,3].map(i => <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />)}
    </div>
  );

  const upcoming = appointments.filter(a => a.status !== "cancelled" && a.status !== "completed");
  const past = appointments.filter(a => a.status === "completed" || a.status === "cancelled");

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">My Appointments</h1>

      {appointments.length === 0 ? (
        <div className="text-center py-20">
          <Calendar className="w-14 h-14 text-slate-200 mx-auto mb-4" />
          <h3 className="font-semibold text-slate-700 dark:text-slate-300">No appointments yet</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Book a technician from a shop profile to get started</p>
        </div>
      ) : (
        <div className="space-y-8">
          {upcoming.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Upcoming</h2>
              <div className="space-y-3">
                {upcoming.map(appt => (
                  <AppointmentCard key={appt.id} appt={appt} />
                ))}
              </div>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Past</h2>
              <div className="space-y-3 opacity-75">
                {past.map(appt => (
                  <AppointmentCard key={appt.id} appt={appt} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AppointmentCard({ appt }) {
  return (
    <Card className="border-slate-100 dark:border-slate-700">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
              <Wrench className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{appt.technician_name}</p>
                <Badge className={STATUS_STYLES[appt.status]?.class}>{STATUS_STYLES[appt.status]?.label}</Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {appt.shop_name} · {PROBLEM_LABELS[appt.problem_type] || appt.problem_type}
              </p>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{appt.appointment_date}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{appt.time_slot}</span>
                {appt.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{appt.location}</span>}
              </div>
              {appt.description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-1">{appt.description}</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}