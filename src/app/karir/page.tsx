import { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FloatingWhatsApp from '@/components/FloatingWhatsApp';

export const metadata: Metadata = {
  title: 'Karir Terapis | SerenaRaga Home Massage',
  description: 'Bergabunglah bersama tim terapis profesional SerenaRaga. Dapatkan penghasilan fleksibel, lingkungan kerja yang aman, dan dukungan pelatihan berkelanjutan.',
};

const benefits = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    title: 'Jadwal Fleksibel',
    desc: 'Atur sendiri jam kerja sesuai ketersediaan dan kondisi Anda. Tidak ada target jam kerja harian yang kaku.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
    title: 'Penghasilan Menarik',
    desc: 'Sistem komisi yang transparan dan kompetitif. Semakin banyak sesi, semakin besar pendapatan Anda.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
    title: 'Pelatihan Profesional',
    desc: 'Kami menyediakan pembekalan teknik pijat dan standar pelayanan agar kamu siap memberikan pengalaman terbaik.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    title: 'Lingkungan Aman',
    desc: 'Setiap sesi dipantau dan dijamin keamanannya. Kami memastikan kenyamanan terapis adalah prioritas utama.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: 'Komunitas Suportif',
    desc: 'Bergabunglah dengan komunitas terapis yang saling mendukung, berbagi pengalaman, dan berkembang bersama.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    title: 'Klien Konsisten',
    desc: 'Platform kami aktif menghasilkan booking setiap hari. Tidak perlu pusing mencari klien sendiri.',
  },
];

const requirements = [
  'Berjenis kelamin perempuan (untuk terapis wanita) atau laki-laki (untuk terapis pria)',
  'Memiliki KTP yang masih berlaku dan berdomisili di Yogyakarta, Sleman, atau Bantul',
  'Memiliki sertifikat pijat / kursus refleksi (diutamakan, namun bukan keharusan)',
  'Pengalaman minimal 1 tahun di bidang pijat, spa, atau perawatan tubuh',
  'Berpenampilan rapi, komunikatif, dan menjaga profesionalisme',
  'Memiliki kendaraan pribadi sebagai transportasi menuju lokasi klien',
];

export default function KarirPage() {
  const waLink = `https://wa.me/6289518359037?text=${encodeURIComponent('Halo Admin SerenaRaga! Saya tertarik untuk bergabung sebagai terapis. Bisakah saya mendapatkan informasi lebih lanjut?')}`;

  return (
    <main className="min-h-screen bg-bg-cream">
      <Navbar />

      {/* Hero */}
      <section className="pt-36 pb-24 px-4 bg-bg-cream relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-earth-primary/5 -skew-x-12 translate-x-1/4 pointer-events-none" />
        <div className="container-custom relative z-10 max-w-4xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-[1px] bg-earth-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-earth-primary">Karir & Bergabung</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-serif italic text-text-primary leading-tight mb-6">
            Jadilah Bagian dari <br />
            <span className="text-earth-primary">Keluarga SerenaRaga</span>
          </h1>
          <p className="text-text-secondary text-lg leading-relaxed max-w-2xl mb-10">
            Kami mencari terapis profesional yang berdedikasi untuk memberikan pengalaman relaksasi terbaik bagi pelanggan kami. Jadikan passion-mu sumber penghasilan yang fleksibel dan menyenangkan.
          </p>
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-earth-primary text-white px-8 py-4 rounded-full font-bold shadow-lg shadow-earth-primary/20 hover:-translate-y-1 hover:shadow-xl transition-all"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
            Daftar Sekarang via WhatsApp
          </a>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-white">
        <div className="container-custom max-w-5xl">
          <div className="mb-12">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-8 h-[1px] bg-earth-primary" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-earth-primary">Mengapa Bergabung</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-serif italic text-text-primary">Keuntungan Menjadi Terapis SerenaRaga</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {benefits.map((item, idx) => (
              <div key={idx} className="bg-white rounded-xl p-5 md:p-6 border border-gray-100 shadow-sm hover:shadow-md hover:border-earth-primary/20 transition-all duration-300">
                <div className="mb-4 text-earth-primary">{item.icon}</div>
                <h3 className="text-sm md:text-base font-bold text-text-primary mb-2">{item.title}</h3>
                <p className="text-xs md:text-sm text-text-secondary leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="py-20 bg-bg-cream/50">
        <div className="container-custom max-w-4xl">
          <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-start">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-8 h-[1px] bg-earth-primary" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-earth-primary">Persyaratan</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-serif italic text-text-primary mb-4">Siapa yang Kami Cari?</h2>
              <p className="text-text-secondary text-sm leading-relaxed">
                Kami tidak hanya mencari terapis yang terampil, tapi juga yang memiliki integritas dan semangat melayani. Jika kamu memenuhi kriteria di bawah, kami ingin mendengar dari kamu!
              </p>
            </div>
            <div className="space-y-4">
              {requirements.map((req, idx) => (
                <div key={idx} className="flex items-start gap-4">
                  <div className="mt-0.5 w-5 h-5 rounded-full bg-earth-primary/10 border border-earth-primary/20 flex items-center justify-center shrink-0">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-earth-primary"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed">{req}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Bottom */}
      <section className="py-20 bg-text-primary text-white">
        <div className="container-custom max-w-3xl text-center">
          <h2 className="text-3xl md:text-5xl font-serif italic mb-6 leading-tight">
            Siap Memulai Perjalananmu?
          </h2>
          <p className="text-white/60 text-sm md:text-base mb-10 leading-relaxed max-w-xl mx-auto">
            Kirimkan pesan ke Admin kami sekarang dan kami akan menjelaskan proses selanjutnya. Proses seleksi singkat, transparan, dan ramah.
          </p>
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-earth-primary text-white px-8 py-4 rounded-full font-bold shadow-lg hover:-translate-y-1 transition-all"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
            Hubungi Admin Sekarang
          </a>
        </div>
      </section>

      <Footer />
      <FloatingWhatsApp />
    </main>
  );
}
