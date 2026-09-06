import { db } from '@/lib/db';
import { voaTransactions, voaMaster } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { ShieldCheck, XCircle, AlertTriangle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const metadata = { title: 'Verifikasi VOA | PLBN Aruk' };

export default async function VerifyPage({ params }: { params: { token: string } }) {
  
  const token = params.token;
  
  // Basic validation for UUID
  const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(token);
  
  if (!isValidUUID) {
    return (
      <VerificationLayout>
        <div className="bg-yellow-50 border-2 border-yellow-400 p-6 rounded-2xl text-center">
          <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-black text-yellow-700 tracking-wider">⚠ BARCODE TIDAK VALID</h2>
          <p className="text-yellow-600 mt-2 text-sm font-medium">Format QR Code tidak dikenali oleh sistem.</p>
        </div>
      </VerificationLayout>
    );
  }

  const txRes = await db.select({
    tx: voaTransactions,
    master: voaMaster
  })
  .from(voaTransactions)
  .leftJoin(voaMaster, eq(voaTransactions.voaMasterId, voaMaster.id))
  .where(eq(voaTransactions.qrToken, token))
  .limit(1);

  if (txRes.length === 0) {
    return (
      <VerificationLayout>
        <div className="bg-red-50 border-2 border-red-500 p-6 rounded-2xl text-center shadow-lg shadow-red-500/20">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-black text-red-700 tracking-wider">✕ VOA TIDAK DITEMUKAN</h2>
          <p className="text-red-600 mt-2 text-sm font-medium">Data transaksi tidak ada di dalam database resmi.</p>
        </div>
      </VerificationLayout>
    );
  }

  const { tx, master } = txRes[0];

  if (master?.status === 'CANCELLED') {
    return (
      <VerificationLayout>
        <div className="bg-red-50 border-2 border-red-500 p-6 rounded-2xl text-center shadow-lg shadow-red-500/20">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-black text-red-700 tracking-wider">✕ VOA DIBATALKAN</h2>
          <p className="text-red-600 mt-2 text-sm font-medium">Visa On Arrival ini telah dibatalkan dan tidak berlaku.</p>
        </div>
      </VerificationLayout>
    );
  }

  return (
    <VerificationLayout>
      <div className="bg-white border-2 border-emerald-500 p-1 rounded-3xl shadow-xl shadow-emerald-500/20 overflow-hidden">
        
        <div className="bg-emerald-500 text-white p-6 text-center">
          <ShieldCheck className="w-16 h-16 mx-auto mb-3" />
          <h2 className="text-2xl font-black tracking-widest">✓ VOA VALID</h2>
          <p className="text-emerald-100 mt-1 text-sm font-medium">Dokumen ini resmi dan terdaftar di sistem.</p>
        </div>

        <div className="p-6 space-y-6">
          {tx.photoData && (
            <div className="flex justify-center">
              <img src={tx.photoData} alt="Foto Pemohon" className="w-32 h-32 object-cover rounded-2xl border-4 border-slate-100 shadow-md" />
            </div>
          )}

          <div className="space-y-4">
            <DataRow label="Status" value="USED / VALID" highlight />
            <DataRow label="Visa Number" value={tx.voaNumber} />
            <DataRow label="Visa Receipt" value={tx.visaReceiptNumber} />
            <DataRow label="Passport Number" value={tx.passportNumber} />
            <DataRow label="Nama Lengkap" value={tx.fullName} />
            <DataRow label="Kewarganegaraan" value={tx.nationality} />
            <DataRow label="Tanggal Pembelian" value={tx.purchaseDate} />
            <DataRow label="Waktu" value={tx.purchaseTimeStr} />
          </div>
        </div>

      </div>
    </VerificationLayout>
  );
}

function DataRow({ label, value, highlight = false }: { label: string, value: string | null, highlight?: boolean }) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-slate-100 last:border-0">
      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</span>
      <span className={`font-bold ${highlight ? 'text-emerald-600 text-lg' : 'text-slate-800'}`}>{value || '-'}</span>
    </div>
  );
}

function VerificationLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 bg-[url('/bg-plbn.jpg')] bg-cover bg-center">
      <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm z-0"></div>
      
      <div className="relative z-10 w-full max-w-md space-y-8">
        
        <div className="flex flex-col items-center text-white">
          <img src="/logo.png" alt="Logo" className="w-16 h-16 mb-4 drop-shadow-lg" />
          <h1 className="text-xl font-black tracking-widest text-center">PORTAL VERIFIKASI</h1>
          <p className="text-slate-400 text-xs font-bold tracking-widest uppercase">PLBN Aruk - Republik Indonesia</p>
        </div>

        {children}

        <div className="text-center">
          <Link href="/" className="inline-block text-slate-400 hover:text-white text-sm font-medium transition-colors">
            &larr; Kembali ke Beranda
          </Link>
        </div>

      </div>
    </div>
  );
}
