'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Check, X, Star, Loader2, Eye, Percent } from 'lucide-react';
import { createClient } from '@/lib/supabase';
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
};

const CATEGORIES = [
  { id: 'packages',    label: 'Massage Packages' },
  { id: 'services',   label: 'Massage Services' },
  { id: 'reflexology',label: 'Refleksi Service' },
  { id: 'addons',     label: 'Add-On Service' },
];

const formatRp = (n: number) => `Rp ${Number(n).toLocaleString('id-ID')}`;

// Commission calculator UI component (reusable in both add + edit)
function CommissionCalc({ price, split, onSplitChange }: {
  price: number;
  split: number;
  onSplitChange: (v: number) => void;
}) {
  const terapisCut = Math.round(price * split / 100);
  const pemilikCut = price - terapisCut;

  return (
    <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Percent size={13} className="text-amber-600 dark:text-amber-400" />
        <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">Kalkulasi Bagi Hasil Terapis</span>
      </div>
      <div className="flex items-center gap-2">
        <label className="text-xs text-amber-600 dark:text-amber-400 whitespace-nowrap">Terapis dapat</label>
        <input
          type="number"
          min={0}
          max={100}
          value={split}
          onChange={e => onSplitChange(Math.min(100, Math.max(0, Number(e.target.value))))}
          className="w-16 text-center text-xs font-mono rounded-lg border border-amber-200 dark:border-amber-700 bg-white dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 px-2 py-1 outline-none focus:ring-1 focus:ring-amber-400"
        />
        <span className="text-xs text-amber-600 dark:text-amber-400">%</span>
      </div>
      {price > 0 && (
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="bg-white dark:bg-amber-950/30 rounded-lg px-3 py-2 border border-amber-100 dark:border-amber-800">
            <p className="text-[10px] text-amber-500 font-medium mb-0.5">Terapis ({split}%)</p>
            <p className="text-sm font-bold text-amber-700 dark:text-amber-300 font-mono">{formatRp(terapisCut)}</p>
          </div>
          <div className="bg-white dark:bg-amber-950/30 rounded-lg px-3 py-2 border border-amber-100 dark:border-amber-800">
            <p className="text-[10px] text-amber-500 font-medium mb-0.5">Pemilik ({100 - split}%)</p>
            <p className="text-sm font-bold text-amber-700 dark:text-amber-300 font-mono">{formatRp(pemilikCut)}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('packages');
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Service>>({});
  const [editSplit, setEditSplit] = useState(30);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newSvc, setNewSvc] = useState({
    name: '', details: '', price: 0, is_bestseller: false,
    is_featured: false, featured_image: '', featured_description: '', featured_duration: '',
  });
  const [newSplit, setNewSplit] = useState(30);

  const { settings } = useSettings();
  const defaultCommission = Number(settings.terapis_commission_pct ?? 30);
  const supabase = createClient();

  const fetchServices = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('services').select('*').order('category').order('sort_order');
    if (data) setServices(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchServices(); }, [fetchServices]);

  const filtered = services.filter(s => s.category === activeTab);
  const cat = CATEGORIES.find(c => c.id === activeTab);

  const startEdit = (s: Service) => {
    setEditId(s.id);
    setEditSplit(defaultCommission);
    setEditData({
      name: s.name, details: s.details, price: s.price,
      is_bestseller: s.is_bestseller, is_featured: s.is_featured,
      featured_image: s.featured_image ?? '',
      featured_description: s.featured_description ?? '',
      featured_duration: s.featured_duration ?? '',
    });
  };

  const saveEdit = async () => {
    if (!editId) return;
    setSaving(true);
    await supabase.from('services').update(editData).eq('id', editId);
    await fetchServices();
    setEditId(null);
    setSaving(false);
  };

  const toggleBestseller = async (s: Service) => {
    await supabase.from('services').update({ is_bestseller: !s.is_bestseller }).eq('id', s.id);
    setServices(prev => prev.map(x => x.id === s.id ? { ...x, is_bestseller: !x.is_bestseller } : x));
  };

  const toggleFeatured = async (s: Service) => {
    await supabase.from('services').update({ is_featured: !s.is_featured }).eq('id', s.id);
    setServices(prev => prev.map(x => x.id === s.id ? { ...x, is_featured: !x.is_featured } : x));
  };

  const deleteService = async (id: string) => {
    if (!confirm('Hapus layanan ini?')) return;
    await supabase.from('services').delete().eq('id', id);
    setServices(prev => prev.filter(s => s.id !== id));
  };

  const addService = async () => {
    setSaving(true);
    const maxOrder = Math.max(0, ...filtered.map(s => s.sort_order));
    await supabase.from('services').insert({
      ...newSvc,
      category: activeTab,
      category_label: cat?.label ?? '',
      sort_order: maxOrder + 1,
    });
    await fetchServices();
    setShowAdd(false);
    setNewSvc({ name: '', details: '', price: 0, is_bestseller: false, is_featured: false, featured_image: '', featured_description: '', featured_duration: '' });
    setNewSplit(defaultCommission);
    setSaving(false);
  };

  const featuredCount = services.filter(s => s.is_featured).length;

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">Services & Pricelist</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            {services.length} layanan · {services.filter(s => s.is_bestseller).length} best seller · {featuredCount} featured
          </p>
        </div>
        <button onClick={() => setShowAdd(true)} className="admin-btn-primary">
          <Plus size={16} /> Tambah
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 px-1 text-xs text-zinc-500 dark:text-zinc-400">
        <span className="flex items-center gap-1.5"><Star size={13} className="text-amber-400 fill-amber-400" /> Best Seller = badge di pricelist</span>
        <span className="flex items-center gap-1.5"><Eye size={13} className="text-blue-400" /> Featured = tampil di landing page</span>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg overflow-x-auto">
        {CATEGORIES.map(c => (
          <button
            key={c.id}
            onClick={() => setActiveTab(c.id)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
              activeTab === c.id
                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            {c.label} ({services.filter(s => s.category === c.id).length})
          </button>
        ))}
      </div>

      {/* Services List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-earth-primary" size={24} />
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(svc => (
            <div key={svc.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
              {editId === svc.id ? (
                /* ── Edit Mode ── */
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-zinc-500 mb-1 block">Nama Layanan</label>
                      <input className="admin-input" value={editData.name ?? ''} onChange={e => setEditData(d => ({ ...d, name: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-zinc-500 mb-1 block">Harga (Rp)</label>
                      <input type="number" className="admin-input font-mono" value={editData.price ?? 0}
                        onChange={e => setEditData(d => ({ ...d, price: Number(e.target.value) }))} />
                    </div>
                  </div>

                  {/* Commission Calculator */}
                  <CommissionCalc
                    price={editData.price ?? 0}
                    split={editSplit}
                    onSplitChange={setEditSplit}
                  />

                  <div>
                    <label className="text-xs font-medium text-zinc-500 mb-1 block">Detail / Deskripsi</label>
                    <textarea className="admin-input resize-none" rows={2} value={editData.details ?? ''}
                      onChange={e => setEditData(d => ({ ...d, details: e.target.value }))} />
                  </div>

                  {editData.is_featured && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-100 dark:border-blue-900">
                      <div>
                        <label className="text-xs font-medium text-blue-600 mb-1 block">Featured Description</label>
                        <input className="admin-input text-xs" value={editData.featured_description ?? ''}
                          onChange={e => setEditData(d => ({ ...d, featured_description: e.target.value }))} />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-blue-600 mb-1 block">Duration (e.g. 145 Min)</label>
                        <input className="admin-input text-xs" value={editData.featured_duration ?? ''}
                          onChange={e => setEditData(d => ({ ...d, featured_duration: e.target.value }))} />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-xs font-medium text-blue-600 mb-1 block">Image Path (e.g. /featured-refine.png)</label>
                        <input className="admin-input text-xs font-mono" value={editData.featured_image ?? ''}
                          onChange={e => setEditData(d => ({ ...d, featured_image: e.target.value }))} />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-zinc-600 dark:text-zinc-400">
                      <input type="checkbox" checked={editData.is_bestseller ?? false}
                        onChange={e => setEditData(d => ({ ...d, is_bestseller: e.target.checked }))} className="accent-amber-500" />
                      Best Seller
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-zinc-600 dark:text-zinc-400">
                      <input type="checkbox" checked={editData.is_featured ?? false}
                        onChange={e => setEditData(d => ({ ...d, is_featured: e.target.checked }))} className="accent-blue-500" />
                      Featured
                    </label>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={saveEdit} disabled={saving} className="admin-btn-primary">
                      {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Simpan
                    </button>
                    <button onClick={() => setEditId(null)} className="admin-btn-ghost"><X size={14} /> Batal</button>
                  </div>
                </div>
              ) : (
                /* ── View Mode ── */
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex flex-col gap-1 shrink-0">
                      <button onClick={() => toggleBestseller(svc)} title="Toggle Best Seller"
                        className={`p-1 rounded transition-colors ${svc.is_bestseller ? 'text-amber-400' : 'text-zinc-300 dark:text-zinc-600 hover:text-amber-300'}`}>
                        <Star size={15} className={svc.is_bestseller ? 'fill-amber-400' : ''} />
                      </button>
                      <button onClick={() => toggleFeatured(svc)} title="Toggle Featured"
                        className={`p-1 rounded transition-colors ${svc.is_featured ? 'text-blue-400' : 'text-zinc-300 dark:text-zinc-600 hover:text-blue-300'}`}>
                        <Eye size={15} />
                      </button>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-zinc-900 dark:text-white text-sm">{svc.name}</p>
                        {svc.is_bestseller && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                            Best Seller
                          </span>
                        )}
                        {svc.is_featured && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                            Featured
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400 truncate mt-0.5">{svc.details}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white font-mono hidden sm:block">{formatRp(svc.price)}</p>
                    <button onClick={() => startEdit(svc)} className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => deleteService(svc.id)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-zinc-400 hover:text-red-500">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-sm text-zinc-400">Belum ada layanan di kategori ini.</div>
          )}
        </div>
      )}

      {/* ── Add Service Modal ── */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowAdd(false)} />
          <div className="relative w-full sm:max-w-md bg-white dark:bg-zinc-900 rounded-t-2xl sm:rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 space-y-3 z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-zinc-900 dark:text-white">Tambah Layanan — {cat?.label}</h3>
              <button onClick={() => setShowAdd(false)} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400">
                <X size={16} />
              </button>
            </div>

            <input className="admin-input" placeholder="Nama Layanan" value={newSvc.name}
              onChange={e => setNewSvc(n => ({ ...n, name: e.target.value }))} />
            <textarea className="admin-input resize-none" rows={2} placeholder="Detail / Deskripsi" value={newSvc.details}
              onChange={e => setNewSvc(n => ({ ...n, details: e.target.value }))} />

            <div>
              <label className="text-xs font-medium text-zinc-500 mb-1.5 block">Harga (Rp)</label>
              <input type="number" className="admin-input font-mono" placeholder="Harga" value={newSvc.price || ''}
                onChange={e => setNewSvc(n => ({ ...n, price: Number(e.target.value) }))} />
            </div>

            {/* Commission Calculator */}
            <CommissionCalc
              price={newSvc.price}
              split={newSplit}
              onSplitChange={setNewSplit}
            />

            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-zinc-600 dark:text-zinc-400">
                <input type="checkbox" checked={newSvc.is_bestseller}
                  onChange={e => setNewSvc(n => ({ ...n, is_bestseller: e.target.checked }))} className="accent-amber-500" />
                Best Seller
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm text-zinc-600 dark:text-zinc-400">
                <input type="checkbox" checked={newSvc.is_featured}
                  onChange={e => setNewSvc(n => ({ ...n, is_featured: e.target.checked }))} className="accent-blue-500" />
                Featured
              </label>
            </div>

            {newSvc.is_featured && (
              <div className="space-y-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-100 dark:border-blue-900">
                <input className="admin-input text-xs" placeholder="Featured description"
                  value={newSvc.featured_description} onChange={e => setNewSvc(n => ({ ...n, featured_description: e.target.value }))} />
                <input className="admin-input text-xs" placeholder="Duration (e.g. 145 Min)"
                  value={newSvc.featured_duration} onChange={e => setNewSvc(n => ({ ...n, featured_duration: e.target.value }))} />
                <input className="admin-input text-xs font-mono" placeholder="Image path (e.g. /featured-refine.png)"
                  value={newSvc.featured_image} onChange={e => setNewSvc(n => ({ ...n, featured_image: e.target.value }))} />
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowAdd(false)} className="admin-btn-ghost flex-1 justify-center">Batal</button>
              <button onClick={addService} disabled={saving || !newSvc.name} className="admin-btn-primary flex-1 justify-center disabled:opacity-50">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Tambah
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
