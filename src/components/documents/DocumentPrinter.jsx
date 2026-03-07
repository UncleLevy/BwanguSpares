import React from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Printer, Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { createPageUrl } from "@/utils";
import { useState, useMemo } from "react";

const DOC_TYPES = [
  { value: "invoice", label: "Invoice" },
  { value: "receipt", label: "Receipt" },
  { value: "quotation", label: "Quotation" },
];

function DocumentView({ type, shop, order, partsRequest, docNumber, isPrint = false }) {
  const date = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
  const isOrder = !!order;

  const clientName = isOrder ? (order.buyer_name || order.buyer_email) : (partsRequest?.buyer_name || partsRequest?.buyer_email);
  const clientPhone = isOrder ? order.delivery_phone : partsRequest?.buyer_phone;
  const clientRegion = isOrder ? order.delivery_address : partsRequest?.buyer_region;

  const typeLabels = { invoice: "Invoice", receipt: "Receipt", quotation: "Quotation" };
  const typeColors = { invoice: "#0891b2", receipt: "#059669", quotation: "#d97706" };
  const typeEmojis = { invoice: "📋", receipt: "🧾", quotation: "💬" };
  const color = typeColors[type];

  const items = isOrder
     ? (order.items || [])
     : [{ product_name: partsRequest?.part_name, quantity: 1, price: partsRequest?.budget || 0 }];

  const getProductUrl = (item) => {
    if (!item.product_id) return null;
    const base = window.location.origin;
    return `${base}${createPageUrl("ProductDetail")}?id=${item.product_id}`;
  };

   const total = items.reduce((s, i) => s + (i.price || 0) * (i.quantity || 1), 0);
   const subtotal = type !== "quotation" ? Math.round((total / 1.16) * 100) / 100 : total;
   const vat = type !== "quotation" ? Math.round((total - subtotal) * 100) / 100 : 0;

  return (
    <div id="printable-document" style={{ fontFamily: "'Segoe UI', Arial, sans-serif", padding: "40px", maxWidth: "700px", margin: "0 auto", background: "#fafafa", color: "#333" }}>
      {/* Header - Minimalistic */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "48px", height: "48px", background: color, borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px" }}>
            {typeEmojis[type]}
          </div>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: "600", color: "#1a1a1a", margin: 0 }}>{typeLabels[type]}</h1>
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#888" }}>{docNumber}</p>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: "13px", color: "#666", margin: "0 0 2px" }}>{date}</p>
        </div>
      </div>

      {/* Shop Info - Clean */}
      <div style={{ marginBottom: "36px" }}>
        <p style={{ fontSize: "12px", textTransform: "uppercase", color: "#999", fontWeight: "600", margin: "0 0 6px", letterSpacing: "0.5px" }}>From</p>
        <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1a1a1a", margin: "0 0 4px" }}>{shop?.name}</h2>
        {shop?.address && <p style={{ margin: "1px 0", fontSize: "12px", color: "#666" }}>{shop.address}</p>}
        {shop?.region_name && <p style={{ margin: "1px 0", fontSize: "12px", color: "#666" }}>{shop.region_name}, Zambia</p>}
        {shop?.phone && <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#0891b2", fontWeight: "500" }}>📞 {shop.phone}</p>}
      </div>

      {/* Bill To - Avatar Card */}
      <div style={{ marginBottom: "36px", background: "#f0f9ff", padding: "20px", borderRadius: "12px", border: `1px solid ${color}20` }}>
        <p style={{ fontSize: "11px", textTransform: "uppercase", color: "#666", fontWeight: "600", margin: "0 0 8px", letterSpacing: "0.5px" }}>Bill To</p>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
          <div style={{ width: "40px", height: "40px", background: color, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "600", fontSize: "16px", flexShrink: 0 }}>
            {clientName?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: "600", fontSize: "14px", margin: "0 0 4px", color: "#1a1a1a" }}>{clientName}</p>
            {clientPhone && <p style={{ margin: "2px 0", fontSize: "12px", color: "#666" }}>{clientPhone}</p>}
            {clientRegion && <p style={{ margin: "2px 0", fontSize: "12px", color: "#666" }}>{clientRegion}</p>}
          </div>
        </div>
      </div>

      {/* Items Table - Minimalistic */}
      <div style={{ marginBottom: "32px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${color}` }}>
              <th style={{ padding: "10px 0", textAlign: "left", color: "#666", fontSize: "12px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>Item</th>
              <th style={{ padding: "10px 0", textAlign: "center", color: "#666", fontSize: "12px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", width: "60px" }}>Qty</th>
              <th style={{ padding: "10px 0", textAlign: "right", color: "#666", fontSize: "12px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", width: "100px" }}>Price</th>
              <th style={{ padding: "10px 0", textAlign: "right", color: "#666", fontSize: "12px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", width: "100px" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => {
              const productUrl = getProductUrl(item);
              return (
                <tr key={i} style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <td style={{ padding: "12px 0", fontSize: "13px" }}>
                    {isPrint ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span>{item.product_name || item.name || "Item"}</span>
                        {productUrl && (
                          <div style={{ flexShrink: 0 }}>
                            <QRCodeSVG value={productUrl} size={40} />
                          </div>
                        )}
                      </div>
                    ) : (
                      productUrl ? (
                        <a href={productUrl} style={{ color: color, textDecoration: "none", fontWeight: "500", cursor: "pointer" }}>
                          {item.product_name || item.name || "Item"} →
                        </a>
                      ) : (
                        <span>{item.product_name || item.name || "Item"}</span>
                      )
                    )}
                  </td>
                  <td style={{ padding: "12px 0", textAlign: "center", fontSize: "13px", color: "#666" }}>{item.quantity || 1}</td>
                  <td style={{ padding: "12px 0", textAlign: "right", fontSize: "13px", color: "#666" }}>K{(item.price || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td style={{ padding: "12px 0", textAlign: "right", fontSize: "13px", fontWeight: "600", color: "#1a1a1a" }}>K{((item.price || 0) * (item.quantity || 1)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Totals - Clean Summary */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "32px" }}>
        <div style={{ width: "280px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontSize: "12px", color: "#666" }}>
            <span>Subtotal</span><span>K{subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          {type !== "quotation" && (
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontSize: "12px", color: "#666" }}>
              <span>VAT (16%)</span><span>K{vat.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "14px 16px", background: color, color: "#fff", borderRadius: "10px", fontWeight: "600", fontSize: "16px", marginTop: "12px" }}>
            <span>Total</span><span>K{total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {isOrder && order.notes && (
        <div style={{ marginBottom: "28px", padding: "14px", background: `${color}10`, borderRadius: "10px", borderLeft: `3px solid ${color}` }}>
          <p style={{ fontSize: "11px", textTransform: "uppercase", color: "#666", fontWeight: "600", margin: "0 0 6px", letterSpacing: "0.5px" }}>📝 Notes</p>
          <p style={{ fontSize: "13px", margin: 0, color: "#555", lineHeight: "1.5" }}>{order.notes}</p>
        </div>
      )}
      {!isOrder && partsRequest?.description && (
        <div style={{ marginBottom: "28px", padding: "14px", background: `${color}10`, borderRadius: "10px", borderLeft: `3px solid ${color}` }}>
          <p style={{ fontSize: "11px", textTransform: "uppercase", color: "#666", fontWeight: "600", margin: "0 0 6px", letterSpacing: "0.5px" }}>💬 Request Details</p>
          <p style={{ fontSize: "13px", margin: 0, color: "#555", lineHeight: "1.5" }}>{partsRequest.description}</p>
        </div>
      )}

      {/* Footer */}
      <div style={{ marginTop: "40px", paddingTop: "20px", borderTop: `1px solid #ddd`, textAlign: "center" }}>
        <p style={{ margin: "0 0 4px", fontSize: "12px", color: "#888" }}>Thank you for your business!</p>
        <p style={{ margin: "0", fontSize: "11px", color: "#aaa", fontWeight: "500" }}>BwanguSpares — {shop?.name}</p>
        {type === "quotation" && <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#aaa" }}>📅 Valid for 30 days</p>}
      </div>
    </div>
  );
}

export default function DocumentPrinter({ shop, order, partsRequest, triggerLabel = "Print Document" }) {
  const [open, setOpen] = useState(false);
  const [docType, setDocType] = useState("invoice");
  const [emailDialog, setEmailDialog] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [sending, setSending] = useState(false);

  const docNumber = useMemo(() => {
    const prefix = { invoice: "INV", receipt: "REC", quotation: "QUO" }[docType];
    const id = (order?.id || partsRequest?.id || "").slice(0, 6).toUpperCase();
    return `${prefix}-${id}-${Date.now().toString().slice(-4)}`;
  }, [docType, order?.id, partsRequest?.id]);

  const handleEmailOpen = () => {
    const defaultEmail = order?.buyer_email || partsRequest?.buyer_email || "";
    setEmailTo(defaultEmail);
    setEmailDialog(true);
  };

  const handleSendEmail = async () => {
    if (!emailTo) { toast.error("Please enter an email address"); return; }
    setSending(true);
    await base44.functions.invoke("emailDocument", {
      to: emailTo,
      docType,
      docNumber,
      shop,
      order: order || null,
      partsRequest: partsRequest || null,
    });
    toast.success(`${docType.charAt(0).toUpperCase() + docType.slice(1)} sent to ${emailTo}`);
    setSending(false);
    setEmailDialog(false);
  };

  const handlePrint = () => {
    // Render a print-specific version with QR codes into a hidden div, then print it
    const printId = "printable-document-print";
    let printDiv = document.getElementById(printId);
    if (!printDiv) {
      printDiv = document.createElement("div");
      printDiv.id = printId;
      printDiv.style.display = "none";
      document.body.appendChild(printDiv);
    }

    // We'll grab the QR version from a temp render — use the already-rendered content
    // but swap to the print view by reading the print-version element
    const content = document.getElementById("printable-document-print-view");
    if (!content) return;
    const win = window.open("", "_blank");
    win.document.write(`
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Print - ${docNumber}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; }
            @media print {
              body { margin: 0; padding: 0; }
              @page { margin: 10mm; }
            }
          </style>
        </head>
        <body>${content.outerHTML}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      win.close();
    }, 500);
  };

  return (
    <>
      <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={() => setOpen(true)}>
        <Printer className="w-3.5 h-3.5" /> {triggerLabel}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Printer className="w-5 h-5 text-blue-600" />
              Print Document
              <Select value={docType} onValueChange={setDocType}>
                <SelectTrigger className="w-40 h-8 ml-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOC_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </DialogTitle>
          </DialogHeader>

          {/* Email/link preview (shown in dialog) */}
          <div className="border rounded-xl overflow-hidden shadow-inner bg-white mt-2">
            <DocumentView
              type={docType}
              shop={shop}
              order={order}
              partsRequest={partsRequest}
              docNumber={docNumber}
              isPrint={false}
            />
          </div>
          {/* Print version with QR codes — hidden, used only when printing */}
          <div style={{ display: "none" }}>
            <div id="printable-document-print-view">
              <DocumentView
                type={docType}
                shop={shop}
                order={order}
                partsRequest={partsRequest}
                docNumber={docNumber}
                isPrint={true}
              />
            </div>
          </div>

          <DialogFooter className="mt-4 gap-2 flex-wrap">
            <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
            <Button variant="outline" onClick={handleEmailOpen} className="gap-2 border-blue-200 text-blue-600 hover:bg-blue-50">
              <Mail className="w-4 h-4" /> Email to Client
            </Button>
            <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 gap-2">
              <Printer className="w-4 h-4" /> Print / Save as PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Email Dialog */}
      <Dialog open={emailDialog} onOpenChange={setEmailDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-600" />
              Email {docType.charAt(0).toUpperCase() + docType.slice(1)}
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <p className="text-sm text-slate-500">Send this {docType} to the client by email.</p>
            <div>
              <label className="text-sm font-medium text-slate-700">Recipient Email</label>
              <Input
                className="mt-1"
                type="email"
                placeholder="client@example.com"
                value={emailTo}
                onChange={e => setEmailTo(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialog(false)}>Cancel</Button>
            <Button onClick={handleSendEmail} disabled={sending} className="bg-blue-600 hover:bg-blue-700 gap-2">
              {sending ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</> : <><Mail className="w-4 h-4" /> Send</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}