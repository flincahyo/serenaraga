'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Plus, Pencil, Trash2, Check, X, Loader2,
  FlaskConical, Globe2, Package, AlertTriangle, Users, Layers, ToggleLeft, ToggleRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase';
import { AdminSkeleton } from '@/components/admin/AdminSkeleton';

type Material = {
  id: string;
  name: string;
  pack_label: string;
  pack_price: number;
  customers_per_pack: number;
  is_global: boolean;
  notes: string;
};

type Service = { id: string; name: string; category: string; details?: string };

const EMPTY_MAT: Omit<Material, 'id'> = {
  name: '', pack_label: '', pack_price: 0,
  customers_per_pack: 1, is_global: false, notes: '',
};

const formatRp = (n: number) => `Rp ${Number(n).toLocaleString('id-ID')}`;
const cpc = (m: Pick<Material, 'pack_price' | 'customers_per_pack'>) =>
  m.customers_per_pack > 0 ? m.pack_price / m.customers_per_pack : 0;

// ──────────────────────────────────────────
// MaterialModalForm Component
// ──────────────────────────────────────────
function MaterialModalForm({
  isOpen,
  data,
  saving,
  isNew,
  onChange,
  onSave,
  onCancel,
}: {
  isOpen: boolean;
  data: Omit<Material, 'id'>;
  saving: boolean;
  isNew: boolean;
  onChange: (d: Omit<Material, 'id'>) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  if (!isOpen) return null;
  const costPerCustomer = cpc(data);

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
          className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl w-full max-w-md p-6 relative z-10 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
            <h3 className="font-semibold text-zinc-950 dark:text-white flex items-center gap-2">
              <FlaskConical size={16} className="text-earth-primary" />
              {isNew ? 'Tambah Bahan Baru' : 'Edit Data Bahan'}
            </h3>
            <button onClick={onCancel} className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg">
              <X size={16} />
            </button>
          </div>

          <div className="space-y-3.5">
            <div>
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1 block">Nama Bahan *</label>
              <input
                type="text"
                className="admin-input"
                placeholder="Minyak Pijat, Alas Pijat, dll"
                value={data.name}
                onChange={e => onChange({ ...data, name: e.target.value })}
                autoFocus
              />
            </div>
            
            <div>
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1 block">Keterangan Kemasan</label>
              <input
                type="text"
                className="admin-input"
                placeholder="100ml, 1 botol, 1 pak 50 lembar..."
                value={data.pack_label}
                onChange={e => onChange({ ...data, pack_label: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1 block">Harga per Kemasan (Rp)</label>
                <input
                  type="number"
                  min={0}
                  className="admin-input font-mono"
                  placeholder="50000"
                  value={data.pack_price || ''}
                  onChange={e => onChange({ ...data, pack_price: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1 block">Kuota Customer</label>
                <input
                  type="number"
                  min={1}
                  step={1}
                  className="admin-input font-mono"
                  placeholder="10"
                  value={data.customers_per_pack || ''}
                  onChange={e => onChange({ ...data, customers_per_pack: Number(e.target.value) })}
                />
              </div>
            </div>

            {data.pack_price > 0 && data.customers_per_pack > 0 && (
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250/20 dark:border-emerald-800/30">
                <Users size={14} className="text-emerald-600 shrink-0" />
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex-1">
                  {formatRp(data.pack_price)} ÷ {data.customers_per_pack} customer
                </p>
                <span className="text-sm font-bold font-mono text-emerald-700 dark:text-emerald-300 font-bold">
                  = {formatRp(costPerCustomer)}<span className="text-xs font-normal">/customer</span>
                </span>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1 block">Catatan (opsional)</label>
              <input
                type="text"
                className="admin-input text-xs"
                placeholder="Merek, info tambahan..."
                value={data.notes}
                onChange={e => onChange({ ...data, notes: e.target.value })}
              />
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer p-3 rounded-xl border border-dashed border-emerald-300 dark:border-emerald-750 bg-emerald-50/50 dark:bg-emerald-950/10">
              <input
                type="checkbox"
                checked={data.is_global}
                onChange={e => onChange({ ...data, is_global: e.target.checked })}
                className="rounded border-zinc-300 dark:border-zinc-700 text-emerald-600 focus:ring-emerald-600 w-4 h-4"
              />
              <div>
                <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Globe2 size={13} className="text-emerald-600" /> Bahan Global
                </p>
                <p className="text-[10px] text-zinc-400 mt-0.5">Otomatis dihitung di semua layanan (alas pijat, handuk, dll)</p>
              </div>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <button onClick={onCancel} className="admin-btn-ghost text-xs">
              Batal
            </button>
            <button
              onClick={onSave}
              disabled={saving || !data.name}
              className="admin-btn-primary text-xs disabled:opacity-50"
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
              {isNew ? 'Tambah' : 'Simpan'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// ──────────────────────────────────────────
// MaterialDrawer Component
// ──────────────────────────────────────────
function MaterialDrawer({
  material,
  isOpen,
  onClose,
  onEdit,
}: {
  material: Material | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
}) {
  const supabase = createClient();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isGlobal, setIsGlobal] = useState(false);

  useEffect(() => {
    if (isOpen && material) {
      setIsGlobal(material.is_global);
      loadAssociatedServices(material.id);
    }
  }, [isOpen, material]);

  const loadAssociatedServices = async (matId: string) => {
    setLoading(true);
    const { data } = await supabase
      .from('service_materials')
      .select('qty_multiplier, services(id, name, category)')
      .eq('material_id', matId);
    
    if (data) {
      setServices(data);
    } else {
      setServices([]);
    }
    setLoading(false);
  };

  const toggleGlobal = async () => {
    if (!material) return;
    setSaving(true);
    const nextVal = !isGlobal;
    await supabase.from('materials').update({ is_global: nextVal }).eq('id', material.id);
    setIsGlobal(nextVal);
    material.is_global = nextVal; // update reference locally
    setSaving(false);
  };

  if (!material) return null;
  const costPerCust = cpc(material);

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
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-earth-primary to-emerald-600 flex items-center justify-center text-white font-bold shadow-sm shrink-0">
                  <Package size={16} />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900 dark:text-white leading-tight">
                    {material.name}
                  </h3>
                  {material.pack_label && (
                    <p className="text-xs text-zinc-400 font-mono mt-0.5">{material.pack_label}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={onEdit}
                  className="p-2 text-zinc-500 hover:text-earth-primary hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                  title="Edit Bahan"
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

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Cost Breakdown Analysis */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-250 uppercase tracking-wider">
                  Analisis Biaya (Cost breakdown)
                </h4>
                
                <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] text-zinc-400 font-bold block uppercase">Harga Kemasan</span>
                    <span className="text-sm font-bold text-zinc-850 dark:text-zinc-100 font-mono mt-0.5 block">
                      {formatRp(material.pack_price)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 font-bold block uppercase">Kuota Customer</span>
                    <span className="text-sm font-bold text-zinc-850 dark:text-zinc-100 font-mono mt-0.5 block">
                      {material.customers_per_pack}x customer
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250/20 rounded-2xl">
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400">
                    Beban Biaya per Customer
                  </span>
                  <span className="text-base font-bold font-mono text-emerald-700 dark:text-emerald-300">
                    {formatRp(Math.round(costPerCust))}/customer
                  </span>
                </div>
              </div>

              {/* Setting Global Toggle */}
              <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                    <Globe2 size={13} className="text-emerald-600" /> Tipe Bahan Global
                  </h4>
                  <p className="text-[10px] text-zinc-400 mt-1 max-w-xs">
                    Jika aktif, biaya bahan otomatis dibebankan ke semua jenis layanan.
                  </p>
                </div>
                <button onClick={toggleGlobal} disabled={saving} className="p-1 text-zinc-400 hover:text-zinc-600 transition-colors">
                  {saving ? (
                    <Loader2 size={24} className="animate-spin text-zinc-400" />
                  ) : isGlobal ? (
                    <ToggleRight size={30} className="text-emerald-600" />
                  ) : (
                    <ToggleLeft size={30} />
                  )}
                </button>
              </div>

              {/* Associated Services */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-250 uppercase tracking-wider">
                  Penggunaan Layanan
                </h4>

                {isGlobal ? (
                  <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/10 border border-dashed border-emerald-200 dark:border-emerald-850 rounded-2xl text-xs text-emerald-700 dark:text-emerald-400 leading-relaxed">
                    🌟 **Bahan ini bersifat Global**: Otomatis dikalkulasikan ke dalam biaya operasional **seluruh layanan** tanpa perlu di-assign satu per satu.
                  </div>
                ) : loading ? (
                  <div className="flex justify-center p-6"><Loader2 size={20} className="animate-spin text-zinc-400" /></div>
                ) : services.length === 0 ? (
                  <p className="text-xs text-zinc-400 text-center py-4 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
                    Bahan ini belum dikaitkan ke layanan apa pun. Gunakan tombol **Bulk Assign** di halaman utama untuk mengaitkannya.
                  </p>
                ) : (
                  <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
                    {services.map(row => (
                      <div key={row.services.id} className="p-3.5 flex justify-between items-center text-xs">
                        <div>
                          <p className="font-semibold text-zinc-850 dark:text-zinc-200">
                            {row.services.name}
                          </p>
                          <p className="text-[10px] text-zinc-450 mt-0.5">
                            {row.services.category}
                          </p>
                        </div>
                        {row.qty_multiplier > 1 && (
                          <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold font-mono">
                            {row.qty_multiplier}x multiplier
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes */}
              {material.notes && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-250 uppercase tracking-wider">
                    Catatan
                  </h4>
                  <div className="p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-2xl text-xs italic text-zinc-650 dark:text-zinc-450">
                    &quot;{material.notes}&quot;
                  </div>
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
// Bulk Assign Modal Component
// ──────────────────────────────────────────
function BulkAssignModal({
  materials, services, onClose, onDone,
}: {
  materials: Material[];
  services: Service[];
  onClose: () => void;
  onDone: () => void;
}) {
  const supabase = createClient();
  const [matId, setMatId]   = useState('');
  const [mult, setMult]     = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const toggleSvc = (id: string) => {
    setSelected(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const selectAll = () => setSelected(new Set(services.map(s => s.id)));
  const clearAll  = () => setSelected(new Set());

  const save = async () => {
    if (!matId || selected.size === 0) return;
    setSaving(true);
    const rows = [...selected].map(sid => ({
      service_id: sid, material_id: matId, qty_multiplier: mult,
    }));
    await supabase.from('service_materials').upsert(rows, { onConflict: 'service_id,material_id' });
    setSaving(false);
    onDone();
  };

  const mat = materials.find(m => m.id === matId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      
      {/* Modal Box */}
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-150 dark:border-zinc-800">
          <div>
            <h3 className="font-semibold text-zinc-900 dark:text-white">Bulk Assign BHP ke Layanan</h3>
            <p className="text-xs text-zinc-400 mt-0.5">Pilih bahan lalu centang layanan yang akan memakai bahan ini</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400">
            <X size={16} />
          </button>
        </div>

        {/* Material select */}
        <div className="space-y-3 mb-4">
          <div>
            <label className="text-xs font-semibold text-zinc-500 mb-1 block">Pilih Bahan</label>
            <select className="admin-input text-xs" value={matId} onChange={e => setMatId(e.target.value)}>
              <option value="">-- Pilih bahan --</option>
              {materials.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name}{m.pack_label ? ` (${m.pack_label})` : ''} · {formatRp(cpc(m))}/customer
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-500 mb-1 block">
              Multiplier (1 = normal, 2 = pakai 2× lipat)
            </label>
            <input type="number" min={1} step={1} className="admin-input w-24 font-mono text-xs"
              value={mult} onChange={e => setMult(Math.max(1, Number(e.target.value)))} />
          </div>
          {mat && mult > 0 && (
            <div className="px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-300">
              Cost per customer: <span className="font-mono font-bold">{formatRp(cpc(mat) * mult)}</span>
              {mult > 1 && <span className="ml-1 text-blue-500">({mult}× {formatRp(cpc(mat))})</span>}
            </div>
          )}
        </div>

        {/* Service list */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-zinc-500">Layanan yang akan di-assign</label>
            <div className="flex gap-2">
              <button onClick={selectAll} className="text-[11px] text-earth-primary hover:underline">Pilih Semua</button>
              <span className="text-zinc-300">·</span>
              <button onClick={clearAll} className="text-[11px] text-zinc-400 hover:underline">Hapus Pilihan</button>
            </div>
          </div>
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl divide-y divide-zinc-100 dark:divide-zinc-800 max-h-60 overflow-y-auto bg-zinc-50/50 dark:bg-zinc-950/20">
            {services.map(s => (
              <label key={s.id} className="flex items-start gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 cursor-pointer">
                <input type="checkbox" checked={selected.has(s.id)}
                  onChange={() => toggleSvc(s.id)} className="accent-earth-primary w-4 h-4 mt-0.5 rounded" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 leading-tight">{s.name}</p>
                  {s.details && (
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 line-clamp-1">{s.details}</p>
                  )}
                </div>
              </label>
            ))}
          </div>
          {selected.size > 0 && (
            <p className="text-[11px] text-zinc-450 mt-1.5">{selected.size} layanan dipilih</p>
          )}
        </div>

        <div className="flex gap-2 pt-2 border-t border-zinc-150 dark:border-zinc-800">
          <button onClick={onClose} className="admin-btn-ghost flex-1 justify-center py-2.5 text-xs">Batal</button>
          <button onClick={save} disabled={!matId || selected.size === 0 || saving}
            className="admin-btn-primary flex-1 justify-center py-2.5 text-xs disabled:opacity-50">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            Assign ke {selected.size} Layanan
          </button>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────
// Main Page Component
// ──────────────────────────────────────────
export default function MaterialsPage() {
  const [materials, setMaterials]     = useState<Material[]>([]);
  const [services, setServices]       = useState<Service[]>([]);
  const [loading, setLoading]         = useState(true);

  // Form Modal States
  const [showAdd, setShowAdd]         = useState(false);
  const [showEdit, setShowEdit]       = useState(false);
  const [editId, setEditId]           = useState<string | null>(null);
  const [formData, setFormData]       = useState<Omit<Material, 'id'>>(EMPTY_MAT);
  const [saving, setSaving]           = useState(false);

  // Drawer States
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [deleteId, setDeleteId]       = useState<string | null>(null);
  const [deleting, setDeleting]       = useState(false);
  const [usageCounts, setUsageCounts] = useState<Record<string, number>>({});
  const [showBulk, setShowBulk]       = useState(false);

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [{ data: mats }, { data: svcMats }, { data: svcs }] = await Promise.all([
      supabase.from('materials').select('*').order('name'),
      supabase.from('service_materials').select('material_id'),
      supabase.from('services').select('id, name, category, details').order('category').order('sort_order'),
    ]);
    if (mats) setMaterials(mats);
    if (svcs)  setServices(svcs);
    if (svcMats) {
      const counts: Record<string, number> = {};
      svcMats.forEach(({ material_id }) => { counts[material_id] = (counts[material_id] || 0) + 1; });
      setUsageCounts(counts);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const startEdit = (m: Material) => {
    setEditId(m.id);
    setFormData({
      name: m.name,
      pack_label: m.pack_label,
      pack_price: m.pack_price,
      customers_per_pack: m.customers_per_pack,
      is_global: m.is_global,
      notes: m.notes
    });
    setShowEdit(true);
  };

  const handleSave = async () => {
    if (!formData.name) return;
    setSaving(true);
    if (editId) {
      await supabase.from('materials').update(formData).eq('id', editId);
      // Sync selected material in drawer if open
      if (selectedMaterial && selectedMaterial.id === editId) {
        setSelectedMaterial(prev => prev ? { ...prev, ...formData } : null);
      }
    } else {
      await supabase.from('materials').insert(formData);
    }
    await fetchData();
    setEditId(null);
    setShowAdd(false);
    setShowEdit(false);
    setSaving(false);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    await supabase.from('materials').delete().eq('id', deleteId);
    setMaterials(prev => prev.filter(m => m.id !== deleteId));
    if (selectedMaterial?.id === deleteId) {
      setDrawerOpen(false);
    }
    setDeleteId(null);
    setDeleting(false);
  };

  const toggleGlobal = async (m: Material) => {
    const nextVal = !m.is_global;
    await supabase.from('materials').update({ is_global: nextVal }).eq('id', m.id);
    setMaterials(prev => prev.map(x => x.id === m.id ? { ...x, is_global: nextVal } : x));
    if (selectedMaterial && selectedMaterial.id === m.id) {
      setSelectedMaterial(prev => prev ? { ...prev, is_global: nextVal } : null);
    }
  };

  const globalMats   = materials.filter(m => m.is_global);
  const specificMats = materials.filter(m => !m.is_global);
  
  // Calculations for summary card
  const avgCostPerCust = materials.length
    ? Math.round(materials.reduce((s, m) => s + cpc(m), 0) / materials.length)
    : 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <FlaskConical size={20} className="text-earth-primary" /> Bahan Habis Pakai
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 font-medium">
            Kelola persediaan bahan, penyesuaian porsi pemakaian, dan cost per customer.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowBulk(true)} className="admin-btn-ghost text-xs">
            <Layers size={15} /> Bulk Assign
          </button>
          <button
            onClick={() => {
              setFormData(EMPTY_MAT);
              setEditId(null);
              setShowAdd(true);
            }}
            className="admin-btn-primary text-xs"
          >
            <Plus size={16} /> Tambah Bahan
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { icon: Package, label: 'Total Jenis Bahan', value: materials.length.toString(), color: 'text-zinc-500 bg-zinc-500/10' },
          { icon: Globe2, label: 'Bahan Global', value: globalMats.length.toString(), color: 'text-emerald-600 bg-emerald-500/10 dark:text-emerald-400' },
          { icon: Users, label: 'Rerata Cost / Customer', value: formatRp(avgCostPerCust), color: 'text-purple-600 bg-purple-500/10 dark:text-purple-400' },
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

      {/* Info box */}
      <div className="rounded-2xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30 p-4">
        <div className="flex gap-3">
          <FlaskConical size={18} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1 leading-relaxed">
            <p className="font-bold">💡 Aturan Input Bahan BHP</p>
            <p>Sistem akan menghitung beban biaya operasional per layanan secara dinamis dengan membagi **harga per kemasan** dengan **kuota customer**.</p>
            <p className="opacity-70">Contoh: Minyak aromaterapi seharga Rp 50.000 cukup untuk 10 kali customer → Beban BHP adalah **Rp 5.000 / customer**.</p>
          </div>
        </div>
      </div>

      {loading ? (
        <AdminSkeleton rows={5} />
      ) : (
        <div className="space-y-6">
          {/* Global Materials Section */}
          {globalMats.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Globe2 size={13} /> Bahan Global ({globalMats.length}) — otomatis ke seluruh layanan
              </h2>
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-150 dark:divide-zinc-800 shadow-sm">
                {globalMats.map(m => (
                  <div
                    key={m.id}
                    onClick={() => {
                      setSelectedMaterial(m);
                      setDrawerOpen(true);
                    }}
                    className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-all"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm text-zinc-900 dark:text-white leading-tight">
                          {m.name}
                        </p>
                        {m.pack_label && (
                          <span className="text-[10px] text-zinc-400 font-mono">({m.pack_label})</span>
                        )}
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                          GLOBAL
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-zinc-450 flex-wrap">
                        <span>{formatRp(m.pack_price)} untuk {m.customers_per_pack}x customer</span>
                        <span className="text-zinc-300 dark:text-zinc-700">•</span>
                        <span className="font-mono font-semibold text-earth-primary">
                          Cost: {formatRp(Math.round(cpc(m)))}/customer
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => toggleGlobal(m)}
                        title="Jadikan per-layanan (Spesifik)"
                        className="p-2 rounded-lg text-emerald-600 dark:text-emerald-400 transition-colors"
                      >
                        <ToggleRight size={20} />
                      </button>
                      <button
                        onClick={() => startEdit(m)}
                        className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteId(m.id)}
                        className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-550/10 rounded-lg transition-colors"
                        title="Hapus"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Specific Materials Section */}
          <div className="space-y-2">
            <h2 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Package size={13} /> Bahan Spesifik per Layanan ({specificMats.length})
            </h2>
            
            {specificMats.length === 0 ? (
              <div className="text-center py-12 text-xs text-zinc-400 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                Belum ada bahan spesifik. Klik "Tambah Bahan" untuk mulai.
              </div>
            ) : (
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-150 dark:divide-zinc-800 shadow-sm">
                {specificMats.map(m => (
                  <div
                    key={m.id}
                    onClick={() => {
                      setSelectedMaterial(m);
                      setDrawerOpen(true);
                    }}
                    className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-all"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm text-zinc-900 dark:text-white leading-tight">
                          {m.name}
                        </p>
                        {m.pack_label && (
                          <span className="text-[10px] text-zinc-400 font-mono">({m.pack_label})</span>
                        )}
                        {(usageCounts[m.id] ?? 0) > 0 && (
                          <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-350 border border-zinc-250">
                            {usageCounts[m.id]} LAYANAN
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-zinc-450 flex-wrap">
                        <span>{formatRp(m.pack_price)} untuk {m.customers_per_pack}x customer</span>
                        <span className="text-zinc-300 dark:text-zinc-700">•</span>
                        <span className="font-mono font-semibold text-earth-primary">
                          Cost: {formatRp(Math.round(cpc(m)))}/customer
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => toggleGlobal(m)}
                        title="Jadikan Global"
                        className="p-2 rounded-lg text-zinc-400 hover:text-emerald-500 transition-colors"
                      >
                        <ToggleLeft size={20} />
                      </button>
                      <button
                        onClick={() => startEdit(m)}
                        className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteId(m.id)}
                        className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-550/10 rounded-lg transition-colors"
                        title="Hapus"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sliding Detail Drawer */}
      <MaterialDrawer
        material={selectedMaterial}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onEdit={() => {
          if (selectedMaterial) {
            setDrawerOpen(false);
            startEdit(selectedMaterial);
          }
        }}
      />

      {/* Bulk Assign Modal */}
      {showBulk && (
        <BulkAssignModal
          materials={materials}
          services={services}
          onClose={() => setShowBulk(false)}
          onDone={() => { setShowBulk(false); fetchData(); }}
        />
      )}

      {/* Add Material Modal */}
      <MaterialModalForm
        isOpen={showAdd}
        data={formData}
        saving={saving}
        isNew={true}
        onChange={setFormData}
        onSave={handleSave}
        onCancel={() => setShowAdd(false)}
      />

      {/* Edit Material Modal */}
      <MaterialModalForm
        isOpen={showEdit}
        data={formData}
        saving={saving}
        isNew={false}
        onChange={setFormData}
        onSave={handleSave}
        onCancel={() => setShowEdit(false)}
      />

      {/* Delete Confirmation Dialog */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteId(null)} />
          
          <div className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 z-10">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center">
                <AlertTriangle size={22} className="text-red-500" />
              </div>
              <h3 className="font-semibold text-zinc-900 dark:text-white">Hapus Bahan BHP?</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Tindakan ini akan menghapus **{materials.find(m => m.id === deleteId)?.name}** secara permanen.
                {(usageCounts[deleteId ?? ''] ?? 0) > 0 && (
                  <span className="block mt-2 text-red-500 font-bold">
                    ⚠ Perhatian: Bahan ini masih dikaitkan ke {usageCounts[deleteId ?? '']} layanan! Mengakibatkan data BHP layanan tersebut juga terhapus.
                  </span>
                )}
              </p>
              
              <div className="flex gap-2.5 w-full pt-2 border-t border-zinc-100 dark:border-zinc-800 mt-2">
                <button onClick={() => setDeleteId(null)} className="admin-btn-ghost flex-1 justify-center text-xs py-2">
                  Batal
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl disabled:opacity-60 transition-colors"
                >
                  {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />} Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
