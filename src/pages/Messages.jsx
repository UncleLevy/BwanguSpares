import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { MessageSquare } from "lucide-react";
import AppHeader from "@/components/shared/AppHeader";
import ConversationList from "@/components/messaging/ConversationList";
import ChatWindow from "@/components/messaging/ChatWindow";

export default function Messages() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("buyer"); // "buyer" or "shop"
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

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
        <div className="flex bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm" style={{ height: "70vh" }}>
        {/* Conversation list — hidden on mobile when chat open */}
        <div className={`${showChat ? "hidden" : "flex"} md:flex flex-col w-full md:w-72 border-r border-slate-100 overflow-y-auto flex-shrink-0`}>
          <ConversationList
            conversations={conversations}
            selectedId={selected?.id}
            onSelect={handleSelect}
            currentEmail={user?.email}
            role={role}
          />
        </div>
        {/* Chat — full-screen on mobile when open */}
        <div className={`${!showChat && isMobile ? "hidden" : "flex"} md:flex flex-1 flex-col overflow-hidden`}>
          {showChat && isMobile && (
            <button
              onClick={() => setSelected(null)}
              className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 text-sm text-blue-600 font-medium"
            >
              ← Back to conversations
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