'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Clock, Info, Sparkles, Wind, Footprints, Heart, ArrowRight } from 'lucide-react';
import Link from 'next/link';

type PriceItem = {
  name: string;
  price: string;
  details: string;
  bestSeller?: boolean;
};

type PriceCategory = {
  id: string;
  label: string;
  items: PriceItem[];
};

const pricelistData: PriceCategory[] = [
  {
    id: 'packages',
    label: 'Massage Packages',
    items: [
      { name: 'Special Package Refine', price: '185.000', bestSeller: true, details: 'Massage Full Body 120 menit, Lulur Full Body 10 menit, Totok Wajah 5 menit, Head Massage Free Masker 10 menit' },
      { name: 'Special Package Release', price: '185.000', details: 'Massage Full Body 90 menit, Kerik, Lulur Full Body 10 menit, Totok Wajah 5 menit, Head Massage Free Masker 10 menit' },
      { name: 'Special Package Restore', price: '185.000', details: 'Massage Full Body 120 menit, Scrub Full Body 10 menit, Totok Wajah 5 menit, Head Massage Free Masker 10 menit' },
      { name: 'Special Package Recover', price: '190.000', details: 'Massage Full Body 90 menit, Refleksi 30 menit, Scrub Full Body 10 menit, Totok Wajah 5 menit, Head Massage Free Masker 10 menit' },
      { name: 'Special Package Balance', price: '190.000', details: 'Massage Full Body 90 menit, Kerik, Scrub Full Body 10 menit, Totok Wajah 5 menit, Head Massage Free Masker 10 menit' },
      { name: 'Special Package Renewal', price: '230.000', bestSeller: true, details: 'Massage Full Body 120 menit, Refleksi 30 menit, Scrub Full Body 10 menit, Totok Wajah 5 menit, Head Massage Free Masker 10 menit' },
      { name: 'Special Package Revive', price: '230.000', details: 'Massage Full Body 120 menit, Kerik, Scrub Full Body 10 menit, Totok Wajah 5 menit, Head Massage Free Masker 10 menit' },
      { name: 'Special Package Lactaflow', price: '275.000', bestSeller: true, details: 'Massage Ibu Postpartum 60m, Oksitosin 30m, Laktasi 30m, Scrub 10m, Totok 5m, Pilis, Head Massage 10m + Free Masker' },
    ]
  },
  {
    id: 'services',
    label: 'Massage Services',
    items: [
      { name: 'Essential Relax', price: '100.000', details: 'Massage Full Body 60 menit Free Totok Wajah' },
      { name: 'Relax Flow', price: '135.000', details: 'Massage Full Body 90 menit Free Totok Wajah' },
      { name: 'Deep Relax', price: '150.000', details: 'Massage Full Body 120 menit Free Totok Wajah' },
      { name: 'Post Partum', price: '165.000', details: 'Massage Ibu Post Partum Full Body 120 menit Free Totok Wajah' },
      { name: 'Pregnancy', price: '165.000', details: 'Massage Ibu Hamil Full Body 120 menit Free Totok Wajah' },
      { name: 'Endorfin / Induksi', price: '165.000', details: 'Massage Endorfin 120 menit Free Totok Wajah' },
      { name: 'Ultimate', price: '195.000', details: 'Massage Full Body 150 menit Free Totok Wajah' },
    ]
  },
  {
    id: 'reflexology',
    label: 'Refleksi Service',
    items: [
      { name: 'Comfort', price: '95.000', details: 'Refleksi 60 menit' },
      { name: 'Reflex', price: '135.000', details: 'Refleksi 90 menit' },
      { name: 'Total', price: '160.000', details: 'Refleksi 120 menit' },
    ]
  },
  {
    id: 'addons',
    label: 'Add-On Service',
    items: [
      { name: 'Masker', price: '10.000', details: 'Durasi 10 menit' },
      { name: 'Totok Wajah', price: '30.000', details: 'Durasi 15 menit' },
      { name: 'Head Massage', price: '30.000', details: 'Durasi 15 menit' },
      { name: 'Kerik', price: '40.000', details: 'Durasi menyesuaikan kondisi tubuh' },
      { name: 'Full Body Massage', price: '55.000', details: 'Durasi 30 menit' },
      { name: 'Lulur', price: '55.000', details: 'Durasi 30 menit' },
      { name: 'Refleksi Massage', price: '60.000', details: 'Durasi 30 menit' },
      { name: 'Scrub', price: '60.000', details: 'Durasi 30 menit' },
    ]
  }
];

const featuredPackages = [
  {
    name: 'Special Package Refine',
    price: 'Rp 185.000',
    duration: '145 Min',
    image: '/featured-refine.png',
    description: 'Transformasi kesegaran total dengan kombinasi Full Body Massage, Lulur, Totok Wajah, dan Head Massage.',
    icon: <Sparkles size={24} className="text-earth-primary" />,
  },
  {
    name: 'Special Package Renewal',
    price: 'Rp 230.000',
    duration: '175 Min',
    image: '/featured-renewal.png',
    description: 'Pemulihan mendalam dengan tambahan Refleksi 30 menit untuk keseimbangan energi tubuh yang maksimal.',
    icon: <Wind size={24} className="text-earth-primary" />,
  },
  {
    name: 'Special Package Lactaflow',
    price: 'Rp 275.000',
    duration: '155 Min',
    image: '/featured-lactaflow.png',
    description: 'Perawatan khusus ibu postpartum yang menggabungkan pijat oksitosin dan laktasi untuk pemulihan optimal.',
    icon: <Heart size={24} className="text-earth-primary" />,
  },
];

const Pricelist = () => {
  const [activeTab, setActiveTab] = useState(pricelistData[0].id);

  return (
    <section id="menu" className="py-24 bg-bg-cream scroll-mt-24">
      {/* Featured Highlights Section */}
      <div className="container-custom mb-32">
        <div className="text-center mb-16">
          <motion.span 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="inline-block px-4 py-1.5 rounded-full bg-earth-primary/10 text-earth-primary text-[10px] font-black uppercase tracking-widest mb-4"
          >
            Pilihan Terbaik
          </motion.span>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl mb-6 font-serif italic text-text-primary"
          >
            Layanan <span className="text-earth-primary">SerenaRaga</span>
          </motion.h2>
          <p className="text-text-secondary max-w-xl mx-auto text-sm leading-relaxed">
            Pilihlah dari tiga koleksi terapis terbaik kami yang dirancang untuk memberikan pemulihan maksimal dalam satu sesi.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-10">
          {featuredPackages.map((pkg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white rounded-[2rem] md:rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-50 flex flex-col group"
            >
              <div className="relative h-48 sm:h-64 overflow-hidden">
                <img src={pkg.image} alt={pkg.name} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                <div className="absolute top-3 left-3 md:top-4 md:left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest text-earth-primary shadow-sm flex items-center gap-1.5 md:gap-2">
                  <Star size={10} fill="currentColor" /> Best Seller
                </div>
              </div>
              <div className="p-6 md:p-8 flex flex-col flex-grow">
                <div className="flex justify-between items-start mb-3 md:mb-4">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-bg-soft rounded-lg flex items-center justify-center">
                    {pkg.icon}
                  </div>
                  <span className="text-earth-primary font-serif font-bold text-base md:text-lg">{pkg.price}</span>
                </div>
                <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3 text-text-primary">{pkg.name}</h3>
                <p className="text-[11px] md:text-xs text-text-secondary leading-relaxed mb-6 md:mb-8 flex-grow">
                  {pkg.description}
                </p>
                <div className="flex justify-between items-center pt-4 md:pt-6 border-t border-gray-50 mt-auto">
                  <span className="flex items-center gap-1.5 md:gap-2 text-[9px] md:text-[10px] font-bold text-text-secondary uppercase tracking-widest">
                    <Clock size={14} /> {pkg.duration}
                  </span>
                  <Link href="#booking" className="bg-earth-primary/5 text-earth-primary border border-earth-primary/10 px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 group/link hover:bg-earth-primary hover:text-white transition-all">
                    Pesan <ArrowRight size={14} className="group-hover/link:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Full Detailed Pricelist Section */}
      <div className="container-custom pt-32 mt-16 border-t border-gray-100">
        <div className="text-center mb-16">
          <h3 className="text-3xl md:text-4xl font-serif italic text-text-primary mb-4">Menu Lengkap</h3>
          <p className="text-xs text-earth-primary tracking-[0.2em] uppercase font-black">Detail Paket & Harga Seluruh Layanan</p>
        </div>

        {/* Tab Switcher - Scrollable on Mobile */}
        <div className="overflow-x-auto pb-4 mb-12 scrollbar-hide">
          <div className="flex flex-nowrap md:justify-center gap-2 px-4 min-w-max mx-auto bg-white/50 backdrop-blur-sm p-2 rounded-full border border-gray-100 w-fit">
            {pricelistData.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                className={`flex-shrink-0 px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                  activeTab === cat.id 
                  ? 'bg-earth-primary text-white shadow-md' 
                  : 'text-text-secondary hover:bg-earth-primary/5'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* List Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="bg-white rounded-[3rem] p-8 md:p-12 shadow-xl border border-gray-50"
          >
            <div className="grid md:grid-cols-1 gap-0">
              {pricelistData.find(c => c.id === activeTab)?.items.map((item, idx) => (
                <div key={idx} className="group flex flex-col md:flex-row md:items-start justify-between gap-6 py-10 border-b border-gray-100 last:border-0 hover:bg-bg-soft/20 px-4 -mx-4 rounded-3xl transition-colors">
                  <div className="max-w-2xl">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <h3 className="text-xl font-bold text-text-primary group-hover:text-earth-primary transition-colors">
                        {item.name}
                      </h3>
                      {item.bestSeller && (
                        <span className="bg-amber-100 text-amber-800 text-[9px] uppercase tracking-wider font-black px-2 py-1 rounded-md flex items-center gap-1">
                           <Star size={10} fill="currentColor" /> BEST SELLER
                        </span>
                      )}
                    </div>
                    <p className="text-sm md:text-base text-text-secondary leading-relaxed font-medium">
                      {item.details}
                    </p>
                  </div>
                  <div className="flex items-baseline md:flex-col md:items-end gap-2 md:gap-0 flex-shrink-0">
                     <span className="text-[10px] text-text-secondary/50 uppercase tracking-widest hidden md:block font-bold">Price</span>
                     <span className="text-2xl font-serif font-bold text-earth-primary">
                        IDR {item.price}
                     </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Note Section */}
            <div className="mt-16 pt-10 border-t border-gray-50 grid md:grid-cols-3 gap-8 text-[10px] text-text-secondary/60">
               <p className="flex gap-2 leading-relaxed"><Info size={14} className="flex-shrink-0 text-earth-primary" /> Harga & promo dapat berubah sesuai periode berlaku.</p>
               <p className="flex gap-2 leading-relaxed"><Clock size={14} className="flex-shrink-0 text-earth-primary" /> Disarankan reservasi H-1 untuk jadwal terbaik.</p>
               <p className="flex gap-2 leading-relaxed"><Star size={14} className="flex-shrink-0 text-earth-primary" /> Free Ongkir 10km pertama. Kirim shareloc untuk cek lokasi.</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};

export default Pricelist;
