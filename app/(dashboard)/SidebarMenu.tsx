'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Database, FilePlus, ScanLine, FileText, Settings, Users, Activity, ScrollText } from 'lucide-react';

export default function SidebarMenu({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, adminOnly: false },
    { name: 'Master Data VOA', path: '/master-voa', icon: Database, adminOnly: true },
    { name: 'Buat Transaksi VOA', path: '/transactions/new', icon: FilePlus, adminOnly: false },
    { name: 'Scan VOA', path: '/scan', icon: ScanLine, adminOnly: false },
    { name: 'Data Transaksi', path: '/transactions', icon: ScrollText, adminOnly: false },
    { name: 'Laporan', path: '/reports', icon: FileText, adminOnly: false },
    { name: 'Pengaturan Tarif', path: '/settings', icon: Settings, adminOnly: true },
    { name: 'Manajemen Petugas', path: '/users', icon: Users, adminOnly: true },
    { name: 'Audit Log', path: '/audit-logs', icon: Activity, adminOnly: true },
  ];

  return (
    <>
      {menuItems.map((item) => {
        if (item.adminOnly && !isAdmin) return null;
        const Icon = item.icon;
        const isActive = pathname === item.path || pathname?.startsWith(item.path + '/');
        
        return (
          <Link 
            key={item.path} 
            href={item.path} 
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              isActive 
                ? 'bg-blue-600/20 text-blue-400 font-bold border border-blue-500/20 shadow-inner' 
                : 'text-slate-300 hover:text-white hover:bg-white/10 font-medium'
            }`}
          >
            <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-blue-400' : ''}`} />
            <span className="text-sm">{item.name}</span>
          </Link>
        );
      })}
    </>
  );
}
