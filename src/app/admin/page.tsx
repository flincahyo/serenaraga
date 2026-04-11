'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, ShieldCheck, UserCog } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useUser } from '@/lib/user-context';

export default function AdminLogin() {
  const router = useRouter();
  const { refreshUser } = useUser();

  const [tab, setTab] = useState<'owner' | 'cashier'>('owner');

  const [email, setEmail]         = useState('');
  const [ownerPw, setOwnerPw]     = useState('');
  const [showOwnerPw, setShowOwnerPw] = useState(false);

  const [username, setUsername]   = useState('');
  const [staffPw, setStaffPw]     = useState('');
  const [showStaffPw, setShowStaffPw] = useState(false);

  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  const handleOwnerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password: ownerPw });
    if (error) {
      setError('Email atau password salah. Silakan coba lagi.');
      setLoading(false);
    } else {
      await refreshUser();
      router.push('/admin/dashboard');
      router.refresh();
    }
  };

  const handleCashierLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');

    // Step 1: validasi username + bcrypt di server
    const res = await fetch('/api/staff/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password: staffPw }),
    });
    const data = await res.json();

    if (!res.ok || !data.success) {
      setError(data.error ?? 'Login gagal.');
      setLoading(false);
      return;
    }

    // Step 2: sign in ke Supabase Auth dengan pseudo-email agar akses DB normal
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: data.pseudo_email,
      password: data.plaintext_password,
    });

    if (authError) {
      setError('Akun kasir belum terdaftar di sistem auth. Hubungi Owner untuk membuat ulang akun.');
      setLoading(false);
      return;
    }

    await refreshUser();
    router.push('/admin/dashboard');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDFBF7] to-[#F5F0E1] dark:from-zinc-950 dark:to-zinc-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold tracking-tight dark:text-white font-sans">
            Serena<span className="text-earth-primary">Raga</span>
          </h1>
          <p className="text-sm text-zinc-400 mt-1.5 tracking-wide">Point of Sales & Management</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-xl p-1 mb-6 gap-1">
          <button
            onClick={() => { setTab('owner'); setError(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
              tab === 'owner'
                ? 'bg-earth-primary text-white shadow-sm'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
            }`}
          >
            <ShieldCheck size={15} /> Owner
          </button>
          <button
            onClick={() => { setTab('cashier'); setError(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
              tab === 'cashier'
                ? 'bg-earth-primary text-white shadow-sm'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
            }`}
          >
            <UserCog size={15} /> Kasir / Staff
          </button>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 shadow-sm space-y-5">

          {tab === 'owner' && (
            loading ? (
              <div className="space-y-4 animate-pulse pt-2 pb-1">
                 <div className="h-12 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl"></div>
                 <div className="h-12 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl"></div>
                 <div className="h-12 bg-earth-primary/40 rounded-xl mt-4"></div>
                 <p className="text-center text-xs text-earth-primary font-medium animate-pulse mt-2">Memverifikasi...</p>
              </div>
            ) : (
              <form onSubmit={handleOwnerLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Email</label>
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="owner@serenaraga.com" className="admin-input" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Password</label>
                  <div className="relative">
                    <input type={showOwnerPw ? 'text' : 'password'} required value={ownerPw}
                      onChange={e => setOwnerPw(e.target.value)} placeholder="••••••••" className="admin-input pr-10" />
                    <button type="button" onClick={() => setShowOwnerPw(!showOwnerPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">
                      {showOwnerPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                {error && <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg">{error}</p>}
                <button type="submit"
                  className="w-full admin-btn-primary justify-center py-3 mt-2">
                  Masuk sebagai Owner
                </button>
              </form>
            )
          )}

          {tab === 'cashier' && (
            loading ? (
              <div className="space-y-4 animate-pulse pt-2 pb-1">
                 <div className="h-12 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl"></div>
                 <div className="h-12 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl"></div>
                 <div className="h-12 bg-earth-primary/40 rounded-xl mt-4"></div>
                 <p className="text-center text-xs text-earth-primary font-medium animate-pulse mt-2">Memverifikasi...</p>
              </div>
            ) : (
              <form onSubmit={handleCashierLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Username</label>
                  <input type="text" required value={username} onChange={e => setUsername(e.target.value)}
                    placeholder="contoh: putri_kasir" className="admin-input" autoCapitalize="none" autoCorrect="off" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Password</label>
                  <div className="relative">
                    <input type={showStaffPw ? 'text' : 'password'} required value={staffPw}
                      onChange={e => setStaffPw(e.target.value)} placeholder="••••••••" className="admin-input pr-10" />
                    <button type="button" onClick={() => setShowStaffPw(!showStaffPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">
                      {showStaffPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                {error && <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg">{error}</p>}
                <button type="submit"
                  className="w-full admin-btn-primary justify-center py-3 mt-2">
                  Masuk sebagai Kasir
                </button>
              </form>
            )
          )}
        </div>

        <p className="text-center text-xs text-zinc-400 mt-6">
          &copy; {new Date().getFullYear()} SerenaRaga. All rights reserved.
        </p>
      </div>
    </div>
  );
}
