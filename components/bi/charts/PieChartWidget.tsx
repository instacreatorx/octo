"use client";

import { BIWidget } from "@/lib/types/bi";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface Props {
  widget: BIWidget;
  data: any[];
}

export function PieChartWidget({ widget, data }: Props) {
  const { nameKey, valueKey, colors = [] } = widget.chart;

  const defaultColors = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          dataKey={valueKey || "value"}
          nameKey={nameKey || "name"}
          cx="50%"
          cy="50%"
          outerRadius={100}
          label={({ name, percent }: any) =>
            `${name}: ${(percent * 100).toFixed(0)}%`
          }
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={
                colors[index] ||
                defaultColors[index % defaultColors.length] ||
                "#0ea5e9"
              }
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--background))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "6px",
          }}
        />
        {widget.options?.showLegend && <Legend />}
      </PieChart>
    </ResponsiveContainer>
  );
}

