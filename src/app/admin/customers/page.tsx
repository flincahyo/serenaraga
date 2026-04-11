'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, Search, Plus, Pencil, Check, X, Loader2, ChevronDown, ChevronUp,
  Phone, CalendarCheck, Award, Hash, Trash2, TrendingUp, Wallet, Star, MessageCircle, AlertCircle,
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useUser } from '@/lib/user-context';
import { AdminSkeleton } from '@/components/admin/AdminSkeleton';


type Customer = {
  id: string;
  wa_number: string;
  name: string | null;
  visit_count_base: number;
  notes: string | null;
  created_at: string;
  effective_count?: number;   // computed
  total_spending?: number;    // computed LTV
  last_visit?: string;        // computed
};

type Discount = { id: string; type: string; value: number; value_type: string; min_orders: number | null; name: string; is_active: boolean; };
type BookingRow = { customer_id: string; status: string; final_price: number | null; price: number | null; booking_date: string; };

const formatRp = (n: number) => `Rp ${Number(n).toLocaleString('id-ID')}`;
const formatDate = (d: string) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

function TierBadge({ count, discounts }: { count: number; discounts: Discount[] }) {
  const loyal = discounts
    .filter(d => d.type === 'loyal' && d.is_active && count >= (d.min_orders ?? Infinity))
    .sort((a, b) => (b.min_orders ?? 0) - (a.min_orders ?? 0))[0];
  if (count === 0) return <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500">New</span>;
  if (!loyal) return null;
  const colors: Record<string, string> = {
    'Loyal Bronze': 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
    'Loyal Silver': 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300',
    'Loyal Gold':   'bg-yellow-50 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400',
  };
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${colors[loyal.name] ?? 'bg-earth-primary/10 text-earth-primary'}`}>
      <Award size={9} /> {loyal.name}
    </span>
  );
}

// CustomerForm lives outside parent to prevent remount on state change
function CustomerForm({
  data, saving, isNew,
  onChange, onSave, onCancel,
}: {
  data: Partial<Customer>; saving: boolean; isNew: boolean;
  onChange: (d: Partial<Customer>) => void;
  onSave: () => void; onCancel: () => void;
}) {
  return (
    <div className="space-y-3 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-zinc-500 mb-1 block">Nama</label>
          <input className="admin-input" placeholder="Ibu Rina" value={data.name ?? ''}
            onChange={e => onChange({ ...data, name: e.target.value })} />
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-500 mb-1 block">No. WhatsApp</label>
          <input className="admin-input font-mono" placeholder="628xxx" value={data.wa_number ?? ''}
            onChange={e => onChange({ ...data, wa_number: e.target.value })}
            readOnly={!isNew} />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-zinc-500 mb-1 block">
          Kunjungan Awal (sebelum pakai sistem)
        </label>
        <input type="number" min={0} className="admin-input w-32 font-mono"
          value={data.visit_count_base ?? 0}
          onChange={e => onChange({ ...data, visit_count_base: Math.max(0, Number(e.target.value)) })} />
        <p className="text-[11px] text-zinc-400 mt-1">
          Total kunjungan = angka ini + jumlah booking Completed di sistem
        </p>
      </div>
      <div>
        <label className="text-xs font-medium text-zinc-500 mb-1 block">Catatan</label>
        <input className="admin-input text-xs" placeholder="Info tambahan..."
          value={data.notes ?? ''} onChange={e => onChange({ ...data, notes: e.target.value })} />
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={onSave} disabled={saving || !data.wa_number} className="admin-btn-primary disabled:opacity-50">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} {isNew ? 'Tambah' : 'Simpan'}
        </button>
        <button onClick={onCancel} className="admin-btn-ghost"><X size={14} /> Batal</button>
      </div>
    </div>
  );
}

export default function CustomersPage() {
  const { user } = useUser();
  const isOwner = user?.role !== 'cashier';

  const [customers, setCustomers]   = useState<Customer[]>([]);
  const [discounts, setDiscounts]   = useState<Discount[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'followup'>('all');
  const [editId, setEditId]         = useState<string | null>(null);
  const [editData, setEditData]     = useState<Partial<Customer>>({});
  const [showAdd, setShowAdd]       = useState(false);
  const [newCust, setNewCust]       = useState<Partial<Customer>>({ wa_number: '62', visit_count_base: 0 });
  const [saving, setSaving]         = useState(false);
  const [expandId, setExpandId]     = useState<string | null>(null);
  const [bookingHistory, setBookingHistory] = useState<Record<string, unknown[]>>({});
  const [reEngageDays, setReEngageDays]   = useState(60);
  const [reEngageTemplate, setReEngageTemplate] = useState('');

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [{ data: custs }, { data: discs }, { data: allBkg }, { data: settingsData }] = await Promise.all([
      supabase.from('customers').select('*').order('created_at', { ascending: false }),
      supabase.from('discounts').select('id, type, value, value_type, min_orders, name, is_active').eq('type', 'loyal'),
      supabase.from('bookings')
        .select('customer_id, status, final_price, price, booking_date')
        .not('customer_id', 'is', null),
      supabase.from('settings').select('key, value').in('key', ['re_engagement_days', 're_engagement_template']),
    ]);
    if (discs) setDiscounts(discs);
    if (settingsData) {
      settingsData.forEach(({ key, value }) => {
        if (key === 're_engagement_days') setReEngageDays(Number(value) || 60);
        if (key === 're_engagement_template') setReEngageTemplate(value);
      });
    }
    if (custs && allBkg) {
      const countMap: Record<string, number> = {};
      const spendMap: Record<string, number> = {};
      const lastMap:  Record<string, string>  = {};
      (allBkg as BookingRow[]).forEach(r => {
        if (!r.customer_id) return;
        countMap[r.customer_id] = (countMap[r.customer_id] ?? 0) + (r.status === 'Completed' ? 1 : 0);
        if (r.status === 'Completed') {
          spendMap[r.customer_id] = (spendMap[r.customer_id] ?? 0) + (r.final_price ?? r.price ?? 0);
        }
        if (!lastMap[r.customer_id] || r.booking_date > lastMap[r.customer_id]) {
          lastMap[r.customer_id] = r.booking_date;
        }
      });
      setCustomers(custs.map(c => ({
        ...c,
        effective_count: (c.visit_count_base ?? 0) + (countMap[c.id] ?? 0),
        total_spending:  spendMap[c.id] ?? 0,
        last_visit:      lastMap[c.id] ?? null,
      })));
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const loadHistory = async (customerId: string) => {
    if (bookingHistory[customerId]) { setExpandId(expandId === customerId ? null : customerId); return; }
    const { data } = await supabase
      .from('bookings')
      .select('id, service_name, booking_date, price, final_price, status, discount_total')
      .eq('customer_id', customerId)
      .order('booking_date', { ascending: false })
      .limit(10);
    setBookingHistory(prev => ({ ...prev, [customerId]: data ?? [] }));
    setExpandId(customerId);
  };

  const startEdit = (c: Customer) => {
    setEditId(c.id);
    setEditData({ ...c });
    setShowAdd(false);
  };

  const saveEdit = async () => {
    if (!editId) return;
    setSaving(true);
    await supabase.from('customers').update({
      name: editData.name,
      visit_count_base: editData.visit_count_base ?? 0,
      notes: editData.notes,
      updated_at: new Date().toISOString(),
    }).eq('id', editId);
    await fetchData();
    setEditId(null);
    setSaving(false);
  };

  const deleteCustomer = async (id: string, name: string | null) => {
    if (!confirm(`Hapus customer ${name || '(tanpa nama)'}? Data booking terkait tidak akan terhapus tapi referensi pelanggannya akan hilang.`)) return;
    await supabase.from('customers').delete().eq('id', id);
    await fetchData();
  };

  const addCustomer = async () => {
    if (!newCust.wa_number) return;
    setSaving(true);
    let wa = (newCust.wa_number ?? '').replace(/\D/g, '');
    if (wa.startsWith('0')) wa = '62' + wa.substring(1);

    const { error } = await supabase.from('customers').insert({
      wa_number: wa,
      name: newCust.name ?? null,
      visit_count_base: newCust.visit_count_base ?? 0,
      notes: newCust.notes ?? null,
    });
    if (!error) {
      await fetchData();
      setShowAdd(false);
      setNewCust({ wa_number: '62', visit_count_base: 0 });
    }
    setSaving(false);
  };

  const sendReEngageWA = (c: Customer) => {
    const days = c.last_visit
      ? Math.floor((Date.now() - new Date(c.last_visit).getTime()) / 86400000)
      : reEngageDays;
    const template = reEngageTemplate ||
      'Halo {nama}! 😊 Sudah {hari} hari nih kita belum ketemu... Kangen? Yuk book sesi relaksasi di SerenaRaga! Ada promo spesial untuk kamu. 🌿';
    const msg = template
      .replace('{nama}', c.name ?? 'Kak')
      .replace('{hari}', String(days));
    window.open(`https://wa.me/${c.wa_number.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const isDormant = (c: Customer) => {
    if (!c.last_visit) return false;
    const days = Math.floor((Date.now() - new Date(c.last_visit).getTime()) / 86400000);
    return days >= reEngageDays;
  };

  const filtered = customers
    .filter(c => filterMode === 'followup' ? isDormant(c) : true)
    .filter(c =>
      !search ||
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.wa_number.includes(search)
    );

  const followUpCount = customers.filter(isDormant).length;

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
            <Users size={20} className="text-earth-primary" /> Customers
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">{customers.length} pelanggan terdaftar</p>
        </div>
        <button onClick={() => { setShowAdd(true); setEditId(null); setNewCust({ wa_number: '62', visit_count_base: 0 }); }}
          className="admin-btn-primary">
          <Plus size={16} /> Tambah Customer
        </button>
      </div>

      {/* LTV Summary Bar — Owner only */}
      {isOwner && (() => {
        const totalLTV    = customers.reduce((s, c) => s + (c.total_spending ?? 0), 0);
        const avgLTV      = customers.length ? Math.round(totalLTV / customers.length) : 0;
        const topCust     = [...customers].sort((a,b) => (b.total_spending??0)-(a.total_spending??0))[0];
        const returning   = customers.filter(c => (c.effective_count ?? 0) >= 2).length;
        return (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: Users,     label: 'Total Pelanggan', value: customers.length.toString(),                       color: 'text-zinc-500' },
              { icon: TrendingUp,label: 'Total LTV',       value: totalLTV >= 1000000 ? `Rp ${(totalLTV/1000000).toFixed(1)}JT` : formatRp(totalLTV), color: 'text-emerald-500' },
              { icon: Wallet,    label: 'Rata-rata LTV',   value: formatRp(avgLTV),                                  color: 'text-blue-500' },
              { icon: Star,      label: 'Pelanggan Setia', value: `${returning}x`,                                   color: 'text-amber-500' },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
                <Icon size={14} className={`mb-2 ${color}`} />
                <p className="text-lg font-bold text-zinc-900 dark:text-white">{value}</p>
                <p className="text-[10px] text-zinc-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        );
      })()}

      {/* Info */}
      <div className="rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-4 text-xs text-blue-700 dark:text-blue-300">
        <p className="font-semibold mb-1">Cara Kerja Total Kunjungan</p>
        <p>Total kunjungan = <strong>Kunjungan Awal</strong> (sebelum sistem) + jumlah booking berstatus <strong>Completed</strong> di database. Atur Kunjungan Awal untuk customer lama agar tier loyalty-nya akurat.</p>
      </div>

      {/* Add Form */}
      {showAdd && (
        <CustomerForm
          data={newCust} saving={saving} isNew
          onChange={setNewCust}
          onSave={addCustomer}
          onCancel={() => setShowAdd(false)}
        />
      )}

      {/* Filter Tabs + Search */}
      <div className="flex flex-col sm:flex-row gap-2">
        {/* All / Follow-up tabs */}
        <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl p-1 shrink-0">
          <button onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filterMode === 'all' ? 'bg-white dark:bg-zinc-700 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
              }`}>
              Semua ({customers.length})
            </button>
            <button onClick={() => setFilterMode('followup')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filterMode === 'followup'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-700'
              }`}>
              <AlertCircle size={11} />
              Perlu Follow-up
              {followUpCount > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                  filterMode === 'followup' ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-600'
                }`}>{followUpCount}</span>
              )}
            </button>
        </div>
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          <input className="admin-input pl-10" placeholder="Cari nama atau nomor WA..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <AdminSkeleton rows={6} />
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-sm text-zinc-400 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
          {search ? 'Customer tidak ditemukan.' : 'Belum ada customer. Customer akan otomatis terdaftar saat booking dibuat.'}
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800">
          {filtered.map(c => (
            <div key={c.id}>
              {editId === c.id ? (
                <div className="p-4">
                  <CustomerForm data={editData} saving={saving} isNew={false}
                    onChange={setEditData} onSave={saveEdit} onCancel={() => setEditId(null)} />
                </div>
              ) : (
                <div className={`px-4 py-3 ${ isDormant(c) ? 'bg-orange-50/50 dark:bg-orange-950/10 border-l-2 border-l-orange-400' : '' }`}>
                  {/* Dormant banner */}
                  {isDormant(c) && (
                    <div className="flex items-center gap-2 mb-2 px-2 py-1 bg-orange-100 dark:bg-orange-950/30 rounded-lg">
                      <AlertCircle size={11} className="text-orange-500 shrink-0" />
                      <span className="text-[10px] font-semibold text-orange-600 dark:text-orange-400 flex-1">
                        ⚠ Sudah {Math.floor((Date.now() - new Date(c.last_visit!).getTime()) / 86400000)} hari tidak order
                      </span>
                      <button onClick={() => sendReEngageWA(c)}
                        className="flex items-center gap-1 px-2 py-0.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-[10px] font-bold transition-colors">
                        <MessageCircle size={10} /> Kirim WA
                      </button>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full bg-earth-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-earth-primary">
                        {(c.name ?? c.wa_number).slice(0, 1).toUpperCase()}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm text-zinc-900 dark:text-white">{c.name || '(tanpa nama)'}</p>
                        <TierBadge count={c.effective_count ?? 0} discounts={discounts} />
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        <span className="flex items-center gap-1 text-xs text-zinc-400">
                          <Phone size={11} /> {c.wa_number}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-zinc-500 font-medium">
                          <Hash size={11} /> {c.effective_count ?? 0}x kunjungan
                          {c.visit_count_base > 0 && (
                            <span className="text-zinc-400 font-normal">({c.visit_count_base} offline)</span>
                          )}
                        </span>
                        {isOwner && (c.total_spending ?? 0) > 0 && (
                          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                            <Wallet size={11} /> {formatRp(c.total_spending ?? 0)} LTV
                          </span>
                        )}
                        {c.last_visit && (
                          <span className="text-[10px] text-zinc-400">Terakhir: {formatDate(c.last_visit)}</span>
                        )}
                      </div>
                      {c.notes && <p className="text-[11px] text-zinc-400 italic mt-0.5">{c.notes}</p>}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {isDormant(c) && (
                        <button onClick={() => sendReEngageWA(c)}
                          className="p-2 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-950/30 text-orange-400" title="Kirim WA Re-engagement">
                          <MessageCircle size={14} />
                        </button>
                      )}
                      <button onClick={() => loadHistory(c.id)}
                        className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400" title="Riwayat Booking">
                        {expandId === c.id ? <ChevronUp size={14} /> : <CalendarCheck size={14} />}
                      </button>
                      <button onClick={() => startEdit(c)} className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 text-blue-400">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => deleteCustomer(c.id, c.name)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-red-400">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Booking history expand */}
                  {expandId === c.id && bookingHistory[c.id] && (
                    <div className="mt-3 ml-12 rounded-xl border border-zinc-100 dark:border-zinc-800 overflow-hidden">
                      {(bookingHistory[c.id] as { id: string; service_name: string; booking_date: string; final_price: number; price: number; status: string; discount_total: number }[]).length === 0 ? (
                        <p className="text-xs text-zinc-400 text-center py-3">Belum ada booking di sistem.</p>
                      ) : (
                        <div className="divide-y divide-zinc-50 dark:divide-zinc-800">
                          {(bookingHistory[c.id] as { id: string; service_name: string; booking_date: string; final_price: number; price: number; status: string; discount_total: number }[]).map(b => (
                            <div key={b.id} className="flex items-center justify-between px-3 py-2">
                              <div>
                                <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{b.service_name}</p>
                                <p className="text-[11px] text-zinc-400">{b.booking_date ? formatDate(b.booking_date) : '-'}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs font-mono text-zinc-700 dark:text-zinc-300">{formatRp(b.final_price ?? b.price)}</p>
                                <span className={`text-[10px] font-medium ${b.status === 'Completed' ? 'text-blue-500' : b.status === 'Canceled' ? 'text-zinc-400' : 'text-amber-500'}`}>
                                  {b.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
