import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Search, Plus, Eye, Pencil, Trash2, X, Package, Store } from "lucide-react";
import { toast } from "sonner";
import MobileSelect from "@/components/shared/MobileSelect";

const CATEGORIES = [
  "engine","brakes","suspension","electrical","body","transmission",
  "exhaust","cooling","steering","interior","accessories","tyres","filters","oils_fluids","other"
];
const CONDITIONS = ["new", "used", "refurbished"];
const STATUSES = ["active", "inactive", "out_of_stock"];

const statusColors = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  inactive: "bg-slate-100 text-slate-600 border-slate-200",
  out_of_stock: "bg-red-50 text-red-700 border-red-200",
};

const EMPTY_FORM = {
  name: "", description: "", price: "", category: "", sub_category: "",
  brand: "", sku: "", compatible_vehicles: "", condition: "new",
  stock_quantity: "0", status: "active", shop_id: "", shop_name: "", image_url: "",
};

export default function AdminProductsPanel({ products: initialProducts, shops, regions }) {
  const [products, setProducts] = useState(initialProducts || []);
  const [search, setSearch] = useState("");
  const [filterShop, setFilterShop] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterRegion, setFilterRegion] = useState("all");
  const [filterPriceMin, setFilterPriceMin] = useState("");
  const [filterPriceMax, setFilterPriceMax] = useState("");

  const [viewProduct, setViewProduct] = useState(null);
  const [editProduct, setEditProduct] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { setProducts(initialProducts || []); }, [initialProducts]);

  const shopOptions = useMemo(() => {
    const fromProducts = products.map(p => ({ id: p.shop_id, name: p.shop_name })).filter(s => s.id);
    const fromShops = (shops || []).map(s => ({ id: s.id, name: s.name }));
    const map = {};
    [...fromProducts, ...fromShops].forEach(s => { if (s.id) map[s.id] = s.name; });
    return Object.entries(map).map(([id, name]) => ({ id, name }));
  }, [products, shops]);

  const shopRegionMap = useMemo(() => {
    const map = {};
    (shops || []).forEach(s => { map[s.id] = s.region_name || s.region || ""; });
    return map;
  }, [shops]);

  const filtered = useMemo(() => {
    return products.filter(p => {
      const q = search.toLowerCase();
      if (q && !p.name?.toLowerCase().includes(q) && !p.brand?.toLowerCase().includes(q) && !p.sku?.toLowerCase().includes(q)) return false;
      if (filterShop !== "all" && p.shop_id !== filterShop) return false;
      if (filterStatus !== "all" && p.status !== filterStatus) return false;
      if (filterRegion !== "all" && shopRegionMap[p.shop_id] !== filterRegion) return false;
      if (filterPriceMin && p.price < parseFloat(filterPriceMin)) return false;
      if (filterPriceMax && p.price > parseFloat(filterPriceMax)) return false;
      return true;
    });
  }, [products, search, filterShop, filterStatus, filterRegion, filterPriceMin, filterPriceMax, shopRegionMap]);

  const openAdd = () => { setEditProduct(null); setForm(EMPTY_FORM); setShowForm(true); };

  const openEdit = (p) => {
    setEditProduct(p);
    setForm({
      name: p.name || "", description: p.description || "", price: p.price ?? "",
      category: p.category || "", sub_category: p.sub_category || "", brand: p.brand || "",
      sku: p.sku || "", compatible_vehicles: p.compatible_vehicles || "",
      condition: p.condition || "new", stock_quantity: p.stock_quantity ?? "0",
      status: p.status || "active", shop_id: p.shop_id || "", shop_name: p.shop_name || "",
      image_url: p.image_url || "",
    });
    setShowForm(true);
    setViewProduct(null);
  };

  const handleShopSelect = (shopId) => {
    const shop = (shops || []).find(s => s.id === shopId);
    setForm(f => ({ ...f, shop_id: shopId, shop_name: shop?.name || "" }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Product name is required"); return; }
    if (!form.price || isNaN(parseFloat(form.price))) { toast.error("Valid price is required"); return; }
    if (!form.category) { toast.error("Category is required"); return; }
    if (!form.shop_id) { toast.error("Please assign this product to a shop"); return; }
    setSaving(true);
    const payload = { ...form, price: parseFloat(form.price), stock_quantity: parseInt(form.stock_quantity) || 0 };
    try {
      if (editProduct) {
        await base44.entities.Product.update(editProduct.id, payload);
        setProducts(prev => prev.map(p => p.id === editProduct.id ? { ...p, ...payload } : p));
        toast.success("Product updated");
      } else {
        const created = await base44.entities.Product.create(payload);
        setProducts(prev => [created, ...prev]);
        toast.success("Product created");
      }
      setShowForm(false);
    } catch (e) {
      toast.error("Failed to save product");
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;
    setDeleting(true);
    await base44.entities.Product.delete(deleteDialog.id);
    setProducts(prev => prev.filter(p => p.id !== deleteDialog.id));
    toast.success("Product deleted");
    setDeleteDialog(null);
    setDeleting(false);
  };

  const clearFilters = () => {
    setSearch(""); setFilterShop("all"); setFilterStatus("all");
    setFilterRegion("all"); setFilterPriceMin(""); setFilterPriceMax("");
  };

  const hasFilters = search || filterShop !== "all" || filterStatus !== "all" || filterRegion !== "all" || filterPriceMin || filterPriceMax;
  const uniqueRegions = useMemo(() => [...new Set(Object.values(shopRegionMap).filter(Boolean))].sort(), [shopRegionMap]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">All Products</h1>
        <Button onClick={openAdd} className="bg-blue-600 hover:bg-blue-700 gap-2">
          <Plus className="w-4 h-4" /> Add Product
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-slate-100 dark:border-slate-700">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, brand, SKU..." className="pl-9" />
            </div>
            <MobileSelect
              value={filterShop}
              onValueChange={setFilterShop}
              placeholder="All Shops"
              triggerClassName="w-44"
              options={[{ value: "all", label: "All Shops" }, ...shopOptions.map(s => ({ value: s.id, label: s.name }))]}
            />
            <MobileSelect
              value={filterStatus}
              onValueChange={setFilterStatus}
              placeholder="All Statuses"
              triggerClassName="w-40"
              options={[{ value: "all", label: "All Statuses" }, ...STATUSES.map(s => ({ value: s, label: s.replace("_", " ") }))]}
            />
            <MobileSelect
              value={filterRegion}
              onValueChange={setFilterRegion}
              placeholder="All Regions"
              triggerClassName="w-40"
              options={[{ value: "all", label: "All Regions" }, ...uniqueRegions.map(r => ({ value: r, label: r }))]}
            />
            <div className="flex items-center gap-1.5">
              <Input value={filterPriceMin} onChange={e => setFilterPriceMin(e.target.value)} placeholder="Min K" className="w-20" type="number" min="0" />
              <span className="text-slate-400 text-sm">–</span>
              <Input value={filterPriceMax} onChange={e => setFilterPriceMax(e.target.value)} placeholder="Max K" className="w-20" type="number" min="0" />
            </div>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-slate-500 gap-1.5">
                <X className="w-3.5 h-3.5" /> Clear
              </Button>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-2">{filtered.length} of {products.length} products</p>
        </CardContent>
      </Card>

      {/* Mobile card layout (< 768px) */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
            No products found
          </div>
        ) : filtered.map(p => (
          <Card key={p.id} className="border-slate-100 dark:border-slate-700 dark:bg-slate-900">
            <CardContent className="p-4">
              <div className="flex items-start gap-3 mb-3">
                {p.image_url ? (
                  <img src={p.image_url} alt="" className="w-12 h-12 rounded-lg object-cover border border-slate-100 flex-shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                    <Package className="w-5 h-5 text-slate-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm truncate">{p.name}</p>
                  {p.brand && <p className="text-xs text-slate-400">{p.brand}</p>}
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{p.shop_name || "—"}</p>
                </div>
                <Badge className={`${statusColors[p.status] || ""} text-[11px] border flex-shrink-0`}>
                  {p.status?.replace("_", " ")}
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                <div>
                  <p className="text-slate-400">Price</p>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">K{p.price?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-slate-400">Stock</p>
                  <p className={p.stock_quantity === 0 ? "text-red-500 font-medium" : "text-slate-700 dark:text-slate-300"}>{p.stock_quantity}</p>
                </div>
                <div>
                  <p className="text-slate-400">Category</p>
                  <p className="text-slate-700 dark:text-slate-300 truncate">{p.category?.replace("_", " ")}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" className="flex-1 h-8 text-xs" onClick={() => setViewProduct(p)}>
                  <Eye className="w-3.5 h-3.5 mr-1" /> View
                </Button>
                <Button size="sm" variant="ghost" className="flex-1 h-8 text-xs text-blue-600 hover:bg-blue-50" onClick={() => openEdit(p)}>
                  <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                </Button>
                <Button size="sm" variant="ghost" className="flex-1 h-8 text-xs text-red-600 hover:bg-red-50" onClick={() => setDeleteDialog(p)}>
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop table (≥ 768px) */}
      <div className="hidden md:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-800">
                <TableHead>Product</TableHead>
                <TableHead>Shop</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-400">
                    <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    No products found
                  </TableCell>
                </TableRow>
              ) : filtered.map(p => (
                <TableRow key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer" onClick={() => setViewProduct(p)}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {p.image_url ? (
                        <img src={p.image_url} alt="" className="w-9 h-9 rounded-lg object-cover border border-slate-100" />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                          <Package className="w-4 h-4 text-slate-400" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-slate-900 dark:text-slate-100 text-sm">{p.name}</p>
                        {p.brand && <p className="text-xs text-slate-400">{p.brand}</p>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-slate-500 dark:text-slate-400">{p.shop_name || "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[11px]">{p.category?.replace("_", " ")}</Badge>
                  </TableCell>
                  <TableCell className="font-medium text-slate-900 dark:text-slate-100">K{p.price?.toLocaleString()}</TableCell>
                  <TableCell>
                    <span className={p.stock_quantity === 0 ? "text-red-500 font-medium" : "text-slate-700 dark:text-slate-300"}>
                      {p.stock_quantity}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${statusColors[p.status] || ""} text-[11px] border`}>
                      {p.status?.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell onClick={e => e.stopPropagation()}>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => setViewProduct(p)}>
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 px-2 text-blue-600 hover:bg-blue-50" onClick={() => openEdit(p)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 px-2 text-red-600 hover:bg-red-50" onClick={() => setDeleteDialog(p)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* View Details Dialog */}
      <Dialog open={!!viewProduct} onOpenChange={() => setViewProduct(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" /> Product Details
            </DialogTitle>
          </DialogHeader>
          {viewProduct && (
            <div className="space-y-4">
              {viewProduct.image_url && (
                <img src={viewProduct.image_url} alt="" className="w-full h-48 object-cover rounded-xl border border-slate-100" />
              )}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-slate-400 mb-0.5">Name</p><p className="font-semibold text-slate-900 dark:text-slate-100">{viewProduct.name}</p></div>
                <div><p className="text-xs text-slate-400 mb-0.5">Brand</p><p>{viewProduct.brand || "—"}</p></div>
                <div><p className="text-xs text-slate-400 mb-0.5">Price</p><p className="font-semibold text-emerald-600">K{viewProduct.price?.toLocaleString()}</p></div>
                <div><p className="text-xs text-slate-400 mb-0.5">Stock</p><p>{viewProduct.stock_quantity}</p></div>
                <div><p className="text-xs text-slate-400 mb-0.5">Category</p><p>{viewProduct.category?.replace("_", " ")}</p></div>
                <div><p className="text-xs text-slate-400 mb-0.5">Condition</p><p>{viewProduct.condition}</p></div>
                <div><p className="text-xs text-slate-400 mb-0.5">SKU</p><p className="font-mono text-xs">{viewProduct.sku || "—"}</p></div>
                <div><p className="text-xs text-slate-400 mb-0.5">Status</p><Badge className={`${statusColors[viewProduct.status]} text-[11px] border`}>{viewProduct.status?.replace("_", " ")}</Badge></div>
                <div className="col-span-2"><p className="text-xs text-slate-400 mb-0.5">Shop</p><p className="flex items-center gap-1"><Store className="w-3.5 h-3.5 text-slate-400" />{viewProduct.shop_name}</p></div>
                {viewProduct.compatible_vehicles && <div className="col-span-2"><p className="text-xs text-slate-400 mb-0.5">Compatible Vehicles</p><p>{viewProduct.compatible_vehicles}</p></div>}
                {viewProduct.description && <div className="col-span-2"><p className="text-xs text-slate-400 mb-0.5">Description</p><p className="text-slate-600 dark:text-slate-400">{viewProduct.description}</p></div>}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewProduct(null)}>Close</Button>
            <Button onClick={() => openEdit(viewProduct)} className="bg-blue-600 hover:bg-blue-700 gap-2">
              <Pencil className="w-3.5 h-3.5" /> Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add / Edit Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label>Product Name *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="e.g. NGK Spark Plug" className="mt-1" />
            </div>
            <div>
              <Label>Assign to Shop *</Label>
              <MobileSelect
                value={form.shop_id}
                onValueChange={handleShopSelect}
                placeholder="Select a shop"
                triggerClassName="mt-1 w-full"
                options={(shops || []).filter(s => s.status === "approved").map(s => ({ value: s.id, label: s.name }))}
              />
            </div>
            <div>
              <Label>Category *</Label>
              <MobileSelect
                value={form.category}
                onValueChange={v => setForm(f => ({...f, category: v}))}
                placeholder="Select category"
                triggerClassName="mt-1 w-full"
                options={CATEGORIES.map(c => ({ value: c, label: c.replace("_", " ") }))}
              />
            </div>
            <div>
              <Label>Price (ZMW) *</Label>
              <Input type="number" min="0" value={form.price} onChange={e => setForm(f => ({...f, price: e.target.value}))} placeholder="0.00" className="mt-1" />
            </div>
            <div>
              <Label>Stock Quantity</Label>
              <Input type="number" min="0" value={form.stock_quantity} onChange={e => setForm(f => ({...f, stock_quantity: e.target.value}))} className="mt-1" />
            </div>
            <div>
              <Label>Brand</Label>
              <Input value={form.brand} onChange={e => setForm(f => ({...f, brand: e.target.value}))} placeholder="e.g. NGK, Bosch" className="mt-1" />
            </div>
            <div>
              <Label>SKU</Label>
              <Input value={form.sku} onChange={e => setForm(f => ({...f, sku: e.target.value}))} placeholder="e.g. NGK-BP6ES" className="mt-1" />
            </div>
            <div>
              <Label>Condition</Label>
              <MobileSelect
                value={form.condition}
                onValueChange={v => setForm(f => ({...f, condition: v}))}
                placeholder="Condition"
                triggerClassName="mt-1 w-full"
                options={CONDITIONS.map(c => ({ value: c, label: c }))}
              />
            </div>
            <div>
              <Label>Status</Label>
              <MobileSelect
                value={form.status}
                onValueChange={v => setForm(f => ({...f, status: v}))}
                placeholder="Status"
                triggerClassName="mt-1 w-full"
                options={STATUSES.map(s => ({ value: s, label: s.replace("_", " ") }))}
              />
            </div>
            <div className="sm:col-span-2">
              <Label>Compatible Vehicles</Label>
              <Input value={form.compatible_vehicles} onChange={e => setForm(f => ({...f, compatible_vehicles: e.target.value}))} placeholder="e.g. Toyota Hilux 2015-2022, Nissan Navara" className="mt-1" />
            </div>
            <div className="sm:col-span-2">
              <Label>Image URL</Label>
              <Input value={form.image_url} onChange={e => setForm(f => ({...f, image_url: e.target.value}))} placeholder="https://..." className="mt-1" />
            </div>
            <div className="sm:col-span-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} rows={3} className="mt-1" placeholder="Product description..." />
            </div>
          </div>
          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
              {saving ? "Saving..." : editProduct ? "Save Changes" : "Create Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="text-red-600">Delete Product</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Are you sure you want to delete <strong>"{deleteDialog?.name}"</strong>? This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(null)}>Cancel</Button>
            <Button onClick={handleDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700">
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}