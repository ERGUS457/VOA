'use server';
import { db } from '@/lib/db';
import { voaMaster, voaTransactions, auditLogs, tariffSettings } from '@/lib/schema';
import { verifySession } from '@/lib/auth';
import { eq, and, desc, like } from 'drizzle-orm';
import crypto from 'crypto';

export async function checkVoaNumber(voaNumber: string) {
  const voa = await db.select().from(voaMaster).where(eq(voaMaster.voaNumber, voaNumber)).limit(1);
  if (voa.length === 0) return { status: 'NOT_FOUND', message: '✕ NOMOR VOA TIDAK DITEMUKAN' };
  if (voa[0].status === 'USED') return { status: 'USED', message: '✕ VOA SUDAH DIGUNAKAN' };
  if (voa[0].status === 'CANCELLED') return { status: 'CANCELLED', message: '✕ VOA DIBATALKAN' };
  return { status: 'AVAILABLE', message: '✓ VOA TERSEDIA', id: voa[0].id };
}

export async function createTransactionAction(formData: FormData) {
  const session = await verifySession();
  if (!session) return { error: 'Unauthorized' };

  const voaNumber = formData.get('voaNumber') as string;
  const passportNumber = formData.get('passportNumber') as string;
  const fullName = formData.get('fullName') as string;
  const nationality = formData.get('nationality') as string;
  const dateOfBirth = formData.get('dateOfBirth') as string;
  const gender = formData.get('gender') as string;
  const photoData = formData.get('photoData') as string;
  const paymentMethod = formData.get('paymentMethod') as string;
  
  if (!voaNumber || !passportNumber || !fullName || !nationality || !paymentMethod) {
    return { error: 'Data pemohon belum lengkap.' };
  }

  try {
    const settingsRes = await db.select().from(tariffSettings).limit(1);
    const voaPrice = Number(settingsRes[0]?.voaPrice || '500000');
    const serviceFee = Number(settingsRes[0]?.serviceFee || '13500');
    const totalAmount = voaPrice + serviceFee;

    const now = new Date();
    
    // Optimistic Locking to guarantee atomic VOA usage
    const updateRes = await db.update(voaMaster)
      .set({ status: 'USED', usedAt: now, usedById: session.userId })
      .where(and(eq(voaMaster.voaNumber, voaNumber), eq(voaMaster.status, 'AVAILABLE')))
      .returning({ id: voaMaster.id });

    if (updateRes.length === 0) {
      return { error: 'Gagal! VOA sudah digunakan oleh petugas lain atau tidak tersedia.' };
    }
    const voaMasterId = updateRes[0].id;

    // Generate VR-YYYYMMDD-XXXXXX
    const tzNow = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Jakarta"}));
    const y = tzNow.getFullYear();
    const m = String(tzNow.getMonth() + 1).padStart(2, '0');
    const d = String(tzNow.getDate()).padStart(2, '0');
    const datePrefix = `VR-${y}${m}${d}-`;

    const lastTx = await db.select({ visaReceiptNumber: voaTransactions.visaReceiptNumber })
      .from(voaTransactions)
      .where(like(voaTransactions.visaReceiptNumber, `${datePrefix}%`))
      .orderBy(desc(voaTransactions.visaReceiptNumber))
      .limit(1);

    let seq = 1;
    if (lastTx.length > 0) {
      const lastSeq = parseInt(lastTx[0].visaReceiptNumber.split('-')[2], 10);
      seq = lastSeq + 1;
    }
    const visaReceiptNumber = `${datePrefix}${String(seq).padStart(6, '0')}`;
    const qrToken = crypto.randomUUID();

    const formatterDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' });
    const purchaseDate = formatterDate.format(now);
    const formatterTime = new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const purchaseTimeStr = `${formatterTime.format(now)} WIB`;

    const newTxRes = await db.insert(voaTransactions).values({
      voaMasterId,
      voaNumber,
      visaReceiptNumber,
      passportNumber,
      fullName,
      nationality,
      dateOfBirth: dateOfBirth || null,
      gender: gender || null,
      photoData: photoData || null,
      purchaseDate,
      purchaseTimeStr,
      voaPrice: voaPrice.toString(),
      serviceFee: serviceFee.toString(),
      totalAmount: totalAmount.toString(),
      paymentMethod,
      qrToken,
      officerId: session.userId,
    }).returning({ id: voaTransactions.id });

    await db.insert(auditLogs).values({
      userId: session.userId,
      action: 'CREATE_TRANSACTION',
      voaId: voaMasterId,
      description: `Transaksi VOA ${voaNumber} (Resi: ${visaReceiptNumber}) untuk paspor ${passportNumber}`,
    });

    return { success: true, id: newTxRes[0].id };
  } catch (error) {
    console.error('Create TX error:', error);
    return { error: 'Terjadi kesalahan sistem saat memproses transaksi.' };
  }
}
