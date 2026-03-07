import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Send, Store, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { toast } from "sonner";

export default function ChatWindow({ conversation, currentUser, role, onMessageSent }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!conversation) return;
    loadMessages();

    const unsubscribe = base44.entities.Message.subscribe((event) => {
      if (event.data?.conversation_id === conversation.id) {
        if (event.type === "create") {
          setMessages((prev) => [...prev, event.data]);
        }
      }
    });
    return unsubscribe;
  }, [conversation?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!conversation) return;
    // Mark messages as read
    markRead();
  }, [conversation?.id]);

  const loadMessages = async () => {
    const msgs = await base44.entities.Message.filter(
      { conversation_id: conversation.id },
      "created_date",
      100
    );
    setMessages(msgs);
  };

  const markRead = async () => {
    const unreadField = role === "buyer" ? "buyer_unread" : "shop_unread";
    if ((role === "buyer" && conversation.buyer_unread > 0) ||
        (role === "shop" && conversation.shop_unread > 0)) {
      await base44.entities.Conversation.update(conversation.id, { [unreadField]: 0 });
    }
  };

  const sendMessage = async () => {
    if (!text.trim()) return;
    setSending(true);
    const otherUnreadField = role === "buyer" ? "shop_unread" : "buyer_unread";
    const currentUnread = role === "buyer"
      ? (conversation.shop_unread || 0)
      : (conversation.buyer_unread || 0);

    await base44.entities.Message.create({
      conversation_id: conversation.id,
      sender_email: currentUser.email,
      sender_name: currentUser.full_name,
      sender_role: role,
      content: text.trim(),
      read: false,
    });

    await base44.entities.Conversation.update(conversation.id, {
      last_message: text.trim().slice(0, 80),
      last_message_date: new Date().toISOString(),
      [otherUnreadField]: currentUnread + 1,
    });

    // Send notification to the other party
    const notifEmail = role === "buyer" ? conversation.shop_owner_email : conversation.buyer_email;
    const notifTitle = role === "buyer"
      ? `New message from ${currentUser.full_name}`
      : `New message from ${conversation.shop_name}`;
    await base44.entities.Notification.create({
      user_email: notifEmail,
      type: "system_alert",
      title: notifTitle,
      message: text.trim().slice(0, 100),
      read: false,
      action_url: `/messages`,
    });

    setText("");
    setSending(false);
    if (onMessageSent) onMessageSent();
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm">
        Select a conversation to start chatting
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
       <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center gap-3">
         <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
           {role === "buyer"
             ? <Store className="w-4 h-4 text-blue-500 dark:text-blue-400" />
             : <User className="w-4 h-4 text-blue-500 dark:text-blue-400" />}
         </div>
         <div>
           <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
             {role === "buyer" ? conversation.shop_name : conversation.buyer_name}
           </p>
           {conversation.subject && (
             <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{conversation.subject}</p>
           )}
         </div>
       </div>

       {/* Messages */}
       <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 dark:bg-slate-900">
        {messages.map((msg) => {
          const isMe = msg.sender_email === currentUser.email;
          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                 isMe
                   ? "bg-blue-600 dark:bg-blue-700 text-white rounded-br-md"
                   : "bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-600 rounded-bl-md"
               }`}>
                <p className="leading-relaxed">{msg.content}</p>
                <p className={`text-[10px] mt-1 ${isMe ? "text-blue-200" : "text-slate-400"}`}>
                  {msg.created_date ? format(new Date(msg.created_date), "h:mm a") : ""}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
          placeholder="Type a message..."
          className="rounded-xl flex-1"
          disabled={sending}
        />
        <Button
          onClick={sendMessage}
          disabled={!text.trim() || sending}
          className="bg-blue-600 hover:bg-blue-700 h-9 w-9 p-0 rounded-xl flex-shrink-0"
          size="icon"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}