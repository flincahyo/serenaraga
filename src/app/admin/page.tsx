'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, User, ArrowRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Fungsi ini akan segera aktif setelah integrasi Supabase selesai!');
  };

  return (
    <main className="min-h-screen bg-bg-cream flex items-center justify-center p-6 bg-[url('/hero-bg.png')] bg-cover bg-fixed">
      <div className="absolute inset-0 bg-white/90 backdrop-blur-sm"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md bg-white p-12 rounded-[3rem] shadow-2xl border border-earth-primary/10"
      >
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-earth-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-earth-primary">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-3xl font-serif font-bold text-text-primary">Admin Panel</h1>
          <p className="text-sm text-text-secondary mt-2">Selamat datang kembali, Admin SerenaRaga.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-black text-text-secondary/60 ml-4">Email Address</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-earth-primary/40" size={20} />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@serenaraga.com"
                className="w-full pl-12 pr-4 py-4 bg-bg-cream border border-earth-primary/5 rounded-2xl focus:ring-2 focus:ring-earth-primary/20 outline-none transition-all text-sm"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-black text-text-secondary/60 ml-4">Security Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-earth-primary/40" size={20} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-12 pr-4 py-4 bg-bg-cream border border-earth-primary/5 rounded-2xl focus:ring-2 focus:ring-earth-primary/20 outline-none transition-all text-sm"
                required
              />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-earth-primary text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-earth-dark transition-all transform hover:-translate-y-1 shadow-lg"
          >
            Masuk Sekarang <ArrowRight size={18} />
          </button>
        </form>

        <div className="mt-12 text-center">
          <Link href="/" className="text-xs text-text-secondary/40 hover:text-earth-primary transition-colors uppercase tracking-[0.2em] font-bold">
            &larr; Kembali ke Beranda
          </Link>
        </div>
      </motion.div>
    </main>
  );
}
