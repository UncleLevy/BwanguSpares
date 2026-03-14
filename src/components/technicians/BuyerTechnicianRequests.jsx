import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wrench, Clock, CheckCircle2, XCircle, Calendar, MapPin, Phone, MessageSquare, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";

const statusConfig = {
  pending:         { label: "Pending",        color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",   icon: Clock },
  counter_offered: { label: "Counter Offered", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400", icon: MessageSquare },
  accepted:        { label: "Accepted",        color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400", icon: CheckCircle2 },
  rejected:        { label: "Rejected",        color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",       icon: XCircle },
  completed:       { label: "Completed",       color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",     icon: CheckCircle2 },
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
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);

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

  const handleCounterResponse = async (req, accepted) => {
    setSubmitting(true);
    if (accepted) {
      await base44.entities.TechnicianHireRequest.update(req.id, {
        status: "accepted",
        buyer_response: "agreed",
      });
      // Notify shop
      await base44.entities.Notification.create({
        user_email: req.shop_owner_email,
        type: "system_alert",
        title: "Counter Offer Accepted!",
        message: `${req.buyer_name} has accepted your counter offer of K${req.shop_counter_budget?.toLocaleString()} for ${req.technician_name}.`,
        related_id: req.id,
        action_url: "ShopDashboard?view=hire_requests",
      });
      toast.success("You accepted the counter offer! The shop will be in touch.");
    } else {
      await base44.entities.TechnicianHireRequest.update(req.id, {
        status: "pending",
        buyer_response: "declined",
        shop_response: "",
        shop_counter_budget: null,
      });
      // Notify shop
      await base44.entities.Notification.create({
        user_email: req.shop_owner_email,
        type: "system_alert",
        title: "Counter Offer Declined",
        message: `${req.buyer_name} has declined your counter offer for ${req.technician_name}. The request is back to pending.`,
        related_id: req.id,
        action_url: "ShopDashboard?view=hire_requests",
      });
      toast.info("Counter offer declined. The request is back to pending.");
    }
    await loadRequests();
    setSelectedRequest(null);
    setSubmitting(false);
  };

  const handleDelete = async () => {
    setSubmitting(true);
    await base44.entities.TechnicianHireRequest.delete(deleteTarget.id);
    setRequests(prev => prev.filter(r => r.id !== deleteTarget.id));
    toast.success("Request deleted");
    setDeleteTarget(null);
    setSubmitting(false);
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
          <Wrench className="w-16 h-16 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
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
            const isCounterOffer = req.status === "counter_offered";
            return (
              <Card key={req.id} className={`border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 ${isCounterOffer ? "border-purple-300 dark:border-purple-700 ring-1 ring-purple-200 dark:ring-purple-800/50" : ""}`}>
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-semibold text-slate-900 dark:text-slate-100">{req.technician_name}</p>
                        <Badge className={`${sc.color} dark:bg-opacity-20 dark:border-opacity-50`}>
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
                        {req.buyer_budget && (
                          <span className="flex items-center gap-1 font-medium text-blue-600 dark:text-blue-400">
                            Your budget: K{req.buyer_budget.toLocaleString()}
                          </span>
                        )}
                        {req.shop_counter_budget && (
                          <span className="flex items-center gap-1 font-medium text-purple-600 dark:text-purple-400">
                            Shop's offer: K{req.shop_counter_budget.toLocaleString()}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 line-clamp-2">{req.description}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" variant="outline" onClick={() => setSelectedRequest(req)} className="dark:border-slate-600 dark:text-slate-300">
                        View Details
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDeleteTarget(req)}
                        className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-950/30"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Counter Offer Banner */}
                  {isCounterOffer && req.shop_counter_budget && (
                    <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 rounded-xl">
                      <p className="font-semibold text-purple-800 dark:text-purple-300 flex items-center gap-2 mb-1">
                        <MessageSquare className="w-4 h-4" /> Counter Offer from {req.shop_name}
                      </p>
                      <p className="text-purple-700 dark:text-purple-400 text-sm">
                        The shop is proposing <strong>K{req.shop_counter_budget.toLocaleString()}</strong>
                        {req.buyer_budget ? ` (your budget was K${req.buyer_budget.toLocaleString()})` : ""}.
                      </p>
                      {req.shop_response && <p className="text-sm text-purple-600 dark:text-purple-400 mt-1 italic">"{req.shop_response}"</p>}
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" onClick={() => handleCounterResponse(req, true)} disabled={submitting}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white">
                          Accept Offer
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleCounterResponse(req, false)} disabled={submitting}
                          className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-950/30">
                          Decline &amp; Reopen
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Shop Response (accepted/rejected) */}
                  {!isCounterOffer && req.shop_response && (
                    <div className={`mt-4 p-3 rounded-xl border text-sm ${
                      req.status === "accepted"
                        ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300"
                        : "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800/60 text-red-800 dark:text-red-300"
                    }`}>
                      <p className="font-semibold flex items-center gap-1 mb-1">
                        <MessageSquare className="w-3.5 h-3.5" /> Shop Response
                      </p>
                      <p>{req.shop_response}</p>
                    </div>
                  )}

                  {req.status === "pending" && !req.shop_response && (
                    <div className="mt-3 p-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-800/60 rounded-lg text-xs text-amber-700 dark:text-amber-400">
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
                  <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-1">Shop</p><p>{selectedRequest.shop_name}</p></div>
                  <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-1">Specialization</p><p>{specLabels[selectedRequest.problem_type] || selectedRequest.problem_type}</p></div>
                  {selectedRequest.preferred_date && <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-1">Preferred Date</p><p>{format(new Date(selectedRequest.preferred_date), "MMM dd, yyyy")}</p></div>}
                  {selectedRequest.location && <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-1">Location</p><p>{selectedRequest.location}</p></div>}
                  {selectedRequest.buyer_budget && <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-1">Your Budget</p><p className="text-blue-600 dark:text-blue-400 font-medium">K{selectedRequest.buyer_budget.toLocaleString()}</p></div>}
                  {selectedRequest.shop_counter_budget && <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-1">Shop Counter</p><p className="text-purple-600 dark:text-purple-400 font-medium">K{selectedRequest.shop_counter_budget.toLocaleString()}</p></div>}
                  <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-1">Submitted</p><p>{format(new Date(selectedRequest.created_date), "MMM dd, yyyy")}</p></div>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-1">Problem Description</p>
                  <p className="text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">{selectedRequest.description}</p>
                </div>
                {selectedRequest.shop_response ? (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-1">Shop Response</p>
                    <div className={`p-3 rounded-lg border ${
                      selectedRequest.status === "accepted"
                        ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300"
                        : selectedRequest.status === "counter_offered"
                        ? "bg-purple-50 border-purple-200 dark:bg-purple-950/30 dark:border-purple-800/60 text-purple-800 dark:text-purple-300"
                        : "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800/60 text-red-800 dark:text-red-300"
                    }`}>
                      {selectedRequest.shop_response}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-800/60 rounded-lg text-amber-700 dark:text-amber-400">
                    ⏳ Awaiting response from the shop
                  </div>
                )}
                {selectedRequest.status === "counter_offered" && (
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" onClick={() => handleCounterResponse(selectedRequest, true)} disabled={submitting}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1">
                      Accept Offer
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleCounterResponse(selectedRequest, false)} disabled={submitting}
                      className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-950/30 flex-1">
                      Decline &amp; Reopen
                    </Button>
                  </div>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Request?</DialogTitle>
            <DialogDescription>
              This will permanently remove your hire request for <strong>{deleteTarget?.technician_name}</strong>. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={submitting}>
              {submitting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}