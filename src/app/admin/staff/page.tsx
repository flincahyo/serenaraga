'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, KeyRound, ToggleLeft, ToggleRight, Loader2, UserCog, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { useUser } from '@/lib/user-context';
import { useRouter } from 'next/navigation';
import { AdminSkeleton } from '@/components/admin/AdminSkeleton';

type StaffUser = {
  id: string;
  username: string;
  display_name: string;
  role: 'cashier' | 'owner';
  is_active: boolean;
  created_at: string;
  last_login: string | null;
};

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function StaffPage() {
  const { user } = useUser();
  const router = useRouter();
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // New staff form
  const [showAdd, setShowAdd] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPw, setShowNewPw] = useState(false);

  // Reset password
  const [resetId, setResetId] = useState<string | null>(null);
  const [resetPw, setResetPw] = useState('');
  const [showResetPw, setShowResetPw] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Redirect kalau bukan owner
  useEffect(() => {
    if (user && user.role !== 'owner') {
      router.replace('/admin/dashboard');
    }
  }, [user, router]);

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/staff/manage');
    if (res.ok) {
      const data = await res.json();
      setStaff(data.staff ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);

  const showFeedback = (msg: string, isError = false) => {
    if (isError) setError(msg);
    else setSuccess(msg);
    setTimeout(() => { setError(''); setSuccess(''); }, 3000);
  };

  const addStaff = async () => {
    if (!newUsername || !newPassword || !newDisplayName) {
      showFeedback('Semua field wajib diisi.', true); return;
    }
    setSaving(true);
    const res = await fetch('/api/staff/manage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: newUsername, password: newPassword, display_name: newDisplayName }),
    });
    const data = await res.json();
    if (!res.ok) { showFeedback(data.error ?? 'Gagal menambah staff.', true); }
    else {
      setStaff(prev => [...prev, data.staff]);
      setNewUsername(''); setNewPassword(''); setNewDisplayName('');
      setShowAdd(false);
      showFeedback(`Akun "${data.staff.display_name}" berhasil dibuat!`);
    }
    setSaving(false);
  };

  const toggleActive = async (s: StaffUser) => {
    const res = await fetch('/api/staff/manage', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: s.id, is_active: !s.is_active }),
    });
    if (res.ok) {
      setStaff(prev => prev.map(x => x.id === s.id ? { ...x, is_active: !x.is_active } : x));
      showFeedback(`Akun "${s.display_name}" ${!s.is_active ? 'diaktifkan' : 'dinonaktifkan'}.`);
    }
  };

  const resetPassword = async () => {
    if (!resetPw || !resetId) return;
    setSaving(true);
    const res = await fetch('/api/staff/manage', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: resetId, password: resetPw }),
    });
    if (res.ok) {
      setResetId(null); setResetPw('');
      showFeedback('Password berhasil direset!');
    } else {
      const d = await res.json(); showFeedback(d.error ?? 'Gagal reset.', true);
    }
    setSaving(false);
  };

  const deleteStaff = async (s: StaffUser) => {
    if (!confirm(`Hapus akun "${s.display_name}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    const res = await fetch('/api/staff/manage', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: s.id }),
    });
    if (res.ok) {
      setStaff(prev => prev.filter(x => x.id !== s.id));
      showFeedback(`Akun "${s.display_name}" dihapus.`);
    }
  };

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
            <UserCog size={20} className="text-earth-primary" /> Staff & Kasir
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Kelola akun kasir yang bisa login dengan username.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchStaff} className="admin-btn-ghost p-2.5" title="Refresh">
            <RefreshCw size={15} />
          </button>
          <button onClick={() => setShowAdd(true)} className="admin-btn-primary">
            <Plus size={15} /> Tambah Kasir
          </button>
        </div>
      </div>

      {/* Feedback */}
      {success && <p className="text-sm text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-4 py-2.5 rounded-lg">{success}</p>}
      {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/30 px-4 py-2.5 rounded-lg">{error}</p>}

      {/* Add form */}
      {showAdd && (
        <div className="admin-card space-y-3 border-earth-primary/30">
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Tambah Akun Kasir Baru</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-zinc-500 block mb-1">Nama Tampil</label>
              <input className="admin-input" placeholder="contoh: Putri Andini" value={newDisplayName} onChange={e => setNewDisplayName(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500 block mb-1">Username</label>
              <input className="admin-input font-mono" placeholder="contoh: putri_kasir" value={newUsername}
                onChange={e => setNewUsername(e.target.value.toLowerCase().replace(/\s/g, '_'))} autoCapitalize="none" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-zinc-500 block mb-1">Password Awal</label>
              <div className="relative">
                <input type={showNewPw ? 'text' : 'password'} className="admin-input pr-10" placeholder="Min. 6 karakter"
                  value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                <button type="button" onClick={() => setShowNewPw(!showNewPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">
                  {showNewPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={addStaff} disabled={saving} className="admin-btn-primary">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Buat Akun
            </button>
            <button onClick={() => setShowAdd(false)} className="admin-btn-ghost">Batal</button>
          </div>
        </div>
      )}

      {/* Staff List */}
      <div className="admin-card p-0 overflow-hidden">
        {loading ? (
          <AdminSkeleton rows={3} />
        ) : staff.length === 0 ? (
          <p className="text-center text-sm text-zinc-400 py-12 italic">Belum ada akun kasir. Tambah lewat tombol di atas.</p>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {staff.map(s => (
              <div key={s.id} className="flex items-center gap-4 px-5 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                {/* Avatar */}
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                  s.is_active ? 'bg-earth-primary/10 text-earth-primary' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
                }`}>
                  {s.display_name.charAt(0).toUpperCase()}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold dark:text-white">{s.display_name}</p>
                    {!s.is_active && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400">
                        NONAKTIF
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 font-mono">@{s.username}</p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">Login terakhir: {formatDate(s.last_login)}</p>
                </div>
                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {/* Toggle Active */}
                  <button onClick={() => toggleActive(s)} title={s.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                    className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                    {s.is_active
                      ? <ToggleRight size={18} className="text-emerald-500" />
                      : <ToggleLeft size={18} className="text-zinc-400" />}
                  </button>
                  {/* Reset Password */}
                  <button onClick={() => { setResetId(s.id); setResetPw(''); }}
                    title="Reset Password"
                    className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-amber-500 transition-colors">
                    <KeyRound size={16} />
                  </button>
                  {/* Delete */}
                  <button onClick={() => deleteStaff(s)} title="Hapus Akun"
                    className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-zinc-400 hover:text-red-500 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reset Password Modal */}
      {resetId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 w-full max-w-sm space-y-4 shadow-xl">
            <div className="flex items-center gap-2">
              <KeyRound size={18} className="text-amber-500" />
              <h3 className="text-sm font-semibold dark:text-white">Reset Password Kasir</h3>
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500 block mb-1">Password Baru</label>
              <div className="relative">
                <input type={showResetPw ? 'text' : 'password'} className="admin-input pr-10"
                  placeholder="Min. 6 karakter" value={resetPw} onChange={e => setResetPw(e.target.value)} />
                <button type="button" onClick={() => setShowResetPw(!showResetPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">
                  {showResetPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={resetPassword} disabled={saving || !resetPw} className="admin-btn-primary flex-1 justify-center">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />} Simpan Password
              </button>
              <button onClick={() => { setResetId(null); setResetPw(''); }} className="admin-btn-ghost">Batal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
