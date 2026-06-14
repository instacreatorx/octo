import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken, extractTokenFromHeader, TokenPayload } from './token';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

function parseAuthCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(';').map((c) => c.trim());
  for (const c of cookies) {
    if (c.startsWith('auth_token=')) {
      return decodeURIComponent(c.slice('auth_token='.length));
    }
  }
  return null;
}

export async function getAuthUser(request: NextRequest | Request): Promise<AuthUser | null> {
  const authHeader = request.headers.get('authorization');
  const cookieHeader = request.headers.get('cookie');
  const headerToken = extractTokenFromHeader(authHeader);
  const cookieToken = parseAuthCookie(cookieHeader);
  const token = headerToken || cookieToken;
  
  if (!token) return null;
  
  const payload = verifyToken(token);
  if (!payload) return null;
  
  // Verify user still exists in database
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true, role: true },
  });
  
  if (!user) return null;
  
  return {
    id: user.id,
    email: user.email,
    role: user.role,
  };
}

export function requireAuth(handler: (request: NextRequest | Request, user: AuthUser) => Promise<Response>) {
  return async (request: NextRequest | Request): Promise<Response> => {
    const user = await getAuthUser(request);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return handler(request, user);
  };
}

export function requireRole(allowedRoles: string[]) {
  return (handler: (request: NextRequest | Request, user: AuthUser) => Promise<Response>) => {
    return requireAuth(async (request: NextRequest | Request, user: AuthUser) => {
      if (!allowedRoles.includes(user.role)) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return handler(request, user);
    });
  };
}

