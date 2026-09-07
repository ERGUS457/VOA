'use server';

import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';
import { createSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export async function loginAction(prevState: any, formData: FormData) {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  if (!username || !password) {
    return { error: 'Username dan Password wajib diisi.' };
  }

  try {
    const userRes = await db.select().from(users).where(eq(users.username, username)).limit(1);
    const user = userRes[0];

    if (!user) {
      return { error: 'Akun tidak ditemukan atau salah kredensial.' };
    }

    if (user.status !== 'ACTIVE') {
      return { error: 'Akun tidak aktif. Hubungi administrator.' };
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return { error: 'Akun tidak ditemukan atau salah kredensial.' };
    }

    await createSession(user.id, user.role, user.name);
  } catch (error) {
    console.error('Login error:', error);
    return { error: 'Terjadi kesalahan sistem.' };
  }

  return { success: true };
}
