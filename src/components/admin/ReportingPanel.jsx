import React, { useState, useMemo } from "react";
import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Calendar, Download, BarChart3, TrendingUp, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MobileSelect from "@/components/shared/MobileSelect";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const CATEGORIES = [
  "engine", "brakes", "suspension", "electrical", "body", "transmission",
  "exhaust", "cooling", "steering", "interior", "accessories", "tyres", "filters", "oils_fluids", "other"
];

const exportToCSV = (data, filename) => {
  const csv = [
    Object.keys(data[0] || {}).join(","),
    ...data.map(row => Object.values(row).map(v => `"${v}"`).join(","))
  ].join("\n");
  
  const blob = new Blob([csv], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  a.remove();
};

export default function ReportingPanel({ orders, products, shops }) {
  const [reportType, setReportType] = useState("sales_summary");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedShop, setSelectedShop] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState("all");

  // Filter orders by date range
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const orderDate = new Date(order.created_date);
      const start = startDate ? new Date(startDate) : new Date("2000-01-01");
      const end = endDate ? new Date(endDate) : new Date();
      return orderDate >= start && orderDate <= end && order.status !== "cancelled";
    });
  }, [orders, startDate, endDate]);

  // Apply additional filters
  const reportData = useMemo(() => {
    let filtered = filteredOrders;

    if (selectedShop !== "all") {
      filtered = filtered.filter(o => o.shop_id === selectedShop);
    }

    const reportItems = [];
    filtered.forEach(order => {
      order.items?.forEach(item => {
        const product = products.find(p => p.id === item.product_id);
        if (!product) return;
        if (selectedCategory !== "all" && product.category !== selectedCategory) return;
        if (selectedProduct !== "all" && product.id !== selectedProduct) return;
        
        reportItems.push({
          orderDate: new Date(order.created_date).toLocaleDateString(),
          orderId: order.id?.slice(0, 8),
          buyerName: order.buyer_name || order.buyer_email,
          shopName: order.shop_name,
          productName: product.name,
          category: product.category,
          quantity: item.quantity,
          unitPrice: item.price,
          total: item.price * item.quantity
        });
      });
    });

    return reportItems;
  }, [filteredOrders, products, selectedShop, selectedCategory, selectedProduct]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalRevenue = reportData.reduce((sum, item) => sum + item.total, 0);
    const totalOrders = new Set(reportData.map(item => item.orderId)).size;
    const totalQuantity = reportData.reduce((sum, item) => sum + item.quantity, 0);
    
    const topProducts = {};
    reportData.forEach(item => {
      if (!topProducts[item.productName]) {
        topProducts[item.productName] = { quantity: 0, revenue: 0 };
      }
      topProducts[item.productName].quantity += item.quantity;
      topProducts[item.productName].revenue += item.total;
    });

    const topProductsList = Object.entries(topProducts)
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 5)
      .map(([name, data]) => ({ name, quantity: data.quantity, revenue: data.revenue }));

    const categoryBreakdown = {};
    reportData.forEach(item => {
      if (!categoryBreakdown[item.category]) {
        categoryBreakdown[item.category] = { quantity: 0, revenue: 0 };
      }
      categoryBreakdown[item.category].quantity += item.quantity;
      categoryBreakdown[item.category].revenue += item.total;
    });

    return { totalRevenue, totalOrders, totalQuantity, topProductsList, categoryBreakdown };
  }, [reportData]);

  const handleExport = () => {
    if (reportData.length === 0) {
      toast.error("No data to export");
      return;
    }
    
    const filename = `report_${new Date().toISOString().split('T')[0]}.csv`;
    exportToCSV(reportData, filename);
    toast.success("Report exported successfully");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Reports & Analytics</h1>

      {/* Filters */}
      <Card className="border-slate-100 dark:border-slate-700">
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <Label className="text-sm">Start Date</Label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 h-9" />
            </div>
            <div>
              <Label className="text-sm">End Date</Label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1 h-9" />
            </div>
            <div>
              <Label className="text-sm">Shop</Label>
              <div className="mt-1">
                <MobileSelect 
                  value={selectedShop} 
                  onValueChange={setSelectedShop}
                  placeholder="All Shops"
                  triggerClassName="h-9"
                  options={[{value:"all",label:"All Shops"}, ...shops.filter(s => s.status === "approved").map(s => ({value:s.id,label:s.name}))]}
                />
              </div>
            </div>
            <div>
              <Label className="text-sm">Category</Label>
              <div className="mt-1">
                <MobileSelect 
                  value={selectedCategory} 
                  onValueChange={setSelectedCategory}
                  placeholder="All Categories"
                  triggerClassName="h-9"
                  options={[{value:"all",label:"All Categories"}, ...CATEGORIES.map(c => ({value:c,label:c.replace(/_/g, " ")}))]}
                />
              </div>
            </div>
            <div>
              <Label className="text-sm">Product</Label>
              <div className="mt-1">
                <MobileSelect 
                  value={selectedProduct} 
                  onValueChange={setSelectedProduct}
                  placeholder="All Products"
                  triggerClassName="h-9"
                  options={[{value:"all",label:"All Products"}, ...products
                    .filter(p => selectedCategory === "all" || p.category === selectedCategory)
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map(p => ({value:p.id,label:p.name}))]}
                />
              </div>
            </div>
          </div>
          <Button onClick={handleExport} disabled={reportData.length === 0} className="bg-emerald-600 hover:bg-emerald-700 gap-2 w-full sm:w-auto">
            <Download className="w-4 h-4" /> Export to CSV
          </Button>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-100 dark:border-slate-700">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-medium">Total Revenue</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">K{metrics.totalRevenue.toLocaleString()}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-emerald-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 dark:border-slate-700">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-medium">Total Orders</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{metrics.totalOrders}</p>
              </div>
              <ShoppingCart className="w-8 h-8 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 dark:border-slate-700">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-medium">Total Items Sold</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{metrics.totalQuantity}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 dark:border-slate-700">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-medium">Avg Order Value</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">K{metrics.totalOrders > 0 ? (metrics.totalRevenue / metrics.totalOrders).toLocaleString(undefined, {maximumFractionDigits: 0}) : 0}</p>
              </div>
              <Calendar className="w-8 h-8 text-amber-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Products */}
      {metrics.topProductsList.length > 0 && (
        <Card className="border-slate-100 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="text-lg">Top Selling Products</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-800">
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity Sold</TableHead>
                  <TableHead>Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics.topProductsList.map((p, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>{p.quantity}</TableCell>
                    <TableCell className="font-semibold">K{p.revenue.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Category Breakdown */}
      {Object.keys(metrics.categoryBreakdown).length > 0 && (
        <Card className="border-slate-100 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="text-lg">Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-800">
                  <TableHead>Category</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(metrics.categoryBreakdown)
                  .sort((a, b) => b[1].revenue - a[1].revenue)
                  .map(([cat, data]) => (
                    <TableRow key={cat}>
                      <TableCell className="font-medium">{cat.replace(/_/g, " ")}</TableCell>
                      <TableCell>{data.quantity}</TableCell>
                      <TableCell className="font-semibold">K{data.revenue.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Detailed Report */}
      {reportData.length > 0 && (
        <Card className="border-slate-100 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="text-lg">Detailed Sales Report</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-800">
                  <TableHead>Date</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.map((item, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-sm">{item.orderDate}</TableCell>
                    <TableCell className="text-xs font-mono text-slate-500">#{item.orderId}</TableCell>
                    <TableCell className="text-sm">{item.buyerName}</TableCell>
                    <TableCell className="text-sm font-medium">{item.productName}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{item.category}</Badge></TableCell>
                    <TableCell className="text-sm">{item.quantity}</TableCell>
                    <TableCell className="text-sm">K{item.unitPrice.toLocaleString()}</TableCell>
                    <TableCell className="text-sm font-semibold">K{item.total.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {reportData.length === 0 && (
        <Card className="border-slate-100 dark:border-slate-700">
          <CardContent className="p-12 text-center">
            <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400">No data available for the selected filters</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}