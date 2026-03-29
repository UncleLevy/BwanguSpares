import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Store, MessageSquare, LogOut, User, ChevronDown } from "lucide-react";
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

export default function ShopNavbar({ user }) {
  const navigate = useNavigate();
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (!user) return;
    
    const loadUnread = async () => {
      const convs = await base44.entities.Conversation.filter(
        { shop_owner_email: user.email },
        "-last_message_date",
        50
      );
      const unread = convs.reduce((sum, c) => sum + (c.shop_unread || 0), 0);
      setUnreadMessages(unread);
    };

    loadUnread();

    // Real-time subscription
    const unsubscribe = base44.entities.Conversation.subscribe((event) => {
      if (event.type === "update") {
        const c = event.data;
        if (c.shop_owner_email === user.email) {
          loadUnread();
        }
      }
    });

    return unsubscribe;
  }, [user]);

  return (
    <header
      className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-700/60 shadow-sm"
    >

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 lg:h-16 pl-10 md:pl-0">
          <Link to={createPageUrl("ShopDashboard")} className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl gradient-blue flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Bwangu<span className="bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">Spares</span>
              </span>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 -mt-0.5">Shop Dashboard</p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <DarkModeToggle />

            <Link
              to={createPageUrl("ShopDashboard") + "?view=messages"}
              className="relative p-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <MessageSquare className="w-5 h-5" />
              {unreadMessages > 0 && (
                <span className="absolute top-0.5 right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border border-white dark:border-slate-900" />
              )}
            </Link>
            
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