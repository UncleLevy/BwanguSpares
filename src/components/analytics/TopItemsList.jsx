import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, TrendingUp } from "lucide-react";

export default function TopItemsList({ items, title, icon: Icon = Package }) {
  return (
    <Card className="border-slate-100 dark:border-slate-700 dark:bg-slate-900">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2 text-slate-900 dark:text-slate-100">
          <Icon className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-8">No data yet</p>
          ) : (
            items.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-sm font-bold text-slate-400 dark:text-slate-500 w-5">#{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{item.name}</p>
                    {item.subtitle && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">{item.subtitle}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-blue-600">{item.value}</p>
                  {item.trend && (
                    <p className="text-xs text-emerald-600 flex items-center gap-0.5">
                      <TrendingUp className="w-3 h-3" /> {item.trend}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}