import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { AlertTriangle, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function LowStockAlerts({ shopId, products }) {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const lowStockItems = products.filter(p => p.stock_quantity <= (p.low_stock_threshold ?? 5));
    setAlerts(lowStockItems);
  }, [products]);

  const dismissAlert = (productId) => {
    setAlerts(alerts.filter(a => a.id !== productId));
  };

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2 mb-6">
      {alerts.map(alert => (
        <Card key={alert.id} className="border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-sm text-amber-900 dark:text-amber-100">{alert.name}</p>
                  <p className="text-xs text-amber-800 dark:text-amber-200 mt-0.5">
                    Stock level: <Badge variant="outline" className="ml-1">{alert.stock_quantity}/{alert.low_stock_threshold ?? 5}</Badge>
                  </p>
                </div>
              </div>
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => dismissAlert(alert.id)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}