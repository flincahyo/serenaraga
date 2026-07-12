'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Tag, Plus, Pencil, Check, X, Loader2, ToggleLeft, ToggleRight,
  Percent, BadgeDollarSign, Users, CalendarRange, Hash, Trash2, Folder, ChevronDown, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase';
import { AdminSkeleton } from '@/components/admin/AdminSkeleton';

type DiscountType = 'first_customer' | 'loyal' | 'manual' | 'returning_customer';
type ValueType    = 'percentage' | 'flat';

type Discount = {
  id: string; name: string; description: string | null;
  type: DiscountType; value_type: ValueType; value: number;
  min_orders: number | null; valid_from: string | null; valid_to: string | null;
  max_uses: number | null; uses_count: number; is_active: boolean; created_at: string;
  is_owner_borne: boolean;
  borne_by?: 'owner' | 'shared' | 'therapist';
  is_voucher?: boolean;
  buyer_name?: string | null;
  code?: string | null;
  target_type?: 'global' | 'service' | 'category';
  target_service_id?: string | null;
  target_category_id?: string | null;
};

type DiscountForm = Omit<Discount, 'id' | 'uses_count' | 'created_at'>;

const EMPTY_FORM: DiscountForm = {
  name: '', description: null, type: 'loyal', value_type: 'percentage',
  value: 10, min_orders: 5, valid_from: null, valid_to: null,
  max_uses: null, is_active: true, is_owner_borne: true,
  borne_by: 'owner',
  target_type: 'global',
  target_service_id: null,
  target_category_id: null,
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
  data, saving, isNew, services = [], categories = [],
  onChange, onSave, onCancel,
}: {
  data: DiscountForm; saving: boolean; isNew: boolean; services?: any[]; categories?: any[];
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

      {/* Target Diskon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-zinc-200 dark:border-zinc-700 pt-4">
        <div>
          <label className="text-xs font-medium text-zinc-500 mb-1 block">Target Diskon</label>
          <select className="admin-input" value={data.target_type ?? 'global'}
            onChange={e => {
              const val = e.target.value as 'global' | 'service' | 'category';
              onChange({ ...data, target_type: val, target_service_id: null, target_category_id: null });
            }}>
            <option value="global">Semua Layanan (Global)</option>
            <option value="service">Layanan Spesifik</option>
            <option value="category">Kategori Layanan</option>
          </select>
        </div>
        {(data.target_type === 'service') && (
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-zinc-500 mb-1 block">Pilih Layanan</label>
            <select className="admin-input" value={data.target_service_id ?? ''}
              onChange={e => onChange({ ...data, target_service_id: e.target.value || null })}>
              <option value="">-- Pilih Layanan --</option>
              {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        )}
        {(data.target_type === 'category') && (
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-zinc-500 mb-1 block">Pilih Kategori</label>
            <select className="admin-input" value={data.target_category_id ?? ''}
              onChange={e => onChange({ ...data, target_category_id: e.target.value || null })}>
              <option value="">-- Pilih Kategori --</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
        )}
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
          <select className="admin-input" value={data.borne_by ?? (data.is_owner_borne ? 'owner' : 'shared')}
            onChange={e => onChange({ ...data, borne_by: e.target.value as 'owner' | 'shared' | 'therapist' })}>
            <option value="owner">Owner (Potong bersih)</option>
            <option value="shared">Shared 50-50</option>
            <option value="therapist">Terapis (Maks. 5% cap)</option>
          </select>
          <p className="text-[10px] text-zinc-400 mt-1">Shared = Beban dibagi 50-50. Terapis = Maksimal menanggung 5%.</p>
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
  const [services, setServices]   = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [editId, setEditId]       = useState<string | null>(null);
  const [editData, setEditData]   = useState<DiscountForm>(EMPTY_FORM);
  const [showAdd, setShowAdd]     = useState(false);
  const [newDisc, setNewDisc]     = useState<DiscountForm>(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);
  const [filterActive, setFilterActive] = useState<'semua' | 'aktif' | 'nonaktif'>('semua');
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, name: string } | null>(null);
  const [expandedBatches, setExpandedBatches] = useState<Record<string, boolean>>({});

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [{ data }, { data: svcData }, { data: catData }] = await Promise.all([
      supabase.from('discounts').select('*').order('type').order('min_orders', { ascending: true, nullsFirst: true }),
      supabase.from('services').select('id, name').order('name'),
      supabase.from('service_categories').select('id, label').order('sort_order'),
    ]);
    if (data) setDiscounts(data);
    if (svcData) setServices(svcData);
    if (catData) setCategories(catData);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const saveEdit = async () => {
    if (!editId) return;
    setSaving(true);
    
    // Clean database payload to avoid sending virtual fields like 'borne_by'
    const { borne_by, ...dbPayload } = editData;
    const payload = {
      ...dbPayload,
      is_owner_borne: borne_by === 'owner'
    };

    const { error } = await supabase.from('discounts').update(payload).eq('id', editId);
    if (error) {
      alert("Gagal menyimpan diskon: " + error.message);
    } else {
      await fetchData();
      setEditId(null);
    }
    setSaving(false);
  };

  const addDiscount = async () => {
    setSaving(true);
    
    // Clean database payload to avoid sending virtual fields like 'borne_by'
    const { borne_by, ...dbPayload } = newDisc;
    const payload = {
      ...dbPayload,
      is_owner_borne: borne_by === 'owner',
      uses_count: 0
    };

    const { error } = await supabase.from('discounts').insert(payload);
    if (error) {
      alert("Gagal menambah diskon: " + error.message);
    } else {
      await fetchData();
      setShowAdd(false);
      setNewDisc(EMPTY_FORM);
    }
    setSaving(false);
  };

  const deleteDiscount = async () => {
    if (!deleteConfirm) return;
    await supabase.from('discounts').delete().eq('id', deleteConfirm.id);
    setDeleteConfirm(null);
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

  const regularDiscounts = filtered.filter(d => !(d.is_voucher && d.buyer_name?.startsWith('Batch: ')));
  const bulkBatches = filtered.reduce((acc, d) => {
    if (d.is_voucher && d.buyer_name?.startsWith('Batch: ')) {
      const batchName = d.buyer_name.replace('Batch: ', '');
      if (!acc[batchName]) acc[batchName] = [];
      acc[batchName].push(d);
    }
    return acc;
  }, {} as Record<string, Discount[]>);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20 relative">
      
      {/* Custom Confirm Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-zinc-900/40"
              onClick={() => setDeleteConfirm(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 10 }} 
              className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-7 rounded-[2rem] shadow-2xl max-w-sm w-full"
            >
              <div className="flex items-start gap-4">
                <div className="p-4 rounded-2xl shrink-0 bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400">
                  <Trash2 size={24} />
                </div>
                <div className="mt-1">
                  <h3 className="font-bold text-zinc-900 dark:text-white text-lg tracking-wide">
                    Hapus Permanen?
                  </h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
                    Tindakan ini akan menghapus diskon "{deleteConfirm.name}" secara permanen. Histori pemakaian di booking tetap ada.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-8">
                <button 
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-3 rounded-xl font-bold text-sm tracking-wide text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 active:scale-[0.98] transition-all duration-200"
                >
                  Batal
                </button>
                <button 
                  onClick={deleteDiscount}
                  className="flex-1 px-4 py-3 rounded-xl font-bold text-sm tracking-wide text-white bg-red-600 hover:bg-red-700 shadow-sm shadow-red-600/20 active:scale-[0.98] transition-all duration-200"
                >
                  Ya, Hapus
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-3">
            <Tag size={24} className="text-earth-primary" /> Diskon & Promo
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
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
        <DiscountFormPanel data={newDisc} saving={saving} isNew services={services} categories={categories}
          onChange={setNewDisc} onSave={addDiscount} onCancel={() => setShowAdd(false)} />
      )}

      {/* Filter */}
      <div className="flex gap-1.5 bg-zinc-100/60 dark:bg-zinc-800/60 p-1.5 rounded-2xl border border-zinc-200/50 dark:border-zinc-700/50 w-max">
        {(['semua', 'aktif', 'nonaktif'] as const).map(f => (
          <button key={f} onClick={() => setFilterActive(f)}
            className={`px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300 active:scale-[0.98] ${
              filterActive === f
                ? 'bg-white dark:bg-zinc-700 text-earth-primary shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1)] ring-1 ring-black/5 dark:ring-white/10'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 hover:bg-zinc-200/40 dark:hover:bg-zinc-700/40'
            }`}>{f}</button>
        ))}
      </div>

      {loading ? (
        <AdminSkeleton rows={4} />
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-sm text-zinc-400 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
          Belum ada diskon. Klik "Buat Diskon" untuk mulai.
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* BULK VOUCHERS GROUPED */}
          {Object.entries(bulkBatches).map(([batchName, items]) => {
            const isExpanded = expandedBatches[batchName];
            const activeCount = items.filter(i => i.is_active).length;
            return (
              <div key={`batch-${batchName}`} className="bg-white dark:bg-zinc-900/40 border border-zinc-200/40 dark:border-zinc-800/50 rounded-3xl p-1 shadow-sm transition-all overflow-hidden group">
                <button 
                  onClick={() => setExpandedBatches(prev => ({ ...prev, [batchName]: !prev[batchName] }))}
                  className="w-full flex items-center justify-between p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-[1.25rem] transition-colors active:scale-[0.99]"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl text-zinc-500 group-hover:text-earth-primary transition-colors">
                      <Folder size={20} />
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold text-zinc-900 dark:text-white text-sm tracking-wide flex items-center gap-2">
                        Batch: {batchName}
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 tracking-wider">
                          VOUCHER BULK
                        </span>
                      </h3>
                      <p className="text-xs text-zinc-500 mt-1 font-medium">{items.length} Total Voucher · {activeCount} Aktif</p>
                    </div>
                  </div>
                  <div className="text-zinc-400 bg-zinc-100 dark:bg-zinc-800 p-2 rounded-xl text-xs font-semibold flex items-center justify-center">
                    <ChevronDown size={16} className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </button>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-4 pb-4 pt-2 border-t border-zinc-100 dark:border-zinc-800/50 mt-2 space-y-3"
                    >
                      {items.map(d => (
                        <div key={d.id}>
                          {editId === d.id ? (
                            <DiscountFormPanel data={editData} saving={saving} isNew={false} services={services} categories={categories}
                              onChange={setEditData} onSave={saveEdit} onCancel={() => setEditId(null)} />
                          ) : (
                            <div className={`bg-zinc-50 dark:bg-zinc-800/50 border rounded-2xl p-4 flex items-start gap-4 transition-all hover:bg-white dark:hover:bg-zinc-800 ${!d.is_active ? 'opacity-60 grayscale-[30%]' : ''} ${d.is_active ? 'border-zinc-200 dark:border-zinc-700/50' : 'border-zinc-100 dark:border-zinc-800/30'}`}>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-bold text-sm text-zinc-900 dark:text-white">{d.name}</p>
                                  {d.code && (
                                    <span className="font-mono text-xs font-bold text-zinc-600 bg-zinc-200/60 dark:bg-zinc-700/50 dark:text-zinc-300 px-2 py-0.5 rounded-md tracking-wider">
                                      {d.code}
                                    </span>
                                  )}
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md tracking-wider uppercase ${TYPE_COLORS[d.type]}`}>
                                    {TYPE_LABELS[d.type]}
                                  </span>
                                  {d.target_type === 'service' && d.target_service_id && (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-750 dark:bg-blue-950/30 dark:text-blue-400 tracking-wider">
                                      🎯 {services.find(s => s.id === d.target_service_id)?.name ?? 'Layanan'}
                                    </span>
                                  )}
                                  {d.target_type === 'category' && d.target_category_id && (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-750 dark:bg-purple-950/30 dark:text-purple-400 tracking-wider">
                                      🎯 {categories.find(c => c.id === d.target_category_id)?.label ?? 'Kategori'}
                                    </span>
                                  )}
                                  {!d.is_active && <span className="text-[10px] font-bold tracking-wider uppercase text-zinc-400">(Nonaktif)</span>}
                                </div>
                                {d.description && <p className="text-xs text-zinc-500 mt-1 font-medium">{d.description}</p>}
                                <div className="flex items-center gap-4 mt-3 flex-wrap">
                                  <span className="flex items-center gap-1.5 text-xs font-bold text-earth-primary bg-earth-primary/5 px-2 py-1 rounded-md">
                                    {d.value_type === 'percentage' ? <Percent size={12} /> : <BadgeDollarSign size={12} />}
                                    {d.value_type === 'percentage' ? `${d.value}%` : formatRp(d.value)}
                                  </span>
                                  <span className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
                                    <Users size={12} className="text-zinc-400" /> {d.uses_count}x dipakai
                                    {d.max_uses && ` / max ${d.max_uses}`}
                                  </span>
                                  <span className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
                                    <BadgeDollarSign size={12} className="text-zinc-400" /> {d.borne_by === 'owner' ? 'Ditanggung Owner' : d.borne_by === 'shared' ? 'Shared 50-50' : 'Terapis (Maks 5%)'}
                                  </span>
                                  {(d.valid_from || d.valid_to) && (
                                    <span className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
                                      <CalendarRange size={12} className="text-zinc-400" />
                                      {d.valid_from ?? '…'} — {d.valid_to ?? '…'}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0 bg-white dark:bg-zinc-900 p-1 rounded-xl shadow-sm border border-zinc-100 dark:border-zinc-800">
                                <button onClick={() => toggleActive(d.id, d.is_active)}
                                  className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 transition-colors" title={d.is_active ? 'Nonaktifkan' : 'Aktifkan'}>
                                  {d.is_active ? <ToggleRight size={16} className="text-emerald-500" /> : <ToggleLeft size={16} />}
                                </button>
                                <button onClick={() => { setEditId(d.id); setEditData({ name: d.name, description: d.description, type: d.type, value_type: d.value_type, value: d.value, min_orders: d.min_orders, valid_from: d.valid_from, valid_to: d.valid_to, max_uses: d.max_uses, is_active: d.is_active, is_owner_borne: d.is_owner_borne ?? true, borne_by: d.borne_by ?? (d.is_owner_borne ? 'owner' : 'shared'), target_type: d.target_type ?? 'global', target_service_id: d.target_service_id ?? null, target_category_id: d.target_category_id ?? null }); setShowAdd(false); }}
                                  className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 text-blue-400 transition-colors">
                                  <Pencil size={14} />
                                </button>
                                <button onClick={() => setDeleteConfirm({ id: d.id, name: d.name })} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-red-400 transition-colors">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}

          {/* REGULAR DISCOUNTS */}
          {regularDiscounts.map(d => (
            <div key={d.id}>
              {editId === d.id ? (
                <DiscountFormPanel data={editData} saving={saving} isNew={false} services={services} categories={categories}
                  onChange={setEditData} onSave={saveEdit} onCancel={() => setEditId(null)} />
              ) : (
                <div className={`bg-white dark:bg-zinc-900/40 border rounded-3xl p-5 flex items-start gap-4 transition-all hover:shadow-md hover:-translate-y-0.5 duration-300 group ${!d.is_active ? 'opacity-60 grayscale-[30%]' : ''} ${d.is_active ? 'border-zinc-200/60 dark:border-zinc-800' : 'border-zinc-100 dark:border-zinc-800/30'}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-sm text-zinc-900 dark:text-white tracking-wide">{d.name}</p>
                      {d.code && (
                        <span className="font-mono text-xs font-bold text-zinc-600 bg-zinc-200/60 dark:bg-zinc-700/50 dark:text-zinc-300 px-2 py-0.5 rounded-md tracking-wider">
                          {d.code}
                        </span>
                      )}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${TYPE_COLORS[d.type]}`}>
                        {TYPE_LABELS[d.type]}
                      </span>
                      {d.target_type === 'service' && d.target_service_id && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-755 dark:bg-blue-950/30 dark:text-blue-400 tracking-wider">
                          🎯 {services.find(s => s.id === d.target_service_id)?.name ?? 'Layanan'}
                        </span>
                      )}
                      {d.target_type === 'category' && d.target_category_id && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-755 dark:bg-purple-950/30 dark:text-purple-400 tracking-wider">
                          🎯 {categories.find(c => c.id === d.target_category_id)?.label ?? 'Kategori'}
                        </span>
                      )}
                      {!d.is_active && <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">(Nonaktif)</span>}
                    </div>
                    {d.description && <p className="text-xs text-zinc-500 mt-1.5 font-medium">{d.description}</p>}
                    <div className="flex items-center gap-4 mt-3.5 flex-wrap">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-earth-primary bg-earth-primary/5 px-2.5 py-1.5 rounded-lg">
                        {d.value_type === 'percentage' ? <Percent size={12} /> : <BadgeDollarSign size={12} />}
                        {d.value_type === 'percentage' ? `${d.value}%` : formatRp(d.value)}
                      </span>
                      {d.type === 'loyal' && d.min_orders && (
                        <span className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
                          <Hash size={12} className="text-zinc-400" /> min {d.min_orders}x kunjungan
                        </span>
                      )}
                      <span className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
                        <Users size={12} className="text-zinc-400" /> {d.uses_count}x dipakai
                        {d.max_uses && ` / max ${d.max_uses}`}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
                        <BadgeDollarSign size={12} className="text-zinc-400" /> {d.borne_by === 'owner' ? 'Ditanggung Owner' : d.borne_by === 'shared' ? 'Shared 50-50' : 'Terapis (Maks 5%)'}
                      </span>
                      {(d.valid_from || d.valid_to) && (
                        <span className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
                          <CalendarRange size={12} className="text-zinc-400" />
                          {d.valid_from ?? '…'} — {d.valid_to ?? '…'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 bg-zinc-50 dark:bg-zinc-800/50 p-1.5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => toggleActive(d.id, d.is_active)}
                      className="p-2.5 rounded-xl hover:bg-white dark:hover:bg-zinc-700 text-zinc-400 shadow-sm transition-all active:scale-[0.98]" title={d.is_active ? 'Nonaktifkan' : 'Aktifkan'}>
                      {d.is_active ? <ToggleRight size={18} className="text-emerald-500" /> : <ToggleLeft size={18} />}
                    </button>
                    <button onClick={() => { setEditId(d.id); setEditData({ name: d.name, description: d.description, type: d.type, value_type: d.value_type, value: d.value, min_orders: d.min_orders, valid_from: d.valid_from, valid_to: d.valid_to, max_uses: d.max_uses, is_active: d.is_active, is_owner_borne: d.is_owner_borne ?? true, borne_by: d.borne_by ?? (d.is_owner_borne ? 'owner' : 'shared'), target_type: d.target_type ?? 'global', target_service_id: d.target_service_id ?? null, target_category_id: d.target_category_id ?? null }); setShowAdd(false); }}
                      className="p-2.5 rounded-xl hover:bg-white dark:hover:bg-zinc-700 text-blue-500 shadow-sm transition-all active:scale-[0.98]">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => setDeleteConfirm({ id: d.id, name: d.name })} className="p-2.5 rounded-xl hover:bg-white dark:hover:bg-zinc-700 text-red-500 shadow-sm transition-all active:scale-[0.98]">
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
