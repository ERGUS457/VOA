'use client';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, ArrowLeft, Download } from 'lucide-react';
import Link from 'next/link';

export default function ReceiptClient({ transaction }: { transaction: any }) {
  
  const formatRp = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
  
  // URL that QR Code will hold for verification
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify/${transaction.qrToken}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col items-center py-6 print:py-0 print:bg-white min-h-full space-y-6 bg-slate-50">
      
      {/* Action Buttons (Hidden when printing) */}
      <div className="print:hidden flex flex-wrap justify-center gap-4 mb-4">
        <button onClick={handlePrint} className="bg-navy hover:bg-navy-dark text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all hover:scale-105">
          <Printer className="w-5 h-5" /> CETAK STRUK
        </button>
        <button onClick={handlePrint} className="bg-slate-700 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all hover:scale-105">
          <Download className="w-5 h-5" /> DOWNLOAD PDF
        </button>
        <Link href="/transactions/new" className="bg-white border-2 border-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-sm hover:bg-slate-50 transition-all">
          <ArrowLeft className="w-5 h-5" /> KEMBALI
        </Link>
      </div>

      {/* The 80mm Receipt Box */}
      <div 
        className="receipt-container bg-white text-black p-4 shadow-2xl print:shadow-none mx-auto border border-slate-300 print:border-none" 
        style={{ width: '300px', fontFamily: '"Courier New", Courier, monospace', lineHeight: '1.4' }}
      >
        <div className="text-center space-y-4">
          
          <div>
            <div className="text-sm">DATE</div>
            <div className="text-sm">{transaction.purchaseDate}</div>
          </div>
          
          <div>
            <div className="text-sm">TIME</div>
            <div className="text-sm">{transaction.purchaseTimeStr}</div>
          </div>

          <div className="py-2">
            <div className="text-3xl font-black">{transaction.paymentMethod}</div>
          </div>

        </div>

        <div className="py-4 border-t border-b border-black border-dashed my-4 text-sm space-y-1">
          <div className="flex justify-between">
            <span>VOA:</span> 
            <span>{formatRp(Number(transaction.voaPrice))}</span>
          </div>
          <div className="flex justify-between">
            <span>Service:</span> 
            <span>{formatRp(Number(transaction.serviceFee))}</span>
          </div>
          <div className="flex justify-between font-bold text-base mt-2 pt-1 border-t border-black/20">
            <span>Total:</span> 
            <span>{formatRp(Number(transaction.totalAmount))}</span>
          </div>
        </div>

        <div className="text-center space-y-5 text-sm">
          
          <div>
            <div>Visa Number</div>
            <div className="font-bold text-base">{transaction.voaNumber}</div>
          </div>

          <div className="flex justify-center py-2">
            <QRCodeSVG value={verifyUrl} size={160} level="H" includeMargin={false} />
          </div>

          <div>
            <div>Visa Receipt</div>
            <div className="font-bold text-base">{transaction.visaReceiptNumber}</div>
          </div>

          <div className="font-bold tracking-widest text-lg pt-1">
            PLBN ARUK
          </div>

          <div>
            <div>Passport Number</div>
            <div className="font-bold text-base uppercase">{transaction.passportNumber}</div>
          </div>

          <div>
            <div>Name</div>
            <div className="font-bold text-base uppercase">{transaction.fullName}</div>
          </div>

          <div className="pt-4 font-bold tracking-widest text-lg border-t border-dashed border-black mt-4">
            TERIMA KASIH
          </div>
          
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .receipt-container, .receipt-container * {
            visibility: visible !important;
          }
          .receipt-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 80mm !important;
            margin: 0 !important;
            padding: 5mm !important;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>
    </div>
  );
}
