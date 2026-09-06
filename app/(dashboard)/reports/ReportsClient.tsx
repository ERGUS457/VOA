'use client';
import { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import DataTable from '@/app/components/DataTable';
import { FileSpreadsheet, Printer, Calendar, DollarSign, Users, Target } from 'lucide-react';

export default function ReportsClient({ transactions }: { transactions: any[] }) {
  const [filter, setFilter] = useState('ALL');
  
  // Format dates to Asia/Jakarta for comparison
  const now = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Jakarta"}));
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
    <div className="space-y-6">
      
      {/* Header & Filter */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 print:hidden">
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
          
          <button onClick={exportPdf} className="bg-slate-700 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm transition-colors">
            <Printer className="w-4 h-4" /> CETAK PDF
          </button>
        </div>
      </div>

      {/* Print Title (Visible only when printing) */}
      <div className="hidden print:block text-center mb-8">
        <h1 className="text-2xl font-bold">LAPORAN TRANSAKSI VOA PLBN ARUK</h1>
        <p className="text-sm">Filter: {filter}</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm print:border-black">
          <div className="flex items-center gap-3 text-blue-600 mb-2">
            <Users className="w-5 h-5" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Transaksi</h3>
          </div>
          <div className="text-3xl font-black text-slate-800">{totalTx}</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm print:border-black">
          <div className="flex items-center gap-3 text-emerald-600 mb-2">
            <Target className="w-5 h-5" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Total VOA</h3>
          </div>
          <div className="text-2xl font-black text-slate-800">{formatRp(totalVoa)}</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm print:border-black">
          <div className="flex items-center gap-3 text-orange-600 mb-2">
            <DollarSign className="w-5 h-5" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Layanan</h3>
          </div>
          <div className="text-2xl font-black text-slate-800">{formatRp(totalService)}</div>
        </div>
        <div className="bg-navy p-5 rounded-xl shadow-lg print:border print:border-black print:text-black print:bg-white text-white">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-5 h-5 opacity-80" />
            <h3 className="text-xs font-bold uppercase tracking-wider opacity-80">Total Omzet</h3>
          </div>
          <div className="text-2xl font-black">{formatRp(totalAmount)}</div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-4 print:p-0 print:border-none print:shadow-none">
        <DataTable>
          <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold print:bg-white print:text-black border-b-2 border-black">
            <tr>
              <th className="px-4 py-3">Resi</th>
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3">Waktu</th>
              <th className="px-4 py-3">Metode</th>
              <th className="px-4 py-3 text-right">Biaya VOA</th>
              <th className="px-4 py-3 text-right">Layanan</th>
              <th className="px-4 py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 print:divide-black">
            {filteredData.map((tx) => (
              <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-medium">{tx.visaReceiptNumber}</td>
                <td className="px-4 py-3">{tx.fullName}</td>
                <td className="px-4 py-3 text-sm">{tx.purchaseDate}</td>
                <td className="px-4 py-3 text-sm font-bold">{tx.paymentMethod}</td>
                <td className="px-4 py-3 text-right">{formatRp(Number(tx.voaPrice))}</td>
                <td className="px-4 py-3 text-right">{formatRp(Number(tx.serviceFee))}</td>
                <td className="px-4 py-3 text-right font-bold">{formatRp(Number(tx.totalAmount))}</td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .min-h-screen > aside, .min-h-screen > header {
            display: none !important;
          }
          main, main * {
            visibility: visible;
          }
          main {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
          }
          /* Hide DataTables wrappers during print */
          .dt-container .dt-layout-row:not(:has(table)) {
            display: none !important;
          }
          .dt-search, .dt-length, .dt-info, .dt-paging {
            display: none !important;
          }
          /* Re-layout metrics for print */
          .grid.gap-4 {
            display: flex !important;
            justify-content: space-between !important;
            gap: 1rem !important;
            margin-bottom: 2rem !important;
          }
          .grid.gap-4 > div {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            text-align: center !important;
          }
          table {
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}
