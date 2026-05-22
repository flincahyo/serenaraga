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
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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

const CheckIcon = ({ size = 20, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

export default function PartnershipPage() {
  const waLink = `https://wa.me/6289518359037?text=${encodeURIComponent('Halo Tim SerenaRaga! Saya tertarik untuk menjalin kerjasama/partnership. Bisakah kita diskusi lebih lanjut?')}`;
  const emailLink = 'mailto:hello@serenaraga.fit?subject=Partnership%20Inquiry%20-%20SerenaRaga';

  return (
    <main className="min-h-screen bg-[#faf9f6] font-sans">
      <Navbar />

      {/* --- HERO SECTION (Minimalist Clean) --- */}
      <section className="pt-28 pb-16 md:pt-36 md:pb-24 border-b border-black/5 bg-white px-5 md:px-0">
        <div className="container-custom max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-3 mb-8 px-4 py-2 bg-earth-primary/5 rounded-full border border-earth-primary/10 text-earth-primary">
            <span className="text-xs font-semibold tracking-widest uppercase">Kerjasama Strategis</span>
          </div>
          
          <h1 className="text-[32px] md:text-6xl font-serif text-[#2C1408] leading-tight mb-6">
            Tumbuh Bersama <br />
            <span className="italic text-earth-primary">SerenaRaga</span>
          </h1>
          
          <p className="text-zinc-600 text-base md:text-lg leading-relaxed max-w-2xl mx-auto mb-10">
            Kami membuka peluang kerjasama yang saling menguntungkan dengan berbagai pihak. Dari hospitality, korporat, hingga afiliasi — kolaborasi yang tepat menciptakan nilai lebih besar.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-full sm:w-auto gap-2 bg-[#2C1408] text-white px-8 py-3.5 rounded-md font-medium transition-colors hover:bg-earth-primary shadow-sm"
            >
              Diskusi via WhatsApp
            </a>
            <a
              href={emailLink}
              className="inline-flex items-center justify-center w-full sm:w-auto gap-2 bg-white text-[#2C1408] border border-black/10 px-8 py-3.5 rounded-md font-medium hover:bg-zinc-50 transition-colors"
            >
              Kirim Email
            </a>
          </div>
        </div>
      </section>

      {/* --- PARTNER TYPES SECTION --- */}
      <section className="py-16 md:py-24 bg-[#faf9f6] px-5 md:px-0">
        <div className="container-custom max-w-6xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl md:text-4xl font-serif text-[#2C1408] mb-3 md:mb-4">Model Kemitraan</h2>
            <div className="w-10 md:w-12 h-[2px] bg-earth-primary mx-auto" />
          </div>

          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {partnerTypes.map((type, idx) => (
              <div key={idx} className="bg-white p-8 rounded-xl border border-black/5 hover:border-earth-primary/20 transition-colors group">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 bg-[#faf9f6] rounded-md flex items-center justify-center text-earth-primary border border-black/5">
                    {type.icon}
                  </div>
                  <span className="text-xs font-mono font-bold text-zinc-300 group-hover:text-earth-primary transition-colors">{type.tag}</span>
                </div>
                <h3 className="text-lg font-bold text-[#2C1408] mb-1">{type.title}</h3>
                <p className="text-[10px] font-bold uppercase tracking-widest text-earth-primary/60 mb-4">{type.subtitle}</p>
                <p className="text-sm md:text-base text-zinc-600 leading-relaxed">{type.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- ADVANTAGES SECTION --- */}
      <section className="py-16 md:py-24 bg-white border-y border-black/5 px-5 md:px-0">
        <div className="container-custom max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-start">
            <div className="md:sticky md:top-32">
              <h2 className="text-3xl md:text-4xl font-serif text-[#2C1408] mb-6">Keunggulan Mitra <br className="hidden md:block"/> SerenaRaga</h2>
              <p className="text-zinc-600 text-base leading-relaxed">
                Kami membangun kemitraan berbasis kepercayaan dan hasil nyata. Setiap mitra mendapatkan dukungan penuh dari tim kami untuk memastikan kolaborasi berjalan lancar, efisien, dan memberikan nilai tambah yang maksimal.
              </p>
            </div>
            
            <div className="space-y-6 md:space-y-8">
              {advantages.map((adv, idx) => (
                <div key={idx} className="flex gap-5 items-start">
                  <div className="w-8 h-8 rounded-full bg-earth-primary/10 text-earth-primary flex items-center justify-center shrink-0 mt-0.5">
                    <CheckIcon size={16} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#2C1408] mb-2">{adv.title}</h3>
                    <p className="text-sm md:text-base text-zinc-600 leading-relaxed">{adv.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* --- CTA BOTTOM --- */}
      <section className="py-20 md:py-32 bg-[#2C1408] text-white px-5 md:px-0">
        <div className="container-custom max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-serif mb-6 leading-tight">
            Mari Mulai Percakapan
          </h2>
          <p className="text-zinc-300 text-sm md:text-base mb-10 leading-relaxed max-w-xl mx-auto">
            Ceritakan kebutuhan bisnis Anda dan kami akan menyusun proposal kerjasama yang tepat sasaran. Tidak ada komitmen di awal, hanya diskusi terbuka.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-full sm:w-auto gap-2 bg-white text-[#2C1408] px-8 py-3.5 rounded-md font-semibold transition-colors hover:bg-earth-primary hover:text-white"
            >
              Hubungi via WhatsApp
            </a>
            <a
              href={emailLink}
              className="inline-flex items-center justify-center w-full sm:w-auto gap-2 border border-white/20 text-white px-8 py-3.5 rounded-md font-medium hover:bg-white/10 transition-colors"
            >
              Email Proposal Anda
            </a>
          </div>
        </div>
      </section>

      <Footer />
      <FloatingWhatsApp />
    </main>
  );
}
