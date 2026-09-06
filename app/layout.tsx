import './globals.css';
import type { Metadata } from 'next';
import Script from 'next/script';

export const metadata: Metadata = { title: 'VOA PLBN Aruk', description: 'Sistem Pelayanan Visa On Arrival' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className="text-[14px]">
      <head>
        <link href="https://cdn.datatables.net/v/dt/dt-3.0.3/datatables.min.css" rel="stylesheet" />
      </head>
      <body className="bg-slate-50 text-slate-900 min-h-screen">
        {children}
        <Script src="https://code.jquery.com/jquery-3.7.1.min.js" strategy="beforeInteractive" />
        <Script src="https://cdn.datatables.net/v/dt/dt-3.0.3/datatables.min.js" strategy="beforeInteractive" />
      </body>
    </html>
  );
}
