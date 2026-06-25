"use client";

import {
  MessagePrimitive,
  useMessage,
  useThread,
} from "@assistant-ui/react";
import type { FC } from "react";
import { MarkdownText } from "@/components/assistant-ui/markdown-text";
import { ToolFallback } from "@/components/assistant-ui/tool-fallback";
import { AssistantProviderFallback } from "@/components/assistant-ui/assistant-provider-fallback";
import {
  getProviderErrorFromMetadata,
  hasRealAssistantText,
  isProviderErrorFallbackText,
} from "@/lib/provider-error";
import { useProviderErrorForMessage } from "@/lib/provider-error-context";

function getFallbackTextFromContent(
  content: ReadonlyArray<{ type: string; text?: string }>,
): string | undefined {
  const textPart = content.find((part) => part.type === "text");
  if (!textPart || typeof textPart.text !== "string") return undefined;
  return isProviderErrorFallbackText(textPart.text) ? textPart.text : undefined;
}

export const AssistantMessageBody: FC = () => {
  const message = useMessage();
  const thread = useThread();
  const isRunning = message.status?.type === "running";
  const hasNoRealText = !hasRealAssistantText(message.content);
  const isLastAssistant =
    thread.messages[thread.messages.length - 1]?.id === message.id;
  const metadataError = getProviderErrorFromMetadata(
    (message as { metadata?: unknown }).metadata,
  );

  const providerError = useProviderErrorForMessage(message.id, {
    hasNoRealText,
    isRunning,
    isLastAssistant,
    fallbackText: getFallbackTextFromContent(message.content),
    metadataError,
  });

  const showProviderError = !isRunning && Boolean(providerError);

  return (
    <>
      <MessagePrimitive.Content
        components={{
          Text: MarkdownText,
          tools: { Fallback: ToolFallback },
        }}
      />
      {showProviderError ? (
        <AssistantProviderFallback error={providerError!} />
      ) : null}
    </>
  );
};
