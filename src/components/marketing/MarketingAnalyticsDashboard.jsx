import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, Mail, Gift, Users, DollarSign, ArrowUpRight, ArrowDownRight } from "lucide-react";
import StatsCard from "@/components/analytics/StatsCard";
import CampaignMetricsSection from "@/components/marketing/sections/CampaignMetricsSection";
import DiscountMetricsSection from "@/components/marketing/sections/DiscountMetricsSection";
import CustomerMetricsSection from "@/components/marketing/sections/CustomerMetricsSection";

// Metrics calculation functions
const calculateCampaignMetrics = (campaigns = []) => {
  const sent = campaigns.filter(c => c.status === "sent");
  const totalOpens = sent.reduce((sum, c) => sum + (c.estimated_opens || 0), 0);
  const totalClicks = sent.reduce((sum, c) => sum + (c.estimated_clicks || 0), 0);
  const totalRecipients = sent.reduce((sum, c) => sum + (c.recipient_count || 0), 0);
  return {
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
  };
};

const calculateDiscountMetrics = (discountCodes = [], orders = []) => {
  const codesUsed = discountCodes.filter(c => c.usage_count > 0);
  const totalRedemptions = codesUsed.reduce((sum, c) => sum + c.usage_count, 0);
  const totalDiscountGiven = codesUsed.reduce((sum, c) => {
    if (c.discount_type === "fixed_amount") {
      return sum + (c.discount_value * c.usage_count);
    } else {
      return sum + (c.max_discount_amount * c.usage_count || 0);
    }
  }, 0);
  const discountedOrders = orders.filter(o => o.promo_code && codesUsed.some(c => c.code === o.promo_code));
  const revenueFromDiscounts = discountedOrders.reduce((sum, o) => sum + o.total_amount, 0);
  return {
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
  };
};

const calculateCustomerMetrics = (customers = [], orders = [], campaigns = []) => {
  const totalSpent = orders.reduce((sum, o) => sum + o.total_amount, 0);
  const totalCustomers = customers.length;
  const estimatedMarketingSpend = campaigns.length * 50;
  const cac = totalCustomers > 0 ? (estimatedMarketingSpend / totalCustomers).toFixed(2) : 0;
  const clv = totalCustomers > 0 ? (totalSpent / totalCustomers).toFixed(2) : 0;
  const ordersByMonth = {};
  orders.forEach(o => {
    const month = new Date(o.created_date).toLocaleString('default', { month: 'short', year: '2-digit' });
    ordersByMonth[month] = (ordersByMonth[month] || 0) + o.total_amount;
  });
  return {
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
  };
};

export default function MarketingAnalyticsDashboard({ shopId, campaigns = [], orders = [], customers = [], discountCodes = [] }) {
  const [campaignMetrics, setCampaignMetrics] = useState({});
  const [discountMetrics, setDiscountMetrics] = useState({});
  const [customerMetrics, setCustomerMetrics] = useState({});

  useEffect(() => {
    setCampaignMetrics(calculateCampaignMetrics(campaigns));
    setDiscountMetrics(calculateDiscountMetrics(discountCodes, orders));
    setCustomerMetrics(calculateCustomerMetrics(customers, orders, campaigns));
  }, [campaigns, orders, customers, discountCodes]);

  return (
    <div className="space-y-8 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Marketing Analytics</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Track campaigns, discounts, and customer metrics</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <Tabs defaultValue="campaigns" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-slate-100/50 dark:bg-slate-900/50 p-1 rounded-lg">
          <TabsTrigger value="campaigns" className="data-[state=active]:shadow-sm">Email Campaigns</TabsTrigger>
          <TabsTrigger value="discounts" className="data-[state=active]:shadow-sm">Discount Codes</TabsTrigger>
          <TabsTrigger value="customers" className="data-[state=active]:shadow-sm">Customer Metrics</TabsTrigger>
        </TabsList>

        {/* Campaign Analytics */}
        <TabsContent value="campaigns" className="space-y-6 mt-6">
          <CampaignMetricsSection metrics={campaignMetrics} />
        </TabsContent>

        {/* Discount Analytics */}
        <TabsContent value="discounts" className="space-y-6 mt-6">
          <DiscountMetricsSection metrics={discountMetrics} />
        </TabsContent>

        {/* Customer Metrics */}
        <TabsContent value="customers" className="space-y-6 mt-6">
          <CustomerMetricsSection metrics={customerMetrics} />
        </TabsContent>
      </Tabs>
    </div>
  );
}