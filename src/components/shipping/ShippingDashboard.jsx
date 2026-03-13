import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Package, Truck, MapPin, Clock, Phone, User, Filter, Search, Eye, Navigation, DollarSign } from "lucide-react";
import ShipmentAssignDialog from "./ShipmentAssignDialog";
import ShipmentTrackingPanel from "./ShipmentTrackingPanel";
import CourierManagement from "./CourierManagement";
import ShippingLabelGenerator from "./ShippingLabelGenerator";
import { usePagination } from "@/components/shared/usePagination";
import TablePagination from "@/components/shared/TablePagination";

export default function ShippingDashboard({ shop }) {
  const [orders, setOrders] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [couriers, setCouriers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [viewDeliveryDialog, setViewDeliveryDialog] = useState(null);

  useEffect(() => {
    loadData();
  }, [shop.id]);

  const loadData = async () => {
    setLoading(true);
    const [ordersData, shipmentsData, couriersData] = await Promise.all([
      base44.entities.Order.filter({ shop_id: shop.id, status: ["confirmed", "processing", "shipped", "delivered"] }),
      base44.entities.Shipment.filter({ shop_id: shop.id }, "-created_date", 200),
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

  const filteredShipments = shipments.filter(shipment => {
    const matchSearch = !search || 
      shipment.tracking_number?.toLowerCase().includes(search.toLowerCase()) ||
      shipment.buyer_name?.toLowerCase().includes(search.toLowerCase()) ||
      shipment.order_id?.includes(search);
    const matchStatus = statusFilter === "all" || shipment.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const pagination = usePagination(filteredShipments, 15);

  const stats = {
    pending: shipments.filter(s => s.status === "pending").length,
    in_transit: shipments.filter(s => ["assigned", "picked_up", "in_transit", "out_for_delivery", "awaiting_handoff", "handoff_complete"].includes(s.status)).length,
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
              <option value="pending">Pending</option>
              <option value="assigned">Assigned</option>
              <option value="picked_up">Picked Up</option>
              <option value="in_transit">In Transit</option>
              <option value="out_for_delivery">Out for Delivery</option>
              <option value="delivered">Delivered</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {/* Shipments List */}
          <div className="space-y-4">
            <div className="grid gap-4">
              {pagination.paginatedItems.map(shipment => {
                return (
                  <Card key={shipment.id} className="border-slate-200 dark:border-slate-700 dark:bg-slate-900">
                    <CardContent className="p-4">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-slate-900 dark:text-slate-100">#{shipment.tracking_number}</span>
                                <Badge className={statusColors[shipment.status]}>
                                  {shipment.status?.replace(/_/g, " ")}
                                </Badge>
                                {shipment.requires_handoff && (
                                  <Badge variant="outline" className="text-xs">Multi-Courier</Badge>
                                )}
                              </div>
                              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                {shipment.buyer_name} • Order #{shipment.order_id?.slice(0, 8)}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div className="flex items-start gap-2">
                              <MapPin className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="font-medium text-slate-700 dark:text-slate-300">From: {shipment.shop_town}</p>
                                <p className="text-slate-500 dark:text-slate-400">To: {shipment.delivery_town}</p>
                              </div>
                            </div>
                            
                            {shipment.current_courier_name && (
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                <div>
                                  <p className="font-medium text-slate-700 dark:text-slate-300">{shipment.current_courier_name}</p>
                                  <p className="text-slate-500 dark:text-slate-400">{shipment.current_courier_phone || shipment.intercity_courier_phone || shipment.local_courier_phone}</p>
                                </div>
                              </div>
                            )}

                            {shipment.shipping_cost > 0 && (
                              <div className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                <span className="text-slate-700 dark:text-slate-300">K{shipment.shipping_cost?.toLocaleString()}</span>
                              </div>
                            )}
                            
                            {shipment.estimated_delivery_date && (
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                <span className="text-slate-600 dark:text-slate-300">
                                  {shipment.status === "delivered" && shipment.actual_delivery_date 
                                    ? `Delivered: ${new Date(shipment.actual_delivery_date).toLocaleDateString()}`
                                    : `Est: ${new Date(shipment.estimated_delivery_date).toLocaleDateString()}`
                                  }
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button variant="outline" onClick={() => setViewDeliveryDialog(shipment)} className="gap-2">
                            <Eye className="w-4 h-4" />
                            Details
                          </Button>
                          <Button variant="outline" onClick={() => setSelectedShipment(shipment)}>
                            View Tracking
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {filteredShipments.length === 0 && (
                <Card className="border-slate-200 dark:border-slate-700 dark:bg-slate-900">
                  <CardContent className="p-12 text-center">
                    <Package className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-500 dark:text-slate-400">No shipments match your filters</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {filteredShipments.length > 15 && (
              <TablePagination
                currentPage={pagination.currentPage}
                totalItems={pagination.totalItems}
                itemsPerPage={pagination.itemsPerPage}
                onPageChange={pagination.setCurrentPage}
              />
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

      {/* Delivery Details Dialog */}
      {viewDeliveryDialog && (
        <Dialog open={!!viewDeliveryDialog} onOpenChange={() => setViewDeliveryDialog(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                Shipment Details
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Status & Tracking */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Status</span>
                  <Badge className={statusColors[viewDeliveryDialog.status]}>
                    {viewDeliveryDialog.status?.replace(/_/g, " ")}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Tracking Number</span>
                  <span className="font-mono text-sm font-medium text-slate-900 dark:text-slate-100">
                    {viewDeliveryDialog.tracking_number}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Order ID</span>
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    #{viewDeliveryDialog.order_id?.slice(0, 8)}
                  </span>
                </div>
              </div>

              {/* Source & Destination */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium mb-2">
                    <Navigation className="w-4 h-4" />
                    Origin
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Shop</p>
                    <p className="font-medium text-slate-900 dark:text-slate-100">{viewDeliveryDialog.shop_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Location</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      {viewDeliveryDialog.shop_town}, {viewDeliveryDialog.shop_region}
                    </p>
                  </div>
                </div>

                <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium mb-2">
                    <MapPin className="w-4 h-4" />
                    Destination
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Customer</p>
                    <p className="font-medium text-slate-900 dark:text-slate-100">{viewDeliveryDialog.buyer_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Address</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300">{viewDeliveryDialog.delivery_address}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Town</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      {viewDeliveryDialog.delivery_town}, {viewDeliveryDialog.delivery_region}
                    </p>
                  </div>
                </div>
              </div>

              {/* Courier Information */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-3">
                <h4 className="font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" />
                  Courier Details
                </h4>
                
                {viewDeliveryDialog.requires_handoff ? (
                  <div className="space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-950/30 rounded p-3">
                      <Badge variant="outline" className="mb-2">Multi-Courier Delivery</Badge>
                      <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Intercity Courier</p>
                          <p className="font-medium text-slate-900 dark:text-slate-100">{viewDeliveryDialog.intercity_courier_name}</p>
                          <p className="text-slate-600 dark:text-slate-400">{viewDeliveryDialog.intercity_courier_phone}</p>
                          {viewDeliveryDialog.intercity_cost > 0 && (
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">K{viewDeliveryDialog.intercity_cost}</p>
                          )}
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Local Courier</p>
                          <p className="font-medium text-slate-900 dark:text-slate-100">{viewDeliveryDialog.local_courier_name}</p>
                          <p className="text-slate-600 dark:text-slate-400">{viewDeliveryDialog.local_courier_phone}</p>
                          {viewDeliveryDialog.local_delivery_cost > 0 && (
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">K{viewDeliveryDialog.local_delivery_cost}</p>
                          )}
                        </div>
                      </div>
                      {viewDeliveryDialog.handoff_location && (
                        <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
                          <p className="text-xs text-slate-500 dark:text-slate-400">Handoff Location</p>
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{viewDeliveryDialog.handoff_location}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Name</p>
                      <p className="font-medium text-slate-900 dark:text-slate-100">{viewDeliveryDialog.current_courier_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Phone</p>
                      <p className="text-slate-700 dark:text-slate-300">{viewDeliveryDialog.current_courier_phone}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Costs & Dates */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Shipping Cost</p>
                  <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                    K{viewDeliveryDialog.shipping_cost?.toLocaleString() || 0}
                  </p>
                </div>
                
                {viewDeliveryDialog.distance_km && (
                  <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Distance</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                      {viewDeliveryDialog.distance_km} km
                    </p>
                  </div>
                )}
                
                <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                    {viewDeliveryDialog.status === "delivered" ? "Delivered" : "Est. Delivery"}
                  </p>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {viewDeliveryDialog.status === "delivered" && viewDeliveryDialog.actual_delivery_date
                      ? new Date(viewDeliveryDialog.actual_delivery_date).toLocaleDateString()
                      : viewDeliveryDialog.estimated_delivery_date
                      ? new Date(viewDeliveryDialog.estimated_delivery_date).toLocaleDateString()
                      : "—"
                    }
                  </p>
                </div>
              </div>

              {/* Notes */}
              {viewDeliveryDialog.delivery_notes && (
                <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Delivery Notes</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{viewDeliveryDialog.delivery_notes}</p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setViewDeliveryDialog(null)}>Close</Button>
              <Button onClick={() => { setSelectedShipment(viewDeliveryDialog); setViewDeliveryDialog(null); }}>
                View Full Tracking
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}