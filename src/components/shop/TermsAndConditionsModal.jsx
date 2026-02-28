import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function TermsAndConditionsModal({ open, onOpenChange, onAccept }) {
  const [scrolledToBottom, setScrolledToBottom] = useState(false);

  const handleScroll = (e) => {
    const element = e.target;
    const isAtBottom = element.scrollHeight - element.scrollTop < element.clientHeight + 10;
    setScrolledToBottom(isAtBottom);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-96">
        <DialogHeader>
          <DialogTitle>Terms and Conditions</DialogTitle>
        </DialogHeader>
        <ScrollArea onScroll={handleScroll} className="h-64 pr-4">
          <div className="text-sm text-slate-600 space-y-4">
            <section>
              <h3 className="font-semibold text-slate-900 mb-2">1. Shop Registration</h3>
              <p>By registering your shop on Bwangu Spares, you agree to comply with all applicable laws and regulations in Zambia. You are responsible for maintaining accurate business information.</p>
            </section>

            <section>
              <h3 className="font-semibold text-slate-900 mb-2">2. Business Compliance</h3>
              <p>You must provide valid business registration and tax identification documents. False or misleading information may result in account suspension or permanent ban.</p>
            </section>

            <section>
              <h3 className="font-semibold text-slate-900 mb-2">3. Product Quality</h3>
              <p>All auto spare parts offered must be genuine or clearly marked as used/refurbished. You agree to maintain quality standards and respond to customer inquiries promptly.</p>
            </section>

            <section>
              <h3 className="font-semibold text-slate-900 mb-2">4. Prohibited Activities</h3>
              <p>You agree not to engage in fraudulent activities, sell counterfeit parts, misrepresent products, or engage in harassment or spam. Violation of these terms will result in immediate action.</p>
            </section>

            <section>
              <h3 className="font-semibold text-slate-900 mb-2">5. Payment and Transactions</h3>
              <p>Bwangu Spares facilitates transactions between buyers and sellers. We are not responsible for direct disputes but provide resolution mechanisms to protect both parties.</p>
            </section>

            <section>
              <h3 className="font-semibold text-slate-900 mb-2">6. Liability Limitation</h3>
              <p>Bwangu Spares is provided "as-is" without warranties. We are not liable for indirect, incidental, or consequential damages arising from platform use.</p>
            </section>

            <section>
              <h3 className="font-semibold text-slate-900 mb-2">7. Changes and Termination</h3>
              <p>We reserve the right to modify these terms or terminate service at any time. You will be notified of significant changes via email.</p>
            </section>

            <section>
              <h3 className="font-semibold text-slate-900 mb-2">8. Governing Law</h3>
              <p>These terms are governed by the laws of the Republic of Zambia and disputes shall be resolved in Zambian courts.</p>
            </section>
          </div>
        </ScrollArea>

        <div className="flex gap-3 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Decline
          </Button>
          <Button onClick={onAccept} disabled={!scrolledToBottom} className="flex-1 bg-blue-600 hover:bg-blue-700">
            I Agree
          </Button>
        </div>
        {!scrolledToBottom && <p className="text-xs text-slate-400 text-center">Please scroll to the bottom to accept</p>}
      </DialogContent>
    </Dialog>
  );
}