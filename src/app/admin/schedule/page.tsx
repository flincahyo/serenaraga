'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Share2, Image as ImageIcon, Download, MessageCircle, RefreshCw, Eye, EyeOff, ClipboardPaste, Calendar, Pencil, Check, ChevronDown, ChevronUp, CheckCircle2, Ban, Globe, Palette, Loader2 } from 'lucide-react';
import { toPng } from 'html-to-image';
import { createClient } from '@/lib/supabase';
import { AdminSkeleton } from '@/components/admin/AdminSkeleton';

function CanvasLogo({ invert = true, scale = 1 }: { invert?: boolean; scale?: number }) {
  const h  = Math.round(90  * scale);
  const iH = Math.round(420 * scale);
  const ml = Math.round(-40 * scale);
  return (
    <div className="flex items-center justify-center w-full">
      <div className="relative overflow-hidden flex items-center justify-center" style={{ width: Math.round(500 * scale), height: h }}>
        <img src="/serenalogo2.svg" alt="SerenaRaga" className={`absolute w-auto max-w-none ${invert ? 'brightness-0 invert' : 'mix-blend-multiply'}`} style={{ height: iH, marginLeft: ml, marginTop: -4 }} crossOrigin="anonymous" />
      </div>
    </div>
  );
}

const WAIco = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const InstagramIco = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

type DaySchedule = {
  id: string;
  dateStr: string;
  label: string;
  active: boolean;
  timeText: string;
  visible: boolean;
};

// Parse jam operasional dari teks settings, contoh: "Senin - Minggu, 08.00 - 21.00 WIB"
// Returns "08:00 - 21:00" atau fallback jika gagal parse
function parseOperationalTime(raw: string, fallback = '08:00 - 22:00'): string {
  const matches = raw.match(/\b(\d{1,2})[.:](\d{2})\b/g);
  if (!matches || matches.length < 2) return fallback;
  const fmt = (t: string) => {
    const norm = t.replace('.', ':');
    return norm.length === 4 ? '0' + norm : norm;
  };
  return `${fmt(matches[0])} - ${fmt(matches[matches.length - 1])}`;
}

const getDaysInRange = (startStr: string, endStr: string, defaultTimeText = '08:00 - 22:00'): DaySchedule[] => {
  const days: DaySchedule[] = [];
  const start = new Date(startStr);
  const end = new Date(endStr);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return days;
  
  // limit to max 14 days to prevent UI breaking
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays > 13) end.setDate(start.getDate() + 13);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const weekday = d.toLocaleDateString('id-ID', { weekday: 'long' });
    const dayNum = d.getDate();
    const month = d.toLocaleDateString('id-ID', { month: 'long' });

    const label = `${weekday}, ${dayNum} ${month}`;
    const dateStr = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });

    days.push({
      id: `day_${dateStr}`,
      dateStr,
      label,
      active: true,
      timeText: defaultTimeText,
      visible: true,
    });
  }
  return days;
};

export default function SchedulePage() {
  const [schedules, setSchedules] = useState<DaySchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [promoNote, setPromoNote] = useState(' Dapatkan diskon spesial:\n• 5% untuk New Customer\n• 10% untuk Loyal Customer (min. 10x order)');
  const [pasteText, setPasteText] = useState('');
  const [isSmartPasteOpen, setIsSmartPasteOpen] = useState(false);
  const [startDate, setStartDate] = useState(() => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }));
  const [endDate, setEndDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 13); // Default 14 days (today + 13)
    return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
  });
  const [weekMode, setWeekMode] = useState<1 | 2>(2);
  // inline canvas editing — label
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [editingLabelValue, setEditingLabelValue] = useState('');
  // inline canvas editing — time
  const [editingTimeId, setEditingTimeId] = useState<string | null>(null);
  const [editingTimeValue, setEditingTimeValue] = useState('');

  const [promos, setPromos] = useState<any[]>([]);
  const [defaultTimeText, setDefaultTimeText] = useState('08:00 - 22:00');
  const [waNumber, setWaNumber] = useState('');
  const [socialText, setSocialText] = useState('serena.raga');

  const [bgImageUrl, setBgImageUrl] = useState('/hero-bg.png');
  const [bgPrompt, setBgPrompt] = useState('Aesthetic minimalist spa room with warm relaxing lighting');
  const [isGeneratingBg, setIsGeneratingBg] = useState(false);

  const [vignetteColor, setVignetteColor] = useState<'black'|'white'|'none'>('black');
  const [vignetteIntensity, setVignetteIntensity] = useState(60);
  const [darkenIntensity, setDarkenIntensity] = useState(40);

  const previewRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    const init = async () => {
      // Fetch settings: promos + operational_hours + WA + social
      const [{ data: discData }, { data: settingsData }] = await Promise.all([
        supabase.from('discounts').select('*').eq('is_active', true),
        supabase.from('settings').select('key, value').in('key', ['operational_hours', 'whatsapp_number', 'invoice_social_text']),
      ]);
      if (discData) setPromos(discData);

      // Parse settings
      let timeText = '08:00 - 22:00';
      if (settingsData) {
        const ohOpt = settingsData.find(r => r.key === 'operational_hours');
        if (ohOpt?.value) timeText = parseOperationalTime(ohOpt.value, '08:00 - 22:00');
        
        const waOpt = settingsData.find(r => r.key === 'whatsapp_number');
        if (waOpt?.value) setWaNumber(waOpt.value);

        const socOpt = settingsData.find(r => r.key === 'invoice_social_text');
        if (socOpt?.value) {
          // Bersihkan teks default dari settings jika ada (agar ringkas)
          let cleanSoc = socOpt.value.replace(/Instagram & Threads:\s*/i, '');
          // Hilangkan juga URL website jika sudah ada di text sosial, agar tidak dobel
          cleanSoc = cleanSoc.replace(/\s*\/?\s*www\.serenaraga\.fit/i, '');
          setSocialText(cleanSoc);
        }

        const bgImgOpt = settingsData.find(r => r.key === 'schedule_bg_image');
        if (bgImgOpt?.value) setBgImageUrl(bgImgOpt.value);
        
        const bgPrmptOpt = settingsData.find(r => r.key === 'schedule_bg_prompt');
        if (bgPrmptOpt?.value) setBgPrompt(bgPrmptOpt.value);
      }
      setDefaultTimeText(timeText);
      
      const sDate = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
      const eDate = new Date(Date.now() + 13 * 86400000).toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
      
      setSchedules(getDaysInRange(sDate, eDate, timeText));
      setLoading(false);
    };
    init();
  }, []);

  const handleDateRangeChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
    const newDays = getDaysInRange(start, end, defaultTimeText);
    
    // Auto toggle view mode based on length (2 weeks for > 7 days)
    if (newDays.length > 7) setWeekMode(2); 
    else setWeekMode(1);

    setSchedules(prev => {
      const prevMap = new Map(prev.map(d => [d.dateStr, d]));
      return newDays.map(d => prevMap.get(d.dateStr) ?? d);
    });
  };

  const setAllActive = (active: boolean) => {
    setSchedules(prev => prev.map(day => ({ ...day, active })));
  };

  const resetAllHours = () => {
    setSchedules(prev => prev.map(day => ({ ...day, timeText: defaultTimeText })));
  };

  const toggleDay = (dayId: string) => {
    setSchedules(prev => prev.map(day =>
      day.id === dayId ? { ...day, active: !day.active } : day
    ));
  };

  const toggleVisibility = (dayId: string) => {
    setSchedules(prev => prev.map(day =>
      day.id === dayId ? { ...day, visible: !day.visible } : day
    ));
  };

  const updateTimeText = (dayId: string, value: string) => {
    setSchedules(prev => prev.map(day =>
      day.id === dayId ? { ...day, timeText: value } : day
    ));
  };

  const startEditTime = (day: DaySchedule) => {
    setEditingTimeId(day.id);
    setEditingTimeValue(day.timeText);
  };

  const commitEditTime = () => {
    if (editingTimeId) {
      updateTimeText(editingTimeId, editingTimeValue.trim() || editingTimeValue);
    }
    setEditingTimeId(null);
    setEditingTimeValue('');
  };

  const updateLabel = (dayId: string, value: string) => {
    setSchedules(prev => prev.map(day =>
      day.id === dayId ? { ...day, label: value } : day
    ));
  };

  const startEditLabel = (day: DaySchedule) => {
    setEditingLabelId(day.id);
    setEditingLabelValue(day.label);
  };

  const commitEditLabel = () => {
    if (editingLabelId) {
      updateLabel(editingLabelId, editingLabelValue.trim() || editingLabelValue);
    }
    setEditingLabelId(null);
    setEditingLabelValue('');
  };

  const handleSmartPaste = () => {
    if (!pasteText.trim()) return;

    const lines = pasteText.split('\n');
    let newSchedules = [...schedules];

    // Hide all initially, we only show matched days. Default to FULL.
    newSchedules = newSchedules.map(d => ({ ...d, visible: false, active: false }));

    lines.forEach(line => {
      if (!line.trim()) return;

      const lineLower = line.toLowerCase();

      const matchedDayIndex = newSchedules.findIndex(day => {
        const parts = day.label.split(',');
        const dayName = parts[0].trim().toLowerCase();
        const dateNum = parts[1]?.trim().split(' ')[0];
        return lineLower.includes(dayName) && dateNum && lineLower.includes(dateNum);
      });

      if (matchedDayIndex !== -1) {
        const matchedDay = { ...newSchedules[matchedDayIndex] };
        matchedDay.visible = true;

        if (lineLower.includes('full')) {
          matchedDay.active = false;
          matchedDay.timeText = defaultTimeText;
        } else {
          matchedDay.active = true;

          const sep = (lineLower.includes('&') || lineLower.includes('dan')) ? '&' : '-';

          // Extract time using regex
          const timeRegex = /\b\d{1,2}[.:]\d{2}\b/g;
          const timesObj = line.match(timeRegex);

          if (timesObj && timesObj.length > 0) {
            const padTime = (t: string) => t.length === 4 ? `0${t}` : t;
            const normalized = timesObj.map(t => padTime(t.replace('.', ':')));

            if (normalized.length >= 2) {
              matchedDay.timeText = `${normalized[0]} ${sep} ${normalized[normalized.length - 1]}`;
            } else {
              matchedDay.timeText = normalized[0];
            }
          }
        }
        newSchedules[matchedDayIndex] = matchedDay;
      }
    });

    setSchedules(newSchedules);
    setIsSmartPasteOpen(false);
  };

  const autoGenerateFromTherapists = async () => {
    setLoading(true);
    const { data: ths } = await supabase.from('therapists').select('id').eq('is_active', true);
    const thIds = ths?.map(t => t.id) || [];
    
    if (thIds.length === 0) {
       alert("Tidak ada terapis aktif.");
       setLoading(false);
       return;
    }

    const [{ data: shifts }, { data: offs }, { data: bData }, { data: settingData }] = await Promise.all([
      supabase.from('therapist_shifts').select('*').in('therapist_id', thIds),
      supabase.from('therapist_timeoffs').select('*').in('therapist_id', thIds).gte('off_date', startDate).lte('off_date', endDate),
      (supabase.from('booking_items').select('therapist_id, duration, bookings!inner(id, booking_date, booking_time, status)').in('therapist_id', thIds).gte('bookings.booking_date', startDate).lte('bookings.booking_date', endDate).neq('bookings.status', 'Canceled') as any),
      supabase.from('settings').select('key, value').in('key', ['default_buffer_time', 'minimum_viable_duration', 'therapist_last_order_prefs'])
    ]);
    
    let defaultBuffer = 30;
    let mvd = 120;
    let lastOrderPrefs: Record<string, boolean> = {};
    
    if (settingData) {
      const bufSet = settingData.find(s => s.key === 'default_buffer_time');
      if (bufSet && bufSet.value) defaultBuffer = Number(bufSet.value);
      const mvdSet = settingData.find(s => s.key === 'minimum_viable_duration');
      if (mvdSet && mvdSet.value) mvd = Number(mvdSet.value);
      const prefsSet = settingData.find(s => s.key === 'therapist_last_order_prefs');
      if (prefsSet && prefsSet.value) {
        try { lastOrderPrefs = JSON.parse(prefsSet.value); } catch(e) {}
      }
    }

    const timeToMins = (t: string) => {
      if (!t) return 0;
      const [h,m] = t.split(':').map(Number);
      return h * 60 + m;
    };
    const minsToTime = (m: number) => `${String(Math.floor(m/60)).padStart(2, '0')}.${String(m%60).padStart(2, '0')}`;

    setSchedules(prev => prev.map(day => {
      const gDate = new Date(day.dateStr);
      const dayOfWeek = gDate.getDay();
      const shopFreeBlocks: {s: number, e: number}[] = [];
      let workingCount = 0;

      thIds.forEach(tid => {
        const thOff = offs?.find(o => o.therapist_id === tid && o.off_date === day.dateStr);
        if (thOff && thOff.is_full_day) return; 

        const thShift = shifts?.find(s => s.therapist_id === tid && s.day_of_week === dayOfWeek);
        if (thShift && thShift.is_working) {
           workingCount++;
           let shiftStart = timeToMins(thShift.start_time);
           let shiftEnd = timeToMins(thShift.end_time);
           
           let trueShiftEnd = shiftEnd;
           if (lastOrderPrefs[tid] === true) {
             trueShiftEnd += mvd;
           }

           let tFree: {s: number, e: number}[] = [{ s: shiftStart, e: trueShiftEnd }];
           
           const removeBlock = (start: number, end: number) => {
             const newFree: {s: number, e: number}[] = [];
             for (let f of tFree) {
               if (end <= f.s || start >= f.e) {
                 newFree.push(f);
               } else {
                 if (start > f.s) newFree.push({ s: f.s, e: start });
                 if (end < f.e) newFree.push({ s: end, e: f.e });
               }
             }
             tFree = newFree;
           };

           if (thShift.break_start_time && thShift.break_end_time) {
             removeBlock(timeToMins(thShift.break_start_time), timeToMins(thShift.break_end_time));
           }
           if (thOff && !thOff.is_full_day && thOff.start_time && thOff.end_time) {
             removeBlock(timeToMins(thOff.start_time), timeToMins(thOff.end_time));
           }

           const thBookings = bData ? (bData as any[]).filter((b: any) => b.therapist_id === tid && b.bookings.booking_date === day.dateStr) : [];
           const groupedBks: Record<string, { start: number, dur: number }> = {};
           
           for (const bk of thBookings) {
             const bid = bk.bookings.id;
             let dur = parseInt(String(bk.duration)) || 90;
             if (!groupedBks[bid]) {
               groupedBks[bid] = { start: timeToMins(bk.bookings.booking_time), dur };
             } else {
               groupedBks[bid].dur += dur;
             }
           }
           
           for (const bid in groupedBks) {
             const bk = groupedBks[bid];
             removeBlock(bk.start, bk.start + bk.dur + defaultBuffer);
           }
           
           // Filter gaps based on the dynamic MVD setting
           tFree = tFree.filter(f => (f.e - f.s) >= mvd);
           
           // Snap to full hours (60 min grid) to match landing page UI, and cap at strict shiftEnd
           tFree = tFree.map(f => {
              let newS = Math.ceil(f.s / 60) * 60;
              let newE = Math.floor(Math.min(f.e, shiftEnd) / 60) * 60;
              return { s: newS, e: newE };
           }).filter(f => f.s <= f.e); // Keep only valid ranges after snapping
           
           shopFreeBlocks.push(...tFree);
        }
      });

      if (workingCount === 0) {
        return { ...day, active: false };
      }

      if (shopFreeBlocks.length === 0) {
        return { ...day, active: true, timeText: "FULL BOOKED" };
      }

      // Merge overlapping free blocks globally for the shop
      shopFreeBlocks.sort((a,b) => a.s - b.s);
      const mergedBlocks: {s: number, e: number}[] = [shopFreeBlocks[0]];
      
      for (let i = 1; i < shopFreeBlocks.length; i++) {
         const curr = shopFreeBlocks[i];
         const last = mergedBlocks[mergedBlocks.length - 1];
         if (curr.s <= last.e) {
           last.e = Math.max(last.e, curr.e); // overlap, merge
         } else {
           mergedBlocks.push(curr); // gap
         }
      }

      // Format to string
      const timeParts = mergedBlocks.map(b => {
        const gap = b.e - b.s;
        // If the physical gap is smaller than the MVD (e.g., a Last Order scenario)
        // Only print the Start Time so customers don't visually see a "short" range.
        if (gap < mvd) {
          return minsToTime(b.s);
        }
        return `${minsToTime(b.s)} - ${minsToTime(b.e)}`;
      });
      const timeText = timeParts.join(' & ');

      return { ...day, active: true, timeText };
    }));
    setLoading(false);
  };

  const generateImage = async (action: 'download' | 'share') => {
    if (!previewRef.current) return;
    // Commit any open edits before generating
    if (editingLabelId) commitEditLabel();
    if (editingTimeId) commitEditTime();
    setGenerating(true);

    try {
      const dataUrl = await toPng(previewRef.current, {
        quality: 0.95,
        width: 1080,
        height: 1920,
        cacheBust: true,
        style: { transform: 'scale(1)', transformOrigin: 'top left' }
      });

      if (action === 'download') {
        const link = document.createElement('a');
        link.download = `Jadwal_SerenaRaga_${new Date().toISOString().slice(0, 10)}.png`;
        link.href = dataUrl;
        link.click();
      } else if (action === 'share') {
        try {
          const blob = await (await fetch(dataUrl)).blob();
          const file = new File([blob], 'jadwal.png', { type: 'image/png' });
          if (navigator.share) {
            await navigator.share({
              title: 'Jadwal SerenaRaga',
              files: [file]
            });
          } else {
            alert('Browser Anda tidak mendukung fitur native share. Gambar akan diunduh sebagai gantinya.');
            generateImage('download');
          }
        } catch (e) {
          console.error("Share failed", e);
        }
      }
    } catch (error) {
      console.error('Error generating image', error);
      alert('Gagal menghasilkan gambar');
    } finally {
      setGenerating(false);
    }
  };

  const generateBackground = async () => {
    setIsGeneratingBg(true);
    try {
      const res = await fetch('/api/ai/grok-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visualSubject: bgPrompt,
          seasonalNuance: 'elegant warm minimalist spa mood',
        })
      });
      if (!res.ok) throw new Error('Failed to generate background via Grok');
      const data = await res.json();
      if (data.url) {
        setBgImageUrl(data.url);
        await supabase.from('settings').upsert([
          { key: 'schedule_bg_image', value: data.url },
          { key: 'schedule_bg_prompt', value: bgPrompt }
        ]);
      }
    } catch (err) {
      console.error(err);
      alert('Gagal generate background. Coba lagi.');
    } finally {
      setIsGeneratingBg(false);
    }
  };

  if (loading) return <AdminSkeleton rows={5} />;

  const visibleSchedules = schedules.filter(d => d.visible);


  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Share Jadwal</h1>
          <p className="text-sm text-zinc-500 mt-1">Atur ketersediaan dan hasilkan gambar untuk Story IG / WA.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => generateImage('download')}
            disabled={generating}
            className="flex items-center gap-2 bg-earth-primary text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-earth-primary/90 disabled:opacity-50 transition-all shadow-sm"
          >
            <Download size={15} /> Unduh PNG
          </button>
          <button
            onClick={() => generateImage('share')}
            disabled={generating}
            className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-50 transition-all"
          >
            <MessageCircle size={15} /> Share WA/IG
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* LEFT PANEL: Editor */}
        <div className="lg:col-span-3 space-y-4">
          {/* Smart Paste Block */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
            <button 
              onClick={() => setIsSmartPasteOpen(!isSmartPasteOpen)}
              className="w-full flex justify-between items-center px-5 py-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
            >
              <span className="text-sm font-semibold text-zinc-800 dark:text-white flex items-center gap-2">
                <ClipboardPaste size={15} className="text-earth-primary" /> Smart Paste
              </span>
              <ChevronDown size={15} className={`text-zinc-400 transition-transform duration-200 ${isSmartPasteOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isSmartPasteOpen && (
              <div className="px-5 pb-5 border-t border-zinc-100 dark:border-zinc-800 pt-4 space-y-3">
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Paste teks jadwal mentah dari WhatsApp atau Instagram. Sistem otomatis menyortir hari, jam, dan status FULL.
                </p>
                <textarea
                  className="admin-input h-28 text-xs font-mono resize-none w-full bg-zinc-50 dark:bg-zinc-800/50 block"
                  placeholder={`Contoh:\nRabu, 15 April FULL\nKamis, 16 April 08.00\nJumat, 17 April 16.00-22.00`}
                  value={pasteText}
                  onChange={e => setPasteText(e.target.value)}
                />
                <div className="flex justify-end">
                  <button onClick={handleSmartPaste} disabled={!pasteText.trim()} className="flex items-center gap-1.5 bg-earth-primary text-white text-xs font-semibold px-4 py-2 rounded-lg disabled:opacity-40 transition-all hover:bg-earth-primary/90">
                    <CheckCircle2 size={13} /> Auto Format
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex flex-col md:flex-row gap-3 md:items-center justify-between">
              
              {/* Range Date Picker */}
              <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2">
                <Calendar size={14} className="text-zinc-400 shrink-0" />
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={e => handleDateRangeChange(e.target.value, endDate)} 
                  className="text-xs font-medium bg-transparent border-none focus:ring-0 text-zinc-700 dark:text-zinc-300 w-[110px]" 
                />
                <span className="text-zinc-300 dark:text-zinc-600">–</span>
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={e => handleDateRangeChange(startDate, e.target.value)} 
                  className="text-xs font-medium bg-transparent border-none focus:ring-0 text-zinc-700 dark:text-zinc-300 w-[110px]" 
                />
              </div>

              {/* Quick Actions — all same visual weight */}
              <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                <button 
                  onClick={autoGenerateFromTherapists} 
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-earth-primary/10 text-earth-primary hover:bg-earth-primary/20 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap"
                >
                  <RefreshCw size={13} /> Auto-Sync
                </button>
                <button 
                  onClick={() => setAllActive(true)} 
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap"
                >
                  <CheckCircle2 size={13} /> Semua Buka
                </button>
                <button 
                  onClick={() => setAllActive(false)} 
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap"
                >
                  <Ban size={13} /> Semua FULL
                </button>
                <button 
                  onClick={resetAllHours} 
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap"
                >
                  <RefreshCw size={13} /> Reset Jam
                </button>
              </div>
            </div>

            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {/* Week 1 group header when 2-week mode */}
              {weekMode === 2 && (
                <div className="px-4 py-2 bg-earth-primary/5 border-b border-earth-primary/10">
                  <p className="text-[11px] font-bold text-earth-primary uppercase tracking-widest">Minggu 1</p>
                </div>
              )}
              {schedules.slice(0, 7).map(day => (
                <DayRow
                  key={day.id}
                  day={day}
                  onToggleVisibility={toggleVisibility}
                  onToggleDay={toggleDay}
                />
              ))}

              {/* Week 2 */}
              {weekMode === 2 && (
                <>
                  <div className="px-5 py-2.5 bg-earth-primary/5 border-y border-earth-primary/10">
                    <p className="text-[11px] font-bold text-earth-primary uppercase tracking-widest">Minggu 2</p>
                  </div>
                  {schedules.slice(7, 14).map(day => (
                    <DayRow
                      key={day.id}
                      day={day}
                      onToggleVisibility={toggleVisibility}
                      onToggleDay={toggleDay}
                    />
                  ))}
                </>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-semibold text-zinc-800 dark:text-white flex items-center gap-2">
                <ImageIcon size={15} className="text-earth-primary" /> Visual Background (Grok AI)
              </h2>
            </div>
            <textarea
              className="admin-input resize-none h-16 text-sm"
              value={bgPrompt}
              onChange={(e) => setBgPrompt(e.target.value)}
              placeholder="Deskripsikan background aesthetic..."
            />
            <div className="flex justify-end">
              <button
                onClick={generateBackground}
                disabled={isGeneratingBg || !bgPrompt.trim()}
                className="flex items-center gap-2 bg-earth-primary text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-earth-primary/90 disabled:opacity-50 transition-all"
              >
                {isGeneratingBg ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />} 
                {isGeneratingBg ? 'Generating via Grok...' : 'Regenerate Background'}
              </button>
            </div>

            {/* DESIGN TOOLS - Vignette & Darken */}
            <div className="pt-4 mt-4 border-t border-zinc-100 dark:border-zinc-800">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-3 flex items-center gap-2">
                <Palette size={13} /> Tone Adjustments
              </h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">Darken Overlay</span>
                    <span className="font-mono text-zinc-700 dark:text-zinc-300">{darkenIntensity}%</span>
                  </div>
                  <input type="range" min="0" max="100" value={darkenIntensity} onChange={(e) => setDarkenIntensity(Number(e.target.value))} className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-earth-primary" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">Vignette Blur</span>
                    <span className="font-mono text-zinc-700 dark:text-zinc-300">{vignetteIntensity}%</span>
                  </div>
                  <input type="range" min="0" max="100" value={vignetteIntensity} onChange={(e) => setVignetteIntensity(Number(e.target.value))} className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-earth-primary" disabled={vignetteColor === 'none'} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-semibold text-zinc-800 dark:text-white">Catatan / Promo</h2>
              {promos.length > 0 && (
                <select
                  className="admin-input py-1 text-xs w-44 bg-zinc-50 dark:bg-zinc-800 font-medium text-earth-primary"
                  onChange={e => {
                    const p = promos.find((x: any) => x.id === e.target.value);
                    if (p) {
                      const valStr = p.value_type === 'percentage' ? `${p.value}%` : `Rp ${p.value.toLocaleString('id-ID')}`;
                      setPromoNote(`✨ ${p.name}\n${p.description ? `• ${p.description}\n` : ''}• Diskon: ${valStr}`);
                    }
                  }}
                  defaultValue=""
                >
                  <option value="" disabled>Pilih Promo...</option>
                  {promos.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              )}
            </div>
            <textarea
              className="admin-input resize-none h-24 text-sm"
              value={promoNote}
              onChange={(e) => setPromoNote(e.target.value)}
              placeholder="Kosongkan jika tidak ada catatan."
            />
          </div>
        </div>

        {/* RIGHT PANEL: Live Preview */}
        <div className="lg:col-span-2">
          <div className="sticky top-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-zinc-500 flex items-center gap-1.5">
                <Eye size={13} />
                Live Preview
                {generating && <span className="text-earth-primary font-normal flex items-center gap-1 animate-pulse ml-1"><ImageIcon size={12} /> Rendering...</span>}
              </p>
              <p className="text-[10px] text-zinc-400 flex items-center gap-1">
                <Pencil size={10} /> Klik untuk edit
              </p>
            </div>

            {/* The wrapper that scales the 1080x1920 canvas down to fit the web layout */}
            <div className="relative w-full rounded-2xl overflow-hidden shadow-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
              style={{ aspectRatio: '9/16' }}>

              <div
                className="absolute top-0 left-0 origin-top-left"
                style={{ width: '1080px', height: '1920px', transform: 'scale(calc(100% / 1080 * var(--tw-scale-x, 1)))' }}
                ref={(el) => {
                  if (el) {
                    const parentWidth = el.parentElement?.clientWidth || 0;
                    el.style.transform = `scale(${parentWidth / 1080})`;
                  }
                }}
              >
                {/* 1080x1920 Canvas Content (Poster Mode) */}
                <div
                  ref={previewRef}
                  className="w-[1080px] h-[1920px] bg-[#1a1a1a] relative flex flex-col p-[80px] justify-between overflow-hidden font-sans"
                >
                  {/* Background Image & Overlay */}
                  <div className="absolute inset-0 z-0">
                    <img src={bgImageUrl} alt="Background" className="w-full h-full object-cover" crossOrigin="anonymous" />
                    {vignetteColor !== 'none' && (
                      <div 
                        className={`absolute inset-0 bg-gradient-to-t ${vignetteColor === 'black' ? 'from-black via-black/50' : 'from-white via-white/50'} to-transparent`}
                        style={{ opacity: vignetteIntensity / 100 }}
                      />
                    )}
                    {darkenIntensity > 0 && (
                      <div className="absolute inset-0 bg-black" style={{ opacity: darkenIntensity / 100 }} />
                    )}
                  </div>

                  {/* Header */}
                  <div className="relative z-10 w-full flex justify-center items-center mb-6 mt-0">
                    <CanvasLogo invert={true} scale={0.65} />
                  </div>

                  {/* Main Content (Title + Schedules) centered vertically */}
                  <div className="relative z-10 w-full flex flex-col gap-20 flex-grow justify-center pb-20">
                    {/* Title */}
                    <div className="text-center">
                      <h2 className="text-[75px] leading-[1] text-white font-sans font-bold uppercase tracking-[0.05em] shadow-sm">
                        Available Slots
                      </h2>
                    </div>

                    {/* Schedule Body */}
                    {weekMode === 1 ? (
                      // Single week layout
                      <div className="space-y-6 px-16">
                        {visibleSchedules.map(day => (
                          <CanvasDayRow
                            key={`preview_${day.id}`}
                            day={day}
                            editingLabelId={editingLabelId}
                            editingLabelValue={editingLabelValue}
                            onStartEditLabel={startEditLabel}
                            onLabelChange={setEditingLabelValue}
                            onCommitLabel={commitEditLabel}
                            editingTimeId={editingTimeId}
                            editingTimeValue={editingTimeValue}
                            onStartEditTime={startEditTime}
                            onTimeChange={setEditingTimeValue}
                            onCommitTime={commitEditTime}
                            fontSize="text-[34px]"
                            timeFontSize="text-[30px]"
                          />
                        ))}
                      </div>
                    ) : (
                      // Two week layout: side-by-side columns
                      <div className="flex justify-center gap-24 px-8">
                        {/* Week 1 column */}
                        <div className="flex flex-col">
                          <div className="space-y-6">
                            {schedules.slice(0, 7).filter(d => d.visible).map(day => (
                              <CanvasDayRow
                                key={`preview_${day.id}`}
                                day={day}
                                editingLabelId={editingLabelId}
                                editingLabelValue={editingLabelValue}
                                onStartEditLabel={startEditLabel}
                                onLabelChange={setEditingLabelValue}
                                onCommitLabel={commitEditLabel}
                                editingTimeId={editingTimeId}
                                editingTimeValue={editingTimeValue}
                                onStartEditTime={startEditTime}
                                onTimeChange={setEditingTimeValue}
                                onCommitTime={commitEditTime}
                                fontSize="text-[30px]"
                                timeFontSize="text-[26px]"
                              />
                            ))}
                          </div>
                        </div>

                        {/* Week 2 column */}
                        <div className="flex flex-col">
                          <div className="space-y-6">
                            {schedules.slice(7, 14).filter(d => d.visible).map(day => (
                              <CanvasDayRow
                                key={`preview_${day.id}`}
                                day={day}
                                editingLabelId={editingLabelId}
                                editingLabelValue={editingLabelValue}
                                onStartEditLabel={startEditLabel}
                                onLabelChange={setEditingLabelValue}
                                onCommitLabel={commitEditLabel}
                                editingTimeId={editingTimeId}
                                editingTimeValue={editingTimeValue}
                                onStartEditTime={startEditTime}
                                onTimeChange={setEditingTimeValue}
                                onCommitTime={commitEditTime}
                                fontSize="text-[30px]"
                                timeFontSize="text-[26px]"
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer Area */}
                  <div className="relative z-10 w-full mt-auto flex flex-col gap-8 pt-10">
                    {/* Promo Box */}
                    {promoNote && (
                      <div className="w-full px-8 mx-auto">
                        <div className="text-white/90 text-[26px] leading-relaxed font-sans whitespace-pre-wrap text-center drop-shadow-md">
                          {promoNote}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-center items-center w-full gap-6">
                      <span className="px-5 py-2.5 bg-white/5 rounded-full border border-white/10 text-[14px] font-sans font-medium tracking-[0.15em] text-white/80 uppercase flex items-center gap-2">
                        <Globe size={14} /> WWW.SERENARAGA.FIT
                      </span>
                      {waNumber && (
                        <span className="px-5 py-2.5 bg-white/5 rounded-full border border-white/10 text-[14px] font-sans font-medium tracking-[0.15em] text-white/80 uppercase flex items-center gap-2">
                          <WAIco size={14} /> 0{waNumber.startsWith('62') ? waNumber.slice(2) : waNumber}
                        </span>
                      )}
                      {socialText && (
                        <span className="px-5 py-2.5 bg-white/5 rounded-full border border-white/10 text-[14px] font-sans font-medium tracking-[0.15em] text-white/80 uppercase flex items-center gap-2">
                          <InstagramIco size={14} /> {socialText.startsWith('@') ? socialText : `@${socialText}`}
                        </span>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            </div>
            {/* Realtime Scaling handler */}
            <DynamicScaler />
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function DayRow({
  day,
  onToggleVisibility,
  onToggleDay,
}: {
  day: DaySchedule;
  onToggleVisibility: (id: string) => void;
  onToggleDay: (id: string) => void;
}) {
  return (
    <div className={`px-5 py-3.5 flex items-center justify-between transition-all duration-150 ${!day.visible ? 'opacity-35 bg-zinc-50/60 dark:bg-zinc-900/20' : 'hover:bg-zinc-50/80 dark:hover:bg-zinc-800/30'}`}>
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => onToggleVisibility(day.id)}
          className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-400 hover:text-zinc-600 transition-colors shrink-0"
          title={day.visible ? 'Sembunyikan' : 'Tampilkan'}
        >
          {day.visible ? <Eye size={14} /> : <EyeOff size={14} />}
        </button>
        <div className="min-w-0">
          <p className={`text-sm font-semibold truncate ${!day.visible ? 'text-zinc-400' : 'text-zinc-800 dark:text-white'}`}>
            {day.label}
          </p>
          {day.visible && (
            <p className={`text-xs mt-0.5 font-medium tabular-nums ${day.active ? 'text-earth-primary' : 'text-red-500'}`}>
              {day.active ? day.timeText : 'FULL'}
            </p>
          )}
        </div>
      </div>
      <button
        onClick={() => onToggleDay(day.id)}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus:outline-none ${day.active ? 'bg-earth-primary' : 'bg-zinc-300 dark:bg-zinc-600'}`}
        title={day.active ? 'Tandai FULL' : 'Tandai Buka'}
      >
        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ${day.active ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );
}

function CanvasDayRow({
  day,
  editingLabelId,
  editingLabelValue,
  onStartEditLabel,
  onLabelChange,
  onCommitLabel,
  editingTimeId,
  editingTimeValue,
  onStartEditTime,
  onTimeChange,
  onCommitTime,
  fontSize,
  timeFontSize,
}: {
  day: DaySchedule;
  editingLabelId: string | null;
  editingLabelValue: string;
  onStartEditLabel: (day: DaySchedule) => void;
  onLabelChange: (val: string) => void;
  onCommitLabel: () => void;
  editingTimeId: string | null;
  editingTimeValue: string;
  onStartEditTime: (day: DaySchedule) => void;
  onTimeChange: (val: string) => void;
  onCommitTime: () => void;
  fontSize: string;
  timeFontSize: string;
}) {
  const isEditingLabel = editingLabelId === day.id;
  const isEditingTime = editingTimeId === day.id;
  const labelInputRef = useRef<HTMLInputElement>(null);
  const timeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingLabel && labelInputRef.current) {
      labelInputRef.current.focus();
      labelInputRef.current.select();
    }
  }, [isEditingLabel]);

  useEffect(() => {
    if (isEditingTime && timeInputRef.current) {
      timeInputRef.current.focus();
      timeInputRef.current.select();
    }
  }, [isEditingTime]);

  return (
    <div className="flex items-center justify-between w-full gap-4 font-sans">
      {/* Label (tanggal) */}
      <h3 
        className={`${fontSize} font-semibold text-white text-left outline-none hover:ring-2 hover:ring-white/30 focus:ring-2 focus:ring-white/50 rounded px-2 -mx-2 cursor-text transition-all whitespace-nowrap`}
        contentEditable
        suppressContentEditableWarning
        onBlur={(e) => {
          const val = e.currentTarget.textContent || '';
          if (val !== day.label) {
            onStartEditLabel(day);
            onLabelChange(val);
            setTimeout(onCommitLabel, 50);
          }
        }}
      >
        {day.label}
      </h3>

      {/* Time / FULL badge */}
      <div className="flex items-center whitespace-nowrap">
        {!day.active ? (
          <div className="px-5 py-2.5 bg-red-900/60 border border-red-500/30 rounded-full flex items-center gap-2 shadow-sm">
            <span className="text-[26px] font-bold tracking-widest text-red-300">FULL BOOKED</span>
          </div>
        ) : (
          <span 
            className={`${timeFontSize} font-semibold tracking-widest text-white outline-none hover:ring-2 hover:ring-white/30 focus:ring-2 focus:ring-white/50 rounded px-2 -mx-2 cursor-text transition-all`}
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => {
              const val = e.currentTarget.textContent || '';
              if (val !== day.timeText) {
                onStartEditTime(day);
                onTimeChange(val);
                setTimeout(onCommitTime, 50);
              }
            }}
          >
            {day.timeText}
          </span>
        )}
      </div>
    </div>
  );
}

// Helper to rescale preview on window resize so it stays responsive
function DynamicScaler() {
  useEffect(() => {
    const handleResize = () => {
      window.dispatchEvent(new CustomEvent('re-scale-preview'));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return null;
}
