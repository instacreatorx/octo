import type { UIMessage } from "ai";
import { loadChat, prisma } from "@/lib/db";

export type StoredBranchMessage = {
  parentId: string | null;
  message: UIMessage;
};

export type StoredBranchState = {
  headId: string | null;
  messages: StoredBranchMessage[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseBranchState(raw: string | null | undefined): StoredBranchState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isRecord(parsed) || !Array.isArray(parsed.messages)) return null;
    return {
      headId: typeof parsed.headId === "string" ? parsed.headId : null,
      messages: parsed.messages as StoredBranchMessage[],
    };
  } catch {
    return null;
  }
}

function sortEntriesForImport(
  entries: StoredBranchMessage[],
): StoredBranchMessage[] {
  const byId = new Map(
    entries
      .filter((entry) => typeof entry.message?.id === "string")
      .map((entry) => [entry.message.id, entry]),
  );
  const sorted: StoredBranchMessage[] = [];
  const added = new Set<string>();

  const visit = (entry: StoredBranchMessage) => {
    const id = entry.message.id;
    if (!id || added.has(id)) return;

    if (entry.parentId && !added.has(entry.parentId)) {
      const parent = byId.get(entry.parentId);
      if (parent) visit(parent);
    }

    sorted.push(entry);
    added.add(id);
  };

  for (const entry of entries) {
    visit(entry);
  }

  return sorted;
}

export function buildImportableBranchState(
  linearMessages: UIMessage[],
  branchState: StoredBranchState | null,
): StoredBranchState {
  const entriesById = new Map<string, StoredBranchMessage>();

  for (let i = 0; i < linearMessages.length; i++) {
    const message = linearMessages[i];
    if (!message?.id) continue;
    entriesById.set(message.id, {
      parentId: i > 0 ? (linearMessages[i - 1]?.id ?? null) : null,
      message,
    });
  }

  for (const entry of branchState?.messages ?? []) {
    const id = entry.message?.id;
    if (!id || entriesById.has(id)) continue;
    entriesById.set(id, entry);
  }

  let removedOrphans = true;
  while (removedOrphans) {
    removedOrphans = false;
    for (const [id, entry] of entriesById) {
      if (entry.parentId && !entriesById.has(entry.parentId)) {
        entriesById.delete(id);
        removedOrphans = true;
      }
    }
  }

  const messages = sortEntriesForImport([...entriesById.values()]);

  const knownIds = new Set(messages.map((entry) => entry.message.id));
  let headId = branchState?.headId ?? linearMessages.at(-1)?.id ?? null;
  if (!headId || !knownIds.has(headId)) {
    headId = linearMessages.at(-1)?.id ?? messages.at(-1)?.message.id ?? null;
  }

  return { headId, messages };
}

function hasRegenerateBranches(state: StoredBranchState): boolean {
  const assistantsByParent = new Map<string, number>();
  for (const { parentId, message } of state.messages) {
    if (message.role !== "assistant" || !parentId) continue;
    assistantsByParent.set(
      parentId,
      (assistantsByParent.get(parentId) ?? 0) + 1,
    );
  }
  return [...assistantsByParent.values()].some((count) => count > 1);
}

export async function loadChatBranchState(
  chatId: string,
): Promise<StoredBranchState | null> {
  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    select: { branchState: true },
  });
  return parseBranchState(chat?.branchState ?? null);
}

export async function loadImportableBranchState(
  chatId: string,
): Promise<StoredBranchState> {
  const [linearMessages, branchState] = await Promise.all([
    loadChat(chatId),
    loadChatBranchState(chatId),
  ]);
  const built = buildImportableBranchState(linearMessages, branchState);

  if (!hasRegenerateBranches(built)) {
    if (branchState?.messages?.length) {
      await saveChatBranchState(chatId, { headId: null, messages: [] });
    }
    return { headId: null, messages: [] };
  }

  await saveChatBranchState(chatId, built);
  return built;
}

export async function saveChatBranchState(
  chatId: string,
  state: StoredBranchState,
): Promise<void> {
  await prisma.chat.update({
    where: { id: chatId },
    data: {
      branchState: JSON.stringify(state),
    },
  });
}

export async function appendChatBranchMessage(
  chatId: string,
  item: StoredBranchMessage,
): Promise<StoredBranchState> {
  const [linearMessages, current] = await Promise.all([
    loadChat(chatId),
    loadChatBranchState(chatId),
  ]);

  const mergedMessages = [
    ...(current?.messages ?? []).filter(
      (entry) => entry.message.id !== item.message.id,
    ),
    item,
  ];

  const built = buildImportableBranchState(linearMessages, {
    headId: item.message.id,
    messages: mergedMessages,
  });

  await saveChatBranchState(chatId, built);
  return built;
}
