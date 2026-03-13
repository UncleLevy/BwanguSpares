import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, Clock, Package, Star, AlertCircle, Award, Truck, Target } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export default function CourierPerformancePanel({ shop }) {
  const [loading, setLoading] = useState(true);
  const [couriers, setCouriers] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [timeRange, setTimeRange] = useState("30"); // days
  const [selectedCourier, setSelectedCourier] = useState("all");

  useEffect(() => {
    loadData();
  }, [timeRange, selectedCourier]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Get all couriers for this shop
      const couriersData = await base44.entities.Courier.filter({ shop_id: shop.id });
      setCouriers(couriersData);

      // Get shipments for the selected time range
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - parseInt(timeRange));
      
      const shipmentsData = await base44.entities.Shipment.filter({ shop_id: shop.id });
      const filteredShipments = shipmentsData.filter(s => {
        const createdDate = new Date(s.created_date);
        return createdDate >= cutoffDate;
      });

      setShipments(filteredShipments);
      calculateMetrics(couriersData, filteredShipments);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = (couriersData, shipmentsData) => {
    const courierMetrics = {};

    couriersData.forEach(courier => {
      const courierShipments = shipmentsData.filter(s => 
        s.current_courier_id === courier.id || 
        s.local_courier_id === courier.id || 
        s.intercity_courier_id === courier.id
      );

      const deliveredShipments = courierShipments.filter(s => s.status === "delivered");
      const totalShipments = courierShipments.length;

      // On-time delivery rate
      const onTimeDeliveries = deliveredShipments.filter(s => {
        if (!s.estimated_delivery_date || !s.actual_delivery_date) return false;
        const estimated = new Date(s.estimated_delivery_date);
        const actual = new Date(s.actual_delivery_date);
        return actual <= estimated;
      });

      const onTimeRate = deliveredShipments.length > 0 
        ? (onTimeDeliveries.length / deliveredShipments.length) * 100 
        : 0;

      // Average delivery time (in hours)
      const deliveryTimes = deliveredShipments
        .filter(s => s.pickup_time && s.actual_delivery_date)
        .map(s => {
          const pickup = new Date(s.pickup_time);
          const delivery = new Date(s.actual_delivery_date);
          return (delivery - pickup) / (1000 * 60 * 60); // hours
        });

      const avgDeliveryTime = deliveryTimes.length > 0
        ? deliveryTimes.reduce((a, b) => a + b, 0) / deliveryTimes.length
        : 0;

      // Failed deliveries
      const failedDeliveries = courierShipments.filter(s => s.status === "failed").length;
      const failureRate = totalShipments > 0 ? (failedDeliveries / totalShipments) * 100 : 0;

      // Success rate
      const successRate = totalShipments > 0 ? (deliveredShipments.length / totalShipments) * 100 : 0;

      // Revenue generated
      const totalRevenue = courierShipments.reduce((sum, s) => sum + (s.shipping_cost || 0), 0);

      courierMetrics[courier.id] = {
        courier,
        totalShipments,
        deliveredShipments: deliveredShipments.length,
        failedDeliveries,
        onTimeRate: onTimeRate.toFixed(1),
        avgDeliveryTime: avgDeliveryTime.toFixed(1),
        failureRate: failureRate.toFixed(1),
        successRate: successRate.toFixed(1),
        rating: courier.rating || 0,
        totalRevenue,
        shipments: courierShipments
      };
    });

    setMetrics(courierMetrics);
  };

  const getOverallMetrics = () => {
    const allMetrics = Object.values(metrics);
    if (allMetrics.length === 0) return null;

    const totalShipments = allMetrics.reduce((sum, m) => sum + m.totalShipments, 0);
    const totalDelivered = allMetrics.reduce((sum, m) => sum + m.deliveredShipments, 0);
    const totalFailed = allMetrics.reduce((sum, m) => sum + m.failedDeliveries, 0);
    const avgOnTime = allMetrics.reduce((sum, m) => sum + parseFloat(m.onTimeRate), 0) / allMetrics.length;
    const avgTime = allMetrics.reduce((sum, m) => sum + parseFloat(m.avgDeliveryTime), 0) / allMetrics.length;
    const totalRevenue = allMetrics.reduce((sum, m) => sum + m.totalRevenue, 0);

    return {
      totalShipments,
      totalDelivered,
      totalFailed,
      avgOnTime: avgOnTime.toFixed(1),
      avgTime: avgTime.toFixed(1),
      successRate: totalShipments > 0 ? ((totalDelivered / totalShipments) * 100).toFixed(1) : 0,
      totalRevenue
    };
  };

  const getTopPerformers = () => {
    return Object.values(metrics)
      .sort((a, b) => parseFloat(b.onTimeRate) - parseFloat(a.onTimeRate))
      .slice(0, 3);
  };

  const getCourierComparisonData = () => {
    return Object.values(metrics).map(m => ({
      name: m.courier.full_name.split(' ')[0],
      onTime: parseFloat(m.onTimeRate),
      avgTime: parseFloat(m.avgDeliveryTime),
      success: parseFloat(m.successRate),
      deliveries: m.totalShipments
    }));
  };

  const getDeliveryStatusData = () => {
    const overall = getOverallMetrics();
    if (!overall) return [];
    
    return [
      { name: "Delivered", value: overall.totalDelivered, color: "#10b981" },
      { name: "Failed", value: overall.totalFailed, color: "#ef4444" },
      { name: "In Progress", value: overall.totalShipments - overall.totalDelivered - overall.totalFailed, color: "#f59e0b" }
    ];
  };

  const filteredMetrics = selectedCourier === "all" 
    ? Object.values(metrics) 
    : Object.values(metrics).filter(m => m.courier.id === selectedCourier);

  const overall = getOverallMetrics();
  const topPerformers = getTopPerformers();
  const comparisonData = getCourierComparisonData();
  const statusData = getDeliveryStatusData();

  if (loading) {
    return <div className="text-center py-8 text-slate-500">Loading performance data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedCourier} onValueChange={setSelectedCourier}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Couriers</SelectItem>
              {couriers.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={loadData} variant="outline" size="sm">
          Refresh Data
        </Button>
      </div>

      {/* Overall Metrics */}
      {overall && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Deliveries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{overall.totalShipments}</p>
                  <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1 mt-1">
                    <Package className="w-3 h-3" />
                    {overall.totalDelivered} completed
                  </p>
                </div>
                <Package className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">On-Time Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{overall.avgOnTime}%</p>
                  <p className={`text-xs flex items-center gap-1 mt-1 ${parseFloat(overall.avgOnTime) >= 80 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                    {parseFloat(overall.avgOnTime) >= 80 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {parseFloat(overall.avgOnTime) >= 80 ? "Excellent" : "Needs improvement"}
                  </p>
                </div>
                <Target className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Avg Delivery Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{overall.avgTime}h</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3" />
                    Average duration
                  </p>
                </div>
                <Clock className="w-8 h-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Success Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{overall.successRate}%</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3" />
                    {overall.totalFailed} failed
                  </p>
                </div>
                <Star className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="couriers">Courier Details</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top Performers */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-500" />
                  Top Performers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {topPerformers.length > 0 ? topPerformers.map((m, idx) => (
                  <div key={m.courier.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${idx === 0 ? "bg-yellow-500" : idx === 1 ? "bg-slate-400" : "bg-amber-600"}`}>
                        {idx + 1}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-slate-100">{m.courier.full_name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{m.totalShipments} deliveries</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600 dark:text-green-400">{m.onTimeRate}%</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">On-time</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">No data available</p>
                )}
              </CardContent>
            </Card>

            {/* Delivery Status Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Delivery Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-4">
                  {statusData.map(s => (
                    <div key={s.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }}></div>
                      <span className="text-xs text-slate-600 dark:text-slate-400">{s.name}: {s.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Courier Comparison Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Courier Performance Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="onTime" fill="#10b981" name="On-Time Rate %" />
                  <Bar dataKey="success" fill="#3b82f6" name="Success Rate %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Courier Details Tab */}
        <TabsContent value="couriers" className="space-y-4">
          <div className="grid gap-4">
            {filteredMetrics.map(m => (
              <Card key={m.courier.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <Truck className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{m.courier.full_name}</CardTitle>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {m.courier.vehicle_type} • {m.courier.courier_type}
                        </p>
                      </div>
                    </div>
                    <Badge className={parseFloat(m.onTimeRate) >= 80 ? "bg-green-600" : "bg-yellow-600"}>
                      {parseFloat(m.onTimeRate) >= 80 ? "Excellent" : "Good"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Total Deliveries</p>
                      <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{m.totalShipments}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">On-Time Rate</p>
                      <p className="text-xl font-bold text-green-600 dark:text-green-400">{m.onTimeRate}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Avg Time</p>
                      <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{m.avgDeliveryTime}h</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Success Rate</p>
                      <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{m.successRate}%</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Completed</p>
                      <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{m.deliveredShipments}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Failed</p>
                      <p className="text-lg font-semibold text-red-600 dark:text-red-400">{m.failedDeliveries}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Revenue</p>
                      <p className="text-lg font-semibold text-purple-600 dark:text-purple-400">K{m.totalRevenue.toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Delivery Time Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="avgTime" stroke="#f59e0b" name="Avg Delivery Time (h)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Performance Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {overall && (
                  <>
                    <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm text-slate-900 dark:text-slate-100">Strong On-Time Performance</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                          Your fleet maintains a {overall.avgOnTime}% on-time delivery rate
                        </p>
                      </div>
                    </div>

                    {parseFloat(overall.avgOnTime) < 70 && (
                      <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-sm text-slate-900 dark:text-slate-100">Improvement Needed</p>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                            Consider reviewing courier routes and delivery schedules
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                      <Package className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm text-slate-900 dark:text-slate-100">Total Volume</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                          Handled {overall.totalShipments} shipments in the selected period
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recommendations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <p className="font-medium text-slate-900 dark:text-slate-100 mb-1">🎯 Optimize Routes</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Use delivery time data to identify and optimize slow routes
                  </p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <p className="font-medium text-slate-900 dark:text-slate-100 mb-1">⭐ Reward Top Performers</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Recognize couriers with high on-time rates to boost morale
                  </p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <p className="font-medium text-slate-900 dark:text-slate-100 mb-1">📊 Track Trends</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Monitor performance weekly to catch issues early
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}