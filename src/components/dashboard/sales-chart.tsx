"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ChartPoint {
  day: string;
  total: number;
}

const formatARS = (value: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);

export function SalesChart({ data }: { data: ChartPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
        <XAxis
          dataKey="day"
          tick={{ fontSize: 11, fill: "#a1a1aa" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#a1a1aa" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) =>
            v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`
          }
          width={46}
        />
        <Tooltip
          formatter={(value) => [formatARS(value as number), "Ventas"]}
          labelStyle={{ fontWeight: 600, color: "#18181b" }}
          contentStyle={{
            fontSize: 13,
            borderRadius: 10,
            border: "1px solid #e4e4e7",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
          cursor={{ fill: "#f4f4f5" }}
        />
        <Bar dataKey="total" fill="#0f766e" radius={[5, 5, 0, 0]} maxBarSize={44} />
      </BarChart>
    </ResponsiveContainer>
  );
}
