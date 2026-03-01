import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Edit2, Save, X, Trash2 } from "lucide-react";

export default function AdminShippingRates() {
  const [towns, setTowns] = useState([]);
  const [shippingRates, setShippingRates] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editingRate, setEditingRate] = useState("");
  const [newTownId, setNewTownId] = useState("");
  const [newRate, setNewRate] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const t = await base44.entities.Town.list();
    const rates = await base44.entities.ShippingRate.list();
    const u = await base44.auth.me();
    setTowns(t);
    setShippingRates(rates);
    setUser(u);
    setLoading(false);
  };

  const handleAddRate = async () => {
    if (!newTownId || !newRate) {
      toast.error("Please select a town and enter a rate");
      return;
    }
    const town = towns.find(t => t.id === newTownId);
    await base44.entities.ShippingRate.create({
      town_id: newTownId,
      town_name: town.name,
      region_id: town.region_id,
      region_name: town.region_name,
      default_rate: parseFloat(newRate),
      set_by: user.email,
    });
    toast.success("Shipping rate created");
    setNewTownId("");
    setNewRate("");
    loadData();
  };

  const handleUpdateRate = async (id) => {
    if (!editingRate) {
      toast.error("Please enter a rate");
      return;
    }
    await base44.entities.ShippingRate.update(id, { default_rate: parseFloat(editingRate) });
    toast.success("Shipping rate updated");
    setEditingId(null);
    loadData();
  };

  const handleDeleteRate = async (id) => {
    await base44.entities.ShippingRate.delete(id);
    toast.success("Shipping rate deleted");
    loadData();
  };

  if (loading) return <div className="text-slate-500">Loading...</div>;

  const configuredTownIds = shippingRates.map(r => r.town_id);
  const availableTowns = towns.filter(t => !configuredTownIds.includes(t.id));

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <h3 className="font-semibold text-slate-900 mb-4">Add New Shipping Rate</h3>
        <div className="space-y-3">
          <div>
            <Label className="text-sm font-medium text-slate-700">Town</Label>
            <select
              value={newTownId}
              onChange={e => setNewTownId(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a town</option>
              {availableTowns.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.region_name})</option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-sm font-medium text-slate-700">Default Shipping Rate (ZMW)</Label>
            <Input
              type="number"
              value={newRate}
              onChange={e => setNewRate(e.target.value)}
              placeholder="e.g. 50"
              className="mt-1"
            />
          </div>
          <Button onClick={handleAddRate} className="w-full bg-blue-600 hover:bg-blue-700">
            Add Rate
          </Button>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <h3 className="font-semibold text-slate-900">Current Shipping Rates by Town</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-slate-700 font-medium">Town</th>
                <th className="px-4 py-3 text-left text-slate-700 font-medium">Region</th>
                <th className="px-4 py-3 text-left text-slate-700 font-medium">Default Rate (ZMW)</th>
                <th className="px-4 py-3 text-right text-slate-700 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {shippingRates.map(rate => (
                <tr key={rate.id} className="border-b border-slate-200 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{rate.town_name}</td>
                  <td className="px-4 py-3 text-slate-600">{rate.region_name}</td>
                  <td className="px-4 py-3">
                    {editingId === rate.id ? (
                      <Input
                        type="number"
                        value={editingRate}
                        onChange={e => setEditingRate(e.target.value)}
                        className="w-24 h-8"
                      />
                    ) : (
                      <span className="font-semibold text-slate-900">K{rate.default_rate}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {editingId === rate.id ? (
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateRate(rate.id)}
                          className="h-8 gap-1"
                        >
                          <Save className="w-3 h-3" /> Save
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingId(null)}
                          className="h-8"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingId(rate.id);
                            setEditingRate(rate.default_rate);
                          }}
                          className="h-8 gap-1"
                        >
                          <Edit2 className="w-3 h-3" /> Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteRate(rate.id)}
                          className="h-8 text-red-600 hover:text-red-700"
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
        {shippingRates.length === 0 && (
          <div className="p-8 text-center text-slate-500">No rates configured yet</div>
        )}
      </Card>
    </div>
  );
}