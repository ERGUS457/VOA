'use client';
import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import { useRouter } from 'next/navigation';

export default function ScannerClient() {
  const router = useRouter();
  const [error, setError] = useState('');
  
  useEffect(() => {
    // We use a small delay to ensure the DOM is ready for the scanner
    const timer = setTimeout(() => {
      const scanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );

      scanner.render(
        (decodedText) => {
          scanner.clear();
          // Assuming decodedText is the full URL or just the token
          // If it's a full URL, we extract the token
          let token = decodedText;
          if (decodedText.includes('/verify/')) {
            token = decodedText.split('/verify/')[1];
          }
          router.push(`/verify/${token}`);
        },
        (err) => {
          // ignore scan errors (it keeps scanning)
        }
      );

      return () => {
        scanner.clear().catch(e => console.error("Failed to clear scanner", e));
      };
    }, 500);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm max-w-lg mx-auto">
      <h2 className="text-center font-bold text-slate-800 mb-6 uppercase tracking-widest text-sm">Arahkan QR Code ke Kamera</h2>
      <div id="reader" className="w-full rounded-lg overflow-hidden border-2 border-dashed border-slate-300"></div>
      {error && <div className="mt-4 text-red-600 text-sm font-bold text-center">{error}</div>}
    </div>
  );
}
