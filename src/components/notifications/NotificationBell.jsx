import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Bell, ExternalLink } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { createPageUrl } from "@/utils";

const typeIcons = {
  order_update: "📦",
  new_order: "🛍️",
  low_stock: "⚠️",
  new_review: "⭐",
  shop_registration: "🏪",
  review_reminder: "📝",
  system_alert: "🔔",
};

function playTone() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  } catch (e) {}
}

export default function NotificationBell({ userEmail }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userEmail) return;
    loadNotifications();

    const unsubscribe = base44.entities.Notification.subscribe((event) => {
      if (event.type === "create" && event.data?.user_email === userEmail) {
        setNotifications((prev) => [event.data, ...prev.slice(0, 49)]);
        if (!event.data.read) {
          setUnreadCount((prev) => prev + 1);
          playTone();
        }
      } else if (event.type === "update" && event.data?.user_email === userEmail) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === event.data.id ? event.data : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    });

    return unsubscribe;
  }, [userEmail]);

  const loadNotifications = async () => {
    const notifs = await base44.entities.Notification.filter(
      { user_email: userEmail },
      "-created_date",
      30
    );
    setNotifications(notifs);
    setUnreadCount(notifs.filter((n) => !n.read).length);
  };

  const markAsRead = async (notification) => {
    if (!notification.read) {
      await base44.entities.Notification.update(notification.id, { read: true });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
    if (notification.action_url) {
      // action_url format: "PageName?param=value" or "/PageName?param=value"
      const url = notification.action_url.startsWith("/")
        ? notification.action_url.slice(1)
        : notification.action_url;
      const [pagePart, queryPart] = url.split("?");
      const base = createPageUrl(pagePart);
      navigate(queryPart ? `${base}?${queryPart}` : base);
    }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    await Promise.all(unread.map((n) => base44.entities.Notification.update(n.id, { read: true })));
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative w-11 h-11 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors" aria-label="Notifications">
          <Bell className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 min-w-[20px] flex items-center justify-center bg-red-500 text-white text-[10px] px-1 pointer-events-none">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[340px] p-0">
        <div className="flex items-center justify-between px-4 border-b" style={{ minHeight: 48 }}>
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              aria-label="Mark all notifications as read"
              className="h-9 px-2 text-xs text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors font-medium"
            >
              Mark all read
            </button>
          )}
        </div>
        <ScrollArea className="h-[420px]">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">
              <Bell className="w-8 h-8 mx-auto mb-2 text-slate-200" />
              No notifications yet
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {notifications.map((notif) => (
                <button
                 key={notif.id}
                 aria-label={`${notif.title}${!notif.read ? " (unread)" : ""}`}
                 className={`w-full text-left px-4 py-3 min-h-[52px] flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${
                   !notif.read ? "bg-blue-50/60 dark:bg-blue-900/10" : ""
                 }`}
                 onClick={() => markAsRead(notif)}
                 >
                  <span className="text-lg mt-0.5 shrink-0">
                    {typeIcons[notif.type] || "🔔"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm line-clamp-1 ${!notif.read ? "font-semibold text-slate-900 dark:text-slate-100" : "font-medium text-slate-700 dark:text-slate-300"}`}>
                        {notif.title}
                      </p>
                      <div className="flex items-center gap-1 shrink-0">
                        {!notif.read && <div className="w-2 h-2 rounded-full bg-blue-500 mt-1" />}
                        {notif.action_url && <ExternalLink className="w-3 h-3 text-slate-300" />}
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                      {notif.message}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {format(new Date(notif.created_date), "MMM d, h:mm a")}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}