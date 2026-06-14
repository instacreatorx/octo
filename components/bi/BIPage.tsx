"use client";

import { BIConfig } from "@/lib/types/bi";
import { WidgetRenderer } from "./WidgetRenderer";
import clsx from "clsx";
import { BIChatInput } from "./BIChatInput";

interface Props {
  config: BIConfig | null;
  onConfigUpdate?: (config: BIConfig) => void;
  loading?: boolean;
}

const colsMap: Record<number, string> = {
  1: "grid-cols-1",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
};

export function BIPage({ config, onConfigUpdate, loading }: Props) {
  if (!config) {
    return (
      <div className="w-full min-h-screen bg-neutral-50 dark:bg-neutral-900 p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Business Intelligence Dashboard</h1>
            <p className="text-muted-foreground">
              Start by asking a question to generate your first dashboard
            </p>
          </div>
          <BIChatInput onConfigGenerated={onConfigUpdate || (() => {})} />
        </div>
      </div>
    );
  }

  const { layout } = config;

  const containerClass = clsx(
    "w-full px-4 py-8",
    layout.centered && "flex justify-center"
  );

  const innerClass = clsx(
    "w-full",
    layout.maxWidth ?? "max-w-7xl"
  );

  const gridCols = colsMap[layout.columns] || colsMap[2];
  const gridClass = clsx(
    "grid",
    layout.gap ?? "gap-6",
    "grid-cols-1",
    gridCols
  );

  return (
    <div className="w-full min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <div className={containerClass}>
        <div className={innerClass}>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">{config.title}</h1>
            </div>
          </div>

          {loading && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Generating dashboard...
              </p>
            </div>
          )}

          <div className={gridClass}>
            {config.widgets.map((widget) => (
              <WidgetRenderer key={widget.id} widget={widget} />
            ))}
          </div>
        </div>
      </div>

      {/* Fixed chat input at bottom right */}
      <div className="fixed bottom-6 right-6 z-50">
        <BIChatInput
          onConfigGenerated={onConfigUpdate || (() => {})}
          currentConfig={config}
          compact
        />
      </div>
    </div>
  );
}

