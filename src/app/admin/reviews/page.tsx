'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Star,
  Sparkles,
  Search,
  Filter,
  Users,
  RefreshCw,
  MessageCircle,
  ExternalLink,
  Trash2,
  Bookmark,
  Check,
  Award,
  Heart,
  Calendar,
  Layers,
  ChevronDown,
  Quote,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminSkeleton } from '@/components/admin/AdminSkeleton';
import { CustomerReview } from '@/app/api/reviews/route';
import { createClient } from '@/lib/supabase';

const EMOJI_MAP: Record<number, { emoji: string; label: string; bg: string; text: string; border: string }> = {
  5: { emoji: '😍', label: 'Sangat Puas', bg: 'bg-earth-primary/10', text: 'text-earth-primary', border: 'border-earth-primary/30' },
  4: { emoji: '😊', label: 'Puas', bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-850' },
  3: { emoji: '😐', label: 'Cukup', bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-850' },
  2: { emoji: '🙁', label: 'Kurang', bg: 'bg-orange-50 dark:bg-orange-950/40', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-850' },
  1: { emoji: '😡', label: 'Kecewa', bg: 'bg-rose-50 dark:bg-rose-950/40', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-850' },
};

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [therapists, setTherapists] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all');
  const [therapistFilter, setTherapistFilter] = useState<string>('all');
  const [featuredFilter, setFeaturedFilter] = useState<boolean | 'all'>('all');
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const supabase = createClient();

  const fetchReviews = useCallback(async () => {
    try {
      const res = await fetch('/api/reviews');
      const json = await res.json();
      if (json.success && Array.isArray(json.reviews)) {
        setReviews(json.reviews);
      }
    } catch (err) {
      console.error('Error loading reviews:', err);
    }
  }, []);

  const fetchTherapists = useCallback(async () => {
    const { data } = await supabase.from('therapists').select('id, name').order('name');
    if (data) setTherapists(data);
  }, [supabase]);

  const loadData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchReviews(), fetchTherapists()]);
    setLoading(false);
  }, [fetchReviews, fetchTherapists]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchReviews();
    setRefreshing(false);
  };

  const toggleFeatured = async (id: string, currentStatus?: boolean) => {
    setTogglingId(id);
    try {
      const res = await fetch('/api/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_featured: !currentStatus }),
      });
      if (res.ok) {
        setReviews((prev) =>
          prev.map((r) => (r.id === id ? { ...r, is_featured: !currentStatus } : r))
        );
      }
    } catch (err) {
      console.error('Error toggling featured:', err);
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id: string, customerName: string) => {
    const confirmed = window.confirm(
      `Yakin ingin menghapus ulasan dari "${customerName}"?\nTindakan ini tidak dapat dibatalkan.`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/reviews?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setReviews((prev) => prev.filter((r) => r.id !== id));
      }
    } catch (err) {
      console.error('Error deleting review:', err);
    }
  };

  // Metrics calculation
  const totalReviews = reviews.length;
  const avgRating =
    totalReviews > 0
      ? (reviews.reduce((s, r) => s + (Number(r.rating) || 0), 0) / totalReviews).toFixed(1)
      : '5.0';

  const satisfiedCount = reviews.filter((r) => Number(r.rating) >= 4).length;
  const satisfiedPct = totalReviews > 0 ? Math.round((satisfiedCount / totalReviews) * 100) : 100;

  // Tag frequency
  const tagFrequency: Record<string, number> = {};
  reviews.forEach((r) => {
    r.tags?.forEach((tag) => {
      tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
    });
  });
  const topTag = Object.entries(tagFrequency).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Layanan Istimewa';

  // Filtered reviews
  const filtered = reviews.filter((r) => {
    // Search match
    if (search) {
      const q = search.toLowerCase();
      const matchName = r.customer_name?.toLowerCase().includes(q);
      const matchPhone = r.customer_phone?.includes(q);
      const matchInvoice = r.invoice_number?.toLowerCase().includes(q);
      const matchNote = r.note?.toLowerCase().includes(q);
      const matchService = r.service_name?.toLowerCase().includes(q);
      const matchTherapist = r.therapist_name?.toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchInvoice && !matchNote && !matchService && !matchTherapist) {
        return false;
      }
    }

    // Rating match
    if (ratingFilter !== 'all' && Number(r.rating) !== ratingFilter) {
      return false;
    }

    // Therapist match
    if (therapistFilter !== 'all') {
      if (r.therapist_id !== therapistFilter && r.therapist_name !== therapistFilter) {
        return false;
      }
    }

    // Featured match
    if (featuredFilter !== 'all') {
      if (!!r.is_featured !== featuredFilter) {
        return false;
      }
    }

    return true;
  });

  const formatDate = (dStr: string) => {
    try {
      const d = new Date(dStr);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dStr;
    }
  };

  if (loading) return <AdminSkeleton />;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Sparkles size={20} className="text-earth-primary" /> Ulasan &amp; Rating Pelanggan
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 font-medium">
            Pantau kepuasan pelanggan, ulasan dari invoice online, dan evaluasi performa layanan terapis.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="admin-btn-ghost text-xs flex items-center gap-1.5 py-2 px-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ── METRICS SUMMARY CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-bold uppercase tracking-wider">
            <span>Rata-Rata Skor</span>
            <Star size={16} className="text-amber-500 fill-amber-500" />
          </div>
          <div className="flex items-baseline gap-1.5 pt-0.5">
            <span className="text-2xl font-black font-mono text-zinc-900 dark:text-white">{avgRating}</span>
            <span className="text-xs text-zinc-400 font-bold">/ 5.0</span>
          </div>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Dari {totalReviews} ulasan terverifikasi</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-bold uppercase tracking-wider">
            <span>Tingkat Kepuasan</span>
            <Heart size={16} className="text-rose-500 fill-rose-500" />
          </div>
          <div className="flex items-baseline gap-1.5 pt-0.5">
            <span className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">{satisfiedPct}%</span>
            <span className="text-xs text-zinc-400 font-bold">Puas</span>
          </div>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{satisfiedCount} ulasan bintang 4 &amp; 5</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-bold uppercase tracking-wider">
            <span>Total Ulasan</span>
            <Quote size={16} className="text-earth-primary" />
          </div>
          <div className="flex items-baseline gap-1.5 pt-0.5">
            <span className="text-2xl font-black font-mono text-zinc-900 dark:text-white">{totalReviews}</span>
            <span className="text-xs text-zinc-400 font-bold">Feedback</span>
          </div>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Tersimpan dari invoice digital</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-bold uppercase tracking-wider">
            <span>Top Pujian</span>
            <Award size={16} className="text-earth-primary" />
          </div>
          <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 truncate pt-1">{topTag}</p>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Paling sering dipilih customer</p>
        </div>
      </div>

      {/* ── FILTER & SEARCH BAR ── */}
      <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
          {/* Search box */}
          <div className="sm:col-span-5 relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari pelanggan, invoice, pesan, terapis..."
              className="admin-input pl-9 text-xs"
            />
          </div>

          {/* Therapist filter */}
          <div className="sm:col-span-4">
            <select
              value={therapistFilter}
              onChange={(e) => setTherapistFilter(e.target.value)}
              className="admin-input text-xs"
            >
              <option value="all">-- Semua Terapis --</option>
              {therapists.map((t) => (
                <option key={t.id} value={t.name}>
                  Terapis: {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Featured toggle filter */}
          <div className="sm:col-span-3">
            <select
              value={featuredFilter === 'all' ? 'all' : featuredFilter ? 'featured' : 'not_featured'}
              onChange={(e) =>
                setFeaturedFilter(e.target.value === 'all' ? 'all' : e.target.value === 'featured')
              }
              className="admin-input text-xs"
            >
              <option value="all">Semua Status</option>
              <option value="featured">⭐ Hanya Featured</option>
              <option value="not_featured">Reguler</option>
            </select>
          </div>
        </div>

        {/* Rating Pills Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none pt-1">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mr-1 shrink-0">
            Rating:
          </span>
          <button
            onClick={() => setRatingFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 border ${
              ratingFilter === 'all'
                ? 'bg-zinc-900 border-zinc-900 text-white dark:bg-white dark:border-white dark:text-zinc-900 shadow-2xs'
                : 'bg-zinc-50 dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'
            }`}
          >
            Semua ({totalReviews})
          </button>
          {[5, 4, 3, 2, 1].map((rVal) => {
            const count = reviews.filter((r) => Number(r.rating) === rVal).length;
            const emojiInfo = EMOJI_MAP[rVal];
            return (
              <button
                key={rVal}
                onClick={() => setRatingFilter(rVal)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1 border ${
                  ratingFilter === rVal
                    ? `${emojiInfo.bg} ${emojiInfo.border} ${emojiInfo.text} shadow-2xs scale-102`
                    : 'bg-zinc-50 dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300'
                }`}
              >
                <span>{emojiInfo.emoji}</span>
                <span>{rVal} Bintang ({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── REVIEWS LIST ── */}
      <div className="space-y-3.5">
        {filtered.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 space-y-3">
            <div className="size-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto">
              <Quote size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Belum ada ulasan yang sesuai filter</p>
              <p className="text-xs text-zinc-400 mt-0.5">Ulasan akan otomatis muncul saat customer mengirim review dari link invoice online.</p>
            </div>
          </div>
        ) : (
          filtered.map((rev) => {
            const emojiInfo = EMOJI_MAP[rev.rating] || EMOJI_MAP[5];
            return (
              <motion.div
                key={rev.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`p-5 rounded-2xl bg-white dark:bg-zinc-900 border transition-all ${
                  rev.is_featured
                    ? 'border-amber-300/80 dark:border-amber-600/40 shadow-sm bg-gradient-to-r from-amber-50/20 via-white to-white dark:from-amber-950/10 dark:via-zinc-900 dark:to-zinc-900'
                    : 'border-zinc-200/80 dark:border-zinc-800 shadow-2xs hover:border-zinc-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  {/* Left: Customer Info & Rating */}
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <div className="size-9 rounded-full bg-gradient-to-tr from-earth-primary to-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                        {rev.customer_name?.charAt(0)?.toUpperCase() || 'P'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-zinc-900 dark:text-white leading-tight">
                            {rev.customer_name || 'Pelanggan'}
                          </h4>
                          {rev.is_featured && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 text-[10px] font-bold">
                              <Star size={10} className="fill-amber-500 text-amber-500" /> Featured
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                          {rev.customer_phone ? rev.customer_phone : 'Tanpa No. WA'} · {formatDate(rev.created_at)}
                        </p>
                      </div>
                    </div>

                    {/* Rating badge & Stars */}
                    <div className="flex items-center gap-2 pt-1">
                      <div
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border ${emojiInfo.bg} ${emojiInfo.border} ${emojiInfo.text}`}
                      >
                        <span className="text-sm leading-none">{emojiInfo.emoji}</span>
                        <span>{emojiInfo.label} ({rev.rating}/5)</span>
                      </div>
                      <div className="flex items-center gap-0.5 text-amber-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={13}
                            className={i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-200 dark:text-zinc-700'}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right: Assigned Therapist & Invoice Info */}
                  <div className="sm:text-right space-y-1 text-xs bg-zinc-50 dark:bg-zinc-800/50 p-2.5 rounded-xl border border-zinc-150 dark:border-zinc-800 sm:min-w-[220px]">
                    <div className="flex sm:justify-end items-center gap-1.5 text-zinc-700 dark:text-zinc-300 font-bold">
                      <Users size={12} className="text-earth-primary" />
                      <span>Terapis: <span className="text-earth-primary">{rev.therapist_name || 'Tidak tercatat'}</span></span>
                    </div>
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Layanan: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{rev.service_name || 'Layanan SerenaRaga'}</span>
                    </div>
                    {rev.invoice_number && (
                      <div className="pt-1 flex sm:justify-end items-center gap-1">
                        <Link
                          href={`/invoice/${rev.invoice_number}`}
                          target="_blank"
                          className="font-mono text-[10px] text-earth-primary hover:underline font-bold inline-flex items-center gap-1"
                        >
                          <span>{rev.invoice_number}</span>
                          <ExternalLink size={10} />
                        </Link>
                      </div>
                    )}
                  </div>
                </div>

                {/* Compliment Tags */}
                {rev.tags && rev.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-3">
                    {rev.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[11px] font-medium border border-zinc-200/60 dark:border-zinc-700"
                      >
                        ✓ {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Review Note / Message */}
                {rev.note && (
                  <div className="mt-3 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200/70 dark:border-zinc-800 text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed font-sans italic relative">
                    <Quote size={12} className="text-earth-primary opacity-60 absolute top-3 left-3" />
                    <p className="pl-4">"{rev.note}"</p>
                  </div>
                )}

                {/* Actions Footer */}
                <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    {rev.customer_phone && (
                      <a
                        href={`https://wa.me/${rev.customer_phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                      >
                        <MessageCircle size={12} /> Hubungi via WA
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => toggleFeatured(rev.id, rev.is_featured)}
                      disabled={togglingId === rev.id}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                        rev.is_featured
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300'
                          : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-amber-600 border border-zinc-200 dark:border-zinc-700'
                      }`}
                      title="Tampilkan sebagai testimoni website"
                    >
                      <Star size={12} className={rev.is_featured ? 'fill-amber-500 text-amber-500' : ''} />
                      <span>{rev.is_featured ? 'Featured' : 'Jadikan Featured'}</span>
                    </button>

                    <button
                      onClick={() => handleDelete(rev.id, rev.customer_name)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                      title="Hapus Ulasan"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
