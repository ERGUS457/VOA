'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { createWorker, Worker } from 'tesseract.js';
import { Scan, X, Loader2, Upload, Camera, RotateCw, CheckCircle2, AlertCircle } from 'lucide-react';

export default function OcrScanner({ onScan }: { onScan: (data: any) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState('Menyiapkan Kamera & AI...');
  const [error, setError] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [detectedData, setDetectedData] = useState<{ fullName?: string; passportNumber?: string; nationality?: string; gender?: string; dateOfBirth?: string } | null>(null);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const scanTimerRef = useRef<any>(null);
  const isScanningActive = useRef(false);

  // Callback ref guarantees stream is attached as soon as <video> mounts
  const setVideoRef = useCallback((node: HTMLVideoElement | null) => {
    videoRef.current = node;
    if (node && streamRef.current) {
      node.srcObject = streamRef.current;
      node.play().catch(e => console.log('Video play error:', e));
    }
  }, []);

  const initSystem = async () => {
    setError('');
    setPreviewImage(null);
    setDetectedData(null);
    setIsReady(false);
    setProgress('Mengakses kamera & AI...');

    try {
      // 1. Start Camera
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }
        });
      } catch (e) {
        // Fallback to any camera
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(console.error);
      }

      setIsReady(true);
      setProgress('');

      // 2. Initialize Tesseract worker in background
      if (!workerRef.current) {
        const worker = await createWorker('eng');
        workerRef.current = worker;
      }

      // Start periodic scan
      isScanningActive.current = true;
      scheduleNextScan();
    } catch (err: any) {
      console.error('Camera init error:', err);
      setError('Kamera tidak dapat dibuka. Pastikan izin kamera telah disetujui di browser. Anda tetap bisa menggunakan opsi UPLOAD FOTO di bawah.');
      setIsReady(true);
      
      // Still init worker for upload
      if (!workerRef.current) {
        try {
          const worker = await createWorker('eng');
          workerRef.current = worker;
        } catch (we) {
          console.error('Worker init error:', we);
        }
      }
    }
  };

  const scheduleNextScan = () => {
    if (!isScanningActive.current) return;
    scanTimerRef.current = setTimeout(runAutoScanTick, 1200);
  };

  const runAutoScanTick = async () => {
    if (!isScanningActive.current || !videoRef.current || !workerRef.current) return;
    
    const video = videoRef.current;
    if (video.readyState < 2 || video.videoWidth === 0) {
      scheduleNextScan();
      return;
    }

    // Capture frame to canvas
    const canvas = document.createElement('canvas');
    // Scale down for fast OCR
    const scale = Math.min(1, 1000 / video.videoWidth);
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      try {
        const result = await workerRef.current.recognize(canvas);
        const parsed = parsePassportText(result.data.text);
        if (parsed && (parsed.passportNumber || parsed.fullName)) {
          // Found match!
          isScanningActive.current = false;
          onScan(parsed);
          closeModal();
          return;
        }
      } catch (e) {
        // Continue loop
      }
    }

    scheduleNextScan();
  };

  // Manual snapshot from video
  const captureCurrentFrame = async () => {
    if (!videoRef.current) return;
    isScanningActive.current = false;
    clearTimeout(scanTimerRef.current);

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setPreviewImage(dataUrl);
      processImageElement(canvas);
    }
  };

  // Process uploaded file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    isScanningActive.current = false;
    clearTimeout(scanTimerRef.current);
    setError('');

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setPreviewImage(dataUrl);

      // Create an image element to scale properly before OCR
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 1600;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          processImageElement(canvas);
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const processImageElement = async (canvas: HTMLCanvasElement) => {
    setIsProcessing(true);
    setError('');

    try {
      if (!workerRef.current) {
        const worker = await createWorker('eng');
        workerRef.current = worker;
      }

      const res = await workerRef.current.recognize(canvas);
      const text = res.data.text;
      console.log('Tesseract OCR Output:', text);

      const parsed = parsePassportText(text);
      if (parsed && (parsed.passportNumber || parsed.fullName)) {
        setDetectedData(parsed);
      } else {
        setError('Teks paspor belum terbaca jelas. Pastikan nomor paspor dan nama terlihat tanpa pantulan cahaya.');
      }
    } catch (e: any) {
      console.error('OCR error:', e);
      setError('Terjadi kendala saat membaca foto paspor.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Comprehensive multi-strategy passport parser
  const parsePassportText = (rawText: string) => {
    if (!rawText) return null;

    let fullName = '';
    let passportNumber = '';
    let nationality = 'INDONESIA';
    let gender = 'Male';
    let dateOfBirth = '';

    const parseYYMMDD = (yymmdd: string) => {
      if (!/^\d{6}$/.test(yymmdd)) return '';
      const yy = parseInt(yymmdd.substring(0, 2), 10);
      const mm = yymmdd.substring(2, 4);
      const dd = yymmdd.substring(4, 6);
      const mNum = parseInt(mm, 10);
      const dNum = parseInt(dd, 10);
      if (mNum < 1 || mNum > 12 || dNum < 1 || dNum > 31) return '';
      const currentYY = new Date().getFullYear() % 100;
      const year = yy > currentYY ? 1900 + yy : 2000 + yy;
      return `${year}-${mm}-${dd}`;
    };

    const textUpper = rawText.toUpperCase();
    const cleanText = textUpper.replace(/[KC\(\)\[\]\{\}]/g, '<');

    // --- STRATEGY 1: MRZ Parsing ---
    // Look for lines containing <<
    const lines = cleanText.split('\n').map(l => l.replace(/\s/g, ''));
    for (const line of lines) {
      // MRZ Line 1: P<IDNNAME<<SURNAME or loose <<
      if (line.includes('<<')) {
        const parts = line.split('<<');
        if (parts.length >= 2) {
          let part0 = parts[0];
          // Strip country code if present: P<IDN, P<MYS, etc
          part0 = part0.replace(/^P<?[A-Z]{3}/, '');
          const surname = part0.replace(/</g, ' ').trim();
          const givenName = parts[1].replace(/</g, ' ').trim();
          if (surname.length > 1 || givenName.length > 1) {
            fullName = `${givenName} ${surname}`.replace(/[^A-Z\s]/g, '').trim();
          }
        }
      }
      
      // MRZ Line 2: Passport number followed by digits/country and DOB
      const passMatch = line.match(/([A-Z0-9]{7,9})<*([0-9])[A-Z]{3}([0-9]{6})/);
      if (passMatch) {
        if (!passportNumber) passportNumber = passMatch[1].replace(/</g, '').trim();
        if (!dateOfBirth && passMatch[3]) {
          dateOfBirth = parseYYMMDD(passMatch[3]);
        }
      }
    }

    // --- STRATEGY 2: Visual Inspection Zone (VIZ) Text Matching ---
    // Look for passport number pattern like A1234567, B1234567, etc (1-2 letters + 7-8 digits)
    if (!passportNumber) {
      const matchPass = textUpper.match(/(?:PASSPORT|PASPOR|NO|NUMBER)?[\s.:]*([A-Z][0-9]{7,8})\b/);
      if (matchPass && matchPass[1]) {
        passportNumber = matchPass[1];
      }
    }

    // Look for name field: "NAMA LENGKAP / FULL NAME" or "NAME"
    if (!fullName) {
      const nameMatch = textUpper.match(/(?:NAMA|NAME|FULL NAME)[\s.:]+([A-Z\s]{4,30})(?:\n|$)/);
      if (nameMatch && nameMatch[1]) {
        const candidate = nameMatch[1].trim();
        if (!candidate.includes('REPUBLIK') && !candidate.includes('INDONESIA')) {
          fullName = candidate;
        }
      }
    }

    // --- STRATEGY 3: Robust Date of Birth Detection ---
    // Rule A: Direct MRZ pattern: 6 digits (valid YYMMDD) + optional check digit + F or M
    if (!dateOfBirth) {
      const mrzDobMatch = textUpper.match(/([0-9]{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12][0-9]|3[01]))[0-9]?(F|M)/);
      if (mrzDobMatch) {
        dateOfBirth = parseYYMMDD(mrzDobMatch[1]);
        if (mrzDobMatch[2] === 'F') gender = 'Female';
        else if (mrzDobMatch[2] === 'M') gender = 'Male';
      }
    }

    // Rule B: MRZ near country code: e.g. IDN900504 or 1DN900504
    if (!dateOfBirth) {
      const nearCountry = textUpper.match(/(?:IDN|1DN|ION|MYS|SGP)[<0-9]*([0-9]{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12][0-9]|3[01]))/);
      if (nearCountry) {
        dateOfBirth = parseYYMMDD(nearCountry[1]);
      }
    }

    // Rule C: Visual text bilingual date: e.g. "04 MAY / MEI 1990" or "15 JAN 1995"
    if (!dateOfBirth) {
      const monthMap: Record<string, string> = {
        JAN: '01', FEB: '02', MAR: '03', APR: '04', MAY: '05', MEI: '05',
        JUN: '06', JUL: '07', AUG: '08', AGU: '08', SEP: '09', OCT: '10', OKT: '10',
        NOV: '11', DEC: '12', DES: '12'
      };
      // Matches bilingual dates like "04 MAY / MEI 1990"
      const bilingualMatch = textUpper.match(/([0-3]?[0-9])[\s\-\/]+(JAN|FEB|MAR|APR|MAY|MEI|JUN|JUL|AUG|AGU|SEP|OCT|OKT|NOV|DEC|DES)(?:[\s\-\/]+(?:JAN|FEB|MAR|APR|MAY|MEI|JUN|JUL|AUG|AGU|SEP|OCT|OKT|NOV|DEC|DES))?[\s\-\/]+(19[4-9][0-9]|20[0-2][0-9])/);
      if (bilingualMatch) {
        const dd = bilingualMatch[1].padStart(2, '0');
        const mm = monthMap[bilingualMatch[2]] || '01';
        const yyyy = bilingualMatch[3];
        dateOfBirth = `${yyyy}-${mm}-${dd}`;
      } else {
        // Numeric date format: 04/05/1990 or 04-05-1990
        const numDateMatch = textUpper.match(/([0-3]?[0-9])[\/\-\.](0[1-9]|1[0-2])[\/\-\.](19[4-9][0-9]|20[0-2][0-9])/);
        if (numDateMatch) {
          const dd = numDateMatch[1].padStart(2, '0');
          const mm = numDateMatch[2].padStart(2, '0');
          const yyyy = numDateMatch[3];
          dateOfBirth = `${yyyy}-${mm}-${dd}`;
        }
      }
    }

    // Nationality
    if (textUpper.includes('MALAYSIA') || textUpper.includes('MYS')) nationality = 'MALAYSIA';
    else if (textUpper.includes('SINGAPORE') || textUpper.includes('SGP')) nationality = 'SINGAPORE';
    else if (textUpper.includes('BRUNEI') || textUpper.includes('BRN')) nationality = 'BRUNEI';
    else if (textUpper.includes('INDONESIA') || textUpper.includes('IDN')) nationality = 'INDONESIA';

    // Gender
    if (textUpper.match(/\b(P|F|FEMALE|PEREMPUAN)\b/)) gender = 'Female';
    else if (textUpper.match(/\b(L|M|MALE|LAKI)\b/)) gender = 'Male';
    else gender = 'Male';

    if (fullName || passportNumber || dateOfBirth) {
      return { fullName, passportNumber, nationality, gender, dateOfBirth };
    }

    return null;
  };

  const applyDetectedData = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (detectedData) {
      try {
        onScan(detectedData);
      } catch (err) {
        console.error('Failed to send OCR data to form:', err);
      }
    }
    closeModal();
  };

  const openModal = () => {
    setIsOpen(true);
    initSystem();
  };

  const closeModal = () => {
    setIsOpen(false);
    setPreviewImage(null);
    setDetectedData(null);
    isScanningActive.current = false;
    clearTimeout(scanTimerRef.current);
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      isScanningActive.current = false;
      clearTimeout(scanTimerRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (workerRef.current) {
        workerRef.current.terminate().catch(() => {});
        workerRef.current = null;
      }
    };
  }, []);

  return (
    <>
      <button 
        type="button" 
        onClick={openModal} 
        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm transition-colors"
      >
        <Scan className="w-4 h-4" /> AUTO-SCAN PASPOR
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b bg-slate-50 shrink-0">
              <h2 className="font-bold text-slate-800 flex items-center gap-2 text-sm md:text-base">
                <Scan className="w-5 h-5 text-emerald-600" /> Pemindai Paspor (Kamera / Upload)
              </h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Body */}
            <div className="p-4 md:p-6 space-y-4 overflow-y-auto">
              
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs font-semibold flex items-start gap-2 border border-red-100">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* View 1: Image Preview if taken or uploaded */}
              {previewImage ? (
                <div className="space-y-3">
                  <div className="relative rounded-xl overflow-hidden bg-slate-900 aspect-video flex items-center justify-center border-2 border-slate-300">
                    <img src={previewImage} alt="Paspor" className="max-h-full object-contain" />
                    {isProcessing && (
                      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center text-white">
                        <Loader2 className="w-8 h-8 animate-spin mb-2 text-emerald-400" />
                        <span className="text-xs font-bold">Membaca Data Paspor...</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <button 
                      type="button" 
                      onClick={() => { setPreviewImage(null); setDetectedData(null); isScanningActive.current = true; scheduleNextScan(); }} 
                      className="text-xs font-bold text-slate-600 hover:text-slate-800 flex items-center gap-1.5 px-3 py-2 bg-slate-100 rounded-lg hover:bg-slate-200"
                    >
                      <Camera className="w-4 h-4" /> Buka Kamera Lagi
                    </button>
                  </div>
                </div>
              ) : (
                /* View 2: Live Camera View */
                <div className="space-y-3">
                  <div className="relative rounded-xl overflow-hidden bg-slate-950 aspect-video flex items-center justify-center border-2 border-slate-800 shadow-inner">
                    <video 
                      ref={setVideoRef} 
                      autoPlay 
                      playsInline 
                      muted 
                      className="w-full h-full object-cover" 
                    />
                    
                    {/* Visual Guideline Box */}
                    <div className="absolute inset-x-6 bottom-4 h-24 border-2 border-dashed border-emerald-400/80 bg-emerald-400/10 rounded-lg flex items-center justify-center pointer-events-none">
                      <span className="text-[11px] font-bold text-emerald-300 bg-slate-900/80 px-3 py-1 rounded-full shadow">
                        Posisikan Halaman / MRZ Paspor di Sini
                      </span>
                    </div>

                    {/* Live Scanning Status */}
                    <div className="absolute top-3 right-3 flex items-center gap-2 bg-slate-900/80 px-2.5 py-1 rounded-full border border-slate-700">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                      <span className="text-[10px] text-white font-bold tracking-wider">AUTO-DETECT ON</span>
                    </div>
                  </div>

                  {/* Manual Capture Button */}
                  <button 
                    type="button" 
                    onClick={captureCurrentFrame} 
                    className="w-full bg-navy hover:bg-navy-dark text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow"
                  >
                    <Camera className="w-4 h-4" /> AMBIL FOTO PASPOR INI
                  </button>
                </div>
              )}

              {/* Detected Results Card */}
              {detectedData && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wider">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Data Berhasil Ditemukan!
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                    <div>
                      <span className="text-slate-500 font-semibold block">Nomor Paspor:</span>
                      <span className="font-bold text-slate-800 text-sm font-mono">{detectedData.passportNumber || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-semibold block">Kewarganegaraan:</span>
                      <span className="font-bold text-slate-800 text-sm">{detectedData.nationality || '-'}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-500 font-semibold block">Nama Lengkap:</span>
                      <span className="font-bold text-slate-800 text-sm uppercase">{detectedData.fullName || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-semibold block">Tanggal Lahir:</span>
                      <input 
                        type="date" 
                        value={detectedData.dateOfBirth || ''} 
                        onChange={(e) => setDetectedData({ ...detectedData, dateOfBirth: e.target.value })}
                        className="font-bold text-slate-800 text-xs bg-white border border-slate-300 rounded px-2 py-1 mt-0.5 w-full outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <span className="text-slate-500 font-semibold block">Jenis Kelamin:</span>
                      <select 
                        value={detectedData.gender || 'Male'} 
                        onChange={(e) => setDetectedData({ ...detectedData, gender: e.target.value })}
                        className="font-bold text-slate-800 text-xs bg-white border border-slate-300 rounded px-2 py-1 mt-0.5 w-full outline-none focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="Male">Laki-laki (Male)</option>
                        <option value="Female">Perempuan (Female)</option>
                        <option value="Other">Lainnya</option>
                      </select>
                    </div>
                  </div>

                  <button 
                    type="button" 
                    onClick={applyDetectedData} 
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg text-xs flex items-center justify-center gap-2 shadow cursor-pointer transition-colors active:scale-[0.98]"
                  >
                    GUNAKAN DATA INI KE FORMULIR
                  </button>
                </div>
              )}

              {/* File Upload Option */}
              <div className="pt-2 border-t border-slate-100">
                <label className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 hover:border-slate-300 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs">
                  <Upload className="w-4 h-4 text-slate-500" /> PILIH FOTO DARI LAPTOP / HP
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>

            </div>

          </div>
        </div>
      )}
    </>
  );
}
