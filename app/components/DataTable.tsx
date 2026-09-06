'use client';

import { useEffect, useRef } from 'react';

export default function DataTable({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  const tableRef = useRef<HTMLTableElement>(null);

  useEffect(() => {
    let dtInstance: any = null;

    const init = () => {
      // Check if DataTable is loaded in window
      if (typeof window !== 'undefined' && (window as any).DataTable && tableRef.current) {
        try {
          dtInstance = new (window as any).DataTable(tableRef.current, {
            pageLength: 10,
            destroy: true,
            language: {
              search: "Cari:",
              lengthMenu: "Tampilkan _MENU_ data",
              info: "Menampilkan _START_ sampai _END_ dari _TOTAL_ data",
              paginate: {
                first: "Awal",
                last: "Akhir",
                next: "Selanjutnya",
                previous: "Sebelumnya"
              }
            }
          });
        } catch (e) {
          console.error("DataTable initialization failed", e);
        }
      } else {
        // Retry if script is not loaded yet
        setTimeout(init, 500);
      }
    };

    init();

    return () => {
      if (dtInstance) {
        dtInstance.destroy();
      }
    };
  }, []);

  return (
    <table ref={tableRef} className={`display w-full text-left text-sm text-slate-600 ${className}`}>
      {children}
    </table>
  );
}
