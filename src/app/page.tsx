import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import WhyChooseUs from "@/components/WhyChooseUs";
import Pricelist from "@/components/Pricelist";
import BookingForm from "@/components/BookingForm";
import FAQ from "@/components/FAQ";
import TestimonialsCarousel from "@/components/TestimonialsCarousel";
import PublicScheduleWidget from "@/components/PublicScheduleWidget";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import Image from 'next/image';

export default function Home() {
  return (
    <main className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "HealthAndBeautyBusiness",
            "name": "SerenaRaga - Layanan Home Massage Jogja",
            "image": "https://serenaraga.fit/serenalogo.svg",
            "description": "Layanan pijat panggilan ke rumah yang nyaman dan privat di wilayah Yogyakarta, Sleman, dan Bantul.",
            "url": "https://serenaraga.fit",
            "telephone": "+6289518359037",
            "priceRange": "Rp",
            "address": {
              "@type": "PostalAddress",
              "addressLocality": "Yogyakarta",
              "addressRegion": "Daerah Istimewa Yogyakarta",
              "addressCountry": "ID"
            },
            "areaServed": [
              { "@type": "City", "name": "Yogyakarta" },
              { "@type": "City", "name": "Sleman" },
              { "@type": "City", "name": "Bantul" }
            ]
          })
        }}
      />
      <Navbar />
      <Hero />
      <div id="about" className="py-24 bg-white border-y border-gray-50 scroll-mt-24">
        <div className="container-custom text-center">
          <h2 className="text-3xl md:text-4xl mb-8 italic font-serif">Ketenangan di Setiap Sentuhan</h2>
          <p className="max-w-2xl mx-auto text-text-secondary leading-relaxed">
            SerenaRaga terlahir dari keinginan untuk menghidupkan kembali harmoni antara tubuh dan jiwa.
            Kami percaya bahwa perawatan diri terbaik adalah yang dilakukan dalam ruang privat yang paling
            nyaman bagi Anda—rumah sendiri.
          </p>
        </div>
      </div>
      <WhyChooseUs />
      <Pricelist />
      <TestimonialsCarousel />
      <FAQ />
      <PublicScheduleWidget />
      <BookingForm />
      <FloatingWhatsApp />

      {/* Footer */}
      <footer className="bg-text-primary text-white py-16">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row justify-between items-center gap-12">
            <div className="text-center md:text-left">
              <div className="relative flex items-center justify-center md:justify-start h-[50px] w-[220px] overflow-hidden mb-4 mx-auto md:mx-0">
                <Image 
                  src="/serenalogo2.svg" 
                  alt="SerenaRaga" 
                  width={220}
                  height={250}
                  className="absolute h-[250px] w-auto max-w-none object-contain -ml-5 brightness-0 invert opacity-90" 
                />
              </div>
              <p className="text-white/40 text-sm max-w-xs">
                Layanan massage panggilan yang nyaman dan terpercaya untuk kesejahteraan raga Anda.
              </p>
              <div className="mt-4 text-white/50 text-xs font-semibold">
                Area Layanan: Kota Yogyakarta, Sleman, & Bantul
              </div>
            </div>

            <div className="flex flex-col items-center md:items-end">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-earth-primary mb-4">Follow Kami</p>
              <div className="flex gap-6">
                <a 
                  href="https://www.instagram.com/serena.raga/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center border border-white/10 hover:bg-earth-primary hover:border-earth-primary transition-all group"
                  aria-label="Instagram"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/60 group-hover:text-white transition-colors">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                </a>
                <a 
                  href="https://www.threads.net/@serena.raga" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center border border-white/10 hover:bg-earth-primary hover:border-earth-primary transition-all group"
                  aria-label="Threads"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/60 group-hover:text-white transition-colors">
                    <path d="M12 12c-3 0-5.5-2.5-5.5-5.5S9 1 12 1s5.5 2.5 5.5 5.5S15 12 12 12Z" opacity="0.3"></path>
                    <path d="M12 2c5.5 0 10 4.5 10 10s-4.5 10-10 10S2 17.5 2 12"></path>
                    <path d="M12 12c2 0 4-2 4-4s-2-4-4-4-4 2-4 4 2 4 4 4Z"></path>
                  </svg>
                </a>
              </div>
              <div className="mt-8 text-center md:text-right">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-earth-primary mb-2">Hubungi Kami</p>
                <p className="text-white/80 font-medium">+62 895-1835-9037</p>
              </div>
            </div>
          </div>

          <div className="mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] uppercase tracking-[0.2em] text-white/20">
            <p>&copy; 2026 SerenaRaga Home Massage. All rights reserved.</p>
            <p className="flex gap-4">
              <span>Privacy Policy</span>
              <span>Terms of Service</span>
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
