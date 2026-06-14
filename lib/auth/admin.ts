import { prisma } from '@/lib/db';
import { hashPassword } from './password';
import 'dotenv/config';

export async function hasAnyUsers(): Promise<boolean> {
  const count = await prisma.user.count();
  return count > 0;
}

export async function isInitialAdminLogin(email: string, password: string): Promise<boolean> {
  const hasUsers = await hasAnyUsers();
  if (hasUsers) return false;
  
  const initAdminPass = process.env.INIT_ADMIN_PASS;
  if (!initAdminPass) return false;
  
  // Simple password comparison for initial admin
  return password === initAdminPass;
}

export async function createInitialAdmin(email: string, password: string): Promise<void> {
  const hasUsers = await hasAnyUsers();
  if (hasUsers) {
    throw new Error('Users already exist. Cannot create initial admin.');
  }
  
  const hashedPassword = await hashPassword(password);
  
  await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      role: 'ADMIN',
    },
  });
}

