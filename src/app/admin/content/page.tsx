'use client';

import React, { useState, useRef } from 'react';
import { Upload, Check, X, ImageIcon, Loader2, Image as ImageIcon2, MessageSquare } from 'lucide-react';
import TestimonialEditor from '@/components/admin/TestimonialEditor';

interface ImageSlot {
  id: string;
  label: string;
  description: string;
  preview: string | null;
  file: File | null;
  saving: boolean;
  saved: boolean;
}

const defaultSlots: ImageSlot[] = [
  { id: 'hero', label: 'Hero Background', description: 'Gambar utama di halaman depan', preview: '/hero-bg.png', file: null, saving: false, saved: false },
  { id: 'signature', label: 'Signature Massage', description: 'Best seller card #1', preview: '/featured-refine.png', file: null, saving: false, saved: false },
  { id: 'traditional', label: 'Traditional Javanese', description: 'Best seller card #2', preview: '/featured-renewal.png', file: null, saving: false, saved: false },
  { id: 'reflexology', label: 'Foot Reflexology', description: 'Best seller card #3', preview: '/featured-lactaflow.png', file: null, saving: false, saved: false },
];

export default function ContentPage() {
  const [activeTab, setActiveTab] = useState<'gambar' | 'testimoni'>('gambar');
  const [slots, setSlots] = useState<ImageSlot[]>(defaultSlots);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleFile = (id: string, file: File) => {
    const url = URL.createObjectURL(file);
    setSlots(prev => prev.map(s => s.id === id ? { ...s, preview: url, file, saved: false } : s));
  };

  const handleDrop = (id: string, e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) handleFile(id, file);
  };

  const handleUpload = async (id: string) => {
    setSlots(prev => prev.map(s => s.id === id ? { ...s, saving: true } : s));
    // Simulate upload — replace with Supabase Storage upload when connected
    await new Promise(r => setTimeout(r, 1200));
    setSlots(prev => prev.map(s => s.id === id ? { ...s, saving: false, saved: true, file: null } : s));
  };

  const handleDiscard = (id: string, originalPreview: string | null) => {
    setSlots(prev => prev.map(s => s.id === id ? { ...s, preview: originalPreview, file: null, saved: false } : s));
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">Konten</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
          Atur gambar dan testimoni untuk Landing Page
        </p>
      </div>

      {/* Tabs */}
      <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('gambar')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'gambar' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}
        >
          <ImageIcon2 size={16} /> Cover & Layanan
        </button>
        <button
          onClick={() => setActiveTab('testimoni')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'testimoni' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}
        >
          <MessageSquare size={16} /> Testimoni WA (Blur)
        </button>
      </div>

      {activeTab === 'testimoni' ? (
        <TestimonialEditor />
      ) : (
        <>
          {/* Info Banner */}
      <div className="flex items-start gap-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <ImageIcon size={16} className="text-blue-500 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700 dark:text-blue-400">
          Setelah Supabase Storage terhubung, gambar yang diunggah akan langsung live di website SerenaRaga tanpa perlu deploy ulang.
        </p>
      </div>

      {/* Image Slots */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {slots.map(slot => {
          const originalPreview = defaultSlots.find(s => s.id === slot.id)?.preview ?? null;
          return (
            <div key={slot.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
              {/* Preview */}
              <div
                className="relative h-48 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center cursor-pointer group overflow-hidden"
                onDragOver={e => e.preventDefault()}
                onDrop={e => handleDrop(slot.id, e)}
                onClick={() => inputRefs.current[slot.id]?.click()}
              >
                {slot.preview ? (
                  <>
                    <img src={slot.preview} alt={slot.label} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="text-white text-center">
                        <Upload size={24} className="mx-auto mb-2" />
                        <p className="text-sm font-medium">Ganti Gambar</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-zinc-400">
                    <Upload size={28} className="mx-auto mb-2" />
                    <p className="text-sm">Klik atau drag gambar ke sini</p>
                    <p className="text-xs mt-1">PNG, JPG, WebP</p>
                  </div>
                )}
                <input
                  ref={el => { inputRefs.current[slot.id] = el; }}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => { if (e.target.files?.[0]) handleFile(slot.id, e.target.files[0]); }}
                />
              </div>

              {/* Info + Actions */}
              <div className="p-4">
                <p className="font-medium text-sm text-zinc-900 dark:text-white">{slot.label}</p>
                <p className="text-xs text-zinc-400 mt-0.5 mb-3">{slot.description}</p>

                {slot.saved ? (
                  <div className="flex items-center gap-2 text-emerald-600 text-xs font-medium">
                    <Check size={14} /> Berhasil disimpan
                  </div>
                ) : slot.file ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpload(slot.id)}
                      disabled={slot.saving}
                      className="admin-btn-primary flex-1 justify-center text-xs py-2 disabled:opacity-60"
                    >
                      {slot.saving ? <><Loader2 size={13} className="animate-spin" /> Mengupload...</> : <><Upload size={13} /> Upload</>}
                    </button>
                    <button
                      onClick={() => handleDiscard(slot.id, originalPreview)}
                      className="admin-btn-ghost px-3 py-2"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => inputRefs.current[slot.id]?.click()}
                    className="admin-btn-ghost w-full justify-center text-xs py-2"
                  >
                    <Upload size={13} /> Pilih Gambar
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
        </>
      )}
    </div>
  );
}
