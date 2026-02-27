import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { createPageUrl } from "@/utils";

export default function MessageShopButton({ shop }) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [firstMessage, setFirstMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleOpen = async () => {
    const isAuth = await base44.auth.isAuthenticated();
    if (!isAuth) {
      base44.auth.redirectToLogin(window.location.href);
      return;
    }
    setOpen(true);
  };

  const handleSend = async () => {
    if (!firstMessage.trim()) return;
    setSending(true);
    const user = await base44.auth.me();

    // Check for existing conversation
    let convs = await base44.entities.Conversation.filter({
      buyer_email: user.email,
      shop_id: shop.id,
    });

    let conv;
    if (convs.length > 0) {
      conv = convs[0];
      await base44.entities.Conversation.update(conv.id, {
        last_message: firstMessage.trim().slice(0, 80),
        last_message_date: new Date().toISOString(),
        shop_unread: (conv.shop_unread || 0) + 1,
      });
    } else {
      conv = await base44.entities.Conversation.create({
        buyer_email: user.email,
        buyer_name: user.full_name,
        shop_id: shop.id,
        shop_name: shop.name,
        shop_owner_email: shop.owner_email,
        subject: subject.trim() || `Inquiry from ${user.full_name}`,
        last_message: firstMessage.trim().slice(0, 80),
        last_message_date: new Date().toISOString(),
        buyer_unread: 0,
        shop_unread: 1,
      });
    }

    await base44.entities.Message.create({
      conversation_id: conv.id,
      sender_email: user.email,
      sender_name: user.full_name,
      sender_role: "buyer",
      content: firstMessage.trim(),
      read: false,
    });

    // Notify shop owner
    await base44.entities.Notification.create({
      user_email: shop.owner_email,
      type: "system_alert",
      title: `New message from ${user.full_name}`,
      message: firstMessage.trim().slice(0, 100),
      read: false,
      action_url: "/messages",
    });

    toast.success("Message sent! You can view your conversation in Messages.");
    setOpen(false);
    setSubject("");
    setFirstMessage("");
    setSending(false);
  };

  return (
    <>
      <Button onClick={handleOpen} variant="outline" className="gap-2">
        <MessageSquare className="w-4 h-4" /> Message Shop
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send a Message to {shop?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Subject (optional)</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Inquiry about brake pads"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Message *</Label>
              <textarea
                value={firstMessage}
                onChange={(e) => setFirstMessage(e.target.value)}
                placeholder="Type your message here..."
                className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSend} disabled={!firstMessage.trim() || sending} className="bg-blue-600 hover:bg-blue-700">
              {sending ? "Sending..." : "Send Message"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}