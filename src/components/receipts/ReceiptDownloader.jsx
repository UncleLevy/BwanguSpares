import React from "react";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function ReceiptDownloader({ order, customer }) {
  const handleDownloadReceipt = async () => {
    try {
      const element = document.getElementById(`receipt-${order.id}`);
      if (!element) {
        toast.error("Receipt not found");
        return;
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff"
      });

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", 10, 10, imgWidth, imgHeight);

      pdf.save(`Receipt_${order.id.slice(0, 8)}_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success("Receipt downloaded");
    } catch (error) {
      toast.error("Failed to download receipt");
    }
  };

  return (
    <Button
      onClick={handleDownloadReceipt}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      <Download className="w-4 h-4" /> Receipt
    </Button>
  );
}