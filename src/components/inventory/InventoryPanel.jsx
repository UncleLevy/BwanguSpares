import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { emailLowStockAlert } from "@/components/lib/emailNotifications";
import {
  AlertTriangle, Package, TrendingUp, BarChart3, Search,
  Save, Edit3, CheckCircle2
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const CATEGORIES = [
  "engine","brakes","suspension","electrical","body","transmission",
  "exhaust","cooling","steering","interior","accessories","tyres","filters","oils_fluids","other"
];

const SUB_CATEGORIES = {
  engine: ["Spark Plugs","Pistons","Camshafts","Crankshafts","Gaskets","Engine Mounts","Timing Belt","Oil Pump","Other"],
  brakes: ["Brake Pads","Brake Discs","Calipers","Brake Lines","Master Cylinder","Brake Fluid","Other"],
  suspension: ["Shock Absorbers","Struts","Control Arms","Ball Joints","Tie Rods","Sway Bar Links","Springs","Other"],
  electrical: ["Alternators","Starters","Batteries","Fuses","Relays","Sensors","Wiring Harness","Other"],
  body: ["Bumpers","Fenders","Hoods","Doors","Mirrors","Grilles","Other"],
  transmission: ["Clutch Kit","Gearbox","Driveshaft","CV Joints","Differential","Other"],
  exhaust: ["Mufflers","Catalytic Converters","Exhaust Pipes","Manifolds","Other"],
  cooling: ["Radiators","Water Pumps","Thermostats","Coolant Hoses","Fans","Other"],
  steering: ["Steering Rack","Power Steering Pump","Steering Column","Other"],
  interior: ["Seats","Dashboard Parts","Door Cards","Carpets","Other"],
  accessories: ["Floor Mats","Tow Bars","Roof Racks","Other"],
  tyres: ["Passenger Tyres","4x4 Tyres","Truck Tyres","Inner Tubes","Other"],
  filters: ["Oil Filters","Air Filters","Fuel Filters","Cabin Filters","Other"],
  oils_fluids: ["Engine Oil","Gear Oil","Brake Fluid","Coolant","Power Steering Fluid","Other"],
  other: ["Other"],
};

export default function InventoryPanel({ products, orders, onProductsChange, shopOwnerEmail, shopName }) {
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [bulkEdits, setBulkEdits] = useState({});
  const [savingBulk, setSavingBulk] = useState(false);
  const [thresholdDialog, setThresholdDialog] = useState(null);
  const [thresholdVal, setThresholdVal] = useState("");

  // Stats
  const lowStockItems = products.filter(p => p.stock_quantity <= (p.low_stock_threshold ?? 5) && p.stock_quantity > 0);
  const outOfStock = products.filter(p => p.stock_quantity === 0);
  const totalValue = products.reduce((s, p) => s + (p.price * (p.stock_quantity || 0)), 0);

  // Category breakdown
  const catData = useMemo(() => {
    const map = {};
    products.forEach(p => {
      const c = p.category || "other";
      if (!map[c]) map[c] = { name: c.replace(/_/g, " "), count: 0, value: 0 };
      map[c].count++;
      map[c].value += p.price * (p.stock_quantity || 0);
    });
    return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 8);
  }, [products]);

  // Sales performance per product
  const salesMap = useMemo(() => {
    const map = {};
    (orders || []).filter(o => o.status !== "cancelled").forEach(order => {
      order.items?.forEach(item => {
        if (!map[item.product_id]) map[item.product_id] = { sold: 0, revenue: 0 };
        map[item.product_id].sold += item.quantity || 1;
        map[item.product_id].revenue += (item.price || 0) * (item.quantity || 1);
      });
    });
    return map;
  }, [orders]);

  const filtered = products.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === "all" || p.category === filterCat;
    const matchStatus = filterStatus === "all"
      || (filterStatus === "low_stock" && p.stock_quantity <= (p.low_stock_threshold ?? 5) && p.stock_quantity > 0)
      || (filterStatus === "out_of_stock" && p.stock_quantity === 0)
      || (filterStatus === "active" && p.status === "active");
    return matchSearch && matchCat && matchStatus;
  });

  const handleBulkChange = (id, val) => {
    setBulkEdits(prev => ({ ...prev, [id]: val }));
  };

  const saveBulkUpdates = async () => {
    const entries = Object.entries(bulkEdits).filter(([, v]) => v !== "" && !isNaN(Number(v)));
    if (!entries.length) return;
    setSavingBulk(true);
    await Promise.all(entries.map(([id, qty]) => {
      const q = parseInt(qty);
      const status = q === 0 ? "out_of_stock" : "active";
      return base44.entities.Product.update(id, { stock_quantity: q, status });
    }));
    onProductsChange(prev => prev.map(p => {
      if (bulkEdits[p.id] !== undefined && bulkEdits[p.id] !== "") {
        const q = parseInt(bulkEdits[p.id]);
        return { ...p, stock_quantity: q, status: q === 0 ? "out_of_stock" : "active" };
      }
      return p;
    }));
    setBulkEdits({});
    setSavingBulk(false);
    toast.success(`${entries.length} stock level(s) updated`);
  };

  const openThreshold = (p) => {
    setThresholdDialog(p);
    setThresholdVal(String(p.low_stock_threshold ?? 5));
  };

  const saveThreshold = async () => {
    const val = parseInt(thresholdVal);
    if (isNaN(val) || val < 0) return;
    await base44.entities.Product.update(thresholdDialog.id, { low_stock_threshold: val });
    onProductsChange(prev => prev.map(p => p.id === thresholdDialog.id ? { ...p, low_stock_threshold: val } : p));
    toast.success("Alert threshold updated");
    setThresholdDialog(null);
  };

  const pendingBulkCount = Object.values(bulkEdits).filter(v => v !== "").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Inventory Management</h1>
        {pendingBulkCount > 0 && (
          <Button onClick={saveBulkUpdates} disabled={savingBulk} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
            <Save className="w-4 h-4" /> Save {pendingBulkCount} Stock Update{pendingBulkCount > 1 ? "s" : ""}
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-100 dark:border-slate-700 dark:bg-slate-900">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center"><Package className="w-5 h-5 text-blue-600 dark:text-blue-400" /></div>
            <div><p className="text-xl font-bold text-slate-900 dark:text-slate-100">{products.length}</p><p className="text-xs text-slate-500 dark:text-slate-400">Total SKUs</p></div>
          </CardContent>
        </Card>
        <Card className={`dark:bg-slate-900 ${lowStockItems.length > 0 ? "border-amber-200 dark:border-amber-800/50" : "border-slate-100 dark:border-slate-700"}`}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${lowStockItems.length > 0 ? "bg-amber-100 dark:bg-amber-900/30" : "bg-slate-100 dark:bg-slate-800"}`}>
              <AlertTriangle className={`w-5 h-5 ${lowStockItems.length > 0 ? "text-amber-500 dark:text-amber-400" : "text-slate-400"}`} />
            </div>
            <div><p className="text-xl font-bold text-slate-900 dark:text-slate-100">{lowStockItems.length}</p><p className="text-xs text-slate-500 dark:text-slate-400">Low Stock</p></div>
          </CardContent>
        </Card>
        <Card className={`dark:bg-slate-900 ${outOfStock.length > 0 ? "border-red-200 dark:border-red-800/50" : "border-slate-100 dark:border-slate-700"}`}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${outOfStock.length > 0 ? "bg-red-100 dark:bg-red-900/30" : "bg-slate-100 dark:bg-slate-800"}`}>
              <Package className={`w-5 h-5 ${outOfStock.length > 0 ? "text-red-500 dark:text-red-400" : "text-slate-400"}`} />
            </div>
            <div><p className="text-xl font-bold text-slate-900 dark:text-slate-100">{outOfStock.length}</p><p className="text-xs text-slate-500 dark:text-slate-400">Out of Stock</p></div>
          </CardContent>
        </Card>
        <Card className="border-slate-100 dark:border-slate-700 dark:bg-slate-900">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center"><TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /></div>
            <div><p className="text-xl font-bold text-slate-900 dark:text-slate-100">K{totalValue.toLocaleString()}</p><p className="text-xs text-slate-500 dark:text-slate-400">Stock Value</p></div>
          </CardContent>
        </Card>
      </div>

      {/* Category Chart */}
      {catData.length > 0 && (
        <Card className="border-slate-100 dark:border-slate-700 dark:bg-slate-900">
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2 text-slate-900 dark:text-slate-100"><BarChart3 className="w-4 h-4 text-blue-500" /> Products by Category</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={catData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "currentColor" }} className="text-slate-500 dark:text-slate-400" />
                <YAxis tick={{ fontSize: 11, fill: "currentColor" }} className="text-slate-500 dark:text-slate-400" />
                <Tooltip contentStyle={{ backgroundColor: "var(--popover)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--popover-foreground)" }} formatter={(val) => [`${val} products`, "Count"]} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {catData.map((_, i) => (
                    <Cell key={i} fill={["#3b82f6","#06b6d4","#10b981","#f59e0b","#8b5cf6","#ef4444","#f97316","#6366f1"][i % 8]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input className="pl-9" placeholder="Search by name or SKU…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All Categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c.replace(/_/g, " ")}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="low_stock">Low Stock</SelectItem>
            <SelectItem value="out_of_stock">Out of Stock</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk Stock Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
          <Edit3 className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Edit stock quantities inline, then click "Save Stock Updates"</span>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-800">
              <TableHead>Product</TableHead>
              <TableHead>Category / Sub</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Current Stock</TableHead>
              <TableHead>New Stock</TableHead>
              <TableHead>Alert At</TableHead>
              <TableHead>Sales</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(p => {
              const threshold = p.low_stock_threshold ?? 5;
              const isLow = p.stock_quantity <= threshold && p.stock_quantity > 0;
              const isOut = p.stock_quantity === 0;
              const perf = salesMap[p.id] || { sold: 0, revenue: 0 };
              const editVal = bulkEdits[p.id];
              return (
                <TableRow key={p.id} className={isOut ? "bg-red-50/40 dark:bg-red-950/20" : isLow ? "bg-amber-50/40 dark:bg-amber-950/20" : "hover:bg-slate-50 dark:hover:bg-slate-800/50"}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {p.image_url && <img src={p.image_url} alt="" className="w-8 h-8 rounded object-cover border flex-shrink-0" />}
                      <span className="font-medium text-sm text-slate-900 dark:text-slate-100">{p.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-slate-500 dark:text-slate-400">
                    <span className="capitalize">{p.category?.replace(/_/g, " ")}</span>
                    {p.sub_category && <><br /><span className="text-slate-400 dark:text-slate-500">{p.sub_category}</span></>}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-slate-400 dark:text-slate-500">{p.sku || "—"}</TableCell>
                  <TableCell className="text-sm text-slate-900 dark:text-slate-100">K{p.price?.toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <span className={`font-semibold text-sm ${isOut ? "text-red-600 dark:text-red-400" : isLow ? "text-amber-600 dark:text-amber-400" : "text-slate-800 dark:text-slate-200"}`}>
                        {p.stock_quantity}
                      </span>
                      {isOut && <Badge className="bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 text-[10px] px-1.5">Out</Badge>}
                      {isLow && <Badge className="bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 text-[10px] px-1.5">Low</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      placeholder={String(p.stock_quantity)}
                      value={editVal ?? ""}
                      onChange={e => handleBulkChange(p.id, e.target.value)}
                      className={`h-8 w-24 text-sm ${editVal !== undefined && editVal !== "" ? "border-blue-400 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-500" : ""}`}
                    />
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => openThreshold(p)}
                      className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                    >
                      <AlertTriangle className="w-3 h-3" /> ≤{threshold}
                    </button>
                  </TableCell>
                  <TableCell className="text-xs text-slate-500 dark:text-slate-400">
                    {perf.sold > 0 ? (
                      <div><span className="font-medium text-slate-700 dark:text-slate-300">{perf.sold} sold</span><br />K{perf.revenue.toLocaleString()}</div>
                    ) : <span className="text-slate-300 dark:text-slate-600">—</span>}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] capitalize">{p.status}</Badge>
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={9} className="text-center py-12 text-slate-400 dark:text-slate-500">No products match filters</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Threshold Dialog */}
      <Dialog open={!!thresholdDialog} onOpenChange={() => setThresholdDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Set Low-Stock Alert Threshold</DialogTitle></DialogHeader>
          <div className="py-2 space-y-3">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Send an alert when <strong>{thresholdDialog?.name}</strong> stock falls to or below:
            </p>
            <div>
              <Label>Alert when stock ≤</Label>
              <Input type="number" min="0" value={thresholdVal} onChange={e => setThresholdVal(e.target.value)} className="mt-1 w-32" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setThresholdDialog(null)}>Cancel</Button>
            <Button onClick={saveThreshold} className="bg-amber-500 hover:bg-amber-600">Save Threshold</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}