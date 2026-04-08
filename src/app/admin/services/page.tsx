'use client';

import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Check, X, Star, Loader2 } from 'lucide-react';

interface Service {
  id: number;
  name: string;
  description: string;
  duration: string;
  price: number;
  is_bestseller: boolean;
}

const initialServices: Service[] = [
  { id: 1, name: 'Signature Massage', description: 'Luxury deep tissue massage.', duration: '90m', price: 250000, is_bestseller: true },
  { id: 2, name: 'Traditional Javanese', description: 'Therapeutic healing massage.', duration: '60m', price: 150000, is_bestseller: true },
  { id: 3, name: 'Foot Reflexology', description: 'Relaxing pressure point therapy.', duration: '60m', price: 120000, is_bestseller: false },
  { id: 4, name: 'Aromatherapy', description: 'Sensory massage with essential oils.', duration: '90m', price: 275000, is_bestseller: false },
  { id: 5, name: 'LactaFlow Therapy', description: 'Specialized breast massage for mothers.', duration: '60m', price: 200000, is_bestseller: false },
];

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>(initialServices);
  const [editId, setEditId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<Service>>({});
  const [showAdd, setShowAdd] = useState(false);
  const [newSvc, setNewSvc] = useState({ name: '', description: '', duration: '', price: 0, is_bestseller: false });
  const [saving, setSaving] = useState(false);

  const startEdit = (svc: Service) => {
    setEditId(svc.id);
    setEditData({ name: svc.name, description: svc.description, duration: svc.duration, price: svc.price });
  };

  const saveEdit = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 400));
    setServices(prev => prev.map(s => s.id === editId ? { ...s, ...editData } : s));
    setEditId(null);
    setEditData({});
    setSaving(false);
  };

  const toggleBestseller = (id: number) => {
    setServices(prev => prev.map(s => s.id === id ? { ...s, is_bestseller: !s.is_bestseller } : s));
  };

  const deleteService = (id: number) => {
    setServices(prev => prev.filter(s => s.id !== id));
  };

  const addService = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 400));
    setServices(prev => [...prev, { ...newSvc, id: Date.now() }]);
    setShowAdd(false);
    setNewSvc({ name: '', description: '', duration: '', price: 0, is_bestseller: false });
    setSaving(false);
  };

  const formatRp = (n: number) => `Rp ${Number(n).toLocaleString('id-ID')}`;

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">Services</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">{services.length} layanan terdaftar</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="admin-btn-primary">
          <Plus size={16} /> Tambah Layanan
        </button>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 px-1">
        <Star size={13} className="text-amber-400 fill-amber-400" />
        <span className="text-xs text-zinc-500 dark:text-zinc-400">Best Seller = tampil di halaman depan SerenaRaga</span>
      </div>

      {/* Service Cards */}
      <div className="space-y-3">
        {services.map(svc => (
          <div key={svc.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
            {editId === svc.id ? (
              /* Edit Mode */
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-zinc-500 mb-1 block">Nama Layanan</label>
                    <input className="admin-input" value={editData.name} onChange={e => setEditData(d => ({ ...d, name: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-zinc-500 mb-1 block">Durasi</label>
                    <input className="admin-input" placeholder="ex: 60m" value={editData.duration} onChange={e => setEditData(d => ({ ...d, duration: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-500 mb-1 block">Deskripsi</label>
                  <input className="admin-input" value={editData.description as string} onChange={e => setEditData(d => ({ ...d, description: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-500 mb-1 block">Harga (Rp)</label>
                  <input type="number" className="admin-input font-mono" value={editData.price} onChange={e => setEditData(d => ({ ...d, price: Number(e.target.value) }))} />
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={saveEdit} disabled={saving} className="admin-btn-primary">
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Simpan
                  </button>
                  <button onClick={() => setEditId(null)} className="admin-btn-ghost">
                    <X size={14} /> Batal
                  </button>
                </div>
              </div>
            ) : (
              /* View Mode */
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  {/* Best Seller Toggle */}
                  <button
                    onClick={() => toggleBestseller(svc.id)}
                    className={`shrink-0 p-1.5 rounded-lg transition-colors ${svc.is_bestseller ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-400' : 'text-zinc-300 dark:text-zinc-600 hover:text-amber-300'}`}
                    title={svc.is_bestseller ? 'Best Seller aktif' : 'Jadikan Best Seller'}
                  >
                    <Star size={16} className={svc.is_bestseller ? 'fill-amber-400' : ''} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-zinc-900 dark:text-white">{svc.name}</p>
                      {svc.is_bestseller && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                          Best Seller
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 truncate mt-0.5">{svc.description} · {svc.duration}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-white font-mono hidden sm:block">{formatRp(svc.price)}</p>
                  <button onClick={() => startEdit(svc)} className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => deleteService(svc.id)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-zinc-400 hover:text-red-500">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Service Panel */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowAdd(false)} />
          <div className="relative w-full sm:max-w-sm bg-white dark:bg-zinc-900 rounded-t-2xl sm:rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 space-y-4 z-10">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-zinc-900 dark:text-white">Tambah Layanan</h3>
              <button onClick={() => setShowAdd(false)} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400">
                <X size={16} />
              </button>
            </div>
            <input className="admin-input" placeholder="Nama Layanan" value={newSvc.name} onChange={e => setNewSvc(n => ({ ...n, name: e.target.value }))} />
            <input className="admin-input" placeholder="Deskripsi singkat" value={newSvc.description} onChange={e => setNewSvc(n => ({ ...n, description: e.target.value }))} />
            <div className="grid grid-cols-2 gap-3">
              <input className="admin-input" placeholder="Durasi (60m)" value={newSvc.duration} onChange={e => setNewSvc(n => ({ ...n, duration: e.target.value }))} />
              <input type="number" className="admin-input font-mono" placeholder="Harga (Rp)" value={newSvc.price || ''} onChange={e => setNewSvc(n => ({ ...n, price: Number(e.target.value) }))} />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={newSvc.is_bestseller} onChange={e => setNewSvc(n => ({ ...n, is_bestseller: e.target.checked }))} className="accent-earth-primary" />
              <span className="text-sm text-zinc-600 dark:text-zinc-400">Jadikan Best Seller</span>
            </label>
            <div className="flex gap-3 pt-1">
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
