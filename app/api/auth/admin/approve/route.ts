import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/auth';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  const handler = requireRole(['ADMIN'])(async (request, user) => {
    try {
      const body = await request.json();
      const { userId } = body;

      if (!userId) {
        return NextResponse.json(
          { error: 'شناسه کاربر الزامی است' },
          { status: 400 }
        );
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { role: 'USER' },
        select: {
          id: true,
          email: true,
          role: true,
        },
      });

      return NextResponse.json({
        message: 'کاربر با موفقیت تأیید شد',
        user: updatedUser,
      });
    } catch (error) {
      console.error('Error approving user:', error);
      return NextResponse.json(
        { error: 'خطا در تأیید کاربر' },
        { status: 500 }
      );
      }
  });

  return handler(request);
}

