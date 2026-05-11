import { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FloatingWhatsApp from '@/components/FloatingWhatsApp';

export const metadata: Metadata = {
  title: 'Partnership | SerenaRaga Home Massage',
  description: 'Jalin kerjasama strategis dengan SerenaRaga. Ideal untuk hotel, villa, korporat, dan afiliasi yang ingin menawarkan layanan premium home massage kepada klien mereka.',
};

const partnerTypes = [
  {
    tag: '01',
    title: 'Hotel & Villa',
    subtitle: 'Hospitality Integration',
    desc: 'Tingkatkan nilai layanan properti Anda dengan menawarkan sesi pijat on-demand untuk tamu. Kami menyediakan terapis profesional yang siap hadir sesuai permintaan reservasi.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    tag: '02',
    title: 'Korporat & Kantor',
    subtitle: 'Corporate Wellness',
    desc: 'Hadirkan program wellness untuk tim Anda. Dari sesi pijat santai antar jadwal rapat, hingga program bulanan untuk menjaga produktivitas dan kesehatan karyawan.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
  },
  {
    tag: '03',
    title: 'Afiliasi & Reseller',
    subtitle: 'Revenue Partnership',
    desc: 'Rekomendasikan layanan SerenaRaga kepada audiens atau komunitas Anda, dan dapatkan komisi untuk setiap booking yang berhasil. Cocok untuk influencer, komunitas wellness, atau travel agent.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
      </svg>
    ),
  },
];

const advantages = [
  { title: 'Terapis Terstandarisasi', desc: 'Seluruh terapis kami telah terseleksi, terlatih, dan memiliki standar pelayanan yang konsisten.' },
  { title: 'Sistem Booking Mudah', desc: 'Integrasi layanan yang simpel via WhatsApp atau dapat disesuaikan dengan sistem reservasi Anda.' },
  { title: 'Fleksibel & Skalabel', desc: 'Dari acara kecil hingga program reguler berskala besar, kami siap menyesuaikan kebutuhan mitra.' },
  { title: 'Harga Kompetitif', desc: 'Skema harga kerjasama yang transparan dan saling menguntungkan untuk jangka panjang.' },
];

export default function PartnershipPage() {
  const waLink = `https://wa.me/6289518359037?text=${encodeURIComponent('Halo Tim SerenaRaga! Saya tertarik untuk menjalin kerjasama/partnership. Bisakah kita diskusi lebih lanjut?')}`;
  const emailLink = 'mailto:hello@serenaraga.fit?subject=Partnership%20Inquiry%20-%20SerenaRaga';

  return (
    <main className="min-h-screen bg-bg-cream">
      <Navbar />

      {/* Hero */}
      <section className="pt-36 pb-24 px-4 bg-bg-cream relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-earth-primary/5 -skew-x-12 translate-x-1/4 pointer-events-none" />
        <div className="container-custom relative z-10 max-w-4xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-[1px] bg-earth-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-earth-primary">Kerjasama Strategis</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-serif italic text-text-primary leading-tight mb-6">
            Tumbuh Bersama <br />
            <span className="text-earth-primary">SerenaRaga</span>
          </h1>
          <p className="text-text-secondary text-lg leading-relaxed max-w-2xl mb-10">
            Kami membuka peluang kerjasama yang saling menguntungkan dengan berbagai pihak. Dari hospitality, korporat, hingga afiliasi — kami percaya kolaborasi yang tepat menciptakan nilai lebih besar bagi semua pihak.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 bg-earth-primary text-white px-8 py-4 rounded-full font-bold shadow-lg shadow-earth-primary/20 hover:-translate-y-1 hover:shadow-xl transition-all"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
              Diskusi via WhatsApp
            </a>
            <a
              href={emailLink}
              className="inline-flex items-center justify-center gap-3 bg-white/80 text-earth-primary border border-earth-primary/20 px-8 py-4 rounded-full font-bold hover:bg-white hover:-translate-y-1 transition-all"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg>
              Kirim Email
            </a>
          </div>
        </div>
      </section>

      {/* Partner Types */}
      <section className="py-20 bg-white">
        <div className="container-custom max-w-5xl">
          <div className="mb-12">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-8 h-[1px] bg-earth-primary" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-earth-primary">Model Kerjasama</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-serif italic text-text-primary">Tipe Partnership yang Kami Tawarkan</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {partnerTypes.map((type, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-md hover:border-earth-primary/20 transition-all duration-300 group">
                <div className="flex items-start justify-between mb-6">
                  <div className="text-earth-primary">{type.icon}</div>
                  <span className="text-[11px] font-black text-gray-200 group-hover:text-earth-primary/30 transition-colors">{type.tag}</span>
                </div>
                <h3 className="text-lg font-bold text-text-primary mb-1">{type.title}</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-earth-primary/50 mb-4">{type.subtitle}</p>
                <p className="text-sm text-text-secondary leading-relaxed">{type.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Advantages */}
      <section className="py-20 bg-bg-cream/50">
        <div className="container-custom max-w-4xl">
          <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-start">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-8 h-[1px] bg-earth-primary" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-earth-primary">Keunggulan Mitra</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-serif italic text-text-primary mb-4">Kenapa Bermitra dengan Kami?</h2>
              <p className="text-text-secondary text-sm leading-relaxed">
                Kami membangun kemitraan berbasis kepercayaan dan hasil nyata. Setiap mitra mendapatkan dukungan penuh dari tim kami untuk memastikan kolaborasi berjalan lancar dan berkelanjutan.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-5">
              {advantages.map((adv, idx) => (
                <div key={idx} className="flex gap-5 items-start">
                  <div className="mt-1 w-1 h-8 bg-earth-primary/30 rounded-full shrink-0" />
                  <div>
                    <h3 className="text-sm font-bold text-text-primary mb-1">{adv.title}</h3>
                    <p className="text-xs text-text-secondary leading-relaxed">{adv.desc}</p>
                  </div>
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
            Mari Mulai Percakapan
          </h2>
          <p className="text-white/60 text-sm md:text-base mb-10 leading-relaxed max-w-xl mx-auto">
            Ceritakan kebutuhan bisnis Anda dan kami akan menyusun proposal kerjasama yang tepat sasaran. Tidak ada komitmen di awal, hanya diskusi terbuka.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 bg-earth-primary text-white px-8 py-4 rounded-full font-bold shadow-lg hover:-translate-y-1 transition-all"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
              WhatsApp Kami
            </a>
            <a
              href={emailLink}
              className="inline-flex items-center justify-center gap-3 border border-white/20 text-white/80 px-8 py-4 rounded-full font-bold hover:bg-white/5 hover:-translate-y-1 transition-all"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg>
              hello@serenaraga.fit
            </a>
          </div>
        </div>
      </section>

      <Footer />
      <FloatingWhatsApp />
    </main>
  );
}
