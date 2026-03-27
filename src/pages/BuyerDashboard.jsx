import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  LayoutDashboard, ShoppingCart, User, Settings, Package,
  Clock, CheckCircle2, Truck, XCircle, Star, FileSearch, MessageSquare, Eye, Wallet, Wrench, Gift, Camera, MapPin, Calendar, RotateCcw
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
import TrackingInfo from "@/components/orders/TrackingInfo";
import DashboardCartPreview from "@/components/dashboard/DashboardCartPreview";
import BuyerTechnicianRequests from "@/components/technicians/BuyerTechnicianRequests";
import BuyerAppointments from "@/components/technicians/BuyerAppointments";
import OrderTrackingBar from "@/components/orders/OrderTrackingBar";
import AddressInput from "@/components/shared/AddressInput";
import OrderReceipt from "@/components/receipts/OrderReceipt";
import ReceiptDownloader from "@/components/receipts/ReceiptDownloader";
import LoyaltyPanel from "@/components/loyalty/LoyaltyPanel";
import WalletTransactionDetail from "@/components/wallet/WalletTransactionDetail";
import ReturnRequestDialog from "@/components/returns/ReturnRequestDialog";
import SupportTicketForm from "@/components/support/SupportTicketForm";
import { emailNewReviewToShop, emailNewOrderToShop } from "@/components/lib/emailNotifications";
import DeleteAccountFlow from "@/components/profile/DeleteAccountFlow";
import BuyerNavbar from "@/components/dashboard/BuyerNavbar";
import { OrderSkeleton, RowSkeleton, Skeleton } from "@/components/shared/SkeletonCard";
import { useOptimisticList } from "@/components/shared/useOptimistic";

const orderStatusConfig = {
  pending: { icon: Clock, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/20", border: "border-amber-200 dark:border-amber-800" },
  confirmed: { icon: CheckCircle2, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20", border: "border-blue-200 dark:border-blue-800" },
  processing: { icon: Package, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-900/20", border: "border-indigo-200 dark:border-indigo-800" },
  shipped: { icon: Truck, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-900/20", border: "border-purple-200 dark:border-purple-800" },
  delivered: { icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20", border: "border-emerald-200 dark:border-emerald-800" },
  cancelled: { icon: XCircle, color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-900/20", border: "border-red-200 dark:border-red-800" },
};

export default function BuyerDashboard() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("orders");
  const [orders, setOrders, updateOrder, removeOrder] = useOptimisticList([]);
  const [wallet, setWallet] = useState(null);
  const [walletTxns, setWalletTxns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileForm, setProfileForm] = useState({ first_name: "", last_name: "", phone: "", region: "", town: "", address: "", profile_picture_url: "", use_default_address: true });
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [profileErrors, setProfileErrors] = useState({});
  const [reviewDialog, setReviewDialog] = useState(false);
  const [reviewOrder, setReviewOrder] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [partsRequestOpen, setPartsRequestOpen] = useState(false);
  const [deleteAccountDialog, setDeleteAccountDialog] = useState(false);
  const [passwordResetSent, setPasswordResetSent] = useState(false);
  const [receiptDialog, setReceiptDialog] = useState(false);
  const [receiptOrder, setReceiptOrder] = useState(null);
  const [stripeRefundDialog, setStripeRefundDialog] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [stripeRefundSubmitting, setStripeRefundSubmitting] = useState(false);
  const [retryPaymentOrder, setRetryPaymentOrder] = useState(null);
  const [retryPaymentSubmitting, setRetryPaymentSubmitting] = useState(false);
  const [returnDialog, setReturnDialog] = useState(false);
  const [returnOrder, setReturnOrder] = useState(null);

  // Sync view from URL (initial load + popstate/pushstate changes)
  useEffect(() => {
    const sync = () => {
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get("view");
      if (viewParam) setView(viewParam);
    };
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  useEffect(() => {
    (async () => {
      const u = await base44.auth.me();
      // Redirect shop owners and admins away from buyer dashboard
      if (u.role === "shop_owner") {
        window.location.href = createPageUrl("ShopDashboard");
        return;
      }
      if (u.role === "admin") {
        window.location.href = createPageUrl("AdminDashboard");
        return;
      }
      // Redirect to profile completion if not completed
      if (!u.profile_completed) {
        window.location.href = createPageUrl("ProfileCompletion");
        return;
      }
      setUser(u);
      setProfileForm({ first_name: u.first_name || "", last_name: u.last_name || "", phone: u.phone || "", region: u.region || "", town: u.town || "", address: u.address || "", profile_picture_url: u.profile_picture_url || "", use_default_address: u.use_default_address !== false });
      const [o, wallets, txns] = await Promise.all([
        base44.entities.Order.filter({ buyer_email: u.email }, "-created_date", 50),
        base44.entities.BuyerWallet.filter({ buyer_email: u.email }),
        base44.entities.WalletTransaction.filter({ buyer_email: u.email }, "-created_date", 20),
      ]);
      setOrders(o);
      setWallet(wallets[0] || null);
      setWalletTxns(txns);
      setLoading(false);

      // Auto-confirm orders after successful N-Genius payment
      const params = new URLSearchParams(window.location.search);
      if (params.get("payment") === "success") {
        // Find all pending orders for this user that are awaiting payment confirmation
        const pendingOrders = o.filter(ord => ord.status === "pending" && ord.shop_id === "PENDING_PAYMENT");
        if (pendingOrders.length > 0) {
          await Promise.all(pendingOrders.map(ord => base44.entities.Order.update(ord.id, { status: "confirmed" })));
          const updated = await base44.entities.Order.filter({ buyer_email: u.email }, "-created_date", 50);
          setOrders(updated);
          toast.success("Payment successful! Your order has been confirmed.");
        }
        // Clean URL
        window.history.replaceState({}, "", window.location.pathname);
      }
      
      // Real-time updates for orders, wallet, and returns
      const unsubscribeOrder = base44.entities.Order.subscribe((event) => {
        if (event.data?.buyer_email === u.email) {
          if (event.type === "update" && event.data) {
            setOrders(prev => prev.map(o => o.id === event.id ? { ...o, ...event.data } : o));
          } else {
            (async () => {
              const updated = await base44.entities.Order.filter({ buyer_email: u.email }, "-created_date", 50);
              setOrders(updated);
            })();
          }
        }
      });

      const unsubscribeWallet = base44.entities.BuyerWallet.subscribe((event) => {
        if (event.data?.buyer_email === u.email) {
          setWallet(event.data);
        }
      });

      const unsubscribeReturn = base44.entities.Return.subscribe((event) => {
        if (event.data?.status === "refunded") {
          (async () => {
            const updated = await base44.entities.Order.filter({ buyer_email: u.email }, "-created_date", 50);
            setOrders(updated);
            const wallets = await base44.entities.BuyerWallet.filter({ buyer_email: u.email });
            setWallet(wallets[0] || null);
          })();
        }
      });

      return () => {
        unsubscribeOrder();
        unsubscribeWallet();
        unsubscribeReturn();
      };
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
           address: profileForm.address,
           profile_picture_url: profileForm.profile_picture_url,
           use_default_address: profileForm.use_default_address,
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

      // Email the shop owner
      const shops = await base44.entities.Shop.filter({ id: reviewOrder.shop_id });
      if (shops[0]?.owner_email) {
        emailNewReviewToShop(shops[0].owner_email, reviewOrder.shop_name, user.full_name, reviewData.rating, reviewData.comment);
      }
      toast.success("Review submitted successfully!");
      setReviewDialog(false);
      setReviewOrder(null);
    } catch (error) {
      toast.error("Failed to submit review");
    }
    setSubmitting(false);
  };

  const navigate = useNavigate();
  const switchView = (v) => {
    setView(v);
    window.history.replaceState({}, "", window.location.pathname + "?view=" + v);
  };

  const sidebarItems = [
    { id: "orders", label: "My Orders", icon: ShoppingCart, onClick: () => switchView("orders") },
    { id: "cart", label: "Cart", icon: ShoppingCart, onClick: () => switchView("cart") },
    { id: "wallet", label: "My Wallet", icon: Wallet, onClick: () => switchView("wallet"), badge: wallet?.balance > 0 ? `K${Math.round(wallet.balance)}` : null },
    { id: "parts_requests", label: "Parts Requests", icon: FileSearch, onClick: () => switchView("parts_requests") },
    { id: "technician_requests", label: "Technician Requests", icon: Wrench, onClick: () => switchView("technician_requests") },
    { id: "appointments", label: "My Appointments", icon: Calendar, onClick: () => switchView("appointments") },
    { id: "messages", label: "Messages", icon: MessageSquare, onClick: () => switchView("messages") },
    { id: "loyalty", label: "Loyalty Rewards", icon: Gift, onClick: () => switchView("loyalty") },
    { id: "support", label: "Support", icon: Settings, onClick: () => switchView("support") },
    { id: "profile", label: "Profile", icon: User, onClick: () => switchView("profile") },
  ];

  if (loading) return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
      <div className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800" />
      <div className="p-4 lg:p-8 space-y-4 max-w-xl mt-6">
        <Skeleton className="h-7 w-36 mb-6" />
        {[1, 2, 3].map(i => <OrderSkeleton key={i} />)}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <BuyerNavbar user={user} />
      <div className="flex">
        <DashboardSidebar items={sidebarItems} active={view} title="My Dashboard" />

        <main
          className="flex-1 pt-16 md:pt-8 overflow-auto min-w-0 text-slate-900 dark:text-slate-100"
          style={{
            paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 4rem)",
            paddingLeft: "max(1rem, env(safe-area-inset-left, 0px))",
            paddingRight: "max(1rem, env(safe-area-inset-right, 0px))",
          }}
        >
        <PullToRefresh onRefresh={async () => {
          setLoading(true);
          const u = await base44.auth.me();
          const [o, wallets, txns] = await Promise.all([
            base44.entities.Order.filter({ buyer_email: u.email }, "-created_date", 50),
            base44.entities.BuyerWallet.filter({ buyer_email: u.email }),
            base44.entities.WalletTransaction.filter({ buyer_email: u.email }, "-created_date", 20),
          ]);
          setOrders(o);
          setWallet(wallets[0] || null);
          setWalletTxns(txns);
          setLoading(false);
        }}>
          <div className="p-4 md:p-6 lg:p-8">
        {view === "orders" && (
          <PullToRefresh onRefresh={async () => {
            const o = await base44.entities.Order.filter({ buyer_email: user.email }, "-created_date", 50);
            setOrders(o);
          }}>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">My Orders</h1>
            {orders.length === 0 ? (
              <div className="text-center py-20">
                <ShoppingCart className="w-16 h-16 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
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
                    <Card key={order.id} className={`border ${sc.border} bg-white dark:bg-slate-900`}>
                      <CardContent className="p-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs text-slate-400 dark:text-slate-500">#{order.id?.slice(0,8)}</span>
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
                            <p className="text-xl font-bold text-blue-600 dark:text-blue-400">K{order.total_amount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                            {order.status === "confirmed" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => { setReceiptOrder(order); setReceiptDialog(true); }}
                                className="gap-1.5 text-xs border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                              >
                                <Eye className="w-3.5 h-3.5" /> Receipt
                              </Button>
                            )}
                            {order.status === "pending" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setRetryPaymentOrder(order)}
                                className="gap-1.5 text-xs border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                              >
                                💳 Complete Payment
                              </Button>
                            )}
                            {order.status === "delivered" && (
                             <div className="flex flex-col gap-1.5">
                               <Button
                                 size="sm"
                                 variant="outline"
                                 onClick={() => {
                                   setReviewOrder(order);
                                   setReviewDialog(true);
                                 }}
                                 className="gap-1.5 text-xs border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                               >
                                 <Star className="w-3.5 h-3.5" /> Leave Review
                               </Button>
                               <Button
                                 size="sm"
                                 variant="outline"
                                 onClick={() => { setReturnOrder(order); setReturnDialog(true); }}
                                 className="gap-1.5 text-xs border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/30"
                               >
                                 <RotateCcw className="w-3.5 h-3.5" /> Request Return
                               </Button>
                             </div>
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
                            <div key={i} className="flex items-center gap-3 py-2 border-t border-slate-50 dark:border-slate-700/50 first:border-0">
                              <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                {item.image_url ? <img src={item.image_url} alt="" className="w-full h-full object-cover" /> : <Package className="w-4 h-4 text-slate-300 dark:text-slate-600" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{item.product_name}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Qty: {item.quantity} × K{item.price?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        {order.status === "cancelled" && (
                          <div className="mt-3 p-3 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/40 rounded-lg text-sm text-red-700 dark:text-red-400">
                            {order.cancellation_reason && <p><span className="font-medium">Reason: </span>{order.cancellation_reason}</p>}
                            {order.stripe_session_id && order.payment_method === 'stripe' && (
                              <p className="mt-1 text-emerald-700 dark:text-emerald-400 font-medium">✓ K{order.total_amount?.toLocaleString('en-US', { minimumFractionDigits: 2 })} credited to your wallet</p>
                            )}
                          </div>
                        )}
                        {(order.status === "shipped" || order.status === "delivered") && (
                         <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
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

        {view === "technician_requests" && (
          <BuyerTechnicianRequests user={user} />
        )}

        {view === "appointments" && (
          <BuyerAppointments user={user} />
        )}

        {view === "messages" && (
          <BuyerMessages user={user} />
        )}

        {view === "wallet" && (
          <div className="max-w-xl">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">My Wallet</h1>
            <Card className="border-blue-100 dark:border-blue-900 bg-gradient-to-br from-blue-600 to-cyan-600 dark:from-blue-700 dark:to-cyan-700 text-white mb-4">
              <CardContent className="p-6">
                <p className="text-sm text-blue-100 dark:text-blue-200 mb-1">Available Balance</p>
                <p className="text-4xl font-bold">K{(wallet?.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                <p className="text-xs text-blue-200 dark:text-blue-300 mt-2">Site credits from refunded orders</p>
              </CardContent>
            </Card>

            {(wallet?.balance || 0) > 0 && (
              <div className="grid grid-cols-2 gap-3 mb-6">
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => { window.location.href = createPageUrl("BrowseProducts"); }}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" /> Use on Next Order
                </Button>
                <Button
                  variant="outline"
                  className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  onClick={() => setStripeRefundDialog(true)}
                >
                  <Wallet className="w-4 h-4 mr-2" /> Refund to Card
                </Button>
              </div>
            )}

            <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
              <CardContent className="p-5">
                <h2 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">Transaction History</h2>
                {loading ? (
                  <RowSkeleton count={4} />
                ) : walletTxns.length === 0 ? (
                  <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-8">No transactions yet</p>
                ) : (
                  <div className="space-y-1">
                    {walletTxns.map(txn => (
                      <button
                        key={txn.id}
                        onClick={() => setSelectedTxn(txn)}
                        className="w-full flex items-center justify-between py-2.5 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-700/50 last:border-0 text-left group"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{txn.reason}</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500">{new Date(txn.created_date).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                          <span className={`text-sm font-bold ${txn.type === 'credit' ? 'text-emerald-600 dark:text-emerald-500' : 'text-red-500 dark:text-red-400'}`}>
                            {txn.type === 'credit' ? '+' : '-'}K{txn.amount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                          <span className="text-slate-300 dark:text-slate-600 text-xs group-hover:text-slate-400 dark:group-hover:text-slate-500 transition-colors">›</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {view === "loyalty" && (
          <LoyaltyPanel user={user} />
        )}

        {view === "support" && (
          <SupportTicketForm user={user} />
        )}

        {view === "cart" && (
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">Cart</h1>
            <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 max-w-2xl">
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
            <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
              <CardContent className="p-6 space-y-4">
                <h2 className="font-semibold text-slate-800 dark:text-slate-200 text-sm uppercase tracking-wide">Personal Information</h2>

                {/* Profile Picture */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center overflow-hidden border-2 border-blue-200 dark:border-blue-700">
                      {profileForm.profile_picture_url ? (
                        <img src={profileForm.profile_picture_url} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-8 h-8 text-blue-400" />
                      )}
                    </div>
                    <label className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center cursor-pointer shadow-md">
                      <Camera className="w-3.5 h-3.5 text-white" />
                      <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        setUploadingPicture(true);
                        const { file_url } = await base44.integrations.Core.UploadFile({ file });
                        setProfileForm(f => ({ ...f, profile_picture_url: file_url }));
                        setUploadingPicture(false);
                        toast.success("Photo uploaded!");
                      }} />
                    </label>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{user?.full_name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
                    {uploadingPicture && <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">Uploading...</p>}
                  </div>
                </div>

                <div>
                  <Label className="text-sm text-slate-500 dark:text-slate-400">Email (cannot be changed)</Label>
                  <p className="font-medium text-slate-900 dark:text-slate-100 mt-0.5 text-sm">{user?.email}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="dark:text-slate-300">First Name *</Label>
                    <Input value={profileForm.first_name} onChange={e => setProfileForm({...profileForm, first_name: e.target.value})} placeholder="First name" className={`mt-1 rounded-xl ${profileErrors.first_name ? "border-red-400 dark:border-red-600" : ""}`} />
                    {profileErrors.first_name && <p className="text-xs text-red-500 dark:text-red-400 mt-1">{profileErrors.first_name}</p>}
                  </div>
                  <div>
                    <Label className="dark:text-slate-300">Last Name *</Label>
                    <Input value={profileForm.last_name} onChange={e => setProfileForm({...profileForm, last_name: e.target.value})} placeholder="Last name" className={`mt-1 rounded-xl ${profileErrors.last_name ? "border-red-400 dark:border-red-600" : ""}`} />
                    {profileErrors.last_name && <p className="text-xs text-red-500 dark:text-red-400 mt-1">{profileErrors.last_name}</p>}
                  </div>
                </div>
                <div>
                  <Label className="dark:text-slate-300">Phone Number</Label>
                  <Input value={profileForm.phone} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} placeholder="+260 7XX XXX XXX" className={`mt-1 rounded-xl ${profileErrors.phone ? "border-red-400 dark:border-red-600" : ""}`} />
                  {profileErrors.phone && <p className="text-xs text-red-500 dark:text-red-400 mt-1">{profileErrors.phone}</p>}
                </div>
                <AddressInput 
                  value={{ region: profileForm.region, town: profileForm.town, address: profileForm.address }}
                  onChange={(newAddr) => setProfileForm({...profileForm, region: newAddr.region, town: newAddr.town, address: newAddr.address})}
                  errors={profileErrors}
                />
                <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                  <input
                    type="checkbox"
                    id="use_default_address"
                    checked={profileForm.use_default_address}
                    onChange={e => setProfileForm({...profileForm, use_default_address: e.target.checked})}
                    className="w-4 h-4 rounded accent-blue-600"
                  />
                  <label htmlFor="use_default_address" className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                    <span className="font-medium">Use this address as default at checkout</span>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Pre-fill checkout form with this address</p>
                  </label>
                </div>
                <Button onClick={saveProfile} disabled={submitting} className="bg-blue-600 hover:bg-blue-700 gap-2">{submitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}{submitting ? "Saving..." : "Save Changes"}</Button>
              </CardContent>
            </Card>

            {/* Password Reset */}
            <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
              <CardContent className="p-6 space-y-3">
                <h2 className="font-semibold text-slate-800 dark:text-slate-200 text-sm uppercase tracking-wide">Security</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">A password reset link will be sent to <span className="font-medium text-slate-700 dark:text-slate-300">{user?.email}</span>.</p>
                {passwordResetSent ? (
                  <p className="text-sm text-emerald-600 dark:text-emerald-500 font-medium">✓ Reset link sent! Check your email.</p>
                ) : (
                  <Button variant="outline" onClick={async () => {
                    await base44.integrations.Core.SendEmail({
                      to: user.email,
                      subject: "Password Reset Request – BwanguSpares",
                      body: `Hello ${user.full_name},\n\nYou requested a password reset for your BwanguSpares account.\n\nPlease use your login page to reset your password, or contact support at admin@bwangu.com if you need help.\n\nBwanguSpares Team`
                    });
                    setPasswordResetSent(true);
                    toast.success("Password reset email sent!");
                  }} className="dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800">
                    Send Password Reset Email
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-red-100 dark:border-red-900/40 bg-white dark:bg-slate-900">
              <CardContent className="p-6 space-y-3">
                <h2 className="font-semibold text-red-600 dark:text-red-500 text-sm uppercase tracking-wide">Danger Zone</h2>
                {deleteAccountDialog ? (
                  <DeleteAccountFlow user={user} onCancel={() => setDeleteAccountDialog(false)} />
                ) : (
                  <>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Permanently delete your account and all associated data. This cannot be undone.</p>
                    <Button
                      variant="outline"
                      onClick={() => setDeleteAccountDialog(true)}
                      className="text-red-600 dark:text-red-500 border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                      Delete My Account
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}
          </div>
        </PullToRefresh>
      </main>

      <PartsRequestForm open={partsRequestOpen} onClose={() => setPartsRequestOpen(false)} />



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

       <Dialog open={stripeRefundDialog} onOpenChange={setStripeRefundDialog}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>Refund Wallet Balance to Card</DialogTitle>
             <DialogDescription>
               Your full wallet balance of <strong>K{(wallet?.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong> will be refunded back to your original payment card via Stripe. This may take 5–10 business days to appear.
             </DialogDescription>
           </DialogHeader>
           <DialogFooter className="gap-2">
             <Button variant="outline" onClick={() => setStripeRefundDialog(false)}>Cancel</Button>
             <Button
               className="bg-blue-600 hover:bg-blue-700 gap-2"
               disabled={stripeRefundSubmitting || (wallet?.balance || 0) === 0}
               onClick={async () => {
                 setStripeRefundSubmitting(true);
                 try {
                   const res = await base44.functions.invoke('walletStripeRefund', { amount: wallet.balance });
                   if (res.data?.success) {
                     toast.success("Refund initiated! It will appear on your card in 5–10 business days.");
                     setStripeRefundDialog(false);
                     const [wallets, txns] = await Promise.all([
                       base44.entities.BuyerWallet.filter({ buyer_email: user.email }),
                       base44.entities.WalletTransaction.filter({ buyer_email: user.email }, "-created_date", 20),
                     ]);
                     setWallet(wallets[0] || null);
                     setWalletTxns(txns);
                   } else {
                     toast.error(res.data?.error || "Refund failed. Please contact support.");
                   }
                 } catch (e) {
                   toast.error("Refund failed. Please contact support.");
                 }
                 setStripeRefundSubmitting(false);
               }}
             >
               {stripeRefundSubmitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}{stripeRefundSubmitting ? "Processing..." : "Confirm Refund"}
             </Button>
           </DialogFooter>
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

       <ReturnRequestDialog
         open={returnDialog}
         onClose={() => { setReturnDialog(false); setReturnOrder(null); }}
         order={returnOrder}
         user={user}
       />

       <WalletTransactionDetail
         txn={selectedTxn}
         open={!!selectedTxn}
         onClose={() => setSelectedTxn(null)}
         userEmail={user?.email}
       />

       <Dialog open={!!retryPaymentOrder} onOpenChange={(open) => { if (!open) setRetryPaymentOrder(null); }}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>Complete Payment</DialogTitle>
             <DialogDescription>
               Your order for <strong>K{retryPaymentOrder?.total_amount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong> is pending payment. Click below to complete payment and confirm your order.
             </DialogDescription>
           </DialogHeader>
           <DialogFooter className="gap-2">
             <Button variant="outline" onClick={() => setRetryPaymentOrder(null)}>Cancel</Button>
             <Button
               className="bg-blue-600 hover:bg-blue-700 gap-2"
               disabled={retryPaymentSubmitting}
               onClick={async () => {
                 setRetryPaymentSubmitting(true);
                 try {
                   // Add items back to cart for retry checkout
                   for (const item of retryPaymentOrder.items) {
                     await base44.entities.CartItem.create({
                       buyer_email: user.email,
                       product_id: item.product_id,
                       product_name: item.product_name,
                       shop_id: retryPaymentOrder.shop_id,
                       shop_name: retryPaymentOrder.shop_name,
                       price: item.price,
                       quantity: item.quantity,
                       image_url: item.image_url,
                     });
                   }
                   toast.success("Items added to cart. Redirecting to checkout...");
                   // Redirect to cart with checkout open
                   setTimeout(() => {
                     window.location.href = createPageUrl("Cart");
                   }, 1000);
                 } catch (error) {
                   toast.error("Failed to restore items. Please try again.");
                 }
                 setRetryPaymentSubmitting(false);
               }}
             >
               {retryPaymentSubmitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}{retryPaymentSubmitting ? "Processing..." : "Proceed to Checkout"}
             </Button>
           </DialogFooter>
         </DialogContent>
         </Dialog>
         </div>
         </div>
         );
         }