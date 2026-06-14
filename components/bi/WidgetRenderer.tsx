"use client";

import { BIWidget } from "@/lib/types/bi";
import { useEffect, useState } from "react";
import { BarChartWidget } from "./charts/BarChartWidget";
import { PieChartWidget } from "./charts/PieChartWidget";
import { LineChartWidget } from "./charts/LineChartWidget";
import { AreaChartWidget } from "./charts/AreaChartWidget";
import clsx from "clsx";

interface Props {
  widget: BIWidget;
}

export function WidgetRenderer({ widget }: Props) {
  const [data, setData] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        
        // Handle json dataSource type (embedded data)
        if (widget.dataSource.type === "json") {
          setData(widget.dataSource.data);
          setLoading(false);
          return;
        }
        
        // Handle api dataSource type (fetch from URL)
        if (widget.dataSource.type === "api") {
          const res = await fetch(widget.dataSource.url);
          if (!res.ok) {
            throw new Error(`Failed to load data: ${res.statusText}`);
          }
          const json = await res.json();
          setData(json);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load data");
        console.error("Failed to load widget data:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [widget.dataSource]);

  const content = (() => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-[300px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      );
    }
    if (error) {
      return (
        <div className="flex items-center justify-center h-[300px]">
          <div className="text-center text-destructive">
            <p className="text-sm">{error}</p>
          </div>
        </div>
      );
    }
    if (!data || data.length === 0) {
      return (
        <div className="flex items-center justify-center h-[300px]">
          <p className="text-sm text-muted-foreground">No data available</p>
        </div>
      );
    }

    switch (widget.type) {
      case "BarChart":
        return <BarChartWidget widget={widget} data={data} />;
      case "PieChart":
        return <PieChartWidget widget={widget} data={data} />;
      case "LineChart":
        return <LineChartWidget widget={widget} data={data} />;
      case "AreaChart":
        return <AreaChartWidget widget={widget} data={data} />;
      default:
        return (
          <div className="flex items-center justify-center h-[300px]">
            <p className="text-sm text-muted-foreground">
              Unknown chart type: {widget.type}
            </p>
          </div>
        );
    }
  })();

  const inner = (
    <div className="flex flex-col h-full">
      {widget.title && (
        <h2 className="text-lg font-semibold mb-2">{widget.title}</h2>
      )}
      {widget.description && (
        <p className="text-sm text-muted-foreground mb-3">{widget.description}</p>
      )}
      <div className="flex-1">{content}</div>
    </div>
  );

  const widgetClassName = clsx(
    widget.className,
    widget.options?.fullWidth && "col-span-2",
    widget.options?.highlight && "ring-2 ring-indigo-500 rounded-lg"
  );

  if (widget.options?.showCard) {
    return (
      <div
        className={clsx(
          widgetClassName,
          widget.options.cardClassName ??
            "bg-white dark:bg-neutral-800 shadow-sm rounded-xl p-4 border border-border"
        )}
      >
        {inner}
      </div>
    );
  }

  return <div className={widgetClassName}>{inner}</div>;
}

