'use client';

import { useState, useEffect } from 'react';
import { createVoaAction, updateVoaAction, cancelVoaAction, checkVoaDuplicate } from './actions';
import { PlusCircle, X, Loader2, CheckCircle2, AlertCircle, Edit, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';

export function VoaActions({ voa }: { voa: any }) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [newNumber, setNewNumber] = useState(voa.voaNumber);
  const [checking, setChecking] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isEditOpen) return;
    const timer = setTimeout(async () => {
      if (newNumber === voa.voaNumber) {
        setStatusMsg(null);
        return;
      }
      setChecking(true);
      const isDup = await checkVoaDuplicate(newNumber);
      if (isDup) setStatusMsg({ type: 'error', text: '✕ NOMOR VOA SUDAH TERDAFTAR' });
      else setStatusMsg({ type: 'success', text: '✓ NOMOR VOA TERSEDIA' });
      setChecking(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [newNumber, isEditOpen, voa.voaNumber]);

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (statusMsg?.type === 'error') return;
    setLoading(true);
    const res = await updateVoaAction(voa.id, newNumber);
    setLoading(false);
    if (res.success) {
      setIsEditOpen(false);
      Swal.fire({
        title: 'Berhasil!',
        text: 'Nomor VOA berhasil diubah.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
    } else {
      Swal.fire({
        title: 'Gagal!',
        text: res.error,
        icon: 'error',
        confirmButtonText: 'Tutup'
      });
    }
  };

  const handleCancel = async () => {
    const confirmResult = await Swal.fire({
      title: 'Yakin membatalkan?',
      text: 'Status VOA ini akan menjadi CANCELLED.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, Batalkan!',
      cancelButtonText: 'Kembali'
    });
    
    if (!confirmResult.isConfirmed) return;
    
    const res = await cancelVoaAction(voa.id);
    if (res.error) {
      Swal.fire('Gagal!', res.error, 'error');
    } else {
      Swal.fire({
        title: 'Dibatalkan!',
        text: 'VOA berhasil dibatalkan.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
    }
  };

  if (voa.status === 'USED') {
    return <span className="text-xs text-slate-400">VOA SUDAH DIGUNAKAN DAN TIDAK DAPAT DIUBAH</span>;
  }

  return (
    <>
      <div className="flex gap-2">
        <button onClick={() => setIsEditOpen(true)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
          <Edit className="w-4 h-4" />
        </button>
        {voa.status === 'AVAILABLE' && (
          <button onClick={handleCancel} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {isEditOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">Edit Nomor VOA</h3>
              <button onClick={() => setIsEditOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Nomor VOA</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={newNumber} 
                    onChange={e => setNewNumber(e.target.value)} 
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy"
                  />
                  {checking && <Loader2 className="w-4 h-4 animate-spin absolute right-4 top-3.5 text-slate-400" />}
                </div>
                {statusMsg && (
                  <p className={`text-xs mt-2 font-medium ${statusMsg.type === 'error' ? 'text-red-600' : 'text-emerald-600'}`}>
                    {statusMsg.text}
                  </p>
                )}
              </div>
              <button disabled={loading || statusMsg?.type === 'error'} className="w-full bg-navy hover:bg-navy-dark text-white font-bold py-3 rounded-xl disabled:opacity-50 flex justify-center items-center gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />} SIMPAN PERUBAHAN
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export function AddVoaModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [voaNumber, setVoaNumber] = useState('');
  const [checking, setChecking] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (!voaNumber) {
      setStatusMsg(null);
      return;
    }
    const timer = setTimeout(async () => {
      setChecking(true);
      const isDup = await checkVoaDuplicate(voaNumber);
      if (isDup) setStatusMsg({ type: 'error', text: '✕ NOMOR VOA SUDAH TERDAFTAR' });
      else setStatusMsg({ type: 'success', text: '✓ NOMOR VOA TERSEDIA' });
      setChecking(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [voaNumber]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (statusMsg?.type === 'error') return;
    setLoading(true);
    const res = await createVoaAction(voaNumber);
    setLoading(false);
    
    if (res.error) {
      Swal.fire({
        title: 'Gagal!',
        text: res.error,
        icon: 'error',
        confirmButtonText: 'Tutup'
      });
    }
    if (res.success) {
      setIsOpen(false);
      setVoaNumber('');
      Swal.fire({
        title: 'Berhasil!',
        text: 'VOA berhasil ditambahkan.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    }
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="bg-navy hover:bg-navy-dark text-white px-5 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm">
        <PlusCircle className="w-5 h-5" /> TAMBAH VOA
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">Tambah Nomor VOA Baru</h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Visa Number / Nomor VOA</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={voaNumber} 
                    onChange={e => setVoaNumber(e.target.value)} 
                    placeholder="Contoh: VOA-ARUK-000001"
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy font-medium"
                  />
                  {checking && <Loader2 className="w-4 h-4 animate-spin absolute right-4 top-3.5 text-slate-400" />}
                </div>
                <p className="text-xs text-slate-400 mt-2">* Nomor harus diketik manual</p>
                {statusMsg && (
                  <div className={`mt-3 p-3 rounded-lg text-xs font-bold flex items-center gap-2 ${statusMsg.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                    {statusMsg.type === 'error' ? <AlertCircle className="w-4 h-4"/> : <CheckCircle2 className="w-4 h-4"/>}
                    {statusMsg.text}
                  </div>
                )}
              </div>
              
              <button disabled={loading || statusMsg?.type === 'error' || !voaNumber} className="w-full bg-navy hover:bg-navy-dark text-white font-bold py-3.5 rounded-xl disabled:opacity-50 flex justify-center items-center gap-2 transition-all">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'SIMPAN VOA'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
