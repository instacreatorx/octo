import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/auth';

export const GET = requireAuth(async (request, user) => {
  return NextResponse.json({
    id: user.id,
    email: user.email,
    role: user.role,
  });
});

