import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Home, Search, MessageSquare, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Home",     icon: Home,          page: "Home" },
  { label: "Browse",   icon: Search,        page: "BrowseProducts" },
  { label: "Messages", icon: MessageSquare, page: "Messages" },
  { label: "Account",  icon: User,          page: "BuyerDashboard" },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleTap = (href, isActive) => {
    if (isActive) {
      // Re-tapping the active tab resets that tab's stack to its root
      navigate(href, { replace: true });
    } else {
      navigate(href);
    }
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200 dark:border-slate-700 flex md:hidden select-none"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {navItems.map(({ label, icon: Icon, page }) => {
        const href = createPageUrl(page);
        const active = location.pathname === href || location.pathname.startsWith(href + "?");
        return (
          <button
            key={page}
            onClick={() => handleTap(href, active)}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] transition-colors",
              active ? "text-blue-600" : "text-slate-500 dark:text-slate-400"
            )}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}