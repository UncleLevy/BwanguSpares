import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Home, Search, Navigation, ShoppingCart, User, LayoutDashboard,
  Wallet, MessageSquare, FileSearch, Package, Wrench, Store,
  BarChart3, ClipboardList, Gift, Settings, Star, MapPin, Heart
} from "lucide-react";
import { cn } from "@/lib/utils";
import { base44 } from "@/api/base44Client";

// Per-tab history stack — module-level so it persists across renders
const tabHistory = {};

/**
 * Derives the context-specific nav items based on the current page and user role.
 * Returns an array of { label, icon, page?, action?, badge?, hidden? }
 */
function useContextNavItems({ user, cartCount, location, setView }) {
  const path = location.pathname;
  const search = new URLSearchParams(location.search);
  const currentView = search.get("view");

  // ── BuyerDashboard context ──
  if (path === createPageUrl("BuyerDashboard") || path.startsWith("/BuyerDashboard")) {
    const sections = [
      { label: "Orders", icon: ShoppingCart, view: "orders" },
      { label: "Wallet", icon: Wallet, view: "wallet" },
      { label: "Messages", icon: MessageSquare, view: "messages" },
      { label: "Parts", icon: FileSearch, view: "parts_requests" },
      { label: "Profile", icon: User, view: "profile" },
    ];
    return sections.map(s => ({
      label: s.label,
      icon: s.icon,
      isViewAction: true,
      viewKey: s.view,
      active: currentView === s.view || (!currentView && s.view === "orders"),
    }));
  }

  // ── ShopDashboard context ──
  if (path === createPageUrl("ShopDashboard") || path.startsWith("/ShopDashboard")) {
    const sections = [
      { label: "Overview", icon: LayoutDashboard, view: "overview" },
      { label: "Products", icon: Package, view: "products" },
      { label: "Orders", icon: ShoppingCart, view: "orders" },
      { label: "Messages", icon: MessageSquare, view: "messages" },
      { label: "Analytics", icon: BarChart3, view: "analytics" },
    ];
    return sections.map(s => ({
      label: s.label,
      icon: s.icon,
      isViewAction: true,
      viewKey: s.view,
      active: currentView === s.view || (!currentView && s.view === "overview"),
    }));
  }

  // ── AdminDashboard context ──
  if (path === createPageUrl("AdminDashboard") || path.startsWith("/AdminDashboard")) {
    const sections = [
      { label: "Overview", icon: LayoutDashboard, view: "overview" },
      { label: "Shops", icon: Store, view: "shops" },
      { label: "Orders", icon: ShoppingCart, view: "orders" },
      { label: "Users", icon: User, view: "users" },
      { label: "Reports", icon: ClipboardList, view: "reports" },
    ];
    return sections.map(s => ({
      label: s.label,
      icon: s.icon,
      isViewAction: true,
      viewKey: s.view,
      active: currentView === s.view || (!currentView && s.view === "overview"),
    }));
  }

  // ── Default public / browsing context ──
  const isShopOwner = user?.role === "shop_owner";
  const isAdmin = user?.role === "admin";

  return [
    { label: "Home", icon: Home, page: "Home" },
    { label: "Browse", icon: Search, page: "BrowseProducts" },
    { label: "Nearby", icon: Navigation, page: "FindNearby" },
    {
      label: "Cart",
      icon: ShoppingCart,
      page: "Cart",
      badge: cartCount,
      hidden: isShopOwner || isAdmin,
    },
    {
      label: "Account",
      icon: User,
      page: isAdmin ? "AdminDashboard" : isShopOwner ? "ShopDashboard" : "BuyerDashboard",
    },
  ];
}

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const prevPath = useRef(location.pathname + location.search);

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

  // Track tab history for independent navigation stacks
  useEffect(() => {
    const current = location.pathname + location.search;
    if (current === prevPath.current) return;
    const publicPages = ["Home", "BrowseProducts", "FindNearby", "Cart", "BuyerDashboard", "ShopDashboard", "AdminDashboard"];
    const owningTab = publicPages.find(page => {
      const tabRoot = createPageUrl(page);
      return current === tabRoot || current.startsWith(tabRoot + "?") || current.startsWith(tabRoot + "/");
    });
    if (owningTab) {
      if (!tabHistory[owningTab]) tabHistory[owningTab] = [];
      const stack = tabHistory[owningTab];
      if (stack[stack.length - 1] !== current) stack.push(current);
    }
    prevPath.current = current;
  }, [location.pathname, location.search]);

  const handlePageTap = (page, isActive) => {
    const tabRoot = createPageUrl(page);
    if (isActive) {
      tabHistory[page] = [];
      navigate(tabRoot, { replace: true });
    } else {
      const stack = tabHistory[page];
      const dest = stack && stack.length > 0 ? stack[stack.length - 1] : tabRoot;
      navigate(dest);
    }
  };

  const handleViewTap = (viewKey, isActive) => {
    if (isActive) return; // already here
    const url = location.pathname + "?view=" + viewKey;
    navigate(url, { replace: true });
  };

  const navItems = useContextNavItems({ user, cartCount, location });

  // Hide on pages that have their own full-screen dashboard nav
  // (but we still show the context nav for those dashboards)
  const hiddenPages = []; // We now show contextual nav on all pages

  return (
    <nav
      role="navigation"
      aria-label="Main navigation"
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-700 flex md:hidden select-none"
      style={{
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        paddingLeft: "env(safe-area-inset-left, 0px)",
        paddingRight: "env(safe-area-inset-right, 0px)",
      }}
    >
      {navItems.map((item) => {
        if (item.hidden) return null;

        const isActive = item.isViewAction
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
            onClick={() =>
              item.isViewAction
                ? handleViewTap(item.viewKey, isActive)
                : handlePageTap(item.page, isActive)
            }
            aria-label={item.label}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors relative",
              isActive
                ? "text-blue-600 dark:text-blue-400"
                : "text-slate-500 dark:text-slate-400"
            )}
            style={{ minHeight: 56, paddingTop: 10, paddingBottom: 10 }}
          >
            <div
              className="relative flex items-center justify-center"
              style={{ minWidth: 44, minHeight: 32 }}
            >
              <Icon className="w-5 h-5" aria-hidden="true" />
              {item.badge > 0 && (
                <span
                  aria-label={`${item.badge} items in cart`}
                  className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold"
                >
                  {item.badge > 9 ? "9+" : item.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium leading-none">{item.label}</span>
            {isActive && (
              <span
                aria-hidden="true"
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full"
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}