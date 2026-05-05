'use client';
import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Beranda', href: '#home' },
    { name: 'Menu Layanan', href: '#menu' },
    { name: 'Tentang', href: '#about' },
    { name: 'Booking', href: '#booking' },
  ];

  return (
    <>
      <motion.nav 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 80, damping: 20, mass: 1 }}
        className={`fixed left-0 right-0 z-50 flex justify-center transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isScrolled ? 'top-4 px-4' : 'top-0 px-0'
        }`}
      >
        <div className={`flex justify-between items-center w-full transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isScrolled 
            ? 'max-w-5xl bg-white/75 backdrop-blur-xl border border-white/60 shadow-[0_8px_32px_rgba(139,94,60,0.06)] rounded-full px-6 py-2.5' 
            : 'max-w-7xl px-6 py-6 bg-transparent border border-transparent shadow-none'
        }`}>
          
          <Link href="/" className={`relative flex items-center justify-start overflow-hidden -ml-2 transition-all duration-500 outline-none ${isScrolled ? 'w-[160px] h-[40px]' : 'w-[200px] h-[50px]'}`}>
            <Image 
              src="/serenalogo2.svg" 
              alt="SerenaRaga" 
              width={200}
              height={230}
              priority
              className={`absolute w-auto max-w-none object-contain transition-all duration-500 ${isScrolled ? 'h-[180px] -ml-4' : 'h-[230px] -ml-5'}`} 
            />
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-2 lg:gap-8">
            <div className="flex items-center gap-1 lg:gap-2">
              {navLinks.map((link) => (
                <Link 
                  key={link.name}
                  href={link.href} 
                  className="relative px-3 py-2 text-sm font-medium text-text-primary/80 hover:text-earth-primary transition-colors group outline-none"
                >
                  {link.name}
                  <span className="absolute inset-x-3 bottom-1 h-px bg-earth-primary/30 transform scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-300 ease-out" />
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-3 border-l border-earth-primary/10 pl-6">
              <Link 
                href="#schedule" 
                className="group flex items-center gap-2 text-earth-primary text-sm font-semibold px-5 py-2.5 rounded-full bg-earth-primary/5 hover:bg-earth-primary/10 active:scale-[0.97] transition-all duration-300 ease-out outline-none"
              >
                <span className="relative flex h-2 w-2">
                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                   <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Cek Jadwal
              </Link>
              <Link 
                href="#booking" 
                className="bg-earth-primary text-white text-sm font-semibold px-7 py-2.5 rounded-full hover:bg-earth-dark hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(139,94,60,0.2)] active:translate-y-0 active:scale-[0.97] active:shadow-none transition-all duration-300 ease-out outline-none"
              >
                Pesan Sekarang
              </Link>
            </div>
          </div>

          {/* Mobile Toggle */}
          <button 
            className="md:hidden text-text-primary outline-none p-2 active:scale-90 transition-transform" 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={26} strokeWidth={1.5} /> : <Menu size={26} strokeWidth={1.5} />}
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 200, damping: 25 }}
              className="absolute top-[calc(100%+1rem)] left-4 right-4 bg-white/90 backdrop-blur-2xl border border-white/60 shadow-[0_20px_40px_rgba(0,0,0,0.08)] rounded-[2rem] overflow-hidden md:hidden"
            >
              <div className="flex flex-col gap-2 p-6">
                {navLinks.map((link, idx) => (
                  <motion.div 
                    key={link.name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + (idx * 0.05) }}
                  >
                    <Link
                      href={link.href}
                      className="block text-lg font-medium text-text-primary hover:text-earth-primary py-3 px-4 rounded-xl hover:bg-earth-primary/5 transition-colors outline-none"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {link.name}
                    </Link>
                  </motion.div>
                ))}
                
                <div className="h-px w-full bg-gray-100 my-2" />
                
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex flex-col gap-3 mt-2"
                >
                  <Link 
                    href="#schedule" 
                    className="flex items-center justify-center gap-3 text-earth-primary py-3.5 rounded-full bg-earth-primary/5 font-semibold active:scale-[0.98] transition-transform outline-none"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <span className="relative flex h-2.5 w-2.5">
                       <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                       <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    Cek Jadwal Langsung
                  </Link>
                  <Link 
                    href="#booking" 
                    className="bg-earth-primary text-white py-3.5 rounded-full font-semibold text-center shadow-md active:scale-[0.98] transition-transform outline-none"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Pesan Sekarang
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </>
  );
};

export default Navbar;
