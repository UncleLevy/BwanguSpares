import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  LayoutDashboard, ShoppingCart, User, Settings, Package,
  Clock, CheckCircle2, Truck, XCircle, Star, FileSearch, MessageSquare, Eye, Wallet
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
import PullToRefresh from "@/components/shared/PullToRefresh";
import ReportButton from "@/components/reports/ReportButton";
import TrackingInfo from "@/components/orders/TrackingInfo.jsx";
import DashboardCartPreview from "@/components/dashboard/DashboardCartPreview";
import OrderTrackingBar from "@/components/orders/OrderTrackingBar";
import AddressInput from "@/components/shared/AddressInput";
import OrderReceipt from "@/components/receipts/OrderReceipt";
import ReceiptDownloader from "@/components/receipts/ReceiptDownloader";

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
  const [profileForm, setProfileForm] = useState({ first_name: "", last_name: "", phone: "", region: "", town: "", address: "" });
  const [profileErrors, setProfileErrors] = useState({});
  const [reviewDialog, setReviewDialog] = useState(false);
  const [reviewOrder, setReviewOrder] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [partsRequestOpen, setPartsRequestOpen] = useState(false);
  const [deleteAccountDialog, setDeleteAccountDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [passwordResetSent, setPasswordResetSent] = useState(false);
  const [receiptDialog, setReceiptDialog] = useState(false);
  const [receiptOrder, setReceiptOrder] = useState(null);

  useEffect(() => {
    (async () => {
      const u = await base44.auth.me();
      // Redirect to profile completion if not completed
      if (!u.profile_completed) {
        window.location.href = createPageUrl("ProfileCompletion");
        return;
      }
      setUser(u);
      setProfileForm({ first_name: u.first_name || "", last_name: u.last_name || "", phone: u.phone || "", region: u.region || "", town: u.town || "", address: u.address || "" });
      const o = await base44.entities.Order.filter({ buyer_email: u.email }, "-created_date", 50);
      setOrders(o);
      setLoading(false);

      // Auto-confirm orders after successful Stripe payment
      const params = new URLSearchParams(window.location.search);
      if (params.get("payment") === "success" && params.get("session_id")) {
        const sessionId = params.get("session_id");
        const pendingOrders = o.filter(ord => ord.stripe_session_id === sessionId && ord.status === "pending");
        if (pendingOrders.length > 0) {
          await Promise.all(pendingOrders.map(ord => base44.entities.Order.update(ord.id, { status: "confirmed" })));
          const updated = await base44.entities.Order.filter({ buyer_email: u.email }, "-created_date", 50);
          setOrders(updated);
          toast.success("Payment successful! Your order has been confirmed.");
        }
        // Clean URL
        window.history.replaceState({}, "", window.location.pathname);
      }
      
      // Real-time updates for orders
      const unsubscribe = base44.entities.Order.subscribe((event) => {
        if (event.data?.buyer_email === u.email) {
          (async () => {
            const updated = await base44.entities.Order.filter({ buyer_email: u.email }, "-created_date", 50);
            setOrders(updated);
          })();
        }
      });
      return unsubscribe;
    })();
  }, []);

  const saveProfile = async () => {
     const errors = {};
     if (!profileForm.first_name.trim()) errors.first_name = "First name is required";
     if (!profileForm.last_name.trim()) errors.last_name = "Last name is required";
     if (!profileForm.region) errors.region = "Region is required";
     if (!profileForm.town) errors.town = "Town is required";
     if (profileForm.phone && !/^\+?\d{7,15}$/.test(profileForm.phone.replace(/\s/g, ""))) {
       errors.phone = "Enter a valid phone number (e.g. +260...)";
     }
     if (Object.keys(errors).length > 0) { setProfileErrors(errors); return; }
     setProfileErrors({});
     setSubmitting(true);
     try {
       await base44.auth.updateMe({ 
         first_name: profileForm.first_name,
         last_name: profileForm.last_name,
         phone: profileForm.phone, 
         region: profileForm.region,
         town: profileForm.town,
         address: profileForm.address 
       });
       const updatedUser = await base44.auth.me();
       setUser(updatedUser);
       toast.success("✓ Profile updated successfully!");
     } catch (error) {
       toast.error("✗ Failed to update profile. Please try again.");
     } finally {
       setSubmitting(false);
     }
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
    { id: "cart", label: "Cart", icon: ShoppingCart, onClick: () => setView("cart") },
    { id: "parts_requests", label: "Parts Requests", icon: FileSearch, onClick: () => setView("parts_requests") },
    { id: "messages", label: "Messages", icon: MessageSquare, onClick: () => setView("messages") },
    { id: "profile", label: "Profile", icon: User, onClick: () => setView("profile") },
  ];

  if (loading) return <div className="flex h-screen items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" /></div>;

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <DashboardSidebar items={sidebarItems} active={view} title="My Account" />
      <main className="flex-1 pt-16 lg:pt-8 p-4 lg:p-8 overflow-auto min-w-0 text-slate-900 dark:text-slate-100">

        {view === "orders" && (
          <PullToRefresh onRefresh={async () => {
            const o = await base44.entities.Order.filter({ buyer_email: user.email }, "-created_date", 50);
            setOrders(o);
          }}>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">My Orders</h1>
            {orders.length === 0 ? (
              <div className="text-center py-20">
                <ShoppingCart className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                <h3 className="font-semibold text-slate-700 dark:text-slate-300">No orders yet</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Browse parts and place your first order</p>
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
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                              From: <span className="font-medium text-slate-700 dark:text-slate-300">{order.shop_name}</span>
                              <span className="mx-2">•</span>
                              {new Date(order.created_date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <p className="text-xl font-bold text-blue-600">K{order.total_amount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                            {order.status === "confirmed" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => { setReceiptOrder(order); setReceiptDialog(true); }}
                                className="gap-1.5 text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
                              >
                                <Eye className="w-3.5 h-3.5" /> Receipt
                              </Button>
                            )}
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
                        <div className="mb-4 pb-4 border-b border-slate-100 dark:border-slate-700">
                          <OrderTrackingBar status={order.status} />
                        </div>
                        <div className="space-y-2">
                          {order.items?.map((item, i) => (
                            <div key={i} className="flex items-center gap-3 py-2 border-t border-slate-50 first:border-0">
                              <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                {item.image_url ? <img src={item.image_url} alt="" className="w-full h-full object-cover" /> : <Package className="w-4 h-4 text-slate-300" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{item.product_name}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Qty: {item.quantity} × K{item.price?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        {order.status === "cancelled" && order.cancellation_reason && (
                          <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700">
                            <span className="font-medium">Cancellation reason: </span>{order.cancellation_reason}
                            {order.refunded && <span className="ml-2 text-xs font-semibold text-red-600">(Refunded)</span>}
                          </div>
                        )}
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
          </PullToRefresh>
        )}

        {view === "parts_requests" && (
          <BuyerPartsRequests user={user} onNewRequest={() => setPartsRequestOpen(true)} />
        )}

        {view === "messages" && (
          <BuyerMessages user={user} />
        )}

        {view === "cart" && (
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">Cart</h1>
            <Card className="border-slate-100 dark:border-slate-700 dark:bg-slate-900 max-w-2xl">
              <CardContent className="p-6">
                <DashboardCartPreview userEmail={user?.email} />
              </CardContent>
            </Card>
          </div>
        )}

        {view === "profile" && (
          <div className="max-w-lg space-y-5">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Profile</h1>

            {/* Personal Info */}
            <Card className="border-slate-100 dark:border-slate-700 dark:bg-slate-900">
              <CardContent className="p-6 space-y-4">
                <h2 className="font-semibold text-slate-800 dark:text-slate-200 text-sm uppercase tracking-wide">Personal Information</h2>
                <div>
                  <Label className="text-sm text-slate-500 dark:text-slate-400">Email (cannot be changed)</Label>
                  <p className="font-medium text-slate-900 dark:text-slate-100 mt-0.5 text-sm">{user?.email}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>First Name *</Label>
                    <Input value={profileForm.first_name} onChange={e => setProfileForm({...profileForm, first_name: e.target.value})} placeholder="First name" className={`mt-1 rounded-xl ${profileErrors.first_name ? "border-red-400" : ""}`} />
                    {profileErrors.first_name && <p className="text-xs text-red-500 mt-1">{profileErrors.first_name}</p>}
                  </div>
                  <div>
                    <Label>Last Name *</Label>
                    <Input value={profileForm.last_name} onChange={e => setProfileForm({...profileForm, last_name: e.target.value})} placeholder="Last name" className={`mt-1 rounded-xl ${profileErrors.last_name ? "border-red-400" : ""}`} />
                    {profileErrors.last_name && <p className="text-xs text-red-500 mt-1">{profileErrors.last_name}</p>}
                  </div>
                </div>
                <div>
                  <Label>Phone Number</Label>
                  <Input value={profileForm.phone} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} placeholder="+260 7XX XXX XXX" className={`mt-1 rounded-xl ${profileErrors.phone ? "border-red-400" : ""}`} />
                  {profileErrors.phone && <p className="text-xs text-red-500 mt-1">{profileErrors.phone}</p>}
                </div>
                <AddressInput 
                  value={{ region: profileForm.region, town: profileForm.town, address: profileForm.address }}
                  onChange={(newAddr) => setProfileForm({...profileForm, region: newAddr.region, town: newAddr.town, address: newAddr.address})}
                  errors={profileErrors}
                />
                <Button onClick={saveProfile} disabled={submitting} className="bg-blue-600 hover:bg-blue-700">{submitting ? "Saving..." : "Save Changes"}</Button>
              </CardContent>
            </Card>

            {/* Password Reset */}
            <Card className="border-slate-100 dark:border-slate-700 dark:bg-slate-900">
              <CardContent className="p-6 space-y-3">
                <h2 className="font-semibold text-slate-800 dark:text-slate-200 text-sm uppercase tracking-wide">Security</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">A password reset link will be sent to <span className="font-medium text-slate-700 dark:text-slate-300">{user?.email}</span>.</p>
                {passwordResetSent ? (
                  <p className="text-sm text-emerald-600 font-medium">✓ Reset link sent! Check your email.</p>
                ) : (
                  <Button variant="outline" onClick={async () => {
                    await base44.integrations.Core.SendEmail({
                      to: user.email,
                      subject: "Password Reset Request – BwanguSpares",
                      body: `Hello ${user.full_name},\n\nYou requested a password reset for your BwanguSpares account.\n\nPlease use your login page to reset your password, or contact support at admin@bwangu.com if you need help.\n\nBwanguSpares Team`
                    });
                    setPasswordResetSent(true);
                    toast.success("Password reset email sent!");
                  }}>
                    Send Password Reset Email
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-red-100 dark:border-red-900/40">
              <CardContent className="p-6 space-y-3">
                <h2 className="font-semibold text-red-600 text-sm uppercase tracking-wide">Danger Zone</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Permanently delete your account and all associated data. This cannot be undone.</p>
                <Button
                  variant="outline"
                  onClick={() => setDeleteAccountDialog(true)}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  Delete My Account
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      <PartsRequestForm open={partsRequestOpen} onClose={() => setPartsRequestOpen(false)} />

      <Dialog open={deleteAccountDialog} onOpenChange={(v) => { setDeleteAccountDialog(v); setDeleteConfirmText(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>
              This action is <strong>permanent</strong> and cannot be undone. All your orders, requests and data will be removed.
              <br /><br />
              Type <strong>DELETE</strong> below to confirm.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={deleteConfirmText}
            onChange={e => setDeleteConfirmText(e.target.value)}
            placeholder="Type DELETE to confirm"
            className="rounded-xl"
          />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setDeleteAccountDialog(false); setDeleteConfirmText(""); }}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={deleteConfirmText !== "DELETE"}
              onClick={async () => {
                await base44.auth.logout();
                toast.success("Account deleted. Goodbye!");
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

       <Dialog open={receiptDialog} onOpenChange={setReceiptDialog}>
         <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
           <DialogHeader><DialogTitle>Order Receipt</DialogTitle></DialogHeader>
           {receiptOrder && (
             <div className="space-y-4">
               <OrderReceipt order={receiptOrder} shop={receiptOrder} />
               <DialogFooter>
                 <ReceiptDownloader order={receiptOrder} />
               </DialogFooter>
             </div>
           )}
         </DialogContent>
       </Dialog>
      </div>
      );
      }