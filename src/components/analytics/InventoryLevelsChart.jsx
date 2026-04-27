import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package } from "lucide-react";

export default function InventoryLevelsChart({ shopId }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const products = await base44.entities.Product.filter({ shop_id: shopId }, "-stock_quantity", 10);
        
        const chartData = products
          .map(p => ({
            name: p.name.substring(0, 12),
            stock: p.stock_quantity || 0,
            threshold: p.low_stock_threshold || 5,
          }))
          .filter(p => p.stock > 0 || p.name); // Include products with or without stock

        setData(chartData);
      } catch (error) {
        console.error("Failed to load inventory data:", error);
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
            <Package className="w-5 h-5 text-amber-600" />
            Inventory Levels
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  const totalItems = data.reduce((sum, d) => sum + d.stock, 0);
  const lowStockItems = data.filter(d => d.stock <= d.threshold).length;

  return (
    <Card className="bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-600" />
              Inventory Levels
            </CardTitle>
            <CardDescription>Top 10 products by stock</CardDescription>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{totalItems}</p>
            <p className={`text-xs ${lowStockItems > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
              {lowStockItems} low stock
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f1f5f9' }}
                formatter={(value) => value}
              />
              <Legend />
              <Bar dataKey="stock" fill="#f59e0b" radius={[8, 8, 0, 0]} name="In Stock" />
              <Bar dataKey="threshold" fill="#ef4444" radius={[8, 8, 0, 0]} name="Low Stock Threshold" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-80 flex items-center justify-center text-slate-500">
            No products yet
          </div>
        )}
      </CardContent>
    </Card>
  );
}