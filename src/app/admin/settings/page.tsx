'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Save, Loader2, Check, Clock, MapPin, Phone, MessageSquare, FileText, Percent, Info, RefreshCcw, Settings as SettingsIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { AdminSkeleton } from '@/components/admin/AdminSkeleton';

type Settings = Record<string, string>;

const ALL_KEYS = [
  'operational_hours', 'service_area', 'default_buffer_time', 'minimum_viable_duration',
  'whatsapp_number', 'whatsapp_booking_message',
  'whatsapp_reminder_message',
  'invoice_footer_text', 'invoice_social_text',
  'terapis_commission_pct',
  're_engagement_days', 're_engagement_template', 're_engagement_promo_template',
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
  const EXAMPLE = 400000;

  if (loading) return <AdminSkeleton rows={4} />;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
          <SettingsIcon size={20} className="text-earth-primary" /> Pengaturan Sistem
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 font-medium">
          Kelola parameter operasional, otomasi pesan WhatsApp, keuangan spa, dan CRM re-engagement.
        </p>
      </div>

      {/* ── Operasional Section ── */}
      <SectionCard
        id="operasional" 
        title="Jam Kerja & Operasional"
        icon={<Clock size={15} className="text-earth-primary" />}
        saving={saving === 'operasional'} 
        saved={saved === 'operasional'}
        onSave={() => saveSection('operasional', ['operational_hours', 'service_area', 'default_buffer_time', 'minimum_viable_duration'])}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Jam Operasional" hint="Jadwal operasional spa untuk tampilan landing page.">
            <input className="admin-input text-xs font-semibold" value={settings['operational_hours'] ?? ''}
              onChange={e => set('operational_hours', e.target.value)}
              placeholder="Senin - Minggu, 08.00 - 21.00 WIB" />
          </Field>
          <Field label="Area Layanan" hint="Cakupan wilayah kunjungan home spa.">
            <input className="admin-input text-xs font-semibold" value={settings['service_area'] ?? ''}
              onChange={e => set('service_area', e.target.value)}
              placeholder="Melayani Area Yogyakarta" />
          </Field>
          <Field label="Buffer Perjalanan (Menit)" hint="Jeda perjalanan standar antar-booking terapis.">
            <input className="admin-input text-xs font-bold font-mono" type="number" min="0" step="5" value={settings['default_buffer_time'] ?? ''}
              onChange={e => set('default_buffer_time', e.target.value)}
              placeholder="30" />
          </Field>
          <Field label="Minimum Viable Duration (Menit)" hint="Asumsi durasi standar (termasuk buffer) slot booking.">
            <input className="admin-input text-xs font-bold font-mono" type="number" min="30" step="15" value={settings['minimum_viable_duration'] ?? '120'}
              onChange={e => set('minimum_viable_duration', e.target.value)}
              placeholder="120" />
          </Field>
        </div>
      </SectionCard>

      {/* ── WhatsApp Booking Section ── */}
      <SectionCard
        id="whatsapp" 
        title="WhatsApp & Link Booking"
        icon={<Phone size={15} className="text-earth-primary" />}
        saving={saving === 'whatsapp'} 
        saved={saved === 'whatsapp'}
        onSave={() => saveSection('whatsapp', ['whatsapp_number', 'whatsapp_booking_message'])}
      >
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
          <Field label="Nomor WhatsApp Admin" hint="Gunakan kode negara (Format: 628xxx tanpa + atau spasi).">
            <input className="admin-input font-mono text-xs font-bold" value={settings['whatsapp_number'] ?? ''}
              onChange={e => set('whatsapp_number', e.target.value)}
              placeholder="6289518359037" />
          </Field>
          <Field label="Pesan Pembuka Booking" hint="Kata-kata otomatis ketika pelanggan mengklik tombol booking di landing page.">
            <textarea className="admin-input text-xs font-medium resize-none leading-relaxed" rows={3}
              value={settings['whatsapp_booking_message'] ?? ''}
              onChange={e => set('whatsapp_booking_message', e.target.value)} />
          </Field>
        </div>
      </SectionCard>

      {/* ── WhatsApp Reminder Section ── */}
      <SectionCard
        id="reminder" 
        title="Template WhatsApp Reminder"
        icon={<MessageSquare size={15} className="text-earth-primary" />}
        saving={saving === 'reminder'} 
        saved={saved === 'reminder'}
        onSave={() => saveSection('reminder', ['whatsapp_reminder_message'])}
      >
        <div className="space-y-3.5">
          <div className="flex items-start gap-2.5 bg-amber-50 dark:bg-amber-955/15 border border-amber-250/20 rounded-2xl p-3.5 shadow-sm">
            <Info size={14} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="text-[10px] text-amber-800 dark:text-amber-400 leading-relaxed font-semibold">
              Variabel dinamis yang dapat digunakan:
              <div className="flex flex-wrap gap-1 mt-1.5 font-mono">
                {['{nama}', '{tanggal}', '{waktu}', '{layanan}', '{harga}'].map(v => (
                  <span key={v} className="bg-amber-100 dark:bg-amber-900/60 px-1.5 py-0.5 rounded text-[9px] text-amber-700 dark:text-amber-305 border border-amber-200 dark:border-amber-800/40">{v}</span>
                ))}
              </div>
            </div>
          </div>
          <Field label="Template Pengingat Jadwal (Reminder)">
            <textarea className="admin-input resize-none font-mono text-xs leading-relaxed" rows={7}
              value={settings['whatsapp_reminder_message'] ?? ''}
              onChange={e => set('whatsapp_reminder_message', e.target.value)} />
          </Field>
        </div>
      </SectionCard>

      {/* ── Invoice Settings Section ── */}
      <SectionCard
        id="invoice" 
        title="Teks Footer & Sosial Invoice"
        icon={<FileText size={15} className="text-earth-primary" />}
        saving={saving === 'invoice'} 
        saved={saved === 'invoice'}
        onSave={() => saveSection('invoice', ['invoice_footer_text', 'invoice_social_text'])}
      >
        <div className="grid grid-cols-1 gap-4">
          <Field label="Teks Penutup/Terima Kasih Invoice" hint="Pesan apresiasi di bagian paling bawah slip invoice.">
            <textarea className="admin-input text-xs font-semibold resize-none leading-relaxed" rows={2}
              value={settings['invoice_footer_text'] ?? ''}
              onChange={e => set('invoice_footer_text', e.target.value)} />
          </Field>
          <Field label="Teks Sosial Media & Website" hint="Format: Instagram / Website (Contoh: @serena.raga / www.serenaraga.fit).">
            <input className="admin-input text-xs font-semibold" value={settings['invoice_social_text'] ?? ''}
              onChange={e => set('invoice_social_text', e.target.value)}
              placeholder="Instagram & Threads: @serena.raga" />
          </Field>
        </div>
      </SectionCard>

      {/* ── Therapist Commission Section ── */}
      <SectionCard
        id="komisi" 
        title="Bagi Hasil Default Terapis"
        icon={<Percent size={15} className="text-earth-primary" />}
        saving={saving === 'komisi'} 
        saved={saved === 'komisi'}
        onSave={() => saveSection('komisi', ['terapis_commission_pct'])}
      >
        <div className="space-y-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
            Persentase default pembagian bagi hasil terapis dari total kotor jasa layanan. Biaya BHP dihitung terpisah per layanan secara real-time.
          </p>
          <Field label={`Persentase Bagian Terapis: ${commission}%`}>
            <div className="flex items-center gap-4 bg-zinc-50 dark:bg-zinc-950/20 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800">
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
                className="admin-input w-20 text-center font-mono text-xs font-bold"
              />
            </div>
            <div className="flex justify-between text-[10px] text-zinc-400 mt-1 px-1 font-bold">
              <span>0% (Owner Penuh)</span><span>50% (Bagi Rata)</span><span>100% (Terapis Penuh)</span>
            </div>
          </Field>

          {/* Calculator Preview */}
          <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4.5 space-y-2.5 text-xs shadow-sm">
            <p className="text-[10px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-wider mb-2.5">Simulasi Finansial (Sesi Rp 400.000)</p>
            
            <div className="flex justify-between font-medium text-zinc-600 dark:text-zinc-400">
              <span>Pendapatan Kotor Jasa</span>
              <span className="font-mono font-bold text-zinc-800 dark:text-zinc-250">Rp {EXAMPLE.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between text-amber-600 font-bold border-t border-dashed border-zinc-200 dark:border-zinc-800 pt-2">
              <span>↳ Porsi Terapis ({commission}%)</span>
              <span className="font-mono">− Rp {(EXAMPLE * commission / 100).toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between text-blue-500 font-semibold">
              <span>↳ Porsi Bahan BHP</span>
              <span className="font-mono italic">− Dihitung real-time</span>
            </div>
            <div className="flex justify-between text-emerald-700 dark:text-emerald-450 font-black border-t border-zinc-200 dark:border-zinc-800 pt-2.5">
              <span>Penerimaan Bersih Owner</span>
              <span className="font-mono">Rp {(EXAMPLE * (100 - commission) / 100).toLocaleString('id-ID')} − BHP</span>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* ── CRM Re-engagement Section ── */}
      <SectionCard
        id="crm" 
        title="Otomasi Re-engagement CRM"
        icon={<RefreshCcw size={15} className="text-earth-primary" />}
        saving={saving === 'crm'} 
        saved={saved === 'crm'}
        onSave={() => saveSection('crm', ['re_engagement_days', 're_engagement_template', 're_engagement_promo_template'])}
      >
        <div className="space-y-4">
          <div className="flex items-start gap-2.5 bg-blue-50/50 dark:bg-blue-955/15 border border-blue-250/20 rounded-2xl p-3.5 shadow-sm">
            <Info size={14} className="text-blue-600 shrink-0 mt-0.5" />
            <div className="text-[10px] text-blue-800 dark:text-blue-400 leading-relaxed font-semibold">
              Menandai pelanggan yang tidak melakukan spa melebihi batas waktu order.
              <div className="flex flex-wrap gap-1 mt-1.5 font-mono">
                {['{nama}', '{hari}', '{diskon}'].map(v => (
                  <span key={v} className="bg-blue-100 dark:bg-blue-900/60 px-1.5 py-0.5 rounded text-[9px] text-blue-700 dark:text-blue-305 border border-blue-200 dark:border-blue-800/40">{v}</span>
                ))}
              </div>
            </div>
          </div>

          <Field label="Batas Hari Tidak Berkunjung (Dorman)" hint="Batas hari sejak treatment terakhir untuk mengidentifikasi pelanggan pasif.">
            <div className="flex items-center gap-3">
              <input
                type="number" min={7} max={365} step={1}
                value={settings['re_engagement_days'] ?? '60'}
                onChange={e => set('re_engagement_days', e.target.value)}
                className="admin-input w-24 font-mono text-center text-xs font-bold"
              />
              <span className="text-xs font-bold text-zinc-500">Hari Pasif</span>
            </div>
          </Field>

          <Field label="Template Re-engagement (Standar)" hint="Format pesan pengingat standar bagi customer yang memasuki masa pasif.">
            <textarea
              className="admin-input resize-none font-mono text-xs leading-relaxed" rows={6}
              placeholder={`Halo {nama}, kami rindu menemani relaksasi raga Anda...`}
              value={settings['re_engagement_template'] ?? ''}
              onChange={e => set('re_engagement_template', e.target.value)}
            />
          </Field>

          <Field label="Template Re-engagement (Eligible Promo)" hint="Format pesan penawaran diskon khusus bagi customer loyal pasif.">
            <textarea
              className="admin-input resize-none font-mono text-xs leading-relaxed" rows={6}
              placeholder={`Halo {nama}, kami punya diskon {diskon} spesial untuk Anda!`}
              value={settings['re_engagement_promo_template'] ?? ''}
              onChange={e => set('re_engagement_promo_template', e.target.value)}
            />
          </Field>
        </div>
      </SectionCard>
    </div>
  );
}

function SectionCard({
  title, icon, children, saving, saved, onSave,
}: {
  id: string; title: string; icon: React.ReactNode;
  children: React.ReactNode; saving: boolean; saved: boolean;
  onSave: () => void;
}) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4 shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-150 dark:border-zinc-850">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider">{title}</h2>
        </div>
        <button
          onClick={onSave} disabled={saving}
          className={`admin-btn-primary text-[10px] font-bold py-1.5 px-3.5 min-w-[100px] justify-center disabled:opacity-60 transition-all ${saved ? '!bg-emerald-600 border-emerald-600' : ''}`}
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
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-zinc-800 dark:text-zinc-205 block uppercase tracking-wider">{label}</label>
      {hint && <p className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-relaxed font-medium">{hint}</p>}
      {children}
    </div>
  );
}
