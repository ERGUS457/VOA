'use server';

import { db } from '@/lib/db';
import { voaTransactions, voaMaster } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { verifySession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function deleteTransactionAction(id: string) {
  const session = await verifySession();
  if (session?.role !== 'ADMIN') return { error: 'Unauthorized (Admin only)' };

  try {
    // Before deleting transaction, we might want to free up the VOA Master
    // Or we can just delete the transaction.
    const tx = await db.select().from(voaTransactions).where(eq(voaTransactions.id, id)).limit(1);
    if (tx.length > 0) {
      await db.update(voaMaster).set({ status: 'AVAILABLE', usedAt: null, usedById: null }).where(eq(voaMaster.id, tx[0].voaMasterId));
      await db.delete(voaTransactions).where(eq(voaTransactions.id, id));
      revalidatePath('/transactions');
      return { success: true };
    }
    return { error: 'Transaksi tidak ditemukan' };
  } catch (error: any) {
    console.error('Failed to delete transaction', error);
    return { error: 'Terjadi kesalahan sistem saat menghapus transaksi' };
  }
}

export async function updateTransactionAction(id: string, formData: FormData) {
  const session = await verifySession();
  if (session?.role !== 'ADMIN') return { error: 'Unauthorized (Admin only)' };

  const fullName = formData.get('fullName') as string;
  const passportNumber = formData.get('passportNumber') as string;
  const nationality = formData.get('nationality') as string;

  if (!fullName || !passportNumber || !nationality) {
    return { error: 'Nama, Passport, dan Kewarganegaraan wajib diisi' };
  }

  try {
    await db.update(voaTransactions).set({
      fullName,
      passportNumber,
      nationality
    }).where(eq(voaTransactions.id, id));

    revalidatePath('/transactions');
    return { success: true };
  } catch (error) {
    console.error('Failed to update transaction', error);
    return { error: 'Terjadi kesalahan sistem saat update' };
  }
}
