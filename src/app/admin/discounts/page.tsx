'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Tag, Plus, Pencil, Check, X, Loader2, ToggleLeft, ToggleRight,
  Percent, BadgeDollarSign, Users, CalendarRange, Hash, Trash2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase';

type DiscountType = 'first_customer' | 'loyal' | 'manual' | 'returning_customer';
type ValueType    = 'percentage' | 'flat';

type Discount = {
  id: string; name: string; description: string | null;
  type: DiscountType; value_type: ValueType; value: number;
  min_orders: number | null; valid_from: string | null; valid_to: string | null;
  max_uses: number | null; uses_count: number; is_active: boolean; created_at: string;
  is_owner_borne: boolean;
};

type DiscountForm = Omit<Discount, 'id' | 'uses_count' | 'created_at'>;

const EMPTY_FORM: DiscountForm = {
  name: '', description: null, type: 'loyal', value_type: 'percentage',
  value: 10, min_orders: 5, valid_from: null, valid_to: null,
  max_uses: null, is_active: true, is_owner_borne: true,
};

const formatRp = (n: number) => `Rp ${Number(n).toLocaleString('id-ID')}`;

const TYPE_LABELS: Record<DiscountType, string> = {
  first_customer:     'Pelanggan Pertama',
  loyal:              'Loyal (Kunjungan)',
  manual:             'Manual / Promo',
  returning_customer: 'Returning Customer',
};
const TYPE_COLORS: Record<DiscountType, string> = {
  first_customer:     'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  loyal:              'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  manual:             'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
  returning_customer: 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400',
};

// DiscountForm component outside parent to prevent cursor loss
function DiscountFormPanel({
  data, saving, isNew,
  onChange, onSave, onCancel,
}: {
  data: DiscountForm; saving: boolean; isNew: boolean;
  onChange: (d: DiscountForm) => void; onSave: () => void; onCancel: () => void;
}) {
  const previewCost = data.value_type === 'percentage'
    ? `${data.value}% dari harga layanan`
    : formatRp(data.value);

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 p-5 space-y-4">
      {/* Name + Type */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-zinc-500 mb-1 block">Nama Diskon *</label>
          <input className="admin-input" placeholder="Loyal Bronze, Promo Lebaran..." value={data.name}
            onChange={e => onChange({ ...data, name: e.target.value })} />
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-500 mb-1 block">Tipe</label>
          <select className="admin-input" value={data.type}
            onChange={e => {
              const t = e.target.value as DiscountType;
              onChange({ ...data, type: t, min_orders: t === 'loyal' ? (data.min_orders ?? 5) : null });
            }}>
            {(Object.keys(TYPE_LABELS) as DiscountType[]).map(k => (
              <option key={k} value={k}>{TYPE_LABELS[k]}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="text-xs font-medium text-zinc-500 mb-1 block">Deskripsi (opsional)</label>
        <input className="admin-input text-xs" placeholder="Keterangan singkat..."
          value={data.description ?? ''}
          onChange={e => onChange({ ...data, description: e.target.value || null })} />
      </div>

      {/* Value */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-zinc-500 mb-1 block">Tipe Nilai</label>
          <select className="admin-input" value={data.value_type}
            onChange={e => onChange({ ...data, value_type: e.target.value as ValueType })}>
            <option value="percentage">Persentase (%)</option>
            <option value="flat">Nominal (Rp)</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-500 mb-1 block">
            {data.value_type === 'percentage' ? 'Besar Diskon (%)' : 'Nominal Diskon (Rp)'}
          </label>
          <input type="number" min={0} className="admin-input font-mono"
            value={data.value || ''}
            onChange={e => onChange({ ...data, value: Number(e.target.value) })} />
        </div>
      </div>

      {/* Preview */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-earth-primary/5 dark:bg-earth-primary/10 border border-earth-primary/20">
        {data.value_type === 'percentage' ? <Percent size={13} className="text-earth-primary" /> : <BadgeDollarSign size={13} className="text-earth-primary" />}
        <span className="text-xs text-earth-primary font-medium">Potongan: {previewCost}</span>
      </div>

      {/* Min orders (loyal only) */}
      {data.type === 'loyal' && (
        <div>
          <label className="text-xs font-medium text-zinc-500 mb-1 block">
            <span className="flex items-center gap-1"><Hash size={11} /> Minimal Kunjungan</span>
          </label>
          <input type="number" min={1} className="admin-input w-32 font-mono"
            value={data.min_orders ?? ''}
            onChange={e => onChange({ ...data, min_orders: Number(e.target.value) || null })} />
          <p className="text-[11px] text-zinc-400 mt-1">Customer eligible jika total kunjungan ≥ angka ini</p>
        </div>
      )}

      {/* Min inactive days (returning_customer only) */}
      {data.type === 'returning_customer' && (
        <div className="p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-xl space-y-2">
          <p className="text-xs font-semibold text-orange-700 dark:text-orange-400">Konfigurasi Returning Customer</p>
          <p className="text-[11px] text-orange-600 dark:text-orange-400 leading-relaxed">
            Promo ini akan di-suggest otomatis di Invoice saat pelanggan terdeteksi sudah lama tidak order.
            Batas hari dikontrol dari <strong>Settings → CRM Re-engagement</strong>.
          </p>
          <div>
            <label className="text-xs font-medium text-zinc-500 mb-1 block flex items-center gap-1">
              <Hash size={11} /> Minimal Tidak Order (hari)
            </label>
            <input type="number" min={1} className="admin-input w-32 font-mono"
              value={data.min_orders ?? ''}
              onChange={e => onChange({ ...data, min_orders: Number(e.target.value) || null })} />
            <p className="text-[11px] text-zinc-400 mt-1">
              Promo eligible jika pelanggan tidak order ≥ hari ini (0 = ikuti setting global)
            </p>
          </div>
        </div>
      )}

      {/* Validity */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-zinc-500 mb-1 block flex items-center gap-1">
            <CalendarRange size={11} /> Berlaku Dari (opsional)
          </label>
          <input type="date" className="admin-input text-xs"
            value={data.valid_from ?? ''}
            onChange={e => onChange({ ...data, valid_from: e.target.value || null })} />
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-500 mb-1 block">Berlaku Sampai (opsional)</label>
          <input type="date" className="admin-input text-xs"
            value={data.valid_to ?? ''}
            onChange={e => onChange({ ...data, valid_to: e.target.value || null })} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Max uses */}
        <div>
          <label className="text-xs font-medium text-zinc-500 mb-1 block flex items-center gap-1">
            <Users size={11} /> Maks. Pakai (kosong: unlimited)
          </label>
          <input type="number" min={1} className="admin-input font-mono"
            value={data.max_uses ?? ''}
            onChange={e => onChange({ ...data, max_uses: Number(e.target.value) || null })} />
        </div>
        
        {/* Owner Borne Flag */}
        <div>
          <label className="text-xs font-medium text-zinc-500 mb-1 block flex items-center gap-1">
            Tanggungan Diskon
          </label>
          <select className="admin-input" value={data.is_owner_borne ? 'true' : 'false'}
            onChange={e => onChange({ ...data, is_owner_borne: e.target.value === 'true' })}>
            <option value="true">Owner (Potong bersih)</option>
            <option value="false">Shared (Potong gabungan)</option>
          </select>
          <p className="text-[10px] text-zinc-400 mt-1">Shared = Komisi terapis ikut berkurang.</p>
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button onClick={onSave} disabled={saving || !data.name || data.value <= 0} className="admin-btn-primary disabled:opacity-50">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} {isNew ? 'Buat Diskon' : 'Simpan'}
        </button>
        <button onClick={onCancel} className="admin-btn-ghost"><X size={14} /> Batal</button>
      </div>
    </div>
  );
}

export default function DiscountsPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading]     = useState(true);
  const [editId, setEditId]       = useState<string | null>(null);
  const [editData, setEditData]   = useState<DiscountForm>(EMPTY_FORM);
  const [showAdd, setShowAdd]     = useState(false);
  const [newDisc, setNewDisc]     = useState<DiscountForm>(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);
  const [filterActive, setFilterActive] = useState<'semua' | 'aktif' | 'nonaktif'>('semua');

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('discounts').select('*').order('type').order('min_orders', { ascending: true, nullsFirst: true });
    if (data) setDiscounts(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const saveEdit = async () => {
    if (!editId) return;
    setSaving(true);
    await supabase.from('discounts').update(editData).eq('id', editId);
    await fetchData();
    setEditId(null);
    setSaving(false);
  };

  const addDiscount = async () => {
    setSaving(true);
    await supabase.from('discounts').insert({ ...newDisc, uses_count: 0 });
    await fetchData();
    setShowAdd(false);
    setNewDisc(EMPTY_FORM);
    setSaving(false);
  };

  const deleteDiscount = async (id: string, name: string) => {
    if (!confirm(`Hapus promo "${name}" secara permanen? Histori pemakaian di booking tetap ada.`)) return;
    await supabase.from('discounts').delete().eq('id', id);
    await fetchData();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from('discounts').update({ is_active: !current }).eq('id', id);
    setDiscounts(prev => prev.map(d => d.id === id ? { ...d, is_active: !current } : d));
  };

  const filtered = discounts.filter(d => {
    if (filterActive === 'aktif') return d.is_active;
    if (filterActive === 'nonaktif') return !d.is_active;
    return true;
  });

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
            <Tag size={20} className="text-earth-primary" /> Diskon & Promo
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            {discounts.filter(d => d.is_active).length} aktif · {discounts.length} total
          </p>
        </div>
        <button onClick={() => { setShowAdd(true); setEditId(null); setNewDisc(EMPTY_FORM); }}
          className="admin-btn-primary">
          <Plus size={16} /> Buat Diskon
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <DiscountFormPanel data={newDisc} saving={saving} isNew
          onChange={setNewDisc} onSave={addDiscount} onCancel={() => setShowAdd(false)} />
      )}

      {/* Filter */}
      <div className="flex gap-2">
        {(['semua', 'aktif', 'nonaktif'] as const).map(f => (
          <button key={f} onClick={() => setFilterActive(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${
              filterActive === f
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}>{f}</button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-earth-primary" size={24} /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-sm text-zinc-400 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
          Belum ada diskon. Klik "Buat Diskon" untuk mulai.
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(d => (
            <div key={d.id}>
              {editId === d.id ? (
                <DiscountFormPanel data={editData} saving={saving} isNew={false}
                  onChange={setEditData} onSave={saveEdit} onCancel={() => setEditId(null)} />
              ) : (
                <div className={`bg-white dark:bg-zinc-900 border rounded-xl px-4 py-3.5 flex items-start gap-4 transition-opacity ${!d.is_active ? 'opacity-50' : ''} ${d.is_active ? 'border-zinc-200 dark:border-zinc-800' : 'border-zinc-100 dark:border-zinc-800/50'}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm text-zinc-900 dark:text-white">{d.name}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TYPE_COLORS[d.type]}`}>
                        {TYPE_LABELS[d.type]}
                      </span>
                      {!d.is_active && <span className="text-[10px] font-medium text-zinc-400">(nonaktif)</span>}
                    </div>
                    {d.description && <p className="text-xs text-zinc-500 mt-0.5">{d.description}</p>}
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <span className="flex items-center gap-1 text-xs font-semibold text-earth-primary">
                        {d.value_type === 'percentage' ? <Percent size={11} /> : <BadgeDollarSign size={11} />}
                        {d.value_type === 'percentage' ? `${d.value}%` : formatRp(d.value)}
                      </span>
                      {d.type === 'loyal' && d.min_orders && (
                        <span className="flex items-center gap-1 text-xs text-zinc-500">
                          <Hash size={11} /> min {d.min_orders}x kunjungan
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-xs text-zinc-400">
                        <Users size={11} /> {d.uses_count}x dipakai
                        {d.max_uses && ` / max ${d.max_uses}`}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-zinc-400">
                        <BadgeDollarSign size={11} /> {d.is_owner_borne ? 'Ditanggung Owner' : 'Shared (Owner+Terapis)'}
                      </span>
                      {(d.valid_from || d.valid_to) && (
                        <span className="flex items-center gap-1 text-xs text-zinc-400">
                          <CalendarRange size={11} />
                          {d.valid_from ?? '…'} — {d.valid_to ?? '…'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => toggleActive(d.id, d.is_active)}
                      className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400" title={d.is_active ? 'Nonaktifkan' : 'Aktifkan'}>
                      {d.is_active ? <ToggleRight size={18} className="text-emerald-500" /> : <ToggleLeft size={18} />}
                    </button>
                    <button onClick={() => { setEditId(d.id); setEditData({ name: d.name, description: d.description, type: d.type, value_type: d.value_type, value: d.value, min_orders: d.min_orders, valid_from: d.valid_from, valid_to: d.valid_to, max_uses: d.max_uses, is_active: d.is_active, is_owner_borne: d.is_owner_borne ?? true }); setShowAdd(false); }}
                      className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 text-blue-400">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => deleteDiscount(d.id, d.name)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-red-400">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
