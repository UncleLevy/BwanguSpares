import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Edit2, Save, X } from "lucide-react";

export default function ShippingManagement({ shopId }) {
  const [products, setProducts] = useState([]);
  const [shippingRates, setShippingRates] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editingCost, setEditingCost] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [shopId]);

  const loadData = async () => {
    const prods = await base44.entities.Product.filter({ shop_id: shopId });
    const rates = await base44.entities.ShippingRate.list();
    setProducts(prods);
    setShippingRates(rates);
    setLoading(false);
  };

  const handleUpdateProductShipping = async (productId, cost) => {
    if (cost === "") {
      toast.error("Please enter a shipping cost");
      return;
    }
    await base44.entities.Product.update(productId, { shipping_cost: parseFloat(cost) });
    toast.success("Shipping cost updated");
    setEditingId(null);
    loadData();
  };

  if (loading) return <div className="text-slate-500">Loading...</div>;

  const defaultRates = shippingRates.reduce((acc, rate) => {
    acc[rate.town_id] = rate.default_rate;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <Card className="p-4 bg-blue-50 border-blue-200">
        <p className="text-sm text-slate-700">
          <strong>How it works:</strong> Leave shipping cost blank to use default town rate, or set a custom cost for this product.
        </p>
      </Card>

      <Card className="overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <h3 className="font-semibold text-slate-900">Product Shipping Costs</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-slate-700 font-medium">Product</th>
                <th className="px-4 py-3 text-left text-slate-700 font-medium">Price</th>
                <th className="px-4 py-3 text-left text-slate-700 font-medium">Shipping Cost (ZMW)</th>
                <th className="px-4 py-3 text-right text-slate-700 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product.id} className="border-b border-slate-200 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{product.name}</td>
                  <td className="px-4 py-3 text-slate-600">K{product.price}</td>
                  <td className="px-4 py-3">
                    {editingId === product.id ? (
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          value={editingCost}
                          onChange={e => setEditingCost(e.target.value)}
                          placeholder="Or leave blank for default"
                          className="w-32 h-8"
                        />
                      </div>
                    ) : (
                      <span className={product.shipping_cost ? "font-semibold text-slate-900" : "text-slate-500 italic"}>
                        {product.shipping_cost ? `K${product.shipping_cost}` : "Using default rate"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {editingId === product.id ? (
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateProductShipping(product.id, editingCost)}
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
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingId(product.id);
                          setEditingCost(product.shipping_cost || "");
                        }}
                        className="h-8 gap-1"
                      >
                        <Edit2 className="w-3 h-3" /> Edit
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {products.length === 0 && (
          <div className="p-8 text-center text-slate-500">No products found</div>
        )}
      </Card>

      <Card className="p-4 bg-amber-50 border-amber-200">
        <h4 className="font-semibold text-amber-900 mb-2">Default Town Shipping Rates (Set by Admin)</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {shippingRates.length === 0 ? (
            <p className="text-sm text-amber-800">No default rates configured yet</p>
          ) : (
            shippingRates.map(rate => (
              <div key={rate.id} className="flex justify-between p-2 bg-white rounded border border-amber-100">
                <span className="text-sm font-medium text-slate-700">{rate.town_name}</span>
                <span className="font-semibold text-amber-900">K{rate.default_rate}</span>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}