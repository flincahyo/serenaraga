import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import WhyChooseUs from "@/components/WhyChooseUs";
import Pricelist from "@/components/Pricelist";
import BookingForm from "@/components/BookingForm";

export default function Home() {
  return (
    <main className="min-h-screen">
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
      <BookingForm />

      {/* Footer */}
      <footer className="bg-text-primary text-white py-16">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row justify-between items-center gap-12">
            <div className="text-center md:text-left">
              <h2 className="text-3xl font-serif font-bold mb-3 tracking-tight">
                Serena<span className="text-earth-primary">Raga</span>
              </h2>
              <p className="text-white/40 text-sm max-w-xs">
                Luxury home massage service that brings tranquility to your doorstep.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-10 text-sm font-medium uppercase tracking-widest text-white/60">
              <a href="#home" className="hover:text-white transition-colors">Beranda</a>
              <a href="#menu" className="hover:text-white transition-colors">Menu</a>
              <a href="#booking" className="hover:text-white transition-colors">Pemesanan</a>
            </div>

            <div className="text-center md:text-right">
              <p className="text-sm font-bold text-earth-primary mb-2">Hubungi Kami</p>
              <p className="text-white/80">+62 895-1835-9037</p>
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
