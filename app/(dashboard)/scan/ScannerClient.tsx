'use client';
import { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { verifyTokenAction } from './actions';
import { ShieldCheck, XCircle, AlertTriangle, X } from 'lucide-react';

export default function ScannerClient() {
  const [error, setError] = useState('');
  const [isScanning, setIsScanning] = useState(true);
  const [result, setResult] = useState<any>(null);
  
  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;

    if (isScanning) {
      const timer = setTimeout(() => {
        scanner = new Html5QrcodeScanner(
          "reader",
          { fps: 10, qrbox: { width: 250, height: 250 } },
          false
        );

        scanner.render(
          async (decodedText) => {
            scanner?.clear();
            setIsScanning(false);
            
            let token = decodedText;
            if (decodedText.includes('/verify/')) {
              token = decodedText.split('/verify/')[1];
            }
            
            try {
              const res = await verifyTokenAction(token);
              setResult(res);
            } catch (e) {
              setResult({ type: 'ERROR' });
            }
          },
          (err) => {
            // ignore continuous scan errors
          }
        );
      }, 500);

      return () => {
        clearTimeout(timer);
        if (scanner) scanner.clear().catch(e => console.error(e));
      };
    }
  }, [isScanning]);

  const resetScanner = () => {
    setResult(null);
    setIsScanning(true);
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm max-w-2xl mx-auto">
      
      {isScanning ? (
        <>
          <h2 className="text-center font-bold text-slate-800 mb-6 uppercase tracking-widest text-sm">Arahkan QR Code ke Kamera</h2>
          <div id="reader" className="w-full max-w-sm mx-auto rounded-lg overflow-hidden border-2 border-dashed border-slate-300"></div>
          {error && <div className="mt-4 text-red-600 text-sm font-bold text-center">{error}</div>}
        </>
      ) : (
        <div className="relative">
          <button onClick={resetScanner} className="absolute right-0 top-0 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
          
          <h2 className="font-bold text-slate-800 mb-6 uppercase tracking-widest text-sm border-b pb-2">Hasil Verifikasi</h2>
          
          {!result && <div className="text-center py-10 text-slate-500">Memeriksa data...</div>}
          
          {result?.type === 'INVALID_FORMAT' && (
            <div className="bg-yellow-50 border border-yellow-400 p-6 rounded-xl text-center">
              <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
              <h2 className="text-lg font-black text-yellow-700 tracking-wider">⚠ BARCODE TIDAK VALID</h2>
              <p className="text-yellow-600 mt-1 text-sm">Format QR Code tidak dikenali oleh sistem.</p>
              <button onClick={resetScanner} className="mt-4 bg-yellow-600 text-white px-6 py-2 rounded-lg font-bold text-sm">Scan Ulang</button>
            </div>
          )}

          {result?.type === 'NOT_FOUND' && (
            <div className="bg-red-50 border border-red-500 p-6 rounded-xl text-center">
              <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
              <h2 className="text-lg font-black text-red-700 tracking-wider">✕ VOA TIDAK DITEMUKAN</h2>
              <p className="text-red-600 mt-1 text-sm">Data transaksi tidak ada di dalam database resmi.</p>
              <button onClick={resetScanner} className="mt-4 bg-red-600 text-white px-6 py-2 rounded-lg font-bold text-sm">Scan Ulang</button>
            </div>
          )}

          {result?.type === 'CANCELLED' && (
            <div className="bg-red-50 border border-red-500 p-6 rounded-xl text-center">
              <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
              <h2 className="text-lg font-black text-red-700 tracking-wider">✕ VOA DIBATALKAN</h2>
              <p className="text-red-600 mt-1 text-sm">Visa On Arrival ini telah dibatalkan dan tidak berlaku.</p>
              <button onClick={resetScanner} className="mt-4 bg-red-600 text-white px-6 py-2 rounded-lg font-bold text-sm">Scan Ulang</button>
            </div>
          )}

          {result?.type === 'VALID' && (
            <div className="bg-white border-2 border-emerald-500 rounded-xl overflow-hidden shadow-lg">
              <div className="bg-emerald-500 text-white p-4 text-center">
                <ShieldCheck className="w-10 h-10 mx-auto mb-2" />
                <h2 className="text-xl font-black tracking-widest">✓ VOA VALID</h2>
              </div>
              <div className="p-6">
                {result.data.photoData && (
                  <div className="flex justify-center mb-6">
                    <img src={result.data.photoData} alt="Foto Pemohon" className="w-24 h-24 object-cover rounded-xl border-4 border-slate-100 shadow-sm" />
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                  <DataRow label="Status" value="USED / VALID" highlight />
                  <DataRow label="Visa Number" value={result.data.voaNumber} />
                  <DataRow label="Visa Receipt" value={result.data.visaReceiptNumber} />
                  <DataRow label="Passport" value={result.data.passportNumber} />
                  <DataRow label="Nama" value={result.data.fullName} />
                  <DataRow label="Kewarganegaraan" value={result.data.nationality} />
                  <DataRow label="Tanggal" value={result.data.purchaseDate} />
                  <DataRow label="Waktu" value={result.data.purchaseTimeStr} />
                </div>
                <div className="mt-8 text-center border-t pt-4">
                  <button onClick={resetScanner} className="bg-slate-800 text-white px-8 py-2.5 rounded-lg font-bold text-sm shadow hover:bg-slate-700 transition">Scan QR Lainnya</button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}

function DataRow({ label, value, highlight = false }: { label: string, value: string | null, highlight?: boolean }) {
  return (
    <div className="flex flex-col border-b border-slate-100 py-2 last:border-0">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
      <span className={`text-sm font-semibold ${highlight ? 'text-emerald-600 font-bold' : 'text-slate-800'}`}>{value || '-'}</span>
    </div>
  );
}
