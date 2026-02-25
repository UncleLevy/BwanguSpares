import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  LayoutDashboard, Package, Wrench, ShoppingCart, Plus,
  Pencil, Trash2, Store, User, DollarSign, TrendingUp
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
  const [shop, setShop] = useState(null);
  const [view, setView] = useState("overview");
  const [products, setProducts] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [productDialog, setProductDialog] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: "", description: "", price: "", category: "other", brand: "",
    compatible_vehicles: "", condition: "new", stock_quantity: "",
  });

  const [techDialog, setTechDialog] = useState(false);
  const [editTech, setEditTech] = useState(null);
  const [techForm, setTechForm] = useState({
    name: "", phone: "", specialization: "general", experience_years: "",
    hourly_rate: "", available: true,
  });

  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const u = await base44.auth.me();
      setUser(u);
      if (!u.shop_id) { navigate(createPageUrl("RegisterShop")); return; }
      const [shops, p, t, o] = await Promise.all([
        base44.entities.Shop.filter({ id: u.shop_id }),
        base44.entities.Product.filter({ shop_id: u.shop_id }),
        base44.entities.Technician.filter({ shop_id: u.shop_id }),
        base44.entities.Order.filter({ shop_id: u.shop_id }, "-created_date", 50),
      ]);
      setShop(shops[0]);
      setProducts(p); setTechnicians(t); setOrders(o);
      setLoading(false);
    })();
  }, []);

  const saveProduct = async () => {
    const data = {
      ...productForm,
      price: parseFloat(productForm.price) || 0,
      stock_quantity: parseInt(productForm.stock_quantity) || 0,
      shop_id: shop.id,
      shop_name: shop.name,
      status: "active",
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
    setProductForm({ name: "", description: "", price: "", category: "other", brand: "", compatible_vehicles: "", condition: "new", stock_quantity: "" });
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
      category: p.category, brand: p.brand || "", compatible_vehicles: p.compatible_vehicles || "",
      condition: p.condition, stock_quantity: String(p.stock_quantity || 0),
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

  const updateOrderStatus = async (order, status) => {
    await base44.entities.Order.update(order.id, { status });
    setOrders(orders.map(o => o.id === order.id ? { ...o, status } : o));
    toast.success("Order status updated");
  };

  const sidebarItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard, onClick: () => setView("overview") },
    { id: "products", label: "Products", icon: Package, onClick: () => setView("products") },
    { id: "technicians", label: "Technicians", icon: Wrench, onClick: () => setView("technicians") },
    { id: "orders", label: "Orders", icon: ShoppingCart, onClick: () => setView("orders"), badge: orders.filter(o => o.status === "pending").length || null },
  ];

  if (loading) return <div className="flex h-screen items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" /></div>;

  const totalRevenue = orders.filter(o => o.status !== "cancelled").reduce((s, o) => s + (o.total_amount || 0), 0);

  const orderStatusColors = {
    pending: "bg-amber-50 text-amber-700", confirmed: "bg-blue-50 text-blue-700",
    processing: "bg-indigo-50 text-indigo-700", shipped: "bg-purple-50 text-purple-700",
    delivered: "bg-emerald-50 text-emerald-700", cancelled: "bg-red-50 text-red-700",
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <DashboardSidebar items={sidebarItems} active={view} title="Shop Dashboard" />
      <main className="flex-1 p-6 lg:p-8 overflow-auto">

        {view === "overview" && (
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">{shop?.name}</h1>
            <p className="text-sm text-slate-500 mb-6">
              Status: <Badge className={shop?.status === "approved" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}>{shop?.status}</Badge>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Products", value: products.length, icon: Package, color: "bg-blue-50 text-blue-600" },
                { label: "Technicians", value: technicians.length, icon: Wrench, color: "bg-emerald-50 text-emerald-600" },
                { label: "Orders", value: orders.length, icon: ShoppingCart, color: "bg-purple-50 text-purple-600" },
                { label: "Revenue", value: `K${totalRevenue.toLocaleString()}`, icon: DollarSign, color: "bg-amber-50 text-amber-600" },
              ].map((s, i) => (
                <Card key={i} className="border-slate-100">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${s.color}`}><s.icon className="w-5 h-5" /></div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900">{s.value}</p>
                      <p className="text-xs text-slate-500">{s.label}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {view === "products" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-slate-900">Products</h1>
              <Button onClick={() => { setEditProduct(null); setProductForm({ name: "", description: "", price: "", category: "other", brand: "", compatible_vehicles: "", condition: "new", stock_quantity: "" }); setProductDialog(true); }}
                className="bg-blue-600 hover:bg-blue-700 gap-1.5"><Plus className="w-4 h-4" /> Add Product</Button>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>Name</TableHead><TableHead>Category</TableHead><TableHead>Price</TableHead><TableHead>Stock</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[11px]">{p.category}</Badge></TableCell>
                      <TableCell>K{p.price?.toLocaleString()}</TableCell>
                      <TableCell>{p.stock_quantity}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[11px]">{p.status}</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
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
                  <div><Label>Brand</Label><Input value={productForm.brand} onChange={e => setProductForm({...productForm, brand: e.target.value})} className="mt-1" /></div>
                  <div><Label>Compatible Vehicles</Label><Input value={productForm.compatible_vehicles} onChange={e => setProductForm({...productForm, compatible_vehicles: e.target.value})} placeholder="e.g. Toyota Corolla 2015-2020" className="mt-1" /></div>
                </div>
                <DialogFooter><Button onClick={saveProduct} className="bg-blue-600 hover:bg-blue-700">{editProduct ? "Update" : "Add"} Product</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {view === "technicians" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-slate-900">Technicians</h1>
              <Button onClick={() => { setEditTech(null); setTechForm({ name: "", phone: "", specialization: "general", experience_years: "", hourly_rate: "", available: true }); setTechDialog(true); }}
                className="bg-blue-600 hover:bg-blue-700 gap-1.5"><Plus className="w-4 h-4" /> Add Technician</Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {technicians.map(t => (
                <Card key={t.id} className="border-slate-100">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center"><User className="w-5 h-5 text-slate-400" /></div>
                        <div>
                          <h3 className="font-semibold text-slate-900 text-sm">{t.name}</h3>
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
                </div>
                <DialogFooter><Button onClick={saveTech} className="bg-blue-600 hover:bg-blue-700">{editTech ? "Update" : "Add"} Technician</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {view === "orders" && (
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-6">Orders</h1>
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>Order</TableHead><TableHead>Buyer</TableHead><TableHead>Items</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map(o => (
                    <TableRow key={o.id}>
                      <TableCell className="font-mono text-xs">{o.id?.slice(0,8)}</TableCell>
                      <TableCell className="text-sm">{o.buyer_name || o.buyer_email}</TableCell>
                      <TableCell className="text-sm">{o.items?.length || 0} items</TableCell>
                      <TableCell className="font-medium">K{o.total_amount?.toLocaleString()}</TableCell>
                      <TableCell><Badge className={orderStatusColors[o.status]}>{o.status}</Badge></TableCell>
                      <TableCell>
                        <Select value={o.status} onValueChange={v => updateOrderStatus(o, v)}>
                          <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {["pending","confirmed","processing","shipped","delivered","cancelled"].map(s => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}