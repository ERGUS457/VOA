import { db } from '@/lib/db';
import { voaTransactions } from '@/lib/schema';
import { desc } from 'drizzle-orm';
import ReportsClient from './ReportsClient';
import { verifySession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const metadata = { title: 'Laporan | PLBN Aruk' };

export default async function ReportsPage() {
  const session = await verifySession();
  if (!session) redirect('/login');

  const transactions = await db.select().from(voaTransactions).orderBy(desc(voaTransactions.createdAt));

  return <ReportsClient transactions={transactions} />;
}
