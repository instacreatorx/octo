import type { UIMessage } from "ai";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function getMessageParts(message: UIMessage): unknown[] {
  const parts = (message as { parts?: unknown[] }).parts;
  return Array.isArray(parts) ? parts : [];
}

function getGenericMessageParts(message: unknown): unknown[] {
  if (!isRecord(message)) return [];

  const fromParts = message.parts;
  if (Array.isArray(fromParts)) return fromParts;

  const fromContent = message.content;
  if (Array.isArray(fromContent)) return fromContent;

  return [];
}

export function sanitizeUIMessages(messages: UIMessage[]): UIMessage[] {
  return messages
    .filter((message): message is UIMessage => message != null)
    .map((message) => {
      const parts = getMessageParts(message).filter((part) => part != null);
      return {
        ...message,
        parts,
      } as UIMessage;
    });
}

export function mergeChatMessages(
  previousMessages: UIMessage[],
  incomingMessages: UIMessage[],
): UIMessage[] {
  if (incomingMessages.length === 0) {
    return previousMessages;
  }

  if (incomingMessages.length >= previousMessages.length) {
    return incomingMessages;
  }

  const knownIds = new Set(
    previousMessages
      .map((message) => message.id)
      .filter((id): id is string => typeof id === "string" && id.length > 0),
  );

  const newMessages = incomingMessages.filter(
    (message) => !message.id || !knownIds.has(message.id),
  );

  return [...previousMessages, ...newMessages];
}

export function messageHasAssistantText(message: unknown): boolean {
  return getGenericMessageParts(message).some((part) => {
    if (!isRecord(part) || part.type !== "text") return false;
    return typeof part.text === "string" && part.text.trim().length > 0;
  });
}
