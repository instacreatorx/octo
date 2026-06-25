"use client";

import { MessagePrimitive } from "@assistant-ui/react";
import type { FC } from "react";
import { MarkdownText } from "@/components/assistant-ui/markdown-text";
import { ToolCallGroup } from "@/components/assistant-ui/tool-call-group";
import { ToolFallback } from "@/components/assistant-ui/tool-fallback";

const messageContentComponents = {
  Text: MarkdownText,
  tools: {
    Fallback: ToolFallback,
    ToolGroup: ToolCallGroup,
  },
} as const;

export const AssistantMessageContent: FC = () => {
  return (
    <MessagePrimitive.Unstable_PartsGrouped
      groupingFunction={(parts) => {
        const toolIndices: number[] = [];
        const textIndices: number[] = [];
        const otherIndices: number[] = [];

        parts.forEach((part, index) => {
          if (part?.type === "tool-call") {
            toolIndices.push(index);
            return;
          }
          if (part?.type === "text") {
            textIndices.push(index);
            return;
          }
          otherIndices.push(index);
        });

        const groups = [];
        if (toolIndices.length > 0) {
          groups.push({ groupKey: "__tools__", indices: toolIndices });
        }
        if (textIndices.length > 0) {
          groups.push({ groupKey: "__text__", indices: textIndices });
        }
        if (otherIndices.length > 0) {
          groups.push({ groupKey: undefined, indices: otherIndices });
        }
        return groups;
      }}
      components={messageContentComponents}
    />
  );
};
