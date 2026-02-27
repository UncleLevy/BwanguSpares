import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Package, LogOut, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DashboardSidebar({ items, active, title, accent = "blue" }) {
  const navigate = useNavigate();

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-screen flex flex-col">
      <div className="p-5 border-b border-slate-100">
        <Link to={createPageUrl("Home")} className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <Package className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-slate-900 text-sm">Bwangu<span className="text-blue-600">Spares</span></span>
        </Link>
        <p className="text-[11px] text-slate-400 mt-2 font-medium uppercase tracking-wider">{title}</p>
      </div>
      <nav className="flex-1 p-3 space-y-0.5">
        {items.map(item => (
          <button key={item.id} onClick={() => item.onClick?.()}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left",
              active === item.id
                ? "bg-blue-50 text-blue-700"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}>
            <item.icon className="w-4 h-4" />
            {item.label}
            {item.badge && (
              <span className="ml-auto bg-blue-600 text-white text-[10px] rounded-full px-1.5 py-0.5 font-bold">{item.badge}</span>
            )}
          </button>
        ))}
      </nav>
      <div className="p-3 border-t border-slate-100 space-y-1">
        <Link to={createPageUrl("Home")}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-500 hover:bg-slate-50">
          <ChevronLeft className="w-4 h-4" /> Back to Site
        </Link>
        <button onClick={() => base44.auth.logout()}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </aside>
  );
}