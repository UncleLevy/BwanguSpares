import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Package, LogOut, ChevronLeft, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

function SidebarContent({ items, active, title, onItemClick }) {
  return (
    <>
      <div className="p-5 border-b border-slate-100 dark:border-slate-700">
        <Link to={createPageUrl("Home")} className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <Package className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">Bwangu<span className="text-blue-600">Spares</span></span>
        </Link>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2 font-medium uppercase tracking-wider">{title}</p>
      </div>
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {items.map(item => (
          <button key={item.id} onClick={() => { item.onClick?.(); onItemClick?.(); }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left",
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
        ))}
      </nav>
      <div className="p-3 border-t border-slate-100 dark:border-slate-700 space-y-1">
        <Link to={createPageUrl("Home")} onClick={onItemClick}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800">
          <ChevronLeft className="w-4 h-4" /> Back to Site
        </Link>
        <button onClick={() => base44.auth.logout()}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </>
  );
}

export default function DashboardSidebar({ items, active, title }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-slate-200 flex items-center gap-3 px-4 h-14">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
            <Package className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-slate-900 text-sm">Bwangu<span className="text-blue-600">Spares</span></span>
        </div>
        <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider ml-1">{title}</span>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/40"
          onClick={() => setMobileOpen(false)}
        >
          <aside
            className="w-72 max-w-[85vw] bg-white h-full flex flex-col shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-end p-3 border-b border-slate-100">
              <button onClick={() => setMobileOpen(false)} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100">
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
      <aside className="hidden lg:flex w-64 bg-white border-r border-slate-200 min-h-screen flex-col">
        <SidebarContent items={items} active={active} title={title} />
      </aside>
    </>
  );
}