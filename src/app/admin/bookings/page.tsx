'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, MessageCircle, Loader2, X, Check, ChevronDown, Search, Pencil, Trash2, AlertTriangle } from 'lucide-react';
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

const EMPTY_FORM = { customer_name: '', phone: '62', service_name: '', booking_date: '', booking_time: '', price: 0, status: 'Pending', notes: '' };

const formatDate = (d: string) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
const formatRp   = (n: number) => `Rp ${Number(n).toLocaleString('id-ID')}`;

export default function BookingsPage() {
  const [bookings, setBookings]       = useState<Booking[]>([]);
  const [services, setServices]       = useState<Service[]>([]);
  const [loading, setLoading]         = useState(true);
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [search, setSearch]           = useState('');
  const [showForm, setShowForm]       = useState(false);
  const [saving, setSaving]           = useState(false);
  const [editId, setEditId]           = useState<string | null>(null);
  const [deleteId, setDeleteId]       = useState<string | null>(null);
  const [deleting, setDeleting]       = useState(false);
  const [reminderTemplate, setReminderTemplate] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [{ data: b }, { data: s }, { data: settingsData }] = await Promise.all([
      supabase.from('bookings').select('*').order('booking_date', { ascending: false }).order('created_at', { ascending: false }),
      supabase.from('services').select('id, name, price, category').order('category').order('sort_order'),
      supabase.from('settings').select('value').eq('key', 'whatsapp_reminder_message').single(),
    ]);
    if (b) setBookings(b);
    if (s) setServices(s);
    if (settingsData) setReminderTemplate(settingsData.value);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('bookings').update({ status }).eq('id', id);
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
  };

  const openAdd = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (b: Booking) => {
    setEditId(b.id);
    setForm({
      customer_name: b.customer_name,
      phone: b.phone,
      service_name: b.service_name,
      booking_date: b.booking_date,
      booking_time: b.booking_time,
      price: b.price,
      status: b.status,
      notes: b.notes ?? '',
    });
    setShowForm(true);
  };

  // Hitung BHP aktual berdasarkan service_materials + global materials
  const calculateBhpCost = async (serviceName: string): Promise<number> => {
    const svc = services.find(s => s.name === serviceName);
    if (!svc) return 0;

    const [{ data: svcMats }, { data: globalMats }] = await Promise.all([
      supabase
        .from('service_materials')
        .select('qty_multiplier, material:materials(id,pack_price,customers_per_pack,is_global)')
        .eq('service_id', svc.id),
      supabase
        .from('materials')
        .select('id, pack_price, customers_per_pack')
        .eq('is_global', true),
    ]);

    // Supabase returns joined relations as arrays — cast via unknown to correct type
    type MatObj = { id: string; pack_price: number; customers_per_pack: number; is_global: boolean };
    type SvcMatRow = { qty_multiplier: number; material: MatObj | MatObj[] | null };
    type GlobalMatRow = { id: string; pack_price: number; customers_per_pack: number };

    // Helper: normalize material (single or array) → single object or null
    const getMat = (raw: MatObj | MatObj[] | null): MatObj | null => {
      if (!raw) return null;
      return Array.isArray(raw) ? (raw[0] ?? null) : raw;
    };

    const rows = (svcMats ?? []) as unknown as SvcMatRow[];

    // Collect IDs of global materials already included via service_materials
    const assignedGlobalIds = new Set(
      rows
        .map(sm => getMat(sm.material))
        .filter((m): m is MatObj => m !== null && m.is_global)
        .map(m => m.id)
    );

    let total = 0;

    // Bahan spesifik layanan (termasuk jika ada global yang di-assign manual)
    for (const sm of rows) {
      const m = getMat(sm.material);
      if (!m || m.customers_per_pack <= 0) continue;
      total += sm.qty_multiplier * (m.pack_price / m.customers_per_pack);
    }

    // Tambah bahan global yang belum ter-include (hindari hitung dobel)
    for (const gm of (globalMats ?? []) as unknown as GlobalMatRow[]) {
      if (assignedGlobalIds.has(gm.id)) continue;
      if (gm.customers_per_pack <= 0) continue;
      total += gm.pack_price / gm.customers_per_pack;
    }

    return Math.round(total);
  };

  const saveBooking = async () => {
    setSaving(true);
    const bhp_cost = form.service_name ? await calculateBhpCost(form.service_name) : 0;
    const payload = { ...form, bhp_cost };
    if (editId) {
      await supabase.from('bookings').update(payload).eq('id', editId);
    } else {
      await supabase.from('bookings').insert(payload);
    }
    await fetchData();
    setShowForm(false);
    setEditId(null);
    setForm(EMPTY_FORM);
    setSaving(false);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    await supabase.from('bookings').delete().eq('id', deleteId);
    setBookings(prev => prev.filter(b => b.id !== deleteId));
    setDeleteId(null);
    setDeleting(false);
  };

  const onServiceSelect = (name: string) => {
    const svc = services.find(s => s.name === name);
    setForm(f => ({ ...f, service_name: name, price: svc?.price ?? 0 }));
  };

  const sendWA = (b: Booking) => {
    const template = reminderTemplate ||
      'Halo {nama}, konfirmasi booking SerenaRaga:\n📅 {tanggal} pukul {waktu}\n💆 {layanan}\n💰 {harga}\nTerima kasih! 🙏';
    const msg = template
      .replace('{nama}', b.customer_name)
      .replace('{tanggal}', b.booking_date ? formatDate(b.booking_date) : '-')
      .replace('{waktu}', b.booking_time ?? '-')
      .replace('{layanan}', b.service_name ?? '-')
      .replace('{harga}', formatRp(b.price ?? 0));
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
        <button onClick={openAdd} className="admin-btn-primary">
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
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
        <input
          className="admin-input pl-10"
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
                <div key={b.id} className="px-4 py-3 flex items-center gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-zinc-900 dark:text-white">{b.customer_name}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">{b.phone}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{b.service_name} · {b.booking_date ? formatDate(b.booking_date) : '-'} {b.booking_time ? b.booking_time.slice(0, 5) : ''}</p>
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

                  {/* Actions */}
                  <button onClick={() => sendWA(b)} className="shrink-0 p-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-500" title="Kirim Reminder WA">
                    <MessageCircle size={16} />
                  </button>
                  <button onClick={() => openEdit(b)} className="shrink-0 p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 text-blue-500" title="Edit Booking">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => setDeleteId(b.id)} className="shrink-0 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-red-400" title="Hapus Booking">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Booking Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowForm(false)} />
          <div className="relative w-full sm:max-w-md bg-white dark:bg-zinc-900 rounded-t-2xl sm:rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 space-y-3 z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-zinc-900 dark:text-white">
                {editId ? 'Edit Booking' : 'Tambah Booking'}
              </h3>
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
              <button onClick={saveBooking} disabled={saving || !form.customer_name} className="admin-btn-primary flex-1 justify-center disabled:opacity-50">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                {editId ? 'Update' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteId(null)} />
          <div className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 z-10">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center">
                <AlertTriangle size={22} className="text-red-500" />
              </div>
              <h3 className="font-semibold text-zinc-900 dark:text-white">Hapus Booking?</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {bookings.find(b => b.id === deleteId)?.customer_name} — tindakan ini tidak bisa dibatalkan.
              </p>
              <div className="flex gap-3 w-full pt-2">
                <button onClick={() => setDeleteId(null)} className="admin-btn-ghost flex-1 justify-center">Batal</button>
                <button
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-60"
                >
                  {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
