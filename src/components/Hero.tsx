'use client';
import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

const Hero = () => {
  return (
    <section id="home" className="relative h-screen flex items-center overflow-hidden scroll-mt-24">
      {/* Background Image with Cinematic Overlay */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-1000 transform scale-105"
        style={{ backgroundImage: 'url("/hero-bg.png")' }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-bg-cream via-bg-cream/60 to-transparent"></div>
        <div className="absolute inset-0 bg-black/5"></div>
      </div>

      <div className="container-custom relative z-10 px-8 sm:px-12">
        <div className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <span className="inline-block px-5 py-2 rounded-full bg-earth-primary/10 text-earth-primary text-xs font-bold mb-8 tracking-widest uppercase">
              Nyaman, Private, & Personal
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-8xl mb-8 text-gradient leading-tight font-serif italic">
              Pijat Relaksasi <br />
              ke Rumah Anda
            </h1>
            <p className="text-lg md:text-xl text-text-secondary mb-12 leading-relaxed max-w-xl">
              SerenaRaga menghadirkan layanan pijat panggilan yang nyaman dan personal langsung ke hunian Anda di wilayah Jogja, Sleman, dan Bantul. Temukan ketenangan sejati tanpa harus keluar rumah.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
              <Link href="#booking" className="bg-earth-primary text-white text-base md:text-lg font-medium px-10 py-4 rounded-full hover:bg-earth-dark transition-all transform hover:-translate-y-1 shadow-lg hover:shadow-xl text-center">
                Pesan Sekarang
              </Link>
              <Link href="#menu" className="bg-white/80 backdrop-blur-md text-earth-primary border border-earth-primary/20 text-base md:text-lg font-medium px-10 py-4 rounded-full hover:bg-white transition-all transform hover:-translate-y-1 shadow-sm text-center">
                Lihat Layanan
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Decorative pulse element */}
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 10, repeat: Infinity }}
        className="absolute -bottom-1/4 -right-1/4 w-[60vw] h-[60vw] bg-earth-primary/10 rounded-full blur-[120px] pointer-events-none"
      />
    </section>
  );
};

export default Hero;
