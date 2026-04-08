'use client';

import React, { useState } from 'react';
import { Plus, Search, Phone, X, Check, ChevronDown, Loader2 } from 'lucide-react';

type Status = 'Pending' | 'Confirmed' | 'Completed' | 'Canceled';

interface Booking {
  id: number;
  name: string;
  service: string;
  date: string;
  time: string;
  phone: string;
  status: Status;
  price: number;
}

const services = [
  { name: 'Signature Massage', duration: '90m', price: 250000 },
  { name: 'Traditional Javanese', duration: '60m', price: 150000 },
  { name: 'Foot Reflexology', duration: '60m', price: 120000 },
  { name: 'Aromatherapy', duration: '90m', price: 275000 },
  { name: 'LactaFlow Therapy', duration: '60m', price: 200000 },
];

// Demo data
const initialBookings: Booking[] = [
  { id: 1, name: 'Ibu Rina', service: 'Signature Massage', date: '2026-04-08', time: '09:00', phone: '081234567890', status: 'Confirmed', price: 250000 },
  { id: 2, name: 'Bu Sari', service: 'Foot Reflexology', date: '2026-04-08', time: '11:30', phone: '081298765432', status: 'Confirmed', price: 120000 },
  { id: 3, name: 'Ibu Dewi', service: 'Traditional Javanese', date: '2026-04-08', time: '14:00', phone: '082112345678', status: 'Pending', price: 150000 },
  { id: 4, name: 'Ibu Mega', service: 'Aromatherapy', date: '2026-04-09', time: '10:00', phone: '085612349876', status: 'Pending', price: 275000 },
  { id: 5, name: 'Mbak Tari', service: 'Signature Massage', date: '2026-04-07', time: '13:00', phone: '089812345678', status: 'Completed', price: 250000 },
];

const statusOrder: Status[] = ['Pending', 'Confirmed', 'Completed', 'Canceled'];

const statusStyle: Record<Status, string> = {
  Pending: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800',
  Confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800',
  Completed: 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700',
  Canceled: 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800',
};

const tabs: { label: string; value: Status | 'Semua' }[] = [
  { label: 'Semua', value: 'Semua' },
  { label: 'Pending', value: 'Pending' },
  { label: 'Confirmed', value: 'Confirmed' },
  { label: 'Completed', value: 'Completed' },
  { label: 'Canceled', value: 'Canceled' },
];

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [activeTab, setActiveTab] = useState<Status | 'Semua'>('Semua');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [statusPopup, setStatusPopup] = useState<number | null>(null);

  // Form state
  const [form, setForm] = useState({
    name: '', phone: '', serviceIdx: 0, date: '', time: '',
  });
  const [saving, setSaving] = useState(false);

  const filtered = bookings.filter(b => {
    const matchTab = activeTab === 'Semua' || b.status === activeTab;
    const matchSearch = b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.service.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const changeStatus = (id: number, status: Status) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
    setStatusPopup(null);
  };

  const handleAdd = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 600)); // simulate async
    const svc = services[form.serviceIdx];
    const newBooking: Booking = {
      id: Date.now(),
      name: form.name,
      phone: form.phone,
      service: svc.name,
      date: form.date,
      time: form.time,
      status: 'Pending',
      price: svc.price,
    };
    setBookings(prev => [newBooking, ...prev]);
    setShowForm(false);
    setSaving(false);
    setForm({ name: '', phone: '', serviceIdx: 0, date: '', time: '' });
  };

  const formatRp = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;
  const formatDate = (d: string) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
          {tabs.map(t => (
            <button
              key={t.value}
              onClick={() => setActiveTab(t.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${activeTab === t.value ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 sm:max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari nama atau layanan..."
            className="admin-input pl-8 py-2 text-xs"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800 text-left">
                <th className="px-4 py-3 text-xs font-medium text-zinc-500 dark:text-zinc-400">Pelanggan</th>
                <th className="px-4 py-3 text-xs font-medium text-zinc-500 dark:text-zinc-400 hidden sm:table-cell">Layanan</th>
                <th className="px-4 py-3 text-xs font-medium text-zinc-500 dark:text-zinc-400 hidden md:table-cell">Tanggal & Jam</th>
                <th className="px-4 py-3 text-xs font-medium text-zinc-500 dark:text-zinc-400 hidden lg:table-cell">Harga</th>
                <th className="px-4 py-3 text-xs font-medium text-zinc-500 dark:text-zinc-400">Status</th>
                <th className="px-4 py-3 text-xs font-medium text-zinc-500 dark:text-zinc-400">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-zinc-400">
                    Tidak ada data booking.
                  </td>
                </tr>
              ) : filtered.map(b => (
                <tr key={b.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-zinc-900 dark:text-white">{b.name}</p>
                    <p className="text-xs text-zinc-400">{b.phone}</p>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <p className="text-zinc-700 dark:text-zinc-300">{b.service}</p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <p className="text-zinc-700 dark:text-zinc-300">{formatDate(b.date)}</p>
                    <p className="text-xs text-zinc-400">{b.time}</p>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <p className="text-zinc-700 dark:text-zinc-300 font-mono text-xs">{formatRp(b.price)}</p>
                  </td>
                  <td className="px-4 py-3 relative">
                    <button
                      onClick={() => setStatusPopup(statusPopup === b.id ? null : b.id)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusStyle[b.status]}`}
                    >
                      {b.status} <ChevronDown size={11} />
                    </button>
                    {statusPopup === b.id && (
                      <div className="absolute left-0 top-10 z-10 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-lg py-1 min-w-36">
                        {statusOrder.map(s => (
                          <button
                            key={s}
                            onClick={() => changeStatus(b.id, s)}
                            className={`w-full text-left px-3 py-2 text-xs font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-2 ${b.status === s ? 'text-earth-primary' : 'text-zinc-700 dark:text-zinc-300'}`}
                          >
                            {b.status === s && <Check size={12} />}
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={`https://wa.me/${b.phone.replace(/^0/, '62')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                      WA
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Booking Slide Panel */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end p-0 sm:p-6">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowForm(false)} />
          <div className="relative w-full sm:max-w-sm bg-white dark:bg-zinc-900 rounded-t-2xl sm:rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 space-y-4 z-10">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-zinc-900 dark:text-white">Tambah Booking</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-zinc-500 mb-1 block">Nama Pelanggan</label>
                <input
                  className="admin-input"
                  placeholder="Ibu Rina"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-500 mb-1 block">No. WhatsApp</label>
                <input
                  className="admin-input"
                  placeholder="08xxxxxxxxxx"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-500 mb-1 block">Layanan</label>
                <select
                  className="admin-input"
                  value={form.serviceIdx}
                  onChange={e => setForm(f => ({ ...f, serviceIdx: Number(e.target.value) }))}
                >
                  {services.map((s, i) => (
                    <option key={i} value={i}>{s.name} — {s.duration} — Rp {s.price.toLocaleString('id-ID')}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-zinc-500 mb-1 block">Tanggal</label>
                  <input
                    type="date"
                    className="admin-input"
                    value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-500 mb-1 block">Jam</label>
                  <input
                    type="time"
                    className="admin-input"
                    value={form.time}
                    onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowForm(false)} className="admin-btn-ghost flex-1 justify-center">Batal</button>
              <button
                onClick={handleAdd}
                disabled={saving || !form.name || !form.date}
                className="admin-btn-primary flex-1 justify-center disabled:opacity-50"
              >
                {saving ? <><Loader2 size={14} className="animate-spin" /> Menyimpan</> : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
