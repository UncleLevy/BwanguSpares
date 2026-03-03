import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Gift, Search, Store } from "lucide-react";
import { toast } from "sonner";

const TIER_ELIGIBILITY = {
  basic:    { tiers: ["bronze"],                        label: "Bronze only" },
  standard: { tiers: ["bronze", "silver", "gold"],      label: "Bronze – Gold" },
  premium:  { tiers: ["bronze", "silver", "gold", "platinum"], label: "All tiers" },
};

const slotColors = {
  basic:    "bg-slate-100 text-slate-600",
  standard: "bg-blue-50 text-blue-700",
  premium:  "bg-amber-50 text-amber-700",
};

export default function AdminLoyaltyPanel() {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [toggling, setToggling] = useState(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const data = await base44.entities.Shop.filter({ status: "approved" }, "name", 200);
    setShops(data);
    setLoading(false);
  };

  const toggleLoyalty = async (shop) => {
    setToggling(shop.id);
    const newVal = !shop.loyalty_enabled;
    await base44.entities.Shop.update(shop.id, { loyalty_enabled: newVal });
    setShops(prev => prev.map(s => s.id === shop.id ? { ...s, loyalty_enabled: newVal } : s));
    toast.success(`${shop.name}: loyalty ${newVal ? "enabled" : "disabled"}`);
    setToggling(null);
  };

  const filtered = shops.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.owner_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.region_name?.toLowerCase().includes(search.toLowerCase())
  );

  const enabledCount = shops.filter(s => s.loyalty_enabled).length;

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Gift className="w-6 h-6 text-blue-600" /> Loyalty Programme
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Control which shops participate in the loyalty points programme. Off by default.
          </p>
        </div>
        <div className="flex gap-3">
          <Card className="border-slate-100 dark:border-slate-700">
            <CardContent className="px-5 py-3 flex items-center gap-3">
              <Store className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{enabledCount}</p>
                <p className="text-xs text-slate-400">Shops enrolled</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tier eligibility legend */}
      <Card className="border-blue-100 bg-blue-50/40 dark:bg-blue-950/20 dark:border-blue-900 mb-5">
        <CardContent className="p-4">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Points Redemption by Plan Tier</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            {Object.entries(TIER_ELIGIBILITY).map(([plan, info]) => (
              <div key={plan} className={`rounded-lg border px-4 py-2.5 flex items-center justify-between ${slotColors[plan]} border-current/20`}>
                <span className="font-semibold capitalize">{plan}</span>
                <span className="text-xs opacity-80">{info.label}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
            Buyers on higher tiers can redeem points at all enrolled shops. Basic-plan shops only accept Bronze-tier redemptions.
          </p>
        </CardContent>
      </Card>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search shops..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-800">
              <TableHead>Shop</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Region</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Eligible Tiers</TableHead>
              <TableHead className="text-center">Loyalty Enabled</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-slate-400">
                  No approved shops found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(shop => {
                const planInfo = TIER_ELIGIBILITY[shop.slot_type] || TIER_ELIGIBILITY.basic;
                return (
                  <TableRow key={shop.id}>
                    <TableCell className="font-medium text-slate-900 dark:text-slate-100">{shop.name}</TableCell>
                    <TableCell className="text-sm text-slate-500 dark:text-slate-400">{shop.owner_name || shop.owner_email}</TableCell>
                    <TableCell className="text-sm">{shop.region_name || "—"}</TableCell>
                    <TableCell>
                      <Badge className={`${slotColors[shop.slot_type]} text-[11px] capitalize`}>
                        {shop.slot_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 dark:text-slate-400">{planInfo.label}</TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={!!shop.loyalty_enabled}
                        disabled={toggling === shop.id}
                        onCheckedChange={() => toggleLoyalty(shop)}
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}