'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, MessageCircle, Loader2, ChevronDown, Search, Pencil, Trash2, AlertTriangle, LayoutGrid, List } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useUser } from '@/lib/user-context';
import { AdminSkeleton } from '@/components/admin/AdminSkeleton';
import BookingFormModal from '@/components/admin/BookingFormModal';

type Booking = {
  id: string; created_at: string; customer_name: string; phone: string;
  service_name: string; booking_date: string; booking_time: string;
  price: number; status: string; notes: string; bhp_cost?: number;
  discount_total?: number; shared_discount_total?: number; final_price?: number; customer_id?: string;
};

type Service = { id: string; name: string; price: number; category: string; is_bundle?: boolean; bundle_child_ids?: string[] };

const STATUS_OPTIONS = ['Pending', 'Confirmed', 'Completed', 'Canceled'];
const STATUS_STYLES: Record<string, string> = {
  Pending:   'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-800',
  Confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800',
  Completed: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800',
  Canceled:  'bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700',
};

const formatDate = (d: string) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
const formatRp   = (n: number) => `Rp ${Number(n).toLocaleString('id-ID')}`;

export default function BookingsPage() {
  const { user } = useUser();
  const isOwner = user?.role !== 'cashier';

  const [bookings, setBookings]       = useState<Booking[]>([]);
  const [services, setServices]       = useState<Service[]>([]);
  const [therapists, setTherapists]   = useState<{id: string; name: string; commission_pct: number}[]>([]);
  const [customers, setCustomers]     = useState<{id: string; name: string; wa_number: string}[]>([]);
  const [loading, setLoading]         = useState(true);
  const [filterStatus, setFilterStatus] = useState('Hari Ini');
  const [search, setSearch]           = useState('');
  // BookingFormModal state
  const [showForm, setShowForm]   = useState(false);
  const [editId, setEditId]       = useState<string | null>(null);
  const [deleteId, setDeleteId]   = useState<string | null>(null);
  const [deleting, setDeleting]   = useState(false);

  const [reminderTemplate, setReminderTemplate] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');


  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [{ data: b }, { data: s }, { data: settingsData }, { data: t }, { data: c }] = await Promise.all([
      supabase.from('bookings').select('*').order('booking_date', { ascending: false }).order('created_at', { ascending: false }),
      supabase.from('services').select('id, name, price, category, is_bundle, bundle_child_ids, estimated_duration').order('category').order('sort_order'),
      supabase.from('settings').select('value').eq('key', 'whatsapp_reminder_message').single(),
      supabase.from('therapists').select('id, name, commission_pct').eq('is_active', true).order('name'),
      supabase.from('customers').select('id, name, wa_number').order('name', { ascending: true }),
    ]);
    if (b) setBookings(b);
    if (s) setServices(s);
    if (t) setTherapists(t);
    if (c) setCustomers(c);
    if (settingsData) setReminderTemplate(settingsData.value);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);


  // Hitung BHP aktual per layanan (used by updateStatus commission recalc)
  const calculateBhpCost = async (serviceName: string): Promise<number> => {
    const svc = services.find(s => s.name === serviceName);
    if (!svc) return 0;
    const [{ data: svcMats }, { data: globalMats }] = await Promise.all([
      supabase.from('service_materials').select('qty_multiplier, material:materials(id,pack_price,customers_per_pack,is_global)').eq('service_id', svc.id),
      supabase.from('materials').select('id, pack_price, customers_per_pack').eq('is_global', true),
    ]);
    type MatObj = { id: string; pack_price: number; customers_per_pack: number; is_global: boolean };
    type SvcMatRow = { qty_multiplier: number; material: MatObj | MatObj[] | null };
    type GlobalMatRow = { id: string; pack_price: number; customers_per_pack: number };
    const getMat = (raw: MatObj | MatObj[] | null): MatObj | null => Array.isArray(raw) ? (raw[0] ?? null) : raw ?? null;
    const rows = (svcMats ?? []) as unknown as SvcMatRow[];
    const assignedGlobalIds = new Set(rows.map(sm => getMat(sm.material)).filter((m): m is MatObj => m !== null && m.is_global).map(m => m.id));
    let total = 0;
    for (const sm of rows) { const m = getMat(sm.material); if (m && m.customers_per_pack > 0) total += sm.qty_multiplier * (m.pack_price / m.customers_per_pack); }
    for (const gm of (globalMats ?? []) as unknown as GlobalMatRow[]) { if (!assignedGlobalIds.has(gm.id) && gm.customers_per_pack > 0) total += gm.pack_price / gm.customers_per_pack; }
    return Math.round(total);
  };

  // EC#7: updateStatus recalculates commission when set to Completed
  const updateStatus = async (id: string, status: string) => {
    await supabase.from('bookings').update({ status }).eq('id', id);
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
    if (status === 'Completed') {
      const { data: items } = await supabase.from('booking_items').select('*, therapist_id').eq('booking_id', id);
      const { data: bk }    = await supabase.from('bookings').select('price, shared_discount_total').eq('id', id).single();
      if (items && bk) {
        const totalPrice = Number(bk.price) || 0;
        const sharedDisc = Number(bk.shared_discount_total) || 0;
        await Promise.all(items.map(async (item: any) => {
          if (!item.therapist_id) return;
          const t = therapists.find(x => x.id === item.therapist_id);
          const pct = t?.commission_pct ?? 30;
          const sharedDiscPct = totalPrice > 0 ? sharedDisc / totalPrice : 0;
          const earned = Math.round(Math.max(0, Number(item.price) * (1 - sharedDiscPct)) * pct / 100);
          await supabase.from('booking_items').update({ commission_earned: earned }).eq('id', item.id);
        }));
      }
    }
  };

  const openAdd = () => { setEditId(null); setShowForm(true); };
  const openEdit = (b: Booking) => { setEditId(b.id); setShowForm(true); };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const target = bookings.find(b => b.id === deleteId);
    if (target?.status === 'Completed') {
      const confirmed = window.confirm(`Booking ini berstatus COMPLETED dan komisi terapis mungkin sudah tercatat.\n\nMenghapus akan menyebabkan data laporan tidak balance.\n\nYakin ingin tetap menghapus?`);
      if (!confirmed) { setDeleteId(null); return; }
    }
    setDeleting(true);
    await supabase.from('bookings').delete().eq('id', deleteId);
    setBookings(prev => prev.filter(b => b.id !== deleteId));
    setDeleteId(null);
    setDeleting(false);
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

  const todayString    = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
  const tomorrowString = new Date(new Date().getTime() + 86400000).toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });

  const filtered = bookings
    .filter(b => {
      if (filterStatus === 'Semua') return true;
      if (filterStatus === 'Hari Ini') return b.booking_date === todayString;
      if (filterStatus === 'Besok') return b.booking_date === tomorrowString;
      return b.status === filterStatus;
    })
    .filter(b => !search ||
      b.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      b.service_name?.toLowerCase().includes(search.toLowerCase()));

  // Fix #7: bulk WA reminder for tomorrow's Confirmed bookings
  const tomorrowConfirmed = bookings.filter(b => b.booking_date === tomorrowString && b.status === 'Confirmed');
  const sendBulkReminder = () => {
    tomorrowConfirmed.forEach((b, i) => {
      setTimeout(() => sendWA(b), i * 600); // stagger 600ms to avoid popup blocker
    });
  };

  const counts = STATUS_OPTIONS.reduce((acc, s) => ({ ...acc, [s]: bookings.filter(b => b.status === s).length }), {} as Record<string, number>);
  const todayCount    = bookings.filter(b => b.booking_date === todayString).length;
  const tomorrowCount = bookings.filter(b => b.booking_date === tomorrowString).length;

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">Bookings</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">{bookings.length} total pesanan</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1 gap-0.5">
            <button onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-colors ${ viewMode === 'list' ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white' : 'text-zinc-400 hover:text-zinc-600' }`}>
              <List size={15} />
            </button>
            <button onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-md transition-colors ${ viewMode === 'kanban' ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white' : 'text-zinc-400 hover:text-zinc-600' }`}>
              <LayoutGrid size={15} />
            </button>
          </div>
          <button onClick={openAdd} className="admin-btn-primary">
            <Plus size={16} /> Tambah Booking
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {['Hari Ini', 'Besok', 'Semua', ...STATUS_OPTIONS].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filterStatus === s
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}>
            {s}{s === 'Hari Ini' ? ` (${todayCount})` : s === 'Besok' ? ` (${tomorrowCount})` : s !== 'Semua' && counts[s] !== undefined ? ` (${counts[s]})` : s === 'Semua' ? ` (${bookings.length})` : ''}
          </button>
        ))}
      </div>

      {/* Fix #7: Bulk WA Reminder for tomorrow's bookings */}
      {tomorrowConfirmed.length > 0 && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
          <div className="flex items-center gap-2">
            <MessageCircle size={14} className="text-emerald-600 shrink-0" />
            <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
              {tomorrowConfirmed.length} booking besok belum direminder
            </p>
          </div>
          <button onClick={sendBulkReminder}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg transition-colors">
            <MessageCircle size={12} /> Reminder Semua
          </button>
        </div>
      )}

      {/* Search — only in list mode */}
      {viewMode === 'list' && (
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          <input className="admin-input pl-10" placeholder="Cari nama atau layanan..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      )}

      {loading ? (
        <AdminSkeleton rows={5} />
      ) : viewMode === 'kanban' ? (
        // ── Kanban Board ──
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {STATUS_OPTIONS.map(status => {
            const KANBAN_HEADER: Record<string, string> = {
              Pending:   'border-amber-400 bg-amber-50 dark:bg-amber-950/20',
              Confirmed: 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20',
              Completed: 'border-blue-400 bg-blue-50 dark:bg-blue-950/20',
              Canceled:  'border-zinc-400 bg-zinc-100 dark:bg-zinc-800/50',
            };
            const KANBAN_DOT: Record<string, string> = {
              Pending: 'bg-amber-400', Confirmed: 'bg-emerald-400',
              Completed: 'bg-blue-400', Canceled: 'bg-zinc-400',
            };
            const colBookings = bookings
              .filter(b => b.status === status)
              .sort((a, b) => a.booking_date?.localeCompare(b.booking_date ?? '') ?? 0);
            return (
              <div key={status} className="space-y-2">
                {/* Column header */}
                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border-l-4 ${KANBAN_HEADER[status]}`}>
                  <span className={`w-2 h-2 rounded-full ${KANBAN_DOT[status]}`} />
                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-200">{status}</span>
                  <span className="ml-auto text-[10px] font-bold text-zinc-400">{colBookings.length}</span>
                </div>
                {/* Cards */}
                <div className="space-y-2 min-h-[80px]">
                  {colBookings.length === 0 && (
                    <div className="text-center py-6 text-[11px] text-zinc-300 dark:text-zinc-600">Kosong</div>
                  )}
                  {colBookings.map(b => (
                    <div key={b.id} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-3 shadow-sm hover:border-earth-primary/30 transition-colors group">
                      <div className="flex items-start justify-between gap-1 mb-2">
                        <p className="text-xs font-semibold text-zinc-900 dark:text-white leading-tight">{b.customer_name}</p>
                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button onClick={() => openEdit(b)} className="p-1 rounded text-blue-400 hover:text-blue-600"><Pencil size={11} /></button>
                          <button onClick={() => setDeleteId(b.id)} className="p-1 rounded text-red-300 hover:text-red-500"><Trash2 size={11} /></button>
                        </div>
                      </div>
                      <p className="text-[10px] text-zinc-500 mb-1 line-clamp-2">{b.service_name}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-zinc-400">
                          {b.booking_date ? formatDate(b.booking_date) : '-'}
                          {b.booking_time ? ` · ${b.booking_time.slice(0,5)}` : ''}
                        </span>
                        <span className="text-[10px] font-bold text-earth-primary">
                          {formatRp(b.final_price ?? b.price ?? 0)}
                        </span>
                      </div>
                      {/* Move status buttons */}
                      <div className="flex gap-1 mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                        {STATUS_OPTIONS.filter(s => s !== status).map(s => (
                          <button key={s} onClick={() => updateStatus(b.id, s)}
                            className="flex-1 text-[9px] font-semibold py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors truncate">
                            → {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // ── List View (original) ──
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
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {b.service_name} · {b.booking_date ? formatDate(b.booking_date) : '-'} {b.booking_time ? b.booking_time.slice(0, 5) : ''}
                    </p>
                  </div>
                  <div className="text-right hidden md:block shrink-0">
                    <p className="text-sm font-mono text-zinc-700 dark:text-zinc-300">{formatRp(b.final_price ?? b.price ?? 0)}</p>
                    {(b.discount_total ?? 0) > 0 && (
                      <p className="text-[10px] text-emerald-600 font-medium">-{formatRp(b.discount_total ?? 0)}</p>
                    )}
                  </div>
                  {/* Status */}
                  <div className="relative shrink-0">
                    <select value={b.status} onChange={e => updateStatus(b.id, e.target.value)}
                      className={`appearance-none pl-3 pr-7 py-1 rounded-full border text-xs font-semibold cursor-pointer transition-colors ${STATUS_STYLES[b.status] ?? STATUS_STYLES.Pending}`}>
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                  </div>
                  {/* Actions */}
                  <button onClick={() => sendWA(b)} className="shrink-0 p-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-500">
                    <MessageCircle size={16} />
                  </button>
                  <button onClick={() => openEdit(b)} className="shrink-0 p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 text-blue-500">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => setDeleteId(b.id)} className="shrink-0 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-red-400">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Modal */}
      <BookingFormModal
        open={showForm}
        onClose={() => { setShowForm(false); setEditId(null); }}
        onSaved={fetchData}
        editBookingId={editId}
        therapists={therapists}
        services={services}
        customers={customers}
        isOwner={isOwner}
      />

      {/* Delete Confirmation */}
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
                {bookings.find(b => b.id === deleteId)?.status === 'Completed' && (
                  <span className="block mt-1 text-red-500 font-medium text-xs">
                    ⚠ Booking ini sudah Completed — komisi terapis di laporan bisa tidak balance!
                  </span>
                )}
              </p>
              <div className="flex gap-3 w-full pt-2">
                <button onClick={() => setDeleteId(null)} className="admin-btn-ghost flex-1 justify-center">Batal</button>
                <button onClick={confirmDelete} disabled={deleting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-60">
                  {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
