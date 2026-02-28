import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { TrendingUp, Car, MapPin, Package, FileSearch, ShoppingCart, Crown } from "lucide-react";
import { subDays, isAfter, parseISO } from "date-fns";

const COLORS = ["#0891b2", "#7c3aed", "#059669", "#d97706", "#dc2626", "#0284c7", "#65a30d", "#9333ea"];

const PERIOD_OPTIONS = [
  { label: "Last 7 days", value: "7" },
  { label: "Last 30 days", value: "30" },
  { label: "Last 90 days", value: "90" },
  { label: "Last 6 months", value: "180" },
  { label: "All time", value: "all" },
];

export default function MarketInsights({ shop }) {
  const [period, setPeriod] = useState("30");
  const [requests, setRequests] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [reqs, ords] = await Promise.all([
        base44.entities.PartsRequest.list("-created_date", 500),
        base44.entities.Order.list("-created_date", 500),
      ]);
      setRequests(reqs);
      setOrders(ords);
      setLoading(false);
    })();
  }, []);

  const filterByPeriod = (items) => {
    if (!items || items.length === 0) return [];
    if (period === "all") return items;
    const cutoff = subDays(new Date(), parseInt(period));
    return items.filter(item => {
      if (!item.created_date) return false;
      try {
        return isAfter(parseISO(item.created_date), cutoff);
      } catch {
        return false;
      }
    });
  };

  const filteredRequests = filterByPeriod(requests);
  const filteredOrders = filterByPeriod(orders);

  // --- Demand: top requested parts ---
  const partDemand = {};
  filteredRequests.forEach(r => {
    const key = r.part_name?.trim().toLowerCase();
    if (!key) return;
    if (!partDemand[key]) partDemand[key] = { name: r.part_name, count: 0, category: r.category };
    partDemand[key].count++;
  });
  const topRequestedParts = Object.values(partDemand).sort((a, b) => b.count - a.count).slice(0, 10);

  // --- Category demand from requests ---
  const categoryDemand = {};
  filteredRequests.forEach(r => {
    const cat = r.category || "other";
    categoryDemand[cat] = (categoryDemand[cat] || 0) + 1;
  });
  const categoryDemandData = Object.entries(categoryDemand)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, value]) => ({ name: name.replace(/_/g, " "), value }));

  // --- Most bought products (from orders) ---
  const productSales = {};
  filteredOrders.forEach(order => {
    order.items?.forEach(item => {
      const key = item.product_name?.trim().toLowerCase();
      if (!key) return;
      if (!productSales[key]) productSales[key] = { name: item.product_name, count: 0 };
      productSales[key].count += item.quantity || 1;
    });
  });
  const topBoughtProducts = Object.values(productSales).sort((a, b) => b.count - a.count).slice(0, 10);

  // --- Vehicles per region/town (from requests) ---
  // We extract vehicle mentions and group by region (from shop data associated with orders)
  const vehiclesByRegion = {};
  filteredRequests.forEach(r => {
    if (!r.compatible_vehicles) return;
    // Use buyer_region if available; otherwise "Unknown"
    const region = r.buyer_region || "Unknown Region";
    if (!vehiclesByRegion[region]) vehiclesByRegion[region] = {};
    const vehicle = r.compatible_vehicles.trim();
    vehiclesByRegion[region][vehicle] = (vehiclesByRegion[region][vehicle] || 0) + 1;
  });

  // Also get vehicles from orders using shop region
  const shopRegionMap = {};
  filteredOrders.forEach(order => {
    // We don't have buyer region on orders easily, so we'll use the shop's region
    if (!order.shop_name) return;
  });

  // Flatten vehicles by region for chart
  const vehicleRegionFlat = [];
  Object.entries(vehiclesByRegion).forEach(([region, vehicles]) => {
    Object.entries(vehicles).forEach(([vehicle, count]) => {
      vehicleRegionFlat.push({ region, vehicle, count });
    });
  });
  vehicleRegionFlat.sort((a, b) => b.count - a.count);

  // Top vehicles overall
  const vehicleTotals = {};
  filteredRequests.forEach(r => {
    if (!r.compatible_vehicles) return;
    const v = r.compatible_vehicles.trim();
    vehicleTotals[v] = (vehicleTotals[v] || 0) + 1;
  });
  const topVehicles = Object.entries(vehicleTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, value]) => ({ name, value }));

  if (shop?.slot_type === "basic") {
    return (
      <div className="text-center py-20">
        <Crown className="w-16 h-16 text-amber-300 mx-auto mb-4" />
        <h3 className="font-semibold text-slate-700 text-lg">Upgrade to Access Market Insights</h3>
        <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">
          Market insights are available to <strong>Standard</strong> and <strong>Premium</strong> shops. Upgrade to see demand trends, top requested parts, and more.
        </p>
      </div>
    );
  }

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" /></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Market Insights</h1>
          <p className="text-sm text-slate-500 mt-0.5">Demand trends, top parts, and vehicle data across the marketplace</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIOD_OPTIONS.map(o => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Parts Requested", value: filteredRequests.length, icon: FileSearch, color: "bg-blue-50 text-blue-600" },
          { label: "Orders Placed", value: filteredOrders.length, icon: ShoppingCart, color: "bg-emerald-50 text-emerald-600" },
          { label: "Unique Parts Sought", value: Object.keys(partDemand).length, icon: Package, color: "bg-purple-50 text-purple-600" },
          { label: "Vehicle Types", value: Object.keys(vehicleTotals).length, icon: Car, color: "bg-amber-50 text-amber-600" },
        ].map((s, i) => (
          <Card key={i} className="border-slate-100">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${s.color}`}>
                <s.icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-900">{s.value}</p>
                <p className="text-xs text-slate-500 leading-tight">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Top Requested Parts */}
        <Card className="border-slate-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" /> Top Requested Parts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topRequestedParts.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No data for this period</p>
            ) : (
              <div className="space-y-2">
                {topRequestedParts.map((part, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-bold text-slate-400 w-5">{i + 1}</span>
                      <span className="text-slate-700 truncate">{part.name}</span>
                      {part.category && (
                        <Badge variant="outline" className="text-[10px] capitalize flex-shrink-0">
                          {part.category.replace(/_/g, " ")}
                        </Badge>
                      )}
                    </div>
                    <span className="font-semibold text-blue-600 flex-shrink-0 ml-2">{part.count}×</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category Demand Pie */}
        <Card className="border-slate-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Package className="w-4 h-4 text-purple-500" /> Demand by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categoryDemandData.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No data for this period</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={categoryDemandData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                    {categoryDemandData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Most Bought Products */}
        <Card className="border-slate-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-emerald-500" /> Most Purchased Parts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topBoughtProducts.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No sales data for this period</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={topBoughtProducts} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#059669" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top Vehicles */}
        <Card className="border-slate-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Car className="w-4 h-4 text-amber-500" /> Most Requested Vehicles
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topVehicles.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No vehicle data for this period</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={topVehicles} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={140} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#d97706" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Vehicles by Region table */}
      <Card className="border-slate-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-red-500" /> Vehicle Demand by Region / Town
          </CardTitle>
        </CardHeader>
        <CardContent>
          {vehicleRegionFlat.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">
              No regional data yet — this will populate as buyers include their location when submitting requests.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left">
                    <th className="pb-2 text-xs font-semibold text-slate-500">Region / Town</th>
                    <th className="pb-2 text-xs font-semibold text-slate-500">Vehicle</th>
                    <th className="pb-2 text-xs font-semibold text-slate-500 text-right">Requests</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicleRegionFlat.slice(0, 20).map((row, i) => (
                    <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-2 text-slate-600">{row.region}</td>
                      <td className="py-2 text-slate-700 font-medium">{row.vehicle}</td>
                      <td className="py-2 text-right font-semibold text-blue-600">{row.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}