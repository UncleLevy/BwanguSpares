import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

function useDark() {
  return typeof document !== "undefined" && document.documentElement.classList.contains("dark");
}

export default function CategoryChart({ data, title = "Top Categories" }) {
  const dark = useDark();
  const grid = dark ? "#334155" : "#e2e8f0";
  const axis = dark ? "#64748b" : "#94a3b8";
  const tickColor = dark ? "#94a3b8" : "#64748b";
  const tooltipBg = dark ? "#1e293b" : "#fff";
  const tooltipBorder = dark ? "#334155" : "#e2e8f0";
  const tooltipText = dark ? "#f1f5f9" : "#0f172a";

  return (
    <Card className="border-slate-100 dark:border-slate-700 dark:bg-slate-900">
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-slate-900 dark:text-slate-100">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={grid} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: tickColor }} stroke={axis} />
            <YAxis tick={{ fontSize: 12, fill: tickColor }} stroke={axis} />
            <Tooltip
              contentStyle={{
                backgroundColor: tooltipBg,
                border: `1px solid ${tooltipBorder}`,
                borderRadius: "8px",
                fontSize: "12px",
                color: tooltipText,
              }}
              labelStyle={{ color: tooltipText }}
            />
            <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}