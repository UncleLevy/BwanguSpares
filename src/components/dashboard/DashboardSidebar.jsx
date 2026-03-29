import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ChevronLeft, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

function SidebarContent({ items, active, title, collapsed, onItemClick }) {
  return (
    <div className="flex flex-col h-full">
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto" aria-label={`${title} navigation`}>
        {items.map(item =>
          item.href ? (
            <Link
              key={item.id}
              to={item.href}
              onClick={onItemClick}
              aria-label={item.label}
              aria-current={active === item.id ? "page" : undefined}
              className={cn(
                "w-full flex items-center gap-3 px-3 rounded-xl text-sm font-medium transition-colors text-left min-h-[44px]",
                collapsed ? "justify-center px-2" : "",
                active === item.id
                  ? "bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
              {!collapsed && item.badge ? (
                <span className="ml-auto bg-blue-600 text-white text-[10px] rounded-full px-1.5 py-0.5 font-bold shrink-0">{item.badge}</span>
              ) : item.badge ? (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full" />
              ) : null}
            </Link>
          ) : (
            <button
              key={item.id}
              onClick={() => { item.onClick?.(); onItemClick?.(); }}
              aria-label={item.label}
              aria-current={active === item.id ? "page" : undefined}
              className={cn(
                "relative w-full flex items-center gap-3 px-3 rounded-xl text-sm font-medium transition-colors text-left min-h-[44px]",
                collapsed ? "justify-center px-2" : "",
                active === item.id
                  ? "bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
              {!collapsed && item.badge ? (
                <span className="ml-auto bg-blue-600 text-white text-[10px] rounded-full px-1.5 py-0.5 font-bold shrink-0">{item.badge}</span>
              ) : item.badge ? (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full" />
              ) : null}
            </button>
          )
        )}
      </nav>
      <div className="mt-auto p-2 border-t border-slate-100 dark:border-slate-700">
        <Link
          to={createPageUrl("Home")}
          onClick={onItemClick}
          aria-label="Back to main site"
          className={cn(
            "flex items-center gap-3 px-3 min-h-[44px] rounded-xl text-sm text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800",
            collapsed ? "justify-center px-2" : ""
          )}
          title={collapsed ? "Back to Site" : undefined}
        >
          <ChevronLeft className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Back to Site</span>}
        </Link>
      </div>
    </div>
  );
}

export default function DashboardSidebar({ items, active, title }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile hamburger button — rendered inside the navbar area via a portal-like approach.
          We show a floating menu button that overlays the navbar on mobile. */}
      <div className="md:hidden fixed top-0 left-0 z-[55] flex items-center"
        style={{ height: 56, paddingTop: "env(safe-area-inset-top, 0px)", paddingLeft: "env(safe-area-inset-left, 0px)" }}
      >
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="w-12 h-12 flex items-center justify-center text-slate-600 dark:text-slate-400 active:bg-slate-100 dark:active:bg-slate-800 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile slide-out drawer */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-[60] bg-black/40"
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
                className="w-11 h-11 flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 flex flex-col overflow-hidden">
              <SidebarContent items={items} active={active} title={title} collapsed={false} onItemClick={() => setMobileOpen(false)} />
            </div>
          </aside>
        </div>
      )}

      {/* Tablet: icon-only sidebar (md, below lg) */}
      <aside className="hidden md:flex lg:hidden w-16 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 shrink-0 overflow-y-auto flex-col">
        <SidebarContent items={items} active={active} title={title} collapsed={true} />
      </aside>

      {/* Desktop: full label sidebar (lg+) */}
      <aside className="hidden lg:flex w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 shrink-0 overflow-y-auto flex-col">
        <SidebarContent items={items} active={active} title={title} collapsed={false} />
      </aside>
    </>
  );
}