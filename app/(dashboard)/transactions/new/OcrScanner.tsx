'use client';
import { useState, useRef, useCallback } from 'react';
import Tesseract from 'tesseract.js';
import { Scan, X, Loader2, Camera, Upload } from 'lucide-react';

export default function OcrScanner({ onScan }: { onScan: (data: any) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
      }
    } catch (err) {
      setError('Kamera tidak dapat diakses.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const processImage = async (imageSrc: string | File) => {
    setIsProcessing(true);
    setProgress('Membaca teks dari gambar...');
    setError('');

    try {
      const result = await Tesseract.recognize(imageSrc, 'eng', {
        logger: m => {
          if (m.status === 'recognizing text') {
            setProgress(`Membaca... ${Math.round(m.progress * 100)}%`);
          }
        }
      });

      const text = result.data.text;
      const parsed = parseMRZ(text);
      
      if (parsed) {
        onScan(parsed);
        closeModal();
      } else {
        setError('Data paspor (MRZ) tidak terdeteksi dengan jelas. Pastikan foto fokus dan pencahayaan cukup.');
      }
    } catch (e) {
      setError('Gagal membaca gambar.');
    } finally {
      setIsProcessing(false);
      setProgress('');
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        stopCamera();
        processImage(dataUrl);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      stopCamera();
      processImage(e.target.files[0]);
    }
  };

  const parseMRZ = (text: string) => {
    const lines = text.split('\n').map(l => l.replace(/\s/g, ''));
    // Look for MRZ pattern (TD3 format: 44 chars)
    const mrzLines = lines.filter(l => l.length >= 40 && l.includes('<'));
    
    if (mrzLines.length >= 2) {
      // Typically last two lines of MRZ
      const line1 = mrzLines[mrzLines.length - 2];
      const line2 = mrzLines[mrzLines.length - 1];
      
      try {
        const type = line1.substring(0, 1);
        const country = line1.substring(2, 5);
        
        // Parsing names
        const namePart = line1.substring(5);
        const nameSplit = namePart.split('<<');
        const surname = nameSplit[0].replace(/</g, ' ').trim();
        const givenName = nameSplit[1] ? nameSplit[1].replace(/</g, ' ').trim() : '';
        const fullName = `${givenName} ${surname}`.trim();
        
        // Parsing details
        const passportNumber = line2.substring(0, 9).replace(/</g, '');
        const nationality = line2.substring(10, 13);
        const genderCode = line2.substring(20, 21);
        
        let gender = 'Other';
        if (genderCode === 'M') gender = 'Male';
        if (genderCode === 'F') gender = 'Female';

        // Basic country mapping
        const natMap: Record<string, string> = { 'IDN': 'INDONESIA', 'MYS': 'MALAYSIA', 'SGP': 'SINGAPORE' };
        
        return {
          fullName,
          passportNumber,
          nationality: natMap[nationality] || nationality,
          gender
        };
      } catch (e) {
        return null;
      }
    }
    return null;
  };

  const openModal = () => {
    setIsOpen(true);
    startCamera();
  };

  const closeModal = () => {
    setIsOpen(false);
    stopCamera();
    setError('');
  };

  return (
    <>
      <button type="button" onClick={openModal} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm transition-colors">
        <Scan className="w-4 h-4" /> AUTO-SCAN PASPOR
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b bg-slate-50">
              <h2 className="font-bold text-slate-800 flex items-center gap-2"><Scan className="w-5 h-5"/> Scan MRZ Paspor</h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
            </div>
            
            <div className="p-6 space-y-4 text-center">
              {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-semibold">{error}</div>}
              
              {!isProcessing ? (
                <>
                  <div className="relative rounded-xl overflow-hidden bg-slate-900 aspect-video flex items-center justify-center border-4 border-slate-200">
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                    
                    {/* Target overlay for MRZ */}
                    <div className="absolute bottom-4 left-4 right-4 h-16 border-2 border-emerald-500 bg-emerald-500/20 rounded">
                      <div className="absolute -top-6 left-0 text-emerald-400 text-[10px] font-bold">Arahkan area bawah paspor (MRZ) ke sini</div>
                    </div>
                  </div>
                  
                  <div className="flex justify-center gap-4 mt-4">
                    <button onClick={capturePhoto} className="bg-navy hover:bg-navy-dark text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg">
                      <Camera className="w-5 h-5" /> FOTO SEKARANG
                    </button>
                    
                    <label className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold flex items-center gap-2 cursor-pointer shadow-sm border border-slate-200">
                      <Upload className="w-5 h-5" /> UPLOAD FOTO
                      <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                    </label>
                  </div>
                </>
              ) : (
                <div className="py-12 flex flex-col items-center">
                  <Loader2 className="w-12 h-12 text-navy animate-spin mb-4" />
                  <h3 className="text-lg font-bold text-slate-800">Sedang Memproses AI...</h3>
                  <p className="text-slate-500 mt-2">{progress}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
