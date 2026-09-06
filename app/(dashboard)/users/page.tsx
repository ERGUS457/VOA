import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { desc } from 'drizzle-orm';
import DataTable from '@/app/components/DataTable';
import { verifySession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Shield, User } from 'lucide-react';
import { AddUserModal, UserActions } from './UserForms';

export const metadata = { title: 'Manajemen Petugas | PLBN Aruk' };

export default async function UsersPage() {
  const session = await verifySession();
  if (session?.role !== 'ADMIN') redirect('/dashboard');

  const data = await db.select().from(users).orderBy(desc(users.createdAt));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Manajemen Petugas</h1>
          <p className="text-slate-500 text-sm mt-1">Kelola akun admin dan petugas loket.</p>
        </div>
        <AddUserModal />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-4">
        <DataTable>
          <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold">
            <tr>
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3">Username</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Tgl Dibuat</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-bold text-slate-800">{user.name}</td>
                <td className="px-4 py-3 text-slate-500">@{user.username}</td>
                <td className="px-4 py-3">
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                    user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {user.role === 'ADMIN' ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                    {user.role}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    user.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {user.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">{new Date(user.createdAt).toLocaleDateString('id-ID')}</td>
                <td className="px-4 py-3">
                  <UserActions user={user} />
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      </div>
    </div>
  );
}
