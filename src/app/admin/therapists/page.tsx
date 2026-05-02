'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Plus, Search, Trash2, Pencil, CalendarDays, Download, ToggleLeft, ToggleRight, Check, X, Loader2, Users, MessageCircle, Clock } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { toPng } from 'html-to-image';
import { AdminSkeleton } from '@/components/admin/AdminSkeleton';

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
  discounts?: any[];
};

const formatRp = (n: number) => `Rp ${Number(n).toLocaleString('id-ID')}`;

export default function TherapistsPage() {
  const supabase = createClient();
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', phone: '', commission_pct: 30, is_active: true });
  const [saving, setSaving] = useState(false);

  // Payout State
  const [showPayout, setShowPayout] = useState(false);
  const [payoutTherapist, setPayoutTherapist] = useState<Therapist | null>(null);
  const [payoutStart, setPayoutStart] = useState(new Date().toISOString().split('T')[0]);
  const [payoutEnd, setPayoutEnd] = useState(new Date().toISOString().split('T')[0]);
  const [payoutItems, setPayoutItems] = useState<PayoutItem[]>([]);
  const [fetchingPayout, setFetchingPayout] = useState(false);
  const [generatingSlip, setGeneratingSlip] = useState(false);
  const [manualTipAmount, setManualTipAmount] = useState<number | ''>('');
  const [manualTipNote, setManualTipNote] = useState<string>('');
  const slipRef = useRef<HTMLDivElement>(null);

  // ── Payout State ──
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleTherapist, setScheduleTherapist] = useState<Therapist | null>(null);
  const [scheduleTab, setScheduleTab] = useState<'shift' | 'timeoff'>('shift');
  const [shifts, setShifts] = useState<any[]>([]);
  const [timeoffs, setTimeoffs] = useState<any[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [newTimeoff, setNewTimeoff] = useState({ date: '', reason: '', is_full_day: true, start: '', end: '' });

  useEffect(() => { fetchTherapists(); }, []);

  const fetchTherapists = async () => {
    setLoading(true);
    const { data } = await supabase.from('therapists').select('*').order('name');
    if (data) setTherapists(data);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!formData.name) return;
    setSaving(true);
    if (editId) {
      await supabase.from('therapists').update(formData).eq('id', editId);
    } else {
      await supabase.from('therapists').insert([{ ...formData }]);
    }
    await fetchTherapists();
    setSaving(false);
    setShowAdd(false);
    setEditId(null);
  };

  const toggleActive = async (t: Therapist) => {
    const newVal = !t.is_active;
    setTherapists(prev => prev.map(x => x.id === t.id ? { ...x, is_active: newVal } : x));
    await supabase.from('therapists').update({ is_active: newVal }).eq('id', t.id);
  };

  const handleDelete = async (t: Therapist) => {
    if (!confirm(`Hapus terapis ${t.name}?\nIni tidak bisa dibatalkan.`)) return;
    await supabase.from('therapists').delete().eq('id', t.id);
    setTherapists(prev => prev.filter(x => x.id !== t.id));
  };

  // ── Schedule Logic ──
  const DAYS_MAP = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  const openSchedule = async (t: Therapist) => {
    setScheduleTherapist(t);
    setShowSchedule(true);
    setScheduleTab('shift');
    setLoadingSchedule(true);
    
    // Fetch typical shifts (0 to 6) and operational hours
    const [{ data: shiftData }, { data: settingData }] = await Promise.all([
      supabase.from('therapist_shifts').select('*').eq('therapist_id', t.id),
      supabase.from('settings').select('value').eq('key', 'operational_hours').single()
    ]);

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

    const { data: offData } = await supabase.from('therapist_timeoffs').select('*').eq('therapist_id', t.id).order('off_date', { ascending: false }).limit(20);
    setTimeoffs(offData || []);

    setLoadingSchedule(false);
  };

  const saveShifts = async () => {
    if (!scheduleTherapist) return;
    setSaving(true);
    const payload = shifts.map(s => ({
      therapist_id: scheduleTherapist.id,
      day_of_week: s.day_of_week,
      is_working: s.is_working,
      start_time: s.start_time,
      end_time: s.end_time,
      break_start_time: s.break_start_time || null,
      break_end_time: s.break_end_time || null
    }));
    await supabase.from('therapist_shifts').upsert(payload, { onConflict: 'therapist_id, day_of_week' });
    setSaving(false);
    alert('Jadwal rutin berhasil disimpan.');
  };

  const addTimeoff = async () => {
    if (!scheduleTherapist || !newTimeoff.date) return;
    setSaving(true);
    const payload = {
      therapist_id: scheduleTherapist.id,
      off_date: newTimeoff.date,
      reason: newTimeoff.reason,
      is_full_day: newTimeoff.is_full_day,
      start_time: newTimeoff.is_full_day ? null : (newTimeoff.start || null),
      end_time: newTimeoff.is_full_day ? null : (newTimeoff.end || null),
    };
    await supabase.from('therapist_timeoffs').insert(payload);
    
    const { data: offData } = await supabase.from('therapist_timeoffs').select('*').eq('therapist_id', scheduleTherapist.id).order('off_date', { ascending: false }).limit(20);
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

  // ── Payout Slip Logic ──
  const openPayout = (t: Therapist) => {
    setPayoutTherapist(t);
    setPayoutItems([]);
    setManualTipAmount('');
    setManualTipNote('');
    setShowPayout(true);
  };

  const loadPayoutData = async () => {
    if (!payoutTherapist) return;
    setFetchingPayout(true);

    // Fetch all completed bookings from start to end date
    // Then join booking_items where therapist_id matches
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
          booking_discounts(discount_label, discount_value, discount_value_type, is_owner_borne)
        )
      `)
      .eq('therapist_id', payoutTherapist.id)
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
          discounts: row.bookings.booking_discounts || [],
        };
        else if (isTransport) acc[key].has_transport = true;
        else acc[key].service_name = acc[key].service_name ? `${acc[key].service_name} + ${row.service_name}` : row.service_name;

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
        discounts: g.discounts,
      }));
      setPayoutItems(items);
    }
    setFetchingPayout(false);
  };

  // ── Shared capture helper: temporarily unlocks parent overflow constraints ──
  // html-to-image uses getBoundingClientRect() which returns only the visible
  // portion. We walk up ancestors, remove any overflow clipping, capture the
  // full content, then restore everything.
  const captureSlip = async (): Promise<string | null> => {
    if (!slipRef.current) return null;
    const el = slipRef.current;

    // Collect all clipping ancestors
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

    // Also unlock the slipRef overflow for full render
    const elOverflow = el.style.overflow;
    el.style.overflow = 'visible';

    // Wait for reflow + fonts
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

    // Restore all
    el.style.overflow = elOverflow;
    saved.forEach(s => {
      s.el.style.overflow = s.overflow;
      s.el.style.height = s.height;
      s.el.style.maxHeight = s.maxHeight;
    });

    return dataUrl;
  };

  const generateSlipImage = async () => {
    if (!slipRef.current) return;
    setGeneratingSlip(true);
    const dataUrl = await captureSlip();
    if (dataUrl) {
      const link = document.createElement('a');
      link.download = `Slip_${payoutTherapist?.name}_${payoutStart}.png`;
      link.href = dataUrl;
      link.click();
    }
    setGeneratingSlip(false);
  };

  const shareToWhatsApp = async () => {
    if (!slipRef.current) return;
    setGeneratingSlip(true);
    const dataUrl = await captureSlip();
    if (dataUrl) {
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `Slip_${payoutTherapist?.name}_${payoutStart}.png`, { type: 'image/png' });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        try { await navigator.share({ files: [file] }); setGeneratingSlip(false); return; }
        catch (e) { if ((e as Error).name === 'AbortError') { setGeneratingSlip(false); return; } }
      }
      const phone = payoutTherapist?.phone?.replace(/\D/g, '') || '';
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

  return (
    <div className="container-custom py-12 max-w-5xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
            <Users size={20} className="text-earth-primary" /> Management Terapis
          </h1>
          <p className="text-sm text-zinc-500 mt-1">Atur komisi dan cetak slip gaji bagi hasil terapis.</p>
        </div>
        <button onClick={() => { setEditId(null); setFormData({ name: '', phone: '', commission_pct: 30, is_active: true }); setShowAdd(true); }}
          className="admin-btn-primary flex items-center gap-2">
          <Plus size={16} /> Tambah Terapis
        </button>
      </div>

      <div className="admin-card mb-6">
        <div className="relative mb-6 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
          <input type="text" placeholder="Cari nama terapis..." className="admin-input pl-9"
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>

        {loading ? (
          <AdminSkeleton rows={4} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500">
                  <th className="py-3 px-4 font-medium">Nama Terapis</th>
                  <th className="py-3 px-4 font-medium">No. WA</th>
                  <th className="py-3 px-4 font-medium text-center">Komisi Base</th>
                  <th className="py-3 px-4 font-medium text-center">Status</th>
                  <th className="py-3 px-4 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {therapists.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase())).map(t => (
                  <tr key={t.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <td className="py-3 px-4 text-zinc-900 dark:text-zinc-100 font-medium">{t.name}</td>
                    <td className="py-3 px-4 text-zinc-500">{t.phone || '-'}</td>
                    <td className="py-3 px-4 font-mono text-center">{t.commission_pct}%</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${t.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-500'}`}>
                        {t.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openSchedule(t)}
                          className="p-2 rounded-lg hover:bg-purple-50 text-purple-600 tooltip group relative">
                          <CalendarDays size={16} />
                          <span className="absolute -top-8 right-0 bg-zinc-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10 transition-opacity">Atur Jadwal</span>
                        </button>
                        <button onClick={() => openPayout(t)}
                          className="p-2 rounded-lg hover:bg-emerald-50 text-emerald-600 tooltip group relative">
                          <Download size={16} />
                          <span className="absolute -top-8 right-0 bg-zinc-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10 transition-opacity">Slip Gaji</span>
                        </button>
                        <button onClick={() => toggleActive(t)}
                          className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-400">
                          {t.is_active ? <ToggleRight size={18} className="text-emerald-500" /> : <ToggleLeft size={18} />}
                        </button>
                        <button onClick={() => { setEditId(t.id); setFormData({ name: t.name, phone: t.phone || '', commission_pct: t.commission_pct, is_active: t.is_active }); setShowAdd(true); }}
                          className="p-2 rounded-lg hover:bg-blue-50 text-blue-500">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => handleDelete(t)}
                          className="p-2 rounded-lg hover:bg-red-50 text-red-500">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {therapists.length === 0 && (
                  <tr><td colSpan={5} className="py-12 text-center text-zinc-400">Belum ada data terapis.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Input Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 w-full max-w-md shadow-xl border border-zinc-100 dark:border-zinc-800 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-semibold text-zinc-900 dark:text-white">{editId ? 'Edit Terapis' : 'Tambah Terapis'}</h3>
              <button onClick={() => setShowAdd(false)} className="text-zinc-400 hover:text-zinc-600"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-zinc-500 mb-1 block">Nama Terang</label>
                <input type="text" className="admin-input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} autoFocus />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-500 mb-1 block">No WhatsApp (opsional)</label>
                <input type="text" className="admin-input" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-500 mb-1 block">Persentase Komisi (%)</label>
                <input type="number" min={1} max={100} className="admin-input font-mono" value={formData.commission_pct || ''} onChange={e => setFormData({ ...formData, commission_pct: Number(e.target.value) })} />
                <p className="text-[10px] text-zinc-400 mt-1">Standar persentase bagi hasil untuk terapis ini.</p>
              </div>
              <button onClick={handleSave} disabled={saving || !formData.name} className="admin-btn-primary w-full flex justify-center py-2.5 mt-2">
                {saving ? <Loader2 size={18} className="animate-spin" /> : 'Simpan Data'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payout Slip Generator Modal */}
      {showPayout && payoutTherapist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 w-full max-w-2xl shadow-xl border border-zinc-100 dark:border-zinc-800 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Download size={18} className="text-emerald-600" /> Cetak Slip Bagi Hasil
                </h3>
                <p className="text-xs text-zinc-500 mt-1">Terapis: <span className="font-semibold">{payoutTherapist.name}</span></p>
              </div>
              <button onClick={() => setShowPayout(false)} className="text-zinc-400 hover:text-zinc-600"><X size={20} /></button>
            </div>

            {/* Filter */}
            <div className="flex flex-col gap-3 mb-6 bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
              <div className="flex items-end gap-3 w-full">
                <div className="flex-1">
                  <label className="text-xs font-medium text-zinc-500 mb-1 block">Dari Tanggal</label>
                  <input type="date" className="admin-input text-xs" value={payoutStart} onChange={e => setPayoutStart(e.target.value)} />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-medium text-zinc-500 mb-1 block">Sampai Tanggal</label>
                  <input type="date" className="admin-input text-xs" value={payoutEnd} onChange={e => setPayoutEnd(e.target.value)} />
                </div>
                <button onClick={loadPayoutData} disabled={fetchingPayout} className="bg-zinc-900 border border-zinc-900 text-white hover:bg-zinc-800 px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center h-[38px] w-[120px]">
                  {fetchingPayout ? <Loader2 size={16} className="animate-spin" /> : 'Tampilkan'}
                </button>
              </div>
              <div className="flex items-end gap-3 w-full border-t border-zinc-200 dark:border-zinc-700 pt-3">
                <div className="flex-1">
                  <label className="text-xs font-medium text-zinc-500 mb-1 block">Tambahan Kasbon / Tips (Nominal)</label>
                  <input type="number" placeholder="Contoh: 50000" className="admin-input text-xs" value={manualTipAmount} onChange={e => setManualTipAmount(e.target.value ? Number(e.target.value) : '')} />
                </div>
                <div className="flex-[2]">
                  <label className="text-xs font-medium text-zinc-500 mb-1 block">Keterangan Tambahan (Cth: Tips dari Ka Dina)</label>
                  <input type="text" placeholder="Tulis asal tips..." className="admin-input text-xs" value={manualTipNote} onChange={e => setManualTipNote(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-visible relative flex flex-col lg:flex-row gap-6 min-h-0">
              {/* Slip Preview */}
              <div className="flex-1 bg-zinc-100 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-x-auto overflow-y-auto">
                {/* Scale wrapper for mobile — full 400px, horizontally scrollable on mobile */}
                <div className="flex justify-center items-start" style={{ minWidth: 400 }}>
                  <div
                    ref={slipRef}
                    className="bg-[#FDFBF7] text-zinc-900 font-sans relative overflow-hidden"
                    style={{ width: 400, boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}
                  >
                  {/* Top Accent Strip */}
                  <div className="absolute top-0 left-0 right-0 h-2 bg-[#8B5E3C]" />

                  {/* Watermark Logo */}
                  <div className="absolute inset-0 z-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none -translate-y-16">
                    <img src="/serenalogo2.svg" alt="watermark" crossOrigin="anonymous" className="w-[120%] h-auto max-w-none grayscale -rotate-[15deg] mix-blend-multiply" />
                  </div>

                  <div className="relative z-10 p-8 mt-2">
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
                      <div>
                        <div className="relative flex items-center justify-start h-[56px] w-[220px] overflow-hidden -ml-2 mb-1">
                          <img 
                            src="/serenalogo2.svg" 
                            alt="SerenaRaga" 
                            crossOrigin="anonymous"
                            className="absolute h-[260px] w-auto max-w-none object-contain -ml-6" 
                          />
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
                      <h4 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#27272a', letterSpacing: '-0.02em' }}>{payoutTherapist.name.toUpperCase()}</h4>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e4e4e7', paddingBottom: '10px', marginBottom: '14px', fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#a1a1aa' }}>
                      <span>Rincian Kunjungan / Job</span><span>Komisi</span>
                    </div>

                    {payoutItems.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {payoutItems.map((item, idx) => {
                          return (
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
                                    
                                    const serviceCommission = item.commission_earned - item.transport_commission;
                                    const standardPct = payoutTherapist.commission_pct;
                                    const expectedWithoutDiscount = Math.round(item.service_price * (standardPct / 100));
                                    
                                    // Hitung mundur nilai harga setelah dipotong diskon
                                    const netPrice = Math.round(serviceCommission / (standardPct / 100));
                                    const discountAmount = item.service_price - netPrice;

                                    // Jika nilai komisi lebih kecil dari yang seharusnya, berarti ada diskon
                                    if (discountAmount > 0 && serviceCommission < expectedWithoutDiscount) {
                                      const sharedDiscounts = item.discounts?.filter(d => !d.is_owner_borne) || [];
                                      const discPctStr = sharedDiscounts.length > 0 
                                        ? sharedDiscounts.map(d => d.discount_value_type === 'percentage' ? d.discount_value + '%' : Math.round((d.discount_value / item.service_price) * 100) + '%').join(' + ')
                                        : Math.round((discountAmount / item.service_price) * 100) + '%';
                                        
                                      return `Tanggal: ${new Date(item.date + 'T00:00:00').toLocaleDateString('id-ID')} • Jasa: (${formatRp(item.service_price)} - ${discPctStr}) × ${standardPct}%`;
                                    }
                                    
                                    // Fallback jika komisi normal atau tidak ada diskon
                                    return `Tanggal: ${new Date(item.date + 'T00:00:00').toLocaleDateString('id-ID')} • Jasa: ${formatRp(item.service_price)} × ${standardPct}%`;
                                  })()}
                                </p>
                              </div>
                              <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#3f3f46' }}>
                                {formatRp(item.commission_earned)}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p style={{ fontSize: '12px', color: '#a1a1aa', textAlign: 'center', margin: '24px 0' }}>Tidak ada job terekam di periode ini.</p>
                    )}

                    {Number(manualTipAmount || 0) > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '12px', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px dashed #e4e4e7' }}>
                        <div>
                          <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#059669', marginBottom: '2px' }}>Tambahan Tips</p>
                          <p style={{ margin: '0', fontSize: '9px', color: '#71717a', lineHeight: 1.3 }}>
                            {manualTipNote || 'Tips Manual Pelanggan'}
                          </p>
                        </div>
                        <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#059669' }}>
                          {formatRp(Number(manualTipAmount || 0))}
                        </p>
                      </div>
                    )}

                    <div style={{ marginTop: '24px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: '#27272a', borderRadius: '12px 12px 12px 0', color: '#fff', boxShadow: '0 4px 12px rgba(39,39,42,0.2)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.2)' }}></div>
                          <span style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.8)' }}>Take Home Pay</span>
                        </div>
                        <span style={{ fontSize: '20px', fontWeight: 700, fontStyle: 'italic', letterSpacing: '0.02em', color: '#e4e4e7' }}>{formatRp(finalPayout)}</span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'center', margin: '40px auto 0', borderTop: '1px dashed #e4e4e7', paddingTop: '20px' }}>
                      <p style={{ fontSize: '9.5px', fontStyle: 'italic', fontFamily: 'Georgia, serif', color: '#8B5E3C', opacity: 0.8, marginBottom: '16px', lineHeight: 1.5 }}>
                        "*Nilai komisi bersifat bersih setelah penyesuaian diskon operasional. Biaya bahan habis pakai murni ditanggung oleh manajemen."
                      </p>
                    </div>
                    </div> {/* end relative z-10 content */}
                  </div> {/* end slipRef */}
                </div> {/* end minWidth scale wrapper */}
              </div> {/* end preview scroll container */}
            </div> {/* end flex row */}

            <div className="pt-6 mt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-3">
              <button onClick={() => setShowPayout(false)} className="px-5 py-2.5 rounded-lg text-sm font-semibold text-zinc-600 hover:bg-zinc-100 transition-colors">Tutup</button>
              <button
                onClick={generateSlipImage}
                disabled={payoutItems.length === 0 || generatingSlip}
                className="bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-50">
                {generatingSlip ? <><Loader2 size={16} className="animate-spin" /> Proses...</> : <><Download size={16} /> Unduh Card</>}
              </button>
              <button
                onClick={shareToWhatsApp}
                disabled={payoutItems.length === 0 || generatingSlip}
                className="bg-[#25D366] hover:bg-[#1da851] text-white flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {generatingSlip ? <><Loader2 size={16} className="animate-spin" /> Proses...</> : <><MessageCircle size={16} /> Share ke WA</>}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Schedule Management Modal */}
      {showSchedule && scheduleTherapist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 w-full max-w-3xl shadow-xl border border-zinc-100 dark:border-zinc-800 max-h-[95vh] flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                  <CalendarDays size={18} className="text-purple-600" /> Atur Jadwal & Shift
                </h3>
                <p className="text-xs text-zinc-500 mt-1">Terapis: <span className="font-semibold">{scheduleTherapist.name}</span></p>
              </div>
              <button onClick={() => setShowSchedule(false)} className="text-zinc-400 hover:text-zinc-600"><X size={20} /></button>
            </div>

            {/* Sub-Tabs */}
            <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-xl p-1 mb-6 max-w-sm">
              <button onClick={() => setScheduleTab('shift')} className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${scheduleTab === 'shift' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500'}`}>Shift Reguler</button>
              <button onClick={() => setScheduleTab('timeoff')} className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${scheduleTab === 'timeoff' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500'}`}>Pengecualian / Libur</button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 pr-2">
              {loadingSchedule ? (
                <div className="flex justify-center p-12"><Loader2 size={30} className="animate-spin text-zinc-400" /></div>
              ) : scheduleTab === 'shift' ? (
                <div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 p-3 rounded-xl text-xs mb-4 flex items-start gap-2">
                    <Clock size={14} className="mt-0.5 shrink-0" />
                    <p>Atur rentang jam kerja mingguan. Jangan lupa atur "Jam Break" (opsional) untuk menghindari booking di saat istirahat siang terapis.</p>
                  </div>
                  
                  <div className="space-y-2">
                    {shifts.map((s, idx) => (
                      <div key={idx} className={`flex items-center justify-between py-2 px-3 rounded-xl border transition-colors ${s.is_working ? 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900' : 'border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 opacity-70'}`}>
                        <div className="w-20 font-semibold text-sm">
                          {DAYS_MAP[s.day_of_week]}
                        </div>
                        
                        {s.is_working ? (
                          <div className="flex-1 flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-medium text-zinc-400 mr-1">Kerja:</span>
                              <input type="time" className="admin-input h-8 px-2 text-xs w-24" value={s.start_time?.slice(0,5) || ''} onChange={e => setShifts(prev => prev.map((x, i) => i === idx ? { ...x, start_time: e.target.value+':00' } : x))} />
                              <span className="text-zinc-400">-</span>
                              <input type="time" className="admin-input h-8 px-2 text-xs w-24" value={s.end_time?.slice(0,5) || ''} onChange={e => setShifts(prev => prev.map((x, i) => i === idx ? { ...x, end_time: e.target.value+':00' } : x))} />
                            </div>
                            <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-800 mx-1"></div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-medium text-zinc-400 mr-1">Break:</span>
                              <input type="time" className="admin-input h-8 px-2 text-xs w-24" value={s.break_start_time?.slice(0,5) || ''} onChange={e => setShifts(prev => prev.map((x, i) => i === idx ? { ...x, break_start_time: e.target.value ? e.target.value+':00' : '' } : x))} />
                              <span className="text-zinc-400">-</span>
                              <input type="time" className="admin-input h-8 px-2 text-xs w-24" value={s.break_end_time?.slice(0,5) || ''} onChange={e => setShifts(prev => prev.map((x, i) => i === idx ? { ...x, break_end_time: e.target.value ? e.target.value+':00' : '' } : x))} />
                            </div>
                          </div>
                        ) : (
                          <div className="flex-1 text-sm text-zinc-400 italic pl-1">Libur Default (Tutup)</div>
                        )}

                        <button onClick={() => {
                          const val = !s.is_working;
                          setShifts(prev => prev.map((x, i) => i === idx ? { ...x, is_working: val } : x));
                        }} className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors ml-4">
                          {s.is_working ? <ToggleRight size={24} className="text-purple-600" /> : <ToggleLeft size={24} />}
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex justify-end pt-4 border-t border-zinc-100 dark:border-zinc-800">
                    <button onClick={saveShifts} disabled={saving} className="admin-btn-primary flex items-center gap-2">
                      {saving ? <Loader2 size={16} className="animate-spin" /> : 'Simpan Perubahan Shift'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-semibold text-zinc-900 dark:text-white mb-4">Minta Cuti / Libur Fleksibel</h4>
                    <div className="space-y-4 bg-zinc-50 dark:bg-zinc-800/50 p-5 rounded-xl border border-zinc-100">
                      <div>
                        <label className="text-xs font-semibold text-zinc-500 mb-1 block">Tanggal</label>
                        <input type="date" className="admin-input" value={newTimeoff.date} onChange={e => setNewTimeoff({...newTimeoff, date: e.target.value})} />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-zinc-500 mb-1 block">Alasan (Cth: Pulang kampung)</label>
                        <input type="text" className="admin-input" placeholder="Tulis alasan..." value={newTimeoff.reason} onChange={e => setNewTimeoff({...newTimeoff, reason: e.target.value})} />
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" checked={newTimeoff.is_full_day} onChange={e => setNewTimeoff({...newTimeoff, is_full_day: e.target.checked})} className="rounded border-zinc-300 text-purple-600 focus:ring-purple-600" />
                        <span className="text-sm">Libur Penuh (Seharian)</span>
                      </div>
                      {!newTimeoff.is_full_day && (
                         <div className="flex gap-3">
                           <div className="flex-1">
                             <label className="text-xs font-semibold text-zinc-500 mb-1 block">Mulai Jam</label>
                             <input type="time" className="admin-input" value={newTimeoff.start} onChange={e => setNewTimeoff({...newTimeoff, start: e.target.value})} />
                           </div>
                           <div className="flex-1">
                             <label className="text-xs font-semibold text-zinc-500 mb-1 block">Sampai Jam</label>
                             <input type="time" className="admin-input" value={newTimeoff.end} onChange={e => setNewTimeoff({...newTimeoff, end: e.target.value})} />
                           </div>
                         </div>
                      )}
                      <button onClick={addTimeoff} disabled={saving || !newTimeoff.date} className="w-full admin-btn-primary py-2 mt-2">Tambah Tanggal Merah</button>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-zinc-900 dark:text-white mb-4">Riwayat Libur (Time-Off)</h4>
                    {timeoffs.length === 0 ? (
                      <p className="text-sm text-zinc-400">Belum ada data libur ekstensi.</p>
                    ) : (
                      <div className="space-y-3">
                        {timeoffs.map(off => (
                          <div key={off.id} className="flex items-center justify-between p-3 rounded-lg border border-red-100 bg-red-50/50 dark:border-red-900/30 dark:bg-red-900/10">
                            <div>
                              <p className="font-semibold text-sm text-zinc-900 dark:text-red-300">{new Date(off.off_date).toLocaleDateString('id-ID')}</p>
                              <p className="text-xs text-zinc-500">
                                {off.is_full_day ? 'Seharian Penuh' : `${off.start_time?.slice(0,5)} - ${off.end_time?.slice(0,5)}`} • {off.reason || 'Libur'}
                              </p>
                            </div>
                            <button onClick={() => deleteTimeoff(off.id, off.reason || off.off_date)} className="p-1.5 hover:bg-red-100 text-red-500 rounded"><Trash2 size={14}/></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
