'use server';

import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { verifySession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import * as bcrypt from 'bcryptjs';

export async function createUserAction(formData: FormData) {
  const session = await verifySession();
  if (session?.role !== 'ADMIN') return { error: 'Unauthorized' };

  const name = formData.get('name') as string;
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;
  const role = formData.get('role') as string;
  const status = formData.get('status') as string;

  if (!name || !username || !password || !role) {
    return { error: 'Semua field wajib diisi' };
  }

  try {
    const existing = await db.select().from(users).where(eq(users.username, username)).limit(1);
    if (existing.length > 0) {
      return { error: 'Username sudah digunakan' };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.insert(users).values({
      name,
      username,
      password: hashedPassword,
      role,
      status: status || 'ACTIVE',
    });

    revalidatePath('/users');
    return { success: true };
  } catch (error) {
    console.error('Failed to create user', error);
    return { error: 'Terjadi kesalahan sistem' };
  }
}

export async function updateUserAction(id: string, formData: FormData) {
  const session = await verifySession();
  if (session?.role !== 'ADMIN') return { error: 'Unauthorized' };

  const name = formData.get('name') as string;
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;
  const role = formData.get('role') as string;
  const status = formData.get('status') as string;

  if (!name || !username || !role) {
    return { error: 'Name, username, dan role wajib diisi' };
  }

  try {
    const existing = await db.select().from(users).where(eq(users.username, username)).limit(1);
    if (existing.length > 0 && existing[0].id !== id) {
      return { error: 'Username sudah digunakan oleh pengguna lain' };
    }

    const updateData: any = { name, username, role, status };
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    await db.update(users).set(updateData).where(eq(users.id, id));

    revalidatePath('/users');
    return { success: true };
  } catch (error) {
    console.error('Failed to update user', error);
    return { error: 'Terjadi kesalahan sistem' };
  }
}

export async function deleteUserAction(id: string) {
  const session = await verifySession();
  if (session?.role !== 'ADMIN') return { error: 'Unauthorized' };

  try {
    // Note: If user has related records (transactions/audit logs), this might fail due to foreign keys.
    // In a real system, you might want to soft delete (set status='INACTIVE'). We'll try hard delete first, 
    // and if it fails, fallback or suggest setting status to inactive.
    await db.delete(users).where(eq(users.id, id));
    revalidatePath('/users');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to delete user', error);
    if (error.message?.includes('violates foreign key constraint')) {
       return { error: 'Gagal dihapus: Petugas ini sudah memiliki data transaksi atau riwayat audit. Silakan ubah statusnya menjadi INACTIVE.' };
    }
    return { error: 'Terjadi kesalahan sistem saat menghapus' };
  }
}
