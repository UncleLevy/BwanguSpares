import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wrench, Clock, CheckCircle2, XCircle, Plus, Calendar, MapPin, Phone, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";

const statusConfig = {
  pending:   { label: "Pending",   color: "bg-amber-100 text-amber-800",   icon: Clock },
  accepted:  { label: "Accepted",  color: "bg-emerald-100 text-emerald-800", icon: CheckCircle2 },
  rejected:  { label: "Rejected",  color: "bg-red-100 text-red-800",       icon: XCircle },
  completed: { label: "Completed", color: "bg-blue-100 text-blue-800",     icon: CheckCircle2 },
};

const specLabels = {
  engine: "Engine", electrical: "Electrical", body_work: "Body Work",
  transmission: "Transmission", brakes: "Brakes", general: "General",
  diagnostics: "Diagnostics", ac_heating: "AC/Heating", tyres: "Tyres"
};

export default function BuyerTechnicianRequests({ user }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    if (!user?.email) return;
    loadRequests();
    const unsub = base44.entities.TechnicianHireRequest.subscribe(() => loadRequests());
    return unsub;
  }, [user]);

  const loadRequests = async () => {
    const data = await base44.entities.TechnicianHireRequest.filter(
      { buyer_email: user.email },
      "-created_date",
      50
    );
    setRequests(data);
    setLoading(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Technician Requests</h1>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-20">
          <Wrench className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h3 className="font-semibold text-slate-700 dark:text-slate-300">No technician requests yet</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Visit a shop's profile to hire a technician
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map(req => {
            const sc = statusConfig[req.status] || statusConfig.pending;
            const Icon = sc.icon;
            return (
              <Card key={req.id} className="border-slate-200 dark:border-slate-700">
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-slate-900 dark:text-slate-100">{req.technician_name}</p>
                        <Badge className={sc.color}>
                          <Icon className="w-3 h-3 mr-1" /> {sc.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {req.shop_name} &bull; {specLabels[req.problem_type] || req.problem_type}
                      </p>
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-500 dark:text-slate-400">
                        {req.preferred_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" /> {format(new Date(req.preferred_date), "MMM dd, yyyy")}
                          </span>
                        )}
                        {req.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" /> {req.location}
                          </span>
                        )}
                        {req.buyer_phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5" /> {req.buyer_phone}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 line-clamp-2">{req.description}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedRequest(req)}
                      className="shrink-0"
                    >
                      View Details
                    </Button>
                  </div>

                  {/* Shop Response */}
                  {req.shop_response && (
                    <div className={`mt-4 p-3 rounded-xl border text-sm ${
                      req.status === "accepted"
                        ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                        : "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800 text-red-800 dark:text-red-300"
                    }`}>
                      <p className="font-semibold flex items-center gap-1 mb-1">
                        <MessageSquare className="w-3.5 h-3.5" /> Shop Response
                      </p>
                      <p>{req.shop_response}</p>
                    </div>
                  )}

                  {req.status === "pending" && !req.shop_response && (
                    <div className="mt-3 p-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-lg text-xs text-amber-700 dark:text-amber-400">
                      ⏳ Awaiting response from the shop
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Request Details</DialogTitle>
          </DialogHeader>
          {selectedRequest && (() => {
            const sc = statusConfig[selectedRequest.status] || statusConfig.pending;
            const Icon = sc.icon;
            return (
              <div className="space-y-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{selectedRequest.technician_name}</span>
                  <Badge className={sc.color}><Icon className="w-3 h-3 mr-1" />{sc.label}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 text-slate-600 dark:text-slate-400">
                  <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Shop</p><p>{selectedRequest.shop_name}</p></div>
                  <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Specialization</p><p>{specLabels[selectedRequest.problem_type] || selectedRequest.problem_type}</p></div>
                  {selectedRequest.preferred_date && <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Preferred Date</p><p>{format(new Date(selectedRequest.preferred_date), "MMM dd, yyyy")}</p></div>}
                  {selectedRequest.location && <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Location</p><p>{selectedRequest.location}</p></div>}
                  {selectedRequest.buyer_phone && <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Your Phone</p><p>{selectedRequest.buyer_phone}</p></div>}
                  <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Submitted</p><p>{format(new Date(selectedRequest.created_date), "MMM dd, yyyy")}</p></div>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Problem Description</p>
                  <p className="text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 rounded-lg p-3">{selectedRequest.description}</p>
                </div>
                {selectedRequest.shop_response ? (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Shop Response</p>
                    <div className={`p-3 rounded-lg border ${
                      selectedRequest.status === "accepted"
                        ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                        : "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800 text-red-800 dark:text-red-300"
                    }`}>
                      {selectedRequest.shop_response}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-lg text-amber-700 dark:text-amber-400">
                    ⏳ Awaiting response from the shop
                  </div>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}