"use client";

import { useThread } from "@assistant-ui/react";
import { useEffect, type FC } from "react";
import {
  getProviderErrorFromMetadata,
  hasRealAssistantText,
} from "@/lib/provider-error";
import { useProviderErrorStore } from "@/lib/provider-error-context";

export const ProviderErrorSync: FC = () => {
  const thread = useThread();
  const { getError, setError, clearPendingError, version } = useProviderErrorStore();
  void version;

  useEffect(() => {
    const last = thread.messages[thread.messages.length - 1];
    if (!last || last.role !== "assistant") return;

    const metadataError = getProviderErrorFromMetadata(
      (last as { metadata?: unknown }).metadata,
    );
    if (metadataError) {
      setError(last.id, metadataError);
      clearPendingError();
      return;
    }

    const pending = getError("__pending__");
    if (!pending) return;
    if (hasRealAssistantText(last.content)) return;

    setError(last.id, pending);
    clearPendingError();
  }, [thread.messages, thread.isRunning, getError, setError, clearPendingError, version]);

  return null;
};
