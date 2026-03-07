import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Gift, TrendingUp, DollarSign } from "lucide-react";
import StatsCard from "@/components/analytics/StatsCard";

export default function DiscountMetricsSection({ metrics }) {
  if (!metrics.totalCodes) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center">
        <Gift className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <p className="text-slate-600 dark:text-slate-400">No discount codes created yet</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          title="Total Codes"
          value={metrics.totalCodes}
          icon={Gift}
          color="bg-pink-100 dark:bg-pink-900"
        />
        <StatsCard
          title="Total Redemptions"
          value={metrics.totalRedemptions}
          icon={Gift}
          color="bg-green-100 dark:bg-green-900"
        />
        <StatsCard
          title="Redemption Rate"
          value={`${metrics.redemptionRate}%`}
          icon={TrendingUp}
          color="bg-blue-100 dark:bg-blue-900"
        />
        <StatsCard
          title="Revenue from Discounts"
          value={`ZMW ${Math.round(metrics.revenueFromDiscounts).toLocaleString()}`}
          icon={DollarSign}
          color="bg-emerald-100 dark:bg-emerald-900"
        />
      </div>

      {metrics.chartData && metrics.chartData.length > 0 && (
        <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg dark:text-slate-100">Top Discount Codes</CardTitle>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Most used discount codes</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={metrics.chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.2)" vertical={false} />
                <XAxis dataKey="code" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: 'none', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }}
                  labelStyle={{ color: '#fff' }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="uses" fill="#8b5cf6" name="Uses" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </>
  );
}