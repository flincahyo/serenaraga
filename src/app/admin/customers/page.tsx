'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Users, Search, Plus, Pencil, Check, X, Loader2,
  Phone, CalendarCheck, Award, Hash, Trash2, TrendingUp, Wallet, Star, MessageCircle, AlertCircle,
  Clock, Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase';
import { useUser } from '@/lib/user-context';
import { AdminSkeleton } from '@/components/admin/AdminSkeleton';

type RFMSegment = 'Champions' | 'Loyalists' | 'New' | 'About to Sleep' | 'Dormant/Lost';

type Customer = {
  id: string;
  wa_number: string;
  name: string | null;
  visit_count_base: number;
  notes: string | null;
  created_at: string;
  effective_count?: number;   // computed
  total_spending?: number;    // computed LTV
  last_visit?: string;        // computed
  segment?: RFMSegment;       // computed segment
  services_history?: string[]; // computed service history names
};

type Discount = { id: string; type: string; value: number; value_type: string; min_orders: number | null; name: string; is_active: boolean; };
type BookingRow = { customer_id: string; status: string; final_price: number | null; price: number | null; booking_date: string; service_name: string | null; };

function getRFMSegment(lastVisit: string | null, visitCount: number, totalSpending: number, createdAt: string): RFMSegment {
  const today = new Date();
  
  if (!lastVisit) {
    const createdDays = Math.floor((today.getTime() - new Date(createdAt).getTime()) / 86400000);
    return createdDays > 90 ? 'Dormant/Lost' : 'New';
  }

  const recencyDays = Math.floor((today.getTime() - new Date(lastVisit + 'T00:00:00').getTime()) / 86400000);
  
  if (recencyDays <= 30 && visitCount >= 4 && totalSpending >= 1000000) {
    return 'Champions';
  }
  
  if (recencyDays <= 60 && visitCount >= 2) {
    return 'Loyalists';
  }
  
  if (recencyDays <= 30 && visitCount === 1) {
    return 'New';
  }
  
  if (recencyDays > 60 && recencyDays <= 90) {
    return 'About to Sleep';
  }
  
  return 'Dormant/Lost';
}

function getTreatmentRecommendation(servicesHistory: string[] = []): string {
  if (servicesHistory.length === 0) {
    return 'Full Body Massage';
  }

  const flatHistory = servicesHistory.flatMap(s => s.split(' + ').map(x => x.trim()));
  const counts: Record<string, number> = {};
  flatHistory.forEach(s => {
    counts[s] = (counts[s] ?? 0) + 1;
  });

  let mostOrdered = '';
  let maxCount = 0;
  Object.entries(counts).forEach(([s, c]) => {
    if (c > maxCount) {
      maxCount = c;
      mostOrdered = s;
    }
  });

  const lowercase = mostOrdered.toLowerCase();
  
  if (lowercase.includes('couple') || lowercase.includes('paket') || lowercase.includes('package')) {
    return 'Body Scrub (Add-on)';
  }
  if (lowercase.includes('body massage') || lowercase.includes('pijat badan') || lowercase.includes('totok wajah')) {
    return 'Refleksi Kaki (Add-on)';
  }
  if (lowercase.includes('refleksi') || lowercase.includes('reflexology')) {
    return 'Full Body Massage';
  }
  
  return 'Totok Wajah (Add-on)';
}

const formatRp = (n: number) => `Rp ${Number(n).toLocaleString('id-ID')}`;
const formatDate = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

function TierBadge({ count, discounts }: { count: number; discounts: Discount[] }) {
  const loyal = discounts
    .filter(d => d.type === 'loyal' && d.is_active && count >= (d.min_orders ?? Infinity))
    .sort((a, b) => (b.min_orders ?? 0) - (a.min_orders ?? 0))[0];
  if (count === 0) return <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-bold border border-zinc-200 dark:border-zinc-700">New</span>;
  if (!loyal) return null;
  const colors: Record<string, string> = {
    'Loyal Bronze': 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30',
    'Loyal Silver': 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700',
    'Loyal Gold':   'bg-yellow-50 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-900/30',
  };
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm ${colors[loyal.name] ?? 'bg-earth-primary/10 text-earth-primary border border-earth-primary/20'}`}>
      <Award size={9} /> {loyal.name}
    </span>
  );
}

// ──────────────────────────────────────────
// CustomerModalForm component
// ──────────────────────────────────────────
function CustomerModalForm({
  isOpen,
  data,
  saving,
  isNew,
  onChange,
  onSave,
  onCancel,
}: {
  isOpen: boolean;
  data: Partial<Customer>;
  saving: boolean;
  isNew: boolean;
  onChange: (d: Partial<Customer>) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
          className="fixed inset-0 bg-black/40"
        />

        {/* Modal Panel */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl w-full max-w-md p-6 relative z-10 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
            <h3 className="font-semibold text-zinc-950 dark:text-white flex items-center gap-2">
              <Users size={16} className="text-earth-primary" />
              {isNew ? 'Tambah Customer Baru' : 'Edit Data Customer'}
            </h3>
            <button onClick={onCancel} className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg">
              <X size={16} />
            </button>
          </div>

          <div className="space-y-3.5">
            <div>
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1 block">Nama Pelanggan</label>
              <input
                className="admin-input"
                placeholder="Ibu Rina"
                value={data.name ?? ''}
                onChange={e => onChange({ ...data, name: e.target.value })}
              />
            </div>
            
            <div>
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1 block">No. WhatsApp</label>
              <input
                className="admin-input font-mono"
                placeholder="628xxxxxxxx"
                value={data.wa_number ?? ''}
                onChange={e => onChange({ ...data, wa_number: e.target.value })}
                readOnly={!isNew}
              />
              {isNew && <p className="text-[10px] text-zinc-400 mt-1">Gunakan kode negara (62...) tanpa tanda '+' atau spasi.</p>}
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1 block flex items-center justify-between">
                <span>Kunjungan Awal Offline</span>
                <span className="text-[10px] text-zinc-400 font-normal">Sebelum sistem digunakan</span>
              </label>
              <input
                type="number"
                min={0}
                className="admin-input w-32 font-mono"
                value={data.visit_count_base ?? 0}
                onChange={e => onChange({ ...data, visit_count_base: Math.max(0, Number(e.target.value)) })}
              />
              <p className="text-[10px] text-zinc-400 mt-1">
                Kunjungan sistem otomatis bertambah saat status booking diubah menjadi Completed.
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1 block">Catatan & Preferensi</label>
              <textarea
                className="admin-input text-xs h-20 resize-none font-sans"
                placeholder="Info tambahan (misal: preferensi kekuatan pijat, alergi minyak spa, dll.)"
                value={data.notes ?? ''}
                onChange={e => onChange({ ...data, notes: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <button onClick={onCancel} className="admin-btn-ghost text-xs">
              Batal
            </button>
            <button
              onClick={onSave}
              disabled={saving || !data.wa_number || data.wa_number === '62'}
              className="admin-btn-primary text-xs disabled:opacity-50"
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
              {isNew ? 'Tambah' : 'Simpan Perubahan'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// ──────────────────────────────────────────
// CustomerDrawer component
// ──────────────────────────────────────────
function CustomerDrawer({
  customer,
  discounts,
  bookingHistory,
  loadingHistory,
  isOpen,
  onClose,
  onSendWA,
  onEdit,
  reEngageDays,
  reEngageTemplate,
  reEngagePromoTemplate,
}: {
  customer: Customer | null;
  discounts: Discount[];
  bookingHistory: any[];
  loadingHistory: boolean;
  isOpen: boolean;
  onClose: () => void;
  onSendWA: (draftMessage: string) => void;
  onEdit: () => void;
  reEngageDays: number;
  reEngageTemplate: string;
  reEngagePromoTemplate: string;
}) {
  const [draftMessage, setDraftMessage] = useState('');

  const getEligiblePromo = (c: Customer): Discount | null => {
    const nextCount = (c.effective_count ?? 0) + 1;
    const loyal = discounts
      .filter(d => d.type === 'loyal' && d.min_orders && nextCount >= d.min_orders)
      .sort((a, b) => (b.min_orders ?? 0) - (a.min_orders ?? 0))[0];
    if (loyal) return loyal;

    if (c.last_visit) {
      const days = Math.floor((Date.now() - new Date(c.last_visit + 'T00:00:00').getTime()) / 86400000);
      if (days >= reEngageDays) {
        const rc = discounts.find(d => d.type === 'returning_customer');
        if (rc) return rc;
      }
    }
    return null;
  };

  useEffect(() => {
    if (customer) {
      const promo = getEligiblePromo(customer);
      const days = customer.last_visit
        ? Math.floor((Date.now() - new Date(customer.last_visit + 'T00:00:00').getTime()) / 86400000)
        : reEngageDays;
      
      let template = reEngageTemplate ||
        'Halo {nama}! 😊 Sudah {hari} hari nih kita belum ketemu... Kangen? Yuk book sesi relaksasi di SerenaRaga! Ada promo spesial untuk kamu. 🌿';
        
      if (promo) {
        template = reEngagePromoTemplate || 'Halo {nama}, kami punya diskon {diskon} spesial untuk kamu! Yuk book sesi relaksasi di SerenaRaga.';
      }

      const discountValue = promo 
        ? (promo.value_type === 'percentage' ? `${promo.value}%` : formatRp(promo.value))
        : '';

      const recService = getTreatmentRecommendation(customer.services_history);

      const msg = template
        .replace('{nama}', customer.name ?? 'Kak')
        .replace('{hari}', String(days))
        .replace('{diskon}', promo ? `${promo.name} (${discountValue})` : '')
        .replace('{rekomendasi}', recService);
        
      setDraftMessage(msg);
    } else {
      setDraftMessage('');
    }
  }, [customer, reEngageTemplate, reEngagePromoTemplate, reEngageDays, discounts]);

  if (!customer) return null;

  const totalSpending = customer.total_spending ?? 0;
  const visitCount = customer.effective_count ?? 0;
  const avgSpend = visitCount > 0 ? Math.round(totalSpending / visitCount) : 0;
  
  let recencyText = 'Belum pernah';
  if (customer.last_visit) {
    const days = Math.floor((Date.now() - new Date(customer.last_visit + 'T00:00:00').getTime()) / 86400000);
    recencyText = days === 0 ? 'Hari ini' : `${days} hari yang lalu`;
  }

  const recService = getTreatmentRecommendation(customer.services_history);

  const serviceCounts: Record<string, number> = {};
  if (customer.services_history) {
    customer.services_history.flatMap(s => s.split(' + ').map(x => x.trim())).forEach(s => {
      serviceCounts[s] = (serviceCounts[s] ?? 0) + 1;
    });
  }
  const favoriteServices = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 z-40"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-zinc-950 shadow-2xl z-50 border-l border-zinc-200 dark:border-zinc-800 flex flex-col"
          >
            {/* Header */}
            <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-earth-primary to-amber-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                  {(customer.name ?? customer.wa_number).slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900 dark:text-white leading-tight">
                    {customer.name || '(Tanpa Nama)'}
                  </h3>
                  <p className="text-xs text-zinc-400 font-mono mt-0.5">{customer.wa_number}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={onEdit}
                  className="p-2 text-zinc-500 hover:text-earth-primary hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                  title="Edit Customer"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin">
              {/* Badges / Status */}
              <div className="flex flex-wrap gap-2">
                {customer.segment && (
                  <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-sm border ${
                    customer.segment === 'Champions' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' :
                    customer.segment === 'Loyalists' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' :
                    customer.segment === 'New' ? 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20' :
                    customer.segment === 'About to Sleep' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' :
                    'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                  }`}>
                    RFM: {customer.segment}
                  </span>
                )}
                <TierBadge count={visitCount} discounts={discounts} />
              </div>

              {/* CRM Key Metrics Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
                  <span className="text-[10px] text-zinc-400 font-semibold block">Total Spending (LTV)</span>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono block mt-1">
                    {formatRp(totalSpending)}
                  </span>
                </div>
                <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
                  <span className="text-[10px] text-zinc-400 font-semibold block">Rerata Kunjungan</span>
                  <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200 font-mono block mt-1">
                    {formatRp(avgSpend)}
                  </span>
                </div>
                <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
                  <span className="text-[10px] text-zinc-400 font-semibold block">Total Kunjungan</span>
                  <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200 font-mono block mt-1 flex items-baseline gap-1">
                    {visitCount}x <span className="text-[10px] text-zinc-400 font-normal">({customer.visit_count_base} offline)</span>
                  </span>
                </div>
                <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
                  <span className="text-[10px] text-zinc-400 font-semibold block">Kunjungan Terakhir</span>
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block mt-1.5">
                    {recencyText}
                  </span>
                </div>
              </div>

              {/* Cross-Sell & Treatment Recommendations */}
              <div className="p-4 bg-gradient-to-br from-earth-primary/5 to-amber-500/5 dark:from-earth-primary/10 dark:to-amber-500/5 border border-earth-primary/20 dark:border-earth-primary/10 rounded-2xl space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-earth-primary/10 flex items-center justify-center text-earth-primary">
                    <Star size={12} className="fill-current" />
                  </div>
                  <h4 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 font-bold">Rekomendasi CRM & Penawaran</h4>
                </div>
                
                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-400 font-semibold">Treatment Komplementer</span>
                  <p className="text-xs font-bold text-earth-primary">{recService}</p>
                </div>

                <div className="space-y-1.5 border-t border-earth-primary/10 pt-3">
                  <label className="text-[10px] text-zinc-400 font-semibold block">Draf Pesan WhatsApp</label>
                  <textarea
                    value={draftMessage}
                    onChange={e => setDraftMessage(e.target.value)}
                    className="w-full text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 h-24 focus:outline-none focus:ring-1 focus:ring-earth-primary resize-none font-sans"
                  />
                </div>
                
                <button
                  onClick={() => onSendWA(draftMessage)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors mt-2"
                >
                  <MessageCircle size={13} /> Kirim WhatsApp
                </button>
              </div>

              {/* Favorite Services */}
              {favoriteServices.length > 0 && (
                <div className="space-y-2.5">
                  <h4 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Layanan Terfavorit</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {favoriteServices.map(([svc, count]) => (
                      <span
                        key={svc}
                        className="text-[10px] px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-lg border border-zinc-200/50 dark:border-zinc-700/50 font-medium"
                      >
                        {svc} ({count}x)
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Timeline Riwayat Booking */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Linimasa Kunjungan</h4>
                
                {loadingHistory ? (
                  <div className="flex items-center justify-center py-6 text-xs text-zinc-400">
                    <Loader2 className="animate-spin text-earth-primary mr-1.5" size={13} />
                    Memuat riwayat...
                  </div>
                ) : bookingHistory.length === 0 ? (
                  <p className="text-xs text-zinc-400 text-center py-4">Belum ada booking di sistem.</p>
                ) : (
                  <div className="relative pl-4 border-l border-zinc-200 dark:border-zinc-800 space-y-4 ml-1 pt-1">
                    {bookingHistory.map((b) => {
                      // Extract unique therapist names from booking items
                      const therapistNames = Array.from(new Set(
                        b.booking_items
                          ?.map((item: any) => item.therapists?.name)
                          .filter(Boolean)
                      )).join(', ');

                      const paidTotal = b.final_price ?? b.price;
                      const discount = b.discount_total ?? 0;
                      const hasDiscount = discount > 0;
                      const bhpCost = b.bhp_cost ?? 0;

                      return (
                        <div key={b.id} className="relative">
                          {/* Circle indicator on vertical timeline */}
                          <div className={`absolute w-2.5 h-2.5 rounded-full -left-[21.5px] top-3 border-2 border-white dark:border-zinc-950 ${
                            b.status === 'Completed' ? 'bg-emerald-500' :
                            b.status === 'Canceled' ? 'bg-zinc-400' :
                            'bg-amber-500'
                          }`} />
                          
                          <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/80 rounded-xl p-3 space-y-2 text-xs">
                            {/* Date, Time & Status Header */}
                            <div className="flex justify-between items-center text-[10px] text-zinc-400 dark:text-zinc-500">
                              <div className="flex items-center gap-1 font-semibold font-mono">
                                <span>{b.booking_date ? formatDate(b.booking_date) : '-'}</span>
                                {b.booking_time && (
                                  <>
                                    <span className="text-zinc-300">•</span>
                                    <span className="flex items-center gap-0.5"><Clock size={9} /> {b.booking_time.slice(0, 5)}</span>
                                  </>
                                )}
                              </div>
                              <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md border ${
                                b.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                                b.status === 'Canceled' ? 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20' :
                                'bg-amber-500/10 text-amber-600 border-amber-500/20'
                              }`}>
                                {b.status}
                              </span>
                            </div>

                            {/* Service name */}
                            <p className="font-bold text-zinc-800 dark:text-zinc-250 leading-snug">
                              {b.service_name}
                            </p>

                            {/* Therapist Details */}
                            {therapistNames && (
                              <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
                                <Users size={11} className="text-zinc-450 shrink-0" />
                                <span>Terapis: <span className="font-bold text-zinc-700 dark:text-zinc-350">{therapistNames}</span></span>
                              </div>
                            )}

                            {/* Financial breakdown */}
                            <div className="border-t border-dashed border-zinc-200 dark:border-zinc-800/80 pt-2 flex items-center justify-between gap-1.5 text-[9px] text-zinc-400 dark:text-zinc-500 font-medium">
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                <span>Gross: <span className="font-mono text-zinc-500 dark:text-zinc-400">{formatRp(b.price)}</span></span>
                                {hasDiscount && (
                                  <span className="text-emerald-600 flex items-center gap-0.5"><Tag size={9} /> -{formatRp(discount)}</span>
                                )}
                                {bhpCost > 0 && (
                                  <span className="text-blue-500">BHP: -{formatRp(bhpCost)}</span>
                                )}
                              </div>
                              <div className="font-bold text-zinc-800 dark:text-zinc-300">
                                <span>Bayar: <span className="font-mono text-emerald-650 dark:text-emerald-400 font-bold text-xs">{formatRp(paidTotal)}</span></span>
                              </div>
                            </div>

                            {/* Session notes */}
                            {b.notes && (
                              <div className="bg-amber-50/30 dark:bg-amber-955/5 border border-amber-100/30 dark:border-amber-900/10 p-2 rounded-lg text-[9px] text-zinc-550 dark:text-zinc-400 leading-relaxed">
                                <span className="font-bold block uppercase text-[8px] text-amber-700 dark:text-amber-500 tracking-wider mb-0.5">Catatan Sesi</span>
                                <span className="italic">"{b.notes}"</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Customer Notes */}
              {customer.notes && (
                <div className="space-y-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-2xl">
                  <h4 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Catatan Pelanggan</h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 italic leading-relaxed">{customer.notes}</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ──────────────────────────────────────────
// Main Page Inner Component
// ──────────────────────────────────────────
function CustomersPageInner() {
  const { user } = useUser();
  const isOwner = user?.role !== 'cashier';

  const searchParams = useSearchParams();
  const initialFilter = searchParams.get('filter') === 'followup' ? 'followup' : 'all';

  const [customers, setCustomers]   = useState<Customer[]>([]);
  const [discounts, setDiscounts]   = useState<Discount[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'followup'>(initialFilter);
  const [activeSegment, setActiveSegment] = useState<'all' | RFMSegment>('all');
  
  // Modal controls
  const [editId, setEditId]         = useState<string | null>(null);
  const [editData, setEditData]     = useState<Partial<Customer>>({});
  const [showAdd, setShowAdd]       = useState(false);
  const [newCust, setNewCust]       = useState<Partial<Customer>>({ wa_number: '62', visit_count_base: 0 });
  const [saving, setSaving]         = useState(false);
  
  // Drawer controls
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [bookingHistory, setBookingHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // CRM Re-engage defaults
  const [reEngageDays, setReEngageDays]   = useState(60);
  const [reEngageTemplate, setReEngageTemplate] = useState('');
  const [reEngagePromoTemplate, setReEngagePromoTemplate] = useState('');

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [{ data: custs }, { data: discs }, { data: allBkg }, { data: settingsData }] = await Promise.all([
      supabase.from('customers').select('*').order('created_at', { ascending: false }),
      supabase.from('discounts').select('id, type, value, value_type, min_orders, name, is_active').eq('is_active', true),
      supabase.from('bookings')
        .select('customer_id, status, final_price, price, booking_date, service_name')
        .not('customer_id', 'is', null),
      supabase.from('settings').select('key, value').in('key', ['re_engagement_days', 're_engagement_template', 're_engagement_promo_template']),
    ]);
    if (discs) setDiscounts(discs);
    if (settingsData) {
      settingsData.forEach(({ key, value }) => {
        if (key === 're_engagement_days') setReEngageDays(Number(value) || 60);
        if (key === 're_engagement_template') setReEngageTemplate(value);
        if (key === 're_engagement_promo_template') setReEngagePromoTemplate(value);
      });
    }
    if (custs && allBkg) {
      const countMap: Record<string, number> = {};
      const spendMap: Record<string, number> = {};
      const lastMap:  Record<string, string>  = {};
      const servicesMap: Record<string, string[]> = {};
      (allBkg as BookingRow[]).forEach(r => {
        if (!r.customer_id) return;
        countMap[r.customer_id] = (countMap[r.customer_id] ?? 0) + (r.status === 'Completed' ? 1 : 0);
        if (r.status === 'Completed') {
          spendMap[r.customer_id] = (spendMap[r.customer_id] ?? 0) + (r.final_price ?? r.price ?? 0);
          if (!lastMap[r.customer_id] || r.booking_date > lastMap[r.customer_id]) {
            lastMap[r.customer_id] = r.booking_date;
          }
          if (r.service_name) {
            if (!servicesMap[r.customer_id]) servicesMap[r.customer_id] = [];
            servicesMap[r.customer_id].push(r.service_name);
          }
        }
      });
      const processed = custs.map(c => {
        const effCount = (c.visit_count_base ?? 0) + (countMap[c.id] ?? 0);
        const spend = spendMap[c.id] ?? 0;
        const lastV = lastMap[c.id] ?? null;
        const seg = getRFMSegment(lastV, effCount, spend, c.created_at);
        return {
          ...c,
          effective_count: effCount,
          total_spending:  spend,
          last_visit:      lastV,
          segment:         seg,
          services_history: servicesMap[c.id] ?? [],
        };
      });
      setCustomers(processed);
      
      // Update selected drawer customer if open
      if (selectedCustomer) {
        const fresh = processed.find(c => c.id === selectedCustomer.id);
        if (fresh) setSelectedCustomer(fresh);
      }
    }
    setLoading(false);
  }, [selectedCustomer]);

  useEffect(() => { fetchData(); }, []);

  const loadHistory = async (customerId: string) => {
    setLoadingHistory(true);
    const { data } = await supabase
      .from('bookings')
      .select(`
        id, service_name, booking_date, booking_time, price, final_price, status, discount_total, notes, bhp_cost,
        booking_items (
          id, service_name, price, bhp_cost, commission_earned,
          therapists (
            name
          )
        )
      `)
      .eq('customer_id', customerId)
      .order('booking_date', { ascending: false })
      .limit(10);
    setBookingHistory(data ?? []);
    setLoadingHistory(false);
  };

  const startEdit = (c: Customer) => {
    setEditId(c.id);
    setEditData({ ...c });
    setFormOpen(true);
  };

  const saveEdit = async () => {
    if (!editId) return;
    setSaving(true);
    await supabase.from('customers').update({
      name: editData.name,
      visit_count_base: editData.visit_count_base ?? 0,
      notes: editData.notes,
      updated_at: new Date().toISOString(),
    }).eq('id', editId);
    
    await fetchData();
    setEditId(null);
    setFormOpen(false);
    setSaving(false);
  };

  const deleteCustomer = async (id: string, name: string | null) => {
    if (!confirm(`Hapus customer ${name || '(tanpa nama)'}? Data booking terkait tidak akan terhapus tapi referensi pelanggannya akan hilang.`)) return;
    await supabase.from('customers').delete().eq('id', id);
    if (selectedCustomer?.id === id) {
      setDrawerOpen(false);
    }
    await fetchData();
  };

  const addCustomer = async () => {
    if (!newCust.wa_number) return;
    setSaving(true);
    let wa = (newCust.wa_number ?? '').replace(/\D/g, '');
    if (wa.startsWith('0')) wa = '62' + wa.substring(1);

    const { error } = await supabase.from('customers').insert({
      wa_number: wa,
      name: newCust.name ?? null,
      visit_count_base: newCust.visit_count_base ?? 0,
      notes: newCust.notes ?? null,
    });
    if (!error) {
      await fetchData();
      setShowAdd(false);
      setNewCust({ wa_number: '62', visit_count_base: 0 });
    } else {
      alert("Gagal menambahkan customer: " + error.message);
    }
    setSaving(false);
  };

  const getEligiblePromo = (c: Customer): Discount | null => {
    const nextCount = (c.effective_count ?? 0) + 1;
    const loyal = discounts
      .filter(d => d.type === 'loyal' && d.min_orders && nextCount >= d.min_orders)
      .sort((a, b) => (b.min_orders ?? 0) - (a.min_orders ?? 0))[0];
    if (loyal) return loyal;

    if (c.last_visit) {
      const days = Math.floor((Date.now() - new Date(c.last_visit + 'T00:00:00').getTime()) / 86400000);
      if (days >= reEngageDays) {
        const rc = discounts.find(d => d.type === 'returning_customer');
        if (rc) return rc;
      }
    }
    return null;
  };

  const isDormant = (c: Customer) => {
    if (!c.last_visit) return false;
    const days = Math.floor((Date.now() - new Date(c.last_visit + 'T00:00:00').getTime()) / 86400000);
    return days >= reEngageDays;
  };

  const isEligibleForPromo = (c: Customer) => getEligiblePromo(c) !== null;

  const sendReEngageWA = (c: Customer, promo?: Discount | null) => {
    const days = c.last_visit
      ? Math.floor((Date.now() - new Date(c.last_visit + 'T00:00:00').getTime()) / 86400000)
      : reEngageDays;
    
    let template = reEngageTemplate ||
      'Halo {nama}! 😊 Sudah {hari} hari nih kita belum ketemu... Kangen? Yuk book sesi relaksasi di SerenaRaga! Ada promo spesial untuk kamu. 🌿';
      
    if (promo) {
      template = reEngagePromoTemplate || 'Halo {nama}, kami punya diskon {diskon} spesial untuk kamu! Yuk book sesi relaksasi di SerenaRaga.';
    }

    const discountValue = promo 
      ? (promo.value_type === 'percentage' ? `${promo.value}%` : formatRp(promo.value))
      : '';

    const recService = getTreatmentRecommendation(c.services_history);

    const msg = template
      .replace('{nama}', c.name ?? 'Kak')
      .replace('{hari}', String(days))
      .replace('{diskon}', promo ? `${promo.name} (${discountValue})` : '')
      .replace('{rekomendasi}', recService);
      
    window.open(`https://wa.me/${c.wa_number.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const filtered = customers
    .filter(c => filterMode === 'followup' ? (isDormant(c) || isEligibleForPromo(c)) : true)
    .filter(c => activeSegment === 'all' || c.segment === activeSegment)
    .filter(c =>
      !search ||
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.wa_number.includes(search)
    );

  const followUpCount = customers.filter(c => isDormant(c) || isEligibleForPromo(c)).length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Users size={20} className="text-earth-primary" /> Pelanggan
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 font-medium">{customers.length} pelanggan terdaftar</p>
        </div>
        <button
          onClick={() => {
            setNewCust({ wa_number: '62', visit_count_base: 0 });
            setShowAdd(true);
          }}
          className="admin-btn-primary text-xs"
        >
          <Plus size={16} /> Tambah Customer
        </button>
      </div>

      {/* LTV Summary Bar — Owner only */}
      {isOwner && (() => {
        const totalLTV    = customers.reduce((s, c) => s + (c.total_spending ?? 0), 0);
        const avgLTV      = customers.length ? Math.round(totalLTV / customers.length) : 0;
        const returning   = customers.filter(c => (c.effective_count ?? 0) >= 2).length;
        return (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: Users,     label: 'Total Pelanggan', value: customers.length.toString(),                       color: 'text-zinc-500 bg-zinc-500/10' },
              { icon: TrendingUp,label: 'Total LTV',       value: totalLTV >= 1000000 ? `Rp ${(totalLTV/1000000).toFixed(1)}JT` : formatRp(totalLTV), color: 'text-emerald-600 bg-emerald-500/10 dark:text-emerald-400' },
              { icon: Wallet,    label: 'Rata-rata LTV',   value: formatRp(avgLTV),                                  color: 'text-blue-600 bg-blue-500/10 dark:text-blue-400' },
              { icon: Star,      label: 'Pelanggan Setia', value: `${returning} orang`,                              color: 'text-amber-600 bg-amber-500/10 dark:text-amber-400' },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center mb-2.5 ${color.split(' ')[1]}`}>
                  <Icon size={14} className={color.split(' ')[0]} />
                </div>
                <p className="text-base font-bold text-zinc-900 dark:text-white leading-tight">{value}</p>
                <p className="text-[10px] text-zinc-400 font-semibold mt-1 uppercase tracking-wider">{label}</p>
              </div>
            ))}
          </div>
        );
      })()}

      {/* Info Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-100 dark:border-blue-900/30 p-4 text-xs text-blue-700 dark:text-blue-300 leading-relaxed shadow-sm">
        <p className="font-bold mb-0.5 flex items-center gap-1">
          <AlertCircle size={13} /> Cara Kerja Total Kunjungan
        </p>
        <p>Total kunjungan = <strong>Kunjungan Awal Offline</strong> + jumlah booking berstatus <strong>Completed</strong> di database. Atur Kunjungan Awal Offline agar segmentasi dan tier loyalty pelanggan lama Anda terdeteksi secara akurat.</p>
      </div>

      {/* Filter Tabs + Search Toolbar */}
      <div className="flex flex-col md:flex-row gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3 items-stretch md:items-center">
        {/* All / Follow-up tabs */}
        <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl p-1 shrink-0">
          <button onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              filterMode === 'all' ? 'bg-white dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100 shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}>
            Semua ({customers.length})
          </button>
          <button onClick={() => setFilterMode('followup')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              filterMode === 'followup'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}>
            <AlertCircle size={12} />
            Perlu Follow-up
            {followUpCount > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-extrabold ${
                filterMode === 'followup' ? 'bg-white/25 text-white' : 'bg-orange-100 text-orange-600'
              }`}>{followUpCount}</span>
            )}
          </button>
        </div>

        {/* Segment Filter Dropdown */}
        <div className="shrink-0">
          <select value={activeSegment} onChange={e => setActiveSegment(e.target.value as any)}
            className="admin-input text-xs font-bold h-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl px-3 py-2 text-zinc-700 dark:text-zinc-300 cursor-pointer focus:outline-none">
            <option value="all">Semua Segmen RFM</option>
            <option value="Champions">🏆 Champions</option>
            <option value="Loyalists">⭐ Loyalists</option>
            <option value="New">🌱 Baru (New)</option>
            <option value="About to Sleep">😴 Hampir Tertidur</option>
            <option value="Dormant/Lost">💤 Dormant/Lost</option>
          </select>
        </div>

        {/* Search Input */}
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          <input className="admin-input pl-9 text-xs" placeholder="Cari nama atau nomor WA..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Customers List Cards */}
      {loading ? (
        <AdminSkeleton rows={6} />
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-xs text-zinc-400 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          {search ? 'Customer tidak ditemukan.' : 'Belum ada customer. Customer akan otomatis terdaftar saat booking dibuat.'}
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800 shadow-sm">
          {filtered.map(c => (
            <div
              key={c.id}
              onClick={() => {
                setSelectedCustomer(c);
                setDrawerOpen(true);
                setBookingHistory([]);
                setLoadingHistory(true);
                loadHistory(c.id);
              }}
              className={`group px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-all border-l-2 ${
                (isDormant(c) || isEligibleForPromo(c)) 
                  ? 'border-l-orange-400 bg-orange-50/5 dark:bg-orange-950/5' 
                  : 'border-l-transparent'
              }`}
            >
              <div className="flex items-center gap-4 min-w-0">
                {/* Avatar with initial */}
                <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 border border-zinc-200/50 dark:border-zinc-700/50 group-hover:border-earth-primary/30 transition-colors">
                  <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300 group-hover:text-earth-primary transition-colors">
                    {(c.name ?? c.wa_number).slice(0, 1).toUpperCase()}
                  </span>
                </div>

                {/* Info Column */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold text-sm text-zinc-900 dark:text-white leading-tight">
                      {c.name || '(Tanpa Nama)'}
                    </h4>
                    {c.segment && (
                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                        c.segment === 'Champions' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                        c.segment === 'Loyalists' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                        c.segment === 'New' ? 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400' :
                        c.segment === 'About to Sleep' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                        'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      }`}>
                        {c.segment}
                      </span>
                    )}
                    <TierBadge count={c.effective_count ?? 0} discounts={discounts} />
                  </div>
                  
                  <div className="flex items-center gap-3 mt-1 text-xs text-zinc-400 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Phone size={11} /> {c.wa_number}
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-zinc-500 dark:text-zinc-400">
                      <Hash size={11} /> {c.effective_count ?? 0}x kunjungan
                      {c.visit_count_base > 0 && (
                        <span className="text-zinc-400 font-normal ml-0.5">({c.visit_count_base} offline)</span>
                      )}
                    </span>
                    {c.last_visit && (
                      <span className="text-[10px] text-zinc-400">
                        Terakhir: {formatDate(c.last_visit)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right side stats & actions */}
              <div className="flex items-center gap-4 shrink-0" onClick={e => e.stopPropagation()}>
                {/* LTV value (hidden on mobile) */}
                {isOwner && (c.total_spending ?? 0) > 0 && (
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Total Spending</p>
                    <p className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {formatRp(c.total_spending ?? 0)}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-1">
                  {(isDormant(c) || isEligibleForPromo(c)) && (
                    <button
                      onClick={() => {
                        const promo = getEligiblePromo(c);
                        sendReEngageWA(c, promo);
                      }}
                      className="p-2 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/20 rounded-lg transition-colors"
                      title="Kirim WhatsApp Re-engagement"
                    >
                      <MessageCircle size={14} />
                    </button>
                  )}
                  
                  <button
                    onClick={() => {
                      setSelectedCustomer(c);
                      setDrawerOpen(true);
                      setBookingHistory([]);
                      setLoadingHistory(true);
                      loadHistory(c.id);
                    }}
                    className="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                    title="Lihat Detail & Riwayat"
                  >
                    <CalendarCheck size={14} />
                  </button>

                  <button
                    onClick={() => startEdit(c)}
                    className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Pencil size={14} />
                  </button>

                  <button
                    onClick={() => deleteCustomer(c.id, c.name)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                    title="Hapus"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sliding Customer Detail Drawer */}
      <CustomerDrawer
        customer={selectedCustomer}
        discounts={discounts}
        bookingHistory={bookingHistory}
        loadingHistory={loadingHistory}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSendWA={(draftMessage) => {
          window.open(`https://wa.me/${selectedCustomer?.wa_number.replace(/\D/g, '')}?text=${encodeURIComponent(draftMessage)}`, '_blank');
        }}
        onEdit={() => {
          if (selectedCustomer) {
            setDrawerOpen(false);
            startEdit(selectedCustomer);
          }
        }}
        reEngageDays={reEngageDays}
        reEngageTemplate={reEngageTemplate}
        reEngagePromoTemplate={reEngagePromoTemplate}
      />

      {/* Add Customer Modal */}
      <CustomerModalForm
        isOpen={showAdd}
        data={newCust}
        saving={saving}
        isNew={true}
        onChange={setNewCust}
        onSave={addCustomer}
        onCancel={() => setShowAdd(false)}
      />

      {/* Edit Customer Modal */}
      <CustomerModalForm
        isOpen={formOpen}
        data={editData}
        saving={saving}
        isNew={false}
        onChange={setEditData}
        onSave={saveEdit}
        onCancel={() => setFormOpen(false)}
      />
    </div>
  );
}

export default function CustomersPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center p-12 text-sm text-zinc-400">
        <Loader2 className="animate-spin text-earth-primary mr-2" size={16} />
        Loading...
      </div>
    }>
      <CustomersPageInner />
    </Suspense>
  );
}
