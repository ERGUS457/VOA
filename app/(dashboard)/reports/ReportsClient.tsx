'use client';
import { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import DataTable from '@/app/components/DataTable';
import { FileSpreadsheet, Printer, Calendar, DollarSign, Users, Target } from 'lucide-react';

export default function ReportsClient({ transactions }: { transactions: any[] }) {
  const [filter, setFilter] = useState('ALL');
  
  // Format dates to Asia/Jakarta for comparison
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
  const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(now);
  
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(yesterday);

  const filteredData = useMemo(() => {
    return transactions.filter(tx => {
      if (filter === 'TODAY') return tx.purchaseDate === todayStr;
      if (filter === 'YESTERDAY') return tx.purchaseDate === yesterdayStr;
      if (filter === 'THIS_MONTH') return tx.purchaseDate.startsWith(todayStr.substring(0, 7));
      return true; // ALL
    });
  }, [transactions, filter, todayStr, yesterdayStr]);

  const totalTx = filteredData.length;
  const totalVoa = filteredData.reduce((sum, tx) => sum + Number(tx.voaPrice), 0);
  const totalService = filteredData.reduce((sum, tx) => sum + Number(tx.serviceFee), 0);
  const totalAmount = filteredData.reduce((sum, tx) => sum + Number(tx.totalAmount), 0);

  const formatRp = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

  const getFilterLabel = () => {
    if (filter === 'TODAY') return `Hari Ini (${todayStr})`;
    if (filter === 'YESTERDAY') return `Kemarin (${yesterdayStr})`;
    if (filter === 'THIS_MONTH') return `Bulan Ini (${now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })})`;
    return 'Semua Waktu (Seluruh Data Transaksi)';
  };

  const printTimestamp = new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta'
  }).format(now) + ' WIB';

  const signatureDate = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta'
  }).format(now);

  const exportExcel = () => {
    const wsData = filteredData.map((tx, idx) => ({
      No: idx + 1,
      'No Resi': tx.visaReceiptNumber,
      'No VOA': tx.voaNumber,
      'No Paspor': tx.passportNumber,
      'Nama Pemohon': tx.fullName,
      'Kewarganegaraan': tx.nationality,
      'Tgl Beli': tx.purchaseDate,
      'Waktu': tx.purchaseTimeStr,
      'Biaya VOA': Number(tx.voaPrice),
      'Biaya Layanan': Number(tx.serviceFee),
      'Total': Number(tx.totalAmount),
      'Metode Bayar': tx.paymentMethod,
      'Status': tx.status
    }));

    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan VOA");
    XLSX.writeFile(wb, `Laporan_VOA_${filter}.xlsx`);
  };

  const exportPdf = () => {
    window.print();
  };

  return (
    <div>
      {/* =========================================================================
          1. ON-SCREEN DASHBOARD VIEW (Hidden completely during print)
         ========================================================================= */}
      <div className="space-y-6 print:hidden">
        {/* Header & Filter */}
        <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Laporan & Rekapitulasi</h1>
            <p className="text-slate-500 text-sm mt-1">Data keuangan dan transaksi Visa On Arrival.</p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy"
            >
              <option value="ALL">Semua Waktu</option>
              <option value="TODAY">Hari Ini</option>
              <option value="YESTERDAY">Kemarin</option>
              <option value="THIS_MONTH">Bulan Ini</option>
            </select>
            
            <button onClick={exportExcel} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm transition-colors">
              <FileSpreadsheet className="w-4 h-4" /> EXPORT EXCEL
            </button>
            
            <button onClick={exportPdf} className="bg-navy hover:bg-navy-dark text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm transition-colors">
              <Printer className="w-4 h-4" /> CETAK LAPORAN RESMI (PDF)
            </button>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 text-blue-600 mb-2">
              <Users className="w-5 h-5" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Transaksi</h3>
            </div>
            <div className="text-3xl font-black text-slate-800">{totalTx}</div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 text-emerald-600 mb-2">
              <Target className="w-5 h-5" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Total VOA</h3>
            </div>
            <div className="text-2xl font-black text-slate-800">{formatRp(totalVoa)}</div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 text-orange-600 mb-2">
              <DollarSign className="w-5 h-5" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Layanan</h3>
            </div>
            <div className="text-2xl font-black text-slate-800">{formatRp(totalService)}</div>
          </div>
          <div className="bg-navy p-5 rounded-xl shadow-lg text-white">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-5 h-5 opacity-80" />
              <h3 className="text-xs font-bold uppercase tracking-wider opacity-80">Total Omzet</h3>
            </div>
            <div className="text-2xl font-black">{formatRp(totalAmount)}</div>
          </div>
        </div>

        {/* On-Screen Interactive DataTable */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-4">
          <DataTable>
            <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold">
              <tr>
                <th className="px-4 py-3">Resi</th>
                <th className="px-4 py-3">No. VOA</th>
                <th className="px-4 py-3">Nama Pemohon</th>
                <th className="px-4 py-3">Waktu</th>
                <th className="px-4 py-3">Metode</th>
                <th className="px-4 py-3 text-right">Biaya VOA</th>
                <th className="px-4 py-3 text-right">Layanan</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono font-medium text-slate-700">{tx.visaReceiptNumber}</td>
                  <td className="px-4 py-3 font-mono font-bold text-navy">{tx.voaNumber}</td>
                  <td className="px-4 py-3 font-bold text-slate-800">{tx.fullName}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{tx.purchaseDate} {tx.purchaseTimeStr}</td>
                  <td className="px-4 py-3 text-sm font-bold text-slate-700">{tx.paymentMethod}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{formatRp(Number(tx.voaPrice))}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{formatRp(Number(tx.serviceFee))}</td>
                  <td className="px-4 py-3 text-right font-bold text-slate-900">{formatRp(Number(tx.totalAmount))}</td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        </div>
      </div>

      {/* =========================================================================
          2. OFFICIAL GOVERNMENT PRINT TEMPLATE (Shown ONLY during window.print())
         ========================================================================= */}
      <div id="official-print-report" className="hidden print:block text-black bg-white font-sans">
        
        {/* Kop Surat Resmi BNPP - PLBN Aruk */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-black">
          <div className="w-24 shrink-0 flex justify-center">
            <img src="/logo.png" alt="Logo BNPP" className="w-20 h-20 object-contain" />
          </div>
          <div className="flex-1 text-center px-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-black leading-tight">
              BADAN NASIONAL PENGELOLA PERBATASAN
            </h3>
            <h2 className="text-base font-black uppercase tracking-wider text-black mt-0.5">
              POS LINTAS BATAS NEGARA (PLBN) TERPADU ARUK
            </h2>
            <p className="text-[10px] text-black mt-1 leading-snug">
              Jalan Lintas Batas Negara, Desa Sebunga, Kecamatan Sajingan Besar, Kabupaten Sambas, Kalimantan Barat 79467
            </p>
            <p className="text-[9px] text-black italic">
              Sistem Pengelolaan & Pelayanan Visa On Arrival (VOA)
            </p>
          </div>
          <div className="w-24 shrink-0 flex justify-center opacity-0">
            {/* Symmetrical Spacer */}
            <img src="/logo.png" alt="" className="w-20 h-20" />
          </div>
        </div>
        {/* Second thin line for traditional Indonesian Kop Surat */}
        <div className="border-b border-black mt-0.5 mb-5"></div>

        {/* Report Title & Metadata */}
        <div className="text-center mb-4">
          <h1 className="text-sm font-black uppercase tracking-wider underline">
            LAPORAN REKAPITULASI PELAYANAN VISA ON ARRIVAL (VOA)
          </h1>
          <div className="flex justify-between items-center text-[10px] text-black mt-2 font-medium px-1">
            <span><strong>Periode Data:</strong> {getFilterLabel()}</span>
            <span><strong>Waktu Cetak:</strong> {printTimestamp}</span>
          </div>
        </div>

        {/* Financial Summary Strip */}
        <div className="grid grid-cols-4 gap-3 mb-5">
          <div className="border border-black p-2 text-center bg-slate-50">
            <div className="text-[9px] uppercase font-bold text-black">Total Transaksi</div>
            <div className="text-sm font-black text-black">{totalTx} Transaksi</div>
          </div>
          <div className="border border-black p-2 text-center bg-slate-50">
            <div className="text-[9px] uppercase font-bold text-black">Penerimaan Biaya VOA</div>
            <div className="text-sm font-black text-black">{formatRp(totalVoa)}</div>
          </div>
          <div className="border border-black p-2 text-center bg-slate-50">
            <div className="text-[9px] uppercase font-bold text-black">Penerimaan Biaya Layanan</div>
            <div className="text-sm font-black text-black">{formatRp(totalService)}</div>
          </div>
          <div className="border-2 border-black p-2 text-center bg-slate-100">
            <div className="text-[9px] uppercase font-black text-black">TOTAL PENERIMAAN (OMZET)</div>
            <div className="text-sm font-black text-black">{formatRp(totalAmount)}</div>
          </div>
        </div>

        {/* Clean, Full-Width Printable Table (All Filtered Data, No Pagination) */}
        <table className="w-full text-left text-[10px] border-collapse border border-black mb-6">
          <thead>
            <tr className="bg-slate-100 border-b border-black text-black">
              <th className="border border-black px-2 py-1.5 text-center font-bold w-7">No.</th>
              <th className="border border-black px-2 py-1.5 font-bold">No. Resi</th>
              <th className="border border-black px-2 py-1.5 font-bold text-center">No. VOA</th>
              <th className="border border-black px-2 py-1.5 font-bold text-center">No. Paspor</th>
              <th className="border border-black px-2 py-1.5 font-bold">Nama Pemohon</th>
              <th className="border border-black px-2 py-1.5 text-center font-bold">Warga Negara</th>
              <th className="border border-black px-2 py-1.5 text-center font-bold">Waktu</th>
              <th className="border border-black px-2 py-1.5 text-center font-bold">Metode</th>
              <th className="border border-black px-2 py-1.5 text-right font-bold">Biaya VOA</th>
              <th className="border border-black px-2 py-1.5 text-right font-bold">Layanan</th>
              <th className="border border-black px-2 py-1.5 text-right font-bold">Total</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={11} className="border border-black px-4 py-6 text-center italic text-black">
                  Tidak ada data transaksi untuk periode ini.
                </td>
              </tr>
            ) : (
              filteredData.map((tx, idx) => (
                <tr key={tx.id} className="border-b border-black">
                  <td className="border border-black px-2 py-1 text-center font-medium">{idx + 1}</td>
                  <td className="border border-black px-2 py-1 font-mono font-medium">{tx.visaReceiptNumber}</td>
                  <td className="border border-black px-2 py-1 font-mono text-center font-bold">{tx.voaNumber}</td>
                  <td className="border border-black px-2 py-1 font-mono text-center uppercase">{tx.passportNumber}</td>
                  <td className="border border-black px-2 py-1 font-bold uppercase">{tx.fullName}</td>
                  <td className="border border-black px-2 py-1 text-center uppercase">{tx.nationality}</td>
                  <td className="border border-black px-2 py-1 text-center">{tx.purchaseDate} {tx.purchaseTimeStr?.replace(' WIB', '')}</td>
                  <td className="border border-black px-2 py-1 text-center font-bold">{tx.paymentMethod}</td>
                  <td className="border border-black px-2 py-1 text-right">{formatRp(Number(tx.voaPrice))}</td>
                  <td className="border border-black px-2 py-1 text-right">{formatRp(Number(tx.serviceFee))}</td>
                  <td className="border border-black px-2 py-1 text-right font-bold">{formatRp(Number(tx.totalAmount))}</td>
                </tr>
              ))
            )}
          </tbody>
          {filteredData.length > 0 && (
            <tfoot>
              <tr className="bg-slate-100 border-t-2 border-black font-bold">
                <td colSpan={8} className="border border-black px-3 py-1.5 text-right font-black">
                  TOTAL KESELURUHAN:
                </td>
                <td className="border border-black px-2 py-1.5 text-right font-black">
                  {formatRp(totalVoa)}
                </td>
                <td className="border border-black px-2 py-1.5 text-right font-black">
                  {formatRp(totalService)}
                </td>
                <td className="border border-black px-2 py-1.5 text-right font-black">
                  {formatRp(totalAmount)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>

        {/* Lembar Tanda Tangan & Pengesahan Petugas */}
        <div className="flex justify-end mt-6 break-inside-avoid">
          <div className="text-center text-[11px] space-y-1 w-64">
            <p>Aruk, {signatureDate}</p>
            <p className="font-bold text-black">Petugas / Pengelola Loket VOA,</p>
            <div className="h-16"></div>
            <p className="font-bold underline text-black">( .................................................... )</p>
            <p className="text-[10px] text-black">PLBN Terpadu Aruk</p>
          </div>
        </div>

      </div>

      {/* =========================================================================
          3. GLOBAL PRINT CSS (Strict A4 Landscape Layout)
         ========================================================================= */}
      <style jsx global>{`
        @page {
          size: A4 landscape;
          margin: 10mm 15mm;
        }

        @media print {
          html, body {
            background: #ffffff !important;
            color: #000000 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Hide on-screen chrome completely */
          aside, header, nav, .print\\:hidden, .dt-container {
            display: none !important;
          }

          body * {
            visibility: hidden;
          }

          #official-print-report, #official-print-report * {
            visibility: visible !important;
          }

          #official-print-report {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
          }

          main, .min-h-screen {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
          }

          table {
            width: 100% !important;
            border-collapse: collapse !important;
          }

          th, td {
            border: 1px solid #000000 !important;
          }

          thead {
            display: table-header-group !important;
          }

          tfoot {
            display: table-footer-group !important;
          }

          tr {
            page-break-inside: avoid !important;
          }
        }
      `}</style>
    </div>
  );
}

