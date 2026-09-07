'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { loginAction } from './actions';
import { Shield, User, Lock, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Swal from 'sweetalert2';

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-navy-dark hover:bg-navy text-white font-bold py-3.5 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex justify-center items-center gap-2"
    >
      {pending ? <Loader2 className="animate-spin w-5 h-5" /> : 'LOGIN'}
    </button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useFormState(loginAction, null);
  const router = useRouter();

  useEffect(() => {
    if (state?.success) {
      Swal.fire({
        title: 'Berhasil Login!',
        text: 'Selamat datang di Sistem VOA PLBN Aruk.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      }).then(() => {
        router.push('/dashboard');
      });
    }
  }, [state, router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900 bg-gradient-to-br from-slate-900 via-navy-dark to-slate-900 relative overflow-hidden">
      
      {/* Background decoration */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '60px 60px' }}></div>

      <div className="w-full max-w-md rounded-2xl overflow-hidden relative z-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in duration-500">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-navy-dark px-8 py-8 text-center border-b border-white/10">
          <img src="/logo.png" alt="Logo BNPP" className="w-24 h-24 mx-auto mb-4 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" />
          <h1 className="text-2xl font-bold text-white tracking-wide">LOGIN SISTEM</h1>
          <p className="text-white/50 text-sm mt-1">VOA PLBN Aruk</p>
        </div>

        {/* Form Body */}
        <div className="bg-white p-8">
          {state?.error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              <span>{state.error}</span>
            </div>
          )}

          <form action={formAction} className="space-y-5">
            <div>
              <label className="block text-slate-600 text-xs font-bold uppercase tracking-wider mb-2">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="w-5 h-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  name="username"
                  required
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent focus:bg-white transition-all text-slate-800 font-medium"
                  placeholder="Masukkan username"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-600 text-xs font-bold uppercase tracking-wider mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  name="password"
                  required
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent focus:bg-white transition-all text-slate-800 font-medium"
                  placeholder="Masukkan password"
                />
              </div>
            </div>

            <div className="pt-2">
              <SubmitButton />
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <Link href="/" className="text-sm text-slate-400 hover:text-accent transition-colors font-medium">
              &larr; Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
