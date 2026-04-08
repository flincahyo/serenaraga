import { createClient } from './supabase';

export type AppSettings = {
  operational_hours: string;
  service_area: string;
  whatsapp_number: string;
  whatsapp_booking_message: string;
  whatsapp_reminder_message: string;
  invoice_footer_text: string;
  invoice_social_text: string;
  terapis_commission_pct: number;
};

export const DEFAULT_SETTINGS: AppSettings = {
  operational_hours: 'Senin - Minggu, 08.00 - 21.00 WIB',
  service_area: 'Melayani Area Yogyakarta',
  whatsapp_number: '6289518359037',
  whatsapp_booking_message: 'Halo Admin SerenaRaga! Saya ingin tanya layanan massage di rumah. Bisa bantu informasinya?',
  whatsapp_reminder_message: 'Halo {nama}, reminder booking SerenaRaga:\n📅 {tanggal} pukul {waktu}\n💆 {layanan}\n💰 {harga}\n\nTerima kasih! 🙏',
  invoice_footer_text: 'Terima kasih telah mempercayakan ketenangan raga Anda kepada kami.',
  invoice_social_text: 'Instagram & Threads: @serena.raga',
  terapis_commission_pct: 30,
};

export async function fetchSettings(): Promise<AppSettings> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.from('settings').select('key, value');
    if (error || !data) return DEFAULT_SETTINGS;

    const map: Record<string, string> = {};
    data.forEach(row => { map[row.key] = row.value; });

    return {
      operational_hours:        map.operational_hours        ?? DEFAULT_SETTINGS.operational_hours,
      service_area:             map.service_area             ?? DEFAULT_SETTINGS.service_area,
      whatsapp_number:          map.whatsapp_number          ?? DEFAULT_SETTINGS.whatsapp_number,
      whatsapp_booking_message: map.whatsapp_booking_message ?? DEFAULT_SETTINGS.whatsapp_booking_message,
      whatsapp_reminder_message:map.whatsapp_reminder_message?? DEFAULT_SETTINGS.whatsapp_reminder_message,
      invoice_footer_text:      map.invoice_footer_text      ?? DEFAULT_SETTINGS.invoice_footer_text,
      invoice_social_text:      map.invoice_social_text      ?? DEFAULT_SETTINGS.invoice_social_text,
      terapis_commission_pct:   Number(map.terapis_commission_pct ?? DEFAULT_SETTINGS.terapis_commission_pct),
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSetting(key: keyof AppSettings, value: string): Promise<void> {
  const supabase = createClient();
  await supabase.from('settings').upsert({ key, value, updated_at: new Date().toISOString() });
}
