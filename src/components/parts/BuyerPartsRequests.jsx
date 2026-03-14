import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileSearch, Store, Phone, Clock, CheckCircle2, XCircle, MessageSquare } from "lucide-react";
import { toast } from "sonner";

const statusConfig = {
  open:           { label: "Waiting for shops",  color: "bg-amber-50 text-amber-700 border-amber-200",     icon: Clock },
  counter_offered:{ label: "Counter Offer",       color: "bg-purple-50 text-purple-700 border-purple-200",  icon: MessageSquare },
  accepted:       { label: "Accepted by shop",    color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  fulfilled:      { label: "Fulfilled",           color: "bg-blue-50 text-blue-700 border-blue-200",        icon: CheckCircle2 },
  cancelled:      { label: "Cancelled",           color: "bg-slate-100 text-slate-500 border-slate-200",    icon: XCircle },
};

export default function BuyerPartsRequests({ user, onNewRequest }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(null);

  useEffect(() => {
    if (user?.email) loadRequests();
  }, [user]);

  const loadRequests = async () => {
    const data = await base44.entities.PartsRequest.filter({ buyer_email: user.email }, "-created_date", 50);
    setRequests(data);
    setLoading(false);
  };

  const cancelRequest = async (req) => {
    await base44.entities.PartsRequest.update(req.id, { status: "cancelled" });
    setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: "cancelled" } : r));
    toast.success("Request cancelled");
  };

  const handleCounterResponse = async (req, accepted) => {
    setSubmitting(req.id);

    // Find the shop owner email to notify — stored in counter fields
    const shopNotifEmail = req.counter_by_shop_id
      ? (await base44.entities.Shop.filter({ id: req.counter_by_shop_id }))[0]?.owner_email
      : null;

    if (accepted) {
      await base44.entities.PartsRequest.update(req.id, {
        status: "accepted",
        buyer_response: "agreed",
        accepted_by_shop_id: req.counter_by_shop_id,
        accepted_by_shop_name: req.counter_by_shop_name,
        accepted_by_shop_phone: req.counter_by_shop_phone,
        accepted_date: new Date().toISOString(),
      });
      if (shopNotifEmail) {
        await base44.entities.Notification.create({
          user_email: shopNotifEmail,
          type: "system_alert",
          title: "Counter Offer Accepted!",
          message: `${req.buyer_name} has accepted your counter offer of K${req.shop_counter_budget?.toLocaleString()} for "${req.part_name}".`,
          related_id: req.id,
          action_url: "ShopDashboard?view=parts_requests",
        });
      }
      toast.success("You accepted the counter offer! The shop will be in touch.");
    } else {
      await base44.entities.PartsRequest.update(req.id, {
        status: "open",
        buyer_response: "declined",
        shop_counter_budget: null,
        shop_counter_message: "",
        counter_by_shop_id: null,
        counter_by_shop_name: null,
        counter_by_shop_phone: null,
      });
      if (shopNotifEmail) {
        await base44.entities.Notification.create({
          user_email: shopNotifEmail,
          type: "system_alert",
          title: "Counter Offer Declined",
          message: `${req.buyer_name} has declined your counter offer for "${req.part_name}". The request is back on the market.`,
          related_id: req.id,
          action_url: "ShopDashboard?view=parts_requests",
        });
      }
      toast.info("Counter offer declined. Your request is back on the market.");
    }
    await loadRequests();
    setSubmitting(null);
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">My Parts Requests</h1>
        <Button onClick={onNewRequest} className="bg-blue-600 hover:bg-blue-700 gap-2">
          <FileSearch className="w-4 h-4" /> New Request
        </Button>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-20">
          <FileSearch className="w-16 h-16 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
          <h3 className="font-semibold text-slate-700 dark:text-slate-300">No parts requests yet</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
            Can't find a part? Submit a request and verified shops will contact you.
          </p>
          <Button onClick={onNewRequest} className="mt-4 bg-blue-600 hover:bg-blue-700">Submit a Request</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map(req => {
            const sc = statusConfig[req.status] || statusConfig.open;
            const isCounter = req.status === "counter_offered";
            return (
              <Card key={req.id} className={`border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 ${isCounter ? "border-purple-300 dark:border-purple-700 ring-1 ring-purple-200 dark:ring-purple-800/50" : ""}`}>
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100">{req.part_name}</h3>
                        <Badge className={`${sc.color} dark:bg-opacity-20 text-xs border dark:border-opacity-50`}>
                          <sc.icon className="w-3 h-3 mr-1" />
                          {sc.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        Submitted {new Date(req.created_date).toLocaleDateString()}
                        {req.category && ` • ${req.category.replace("_", " ")}`}
                        {req.compatible_vehicles && ` • ${req.compatible_vehicles}`}
                      </p>
                      {req.description && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5">{req.description}</p>
                      )}
                      {req.budget && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Your budget: K{req.budget.toLocaleString()}</p>
                      )}
                    </div>
                    {req.status === "open" && (
                      <Button
                        size="sm" variant="outline"
                        onClick={() => cancelRequest(req)}
                        className="text-red-600 dark:text-red-400 border-red-100 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-950/30 shrink-0"
                      >
                        Cancel
                      </Button>
                    )}
                  </div>

                  {/* Counter Offer Banner */}
                  {isCounter && (
                    <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 rounded-xl">
                      <p className="font-semibold text-purple-800 dark:text-purple-300 flex items-center gap-2 mb-1">
                        <MessageSquare className="w-4 h-4" /> Counter Offer from {req.counter_by_shop_name}
                      </p>
                      <p className="text-purple-700 dark:text-purple-400 text-sm">
                        They are offering this part for <strong>K{req.shop_counter_budget?.toLocaleString()}</strong>
                        {req.budget ? ` (your budget was K${req.budget.toLocaleString()})` : ""}.
                      </p>
                      {req.shop_counter_message && (
                        <p className="text-sm text-purple-600 dark:text-purple-400 mt-1 italic">"{req.shop_counter_message}"</p>
                      )}
                      {req.counter_by_shop_phone && (
                        <p className="text-xs text-purple-500 dark:text-purple-400 mt-1 flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {req.counter_by_shop_phone}
                        </p>
                      )}
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" onClick={() => handleCounterResponse(req, true)} disabled={submitting === req.id}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white">
                          Accept Offer
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleCounterResponse(req, false)} disabled={submitting === req.id}
                          className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-950/30">
                          Decline &amp; Reopen
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Accepted by shop */}
                  {req.status === "accepted" && (
                    <div className="mt-3 p-3.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-800/60">
                      <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                        <Store className="w-4 h-4" />
                        <strong>{req.accepted_by_shop_name}</strong> has accepted your request!
                      </p>
                      {req.accepted_by_shop_phone && (
                        <p className="text-sm text-emerald-700 dark:text-emerald-400 mt-1.5 flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5" />
                          Call them: <strong>{req.accepted_by_shop_phone}</strong>
                        </p>
                      )}
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                        Accepted on {new Date(req.accepted_date).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}