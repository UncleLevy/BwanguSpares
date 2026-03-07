import React, { useState } from "react";
import { MessageSquare, Store, User, Archive, ArchiveRestore } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";

export default function ConversationList({ conversations, selectedId, onSelect, currentEmail, role, onArchiveToggle }) {
  const [archiving, setArchiving] = useState(null);

  const handleArchive = async (e, conv) => {
    e.stopPropagation();
    setArchiving(conv.id);
    const field = role === "buyer" ? "archived_by_buyer" : "archived_by_shop";
    const isArchived = role === "buyer" ? conv.archived_by_buyer : conv.archived_by_shop;
    await base44.entities.Conversation.update(conv.id, { [field]: !isArchived });
    if (onArchiveToggle) onArchiveToggle(conv.id, !isArchived);
    setArchiving(null);
  };

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16 text-center px-4">
        <MessageSquare className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
        <p className="text-sm text-slate-500 dark:text-slate-400">No conversations yet</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100 dark:divide-slate-700">
      {conversations.map((conv) => {
        const unread = role === "buyer" ? conv.buyer_unread : conv.shop_unread;
        const isSelected = conv.id === selectedId;
        const isArchived = role === "buyer" ? conv.archived_by_buyer : conv.archived_by_shop;
        return (
          <div key={conv.id} className="relative group">
            <button
              onClick={() => onSelect(conv)}
              className={`w-full text-left px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors pr-12 ${isSelected ? "bg-blue-50 dark:bg-blue-900/30 border-l-2 border-blue-500" : ""}`}
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                  {role === "buyer"
                    ? <Store className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                    : <User className="w-4 h-4 text-blue-500 dark:text-blue-400" />}
                </div>
                <div className="flex items-start justify-between gap-2 flex-1 min-w-0">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
                      {role === "buyer" ? conv.shop_name : conv.buyer_name}
                    </p>
                    {conv.subject && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{conv.subject}</p>
                    )}
                    {conv.last_message && (
                      <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">{conv.last_message}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    {conv.last_message_date && (
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">
                        {format(new Date(conv.last_message_date), "MMM d")}
                      </span>
                    )}
                    {unread > 0 && (
                      <Badge className="h-5 min-w-[20px] flex items-center justify-center bg-blue-600 text-white text-[10px] px-1.5">
                        {unread}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </button>
            {/* Archive button — visible on hover */}
            <button
              onClick={(e) => handleArchive(e, conv)}
              disabled={archiving === conv.id}
              title={isArchived ? "Unarchive" : "Archive"}
              className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              {isArchived
                ? <ArchiveRestore className="w-4 h-4" />
                : <Archive className="w-4 h-4" />}
            </button>
          </div>
        );
      })}
    </div>
  );
}