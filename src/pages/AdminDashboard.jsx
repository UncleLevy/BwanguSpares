import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  LayoutDashboard, Store, Package, Users, MapPin, Wrench,
  CheckCircle2, XCircle, Clock, Eye, ShoppingCart, TrendingUp,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("overview");
  const [shops, setShops] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [regionDialog, setRegionDialog] = useState(false);
  const [newRegion, setNewRegion] = useState({ name: "", province: "" });
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const u = await base44.auth.me();
      if (u.role !== "admin") { navigate(createPageUrl("Home")); return; }
      setUser(u);
      const [s, p, o, r] = await Promise.all([
        base44.entities.Shop.list("-created_date", 50),
        base44.entities.Product.list("-created_date", 50),
        base44.entities.Order.list("-created_date", 50),
        base44.entities.Region.list(),
      ]);
      setShops(s); setProducts(p); setOrders(o); setRegions(r);
      setLoading(false);
    })();
  }, []);

  const pendingShops = shops.filter(s => s.status === "pending");

  const handleShopStatus = async (shop, status) => {
    await base44.entities.Shop.update(shop.id, { status });
    setShops(shops.map(s => s.id === shop.id ? { ...s, status } : s));
    toast.success(`Shop ${status}`);
  };

  const addRegion = async () => {
    if (!newRegion.name) return;
    const r = await base44.entities.Region.create(newRegion);
    setRegions([...regions, r]);
    setNewRegion({ name: "", province: "" });
    setRegionDialog(false);
    toast.success("Region added");
  };

  const deleteRegion = async (id) => {
    await base44.entities.Region.delete(id);
    setRegions(regions.filter(r => r.id !== id));
    toast.success("Region deleted");
  };

  const sidebarItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard, onClick: () => setView("overview") },
    { id: "shops", label: "Shops", icon: Store, onClick: () => setView("shops"), badge: pendingShops.length || null },
    { id: "products", label: "Products", icon: Package, onClick: () => setView("products") },
    { id: "orders", label: "Orders", icon: ShoppingCart, onClick: () => setView("orders") },
    { id: "regions", label: "Regions", icon: MapPin, onClick: () => setView("regions") },
  ];

  if (loading) return <div className="flex h-screen items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" /></div>;

  const stats = [
    { label: "Total Shops", value: shops.length, icon: Store, color: "bg-blue-50 text-blue-600" },
    { label: "Pending Shops", value: pendingShops.length, icon: Clock, color: "bg-amber-50 text-amber-600" },
    { label: "Products", value: products.length, icon: Package, color: "bg-emerald-50 text-emerald-600" },
    { label: "Orders", value: orders.length, icon: ShoppingCart, color: "bg-purple-50 text-purple-600" },
  ];

  const statusColors = {
    pending: "bg-amber-50 text-amber-700", approved: "bg-emerald-50 text-emerald-700",
    rejected: "bg-red-50 text-red-700", suspended: "bg-slate-100 text-slate-700",
  };

  const orderStatusColors = {
    pending: "bg-amber-50 text-amber-700", confirmed: "bg-blue-50 text-blue-700",
    processing: "bg-indigo-50 text-indigo-700", shipped: "bg-purple-50 text-purple-700",
    delivered: "bg-emerald-50 text-emerald-700", cancelled: "bg-red-50 text-red-700",
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <DashboardSidebar items={sidebarItems} active={view} title="Admin Panel" />

      <main className="flex-1 p-6 lg:p-8 overflow-auto">
        {view === "overview" && (
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-6">Dashboard Overview</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {stats.map((s, i) => (
                <Card key={i} className="border-slate-100">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${s.color}`}>
                      <s.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900">{s.value}</p>
                      <p className="text-xs text-slate-500">{s.label}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {pendingShops.length > 0 && (
              <Card className="border-amber-200 bg-amber-50/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-amber-700">
                    <AlertCircle className="w-5 h-5" /> {pendingShops.length} shop(s) awaiting approval
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button size="sm" variant="outline" onClick={() => setView("shops")} className="border-amber-300 text-amber-700 hover:bg-amber-100">
                    Review Now
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {view === "shops" && (
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-6">Manage Shops</h1>
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>Shop</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shops.map(shop => (
                    <TableRow key={shop.id}>
                      <TableCell className="font-medium">{shop.name}</TableCell>
                      <TableCell className="text-sm text-slate-500">{shop.owner_name || shop.owner_email}</TableCell>
                      <TableCell className="text-sm">{shop.region_name}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[11px]">{shop.slot_type}</Badge></TableCell>
                      <TableCell><Badge className={statusColors[shop.status]}>{shop.status}</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {shop.status === "pending" && (
                            <>
                              <Button size="sm" variant="ghost" className="h-8 text-emerald-600 hover:bg-emerald-50" onClick={() => handleShopStatus(shop, "approved")}>
                                <CheckCircle2 className="w-4 h-4 mr-1" /> Approve
                              </Button>
                              <Button size="sm" variant="ghost" className="h-8 text-red-600 hover:bg-red-50" onClick={() => handleShopStatus(shop, "rejected")}>
                                <XCircle className="w-4 h-4 mr-1" /> Reject
                              </Button>
                            </>
                          )}
                          {shop.status === "approved" && (
                            <Button size="sm" variant="ghost" className="h-8 text-red-600 hover:bg-red-50" onClick={() => handleShopStatus(shop, "suspended")}>
                              Suspend
                            </Button>
                          )}
                          {shop.status === "suspended" && (
                            <Button size="sm" variant="ghost" className="h-8 text-emerald-600 hover:bg-emerald-50" onClick={() => handleShopStatus(shop, "approved")}>
                              Reactivate
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {view === "products" && (
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-6">All Products</h1>
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>Product</TableHead>
                    <TableHead>Shop</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell className="text-sm text-slate-500">{p.shop_name}</TableCell>
                      <TableCell>K{p.price?.toLocaleString()}</TableCell>
                      <TableCell>{p.stock_quantity}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[11px]">{p.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {view === "orders" && (
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-6">All Orders</h1>
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>Order</TableHead>
                    <TableHead>Buyer</TableHead>
                    <TableHead>Shop</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map(o => (
                    <TableRow key={o.id}>
                      <TableCell className="font-mono text-xs">{o.id?.slice(0,8)}</TableCell>
                      <TableCell className="text-sm">{o.buyer_name || o.buyer_email}</TableCell>
                      <TableCell className="text-sm text-slate-500">{o.shop_name}</TableCell>
                      <TableCell className="font-medium">K{o.total_amount?.toLocaleString()}</TableCell>
                      <TableCell><Badge className={orderStatusColors[o.status]}>{o.status}</Badge></TableCell>
                      <TableCell className="text-xs text-slate-400">{new Date(o.created_date).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {view === "regions" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-slate-900">Regions</h1>
              <Button onClick={() => setRegionDialog(true)} className="bg-blue-600 hover:bg-blue-700">
                <MapPin className="w-4 h-4 mr-1.5" /> Add Region
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {regions.map(r => (
                <Card key={r.id} className="border-slate-100">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-900">{r.name}</h3>
                      {r.province && <p className="text-xs text-slate-500">{r.province}</p>}
                    </div>
                    <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-50" onClick={() => deleteRegion(r.id)}>
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Dialog open={regionDialog} onOpenChange={setRegionDialog}>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Region</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Region Name</Label>
                    <Input value={newRegion.name} onChange={e => setNewRegion({...newRegion, name: e.target.value})} className="mt-1" />
                  </div>
                  <div>
                    <Label>Province</Label>
                    <Input value={newRegion.province} onChange={e => setNewRegion({...newRegion, province: e.target.value})} className="mt-1" />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={addRegion} className="bg-blue-600 hover:bg-blue-700">Add Region</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </main>
    </div>
  );
}