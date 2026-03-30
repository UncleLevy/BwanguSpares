import React from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Package, LogOut, User, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import DarkModeToggle from "@/components/shared/DarkModeToggle";
import { createPageUrl } from "@/utils";

export default function AdminNavbar({ user }) {
  return (
    <header
      className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-700/60 shadow-sm"
    >

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 lg:h-16 pl-10 md:pl-0">
          <Link to={createPageUrl("AdminDashboard")} className="flex items-center gap-2.5">
            <img src="https://media.base44.com/images/public/699f775333a30acfe3b73c4e/a189521e3_DynamicBlueSwooshwithCohesiveTypography9.jpg" alt="BwanguSpares Logo" className="w-10 h-10 rounded-xl object-cover" />
            <div>
              <span className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Bwangu<span className="bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">Spares</span>
              </span>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 -mt-0.5">Admin Panel</p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <DarkModeToggle />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                  <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center overflow-hidden">
                    {user?.profile_picture_url ? (
                      <img src={user.profile_picture_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    )}
                  </div>
                  <span className="hidden sm:inline">{user?.full_name?.split(' ')[0]}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5 text-xs text-slate-500 dark:text-slate-400">
                  Signed in as<br />
                  <span className="font-medium text-slate-900 dark:text-slate-100">{user?.email}</span>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => base44.auth.logout()} className="text-red-600 dark:text-red-400 flex items-center gap-2">
                  <LogOut className="w-4 h-4" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}