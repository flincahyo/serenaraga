'use client';
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Clock, MapPin, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase';

const DEFAULTS = {
  whatsapp_number: '6289518359037',
  whatsapp_booking_message: 'Halo Admin SerenaRaga! Saya ingin tanya layanan massage di rumah. Bisa bantu informasinya?',
  operational_hours: 'Senin - Minggu, 08.00 - 21.00 WIB',
  service_area: 'Melayani Area Yogyakarta',
};

const BookingSection = () => {
  const [settings, setSettings] = useState(DEFAULTS);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('settings')
      .select('key, value')
      .in('key', Object.keys(DEFAULTS))
      .then(({ data }) => {
        if (data) {
          const obj: Record<string, string> = {};
          data.forEach(({ key, value }) => { obj[key] = value; });
          setSettings(prev => ({ ...prev, ...obj }));
        }
      });
  }, []);

  const handleWhatsAppClick = () => {
    const whatsappUrl = `https://wa.me/${settings.whatsapp_number}?text=${encodeURIComponent(settings.whatsapp_booking_message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <section id="booking" className="py-24 bg-bg-cream scroll-mt-24">
      <div className="container-custom">
        <div className="bg-white rounded-[3rem] overflow-hidden shadow-2xl flex flex-col md:flex-row border border-earth-primary/10">

          {/* Left Column */}
          <div className="md:w-1/2 bg-earth-primary p-12 md:p-20 text-white flex flex-col justify-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl mb-8 text-white font-serif italic leading-tight">
                Siap Menemukan <br />Ketenangan?
              </h2>
              <p className="text-white/80 mb-12 text-base leading-relaxed max-w-md">
                Terapis profesional kami siap menghadirkan pengalaman spa premium langsung ke hunian Anda.
              </p>

              <div className="space-y-6">
                <div className="flex items-center gap-5">
                  <div className="bg-white/10 p-3 rounded-xl"><Clock size={20} className="text-white" /></div>
                  <p className="font-medium text-sm">Operasional: {settings.operational_hours}</p>
                </div>
                <div className="flex items-center gap-5">
                  <div className="bg-white/10 p-3 rounded-xl"><MapPin size={20} className="text-white" /></div>
                  <p className="font-medium text-sm">{settings.service_area}</p>
                </div>
                {settings.operational_note && (
                  <div className="flex items-center gap-5">
                    <div className="bg-white/10 p-3 rounded-xl">
                      <Sparkles size={20} className="text-white" />
                    </div>
                    <p className="font-medium text-sm">{settings.operational_note}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Right Column */}
          <div className="md:w-1/2 p-12 md:p-20 bg-bg-soft/30 flex flex-col justify-center items-center text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="max-w-sm"
            >
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg mb-8 mx-auto">
                <Sparkles size={32} className="text-earth-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-text-primary">Eksklusif &amp; Personal</h3>
              <p className="text-text-secondary text-sm mb-10 leading-relaxed">
                Konsultasikan keluhan atau kebutuhan relaksasi Anda langsung dengan Admin kami lewat WhatsApp.
              </p>

              <button
                onClick={handleWhatsAppClick}
                className="group relative w-full bg-emerald-600 text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-4 hover:bg-emerald-700 transition-all transform hover:-translate-y-1 shadow-xl hover:shadow-2xl"
              >
                <MessageCircle size={28} />
                <span>Chat via WhatsApp</span>
                <div className="absolute inset-0 rounded-2xl bg-white/20 scale-105 opacity-0 group-hover:opacity-100 transition-all pointer-events-none" />
              </button>

              <p className="mt-8 text-[10px] text-text-secondary/50 uppercase tracking-[0.2em] font-bold">
                Respon Cepat &amp; Tanya-Tanya Gratis
              </p>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default BookingSection;
