import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import ConversationList from "./ConversationList";
import ChatWindow from "./ChatWindow";
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

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Messages</h1>
      <div className="flex bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm" style={{ height: "65vh" }}>
        <div className="w-64 border-r border-slate-100 overflow-y-auto flex-shrink-0">
          <ConversationList
            conversations={conversations}
            selectedId={selected?.id}
            onSelect={handleSelect}
            currentEmail={user.email}
            role="buyer"
          />
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
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