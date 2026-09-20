'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { toPng } from 'html-to-image';
import {
  Home,
  Share2,
  Download,
  Check,
  Tag,
  Bus,
  Globe,
  Loader2,
  Sparkles,
  Heart,
  CalendarCheck,
  MessageCircle,
} from 'lucide-react';
import { SerenaLogoSvg, SerenaLogoPaths } from '@/components/SerenaLogoSvg';
import { RatingEmoji, EmojiRatingValue } from '@/components/ui/rating-emoji';
import { createClient } from '@/lib/supabase';

const InstagramIcon = ({ size = 11, ...props }: React.SVGProps<SVGSVGElement> & { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

export type PublicInvoiceData = {
  invoiceNumber: string;
  date: string;
  customerName: string;
  customerPhone?: string;
  items: {
    name: string;
    price: number;
    details?: string;
    duration?: string;
  }[];
  totalTransportFee: number;
  transportLabel?: string;
  appliedDiscounts: {
    label: string;
    amount: number;
    value?: number;
    value_type?: string;
  }[];
  grossTotal: number;
  finalTotal: number;
  invoiceFooter?: string;
  invoiceSocial?: string;
  bookingId?: string;
};

interface PublicInvoiceViewProps {
  data: PublicInvoiceData;
}

const QUICK_TAGS = [
  'Pijatan Pas & Enak',
  'Terapis Sangat Ramah',
  'Tempat Bersih & Wangi',
  'Pelayanan Tepat Waktu',
  'Tubuh Terasa Sangat Rileks',
  'Recommended Banget',
];

export function PublicInvoiceView({ data }: PublicInvoiceViewProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Review states
  const [rating, setRating] = useState<EmojiRatingValue>(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [reviewNote, setReviewNote] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const supabase = createClient();

  const formatRp = (val: number) => 'Rp ' + (val || 0).toLocaleString('id-ID');

  const handleShare = async () => {
    if (typeof window === 'undefined') return;
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Invoice SerenaRaga #${data.invoiceNumber}`,
          text: `Invoice untuk ${data.customerName} — Total: ${formatRp(data.finalTotal)}`,
          url,
        });
        return;
      } catch (e) {
        // Fallback to clipboard
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = async () => {
    if (!invoiceRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(invoiceRef.current, {
        cacheBust: true,
        pixelRatio: 2.5,
        backgroundColor: '#FDFBF7',
      });
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `Invoice-${data.invoiceNumber}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Download invoice failed:', err);
    } finally {
      setDownloading(false);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingReview(true);
    try {
      await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: data.bookingId,
          invoiceNumber: data.invoiceNumber,
          rating,
          tags: selectedTags,
          note: reviewNote,
          customerName: data.customerName,
          customerPhone: data.customerPhone,
        }),
      });
      setReviewSubmitted(true);
    } catch (err) {
      console.error('Error submitting review:', err);
    } finally {
      setSubmittingReview(false);
    }
  };

  const dateFormatted = new Date(data.date + 'T00:00:00').toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-[#f7f5f0] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col items-center py-6 sm:py-10 px-3 sm:px-4">
      {/* ── TOP ACTION BAR (Clean & Minimalist like reference) ── */}
      <div className="w-full max-w-[480px] flex items-center justify-between gap-2 mb-4 sm:mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 shadow-2xs transition-colors cursor-pointer"
        >
          <Home size={14} className="text-earth-primary" />
          <span>Beranda</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 shadow-2xs transition-colors cursor-pointer"
          >
            {copied ? <Check size={14} className="text-emerald-600" /> : <Share2 size={14} />}
            <span>{copied ? 'Link Disalin!' : 'Share'}</span>
          </button>

          <button
            type="button"
            disabled={downloading}
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-earth-primary hover:bg-earth-primary/90 text-white text-xs font-bold shadow-2xs transition-all active:scale-[0.98] cursor-pointer"
          >
            {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* ── INVOICE SLIP CONTAINER (Responsive & Mobile-Optimized) ── */}
      <div className="w-full max-w-[480px] flex justify-center pb-2">
        <div
          ref={invoiceRef}
          className="w-full bg-[#FDFBF7] text-zinc-900 font-sans relative overflow-hidden rounded-2xl sm:rounded-3xl shadow-xl sm:shadow-2xl border border-zinc-200/80"
          style={{ minHeight: 600 }}
        >
          {/* Top Accent Strip */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-[#8B5E3C]" />

          {/* Watermark Logo (Tiled Banking Style - Sharp Vector) */}
          <div className="absolute inset-0 z-0 pointer-events-none select-none">
            <svg className="w-full h-full" style={{ opacity: 0.11 }}>
              <defs>
                <pattern
                  id="watermark-pattern-public"
                  width="120"
                  height="120"
                  patternUnits="userSpaceOnUse"
                  patternTransform="rotate(-20)"
                >
                  <g transform="translate(18, 18) scale(0.055)">
                    <SerenaLogoPaths monochrome={true} color="#8b5e3c" idSuffix="watermark-public" />
                  </g>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#watermark-pattern-public)" />
            </svg>
          </div>

          {/* Content Container */}
          <div className="relative z-10 p-5 sm:p-8 md:p-9 mt-1">
            {/* Header */}
            <div className="flex justify-between items-start mb-7 sm:mb-9 gap-2">
              <div className="flex-1 min-w-0">
                <div className="relative flex items-center justify-start h-[46px] sm:h-[54px] w-[170px] sm:w-[210px] overflow-hidden -ml-2 mb-1">
                  <SerenaLogoSvg
                    className="absolute h-[220px] sm:h-[250px] w-auto max-w-none object-contain -ml-5 sm:-ml-6"
                    idSuffix="header-public"
                  />
                </div>
                <p className="text-[7.5px] sm:text-[8px] font-bold tracking-[0.25em] sm:tracking-[0.3em] text-[#8B5E3C] mt-0.5 uppercase">
                  Comfortable Home Massage
                </p>
              </div>

              <div className="text-right shrink-0">
                <div className="inline-block px-2.5 sm:px-3 py-1 bg-[#8B5E3C] text-white text-[9px] sm:text-[10px] font-black italic rounded-md mb-1.5 tracking-wider shadow-2xs">
                  INVOICE
                </div>
                <div className="font-mono text-[9.5px] sm:text-[10px] font-bold text-zinc-600 dark:text-zinc-400">
                  {data.invoiceNumber}
                </div>
                <div className="text-[8.5px] sm:text-[9px] font-medium text-zinc-400 mt-0.5">
                  {dateFormatted}
                </div>
              </div>
            </div>

            {/* Bill To */}
            <div className="border-l-[3px] border-[#8B5E3C] pl-3 sm:pl-4 mb-6 sm:mb-8">
              <p className="text-[7.5px] sm:text-[8px] font-black uppercase tracking-[0.2em] text-[#8B5E3C]/80 mb-1">
                Ditujukan Untuk:
              </p>
              <h4 className="text-base sm:text-lg md:text-xl font-black text-zinc-850 dark:text-zinc-900 tracking-tight leading-snug">
                {data.customerName || 'Pelanggan'}
              </h4>
            </div>

            {/* Items Section */}
            <div className="mb-6 sm:mb-8">
              <div className="flex justify-between border-b border-zinc-200 pb-2 mb-3 text-[7.5px] sm:text-[8px] font-black uppercase tracking-[0.15em] text-zinc-400">
                <span>Item &amp; Layanan</span>
                <span>Harga</span>
              </div>

              {data.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-start gap-3 mb-3 pb-3 border-b border-dashed border-zinc-200"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-zinc-900 text-xs sm:text-[13px] mb-0.5 leading-snug">
                      {item.name}
                    </p>
                    {item.details && (
                      <p className="text-[8.5px] sm:text-[9px] text-zinc-500 leading-relaxed">
                        {item.details}
                      </p>
                    )}
                  </div>
                  <p className="font-bold text-xs sm:text-[13px] text-zinc-800 shrink-0 font-mono">
                    {formatRp(Number(item.price))}
                  </p>
                </div>
              ))}

              {data.totalTransportFee > 0 && (
                <div className="flex justify-between items-center mb-3 p-2.5 sm:p-3 bg-[#8B5E3C]/[0.06] rounded-xl border border-[#8B5E3C]/10">
                  <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                    <Bus size={13} className="text-[#8B5E3C] shrink-0" />
                    <p className="font-semibold text-[#8B5E3C] text-[10.5px] sm:text-[11px] truncate">
                      {data.transportLabel || 'Biaya Transport Operasional'}
                    </p>
                  </div>
                  <p className="font-bold text-[#8B5E3C] text-xs sm:text-xs shrink-0 font-mono">
                    {formatRp(data.totalTransportFee)}
                  </p>
                </div>
              )}

              {/* Discount and Totals */}
              <div className="mt-4 space-y-1.5">
                <div className="flex justify-between text-[9.5px] sm:text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                  <span>Subtotal</span>
                  <span className="font-mono">{formatRp(data.grossTotal + data.totalTransportFee)}</span>
                </div>

                {data.appliedDiscounts.length > 0 && (
                  <div className="text-[8.5px] sm:text-[9px] font-black uppercase text-emerald-600 mb-1 flex items-center gap-1">
                    <Tag size={10} /> <span>Discount Applied</span>
                  </div>
                )}

                {data.appliedDiscounts.map((a, i) => (
                  <div
                    key={i}
                    className="flex justify-between text-[9.5px] sm:text-[10px] text-emerald-600 pl-2.5 sm:pl-3"
                  >
                    <span>
                      ↳ {a.label} {a.value_type === 'percentage' ? `(${a.value}%)` : ''}
                    </span>
                    <span className="font-bold font-mono">-{formatRp(a.amount)}</span>
                  </div>
                ))}

                {/* Total Bayar Ribbon */}
                <div className="flex justify-between items-center p-3.5 sm:p-4 md:p-4.5 bg-[#8B5E3C] rounded-xl sm:rounded-2xl text-white mt-3.5 shadow-md">
                  <div className="flex items-center gap-2 sm:gap-2.5">
                    <div className="w-[1px] h-5 sm:h-6 bg-white/30" />
                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] text-white/90">
                      Total Bayar
                    </span>
                  </div>
                  <span className="text-base sm:text-lg md:text-xl font-bold italic tracking-tight font-mono">
                    {formatRp(data.finalTotal)}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center mt-7 sm:mt-9 pt-4 sm:pt-5 border-t border-zinc-200/70">
              <p className="text-[10.5px] sm:text-[11.5px] italic font-serif text-[#8B5E3C]/80 mb-2.5 leading-relaxed px-2">
                "{data.invoiceFooter || 'Terima kasih telah mempercayakan ketenangan raga Anda kepada kami.'}"
              </p>

              <div className="flex justify-center items-center gap-3 sm:gap-3.5 text-[8.5px] sm:text-[9.5px] font-bold text-[#8B5E3C]/80 tracking-wide">
                <div className="flex items-center gap-1">
                  <InstagramIcon size={11} />
                  <span>@serena.raga</span>
                </div>
                <div className="w-[1px] h-2.5 bg-[#8B5E3C]/25" />
                <div className="flex items-center gap-1">
                  <Globe size={11} />
                  <span>www.serenaraga.fit</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── CUSTOMER RATING & REVIEW SECTION (Seamless & Minimalist) ── */}
      <div className="w-full max-w-[480px] mt-6 sm:mt-8 mb-8">
        <div className="space-y-5">
          <div className="text-center space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-earth-primary/10 text-earth-primary text-[11px] font-bold">
              <Sparkles size={12} />
              <span>Feedback &amp; Kepuasan</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white">
              Bagaimana Pengalaman Treatment Anda Hari Ini?
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Masukan Anda sangat berharga bagi peningkatan layanan SerenaRaga.
            </p>
          </div>

          {reviewSubmitted ? (
            <div className="p-6 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 text-center space-y-2 animate-fadeIn backdrop-blur-xs">
              <div className="size-10 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-xs">
                <Check size={18} />
              </div>
              <p className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                Terima Kasih Banyak Atas Ulasan Anda!
              </p>
              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                Ulasan Anda telah kami terima dengan senang hati. Sampai jumpa di treatment berikutnya! 🌿
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmitReview} className="space-y-4 pt-1">
              {/* Rating Emoji Component (ShadcnSpace Rating-02 without dot) */}
              <RatingEmoji value={rating} onChange={setRating} disabled={submittingReview} />

              {/* Quick Compliment Tags */}
              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 block text-center">
                  Apa yang paling Anda sukai?
                </span>
                <div className="flex flex-wrap items-center justify-center gap-1.5">
                  {QUICK_TAGS.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-earth-primary text-white border-earth-primary shadow-xs scale-102 font-semibold'
                            : 'bg-white/80 dark:bg-zinc-900/60 text-zinc-700 dark:text-zinc-300 border-zinc-200/70 dark:border-zinc-800 hover:border-earth-primary/40'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Comment Textarea */}
              <div className="pt-1">
                <textarea
                  rows={3}
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder="Ceritakan pengalaman atau pesan untuk terapis kami (opsional)..."
                  className="w-full p-3.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none focus:border-earth-primary transition-all resize-none shadow-2xs backdrop-blur-xs"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submittingReview}
                className="w-full py-3 rounded-2xl bg-earth-primary hover:bg-earth-primary/90 text-white font-bold text-xs shadow-md transition-all active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
              >
                {submittingReview ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Heart size={15} className="fill-current" />
                )}
                <span>Kirim Ulasan</span>
              </button>
            </form>
          )}

          {/* CTA: Next Booking */}
          <div className="pt-4 border-t border-zinc-200/60 dark:border-zinc-800/80 flex items-center justify-between text-xs">
            <span className="text-zinc-500 dark:text-zinc-400 text-[11.5px]">
              Ingin reservasi sesi berikutnya?
            </span>
            <Link
              href="/"
              className="font-bold text-earth-primary hover:underline flex items-center gap-1"
            >
              <CalendarCheck size={14} />
              <span>Reservasi Sekarang</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
