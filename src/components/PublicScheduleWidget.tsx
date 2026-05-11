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
    <section id="schedule" className="py-20 bg-white relative scroll-mt-24">
      <div className="container-custom max-w-4xl">
        <motion.div
           initial={{ opacity: 0, y: 15 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           className="mb-10 text-center mx-auto"
        >
          <div className="flex items-center justify-center gap-2 mb-3">
             <span className="relative flex h-2 w-2">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
             </span>
             <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-600">Live Availability</span>
          </div>
          <h2 className="text-2xl md:text-4xl font-serif italic text-text-primary mb-3">Cek Ketersediaan Jadwal</h2>
          <p className="text-text-secondary text-xs leading-relaxed max-w-xl mx-auto">
            *Data jadwal bersifat realtime dari sistem. Harap konfirmasi ketersediaan slot aktual dengan Admin kami via WhatsApp.*
          </p>
        </motion.div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
             <div className="w-6 h-6 border-2 border-earth-primary/30 border-t-earth-primary rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Legend */}
            <div className="px-5 py-3 border-b border-gray-100 flex flex-wrap items-center gap-4 text-[10px] font-bold tracking-wider text-text-secondary">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400"></span> TERSEDIA</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400"></span> PENUH</span>
            </div>

            <div className="flex flex-col">
               {(isExpanded ? schedule : schedule.slice(0, 7)).map((day) => {
                  const [dayName, dateName] = day.label.split(', ');
                  return (
                    <div 
                      key={day.date} 
                      className="group flex flex-col md:flex-row md:items-center py-4 px-5 border-b border-gray-50 last:border-none hover:bg-gray-50/50 transition-colors"
                    >
                      {/* Date Info */}
                      <div className="w-full md:w-[180px] shrink-0 mb-3 md:mb-0 flex items-center justify-between md:block">
                        <div className="flex md:flex-col items-baseline md:items-start gap-2 md:gap-0">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{dayName}</p>
                          <p className="text-[13px] md:text-sm font-black text-text-primary mt-0.5">{dateName}</p>
                        </div>
                        {day.isFull && (
                          <span className="md:hidden text-[9px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded border border-red-100">FULL BOOKED</span>
                        )}
                      </div>

                      {/* Time Slots Area */}
                      <div className="flex-1 flex flex-wrap gap-2">
                        {day.allSlots?.map((slot, i) => (
                          <button 
                            key={i} 
                            onClick={() => slot.available && scrollToBooking(day.date)}
                            disabled={!slot.available}
                            className={`px-3 py-1.5 text-[11px] md:text-xs font-bold rounded-md transition-all ${
                              slot.available 
                                ? 'bg-emerald-50/50 text-emerald-700 border border-emerald-200 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 cursor-pointer'
                                : 'bg-red-50/50 text-red-400 border border-red-100 line-through opacity-70 cursor-not-allowed'
                            }`}
                          >
                            {slot.time}
                          </button>
                        ))}
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
                 className="inline-flex items-center gap-2 text-[11px] md:text-xs font-bold uppercase tracking-wider text-earth-primary hover:text-earth-primary/80 transition-colors bg-earth-primary/5 px-5 py-2.5 rounded-full"
              >
                 {isExpanded ? 'Tutup Jadwal' : 'Lihat Minggu Depan'}
                 <svg className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </button>
           </div>
        )}

      </div>
    </section>
  );
}
