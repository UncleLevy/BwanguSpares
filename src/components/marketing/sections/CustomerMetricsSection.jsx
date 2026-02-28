import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Users, DollarSign, TrendingUp, ShoppingCart } from "lucide-react";
import StatsCard from "@/components/analytics/StatsCard";

export default function CustomerMetricsSection({ metrics }) {
  if (!metrics.totalCustomers) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center">
        <Users className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <p className="text-slate-600 dark:text-slate-400">No customer data available</p>
      </div>
    );
  }

  const clvCacRatio = metrics.cac > 0 ? (metrics.clv / metrics.cac).toFixed(1) : 0;
  const isHealthyRatio = clvCacRatio >= 3;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          title="Total Customers"
          value={metrics.totalCustomers?.toLocaleString()}
          icon={Users}
          color="bg-blue-100 dark:bg-blue-900"
        />
        <StatsCard
          title="Customer Acquisition Cost"
          value={`ZMW ${metrics.cac}`}
          icon={DollarSign}
          color="bg-red-100 dark:bg-red-900"
        />
        <StatsCard
          title="Customer Lifetime Value"
          value={`ZMW ${metrics.clv}`}
          icon={DollarSign}
          color="bg-green-100 dark:bg-green-900"
        />
        <StatsCard
          title="Avg Order Value"
          value={`ZMW ${metrics.avgOrderValue}`}
          icon={TrendingUp}
          color="bg-cyan-100 dark:bg-cyan-900"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {metrics.chartData && metrics.chartData.length > 0 && (
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Monthly Revenue Trend</CardTitle>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Total revenue over time</p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={metrics.chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1e293b', 
                        border: 'none', 
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                      }}
                      labelStyle={{ color: '#fff' }}
                      formatter={(value) => `ZMW ${value.toLocaleString()}`}
                    />
                    <Line type="monotone" dataKey="revenue" stroke="#0891b2" strokeWidth={2.5} dot={{ fill: '#0891b2', r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

        <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Key Metrics</CardTitle>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Summary statistics</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <MetricRow
              label="Total Revenue"
              value={`ZMW ${metrics.totalRevenue?.toLocaleString()}`}
              icon={DollarSign}
            />
            <MetricRow
              label="Total Orders"
              value={metrics.totalOrders}
              icon={ShoppingCart}
            />
            <MetricRow
              label="CLV/CAC Ratio"
              value={`${clvCacRatio}x`}
              icon={TrendingUp}
              isHighlight={isHealthyRatio}
              highlightColor="text-green-600"
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function MetricRow({ label, value, icon: Icon, isHighlight = false, highlightColor = "text-blue-600" }) {
  return (
    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-slate-500" />
        <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>
      </div>
      <span className={`text-sm font-semibold ${isHighlight ? highlightColor : 'text-slate-900 dark:text-slate-100'}`}>
        {value}
      </span>
    </div>
  );
}