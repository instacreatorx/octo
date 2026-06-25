"use client";

import { AlertTriangleIcon } from "lucide-react";
import type { FC } from "react";

export const AssistantProviderFallback: FC<{
  error: string;
}> = ({ error }) => {
  return (
    <div className="border-destructive/30 bg-destructive/5 text-foreground mb-2 rounded-lg border px-3 py-2 text-sm leading-6">
      <div className="mb-1 flex items-center gap-2 font-medium">
        <AlertTriangleIcon className="text-destructive size-4 shrink-0" />
        AI provider did not return a valid response
      </div>
      <p className="text-muted-foreground whitespace-pre-wrap break-words">{error}</p>
    </div>
  );
};
