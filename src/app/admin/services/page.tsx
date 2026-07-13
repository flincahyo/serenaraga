'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Check, X, Star, Loader2, Eye, Percent, FlaskConical, Globe2, Layers, Award, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase';
import { AdminSkeleton } from '@/components/admin/AdminSkeleton';
import { useSettings } from '@/lib/settings';

type Service = {
  id: string;
  category: string;
  category_label: string;
  name: string;
  price: number;
  details: string;
  is_bestseller: boolean;
  is_featured: boolean;
  featured_image: string | null;
  featured_description: string | null;
  featured_duration: string | null;
  sort_order: number;
  is_bundle: boolean;
  bundle_child_ids: string[] | null;
  estimated_duration: number | null;
};

type Material = {
  id: string;
  name: string;
  pack_label: string;
  pack_price: number;
  customers_per_pack: number;
  is_global: boolean;
};

type SvcMat = {
  id: string;
  material_id: string;
  qty_multiplier: number;
  material?: Material | Material[] | null;
};

type ServiceCategory = {
  id: string;
  label: string;
  sort_order: number;
};

const DEFAULT_CATEGORIES: ServiceCategory[] = [
  { id: 'packages',    label: 'Massage Packages', sort_order: 1 },
  { id: 'services',   label: 'Massage Services', sort_order: 2 },
  { id: 'reflexology',label: 'Refleksi Service', sort_order: 3 },
  { id: 'addons',     label: 'Add-On Service', sort_order: 4 },
  { id: 'split_items',label: 'Internal Split Item', sort_order: 5 },
];

const formatRp = (n: number) => `Rp ${Number(n).toLocaleString('id-ID')}`;

const getMat = (raw: Material | Material[] | null | undefined): Material | null => {
  if (!raw) return null;
  return Array.isArray(raw) ? (raw[0] ?? null) : raw;
};

const cpc = (m: Pick<Material, 'pack_price' | 'customers_per_pack'>) =>
  m.customers_per_pack > 0 ? m.pack_price / m.customers_per_pack : 0;

const svcMatCost = (sm: SvcMat) => {
  const m = getMat(sm.material);
  if (!m || m.customers_per_pack <= 0) return 0;
  return sm.qty_multiplier * (m.pack_price / m.customers_per_pack);
};

// ──────────────────────────────────────────
// Commission calculator UI component
// ──────────────────────────────────────────
function CommissionCalc({ price, split, onSplitChange }: {
  price: number;
  split: number;
  onSplitChange: (v: number) => void;
}) {
  const terapisCut = Math.round(price * split / 100);
  const pemilikCut = price - terapisCut;

  return (
    <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-250/20 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Percent size={14} className="text-amber-650 dark:text-amber-400" />
        <span className="text-xs font-bold text-amber-700 dark:text-amber-400">Kalkulasi Simulasi Bagi Hasil</span>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <span className="text-zinc-500 dark:text-zinc-400 font-medium">Terapis dapat</span>
        <input
          type="number"
          min={0}
          max={100}
          value={split}
          onChange={e => onSplitChange(Math.min(100, Math.max(0, Number(e.target.value))))}
          className="w-14 text-center text-xs font-bold font-mono rounded-lg border border-amber-200 dark:border-amber-800 bg-white dark:bg-zinc-950 text-amber-850 dark:text-amber-300 px-2 py-1 focus:ring-1 focus:ring-amber-550"
        />
        <span className="text-zinc-500 dark:text-zinc-400 font-bold">%</span>
      </div>
      {price > 0 && (
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <div className="bg-white dark:bg-zinc-950 rounded-xl px-3.5 py-2 border border-amber-200/50 dark:border-amber-800/40">
            <p className="text-[10px] text-zinc-400 font-semibold mb-0.5 uppercase tracking-wider">Terapis ({split}%)</p>
            <p className="text-sm font-bold text-amber-700 dark:text-amber-300 font-mono">{formatRp(terapisCut)}</p>
          </div>
          <div className="bg-white dark:bg-zinc-950 rounded-xl px-3.5 py-2 border border-amber-200/50 dark:border-amber-800/40">
            <p className="text-[10px] text-zinc-400 font-semibold mb-0.5 uppercase tracking-wider">Pemilik ({100 - split}%)</p>
            <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 font-mono">{formatRp(pemilikCut)}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────
// ServiceModalForm component
// ──────────────────────────────────────────
function ServiceModalForm({
  isOpen,
  data,
  saving,
  isNew,
  categories,
  defaultCommission,
  onChange,
  onSave,
  onCancel,
}: {
  isOpen: boolean;
  data: Partial<Service>;
  saving: boolean;
  isNew: boolean;
  categories: ServiceCategory[];
  defaultCommission: number;
  onChange: (d: Partial<Service>) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [splitPercent, setSplitPercent] = useState(defaultCommission);

  useEffect(() => {
    setSplitPercent(defaultCommission);
  }, [defaultCommission, isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
          className="fixed inset-0 bg-black/40"
        />

        {/* Modal Panel */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl w-full max-w-md p-6 relative z-10 max-h-[90vh] overflow-y-auto space-y-4 scrollbar-thin"
        >
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
            <h3 className="font-semibold text-zinc-950 dark:text-white flex items-center gap-2">
              <FlaskConical size={16} className="text-earth-primary" />
              {isNew ? 'Tambah Layanan Baru' : 'Edit Info Layanan'}
            </h3>
            <button onClick={onCancel} className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg">
              <X size={16} />
            </button>
          </div>

          <div className="space-y-3.5">
            <div>
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1 block">Nama Layanan *</label>
              <input
                type="text"
                className="admin-input"
                placeholder="Nama Layanan..."
                value={data.name || ''}
                onChange={e => onChange({ ...data, name: e.target.value })}
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1 block">Harga (Rp) *</label>
                <input
                  type="number"
                  min={0}
                  className="admin-input font-mono"
                  placeholder="Harga..."
                  value={data.price || ''}
                  onChange={e => onChange({ ...data, price: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1 block">Durasi (Menit)</label>
                <input
                  type="number"
                  min={1}
                  className="admin-input font-mono"
                  placeholder="Estimasi Menit..."
                  value={data.estimated_duration || ''}
                  onChange={e => onChange({ ...data, estimated_duration: Number(e.target.value) })}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1 block">Kategori Layanan *</label>
              <select
                className="admin-input text-xs"
                value={data.category || ''}
                onChange={e => {
                  const cat = categories.find(c => c.id === e.target.value);
                  onChange({ ...data, category: e.target.value, category_label: cat?.label || '' });
                }}
              >
                <option value="">-- Pilih Kategori --</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1 block">Detail / Deskripsi</label>
              <textarea
                className="admin-input resize-none text-xs animate-none"
                rows={3}
                placeholder="Deskripsi layanan..."
                value={data.details || ''}
                onChange={e => onChange({ ...data, details: e.target.value })}
              />
            </div>

            <div className="flex gap-4 py-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                <input
                  type="checkbox"
                  checked={data.is_bestseller || false}
                  onChange={e => onChange({ ...data, is_bestseller: e.target.checked })}
                  className="rounded border-zinc-300 text-amber-500 focus:ring-amber-500 w-4 h-4"
                />
                Best Seller
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                <input
                  type="checkbox"
                  checked={data.is_featured || false}
                  onChange={e => onChange({ ...data, is_featured: e.target.checked })}
                  className="rounded border-zinc-300 text-blue-500 focus:ring-blue-500 w-4 h-4"
                />
                Featured
              </label>
            </div>

            {data.is_featured && (
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30 rounded-2xl space-y-3">
                <p className="text-[10px] font-bold text-blue-800 dark:text-blue-400 uppercase tracking-wider">Detail Promosi Landing Page</p>
                <div>
                  <label className="text-[10px] text-zinc-400 font-bold block mb-1">Deskripsi Singkat Promosi</label>
                  <input
                    type="text"
                    className="admin-input text-xs"
                    placeholder="Deskripsi promo..."
                    value={data.featured_description || ''}
                    onChange={e => onChange({ ...data, featured_description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-zinc-400 font-bold block mb-1">Durasi Promo (e.g. 120 Mnt)</label>
                    <input
                      type="text"
                      className="admin-input text-xs"
                      placeholder="120 Mnt..."
                      value={data.featured_duration || ''}
                      onChange={e => onChange({ ...data, featured_duration: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-400 font-bold block mb-1">Path Gambar (Image path)</label>
                    <input
                      type="text"
                      className="admin-input text-xs font-mono"
                      placeholder="/featured-treatment.png..."
                      value={data.featured_image || ''}
                      onChange={e => onChange({ ...data, featured_image: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}
            
            {/* Split Simulator purely inside modal preview */}
            <CommissionCalc
              price={data.price ?? 0}
              split={splitPercent}
              onSplitChange={setSplitPercent}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <button onClick={onCancel} className="admin-btn-ghost text-xs">
              Batal
            </button>
            <button
              onClick={onSave}
              disabled={saving || !data.name || !data.category}
              className="admin-btn-primary text-xs disabled:opacity-50"
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
              {isNew ? 'Tambah Layanan' : 'Simpan'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// ──────────────────────────────────────────
// ServiceDrawer component
// ──────────────────────────────────────────
function ServiceDrawer({
  service,
  isOpen,
  onClose,
  onEdit,
  allMaterials,
  allServices,
  onSaveSuccess,
}: {
  service: Service | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  allMaterials: Material[];
  allServices: Service[];
  onSaveSuccess: () => void;
}) {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<'profile' | 'bhp' | 'bundle'>('profile');
  
  // Commission Split simulator state
  const [splitPercent, setSplitPercent] = useState(30);

  // BHP States
  const [svcMaterials, setSvcMaterials] = useState<SvcMat[]>([]);
  const [bhpLoading, setBhpLoading] = useState(false);
  const [addMatId, setAddMatId] = useState('');
  const [addMatQty, setAddMatQty] = useState(1);
  const [addingMat, setAddingMat] = useState(false);

  // Settings
  const { settings } = useSettings();
  const defaultCommission = Number(settings.terapis_commission_pct ?? 30);

  // Bundle state
  const [isBundle, setIsBundle] = useState(false);
  const [bundleChildIds, setBundleChildIds] = useState<string[]>([]);
  const [savingBundle, setSavingBundle] = useState(false);

  const fetchSvcMaterials = async (sId: string) => {
    setBhpLoading(true);
    const { data } = await supabase
      .from('service_materials')
      .select('id, material_id, qty_multiplier, material:materials(id,name,pack_label,pack_price,customers_per_pack,is_global)')
      .eq('service_id', sId);
    if (data) setSvcMaterials(data as unknown as SvcMat[]);
    setBhpLoading(false);
  };

  useEffect(() => {
    if (isOpen && service) {
      setActiveTab('profile');
      setSplitPercent(defaultCommission);
      setIsBundle(service.is_bundle ?? false);
      setBundleChildIds(service.bundle_child_ids ?? []);
      fetchSvcMaterials(service.id);
    }
  }, [isOpen, service, defaultCommission]);

  const addMaterial = async () => {
    if (!service || !addMatId || addMatQty <= 0) return;
    setAddingMat(true);
    await supabase.from('service_materials').upsert({
      service_id: service.id,
      material_id: addMatId,
      qty_multiplier: addMatQty,
    }, { onConflict: 'service_id,material_id' });
    await fetchSvcMaterials(service.id);
    setAddMatId('');
    setAddMatQty(1);
    setAddingMat(false);
  };

  const removeMaterial = async (smId: string) => {
    await supabase.from('service_materials').delete().eq('id', smId);
    setSvcMaterials(prev => prev.filter(sm => sm.id !== smId));
  };

  const saveBundleSettings = async () => {
    if (!service) return;
    setSavingBundle(true);
    await supabase.from('services').update({
      is_bundle: isBundle,
      bundle_child_ids: isBundle ? bundleChildIds : null,
    }).eq('id', service.id);
    service.is_bundle = isBundle;
    service.bundle_child_ids = isBundle ? bundleChildIds : null;
    setSavingBundle(false);
    onSaveSuccess();
    alert('Pengaturan paket berhasil disimpan.');
  };

  if (!service) return null;
  const totalBhp = svcMaterials.reduce((sum, sm) => sum + svcMatCost(sm), 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 z-40"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full md:max-w-xl bg-white dark:bg-zinc-950 shadow-2xl z-50 border-l border-zinc-200 dark:border-zinc-800 flex flex-col"
          >
            {/* Header */}
            <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-earth-primary to-blue-600 flex items-center justify-center text-white font-bold shadow-sm shrink-0">
                  {service.name.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900 dark:text-white leading-tight">
                    {service.name}
                  </h3>
                  <p className="text-xs text-zinc-400 font-mono mt-0.5">{formatRp(service.price)}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={onEdit}
                  className="p-2 text-zinc-500 hover:text-earth-primary hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                  title="Edit Info Layanan"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Sub-Tabs Selector */}
            <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1 border-b border-zinc-200 dark:border-zinc-800">
              {[
                { id: 'profile', label: 'Profil & Komisi' },
                { id: 'bhp', label: 'Bahan BHP' },
                { id: 'bundle', label: 'Setelan Paket' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    activeTab === tab.id
                      ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin">
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  {/* Basic Stats Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
                      <span className="text-[10px] text-zinc-400 font-bold block uppercase">Harga Layanan</span>
                      <span className="text-base font-bold text-zinc-850 dark:text-zinc-200 font-mono mt-1 block">
                        {formatRp(service.price)}
                      </span>
                    </div>
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
                      <span className="text-[10px] text-zinc-400 font-bold block uppercase">Estimasi Durasi</span>
                      <span className="text-base font-bold text-zinc-850 dark:text-zinc-200 font-mono mt-1 block">
                        {service.estimated_duration ?? 90} Mnt
                      </span>
                    </div>
                  </div>

                  {/* Simulator Split Bagi Hasil */}
                  <CommissionCalc
                    price={service.price}
                    split={splitPercent}
                    onSplitChange={setSplitPercent}
                  />

                  {/* Details */}
                  {service.details && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-250 uppercase tracking-wider">
                        Keterangan Layanan
                      </h4>
                      <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs text-zinc-655 dark:text-zinc-450 leading-relaxed">
                        {service.details}
                      </div>
                    </div>
                  )}

                  {/* Featured details */}
                  {service.is_featured && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30 rounded-2xl space-y-3">
                      <h4 className="text-xs font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                        <Eye size={13} /> Detail Promosi Landing Page
                      </h4>
                      <div className="space-y-2 text-xs leading-relaxed">
                        <p className="text-zinc-600 dark:text-zinc-400"><strong className="text-zinc-700 dark:text-zinc-300">Deskripsi Promo:</strong> {service.featured_description || '-'}</p>
                        <p className="text-zinc-600 dark:text-zinc-400"><strong className="text-zinc-700 dark:text-zinc-300">Durasi Promo:</strong> {service.featured_duration || '-'}</p>
                        <p className="text-zinc-600 dark:text-zinc-400 font-mono"><strong className="text-zinc-700 dark:text-zinc-300 font-sans">File Gambar:</strong> {service.featured_image || '-'}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'bhp' && (
                <div className="space-y-5">
                  {/* BHP Header Summary */}
                  <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250/20 rounded-2xl">
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400">
                      Total Beban BHP per Customer
                    </span>
                    <span className="text-base font-bold font-mono text-emerald-700 dark:text-emerald-300">
                      {formatRp(Math.round(totalBhp))}/customer
                    </span>
                  </div>

                  {/* BHP Materials List */}
                  {bhpLoading ? (
                    <div className="flex justify-center p-12"><Loader2 size={30} className="animate-spin text-zinc-400" /></div>
                  ) : (
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-250 uppercase tracking-wider">
                        Bahan yang Digunakan ({svcMaterials.length})
                      </h4>

                      {svcMaterials.length === 0 ? (
                        <p className="text-xs text-zinc-400 text-center py-6 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
                          Layanan ini belum menggunakan bahan spesifik. Tambah bahan di bawah.
                        </p>
                      ) : (
                        <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
                          {svcMaterials.map(sm => {
                            const m = getMat(sm.material);
                            if (!m) return null;
                            const cost = svcMatCost(sm);
                            return (
                              <div key={sm.id} className="p-3.5 flex justify-between items-center text-xs group">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-semibold text-zinc-850 dark:text-zinc-200">{m.name}</span>
                                    {m.pack_label && <span className="text-[10px] text-zinc-400 font-mono">({m.pack_label})</span>}
                                    {sm.qty_multiplier > 1 && (
                                      <span className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 text-[9px] font-bold font-mono">
                                        ×{sm.qty_multiplier}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-zinc-400 mt-0.5">
                                    {formatRp(m.pack_price)} ÷ {m.customers_per_pack} customer
                                  </p>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold font-mono text-earth-primary">{formatRp(cost)}</span>
                                  <button onClick={() => removeMaterial(sm.id)} className="p-1.5 text-zinc-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-all">
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Add BHP Material Form */}
                  <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl space-y-3 shadow-inner">
                    <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Kaitkan Bahan BHP Baru</h4>
                    
                    <div className="flex items-stretch gap-2">
                      <div className="relative flex-1">
                        <select
                          value={addMatId}
                          onChange={e => setAddMatId(e.target.value)}
                          className="w-full text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 pl-3 pr-8 py-2 text-zinc-900 dark:text-zinc-100 appearance-none h-10 cursor-pointer"
                        >
                          <option value="">+ Pilih Bahan...</option>
                          {allMaterials
                            .filter(m => !svcMaterials.find(sm => sm.material_id === m.id))
                            .map(m => (
                              <option key={m.id} value={m.id}>
                                {m.name}{m.pack_label ? ` (${m.pack_label})` : ''} · {formatRp(Math.round(m.customers_per_pack > 0 ? m.pack_price / m.customers_per_pack : 0))}/cust
                              </option>
                            ))}
                        </select>
                        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                          <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                      </div>

                      <div className="relative w-16 shrink-0">
                        <input
                          type="number"
                          min={1}
                          step={1}
                          value={addMatQty || ''}
                          onChange={e => setAddMatQty(Math.max(1, Math.round(Number(e.target.value))))}
                          className="w-full text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2 py-2 text-center text-zinc-900 dark:text-zinc-100 font-mono h-10"
                        />
                        <div className="absolute inset-y-0 right-1 flex items-center pointer-events-none">
                          <span className="text-zinc-400 text-[10px] font-bold">×</span>
                        </div>
                      </div>

                      <button
                        onClick={addMaterial}
                        disabled={!addMatId || addMatQty <= 0 || addingMat}
                        className="bg-earth-primary hover:bg-earth-primary/95 text-white flex items-center justify-center rounded-lg px-4 h-10 disabled:opacity-50 transition-colors shadow-sm shrink-0"
                      >
                        {addingMat ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                      </button>
                    </div>

                    {/* Preview cost calculation */}
                    {addMatId && (() => {
                      const mat = allMaterials.find(m => m.id === addMatId);
                      if (!mat || mat.customers_per_pack <= 0) return null;
                      const base = mat.pack_price / mat.customers_per_pack;
                      const cost = addMatQty * base;
                      return (
                        <p className="text-[10px] text-zinc-450 dark:text-zinc-400 px-1 font-medium">
                          {formatRp(mat.pack_price)} ÷ {mat.customers_per_pack}
                          {addMatQty > 1 && <span className="text-amber-500"> × {addMatQty}</span>}
                          {' = '}
                          <span className="font-mono font-semibold text-earth-primary">{formatRp(Math.round(cost))}/customer</span>
                        </p>
                      );
                    })()}
                  </div>
                </div>
              )}

              {activeTab === 'bundle' && (
                <div className="space-y-4">
                  <div className="flex bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/30 flex-col gap-2">
                    <label className="flex items-center gap-2.5 cursor-pointer text-sm font-semibold text-blue-900 dark:text-blue-300">
                      <input
                        type="checkbox"
                        checked={isBundle}
                        onChange={e => setIsBundle(e.target.checked)}
                        className="rounded border-zinc-300 text-blue-600 focus:ring-blue-600 w-4 h-4 animate-none"
                      />
                      Aktifkan Mode Paket (Auto Split)
                    </label>
                    <p className="text-[10px] text-blue-700/70 dark:text-blue-400/60 leading-relaxed mt-1">
                      Mode paket memecah satu pesanan utama menjadi beberapa bagian item internal untuk perhitungan porsi komisi terapis atau pencatatan durasi terpisah.
                    </p>
                  </div>

                  {isBundle && (
                    <div className="space-y-3.5 pt-2">
                      <div>
                        <label className="text-xs font-semibold text-zinc-500 mb-1.5 block">
                          Pilih Layanan Sub-Bagian (Split Items)
                        </label>
                        
                        <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden max-h-64 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20">
                          {allServices
                            .filter(s => s.category === 'split_items' && s.id !== service.id)
                            .map(s => {
                              const checked = bundleChildIds.includes(s.id);
                              return (
                                <label key={s.id} className="flex items-center justify-between p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 cursor-pointer">
                                  <div className="flex items-center gap-2.5">
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() => {
                                        setBundleChildIds(prev =>
                                          checked ? prev.filter(id => id !== s.id) : [...prev, s.id]
                                        );
                                      }}
                                      className="rounded border-zinc-300 text-earth-primary focus:ring-earth-primary w-4 h-4"
                                    />
                                    <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200">{s.name}</span>
                                  </div>
                                  <span className="text-xs font-mono text-zinc-450">{formatRp(s.price)}</span>
                                </label>
                              );
                            })}
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={saveBundleSettings}
                    disabled={savingBundle || (isBundle && bundleChildIds.length === 0)}
                    className="w-full admin-btn-primary flex justify-center py-2.5 mt-2 text-xs font-bold disabled:opacity-50"
                  >
                    {savingBundle ? <Loader2 size={14} className="animate-spin" /> : 'Simpan Setelan Paket'}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ──────────────────────────────────────────
// Main Page Component
// ──────────────────────────────────────────
export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('packages');

  // Form Modal States
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Service>>({});
  const [saving, setSaving] = useState(false);

  // Drawer States
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Category management state
  const [showManageCats, setShowManageCats] = useState(false);
  const [newCatId, setNewCatId]             = useState('');
  const [newCatLabel, setNewCatLabel]       = useState('');
  const [catSaving, setCatSaving]           = useState(false);

  // BHP materials reference data
  const [allMaterials, setAllMaterials]     = useState<Material[]>([]);

  const { settings } = useSettings();
  const defaultCommission = Number(settings.terapis_commission_pct ?? 30);
  const supabase = createClient();

  const fetchServices = useCallback(async () => {
    setLoading(true);
    const [{ data: svcData }, { data: matData }, { data: catData }] = await Promise.all([
      supabase.from('services').select('*').order('category').order('sort_order'),
      supabase.from('materials').select('id,name,pack_label,pack_price,customers_per_pack,is_global').order('name'),
      supabase.from('service_categories').select('*').order('sort_order'),
    ]);
    if (svcData) setServices(svcData);
    if (matData) setAllMaterials(matData);
    if (catData && catData.length > 0) {
      setCategories(catData);
      if (!catData.find(c => c.id === activeTab)) {
        setActiveTab(catData[0].id);
      }
    }
    setLoading(false);
  }, [activeTab]);

  useEffect(() => { fetchServices(); }, [fetchServices]);

  const handleAddCategory = async () => {
    if (!newCatId.trim() || !newCatLabel.trim()) return;
    setCatSaving(true);
    const cleanId = newCatId.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const maxOrder = Math.max(0, ...categories.map(c => c.sort_order));
    const { error } = await supabase.from('service_categories').insert({
      id: cleanId,
      label: newCatLabel.trim(),
      sort_order: maxOrder + 1,
    });
    if (error) {
      alert('Gagal menambah kategori: ' + error.message);
    } else {
      setNewCatId('');
      setNewCatLabel('');
      await fetchServices();
    }
    setCatSaving(false);
  };

  const handleDeleteCategory = async (catId: string) => {
    const count = services.filter(s => s.category === catId).length;
    if (count > 0) {
      alert(`Kategori ini tidak dapat dihapus karena masih digunakan oleh ${count} layanan. Silakan ubah atau hapus layanan tersebut terlebih dahulu.`);
      return;
    }
    if (!confirm('Hapus kategori ini?')) return;
    setCatSaving(true);
    const { error } = await supabase.from('service_categories').delete().eq('id', catId);
    if (error) {
      alert('Gagal menghapus kategori: ' + error.message);
    } else {
      if (activeTab === catId) {
        const remaining = categories.filter(c => c.id !== catId);
        if (remaining.length > 0) setActiveTab(remaining[0].id);
      }
      await fetchServices();
    }
    setCatSaving(false);
  };

  const handleMoveCategory = async (catId: string, direction: 'up' | 'down') => {
    const idx = categories.findIndex(c => c.id === catId);
    if (idx === -1) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === categories.length - 1) return;

    setCatSaving(true);
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    const currentCat = categories[idx];
    const targetCat = categories[targetIdx];

    const temp = currentCat.sort_order;
    currentCat.sort_order = targetCat.sort_order;
    targetCat.sort_order = temp;

    const { error } = await supabase.from('service_categories').upsert([
      { id: currentCat.id, label: currentCat.label, sort_order: currentCat.sort_order },
      { id: targetCat.id, label: targetCat.label, sort_order: targetCat.sort_order },
    ]);

    if (error) {
      alert('Gagal mengubah urutan: ' + error.message);
    } else {
      await fetchServices();
    }
    setCatSaving(false);
  };

  const startEdit = (s: Service) => {
    setEditId(s.id);
    setFormData({
      name: s.name,
      details: s.details,
      price: s.price,
      category: s.category,
      category_label: s.category_label,
      is_bestseller: s.is_bestseller,
      is_featured: s.is_featured,
      featured_image: s.featured_image ?? '',
      featured_description: s.featured_description ?? '',
      featured_duration: s.featured_duration ?? '',
      is_bundle: s.is_bundle ?? false,
      bundle_child_ids: s.bundle_child_ids ?? [],
      estimated_duration: s.estimated_duration ?? 90,
    });
    setShowEdit(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.category) return;
    setSaving(true);
    if (editId) {
      await supabase.from('services').update(formData).eq('id', editId);
      // Sync drawer model if open
      if (selectedService && selectedService.id === editId) {
        setSelectedService(prev => prev ? { ...prev, ...formData } : null);
      }
    } else {
      const maxOrder = Math.max(0, ...services.filter(s => s.category === formData.category).map(s => s.sort_order));
      await supabase.from('services').insert({
        ...formData,
        sort_order: maxOrder + 1,
      });
    }
    await fetchServices();
    setEditId(null);
    setShowAdd(false);
    setShowEdit(false);
    setSaving(false);
  };

  const toggleBestseller = async (s: Service) => {
    const nextVal = !s.is_bestseller;
    await supabase.from('services').update({ is_bestseller: nextVal }).eq('id', s.id);
    setServices(prev => prev.map(x => x.id === s.id ? { ...x, is_bestseller: nextVal } : x));
    if (selectedService && selectedService.id === s.id) {
      setSelectedService(prev => prev ? { ...prev, is_bestseller: nextVal } : null);
    }
  };

  const toggleFeatured = async (s: Service) => {
    const nextVal = !s.is_featured;
    await supabase.from('services').update({ is_featured: nextVal }).eq('id', s.id);
    setServices(prev => prev.map(x => x.id === s.id ? { ...x, is_featured: nextVal } : x));
    if (selectedService && selectedService.id === s.id) {
      setSelectedService(prev => prev ? { ...prev, is_featured: nextVal } : null);
    }
  };

  const deleteService = async (id: string) => {
    if (!confirm('Hapus layanan ini?')) return;
    await supabase.from('services').delete().eq('id', id);
    setServices(prev => prev.filter(s => s.id !== id));
    if (selectedService?.id === id) {
      setDrawerOpen(false);
    }
  };

  const filtered = services.filter(s => s.category === activeTab);
  const cat = categories.find(c => c.id === activeTab);
  const bestsellerCount = services.filter(s => s.is_bestseller).length;
  const featuredCount = services.filter(s => s.is_featured).length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <FlaskConical size={20} className="text-earth-primary" /> Services & Pricelist
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 font-medium">
            Kelola menu treatment, bagi hasil terapis, auto split bundle, dan kalkulasi bahan BHP.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowManageCats(true)} className="admin-btn-ghost text-xs py-2">
            Kelola Kategori
          </button>
          <button
            onClick={() => {
              setFormData({
                name: '', details: '', price: 0, is_bestseller: false, is_featured: false,
                featured_image: '', featured_description: '', featured_duration: '',
                is_bundle: false, bundle_child_ids: [], estimated_duration: 90,
                category: activeTab, category_label: cat?.label ?? ''
              });
              setEditId(null);
              setShowAdd(true);
            }}
            className="admin-btn-primary text-xs"
          >
            <Plus size={16} /> Tambah Layanan
          </button>
        </div>
      </div>

      {/* Summary Analytics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: FlaskConical, label: 'Total Layanan', value: services.length.toString(), color: 'text-zinc-500 bg-zinc-500/10' },
          { icon: Star, label: 'Best Seller', value: bestsellerCount.toString(), color: 'text-amber-600 bg-amber-500/10 dark:text-amber-400' },
          { icon: Eye, label: 'Featured (Promo)', value: featuredCount.toString(), color: 'text-blue-600 bg-blue-500/10 dark:text-blue-400' },
          { icon: Clock, label: 'Kategori Aktif', value: categories.length.toString(), color: 'text-purple-600 bg-purple-500/10 dark:text-purple-400' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
            <div className={`w-7 h-7 rounded-xl flex items-center justify-center mb-2.5 ${color.split(' ')[1]}`}>
              <Icon size={14} className={color.split(' ')[0]} />
            </div>
            <p className="text-base font-bold text-zinc-900 dark:text-white leading-tight">{value}</p>
            <p className="text-[10px] text-zinc-400 font-semibold mt-1 uppercase tracking-wider">{label}</p>
          </div>
        ))}
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl overflow-x-auto">
        {categories.map(c => (
          <button
            key={c.id}
            onClick={() => setActiveTab(c.id)}
            className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === c.id
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
            }`}
          >
            {c.label} ({services.filter(s => s.category === c.id).length})
          </button>
        ))}
      </div>

      {/* Services List Grid */}
      {loading ? (
        <AdminSkeleton rows={6} />
      ) : (
        <div className="space-y-2">
          {filtered.map(svc => (
            <div
              key={svc.id}
              onClick={() => {
                setSelectedService(svc);
                setDrawerOpen(true);
              }}
              className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-all shadow-sm animate-none"
            >
              <div className="flex items-center gap-3.5 flex-1 min-w-0">
                <div className="flex flex-col gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                  <button onClick={() => toggleBestseller(svc)} title="Toggle Best Seller"
                    className={`p-1 rounded-lg transition-colors ${svc.is_bestseller ? 'text-amber-400' : 'text-zinc-300 dark:text-zinc-650 hover:text-amber-300'}`}>
                    <Star size={16} className={svc.is_bestseller ? 'fill-amber-400' : ''} />
                  </button>
                  <button onClick={() => toggleFeatured(svc)} title="Toggle Featured"
                    className={`p-1 rounded-lg transition-colors ${svc.is_featured ? 'text-blue-400' : 'text-zinc-300 dark:text-zinc-650 hover:text-blue-300'}`}>
                    <Eye size={16} />
                  </button>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-zinc-900 dark:text-white text-sm leading-tight">{svc.name}</h4>
                    {svc.is_bestseller && (
                      <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        BEST SELLER
                      </span>
                    )}
                    {svc.is_featured && (
                      <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        FEATURED
                      </span>
                    )}
                    {svc.is_bundle && (
                      <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                        PAKET
                      </span>
                    )}
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-750">
                      ⏱ {svc.estimated_duration ?? 90} MNT
                    </span>
                  </div>
                  <p className="text-xs text-zinc-450 dark:text-zinc-400 mt-1 line-clamp-1">{svc.details || 'Belum ada deskripsi.'}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 shrink-0" onClick={e => e.stopPropagation()}>
                <p className="text-sm font-semibold text-zinc-900 dark:text-white font-mono">{formatRp(svc.price)}</p>
                <button
                  onClick={() => startEdit(svc)}
                  className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-blue-500 transition-colors"
                  title="Edit Info Layanan"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => deleteService(svc.id)}
                  className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-zinc-400 hover:text-red-500 transition-colors"
                  title="Hapus Layanan"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-xs text-zinc-400 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
              Belum ada layanan di kategori ini.
            </div>
          )}
        </div>
      )}

      {/* Sliding Service Detail Drawer */}
      <ServiceDrawer
        service={selectedService}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onEdit={() => {
          if (selectedService) {
            setDrawerOpen(false);
            startEdit(selectedService);
          }
        }}
        allMaterials={allMaterials}
        allServices={services}
        onSaveSuccess={fetchServices}
      />

      {/* Add Service Modal */}
      <ServiceModalForm
        isOpen={showAdd}
        data={formData}
        saving={saving}
        isNew={true}
        categories={categories}
        defaultCommission={defaultCommission}
        onChange={setFormData}
        onSave={handleSave}
        onCancel={() => setShowAdd(false)}
      />

      {/* Edit Service Modal */}
      <ServiceModalForm
        isOpen={showEdit}
        data={formData}
        saving={saving}
        isNew={false}
        categories={categories}
        defaultCommission={defaultCommission}
        onChange={setFormData}
        onSave={handleSave}
        onCancel={() => setShowEdit(false)}
      />

      {/* Manage Categories Modal */}
      {showManageCats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 w-full max-w-lg shadow-xl border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[90vh] space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-150 dark:border-zinc-800 shrink-0">
              <h3 className="font-semibold text-zinc-900 dark:text-white text-sm">Kelola Kategori Layanan</h3>
              <button onClick={() => setShowManageCats(false)} className="text-zinc-400 hover:text-zinc-600"><X size={18} /></button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-2 py-2 scrollbar-thin">
              {categories.map((c, idx) => (
                <div key={c.id} className="flex items-center justify-between p-3.5 bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-200 dark:border-zinc-800 rounded-xl">
                  <div>
                    <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{c.label}</p>
                    <p className="text-[10px] font-mono text-zinc-400 mt-0.5">ID: {c.id}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleMoveCategory(c.id, 'up')}
                      disabled={idx === 0 || catSaving}
                      className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 disabled:opacity-30 text-xs"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => handleMoveCategory(c.id, 'down')}
                      disabled={idx === categories.length - 1 || catSaving}
                      className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 disabled:opacity-30 text-xs"
                    >
                      ▼
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(c.id)}
                      disabled={catSaving}
                      className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors ml-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-zinc-150 dark:border-zinc-800 space-y-3 shrink-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-500">Tambah Kategori Baru</p>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="ID (Cth: couple_massage)"
                  value={newCatId}
                  onChange={e => setNewCatId(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                  className="admin-input text-xs font-mono"
                />
                <input
                  type="text"
                  placeholder="Nama Label (Cth: Couple Massage)"
                  value={newCatLabel}
                  onChange={e => setNewCatLabel(e.target.value)}
                  className="admin-input text-xs"
                />
              </div>
              <button
                onClick={handleAddCategory}
                disabled={!newCatId.trim() || !newCatLabel.trim() || catSaving}
                className="admin-btn-primary w-full justify-center text-xs py-2.5 disabled:opacity-50"
              >
                {catSaving ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Tambah Kategori
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
