'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { Clock, CalendarDays, Loader2, User, Car } from 'lucide-react';

type TrackerProps = {
  date: string; // YYYY-MM-DD
};

type ShiftData = {
  therapist_id: string;
  is_working: boolean;
  start_time: string;
  end_time: string;
  break_start_time: string | null;
  break_end_time: string | null;
};

type TimeoffData = {
  therapist_id: string;
  is_full_day: boolean;
  start_time: string | null;
  end_time: string | null;
  reason: string;
};

type BookingItem = {
  id: string;
  therapist_id: string;
  service_name: string;
  booking_time: string; // From parent booking
  status: string; // From parent booking
  duration: number; // Estimated duration in minutes
  customer_name: string;
};

export function TherapistTracker({ date }: TrackerProps) {
  const [loading, setLoading] = useState(true);
  const [therapists, setTherapists] = useState<any[]>([]);
  const [shifts, setShifts] = useState<Record<string, ShiftData>>({});
  const [timeoffs, setTimeoffs] = useState<Record<string, TimeoffData>>({});
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [defaultBuffer, setDefaultBuffer] = useState(30);

  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, [date]);

  const fetchData = async () => {
    setLoading(true);
    // FIX BUG 6: compute dayOfWeek inside fetchData to always use the current `date`
    // prop value — avoids stale closures when the date prop changes after initial render.
    // Parse as local midnight (y, mo, d) to avoid UTC-vs-local timezone drift on getDay().
    const [y, mo, d] = date.split('-').map(Number);
    const dayOfWeek = new Date(y, mo - 1, d).getDay();

    const [
      { data: thData },
      { data: shData },
      { data: offData },
      { data: bData },
      { data: settingData }
    ] = await Promise.all([
      supabase.from('therapists').select('id, name').eq('is_active', true).order('name'),
      supabase.from('therapist_shifts').select('*').eq('day_of_week', dayOfWeek),
      supabase.from('therapist_timeoffs').select('*').eq('off_date', date),
      supabase.from('booking_items').select('id, therapist_id, service_name, duration, bookings!inner(id, booking_time, status, customer_name)').eq('bookings.booking_date', date).neq('bookings.status', 'Canceled'),
      supabase.from('settings').select('value').eq('key', 'default_buffer_time').single()
    ]);

    setTherapists(thData || []);
    
    const sMap: Record<string, ShiftData> = {};
    if (shData) shData.forEach(s => sMap[s.therapist_id] = s);
    setShifts(sMap);

    const oMap: Record<string, TimeoffData> = {};
    if (offData) offData.forEach(o => oMap[o.therapist_id] = o);
    setTimeoffs(oMap);

    const formattedBookings: BookingItem[] = [];
    if (bData) {
      const grouped: Record<string, BookingItem> = {};

      bData.forEach((b: any) => {
        if (!b.therapist_id) return;
        // Parse actual duration from booking_items (DB string e.g. "90", "90m", or number)
        let dur = parseInt(String(b.duration)) || 0;
        
        // Fallbacks for older data if duration was missing
        if (dur === 0) {
           const nameLower = (b.service_name || '').toLowerCase();
           if (nameLower.includes('60') || nameLower.includes('1 jam')) dur = 60;
           else if (nameLower.includes('120') || nameLower.includes('2 jam')) dur = 120;
           else dur = 90;
        }
        
        // Skip purely transport blocks which theoretically have 0 duration if set explicitly
        if (b.service_name?.toLowerCase().includes('panggilan') && dur === 0) dur = 0; 

        if (dur > 0) {
          const groupId = `${b.bookings?.id || b.id}_${b.therapist_id}`;
          if (!grouped[groupId]) {
            grouped[groupId] = {
              id: groupId,
              therapist_id: b.therapist_id,
              service_name: b.service_name,
              booking_time: b.bookings.booking_time,
              status: b.bookings.status,
              customer_name: b.bookings.customer_name,
              duration: dur
            };
          } else {
            // Aggregate duration and name for multi-service in one booking
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

  // Timeline Setup (08:00 to 23:00)
  const START_HOUR = 8;
  const END_HOUR = 23;
  const TOTAL_HOURS = END_HOUR - START_HOUR;
  const HOUR_WIDTH_PCT = 100 / TOTAL_HOURS;

  const timeToPos = (timeStr: string) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    if (h < START_HOUR) return 0;
    if (h > END_HOUR) return 100;
    const val = ((h - START_HOUR) + (m / 60)) * HOUR_WIDTH_PCT;
    return Math.max(0, Math.min(100, val));
  };

  const getDurationPct = (durationMins: number) => {
    return (durationMins / 60) * HOUR_WIDTH_PCT;
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 size={24} className="animate-spin text-zinc-400" /></div>;
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
            <Clock size={16} className="text-earth-primary" /> Tracker Jadwal & Buffer
          </h3>
          <p className="text-xs text-zinc-500 mt-1">Perkiraan waktu layanan + buffer perjalanan per Terapis.</p>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-medium">
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-zinc-100 dark:bg-zinc-800"></span> Tutup</div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-purple-500"></span> Pijat</div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-yellow-400 opacity-70"></span> Buffer (OTW)</div>
        </div>
      </div>

      <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950/50 overflow-x-auto overflow-y-hidden pb-12">
        <div className="min-w-[800px]">
          {/* Timeline Header */}
          <div className="flex border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
            <div className="w-40 shrink-0 p-3 text-xs font-semibold text-zinc-500 border-r border-zinc-200 dark:border-zinc-800">
              {new Date(date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}
            </div>
            <div className="flex-1 relative h-10 flex">
              {Array.from({ length: TOTAL_HOURS + 1 }).map((_, i) => (
                <div key={i} className="absolute top-0 bottom-0 border-l border-zinc-200/50 dark:border-zinc-800/50" style={{ left: `${(i / TOTAL_HOURS) * 100}%` }}>
                  <span className="absolute -left-3.5 top-3 text-[10px] font-medium text-zinc-400 bg-zinc-50 dark:bg-zinc-900 px-1">
                    {String(START_HOUR + i).padStart(2, '0')}:00
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Therapist Rows */}
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
            {therapists.map(th => {
              const shift = shifts[th.id];
              const off = timeoffs[th.id];
              const thBookings = bookings.filter(b => b.therapist_id === th.id);

              let statusText = 'Aktif';
              let isClosed = false;

              if (off?.is_full_day) {
                statusText = 'Libur: ' + (off.reason || 'Cuti');
                isClosed = true;
              } else if (shift && !shift.is_working) {
                statusText = 'Libur Reguler';
                isClosed = true;
              } else if (!shift) {
                statusText = 'Belum Diset';
              }

              return (
                <div key={th.id} className="flex relative hover:bg-zinc-50/50 dark:hover:bg-zinc-900/40 transition-colors group/row z-10 hover:z-50">
                  {/* Pinned Label */}
                  <div className="w-40 shrink-0 p-3 bg-white dark:bg-zinc-950/50 border-r border-zinc-200 dark:border-zinc-800 flex items-center gap-3 sticky left-0 z-40 shadow-[4px_0_12px_rgba(0,0,0,0.02)]">
                    <div className="hidden sm:flex flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 items-center justify-center text-[10px] font-bold">
                       {th.name.split(' ').map((n:string)=>n[0]).join('').substring(0,2).toUpperCase()}
                    </div>
                    <div className="flex flex-col justify-center">
                      <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">{th.name}</p>
                      <p className={`text-[9px] mt-0.5 font-bold tracking-wider ${isClosed ? 'text-red-500' : 'text-emerald-500'}`}>{statusText}</p>
                    </div>
                  </div>

                  {/* Gantt Area */}
                  <div className="flex-1 relative h-16 sm:h-20">
                    {/* Hour Vertical Guidelines */}
                    {Array.from({ length: TOTAL_HOURS }).map((_, i) => (
                      <div key={i} className="absolute top-0 bottom-0 border-l border-zinc-100 dark:border-zinc-800/30" style={{ left: `${(i / TOTAL_HOURS) * 100}%` }} />
                    ))}

                    {/* Rendering Blocks */}
                    {isClosed ? (
                      <div className="absolute inset-0 bg-red-50/30 dark:bg-red-900/10 flex items-center justify-center">
                        <span className="text-xs font-medium text-red-400 opacity-60 uppercase tracking-widest">{off?.reason || 'LIBUR'}</span>
                      </div>
                    ) : (
                      <>
                        {/* Outside working hours mask */}
                        {shift && (
                          <>
                            {/* Mask before start */}
                            <div className="absolute inset-y-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(0,0,0,0.03)_4px,rgba(0,0,0,0.03)_8px)] bg-zinc-100/50 dark:bg-zinc-900/80 z-0 border-r border-zinc-200/80 dark:border-zinc-800" 
                                 style={{ left: 0, width: `${timeToPos(shift.start_time)}%` }} />
                            {/* Mask after end (+ 1 Hour shift) */}
                            <div className="absolute inset-y-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(0,0,0,0.03)_4px,rgba(0,0,0,0.03)_8px)] bg-zinc-100/50 dark:bg-zinc-900/80 z-0 border-l border-zinc-200/80 dark:border-zinc-800" 
                                 style={{ left: `${Math.min(100, timeToPos(shift.end_time) + HOUR_WIDTH_PCT)}%`, right: 0 }} />
                            
                            {/* Break Time */}
                            {shift.break_start_time && shift.break_end_time && (
                              <div className="absolute inset-y-2.5 rounded-lg border-2 border-dashed border-zinc-300/80 dark:border-zinc-600 bg-zinc-50/80 dark:bg-zinc-800/80 backdrop-blur-[1px] z-10 overflow-hidden group-hover/row:shadow-sm" 
                                  style={{ 
                                    left: `${timeToPos(shift.break_start_time)}%`, 
                                    width: `${timeToPos(shift.break_end_time) - timeToPos(shift.break_start_time)}%`
                                  }}>
                                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-zinc-500 dark:text-zinc-400 tracking-widest bg-white/40 dark:bg-zinc-800/40">BREAK</span>
                              </div>
                            )}
                          </>
                        )}

                        {/* Partial day off */}
                        {off && !off.is_full_day && off.start_time && off.end_time && (
                          <div className="absolute inset-y-2.5 rounded-lg bg-red-50 dark:bg-red-900/20 border-2 border-dashed border-red-200 dark:border-red-800 z-10 flex items-center justify-center overflow-hidden" 
                               style={{ left: `${timeToPos(off.start_time)}%`, width: `${Math.max(1, timeToPos(off.end_time) - timeToPos(off.start_time))}%` }}>
                                 <span className="text-[10px] font-bold text-red-500 truncate px-2">{off.reason}</span>
                          </div>
                        )}

                        {/* Booking Blocks */}
                        {thBookings.map(b => {
                          const startPct = timeToPos(b.booking_time);
                          const durPct = getDurationPct(b.duration);
                          const bufferPct = getDurationPct(defaultBuffer);
                          return (
                            <div key={b.id} className="absolute inset-y-2.5 flex z-20 group/tooltip hover:z-[99] cursor-pointer shadow-sm hover:shadow-md transition-shadow" 
                                 style={{ left: `${startPct}%`, width: `${durPct + bufferPct}%` }}>
                                
                                {/* Info Tooltip */}
                                <div className="hidden group-hover/tooltip:block absolute top-full left-0 mt-3 w-64 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 p-4 rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.15)] border border-zinc-100 dark:border-zinc-700 text-xs z-[100] pointer-events-none">
                                   <p className="font-bold text-[13px] tracking-tight text-zinc-900 dark:text-white mb-1.5">{b.customer_name}</p>
                                   <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 mb-2">
                                      <Clock size={12} className="text-earth-primary" /> 
                                      <span className="font-medium">{b.booking_time}</span>
                                      <span className="text-zinc-300">•</span>
                                      <span className="font-mono text-[11px] bg-zinc-100 dark:bg-zinc-700 px-1.5 py-0.5 rounded">Dur: {b.duration}m</span>
                                   </div>
                                   <p className="text-zinc-600 dark:text-zinc-300 leading-snug">{b.service_name}</p>
                                   <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-700/80 flex items-center gap-2">
                                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm border border-white"></span>
                                      <span className="text-zinc-500 dark:text-zinc-400 text-[11px]">+ {defaultBuffer}m Buffer OTW</span>
                                   </div>
                                </div>

                                {/* Main Massage Block */}
                                <div className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-400 hover:to-fuchsia-400 transition-all rounded-l-xl shadow-md border border-fuchsia-400/30 flex flex-col justify-center px-2 overflow-hidden relative overflow-hidden group-hover/tooltip:shadow-lg" 
                                     style={{ width: `${(durPct / (durPct + bufferPct)) * 100}%` }}>
                                   <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none"></div>
                                   <span className="text-[10px] font-bold text-white drop-shadow-sm flex items-center gap-1 relative z-10 w-full truncate">
                                      <span className="opacity-90">{b.booking_time}</span> 
                                      <span className="truncate">{b.customer_name}</span>
                                   </span>
                                </div>

                                {/* Buffer Time Block */}
                                <div className="h-full bg-amber-300/90 hover:bg-amber-300 rounded-r-xl border border-amber-200 flex items-center justify-center opacity-90 shadow-sm relative group-hover/tooltip:shadow-lg" 
                                     style={{ width: `${(bufferPct / (durPct + bufferPct)) * 100}%` }}>
                                  <Car size={10} className="text-amber-800" />
                                </div>
                            </div>
                          );
                        })}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
