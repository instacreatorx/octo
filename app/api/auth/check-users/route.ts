import { NextResponse } from 'next/server';
import { hasAnyUsers } from '@/lib/auth/admin';

export async function GET() {
  try {
    const hasUsers = await hasAnyUsers();
    return NextResponse.json({ hasUsers });
  } catch (error) {
    console.error('Error checking users:', error);
    return NextResponse.json({ hasUsers: true }, { status: 500 });
  }
}


