import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

export default function DailySalesChart({ shopId }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const orders = await base44.entities.Order.filter({ shop_id: shopId }, "-created_date", 100);
        
        // Group orders by date
        const dailySales = {};
        orders.forEach(order => {
          const date = new Date(order.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          if (!dailySales[date]) {
            dailySales[date] = 0;
          }
          dailySales[date] += order.total_amount || 0;
        });

        // Convert to array and sort by date
        const chartData = Object.entries(dailySales)
          .map(([date, amount]) => ({
            date,
            amount: Math.round(amount),
          }))
          .sort((a, b) => new Date(a.date) - new Date(b.date))
          .slice(-7); // Last 7 days

        setData(chartData);
      } catch (error) {
        console.error("Failed to load sales data:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, [shopId]);

  if (loading) {
    return (
      <Card className="bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Daily Sales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  const totalSales = data.reduce((sum, d) => sum + d.amount, 0);
  const avgSales = data.length > 0 ? Math.round(totalSales / data.length) : 0;

  return (
    <Card className="bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Daily Sales
            </CardTitle>
            <CardDescription>Last 7 days performance</CardDescription>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">K{totalSales.toLocaleString()}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Avg: K{avgSales.toLocaleString()}/day</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f1f5f9' }}
                formatter={(value) => `K${value.toLocaleString()}`}
              />
              <Bar dataKey="amount" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-80 flex items-center justify-center text-slate-500">
            No sales data yet
          </div>
        )}
      </CardContent>
    </Card>
  );
}