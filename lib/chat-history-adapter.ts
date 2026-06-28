"use client";

import type { ThreadHistoryAdapter } from "@assistant-ui/react";
import type { UIMessage } from "ai";
import { getToken } from "@/lib/auth/client";

type BranchStateResponse = {
  headId: string | null;
  messages: Array<{
    parentId: string | null;
    message: UIMessage;
  }>;
};

function isValidBranchState(state: BranchStateResponse): boolean {
  if (!state.messages.length) return false;

  const ids = new Set(
    state.messages
      .map((entry) => entry.message?.id)
      .filter((id): id is string => typeof id === "string" && id.length > 0),
  );

  if (ids.size !== state.messages.length) return false;

  return state.messages.every(
    (entry) => !entry.parentId || ids.has(entry.parentId),
  );
}

async function fetchBranchState(chatId: string): Promise<BranchStateResponse> {
  const token = getToken();
  const response = await fetch(`/api/chat/${chatId}/branches`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) {
    return { messages: [], headId: null };
  }
  return response.json() as Promise<BranchStateResponse>;
}

async function postBranchMessage(
  chatId: string,
  body: {
    parentId: string | null;
    message: UIMessage;
    headId: string | null;
  },
) {
  const token = getToken();
  await fetch(`/api/chat/${chatId}/branches`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
}

export function createChatHistoryAdapter(
  chatId: string | undefined,
): ThreadHistoryAdapter | undefined {
  if (!chatId) return undefined;

  const load = async () => {
    try {
      const state = await fetchBranchState(chatId);
      if (!isValidBranchState(state)) {
        return { messages: [], headId: null };
      }
      return {
        headId: state.headId,
        messages: state.messages.map((entry) => ({
          parentId: entry.parentId,
          message: entry.message as never,
        })),
      };
    } catch {
      return { messages: [], headId: null };
    }
  };

  const append = async (item: {
    parentId: string | null;
    message: unknown;
  }) => {
    const message = item.message as UIMessage;
    if (!message?.id) return;
    await postBranchMessage(chatId, {
      parentId: item.parentId,
      message,
      headId: message.id ?? null,
    });
  };

  return {
    load,
    append,
    withFormat() {
      return { load, append };
    },
  };
}
