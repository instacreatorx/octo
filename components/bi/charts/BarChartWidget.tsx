"use client";

import { BIWidget } from "@/lib/types/bi";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

interface Props {
  widget: BIWidget;
  data: any[];
}

export function BarChartWidget({ widget, data }: Props) {
  const { xKey, yKey, yKeys, color, colors } = widget.chart;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey={xKey}
          className="text-xs"
          tick={{ fill: "currentColor" }}
        />
        <YAxis className="text-xs" tick={{ fill: "currentColor" }} />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--background))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "6px",
          }}
        />
        {widget.options?.showLegend && <Legend />}
        {yKeys && yKeys.length > 0 ? (
          yKeys.map((key, index) => (
            <Bar
              key={key}
              dataKey={key}
              fill={
                colors?.[index] ||
                color ||
                `hsl(var(--chart-${(index % 5) + 1}))`
              }
              radius={[4, 4, 0, 0]}
            />
          ))
        ) : (
          <Bar
            dataKey={yKey || yKeys?.[0] || "value"}
            fill={color || colors?.[0] || "hsl(var(--chart-1))"}
            radius={[4, 4, 0, 0]}
          />
        )}
      </BarChart>
    </ResponsiveContainer>
  );
}

