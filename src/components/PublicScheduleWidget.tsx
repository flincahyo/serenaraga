'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarCheck, CalendarX, Sparkles } from 'lucide-react';

interface TimeSlot {
  time: string;
  available: boolean;
}

interface PublicDaySchedule {
  date: string;
  label: string;
  allSlots: TimeSlot[];
  isFull: boolean;
}

export default function PublicScheduleWidget() {
  const [schedule, setSchedule] = useState<PublicDaySchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);



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
              <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-100 border border-emerald-200"></span> SLOT TERSEDIA</span>
              <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-50 border border-red-100"></span> FULL BOOKED</span>
            </div>

            <div className="divide-y divide-gray-50 flex flex-col relative w-full">
               {(isExpanded ? schedule : schedule.slice(0, 7)).map((day) => {
                  const [dayName, dateName] = day.label.split(', ');
                  return (
                    <div 
                      key={day.date} 
                      className="group flex flex-col md:flex-row relative z-10 hover:bg-gray-50/50 transition-colors"
                    >
                      <div className="w-full md:w-[160px] lg:w-[200px] shrink-0 p-4 md:py-6 md:px-6 flex flex-row md:flex-col items-center md:items-start justify-between md:justify-center bg-white md:bg-transparent md:border-r border-gray-100 border-dashed">
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
                        </div>
                      </div>

                      {/* Time Slots Area */}
                      <div className="flex-1 p-4 md:p-6 flex items-center bg-white md:bg-transparent">
                         <div className="flex flex-wrap gap-2.5 justify-start">
                           {day.allSlots?.map((slot, i) => (
                             <button 
                               key={i} 
                               onClick={() => slot.available && scrollToBooking(day.date)}
                               disabled={!slot.available}
                               className={`px-4 py-2 text-sm font-bold rounded-lg shadow-sm transition-all ${
                                 slot.available 
                                   ? 'bg-emerald-50/80 hover:bg-emerald-500 hover:text-white border border-emerald-200 text-emerald-700 hover:shadow-md hover:-translate-y-0.5 cursor-pointer'
                                   : 'bg-red-50/50 border border-red-100 text-red-400 opacity-60 cursor-not-allowed line-through'
                               }`}
                             >
                               {slot.time}
                             </button>
                           ))}
                         </div>
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
