import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth/auth';

export const GET = requireAuth(async (request, user) => {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return Response.json({ results: [] });
  }

  try {
    // Search in chat titles (SQLite doesn't support case-insensitive search natively)
    // Filter by userId
    const titleResults = await prisma.chat.findMany({
      where: {
        userId: user.id,
        title: {
          contains: query,
        },
      },
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    });

    // Search in message content (only in user's chats)
    const messageResults = await prisma.message.findMany({
      where: {
        content: {
          contains: query,
        },
        chat: {
          userId: user.id,
        },
      },
      include: {
        chat: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Combine and deduplicate results
    const allResults = [...titleResults, ...messageResults.map(m => m.chat)];
    const uniqueResults = allResults.filter((chat, index, self) => 
      index === self.findIndex(c => c.id === chat.id)
    );

    // Format results
    const results = uniqueResults.map(chat => ({
      id: chat.id,
      title: chat.title || 'Untitled Chat',
      excerpt: (chat as any).messages?.[0]?.content?.slice(0, 100) + '...' || 'No messages',
      updatedAt: chat.updatedAt,
    }));

    return Response.json({ results });
  } catch (error) {
    console.error('Search failed:', error);
    return Response.json({ results: [] }, { status: 500 });
  }
});
