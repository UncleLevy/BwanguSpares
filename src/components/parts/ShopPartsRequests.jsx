import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Inbox, Car, DollarSign, Phone, CheckCircle2, Clock, Crown } from "lucide-react";
import { toast } from "sonner";
import DocumentPrinter from "@/components/documents/DocumentPrinter";

export default function ShopPartsRequests({ shop }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(null);
  const [acceptedList, setAcceptedList] = useState([]);

  // Counter offer dialog
  const [counterDialog, setCounterDialog] = useState(false);
  const [counterTarget, setCounterTarget] = useState(null);
  const [counterBudget, setCounterBudget] = useState("");
  const [counterMessage, setCounterMessage] = useState("");
  const [counterSubmitting, setCounterSubmitting] = useState(false);

  useEffect(() => {
    if (!shop) return;
    if (shop.slot_type === "basic") { setLoading(false); return; }
    loadRequests();
    base44.entities.PartsRequest.filter({ accepted_by_shop_id: shop.id, status: "accepted" }, "-created_date", 50)
      .then(setAcceptedList);
  }, [shop]);

  const loadRequests = async () => {
    const data = await base44.entities.PartsRequest.filter({ status: "open" }, "-created_date", 100);
    setRequests(data);
    setLoading(false);
  };

  const acceptRequest = async (request) => {
    setAccepting(request.id);
    const fresh = await base44.entities.PartsRequest.filter({ id: request.id });
    if (!fresh[0] || fresh[0].status !== "open") {
      toast.error("This request was already accepted by another shop.");
      setRequests(prev => prev.filter(r => r.id !== request.id));
      setAccepting(null);
      return;
    }

    await base44.entities.PartsRequest.update(request.id, {
      status: "accepted",
      accepted_by_shop_id: shop.id,
      accepted_by_shop_name: shop.name,
      accepted_by_shop_phone: shop.phone || "",
      accepted_date: new Date().toISOString(),
    });

    await base44.entities.Notification.create({
      user_email: request.buyer_email,
      type: "system_alert",
      title: "Parts Request Accepted!",
      message: `${shop.name} has accepted your request for "${request.part_name}". Contact them at ${shop.phone || "the shop"} to proceed.`,
      related_id: request.id,
      action_url: "BuyerDashboard?view=parts_requests",
    });

    toast.success("Request accepted! The buyer has been notified.");
    setRequests(prev => prev.filter(r => r.id !== request.id));
    setAccepting(null);
  };

  const openCounterDialog = (req) => {
    setCounterTarget(req);
    setCounterBudget(req.budget ? req.budget.toString() : "");
    setCounterMessage("");
    setCounterDialog(true);
  };

  const submitCounterOffer = async () => {
    if (!counterBudget || isNaN(parseFloat(counterBudget))) {
      toast.error("Please enter a valid budget");
      return;
    }
    setCounterSubmitting(true);

    // Check it's still open
    const fresh = await base44.entities.PartsRequest.filter({ id: counterTarget.id });
    if (!fresh[0] || fresh[0].status !== "open") {
      toast.error("This request is no longer available.");
      setRequests(prev => prev.filter(r => r.id !== counterTarget.id));
      setCounterDialog(false);
      setCounterSubmitting(false);
      return;
    }

    await base44.entities.PartsRequest.update(counterTarget.id, {
      status: "counter_offered",
      shop_counter_budget: parseFloat(counterBudget),
      shop_counter_message: counterMessage,
      counter_by_shop_id: shop.id,
      counter_by_shop_name: shop.name,
      counter_by_shop_phone: shop.phone || "",
    });

    await base44.entities.Notification.create({
      user_email: counterTarget.buyer_email,
      type: "system_alert",
      title: "Counter Offer on Your Parts Request",
      message: `${shop.name} has sent a counter offer of K${parseFloat(counterBudget).toLocaleString()} for "${counterTarget.part_name}".`,
      related_id: counterTarget.id,
      action_url: "BuyerDashboard?view=parts_requests",
    });

    toast.success("Counter offer sent to the buyer.");
    setRequests(prev => prev.filter(r => r.id !== counterTarget.id));
    setCounterDialog(false);
    setCounterSubmitting(false);
  };

  if (shop?.slot_type === "basic") {
    return (
      <div className="text-center py-20">
        <Crown className="w-16 h-16 text-amber-300 mx-auto mb-4" />
        <h3 className="font-semibold text-slate-700 text-lg">Upgrade to Access Parts Requests</h3>
        <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">
          Buyer parts requests are available to <strong>Standard</strong> and <strong>Premium</strong> shops only.
        </p>
      </div>
    );
  }

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Parts Requests</h1>
          <p className="text-sm text-slate-500 mt-0.5">Accept or counter-offer buyer requests</p>
        </div>
        <div className="flex items-center gap-2">
          {shop?.slot_type === "premium" && (
            <Badge className="bg-amber-50 text-amber-700 border-amber-200">
              <Crown className="w-3 h-3 mr-1" /> Premium
            </Badge>
          )}
          <Badge className="bg-blue-50 text-blue-700">{requests.length} open</Badge>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-20">
          <Inbox className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h3 className="font-semibold text-slate-700">No open requests right now</h3>
          <p className="text-sm text-slate-500 mt-1">New buyer requests will appear here as they come in</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
          {requests.map(req => (
            <Card key={req.id} className="border-slate-100 hover:border-blue-200 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 truncate">{req.part_name}</h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant="outline" className="text-[11px] capitalize">
                        {req.category?.replace("_", " ")}
                      </Badge>
                      <span className="text-xs text-slate-400">
                        {new Date(req.created_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <Clock className="w-4 h-4 text-amber-500 flex-shrink-0 ml-2 mt-0.5" />
                </div>

                {req.description && (
                  <p className="text-sm text-slate-600 mb-3 line-clamp-2">{req.description}</p>
                )}

                <div className="space-y-1.5 mb-4">
                  {req.compatible_vehicles && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Car className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{req.compatible_vehicles}</span>
                    </div>
                  )}
                  {req.budget && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <DollarSign className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Budget: K{req.budget.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{req.buyer_name} • {req.buyer_phone || "Contact shown after acceptance"}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => acceptRequest(req)}
                    disabled={accepting === req.id}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 gap-2"
                    size="sm"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {accepting === req.id ? "Accepting..." : "Accept"}
                  </Button>
                  <Button
                    onClick={() => openCounterDialog(req)}
                    disabled={accepting === req.id}
                    variant="outline"
                    className="flex-1 border-purple-200 text-purple-700 hover:bg-purple-50"
                    size="sm"
                  >
                    Counter Offer
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {acceptedList.length > 0 && (
        <div className="mt-10">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Accepted Requests — Print Quotation</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {acceptedList.map(req => (
              <Card key={req.id} className="border-emerald-100">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm text-slate-900">{req.part_name}</p>
                      <p className="text-xs text-slate-500">{req.buyer_name} • {new Date(req.accepted_date || req.created_date).toLocaleDateString()}</p>
                    </div>
                    <DocumentPrinter shop={shop} partsRequest={req} triggerLabel="Quotation" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Counter Offer Dialog */}
      <Dialog open={counterDialog} onOpenChange={setCounterDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send Counter Offer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm space-y-1">
              <p className="font-semibold">{counterTarget?.part_name}</p>
              {counterTarget?.description && <p className="text-slate-500">{counterTarget.description}</p>}
              {counterTarget?.budget && (
                <p className="text-blue-600 font-medium text-xs">Buyer's budget: K{counterTarget.budget.toLocaleString()}</p>
              )}
            </div>
            <div>
              <Label>Your Counter Price (ZMW) *</Label>
              <Input
                type="number"
                min="0"
                value={counterBudget}
                onChange={e => setCounterBudget(e.target.value)}
                className="mt-1"
                placeholder="e.g. 800"
              />
            </div>
            <div>
              <Label>Message to Buyer (optional)</Label>
              <Textarea
                value={counterMessage}
                onChange={e => setCounterMessage(e.target.value)}
                className="mt-1"
                rows={3}
                placeholder="e.g. We have this part in stock, price includes delivery..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCounterDialog(false)}>Cancel</Button>
            <Button onClick={submitCounterOffer} disabled={counterSubmitting} className="bg-purple-600 hover:bg-purple-700">
              {counterSubmitting ? "Sending..." : "Send Counter Offer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}