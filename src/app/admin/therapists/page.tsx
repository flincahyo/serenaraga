'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Plus, Search, Trash2, Pencil, CalendarDays, Download, ToggleLeft, ToggleRight, Check, X, Loader2, Users, MessageCircle, Clock, Award, Wallet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase';
import { toPng } from 'html-to-image';
import { AdminSkeleton } from '@/components/admin/AdminSkeleton';
import { useUser } from '@/lib/user-context';

type Therapist = {
  id: string; name: string; phone: string;
  commission_pct: number; is_active: boolean; created_at: string;
};

type PayoutItem = {
  date: string;
  customer_name: string;
  service_name: string;
  price: number;
  commission_earned: number;
  service_price: number;
  transport_commission: number;
  has_transport: boolean;
  shared_discount_total?: number;
  therapist_discount_total?: number;
  booking_price?: number;
  transport_fee?: number;
  discounts?: any[];
};

const formatRp = (n: number) => `Rp ${Number(n).toLocaleString('id-ID')}`;
const formatDate = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

// ──────────────────────────────────────────
// TherapistModalForm component
// ──────────────────────────────────────────
function TherapistModalForm({
  isOpen,
  data,
  saving,
  isNew,
  onChange,
  onSave,
  onCancel,
}: {
  isOpen: boolean;
  data: { name: string; phone: string; commission_pct: number; is_active: boolean };
  saving: boolean;
  isNew: boolean;
  onChange: (d: any) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
          className="fixed inset-0 bg-black/40"
        />

        {/* Modal Panel */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl w-full max-w-md p-6 relative z-10 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
            <h3 className="font-semibold text-zinc-950 dark:text-white flex items-center gap-2">
              <Users size={16} className="text-earth-primary" />
              {isNew ? 'Tambah Terapis Baru' : 'Edit Data Terapis'}
            </h3>
            <button onClick={onCancel} className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg">
              <X size={16} />
            </button>
          </div>

          <div className="space-y-3.5">
            <div>
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1 block">Nama Terang</label>
              <input
                type="text"
                className="admin-input"
                placeholder="Nama terapis..."
                value={data.name}
                onChange={e => onChange({ ...data, name: e.target.value })}
                autoFocus
              />
            </div>
            
            <div>
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1 block">No WhatsApp (opsional)</label>
              <input
                type="text"
                className="admin-input font-mono"
                placeholder="628xxxxxxxx"
                value={data.phone}
                onChange={e => onChange({ ...data, phone: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1 block">Persentase Komisi (%)</label>
              <input
                type="number"
                min={1}
                max={100}
                className="admin-input font-mono w-32"
                value={data.commission_pct || ''}
                onChange={e => onChange({ ...data, commission_pct: Number(e.target.value) })}
              />
              <p className="text-[10px] text-zinc-400 mt-1">
                Standar persentase bagi hasil untuk terapis ini.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <button onClick={onCancel} className="admin-btn-ghost text-xs">
              Batal
            </button>
            <button
              onClick={onSave}
              disabled={saving || !data.name}
              className="admin-btn-primary text-xs disabled:opacity-50"
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
              {isNew ? 'Tambah' : 'Simpan Perubahan'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// ──────────────────────────────────────────
// TherapistDrawer component
// ──────────────────────────────────────────
function TherapistDrawer({
  therapist,
  isOpen,
  onClose,
  onEdit,
  defaultTab = 'profile',
}: {
  therapist: Therapist | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  defaultTab?: 'profile' | 'shift' | 'timeoff' | 'payout';
}) {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<'profile' | 'shift' | 'timeoff' | 'payout'>('profile');
  
  // Payout States
  const [payoutStart, setPayoutStart] = useState(new Date().toISOString().split('T')[0]);
  const [payoutEnd, setPayoutEnd] = useState(new Date().toISOString().split('T')[0]);
  const [payoutItems, setPayoutItems] = useState<PayoutItem[]>([]);
  const [fetchingPayout, setFetchingPayout] = useState(false);
  const [generatingSlip, setGeneratingSlip] = useState(false);
  const [manualTipAmount, setManualTipAmount] = useState<number | ''>('');
  const [manualTipNote, setManualTipNote] = useState<string>('');
  const slipRef = useRef<HTMLDivElement>(null);

  // Shift & Timeoff States
  const [shifts, setShifts] = useState<any[]>([]);
  const [timeoffs, setTimeoffs] = useState<any[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [newTimeoff, setNewTimeoff] = useState({ date: '', reason: '', is_full_day: true, start: '', end: '' });
  const [allowLastOrder, setAllowLastOrder] = useState<boolean>(false);
  const [saving, setSaving] = useState(false);

  const DAYS_MAP = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  const loadScheduleData = async (tId: string) => {
    setLoadingSchedule(true);
    const [{ data: shiftData }, { data: settingData }, { data: prefsData }, { data: offData }] = await Promise.all([
      supabase.from('therapist_shifts').select('*').eq('therapist_id', tId),
      supabase.from('settings').select('value').eq('key', 'operational_hours').single(),
      supabase.from('settings').select('value').eq('key', 'therapist_last_order_prefs').single(),
      supabase.from('therapist_timeoffs').select('*').eq('therapist_id', tId).order('off_date', { ascending: false }).limit(20)
    ]);

    if (prefsData && prefsData.value) {
      try {
        const prefs = JSON.parse(prefsData.value);
        setAllowLastOrder(!!prefs[tId]);
      } catch(e) {}
    } else {
      setAllowLastOrder(false);
    }

    let defStart = '09:00:00';
    let defEnd = '21:00:00';
    if (settingData?.value) {
      const matches = settingData.value.match(/\b(\d{1,2})[.:](\d{2})\b/g);
      if (matches && matches.length >= 2) {
        defStart = matches[0].replace('.', ':') + ':00';
        if (defStart.length === 7) defStart = '0' + defStart;
        defEnd = matches[matches.length-1].replace('.', ':') + ':00';
        if (defEnd.length === 7) defEnd = '0' + defEnd;
      }
    }

    const defaultShifts = Array.from({length: 7}).map((_, i) => {
      const existing = shiftData?.find(x => x.day_of_week === i);
      return existing || {
        day_of_week: i,
        is_working: true,
        start_time: defStart,
        end_time: defEnd,
        break_start_time: '',
        break_end_time: ''
      };
    });
    setShifts(defaultShifts);
    setTimeoffs(offData || []);
    setLoadingSchedule(false);
  };

  useEffect(() => {
    if (isOpen && therapist) {
      setActiveTab(defaultTab);
      loadScheduleData(therapist.id);
      setPayoutItems([]);
      setManualTipAmount('');
      setManualTipNote('');
    }
  }, [isOpen, therapist, defaultTab]);

  const loadPayoutData = async () => {
    if (!therapist) return;
    setFetchingPayout(true);
    const { data, error } = await supabase
      .from('booking_items')
      .select(`
        booking_id,
        service_name,
        price,
        commission_earned,
        bookings!inner(
          booking_date, 
          customer_name, 
          status,
          price,
          shared_discount_total,
          therapist_discount_total,
          booking_discounts(discount_label, discount_value, discount_value_type, is_owner_borne)
        )
      `)
      .eq('therapist_id', therapist.id)
      .eq('bookings.status', 'Completed')
      .gte('bookings.booking_date', payoutStart)
      .lte('bookings.booking_date', payoutEnd)
      .order('created_at', { ascending: true });

    if (!error && data) {
      const grouped = data.reduce((acc: any, row: any) => {
        const key = row.booking_id;
        const isTransport = row.service_name === 'Biaya Transport';
        if (!acc[key]) acc[key] = {
          date: row.bookings.booking_date,
          customer_name: row.bookings.customer_name || '-',
          service_name: isTransport ? '' : row.service_name,
          has_transport: isTransport,
          price: 0,
          commission_earned: 0,
          service_price: 0,
          transport_commission: 0,
          transport_fee: isTransport ? (Number(row.price) || 0) : 0,
          booking_price: Number(row.bookings.price) || 0,
          shared_discount_total: Number(row.bookings.shared_discount_total) || 0,
          therapist_discount_total: Number(row.bookings.therapist_discount_total) || 0,
          discounts: row.bookings.booking_discounts || [],
        };
        else {
          if (isTransport) {
            acc[key].has_transport = true;
            acc[key].transport_fee = Number(row.price) || 0;
          } else {
            acc[key].service_name = acc[key].service_name ? `${acc[key].service_name} + ${row.service_name}` : row.service_name;
          }
        }

        if (isTransport) {
          acc[key].transport_commission += Number(row.commission_earned) || 0;
        } else {
          acc[key].service_price += Number(row.price) || 0;
        }

        acc[key].price += Number(row.price) || 0;
        acc[key].commission_earned += Number(row.commission_earned) || 0;
        return acc;
      }, {});

      const items: PayoutItem[] = Object.values(grouped).map((g: any) => ({
        date: g.date,
        customer_name: g.customer_name,
        service_name: g.service_name || 'Biaya Transport',
        price: g.price,
        commission_earned: g.commission_earned,
        service_price: g.service_price,
        transport_commission: g.transport_commission,
        has_transport: g.has_transport,
        shared_discount_total: g.shared_discount_total,
        therapist_discount_total: g.therapist_discount_total,
        booking_price: g.booking_price,
        transport_fee: g.transport_fee,
        discounts: g.discounts,
      }));
      setPayoutItems(items);
    }
    setFetchingPayout(false);
  };

  const saveShifts = async () => {
    if (!therapist) return;
    setSaving(true);
    const payload = shifts.map(s => ({
      therapist_id: therapist.id,
      day_of_week: s.day_of_week,
      is_working: s.is_working,
      start_time: s.start_time,
      end_time: s.end_time,
      break_start_time: s.break_start_time || null,
      break_end_time: s.break_end_time || null
    }));
    await supabase.from('therapist_shifts').upsert(payload, { onConflict: 'therapist_id, day_of_week' });

    const { data: existPrefs } = await supabase.from('settings').select('value').eq('key', 'therapist_last_order_prefs').single();
    let prefs: Record<string, boolean> = {};
    if (existPrefs && existPrefs.value) {
      try { prefs = JSON.parse(existPrefs.value); } catch(e){}
    }
    prefs[therapist.id] = allowLastOrder;
    await supabase.from('settings').upsert({ key: 'therapist_last_order_prefs', value: JSON.stringify(prefs) });

    setSaving(false);
    alert('Jadwal rutin berhasil disimpan.');
  };

  const addTimeoff = async () => {
    if (!therapist || !newTimeoff.date) return;
    setSaving(true);
    const payload = {
      therapist_id: therapist.id,
      off_date: newTimeoff.date,
      reason: newTimeoff.reason,
      is_full_day: newTimeoff.is_full_day,
      start_time: newTimeoff.is_full_day ? null : (newTimeoff.start || null),
      end_time: newTimeoff.is_full_day ? null : (newTimeoff.end || null),
    };
    await supabase.from('therapist_timeoffs').insert(payload);
    
    const { data: offData } = await supabase.from('therapist_timeoffs').select('*').eq('therapist_id', therapist.id).order('off_date', { ascending: false }).limit(20);
    setTimeoffs(offData || []);
    setNewTimeoff({ date: '', reason: '', is_full_day: true, start: '', end: '' });
    setSaving(false);
  };

  const deleteTimeoff = async (id: string, reason: string) => {
    if (!confirm(`Hapus jadwal libur/izin "${reason}"?`)) return;
    setSaving(true);
    await supabase.from('therapist_timeoffs').delete().eq('id', id);
    setTimeoffs(prev => prev.filter(x => x.id !== id));
    setSaving(false);
  };

  const captureSlip = async (): Promise<string | null> => {
    if (!slipRef.current) return null;
    const el = slipRef.current;
    
    type Saved = { el: HTMLElement; overflow: string; height: string; maxHeight: string };
    const saved: Saved[] = [];
    let cur = el.parentElement;
    while (cur && cur !== document.body) {
      const cs = window.getComputedStyle(cur);
      if (cs.overflow !== 'visible' || cs.overflowX !== 'visible' || cs.overflowY !== 'visible') {
        saved.push({ el: cur, overflow: cur.style.overflow, height: cur.style.height, maxHeight: cur.style.maxHeight });
        cur.style.overflow = 'visible';
        cur.style.height = 'auto';
        cur.style.maxHeight = 'none';
      }
      cur = cur.parentElement;
    }

    const elOverflow = el.style.overflow;
    el.style.overflow = 'visible';

    await new Promise(r => requestAnimationFrame(r));
    await document.fonts.ready;

    const scale = Math.min(window.devicePixelRatio || 2, 3);
    const fullHeight = el.scrollHeight;

    let dataUrl: string | null = null;
    try {
      dataUrl = await toPng(el, {
        cacheBust: true,
        pixelRatio: scale,
        width: 400,
        height: fullHeight,
      });
    } catch (e) {
      console.error('Error capturing slip', e);
    }

    el.style.overflow = elOverflow;
    saved.forEach(s => {
      s.el.style.overflow = s.overflow;
      s.el.style.height = s.height;
      s.el.style.maxHeight = s.maxHeight;
    });

    return dataUrl;
  };

  const generateSlipImage = async () => {
    if (!slipRef.current || !therapist) return;
    setGeneratingSlip(true);
    const dataUrl = await captureSlip();
    if (dataUrl) {
      const link = document.createElement('a');
      link.download = `Slip_${therapist.name}_${payoutStart}.png`;
      link.href = dataUrl;
      link.click();
    }
    setGeneratingSlip(false);
  };

  const shareToWhatsApp = async () => {
    if (!slipRef.current || !therapist) return;
    setGeneratingSlip(true);
    const dataUrl = await captureSlip();
    if (dataUrl) {
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `Slip_${therapist.name}_${payoutStart}.png`, { type: 'image/png' });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        try { await navigator.share({ files: [file] }); setGeneratingSlip(false); return; }
        catch (e) { if ((e as Error).name === 'AbortError') { setGeneratingSlip(false); return; } }
      }
      const phone = therapist.phone?.replace(/\D/g, '') || '';
      if (phone) window.open(`https://wa.me/${phone}`, '_blank');
      const link = document.createElement('a');
      link.download = file.name;
      link.href = dataUrl;
      link.click();
    }
    setGeneratingSlip(false);
  };

  const totalPayout = payoutItems.reduce((s, i) => s + i.commission_earned, 0);
  const finalPayout = totalPayout + Number(manualTipAmount || 0);

  if (!therapist) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 z-40"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full md:max-w-3xl bg-white dark:bg-zinc-950 shadow-2xl z-50 border-l border-zinc-200 dark:border-zinc-800 flex flex-col"
          >
            {/* Header */}
            <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-earth-primary to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                  {therapist.name.slice(0,1).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900 dark:text-white leading-tight">
                    {therapist.name}
                  </h3>
                  <p className="text-xs text-zinc-400 font-mono mt-0.5">{therapist.phone || 'Tanpa WA'}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={onEdit}
                  className="p-2 text-zinc-500 hover:text-earth-primary hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                  title="Edit Terapis"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Sub-Tabs Selector */}
            <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1 border-b border-zinc-200 dark:border-zinc-800">
              {[
                { id: 'profile', label: 'Profil' },
                { id: 'shift', label: 'Shift Kerja' },
                { id: 'timeoff', label: 'Libur / Cuti' },
                { id: 'payout', label: 'Slip Payout' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    activeTab === tab.id
                      ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  {/* Basic Stats Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
                      <span className="text-[10px] text-zinc-400 font-semibold block uppercase">Base Komisi</span>
                      <span className="text-lg font-bold text-zinc-800 dark:text-zinc-200 font-mono mt-1 block">
                        {therapist.commission_pct}%
                      </span>
                    </div>
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
                      <span className="text-[10px] text-zinc-400 font-semibold block uppercase">Status Kerja</span>
                      <span className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${
                        therapist.is_active 
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                          : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700'
                      }`}>
                        {therapist.is_active ? 'AKTIF' : 'NONAKTIF'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Info Row */}
                  <div className="p-4 bg-purple-500/5 border border-purple-500/10 rounded-2xl text-xs text-purple-700 dark:text-purple-300 space-y-2 leading-relaxed">
                    <p className="font-bold flex items-center gap-1.5"><Clock size={13} /> Aturan Jam Kerja & Last Order</p>
                    <p>Rentang jam kerja harian, break istirahat, serta kelonggaran last order dapat dikonfigurasi melalui tab **Shift Kerja**. Pastikan data ini diupdate secara berkala untuk menghindari tabrakan booking.</p>
                  </div>
                </div>
              )}

              {activeTab === 'shift' && (
                <div className="space-y-4">
                  {loadingSchedule ? (
                    <div className="flex justify-center p-12"><Loader2 size={30} className="animate-spin text-zinc-400" /></div>
                  ) : (
                    <>
                      {/* Last Order Preferences Toggle */}
                      <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-950/20 rounded-2xl border border-purple-100 dark:border-purple-900/30">
                        <div>
                          <h4 className="text-xs font-bold text-purple-900 dark:text-purple-300">Izinkan Last Order?</h4>
                          <p className="text-[10px] text-purple-700/70 dark:text-purple-400/60 mt-0.5 max-w-sm">
                            Jika aktif, terapis dapat menerima booking asalkan MULAI sebelum jam pulangnya. Jika mati, layanan wajib SELESAI sebelum jam pulang.
                          </p>
                        </div>
                        <button onClick={() => setAllowLastOrder(!allowLastOrder)} className="p-1 rounded text-purple-400 hover:text-purple-600 transition-colors shrink-0">
                          {allowLastOrder ? <ToggleRight size={30} className="text-purple-600" /> : <ToggleLeft size={30} />}
                        </button>
                      </div>

                      {/* Shifts List */}
                      <div className="space-y-2">
                        {shifts.map((s, idx) => (
                          <div key={idx} className={`flex items-center justify-between py-2.5 px-3.5 rounded-xl border transition-colors ${s.is_working ? 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50' : 'border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/10 opacity-70'}`}>
                            <div className="w-16 font-semibold text-xs text-zinc-700 dark:text-zinc-300">
                              {DAYS_MAP[s.day_of_week]}
                            </div>
                            
                            {s.is_working ? (
                              <div className="flex-1 flex items-center gap-3">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-bold text-zinc-400 uppercase">Kerja:</span>
                                  <input type="time" className="admin-input h-8 px-2 text-xs w-20" value={s.start_time?.slice(0,5) || ''} onChange={e => setShifts(prev => prev.map((x, i) => i === idx ? { ...x, start_time: e.target.value+':00' } : x))} />
                                  <span className="text-zinc-400">-</span>
                                  <input type="time" className="admin-input h-8 px-2 text-xs w-20" value={s.end_time?.slice(0,5) || ''} onChange={e => setShifts(prev => prev.map((x, i) => i === idx ? { ...x, end_time: e.target.value+':00' } : x))} />
                                </div>
                                <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-800 mx-1"></div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-bold text-zinc-400 uppercase">Break:</span>
                                  <input type="time" className="admin-input h-8 px-2 text-xs w-20" value={s.break_start_time?.slice(0,5) || ''} onChange={e => setShifts(prev => prev.map((x, i) => i === idx ? { ...x, break_start_time: e.target.value ? e.target.value+':00' : '' } : x))} />
                                  <span className="text-zinc-400">-</span>
                                  <input type="time" className="admin-input h-8 px-2 text-xs w-20" value={s.break_end_time?.slice(0,5) || ''} onChange={e => setShifts(prev => prev.map((x, i) => i === idx ? { ...x, break_end_time: e.target.value ? e.target.value+':00' : '' } : x))} />
                                </div>
                              </div>
                            ) : (
                              <div className="flex-1 text-xs text-zinc-400 italic pl-1">Libur default (tutup)</div>
                            )}

                            <button onClick={() => {
                              const val = !s.is_working;
                              setShifts(prev => prev.map((x, i) => i === idx ? { ...x, is_working: val } : x));
                            }} className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors ml-4 shrink-0">
                              {s.is_working ? <ToggleRight size={24} className="text-purple-600" /> : <ToggleLeft size={24} />}
                            </button>
                          </div>
                        ))}
                      </div>

                      <button onClick={saveShifts} disabled={saving} className="w-full admin-btn-primary flex justify-center py-2.5 mt-4 text-xs font-bold">
                        {saving ? <Loader2 size={14} className="animate-spin" /> : 'Simpan Perubahan Shift'}
                      </button>
                    </>
                  )}
                </div>
              )}

              {activeTab === 'timeoff' && (
                <div className="space-y-6">
                  {/* Request Timeoff Form */}
                  <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl space-y-3.5">
                    <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 font-bold">Minta Cuti / Libur Fleksibel</h4>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-zinc-400 font-semibold mb-1 block">Tanggal</label>
                        <input type="date" className="admin-input text-xs" value={newTimeoff.date} onChange={e => setNewTimeoff({...newTimeoff, date: e.target.value})} />
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-400 font-semibold mb-1 block">Alasan</label>
                        <input type="text" className="admin-input text-xs" placeholder="Cth: Acara keluarga" value={newTimeoff.reason} onChange={e => setNewTimeoff({...newTimeoff, reason: e.target.value})} />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 py-1">
                      <input type="checkbox" id="fullDayCheck" checked={newTimeoff.is_full_day} onChange={e => setNewTimeoff({...newTimeoff, is_full_day: e.target.checked})} className="rounded border-zinc-300 dark:border-zinc-700 text-earth-primary focus:ring-earth-primary" />
                      <label htmlFor="fullDayCheck" className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Libur Penuh (Seharian)</label>
                    </div>

                    {!newTimeoff.is_full_day && (
                      <div className="grid grid-cols-2 gap-3 pt-1 border-t border-zinc-100 dark:border-zinc-850">
                        <div>
                          <label className="text-[10px] text-zinc-400 font-semibold mb-1 block">Mulai Jam</label>
                          <input type="time" className="admin-input text-xs" value={newTimeoff.start} onChange={e => setNewTimeoff({...newTimeoff, start: e.target.value})} />
                        </div>
                        <div>
                          <label className="text-[10px] text-zinc-400 font-semibold mb-1 block">Sampai Jam</label>
                          <input type="time" className="admin-input text-xs" value={newTimeoff.end} onChange={e => setNewTimeoff({...newTimeoff, end: e.target.value})} />
                        </div>
                      </div>
                    )}

                    <button onClick={addTimeoff} disabled={saving || !newTimeoff.date} className="w-full admin-btn-primary py-2 text-xs font-bold mt-2">
                      Tambah Tanggal Merah
                    </button>
                  </div>

                  {/* Leave History List */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Riwayat Libur (Time-off)</h4>
                    {timeoffs.length === 0 ? (
                      <p className="text-xs text-zinc-400 text-center py-4">Belum ada pengajuan tanggal libur.</p>
                    ) : (
                      <div className="space-y-2">
                        {timeoffs.map(off => (
                          <div key={off.id} className="flex items-center justify-between p-3 rounded-xl border border-red-100 bg-red-50/20 dark:border-red-950/20 dark:bg-red-950/10">
                            <div>
                              <p className="font-bold text-xs text-zinc-800 dark:text-red-300">{formatDate(off.off_date)}</p>
                              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                                {off.is_full_day ? 'Seharian Penuh' : `${off.start_time?.slice(0,5)} - ${off.end_time?.slice(0,5)}`} • {off.reason || 'Izin/Libur'}
                              </p>
                            </div>
                            <button onClick={() => deleteTimeoff(off.id, off.reason || off.off_date)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors">
                              <Trash2 size={13}/>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'payout' && (
                <div className="space-y-5">
                  {/* Payout Config Toolbar */}
                  <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl space-y-3.5 shadow-sm">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-zinc-400 font-semibold mb-1 block">Dari Tanggal</label>
                        <input type="date" className="admin-input text-xs" value={payoutStart} onChange={e => setPayoutStart(e.target.value)} />
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-400 font-semibold mb-1 block">Sampai Tanggal</label>
                        <input type="date" className="admin-input text-xs" value={payoutEnd} onChange={e => setPayoutEnd(e.target.value)} />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 border-t border-zinc-100 dark:border-zinc-800 pt-3">
                      <div>
                        <label className="text-[10px] text-zinc-400 font-semibold mb-1 block">Kasbon / Tips Tambahan (Rp)</label>
                        <input type="number" placeholder="Cth: 50000" className="admin-input text-xs font-mono" value={manualTipAmount} onChange={e => setManualTipAmount(e.target.value ? Number(e.target.value) : '')} />
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-400 font-semibold mb-1 block">Keterangan Tips</label>
                        <input type="text" placeholder="Tips dari Ka Dina..." className="admin-input text-xs" value={manualTipNote} onChange={e => setManualTipNote(e.target.value)} />
                      </div>
                    </div>

                    <button onClick={loadPayoutData} disabled={fetchingPayout} className="w-full admin-btn-primary flex justify-center py-2 text-xs font-bold mt-2">
                      {fetchingPayout ? <Loader2 size={13} className="animate-spin" /> : 'Tampilkan Data Komisi'}
                    </button>
                  </div>

                  {payoutItems.length > 0 && (
                    <div className="space-y-4">
                      {/* Action buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={generateSlipImage}
                          disabled={generatingSlip}
                          className="flex-1 bg-zinc-900 dark:bg-zinc-800 border border-zinc-900 dark:border-zinc-700 text-white hover:bg-zinc-800 dark:hover:bg-zinc-700 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                        >
                          {generatingSlip ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />} Unduh Slip Image
                        </button>
                        <button
                          onClick={shareToWhatsApp}
                          disabled={generatingSlip}
                          className="flex-1 bg-[#25D366] hover:bg-[#1da851] text-white flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                        >
                          {generatingSlip ? <Loader2 size={13} className="animate-spin" /> : <MessageCircle size={13} />} Share WA Terapis
                        </button>
                      </div>

                      {/* Slip Design Container */}
                      <div className="bg-zinc-100 dark:bg-zinc-950 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-x-auto flex justify-center shadow-inner">
                        <div className="flex justify-center items-start" style={{ minWidth: 400 }}>
                          <div
                            ref={slipRef}
                            className="bg-[#FDFBF7] text-zinc-900 font-sans relative overflow-hidden p-8"
                            style={{ width: 400, boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}
                          >
                            <div className="absolute top-0 left-0 right-0 h-2 bg-[#8B5E3C]" />

                            <div className="absolute inset-0 z-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none -translate-y-16">
                              <img src="/serenalogo2.svg" alt="watermark" crossOrigin="anonymous" className="w-[120%] h-auto max-w-none grayscale -rotate-[15deg] mix-blend-multiply" />
                            </div>

                            <div className="relative z-10">
                              {/* Header */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
                                <div>
                                  <div className="relative flex items-center justify-start h-[56px] w-[220px] overflow-hidden -ml-2 mb-1">
                                    <img src="/serenalogo2.svg" alt="SerenaRaga" crossOrigin="anonymous" className="absolute h-[260px] w-auto max-w-none object-contain -ml-6" />
                                  </div>
                                  <p style={{ margin: 0, fontSize: '7px', letterSpacing: '0.3em', fontWeight: 700, color: '#8B5E3C', marginTop: '4px' }}>COMFORTABLE HOME MASSAGE</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                  <div style={{ display: 'inline-block', padding: '4px 12px', background: '#8B5E3C', color: '#fff', fontSize: '9px', fontWeight: 900, fontStyle: 'italic', borderRadius: '6px', marginBottom: '8px', letterSpacing: '0.1em' }}>PAYOUT SLIP</div>
                                  <p style={{ fontSize: '9px', fontWeight: 500, color: '#a1a1aa' }}>
                                    {payoutStart === payoutEnd ? new Date(payoutStart + 'T00:00:00').toLocaleDateString('id-ID') : `${new Date(payoutStart + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - ${new Date(payoutEnd + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}`}
                                  </p>
                                </div>
                              </div>

                              {/* Therapist Info */}
                              <div style={{ borderLeft: '3px solid #8B5E3C', paddingLeft: '16px', marginBottom: '32px' }}>
                                <p style={{ margin: 0, fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#8B5E3C', opacity: 0.7, marginBottom: '4px' }}>Diberikan Kepada:</p>
                                <h4 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#27272a', letterSpacing: '-0.02em' }}>{therapist.name.toUpperCase()}</h4>
                              </div>

                              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e4e4e7', paddingBottom: '10px', marginBottom: '14px', fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#a1a1aa' }}>
                                <span>Rincian Kunjungan / Job</span><span>Komisi</span>
                              </div>

                              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {payoutItems.map((item, idx) => (
                                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px dashed #e4e4e7' }}>
                                    <div>
                                      <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#27272a', marginBottom: '2px' }}>
                                        {item.customer_name}
                                        {(() => {
                                          const sharedDiscounts = item.discounts?.filter(d => !d.is_owner_borne) || [];
                                          if (sharedDiscounts.length === 0) return null;
                                          const discStrs = sharedDiscounts.map(d => `${d.discount_label} disc ${d.discount_value_type === 'percentage' ? d.discount_value + '%' : Math.round((d.discount_value / item.service_price) * 100) + '%'}`);
                                          return <span style={{ fontWeight: 500, color: '#059669', fontSize: '9px', marginLeft: '6px' }}>( {discStrs.join(', ')} )</span>;
                                        })()}
                                      </p>
                                      <p style={{ margin: '0', fontSize: '9px', color: '#71717a', lineHeight: 1.3 }}>
                                        {item.service_name}
                                        {item.has_transport && <span style={{ color: '#8B5E3C', marginLeft: 4 }}>(+ Transport {formatRp(item.transport_commission)})</span>}
                                      </p>
                                      <p style={{ margin: '2px 0 0', fontSize: '8px', color: '#a1a1aa' }}>
                                        {(() => {
                                          if (item.service_price <= 0) return `Tanggal: ${new Date(item.date + 'T00:00:00').toLocaleDateString('id-ID')} • Hanya Transport`;
                                          
                                          const standardPct = therapist.commission_pct;
                                          const bookingGross = (item.booking_price ?? 0) - (item.transport_fee ?? 0);
                                          
                                          const itemSharedDisc = bookingGross > 0 ? Math.round(item.service_price * ((item.shared_discount_total || 0) / bookingGross)) : 0;
                                          const itemTherapistDisc = bookingGross > 0 ? Math.round(item.service_price * ((item.therapist_discount_total || 0) / bookingGross)) : 0;
                                          
                                          const maxBasisReduction = Math.round(item.service_price * 5 / 100);
                                          const basisReduction = Math.min(itemTherapistDisc, maxBasisReduction);
                                          const itemSharedBears = Math.round(itemSharedDisc * 50 / 100);
                                          
                                          let text = `Tanggal: ${new Date(item.date + 'T00:00:00').toLocaleDateString('id-ID')} • Jasa: `;
                                          if (basisReduction > 0) {
                                            const basisPct = Math.round((basisReduction / item.service_price) * 100);
                                            text += `(${formatRp(item.service_price)} - ${basisPct}%) × ${standardPct}%`;
                                          } else {
                                            text += `${formatRp(item.service_price)} × ${standardPct}%`;
                                          }
                                          if (itemSharedBears > 0) {
                                            text += ` - ${formatRp(itemSharedBears)} (Shared)`;
                                          }
                                          return text;
                                        })()}
                                      </p>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#3f3f46' }}>
                                      {formatRp(item.commission_earned)}
                                    </p>
                                  </div>
                                ))}
                              </div>

                              {Number(manualTipAmount || 0) > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '12px', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px dashed #e4e4e7' }}>
                                  <div>
                                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#059669', marginBottom: '2px' }}>Tambahan Tips / Kasbon</p>
                                    <p style={{ margin: '0', fontSize: '9px', color: '#71717a', lineHeight: 1.3 }}>{manualTipNote || 'Tips Manual Pelanggan'}</p>
                                  </div>
                                  <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#059669' }}>
                                    {formatRp(Number(manualTipAmount || 0))}
                                  </p>
                                </div>
                              )}

                              <div style={{ marginTop: '24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: '#27272a', borderRadius: '12px 12px 12px 0', color: '#fff', boxShadow: '0 4px 12px rgba(39,39,42,0.2)' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.2)' }} />
                                    <span style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.8)' }}>Take Home Pay</span>
                                  </div>
                                  <span style={{ fontSize: '20px', fontWeight: 700, fontStyle: 'italic', letterSpacing: '0.02em', color: '#e4e4e7' }}>{formatRp(finalPayout)}</span>
                                </div>
                              </div>

                              <div style={{ textAlign: 'center', margin: '40px auto 0', borderTop: '1px dashed #e4e4e7', paddingTop: '20px' }}>
                                <p style={{ fontSize: '9.5px', fontStyle: 'italic', fontFamily: 'Georgia, serif', color: '#8B5E3C', opacity: 0.8, marginBottom: '16px', lineHeight: 1.5 }}>
                                  &quot;*Nilai komisi bersifat bersih setelah penyesuaian diskon operasional. Biaya bahan habis pakai murni ditanggung oleh manajemen.&quot;
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ──────────────────────────────────────────
// Main Page Component
// ──────────────────────────────────────────
export default function TherapistsPage() {
  const { user } = useUser();
  const isOwner = user?.role !== 'cashier';
  const supabase = createClient();

  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Form Modal controls
  const [showAdd, setShowAdd] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', phone: '', commission_pct: 30, is_active: true });
  const [saving, setSaving] = useState(false);

  // Drawer controls
  const [selectedTherapist, setSelectedTherapist] = useState<Therapist | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<'profile' | 'shift' | 'timeoff' | 'payout'>('profile');

  const fetchTherapists = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('therapists').select('*').order('name');
    if (data) setTherapists(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTherapists();
  }, [fetchTherapists]);

  const startEdit = (t: Therapist) => {
    setEditId(t.id);
    setFormData({ name: t.name, phone: t.phone || '', commission_pct: t.commission_pct, is_active: t.is_active });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name) return;
    setSaving(true);
    if (editId) {
      await supabase.from('therapists').update(formData).eq('id', editId);
      // Update selected drawer therapist details if it's the one being edited
      if (selectedTherapist && selectedTherapist.id === editId) {
        setSelectedTherapist(prev => prev ? { ...prev, ...formData } : null);
      }
    } else {
      await supabase.from('therapists').insert([{ ...formData }]);
    }
    await fetchTherapists();
    setSaving(false);
    setShowAdd(false);
    setFormOpen(false);
    setEditId(null);
  };

  const toggleActive = async (t: Therapist) => {
    const newVal = !t.is_active;
    setTherapists(prev => prev.map(x => x.id === t.id ? { ...x, is_active: newVal } : x));
    await supabase.from('therapists').update({ is_active: newVal }).eq('id', t.id);
    if (selectedTherapist && selectedTherapist.id === t.id) {
      setSelectedTherapist(prev => prev ? { ...prev, is_active: newVal } : null);
    }
  };

  const handleDelete = async (t: Therapist) => {
    if (!confirm(`Hapus terapis ${t.name}?\nIni tidak bisa dibatalkan.`)) return;
    await supabase.from('therapists').delete().eq('id', t.id);
    setTherapists(prev => prev.filter(x => x.id !== t.id));
    if (selectedTherapist?.id === t.id) {
      setDrawerOpen(false);
    }
  };

  const filtered = therapists.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const activeCount = therapists.filter(t => t.is_active).length;
  const avgComm = therapists.length ? Math.round(therapists.reduce((s,t) => s + t.commission_pct, 0) / therapists.length) : 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Users size={20} className="text-earth-primary" /> Management Terapis
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 font-medium">Atur jam kerja, komisi, dan cetak slip gaji bagi hasil.</p>
        </div>
        {isOwner && (
          <button
            onClick={() => {
              setFormData({ name: '', phone: '', commission_pct: 30, is_active: true });
              setEditId(null);
              setShowAdd(true);
            }}
            className="admin-btn-primary text-xs"
          >
            <Plus size={16} /> Tambah Terapis
          </button>
        )}
      </div>

      {/* Summary Analytics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { icon: Users, label: 'Total Terapis', value: therapists.length.toString(), color: 'text-zinc-500 bg-zinc-500/10' },
          { icon: Check, label: 'Terapis Aktif', value: activeCount.toString(), color: 'text-emerald-600 bg-emerald-500/10 dark:text-emerald-400' },
          { icon: Award, label: 'Rerata Base Komisi', value: `${avgComm}%`, color: 'text-purple-600 bg-purple-500/10 dark:text-purple-400' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
            <div className={`w-7 h-7 rounded-xl flex items-center justify-center mb-2.5 ${color.split(' ')[1]}`}>
              <Icon size={14} className={color.split(' ')[0]} />
            </div>
            <p className="text-base font-bold text-zinc-900 dark:text-white leading-tight">{value}</p>
            <p className="text-[10px] text-zinc-400 font-semibold mt-1 uppercase tracking-wider">{label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar Search */}
      <div className="flex gap-2 items-center border-b border-zinc-200 dark:border-zinc-800 pb-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari nama terapis..."
            className="admin-input pl-9 text-xs"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Therapists Cards Grid */}
      {loading ? (
        <AdminSkeleton rows={4} />
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-xs text-zinc-400 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          Belum ada data terapis.
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800 shadow-sm">
          {filtered.map(t => (
            <div
              key={t.id}
              onClick={() => {
                setSelectedTherapist(t);
                setDrawerTab('profile');
                setDrawerOpen(true);
              }}
              className="group px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-all"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 border border-zinc-200/50 dark:border-zinc-700/50 group-hover:border-earth-primary/30 transition-colors">
                  <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300 group-hover:text-earth-primary transition-colors">
                    {t.name.slice(0, 1).toUpperCase()}
                  </span>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold text-sm text-zinc-900 dark:text-white leading-tight">
                      {t.name}
                    </h4>
                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${
                      t.is_active
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700'
                    }`}>
                      {t.is_active ? 'AKTIF' : 'NONAKTIF'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-zinc-400 flex-wrap">
                    <span className="flex items-center gap-1 font-mono">
                      <Plus size={11} className="rotate-45" /> {t.phone || 'Tanpa WA'}
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-zinc-500 dark:text-zinc-400">
                      Base Komisi: {t.commission_pct}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => {
                    setSelectedTherapist(t);
                    setDrawerTab('shift');
                    setDrawerOpen(true);
                  }}
                  className="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                  title="Lihat Jadwal & Shift"
                >
                  <CalendarDays size={15} />
                </button>

                <button
                  onClick={() => {
                    setSelectedTherapist(t);
                    setDrawerTab('payout');
                    setDrawerOpen(true);
                  }}
                  className="p-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 transition-colors"
                  title="Slip Gaji / Payout"
                >
                  <Download size={15} />
                </button>

                {isOwner && (
                  <>
                    <button
                      onClick={() => toggleActive(t)}
                      className="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg transition-colors"
                      title={t.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                    >
                      {t.is_active ? <ToggleRight size={20} className="text-emerald-500" /> : <ToggleLeft size={20} />}
                    </button>

                    <button
                      onClick={() => startEdit(t)}
                      className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Pencil size={14} />
                    </button>

                    <button
                      onClick={() => handleDelete(t)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                      title="Hapus"
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sliding Therapist Detail Drawer */}
      <TherapistDrawer
        therapist={selectedTherapist}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        defaultTab={drawerTab}
        onEdit={() => {
          if (selectedTherapist) {
            setDrawerOpen(false);
            startEdit(selectedTherapist);
          }
        }}
      />

      {/* Add Therapist Modal */}
      <TherapistModalForm
        isOpen={showAdd}
        data={formData}
        saving={saving}
        isNew={true}
        onChange={setFormData}
        onSave={handleSave}
        onCancel={() => setShowAdd(false)}
      />

      {/* Edit Therapist Modal */}
      <TherapistModalForm
        isOpen={formOpen}
        data={formData}
        saving={saving}
        isNew={false}
        onChange={setFormData}
        onSave={handleSave}
        onCancel={() => setFormOpen(false)}
      />
    </div>
  );
}
