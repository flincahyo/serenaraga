'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Save, Loader2, Check, Clock, MapPin, Phone, MessageSquare, FileText, Percent, Info } from 'lucide-react';
import { createClient } from '@/lib/supabase';

type Settings = Record<string, string>;

const ALL_KEYS = [
  'operational_hours', 'service_area',
  'whatsapp_number', 'whatsapp_booking_message',
  'whatsapp_reminder_message',
  'invoice_footer_text', 'invoice_social_text',
  'terapis_commission_pct',
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const supabase = createClient();

  const fetchSettings = useCallback(async () => {
    const { data } = await supabase.from('settings').select('key, value').in('key', ALL_KEYS);
    if (data) {
      const obj: Settings = {};
      data.forEach(({ key, value }) => { obj[key] = value; });
      setSettings(obj);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const set = (key: string, value: string) =>
    setSettings(prev => ({ ...prev, [key]: value }));

  const saveSection = async (sectionId: string, keys: string[]) => {
    setSaving(sectionId);
    const updates = keys.map(key => ({
      key,
      value: settings[key] ?? '',
      updated_at: new Date().toISOString(),
    }));
    await supabase.from('settings').upsert(updates, { onConflict: 'key' });
    setSaving(null);
    setSaved(sectionId);
    setTimeout(() => setSaved(null), 2500);
  };

  const commission = Number(settings['terapis_commission_pct'] ?? 30);
  const EXAMPLE    = 400000;

  if (loading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="animate-spin text-earth-primary" size={28} />
    </div>
  );

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">Settings</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
          Kelola konten, pesan, dan pengaturan bisnis SerenaRaga
        </p>
      </div>

      {/* ── Operasional ── */}
      <SectionCard
        id="operasional" title="Operasional"
        icon={<Clock size={15} className="text-earth-primary" />}
        saving={saving === 'operasional'} saved={saved === 'operasional'}
        onSave={() => saveSection('operasional', ['operational_hours', 'service_area'])}
      >
        <Field label="Jam Operasional">
          <input className="admin-input" value={settings['operational_hours'] ?? ''}
            onChange={e => set('operational_hours', e.target.value)}
            placeholder="Senin - Minggu, 08.00 - 21.00 WIB" />
        </Field>
        <Field label="Area Layanan">
          <input className="admin-input" value={settings['service_area'] ?? ''}
            onChange={e => set('service_area', e.target.value)}
            placeholder="Melayani Area Yogyakarta" />
        </Field>
      </SectionCard>

      {/* ── WhatsApp & Booking ── */}
      <SectionCard
        id="whatsapp" title="WhatsApp & Booking Landing Page"
        icon={<Phone size={15} className="text-earth-primary" />}
        saving={saving === 'whatsapp'} saved={saved === 'whatsapp'}
        onSave={() => saveSection('whatsapp', ['whatsapp_number', 'whatsapp_booking_message'])}
      >
        <Field label="Nomor WhatsApp" hint="Format: 628xxx (tanpa + atau spasi)">
          <input className="admin-input font-mono" value={settings['whatsapp_number'] ?? ''}
            onChange={e => set('whatsapp_number', e.target.value)}
            placeholder="6289518359037" />
        </Field>
        <Field label="Kata-kata Pesan dari Tombol Booking">
          <textarea className="admin-input resize-none" rows={3}
            value={settings['whatsapp_booking_message'] ?? ''}
            onChange={e => set('whatsapp_booking_message', e.target.value)} />
        </Field>
      </SectionCard>

      {/* ── Template Reminder ── */}
      <SectionCard
        id="reminder" title="Template Reminder Pelanggan"
        icon={<MessageSquare size={15} className="text-earth-primary" />}
        saving={saving === 'reminder'} saved={saved === 'reminder'}
        onSave={() => saveSection('reminder', ['whatsapp_reminder_message'])}
      >
        <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
          <Info size={14} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
            Variabel yang bisa digunakan:{' '}
            {['{nama}', '{tanggal}', '{waktu}', '{layanan}', '{harga}'].map(v => (
              <code key={v} className="font-mono bg-amber-100 dark:bg-amber-900 px-1 rounded mx-0.5">{v}</code>
            ))}
          </p>
        </div>
        <Field label="Template Pesan Reminder">
          <textarea className="admin-input resize-none font-mono text-xs" rows={7}
            value={settings['whatsapp_reminder_message'] ?? ''}
            onChange={e => set('whatsapp_reminder_message', e.target.value)} />
        </Field>
      </SectionCard>

      {/* ── Invoice ── */}
      <SectionCard
        id="invoice" title="Teks Invoice"
        icon={<FileText size={15} className="text-earth-primary" />}
        saving={saving === 'invoice'} saved={saved === 'invoice'}
        onSave={() => saveSection('invoice', ['invoice_footer_text', 'invoice_social_text'])}
      >
        <Field label="Teks Footer Invoice">
          <textarea className="admin-input resize-none" rows={2}
            value={settings['invoice_footer_text'] ?? ''}
            onChange={e => set('invoice_footer_text', e.target.value)} />
        </Field>
        <Field label="Teks Sosial Media">
          <input className="admin-input" value={settings['invoice_social_text'] ?? ''}
            onChange={e => set('invoice_social_text', e.target.value)}
            placeholder="Instagram & Threads: @serena.raga" />
        </Field>
      </SectionCard>

      {/* ── Bagi Hasil Terapis ── */}
      <SectionCard
        id="komisi" title="Bagi Hasil Terapis"
        icon={<Percent size={15} className="text-earth-primary" />}
        saving={saving === 'komisi'} saved={saved === 'komisi'}
        onSave={() => saveSection('komisi', ['terapis_commission_pct'])}
      >
        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
          Persentase bagian terapis dari pendapatan kotor per transaksi.
          BHP (bahan habis pakai) sekarang dihitung secara aktual per layanan — kelola di halaman <strong>Bahan (BHP)</strong>.
        </p>
        <Field label={`Persentase Bagian Terapis: ${commission}%`}>
          <div className="flex items-center gap-4">
            <input
              type="range" min={0} max={100} step={5}
              value={commission}
              onChange={e => set('terapis_commission_pct', e.target.value)}
              className="flex-1 accent-earth-primary h-2"
            />
            <input
              type="number" min={0} max={100}
              value={commission}
              onChange={e => set('terapis_commission_pct', e.target.value)}
              className="admin-input w-20 text-center font-mono text-sm"
            />
          </div>
          <div className="flex justify-between text-[10px] text-zinc-400 mt-1 px-0.5">
            <span>0%</span><span>50%</span><span>100%</span>
          </div>
        </Field>
        {/* Preview */}
        <div className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-4 space-y-2">
          <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-3">Contoh kalkulasi (Rp 400.000)</p>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">Pendapatan Kotor</span>
            <span className="font-mono font-medium text-zinc-900 dark:text-white">Rp {EXAMPLE.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-amber-600">↳ Bagian Terapis ({commission}%)</span>
            <span className="font-mono font-medium text-amber-600">− Rp {(EXAMPLE * commission / 100).toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-blue-500">↳ Modal BHP (aktual per booking)</span>
            <span className="font-mono font-medium text-blue-400">− dihitung otomatis</span>
          </div>
          <div className="flex justify-between text-sm pt-2 border-t border-zinc-200 dark:border-zinc-700">
            <span className="text-emerald-600 font-semibold">Penghasilan Bersih Owner</span>
            <span className="font-mono font-bold text-emerald-600">Rp {(EXAMPLE * (100 - commission) / 100).toLocaleString('id-ID')} − BHP</span>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

function SectionCard({
  id, title, icon, children, saving, saved, onSave,
}: {
  id: string; title: string; icon: React.ReactNode;
  children: React.ReactNode; saving: boolean; saved: boolean;
  onSave: () => void;
}) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between pb-1 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">{title}</h2>
        </div>
        <button
          onClick={onSave} disabled={saving}
          className={`admin-btn-primary text-xs py-1.5 px-3 min-w-[96px] justify-center disabled:opacity-60 transition-all ${saved ? '!bg-emerald-600' : ''}`}
        >
          {saving
            ? <><Loader2 size={12} className="animate-spin" /> Menyimpan</>
            : saved
              ? <><Check size={12} /> Tersimpan</>
              : <><Save size={12} /> Simpan</>}
        </button>
      </div>
      {children}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5 block">{label}</label>
      {hint && <p className="text-[10px] text-zinc-400 mb-1.5">{hint}</p>}
      {children}
    </div>
  );
}
