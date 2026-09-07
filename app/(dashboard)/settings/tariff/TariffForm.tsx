'use client';

import { useState } from 'react';
import { updateTariffAction } from './actions';
import { Save, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import Swal from 'sweetalert2';

export default function TariffForm({ initialVoaPrice, initialServiceFee }: { initialVoaPrice: string, initialServiceFee: string }) {
  const [voaPrice, setVoaPrice] = useState(initialVoaPrice);
  const [serviceFee, setServiceFee] = useState(initialServiceFee);
  const [loading, setLoading] = useState(false);

  const total = Number(voaPrice || 0) + Number(serviceFee || 0);

  const formatRp = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append('voaPrice', voaPrice);
    formData.append('serviceFee', serviceFee);

    const res = await updateTariffAction(formData);
    
    if (res.error) {
      Swal.fire('Gagal!', res.error, 'error');
    }
    if (res.success) {
      Swal.fire({
        title: 'Tersimpan!',
        text: res.success,
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
    }
    
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-slate-600 text-xs font-bold uppercase tracking-wider mb-2">Biaya VOA (Rp)</label>
          <input
            type="number"
            value={voaPrice}
            onChange={(e) => setVoaPrice(e.target.value)}
            required
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy transition-all font-medium"
          />
        </div>
        <div>
          <label className="block text-slate-600 text-xs font-bold uppercase tracking-wider mb-2">Biaya Layanan (Rp)</label>
          <input
            type="number"
            value={serviceFee}
            onChange={(e) => setServiceFee(e.target.value)}
            required
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy transition-all font-medium"
          />
        </div>
      </div>

      <div className="p-4 bg-navy-dark text-white rounded-xl flex justify-between items-center">
        <span className="font-medium text-slate-300">Total Tarif</span>
        <span className="text-2xl font-black">{formatRp(total)}</span>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-navy hover:bg-navy-dark text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-all flex items-center gap-2"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          SIMPAN PERUBAHAN
        </button>
      </div>
    </form>
  );
}
