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
import Footer from "@/components/Footer";
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

      <Footer />
    </main>
  );
}
