import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import ConversationList from "./ConversationList";
import ChatWindow from "./ChatWindow";
import PullToRefresh from "@/components/shared/PullToRefresh";

export default function ShopMessages({ shop, user }) {
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!shop) return;
    loadConversations();
  }, [shop]);

  const loadConversations = async () => {
    const convs = await base44.entities.Conversation.filter(
      { shop_id: shop.id },
      "-last_message_date",
      50
    );
    setConversations(convs);
    setLoading(false);
  };

  const handleSelect = async (conv) => {
    setSelected(conv);
    if (conv.shop_unread > 0) {
      await base44.entities.Conversation.update(conv.id, { shop_unread: 0 });
      setConversations((prev) =>
        prev.map((c) => c.id === conv.id ? { ...c, shop_unread: 0 } : c)
      );
    }
  };

  if (loading) return <div className="animate-pulse h-40 bg-slate-100 rounded-xl" />;

  const totalUnread = conversations.reduce((s, c) => s + (c.shop_unread || 0), 0);

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const showChat = isMobile && selected;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Messages</h1>
        {totalUnread > 0 && (
          <span className="bg-blue-600 text-white text-xs font-bold rounded-full px-2 py-0.5">
            {totalUnread} new
          </span>
        )}
      </div>
      <div className="flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm" style={{ height: "65vh" }}>
        <div className={`${showChat ? "hidden" : "flex"} md:flex w-full md:w-64 border-r border-slate-100 dark:border-slate-700 overflow-y-auto flex-shrink-0 flex-col`}>
          <PullToRefresh onRefresh={loadConversations}>
            <ConversationList
              conversations={conversations}
              selectedId={selected?.id}
              onSelect={handleSelect}
              currentEmail={user?.email}
              role="shop"
            />
          </PullToRefresh>
        </div>
        <div className={`${!showChat && isMobile ? "hidden" : "flex"} md:flex flex-1 flex-col overflow-hidden`}>
          {showChat && isMobile && (
            <button
              onClick={() => setSelected(null)}
              className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-blue-600 dark:text-blue-400 font-medium w-full"
            >
              ← Back to conversations
            </button>
          )}
          <ChatWindow
            conversation={selected}
            currentUser={user}
            role="shop"
            onMessageSent={loadConversations}
          />
        </div>
      </div>
    </div>
  );
}