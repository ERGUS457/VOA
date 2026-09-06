import { db } from '@/lib/db';
import { voaMaster } from '@/lib/schema';
import { desc, ilike, eq, and, sql } from 'drizzle-orm';
import { AddVoaModal, VoaActions } from './VoaForms';
import Link from 'next/link';
import DataTable from '@/app/components/DataTable';

export const metadata = { title: 'Master Data VOA | PLBN Aruk' };

export default async function MasterVoaPage({ searchParams }: { searchParams: { q?: string, status?: string, page?: string } }) {
  const q = searchParams.q || '';
  const statusFilter = searchParams.status || 'ALL';
  const page = parseInt(searchParams.page || '1');
  const limit = 10;
  const offset = (page - 1) * limit;

  // Build conditions
  const conditions = [];
  if (q) conditions.push(ilike(voaMaster.voaNumber, `%${q}%`));
  if (statusFilter !== 'ALL') conditions.push(eq(voaMaster.status, statusFilter));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Fetch data
  const data = await db.select()
    .from(voaMaster)
    .where(whereClause)
    .orderBy(desc(voaMaster.createdAt))
    .limit(1000); // Fetch up to 1000 to let DataTables handle it in client

  // Fetch count
  const countRes = await db.select({ count: sql<number>`count(*)` }).from(voaMaster).where(whereClause);
  const totalItems = countRes[0].count;
  const totalPages = Math.ceil(totalItems / limit);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Master Data VOA</h1>
          <p className="text-slate-500 text-sm mt-1">Kelola ketersediaan nomor Visa On Arrival.</p>
        </div>
        <AddVoaModal />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-4 justify-between">
          <form className="flex gap-4 w-full max-w-2xl">
            <input 
              type="text" 
              name="q" 
              defaultValue={q} 
              placeholder="Cari Nomor VOA..." 
              className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy"
            />
            <select 
              name="status" 
              defaultValue={statusFilter}
              className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy"
            >
              <option value="ALL">Semua Status</option>
              <option value="AVAILABLE">AVAILABLE</option>
              <option value="USED">USED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
            <button type="submit" className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-900">
              Filter
            </button>
          </form>
        </div>

        <div className="p-4">
          <DataTable>
            <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold">
              <tr>
                <th className="px-6 py-4">Nomor VOA</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Tgl Dibuat</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-800">{item.voaNumber}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      item.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-700' : 
                      item.status === 'USED' ? 'bg-orange-100 text-orange-700' : 
                      'bg-red-100 text-red-700'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">{new Date(item.createdAt).toLocaleDateString('id-ID')}</td>
                  <td className="px-6 py-4 flex justify-end">
                    <VoaActions voa={item} />
                  </td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        </div>
      </div>
    </div>
  );
}
