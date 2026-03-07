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

  const typeLabels = { invoice: "INVOICE", receipt: "RECEIPT", quotation: "QUOTATION" };
  const typeColors = { invoice: "#1e40af", receipt: "#065f46", quotation: "#92400e" };
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
    <div id="printable-document" style={{ fontFamily: "Arial, sans-serif", padding: "32px", maxWidth: "700px", margin: "0 auto", background: "#fff", color: "#1a1a1a" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px", borderBottom: `3px solid ${color}`, paddingBottom: "20px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: "bold", color: color, margin: 0 }}>{shop?.name}</h1>
          {shop?.address && <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#555" }}>{shop.address}</p>}
          {shop?.region_name && <p style={{ margin: "2px 0 0", fontSize: "13px", color: "#555" }}>{shop.region_name}, Zambia</p>}
          {shop?.phone && <p style={{ margin: "2px 0 0", fontSize: "13px", color: "#555" }}>Tel: {shop.phone}</p>}
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ background: color, color: "#fff", padding: "8px 18px", borderRadius: "6px", fontSize: "18px", fontWeight: "bold", letterSpacing: "1px" }}>
            {typeLabels[type]}
          </div>
          <p style={{ margin: "8px 0 2px", fontSize: "13px", color: "#555" }}>No: <strong>{docNumber}</strong></p>
          <p style={{ margin: "2px 0", fontSize: "13px", color: "#555" }}>Date: {date}</p>
        </div>
      </div>

      {/* Bill To */}
      <div style={{ marginBottom: "28px", background: "#f8f9fa", padding: "16px", borderRadius: "8px" }}>
        <p style={{ fontSize: "11px", textTransform: "uppercase", color: "#999", fontWeight: "bold", margin: "0 0 8px" }}>Bill To</p>
        <p style={{ fontWeight: "bold", fontSize: "15px", margin: "0 0 4px" }}>{clientName}</p>
        {clientPhone && <p style={{ margin: "2px 0", fontSize: "13px", color: "#555" }}>Phone: {clientPhone}</p>}
        {clientRegion && <p style={{ margin: "2px 0", fontSize: "13px", color: "#555" }}>Address: {clientRegion}</p>}
      </div>

      {/* Items Table */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "24px" }}>
        <thead>
          <tr style={{ background: color }}>
            <th style={{ padding: "10px 12px", textAlign: "left", color: "#fff", fontSize: "12px", fontWeight: "bold" }}>Description</th>
            <th style={{ padding: "10px 12px", textAlign: "center", color: "#fff", fontSize: "12px", fontWeight: "bold", width: "80px" }}>Qty</th>
            <th style={{ padding: "10px 12px", textAlign: "right", color: "#fff", fontSize: "12px", fontWeight: "bold", width: "110px" }}>Unit Price</th>
            <th style={{ padding: "10px 12px", textAlign: "right", color: "#fff", fontSize: "12px", fontWeight: "bold", width: "110px" }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => {
            const productUrl = getProductUrl(item);
            return (
              <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#f9fafb" }}>
                <td style={{ padding: "10px 12px", fontSize: "13px", borderBottom: "1px solid #e5e7eb" }}>
                  {isPrint ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span>{item.product_name || item.name || "Item"}</span>
                      {productUrl && (
                        <div style={{ flexShrink: 0 }}>
                          <QRCodeSVG value={productUrl} size={48} />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      {productUrl ? (
                        <a href={productUrl} style={{ color: color, textDecoration: "underline", fontWeight: "500" }}>
                          {item.product_name || item.name || "Item"}
                        </a>
                      ) : (
                        <span>{item.product_name || item.name || "Item"}</span>
                      )}
                      {productUrl && (
                        <div style={{ fontSize: "11px", color: "#888", marginTop: "2px", wordBreak: "break-all" }}>{productUrl}</div>
                      )}
                    </div>
                  )}
                </td>
                <td style={{ padding: "10px 12px", textAlign: "center", fontSize: "13px", borderBottom: "1px solid #e5e7eb" }}>{item.quantity || 1}</td>
                <td style={{ padding: "10px 12px", textAlign: "right", fontSize: "13px", borderBottom: "1px solid #e5e7eb" }}>K{(item.price || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td style={{ padding: "10px 12px", textAlign: "right", fontSize: "13px", borderBottom: "1px solid #e5e7eb" }}>K{((item.price || 0) * (item.quantity || 1)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Totals */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <div style={{ width: "260px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: "13px", color: "#555" }}>
             <span>Subtotal</span><span>K{subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
           </div>
           {type !== "quotation" && (
             <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: "13px", color: "#555" }}>
               <span>VAT (16%)</span><span>K{vat.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
             </div>
           )}
           <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", background: color, color: "#fff", borderRadius: "6px", fontWeight: "bold", fontSize: "15px", marginTop: "8px" }}>
             <span>TOTAL</span><span>K{total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
           </div>
        </div>
      </div>

      {/* Notes */}
      {isOrder && order.notes && (
        <div style={{ marginTop: "24px", padding: "14px", background: "#f8f9fa", borderRadius: "8px", borderLeft: `4px solid ${color}` }}>
          <p style={{ fontSize: "11px", textTransform: "uppercase", color: "#999", fontWeight: "bold", margin: "0 0 6px" }}>Notes</p>
          <p style={{ fontSize: "13px", margin: 0, color: "#555" }}>{order.notes}</p>
        </div>
      )}
      {!isOrder && partsRequest?.description && (
        <div style={{ marginTop: "24px", padding: "14px", background: "#f8f9fa", borderRadius: "8px", borderLeft: `4px solid ${color}` }}>
          <p style={{ fontSize: "11px", textTransform: "uppercase", color: "#999", fontWeight: "bold", margin: "0 0 6px" }}>Client Notes</p>
          <p style={{ fontSize: "13px", margin: 0, color: "#555" }}>{partsRequest.description}</p>
        </div>
      )}

      {/* Footer */}
      <div style={{ marginTop: "40px", paddingTop: "16px", borderTop: "1px solid #e5e7eb", textAlign: "center", fontSize: "11px", color: "#aaa" }}>
        <p style={{ margin: 0 }}>Thank you for your business — {shop?.name}</p>
        {type === "quotation" && <p style={{ margin: "4px 0 0" }}>This quotation is valid for 30 days from the date of issue.</p>}
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