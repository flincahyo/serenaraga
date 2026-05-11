import { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Syarat & Ketentuan | SerenaRaga Home Massage',
  description: 'Baca syarat dan ketentuan penggunaan layanan SerenaRaga Home Massage sebelum melakukan pemesanan.',
};

const sections = [
  {
    title: '1. Ketentuan Umum',
    content: [
      'Dengan menggunakan layanan SerenaRaga, Anda dianggap telah membaca, memahami, dan menyetujui seluruh syarat dan ketentuan yang berlaku.',
      'SerenaRaga berhak mengubah syarat dan ketentuan ini sewaktu-waktu tanpa pemberitahuan sebelumnya. Perubahan akan berlaku efektif segera setelah dipublikasikan.',
      'Layanan kami ditujukan untuk perorangan berusia 17 tahun ke atas. Pelanggan di bawah usia tersebut wajib didampingi oleh orang tua atau wali.',
    ],
  },
  {
    title: '2. Pemesanan & Konfirmasi',
    content: [
      'Pemesanan dilakukan melalui platform resmi SerenaRaga (website atau WhatsApp). Pemesanan dianggap sah setelah mendapatkan konfirmasi tertulis dari tim Admin kami.',
      'Slot jadwal bersifat terbatas dan tidak dapat dijamin ketersediaannya sebelum adanya konfirmasi resmi dari Admin.',
      'SerenaRaga berhak menolak atau membatalkan pemesanan yang dianggap tidak sesuai dengan ketentuan layanan.',
      'Informasi yang Anda berikan saat pemesanan (nama, alamat, nomor kontak) wajib akurat dan dapat dipertanggungjawabkan.',
    ],
  },
  {
    title: '3. Pembatalan & Perubahan Jadwal',
    content: [
      'Pembatalan oleh pelanggan wajib dilakukan minimal 2 jam sebelum jadwal terapi yang telah disepakati.',
      'Pembatalan mendadak (kurang dari 2 jam sebelum sesi) dapat dikenakan biaya pembatalan sebesar 50% dari tarif layanan.',
      'SerenaRaga berhak membatalkan atau menjadwal ulang sesi karena kondisi force majeure (cuaca ekstrem, kecelakaan, kondisi kesehatan terapis), tanpa dikenakan biaya apapun kepada pelanggan.',
      'Permintaan perubahan jadwal wajib disampaikan melalui saluran resmi minimal 3 jam sebelum sesi berlangsung.',
    ],
  },
  {
    title: '4. Tanggung Jawab Pelanggan',
    content: [
      'Pelanggan wajib menyediakan lingkungan yang bersih, aman, dan kondusif untuk proses terapi di lokasi yang telah disepakati.',
      'Pelanggan dilarang keras melakukan tindakan pelecehan, intimidasi, atau kekerasan dalam bentuk apapun terhadap terapis kami. Pelanggaran ini akan mengakibatkan penghentian sesi secara langsung, dan SerenaRaga berhak menempuh jalur hukum.',
      'Pelanggan bertanggung jawab untuk menginformasikan kondisi medis, alergi, atau kontraindikasi yang relevan sebelum sesi dimulai.',
      'Hewan peliharaan wajib dikandangkan atau dijauhkan dari area terapi selama sesi berlangsung demi kenyamanan dan keamanan semua pihak.',
    ],
  },
  {
    title: '5. Standar Layanan Terapis',
    content: [
      'Seluruh terapis SerenaRaga telah terseleksi, terlatih secara profesional, dan terikat pada kode etik pelayanan yang ketat.',
      'Terapis kami beroperasi secara profesional dan tidak memberikan layanan di luar konteks pemulihan fisik yang telah disepakati.',
      'Terapis berhak menghentikan sesi apabila merasa tidak aman atau tidak nyaman, tanpa kewajiban pengembalian dana.',
      'Penampilan, kesehatan, dan kebersihan diri terapis kami dijaga sesuai standar higienitas layanan profesional.',
    ],
  },
  {
    title: '6. Privasi & Kerahasiaan Data',
    content: [
      'SerenaRaga berkomitmen menjaga kerahasiaan data pribadi pelanggan sesuai dengan peraturan perlindungan data yang berlaku.',
      'Data Anda (nama, nomor kontak, alamat) hanya digunakan untuk keperluan operasional layanan dan tidak akan dibagikan kepada pihak ketiga tanpa persetujuan Anda.',
      'Foto, video, atau rekaman apapun di lokasi terapi tanpa persetujuan eksplisit adalah dilarang.',
    ],
  },
  {
    title: '7. Pembatasan Tanggung Jawab',
    content: [
      'SerenaRaga tidak bertanggung jawab atas kerusakan properti yang tidak disebabkan oleh kelalaian langsung dari terapis kami.',
      'SerenaRaga tidak bertanggung jawab atas reaksi fisik yang tidak terduga akibat kondisi medis yang tidak diinformasikan sebelumnya oleh pelanggan.',
      'Dalam hal terjadi perselisihan, kedua belah pihak sepakat untuk menyelesaikan melalui musyawarah mufakat terlebih dahulu.',
    ],
  },
  {
    title: '8. Kontak',
    content: [
      'Untuk pertanyaan, keluhan, atau klarifikasi terkait syarat dan ketentuan ini, silakan hubungi kami melalui:',
      'WhatsApp: +62 895-1835-9037',
      'Email: hello@serenaraga.fit',
      'Kami berkomitmen merespons setiap pesan dalam waktu 1×24 jam pada hari kerja.',
    ],
  },
];

export default function TermsPage() {
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
            Syarat & Ketentuan
          </h1>
          <p className="text-text-secondary text-sm leading-relaxed max-w-xl">
            Harap baca syarat dan ketentuan berikut dengan seksama sebelum menggunakan layanan SerenaRaga. Dokumen ini berlaku efektif sejak tanggal pemesanan pertama Anda.
          </p>
          <p className="text-text-secondary/50 text-xs mt-4">
            Terakhir diperbarui: Mei 2025
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
              Dengan melakukan pemesanan, Anda secara otomatis menyatakan telah membaca, memahami, dan menyetujui seluruh syarat dan ketentuan di atas. SerenaRaga berhak melakukan perubahan kebijakan ini kapanpun sesuai kebutuhan operasional.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
