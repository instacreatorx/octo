"use client";

import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Area,
  AreaChart,
  Pie,
  PieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Config, Result } from "@/lib/types";

function toTitleCase(str: string): string {
  return str
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Chart colors will use CSS variables defined in globals.css
const getChartColor = (index: number) => {
  const colorIndex = (index % 5) + 1;
  return `var(--chart-${colorIndex})`;
};

export function DynamicChart({
  chartData,
  chartConfig,
}: {
  chartData: Result[];
  chartConfig: Config;
}) {
  if (!chartData || !chartConfig) {
    return <div>No chart data</div>;
  }

  // Parse numeric values
  const parsedChartData = chartData.map((item) => {
    const parsedItem: { [key: string]: any } = {};
    for (const [key, value] of Object.entries(item)) {
      parsedItem[key] = isNaN(Number(value)) ? value : Number(value);
    }
    return parsedItem;
  });

  const processChartData = (data: Result[], chartType: string) => {
    if (chartType === "bar" || chartType === "pie") {
      if (data.length <= 20) {
        return data;
      }
      return data.slice(0, 20);
    }
    return data;
  };

  const processedData = processChartData(parsedChartData, chartConfig.type);

  const renderChart = () => {
    switch (chartConfig.type) {
      case "bar":
        return (
          <BarChart data={processedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey={chartConfig.xKey}
              className="text-xs"
              tick={{ fill: "currentColor" }}
            />
            <YAxis 
              className="text-xs" 
              tick={{ fill: "currentColor" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
              }}
            />
            {chartConfig.legend && <Legend />}
            {chartConfig.yKeys.map((key, index) => (
              <Bar
                key={key}
                dataKey={key}
                fill={chartConfig.colors?.[key] || getChartColor(index)}
              />
            ))}
          </BarChart>
        );
      case "line":
        return (
          <LineChart data={processedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey={chartConfig.xKey}
              className="text-xs"
              tick={{ fill: "currentColor" }}
            />
            <YAxis 
              className="text-xs" 
              tick={{ fill: "currentColor" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
              }}
            />
            {chartConfig.legend && <Legend />}
            {chartConfig.yKeys.map((key, index) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={chartConfig.colors?.[key] || getChartColor(index)}
                strokeWidth={2}
              />
            ))}
          </LineChart>
        );
      case "area":
        return (
          <AreaChart data={processedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey={chartConfig.xKey}
              className="text-xs"
              tick={{ fill: "currentColor" }}
            />
            <YAxis 
              className="text-xs" 
              tick={{ fill: "currentColor" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
              }}
            />
            {chartConfig.legend && <Legend />}
            {chartConfig.yKeys.map((key, index) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                fill={chartConfig.colors?.[key] || getChartColor(index)}
                stroke={chartConfig.colors?.[key] || getChartColor(index)}
              />
            ))}
          </AreaChart>
        );
      case "pie":
        return (
          <PieChart>
            <Pie
              data={processedData}
              dataKey={chartConfig.yKeys[0]}
              nameKey={chartConfig.xKey}
              cx="50%"
              cy="50%"
              outerRadius={120}
              label
            >
              {processedData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getChartColor(index)}
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
            {chartConfig.legend && <Legend />}
          </PieChart>
        );
      default:
        return <div>Unsupported chart type: {chartConfig.type}</div>;
    }
  };

  return (
    <div className="w-full flex flex-col justify-center items-center">
      <h2 className="text-lg font-bold mb-4">{chartConfig.title}</h2>
      {chartConfig && processedData.length > 0 && (
        <ResponsiveContainer width="100%" height={320}>
          {renderChart()}
        </ResponsiveContainer>
      )}
      <div className="w-full mt-6">
        <p className="text-sm text-muted-foreground">{chartConfig.description}</p>
        <p className="text-sm font-medium mt-2">{chartConfig.takeaway}</p>
      </div>
    </div>
  );
}

