'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';

export type Settings = Record<string, string>;

const DEFAULTS: Settings = {
  whatsapp_number:       '6289518359037',
  booking_wa_message:    'Halo Admin SerenaRaga! Saya ingin tanya layanan massage di rumah. Bisa bantu informasinya?',
  reminder_template:     'Halo {nama}, reminder booking SerenaRaga Anda:\n📅 {tanggal} pukul {waktu}\n💆 {layanan}\n💰 {harga}\n\nKami menunggu kedatangan Anda! 🙏',
  invoice_footer:        'Terima kasih telah mempercayakan ketenangan raga Anda kepada kami.',
  terapis_commission_pct:'30',
  bhp_pct:               '10',
  operational_hours:     '08:00 – 21:00',
  operational_days:      'Setiap Hari',
  operational_note:      'Free Ongkir 10km pertama',
  service_area:          'Area Yogyakarta',
};

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data } = await supabase.from('settings').select('key, value');
      if (data && data.length > 0) {
        const map: Settings = { ...DEFAULTS };
        data.forEach(({ key, value }) => { if (value !== null) map[key] = value; });
        setSettings(map);
      }
      setLoading(false);
    };
    load();
  }, []);

  return { settings, loading };
}

// For admin: fetch + save
export function useAdminSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const supabase = createClient();

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('settings').select('key, value');
    if (data) {
      const map: Settings = { ...DEFAULTS };
      data.forEach(({ key, value }) => { if (value !== null) map[key] = value; });
      setSettings(map);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async (key: string, value: string) => {
    setSaving(true);
    await supabase.from('settings').upsert({ key, value, updated_at: new Date().toISOString() });
    setSettings(prev => ({ ...prev, [key]: value }));
    setSaving(false);
  };

  const saveAll = async (updates: Partial<Settings>) => {
    setSaving(true);
    const rows = Object.entries(updates)
      .filter(([, v]) => v !== undefined)
      .map(([key, value]) => ({ key, value: value as string, updated_at: new Date().toISOString() }));
    await supabase.from('settings').upsert(rows);
    const defined = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    ) as Settings;
    setSettings(prev => ({ ...prev, ...defined }));
    setSaving(false);
  };

  return { settings, setSettings, loading, saving, save, saveAll };
}
