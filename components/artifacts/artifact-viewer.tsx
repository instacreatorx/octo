"use client";

import React, { useEffect } from "react";
import { ArtifactIframeRunner } from "./artifact-iframe-runner";
import { cn } from "@/lib/utils";

interface ArtifactViewerProps {
  code: string;
  className?: string;
  onStatusChange?: (status: "loading" | "ready" | "error", message?: string) => void;
  isResizing?: boolean;
}

export const ArtifactViewer: React.FC<ArtifactViewerProps> = ({
  code,
  className,
  onStatusChange,
  isResizing = false,
}) => {
  const hasRelativeImport = /import\s+.+from\s+['"]\./.test(code);

  useEffect(() => {
    if (hasRelativeImport) {
      onStatusChange?.(
        "error",
        "Relative imports are not supported inside artifacts. Please inline your component or reference supported libraries such as React and Recharts.",
      );
    }
    // Don't set loading here - let ArtifactIframeRunner handle status updates
  }, [hasRelativeImport, code, onStatusChange]);

  if (hasRelativeImport) {
    return (
      <div
        className={cn(
          "rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-900",
          className,
        )}
      >
        Relative imports are not supported inside artifacts. Please inline your component or reference
        supported libraries such as React and Recharts.
      </div>
    );
  }

  return (
    <div className={cn("h-full min-h-[200px] w-full", className)}>
      <ArtifactIframeRunner
        code={code}
        onStatusChange={onStatusChange}
        isResizing={isResizing}
      />
    </div>
  );
};

