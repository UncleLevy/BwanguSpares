import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";

export default function NotificationBell({ userEmail }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userEmail) return;
    loadNotifications();

    const unsubscribe = base44.entities.Notification.subscribe((event) => {
      if (event.type === "create" && event.data.user_email === userEmail) {
        setNotifications((prev) => [event.data, ...prev]);
        if (!event.data.read) {
          setUnreadCount((prev) => prev + 1);
        }
      } else if (event.type === "update" && event.data.user_email === userEmail) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === event.id ? event.data : n))
        );
        loadNotifications();
      }
    });

    return unsubscribe;
  }, [userEmail]);

  const loadNotifications = async () => {
    const notifs = await base44.entities.Notification.filter(
      { user_email: userEmail },
      "-created_date",
      20
    );
    setNotifications(notifs);
    setUnreadCount(notifs.filter((n) => !n.read).length);
  };

  const markAsRead = async (notification) => {
    if (!notification.read) {
      await base44.entities.Notification.update(notification.id, { read: true });
    }
    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    await Promise.all(
      unread.map((n) => base44.entities.Notification.update(n.id, { read: true }))
    );
    loadNotifications();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <Bell className="w-5 h-5 text-slate-600" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 min-w-[20px] flex items-center justify-center bg-red-500 text-white text-[10px] px-1">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs text-blue-600 hover:underline"
            >
              Mark all as read
            </button>
          )}
        </div>
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">
              No notifications yet
            </div>
          ) : (
            notifications.map((notif) => (
              <DropdownMenuItem
                key={notif.id}
                className={`px-3 py-3 cursor-pointer ${
                  !notif.read ? "bg-blue-50" : ""
                }`}
                onClick={() => markAsRead(notif)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-sm text-slate-900 line-clamp-1">
                      {notif.title}
                    </p>
                    {!notif.read && (
                      <div className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 mt-1" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">
                    {notif.message}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {format(new Date(notif.created_date), "MMM d, h:mm a")}
                  </p>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}