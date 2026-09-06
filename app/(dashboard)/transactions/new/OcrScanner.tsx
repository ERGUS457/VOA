'use client';
import { useState, useRef, useEffect } from 'react';
import { createWorker, Worker } from 'tesseract.js';
import { Scan, X, Loader2, Upload, AlertCircle } from 'lucide-react';

export default function OcrScanner({ onScan }: { onScan: (data: any) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [progress, setProgress] = useState('Menginisialisasi Kamera & AI...');
  const [error, setError] = useState('');
  const [rawText, setRawText] = useState('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const scanLoopRef = useRef<any>(null);
  const isScanningRef = useRef(false);

  const initSystem = async () => {
    try {
      // 1. Init AI Worker
      setProgress('Memuat model AI (Tesseract)...');
      const worker = await createWorker('eng');
      workerRef.current = worker;

      // 2. Init Camera
      setProgress('Mengakses kamera...');
      // Remove facingMode: 'environment' because on laptops it can cause a black screen
      const s = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = s;
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        // Ensure play on iOS
        videoRef.current.setAttribute('playsinline', 'true');
      }
      
      setIsReady(true);
      setProgress('');
    } catch (err) {
      console.error(err);
      setError('Gagal menginisialisasi kamera. Pastikan browser memiliki izin akses kamera.');
      setIsReady(true); // Let them use upload fallback
    }
  };

  const startAutoScan = () => {
    if (isScanningRef.current || !workerRef.current || !videoRef.current) return;
    isScanningRef.current = true;
    scanLoop();
  };

  const scanLoop = async () => {
    if (!isScanningRef.current || !videoRef.current || !workerRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx && canvas.width > 0) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg');

      try {
        const result = await workerRef.current.recognize(dataUrl);
        const text = result.data.text;
        
        if (text.includes('<')) {
           setRawText(text.replace(/\n/g, ' '));
        }

        const parsed = parseMRZ(text);
        
        if (parsed) {
          onScan(parsed);
          closeModal();
          return;
        }
      } catch (e) {
        // Silently ignore frame errors
      }
    }

    if (isScanningRef.current) {
      scanLoopRef.current = setTimeout(scanLoop, 1000); // Reduce frequency to 1s to save CPU
    }
  };

  const processFile = async (file: File) => {
    if (!workerRef.current) return;
    isScanningRef.current = false;
    setProgress('Membaca gambar...');
    setIsReady(false);
    setError('');
    
    try {
      const result = await workerRef.current.recognize(file);
      const text = result.data.text;
      setRawText(text);

      const parsed = parseMRZ(text);
      if (parsed) {
        onScan(parsed);
        closeModal();
      } else {
        setError('Gagal mengekstrak data dari paspor ini. Pastikan gambar tidak buram dan kode MRZ di bagian bawah terlihat penuh.');
        setIsReady(true);
      }
    } catch (e) {
      setError('Terjadi kesalahan saat memproses gambar.');
      setIsReady(true);
    }
  };

  const parseMRZ = (text: string) => {
    // Clean text aggressively
    const cleanedText = text.toUpperCase()
      .replace(/\s/g, '')
      .replace(/[KC\(\)\[\]\{\}]/g, '<'); 
      // Tesseract often reads < as K, C, or brackets

    // Extract Name
    let fullName = '';
    const nameMatch = cleanedText.match(/P<?[A-Z]{3}([A-Z0-9<]+)<<([A-Z0-9<]+)/);
    if (nameMatch) {
      const surname = nameMatch[1].replace(/</g, ' ').trim();
      const givenName = nameMatch[2].replace(/</g, ' ').trim();
      fullName = `${givenName} ${surname}`.trim();
    } else {
      // Fallback name search if P<IDN is mangled
      const looseNameMatch = cleanedText.match(/([A-Z]+)<<([A-Z<]+)/);
      if (looseNameMatch && looseNameMatch[1].length > 3) {
        const surname = looseNameMatch[1].replace(/</g, ' ').trim();
        const givenName = looseNameMatch[2].replace(/</g, ' ').trim();
        fullName = `${givenName} ${surname}`.trim();
      }
    }

    // Extract Passport Number
    let passportNumber = '';
    // Look for 7-9 alphanumeric characters followed by optional < and then a country code like IDN/MYS
    const passMatch = cleanedText.match(/([A-Z0-9]{7,9})<?[0-9]?[A-Z]{3}/);
    if (passMatch) {
      passportNumber = passMatch[1].replace(/</g, '');
    }

    // Determine Gender
    let gender = 'Other';
    if (cleanedText.includes('M')) gender = 'Male';
    if (cleanedText.includes('F')) gender = 'Female';

    if (fullName || passportNumber) {
      return {
        fullName: fullName || '-',
        passportNumber: passportNumber || '-',
        nationality: cleanedText.includes('MYS') ? 'MALAYSIA' : cleanedText.includes('SGP') ? 'SINGAPORE' : 'INDONESIA',
        gender
      };
    }
    
    return null;
  };

  const openModal = () => {
    setIsOpen(true);
    setIsReady(false);
    setError('');
    setRawText('');
    initSystem();
  };

  const closeModal = () => {
    setIsOpen(false);
    isScanningRef.current = false;
    clearTimeout(scanLoopRef.current);
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      isScanningRef.current = false;
      clearTimeout(scanLoopRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (workerRef.current) workerRef.current.terminate();
    };
  }, []);

  return (
    <>
      <button type="button" onClick={openModal} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm transition-colors">
        <Scan className="w-4 h-4" /> AUTO-SCAN PASPOR
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b bg-slate-50">
              <h2 className="font-bold text-slate-800 flex items-center gap-2">
                <Scan className="w-5 h-5"/> Pemindai Otomatis Paspor
              </h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5"/>
              </button>
            </div>
            
            <div className="p-6 space-y-4 text-center">
              {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-semibold text-left">{error}</div>}
              
              {!isReady ? (
                <div className="py-12 flex flex-col items-center">
                  <Loader2 className="w-12 h-12 text-navy animate-spin mb-4" />
                  <h3 className="text-lg font-bold text-slate-800">Menyiapkan Sistem...</h3>
                  <p className="text-slate-500 mt-2">{progress}</p>
                </div>
              ) : (
                <>
                  <div className="relative rounded-xl overflow-hidden bg-slate-900 aspect-video flex items-center justify-center border-4 border-slate-200">
                    {/* Add muted so browser autoplay policies do not block video rendering */}
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      muted
                      onPlay={startAutoScan}
                      className="w-full h-full object-cover" 
                    />
                    
                    <div className="absolute inset-0 border-[6px] border-emerald-500/30"></div>
                    <div className="absolute bottom-4 left-4 right-4 h-20 border-2 border-dashed border-emerald-400 bg-emerald-400/10 rounded flex items-center justify-center">
                      <div className="text-emerald-400 text-xs font-bold bg-slate-900/50 px-3 py-1 rounded">
                        Posisikan kode MRZ paspor di area ini
                      </div>
                    </div>
                    
                    {streamRef.current && (
                      <div className="absolute top-4 right-4 flex items-center gap-2 bg-slate-900/60 px-3 py-1.5 rounded-full">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                        <span className="text-[10px] text-white font-bold tracking-wider">SCANNING...</span>
                      </div>
                    )}
                  </div>
                  
                  {rawText && (
                    <div className="bg-slate-100 p-3 rounded-lg text-left overflow-hidden">
                      <p className="text-[10px] font-bold text-slate-500 mb-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Teks yang Terdeteksi AI:</p>
                      <p className="text-xs font-mono text-slate-800 break-all">{rawText}</p>
                    </div>
                  )}

                  <div className="flex justify-center mt-4">
                    <label className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold flex items-center gap-2 cursor-pointer shadow-sm border border-slate-200 w-full justify-center transition-colors">
                      <Upload className="w-5 h-5" /> ATAU UPLOAD GAMBAR PASPOR
                      <input type="file" accept="image/*" onChange={(e) => e.target.files && processFile(e.target.files[0])} className="hidden" />
                    </label>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
