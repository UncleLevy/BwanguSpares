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
    pending: "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-400",
    confirmed: "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-400",
    shipped: "bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-400",
    delivered: "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-400",
  };

  if (loading) return <div className="text-slate-500 dark:text-slate-400">Loading shipping stats...</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Pending Shipments</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">{stats.pending}</p>
            </div>
            <Clock className="w-8 h-8 text-blue-400 dark:text-blue-500" />
          </div>
        </Card>
        
        <Card className="p-4 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">In Transit</p>
              <p className="text-2xl font-bold text-orange-900 dark:text-orange-300">{stats.shipped}</p>
            </div>
            <Truck className="w-8 h-8 text-orange-400 dark:text-orange-500" />
          </div>
        </Card>
        
        <Card className="p-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-green-600 dark:text-green-400 font-medium">Delivered</p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-300">{stats.delivered}</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-green-400 dark:text-green-500" />
          </div>
        </Card>
        
        <Card className="p-4 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">Shipping Revenue</p>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-300">K{stats.revenue.toFixed(2)}</p>
            </div>
            <Package className="w-8 h-8 text-purple-400 dark:text-purple-500" />
          </div>
        </Card>
      </div>

      <Card className="p-4 dark:bg-slate-900 dark:border-slate-700">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Recent Shipments</h3>
        <div className="space-y-3">
          {recent.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No deliveries yet</p>
          ) : (
            recent.map(order => (
              <div key={order.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div>
                  <p className="font-medium text-sm text-slate-900 dark:text-slate-100">{order.buyer_name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{order.delivery_address}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium px-2 py-1 rounded ${statusColors[order.status]}`}>
                    {order.status}
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">K{order.shipping_cost || 0}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}