import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, Mail, Gift, Users, DollarSign, ArrowUpRight, ArrowDownRight } from "lucide-react";
import StatsCard from "@/components/analytics/StatsCard";
import CampaignMetricsSection from "@/components/marketing/sections/CampaignMetricsSection";
import DiscountMetricsSection from "@/components/marketing/sections/DiscountMetricsSection";
import CustomerMetricsSection from "@/components/marketing/sections/CustomerMetricsSection";
import { calculateCampaignMetrics, calculateDiscountMetrics, calculateCustomerMetrics } from "@/lib/marketingMetrics";

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