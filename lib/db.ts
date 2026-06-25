import { PrismaClient } from '@prisma/client';
import { UIMessage } from 'ai';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function safeParseJson(value: string | null | undefined): unknown {
  if (!value) return undefined;
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

// Chat operations
export async function createChat(userId?: string): Promise<string> {
  const chat = await prisma.chat.create({
    data: {
      title: 'New Chat',
      userId: userId || null,
    },
  });
  return chat.id;
}

export async function loadChat(id: string): Promise<UIMessage[]> {
  const chat = await prisma.chat.findUnique({
    where: { id },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!chat) {
    throw new Error('Chat not found');
  }

  return chat.messages.map((message: any) => {
    const metadata = safeParseJson(message.metadata);
    const storedUIMessage =
      isRecord(metadata) && isRecord(metadata.__uiMessage)
        ? (metadata.__uiMessage as Record<string, unknown>)
        : undefined;

    if (storedUIMessage) {
      const restored = storedUIMessage as unknown as UIMessage;
      return {
        ...restored,
        id: message.id,
        role: (storedUIMessage.role as 'user' | 'assistant') ?? (message.role as 'user' | 'assistant'),
      } as UIMessage;
    }

    const legacyParts =
      isRecord(metadata) && Array.isArray((metadata as { parts?: unknown }).parts)
        ? (metadata as { parts: unknown[] }).parts
        : undefined;

    return {
      id: message.id,
      role: message.role as 'user' | 'assistant',
      parts: legacyParts && legacyParts.length > 0
        ? legacyParts
        : [{ type: 'text', text: message.content ?? '' }],
    } as UIMessage;
  });
}

export async function saveChat(chatId: string, messages: UIMessage[]): Promise<void> {
  // helper to extract plain text from UIMessage (AI SDK v5)
  const getText = (m: any): string => {
    if (m?.parts && Array.isArray(m.parts)) {
      return m.parts
        .filter((p: any) => p?.type === 'text' && typeof p.text === 'string')
        .map((p: any) => p.text)
        .join('');
    }
    // backward compatibility if content exists
    if (typeof m?.content === 'string') return m.content;
    return '';
  };

  // Ensure chat exists, create if it doesn't
  const chatExists = await prisma.chat.findUnique({
    where: { id: chatId },
  });

  if (!chatExists) {
    // Create the chat if it doesn't exist
    await prisma.chat.create({
      data: {
        id: chatId,
        title: 'New Chat',
      },
    });
  }

  // Update chat title based on first user message
  const firstUserMessage = messages.find(m => m.role === 'user');
  if (firstUserMessage) {
    const content = getText(firstUserMessage);
    const title = content.slice(0, 50) + (content.length > 50 ? '...' : '');
    await prisma.chat.update({
      where: { id: chatId },
      data: { title },
    });
  }

  // Save all messages
  for (const message of messages) {
    // guarantee an id for every message (server authority)
    const messageId = (message as any)?.id ?? crypto.randomUUID();
    const messageForStorage = { ...(message as any), id: messageId };
    const parsedMetadata = isRecord(messageForStorage?.metadata)
      ? { ...messageForStorage.metadata }
      : {};
    const metadata = JSON.stringify({
      ...parsedMetadata,
      __uiMessage: messageForStorage,
    });

    await prisma.message.upsert({
      where: { id: messageId },
      update: {
        content: getText(message as any),
        toolCalls: null,
        metadata,
      },
      create: {
        id: messageId,
        role: message.role,
        content: getText(message as any),
        chatId,
        toolCalls: null,
        metadata,
      },
    });
  }
}

export async function listChats(limit: number = 20, offset: number = 0) {
  const [chats, total] = await Promise.all([
    prisma.chat.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { messages: true },
        },
      },
      take: limit,
      skip: offset,
    }),
    prisma.chat.count(),
  ]);

  return { chats, total };
}

export async function deleteChat(id: string): Promise<void> {
  await prisma.chat.delete({
    where: { id },
  });
}

export async function renameChat(id: string, title: string): Promise<void> {
  await prisma.chat.update({
    where: { id },
    data: { title },
  });
}

// BI Dashboard operations
export async function createBIDashboard(userId: string, title: string, config: string): Promise<string> {
  const dashboard = await prisma.bIDashboard.create({
    data: {
      title,
      config,
      userId,
    },
  });
  return dashboard.id;
}

export async function getBIDashboard(id: string) {
  const dashboard = await prisma.bIDashboard.findUnique({
    where: { id },
  });
  if (!dashboard) {
    throw new Error('BI Dashboard not found');
  }
  return dashboard;
}