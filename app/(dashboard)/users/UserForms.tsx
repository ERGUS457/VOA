'use client';

import { useState } from 'react';
import { createUserAction, updateUserAction, deleteUserAction } from './actions';
import { Edit2, Trash2, Plus, X } from 'lucide-react';
import Swal from 'sweetalert2';

export function AddUserModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const formData = new FormData(e.currentTarget);
    const res = await createUserAction(formData);
    
    if (res.error) {
      setError(res.error);
    } else {
      setIsOpen(false);
      Swal.fire({
        title: 'Berhasil!',
        text: 'Petugas baru berhasil ditambahkan.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
    }
    setLoading(false);
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="bg-navy hover:bg-navy-dark text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm transition-colors">
        <Plus className="w-4 h-4" /> TAMBAH PETUGAS
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="font-bold text-slate-800">Tambah Petugas / Admin</h2>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-semibold">{error}</div>}
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nama Lengkap</label>
                <input type="text" name="name" required className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-navy focus:ring-1 focus:ring-navy outline-none" placeholder="Masukkan nama..." />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Username</label>
                <input type="text" name="username" required className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-navy focus:ring-1 focus:ring-navy outline-none" placeholder="Masukkan username..." />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password</label>
                <input type="password" name="password" required className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-navy focus:ring-1 focus:ring-navy outline-none" placeholder="Masukkan password..." />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Role</label>
                  <select name="role" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-navy focus:ring-1 focus:ring-navy outline-none">
                    <option value="PETUGAS">PETUGAS</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status</label>
                  <select name="status" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-navy focus:ring-1 focus:ring-navy outline-none">
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-lg">Batal</button>
                <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-bold text-white bg-navy hover:bg-navy-dark rounded-lg disabled:opacity-50">
                  {loading ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export function UserActions({ user, currentUserId }: { user: any, currentUserId: string }) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isSelf = user.id === currentUserId;

  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const formData = new FormData(e.currentTarget);
    const res = await updateUserAction(user.id, formData);
    
    if (res.error) {
      setError(res.error);
    } else {
      setIsEditOpen(false);
      Swal.fire({
        title: 'Berhasil!',
        text: 'Data petugas berhasil diperbarui.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    const confirmResult = await Swal.fire({
      title: 'Hapus Petugas?',
      text: `Anda yakin ingin menghapus ${user.name}? Tindakan ini tidak dapat dibatalkan.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    });

    if (!confirmResult.isConfirmed) return;

    setLoading(true);
    const res = await deleteUserAction(user.id);
    if (res.error) {
      Swal.fire('Gagal!', res.error, 'error');
    } else {
      Swal.fire({
        title: 'Terhapus!',
        text: 'Petugas berhasil dihapus.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
    }
    setLoading(false);
  };

  if (isSelf) {
    return <span className="text-xs text-slate-400 font-medium italic">Akun Anda</span>;
  }

  return (
    <>
      <div className="flex gap-2 justify-end">
        <button onClick={() => setIsEditOpen(true)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Edit Petugas">
          <Edit2 className="w-4 h-4" />
        </button>
        <button onClick={handleDelete} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors" title="Hapus Petugas">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Edit Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden text-left">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="font-bold text-slate-800">Edit Petugas</h2>
              <button onClick={() => setIsEditOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
            </div>
            
            <form onSubmit={handleEdit} className="p-4 space-y-4">
              {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-semibold">{error}</div>}
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nama Lengkap</label>
                <input type="text" name="name" defaultValue={user.name} required className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-navy focus:ring-1 focus:ring-navy outline-none" />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Username</label>
                <input type="text" name="username" defaultValue={user.username} required className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-navy focus:ring-1 focus:ring-navy outline-none" />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password Baru (Kosongkan jika tidak diubah)</label>
                <input type="password" name="password" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-navy focus:ring-1 focus:ring-navy outline-none" placeholder="***" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Role</label>
                  <select name="role" defaultValue={user.role} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-navy focus:ring-1 focus:ring-navy outline-none">
                    <option value="PETUGAS">PETUGAS</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status</label>
                  <select name="status" defaultValue={user.status} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-navy focus:ring-1 focus:ring-navy outline-none">
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setIsEditOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-lg">Batal</button>
                <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50">
                  {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
