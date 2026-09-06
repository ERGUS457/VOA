import { db } from '@/lib/db';
import { voaMaster, voaTransactions } from '@/lib/schema';
import { count, eq, sql } from 'drizzle-orm';
import { Ticket, TicketCheck, TrendingUp, DollarSign, Activity, PlusCircle, ScanLine, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { verifySession } from '@/lib/auth';

export default async function DashboardPage() {
  const session = await verifySession();
  const isAdmin = session?.role === 'ADMIN';

  // Current Date in DD/MM/YYYY for filtering
  const now = new Date();
  const todayStr = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Jakarta' }).format(now);

  // Stats queries
  const [
    availableRes,
    usedRes,
    totalRes,
    todayTxRes,
    todayRevenueRes
  ] = await Promise.all([
    db.select({ value: count() }).from(voaMaster).where(eq(voaMaster.status, 'AVAILABLE')),
    db.select({ value: count() }).from(voaMaster).where(eq(voaMaster.status, 'USED')),
    db.select({ value: count() }).from(voaMaster),
    db.select({ value: count() }).from(voaTransactions).where(eq(voaTransactions.purchaseDate, todayStr)),
    db.select({ value: sql<number>`sum(total_amount)` }).from(voaTransactions).where(eq(voaTransactions.purchaseDate, todayStr))
  ]);

  const available = availableRes[0].value;
  const used = usedRes[0].value;
  const total = totalRes[0].value;
  const todayTx = todayTxRes[0].value;
  const todayRevenue = todayRevenueRes[0].value || 0;

  const latestTx = await db.select().from(voaTransactions).orderBy(sql`created_at DESC`).limit(5);

  const formatRp = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard Overview</h1>
        <p className="text-slate-500 text-sm mt-1">Ringkasan statistik pelayanan Visa On Arrival hari ini.</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 text-emerald-600 mb-2">
            <Ticket className="w-5 h-5" />
            <h3 className="text-xs font-bold uppercase tracking-wider">VOA Tersedia</h3>
          </div>
          <div className="text-3xl font-black text-slate-800">{available}</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 text-orange-600 mb-2">
            <TicketCheck className="w-5 h-5" />
            <h3 className="text-xs font-bold uppercase tracking-wider">VOA Digunakan</h3>
          </div>
          <div className="text-3xl font-black text-slate-800">{used}</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 text-blue-600 mb-2">
            <Activity className="w-5 h-5" />
            <h3 className="text-xs font-bold uppercase tracking-wider">VOA Hari Ini</h3>
          </div>
          <div className="text-3xl font-black text-slate-800">{todayTx}</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 text-purple-600 mb-2">
            <DollarSign className="w-5 h-5" />
            <h3 className="text-xs font-bold uppercase tracking-wider">Pendapatan</h3>
          </div>
          <div className="text-xl font-black text-slate-800">{formatRp(Number(todayRevenue))}</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 text-slate-600 mb-2">
            <TrendingUp className="w-5 h-5" />
            <h3 className="text-xs font-bold uppercase tracking-wider">Total VOA</h3>
          </div>
          <div className="text-3xl font-black text-slate-800">{total}</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">Aksi Cepat</h2>
        <div className="flex flex-wrap gap-4">
          {isAdmin && (
            <Link href="/master-voa" className="bg-slate-800 hover:bg-slate-900 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm">
              <PlusCircle className="w-5 h-5" />
              TAMBAH NOMOR VOA
            </Link>
          )}
          <Link href="/transactions/new" className="bg-navy hover:bg-navy-dark text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm">
            <CreditCard className="w-5 h-5" />
            BUAT TRANSAKSI VOA
          </Link>
          <Link href="/scan" className="bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-700 px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm">
            <ScanLine className="w-5 h-5" />
            SCAN VOA
          </Link>
        </div>
      </div>

      {/* Latest Transactions Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h2 className="font-bold text-slate-800">5 Transaksi Terkini</h2>
          <Link href="/transactions" className="text-sm text-navy hover:underline font-medium">Lihat Semua &rarr;</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold">
              <tr>
                <th className="px-6 py-4">No. Resi</th>
                <th className="px-6 py-4">Nomor VOA</th>
                <th className="px-6 py-4">Nama Pemohon</th>
                <th className="px-6 py-4">Paspor</th>
                <th className="px-6 py-4">Waktu</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {latestTx.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">Belum ada transaksi hari ini.</td>
                </tr>
              ) : (
                latestTx.map(tx => (
                  <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{tx.visaReceiptNumber}</td>
                    <td className="px-6 py-4">{tx.voaNumber}</td>
                    <td className="px-6 py-4">{tx.fullName}</td>
                    <td className="px-6 py-4">{tx.passportNumber}</td>
                    <td className="px-6 py-4">{tx.purchaseDate} {tx.purchaseTimeStr}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${tx.status === 'VALID' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
