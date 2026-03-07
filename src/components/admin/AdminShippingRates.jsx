import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Edit2, Save, X, Trash2, Plus, Truck, MapPin, Search } from "lucide-react";

export default function AdminShippingRates() {
  const [towns, setTowns] = useState([]);
  const [shippingRates, setShippingRates] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editingRate, setEditingRate] = useState("");
  const [newTownId, setNewTownId] = useState("");
  const [newRate, setNewRate] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [t, rates, u] = await Promise.all([
      base44.entities.Town.list(),
      base44.entities.ShippingRate.list(),
      base44.auth.me(),
    ]);
    setTowns(t);
    setShippingRates(rates);
    setUser(u);
    setLoading(false);
  };

  const handleAddRate = async () => {
    if (!newTownId || !newRate) { toast.error("Please select a town and enter a rate"); return; }
    const town = towns.find(t => t.id === newTownId);
    await base44.entities.ShippingRate.create({
      town_id: newTownId, town_name: town.name,
      region_id: town.region_id, region_name: town.region_name,
      default_rate: parseFloat(newRate), set_by: user.email,
    });
    toast.success("Shipping rate created");
    setNewTownId(""); setNewRate(""); setShowAddForm(false);
    loadData();
  };

  const handleUpdateRate = async (id) => {
    if (!editingRate) { toast.error("Please enter a rate"); return; }
    await base44.entities.ShippingRate.update(id, { default_rate: parseFloat(editingRate) });
    toast.success("Rate updated");
    setEditingId(null);
    loadData();
  };

  const handleDeleteRate = async (id) => {
    await base44.entities.ShippingRate.delete(id);
    toast.success("Rate deleted");
    loadData();
  };

  if (loading) return <div className="animate-pulse h-40 bg-slate-100 dark:bg-slate-800 rounded-2xl" />;

  const configuredTownIds = shippingRates.map(r => r.town_id);
  const availableTowns = towns.filter(t => !configuredTownIds.includes(t.id));

  const filtered = shippingRates.filter(r =>
    !search.trim() ||
    r.town_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.region_name?.toLowerCase().includes(search.toLowerCase())
  );

  // Group by region for display
  const byRegion = filtered.reduce((acc, r) => {
    const key = r.region_name || "Other";
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Shipping Rates</h1>
          <Badge className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
            {shippingRates.length} towns configured
          </Badge>
        </div>
        <Button
          onClick={() => setShowAddForm(v => !v)}
          className="bg-blue-600 hover:bg-blue-700 gap-2"
        >
          <Plus className="w-4 h-4" /> Add Rate
        </Button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Truck className="w-4 h-4 text-blue-500" /> New Shipping Rate
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Town</Label>
              <select
                value={newTownId}
                onChange={e => setNewTownId(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a town…</option>
                {availableTowns.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.region_name})</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Rate (ZMW)</Label>
              <Input
                type="number"
                value={newRate}
                onChange={e => setNewRate(e.target.value)}
                placeholder="e.g. 50"
                className="mt-1"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleAddRate} className="bg-blue-600 hover:bg-blue-700 gap-2">
              <Save className="w-4 h-4" /> Save Rate
            </Button>
            <Button variant="ghost" onClick={() => setShowAddForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          className="pl-9"
          placeholder="Search by town or region…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Rates Table grouped by region */}
      {shippingRates.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-16 text-center">
          <Truck className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
          <p className="text-slate-500 dark:text-slate-400">No shipping rates configured yet</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400 dark:text-slate-500">No results for "{search}"</div>
      ) : (
        <div className="space-y-4">
          {Object.entries(byRegion).sort(([a], [b]) => a.localeCompare(b)).map(([region, rates]) => (
            <div key={region} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
              {/* Region header */}
              <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-500" />
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{region}</span>
                <Badge className="ml-auto bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-[11px]">
                  {rates.length} {rates.length === 1 ? "town" : "towns"}
                </Badge>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-700/50">
                      <th className="px-5 py-2.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Town</th>
                      <th className="px-5 py-2.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Default Rate</th>
                      <th className="px-5 py-2.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Set By</th>
                      <th className="px-5 py-2.5 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rates.map((rate, idx) => (
                      <tr
                        key={rate.id}
                        className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${idx < rates.length - 1 ? "border-b border-slate-100 dark:border-slate-700/50" : ""}`}
                      >
                        <td className="px-5 py-3 font-medium text-slate-900 dark:text-slate-100">{rate.town_name}</td>
                        <td className="px-5 py-3">
                          {editingId === rate.id ? (
                            <Input
                              type="number"
                              value={editingRate}
                              onChange={e => setEditingRate(e.target.value)}
                              className="w-28 h-8"
                              autoFocus
                            />
                          ) : (
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">K{rate.default_rate.toLocaleString()}</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-xs text-slate-400 dark:text-slate-500">{rate.set_by || "—"}</td>
                        <td className="px-5 py-3 text-right">
                          {editingId === rate.id ? (
                            <div className="flex justify-end gap-1.5">
                              <Button size="sm" onClick={() => handleUpdateRate(rate.id)} className="h-7 bg-blue-600 hover:bg-blue-700 gap-1 text-xs">
                                <Save className="w-3 h-3" /> Save
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="h-7">
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex justify-end gap-1.5">
                              <Button
                                size="sm" variant="ghost"
                                onClick={() => { setEditingId(rate.id); setEditingRate(rate.default_rate); }}
                                className="h-7 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 gap-1 text-xs"
                              >
                                <Edit2 className="w-3 h-3" /> Edit
                              </Button>
                              <Button
                                size="sm" variant="ghost"
                                onClick={() => handleDeleteRate(rate.id)}
                                className="h-7 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}