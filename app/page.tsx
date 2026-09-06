'use client';

import Link from 'next/link';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function LandingPage() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (date: Date, timeZone: string) => {
    return new Intl.DateTimeFormat('id-ID', {
      timeZone,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  };

  const myTime = time ? formatTime(time, 'Asia/Kuala_Lumpur') : 'Memuat waktu...';
  const idTime = time ? formatTime(time, 'Asia/Jakarta') : 'Memuat waktu...';

  return (
    <div className="min-h-screen relative flex flex-col justify-between overflow-hidden bg-slate-900 font-sans">
      
      {/* Background Image with Elegant Minimalist Overlay */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-105"
        style={{ backgroundImage: "url('/bg-plbn.jpg')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-navy-dark/95 via-navy-dark/80 to-navy-dark/20"></div>
        <div className="absolute inset-0 backdrop-blur-[2px] bg-black/20"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 px-8 py-8 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <img src="/logo.png" alt="Logo BNPP" className="w-14 h-14 object-contain drop-shadow-lg" />
          <div className="flex flex-col">
            <span className="text-white font-black tracking-widest text-xl leading-tight">PLBN ARUK</span>
            <span className="text-slate-300 text-xs font-semibold tracking-wider">REPUBLIK INDONESIA</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 px-8 md:px-16 lg:px-24 flex-1 flex flex-col justify-center max-w-4xl">
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]"></span>
            <span className="text-xs font-bold text-slate-100 tracking-widest uppercase">Portal Pelayanan Resmi</span>
          </div>

          <h1 className="text-6xl md:text-7xl font-black text-white tracking-tight leading-[1.1]">
            Visa On Arrival <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-300">
              System
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-300 max-w-2xl font-light leading-relaxed">
            Sistem pelayanan terpadu Visa On Arrival di Pos Lintas Batas Negara (PLBN) Aruk. 
            Cepat, aman, dan terintegrasi penuh.
          </p>

          <div className="pt-8">
            <Link 
              href="/login" 
              className="group inline-flex items-center gap-4 bg-white text-navy-dark hover:bg-slate-50 px-8 py-4 rounded-full font-bold text-sm tracking-widest uppercase transition-all duration-300 shadow-[0_10px_40px_rgba(255,255,255,0.15)] hover:shadow-[0_10px_50px_rgba(255,255,255,0.25)] hover:-translate-y-1"
            >
              MASUK KE SISTEM
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
            </Link>
          </div>
        </div>
      </main>

      {/* Footer with Dual Clocks */}
      <footer className="relative z-10 px-6 py-6 border-t border-white/10 flex flex-col xl:flex-row justify-between items-center gap-6 bg-black/30 backdrop-blur-md">
        
        {/* Malaysia Time (Left) */}
        <div className="flex items-center gap-3 text-slate-300 text-sm font-mono bg-white/5 px-5 py-3 rounded-xl border border-white/10 shadow-inner w-full xl:w-auto justify-center xl:justify-start">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse shadow-[0_0_8px_rgba(96,165,250,0.8)]"></span>
          <div>
            <div className="text-xs text-slate-400 mb-0.5 tracking-wider uppercase font-sans font-bold">Waktu Malaysia (MYT)</div>
            <div className="font-semibold text-white tracking-wide">{myTime}</div>
          </div>
        </div>

        {/* Center Copyright */}
        <p className="text-slate-400 text-sm font-medium tracking-wide text-center">
          &copy; {new Date().getFullYear()} Pos Lintas Batas Negara Aruk
        </p>

        {/* Indonesia Time (Right) */}
        <div className="flex items-center gap-3 text-slate-300 text-sm font-mono bg-white/5 px-5 py-3 rounded-xl border border-white/10 shadow-inner w-full xl:w-auto justify-center xl:justify-end text-left xl:text-right">
          <div className="hidden xl:block">
            <div className="text-xs text-slate-400 mb-0.5 tracking-wider uppercase font-sans font-bold">Waktu Indonesia (WIB)</div>
            <div className="font-semibold text-white tracking-wide">{idTime}</div>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse shadow-[0_0_8px_rgba(220,38,38,0.8)]"></span>
          <div className="xl:hidden">
            <div className="text-xs text-slate-400 mb-0.5 tracking-wider uppercase font-sans font-bold">Waktu Indonesia (WIB)</div>
            <div className="font-semibold text-white tracking-wide">{idTime}</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
