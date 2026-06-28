"use client";

import { useThread } from "@assistant-ui/react";
import { useEffect, type FC } from "react";
import { getToken } from "@/lib/auth/client";

export const BranchHeadSync: FC<{ chatId?: string }> = ({ chatId }) => {
  const thread = useThread();
  const headId = thread.messages[thread.messages.length - 1]?.id;

  useEffect(() => {
    if (!chatId || !headId || thread.isRunning) return;

    const token = getToken();
    void fetch(`/api/chat/${chatId}/branches`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ headId }),
    });
  }, [chatId, headId, thread.isRunning]);

  return null;
};
