import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyPassword } from '@/lib/auth/password';
import { generateToken } from '@/lib/auth/token';
import { isInitialAdminLogin, createInitialAdmin } from '@/lib/auth/admin';

function withAuthCookie(token: string, body: any) {
  const res = NextResponse.json(body);
  res.headers.set(
    'Set-Cookie',
    `auth_token=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}; Secure`
  );
  return res;
}

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

    // Check if this is initial admin login (no users exist)
    const isInitialAdmin = await isInitialAdminLogin(email, password);
    
    if (isInitialAdmin) {
      // Create the initial admin user
      await createInitialAdmin(email, password);
      
      // Fetch the created user
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return NextResponse.json(
          { error: 'خطا در ایجاد مدیر اولیه' },
          { status: 500 }
        );
      }

      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      return withAuthCookie(token, {
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      });
    }

    // Regular login flow
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'ایمیل یا رمز عبور اشتباه است' },
        { status: 401 }
      );
    }

    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'ایمیل یا رمز عبور اشتباه است' },
        { status: 401 }
      );
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return withAuthCookie(token, {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'خطا در ورود' },
      { status: 500 }
    );
  }
}

