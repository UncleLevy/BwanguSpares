import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Package, LogOut, ChevronLeft, Menu, X, Home } from "lucide-react";
import { cn } from "@/lib/utils";

function SidebarContent({ items, active, title, onItemClick }) {
  return (
    <div className="flex flex-col h-full">
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto" aria-label={`${title} navigation`}>
         {items.map(item => 
           item.href ? (
             <Link key={item.id} to={item.href} onClick={onItemClick}
               aria-label={item.label}
               aria-current={active === item.id ? "page" : undefined}
               className={cn(
                 "w-full flex items-center gap-3 px-3 rounded-xl text-sm font-medium transition-colors text-left",
                 "min-h-[44px]",
                 active === item.id
                   ? "bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400"
                   : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
               )}>
               <item.icon className="w-4 h-4 shrink-0" />
               <span className="truncate">{item.label}</span>
               {item.badge ? (
                 <span className="ml-auto bg-blue-600 text-white text-[10px] rounded-full px-1.5 py-0.5 font-bold shrink-0">{item.badge}</span>
               ) : null}
             </Link>
           ) : (
             <button key={item.id} onClick={() => { item.onClick?.(); onItemClick?.(); }}
               aria-label={item.label}
               aria-current={active === item.id ? "page" : undefined}
               className={cn(
                 "w-full flex items-center gap-3 px-3 rounded-xl text-sm font-medium transition-colors text-left",
                 "min-h-[44px]",
                 active === item.id
                   ? "bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400"
                   : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
               )}>
               <item.icon className="w-4 h-4 shrink-0" />
               <span className="truncate">{item.label}</span>
               {item.badge ? (
                 <span className="ml-auto bg-blue-600 text-white text-[10px] rounded-full px-1.5 py-0.5 font-bold shrink-0">{item.badge}</span>
               ) : null}
             </button>
           )
         )}
       </nav>
      <div className="p-3 border-t border-slate-100 dark:border-slate-700 shrink-0">
        <Link to={createPageUrl("Home")} onClick={onItemClick}
          aria-label="Back to main site"
          className="flex items-center gap-3 px-3 min-h-[44px] rounded-xl text-sm text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800">
          <ChevronLeft className="w-4 h-4" /> Back to Site
        </Link>
      </div>
    </div>
  );
}

export default function DashboardSidebar({ items, active, title }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      {/* Mobile top bar — safe-area aware */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="flex items-center gap-2 px-3" style={{ minHeight: 56 }}>
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="w-11 h-11 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-700 shrink-0 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
              <Package className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-slate-900 dark:text-slate-100 text-sm truncate">Bwangu<span className="text-blue-600">Spares</span></span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider truncate hidden xs:block">{title}</span>
          </div>
          {/* Back & Home on mobile — 44px tap targets */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => navigate(-1)}
              aria-label="Go back"
              className="h-11 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 px-3 rounded-xl active:bg-slate-100 dark:active:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <Link
              to={createPageUrl("Home")}
              aria-label="Home"
              className="h-11 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 px-3 rounded-xl active:bg-slate-100 dark:active:bg-slate-800 transition-colors"
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/40"
          onClick={() => setMobileOpen(false)}
        >
          <aside
            className="w-72 max-w-[85vw] bg-white dark:bg-slate-900 h-full flex flex-col shadow-2xl"
            style={{ paddingTop: "env(safe-area-inset-top)" }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 dark:border-slate-700">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{title}</span>
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="w-11 h-11 flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 flex flex-col overflow-hidden">
              <SidebarContent items={items} active={active} title={title} onItemClick={() => setMobileOpen(false)} />
            </div>
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 lg:w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 shrink-0 h-screen overflow-hidden">
       <SidebarContent items={items} active={active} title={title} />
      </aside>
    </>
  );
}