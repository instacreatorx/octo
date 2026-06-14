import { PrismaClient } from '@prisma/client';
import { UIMessage } from 'ai';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

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

  return chat.messages.map((message: any) => ({
    id: message.id,
    role: message.role as 'user' | 'assistant',
    // AI SDK v5 UIMessage expects parts, not content
    parts: [{ type: 'text', text: message.content }],
    toolCalls: message.toolCalls ? JSON.parse(message.toolCalls) : undefined,
    metadata: message.metadata ? JSON.parse(message.metadata) : undefined,
  })) as unknown as UIMessage[];
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

    await prisma.message.upsert({
      where: { id: messageId },
      update: {
        content: getText(message as any),
        toolCalls: 'toolCalls' in message && message.toolCalls ? JSON.stringify(message.toolCalls) : null,
        metadata: 'metadata' in message && message.metadata ? JSON.stringify(message.metadata) : null,
      },
      create: {
        id: messageId,
        role: message.role,
        content: getText(message as any),
        chatId,
        toolCalls: 'toolCalls' in message && message.toolCalls ? JSON.stringify(message.toolCalls) : null,
        metadata: 'metadata' in message && message.metadata ? JSON.stringify(message.metadata) : null,
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