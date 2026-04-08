'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, MessageCircle, Loader2, X, Check, ChevronDown, Search } from 'lucide-react';
import { createClient } from '@/lib/supabase';

type Booking = {
  id: string;
  created_at: string;
  customer_name: string;
  phone: string;
  service_name: string;
  booking_date: string;
  booking_time: string;
  price: number;
  status: string;
  notes: string;
};

type Service = { id: string; name: string; price: number; category: string; };

const STATUS_OPTIONS = ['Pending', 'Confirmed', 'Completed', 'Canceled'];
const STATUS_STYLES: Record<string, string> = {
  Pending:   'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-800',
  Confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800',
  Completed: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800',
  Canceled:  'bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700',
};

const formatDate = (d: string) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
const formatRp = (n: number) => `Rp ${Number(n).toLocaleString('id-ID')}`;

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    customer_name: '', phone: '', service_name: '', booking_date: '',
    booking_time: '', price: 0, status: 'Pending', notes: '',
  });

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [{ data: b }, { data: s }] = await Promise.all([
      supabase.from('bookings').select('*').order('booking_date', { ascending: false }).order('created_at', { ascending: false }),
      supabase.from('services').select('id, name, price, category').order('category').order('sort_order'),
    ]);
    if (b) setBookings(b);
    if (s) setServices(s);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('bookings').update({ status }).eq('id', id);
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
  };

  const addBooking = async () => {
    setSaving(true);
    await supabase.from('bookings').insert(form);
    await fetchData();
    setShowForm(false);
    setForm({ customer_name: '', phone: '', service_name: '', booking_date: '', booking_time: '', price: 0, status: 'Pending', notes: '' });
    setSaving(false);
  };

  const onServiceSelect = (name: string) => {
    const svc = services.find(s => s.name === name);
    setForm(f => ({ ...f, service_name: name, price: svc?.price ?? 0 }));
  };

  const sendWA = (b: Booking) => {
    const msg = `Halo ${b.customer_name}, konfirmasi booking SerenaRaga:\n📅 ${formatDate(b.booking_date)} pukul ${b.booking_time}\n💆 ${b.service_name}\n💰 ${formatRp(b.price)}\nTerima kasih! 🙏`;
    window.open(`https://wa.me/${b.phone?.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const filtered = bookings
    .filter(b => filterStatus === 'Semua' || b.status === filterStatus)
    .filter(b => !search || b.customer_name.toLowerCase().includes(search.toLowerCase()) || b.service_name?.toLowerCase().includes(search.toLowerCase()));

  const counts = STATUS_OPTIONS.reduce((acc, s) => ({ ...acc, [s]: bookings.filter(b => b.status === s).length }), {} as Record<string, number>);

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">Bookings</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">{bookings.length} total pesanan</p>
        </div>
        <button onClick={() => setShowForm(true)} className="admin-btn-primary">
          <Plus size={16} /> Tambah Booking
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {['Semua', ...STATUS_OPTIONS].map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filterStatus === s
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            {s} {s !== 'Semua' && counts[s] !== undefined ? `(${counts[s]})` : s === 'Semua' ? `(${bookings.length})` : ''}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          className="admin-input pl-9"
          placeholder="Cari nama atau layanan..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Bookings Table */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-earth-primary" size={24} /></div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-sm text-zinc-400">Tidak ada booking ditemukan.</div>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filtered.map(b => (
                <div key={b.id} className="px-4 py-3 flex items-center gap-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-zinc-900 dark:text-white">{b.customer_name}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">{b.phone}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{b.service_name} · {b.booking_date ? formatDate(b.booking_date) : '-'} {b.booking_time ?? ''}</p>
                  </div>
                  <p className="text-sm font-mono text-zinc-700 dark:text-zinc-300 shrink-0 hidden md:block">{formatRp(b.price ?? 0)}</p>
                  {/* Status Dropdown */}
                  <div className="relative shrink-0">
                    <select
                      value={b.status}
                      onChange={e => updateStatus(b.id, e.target.value)}
                      className={`appearance-none pl-3 pr-7 py-1 rounded-full border text-xs font-semibold cursor-pointer transition-colors ${STATUS_STYLES[b.status] ?? STATUS_STYLES.Pending}`}
                    >
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                  </div>
                  <button onClick={() => sendWA(b)} className="shrink-0 p-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-500" title="Kirim WhatsApp">
                    <MessageCircle size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Booking Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowForm(false)} />
          <div className="relative w-full sm:max-w-md bg-white dark:bg-zinc-900 rounded-t-2xl sm:rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 space-y-3 z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-zinc-900 dark:text-white">Tambah Booking</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400"><X size={16} /></button>
            </div>

            <input className="admin-input" placeholder="Nama Pelanggan" value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))} />
            <input className="admin-input" placeholder="Nomor WhatsApp (62xxx)" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />

            <select className="admin-input" value={form.service_name} onChange={e => onServiceSelect(e.target.value)}>
              <option value="">-- Pilih Layanan --</option>
              {['packages', 'services', 'reflexology', 'addons'].map(cat => (
                <optgroup key={cat} label={cat.charAt(0).toUpperCase() + cat.slice(1)}>
                  {services.filter(s => s.category === cat).map(s => (
                    <option key={s.id} value={s.name}>{s.name} — {formatRp(s.price)}</option>
                  ))}
                </optgroup>
              ))}
            </select>

            <div className="grid grid-cols-2 gap-3">
              <input type="date" className="admin-input" value={form.booking_date} onChange={e => setForm(f => ({ ...f, booking_date: e.target.value }))} />
              <input type="time" className="admin-input" value={form.booking_time} onChange={e => setForm(f => ({ ...f, booking_time: e.target.value }))} />
            </div>
            <input type="number" className="admin-input font-mono" placeholder="Harga (Rp)" value={form.price || ''} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} />
            <select className="admin-input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <textarea className="admin-input resize-none" rows={2} placeholder="Catatan (opsional)" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />

            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowForm(false)} className="admin-btn-ghost flex-1 justify-center">Batal</button>
              <button onClick={addBooking} disabled={saving || !form.customer_name} className="admin-btn-primary flex-1 justify-center disabled:opacity-50">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
