"use client";

import { useMessage } from "@assistant-ui/react";
import { ChevronRightIcon } from "lucide-react";
import { type FC, type PropsWithChildren, useEffect, useState } from "react";
import { messageHasAssistantText } from "@/lib/messages";
import { cn } from "@/lib/utils";

export const ToolCallGroup: FC<
  PropsWithChildren<{
    startIndex: number;
    endIndex: number;
  }>
> = ({ startIndex, endIndex, children }) => {
  const message = useMessage();
  const isRunning = message.status?.type === "running";
  const hasText = messageHasAssistantText(message);
  const stepCount = endIndex - startIndex + 1;
  const [expanded, setExpanded] = useState(isRunning || !hasText);

  useEffect(() => {
    if (!isRunning && hasText) {
      setExpanded(false);
    }
  }, [hasText, isRunning]);

  if (isRunning || !hasText) {
    return <div className="my-1">{children}</div>;
  }

  return (
    <div className="my-1">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="text-muted-foreground hover:text-foreground hover:bg-muted/60 flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors"
      >
        <ChevronRightIcon
          className={cn(
            "size-3 transition-transform",
            expanded && "rotate-90",
          )}
        />
        <span>
          Worked · {stepCount} step{stepCount === 1 ? "" : "s"}
        </span>
      </button>
      {expanded && <div className="mt-0.5">{children}</div>}
    </div>
  );
};
