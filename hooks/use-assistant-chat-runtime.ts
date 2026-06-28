"use client";

import { useChat } from "@ai-sdk/react";
import {
  unstable_useCloudThreadListAdapter,
  unstable_useRemoteThreadListRuntime,
  useRuntimeAdapters,
} from "@assistant-ui/react";
import type { ThreadHistoryAdapter } from "@assistant-ui/react";
import {
  useAISDKRuntime,
  AssistantChatTransport,
} from "@assistant-ui/react-ai-sdk";
import type { UIMessage } from "ai";
import type { ChatInit } from "ai";
import { useMemo } from "react";
import { createChatHistoryAdapter } from "@/lib/chat-history-adapter";

export type UseAssistantChatRuntimeOptions = ChatInit<UIMessage> & {
  id?: string;
  adapters?: {
    history?: ThreadHistoryAdapter;
  };
};

function useAssistantChatThreadRuntime(
  options: UseAssistantChatRuntimeOptions = {},
) {
  const {
    id,
    adapters: adapterOptions,
    transport: transportOptions,
    ...chatOptions
  } = options;

  const transport = useMemo(
    () => transportOptions ?? new AssistantChatTransport(),
    [transportOptions],
  );

  const contextAdapters = useRuntimeAdapters();
  const historyAdapter = useMemo(
    () => adapterOptions?.history ?? createChatHistoryAdapter(id),
    [adapterOptions?.history, id],
  );

  const chat = useChat({
    ...chatOptions,
    id,
    transport,
  });

  const runtime = useAISDKRuntime(chat, {
    adapters: {
      ...contextAdapters,
      ...adapterOptions,
      history: historyAdapter,
    },
  });

  if (transport instanceof AssistantChatTransport) {
    transport.setRuntime(runtime);
  }

  return runtime;
}

export function useAssistantChatRuntime(
  options: UseAssistantChatRuntimeOptions = {},
) {
  const cloudAdapter = unstable_useCloudThreadListAdapter({ cloud: undefined });
  return unstable_useRemoteThreadListRuntime({
    runtimeHook: function RuntimeHook() {
      return useAssistantChatThreadRuntime(options);
    },
    adapter: cloudAdapter,
  });
}
