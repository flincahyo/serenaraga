'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarCheck, CalendarX, Sparkles } from 'lucide-react';

interface FreeBlock {
  s: number;
  e: number;
}

interface PublicDaySchedule {
  date: string;
  label: string;
  timeText: string;
  freeBlocks: FreeBlock[];
  isFull: boolean;
}

export default function PublicScheduleWidget() {
  const [schedule, setSchedule] = useState<PublicDaySchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  // Kanban timeline config
  const START_HOUR = 8;
  const END_HOUR = 23;
  const TOTAL_MINUTES = (END_HOUR - START_HOUR) * 60;
  
  const minutesToPct = (mins: number) => {
    let bounded = Math.max(START_HOUR * 60, Math.min(END_HOUR * 60, mins));
    return ((bounded - (START_HOUR * 60)) / TOTAL_MINUTES) * 100;
  };

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const res = await fetch('/api/public/schedule');
        const json = await res.json();
        if (json.success) {
          setSchedule(json.data);
        }
      } catch (err) {
        console.error('Failed to load schedule', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSchedule();
  }, []);

  const scrollToBooking = (dateStr: string) => {
    // We could pass dateStr to booking form if we wanted, for now just scroll
    document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="schedule" className="py-24 bg-white relative overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-earth-primary/5 via-white to-white scroll-mt-24">
      <div className="container-custom max-w-5xl">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           className="mb-14 text-center max-w-2xl mx-auto"
        >
          <div className="flex items-center justify-center gap-2 mb-3">
             <span className="relative flex h-2.5 w-2.5">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
             </span>
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Live Availability</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-serif italic text-text-primary mb-4">Cek Ketersediaan Jadwal</h2>
          <p className="text-text-secondary text-sm leading-relaxed">
            *Disclaimer: Data ketersediaan jadwal ditampilkan otomatis sesuai sistem, namun bisa mengalami sedikit keterlambatan dengan kondisi lapangan (delay). Harap konfirmasi ketersediaan slot aktual dengan Admin via WhatsApp.*
          </p>
        </motion.div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
             <div className="w-8 h-8 border-2 border-earth-primary/30 border-t-earth-primary rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] overflow-hidden">
            {/* Legend */}
            <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100 flex flex-wrap items-center gap-6 text-[11px] font-bold tracking-wider text-text-secondary">
              <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-100 border border-emerald-200"></span> SLOT KOSONG</span>
              <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-50 border border-red-100"></span> FULL BOOKED</span>
            </div>

            {/* Timetable Header */}
            <div className="hidden md:flex ml-[120px] lg:ml-[160px] border-b border-gray-100 h-10 relative">
               {Array.from({ length: END_HOUR - START_HOUR + 1 }).map((_, i) => {
                 const hour = START_HOUR + i;
                 // Labels only every 2 hours to avoid clutter
                 if (hour % 2 !== 0 && hour !== START_HOUR && hour !== END_HOUR) return null;
                 return (
                   <div key={i} className="absolute top-0 bottom-0 flex flex-col justify-end pb-2 -translate-x-1/2" style={{ left: `${(i / (END_HOUR - START_HOUR)) * 100}%` }}>
                      <span className="text-[10px] font-semibold text-gray-400">{hour.toString().padStart(2, '0')}:00</span>
                   </div>
                 );
               })}
            </div>

            <div className="divide-y divide-gray-50 flex flex-col relative w-full">
               {/* Vertical grid lines (desktop only) */}
               <div className="hidden md:flex absolute top-0 bottom-0 ml-[120px] lg:ml-[160px] right-0 pointer-events-none z-0">
                 {Array.from({ length: END_HOUR - START_HOUR }).map((_, i) => (
                    <div key={i} className={`h-full border-l border-gray-100/50 ${i % 2 !== 0 ? 'bg-gray-50/30' : 'bg-transparent'}`} style={{ width: `${100 / (END_HOUR - START_HOUR)}%` }}></div>
                 ))}
               </div>

               {(isExpanded ? schedule : schedule.slice(0, 7)).map((day) => {
                  const [dayName, dateName] = day.label.split(', ');
                  return (
                    <div 
                      key={day.date} 
                      onClick={() => scrollToBooking(day.date)}
                      className="group flex flex-col md:flex-row relative z-10 hover:bg-gray-50/50 transition-colors cursor-pointer"
                    >
                      <div className="w-full md:w-[120px] lg:w-[160px] shrink-0 p-4 md:py-5 md:px-6 flex flex-row md:flex-col items-center md:items-start justify-between md:justify-center bg-white md:bg-transparent md:border-r border-gray-100 border-dashed">
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{dayName}</p>
                          <p className="text-sm font-black text-text-primary mt-0.5">{dateName}</p>
                        </div>
                        {/* Mobile summary label & icon */}
                        <div className="md:hidden flex items-center gap-2">
                           {day.isFull ? (
                             <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2.5 py-1 rounded-md border border-red-100">FULL</span>
                           ) : (
                             <div className="bg-emerald-50 text-emerald-500 p-1.5 rounded-full border border-emerald-100">
                                <CalendarCheck size={14} />
                             </div>
                           )}
                           <svg className="w-4 h-4 text-gray-300 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                        </div>
                      </div>

                      {/* Timeline Area Desktop */}
                      <div className="hidden md:block flex-1 relative h-20">
                         {day.isFull ? (
                           // Show full blocked area for the day
                           <div className="absolute inset-y-3 left-4 right-4 rounded-xl bg-[repeating-linear-gradient(45deg,rgba(239,68,68,0.03),rgba(239,68,68,0.03)_5px,rgba(239,68,68,0.06)_5px,rgba(239,68,68,0.06)_10px)] bg-red-50 border border-red-100/50 flex items-center justify-center overflow-hidden transition-all group-hover:bg-red-100/50">
                             <div className="flex items-center gap-2 bg-white/60 px-4 py-1.5 rounded-full border border-red-100 backdrop-blur-sm shadow-sm">
                               <CalendarX size={14} className="text-red-500" />
                               <span className="text-[10px] font-black tracking-widest text-red-500">FULL BOOKED</span>
                             </div>
                           </div>
                         ) : (
                           // Render the exact free blocks
                           <>
                             {day.freeBlocks?.map((bk, i) => {
                               const leftPct = minutesToPct(bk.s);
                               const widthPct = minutesToPct(bk.e) - leftPct;
                               
                               // Calculate duration in hours to decide if we show text inside
                               const durMins = bk.e - bk.s;
                               const showText = durMins >= 120; // 2 hours

                               const formatTime = (mins: number) => {
                                 const h = Math.floor(mins / 60);
                                 const m = mins % 60;
                                 return `${String(h).padStart(2,'0')}.${String(m).padStart(2,'0')}`;
                               };

                               return (
                                 <div 
                                   key={i} 
                                   className="absolute inset-y-4 rounded-lg bg-emerald-50/80 border border-emerald-200 shadow-sm flex items-center justify-center overflow-hidden group-hover:bg-emerald-100/80 group-hover:border-emerald-300 transition-all group-hover:scale-[1.01] origin-left"
                                   style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                                 >
                                   <div className="absolute inset-0 bg-gradient-to-r from-emerald-100/0 via-white/40 to-emerald-100/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                   {showText && (
                                     <span className="text-[10px] font-semibold text-emerald-700 whitespace-nowrap px-2 z-10 hidden lg:block">
                                       {formatTime(bk.s)} - {formatTime(bk.e)}
                                     </span>
                                   )}
                                 </div>
                               );
                             })}
                           </>
                         )}
                      </div>

                      {/* Timeline Area Mobile Fallback */}
                      <div className="md:hidden px-4 pb-5 pt-1 bg-white">
                        {day.isFull ? (
                          <div className="w-full rounded-lg bg-[repeating-linear-gradient(45deg,rgba(239,68,68,0.03),rgba(239,68,68,0.03)_5px,rgba(239,68,68,0.06)_5px,rgba(239,68,68,0.06)_10px)] bg-red-50/50 border border-red-100/30 p-3 flex items-center justify-center">
                             <span className="text-[10px] font-black tracking-widest text-red-500/80">SELURUH TERAPIS PENUH</span>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2 justify-start">
                            {day.freeBlocks?.map((bk, i) => {
                               const formatTime = (mins: number) => {
                                 const h = Math.floor(mins / 60);
                                 const m = mins % 60;
                                 return `${String(h).padStart(2,'0')}.${String(m).padStart(2,'0')}`;
                               };
                               return (
                                 <span key={i} className="px-3.5 py-1.5 bg-emerald-50/50 border border-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg shadow-sm">
                                   {formatTime(bk.s)} - {formatTime(bk.e)}
                                 </span>
                               );
                            })}
                          </div>
                        )}
                      </div>

                    </div>
                  );
               })}
            </div>
          </div>
        )}
        
        {!loading && schedule.length > 7 && (
           <div className="mt-6 text-center">
              <button 
                 onClick={() => setIsExpanded(!isExpanded)}
                 className="inline-flex items-center gap-2 text-sm font-semibold text-earth-primary hover:text-earth-primary/80 transition-colors bg-earth-primary/5 px-6 py-2 rounded-full"
              >
                 {isExpanded ? 'Tampilkan Lebih Sedikit' : 'Lihat Jadwal Minggu Depan'}
                 <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </button>
           </div>
        )}

        <div className="text-center mt-12">
           <button onClick={() => scrollToBooking('')} className="bg-earth-primary text-white px-8 py-3.5 rounded-full font-bold shadow-lg shadow-earth-primary/20 hover:-translate-y-1 hover:shadow-xl transition-all">
             Tanya Admin via WhatsApp
           </button>
        </div>
      </div>
    </section>
  );
}
