'use client';
import { useState, useEffect } from 'react';
import { checkVoaNumber, createTransactionAction, getAvailableVoas } from './actions';
import WebcamCapture from './WebcamCapture';
import { Loader2, AlertCircle, CheckCircle2, ChevronRight, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import OcrScanner from './OcrScanner';
import Swal from 'sweetalert2';

export default function CreateTransactionPage() {
  const router = useRouter();
  const [voaNumber, setVoaNumber] = useState('');
  const [availableVoas, setAvailableVoas] = useState<string[]>([]);
  const [voaStatus, setVoaStatus] = useState<{ status: string, message: string } | null>(null);
  const [checking, setChecking] = useState(false);
  const [photoData, setPhotoData] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const voaPrice = 500000;
  const serviceFee = 13500;
  const totalAmount = voaPrice + serviceFee;
  const formatRp = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

  const [passportNumber, setPassportNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [nationality, setNationality] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');

  const handleOcrScan = (data: any) => {
    console.log('Received OCR data into form:', data);
    if (data.passportNumber) setPassportNumber(data.passportNumber);
    if (data.fullName) setFullName(data.fullName);
    if (data.nationality) setNationality(data.nationality);
    if (data.dateOfBirth) setDateOfBirth(data.dateOfBirth);
    if (data.gender) setGender(data.gender);
  };

  useEffect(() => {
    getAvailableVoas().then(data => setAvailableVoas(data)).catch(console.error);
  }, []);

  useEffect(() => {
    if (!voaNumber) {
      setVoaStatus(null);
      return;
    }
    const timer = setTimeout(async () => {
      setChecking(true);
      const res = await checkVoaNumber(voaNumber);
      setVoaStatus(res);
      setChecking(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [voaNumber]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (voaStatus?.status !== 'AVAILABLE') {
      Swal.fire({
        title: 'Perhatian!',
        text: 'Pilih Nomor VOA yang tersedia terlebih dahulu!',
        icon: 'warning',
        confirmButtonText: 'Tutup'
      });
      return;
    }
    setSaving(true);
    setErrorMsg('');

    const confirm = await Swal.fire({
      title: 'Konfirmasi Transaksi',
      html: `
        <div class="text-left text-sm space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200 mt-2">
          <p><strong>Nomor VOA:</strong> <span class="font-mono text-navy font-bold">${voaNumber}</span></p>
          <p><strong>Nama:</strong> ${fullName}</p>
          <p><strong>Nomor Paspor:</strong> ${passportNumber}</p>
          <p class="text-emerald-700 font-bold pt-1 border-t border-slate-200 mt-2"><strong>Total Bayar:</strong> ${formatRp(totalAmount)}</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#1E3A8A',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Proses Transaksi!',
      cancelButtonText: 'Batal'
    });

    if (!confirm.isConfirmed) {
      setSaving(false);
      return;
    }

    const formData = new FormData(e.currentTarget);
    formData.append('photoData', photoData);
    const res = await createTransactionAction(formData);
    
    if (res.error) {
      setErrorMsg(res.error);
      Swal.fire({
        title: 'Transaksi Gagal!',
        text: res.error,
        icon: 'error',
        confirmButtonColor: '#1E3A8A'
      });
      setSaving(false);
    } else if (res.success && res.id) {
      await Swal.fire({
        title: 'Transaksi Berhasil!',
        text: 'Data telah disimpan. Menuju lembar struk...',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
      router.push(`/receipt/${res.id}`);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Buat Transaksi Loket</h1>
        <p className="text-slate-500 text-sm mt-1">Masukkan data pemohon dan proses Visa On Arrival.</p>
      </div>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b pb-2">1. Pilih Nomor VOA</h2>
            <div>
              <div className="relative">
                <Search className="w-5 h-5 absolute left-4 top-3.5 text-slate-400" />
                <input 
                  type="text" 
                  name="voaNumber"
                  value={voaNumber}
                  onChange={(e) => setVoaNumber(e.target.value.toUpperCase())}
                  required
                  list="voa-list"
                  autoComplete="off"
                  placeholder="Ketik atau pilih Nomor VOA..."
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-navy focus:border-transparent font-bold text-slate-800 tracking-wide"
                />
                <datalist id="voa-list">
                  {availableVoas.map(voa => (
                    <option key={voa} value={voa}>Tersedia</option>
                  ))}
                </datalist>
                {checking && <Loader2 className="w-5 h-5 animate-spin absolute right-10 top-3.5 text-navy" />}
              </div>
              {voaStatus && (
                <div className={`mt-3 p-3 rounded-lg text-xs font-bold flex items-center gap-2 ${voaStatus.status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                  {voaStatus.status === 'AVAILABLE' ? <CheckCircle2 className="w-5 h-5"/> : <AlertCircle className="w-5 h-5"/>}
                  {voaStatus.message}
                </div>
              )}
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">2. Data Pemohon</h2>
              <OcrScanner onScan={handleOcrScan} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Nomor Paspor *</label>
                <input 
                  type="text" 
                  name="passportNumber" 
                  value={passportNumber}
                  onChange={(e) => setPassportNumber(e.target.value.toUpperCase())}
                  required 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-navy font-bold uppercase" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Nama Lengkap *</label>
                <input 
                  type="text" 
                  name="fullName" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value.toUpperCase())}
                  required 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-navy font-bold uppercase" 
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Kewarganegaraan *</label>
                <input 
                  type="text" 
                  name="nationality" 
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value.toUpperCase())}
                  required 
                  placeholder="Ketik kewarganegaraan (contoh: MALAYSIA)" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-navy font-bold uppercase" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Tanggal Lahir</label>
                <input 
                  type="date" 
                  name="dateOfBirth" 
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-navy font-medium text-slate-700" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Jenis Kelamin</label>
                <select 
                  name="gender" 
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-navy font-medium text-slate-700"
                >
                  <option value="">-- Pilih --</option>
                  <option value="Male">Laki-laki (Male)</option>
                  <option value="Female">Perempuan (Female)</option>
                  <option value="Other">Lainnya</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b pb-2">3. Foto Wajah (Opsional)</h2>
            {photoData ? (
              <div className="relative rounded-lg overflow-hidden border border-slate-200 shadow-sm bg-slate-900 aspect-video flex justify-center">
                <img src={photoData} alt="Pemohon" className="h-full object-contain" />
                <button type="button" onClick={() => setPhotoData('')} className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white text-xs px-4 py-2 rounded-full font-bold shadow-lg transition-colors">HAPUS</button>
              </div>
            ) : (
              <WebcamCapture onCapture={(b64) => setPhotoData(b64)} />
            )}
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b pb-2">4. Pembayaran</h2>
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-3">
              <div className="flex justify-between text-sm text-slate-600 font-medium"><span>Biaya VOA</span> <span>{formatRp(voaPrice)}</span></div>
              <div className="flex justify-between text-sm text-slate-600 font-medium"><span>Biaya Layanan</span> <span>{formatRp(serviceFee)}</span></div>
              <div className="border-t border-slate-200 pt-3 flex justify-between font-black text-navy-dark text-xl mt-2">
                <span>TOTAL</span> <span className="text-emerald-700">{formatRp(totalAmount)}</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Metode Pembayaran *</label>
              <select name="paymentMethod" required className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-1 focus:ring-navy font-bold text-slate-700 cursor-pointer">
                <option value="CASH">Tunai (CASH)</option>
                <option value="DEBIT">Kartu Debit</option>
                <option value="QRIS">QRIS</option>
                <option value="TRANSFER">Transfer Bank</option>
                <option value="OTHER">Lainnya</option>
              </select>
            </div>
            {errorMsg && (
              <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm font-bold flex gap-3 shadow-sm animate-in fade-in zoom-in duration-200"><AlertCircle className="w-5 h-5 shrink-0"/>{errorMsg}</div>
            )}
            <button 
              type="submit" 
              disabled={saving || voaStatus?.status !== 'AVAILABLE'} 
              className="w-full bg-navy hover:bg-navy-dark text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:shadow-none transition-all flex justify-center items-center gap-2 mt-4 text-sm tracking-wider"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>PROSES TRANSAKSI SEKARANG <ChevronRight className="w-5 h-5" /></>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
