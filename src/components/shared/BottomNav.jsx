import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Home, Search, Navigation, ShoppingCart, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { base44 } from "@/api/base44Client";

// Per-tab history stack
const tabHistory = {};

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
      const cart = await base44.entities.CartItem.filter({ buyer_email: u.email });
      setCartCount(cart.length);
    })();
  }, [location.pathname]);

  // Track tab history: push current path into appropriate tab stack
  useEffect(() => {
    const current = location.pathname + location.search;
    if (current === prevPath.current) return;
    // Find which tab owns the current path
    const owningTab = navItems.find(item => {
      const tabRoot = createPageUrl(item.page);
      return current.startsWith(tabRoot) || current === tabRoot;
    });
    if (owningTab) {
      if (!tabHistory[owningTab.page]) tabHistory[owningTab.page] = [];
      // Avoid duplicate consecutive entries
      const stack = tabHistory[owningTab.page];
      if (stack[stack.length - 1] !== current) {
        stack.push(current);
      }
    }
    prevPath.current = current;
  }, [location.pathname, location.search]);

  const handleTap = (page, isActive) => {
    const tabRoot = createPageUrl(page);
    if (isActive) {
      // Double-tap active tab: pop to root
      tabHistory[page] = [];
      navigate(tabRoot, { replace: true });
    } else {
      // Navigate to last known position in this tab, or root
      const stack = tabHistory[page];
      const dest = (stack && stack.length > 0) ? stack[stack.length - 1] : tabRoot;
      navigate(dest);
    }
  };

  const navItems = [
    { label: "Home",    icon: Home,          page: "Home" },
    { label: "Browse",  icon: Search,        page: "BrowseProducts" },
    { label: "Nearby",  icon: Navigation,    page: "FindNearby" },
    { label: "Cart",    icon: ShoppingCart,  page: "Cart",           badge: cartCount, hidden: user?.role === "shop_owner" || user?.role === "admin" },
    { label: "Account", icon: User,          page: "BuyerDashboard" },
  ];

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
      {navItems.map(({ label, icon: Icon, page, badge, hidden }) => {
        if (hidden) return null;
        const tabRoot = createPageUrl(page);
        const active = location.pathname === tabRoot || location.pathname.startsWith(tabRoot + "?");
        return (
          <button
            key={label}
            onClick={() => handleTap(page, active)}
            aria-label={label}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors relative",
              active ? "text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400"
            )}
            style={{ minHeight: 56, paddingTop: 10, paddingBottom: 10 }}
          >
            <div className="relative flex items-center justify-center" style={{ minWidth: 44, minHeight: 32 }}>
              <Icon className="w-5 h-5" />
              {badge > 0 && (
                <span
                  aria-label={`${badge} items`}
                  className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold"
                >
                  {badge > 9 ? "9+" : badge}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium leading-none">{label}</span>
            {active && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
            )}
          </button>
        );
      })}
    </nav>
  );
}