import { db } from '@/lib/db';
import { auditLogs, users } from '@/lib/schema';
import { desc, eq } from 'drizzle-orm';
import DataTable from '@/app/components/DataTable';
import { verifySession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const metadata = { title: 'Audit Log | PLBN Aruk' };

export default async function AuditLogsPage() {
  const session = await verifySession();
  if (session?.role !== 'ADMIN') redirect('/dashboard');

  const data = await db.select({
    log: auditLogs,
    userName: users.name,
    userRole: users.role
  })
  .from(auditLogs)
  .leftJoin(users, eq(auditLogs.userId, users.id))
  .orderBy(desc(auditLogs.createdAt))
  .limit(2000);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Audit Log</h1>
        <p className="text-slate-500 text-sm mt-1">Rekaman jejak aktivitas sistem oleh seluruh pengguna.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-4">
        <DataTable>
          <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold">
            <tr>
              <th className="px-4 py-3">Waktu</th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Aksi</th>
              <th className="px-4 py-3">Target VOA</th>
              <th className="px-4 py-3">Deskripsi</th>
              <th className="px-4 py-3">IP Address</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((row) => {
              const log = row.log;
              return (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-sm">{new Date(log.createdAt).toLocaleString('id-ID')}</td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-800">{row.userName || 'System'}</div>
                    <div className="text-xs text-slate-400">{row.userRole || '-'}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                      log.action === 'CREATE' ? 'bg-emerald-100 text-emerald-700' :
                      log.action === 'UPDATE' ? 'bg-blue-100 text-blue-700' :
                      log.action === 'DELETE' ? 'bg-red-100 text-red-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold">{log.voaId || '-'}</td>
                  <td className="px-4 py-3 text-xs max-w-xs truncate" title={log.description || ''}>{log.description || '-'}</td>
                  <td className="px-4 py-3 text-xs font-mono text-slate-500">{log.ipAddress || '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </DataTable>
      </div>
    </div>
  );
}
