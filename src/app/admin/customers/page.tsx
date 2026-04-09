'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, Search, Plus, Pencil, Check, X, Loader2, ChevronDown, ChevronUp,
  Phone, CalendarCheck, Award, Hash, Trash2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase';

type Customer = {
  id: string;
  wa_number: string;
  name: string | null;
  visit_count_base: number;
  notes: string | null;
  created_at: string;
  effective_count?: number;   // computed: visit_count_base + completed bookings
};

type Discount = { id: string; type: string; value: number; value_type: string; min_orders: number | null; name: string; is_active: boolean; };
type CompletedCount = { customer_id: string; count: number };

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
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [discounts, setDiscounts]  = useState<Discount[]>([]);
  const [loading, setLoading]      = useState(true);
  const [search, setSearch]        = useState('');
  const [editId, setEditId]        = useState<string | null>(null);
  const [editData, setEditData]    = useState<Partial<Customer>>({});
  const [showAdd, setShowAdd]      = useState(false);
  const [newCust, setNewCust]      = useState<Partial<Customer>>({ wa_number: '62', visit_count_base: 0 });
  const [saving, setSaving]        = useState(false);
  const [expandId, setExpandId]    = useState<string | null>(null);
  const [bookingHistory, setBookingHistory] = useState<Record<string, unknown[]>>({});

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [{ data: custs }, { data: discs }, { data: counts }] = await Promise.all([
      supabase.from('customers').select('*').order('created_at', { ascending: false }),
      supabase.from('discounts').select('id, type, value, value_type, min_orders, name, is_active').eq('type', 'loyal'),
      supabase.from('bookings')
        .select('customer_id')
        .eq('status', 'Completed')
        .not('customer_id', 'is', null),
    ]);
    if (discs) setDiscounts(discs);
    if (custs && counts) {
      // Compute effective count per customer
      const countMap: Record<string, number> = {};
      (counts as { customer_id: string }[]).forEach(r => {
        countMap[r.customer_id] = (countMap[r.customer_id] ?? 0) + 1;
      });
      setCustomers(custs.map(c => ({
        ...c,
        effective_count: (c.visit_count_base ?? 0) + (countMap[c.id] ?? 0),
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
    const { error } = await supabase.from('customers').insert({
      wa_number: (newCust.wa_number ?? '').replace(/\D/g, ''),
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

  const filtered = customers.filter(c =>
    !search ||
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.wa_number.includes(search)
  );

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

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
        <input className="admin-input pl-10" placeholder="Cari nama atau nomor WA..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-earth-primary" size={24} /></div>
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
                <div className="px-4 py-3">
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
                      </div>
                      {c.notes && <p className="text-[11px] text-zinc-400 italic mt-0.5">{c.notes}</p>}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
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
