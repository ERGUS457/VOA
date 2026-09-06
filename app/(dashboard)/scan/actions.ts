'use server';

import { db } from '@/lib/db';
import { voaTransactions, voaMaster } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { verifySession } from '@/lib/auth';

export async function verifyTokenAction(token: string) {
  const session = await verifySession();
  if (!session) return { error: 'Unauthorized', type: 'ERROR' };

  const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(token);
  if (!isValidUUID) {
    return { type: 'INVALID_FORMAT' };
  }

  const txRes = await db.select({
    tx: voaTransactions,
    master: voaMaster
  })
  .from(voaTransactions)
  .leftJoin(voaMaster, eq(voaTransactions.voaMasterId, voaMaster.id))
  .where(eq(voaTransactions.qrToken, token))
  .limit(1);

  if (txRes.length === 0) {
    return { type: 'NOT_FOUND' };
  }

  const { tx, master } = txRes[0];

  if (master?.status === 'CANCELLED') {
    return { type: 'CANCELLED' };
  }

  return {
    type: 'VALID',
    data: tx
  };
}
