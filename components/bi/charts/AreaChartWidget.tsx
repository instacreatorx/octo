"use client";

import { BIWidget } from "@/lib/types/bi";
import {
  AreaChart,
  Area,
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

export function AreaChartWidget({ widget, data }: Props) {
  const { xKey, yKey, yKeys, color, colors } = widget.chart;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              stackId={index === 0 ? "1" : undefined}
              stroke={
                colors?.[index] ||
                color ||
                `hsl(var(--chart-${(index % 5) + 1}))`
              }
              fill={
                colors?.[index] ||
                color ||
                `hsl(var(--chart-${(index % 5) + 1}))`
              }
              fillOpacity={0.6}
            />
          ))
        ) : (
          <Area
            type="monotone"
            dataKey={yKey || yKeys?.[0] || "value"}
            stroke={color || colors?.[0] || "hsl(var(--chart-1))"}
            fill={color || colors?.[0] || "hsl(var(--chart-1))"}
            fillOpacity={0.6}
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
}

