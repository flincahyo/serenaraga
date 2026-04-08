'use client';

import React, { useState } from 'react';
import { Check, Loader2, Clock, Phone, MessageSquare, Receipt, Percent, MapPin, Save } from 'lucide-react';
import { useAdminSettings } from '@/lib/settings';

type SettingSection = {
  title: string;
  icon: React.ReactNode;
  fields: {
    key: string;
    label: string;
    description?: string;
    type?: 'text' | 'tel' | 'number' | 'textarea';
    placeholder?: string;
    suffix?: string;
    min?: number;
    max?: number;
  }[];
};

const SECTIONS: SettingSection[] = [
  {
    title: 'Jam Operasional',
    icon: <Clock size={16} className="text-earth-primary" />,
    fields: [
      { key: 'operational_hours',  label: 'Jam Operasional', placeholder: '08:00 – 21:00', description: 'Tampil di bagian booking landing page' },
      { key: 'operational_days',   label: 'Hari Operasional', placeholder: 'Setiap Hari', description: 'Contoh: Senin – Sabtu' },
      { key: 'operational_note',   label: 'Catatan Tambahan', placeholder: 'Free Ongkir 10km pertama', description: 'Info singkat yang tampil di booking section' },
      { key: 'service_area',       label: 'Area Layanan', placeholder: 'Area Yogyakarta' },
    ],
  },
  {
    title: 'WhatsApp & Kontak',
    icon: <Phone size={16} className="text-earth-primary" />,
    fields: [
      { key: 'whatsapp_number', label: 'Nomor WhatsApp Admin', type: 'tel', placeholder: '628xxxxxxxxxx', description: 'Digunakan untuk tombol Chat WA di landing page' },
      { key: 'booking_wa_message', label: 'Pesan Awal Booking', type: 'textarea', placeholder: 'Halo Admin SerenaRaga!...', description: 'Pesan yang langsung muncul saat pelanggan klik tombol WA di landing page' },
    ],
  },
  {
    title: 'Template Pesan Admin',
    icon: <MessageSquare size={16} className="text-earth-primary" />,
    fields: [
      {
        key: 'reminder_template',
        label: 'Template Reminder Pelanggan',
        type: 'textarea',
        description: 'Digunakan saat klik tombol WA di halaman Bookings. Variabel: {nama}, {tanggal}, {waktu}, {layanan}, {harga}',
        placeholder: 'Halo {nama}, reminder booking...',
      },
    ],
  },
  {
    title: 'Invoice',
    icon: <Receipt size={16} className="text-earth-primary" />,
    fields: [
      { key: 'invoice_footer', label: 'Pesan Footer Invoice', type: 'textarea', placeholder: 'Terima kasih...', description: 'Teks yang tampil di bagian bawah gambar invoice' },
    ],
  },
  {
    title: 'Komisi Terapis',
    icon: <Percent size={16} className="text-earth-primary" />,
    fields: [
      {
        key: 'terapis_commission_pct',
        label: 'Persentase Bagi Hasil Terapis',
        type: 'number',
        min: 0,
        max: 100,
        suffix: '%',
        placeholder: '30',
        description: 'Digunakan untuk kalkulasi otomatis. Penghasilan bersih pemilik = Total Pendapatan × (100% − komisi%). Tampil di Dashboard dan Reports.',
      },
    ],
  },
];

export default function SettingsPage() {
  const { settings, setSettings, loading, saving, saveAll } = useAdminSettings();
  const [saved, setSaved] = useState(false);

  const handleChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveAll = async () => {
    await saveAll(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const commission = Number(settings.terapis_commission_pct ?? 30);
  const ownerPct = 100 - commission;

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-earth-primary" size={24} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">Settings</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">Konfigurasi operasional SerenaRaga</p>
        </div>
        <button
          onClick={handleSaveAll}
          disabled={saving}
          className="admin-btn-primary disabled:opacity-60"
        >
          {saving ? (
            <Loader2 size={15} className="animate-spin" />
          ) : saved ? (
            <><Check size={15} /> Tersimpan!</>
          ) : (
            <><Save size={15} /> Simpan Semua</>
          )}
        </button>
      </div>

      {/* Commission Preview */}
      {commission > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Percent size={14} className="text-amber-600" />
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">Preview Bagi Hasil (per Rp 100.000)</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white dark:bg-amber-950/30 rounded-lg px-4 py-3 border border-amber-100 dark:border-amber-800">
              <p className="text-[10px] text-amber-500 mb-1">Terapis ({commission}%)</p>
              <p className="text-lg font-bold text-amber-700 dark:text-amber-300 font-mono">
                Rp {(100000 * commission / 100).toLocaleString('id-ID')}
              </p>
            </div>
            <div className="bg-white dark:bg-amber-950/30 rounded-lg px-4 py-3 border border-amber-100 dark:border-amber-800">
              <p className="text-[10px] text-amber-500 mb-1">Pemilik ({ownerPct}%)</p>
              <p className="text-lg font-bold text-amber-700 dark:text-amber-300 font-mono">
                Rp {(100000 * ownerPct / 100).toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Settings Sections */}
      {SECTIONS.map(section => (
        <div key={section.title} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
            {section.icon}
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">{section.title}</h2>
          </div>
          <div className="p-5 space-y-5">
            {section.fields.map(field => (
              <div key={field.key} className="space-y-1.5">
                <div className="flex items-baseline justify-between">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{field.label}</label>
                  {field.suffix && <span className="text-xs text-zinc-400">{field.suffix}</span>}
                </div>
                {field.description && (
                  <p className="text-[11px] text-zinc-400 dark:text-zinc-500 leading-relaxed">{field.description}</p>
                )}
                {field.type === 'textarea' ? (
                  <textarea
                    rows={3}
                    className="admin-input resize-none text-sm"
                    placeholder={field.placeholder}
                    value={settings[field.key] ?? ''}
                    onChange={e => handleChange(field.key, e.target.value)}
                  />
                ) : (
                  <div className="relative">
                    <input
                      type={field.type ?? 'text'}
                      min={field.min}
                      max={field.max}
                      className="admin-input text-sm"
                      placeholder={field.placeholder}
                      value={settings[field.key] ?? ''}
                      onChange={e => handleChange(field.key, e.target.value)}
                    />
                    {field.suffix && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-zinc-400">{field.suffix}</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Template Variables Reference */}
      <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4 border border-zinc-200 dark:border-zinc-700">
        <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2">Variabel Template yang Tersedia</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {['{nama}', '{tanggal}', '{waktu}', '{layanan}', '{harga}'].map(v => (
            <code key={v} className="text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-earth-primary font-mono">
              {v}
            </code>
          ))}
        </div>
      </div>

      {/* Save button (bottom) */}
      <div className="flex justify-end pb-4">
        <button onClick={handleSaveAll} disabled={saving} className="admin-btn-primary disabled:opacity-60">
          {saving ? <Loader2 size={15} className="animate-spin" /> : saved ? <><Check size={15} /> Tersimpan!</> : <><Save size={15} /> Simpan Semua</>}
        </button>
      </div>
    </div>
  );
}
