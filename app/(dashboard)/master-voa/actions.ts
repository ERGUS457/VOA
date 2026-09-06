'use server';

import { db } from '@/lib/db';
import { voaMaster, auditLogs } from '@/lib/schema';
import { verifySession } from '@/lib/auth';
import { eq, ilike } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function checkVoaDuplicate(voaNumber: string) {
  const existing = await db.select().from(voaMaster).where(eq(voaMaster.voaNumber, voaNumber)).limit(1);
  return existing.length > 0;
}

export async function createVoaAction(voaNumber: string) {
  const session = await verifySession();
  if (!session || session.role !== 'ADMIN') return { error: 'Unauthorized' };

  if (!voaNumber) return { error: 'Nomor VOA wajib diisi.' };

  try {
    const isDuplicate = await checkVoaDuplicate(voaNumber);
    if (isDuplicate) return { error: '✕ NOMOR VOA SUDAH TERDAFTAR' };

    await db.insert(voaMaster).values({ voaNumber });
    
    await db.insert(auditLogs).values({
      userId: session.userId,
      action: 'ADD_VOA',
      description: `Menambahkan nomor VOA baru: ${voaNumber}`,
    });

    revalidatePath('/master-voa');
    return { success: 'Berhasil menyimpan VOA baru.' };
  } catch (error) {
    return { error: 'Gagal menyimpan VOA.' };
  }
}

export async function updateVoaAction(id: string, newVoaNumber: string) {
  const session = await verifySession();
  if (!session || session.role !== 'ADMIN') return { error: 'Unauthorized' };

  if (!newVoaNumber) return { error: 'Nomor VOA wajib diisi.' };

  try {
    const voa = await db.select().from(voaMaster).where(eq(voaMaster.id, id)).limit(1);
    if (voa.length === 0) return { error: 'Data tidak ditemukan.' };
    if (voa[0].status === 'USED') return { error: 'VOA SUDAH DIGUNAKAN DAN TIDAK DAPAT DIUBAH.' };

    const isDuplicate = await checkVoaDuplicate(newVoaNumber);
    if (isDuplicate && voa[0].voaNumber !== newVoaNumber) return { error: '✕ NOMOR VOA SUDAH TERDAFTAR' };

    await db.update(voaMaster).set({ voaNumber: newVoaNumber, updatedAt: new Date() }).where(eq(voaMaster.id, id));
    
    await db.insert(auditLogs).values({
      userId: session.userId,
      action: 'EDIT_VOA',
      voaId: id,
      description: `Mengubah nomor VOA dari ${voa[0].voaNumber} menjadi ${newVoaNumber}`,
    });

    revalidatePath('/master-voa');
    return { success: 'Berhasil mengubah VOA.' };
  } catch (error) {
    return { error: 'Gagal mengubah VOA.' };
  }
}

export async function cancelVoaAction(id: string) {
  const session = await verifySession();
  if (!session || session.role !== 'ADMIN') return { error: 'Unauthorized' };

  try {
    const voa = await db.select().from(voaMaster).where(eq(voaMaster.id, id)).limit(1);
    if (voa.length === 0) return { error: 'Data tidak ditemukan.' };

    await db.update(voaMaster).set({ status: 'CANCELLED', updatedAt: new Date() }).where(eq(voaMaster.id, id));
    
    await db.insert(auditLogs).values({
      userId: session.userId,
      action: 'CANCEL_VOA',
      voaId: id,
      description: `Membatalkan nomor VOA: ${voa[0].voaNumber}`,
    });

    revalidatePath('/master-voa');
    return { success: 'Berhasil membatalkan VOA.' };
  } catch (error) {
    return { error: 'Gagal membatalkan VOA.' };
  }
}
