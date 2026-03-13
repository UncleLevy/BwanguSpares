import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Package, Truck, MapPin, Clock, Phone, User, Filter, Search } from "lucide-react";
import ShipmentAssignDialog from "./ShipmentAssignDialog";
import ShipmentTrackingPanel from "./ShipmentTrackingPanel";
import CourierManagement from "./CourierManagement";
import ShippingLabelGenerator from "./ShippingLabelGenerator";

export default function ShippingDashboard({ shop }) {
  const [orders, setOrders] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [couriers, setCouriers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedShipment, setSelectedShipment] = useState(null);

  useEffect(() => {
    loadData();
  }, [shop.id]);

  const loadData = async () => {
    setLoading(true);
    const [ordersData, shipmentsData, couriersData] = await Promise.all([
      base44.entities.Order.filter({ shop_id: shop.id, status: ["confirmed", "processing", "shipped"] }),
      base44.entities.Shipment.filter({ shop_id: shop.id }),
      base44.entities.Courier.filter({ shop_id: shop.id })
    ]);
    setOrders(ordersData);
    setShipments(shipmentsData);
    setCouriers(couriersData);
    setLoading(false);
  };

  const getShipmentForOrder = (orderId) => {
    return shipments.find(s => s.order_id === orderId);
  };

  const statusColors = {
    pending: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    assigned: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    picked_up: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    in_transit: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    out_for_delivery: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    delivered: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    failed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
  };

  const filteredOrders = orders.filter(order => {
    const shipment = getShipmentForOrder(order.id);
    const matchSearch = !search || order.id.includes(search) || order.buyer_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || (shipment ? shipment.status === statusFilter : statusFilter === "pending");
    return matchSearch && matchStatus;
  });

  const stats = {
    pending: orders.filter(o => !getShipmentForOrder(o.id)).length,
    in_transit: shipments.filter(s => ["assigned", "picked_up", "in_transit", "out_for_delivery"].includes(s.status)).length,
    delivered: shipments.filter(s => s.status === "delivered").length,
    active_couriers: couriers.filter(c => c.status === "active").length
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Shipping Management</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage orders, shipments, and courier assignments</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 dark:border-slate-700 dark:bg-slate-900">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <Package className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.pending}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Awaiting Shipment</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 dark:border-slate-700 dark:bg-slate-900">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Truck className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.in_transit}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">In Transit</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 dark:border-slate-700 dark:bg-slate-900">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Package className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.delivered}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Delivered</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 dark:border-slate-700 dark:bg-slate-900">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.active_couriers}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Active Couriers</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="shipments" className="w-full">
        <TabsList>
          <TabsTrigger value="shipments">Shipments</TabsTrigger>
          <TabsTrigger value="couriers">Couriers</TabsTrigger>
        </TabsList>

        <TabsContent value="shipments" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input placeholder="Search by order ID or buyer name" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-9 px-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm">
              <option value="all">All Status</option>
              <option value="pending">Pending Assignment</option>
              <option value="assigned">Assigned</option>
              <option value="in_transit">In Transit</option>
              <option value="delivered">Delivered</option>
            </select>
          </div>

          {/* Orders/Shipments List */}
          <div className="grid gap-4">
            {filteredOrders.map(order => {
              const shipment = getShipmentForOrder(order.id);
              return (
                <Card key={order.id} className="border-slate-200 dark:border-slate-700 dark:bg-slate-900">
                  <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-900 dark:text-slate-100">Order #{order.id.slice(0, 8)}</span>
                              <Badge className={statusColors[shipment?.status || "pending"]}>
                                {shipment?.status?.replace(/_/g, " ") || "Pending"}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{order.buyer_name} • K{order.total_amount?.toLocaleString()}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                            <span className="text-slate-600 dark:text-slate-300">{order.delivery_address}</span>
                          </div>
                          {shipment?.courier_name && (
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-blue-500 flex-shrink-0" />
                              <span className="text-slate-600 dark:text-slate-300">{shipment.courier_name}</span>
                              <Phone className="w-4 h-4 text-slate-400" />
                              <span className="text-slate-500 dark:text-slate-400">{shipment.courier_phone}</span>
                            </div>
                          )}
                          {shipment?.tracking_number && (
                            <div className="flex items-center gap-2">
                              <Package className="w-4 h-4 text-slate-400 flex-shrink-0" />
                              <span className="text-slate-600 dark:text-slate-300 font-mono text-xs">{shipment.tracking_number}</span>
                            </div>
                          )}
                          {shipment?.estimated_delivery_date && (
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                              <span className="text-slate-600 dark:text-slate-300">Est: {new Date(shipment.estimated_delivery_date).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {!shipment ? (
                          <Button onClick={() => setSelectedOrder(order)} className="bg-blue-600 hover:bg-blue-700">
                            <Truck className="w-4 h-4 mr-2" />
                            Assign Courier
                          </Button>
                        ) : (
                          <>
                            <Button variant="outline" onClick={() => setSelectedShipment(shipment)}>
                              View Tracking
                            </Button>
                            <ShippingLabelGenerator order={order} shipment={shipment} shop={shop} />
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {filteredOrders.length === 0 && (
              <Card className="border-slate-200 dark:border-slate-700 dark:bg-slate-900">
                <CardContent className="p-12 text-center">
                  <Package className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-500 dark:text-slate-400">No orders match your filters</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="couriers">
          <CourierManagement shop={shop} couriers={couriers} onUpdate={loadData} />
        </TabsContent>
      </Tabs>

      {selectedOrder && (
        <ShipmentAssignDialog
          order={selectedOrder}
          shop={shop}
          couriers={couriers}
          onClose={() => setSelectedOrder(null)}
          onAssigned={loadData}
        />
      )}

      {selectedShipment && (
        <ShipmentTrackingPanel
          shipment={selectedShipment}
          onClose={() => setSelectedShipment(null)}
          onUpdate={loadData}
        />
      )}
    </div>
  );
}