import { db } from '@/lib/db';
import { voaTransactions, users } from '@/lib/schema';
import { desc, eq } from 'drizzle-orm';
import DataTable from '@/app/components/DataTable';
import Link from 'next/link';
import { Eye, Printer, Camera } from 'lucide-react';
import { verifySession } from '@/lib/auth';

export const metadata = { title: 'Data Transaksi | PLBN Aruk' };

export default async function TransactionsPage() {
  const session = await verifySession();
  const isAdmin = session?.role === 'ADMIN';

  const data = await db.select({
    tx: voaTransactions,
    officerName: users.name
  })
  .from(voaTransactions)
  .leftJoin(users, eq(voaTransactions.officerId, users.id))
  .orderBy(desc(voaTransactions.createdAt))
  .limit(1000); // Fetch up to 1000 for DataTables

  const formatRp = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
  
  const maskPassport = (passport: string) => {
    if (!passport) return '-';
    if (passport.length <= 4) return passport;
    if (isAdmin) return passport; // Admin sees full passport
    return passport.substring(0, 2) + '****' + passport.substring(passport.length - 2);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Data Transaksi VOA</h1>
        <p className="text-slate-500 text-sm mt-1">Daftar riwayat pembelian Visa On Arrival.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-4">
        <DataTable>
          <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold">
            <tr>
              <th className="px-4 py-3">No</th>
              <th className="px-4 py-3">Foto</th>
              <th className="px-4 py-3">Visa Number</th>
              <th className="px-4 py-3">Passport</th>
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3">Negara</th>
              <th className="px-4 py-3">Waktu</th>
              <th className="px-4 py-3">Petugas</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((row, index) => {
              const tx = row.tx;
              return (
                <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-800">{index + 1}</td>
                  <td className="px-4 py-3">
                    {tx.photoData ? (
                      <div className="w-10 h-10 rounded bg-slate-200 overflow-hidden border border-slate-300">
                        <img src={tx.photoData} alt="Foto" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                        <Camera className="w-4 h-4" />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-800">{tx.voaNumber}</div>
                    <div className="text-xs text-slate-400">{tx.visaReceiptNumber}</div>
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-700">{maskPassport(tx.passportNumber)}</td>
                  <td className="px-4 py-3 text-sm font-medium">{tx.fullName}</td>
                  <td className="px-4 py-3 text-sm">{tx.nationality}</td>
                  <td className="px-4 py-3 text-sm">
                    <div>{tx.purchaseDate}</div>
                    <div className="text-xs text-slate-500">{tx.purchaseTimeStr}</div>
                  </td>
                  <td className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">{row.officerName}</td>
                  <td className="px-4 py-3 flex justify-end gap-2">
                    <Link href={`/receipt/${tx.id}`} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Cetak Struk">
                      <Printer className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </DataTable>
      </div>
    </div>
  );
}
