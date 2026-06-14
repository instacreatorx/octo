'use client';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('auth_token', token);
}

export function removeToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('auth_token');
}

export function getAuthHeaders(): HeadersInit {
  const token = getToken();
  if (!token) return {};
  return {
    'Authorization': `Bearer ${token}`,
  };
}

