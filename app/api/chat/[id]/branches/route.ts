import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/auth";
import { prisma } from "@/lib/db";
import {
  appendChatBranchMessage,
  loadImportableBranchState,
  saveChatBranchState,
} from "@/lib/chat-repository";
import type { UIMessage } from "ai";

function getChatIdFromRequest(request: NextRequest): string | null {
  const segments = new URL(request.url).pathname.split("/");
  const branchesIndex = segments.indexOf("branches");
  if (branchesIndex <= 0) return null;
  return segments[branchesIndex - 1] || null;
}

async function verifyChatAccess(chatId: string, userId: string) {
  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    select: { userId: true },
  });

  if (!chat) {
    return { error: NextResponse.json({ error: "Chat not found" }, { status: 404 }) };
  }

  if (chat.userId && chat.userId !== userId) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { chat };
}

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const chatId = getChatIdFromRequest(request);
  if (!chatId) {
    return NextResponse.json({ error: "chatId is required" }, { status: 400 });
  }

  const access = await verifyChatAccess(chatId, user.id);
  if (access.error) return access.error;

  const state = await loadImportableBranchState(chatId);
  if (state.messages.length === 0) {
    return NextResponse.json({ messages: [], headId: null });
  }

  return NextResponse.json(state);
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const chatId = getChatIdFromRequest(request);
  if (!chatId) {
    return NextResponse.json({ error: "chatId is required" }, { status: 400 });
  }

  const access = await verifyChatAccess(chatId, user.id);
  if (access.error) return access.error;

  const body = await request.json();
  const parentId = (body?.parentId ?? null) as string | null;
  const message = body?.message as UIMessage | undefined;
  const headId = (body?.headId ?? message?.id ?? null) as string | null;

  if (!message?.id) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  const state = await appendChatBranchMessage(chatId, { parentId, message });
  const importable = await loadImportableBranchState(chatId);
  if (headId && importable.messages.some((entry) => entry.message.id === headId)) {
    await saveChatBranchState(chatId, { ...importable, headId });
    return NextResponse.json({ ...importable, headId });
  }

  return NextResponse.json(state);
}

export async function PATCH(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const chatId = getChatIdFromRequest(request);
  if (!chatId) {
    return NextResponse.json({ error: "chatId is required" }, { status: 400 });
  }

  const access = await verifyChatAccess(chatId, user.id);
  if (access.error) return access.error;

  const body = await request.json();
  const headId = (body?.headId ?? null) as string | null;
  const importable = await loadImportableBranchState(chatId);

  if (importable.messages.length === 0) {
    return NextResponse.json({ error: "No branch state" }, { status: 404 });
  }

  if (!headId || !importable.messages.some((entry) => entry.message.id === headId)) {
    return NextResponse.json({ error: "Invalid headId" }, { status: 400 });
  }

  await saveChatBranchState(chatId, { ...importable, headId });
  return NextResponse.json({ ok: true });
}
