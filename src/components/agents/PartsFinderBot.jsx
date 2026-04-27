import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { X, Send, Settings, Loader2, Package, Store, MapPin, DollarSign, Sparkles } from "lucide-react";
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
      let receivedResponse = false;
      const unsubscribe = base44.agents.subscribeToConversation(conversationId, (data) => {
        const botMessages = data.messages.filter((m) => m.role === "assistant");
        if (botMessages.length > messages.filter((m) => m.role === "assistant").length) {
          const newBotMessage = botMessages[botMessages.length - 1];
          const msgData = { role: "assistant", content: newBotMessage.content };
          
          // Parse items from bot message if present (products/shops formatted as JSON)
          if (newBotMessage.content && typeof newBotMessage.content === "string") {
            try {
              const parsed = JSON.parse(newBotMessage.content);
              if (parsed.items) msgData.items = parsed.items;
              if (parsed.text) msgData.content = parsed.text;
            } catch {
              // Not JSON, treat as plain text
            }
          }
          
          setMessages((prev) => [
            ...prev.filter((m) => m.role !== "assistant" || m.content !== ""),
            msgData,
          ]);
          receivedResponse = true;
          unsubscribe();
          setLoading(false);
        }
      });

      // Timeout fallback (10 seconds max)
      const timeout = setTimeout(() => {
        if (!receivedResponse) {
          unsubscribe();
          setLoading(false);
        }
      }, 10000);

      // Cleanup timeout if response arrives early
      return () => clearTimeout(timeout);
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
        className="fixed bottom-32 right-6 z-[100] w-14 h-14 rounded-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl hover:shadow-2xl transition-all active:scale-95 border border-slate-700 group relative overflow-hidden"
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.92 }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
        <Settings className="w-6 h-6 mx-auto relative z-10 group-hover:rotate-180 transition-transform duration-500" />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="fixed bottom-24 right-6 z-50 w-96 max-h-[600px] rounded-2xl shadow-2xl overflow-hidden"
          >
            <Card className="h-full flex flex-col bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 border border-slate-200 dark:border-slate-700">
              {/* Header */}
              <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">PartsFinder</h3>
                    <p className="text-xs text-slate-300">AI Parts Assistant</p>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 hover:bg-slate-700/50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center mx-auto mb-3">
                      <Sparkles className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">
                      Welcome to PartsFinder AI
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                      Ask about parts, shops, prices, or locations.
                    </p>
                    <div className="space-y-2">
                      {quickQuestions.map((q, i) => (
                        <motion.button
                          key={i}
                          whileHover={{ scale: 1.02, translateX: 4 }}
                          onClick={() => {
                            setInput(q);
                            setMessages([{ role: "user", content: q }]);
                          }}
                          className="w-full text-left text-xs p-3 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:shadow-md border border-slate-200 dark:border-slate-700 transition-all"
                        >
                          {q}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                ) : (
                  messages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {msg.role === "user" ? (
                        <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl p-3 text-sm rounded-br-none max-w-xs shadow-md">
                          {msg.content}
                        </div>
                      ) : (
                        <div className="max-w-sm space-y-2">
                          {msg.content && typeof msg.content === "string" && (
                            <div className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-sm rounded-bl-none shadow-sm">
                              {msg.content}
                            </div>
                          )}
                          {msg.items && Array.isArray(msg.items) && (
                            <div className="space-y-2">
                              {msg.items.map((item, idx) => (
                                <motion.div
                                  key={idx}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: idx * 0.1 }}
                                >
                                  {item.type === "product" && (
                                    <button
                                      onClick={() => {
                                        navigate(createPageUrl("ProductDetail") + `?id=${item.id}`);
                                        setOpen(false);
                                      }}
                                      className="w-full text-left bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all active:scale-95"
                                    >
                                      <div className="flex gap-3">
                                        {item.image_url && (
                                          <img src={item.image_url} alt={item.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                                        )}
                                        <div className="flex-1 min-w-0">
                                          <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">{item.name}</p>
                                          <p className="text-xs text-slate-500 dark:text-slate-400">{item.shop_name}</p>
                                          <div className="flex items-center gap-2 mt-1">
                                            <span className="font-bold text-blue-600 dark:text-blue-400 text-sm">K{item.price?.toLocaleString()}</span>
                                            {item.stock !== undefined && (
                                              <Badge className={`text-[10px] font-medium ${item.stock > 0 ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400" : "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400"}`}>
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
                                      className="w-full text-left bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all active:scale-95"
                                    >
                                      <div className="flex gap-3">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-md">
                                          <Store className="w-5 h-5 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">{item.name}</p>
                                          {item.region && (
                                            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                              <MapPin className="w-3 h-3" /> {item.region}
                                            </p>
                                          )}
                                          {item.distance && (
                                            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1">{item.distance} away</p>
                                          )}
                                        </div>
                                      </div>
                                    </button>
                                  )}
                                </motion.div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  ))
                )}
                {loading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 rounded-2xl p-3 rounded-bl-none flex items-center gap-2 shadow-sm border border-slate-200 dark:border-slate-700">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      <span className="text-sm font-medium">Searching...</span>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900">
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder="Search parts, shops, prices..."
                    className="text-sm border-slate-300 dark:border-slate-600 rounded-xl focus-visible:ring-blue-500"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!input.trim() || loading}
                    size="sm"
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 gap-1 rounded-xl"
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