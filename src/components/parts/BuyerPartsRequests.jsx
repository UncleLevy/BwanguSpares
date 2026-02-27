import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileSearch, Store, Phone, Clock, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

const statusConfig = {
  open: { label: "Waiting for shops", color: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock },
  accepted: { label: "Accepted by shop", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  fulfilled: { label: "Fulfilled", color: "bg-blue-50 text-blue-700 border-blue-200", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "bg-slate-100 text-slate-500 border-slate-200", icon: XCircle },
};

export default function BuyerPartsRequests({ user, onNewRequest }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">My Parts Requests</h1>
        <Button onClick={onNewRequest} className="bg-blue-600 hover:bg-blue-700 gap-2">
          <FileSearch className="w-4 h-4" /> New Request
        </Button>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-20">
          <FileSearch className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h3 className="font-semibold text-slate-700">No parts requests yet</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">
            Can't find a part in the marketplace? Submit a request and verified shops will contact you.
          </p>
          <Button onClick={onNewRequest} className="mt-4 bg-blue-600 hover:bg-blue-700">
            Submit a Request
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map(req => {
            const sc = statusConfig[req.status] || statusConfig.open;
            return (
              <Card key={req.id} className="border-slate-100">
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold text-slate-900">{req.part_name}</h3>
                        <Badge className={`${sc.color} text-xs border`}>
                          <sc.icon className="w-3 h-3 mr-1" />
                          {sc.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400">
                        Submitted {new Date(req.created_date).toLocaleDateString()}
                        {req.category && ` • ${req.category.replace("_", " ")}`}
                        {req.compatible_vehicles && ` • ${req.compatible_vehicles}`}
                      </p>
                      {req.description && (
                        <p className="text-sm text-slate-600 mt-1.5">{req.description}</p>
                      )}
                      {req.budget && (
                        <p className="text-xs text-slate-500 mt-1">Budget: K{req.budget.toLocaleString()}</p>
                      )}
                    </div>
                    {req.status === "open" && (
                      <Button
                        size="sm" variant="outline"
                        onClick={() => cancelRequest(req)}
                        className="text-red-600 border-red-100 hover:bg-red-50 shrink-0"
                      >
                        Cancel
                      </Button>
                    )}
                  </div>

                  {req.status === "accepted" && (
                    <div className="mt-3 p-3.5 bg-emerald-50 rounded-xl border border-emerald-100">
                      <p className="text-sm font-medium text-emerald-800 flex items-center gap-2">
                        <Store className="w-4 h-4" />
                        <strong>{req.accepted_by_shop_name}</strong> has accepted your request!
                      </p>
                      {req.accepted_by_shop_phone && (
                        <p className="text-sm text-emerald-700 mt-1.5 flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5" />
                          Call them: <strong>{req.accepted_by_shop_phone}</strong>
                        </p>
                      )}
                      <p className="text-xs text-emerald-600 mt-1">
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