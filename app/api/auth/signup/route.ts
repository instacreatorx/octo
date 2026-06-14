import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth/password';
import { generateToken } from '@/lib/auth/token';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'ایمیل و رمز عبور الزامی است' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'این ایمیل قبلاً ثبت شده است' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user with PENDING role
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'PENDING',
      },
    });

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const res = NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      message: 'ثبت‌نام موفقیت‌آمیز بود. شما در حالت انتظار هستید تا مدیر شما را تأیید کند.',
    });
    res.headers.set(
      'Set-Cookie',
      `auth_token=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}; Secure`
    );
    return res;
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'خطا در ثبت‌نام' },
      { status: 500 }
    );
  }
}

