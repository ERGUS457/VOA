import { db } from '@/lib/db';
import { voaTransactions } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import ReceiptClient from './ReceiptClient';
import { verifySession } from '@/lib/auth';

export const metadata = { title: 'Cetak Struk VOA | PLBN Aruk' };

export default async function ReceiptPage({ params }: { params: { id: string } }) {
  const session = await verifySession();
  if (!session) redirect('/login');

  const txRes = await db.select().from(voaTransactions).where(eq(voaTransactions.id, params.id)).limit(1);
  if (txRes.length === 0) return (
    <div className="p-8 text-center text-slate-500 font-bold">
      Data transaksi tidak ditemukan.
    </div>
  );
  
  const transaction = txRes[0];

  return <ReceiptClient transaction={transaction} />;
}
