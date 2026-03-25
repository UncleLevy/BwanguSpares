import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { MessageSquare, Archive } from "lucide-react";
import AppHeader from "@/components/shared/AppHeader";
import ConversationList from "@/components/messaging/ConversationList";
import ChatWindow from "@/components/messaging/ChatWindow";
import Breadcrumbs from "@/components/shared/Breadcrumbs";

export default function Messages() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("buyer");
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("active"); // "active" | "archived"

  useEffect(() => {
    (async () => {
      const u = await base44.auth.me();
      setUser(u);
      const isShopOwner = u.role === "shop_owner" || u.role === "admin";
      const r = isShopOwner ? "shop" : "buyer";
      setRole(r);
      await loadConversations(u, r);
      setLoading(false);
      
      // Real-time updates for messages
      const unsubscribe = base44.entities.Message.subscribe(() => {
        loadConversations(u, r);
      });
      return unsubscribe;
    })();
  }, []);

  const loadConversations = async (u, r) => {
    let convs;
    if (r === "buyer") {
      convs = await base44.entities.Conversation.filter({ buyer_email: u.email }, "-last_message_date", 50);
    } else {
      // shop owner - find their shop
      const shops = await base44.entities.Shop.filter({ owner_email: u.email });
      if (shops.length > 0) {
        convs = await base44.entities.Conversation.filter({ shop_id: shops[0].id }, "-last_message_date", 50);
      } else {
        convs = [];
      }
    }
    setConversations(convs || []);
  };

  const handleSelect = async (conv) => {
    setSelected(conv);
    // Mark as read
    const unreadField = role === "buyer" ? "buyer_unread" : "shop_unread";
    const unread = role === "buyer" ? conv.buyer_unread : conv.shop_unread;
    if (unread > 0) {
      await base44.entities.Conversation.update(conv.id, { [unreadField]: 0 });
      setConversations((prev) =>
        prev.map((c) => c.id === conv.id ? { ...c, [unreadField]: 0 } : c)
      );
    }
  };

  const handleMessageSent = async () => {
    if (!user) return;
    await loadConversations(user, role);
  };

  const handleArchiveToggle = (convId, isNowArchived) => {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== convId) return c;
        const field = role === "buyer" ? "archived_by_buyer" : "archived_by_shop";
        return { ...c, [field]: isNowArchived };
      })
    );
    // Deselect if it's moved out of the current tab
    if (selected?.id === convId) setSelected(null);
  };

  const archivedField = role === "buyer" ? "archived_by_buyer" : "archived_by_shop";
  const visibleConversations = conversations.filter((c) =>
    tab === "archived" ? c[archivedField] : !c[archivedField]
  );

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const showChat = isMobile && selected;

  return (
    <div>
      <AppHeader title="Messages" backTo="Home" />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Breadcrumbs items={[{ label: "Messages" }]} />
        <div className="flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm" style={{ height: "70vh" }}>
        {/* Conversation list — hidden on mobile when chat open */}
        <div className={`${showChat ? "hidden" : "flex"} md:flex flex-col w-full md:w-72 border-r border-slate-100 dark:border-slate-700 flex-shrink-0`}>
          {/* Tabs */}
          <div className="flex border-b border-slate-100 dark:border-slate-700 shrink-0 bg-white dark:bg-slate-900">
            <button
              onClick={() => { setTab("active"); setSelected(null); }}
              className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${tab === "active" ? "text-blue-600 border-b-2 border-blue-600" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}
            >
              Active
            </button>
            <button
              onClick={() => { setTab("archived"); setSelected(null); }}
              className={`flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-1 transition-colors ${tab === "archived" ? "text-blue-600 border-b-2 border-blue-600" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}
            >
              <Archive className="w-3.5 h-3.5" /> Archived
            </button>
          </div>
          <div className="overflow-y-auto flex-1 bg-white dark:bg-slate-900">
          <ConversationList
            conversations={visibleConversations}
            selectedId={selected?.id}
            onSelect={handleSelect}
            currentEmail={user?.email}
            role={role}
            onArchiveToggle={handleArchiveToggle}
          />
          </div>
        </div>
        {/* Chat — full-screen on mobile when open */}
        <div className={`${!showChat && isMobile ? "hidden" : "flex"} md:flex flex-1 flex-col overflow-hidden`}>
          {showChat && isMobile && (
            <button
              onClick={() => setSelected(null)}
              aria-label="Back to conversations"
              className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-blue-600 dark:text-blue-400 font-medium min-h-[44px] active:bg-slate-50 dark:active:bg-slate-700 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Back to conversations
            </button>
          )}
          {user && (
            <ChatWindow
              conversation={selected}
              currentUser={user}
              role={role}
              onMessageSent={handleMessageSent}
            />
          )}
        </div>
        </div>
        </div>
        </div>
  );
}