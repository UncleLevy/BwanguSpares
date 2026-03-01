import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Truck, Package, CheckCircle2, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function ShippingStats({ shopId }) {
  const [stats, setStats] = useState({
    pending: 0,
    shipped: 0,
    delivered: 0,
    revenue: 0,
  });
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
    const unsubscribe = base44.entities.Order.subscribe(() => loadStats());
    return unsubscribe;
  }, [shopId]);

  const loadStats = async () => {
    const orders = await base44.entities.Order.filter({ shop_id: shopId }, "-created_date", 100);
    
    let stats = { pending: 0, shipped: 0, delivered: 0, revenue: 0 };
    
    orders.forEach(o => {
      if (o.shipping_option === "deliver") {
        const cost = o.shipping_cost || 0;
        stats.revenue += cost;
        
        if (o.status === "pending" || o.status === "confirmed") {
          stats.pending++;
        } else if (o.status === "shipped") {
          stats.shipped++;
        } else if (o.status === "delivered") {
          stats.delivered++;
        }
      }
    });

    setStats(stats);
    setRecent(orders.filter(o => o.shipping_option === "deliver").slice(0, 5));
    setLoading(false);
  };

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-yellow-100 text-yellow-800",
    shipped: "bg-blue-100 text-blue-800",
    delivered: "bg-green-100 text-green-800",
  };

  if (loading) return <div className="text-slate-500">Loading shipping stats...</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-600 font-medium">Pending Shipments</p>
              <p className="text-2xl font-bold text-blue-900">{stats.pending}</p>
            </div>
            <Clock className="w-8 h-8 text-blue-400" />
          </div>
        </Card>
        
        <Card className="p-4 bg-orange-50 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-orange-600 font-medium">In Transit</p>
              <p className="text-2xl font-bold text-orange-900">{stats.shipped}</p>
            </div>
            <Truck className="w-8 h-8 text-orange-400" />
          </div>
        </Card>
        
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-green-600 font-medium">Delivered</p>
              <p className="text-2xl font-bold text-green-900">{stats.delivered}</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-green-400" />
          </div>
        </Card>
        
        <Card className="p-4 bg-purple-50 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-purple-600 font-medium">Shipping Revenue</p>
              <p className="text-2xl font-bold text-purple-900">K{stats.revenue.toFixed(2)}</p>
            </div>
            <Package className="w-8 h-8 text-purple-400" />
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <h3 className="font-semibold text-slate-900 mb-4">Recent Shipments</h3>
        <div className="space-y-3">
          {recent.length === 0 ? (
            <p className="text-sm text-slate-500">No deliveries yet</p>
          ) : (
            recent.map(order => (
              <div key={order.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium text-sm text-slate-900">{order.buyer_name}</p>
                  <p className="text-xs text-slate-500">{order.delivery_address}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium px-2 py-1 rounded ${statusColors[order.status]}`}>
                    {order.status}
                  </span>
                  <span className="font-semibold text-slate-900">K{order.shipping_cost || 0}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}