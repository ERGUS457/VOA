'use client';

import { useState } from 'react';
import { updateTransactionAction, deleteTransactionAction } from './actions';
import { Edit2, Trash2, X } from 'lucide-react';

export function TransactionActions({ transaction, isAdmin }: { transaction: any, isAdmin: boolean }) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isAdmin) return null; // Only admin can CRUD transactions

  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const formData = new FormData(e.currentTarget);
    const res = await updateTransactionAction(transaction.id, formData);
    
    if (res.error) {
      setError(res.error);
    } else {
      setIsEditOpen(false);
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    setLoading(true);
    setError('');
    const res = await deleteTransactionAction(transaction.id);
    if (res.error) {
      setError(res.error);
    } else {
      setIsDeleteOpen(false);
    }
    setLoading(false);
  };

  return (
    <>
      <button onClick={() => setIsEditOpen(true)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit Transaksi">
        <Edit2 className="w-4 h-4" />
      </button>
      <button onClick={() => setIsDeleteOpen(true)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Hapus Transaksi">
        <Trash2 className="w-4 h-4" />
      </button>

      {/* Edit Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden text-left">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="font-bold text-slate-800">Edit Transaksi (Resi: {transaction.visaReceiptNumber})</h2>
              <button onClick={() => setIsEditOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
            </div>
            
            <form onSubmit={handleEdit} className="p-4 space-y-4">
              {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-semibold">{error}</div>}
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nama Lengkap</label>
                <input type="text" name="fullName" defaultValue={transaction.fullName} required className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-navy focus:ring-1 focus:ring-navy outline-none" />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nomor Paspor</label>
                <input type="text" name="passportNumber" defaultValue={transaction.passportNumber} required className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-navy focus:ring-1 focus:ring-navy outline-none" />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Kewarganegaraan</label>
                <input type="text" name="nationality" defaultValue={transaction.nationality} required className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-navy focus:ring-1 focus:ring-navy outline-none" />
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

      {/* Delete Confirmation Modal */}
      {isDeleteOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <Trash2 className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="font-bold text-lg text-slate-800 mb-2">Hapus Transaksi?</h2>
            <p className="text-sm text-slate-500 mb-6">Anda yakin ingin menghapus transaksi <strong>{transaction.visaReceiptNumber}</strong>? Nomor VOA akan dikembalikan ke status AVAILABLE.</p>
            
            {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs font-semibold mb-4 text-left">{error}</div>}

            <div className="flex justify-center gap-3">
              <button onClick={() => setIsDeleteOpen(false)} className="px-4 py-2 font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg">Batal</button>
              <button onClick={handleDelete} disabled={loading} className="px-4 py-2 font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50">
                {loading ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
