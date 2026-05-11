'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { Wind, Heart } from 'lucide-react';

const Philosophy = () => {
  const philosophy = [
    {
      title: "Seren",
      subtitle: "The Art of Resting",
      description: "Seren (dalam bahasa jawa) memiliki arti istirahat. Istirahat sejati bermula dari rumah. Kami membawa ketenangan dan keharmonisan massage langsung ke ruang paling sakral bagi Anda, tanpa perlu melangkah keluar.",
      icon: <Wind size={32} strokeWidth={1.5} />,
      alignment: "items-start",
      delay: 0.1
    },
    {
      title: "Raga",
      subtitle: "Body Restoration",
      description: "Tubuh adalah rumah bagi hidup Anda. Dengan sentuhan terapis profesional yang memahami setiap lelah, kami memulihkan harmoni fisik secara menyeluruh.",
      icon: <Heart size={32} strokeWidth={1.5} />,
      alignment: "items-end text-right md:mt-24",
      delay: 0.3
    }
  ];

  return (
    <section id="about" className="py-24 md:py-32 bg-bg-cream/30 relative overflow-hidden scroll-mt-24 border-y border-earth-primary/5">
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-earth-primary/5 -skew-x-12 translate-x-1/2 pointer-events-none" />

      <div className="container-custom relative z-10">
        <div className="max-w-6xl mx-auto">

          <div className="grid md:grid-cols-2 gap-20 md:gap-32">

            {/* Header Content */}
            <div className="flex flex-col relative">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="md:sticky md:top-40"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-[1px] bg-earth-primary" />
                  <span className="text-xs font-black uppercase tracking-[0.3em] text-earth-primary">The Philosophy</span>
                </div>
                <h2 className="text-4xl md:text-6xl font-serif italic text-text-primary leading-tight mb-8">
                  Ketenangan di Setiap <br />
                  <span className="text-earth-primary">Sentuhan</span>
                </h2>
                <p className="text-text-secondary text-lg leading-relaxed max-w-md italic opacity-80">
                  SerenaRaga terlahir dari keinginan untuk menghidupkan kembali harmoni antara tubuh dan jiwa. 
                  Kami percaya bahwa perawatan diri terbaik adalah yang dilakukan dalam ruang privat yang paling 
                  nyaman bagi Anda—rumah sendiri.
                </p>
              </motion.div>
            </div>

            {/* Philosophy Cards Layered */}
            <div className="relative pt-10 md:pt-0">
              {philosophy.map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: item.delay, duration: 0.8 }}
                  className={`flex flex-col ${item.alignment} mb-20 md:mb-16 last:mb-0`}
                >
                  <div className="relative group max-w-sm w-full">
                    {/* Visual Watermark */}
                    <span className="absolute -top-10 md:-top-12 -left-4 md:-left-12 text-6xl md:text-9xl font-serif font-black text-earth-primary/5 pointer-events-none select-none italic z-0">
                      {item.title}
                    </span>

                    <div className="relative z-10 bg-white/60 backdrop-blur-sm p-8 md:p-12 rounded-[2rem] border border-earth-primary/10 shadow-sm hover:shadow-xl hover:bg-white transition-all duration-500">
                      <div className="w-14 h-14 bg-earth-primary text-white rounded-full flex items-center justify-center mb-8 shadow-lg shadow-earth-primary/20">
                        {item.icon}
                      </div>
                      <div className="mb-4">
                        <h3 className="text-3xl font-serif font-bold text-text-primary">{item.title}</h3>
                        <p className="text-xs font-bold text-earth-primary/50 uppercase tracking-widest">{item.subtitle}</p>
                      </div>
                      <p className="text-text-secondary leading-relaxed text-sm md:text-base">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};

export default Philosophy;
