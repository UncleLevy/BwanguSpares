import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Home, Search, MessageSquare, User, Bell, ShoppingCart, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";
import { base44 } from "@/api/base44Client";

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [userEmail, setUserEmail] = useState(null);

  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    (async () => {
      const authed = await base44.auth.isAuthenticated();
      if (!authed) return;
      const u = await base44.auth.me();
      setUser(u);
      setUserEmail(u.email);
      const notifs = await base44.entities.Notification.filter({ user_email: u.email, read: false });
      setUnreadCount(notifs.length);
      const cart = await base44.entities.CartItem.filter({ buyer_email: u.email });
      setCartCount(cart.length);
    })();
  }, [location.pathname]);

  const handleTap = (href, isActive) => {
    // Re-clicking active tab always resets to root of that tab (strips query params)
    if (isActive) {
      navigate(href, { replace: true });
    } else {
      navigate(href);
    }
  };

  const navItems = [
    { label: "Home",     icon: Home,          page: "Home" },
    { label: "Browse",   icon: Search,        page: "BrowseProducts" },
    { label: "Nearby",   icon: Navigation,    page: "FindNearby" },
    { label: "Cart",     icon: ShoppingCart,  page: "Cart", badge: cartCount, hidden: user?.role === 'shop_owner' || user?.role === 'admin' },
    { label: "Account",  icon: User,          page: "BuyerDashboard" },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200 dark:border-slate-700 flex md:hidden select-none"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)", paddingLeft: "env(safe-area-inset-left, 0px)", paddingRight: "env(safe-area-inset-right, 0px)" }}
    >
      {navItems.map(({ label, icon: Icon, page, badge, hidden }) => {
        if (hidden) return null;
        const href = createPageUrl(page);
        const active = location.pathname === href;
        return (
          <button
            key={label}
            onClick={() => handleTap(href, active)}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] transition-colors relative",
              active ? "text-blue-600" : "text-slate-500 dark:text-slate-400"
            )}
          >
            <div className="relative">
              <Icon className="w-5 h-5" />
              {badge > 0 && (
                <span className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold">
                  {badge > 9 ? "9+" : badge}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}