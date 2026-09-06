'use client';
import { useRef, useState, useCallback } from 'react';
import { Camera, Image as ImageIcon, RotateCcw, Check } from 'lucide-react';

export default function WebcamCapture({ onCapture }: { onCapture: (base64: string) => void }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImg, setCapturedImg] = useState<string | null>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setStream(mediaStream);
    } catch (err) {
      alert('Kamera tidak dapat diakses.');
    }
  };

  const setVideoRef = useCallback((node: HTMLVideoElement | null) => {
    videoRef.current = node;
    if (node && stream) {
      node.srcObject = stream;
      node.play().catch(e => console.log('Video play error:', e));
    }
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImg(dataUrl);
      }
    }
  }, []);

  const resetPhoto = () => {
    setCapturedImg(null);
  };

  const usePhoto = () => {
    if (capturedImg) {
      onCapture(capturedImg);
      stream?.getTracks().forEach(t => t.stop());
      setStream(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setCapturedImg(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="border border-slate-200 bg-slate-50 p-4 rounded-xl flex flex-col items-center justify-center space-y-4">
      {!stream && !capturedImg && (
        <div className="flex flex-col items-center gap-3 py-6">
          <button type="button" onClick={startCamera} className="bg-navy hover:bg-navy-dark text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2">
            <Camera className="w-4 h-4" /> BUKA KAMERA
          </button>
          <span className="text-xs text-slate-400 font-bold uppercase">ATAU</span>
          <label className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 cursor-pointer">
            <ImageIcon className="w-4 h-4" /> UPLOAD FOTO
            <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      )}
      {stream && !capturedImg && (
        <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden shadow-inner">
          <video ref={setVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
          <button type="button" onClick={capturePhoto} className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white text-navy-dark px-6 py-2.5 rounded-full font-bold shadow-xl hover:scale-105 active:scale-95 transition-transform">
            AMBIL FOTO
          </button>
        </div>
      )}
      {capturedImg && (
        <div className="relative w-full aspect-square md:aspect-video bg-slate-900 rounded-lg overflow-hidden flex justify-center items-center shadow-inner">
          <img src={capturedImg} alt="Preview" className="max-h-full object-contain" />
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
            <button type="button" onClick={resetPhoto} className="bg-slate-800 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-1 shadow-lg hover:bg-slate-700">
              <RotateCcw className="w-4 h-4" /> ULANGI
            </button>
            <button type="button" onClick={usePhoto} className="bg-emerald-600 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-1 shadow-lg hover:bg-emerald-700">
              <Check className="w-4 h-4" /> GUNAKAN FOTO
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
