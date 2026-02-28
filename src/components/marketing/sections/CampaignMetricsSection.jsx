import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Mail, Users, TrendingUp } from "lucide-react";
import StatsCard from "@/components/analytics/StatsCard";

export default function CampaignMetricsSection({ metrics }) {
  if (!metrics.totalSent) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center">
        <Mail className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <p className="text-slate-600 dark:text-slate-400">No campaigns sent yet</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          title="Campaigns Sent"
          value={metrics.totalSent}
          icon={Mail}
          color="bg-blue-100 dark:bg-blue-900"
        />
        <StatsCard
          title="Total Recipients"
          value={metrics.totalRecipients?.toLocaleString()}
          icon={Users}
          color="bg-purple-100 dark:bg-purple-900"
        />
        <StatsCard
          title="Avg Open Rate"
          value={`${metrics.avgOpenRate}%`}
          icon={Mail}
          color="bg-green-100 dark:bg-green-900"
        />
        <StatsCard
          title="Avg Click Rate"
          value={`${metrics.avgClickRate}%`}
          icon={TrendingUp}
          color="bg-orange-100 dark:bg-orange-900"
        />
      </div>

      {metrics.chartData && metrics.chartData.length > 0 && (
        <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Campaign Performance Overview</CardTitle>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Opens and clicks by campaign</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={metrics.chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
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
                <Bar dataKey="opens" fill="#0891b2" name="Opens" radius={[8, 8, 0, 0]} />
                <Bar dataKey="clicks" fill="#06b6d4" name="Clicks" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </>
  );
}