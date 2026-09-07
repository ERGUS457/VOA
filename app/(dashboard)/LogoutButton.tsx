'use client';

import { LogOut } from 'lucide-react';
import Swal from 'sweetalert2';
import { logoutAction } from '@/app/actions/logoutAction';

export default function LogoutButton() {
  const handleLogout = async () => {
    const res = await Swal.fire({
      title: 'Konfirmasi Logout',
      text: 'Apakah Anda yakin ingin keluar dari sistem VOA?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#DC2626',
      cancelButtonColor: '#64748B',
      confirmButtonText: 'Ya, Keluar',
      cancelButtonText: 'Batal'
    });

    if (res.isConfirmed) {
      await Swal.fire({
        title: 'Logout Berhasil',
        text: 'Mengalihkan ke halaman login...',
        icon: 'success',
        timer: 1000,
        showConfirmButton: false
      });
      await logoutAction();
    }
  };

  return (
    <button
      onClick={handleLogout}
      type="button"
      className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
    >
      <LogOut className="w-5 h-5 shrink-0" />
      <span className="text-sm font-bold">Logout</span>
    </button>
  );
}
