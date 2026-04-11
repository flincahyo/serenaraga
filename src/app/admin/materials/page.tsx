'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Pencil, Trash2, Check, X, Loader2,
  FlaskConical, Globe2, Package, AlertTriangle, Users, Layers,
} from 'lucide-react';
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

// ── Shared form component (OUTSIDE parent to prevent remount on state change) ──
function MatForm({
  data,
  saving,
  onChange,
  onSave,
  onCancel,
  submitLabel = 'Simpan',
}: {
  data: Omit<Material, 'id'>;
  saving: boolean;
  onChange: (d: Omit<Material, 'id'>) => void;
  onSave: () => void;
  onCancel: () => void;
  submitLabel?: string;
}) {
  const costPerCustomer = cpc(data);
  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-medium text-zinc-500 mb-1 block">Nama Bahan *</label>
        <input className="admin-input" placeholder="Minyak Pijat, Alas Pijat, dll"
          value={data.name} onChange={e => onChange({ ...data, name: e.target.value })} />
      </div>
      <div>
        <label className="text-xs font-medium text-zinc-500 mb-1 block">Keterangan Kemasan</label>
        <input className="admin-input" placeholder="100ml, 1 botol, 1 pak 50 lembar..."
          value={data.pack_label} onChange={e => onChange({ ...data, pack_label: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-zinc-500 mb-1 block">Harga per Kemasan (Rp)</label>
          <input type="number" min={0} className="admin-input font-mono" placeholder="50000"
            value={data.pack_price || ''}
            onChange={e => onChange({ ...data, pack_price: Number(e.target.value) })} />
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-500 mb-1 block">Cukup untuk berapa customer?</label>
          <input type="number" min={1} step={1} className="admin-input font-mono" placeholder="10"
            value={data.customers_per_pack || ''}
            onChange={e => onChange({ ...data, customers_per_pack: Number(e.target.value) })} />
        </div>
      </div>
      {data.pack_price > 0 && data.customers_per_pack > 0 && (
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
          <Users size={14} className="text-emerald-600 shrink-0" />
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex-1">
            {formatRp(data.pack_price)} ÷ {data.customers_per_pack} customer
          </p>
          <span className="text-sm font-bold font-mono text-emerald-700 dark:text-emerald-300">
            = {formatRp(costPerCustomer)}<span className="text-xs font-normal">/customer</span>
          </span>
        </div>
      )}
      <div>
        <label className="text-xs font-medium text-zinc-500 mb-1 block">Catatan (opsional)</label>
        <input className="admin-input text-xs" placeholder="Merek, info tambahan..."
          value={data.notes} onChange={e => onChange({ ...data, notes: e.target.value })} />
      </div>
      <label className="flex items-center gap-2.5 cursor-pointer p-3 rounded-lg border border-dashed border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/10">
        <input type="checkbox" checked={data.is_global}
          onChange={e => onChange({ ...data, is_global: e.target.checked })}
          className="accent-emerald-600 w-4 h-4" />
        <div>
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
            <Globe2 size={13} className="text-emerald-600" /> Bahan Global
          </p>
          <p className="text-[11px] text-zinc-400">Otomatis dihitung di semua layanan (alas pijat, handuk, dll)</p>
        </div>
      </label>
      <div className="flex gap-2 pt-1">
        <button onClick={onSave} disabled={saving || !data.name}
          className="admin-btn-primary disabled:opacity-50">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} {submitLabel}
        </button>
        <button onClick={onCancel} className="admin-btn-ghost"><X size={14} /> Batal</button>
      </div>
    </div>
  );
}

// ── bulk assign modal ──
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
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
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
            <label className="text-xs font-medium text-zinc-500 mb-1 block">Pilih Bahan</label>
            <select className="admin-input" value={matId} onChange={e => setMatId(e.target.value)}>
              <option value="">-- Pilih bahan --</option>
              {materials.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name}{m.pack_label ? ` (${m.pack_label})` : ''} · {formatRp(cpc(m))}/customer
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-500 mb-1 block">
              Multiplier (1 = normal, 2 = pakai 2× lipat)
            </label>
            <input type="number" min={1} step={1} className="admin-input w-24 font-mono"
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
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-zinc-500">Layanan yang akan di-assign</label>
            <div className="flex gap-2">
              <button onClick={selectAll} className="text-[11px] text-earth-primary hover:underline">Pilih Semua</button>
              <span className="text-zinc-300">·</span>
              <button onClick={clearAll} className="text-[11px] text-zinc-400 hover:underline">Hapus Pilihan</button>
            </div>
          </div>
          <div className="border border-zinc-200 dark:border-zinc-700 rounded-xl divide-y divide-zinc-100 dark:divide-zinc-800 max-h-64 overflow-y-auto">
            {services.map(s => (
              <label key={s.id} className="flex items-start gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 cursor-pointer">
                <input type="checkbox" checked={selected.has(s.id)}
                  onChange={() => toggleSvc(s.id)} className="accent-earth-primary w-4 h-4 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 leading-tight">{s.name}</p>
                  {s.details && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-1">{s.details}</p>
                  )}
                </div>
              </label>
            ))}
          </div>
          {selected.size > 0 && (
            <p className="text-[11px] text-zinc-400 mt-1.5">{selected.size} layanan dipilih</p>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="admin-btn-ghost flex-1 justify-center">Batal</button>
          <button onClick={save} disabled={!matId || selected.size === 0 || saving}
            className="admin-btn-primary flex-1 justify-center disabled:opacity-50">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            Assign ke {selected.size} Layanan
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ──
export default function MaterialsPage() {
  const [materials, setMaterials]     = useState<Material[]>([]);
  const [services, setServices]       = useState<Service[]>([]);
  const [loading, setLoading]         = useState(true);
  const [editId, setEditId]           = useState<string | null>(null);
  const [editData, setEditData]       = useState<Omit<Material, 'id'>>(EMPTY_MAT);
  const [showAdd, setShowAdd]         = useState(false);
  const [newMat, setNewMat]           = useState<Omit<Material, 'id'>>(EMPTY_MAT);
  const [saving, setSaving]           = useState(false);
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
    setEditData({ name: m.name, pack_label: m.pack_label, pack_price: m.pack_price,
      customers_per_pack: m.customers_per_pack, is_global: m.is_global, notes: m.notes });
  };

  const saveEdit = async () => {
    if (!editId) return;
    setSaving(true);
    await supabase.from('materials').update(editData).eq('id', editId);
    await fetchData();
    setEditId(null);
    setSaving(false);
  };

  const addMaterial = async () => {
    if (!newMat.name) return;
    setSaving(true);
    await supabase.from('materials').insert(newMat);
    await fetchData();
    setShowAdd(false);
    setNewMat(EMPTY_MAT);
    setSaving(false);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    await supabase.from('materials').delete().eq('id', deleteId);
    setMaterials(prev => prev.filter(m => m.id !== deleteId));
    setDeleteId(null);
    setDeleting(false);
  };

  const toggleGlobal = async (m: Material) => {
    await supabase.from('materials').update({ is_global: !m.is_global }).eq('id', m.id);
    setMaterials(prev => prev.map(x => x.id === m.id ? { ...x, is_global: !x.is_global } : x));
  };

  const globalMats   = materials.filter(m => m.is_global);
  const specificMats = materials.filter(m => !m.is_global);

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">Bahan Habis Pakai</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            {materials.length} bahan · {globalMats.length} global
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowBulk(true)} className="admin-btn-ghost">
            <Layers size={15} /> Bulk Assign
          </button>
          <button onClick={() => { setShowAdd(true); setNewMat(EMPTY_MAT); }} className="admin-btn-primary">
            <Plus size={16} /> Tambah Bahan
          </button>
        </div>
      </div>

      {/* Info box */}
      <div className="rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-4">
        <div className="flex gap-3">
          <FlaskConical size={18} className="text-blue-500 shrink-0 mt-0.5" />
          <div className="text-xs text-blue-700 dark:text-blue-300 space-y-0.5">
            <p className="font-semibold">Cara Input Bahan</p>
            <p>Input <strong>harga per kemasan</strong> dan <strong>berapa customer yang bisa dilayani</strong> — sistem otomatis hitung biaya BHP per customer.</p>
            <p className="text-blue-500">Contoh: Minyak pijat 100ml Rp 50.000 cukup 10 customer → <strong>Rp 5.000/customer</strong></p>
          </div>
        </div>
      </div>

      {loading ? (
        <AdminSkeleton rows={5} />
      ) : (
        <>
          {/* Global */}
          {globalMats.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Globe2 size={14} className="text-emerald-600" />
                <h2 className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
                  Bahan Global ({globalMats.length}) — otomatis ke semua layanan
                </h2>
              </div>
              <div className="bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-emerald-800 rounded-xl overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800">
                {globalMats.map(m => (
                  <MaterialRow key={m.id} m={m} editId={editId} editData={editData}
                    usageCount={usageCounts[m.id] ?? 0} saving={saving}
                    onEdit={startEdit} onSave={saveEdit} onCancelEdit={() => setEditId(null)}
                    onDeleteClick={() => setDeleteId(m.id)} onToggleGlobal={() => toggleGlobal(m)}
                    setEditData={setEditData} />
                ))}
              </div>
            </div>
          )}

          {/* Specific */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Package size={14} className="text-zinc-500" />
              <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                Bahan Per Layanan ({specificMats.length})
              </h2>
            </div>
            {specificMats.length === 0 ? (
              <div className="text-center py-12 text-sm text-zinc-400 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                Belum ada bahan. Klik "Tambah Bahan" untuk mulai.
              </div>
            ) : (
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800">
                {specificMats.map(m => (
                  <MaterialRow key={m.id} m={m} editId={editId} editData={editData}
                    usageCount={usageCounts[m.id] ?? 0} saving={saving}
                    onEdit={startEdit} onSave={saveEdit} onCancelEdit={() => setEditId(null)}
                    onDeleteClick={() => setDeleteId(m.id)} onToggleGlobal={() => toggleGlobal(m)}
                    setEditData={setEditData} />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowAdd(false)} />
          <div className="relative w-full sm:max-w-md bg-white dark:bg-zinc-900 rounded-t-2xl sm:rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-zinc-900 dark:text-white">Tambah Bahan Baru</h3>
              <button onClick={() => setShowAdd(false)} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400">
                <X size={16} />
              </button>
            </div>
            <MatForm data={newMat} saving={saving} onChange={setNewMat}
              onSave={addMaterial} onCancel={() => setShowAdd(false)} submitLabel="Tambah" />
          </div>
        </div>
      )}

      {/* Bulk Assign Modal */}
      {showBulk && (
        <BulkAssignModal
          materials={materials}
          services={services}
          onClose={() => setShowBulk(false)}
          onDone={() => { setShowBulk(false); fetchData(); }}
        />
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteId(null)} />
          <div className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 z-10">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center">
                <AlertTriangle size={22} className="text-red-500" />
              </div>
              <h3 className="font-semibold text-zinc-900 dark:text-white">Hapus Bahan?</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {materials.find(m => m.id === deleteId)?.name} — akan dihapus dari semua layanan yang memakainya.
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

// ── Material Row (view + inline edit) ──
function MaterialRow({
  m, editId, editData, usageCount, saving,
  onEdit, onSave, onCancelEdit, onDeleteClick, onToggleGlobal, setEditData,
}: {
  m: Material; editId: string | null; editData: Omit<Material, 'id'>;
  usageCount: number; saving: boolean;
  onEdit: (m: Material) => void; onSave: () => void; onCancelEdit: () => void;
  onDeleteClick: () => void; onToggleGlobal: () => void;
  setEditData: (d: Omit<Material, 'id'>) => void;
}) {
  const costPerCust = cpc(m);

  if (editId === m.id) {
    return (
      <div className="p-4">
        <MatForm data={editData} saving={saving} onChange={setEditData}
          onSave={onSave} onCancel={onCancelEdit} />
      </div>
    );
  }

  return (
    <div className="px-4 py-3 flex items-center gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-medium text-sm text-zinc-900 dark:text-white">{m.name}</p>
          {m.pack_label && <span className="text-[10px] text-zinc-400 font-mono">{m.pack_label}</span>}
          {m.is_global && (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <Globe2 size={9} /> Global
            </span>
          )}
          {usageCount > 0 && (
            <span className="text-[10px] font-medium text-zinc-400">{usageCount} layanan</span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-xs text-zinc-400">
            {formatRp(m.pack_price)} untuk {m.customers_per_pack}x customer
          </p>
          <span className="text-zinc-300 dark:text-zinc-600">·</span>
          <p className="text-xs font-mono font-semibold text-earth-primary">
            {formatRp(Math.round(costPerCust))}/customer
          </p>
        </div>
        {m.notes && <p className="text-[11px] text-zinc-400 italic mt-0.5">{m.notes}</p>}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button onClick={onToggleGlobal} title={m.is_global ? 'Jadikan per-layanan' : 'Jadikan global'}
          className={`p-2 rounded-lg transition-colors ${m.is_global ? 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30' : 'text-zinc-300 dark:text-zinc-600 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'}`}>
          <Globe2 size={15} />
        </button>
        <button onClick={() => onEdit(m)} className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 text-blue-400">
          <Pencil size={14} />
        </button>
        <button onClick={onDeleteClick} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-zinc-400 hover:text-red-500">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
