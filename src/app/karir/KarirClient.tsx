'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FloatingWhatsApp from '@/components/FloatingWhatsApp';
import { useSettings } from '@/lib/settings';

const benefits = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    title: 'Jadwal Fleksibel',
    desc: 'Atur sendiri jam kerja sesuai ketersediaan dan kondisi Anda. Tidak ada target harian yang kaku.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
    title: 'Penghasilan Menarik',
    desc: 'Sistem komisi transparan dan kompetitif. Semakin banyak sesi, semakin besar pendapatan.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
    title: 'Pelatihan Profesional',
    desc: 'Pembekalan teknik pijat dan standar pelayanan untuk siap memberikan pengalaman terbaik.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    title: 'Lingkungan Aman',
    desc: 'Setiap sesi dipantau dan dijamin keamanannya demi kenyamanan terapis.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: 'Komunitas Suportif',
    desc: 'Bergabung dengan rekan terapis untuk saling mendukung dan berkembang bersama.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    title: 'Klien Konsisten',
    desc: 'Platform kami aktif menghasilkan booking. Tidak perlu pusing mencari klien sendiri.',
  },
];

const requirements = [
  'Berjenis kelamin perempuan atau laki-laki.',
  'Memiliki KTP yang masih berlaku.',
  'Berdomisili di area layanan operasional Yogyakarta dan sekitarnya.',
  'Pengalaman minimal 1 tahun di bidang pijat/spa (sertifikat diutamakan).',
  'Berpenampilan rapi, bersih, dan komunikatif.',
  'Memiliki kendaraan pribadi untuk mobilitas ke lokasi klien.',
];

export default function KarirClient() {
  const { settings, loading } = useSettings();
  
  const waNumber = settings['whatsapp_number'] || '6289518359037';
  const waLink = `https://wa.me/${waNumber}?text=${encodeURIComponent('Halo Admin SerenaRaga! Saya tertarik untuk bergabung sebagai terapis. Bisakah saya mendapatkan informasi lebih lanjut?')}`;

  const posterImage = settings['career_poster_image'];

  if (loading) {
    return <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center">Memuat...</div>;
  }

  return (
    <main className="min-h-screen bg-[#faf9f6] font-sans">
      <Navbar />

      {/* --- HERO SECTION (Minimalist Clean) --- */}
      <section className="relative pt-28 pb-16 md:pt-32 md:pb-24 border-b border-black/5 bg-white px-5 md:px-0">
        <div className="container-custom relative z-10 max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-3 mb-8 px-4 py-2 bg-earth-primary/5 rounded-full border border-earth-primary/10 text-earth-primary">
            <span className="w-2 h-2 rounded-full bg-earth-primary animate-pulse" />
            <span className="text-xs font-semibold tracking-wider uppercase">Open Recruitment</span>
          </div>
          
          <h1 className="text-[32px] md:text-6xl font-serif text-[#2C1408] leading-tight mb-4 md:mb-6">
            Bergabung Bersama <br /> Tim Terapis <span className="italic text-earth-primary">SerenaRaga</span>
          </h1>
          
          <p className="text-zinc-600 text-base md:text-lg leading-relaxed max-w-2xl mx-auto mb-8 md:mb-10">
            Jadikan passion-mu sebagai sumber penghasilan yang fleksibel. Kami mencari individu berdedikasi untuk memberikan pengalaman relaksasi terbaik di setiap rumah.
          </p>
          
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-[#2C1408] text-white px-8 py-3.5 rounded-md font-medium transition-colors hover:bg-earth-primary shadow-sm"
          >
            Hubungi Admin via WhatsApp
          </a>
        </div>
      </section>

      {/* --- RECRUITMENT POSTER SECTION (IF UPLOADED) --- */}
      {posterImage && (
        <section className="py-12 md:py-20 bg-[#faf9f6] px-5 md:px-0">
          <div className="container-custom max-w-3xl mx-auto">
             <div className="bg-white p-4 shadow-sm border border-black/5 rounded-xl">
              <img src={posterImage} alt="Poster Lowongan" className="w-full h-auto rounded-lg" />
             </div>
          </div>
        </section>
      )}

      {/* --- SIMPLE BENEFITS GRID --- */}
      <section className="py-16 md:py-24 bg-white border-y border-black/5 px-5 md:px-0">
        <div className="container-custom max-w-6xl mx-auto">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-2xl md:text-4xl font-serif text-[#2C1408] mb-3 md:mb-4">Mengapa Memilih Kami?</h2>
            <div className="w-10 md:w-12 h-[2px] bg-earth-primary mx-auto" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-8">
            {benefits.map((item, idx) => (
              <div key={idx} className="bg-[#faf9f6] p-6 md:p-8 rounded-xl border border-black/5">
                <div className="w-12 h-12 bg-white rounded-md flex items-center justify-center text-earth-primary mb-5 shadow-sm border border-black/5">
                  {item.icon}
                </div>
                <h3 className="text-lg font-semibold text-[#2C1408] mb-2">{item.title}</h3>
                <p className="text-sm text-zinc-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- SIMPLE REQUIREMENTS LIST --- */}
      <section className="py-16 md:py-24 bg-[#faf9f6] px-5 md:px-0">
        <div className="container-custom max-w-4xl mx-auto">
          <div className="bg-white p-6 sm:p-10 md:p-14 rounded-2xl shadow-sm border border-black/5">
            <h2 className="text-2xl md:text-3xl font-serif text-[#2C1408] mb-6 md:mb-8 text-center md:text-left">Persyaratan Terapis</h2>
            
            <div className="space-y-4">
              {requirements.map((req, idx) => (
                <div key={idx} className="flex gap-4 items-start pb-4 border-b border-black/5 last:border-0 last:pb-0">
                  <div className="w-6 h-6 rounded-full bg-earth-primary/10 text-earth-primary flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={14} strokeWidth={3} />
                  </div>
                  <p className="text-sm md:text-base text-zinc-700 leading-relaxed">{req}</p>
                </div>
              ))}
            </div>

            <div className="mt-10 md:mt-12 p-6 md:p-8 bg-[#2C1408] rounded-xl text-center text-white flex flex-col items-center">
              <h3 className="text-lg md:text-xl font-serif mb-2">Siap bergabung dengan tim kami?</h3>
              <p className="text-zinc-300 text-xs md:text-sm mb-6">Proses seleksi transparan, cepat, dan ramah.</p>
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white text-[#2C1408] px-6 py-2.5 rounded-md font-semibold hover:bg-earth-primary hover:text-white transition-colors"
              >
                Daftar Sekarang
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <FloatingWhatsApp />
    </main>
  );
}

// Minimalist check icon component since we removed lucide-react import at the top
const Check = ({ size = 24, strokeWidth = 2, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);
