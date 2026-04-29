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
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Beranda', href: '#home' },
    { name: 'Menu Layanan', href: '#menu' },
    { name: 'Tentang', href: '#about' },
    { name: 'Booking', href: '#booking' },
  ];

  return (
    <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${
      isScrolled ? 'bg-white/80 backdrop-blur-md shadow-sm py-4' : 'bg-transparent py-6'
    }`}>
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center text-text-primary">
        <Link href="/" className="relative flex items-center justify-start h-[50px] w-[200px] overflow-hidden -ml-2">
          <Image 
            src="/serenalogo2.svg" 
            alt="SerenaRaga" 
            width={200}
            height={230}
            priority
            className="absolute h-[230px] w-auto max-w-none object-contain -ml-5" 
          />
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link 
              key={link.name}
              href={link.href} 
              className="text-sm font-medium hover:text-earth-primary transition-colors"
            >
              {link.name}
            </Link>
          ))}
          <div className="flex items-center gap-3">
            <Link 
              href="#schedule" 
              className="group flex items-center gap-2 text-earth-primary text-sm font-medium px-5 py-2 rounded-full border border-earth-primary/20 bg-earth-primary/5 hover:bg-earth-primary/10 transition-all"
            >
              <span className="relative flex h-2 w-2">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Cek Jadwal
            </Link>
            <Link 
              href="#booking" 
              className="bg-earth-primary text-white text-sm font-medium px-6 py-2.5 rounded-full hover:bg-earth-dark transition-all transform hover:-translate-y-0.5 shadow-sm hover:shadow-md"
            >
              Pesan Sekarang
            </Link>
          </div>
        </div>

        {/* Mobile Toggle */}
        <button 
          className="md:hidden text-text-primary focus:outline-none" 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-gray-100 overflow-hidden"
          >
            <div className="flex flex-col gap-6 p-8 text-center">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-lg font-medium text-text-primary hover:text-earth-primary"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              <div className="flex flex-col gap-3 mt-4">
                <Link 
                  href="#schedule" 
                  className="flex items-center justify-center gap-3 text-earth-primary py-3 rounded-full border border-earth-primary/20 bg-earth-primary/5 font-medium"
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
                  className="bg-earth-primary text-white py-3 rounded-full font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Pesan Sekarang
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
