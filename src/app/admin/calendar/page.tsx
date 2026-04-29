'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase';
import { CalendarDays, Loader2, ArrowLeft, ArrowRight, Clock, AlertCircle, Settings, ToggleLeft, ToggleRight, Trash2, X, Check, Plus, Share2 } from 'lucide-react';
import BookingFormModal from '@/components/admin/BookingFormModal';

type ShiftData = {
  therapist_id: string;
  is_working: boolean;
  start_time: string;
  end_time: string;
  break_start_time: string | null;
  break_end_time: string | null;
};

type TimeoffData = {
  id: string;
  therapist_id: string;
  is_full_day: boolean;
  start_time: string | null;
  end_time: string | null;
  reason: string;
  off_date: string;
};

type BookingItem = {
  id: string; // group ID (booking.id_therapist_id)
  therapist_id: string;
  service_name: string;
  booking_date: string;
  booking_time: string;
  status: string;
  customer_name: string;
  duration: number; // calculated total duration
};

export default function CalendarPage() {
  const [loading, setLoading] = useState(true);
  const [therapists, setTherapists] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [timeoffs, setTimeoffs] = useState<any[]>([]);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [defaultBuffer, setDefaultBuffer] = useState(30);

  const [startDateStr, setStartDateStr] = useState('');
  // By default show 7 days to avoid extreme horizontal scroll (can easily click next to see next 7 days)
  // But wait, user requested 14 days. Let's do 14 days!
  const DAYS_TO_SHOW = 14;

  const supabase = createClient();

  // ── Schedule quick-edit modal state ──────────────────────────────────────────
  const [scheduleTherapist, setScheduleTherapist] = useState<any | null>(null);
  const [scheduleTab, setScheduleTab]             = useState<'shift' | 'timeoff'>('shift');
  const [scheduleShifts, setScheduleShifts]       = useState<any[]>([]);
  const [scheduleTimeoffs, setScheduleTimeoffs]   = useState<any[]>([]);
  const [loadingSchedule, setLoadingSchedule]     = useState(false);
  const [savingSchedule, setSavingSchedule]       = useState(false);
  const [newTimeoff, setNewTimeoff]               = useState({ date: '', reason: '', is_full_day: true, start: '', end: '' });

  const DAYS_MAP = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  const openScheduleModal = async (th: any) => {
    setScheduleTherapist(th);
    setScheduleTab('shift');
    setNewTimeoff({ date: '', reason: '', is_full_day: true, start: '', end: '' });
    setLoadingSchedule(true);

    const [{ data: shiftData }, { data: settingData }] = await Promise.all([
      supabase.from('therapist_shifts').select('*').eq('therapist_id', th.id),
      supabase.from('settings').select('value').eq('key', 'operational_hours').single()
    ]);

    // Build default shift hours from operational_hours setting
    let defStart = '09:00:00';
    let defEnd   = '21:00:00';
    if (settingData?.value) {
      const matches = settingData.value.match(/\b(\d{1,2})[.:](\d{2})\b/g);
      if (matches && matches.length >= 2) {
        defStart = matches[0].replace('.', ':') + ':00';
        if (defStart.length === 7) defStart = '0' + defStart;
        defEnd   = matches[matches.length - 1].replace('.', ':') + ':00';
        if (defEnd.length === 7) defEnd = '0' + defEnd;
      }
    }

    const defaultShifts = Array.from({ length: 7 }).map((_, i) => {
      const existing = shiftData?.find((x: any) => x.day_of_week === i);
      return existing || { day_of_week: i, is_working: true, start_time: defStart, end_time: defEnd, break_start_time: '', break_end_time: '' };
    });
    setScheduleShifts(defaultShifts);

    const { data: offData } = await supabase
      .from('therapist_timeoffs')
      .select('*')
      .eq('therapist_id', th.id)
      .order('off_date', { ascending: false })
      .limit(20);
    setScheduleTimeoffs(offData || []);

    setLoadingSchedule(false);
  };

  const saveShifts = async () => {
    if (!scheduleTherapist) return;
    setSavingSchedule(true);
    const payload = scheduleShifts.map(s => ({
      therapist_id:      scheduleTherapist.id,
      day_of_week:       s.day_of_week,
      is_working:        s.is_working,
      start_time:        s.start_time,
      end_time:          s.end_time,
      break_start_time:  s.break_start_time || null,
      break_end_time:    s.break_end_time   || null,
    }));
    await supabase.from('therapist_shifts').upsert(payload, { onConflict: 'therapist_id, day_of_week' });
    setSavingSchedule(false);
    // Refresh the master calendar data too so changes reflect immediately
    fetchSchedule();
    alert('Jadwal shift berhasil disimpan.');
  };

  const addTimeoff = async () => {
    if (!scheduleTherapist || !newTimeoff.date) return;
    // EC#13: validate start < end for partial timeoff
    if (!newTimeoff.is_full_day && newTimeoff.start && newTimeoff.end && newTimeoff.start >= newTimeoff.end) {
      alert('Jam Mulai harus lebih awal dari Jam Selesai.');
      return;
    }
    setSavingSchedule(true);
    await supabase.from('therapist_timeoffs').insert({
      therapist_id: scheduleTherapist.id,
      off_date:     newTimeoff.date,
      reason:       newTimeoff.reason,
      is_full_day:  newTimeoff.is_full_day,
      start_time:   newTimeoff.is_full_day ? null : (newTimeoff.start || null),
      end_time:     newTimeoff.is_full_day ? null : (newTimeoff.end   || null),
    });
    const { data: offData } = await supabase
      .from('therapist_timeoffs').select('*').eq('therapist_id', scheduleTherapist.id)
      .order('off_date', { ascending: false }).limit(20);
    setScheduleTimeoffs(offData || []);
    setNewTimeoff({ date: '', reason: '', is_full_day: true, start: '', end: '' });
    setSavingSchedule(false);
    fetchSchedule();
  };

  const deleteTimeoff = async (id: string, reason: string) => {
    if (!confirm(`Hapus jadwal libur/izin "${reason}"?`)) return;
    setSavingSchedule(true);
    await supabase.from('therapist_timeoffs').delete().eq('id', id);
    setScheduleTimeoffs(prev => prev.filter(x => x.id !== id));
    setSavingSchedule(false);
    fetchSchedule();
  };
  // ─────────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    // init to today
    setStartDateStr(new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }));
  }, []);

  const dates = useMemo(() => {
    if (!startDateStr) return [];
    const arr = [];
    const base = new Date(startDateStr);
    for (let i = 0; i < DAYS_TO_SHOW; i++) {
       const d = new Date(base.getTime() + (i * 86400000));
       arr.push({
         dateObj: d,
         dateStr: d.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }),
         dayOfWeek: d.getDay(),
         display: d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' }),
         isToday: d.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }) === new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })
       });
    }
    return arr;
  }, [startDateStr]);

  const fetchSchedule = async () => {
    if (!startDateStr || dates.length === 0) return;
    setLoading(true);

    const endDateStr = dates[dates.length - 1].dateStr;

    const [
      { data: thData },
      { data: shData },
      { data: offData },
      { data: bData },
      { data: settingData }
    ] = await Promise.all([
      supabase.from('therapists').select('id, name, commission_pct').eq('is_active', true).order('name'),
      supabase.from('therapist_shifts').select('*'), // fetch all shifts
      supabase.from('therapist_timeoffs').select('*').gte('off_date', startDateStr).lte('off_date', endDateStr),
      supabase.from('booking_items').select('id, therapist_id, service_name, duration, bookings!inner(id, booking_date, booking_time, status, customer_name)').gte('bookings.booking_date', startDateStr).lte('bookings.booking_date', endDateStr).neq('bookings.status', 'Canceled'),
      supabase.from('settings').select('value').eq('key', 'default_buffer_time').single()
    ]);

    setTherapists(thData || []);
    setShifts(shData || []);
    setTimeoffs(offData || []);

    const formattedBookings: BookingItem[] = [];
    if (bData) {
      const grouped: Record<string, BookingItem> = {};
      bData.forEach((b: any) => {
        if (!b.therapist_id) return;
        let dur = parseInt(String(b.duration)) || 0;
        
        if (dur === 0) {
           const nameLower = (b.service_name || '').toLowerCase();
           if (nameLower.includes('60') || nameLower.includes('1 jam')) dur = 60;
           else if (nameLower.includes('120') || nameLower.includes('2 jam')) dur = 120;
           else dur = 90;
        }
        if (b.service_name?.toLowerCase().includes('panggilan') && dur === 0) dur = 0; 

        if (dur > 0) {
          const groupId = `${b.bookings?.id || b.id}_${b.therapist_id}`;
          if (!grouped[groupId]) {
            grouped[groupId] = {
              id: groupId,
              therapist_id: b.therapist_id,
              service_name: b.service_name,
              booking_date: b.bookings.booking_date,
              booking_time: b.bookings.booking_time,
              status: b.bookings.status,
              customer_name: b.bookings.customer_name,
              duration: dur
            };
          } else {
            grouped[groupId].duration += dur;
            grouped[groupId].service_name += ` + ${b.service_name}`;
          }
        }
      });
      formattedBookings.push(...Object.values(grouped));
    }
    setBookings(formattedBookings);

    if (settingData?.value) setDefaultBuffer(Number(settingData.value) || 30);
    setLoading(false);
  };

  useEffect(() => {
    fetchSchedule();
  }, [dates]);

  // Dimension scaling: Fluid percentage-based width to fill wide screens gracefully
  const START_HOUR = 8;
  const END_HOUR = 23;
  const TOTAL_HOURS = END_HOUR - START_HOUR;
  const TOTAL_MINUTES = TOTAL_HOURS * 60;
  // Fallback for default buffer in percentages
  const defaultBufferPct = (defaultBuffer / TOTAL_MINUTES) * 100;

  const timeToPct = (timeStr: string) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    if (h < START_HOUR) return 0;
    if (h >= END_HOUR) return 100;
    return (((h - START_HOUR) * 60 + m) / TOTAL_MINUTES) * 100;
  };

  const navDays = (dir: number) => {
     const d = new Date(startDateStr);
     d.setDate(d.getDate() + dir);
     setStartDateStr(d.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta'}));
  };

  // ── Quick-Add Booking: use shared BookingFormModal ──────────────────────────
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [services,  setServices]  = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

  const openBookingForm = async () => {
    setShowBookingModal(true);
    if (services.length === 0) {
      const [{ data: svcData }, { data: custData }] = await Promise.all([
        // Match exactly the same query as bookings/page.tsx - no is_active filter, same field set & ordering
        supabase.from('services').select('id, name, price, category, is_bundle, bundle_child_ids, estimated_duration').order('category').order('sort_order'),
        supabase.from('customers').select('id, name, wa_number').order('name'),
      ]);
      setServices(svcData || []);
      setCustomers(custData || []);
    }
  };
  // ─────────────────────────────────────────────────────────────────────────────


  return (
    <div className="space-y-4 max-w-[100vw]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 max-w-7xl mx-auto">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
            <CalendarDays className="text-earth-primary" /> Master Schedule Kanban
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">Visibilitas ketersediaan slot dalam 14 hari</p>
        </div>
        
        <div className="flex items-center gap-2">
          {loading && <Loader2 size={16} className="animate-spin text-zinc-400" />}

          {/* Share Jadwal */}
          <a
            href="/admin/schedule"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:border-earth-primary/40 hover:text-earth-primary transition-colors"
          >
            <Share2 size={14} /> Share Jadwal
          </a>

          {/* Tambah Booking */}
          <button
            onClick={openBookingForm}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-earth-primary hover:bg-earth-primary/90 text-white text-xs font-semibold transition-colors shadow-sm"
          >
            <Plus size={14} /> Tambah Booking
          </button>

          {/* Date Navigator */}
          <div className="flex items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-1">
             <button onClick={() => navDays(-7)} className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-zinc-500" title="-7 Hari">
                <ArrowLeft size={16} />
             </button>
             <button onClick={() => setStartDateStr(new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Jakarta'}))}
                     className="px-3 py-1.5 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded">
                Hari Ini
             </button>
             <button onClick={() => navDays(7)} className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-zinc-500" title="+7 Hari">
                <ArrowRight size={16} />
             </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-5 px-1 text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 max-w-7xl mx-auto mb-2">
         <span className="flex items-center gap-2">
            <span className="w-4 h-4 rounded bg-[repeating-linear-gradient(45deg,transparent,transparent_2px,rgba(0,0,0,0.03)_2px,rgba(0,0,0,0.03)_4px)] bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"></span> Di Luar Jam Shift
         </span>
         <span className="flex items-center gap-2">
            <span className="w-4 h-4 rounded bg-red-50/50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"></span> Libur / Izin
         </span>
         <span className="flex items-center gap-2">
            <span className="w-4 h-4 rounded border-2 border-dashed border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800"></span> Break
         </span>
         <span className="flex items-center gap-2">
            <span className="w-4 h-4 rounded shadow-sm bg-gradient-to-r from-violet-500 to-fuchsia-500"></span> Booking Terjadwal
         </span>
         <span className="flex items-center gap-2">
            <span className="w-4 h-4 rounded border border-amber-200 bg-amber-300 border-opacity-50 opacity-90 shadow-sm"></span> Transport OTW
         </span>
      </div>

      {/* Kanban List */}
      <div className="w-full h-[calc(100vh-220px)] overflow-y-auto custom-scrollbar bg-zinc-50/50 dark:bg-zinc-950/20 border-t border-b border-zinc-200 dark:border-zinc-800 flex flex-col gap-10 p-4 sm:p-8 shadow-inner">
         
         {dates.map((dayObj) => (
            <div key={dayObj.dateStr} className="flex flex-col bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none pb-4 overflow-x-auto overflow-y-hidden shrink-0 transition-shadow">
               
               {/* Date Header Sticky */}
               <div className="sticky left-0 bg-white/95 dark:bg-zinc-950/95 backdrop-blur z-40 flex items-center px-5 py-4 border-b border-zinc-100 dark:border-zinc-900 min-w-max">
                  <h2 className="text-base font-bold flex items-center gap-2.5 text-zinc-800 dark:text-zinc-100 tracking-tight">
                     {dayObj.isToday ? (
                       <span className="flex items-center justify-center w-6 h-6 rounded-full bg-earth-primary/10">
                         <span className="w-2.5 h-2.5 rounded-full bg-earth-primary animate-pulse"></span>
                       </span>
                     ) : (
                       <span className="flex items-center justify-center w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-900">
                         <CalendarDays size={12} className="text-zinc-400" />
                       </span>
                     )}
                     {dayObj.display}
                  </h2>
               </div>

               {/* Board Wrapper for this day */}
               <div className="flex min-w-max relative px-2 sm:px-4 mt-2">
                  
                  {/* Sticky Left Sidebar: Therapists */}
                  <div className="sticky left-0 z-30 w-32 sm:w-44 bg-white dark:bg-zinc-950 flex flex-col border-r border-zinc-200 dark:border-zinc-800 pt-[32px] shadow-[4px_0_12px_rgba(0,0,0,0.02)]">
                     {therapists.map(th => {
                        // Initials for avatar
                        const initials = th.name.split(' ').map((n:string)=>n[0]).join('').substring(0,2).toUpperCase();
                        return (
                          <div key={th.id} className="h-16 flex items-center px-3 border-b border-zinc-100 dark:border-zinc-900/50 bg-white dark:bg-zinc-950">
                             <button
                               onClick={() => openScheduleModal(th)}
                               className="flex items-center gap-2.5 group/thbtn w-full min-w-0 text-left hover:opacity-80 transition-opacity"
                               title={`Atur jadwal ${th.name}`}
                             >
                                <div className="hidden sm:flex flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 items-center justify-center text-[9px] font-bold group-hover/thbtn:border-earth-primary/40 group-hover/thbtn:from-earth-primary/10 group-hover/thbtn:to-earth-primary/5 transition-all">
                                   {initials}
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <p className="text-[11px] sm:text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate group-hover/thbtn:text-earth-primary transition-colors">{th.name}</p>
                                  <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-medium flex items-center gap-0.5 group-hover/thbtn:text-earth-primary/60 transition-colors">
                                    <Settings size={8} className="shrink-0" /> Atur Jadwal
                                  </span>
                                </div>
                             </button>
                          </div>
                        );
                     })}
                  </div>

                  {/* Timeline Horizontal Area */}
                  <div className="flex flex-col w-full min-w-[800px] pl-6 pr-8 py-2">
                     <div className="flex flex-col relative w-full">   
                        {/* Hours Header */}
                        <div className="h-10 flex relative text-[11px] font-bold text-zinc-600 dark:text-zinc-300 bg-white dark:bg-zinc-950 z-20">
                           {Array.from({ length: TOTAL_HOURS + 1 }).map((_, h) => {
                              const pct = (h / TOTAL_HOURS) * 100;
                              return (
                                <div key={h} className="absolute h-full flex flex-col items-center justify-end pb-1" style={{ left: `${pct}%`, transform: 'translateX(-50%)' }}>
                                   <span className={`bg-zinc-100/80 dark:bg-zinc-800/80 px-2 py-0.5 rounded shadow-sm border border-zinc-200/60 dark:border-zinc-700/60 mb-0.5 ${h === 0 || h === TOTAL_HOURS ? 'bg-earth-primary/10 text-earth-primary border-earth-primary/20' : ''}`}>
                                      {String(START_HOUR + h).padStart(2,'0')}:00
                                   </span>
                                   <div className="w-px h-1.5 bg-zinc-300 dark:bg-zinc-700"></div>
                                </div>
                              );
                           })}
                        </div>

                     {/* Rows */}
                     <div className="flex flex-col relative w-full border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-[0_0_12px_rgba(0,0,0,0.015)]">
                        {/* Vertical Striped Guidelines for clear empty slots without rigidity */}
                        <div className="absolute inset-y-0 left-0 right-0 pointer-events-none z-0 flex rounded-lg overflow-hidden">
                           {Array.from({ length: TOTAL_HOURS }).map((_, h) => (
                              <div key={h} className={`h-full border-l border-zinc-200/40 dark:border-zinc-800/60 ${h % 2 !== 0 ? 'bg-zinc-50/80 dark:bg-zinc-900/30' : 'bg-transparent'}`} style={{ width: `${100 / TOTAL_HOURS}%` }}></div>
                           ))}
                        </div>

                        {therapists.map((th, thIdx) => {
                           const tShift = shifts.find(s => s.therapist_id === th.id && s.day_of_week === dayObj.dayOfWeek);
                           const tOff = timeoffs.find(o => o.therapist_id === th.id && o.off_date === dayObj.dateStr);
                           const tBks = bookings.filter(b => b.therapist_id === th.id && b.booking_date === dayObj.dateStr);

                           // If this is the last therapist, we show the tooltip pointing UP instead of DOWN
                           const isLastRow = thIdx === therapists.length - 1;

                           let isClosed = false;
                           let statusLabel = '';

                           if (tOff?.is_full_day) { isClosed = true; statusLabel = tOff.reason || 'LIBUR'; }
                           else if (tShift && !tShift.is_working) { isClosed = true; statusLabel = 'LIBUR REGULER'; }
                           else if (!tShift) { isClosed = true; statusLabel = 'BELUM DISET TERAPIS'; }

                           return (
                              <div key={th.id} className="h-16 relative border-b border-zinc-100 dark:border-zinc-900/50 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/40 transition-colors z-10 hover:z-50 w-full group/row">
                                 {isClosed ? (
                                    <div className="absolute inset-y-2 mx-2 rounded-xl bg-red-50/80 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 flex items-center justify-center overflow-hidden z-10" style={{ left:0, right:0 }}>
                                      <div className="flex items-center gap-2 opacity-60">
                                         <AlertCircle size={14} className="text-red-500" />
                                         <span className="text-[11px] font-bold text-red-500 uppercase tracking-widest">{statusLabel}</span>
                                      </div>
                                    </div>
                                 ) : (
                                     <>
                                       {/* Outside Shift Mask */}
                                       {tShift && (
                                         <>
                                            <div className="absolute inset-y-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(0,0,0,0.03)_4px,rgba(0,0,0,0.03)_8px)] bg-zinc-100/50 dark:bg-zinc-900/80 z-0 border-r border-zinc-200/80 dark:border-zinc-800" style={{ left:0, width: `${timeToPct(tShift.start_time)}%` }}></div>
                                            {/* Right Mask: Shift visually by +60 mins because end_time is the 'Last Order' start time limit */}
                                            <div className="absolute inset-y-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(0,0,0,0.03)_4px,rgba(0,0,0,0.03)_8px)] bg-zinc-100/50 dark:bg-zinc-900/80 z-0 border-l border-zinc-200/80 dark:border-zinc-800" style={{ left: `${Math.min(100, timeToPct(tShift.end_time) + (60 / TOTAL_MINUTES * 100))}%`, right: 0 }}></div>
                                         </>
                                       )}

                                       {/* Break Time */}
                                       {tShift?.break_start_time && tShift?.break_end_time && (
                                          <div className="absolute inset-y-2.5 rounded-lg border-2 border-dashed border-zinc-300/80 dark:border-zinc-600 bg-zinc-50/80 dark:bg-zinc-800/80 backdrop-blur-[1px] z-10 overflow-hidden group-hover/row:shadow-sm" 
                                               style={{ 
                                                 left: `${timeToPct(tShift.break_start_time)}%`, 
                                                 width: `${timeToPct(tShift.break_end_time) - timeToPct(tShift.break_start_time)}%`
                                               }}>
                                                 <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-zinc-500 dark:text-zinc-400 tracking-widest bg-white/40 dark:bg-zinc-800/40">BREAK</span>
                                          </div>
                                       )}

                                       {/* Partial Day Off */}
                                       {tOff && !tOff.is_full_day && tOff.start_time && tOff.end_time && (
                                          <div className="absolute inset-y-2.5 rounded-lg bg-red-50 dark:bg-red-900/20 border-2 border-dashed border-red-200 dark:border-red-800 z-10 flex items-center justify-center overflow-hidden" 
                                               style={{ left: `${timeToPct(tOff.start_time)}%`, width: `${Math.max(1, timeToPct(tOff.end_time) - timeToPct(tOff.start_time))}%` }}>
                                                 <span className="text-[10px] font-bold text-red-500 truncate px-2">{tOff.reason}</span>
                                          </div>
                                       )}

                                       {/* Bookings */}
                                       {tBks.map(bk => {
                                          const bPct = timeToPct(bk.booking_time);
                                          const bwPct = (bk.duration / TOTAL_MINUTES) * 100;
                                          const bBufPct = defaultBufferPct;
                                          
                                          return (
                                             <div key={bk.id} className="absolute inset-y-1.5 flex z-20 group/tooltip hover:z-[99] cursor-pointer" 
                                                  style={{ left: `${bPct}%`, width: `${bwPct + bBufPct}%` }}>
                                                {/* Tooltip Hover explicitly drops down or up depending on row position to prevent clipping ceiling/floor */}
                                                <div className={`hidden group-hover/tooltip:block absolute left-0 w-64 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 p-4 rounded-xl border border-zinc-100 dark:border-zinc-700 text-xs z-[100] pointer-events-none ${isLastRow ? 'bottom-full mb-2.5 shadow-[0_-12px_40px_rgba(0,0,0,0.15)]' : 'top-full mt-2.5 shadow-[0_12px_40px_rgba(0,0,0,0.15)]'}`}>
                                                   <p className="font-bold text-[13px] tracking-tight text-zinc-900 dark:text-white mb-1.5">{bk.customer_name}</p>
                                                   <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 mb-2">
                                                      <Clock size={12} className="text-earth-primary" /> 
                                                      <span className="font-medium">{bk.booking_time}</span>
                                                      <span className="text-zinc-300">•</span>
                                                      <span className="font-mono text-[11px] bg-zinc-100 dark:bg-zinc-700 px-1.5 py-0.5 rounded">Dur: {bk.duration}m</span>
                                                   </div>
                                                   <p className="text-zinc-600 dark:text-zinc-300 leading-snug">{bk.service_name}</p>
                                                   <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-700/80 flex items-center gap-2">
                                                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm border border-white"></span>
                                                      <span className="text-zinc-500 dark:text-zinc-400 text-[11px]">+ {defaultBuffer}m Buffer OTW</span>
                                                   </div>
                                                </div>

                                                {/* Service Block, Vibrant Gradient directly inspired by Modern SaaS */}
                                                <div className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-400 hover:to-fuchsia-400 transition-all rounded-l-xl shadow-md border border-fuchsia-400/30 flex flex-col justify-center px-3 relative overflow-hidden group-hover/tooltip:shadow-lg" 
                                                     style={{ width: `${(bwPct / (bwPct + bBufPct)) * 100}%` }}>
                                                   {/* Inner highlight for glass effect */}
                                                   <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none"></div>
                                                   
                                                   <span className="text-[11px] font-bold text-white drop-shadow-sm flex items-center gap-1.5 relative z-10 w-full truncate">
                                                      <span className="opacity-90">{bk.booking_time}</span> 
                                                      <span className="truncate">{bk.customer_name}</span>
                                                   </span>
                                                   <span className="text-[9px] text-white/80 truncate block mt-0.5 relative z-10">{bk.service_name}</span>
                                                </div>

                                                {/* Buffer Block */}
                                                <div className="h-full bg-amber-300/90 hover:bg-amber-300 border border-amber-200 rounded-r-xl flex items-center justify-center shadow-sm relative group-hover/tooltip:shadow-lg" 
                                                     style={{ width: `${(bBufPct / (bwPct + bBufPct)) * 100}%` }}>
                                                   <span className="text-[9px] font-bold text-amber-700/60 uppercase tracking-widest hidden sm:block">buf</span>
                                                </div>
                                             </div>
                                          );
                                       })}
                                    </>
                                 )}
                              </div>
                           );
                        })}
                     </div>
                   </div>
                  </div>
               </div>
            </div>
         ))}
      </div>

      {/* ── Quick-Add Booking Modal (shared full-feature form) ── */}
      <BookingFormModal
        open={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        onSaved={() => { fetchSchedule(); }}
        defaultDate={startDateStr}
        therapists={therapists}
        services={services}
        customers={customers}
        isOwner={true}
      />


      {/* ── Therapist Schedule Quick-Edit Modal ───────────────────────────────── */}
      {scheduleTherapist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 max-h-[92vh] flex flex-col overflow-hidden">

            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
              <div>
                <h3 className="font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                  <CalendarDays size={18} className="text-purple-500" /> Atur Jadwal &amp; Shift
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">Terapis: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{scheduleTherapist.name}</span></p>
              </div>
              <button onClick={() => setScheduleTherapist(null)} className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400">
                <X size={18} />
              </button>
            </div>

            {/* Sub-Tabs */}
            <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-xl p-1 mx-6 mt-4 mb-2 shrink-0">
              <button onClick={() => setScheduleTab('shift')}   className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${scheduleTab === 'shift'   ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700'}`}>Shift Reguler</button>
              <button onClick={() => setScheduleTab('timeoff')} className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${scheduleTab === 'timeoff' ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700'}`}>Pengecualian / Libur</button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto px-6 pb-6 pt-2">
              {loadingSchedule ? (
                <div className="flex justify-center p-16"><Loader2 size={28} className="animate-spin text-zinc-400" /></div>
              ) : scheduleTab === 'shift' ? (
                // ── Shift Tab ──
                <div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 p-3 rounded-xl text-xs mb-4 flex items-start gap-2">
                    <Clock size={14} className="mt-0.5 shrink-0" />
                    <p>Atur rentang jam kerja mingguan. "Jam Break" opsional — jika diisi, booking tidak bisa masuk di jam tersebut.</p>
                  </div>
                  <div className="space-y-2">
                    {scheduleShifts.map((s, idx) => (
                      <div key={idx} className={`flex flex-wrap items-center gap-3 py-2.5 px-3 rounded-xl border transition-colors ${
                        s.is_working ? 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900' : 'border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 opacity-70'
                      }`}>
                        <div className="w-20 font-semibold text-sm text-zinc-700 dark:text-zinc-300 shrink-0">{DAYS_MAP[s.day_of_week]}</div>

                        {s.is_working ? (
                          <div className="flex flex-wrap items-center gap-2 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-medium text-zinc-400">Kerja:</span>
                              <input type="time" className="admin-input h-8 px-2 text-xs w-[100px]" value={s.start_time?.slice(0,5) || ''} onChange={e => setScheduleShifts(prev => prev.map((x,i) => i===idx ? {...x, start_time: e.target.value+':00'} : x))} />
                              <span className="text-zinc-400">-</span>
                              <input type="time" className="admin-input h-8 px-2 text-xs w-[100px]" value={s.end_time?.slice(0,5) || ''} onChange={e => setScheduleShifts(prev => prev.map((x,i) => i===idx ? {...x, end_time: e.target.value+':00'} : x))} />
                            </div>
                            <div className="hidden sm:flex items-center gap-1.5">
                              <span className="text-xs font-medium text-zinc-400">Break:</span>
                              <input type="time" className="admin-input h-8 px-2 text-xs w-[100px]" value={s.break_start_time?.slice(0,5) || ''} onChange={e => setScheduleShifts(prev => prev.map((x,i) => i===idx ? {...x, break_start_time: e.target.value ? e.target.value+':00' : ''} : x))} />
                              <span className="text-zinc-400">-</span>
                              <input type="time" className="admin-input h-8 px-2 text-xs w-[100px]" value={s.break_end_time?.slice(0,5) || ''} onChange={e => setScheduleShifts(prev => prev.map((x,i) => i===idx ? {...x, break_end_time: e.target.value ? e.target.value+':00' : ''} : x))} />
                            </div>
                          </div>
                        ) : (
                          <div className="flex-1 text-sm text-zinc-400 italic">Libur Default (Tutup)</div>
                        )}

                        <button onClick={() => setScheduleShifts(prev => prev.map((x,i) => i===idx ? {...x, is_working: !x.is_working} : x))} className="p-1 rounded text-zinc-400 hover:text-zinc-600 transition-colors shrink-0 ml-auto">
                          {s.is_working ? <ToggleRight size={24} className="text-purple-500" /> : <ToggleLeft size={24} />}
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 flex justify-end pt-4 border-t border-zinc-100 dark:border-zinc-800">
                    <button onClick={saveShifts} disabled={savingSchedule} className="admin-btn-primary flex items-center gap-2">
                      {savingSchedule ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Simpan Perubahan Shift
                    </button>
                  </div>
                </div>
              ) : (
                // ── Time-off Tab ──
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Add form */}
                  <div>
                    <h4 className="font-semibold text-zinc-900 dark:text-white mb-3">Tambah Libur / Pengecualian</h4>
                    <div className="space-y-3 bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-100 dark:border-zinc-700">
                      <div>
                        <label className="text-xs font-semibold text-zinc-500 mb-1 block">Tanggal</label>
                        <input type="date" className="admin-input" value={newTimeoff.date} onChange={e => setNewTimeoff({...newTimeoff, date: e.target.value})} />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-zinc-500 mb-1 block">Alasan</label>
                        <input type="text" className="admin-input" placeholder="Cth: Sakit, Pulang kampung..." value={newTimeoff.reason} onChange={e => setNewTimeoff({...newTimeoff, reason: e.target.value})} />
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" checked={newTimeoff.is_full_day} onChange={e => setNewTimeoff({...newTimeoff, is_full_day: e.target.checked})} className="rounded border-zinc-300 text-purple-600 focus:ring-purple-500" />
                        <span className="text-sm">Libur Penuh (Seharian)</span>
                      </div>
                      {!newTimeoff.is_full_day && (
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <label className="text-xs font-semibold text-zinc-500 mb-1 block">Mulai</label>
                            <input type="time" className="admin-input" value={newTimeoff.start} onChange={e => setNewTimeoff({...newTimeoff, start: e.target.value})} />
                          </div>
                          <div className="flex-1">
                            <label className="text-xs font-semibold text-zinc-500 mb-1 block">Sampai</label>
                            <input type="time" className="admin-input" value={newTimeoff.end} onChange={e => setNewTimeoff({...newTimeoff, end: e.target.value})} />
                          </div>
                        </div>
                      )}
                      <button onClick={addTimeoff} disabled={savingSchedule || !newTimeoff.date} className="w-full admin-btn-primary py-2 justify-center mt-1">
                        {savingSchedule ? <Loader2 size={14} className="animate-spin" /> : '+ Tambah Tanggal Merah'}
                      </button>
                    </div>
                  </div>

                  {/* History */}
                  <div>
                    <h4 className="font-semibold text-zinc-900 dark:text-white mb-3">Riwayat Libur</h4>
                    {scheduleTimeoffs.length === 0 ? (
                      <p className="text-sm text-zinc-400">Belum ada data libur ekstensi.</p>
                    ) : (
                      <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                        {scheduleTimeoffs.map(off => (
                          <div key={off.id} className="flex items-center justify-between p-3 rounded-xl border border-red-100 bg-red-50/60 dark:border-red-900/30 dark:bg-red-900/10">
                            <div>
                              <p className="font-semibold text-sm text-zinc-900 dark:text-red-300">{new Date(off.off_date + 'T00:00:00').toLocaleDateString('id-ID', { weekday:'short', day:'numeric', month:'short', year:'numeric' })}</p>
                              <p className="text-xs text-zinc-500">{off.is_full_day ? 'Seharian Penuh' : `${off.start_time?.slice(0,5)} - ${off.end_time?.slice(0,5)}`} · {off.reason || 'Libur'}</p>
                            </div>
                            <button onClick={() => deleteTimeoff(off.id, off.reason || off.off_date)} className="p-1.5 hover:bg-red-100 text-red-500 rounded-lg transition-colors">
                              <Trash2 size={14} />
                            </button>
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
