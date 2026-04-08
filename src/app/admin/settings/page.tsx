'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Clock, Phone, MessageCircle, FileText, Percent,
  MapPin, Save, Loader2, Check
} from 'lucide-react';
import { fetchSettings, saveSetting, DEFAULT_SETTINGS, type AppSettings } from '@/lib/settings';

type Section = {
  title: string;
  icon: React.ReactNode;
  color: string;
  fields: Field[];
};

type Field = {
  key: keyof AppSettings;
  label: string;
  hint?: string;
  type: 'text' | 'textarea' | 'number' | 'tel';
  placeholder?: string;
  rows?: number;
};

const SECTIONS: Section[] = [
  {
    title: 'Jam & Area Operasional',
    icon: <Clock size={16} />,
    color: 'text-blue-500',
    fields: [
      { key: 'operational_hours', label: 'Jam Operasional', type: 'text', placeholder: 'Senin - Minggu, 08.00 - 21.00 WIB', hint: 'Ditampilkan di bagian Booking landing page' },
      { key: 'service_area', label: 'Area Layanan', type: 'text', placeholder: 'Melayani Area Yogyakarta', hint: 'Info area layanan di landing page' },
    ],
  },
  {
    title: 'WhatsApp & Pesan Booking',
    icon: <Phone size={16} />,
    color: 'text-emerald-500',
    fields: [
      { key: 'whatsapp_number', label: 'Nomor WhatsApp (format: 628xxx)', type: 'tel', placeholder: '6289518359037', hint: 'Nomor tujuan saat customer klik tombol Booking di landing page' },
      { key: 'whatsapp_booking_message', label: 'Pesan Default Booking', type: 'textarea', rows: 3, hint: 'Pesan yang otomatis terisi saat customer klik tombol WhatsApp di landing page' },
    ],
  },
  {
    title: 'Pesan Reminder (Bookings)',
    icon: <MessageCircle size={16} />,
    color: 'text-violet-500',
    fields: [
      {
        key: 'whatsapp_reminder_message',
        label: 'Template Reminder ke Customer',
        type: 'textarea',
        rows: 5,
        hint: 'Digunakan tombol WA di halaman Bookings. Gunakan variabel: {nama}, {tanggal}, {waktu}, {layanan}, {harga}',
      },
    ],
  },
  {
    title: 'Teks Invoice',
    icon: <FileText size={16} />,
    color: 'text-amber-500',
    fields: [
      { key: 'invoice_footer_text', label: 'Kalimat Penutup Invoice', type: 'textarea', rows: 2, hint: 'Tampil di bagian bawah gambar invoice' },
      { key: 'invoice_social_text', label: 'Teks Social Media / Kontak', type: 'text', placeholder: 'Instagram & Threads: @serena.raga', hint: 'Tampil di footer invoice' },
    ],
  },
  {
    title: 'Komisi Terapis (Global)',
    icon: <Percent size={16} />,
    color: 'text-rose-500',
    fields: [
      {
        key: 'terapis_commission_pct',
        label: 'Persentase Bagi Hasil Terapis (%)',
        type: 'number',
        placeholder: '30',
        hint: 'Berlaku global untuk kalkulasi di pricelist, dashboard, dan laporan. Contoh: 30 = terapis dapat 30% dari harga layanan',
      },
    ],
  },
];

function SaveStatus({ status }: { status: 'idle' | 'saving' | 'saved' }) {
  if (status === 'idle') return null;
  return (
    <span className={`text-xs flex items-center gap-1 ${status === 'saved' ? 'text-emerald-500' : 'text-zinc-400'}`}>
      {status === 'saving' ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
      {status === 'saving' ? 'Menyimpan...' : 'Tersimpan'}
    </span>
  );
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<Record<string, 'idle' | 'saving' | 'saved'>>({});
  const [hasChanges, setHasChanges] = useState<Record<string, boolean>>({});

  const loadSettings = useCallback(async () => {
    setLoading(true);
    const s = await fetchSettings();
    setSettings(s);
    setLoading(false);
  }, []);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const handleChange = (key: keyof AppSettings, value: string) => {
    setSettings(prev => ({ ...prev, [key]: key === 'terapis_commission_pct' ? Number(value) : value }));
    setHasChanges(prev => ({ ...prev, [key]: true }));
    setSaveStatus(prev => ({ ...prev, [key]: 'idle' }));
  };

  const handleSave = async (key: keyof AppSettings) => {
    setSaveStatus(prev => ({ ...prev, [key]: 'saving' }));
    const value = String(settings[key]);
    await saveSetting(key, value);
    setSaveStatus(prev => ({ ...prev, [key]: 'saved' }));
    setHasChanges(prev => ({ ...prev, [key]: false }));
    setTimeout(() => setSaveStatus(prev => ({ ...prev, [key]: 'idle' })), 2500);
  };

  const handleSaveAll = async () => {
    const changedKeys = Object.keys(hasChanges).filter(k => hasChanges[k]) as (keyof AppSettings)[];
    if (changedKeys.length === 0) return;
    await Promise.all(changedKeys.map(k => handleSave(k)));
  };

  const changedCount = Object.values(hasChanges).filter(Boolean).length;

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-earth-primary" size={28} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">Settings</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">Konfigurasi operasional, WhatsApp, invoice, dan komisi</p>
        </div>
        {changedCount > 0 && (
          <button onClick={handleSaveAll} className="admin-btn-primary">
            <Save size={15} /> Simpan Semua ({changedCount})
          </button>
        )}
      </div>

      {/* Sections */}
      {SECTIONS.map(section => (
        <div key={section.title} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
          {/* Section Header */}
          <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2.5">
            <span className={section.color}>{section.icon}</span>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">{section.title}</h2>
          </div>

          {/* Fields */}
          <div className="p-5 space-y-5">
            {section.fields.map(field => (
              <div key={field.key} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{field.label}</label>
                  <div className="flex items-center gap-3">
                    <SaveStatus status={saveStatus[field.key] ?? 'idle'} />
                    {hasChanges[field.key] && (
                      <button
                        onClick={() => handleSave(field.key)}
                        className="text-xs text-earth-primary font-semibold hover:underline flex items-center gap-1"
                      >
                        <Save size={11} /> Simpan
                      </button>
                    )}
                  </div>
                </div>

                {field.type === 'textarea' ? (
                  <textarea
                    rows={field.rows ?? 3}
                    className="admin-input resize-none font-sans text-sm leading-relaxed"
                    placeholder={field.placeholder ?? ''}
                    value={String(settings[field.key])}
                    onChange={e => handleChange(field.key, e.target.value)}
                  />
                ) : field.type === 'number' ? (
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      className="admin-input font-mono w-28 text-center"
                      value={settings[field.key]}
                      onChange={e => handleChange(field.key, e.target.value)}
                    />
                    <span className="text-sm text-zinc-400">%</span>
                    {/* Preview commission split */}
                    {field.key === 'terapis_commission_pct' && (
                      <div className="flex gap-3 ml-2">
                        <span className="text-xs bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 px-2 py-1 rounded-lg border border-amber-200 dark:border-amber-800">
                          Terapis: {settings.terapis_commission_pct}%
                        </span>
                        <span className="text-xs bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700">
                          Pemilik: {100 - Number(settings.terapis_commission_pct)}%
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <input
                    type={field.type}
                    className="admin-input"
                    placeholder={field.placeholder ?? ''}
                    value={String(settings[field.key])}
                    onChange={e => handleChange(field.key, e.target.value)}
                  />
                )}

                {field.hint && (
                  <p className="text-[11px] text-zinc-400 leading-relaxed">{field.hint}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Info box for template variables */}
      <div className="bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800 rounded-xl p-4">
        <p className="text-xs font-semibold text-violet-700 dark:text-violet-400 mb-2">Variabel Template Pesan</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            ['{nama}', 'Nama pelanggan'],
            ['{tanggal}', 'Tanggal booking'],
            ['{waktu}', 'Jam booking'],
            ['{layanan}', 'Nama layanan'],
            ['{harga}', 'Harga layanan'],
          ].map(([v, d]) => (
            <div key={v} className="flex items-center gap-1.5">
              <code className="text-[11px] font-mono bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 px-1.5 py-0.5 rounded">{v}</code>
              <span className="text-[11px] text-violet-600 dark:text-violet-400">{d}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
