'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase';
import { MessageCircleHeart } from 'lucide-react';

const TestimonialsCarousel = () => {
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const fetchTestimonials = async () => {
      const supabase = createClient();
      const { data } = await supabase.from('settings').select('value').eq('key', 'whatsapp_testimonials').single();

      if (data && data.value) {
        try {
          const parsed = JSON.parse(data.value);
          setImages(parsed);
        } catch (e) {
          console.error('Failed parsing testimonials');
        }
      }
      setLoading(false);
    };

    fetchTestimonials();
  }, []);

  useEffect(() => {
    if (carouselRef.current) {
      // Calculate total width of the original gallery to scroll seamlessly
      setWidth(carouselRef.current.scrollWidth / 2);
    }
  }, [images]);

  if (loading || images.length === 0) return null;

  // Duplicate images exactly once to create a flawless infinite loop
  const duplicatedImages = [...images, ...images];

  return (
    <section id="testimonials" className="py-24 bg-bg-cream/50 overflow-hidden border-y border-earth-primary/5">
      <div className="container-custom text-center mb-16">
        <motion.span
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-earth-primary/10 text-earth-primary text-[10px] font-black uppercase tracking-widest mb-4"
        >
          <MessageCircleHeart size={14} /> Kata Mereka
        </motion.span>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-4xl mb-4 font-serif italic text-text-primary"
        >
          Cerita <span className="text-earth-primary">Nyaman</span> Pelanggan
        </motion.h2>
        <p className="text-text-secondary text-sm max-w-xl mx-auto">
          Real Testimoni dari pelanggan kami yang telah relaksasi nyaman di dalam rumah mereka sendiri.
        </p>
      </div>

      <div className="relative w-full max-w-[100vw] overflow-hidden flex items-center">
        {/* Left/Right Fading Gradients */}
        <div className="absolute left-0 top-0 bottom-0 w-16 md:w-40 bg-gradient-to-r from-bg-cream/50 to-transparent z-10 pointer-events-none"></div>
        <div className="absolute right-0 top-0 bottom-0 w-16 md:w-40 bg-gradient-to-l from-bg-cream/50 to-transparent z-10 pointer-events-none"></div>

        <motion.div
          ref={carouselRef}
          className="flex gap-6 md:gap-8 px-4 pr-10 md:pr-12 w-max"
          animate={{ x: width ? [0, -width] : 0 }}
          transition={{
            repeat: Infinity,
            ease: "linear",
            duration: images.length * 6, // Smooth dynamic duration
          }}
        >
          {duplicatedImages.map((src, i) => (
            <div
              key={i}
              className="relative w-[200px] sm:w-[240px] md:w-[280px] aspect-[9/16] shrink-0 rounded-[2rem] overflow-hidden shadow-xl border-4 border-white/60 group"
            >
              <img
                src={src}
                alt={`Ulasan SerenaRaga ${i}`}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/5 pointer-events-none"></div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialsCarousel;
