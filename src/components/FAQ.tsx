'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const waNumber = '6289518359037';
const defaultWaMsg = encodeURIComponent('Halo Admin, saya ingin bertanya lebih jauh soal layanan pijat panggilan.');

const faqs = [
  {
    question: "Apakah terapis membawa perlengkapan sendiri?",
    answer: "Ya, terapis kami telah dibekali dengan minyak pijat aromaterapi khusus, kain/alas bersih, dan perlengkapan relaksasi standar. Anda cukup menyiapkan tempat yang nyaman di rumah."
  },
  {
    question: "Apakah bisa pilih terapis wanita untuk pelanggan wanita?",
    answer: "Tentu. Kenyamanan Anda adalah prioritas kami. Secara default, pelanggan wanita akan dilayani oleh terapis wanita. Mohon tuliskan preferensi Anda saat mengisi form booking."
  },
  {
    question: "Sampai jam berapa maksimal pemesanan (last order)?",
    answer: "Layanan kami beroperasi dari jam 08.00 hingga 21.00 WIB. Disarankan melakukan pemesanan (booking) maksimal pukul 20.00 WIB untuk memastikan ketersediaan terapis."
  },
  {
    question: "Bagaimana sistem pembayaran di SerenaRaga?",
    answer: "Pembayaran dapat dilakukan setelah terapis tiba di lokasi atau setelah sesi selesai. Kami menerima pembayaran via Transfer Bank, QRIS, maupun Tunai."
  },
  {
    question: "Apakah ada biaya transport tambahan?",
    answer: "Kami memberikan gratis biaya transport (ongkir) untuk radius tertentu di wilayah Jogja. Untuk area Sleman dan Bantul yang lebih jauh, akan ada sedikit penyesuaian biaya transport yang sangat terjangkau. Silakan share loc ke WA kami untuk memastikan."
  }
];

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-24 bg-white scroll-mt-24">
      <div className="container-custom max-w-4xl">
        <div className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="inline-block px-4 py-1.5 rounded-full bg-earth-primary/10 text-earth-primary text-[10px] font-black uppercase tracking-widest mb-4"
          >
            Pusat Bantuan
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl mb-6 font-serif italic text-text-primary"
          >
            Pertanyaan <span className="text-earth-primary">Sering Diajukan</span>
          </motion.h2>
          <p className="text-text-secondary text-sm">Masih ragu? Temukan jawaban untuk kekhawatiran Anda di bawah ini.</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="border border-earth-primary/10 rounded-2xl overflow-hidden bg-bg-cream/30"
            >
              <button
                onClick={() => toggleFaq(index)}
                className="w-full flex justify-between items-center p-5 md:p-6 text-left focus:outline-none focus-visible:bg-earth-primary/5 transition-colors"
              >
                <span className="font-bold text-text-primary text-sm md:text-base pr-4">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-earth-primary flex-shrink-0 transition-transform duration-300 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="p-5 md:p-6 pt-0 border-t border-earth-primary/5 text-sm leading-relaxed text-text-secondary">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-text-secondary mb-4">Punya pertanyaan lain yang belum terjawab?</p>
          <a
            href={`https://wa.me/${waNumber}?text=${defaultWaMsg}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-earth-primary font-bold text-sm hover:underline"
          >
            Hubungi Konsultan Kami
          </a>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
