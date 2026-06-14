import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/auth';
import { prisma } from '@/lib/db';

export const GET = requireRole(['ADMIN'])(async (request, user) => {
  try {
    const pendingUsers = await prisma.user.findMany({
      where: { role: 'PENDING' },
      select: {
        id: true,
        email: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ users: pendingUsers });
  } catch (error) {
    console.error('Error fetching pending users:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت لیست کاربران در انتظار' },
      { status: 500 }
    );
  }
});

