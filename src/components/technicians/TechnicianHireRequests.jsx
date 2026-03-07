import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Wrench } from "lucide-react";
import { emailHireRequestResponseToBuyer } from "@/components/lib/emailNotifications";

const statusColors = {
  pending:        "bg-amber-50 text-amber-700",
  counter_offered:"bg-purple-50 text-purple-700",
  accepted:       "bg-emerald-50 text-emerald-700",
  rejected:       "bg-red-50 text-red-700",
  completed:      "bg-blue-50 text-blue-700",
};

const statusLabels = {
  pending:         "Pending",
  counter_offered: "Counter Offered",
  accepted:        "Accepted",
  rejected:        "Rejected",
  completed:       "Completed",
};

const problemLabels = {
  engine: "Engine", electrical: "Electrical", body_work: "Body Work", transmission: "Transmission",
  brakes: "Brakes", general: "General", diagnostics: "Diagnostics", ac_heating: "AC/Heating", tyres: "Tyres"
};

export default function TechnicianHireRequests({ shop }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [respondDialog, setRespondDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [responseText, setResponseText] = useState("");
  const [responseStatus, setResponseStatus] = useState("accepted");
  const [counterBudget, setCounterBudget] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!shop?.id) return;
    loadRequests();
    const unsub = base44.entities.TechnicianHireRequest.subscribe(() => loadRequests());
    return unsub;
  }, [shop?.id]);

  const loadRequests = async () => {
    const r = await base44.entities.TechnicianHireRequest.filter({ shop_id: shop.id }, "-created_date", 50);
    setRequests(r);
    setLoading(false);
  };

  const openRespond = (req) => {
    setSelectedRequest(req);
    setResponseText("");
    setResponseStatus("accepted");
    setCounterBudget("");
    setRespondDialog(true);
  };

  const submitResponse = async () => {
    if (responseStatus === "counter_offered" && (!counterBudget || isNaN(parseFloat(counterBudget)))) {
      toast.error("Please enter a valid counter budget");
      return;
    }
    setSubmitting(true);
    const updateData = {
      status: responseStatus,
      shop_response: responseText,
    };
    if (responseStatus === "counter_offered") {
      updateData.shop_counter_budget = parseFloat(counterBudget);
    }
    await base44.entities.TechnicianHireRequest.update(selectedRequest.id, updateData);
    setRequests(requests.map(r => r.id === selectedRequest.id ? { ...r, ...updateData } : r));

    // Notify buyer
    const notifMessages = {
    accepted:        { title: "Hire Request Accepted!", message: `${shop.name} has accepted your hire request for ${selectedRequest.technician_name}.${responseText ? ` Message: "${responseText}"` : ""}` },
    counter_offered: { title: "Counter Offer on Hire Request", message: `${shop.name} has sent a counter offer of K${parseFloat(counterBudget).toLocaleString()} for ${selectedRequest.technician_name}.${responseText ? ` "${responseText}"` : ""}` },
    rejected:        { title: "Hire Request Declined", message: `${shop.name} has declined your hire request for ${selectedRequest.technician_name}.${responseText ? ` Reason: "${responseText}"` : ""}` },
    };
    const notif = notifMessages[responseStatus];
    if (notif) {
    await base44.entities.Notification.create({
      user_email: selectedRequest.buyer_email,
      type: "system_alert",
      title: notif.title,
      message: notif.message,
      related_id: selectedRequest.id,
      action_url: "BuyerDashboard?view=technician_requests",
    });
    }

    emailHireRequestResponseToBuyer(selectedRequest.buyer_email, selectedRequest.buyer_name, shop.name, responseStatus, responseStatus === "counter_offered" ? parseFloat(counterBudget) : null, responseText);
    toast.success("Response sent to customer");
    setRespondDialog(false);
    setSubmitting(false);
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">Technician Hire Requests</h1>

      {requests.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Wrench className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p>No hire requests yet</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-800">
                <TableHead>Customer</TableHead>
                <TableHead>Technician</TableHead>
                <TableHead>Problem</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map(req => (
                <TableRow key={req.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{req.buyer_name}</p>
                      <p className="text-xs text-slate-500">{req.buyer_phone || req.buyer_email}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{req.technician_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[11px]">{problemLabels[req.problem_type] || req.problem_type}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {req.buyer_budget ? (
                      <div>
                        <p className="text-slate-700 dark:text-slate-300">K{req.buyer_budget.toLocaleString()}</p>
                        {req.shop_counter_budget && (
                          <p className="text-xs text-purple-600 font-medium">Counter: K{req.shop_counter_budget.toLocaleString()}</p>
                        )}
                      </div>
                    ) : "—"}
                  </TableCell>
                  <TableCell className="text-sm text-slate-500">{req.preferred_date || "—"}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[req.status]}>{statusLabels[req.status] || req.status}</Badge>
                    {req.status === "counter_offered" && req.buyer_response && (
                      <p className="text-xs text-slate-500 mt-1">Buyer: {req.buyer_response === "declined" ? "❌ Declined" : "✓ Agreed"}</p>
                    )}
                  </TableCell>
                  <TableCell>
                    {req.status === "pending" && (
                      <Button size="sm" variant="outline" onClick={() => openRespond(req)}>Respond</Button>
                    )}
                    {req.status === "counter_offered" && (
                      <span className="text-xs text-purple-600 italic">Awaiting buyer...</span>
                    )}
                    {req.status !== "pending" && req.status !== "counter_offered" && req.shop_response && (
                      <span className="text-xs text-slate-400 italic line-clamp-1 max-w-[120px]">"{req.shop_response.slice(0, 30)}"</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={respondDialog} onOpenChange={setRespondDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Respond to Hire Request</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm space-y-1">
              <p className="font-medium">{selectedRequest?.buyer_name}</p>
              <p className="text-slate-500">{selectedRequest?.description}</p>
              {selectedRequest?.buyer_budget && (
                <p className="text-blue-600 font-medium text-xs">Customer Budget: K{selectedRequest.buyer_budget.toLocaleString()}</p>
              )}
            </div>
            <div>
              <Label>Decision</Label>
              <div className="flex gap-2 mt-2 flex-wrap">
                <Button size="sm" onClick={() => setResponseStatus("accepted")}
                  className={responseStatus === "accepted" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}
                  variant={responseStatus === "accepted" ? "default" : "outline"}>Accept</Button>
                <Button size="sm" onClick={() => setResponseStatus("counter_offered")}
                  className={responseStatus === "counter_offered" ? "bg-purple-600 hover:bg-purple-700 text-white" : ""}
                  variant={responseStatus === "counter_offered" ? "default" : "outline"}>Counter Offer</Button>
                <Button size="sm" onClick={() => setResponseStatus("rejected")}
                  className={responseStatus === "rejected" ? "bg-red-600 hover:bg-red-700 text-white" : ""}
                  variant={responseStatus === "rejected" ? "default" : "outline"}>Decline</Button>
              </div>
            </div>

            {responseStatus === "counter_offered" && (
              <div>
                <Label>Your Counter Budget (ZMW) *</Label>
                <Input
                  type="number"
                  min="0"
                  value={counterBudget}
                  onChange={e => setCounterBudget(e.target.value)}
                  className="mt-1"
                  placeholder="e.g. 500"
                />
              </div>
            )}

            <div>
              <Label>Message to Customer {responseStatus === "counter_offered" ? "(explain your pricing)" : "(optional)"}</Label>
              <Textarea value={responseText} onChange={e => setResponseText(e.target.value)} className="mt-1" rows={3}
                placeholder={responseStatus === "counter_offered"
                  ? "e.g. Based on the work required, our rate is K500 which covers parts and labour..."
                  : "e.g. We'll be available on that date, please come at 9am..."
                } />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRespondDialog(false)}>Cancel</Button>
            <Button onClick={submitResponse} disabled={submitting} className="bg-blue-600 hover:bg-blue-700">
              {submitting ? "Sending..." : "Send Response"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}