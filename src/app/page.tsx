import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import WhyChooseUs from "@/components/WhyChooseUs";
import Pricelist from "@/components/Pricelist";
import BookingForm from "@/components/BookingForm";
import FAQ from "@/components/FAQ";
import TestimonialsCarousel from "@/components/TestimonialsCarousel";
import PublicScheduleWidget from "@/components/PublicScheduleWidget";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import Philosophy from "@/components/Philosophy";
import Footer from "@/components/Footer";
import Image from 'next/image';
import SmoothScroll from "@/components/SmoothScroll";

export default function Home() {
  return (
    <SmoothScroll>
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
        <Philosophy />
        <WhyChooseUs />
        <Pricelist />
        <TestimonialsCarousel />
        <FAQ />
        <PublicScheduleWidget />
        <BookingForm />
        <FloatingWhatsApp />

        <Footer />
      </main>
    </SmoothScroll>
  );
}
