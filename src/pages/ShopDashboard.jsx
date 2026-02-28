import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  LayoutDashboard, Package, Wrench, ShoppingCart, Plus,
  Pencil, Trash2, Store, User, DollarSign, TrendingUp, BarChart3, MapPin, FileSearch, MessageSquare,
  ClipboardList, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import PullToRefresh from "@/components/shared/PullToRefresh";
import ShopPartsRequests from "@/components/parts/ShopPartsRequests";
import TechnicianHireRequests from "@/components/technicians/TechnicianHireRequests";
import MarketInsights from "@/components/analytics/MarketInsights";
import ShopMessages from "@/components/messaging/ShopMessages";
import DocumentPrinter from "@/components/documents/DocumentPrinter";
import InventoryPanel from "@/components/inventory/InventoryPanel";
import StatsCard from "@/components/analytics/StatsCard";
import SalesChart from "@/components/analytics/SalesChart";
import CategoryChart from "@/components/analytics/CategoryChart";
import TopItemsList from "@/components/analytics/TopItemsList";
import ProductVariationsPanel from "@/components/products/ProductVariationsPanel";
import BulkEditPanel from "@/components/products/BulkEditPanel";
import LowStockAlerts from "@/components/products/LowStockAlerts";
import AddressInput from "@/components/shared/AddressInput";

const CATEGORIES = [
  { value: "engine", label: "Engine" }, { value: "brakes", label: "Brakes" },
  { value: "suspension", label: "Suspension" }, { value: "electrical", label: "Electrical" },
  { value: "body", label: "Body" }, { value: "transmission", label: "Transmission" },
  { value: "exhaust", label: "Exhaust" }, { value: "cooling", label: "Cooling" },
  { value: "steering", label: "Steering" }, { value: "interior", label: "Interior" },
  { value: "accessories", label: "Accessories" }, { value: "tyres", label: "Tyres" },
  { value: "filters", label: "Filters" }, { value: "oils_fluids", label: "Oils & Fluids" },
  { value: "other", label: "Other" },
];

const SPECIALIZATIONS = [
  { value: "engine", label: "Engine" }, { value: "electrical", label: "Electrical" },
  { value: "body_work", label: "Body Work" }, { value: "transmission", label: "Transmission" },
  { value: "brakes", label: "Brakes" }, { value: "general", label: "General" },
  { value: "diagnostics", label: "Diagnostics" }, { value: "ac_heating", label: "AC/Heating" },
  { value: "tyres", label: "Tyres" },
];

export default function ShopDashboard() {
  const [user, setUser] = useState(null);
  const [shops, setShops] = useState([]);
  const [shop, setShop] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [view, setView] = useState("overview");
  const [products, setProducts] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewShopDialog, setShowNewShopDialog] = useState(false);
  const [newShopForm, setNewShopForm] = useState({ name: "", phone: "", address: "", region: "", town: "" });

  const [productDialog, setProductDialog] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [selectedProductForVariations, setSelectedProductForVariations] = useState(null);
  const [productForm, setProductForm] = useState({
    name: "", description: "", price: "", category: "other", sub_category: "", brand: "",
    compatible_vehicles: "", condition: "new", stock_quantity: "", sku: "", low_stock_threshold: "5",
    tags: []
  });

  const [techDialog, setTechDialog] = useState(false);
  const [editTech, setEditTech] = useState(null);
  const [techForm, setTechForm] = useState({
    name: "", phone: "", specialization: "general", experience_years: "",
    hourly_rate: "", available: true,
  });

  const [uploading, setUploading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const u = await base44.auth.me();
      setUser(u);
      // Fetch all shops for this user
      const userShops = await base44.entities.Shop.filter({ owner_email: u.email });
      setShops(userShops);
      if (!userShops || userShops.length === 0) { navigate(createPageUrl("RegisterShop")); return; }
      // Fetch subscription tier
      const subs = await base44.entities.Subscription.filter({ user_email: u.email });
      setSubscription(subs[0]);
      // Load the first shop's data
      const firstShop = userShops[0];
      setShop(firstShop);
      const [p, t, o] = await Promise.all([
        base44.entities.Product.filter({ shop_id: firstShop.id }),
        base44.entities.Technician.filter({ shop_id: firstShop.id }),
        base44.entities.Order.filter({ shop_id: firstShop.id }, "-created_date", 50),
      ]);
      setProducts(p); setTechnicians(t); setOrders(o);
      setLoading(false);
    })();
  }, []);

  const handleImageUpload = async (e, isProduct = true) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      if (isProduct) {
        setProductForm({ ...productForm, image_url: file_url });
      } else {
        setTechForm({ ...techForm, photo_url: file_url });
      }
      toast.success("Photo uploaded");
    } catch (error) {
      toast.error("Failed to upload photo");
    }
    setUploading(false);
  };

  const saveProduct = async () => {
    const qty = parseInt(productForm.stock_quantity) || 0;
    const data = {
      ...productForm,
      price: parseFloat(productForm.price) || 0,
      stock_quantity: qty,
      low_stock_threshold: parseInt(productForm.low_stock_threshold) || 5,
      shop_id: shop.id,
      shop_name: shop.name,
      status: qty === 0 ? "out_of_stock" : "active",
      tags: productForm.tags
    };
    if (editProduct) {
      await base44.entities.Product.update(editProduct.id, data);
      setProducts(products.map(p => p.id === editProduct.id ? { ...p, ...data } : p));
      toast.success("Product updated");
    } else {
      const created = await base44.entities.Product.create(data);
      setProducts([created, ...products]);
      toast.success("Product added");
    }
    setProductDialog(false);
    setEditProduct(null);
    setProductForm({ name: "", description: "", price: "", category: "other", sub_category: "", brand: "", compatible_vehicles: "", condition: "new", stock_quantity: "", sku: "", low_stock_threshold: "5", tags: [] });
  };

  const deleteProduct = async (id) => {
    await base44.entities.Product.delete(id);
    setProducts(products.filter(p => p.id !== id));
    toast.success("Product deleted");
  };

  const openEditProduct = (p) => {
    setEditProduct(p);
    setProductForm({
      name: p.name, description: p.description || "", price: String(p.price),
      category: p.category, sub_category: p.sub_category || "", brand: p.brand || "",
      compatible_vehicles: p.compatible_vehicles || "", condition: p.condition,
      stock_quantity: String(p.stock_quantity || 0), sku: p.sku || "",
      low_stock_threshold: String(p.low_stock_threshold ?? 5),
      tags: p.tags || []
    });
    setProductDialog(true);
  };

  const saveTech = async () => {
    const data = {
      ...techForm,
      experience_years: parseInt(techForm.experience_years) || 0,
      hourly_rate: parseFloat(techForm.hourly_rate) || 0,
      shop_id: shop.id,
      shop_name: shop.name,
    };
    if (editTech) {
      await base44.entities.Technician.update(editTech.id, data);
      setTechnicians(technicians.map(t => t.id === editTech.id ? { ...t, ...data } : t));
      toast.success("Technician updated");
    } else {
      const created = await base44.entities.Technician.create(data);
      setTechnicians([created, ...technicians]);
      toast.success("Technician added");
    }
    setTechDialog(false);
    setEditTech(null);
    setTechForm({ name: "", phone: "", specialization: "general", experience_years: "", hourly_rate: "", available: true });
  };

  const deleteTech = async (id) => {
    await base44.entities.Technician.delete(id);
    setTechnicians(technicians.filter(t => t.id !== id));
    toast.success("Technician deleted");
  };

  const openEditTech = (t) => {
    setEditTech(t);
    setTechForm({
      name: t.name, phone: t.phone || "", specialization: t.specialization,
      experience_years: String(t.experience_years || ""), hourly_rate: String(t.hourly_rate || ""),
      available: t.available !== false,
    });
    setTechDialog(true);
  };

  const [trackingDialog, setTrackingDialog] = useState(false);
  const [trackingOrder, setTrackingOrder] = useState(null);
  const [trackingForm, setTrackingForm] = useState({
    tracking_number: "", current_location: "", estimated_delivery: ""
  });

  const updateOrderStatus = async (order, status) => {
    // Optimistic update
    setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status } : o));
    await base44.entities.Order.update(order.id, { status });
    toast.success("Order status updated");
  };

  const openTrackingDialog = (order) => {
    setTrackingOrder(order);
    setTrackingForm({
      tracking_number: order.tracking_number || "",
      current_location: order.current_location || "",
      estimated_delivery: order.estimated_delivery || ""
    });
    setTrackingDialog(true);
  };

  const saveTracking = async () => {
    await base44.entities.Order.update(trackingOrder.id, trackingForm);
    setOrders(orders.map(o => o.id === trackingOrder.id ? { ...o, ...trackingForm } : o));
    toast.success("Tracking information updated");
    setTrackingDialog(false);
  };

  const handleSwitchShop = async (shopId) => {
    const selectedShop = shops.find(s => s.id === shopId);
    setShop(selectedShop);
    const [p, t, o] = await Promise.all([
      base44.entities.Product.filter({ shop_id: shopId }),
      base44.entities.Technician.filter({ shop_id: shopId }),
      base44.entities.Order.filter({ shop_id: shopId }, "-created_date", 50),
    ]);
    setProducts(p);
    setTechnicians(t);
    setOrders(o);
  };

  const handleAddShop = async () => {
    if (!newShopForm.name || !newShopForm.address || !newShopForm.region || !newShopForm.town) {
      toast.error("Please fill in all required fields");
      return;
    }
    const tierLimits = { free: 1, standard: 3, premium: 5 };
    const maxShops = tierLimits[subscription?.tier || "free"];
    if (shops.length >= maxShops) {
      if (maxShops < 5) {
        toast.error(`${subscription?.tier || "Free"} plan allows only ${maxShops} shop${maxShops > 1 ? 's' : ''}. Contact us for an Enterprise plan with more branch slots.`);
      } else {
        toast.error("You've reached the maximum number of shops. Contact us for an Enterprise plan.");
      }
      return;
    }
    try {
      const newShop = await base44.entities.Shop.create({
        name: newShopForm.name,
        phone: newShopForm.phone,
        address: newShopForm.address,
        region: newShopForm.region,
        town: newShopForm.town,
        owner_email: user.email,
        owner_name: user.full_name,
        status: "pending"
      });
      setShops([...shops, newShop]);
      setShowNewShopDialog(false);
      setNewShopForm({ name: "", phone: "", address: "", region: "", town: "" });
      toast.success("✓ Branch added successfully. Awaiting admin approval.");
    } catch (error) {
      toast.error("✗ Failed to add branch. Please try again.");
    }
  };

  const sidebarItems = [
    { id: "shops", label: "My Shops", icon: Store, onClick: () => setView("shops") },
    { id: "overview", label: "Overview", icon: LayoutDashboard, onClick: () => setView("overview") },
    { id: "analytics", label: "Analytics", icon: BarChart3, onClick: () => setView("analytics") },
    { id: "market_insights", label: "Market Insights", icon: TrendingUp, onClick: () => setView("market_insights") },
    { id: "products", label: "Products", icon: Package, onClick: () => setView("products") },
    { id: "technicians", label: "Technicians", icon: Wrench, onClick: () => setView("technicians") },
    { id: "orders", label: "Orders", icon: ShoppingCart, onClick: () => setView("orders"), badge: orders.filter(o => o.status === "pending").length || null },
    { id: "parts_requests", label: "Parts Requests", icon: FileSearch, onClick: () => setView("parts_requests") },
    { id: "hire_requests", label: "Hire Requests", icon: Wrench, onClick: () => setView("hire_requests") },
    { id: "messages", label: "Messages", icon: MessageSquare, onClick: () => setView("messages") },
    {
      id: "inventory", label: "Inventory", icon: ClipboardList, onClick: () => setView("inventory"),
      badge: products.filter(p => p.stock_quantity <= (p.low_stock_threshold ?? 5)).length || null
    },
  ];

  if (loading) return <div className="flex h-screen items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" /></div>;

  const totalRevenue = orders.filter(o => o.status !== "cancelled").reduce((s, o) => s + (o.total_amount || 0), 0);

  // Analytics calculations
  const completedOrders = orders.filter(o => o.status === "delivered");
  const last30Days = completedOrders.filter(o => {
    const orderDate = new Date(o.created_date);
    const daysAgo = (Date.now() - orderDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysAgo <= 30;
  });

  const salesByDay = last30Days.reduce((acc, order) => {
    const date = new Date(order.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (!acc[date]) acc[date] = 0;
    acc[date] += order.total_amount || 0;
    return acc;
  }, {});

  const salesChartData = Object.entries(salesByDay).slice(-7).map(([name, sales]) => ({ name, sales }));

  const productSales = {};
  completedOrders.forEach(order => {
    order.items?.forEach(item => {
      if (!productSales[item.product_id]) {
        productSales[item.product_id] = { name: item.product_name, count: 0, revenue: 0 };
      }
      productSales[item.product_id].count += item.quantity || 1;
      productSales[item.product_id].revenue += (item.price || 0) * (item.quantity || 1);
    });
  });

  const topProducts = Object.values(productSales)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map(p => ({
      name: p.name,
      value: `${p.count} sold`,
      subtitle: `K${p.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }));

  const techReviews = {};
  technicians.forEach(tech => {
    techReviews[tech.id] = { name: tech.name, rating: tech.rating || 0, count: 0 };
  });

  const topTechnicians = Object.values(techReviews)
    .filter(t => t.rating > 0)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 5)
    .map(t => ({
      name: t.name,
      value: `${t.rating.toFixed(1)} ★`,
    }));

  const categoryData = products.reduce((acc, p) => {
    const cat = p.category || "other";
    if (!acc[cat]) acc[cat] = 0;
    acc[cat]++;
    return acc;
  }, {});

  const categoryChartData = Object.entries(categoryData)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, value]) => ({ name: name.replace('_', ' '), value }));

  const orderStatusColors = {
    pending: "bg-amber-50 text-amber-700", confirmed: "bg-blue-50 text-blue-700",
    processing: "bg-indigo-50 text-indigo-700", shipped: "bg-purple-50 text-purple-700",
    delivered: "bg-emerald-50 text-emerald-700", cancelled: "bg-red-50 text-red-700",
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <DashboardSidebar items={sidebarItems} active={view} title="Shop Dashboard" />
      <main className="flex-1 pt-16 lg:pt-8 p-4 lg:p-8 overflow-auto min-w-0 text-slate-900 dark:text-slate-100">

        {view === "shops" && (
           <div>
             <div className="flex items-center justify-between mb-6">
               <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">My Shops</h1>
               <Button onClick={() => {
                 const tierLimits = { free: 1, standard: 3, premium: 5 };
                 const maxShops = tierLimits[subscription?.tier || "free"];
                 if (shops.length >= maxShops) {
                   toast.error(`${subscription?.tier || "Free"} plan allows only ${maxShops} shop${maxShops > 1 ? 's' : ''}. Upgrade to add more branches.`);
                 } else {
                   setShowNewShopDialog(true);
                 }
               }} className="bg-blue-600 hover:bg-blue-700 gap-1.5"><Plus className="w-4 h-4" /> Add Branch</Button>
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
               {shops.map(s => (
                 <Card key={s.id} className="border-slate-100 hover-lift cursor-pointer transition-all" onClick={() => { handleSwitchShop(s.id); setView("overview"); }}>
                   <CardContent className="p-5">
                     <div className="flex items-start justify-between mb-3">
                       <div>
                         <h3 className="font-semibold text-slate-900 dark:text-slate-100">{s.name}</h3>
                         <Badge className={s.status === "approved" ? "bg-emerald-50 text-emerald-700 mt-1" : "bg-amber-50 text-amber-700 mt-1"}>{s.status}</Badge>
                       </div>
                       <Store className="w-5 h-5 text-blue-600" />
                     </div>
                     <div className="space-y-2 text-xs text-slate-500">
                       {s.phone && <p className="flex items-center gap-2"><Phone className="w-3 h-3" /> {s.phone}</p>}
                       {s.town && <p className="flex items-center gap-2"><MapPin className="w-3 h-3" /> {s.town}</p>}
                     </div>
                     <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2">
                       <div className="flex-1 text-center">
                         <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{products.filter(p => p.shop_id === s.id).length}</p>
                         <p className="text-xs text-slate-500">Products</p>
                       </div>
                       <div className="flex-1 text-center">
                         <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{orders.filter(o => o.shop_id === s.id).length}</p>
                         <p className="text-xs text-slate-500">Orders</p>
                       </div>
                     </div>
                   </CardContent>
                 </Card>
               ))}
             </div>
           </div>
         )}

        {view === "overview" && (
           <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">{shop?.name}</h1>
                <p className="text-sm text-slate-500">
                  Status: <Badge className={shop?.status === "approved" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}>{shop?.status}</Badge>
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Select value={shop?.id} onValueChange={handleSwitchShop}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {shops.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={() => {
                  const tierLimits = { free: 1, standard: 3, premium: 5 };
                  const maxShops = tierLimits[subscription?.tier || "free"];
                  if (shops.length >= maxShops) {
                    if (maxShops < 5) {
                      toast.error(`${subscription?.tier || "Free"} plan allows only ${maxShops} shop${maxShops > 1 ? 's' : ''}. Contact us for an Enterprise plan with more branch slots.`);
                    } else {
                      toast.error("You've reached the maximum number of shops. Contact us for an Enterprise plan.");
                    }
                  } else {
                    setShowNewShopDialog(true);
                  }
                }} className="bg-blue-600 hover:bg-blue-700 gap-1.5"><Plus className="w-4 h-4" /> Add Branch</Button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Products", value: products.length, icon: Package, color: "bg-blue-50 text-blue-600" },
                { label: "Technicians", value: technicians.length, icon: Wrench, color: "bg-emerald-50 text-emerald-600" },
                { label: "Orders", value: orders.length, icon: ShoppingCart, color: "bg-purple-50 text-purple-600" },
                { label: "Revenue", value: `K${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: DollarSign, color: "bg-amber-50 text-amber-600" },
              ].map((s, i) => (
                <Card key={i} className="border-slate-100">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${s.color}`}><s.icon className="w-5 h-5" /></div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{s.value}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{s.label}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {view === "analytics" && (
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">Analytics</h1>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatsCard
                title="Total Revenue"
                value={`K${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                subtitle="All-time"
                icon={DollarSign}
                color="bg-emerald-50 text-emerald-600"
              />
              <StatsCard
                title="Completed Orders"
                value={completedOrders.length}
                subtitle={`${orders.filter(o => o.status === "pending").length} pending`}
                icon={ShoppingCart}
                color="bg-blue-50 text-blue-600"
              />
              <StatsCard
                title="Active Products"
                value={products.filter(p => p.status === "active").length}
                subtitle={`${products.filter(p => p.stock_quantity === 0).length} out of stock`}
                icon={Package}
                color="bg-purple-50 text-purple-600"
              />
              <StatsCard
                title="Avg Order Value"
                value={completedOrders.length > 0 ? `K${Math.round(totalRevenue / completedOrders.length).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "K0.00"}
                subtitle="Per completed order"
                icon={TrendingUp}
                color="bg-amber-50 text-amber-600"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
              <SalesChart data={salesChartData} title="Sales Trend (Last 7 Days)" />
              <CategoryChart data={categoryChartData} title="Products by Category" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <TopItemsList items={topProducts} title="Top Selling Products" icon={Package} />
              <TopItemsList items={topTechnicians} title="Top Rated Technicians" icon={Wrench} />
            </div>
          </div>
        )}

        {view === "products" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Products</h1>
              <Button onClick={() => { setEditProduct(null); setProductForm({ name: "", description: "", price: "", category: "other", brand: "", compatible_vehicles: "", condition: "new", stock_quantity: "", tags: [] }); setProductDialog(true); }}
                className="bg-blue-600 hover:bg-blue-700 gap-1.5"><Plus className="w-4 h-4" /> Add Product</Button>
            </div>
            <BulkEditPanel products={products} onUpdate={setProducts} />
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-800">
                    <TableHead>Name</TableHead><TableHead>Category</TableHead><TableHead>Price</TableHead><TableHead>Stock</TableHead><TableHead>Status</TableHead><TableHead>Tags</TableHead><TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[11px]">{p.category}</Badge></TableCell>
                      <TableCell>K{p.price?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                      <TableCell>{p.stock_quantity}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[11px]">{p.status}</Badge></TableCell>
                      <TableCell><div className="flex gap-1">{p.tags?.slice(0,2).map((tag, i) => <Badge key={i} variant="secondary" className="text-[10px]">{tag}</Badge>)}</div></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setSelectedProductForVariations(p); }}><Wrench className="w-3.5 h-3.5" title="Variations" /></Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEditProduct(p)}><Pencil className="w-3.5 h-3.5" /></Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => deleteProduct(p.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <Dialog open={productDialog} onOpenChange={setProductDialog}>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>{editProduct ? "Edit Product" : "Add Product"}</DialogTitle></DialogHeader>
                <div className="space-y-4 max-h-[60vh] overflow-auto pr-2">
                  <div><Label>Name *</Label><Input value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} className="mt-1" /></div>
                  <div><Label>Description</Label><Textarea value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} className="mt-1" rows={2} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Price (ZMW) *</Label><Input type="number" value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})} className="mt-1" /></div>
                    <div><Label>Stock *</Label><Input type="number" value={productForm.stock_quantity} onChange={e => setProductForm({...productForm, stock_quantity: e.target.value})} className="mt-1" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Category</Label><Select value={productForm.category} onValueChange={v => setProductForm({...productForm, category: v})}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent></Select></div>
                    <div><Label>Condition</Label><Select value={productForm.condition} onValueChange={v => setProductForm({...productForm, condition: v})}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="new">New</SelectItem><SelectItem value="used">Used</SelectItem><SelectItem value="refurbished">Refurbished</SelectItem></SelectContent></Select></div>
                  </div>
                  <div><Label>Sub-Category</Label><Input value={productForm.sub_category} onChange={e => setProductForm({...productForm, sub_category: e.target.value})} placeholder="e.g. Spark Plugs, Brake Pads…" className="mt-1" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>SKU</Label><Input value={productForm.sku} onChange={e => setProductForm({...productForm, sku: e.target.value})} placeholder="e.g. ENG-SP-001" className="mt-1" /></div>
                    <div><Label>Low Stock Alert ≤</Label><Input type="number" min="0" value={productForm.low_stock_threshold} onChange={e => setProductForm({...productForm, low_stock_threshold: e.target.value})} className="mt-1" /></div>
                  </div>
                  <div><Label>Brand</Label><Input value={productForm.brand} onChange={e => setProductForm({...productForm, brand: e.target.value})} className="mt-1" /></div>
                  <div><Label>Compatible Vehicles</Label><Input value={productForm.compatible_vehicles} onChange={e => setProductForm({...productForm, compatible_vehicles: e.target.value})} placeholder="e.g. Toyota Corolla 2015-2020" className="mt-1" /></div>
                  <div><Label>Tags</Label><Input value={productForm.tags.join(", ")} onChange={e => setProductForm({...productForm, tags: e.target.value.split(",").map(t => t.trim())})} placeholder="e.g. new, popular, sale" className="mt-1" /></div>
                  <div>
                    <Label>Product Image</Label>
                    <Input type="file" accept="image/*" onChange={e => handleImageUpload(e, true)} disabled={uploading} className="mt-1 cursor-pointer" />
                    {productForm.image_url && <img src={productForm.image_url} alt="Product" className="mt-2 w-32 h-32 object-cover rounded-lg border" />}
                  </div>
                </div>
                <DialogFooter><Button onClick={saveProduct} disabled={uploading} className="bg-blue-600 hover:bg-blue-700">{editProduct ? "Update" : "Add"} Product</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {view === "technicians" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Technicians</h1>
              <Button onClick={() => { setEditTech(null); setTechForm({ name: "", phone: "", specialization: "general", experience_years: "", hourly_rate: "", available: true }); setTechDialog(true); }}
                className="bg-blue-600 hover:bg-blue-700 gap-1.5"><Plus className="w-4 h-4" /> Add Technician</Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {technicians.map(t => (
                <Card key={t.id} className="border-slate-100">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center"><User className="w-5 h-5 text-slate-400" /></div>
                        <div>
                          <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{t.name}</h3>
                          <Badge variant="outline" className="text-[11px] mt-0.5">{SPECIALIZATIONS.find(s=>s.value===t.specialization)?.label || t.specialization}</Badge>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEditTech(t)}><Pencil className="w-3 h-3" /></Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500" onClick={() => deleteTech(t.id)}><Trash2 className="w-3 h-3" /></Button>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
                      {t.experience_years && <span>{t.experience_years} yrs</span>}
                      {t.hourly_rate && <span className="font-medium text-blue-600">K{t.hourly_rate}/hr</span>}
                      <Badge className={t.available !== false ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}>
                        {t.available !== false ? "Available" : "Unavailable"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Dialog open={techDialog} onOpenChange={setTechDialog}>
              <DialogContent>
                <DialogHeader><DialogTitle>{editTech ? "Edit Technician" : "Add Technician"}</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div><Label>Name *</Label><Input value={techForm.name} onChange={e => setTechForm({...techForm, name: e.target.value})} className="mt-1" /></div>
                  <div><Label>Phone</Label><Input value={techForm.phone} onChange={e => setTechForm({...techForm, phone: e.target.value})} className="mt-1" /></div>
                  <div><Label>Specialization</Label><Select value={techForm.specialization} onValueChange={v => setTechForm({...techForm, specialization: v})}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{SPECIALIZATIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Experience (years)</Label><Input type="number" value={techForm.experience_years} onChange={e => setTechForm({...techForm, experience_years: e.target.value})} className="mt-1" /></div>
                    <div><Label>Hourly Rate (ZMW)</Label><Input type="number" value={techForm.hourly_rate} onChange={e => setTechForm({...techForm, hourly_rate: e.target.value})} className="mt-1" /></div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch checked={techForm.available} onCheckedChange={v => setTechForm({...techForm, available: v})} />
                    <Label>Available</Label>
                  </div>
                  <div>
                    <Label>Technician Photo</Label>
                    <Input type="file" accept="image/*" onChange={e => handleImageUpload(e, false)} disabled={uploading} className="mt-1 cursor-pointer" />
                    {techForm.photo_url && <img src={techForm.photo_url} alt="Technician" className="mt-2 w-32 h-32 object-cover rounded-lg border" />}
                  </div>
                </div>
                <DialogFooter><Button onClick={saveTech} disabled={uploading} className="bg-blue-600 hover:bg-blue-700">{editTech ? "Update" : "Add"} Technician</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {view === "orders" && (
          <PullToRefresh onRefresh={async () => {
            const o = await base44.entities.Order.filter({ shop_id: shop?.id }, "-created_date", 50);
            setOrders(o);
          }}>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">Orders</h1>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-800">
                    <TableHead>Order</TableHead><TableHead>Buyer</TableHead><TableHead>Items</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map(o => (
                    <TableRow key={o.id}>
                      <TableCell className="font-mono text-xs">{o.id?.slice(0,8)}</TableCell>
                      <TableCell className="text-sm">{o.buyer_name || o.buyer_email}</TableCell>
                      <TableCell className="text-sm">{o.items?.length || 0} items</TableCell>
                      <TableCell className="font-medium">K{o.total_amount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                      <TableCell><Badge className={orderStatusColors[o.status]}>{o.status}</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Select value={o.status} onValueChange={v => updateOrderStatus(o, v)}>
                            <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {["pending","confirmed","processing","shipped","delivered","cancelled"].map(s => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {(o.status === "shipped" || o.status === "processing") && (
                            <Button size="sm" variant="outline" onClick={() => openTrackingDialog(o)} className="h-8 gap-1">
                              <MapPin className="w-3 h-3" /> Tracking
                            </Button>
                          )}
                          <DocumentPrinter shop={shop} order={o} triggerLabel="Print" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <Dialog open={trackingDialog} onOpenChange={setTrackingDialog}>
              <DialogContent>
                <DialogHeader><DialogTitle>Update Tracking Information</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div><Label>Tracking Number</Label><Input value={trackingForm.tracking_number} onChange={e => setTrackingForm({...trackingForm, tracking_number: e.target.value})} className="mt-1" placeholder="e.g. TRK123456789" /></div>
                  <div><Label>Current Location</Label><Input value={trackingForm.current_location} onChange={e => setTrackingForm({...trackingForm, current_location: e.target.value})} className="mt-1" placeholder="e.g. Lusaka Distribution Center" /></div>
                  <div><Label>Estimated Delivery</Label><Input type="date" value={trackingForm.estimated_delivery} onChange={e => setTrackingForm({...trackingForm, estimated_delivery: e.target.value})} className="mt-1" /></div>
                </div>
                <DialogFooter><Button onClick={saveTracking} className="bg-blue-600 hover:bg-blue-700">Update Tracking</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          </PullToRefresh>
        )}

        {view === "inventory" && (
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">Inventory</h1>
            <LowStockAlerts shopId={shop?.id} products={products} />
            <InventoryPanel products={products} orders={orders} onProductsChange={setProducts} />
          </div>
        )}

        {view === "market_insights" && (
          <MarketInsights shop={shop} />
        )}

        {view === "parts_requests" && (
          <ShopPartsRequests shop={shop} />
        )}

        {view === "hire_requests" && (
          <TechnicianHireRequests shop={shop} />
        )}

        {view === "messages" && (
          <ShopMessages shop={shop} user={user} />
        )}

        <Dialog open={showNewShopDialog} onOpenChange={setShowNewShopDialog}>
           <DialogContent>
             <DialogHeader><DialogTitle>Add New Branch</DialogTitle></DialogHeader>
             <div className="space-y-4">
               <div><Label>Branch Name *</Label><Input value={newShopForm.name} onChange={e => setNewShopForm({...newShopForm, name: e.target.value})} placeholder="e.g. Main Branch, Lusaka Outlet" className="mt-1" /></div>
               <div><Label>Phone</Label><Input value={newShopForm.phone} onChange={e => setNewShopForm({...newShopForm, phone: e.target.value})} className="mt-1" /></div>
               <AddressInput 
                 value={{ region: newShopForm.region, town: newShopForm.town, address: newShopForm.address }}
                 onChange={(newAddr) => setNewShopForm({...newShopForm, region: newAddr.region, town: newAddr.town, address: newAddr.address})}
               />
             </div>
             <DialogFooter><Button onClick={handleAddShop} className="bg-blue-600 hover:bg-blue-700">Add Branch</Button></DialogFooter>
           </DialogContent>
         </Dialog>

        {selectedProductForVariations && (
          <Dialog open={!!selectedProductForVariations} onOpenChange={() => setSelectedProductForVariations(null)}>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Variations - {selectedProductForVariations.name}</DialogTitle></DialogHeader>
              <ProductVariationsPanel product={selectedProductForVariations} />
            </DialogContent>
          </Dialog>
        )}
      </main>
    </div>
  );
}