'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Clock, Info, Sparkles, Wind, Heart, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';

type Service = {
  id: string;
  category: string;
  category_label: string;
  name: string;
  price: number;
  details: string;
  is_bestseller: boolean;
  is_featured: boolean;
  featured_image: string | null;
  featured_description: string | null;
  featured_duration: string | null;
  sort_order: number;
};

const categoryIcons: Record<string, React.ReactNode> = {
  'Special Package Refine':    <Sparkles size={24} className="text-earth-primary" />,
  'Special Package Renewal':   <Wind size={24} className="text-earth-primary" />,
  'Special Package Lactaflow': <Heart size={24} className="text-earth-primary" />,
};

const formatPrice = (price: number) =>
  price.toLocaleString('id-ID');

const Pricelist = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('packages');

  useEffect(() => {
    const fetchServices = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .neq('category', 'split_items')
        .order('category')
        .order('sort_order');
      if (!error && data) setServices(data);
      setLoading(false);
    };
    fetchServices();
  }, []);

  // Group by category
  const categories = Array.from(
    new Map(services.map(s => [s.category, { id: s.category, label: s.category_label }])).values()
  );

  const activeItems = services.filter(s => s.category === activeTab);
  const featuredServices = services.filter(s => s.is_featured);

  if (loading) {
    return (
      <section id="menu" className="py-24 bg-bg-cream scroll-mt-24">
        <div className="container-custom">
          {/* Header Skeleton */}
          <div className="text-center mb-16 flex flex-col items-center animate-pulse">
            <div className="h-6 w-32 bg-earth-primary/20 rounded-full mb-4"></div>
            <div className="h-10 w-64 bg-zinc-200/50 rounded-xl mb-6"></div>
            <div className="h-4 w-96 max-w-full bg-zinc-200/50 rounded-lg"></div>
          </div>
          {/* Grid Skeleton */}
          <div className="grid md:grid-cols-3 gap-10">
            {[1, 2, 3].map((key) => (
              <div key={key} className="bg-white rounded-[2rem] md:rounded-[2.5rem] overflow-hidden border border-gray-50 flex flex-col animate-pulse h-[400px]">
                <div className="h-48 sm:h-64 bg-zinc-200/50"></div>
                <div className="p-6 md:p-8 flex flex-col flex-grow space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="w-10 h-10 bg-zinc-100 rounded-lg"></div>
                    <div className="h-6 w-24 bg-zinc-200/50 rounded-md"></div>
                  </div>
                  <div className="h-6 w-3/4 bg-zinc-200/50 rounded-md"></div>
                  <div className="space-y-2 flex-grow">
                    <div className="h-3 w-full bg-zinc-100 rounded-md"></div>
                    <div className="h-3 w-5/6 bg-zinc-100 rounded-md"></div>
                    <div className="h-3 w-4/6 bg-zinc-100 rounded-md"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

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
            Pilihlah dari koleksi terapis terbaik kami yang dirancang untuk memberikan pemulihan maksimal dalam satu sesi.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-10">
          {featuredServices.map((pkg, idx) => (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white rounded-[2rem] md:rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-50 flex flex-col group"
            >
              <div className="relative h-48 sm:h-64 overflow-hidden">
                <img
                  src={pkg.featured_image ?? '/featured-refine.png'}
                  alt={pkg.name}
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                />
                <div className="absolute top-3 left-3 md:top-4 md:left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest text-earth-primary shadow-sm flex items-center gap-1.5 md:gap-2">
                  <Star size={10} fill="currentColor" /> Best Seller
                </div>
              </div>
              <div className="p-6 md:p-8 flex flex-col flex-grow">
                <div className="flex justify-between items-start mb-3 md:mb-4">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-bg-soft rounded-lg flex items-center justify-center">
                    {categoryIcons[pkg.name] ?? <Sparkles size={20} className="text-earth-primary" />}
                  </div>
                  <span className="text-earth-primary font-serif font-bold text-base md:text-lg">
                    Rp {formatPrice(pkg.price)}
                  </span>
                </div>
                <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3 text-text-primary">{pkg.name}</h3>
                <p className="text-[11px] md:text-xs text-text-secondary leading-relaxed mb-6 md:mb-8 flex-grow">
                  {pkg.featured_description}
                </p>
                <div className="flex justify-between items-center pt-4 md:pt-6 border-t border-gray-50 mt-auto">
                  <span className="flex items-center gap-1.5 md:gap-2 text-[9px] md:text-[10px] font-bold text-text-secondary uppercase tracking-widest">
                    <Clock size={14} /> {pkg.featured_duration}
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

        {/* Tab Switcher */}
        <div className="overflow-x-auto pb-4 mb-12 scrollbar-hide">
          <div className="flex flex-nowrap md:justify-center gap-2 px-4 min-w-max mx-auto bg-white/50 backdrop-blur-sm p-2 rounded-full border border-gray-100 w-fit">
            {categories.map((cat) => (
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
              {activeItems.map((item) => (
                <div key={item.id} className="group flex flex-col md:flex-row md:items-start justify-between gap-6 py-10 border-b border-gray-100 last:border-0 hover:bg-bg-soft/20 px-4 -mx-4 rounded-3xl transition-colors">
                  <div className="max-w-2xl">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <h3 className="text-xl font-bold text-text-primary group-hover:text-earth-primary transition-colors">
                        {item.name}
                      </h3>
                      {item.is_bestseller && (
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
                      IDR {formatPrice(item.price)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

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
