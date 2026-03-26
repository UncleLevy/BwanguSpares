import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Home, Search, Navigation, ShoppingCart, User, LayoutDashboard,
  Wallet, MessageSquare, FileSearch, Package,
  Store, BarChart3, ClipboardList
} from "lucide-react";
import { cn } from "@/lib/utils";
import { base44 } from "@/api/base44Client";
import { useNav } from "@/lib/navigationContext";
import { motion } from "framer-motion";

function useContextNavItems({ user, cartCount, location }) {
  const path = location.pathname;
  const search = new URLSearchParams(location.search);
  const currentView = search.get("view");

  if (path === createPageUrl("BuyerDashboard") || path.startsWith("/BuyerDashboard")) {
    return [
      { label: "Orders",   icon: ShoppingCart,  isView: true, view: "orders" },
      { label: "Wallet",   icon: Wallet,         isView: true, view: "wallet" },
      { label: "Messages", icon: MessageSquare,  isView: true, view: "messages" },
      { label: "Parts",    icon: FileSearch,     isView: true, view: "parts_requests" },
      { label: "Profile",  icon: User,           isView: true, view: "profile" },
    ].map(s => ({
      ...s,
      active: currentView === s.view || (!currentView && s.view === "orders"),
    }));
  }

  if (path === createPageUrl("ShopDashboard") || path.startsWith("/ShopDashboard")) {
    return [
      { label: "Overview",  icon: LayoutDashboard, isView: true, view: "overview" },
      { label: "Products",  icon: Package,          isView: true, view: "products" },
      { label: "Orders",    icon: ShoppingCart,     isView: true, view: "orders" },
      { label: "Messages",  icon: MessageSquare,    isView: true, view: "messages" },
      { label: "Analytics", icon: BarChart3,        isView: true, view: "analytics" },
    ].map(s => ({
      ...s,
      active: currentView === s.view || (!currentView && s.view === "overview"),
    }));
  }

  if (path === createPageUrl("AdminDashboard") || path.startsWith("/AdminDashboard")) {
    return [
      { label: "Overview", icon: LayoutDashboard, isView: true, view: "overview" },
      { label: "Shops",    icon: Store,            isView: true, view: "shops" },
      { label: "Orders",   icon: ShoppingCart,     isView: true, view: "orders" },
      { label: "Users",    icon: User,             isView: true, view: "users" },
      { label: "Reports",  icon: ClipboardList,    isView: true, view: "reports" },
    ].map(s => ({
      ...s,
      active: currentView === s.view || (!currentView && s.view === "overview"),
    }));
  }

  const isShopOwner = user?.role === "shop_owner";
  const isAdmin     = user?.role === "admin";

  return [
    { label: "Home",    icon: Home,         page: "Home" },
    { label: "Browse",  icon: Search,       page: "BrowseProducts" },
    { label: "Nearby",  icon: Navigation,   page: "FindNearby" },
    { label: "Cart",    icon: ShoppingCart, page: "Cart", badge: cartCount, hidden: isShopOwner || isAdmin },
    {
      label: "Account",
      icon: User,
      page: isAdmin ? "AdminDashboard" : isShopOwner ? "ShopDashboard" : "BuyerDashboard",
    },
  ];
}

export default function BottomNav() {
  const location   = useLocation();
  const { switchTab } = useNav();
  const [user, setUser]           = useState(null);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    (async () => {
      const authed = await base44.auth.isAuthenticated();
      if (!authed) return;
      const u = await base44.auth.me();
      setUser(u);
      if (u.role !== "shop_owner" && u.role !== "admin") {
        const cart = await base44.entities.CartItem.filter({ buyer_email: u.email });
        setCartCount(cart.length);
      }
    })();
  }, [location.pathname]);

  const handleViewTap = (viewKey, isActive) => {
    if (isActive) return;
    // Use replaceState so it doesn't push a new history entry,
    // then dispatch popstate so the dashboard page syncs its view state.
    const url = location.pathname + "?view=" + viewKey;
    window.history.replaceState({ view: viewKey }, "", url);
    window.dispatchEvent(new PopStateEvent("popstate", { state: { view: viewKey } }));
  };

  const navItems = useContextNavItems({ user, cartCount, location });

  return (
    <nav
      role="navigation"
      aria-label="Main navigation"
      className="md:hidden select-none"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        display: "flex",
        backgroundColor: "var(--nav-bg, rgba(255,255,255,0.97))",
        borderTop: "1px solid var(--nav-border, rgba(226,232,240,1))",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        paddingLeft:   "env(safe-area-inset-left, 0px)",
        paddingRight:  "env(safe-area-inset-right, 0px)",
      }}
    >
      {navItems.map((item) => {
        if (item.hidden) return null;

        const isActive = item.isView
          ? item.active
          : (() => {
              const tabRoot = createPageUrl(item.page);
              return (
                location.pathname === tabRoot ||
                location.pathname.startsWith(tabRoot + "?") ||
                location.pathname.startsWith(tabRoot + "/")
              );
            })();

        const Icon = item.icon;

        return (
          <button
            key={item.label}
            onClick={() => item.isView ? handleViewTap(item.view, isActive) : switchTab(item.page)}
            aria-label={item.label}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors relative",
              isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400"
            )}
            style={{ minHeight: 56, paddingTop: 10, paddingBottom: 10 }}
          >
            <div className="relative flex items-center justify-center" style={{ minWidth: 44, minHeight: 32 }}>
              {isActive && (
                <motion.div
                  layoutId="tab-pill"
                  className="absolute inset-0 bg-blue-50 dark:bg-blue-900/30 rounded-xl"
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                />
              )}
              <Icon className="w-5 h-5 relative z-10" aria-hidden="true" />
              {item.badge > 0 && (
                <span
                  aria-label={`${item.badge} items in cart`}
                  className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold z-10"
                >
                  {item.badge > 9 ? "9+" : item.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium leading-none relative z-10">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}