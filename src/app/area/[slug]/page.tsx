import { Metadata } from 'next';
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import WhyChooseUs from "@/components/WhyChooseUs";
import Pricelist from "@/components/Pricelist";
import BookingForm from "@/components/BookingForm";
import FAQ from "@/components/FAQ";
import TestimonialsCarousel from "@/components/TestimonialsCarousel";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import Philosophy from "@/components/Philosophy";
import Image from 'next/image';

const areas: Record<string, { label: string; desc: string }> = {
  'pijat-panggilan-sleman': { label: 'Sleman', desc: 'Layanan home massage nyaman dan privat di wilayah Sleman. Pulihkan energi Anda tanpa harus keluar rumah.' },
  'pijat-panggilan-bantul': { label: 'Bantul', desc: 'Pijat panggilan profesional ke rumah area Bantul. Relaksasi sempurna dengan terapis ahli SerenaRaga.' },
  'pijat-panggilan-jogja': { label: 'Yogyakarta', desc: 'Layanan pijat panggilan terpercaya di Kota Yogyakarta. Hadirkan relaksasi yang tenang langsung ke hunian Anda.' }
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const area = areas[resolvedParams.slug] || { label: 'Yogyakarta', desc: '' };
  
  return {
    title: `SerenaRaga - Pijat Panggilan ${area.label} Nyaman & Private`,
    description: area.desc || `Layanan pijat panggilan ke rumah di wilayah ${area.label}.`,
    keywords: [`pijat panggilan ${area.label.toLowerCase()}`, `massage ${area.label.toLowerCase()}`, "home massage", "pijat relaksasi"],
    openGraph: {
      title: `SerenaRaga - Pijat Panggilan ${area.label}`,
      description: area.desc,
      url: `https://serenaraga.fit/area/${resolvedParams.slug}`
    }
  };
}

export default async function AreaPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const area = areas[resolvedParams.slug] || { label: 'Yogyakarta & Sekitarnya' };

  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero locationName={area.label} />
      <Philosophy />
      <WhyChooseUs />
      <Pricelist />
      <TestimonialsCarousel />
      <FAQ />
      <BookingForm />
      <FloatingWhatsApp />

      <footer className="bg-text-primary text-white py-16 md:py-24 border-t border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-5 mix-blend-overlay pointer-events-none"></div>
        <div className="container-custom relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-16 md:gap-8">
            {/* Logo & Description */}
            <div className="md:col-span-5 text-center md:text-left flex flex-col items-center md:items-start">
              <div className="relative flex items-center justify-center md:justify-start h-[50px] w-[220px] overflow-hidden mb-6">
                <Image 
                  src="/serenalogo2.svg" 
                  alt="SerenaRaga" 
                  width={220}
                  height={250}
                  className="absolute h-[250px] w-auto max-w-none object-contain -ml-5 brightness-0 invert opacity-90" 
                />
              </div>
              <p className="text-white/50 text-sm max-w-sm leading-relaxed mb-6">
                Layanan massage panggilan eksklusif yang membawa relaksasi optimal langsung ke kenyamanan rumah Anda.
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/70 text-xs font-medium">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                Spesialis Area: {area.label}
              </div>
            </div>

            {/* Hubungi Kami */}
            <div className="md:col-span-3 flex flex-col items-center md:items-start text-center md:text-left">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-earth-primary mb-6">Hubungi Kami</p>
              <div className="flex flex-col gap-4">
                <a href="https://wa.me/6289518359037" className="flex items-center gap-3 text-white/70 hover:text-white transition-colors group">
                  <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center border border-white/10 group-hover:bg-green-600 group-hover:border-green-500 transition-all">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                  </div>
                  <span className="font-medium tracking-wide">+62 895-1835-9037</span>
                </a>
                <a href="mailto:hello@serenaraga.fit" className="flex items-center gap-3 text-white/70 hover:text-white transition-colors group">
                  <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center border border-white/10 group-hover:bg-earth-primary group-hover:border-earth-primary transition-all">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg>
                  </div>
                  <span className="font-medium tracking-wide">hello@serenaraga.fit</span>
                </a>
              </div>
            </div>

            {/* Follow Kami */}
            <div className="md:col-span-4 flex flex-col items-center md:items-end text-center md:text-right">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-earth-primary mb-6">Follow Kami</p>
              <div className="flex gap-4">
                <a href="https://www.instagram.com/serena.raga/" target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center border border-white/10 hover:bg-earth-primary hover:border-earth-primary hover:-translate-y-1 transition-all duration-300 group" aria-label="Instagram">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/60 group-hover:text-white transition-colors"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                </a>
                <a href="https://www.facebook.com/serenaraga/" target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center border border-white/10 hover:bg-earth-primary hover:border-earth-primary hover:-translate-y-1 transition-all duration-300 group" aria-label="Facebook">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/60 group-hover:text-white transition-colors"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                </a>
                <a href="https://www.tiktok.com/@serena.raga" target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center border border-white/10 hover:bg-earth-primary hover:border-earth-primary hover:-translate-y-1 transition-all duration-300 group" aria-label="TikTok">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/60 group-hover:text-white transition-colors"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5v3a3 3 0 0 1-3-3"></path></svg>
                </a>
                <a href="https://www.threads.net/@serena.raga" target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center border border-white/10 hover:bg-earth-primary hover:border-earth-primary hover:-translate-y-1 transition-all duration-300 group" aria-label="Threads">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/60 group-hover:text-white transition-colors"><circle cx="12" cy="12" r="4"></circle><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8"></path></svg>
                </a>
              </div>
            </div>
          </div>

          <div className="mt-20 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] uppercase tracking-[0.2em] text-white/30 font-semibold">
            <p>&copy; {new Date().getFullYear()} SerenaRaga Home Massage. All rights reserved.</p>
            <p className="flex gap-6">
              <span className="hover:text-earth-primary transition-colors cursor-pointer">Privacy Policy</span>
              <span className="hover:text-earth-primary transition-colors cursor-pointer">Terms of Service</span>
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
