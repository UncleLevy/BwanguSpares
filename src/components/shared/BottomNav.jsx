import React, { useState, useEffect, useCallback } from "react";
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
import { motion, AnimatePresence } from "framer-motion";

function useContextNavItems({ user, cartCount, location }) {
  const path = location.pathname;
  const search = new URLSearchParams(location.search);
  const currentView = search.get("view");
  
  const homeItem = { label: "Home", icon: Home, page: "Home" };

  if (path === createPageUrl("BuyerDashboard") || path.startsWith("/BuyerDashboard")) {
    return [
      homeItem,
      { label: "Orders",   icon: ShoppingCart,  isView: true, view: "orders" },
      { label: "Wallet",   icon: Wallet,         isView: true, view: "wallet" },
      { label: "Messages", icon: MessageSquare,  isView: true, view: "messages" },
      { label: "Profile",  icon: User,           isView: true, view: "profile" },
    ].map((s, i) => ({
      ...s,
      active: i === 0 ? false : (currentView === s.view || (!currentView && s.view === "orders")),
    }));
  }

  if (path === createPageUrl("ShopDashboard") || path.startsWith("/ShopDashboard")) {
    return [
      homeItem,
      { label: "Overview",  icon: LayoutDashboard, isView: true, view: "overview" },
      { label: "Products",  icon: Package,          isView: true, view: "products" },
      { label: "Orders",    icon: ShoppingCart,     isView: true, view: "orders" },
      { label: "Messages",  icon: MessageSquare,    isView: true, view: "messages" },
    ].map((s, i) => ({
      ...s,
      active: i === 0 ? false : (currentView === s.view || (!currentView && s.view === "overview")),
    }));
  }

  if (path === createPageUrl("AdminDashboard") || path.startsWith("/AdminDashboard")) {
    return [
      homeItem,
      { label: "Overview", icon: LayoutDashboard, isView: true, view: "overview" },
      { label: "Shops",    icon: Store,            isView: true, view: "shops" },
      { label: "Orders",   icon: ShoppingCart,     isView: true, view: "orders" },
      { label: "Users",    icon: User,             isView: true, view: "users" },
    ].map((s, i) => ({
      ...s,
      active: i === 0 ? false : (currentView === s.view || (!currentView && s.view === "overview")),
    }));
  }

  const isShopOwner = user?.role === "shop_owner";
  const isAdmin     = user?.role === "admin";

  return [
    homeItem,
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
  const location      = useLocation();
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

  const handleViewTap = useCallback((viewKey, isActive) => {
    if (isActive) return;
    const url = location.pathname + "?view=" + viewKey;
    window.history.replaceState({ view: viewKey }, "", url);
    window.dispatchEvent(new PopStateEvent("popstate", { state: { view: viewKey } }));
  }, [location.pathname]);

  const navItems = useContextNavItems({ user, cartCount, location });
  const visibleItems = navItems.filter(item => !item.hidden);

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
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        paddingBottom: "max(env(safe-area-inset-bottom, 0px), 8px)",
        paddingLeft:   "env(safe-area-inset-left, 0px)",
        paddingRight:  "env(safe-area-inset-right, 0px)",
        transform: "translateZ(0)",
        WebkitTransform: "translateZ(0)",
      }}
    >
      {visibleItems.map((item) => {
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
              isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-500"
            )}
            style={{ minHeight: 56, paddingTop: 8, paddingBottom: 8, minWidth: 0 }}
          >
            {/* Animated pill behind active icon */}
            <div className="relative flex items-center justify-center" style={{ width: 48, height: 30 }}>
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    layoutId="tab-pill"
                    className="absolute inset-0 bg-blue-50 dark:bg-blue-900/30 rounded-2xl"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ type: "spring", stiffness: 500, damping: 38 }}
                  />
                )}
              </AnimatePresence>

              <motion.div
                animate={{ scale: isActive ? 1.1 : 1, y: isActive ? -1 : 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
                className="relative z-10"
              >
                <Icon className="w-[19px] h-[19px]" aria-hidden="true" strokeWidth={isActive ? 2.2 : 1.8} />
              </motion.div>

              {/* Badge */}
              <AnimatePresence>
                {item.badge > 0 && (
                  <motion.span
                    key="badge"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    aria-label={`${item.badge} items in cart`}
                    className="absolute -top-1 -right-0.5 h-4 min-w-[16px] px-0.5 bg-red-500 rounded-full
                               text-[9px] text-white flex items-center justify-center font-bold z-20 leading-none"
                  >
                    {item.badge > 9 ? "9+" : item.badge}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            <span
              className={cn(
                "text-[10px] leading-none font-medium transition-all",
                isActive ? "font-semibold" : ""
              )}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}