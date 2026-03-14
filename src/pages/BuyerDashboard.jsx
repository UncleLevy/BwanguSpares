import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import {
    Package, ShoppingBag, Wrench, Clock, CheckCircle,
    XCircle, Truck, MapPin, Phone, ChevronRight, Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

const ORDER_STATUS_CONFIG = {
    pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
    processing: { label: 'Processing', color: 'bg-purple-100 text-purple-800', icon: Package },
    shipped: { label: 'Shipped', color: 'bg-indigo-100 text-indigo-800', icon: Truck },
    delivered: { label: 'Delivered', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: XCircle }
};

const BOOKING_STATUS_CONFIG = {
    pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
    confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-800' },
    in_progress: { label: 'In Progress', color: 'bg-purple-100 text-purple-800' },
    completed: { label: 'Completed', color: 'bg-green-100 text-green-800' },
    cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800' }
};

export default function BuyerDashboard() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const defaultTab = searchParams.get('tab') || 'orders';

    const [user, setUser] = useState(null);
    const [orders, setOrders] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const isAuth = await base44.auth.isAuthenticated();
            if (!isAuth) {
                navigate(createPageUrl('Home'));
                return;
            }

            const userData = await base44.auth.me();
            setUser(userData);

            const [ordersData, bookingsData] = await Promise.all([
                base44.entities.Order.filter({ buyer_email: userData.email }, '-created_date'),
                base44.entities.TechnicianBooking.filter({ customer_email: userData.email }, '-created_date')
            ]);

            setOrders(ordersData);
            setBookings(bookingsData);
        } catch (error) {
            console.error('Error loading data:', error);
        }
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-8">
                <Skeleton className="h-8 w-48 mb-8" />
                <div className="grid md:grid-cols-3 gap-4 mb-8">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32" />)}
                </div>
            </div>
        );
    }

    const pendingOrders = orders.filter(o => ['pending', 'confirmed', 'processing', 'shipped'].includes(o.status));
    const completedOrders = orders.filter(o => o.status === 'delivered');
    const pendingBookings = bookings.filter(b => ['pending', 'confirmed', 'in_progress'].includes(b.status));

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800">My Dashboard</h1>
                <p className="text-slate-500">Welcome back, {user?.full_name || 'User'}</p>
            </div>

            {/* Stats */}
            <div className="grid md:grid-cols-3 gap-4 mb-8">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                <ShoppingBag className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{orders.length}</p>
                                <p className="text-sm text-slate-500">Total Orders</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                                <Truck className="w-6 h-6 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{pendingOrders.length}</p>
                                <p className="text-sm text-slate-500">Active Orders</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                <Wrench className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{bookings.length}</p>
                                <p className="text-sm text-slate-500">Technician Bookings</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue={defaultTab}>
                <TabsList>
                    <TabsTrigger value="orders">Orders ({orders.length})</TabsTrigger>
                    <TabsTrigger value="bookings">Technician Bookings ({bookings.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="orders" className="mt-6">
                    {orders.length === 0 ? (
                        <Card className="p-12 text-center">
                            <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-slate-700 mb-2">No orders yet</h3>
                            <p className="text-slate-500 mb-4">Start shopping to see your orders here</p>
                            <Link to={createPageUrl('Products')}>
                                <Button className="bg-orange-500 hover:bg-orange-600">Browse Products</Button>
                            </Link>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {orders.map((order) => {
                                const statusConfig = ORDER_STATUS_CONFIG[order.status] || ORDER_STATUS_CONFIG.pending;
                                const StatusIcon = statusConfig.icon;

                                return (
                                    <Card key={order.id}>
                                        <CardContent className="p-6">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                                <div>
                                                    <div className="flex items-center gap-3">
                                                        <p className="font-semibold text-slate-800">{order.order_number}</p>
                                                        <Badge className={statusConfig.color}>
                                                            <StatusIcon className="w-3 h-3 mr-1" />
                                                            {statusConfig.label}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-slate-500 mt-1">
                                                        Placed on {format(new Date(order.created_date), 'PPP')}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xl font-bold text-[#1e3a5f]">K{order.total_amount?.toLocaleString()}</p>
                                                    <p className="text-sm text-slate-500">{order.items?.length} item(s)</p>
                                                </div>
                                            </div>

                                            {/* Order Items Preview */}
                                            <div className="border-t pt-4">
                                                <div className="flex flex-wrap gap-4">
                                                    {order.items?.slice(0, 3).map((item, i) => (
                                                        <div key={i} className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
                                                            <span className="text-sm font-medium">{item.product_name}</span>
                                                            <Badge variant="outline">×{item.quantity}</Badge>
                                                        </div>
                                                    ))}
                                                    {order.items?.length > 3 && (
                                                        <div className="flex items-center text-sm text-slate-500">
                                                            +{order.items.length - 3} more
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Delivery Info */}
                                            {order.delivery_address && (
                                                <div className="flex items-start gap-2 mt-4 text-sm text-slate-500">
                                                    <MapPin className="w-4 h-4 mt-0.5" />
                                                    <span>{order.delivery_address}</span>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="bookings" className="mt-6">
                    {bookings.length === 0 ? (
                        <Card className="p-12 text-center">
                            <Wrench className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-slate-700 mb-2">No bookings yet</h3>
                            <p className="text-slate-500 mb-4">Book a technician for your vehicle needs</p>
                            <Link to={createPageUrl('Technicians')}>
                                <Button className="bg-orange-500 hover:bg-orange-600">Find Technicians</Button>
                            </Link>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {bookings.map((booking) => {
                                const statusConfig = BOOKING_STATUS_CONFIG[booking.status] || BOOKING_STATUS_CONFIG.pending;

                                return (
                                    <Card key={booking.id}>
                                        <CardContent className="p-6">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div>
                                                    <div className="flex items-center gap-3">
                                                        <p className="font-semibold text-slate-800">{booking.booking_number}</p>
                                                        <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
                                                    </div>
                                                    <p className="text-orange-600 font-medium mt-1">{booking.technician_name}</p>
                                                    <p className="text-sm text-slate-500">{booking.shop_name}</p>
                                                </div>
                                                <div className="text-right">
                                                    <div className="flex items-center gap-2 text-slate-600">
                                                        <Calendar className="w-4 h-4" />
                                                        <span>{format(new Date(booking.scheduled_date), 'PPP')}</span>
                                                        {booking.scheduled_time && <span>at {booking.scheduled_time}</span>}
                                                    </div>
                                                    {booking.total_cost && (
                                                        <p className="text-lg font-bold text-[#1e3a5f] mt-1">K{booking.total_cost?.toLocaleString()}</p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="border-t mt-4 pt-4 grid md:grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <p className="text-slate-500">Service Type</p>
                                                    <p className="font-medium">{booking.service_type}</p>
                                                </div>
                                                {booking.vehicle_info && (
                                                    <div>
                                                        <p className="text-slate-500">Vehicle</p>
                                                        <p className="font-medium">{booking.vehicle_info}</p>
                                                    </div>
                                                )}
                                                {booking.location && (
                                                    <div>
                                                        <p className="text-slate-500">Location</p>
                                                        <p className="font-medium">{booking.location}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
