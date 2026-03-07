import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import ConversationList from "./ConversationList";
import ChatWindow from "./ChatWindow";
import PullToRefresh from "@/components/shared/PullToRefresh";
import { MessageSquare } from "lucide-react";

export default function BuyerMessages({ user }) {
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadConversations();
  }, [user]);

  const loadConversations = async () => {
    const convs = await base44.entities.Conversation.filter(
      { buyer_email: user.email },
      "-last_message_date",
      50
    );
    setConversations(convs);
    setLoading(false);
  };

  const handleSelect = async (conv) => {
    setSelected(conv);
    if (conv.buyer_unread > 0) {
      await base44.entities.Conversation.update(conv.id, { buyer_unread: 0 });
      setConversations((prev) =>
        prev.map((c) => c.id === conv.id ? { ...c, buyer_unread: 0 } : c)
      );
    }
  };

  if (loading) return <div className="animate-pulse h-40 bg-slate-100 rounded-xl" />;

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  // On mobile: show either the list OR the chat (not both)
  const showChat = isMobile && selected;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">Messages</h1>
      <div className="flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm" style={{ height: "65vh" }}>
        {/* Conversation list — hidden on mobile when chat is open */}
        <div className={`${showChat ? "hidden" : "flex"} md:flex w-full md:w-64 border-r border-slate-100 dark:border-slate-700 overflow-y-auto flex-shrink-0 flex-col`}>
          <PullToRefresh onRefresh={loadConversations}>
            <ConversationList
              conversations={conversations}
              selectedId={selected?.id}
              onSelect={handleSelect}
              currentEmail={user.email}
              role="buyer"
            />
          </PullToRefresh>
        </div>
        {/* Chat — full width on mobile when open */}
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
            role="buyer"
            onMessageSent={loadConversations}
          />
        </div>
      </div>
    </div>
  );
}