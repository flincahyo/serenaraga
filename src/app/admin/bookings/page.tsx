'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, MessageCircle, Loader2, X, Check, ChevronDown, Search, Pencil, Trash2, AlertTriangle, LayoutGrid, List } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useUser } from '@/lib/user-context';
import { AdminSkeleton } from '@/components/admin/AdminSkeleton';

type Booking = {
  id: string; created_at: string; customer_name: string; phone: string;
  service_name: string; booking_date: string; booking_time: string;
  price: number; status: string; notes: string; bhp_cost?: number;
  discount_total?: number; shared_discount_total?: number; final_price?: number; customer_id?: string;
};

type Service = { id: string; name: string; price: number; category: string; is_bundle?: boolean; bundle_child_ids?: string[] };
type BookingItem = { tempId: number; service_id: string; service_name: string; price: number; duration: string; therapist_id?: string; parent_bundle_name?: string; };

const STATUS_OPTIONS = ['Pending', 'Confirmed', 'Completed', 'Canceled'];
const STATUS_STYLES: Record<string, string> = {
  Pending:   'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-800',
  Confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800',
  Completed: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800',
  Canceled:  'bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700',
};
const CATEGORY_LABELS: Record<string, string> = {
  packages: 'Paket Massage', services: 'Massage Services',
  reflexology: 'Refleksi', addons: 'Add-On', split_items: 'Internal Split Item'
};

const EMPTY_FORM = { customer_name: '', phone: '62', booking_date: '', booking_time: '', status: 'Pending', notes: '', discount_total: 0, shared_discount_total: 0 };
const EMPTY_ITEM = (): BookingItem => ({ tempId: Date.now() + Math.random(), service_id: '', service_name: '', price: 0, duration: '', parent_bundle_name: '' });

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
  const [showNameSuggestions, setShowNameSuggestions] = useState(false);
  const [showPhoneSuggestions, setShowPhoneSuggestions] = useState(false);
  const [filterStatus, setFilterStatus] = useState('Hari Ini');
  const [search, setSearch]           = useState('');
  const [showForm, setShowForm]       = useState(false);
  const [saving, setSaving]           = useState(false);
  const [editId, setEditId]           = useState<string | null>(null);
  const [deleteId, setDeleteId]       = useState<string | null>(null);
  const [deleting, setDeleting]       = useState(false);
  const [reminderTemplate, setReminderTemplate] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [bookingItems, setBookingItems] = useState<BookingItem[]>([EMPTY_ITEM()]);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [{ data: b }, { data: s }, { data: settingsData }, { data: t }, { data: c }] = await Promise.all([
      supabase.from('bookings').select('*').order('booking_date', { ascending: false }).order('created_at', { ascending: false }),
      supabase.from('services').select('id, name, price, category, is_bundle, bundle_child_ids').order('category').order('sort_order'),
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

  // Hitung BHP aktual per layanan
  const calculateBhpCost = async (serviceName: string): Promise<number> => {
    const svc = services.find(s => s.name === serviceName);
    if (!svc) return 0;
    const [{ data: svcMats }, { data: globalMats }] = await Promise.all([
      supabase.from('service_materials')
        .select('qty_multiplier, material:materials(id,pack_price,customers_per_pack,is_global)')
        .eq('service_id', svc.id),
      supabase.from('materials').select('id, pack_price, customers_per_pack').eq('is_global', true),
    ]);
    type MatObj = { id: string; pack_price: number; customers_per_pack: number; is_global: boolean };
    type SvcMatRow = { qty_multiplier: number; material: MatObj | MatObj[] | null };
    type GlobalMatRow = { id: string; pack_price: number; customers_per_pack: number };
    const getMat = (raw: MatObj | MatObj[] | null): MatObj | null => {
      if (!raw) return null;
      return Array.isArray(raw) ? (raw[0] ?? null) : raw;
    };
    const rows = (svcMats ?? []) as unknown as SvcMatRow[];
    const assignedGlobalIds = new Set(
      rows.map(sm => getMat(sm.material)).filter((m): m is MatObj => m !== null && m.is_global).map(m => m.id)
    );
    let total = 0;
    for (const sm of rows) {
      const m = getMat(sm.material);
      if (!m || m.customers_per_pack <= 0) continue;
      total += sm.qty_multiplier * (m.pack_price / m.customers_per_pack);
    }
    for (const gm of (globalMats ?? []) as unknown as GlobalMatRow[]) {
      if (assignedGlobalIds.has(gm.id) || gm.customers_per_pack <= 0) continue;
      total += gm.pack_price / gm.customers_per_pack;
    }
    return Math.round(total);
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('bookings').update({ status }).eq('id', id);
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
  };

  const openAdd = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setBookingItems([EMPTY_ITEM()]);
    setShowForm(true);
  };

  const openEdit = async (b: Booking) => {
    setEditId(b.id);
    setForm({
      customer_name: b.customer_name ?? '',
      phone: b.phone ?? '62',
      booking_date: b.booking_date ?? '',
      booking_time: b.booking_time ?? '',
      status: b.status ?? 'Pending',
      notes: b.notes ?? '',
      discount_total: b.discount_total ?? 0,
      shared_discount_total: b.shared_discount_total ?? 0,
    });
    // Load existing booking_items
    const { data: items } = await supabase
      .from('booking_items').select('*').eq('booking_id', b.id).order('sort_order');
    if (items && items.length > 0) {
      setBookingItems(items.map((it, i) => ({
        tempId: i, service_id: it.service_id ?? '', service_name: it.service_name,
        price: it.price, duration: it.duration ?? '', therapist_id: it.therapist_id ?? '',
        parent_bundle_name: it.parent_bundle_name ?? ''
      })));
    } else {
      // Fallback for old single-service bookings
      setBookingItems([{
        tempId: 0, service_id: '', service_name: b.service_name ?? '',
        price: b.price ?? 0, duration: '', parent_bundle_name: ''
      }]);
    }
    setShowForm(true);
  };

  const saveBooking = async () => {
    const validItems = bookingItems.filter(i => i.service_name.trim());
    if (!form.customer_name || validItems.length === 0) return;
    setSaving(true);

    // BHP per item
    const itemsWithBhp = await Promise.all(
      validItems.map(async item => ({
        ...item,
        bhp_cost: await calculateBhpCost(item.service_name),
      }))
    );

    const totalPrice = itemsWithBhp.reduce((s, i) => s + Number(i.price), 0);
    const totalBhp   = itemsWithBhp.reduce((s, i) => s + i.bhp_cost, 0);
    const displayName = itemsWithBhp.map(i => i.service_name).join(' + ');

    // Upsert customer by WA (ignores duplicate — nama tidak di-overwrite)
    let customerId: string | null = null;
    let phone = form.phone.replace(/\D/g, '');
    if (phone.startsWith('0')) phone = '62' + phone.substring(1);
    
    if (phone && phone.length > 5) {
      const { data: customer } = await supabase
        .from('customers')
        .upsert(
          { wa_number: phone, name: form.customer_name },
          { onConflict: 'wa_number', ignoreDuplicates: true }
        )
        .select('id').single();
      if (!customer) {
        // ignoreDuplicates returns nothing if conflict; fetch existing
        const { data: existing } = await supabase
          .from('customers').select('id').eq('wa_number', phone).single();
        customerId = existing?.id ?? null;
      } else {
        customerId = customer.id;
      }
    }

    const payload = {
      customer_name: form.customer_name,
      phone: phone || form.phone,
      booking_date: form.booking_date,
      booking_time: form.booking_time,
      status: form.status,
      notes: form.notes,
      service_name: displayName,
      price: totalPrice,
      bhp_cost: totalBhp,
      final_price: Math.max(0, totalPrice - (form.discount_total || 0)),
      discount_total: form.discount_total,
      shared_discount_total: form.shared_discount_total,
      customer_id: customerId,
    };

    let bookingId: string;
    if (editId) {
      await supabase.from('bookings').update(payload).eq('id', editId);
      bookingId = editId;
    } else {
      const { data: newBooking } = await supabase.from('bookings').insert(payload).select('id').single();
      bookingId = newBooking!.id;
    }

    // Replace booking_items
    await supabase.from('booking_items').delete().eq('booking_id', bookingId);
    await supabase.from('booking_items').insert(
      itemsWithBhp.map((item, idx) => {
        let earned = 0;
        if (form.status === 'Completed' && item.therapist_id) {
          const t = therapists.find(x => x.id === item.therapist_id);
          const pct = t ? t.commission_pct : 30; // fallback default
          const sharedDiscountPerGross = totalPrice > 0 ? (form.shared_discount_total || 0) / totalPrice : 0;
          const itemSharedDiscount = Number(item.price) * sharedDiscountPerGross;
          const terapisBase = Math.max(0, Number(item.price) - itemSharedDiscount);
          earned = Math.round(terapisBase * pct / 100);
        }

        return {
          booking_id:   bookingId,
          service_id:   item.service_id || null,
          service_name: item.service_name,
          price:        Number(item.price),
          bhp_cost:     item.bhp_cost,
          duration:     item.duration || null,
          therapist_id: item.therapist_id || null,
          commission_earned: earned,
          sort_order:   idx,
          parent_bundle_name: item.parent_bundle_name || null
        };
      })
    );

    await fetchData();
    setShowForm(false);
    setEditId(null);
    setForm(EMPTY_FORM);
    setBookingItems([EMPTY_ITEM()]);
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

  // Booking items helpers
  const addItem = () => setBookingItems(prev => [...prev, EMPTY_ITEM()]);
  const onServiceSelect = (tempId: number, serviceName: string) => {
    const s = services.find(x => x.name === serviceName);
    if (!s) {
      setBookingItems(prev => prev.map(i => i.tempId === tempId ? { ...i, service_name: serviceName, service_id: '' } : i));
      return;
    }

    if (s.is_bundle && s.bundle_child_ids && s.bundle_child_ids.length > 0) {
      const children = s.bundle_child_ids.map(cid => services.find(x => x.id === cid)).filter(Boolean) as Service[];
      if (children.length > 0) {
        setBookingItems(prev => {
          const newItems = [...prev];
          const idx = newItems.findIndex(i => i.tempId === tempId);
          if (idx > -1) {
            newItems[idx] = { ...newItems[idx], service_id: children[0].id, service_name: children[0].name, price: children[0].price, parent_bundle_name: s.name };
            for (let i = 1; i < children.length; i++) {
              newItems.splice(idx + i, 0, {
                tempId: Date.now() + i,
                service_id: children[i].id,
                service_name: children[i].name,
                price: children[i].price,
                duration: '',
                parent_bundle_name: s.name
              });
            }
          }
          return newItems;
        });
        return;
      }
    }

    setBookingItems(prev => prev.map(i => i.tempId === tempId ? {
      ...i, service_id: s.id, service_name: s.name, price: s.price, parent_bundle_name: ''
    } : i));
  };
  const removeItem = (tempId: number) => setBookingItems(prev => prev.filter(i => i.tempId !== tempId));
  const updateItem = (tempId: number, patch: Partial<BookingItem>) =>
    setBookingItems(prev => prev.map(i => i.tempId === tempId ? { ...i, ...patch } : i));



  const totalItemsPrice = bookingItems.reduce((s, i) => s + Number(i.price), 0);

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

  const todayString = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });

  const filtered = bookings
    .filter(b => {
      if (filterStatus === 'Semua') return true;
      if (filterStatus === 'Hari Ini') return b.booking_date === todayString;
      return b.status === filterStatus;
    })
    .filter(b => !search ||
      b.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      b.service_name?.toLowerCase().includes(search.toLowerCase()));

  const counts = STATUS_OPTIONS.reduce((acc, s) => ({ ...acc, [s]: bookings.filter(b => b.status === s).length }), {} as Record<string, number>);
  const todayCount = bookings.filter(b => b.booking_date === todayString).length;

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
        {['Hari Ini', 'Semua', ...STATUS_OPTIONS].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filterStatus === s
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}>
            {s} {s === 'Hari Ini' ? `(${todayCount})` : s !== 'Semua' && counts[s] !== undefined ? `(${counts[s]})` : s === 'Semua' ? `(${bookings.length})` : ''}
          </button>
        ))}
      </div>

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
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowForm(false)} />
          <div className="relative w-full sm:max-w-lg bg-white dark:bg-zinc-900 rounded-t-2xl sm:rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 space-y-3 z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-zinc-900 dark:text-white">{editId ? 'Edit Booking' : 'Tambah Booking'}</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400"><X size={16} /></button>
            </div>

            {/* Customer info */}
            <div className="relative">
              <input className="admin-input" placeholder="Nama Pelanggan" value={form.customer_name}
                onFocus={() => setShowNameSuggestions(true)}
                onBlur={() => setTimeout(() => setShowNameSuggestions(false), 200)}
                onChange={e => {
                  setForm(f => ({ ...f, customer_name: e.target.value }));
                  setShowNameSuggestions(true);
                }} />
              {showNameSuggestions && form.customer_name && (
                <div className="absolute z-20 w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg mt-1 max-h-40 overflow-y-auto">
                  {customers.filter(c => c.name?.toLowerCase().includes(form.customer_name.toLowerCase()) && c.name?.toLowerCase() !== form.customer_name.toLowerCase()).map(c => (
                    <div key={c.id} className="px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer text-zinc-900 dark:text-white"
                         onClick={() => {
                           setForm(f => ({ ...f, customer_name: c.name, phone: c.wa_number || f.phone }));
                           setShowNameSuggestions(false);
                         }}>
                      <p className="font-medium">{c.name}</p>
                      <p className="text-xs text-zinc-500">{c.wa_number}</p>
                    </div>
                  ))}
                  {customers.filter(c => c.name?.toLowerCase().includes(form.customer_name.toLowerCase()) && c.name?.toLowerCase() !== form.customer_name.toLowerCase()).length === 0 && (
                    <div className="px-3 py-2 text-xs text-zinc-500">Buat pelanggan baru</div>
                  )}
                </div>
              )}
            </div>

            <div className="relative">
              <input className="admin-input" placeholder="Nomor WhatsApp (62xxx)" value={form.phone}
                onFocus={() => setShowPhoneSuggestions(true)}
                onBlur={() => setTimeout(() => setShowPhoneSuggestions(false), 200)}
                onChange={e => {
                  setForm(f => ({ ...f, phone: e.target.value }));
                  setShowPhoneSuggestions(true);
                }} />
              {showPhoneSuggestions && form.phone && form.phone !== '62' && (
                <div className="absolute z-20 w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg mt-1 max-h-40 overflow-y-auto">
                  {customers.filter(c => c.wa_number?.includes(form.phone) && c.wa_number !== form.phone).map(c => (
                    <div key={c.id} className="px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer text-zinc-900 dark:text-white"
                         onClick={() => {
                           setForm(f => ({ ...f, customer_name: c.name || f.customer_name, phone: c.wa_number }));
                           setShowPhoneSuggestions(false);
                         }}>
                      <p className="font-medium">{c.name}</p>
                      <p className="text-xs text-zinc-500">{c.wa_number}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Multi-service items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-zinc-500">Layanan yang Dipesan</label>
                <button onClick={addItem} className="text-xs text-earth-primary font-semibold hover:underline flex items-center gap-1">
                  <Plus size={11} /> Tambah Layanan
                </button>
              </div>
              <div className="space-y-2">
                {bookingItems.map((item, idx) => (
                  <div key={item.tempId} className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-3 border border-zinc-200 dark:border-zinc-700 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-zinc-400 w-4">{idx + 1}</span>
                      <select className="admin-input text-xs flex-1"
                        value={item.service_name}
                        onChange={e => onServiceSelect(item.tempId, e.target.value)}>
                        <option value="">-- Pilih Layanan --</option>
                        {['packages', 'services', 'reflexology', 'addons', 'split_items'].map(cat => (
                          <optgroup key={cat} label={CATEGORY_LABELS[cat]}>
                            {services.filter(s => s.category === cat).map(s => (
                              <option key={s.id} value={s.name}>{s.name} — {formatRp(s.price)}</option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                      {bookingItems.length > 1 && (
                        <button onClick={() => removeItem(item.tempId)} className="text-red-400 hover:text-red-500 p-1 shrink-0">
                          <X size={14} />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 pl-6">
                      <input className="admin-input text-xs font-mono" placeholder="Nama layanan" value={item.service_name}
                        onChange={e => updateItem(item.tempId, { service_name: e.target.value })} />
                      <input type="number" className="admin-input text-xs font-mono text-right" placeholder="Harga"
                        value={item.price || ''}
                        onChange={e => updateItem(item.tempId, { price: Number(e.target.value) })} />
                    </div>
                    <div className="pl-6 pt-1">
                      <select className="admin-input text-xs bg-white dark:bg-zinc-900 border-dashed"
                        value={item.therapist_id ?? ''}
                        onChange={e => updateItem(item.tempId, { therapist_id: e.target.value })}>
                        <option value="">-- Assign Terapis (opsional) --</option>
                        {therapists.map(t => (
                          <option key={t.id} value={t.id}>{t.name} {isOwner ? `(Fee ${t.commission_pct}%)` : ''}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
              {bookingItems.length > 1 && (
                <div className="flex justify-between items-center mt-2 px-1">
                  <span className="text-xs text-zinc-400">{bookingItems.length} layanan · 1 kunjungan</span>
                  <span className="text-sm font-mono font-semibold text-earth-primary">{formatRp(totalItemsPrice)}</span>
                </div>
              )}
            </div>

            {/* Date / Time */}
            <div className="grid grid-cols-2 gap-3">
              <input type="date" className="admin-input" value={form.booking_date}
                onChange={e => setForm(f => ({ ...f, booking_date: e.target.value }))} />
              <input type="time" className="admin-input" value={form.booking_time}
                onChange={e => setForm(f => ({ ...f, booking_time: e.target.value }))} />
            </div>

            <select className="admin-input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <textarea className="admin-input resize-none" rows={2} placeholder="Catatan (opsional)"
              value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />

            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowForm(false)} className="admin-btn-ghost flex-1 justify-center">Batal</button>
              <button onClick={saveBooking}
                disabled={saving || !form.customer_name || bookingItems.every(i => !i.service_name)}
                className="admin-btn-primary flex-1 justify-center disabled:opacity-50">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                {editId ? 'Update' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

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
