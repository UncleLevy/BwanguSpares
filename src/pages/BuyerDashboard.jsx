import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  LayoutDashboard, ShoppingCart, User, Settings, Package,
  Clock, CheckCircle2, Truck, XCircle, Star, FileSearch, MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { toast } from "sonner";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import BuyerPartsRequests from "@/components/parts/BuyerPartsRequests";
import PartsRequestForm from "@/components/parts/PartsRequestForm";
import ReviewForm from "@/components/reviews/ReviewForm";
import BuyerMessages from "@/components/messaging/BuyerMessages";
import ReportButton from "@/components/reports/ReportButton";
import TrackingInfo from "@/components/orders/TrackingInfo.jsx";

const orderStatusConfig = {
  pending: { icon: Clock, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
  confirmed: { icon: CheckCircle2, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
  processing: { icon: Package, color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-200" },
  shipped: { icon: Truck, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200" },
  delivered: { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
  cancelled: { icon: XCircle, color: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
};

export default function BuyerDashboard() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("orders");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileForm, setProfileForm] = useState({ phone: "", address: "" });
  const [reviewDialog, setReviewDialog] = useState(false);
  const [reviewOrder, setReviewOrder] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [partsRequestOpen, setPartsRequestOpen] = useState(false);
  const [deleteAccountDialog, setDeleteAccountDialog] = useState(false);

  useEffect(() => {
    (async () => {
      const u = await base44.auth.me();
      setUser(u);
      setProfileForm({ phone: u.phone || "", address: u.address || "" });
      const o = await base44.entities.Order.filter({ buyer_email: u.email }, "-created_date", 50);
      setOrders(o);
      setLoading(false);
    })();
  }, []);

  const saveProfile = async () => {
    await base44.auth.updateMe(profileForm);
    toast.success("Profile updated");
  };

  const handleReviewSubmit = async (reviewData) => {
    setSubmitting(true);
    try {
      const existingReview = await base44.entities.Review.filter({
        order_id: reviewOrder.id,
        reviewer_email: user.email,
      });

      if (existingReview.length > 0) {
        toast.error("You've already reviewed this order");
        setSubmitting(false);
        return;
      }

      await base44.entities.Review.create({
        order_id: reviewOrder.id,
        reviewer_email: user.email,
        reviewer_name: user.full_name,
        shop_id: reviewOrder.shop_id,
        shop_name: reviewOrder.shop_name,
        rating: reviewData.rating,
        comment: reviewData.comment,
        type: "shop",
      });

      // Update shop rating
      const allShopReviews = await base44.entities.Review.filter({
        shop_id: reviewOrder.shop_id,
        type: "shop",
      });
      const avgRating =
        allShopReviews.reduce((sum, r) => sum + r.rating, 0) /
        allShopReviews.length;
      await base44.entities.Shop.update(reviewOrder.shop_id, {
        rating: avgRating,
      });

      toast.success("Review submitted successfully!");
      setReviewDialog(false);
      setReviewOrder(null);
    } catch (error) {
      toast.error("Failed to submit review");
    }
    setSubmitting(false);
  };

  const sidebarItems = [
    { id: "orders", label: "My Orders", icon: ShoppingCart, onClick: () => setView("orders") },
    { id: "parts_requests", label: "Parts Requests", icon: FileSearch, onClick: () => setView("parts_requests") },
    { id: "messages", label: "Messages", icon: MessageSquare, onClick: () => setView("messages") },
    { id: "profile", label: "Profile", icon: User, onClick: () => setView("profile") },
  ];

  if (loading) return <div className="flex h-screen items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" /></div>;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <DashboardSidebar items={sidebarItems} active={view} title="My Account" />
      <main className="flex-1 pt-14 lg:pt-0 p-4 lg:p-8 overflow-auto min-w-0">

        {view === "orders" && (
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-6">My Orders</h1>
            {orders.length === 0 ? (
              <div className="text-center py-20">
                <ShoppingCart className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                <h3 className="font-semibold text-slate-700">No orders yet</h3>
                <p className="text-sm text-slate-500 mt-1">Browse parts and place your first order</p>
                <Link to={createPageUrl("BrowseProducts")}>
                  <Button className="mt-4 bg-blue-600 hover:bg-blue-700">Browse Parts</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map(order => {
                  const sc = orderStatusConfig[order.status] || orderStatusConfig.pending;
                  return (
                    <Card key={order.id} className={`border ${sc.border}`}>
                      <CardContent className="p-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs text-slate-400">#{order.id?.slice(0,8)}</span>
                              <Badge className={`${sc.bg} ${sc.color}`}>
                                <sc.icon className="w-3 h-3 mr-1" /> {order.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-500 mt-1">
                              From: <span className="font-medium text-slate-700">{order.shop_name}</span>
                              <span className="mx-2">•</span>
                              {new Date(order.created_date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <p className="text-xl font-bold text-blue-600">K{order.total_amount?.toLocaleString()}</p>
                            {order.status === "delivered" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setReviewOrder(order);
                                  setReviewDialog(true);
                                }}
                                className="gap-1.5 text-xs border-amber-200 text-amber-700 hover:bg-amber-50"
                              >
                                <Star className="w-3.5 h-3.5" /> Leave Review
                              </Button>
                            )}
                            <ReportButton
                              reportedEmail={order.shop_name}
                              reportedName={order.shop_name}
                              reportedType="shop"
                              reportedId={order.shop_id}
                              size="sm"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          {order.items?.map((item, i) => (
                            <div key={i} className="flex items-center gap-3 py-2 border-t border-slate-50 first:border-0">
                              <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                {item.image_url ? <img src={item.image_url} alt="" className="w-full h-full object-cover" /> : <Package className="w-4 h-4 text-slate-300" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-900 truncate">{item.product_name}</p>
                                <p className="text-xs text-slate-500">Qty: {item.quantity} × K{item.price?.toLocaleString()}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        {(order.status === "shipped" || order.status === "delivered") && (
                         <div className="mt-4 pt-4 border-t border-slate-100">
                           <TrackingInfo order={order} />
                         </div>
                        )}
                        </CardContent>
                        </Card>
                        );
                        })}
                        </div>
            )}
          </div>
        )}

        {view === "parts_requests" && (
          <BuyerPartsRequests user={user} onNewRequest={() => setPartsRequestOpen(true)} />
        )}

        {view === "messages" && (
          <BuyerMessages user={user} />
        )}

        {view === "profile" && (
          <div className="max-w-lg">
            <h1 className="text-2xl font-bold text-slate-900 mb-6">Profile</h1>
            <Card className="border-slate-100">
              <CardContent className="p-6 space-y-5">
                <div>
                  <Label className="text-sm text-slate-500">Name</Label>
                  <p className="font-medium text-slate-900 mt-0.5">{user?.full_name}</p>
                </div>
                <div>
                  <Label className="text-sm text-slate-500">Email</Label>
                  <p className="font-medium text-slate-900 mt-0.5">{user?.email}</p>
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input value={profileForm.phone} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} placeholder="+260..." className="mt-1 rounded-xl" />
                </div>
                <div>
                  <Label>Address</Label>
                  <Input value={profileForm.address} onChange={e => setProfileForm({...profileForm, address: e.target.value})} placeholder="Your address" className="mt-1 rounded-xl" />
                </div>
                <Button onClick={saveProfile} className="bg-blue-600 hover:bg-blue-700">Save Changes</Button>
                <div className="pt-4 border-t border-slate-100">
                  <Button
                    variant="outline"
                    onClick={() => setDeleteAccountDialog(true)}
                    className="text-red-600 border-red-200 hover:bg-red-50 w-full"
                  >
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      <PartsRequestForm open={partsRequestOpen} onClose={() => setPartsRequestOpen(false)} />

      <Dialog open={deleteAccountDialog} onOpenChange={setDeleteAccountDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteAccountDialog(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={async () => {
                await base44.auth.logout();
              }}
            >
              Delete My Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={reviewDialog} onOpenChange={setReviewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review {reviewOrder?.shop_name}</DialogTitle>
          </DialogHeader>
          <ReviewForm
            onSubmit={handleReviewSubmit}
            submitting={submitting}
            type="shop"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}