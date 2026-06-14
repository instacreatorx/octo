import { listChats, deleteChat, renameChat } from '@/lib/db';
import { requireAuth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db';

export const GET = requireAuth(async (request, user) => {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = (page - 1) * limit;

  try {
    // Filter chats by userId
    const [chats, total] = await Promise.all([
      prisma.chat.findMany({
        where: { userId: user.id },
        orderBy: { updatedAt: 'desc' },
        include: {
          _count: {
            select: { messages: true },
          },
        },
        take: limit,
        skip: offset,
      }),
      prisma.chat.count({
        where: { userId: user.id },
      }),
    ]);

    return Response.json({ 
      chats,
      pagination: {
        page,
        limit,
        total,
        hasMore: offset + limit < total
      }
    });
  } catch (error) {
    console.error('Failed to list chats:', error);
    return Response.json({ chats: [] }, { status: 500 });
  }
});

export const DELETE = requireAuth(async (request, user) => {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return new Response('Missing id', { status: 400 });
  
  try {
    // Verify ownership
    const chat = await prisma.chat.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!chat) {
      return new Response('Chat not found', { status: 404 });
    }

    if (chat.userId && chat.userId !== user.id) {
      return new Response('Forbidden', { status: 403 });
    }

    await deleteChat(id);
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Failed to delete chat:', error);
    return new Response('Failed to delete', { status: 500 });
  }
});

export const PATCH = requireAuth(async (request, user) => {
  try {
    const body = await request.json();
    const id = body?.id as string | undefined;
    const title = body?.title as string | undefined;
    if (!id || typeof title !== 'string' || title.trim().length === 0) {
      return new Response('Invalid payload', { status: 400 });
    }

    // Verify ownership
    const chat = await prisma.chat.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!chat) {
      return new Response('Chat not found', { status: 404 });
    }

    if (chat.userId && chat.userId !== user.id) {
      return new Response('Forbidden', { status: 403 });
    }

    await renameChat(id, title.trim());
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Failed to rename chat:', error);
    return new Response('Failed to rename', { status: 500 });
  }
});
