'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { BadgeCheck, ShieldCheck, Clock, Droplets, Wallet, CalendarHeart } from 'lucide-react';

const WhyChooseUs = () => {
  const reasons = [
    {
      title: "Terapis Terampil",
      description: "Seluruh terapis kami terlatih profesional dan setara standar spa premium.",
      icon: <BadgeCheck className="w-5 h-5 md:w-7 md:h-7" strokeWidth={1.2} />
    },
    {
      title: "Privasi Terjaga",
      description: "Nikmati pijat relaksasi di ruang aman tanpa berinteraksi dengan pelanggan lain.",
      icon: <ShieldCheck className="w-5 h-5 md:w-7 md:h-7" strokeWidth={1.2} />
    },
    {
      title: "Hemat Waktu",
      description: "Bebas macet dan antre. Biar terapis kami yang datang ke lokasi Anda.",
      icon: <Clock className="w-5 h-5 md:w-7 md:h-7" strokeWidth={1.2} />
    },
    {
      title: "Alat Higienis",
      description: "Alas pijat dan minyak aromaterapi selalu bersih, wangi, dan disanitasi.",
      icon: <Droplets className="w-5 h-5 md:w-7 md:h-7" strokeWidth={1.2} />
    },
    {
      title: "Harga Transparan",
      description: "Tidak ada biaya tersembunyi. Semua harga sudah termasuk biaya transport.",
      icon: <Wallet className="w-5 h-5 md:w-7 md:h-7" strokeWidth={1.2} />
    },
    {
      title: "Jadwal Fleksibel",
      description: "Kami siap melayani setiap hari. Bebas tentukan waktu terapi Anda.",
      icon: <CalendarHeart className="w-5 h-5 md:w-7 md:h-7" strokeWidth={1.2} />
    }
  ];

  return (
    <section id="why-us" className="py-16 md:py-20 bg-white scroll-mt-24">
      <div className="container-custom">
        <div className="text-center mb-10 md:mb-12 max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="inline-block px-3 py-1 rounded-full bg-earth-primary/5 text-earth-primary text-[9px] font-black uppercase tracking-widest mb-3 md:mb-4">
              Keunggulan Kami
            </span>
            <h2 className="text-2xl md:text-4xl font-serif italic text-text-primary leading-tight mb-3 md:mb-4">
              Mengapa Memilih SerenaRaga?
            </h2>
            <p className="text-text-secondary text-[13px] md:text-sm leading-relaxed max-w-lg mx-auto">
              Kami hadir untuk memberikan kemudahan, kenyamanan, dan kualitas relaksasi terbaik tanpa mengharuskan Anda keluar rumah.
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-5 max-w-5xl mx-auto">
          {reasons.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05, duration: 0.4 }}
              className="bg-white rounded-xl p-4 md:p-6 border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_20px_-8px_rgba(0,0,0,0.1)] hover:border-earth-primary/20 transition-all duration-300 flex flex-col items-start"
            >
              <div className="mb-3 md:mb-4 text-text-primary opacity-80">
                {item.icon}
              </div>
              <h3 className="text-[12px] md:text-[15px] font-bold text-text-primary mb-1 md:mb-1.5 leading-tight">{item.title}</h3>
              <p className="text-[10px] md:text-[13px] text-text-secondary/80 leading-relaxed">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
