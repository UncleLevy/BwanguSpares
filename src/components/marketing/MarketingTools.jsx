import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EmailCampaignManager from "./EmailCampaignManager";
import DiscountCodeManager from "./DiscountCodeManager";
import { Mail, Tag } from "lucide-react";

export default function MarketingTools({ shopId, customers = [] }) {
  const [campaigns, setCampaigns] = useState([]);
  const [discountCodes, setDiscountCodes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (shopId) fetchData();
  }, [shopId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [campaignsData, codesData] = await Promise.all([
        base44.entities.Campaign.filter({ shop_id: shopId }),
        base44.entities.DiscountCode.filter({ shop_id: shopId })
      ]);
      setCampaigns(campaignsData);
      setDiscountCodes(codesData);
    } catch (error) {
      toast.error("Failed to load marketing data");
    }
    setLoading(false);
  };

  if (loading) return <div className="flex items-center justify-center p-8"><div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Marketing Tools</h1>
        <p className="text-sm text-slate-500 mt-1">Manage email campaigns and discount codes</p>
      </div>

      <Tabs defaultValue="campaigns" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="campaigns" className="gap-2"><Mail className="w-4 h-4" /> Email Campaigns</TabsTrigger>
          <TabsTrigger value="discounts" className="gap-2"><Tag className="w-4 h-4" /> Discount Codes</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-4">
          <EmailCampaignManager shopId={shopId} campaigns={campaigns} customers={customers} onCampaignsChange={setCampaigns} />
        </TabsContent>

        <TabsContent value="discounts" className="space-y-4">
          <DiscountCodeManager shopId={shopId} codes={discountCodes} onCodesChange={setDiscountCodes} />
        </TabsContent>
      </Tabs>
    </div>
  );
}