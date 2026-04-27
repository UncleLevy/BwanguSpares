import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { X, Send, MessageCircle, Loader2, Package, Store, MapPin, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

export default function PartsFinderBot() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeConversation = async () => {
    try {
      const conv = await base44.agents.createConversation({
        agent_name: "PartsFinder",
        metadata: {
          name: "Parts Search",
          description: "User searching for automotive parts",
        },
      });
      setConversationId(conv.id);
    } catch (error) {
      console.error("Failed to initialize conversation:", error);
    }
  };

  useEffect(() => {
    if (open && !conversationId) {
      initializeConversation();
    }
  }, [open, conversationId]);

  const handleSendMessage = async () => {
    if (!input.trim() || !conversationId) return;

    const userMessage = input;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const conversation = await base44.agents.getConversation(conversationId);
      
      await base44.agents.addMessage(conversation, {
        role: "user",
        content: userMessage,
      });

      // Subscribe to real-time updates to get the bot response
      const unsubscribe = base44.agents.subscribeToConversation(conversationId, (data) => {
        const botMessages = data.messages.filter((m) => m.role === "assistant");
        if (botMessages.length > messages.filter((m) => m.role === "assistant").length) {
          const newBotMessage = botMessages[botMessages.length - 1];
          setMessages((prev) => [
            ...prev.filter((m) => m.role !== "assistant" || m.content !== ""),
            { role: "assistant", content: newBotMessage.content },
          ]);
        }
      });

      setTimeout(() => {
        unsubscribe();
        setLoading(false);
      }, 5000);
    } catch (error) {
      console.error("Failed to send message:", error);
      setLoading(false);
    }
  };

  const quickQuestions = [
    "Find engine parts under K2000",
    "Nearest shops in Lusaka",
    "Cheapest brake pads available",
    "Toyota Corolla compatible parts",
  ];

  return (
    <>
      {/* Floating Bot Button */}
      <motion.button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg hover:shadow-xl transition-all active:scale-95"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <MessageCircle className="w-6 h-6 mx-auto" />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="fixed bottom-24 right-6 z-50 w-96 max-h-[600px] rounded-2xl shadow-2xl overflow-hidden"
          >
            <Card className="h-full flex flex-col bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-bold">PartsFinder Bot</h3>
                  <p className="text-xs text-blue-100">Search for parts & shops</p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 dark:bg-slate-800/50">
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                      Hi! I'm PartsFinder. Ask me anything about parts, shops, or prices.
                    </p>
                    <div className="space-y-2">
                      {quickQuestions.map((q, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setInput(q);
                            setMessages([{ role: "user", content: q }]);
                          }}
                          className="w-full text-left text-xs p-2 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-600 transition-colors"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {msg.role === "user" ? (
                        <div className="bg-blue-600 text-white rounded-lg p-3 text-sm rounded-br-none max-w-xs">
                          {msg.content}
                        </div>
                      ) : (
                        <div className="max-w-sm space-y-2">
                          {msg.content && typeof msg.content === "string" && (
                            <div className="bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50 border border-slate-200 dark:border-slate-600 rounded-lg p-3 text-sm rounded-bl-none">
                              {msg.content}
                            </div>
                          )}
                          {msg.items && Array.isArray(msg.items) && (
                            <div className="space-y-2">
                              {msg.items.map((item, idx) => (
                                <div key={idx}>
                                  {item.type === "product" && (
                                    <button
                                      onClick={() => {
                                        navigate(createPageUrl("ProductDetail") + `?id=${item.id}`);
                                        setOpen(false);
                                      }}
                                      className="w-full text-left bg-white dark:bg-slate-700 rounded-lg p-3 border border-slate-200 dark:border-slate-600 hover:shadow-md transition-all"
                                    >
                                      <div className="flex gap-3">
                                        {item.image_url && (
                                          <img src={item.image_url} alt={item.name} className="w-12 h-12 rounded object-cover flex-shrink-0" />
                                        )}
                                        <div className="flex-1 min-w-0">
                                          <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">{item.name}</p>
                                          <p className="text-xs text-slate-500 dark:text-slate-400">{item.shop_name}</p>
                                          <div className="flex items-center gap-2 mt-1">
                                            <span className="font-bold text-blue-600 text-sm">K{item.price?.toLocaleString()}</span>
                                            {item.stock !== undefined && (
                                              <Badge variant="outline" className={`text-[10px] ${item.stock > 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                                                {item.stock > 0 ? `${item.stock} in stock` : "Out of stock"}
                                              </Badge>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </button>
                                  )}
                                  {item.type === "shop" && (
                                    <button
                                      onClick={() => {
                                        navigate(createPageUrl("ShopProfile") + `?id=${item.id}`);
                                        setOpen(false);
                                      }}
                                      className="w-full text-left bg-white dark:bg-slate-700 rounded-lg p-3 border border-slate-200 dark:border-slate-600 hover:shadow-md transition-all"
                                    >
                                      <div className="flex gap-3">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                                          <Store className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">{item.name}</p>
                                          {item.region && (
                                            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                              <MapPin className="w-3 h-3" /> {item.region}
                                            </p>
                                          )}
                                          {item.distance && (
                                            <p className="text-xs text-blue-600 font-medium mt-1">{item.distance} away</p>
                                          )}
                                        </div>
                                      </div>
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50 rounded-lg p-3 rounded-bl-none flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Thinking...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t border-slate-200 dark:border-slate-700 p-3 bg-white dark:bg-slate-900">
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder="Ask something..."
                    className="text-sm"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!input.trim() || loading}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 gap-1"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}