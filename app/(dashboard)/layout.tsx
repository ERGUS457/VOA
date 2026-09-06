import SidebarMenu from './SidebarMenu';
import LiveClock from './LiveClock';
import { LogOut } from 'lucide-react';
import { verifySession, deleteSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await verifySession();
  if (!session) redirect('/login');

  const isAdmin = session.role === 'ADMIN';

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-navy-dark text-white flex flex-col fixed inset-y-0 z-10 shadow-2xl">
        <div className="h-20 flex items-center gap-3 px-6 bg-slate-900 border-b border-white/10">
          <img src="/logo.png" alt="Logo BNPP" className="w-10 h-10 object-contain drop-shadow-md" />
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-widest leading-tight">PLBN ARUK</span>
            <span className="text-[10px] text-slate-400 font-semibold tracking-wider">REPUBLIK INDONESIA</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-2">Menu Utama</div>
          <SidebarMenu isAdmin={isAdmin} />
        </div>

        <div className="p-4 border-t border-white/10 bg-slate-900/50">
          <form action={async () => {
            'use server';
            await deleteSession();
            redirect('/login');
          }}>
            <button className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors">
              <LogOut className="w-5 h-5 shrink-0" />
              <span className="text-sm font-bold">Logout</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 flex flex-col min-h-screen">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10">
          <div>
            <LiveClock />
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-bold text-slate-800">{session.name}</div>
              <div className="text-xs text-slate-500">{session.role}</div>
            </div>
            <div className={`px-2.5 py-1 rounded-md text-xs font-bold ${isAdmin ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
              {session.role}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
