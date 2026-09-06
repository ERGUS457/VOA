'use server';

import { db } from '@/lib/db';
import { tariffSettings, auditLogs } from '@/lib/schema';
import { verifySession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';

export async function updateTariffAction(formData: FormData) {
  const session = await verifySession();
  if (!session || session.role !== 'ADMIN') return { error: 'Unauthorized' };

  const voaPrice = formData.get('voaPrice') as string;
  const serviceFee = formData.get('serviceFee') as string;

  if (!voaPrice || !serviceFee) return { error: 'Semua field harus diisi.' };

  try {
    const existing = await db.select().from(tariffSettings).limit(1);
    
    if (existing.length > 0) {
      await db.update(tariffSettings).set({ voaPrice, serviceFee, updatedAt: new Date() }).where(eq(tariffSettings.id, existing[0].id));
    } else {
      await db.insert(tariffSettings).values({ voaPrice, serviceFee });
    }

    await db.insert(auditLogs).values({
      userId: session.userId,
      action: 'UPDATE_TARIFF',
      description: `Admin mengubah tarif - VOA: Rp ${voaPrice}, Service: Rp ${serviceFee}`,
    });

    revalidatePath('/settings/tariff');
    return { success: 'Berhasil menyimpan pengaturan tarif!' };
  } catch (error) {
    return { error: 'Gagal menyimpan pengaturan.' };
  }
}
