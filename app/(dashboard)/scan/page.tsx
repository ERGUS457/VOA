import ScannerClient from './ScannerClient';
import { ScanLine } from 'lucide-react';

export const metadata = { title: 'Scan VOA | PLBN Aruk' };

export default function ScanPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <ScanLine className="w-6 h-6 text-navy" /> Scan Visa Barcode
        </h1>
        <p className="text-slate-500 text-sm mt-1">Verifikasi keaslian struk Visa On Arrival menggunakan QR Code.</p>
      </div>

      <ScannerClient />
    </div>
  );
}
