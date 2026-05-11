import { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Kebijakan Privasi | SerenaRaga Home Massage',
  description: 'Pelajari bagaimana SerenaRaga mengumpulkan, menggunakan, dan melindungi data pribadi pelanggan sesuai dengan peraturan yang berlaku.',
};

const sections = [
  {
    title: '1. Informasi yang Kami Kumpulkan',
    content: [
      'Nama lengkap dan identitas diri yang Anda berikan saat melakukan pemesanan.',
      'Nomor telepon atau WhatsApp untuk keperluan konfirmasi, koordinasi jadwal, dan komunikasi layanan.',
      'Alamat lengkap lokasi terapi untuk kebutuhan penugasan terapis ke lokasi Anda.',
      'Riwayat pemesanan dan preferensi layanan untuk meningkatkan kualitas pelayanan kami.',
      'Informasi kesehatan yang Anda sampaikan secara sukarela (kondisi medis, alergi) yang relevan dengan keamanan sesi terapi.',
    ],
  },
  {
    title: '2. Cara Kami Menggunakan Data Anda',
    content: [
      'Memproses dan mengkonfirmasi pemesanan layanan yang Anda lakukan.',
      'Mengkoordinasikan jadwal dan penugasan terapis ke lokasi Anda.',
      'Mengirimkan notifikasi, pengingat jadwal, atau informasi perubahan layanan yang relevan.',
      'Meningkatkan kualitas layanan berdasarkan riwayat pemesanan dan preferensi Anda.',
      'Menyelesaikan perselisihan atau menangani keluhan yang mungkin timbul selama atau setelah sesi terapi.',
      'Memenuhi kewajiban hukum dan regulasi yang berlaku di Indonesia.',
    ],
  },
  {
    title: '3. Penyimpanan & Keamanan Data',
    content: [
      'Data Anda disimpan secara digital dengan menerapkan standar keamanan yang wajar untuk mencegah akses tidak sah, kehilangan, atau penyalahgunaan.',
      'Akses terhadap data pribadi pelanggan dibatasi hanya kepada personel SerenaRaga yang membutuhkan informasi tersebut untuk keperluan operasional.',
      'Kami menggunakan platform komunikasi yang terenkripsi (WhatsApp) sebagai saluran utama koordinasi layanan.',
      'Data Anda akan disimpan selama Anda aktif menggunakan layanan kami, dan dapat dihapus atas permintaan tertulis Anda.',
    ],
  },
  {
    title: '4. Berbagi Data dengan Pihak Ketiga',
    content: [
      'SerenaRaga tidak menjual, menyewakan, atau menukar data pribadi Anda kepada pihak ketiga manapun untuk kepentingan komersial.',
      'Data alamat dan kontak Anda hanya dibagikan kepada terapis yang ditugaskan untuk sesi Anda, sebatas informasi yang diperlukan untuk menyelesaikan layanan.',
      'Kami dapat mengungkapkan data Anda apabila diwajibkan oleh hukum, perintah pengadilan, atau otoritas pemerintah yang berwenang.',
      'Dalam hal SerenaRaga menggunakan layanan pihak ketiga (misalnya platform pembayaran atau analitik), pihak tersebut terikat pada kebijakan privasi masing-masing dan hanya menerima data yang diperlukan untuk fungsi spesifik mereka.',
    ],
  },
  {
    title: '5. Hak-Hak Anda atas Data Pribadi',
    content: [
      'Hak Akses: Anda berhak meminta informasi mengenai data pribadi apa saja yang kami miliki tentang Anda.',
      'Hak Koreksi: Anda berhak meminta pembaruan atau koreksi terhadap data yang tidak akurat.',
      'Hak Penghapusan: Anda berhak meminta penghapusan data pribadi Anda dari sistem kami, selama tidak bertentangan dengan kewajiban hukum yang berlaku.',
      'Hak Penarikan Persetujuan: Anda berhak menarik persetujuan penggunaan data kapan saja dengan menghubungi kami secara langsung.',
      'Untuk menggunakan hak-hak di atas, silakan hubungi kami melalui email hello@serenaraga.fit.',
    ],
  },
  {
    title: '6. Cookie & Teknologi Pelacakan',
    content: [
      'Website SerenaRaga dapat menggunakan cookie teknis yang diperlukan untuk fungsi dasar website.',
      'Apabila kami menggunakan layanan analitik (seperti Google Analytics), data yang dikumpulkan bersifat anonim dan digunakan untuk memahami pola penggunaan website guna peningkatan layanan.',
      'Anda dapat menonaktifkan cookie melalui pengaturan browser Anda, meskipun hal ini dapat mempengaruhi fungsi tertentu dari website.',
    ],
  },
  {
    title: '7. Perubahan Kebijakan Privasi',
    content: [
      'SerenaRaga berhak memperbarui Kebijakan Privasi ini sewaktu-waktu sesuai dengan perubahan operasional atau regulasi yang berlaku.',
      'Perubahan signifikan akan diinformasikan melalui saluran komunikasi resmi kami.',
      'Penggunaan layanan setelah pembaruan dianggap sebagai persetujuan terhadap versi terbaru Kebijakan Privasi ini.',
      'Kami menganjurkan Anda untuk meninjau halaman ini secara berkala.',
    ],
  },
  {
    title: '8. Hubungi Kami',
    content: [
      'Apabila Anda memiliki pertanyaan, kekhawatiran, atau permintaan terkait Kebijakan Privasi ini atau data pribadi Anda, silakan hubungi kami:',
      'WhatsApp: +62 895-1835-9037',
      'Email: hello@serenaraga.fit',
      'Kami berkomitmen untuk merespons setiap permintaan dalam waktu 3×24 jam pada hari kerja.',
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-bg-cream">
      <Navbar />

      {/* Hero */}
      <section className="pt-36 pb-16 px-4 bg-bg-cream relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-earth-primary/5 -skew-x-12 translate-x-1/4 pointer-events-none" />
        <div className="container-custom relative z-10 max-w-3xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-[1px] bg-earth-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-earth-primary">Legal</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif italic text-text-primary leading-tight mb-4">
            Kebijakan Privasi
          </h1>
          <p className="text-text-secondary text-sm leading-relaxed max-w-xl">
            SerenaRaga berkomitmen untuk melindungi privasi dan keamanan data pribadi Anda. Halaman ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan menjaga informasi yang Anda berikan kepada kami.
          </p>
          <p className="text-text-secondary/50 text-xs mt-4">
            Terakhir diperbarui: Mei 2025 · Berlaku sesuai UU No. 27 Tahun 2022 tentang Perlindungan Data Pribadi
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 pb-24 bg-white">
        <div className="container-custom max-w-3xl">
          <div className="space-y-10">
            {sections.map((section, idx) => (
              <div key={idx} className="border-b border-gray-100 pb-10 last:border-none last:pb-0">
                <h2 className="text-lg font-bold text-text-primary mb-4">{section.title}</h2>
                <ul className="space-y-3">
                  {section.content.map((para, i) => (
                    <li key={i} className="flex gap-3 items-start">
                      <span className="mt-2 w-1 h-1 rounded-full bg-earth-primary/40 shrink-0" />
                      <p className="text-sm text-text-secondary leading-relaxed">{para}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom note */}
          <div className="mt-16 p-6 rounded-2xl bg-earth-primary/5 border border-earth-primary/10">
            <p className="text-xs text-text-secondary leading-relaxed">
              Kebijakan Privasi ini dibuat sesuai dengan ketentuan Undang-Undang Nomor 27 Tahun 2022 tentang Perlindungan Data Pribadi (UU PDP) Republik Indonesia. Dengan menggunakan layanan SerenaRaga, Anda menyatakan telah membaca dan memahami kebijakan ini.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
