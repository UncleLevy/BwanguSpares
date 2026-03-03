import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  LayoutDashboard, Store, Package, Users, MapPin, Wrench,
  CheckCircle2, XCircle, Clock, Eye, ShoppingCart, TrendingUp,
  AlertCircle, BarChart3, DollarSign, Flag, ShieldOff, ScrollText, ShieldCheck, Truck
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
import StatsCard from "@/components/analytics/StatsCard";
import SalesChart from "@/components/analytics/SalesChart";
import CategoryChart from "@/components/analytics/CategoryChart";
import TopItemsList from "@/components/analytics/TopItemsList";
import ReportsPanel from "@/components/admin/ReportsPanel";
import UsersPanel from "@/components/admin/UsersPanel";
import AuditLogPanel from "@/components/admin/AuditLogPanel";
import OrdersPanel from "@/components/admin/OrdersPanel";
import ReportingPanel from "@/components/admin/ReportingPanel";
import PayoutsPanel from "@/components/admin/PayoutsPanel";
import { logAudit } from "@/components/shared/auditLog";
import AdminShippingRates from "@/components/admin/AdminShippingRates";
import AdminProductsPanel from "@/components/admin/AdminProductsPanel";
import AdminLoyaltyPanel from "@/components/admin/AdminLoyaltyPanel";

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("overview");
  const [shops, setShops] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [regions, setRegions] = useState([]);
  const [towns, setTowns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [regionDialog, setRegionDialog] = useState(false);
  const [newRegion, setNewRegion] = useState({ name: "", province: "" });
  const [townDialog, setTownDialog] = useState(false);
  const [newTown, setNewTown] = useState({ name: "", region_id: "", region_name: "" });
  const [reportCount, setReportCount] = useState(0);
  const [deduping, setDeduping] = useState(false);
  const [deleteShopDialog, setDeleteShopDialog] = useState(false);
  const [shopToDelete, setShopToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const u = await base44.auth.me();
      if (u.role !== "admin") { navigate(createPageUrl("Home")); return; }
      setUser(u);
      const [s, p, o, r, t] = await Promise.all([
        base44.entities.Shop.list("-created_date", 50),
        base44.entities.Product.list("-created_date", 50),
        base44.entities.Order.list("-created_date", 50),
        base44.entities.Region.list(),
        base44.entities.Town.list(),
      ]);
      setShops(s); setProducts(p); setOrders(o); setRegions(r); setTowns(t);
      const reports = await base44.entities.Report.filter({ status: "pending" });
      setReportCount(reports.length);
      setLoading(false);
    })();
  }, []);

  const pendingShops = shops.filter(s => s.status === "pending");

  const handleShopStatus = async (shop, status) => {
    await base44.entities.Shop.update(shop.id, { status });
    setShops(shops.map(s => s.id === shop.id ? { ...s, status } : s));
    const actionMap = { approved: "approve_shop", rejected: "reject_shop", suspended: "suspend_shop" };
    if (actionMap[status]) {
      await logAudit(user, actionMap[status], {
        entity_type: "Shop",
        entity_id: shop.id,
        entity_label: shop.name,
        details: `Shop status changed to ${status}`,
      });
    }
    toast.success(`Shop ${status}`);
  };

  const addRegion = async () => {
    if (!newRegion.name) return;
    const r = await base44.entities.Region.create(newRegion);
    setRegions([...regions, r]);
    await logAudit(user, "add_region", { entity_type: "Region", entity_id: r.id, entity_label: r.name });
    setNewRegion({ name: "", province: "" });
    setRegionDialog(false);
    toast.success("Region added");
  };

  const deleteRegion = async (id) => {
    const r = regions.find(r => r.id === id);
    await base44.entities.Region.delete(id);
    setRegions(regions.filter(r => r.id !== id));
    await logAudit(user, "delete_region", { entity_type: "Region", entity_id: id, entity_label: r?.name });
    toast.success("Region deleted");
  };

  const addTown = async () => {
    if (!newTown.name || !newTown.region_id) {
      toast.error("Please fill in all required fields");
      return;
    }
    const t = await base44.entities.Town.create(newTown);
    setTowns([...towns, t]);
    await logAudit(user, "add_region", { entity_type: "Town", entity_id: t.id, entity_label: t.name });
    setNewTown({ name: "", region_id: "", region_name: "" });
    setTownDialog(false);
    toast.success("Town added");
  };

  const deleteTown = async (id) => {
    const t = towns.find(t => t.id === id);
    await base44.entities.Town.delete(id);
    setTowns(towns.filter(t => t.id !== id));
    await logAudit(user, "delete_region", { entity_type: "Town", entity_id: id, entity_label: t?.name });
    toast.success("Town deleted");
  };

  const confirmDeleteShop = (shop) => {
    setShopToDelete(shop);
    setDeleteConfirmName("");
    setDeleteShopDialog(true);
  };

  const deleteShop = async () => {
    if (!shopToDelete) return;
    setDeleting(true);
    await base44.entities.Shop.delete(shopToDelete.id);
    setShops(shops.filter(s => s.id !== shopToDelete.id));
    await logAudit(user, "reject_shop", {
      entity_type: "Shop",
      entity_id: shopToDelete.id,
      entity_label: shopToDelete.name,
      details: `Shop permanently deleted by admin`,
    });
    toast.success(`Shop "${shopToDelete.name}" has been permanently deleted.`);
    setDeleteShopDialog(false);
    setShopToDelete(null);
    setDeleting(false);
  };

  const runDedup = async () => {
    setDeduping(true);
    try {
      const res = await base44.functions.invoke("deduplicateData", {});
      const { total_fixed, report } = res.data;
      if (total_fixed === 0) {
        toast.success("No duplicates found — data is clean!");
      } else {
        toast.success(`Removed ${total_fixed} duplicate(s): ${report.shops.removed} shops, ${report.towns.removed} towns, ${report.regions.removed} regions, ${report.stripe_accounts.removed} Stripe links.`);
      }
    } catch (e) {
      toast.error(e.message || "Deduplication failed");
    }
    setDeduping(false);
  };

  const sidebarItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard, onClick: () => setView("overview") },
    { id: "analytics", label: "Analytics", icon: BarChart3, onClick: () => setView("analytics") },
    { id: "payouts", label: "Payouts", icon: DollarSign, onClick: () => setView("payouts") },
    { id: "reports", label: "Reports", icon: Flag, onClick: () => setView("reports") },
    { id: "shipping", label: "Shipping Rates", icon: Truck, onClick: () => setView("shipping") },
    { id: "shops", label: "Shops", icon: Store, onClick: () => setView("shops"), badge: pendingShops.length || null },
    { id: "products", label: "Products", icon: Package, onClick: () => setView("products") },
    { id: "regions", label: "Regions", icon: MapPin, onClick: () => setView("regions") },
    { id: "cities", label: "Cities", icon: MapPin, onClick: () => setView("cities") },
    { id: "users", label: "Users", icon: Users, onClick: () => setView("users") },
    { id: "audit", label: "Audit Log", icon: ScrollText, onClick: () => setView("audit") },
  ];

  if (loading) return <div className="flex h-screen items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" /></div>;

  const stats = [
    { label: "Total Shops", value: shops.length, icon: Store, color: "bg-blue-50 text-blue-600" },
    { label: "Pending Shops", value: pendingShops.length, icon: Clock, color: "bg-amber-50 text-amber-600" },
    { label: "Products", value: products.length, icon: Package, color: "bg-emerald-50 text-emerald-600" },
    { label: "Orders", value: orders.length, icon: ShoppingCart, color: "bg-purple-50 text-purple-600" },
  ];

  // Analytics calculations
  const totalRevenue = orders.filter(o => o.status !== "cancelled").reduce((s, o) => s + (o.total_amount || 0), 0);
  const completedOrders = orders.filter(o => o.status === "delivered");
  
  const last30Days = orders.filter(o => {
    const orderDate = new Date(o.created_date);
    const daysAgo = (Date.now() - orderDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysAgo <= 30;
  });

  const ordersByDay = last30Days.reduce((acc, order) => {
    const date = new Date(order.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (!acc[date]) acc[date] = 0;
    acc[date]++;
    return acc;
  }, {});

  const ordersChartData = Object.entries(ordersByDay).slice(-7).map(([name, sales]) => ({ name, sales }));

  const shopGrowth = shops.reduce((acc, shop) => {
    const month = new Date(shop.created_date).toLocaleDateString('en-US', { month: 'short' });
    if (!acc[month]) acc[month] = 0;
    acc[month]++;
    return acc;
  }, {});

  const shopGrowthData = Object.entries(shopGrowth).slice(-6).map(([name, sales]) => ({ name, sales }));

  const categoryStats = {};
  products.forEach(p => {
    const cat = p.category || "other";
    if (!categoryStats[cat]) categoryStats[cat] = { count: 0, revenue: 0 };
    categoryStats[cat].count++;
  });

  orders.forEach(order => {
    order.items?.forEach(item => {
      const product = products.find(p => p.id === item.product_id);
      if (product) {
        const cat = product.category || "other";
        if (categoryStats[cat]) {
          categoryStats[cat].revenue += (item.price || 0) * (item.quantity || 1);
        }
      }
    });
  });

  const topCategories = Object.entries(categoryStats)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 5)
    .map(([name, data]) => ({
      name: name.replace('_', ' '),
      value: data.count
    }));

  const shopRevenue = {};
  orders.filter(o => o.status !== "cancelled").forEach(order => {
    if (!shopRevenue[order.shop_id]) {
      shopRevenue[order.shop_id] = { name: order.shop_name, revenue: 0 };
    }
    shopRevenue[order.shop_id].revenue += order.total_amount || 0;
  });

  const topShops = Object.values(shopRevenue)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
    .map(s => ({
      name: s.name,
      value: `K${s.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }));

  const topProducts = {};
  orders.filter(o => o.status !== "cancelled").forEach(order => {
    order.items?.forEach(item => {
      if (!topProducts[item.product_id]) {
        topProducts[item.product_id] = { name: item.product_name, count: 0, revenue: 0 };
      }
      topProducts[item.product_id].count += item.quantity || 1;
      topProducts[item.product_id].revenue += (item.price || 0) * (item.quantity || 1);
    });
  });

  const topProductsList = Object.values(topProducts)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
    .map(p => ({
      name: p.name,
      value: `K${p.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtitle: `${p.count} sold`
    }));

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
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <DashboardSidebar items={sidebarItems} active={view} title="Admin Panel" />

      <main className="flex-1 pt-16 lg:pt-8 p-4 lg:p-8 overflow-auto min-w-0 text-slate-900 dark:text-slate-100">
        {view === "overview" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Dashboard Overview</h1>
              <Button onClick={runDedup} disabled={deduping} variant="outline" className="gap-2 border-slate-300 text-slate-700 hover:bg-slate-50">
                <ShieldCheck className="w-4 h-4" />
                {deduping ? "Scanning..." : "Remove Duplicates"}
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {stats.map((s, i) => (
                <Card key={i} className="border-slate-100 dark:border-slate-700 dark:bg-slate-900">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${s.color}`}>
                      <s.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{s.value}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{s.label}</p>
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

        {view === "analytics" && (
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">Platform Analytics</h1>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatsCard
                title="Total Revenue"
                value={`K${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                subtitle="All-time platform revenue"
                icon={DollarSign}
                color="bg-emerald-50 text-emerald-600"
              />
              <StatsCard
                title="Active Shops"
                value={shops.filter(s => s.status === "approved").length}
                subtitle={`${pendingShops.length} pending approval`}
                icon={Store}
                color="bg-blue-50 text-blue-600"
              />
              <StatsCard
                title="Completed Orders"
                value={completedOrders.length}
                subtitle={`${orders.filter(o => o.status === "pending").length} pending`}
                icon={ShoppingCart}
                color="bg-purple-50 text-purple-600"
              />
              <StatsCard
                title="Total Products"
                value={products.filter(p => p.status === "active").length}
                subtitle="Active listings"
                icon={Package}
                color="bg-amber-50 text-amber-600"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
              <SalesChart data={ordersChartData} title="Orders Volume (Last 7 Days)" />
              <SalesChart data={shopGrowthData} title="Shop Growth (Last 6 Months)" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
              <CategoryChart data={topCategories} title="Top Selling Categories" />
              <TopItemsList items={topShops} title="Top Performing Shops" icon={Store} />
            </div>

            <div>
              <TopItemsList items={topProductsList} title="Best Selling Products" icon={Package} />
            </div>
          </div>
        )}

        {view === "shops" && (
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">Manage Shops</h1>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-800">
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
                      <TableCell className="text-sm text-slate-500 dark:text-slate-400">{shop.owner_name || shop.owner_email}</TableCell>
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
                          <Button size="sm" variant="ghost" className="h-8 text-red-600 hover:bg-red-50" onClick={() => confirmDeleteShop(shop)}>
                            <XCircle className="w-4 h-4 mr-1" /> Delete
                          </Button>
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
          <AdminProductsPanel
            products={products}
            shops={shops}
            regions={regions}
            onProductsChange={setProducts}
          />
        )}

        {view === "orders" && (
          <OrdersPanel 
            orders={orders} 
            onOrderUpdate={(updatedOrder) => {
              setOrders(orders.map(o => o.id === updatedOrder.id ? updatedOrder : o));
            }}
          />
        )}

        {view === "payouts" && <PayoutsPanel adminUser={user} />}
        {view === "shipping" && <AdminShippingRates />}
        {view === "reports" && <ReportingPanel orders={orders} products={products} shops={shops} />}
        {view === "audit" && <AuditLogPanel />}

        {view === "users" && <UsersPanel adminUser={user} />}

        {view === "regions" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Regions</h1>
              <Button onClick={() => setRegionDialog(true)} className="bg-blue-600 hover:bg-blue-700">
                <MapPin className="w-4 h-4 mr-1.5" /> Add Region
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {regions.map(r => (
                <Card key={r.id} className="border-slate-100 dark:border-slate-700 dark:bg-slate-900">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100">{r.name}</h3>
                      {r.province && <p className="text-xs text-slate-500 dark:text-slate-400">{r.province}</p>}
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

        {view === "cities" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Cities/Towns</h1>
              <Button onClick={() => setTownDialog(true)} className="bg-blue-600 hover:bg-blue-700">
                <MapPin className="w-4 h-4 mr-1.5" /> Add City/Town
              </Button>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-800">
                    <TableHead>City/Town Name</TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {towns.map(t => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.name}</TableCell>
                      <TableCell>{t.region_name}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-50" onClick={() => deleteTown(t.id)}>
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <Dialog open={townDialog} onOpenChange={setTownDialog}>
              <DialogContent>
                <DialogHeader><DialogTitle>Add City/Town</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>City/Town Name *</Label>
                    <Input value={newTown.name} onChange={e => setNewTown({...newTown, name: e.target.value})} placeholder="e.g. Lusaka City, Ndola" className="mt-1" />
                  </div>
                  <div>
                    <Label>Region *</Label>
                    <select 
                      value={newTown.region_id} 
                      onChange={e => {
                        const region = regions.find(r => r.id === e.target.value);
                        setNewTown({...newTown, region_id: e.target.value, region_name: region?.name || ""});
                      }}
                      className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg bg-white dark:bg-slate-900 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                    >
                      <option value="">Select a region</option>
                      {regions.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={addTown} className="bg-blue-600 hover:bg-blue-700">Add City/Town</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </main>

      {/* Delete Shop Confirmation Dialog */}
      <Dialog open={deleteShopDialog} onOpenChange={setDeleteShopDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" /> Permanently Delete Shop
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-slate-700 dark:text-slate-300 font-medium">
              You are about to delete <span className="font-bold">"{shopToDelete?.name}"</span>.
            </p>
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4 text-sm text-red-700 dark:text-red-300 space-y-1.5">
              <p className="font-semibold">⚠️ This action cannot be undone. It will:</p>
              <ul className="list-disc ml-4 space-y-1">
                <li>Permanently remove the shop and all its data</li>
                <li>Delete all associated products and listings</li>
                <li>Remove the shop's wallet and earnings records</li>
                <li>Disconnect any linked Stripe account</li>
                <li>The shop owner will lose access to their shop dashboard</li>
              </ul>
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1.5">
                Type <span className="font-bold text-slate-900 dark:text-slate-100">"{shopToDelete?.name}"</span> to confirm:
              </p>
              <input
                type="text"
                value={deleteConfirmName}
                onChange={e => setDeleteConfirmName(e.target.value)}
                placeholder="Shop name..."
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteShopDialog(false)}>Cancel</Button>
            <Button onClick={deleteShop} disabled={deleting || deleteConfirmName !== shopToDelete?.name} className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50">
              {deleting ? "Deleting..." : "Yes, Delete Permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}