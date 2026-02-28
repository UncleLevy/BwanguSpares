import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, Mail, Gift, Users, DollarSign } from "lucide-react";
import StatsCard from "@/components/analytics/StatsCard";

export default function MarketingAnalyticsDashboard({ shopId, campaigns = [], orders = [], customers = [], discountCodes = [] }) {
  const [campaignMetrics, setCampaignMetrics] = useState([]);
  const [discountMetrics, setDiscountMetrics] = useState({});
  const [customerMetrics, setCustomerMetrics] = useState({});

  useEffect(() => {
    calculateMetrics();
  }, [campaigns, orders, customers, discountCodes]);

  const calculateMetrics = () => {
    // Campaign Metrics
    const sent = campaigns.filter(c => c.status === "sent");
    const totalOpens = sent.reduce((sum, c) => sum + (c.estimated_opens || 0), 0);
    const totalClicks = sent.reduce((sum, c) => sum + (c.estimated_clicks || 0), 0);
    const totalRecipients = sent.reduce((sum, c) => sum + (c.recipient_count || 0), 0);
    
    setCampaignMetrics({
      totalSent: sent.length,
      totalRecipients,
      totalOpens,
      totalClicks,
      avgOpenRate: totalRecipients > 0 ? ((totalOpens / totalRecipients) * 100).toFixed(1) : 0,
      avgClickRate: totalRecipients > 0 ? ((totalClicks / totalRecipients) * 100).toFixed(1) : 0,
      chartData: sent.map(c => ({
        name: c.name.substring(0, 12),
        opens: c.estimated_opens || 0,
        clicks: c.estimated_clicks || 0,
        recipients: c.recipient_count || 0
      }))
    });

    // Discount Code Metrics
    const codesUsed = discountCodes.filter(c => c.usage_count > 0);
    const totalRedemptions = codesUsed.reduce((sum, c) => sum + c.usage_count, 0);
    const totalDiscountGiven = codesUsed.reduce((sum, c) => {
      if (c.discount_type === "fixed_amount") {
        return sum + (c.discount_value * c.usage_count);
      } else {
        return sum + (c.max_discount_amount * c.usage_count || 0);
      }
    }, 0);

    // Calculate revenue influenced by discounts
    const discountedOrders = orders.filter(o => o.promo_code && codesUsed.some(c => c.code === o.promo_code));
    const revenueFromDiscounts = discountedOrders.reduce((sum, o) => sum + o.total_amount, 0);

    setDiscountMetrics({
      totalCodes: discountCodes.length,
      totalRedemptions,
      redemptionRate: discountCodes.length > 0 ? ((codesUsed.length / discountCodes.length) * 100).toFixed(1) : 0,
      totalDiscountGiven,
      revenueFromDiscounts,
      chartData: codesUsed.slice(0, 8).map(c => ({
        code: c.code,
        uses: c.usage_count,
        discount: c.discount_value
      }))
    });

    // Customer Metrics (CAC & CLV)
    const totalSpent = orders.reduce((sum, o) => sum + o.total_amount, 0);
    const totalCustomers = customers.length;
    
    // CAC: Total marketing spend / number of customers (estimate based on campaign recipients)
    const estimatedMarketingSpend = campaigns.length * 50; // Assume ZMW 50 per campaign for estimation
    const cac = totalCustomers > 0 ? (estimatedMarketingSpend / totalCustomers).toFixed(2) : 0;
    
    // CLV: Average total spent per customer
    const clv = totalCustomers > 0 ? (totalSpent / totalCustomers).toFixed(2) : 0;
    
    // Cohort analysis
    const ordersByMonth = {};
    orders.forEach(o => {
      const month = new Date(o.created_date).toLocaleString('default', { month: 'short', year: '2-digit' });
      ordersByMonth[month] = (ordersByMonth[month] || 0) + o.total_amount;
    });

    setCustomerMetrics({
      totalCustomers,
      totalRevenue: totalSpent,
      cac,
      clv,
      avgOrderValue: orders.length > 0 ? (totalSpent / orders.length).toFixed(2) : 0,
      totalOrders: orders.length,
      chartData: Object.entries(ordersByMonth).map(([month, revenue]) => ({
        month,
        revenue
      }))
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-6 h-6 text-cyan-600" />
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Marketing Analytics</h2>
      </div>

      <Tabs defaultValue="campaigns" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="campaigns">Email Campaigns</TabsTrigger>
          <TabsTrigger value="discounts">Discount Codes</TabsTrigger>
          <TabsTrigger value="customers">Customer Metrics</TabsTrigger>
        </TabsList>

        {/* Email Campaign Analytics */}
        <TabsContent value="campaigns" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatsCard
              title="Campaigns Sent"
              value={campaignMetrics.totalSent}
              icon={Mail}
              color="bg-blue-100 dark:bg-blue-900"
              trend="+0%"
            />
            <StatsCard
              title="Total Recipients"
              value={campaignMetrics.totalRecipients}
              icon={Users}
              color="bg-purple-100 dark:bg-purple-900"
              trend="+0%"
            />
            <StatsCard
              title="Avg Open Rate"
              value={`${campaignMetrics.avgOpenRate}%`}
              icon={Mail}
              color="bg-green-100 dark:bg-green-900"
              trend="+0%"
            />
            <StatsCard
              title="Avg Click Rate"
              value={`${campaignMetrics.avgClickRate}%`}
              icon={TrendingUp}
              color="bg-orange-100 dark:bg-orange-900"
              trend="+0%"
            />
          </div>

          {campaignMetrics.chartData && campaignMetrics.chartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Campaign Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={campaignMetrics.chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="opens" fill="#0891b2" name="Opens" />
                    <Bar dataKey="clicks" fill="#06b6d4" name="Clicks" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Discount Code Analytics */}
        <TabsContent value="discounts" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatsCard
              title="Total Codes"
              value={discountMetrics.totalCodes}
              icon={Gift}
              color="bg-pink-100 dark:bg-pink-900"
              trend="+0%"
            />
            <StatsCard
              title="Total Redemptions"
              value={discountMetrics.totalRedemptions}
              icon={Gift}
              color="bg-green-100 dark:bg-green-900"
              trend="+0%"
            />
            <StatsCard
              title="Redemption Rate"
              value={`${discountMetrics.redemptionRate}%`}
              icon={TrendingUp}
              color="bg-blue-100 dark:bg-blue-900"
              trend="+0%"
            />
            <StatsCard
              title="Revenue from Discounts"
              value={`ZMW ${discountMetrics.revenueFromDiscounts.toLocaleString()}`}
              icon={DollarSign}
              color="bg-green-100 dark:bg-green-900"
              trend="+0%"
            />
          </div>

          {discountMetrics.chartData && discountMetrics.chartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Top Discount Codes</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={discountMetrics.chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="code" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="uses" fill="#8b5cf6" name="Uses" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Customer Metrics */}
        <TabsContent value="customers" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatsCard
              title="Total Customers"
              value={customerMetrics.totalCustomers}
              icon={Users}
              color="bg-blue-100 dark:bg-blue-900"
              trend="+0%"
            />
            <StatsCard
              title="Customer Acquisition Cost"
              value={`ZMW ${customerMetrics.cac}`}
              icon={DollarSign}
              color="bg-red-100 dark:bg-red-900"
              trend="+0%"
            />
            <StatsCard
              title="Customer Lifetime Value"
              value={`ZMW ${customerMetrics.clv}`}
              icon={DollarSign}
              color="bg-green-100 dark:bg-green-900"
              trend="+0%"
            />
            <StatsCard
              title="Avg Order Value"
              value={`ZMW ${customerMetrics.avgOrderValue}`}
              icon={TrendingUp}
              color="bg-cyan-100 dark:bg-cyan-900"
              trend="+0%"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Revenue Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={customerMetrics.chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="revenue" stroke="#0891b2" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Key Metrics Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <span className="text-slate-600 dark:text-slate-400">Total Revenue</span>
                    <span className="text-lg font-bold">ZMW {customerMetrics.totalRevenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <span className="text-slate-600 dark:text-slate-400">Total Orders</span>
                    <span className="text-lg font-bold">{customerMetrics.totalOrders}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <span className="text-slate-600 dark:text-slate-400">CLV/CAC Ratio</span>
                    <span className="text-lg font-bold text-green-600">{customerMetrics.cac > 0 ? (customerMetrics.clv / customerMetrics.cac).toFixed(1) : 0}x</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}