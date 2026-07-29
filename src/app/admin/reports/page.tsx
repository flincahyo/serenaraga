'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  Download, BarChart3, FlaskConical, Calendar, 
  ChevronDown, Search, X, User, MessageCircle, 
  ClipboardList, ChevronRight, CheckCircle2, TrendingUp, Info, HelpCircle, AlertCircle
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase';
import { AdminSkeleton } from '@/components/admin/AdminSkeleton';

type BookingItemLinked = { 
  id?: string;
  commission_earned: number; 
  service_name: string; 
  price: number; 
  bhp_cost?: number;
  duration?: string;
  therapist_id: string; 
  parent_bundle_name?: string | null;
  therapists?: { name: string; commission_pct?: number } | null;
};

type BookingDiscount = {
  id?: string;
  discount_label: string;
  discount_value: number;
  discount_value_type: string;
  discount_amount: number;
  is_owner_borne: boolean;
};

type Booking = {
  id: string; 
  customer_name?: string; 
  phone?: string;
  service_name: string; 
  booking_date: string; 
  booking_time?: string;
  price: number; 
  final_price?: number; 
  discount_total?: number;
  shared_discount_total?: number;
  therapist_discount_total?: number;
  status: string; 
  bhp_cost?: number;
  notes?: string;
  created_at?: string;
  customer_id?: string;
  booking_items?: BookingItemLinked[];
  booking_discounts?: BookingDiscount[];
};

const formatRp = (n: number) => `Rp ${Number(n).toLocaleString('id-ID')}`;
const MONTHS_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];

// ──────────────────────────────────────────
// ReportDrawer Component
// ──────────────────────────────────────────
function ReportDrawer({
  booking,
  isOpen,
  onClose,
  calcTerapisCut,
}: {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
  calcTerapisCut: (b: Booking) => number;
}) {
  if (!booking) return null;

  const paidTotal = booking.final_price ?? booking.price;
  const discount = booking.discount_total ?? 0;
  const terapisCut = calcTerapisCut(booking);
  const bhpCost = booking.bhp_cost ?? 0;
  const ownerNet = paidTotal - terapisCut - bhpCost;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
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
            className="fixed right-0 top-0 bottom-0 w-full md:max-w-2xl bg-white dark:bg-zinc-950 shadow-2xl z-50 border-l border-zinc-200 dark:border-zinc-800 flex flex-col"
          >
            {/* Header */}
            <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50">
              <div>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-250/20 dark:bg-emerald-950/30 dark:text-emerald-450 dark:border-emerald-900 mb-1.5">
                  Completed
                </span>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white leading-tight">Detail Transaksi & Audit</h3>
                <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[10px] text-zinc-400 dark:text-zinc-500">
                  <span className="font-mono">No. Invoice:</span>
                  <span className="font-mono font-bold text-earth-primary bg-earth-primary/5 dark:bg-earth-primary/10 px-1.5 py-0.5 rounded">
                    {(() => {
                      const dateObj = new Date(booking.booking_date + 'T00:00:00');
                      const y = dateObj.getFullYear();
                      const m = String(dateObj.getMonth() + 1).padStart(2, '0');
                      const last4 = booking.id.substring(booking.id.length - 4).toUpperCase();
                      return `SR-${y}${m}-${last4}`;
                    })()}
                  </span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin">
              {/* Customer Profile Section */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Profil Pelanggan</h4>
                <div className="bg-[#FAF7F2] dark:bg-zinc-900/60 border border-[#EBE3D5] dark:border-zinc-800/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-earth-primary/10 flex items-center justify-center text-earth-primary shrink-0 font-bold">
                      {(booking.customer_name || 'W').slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-850 dark:text-zinc-100">{booking.customer_name || 'Walk-in Customer'}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                        {booking.phone ? `+${booking.phone}` : 'Walk-in (Tanpa nomor WA)'}
                      </p>
                    </div>
                  </div>
                  {booking.phone && (
                    <a
                      href={`https://wa.me/${booking.phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shrink-0"
                    >
                      <MessageCircle size={14} /> Hubungi WhatsApp
                    </a>
                  )}
                </div>
              </div>

              {/* Service Dates/Times */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-50/50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3.5">
                  <span className="text-[10px] text-zinc-400 block uppercase font-bold tracking-wider">Tanggal Layanan</span>
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-100 mt-1 block">
                    {new Date(booking.booking_date + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
                <div className="bg-zinc-50/50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3.5">
                  <span className="text-[10px] text-zinc-400 block uppercase font-bold tracking-wider">Jam Mulai</span>
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-100 mt-1 block font-mono">
                    {booking.booking_time ? booking.booking_time.slice(0, 5) : '—'}
                  </span>
                </div>
              </div>

              {/* Itemized breakdown table */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Rincian Item & Jasa Terapis</h4>
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-zinc-900">
                  <table className="w-full text-[11px] text-left">
                    <thead>
                      <tr className="bg-zinc-50 dark:bg-zinc-800/40 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-bold uppercase tracking-wider">
                        <th className="px-4 py-2.5">Nama Layanan</th>
                        <th className="px-4 py-2.5 text-right">Harga</th>
                        <th className="px-4 py-2.5">Assign Terapis</th>
                        <th className="px-4 py-2.5 text-right text-amber-600">Komisi</th>
                        <th className="px-4 py-2.5 text-right text-blue-500">BHP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-150 dark:divide-zinc-850 text-zinc-700 dark:text-zinc-300">
                      {booking.booking_items && booking.booking_items.length > 0 ? (
                        booking.booking_items.map((item, idx) => {
                          const isTransport = item.service_name === 'Biaya Transport';
                          const serviceItems = booking.booking_items ? booking.booking_items.filter(i => i.service_name !== 'Biaya Transport') : [];
                          const grossTotal = serviceItems.reduce((s, i) => s + (i.price || 0), 0);
                          
                          const sharedDisc = booking.shared_discount_total || 0;
                          const therapistDisc = booking.therapist_discount_total || 0;
                          
                          const itemSharedDisc = !isTransport && grossTotal > 0 ? Math.round((item.price / grossTotal) * sharedDisc) : 0;
                          const itemTherapistDisc = !isTransport && grossTotal > 0 ? Math.round((item.price / grossTotal) * therapistDisc) : 0;
                          
                          const therapistRate = item.therapists?.commission_pct ?? 30;
                          
                          const therapistBearsShared = !isTransport ? Math.round(itemSharedDisc * 50 / 100) : 0;
                          const maxBasisReduction = !isTransport ? Math.round(item.price * 5 / 100) : 0;
                          const basisReduction = !isTransport ? Math.min(itemTherapistDisc, maxBasisReduction) : 0;
                          const itemBasis = !isTransport ? item.price - basisReduction : 0;
                          const transportPct = isTransport && item.price > 0 ? Math.round((item.commission_earned / item.price) * 100) : 0;

                          return (
                            <tr key={item.id || idx} className="hover:bg-zinc-50/30 dark:hover:bg-zinc-800/10">
                              <td className="px-4 py-3">
                                <span className="font-bold block">{item.service_name}</span>
                                {item.parent_bundle_name && (
                                  <span className="block text-[9px] text-earth-primary font-bold mt-0.5">
                                    Bundle: {item.parent_bundle_name}
                                  </span>
                                )}
                                {!isTransport && (itemSharedDisc > 0 || itemTherapistDisc > 0) && (
                                  <div className="space-y-0.5 mt-1 text-[9px] text-zinc-400 font-semibold">
                                    {itemSharedDisc > 0 && (
                                      <span className="block">
                                        ↳ Shared 50-50: 50% dari {formatRp(itemSharedDisc)} = -{formatRp(therapistBearsShared)}
                                      </span>
                                    )}
                                    {itemTherapistDisc > 0 && (
                                      <span className="block">
                                        ↳ Potong Basis (Max 5%): -{formatRp(basisReduction)}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right font-mono font-medium">{formatRp(item.price)}</td>
                              <td className="px-4 py-3">
                                <div className="font-semibold">{item.therapists?.name || <span className="text-zinc-400">—</span>}</div>
                                {item.therapists?.commission_pct !== undefined && (
                                  <span className="text-[9px] text-zinc-400 block mt-0.5">
                                    Rate: {item.therapists.commission_pct}%
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right text-amber-600 font-mono">
                                <span className="font-bold block">{formatRp(item.commission_earned)}</span>
                                {item.therapist_id && (
                                  <span className="text-[9px] text-zinc-400 block mt-0.5">
                                    {isTransport ? (
                                      `(${transportPct}% Transport)`
                                    ) : (
                                      `(${therapistRate}% dari ${formatRp(itemBasis)})` +
                                      (therapistBearsShared > 0 ? ` - ${formatRp(therapistBearsShared)}` : '')
                                    )}
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right text-blue-500 font-mono font-medium">
                                {item.bhp_cost ? formatRp(item.bhp_cost) : '—'}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-4 py-6 text-center text-zinc-400 italic">
                            Tidak ditemukan item rincian transaksi.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total Summary Breakdown */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Rincian Finansial Transaksi</h4>
                <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4.5 space-y-3 text-xs">
                  {/* Original Gross */}
                  <div className="flex justify-between text-zinc-500 dark:text-zinc-400 font-medium">
                    <span>Total Jasa Kotor (Gross)</span>
                    <span className="font-mono font-bold">{formatRp(booking.price)}</span>
                  </div>

                  {/* Discounts Info */}
                  {booking.discount_total ? (
                    <div className="space-y-1.5 border-t border-dashed border-zinc-200 dark:border-zinc-800 pt-2.5">
                      <div className="flex justify-between text-amber-600 font-bold">
                        <span>Total Diskon Pelanggan</span>
                        <span className="font-mono">-{formatRp(booking.discount_total)}</span>
                      </div>

                      {/* Applied discounts list */}
                      {booking.booking_discounts && booking.booking_discounts.length > 0 && (
                        <div className="space-y-1 pl-3 text-[11px] text-zinc-500 dark:text-zinc-450 font-medium">
                          {booking.booking_discounts.map((disc, idx) => {
                            const showAmount = booking.booking_discounts!.length > 1;
                            return (
                              <div key={idx} className="flex justify-between items-center">
                                <span>
                                  ↳ {disc.discount_label} {disc.discount_value_type === 'percentage' ? `(${disc.discount_value}%)` : ''}
                                </span>
                                {showAmount && (
                                  <span className="font-mono font-bold">-{formatRp(disc.discount_amount)}</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {(() => {
                        const totalDisc = booking.discount_total || 0;
                        const sharedDisc = booking.shared_discount_total || 0;
                        const rawTherapistDisc = booking.therapist_discount_total || 0;
                        
                        const serviceItems = booking.booking_items ? booking.booking_items.filter(i => i.service_name !== 'Biaya Transport') : [];
                        const grossTotal = serviceItems.reduce((s, i) => s + (i.price || 0), 0);
                        
                        const maxTherapistBears = Math.round(grossTotal * 5 / 100);
                        const actualTherapistBears = Math.min(rawTherapistDisc, maxTherapistBears);
                        const excessOwnerBears = rawTherapistDisc - actualTherapistBears;
                        
                        const pureOwnerBears = totalDisc - sharedDisc - rawTherapistDisc;
                        const totalOwnerBears = pureOwnerBears + excessOwnerBears;
                        
                        return (
                          <div className="space-y-1 text-[11px] text-zinc-400 dark:text-zinc-500 font-medium">
                            <div className="flex justify-between">
                              <span>Ditanggung Owner (Non-Shared)</span>
                              <span className="font-mono font-bold">{formatRp(totalOwnerBears)}</span>
                            </div>
                            {sharedDisc > 0 ? (
                              <div className="flex justify-between">
                                <span>Potongan DPP Terapis (Shared 50-50)</span>
                                <span className="font-mono font-bold">{formatRp(sharedDisc)}</span>
                              </div>
                            ) : null}
                            {rawTherapistDisc > 0 ? (
                              <div className="flex justify-between">
                                <span>Potongan DPP Terapis (Terapis Cap 5%)</span>
                                <span className="font-mono font-bold">{formatRp(actualTherapistBears)}</span>
                              </div>
                            ) : null}
                          </div>
                        );
                      })()}
                    </div>
                  ) : null}

                  {/* DPP Sales (Final Price) */}
                  <div className="flex justify-between font-bold text-zinc-900 dark:text-white border-t border-zinc-200 dark:border-zinc-800 pt-2.5">
                    <span>Total Penerimaan Pelanggan (DPP)</span>
                    <span className="font-mono">{formatRp(booking.final_price ?? booking.price)}</span>
                  </div>

                  {/* Commission Cuts */}
                  <div className="flex justify-between text-amber-600 font-bold">
                    <span>Komisi Jasa & Transport Terapis</span>
                    <span className="font-mono">-{formatRp(terapisCut)}</span>
                  </div>

                  {/* BHP Costs */}
                  <div className="flex justify-between text-blue-500 font-bold">
                    <span>Biaya Bahan Habis Pakai (BHP)</span>
                    <span className="font-mono">-{formatRp(booking.bhp_cost || 0)}</span>
                  </div>

                  {/* Final Net owner revenue */}
                  <div className="flex justify-between font-black text-xs text-emerald-700 dark:text-emerald-450 bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 p-3.5 rounded-xl mt-2">
                    <span>Net Income Owner (Pendapatan Bersih)</span>
                    <span className="font-mono text-sm font-extrabold text-emerald-600 dark:text-emerald-450">
                      {formatRp(ownerNet)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Note */}
              {booking.notes && (
                <div className="bg-amber-50/40 dark:bg-amber-950/10 border border-amber-100/50 dark:border-amber-900/20 rounded-2xl p-4">
                  <span className="text-[10px] text-amber-700 dark:text-amber-400 block font-bold uppercase tracking-wider mb-1">Catatan Pelanggan</span>
                  <p className="text-xs text-zinc-700 dark:text-zinc-300 italic font-medium">"{booking.notes}"</p>
                </div>
              )}

              {/* Metadata system */}
              <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 space-y-2.5 text-[10px] text-zinc-450 dark:text-zinc-500 font-mono">
                <p className="uppercase font-bold tracking-wider text-[9px] mb-1.5 text-zinc-500">Metadata Sistem & Audit</p>
                <p className="flex justify-between">
                  <span>Dibuat Pada:</span>
                  <span className="font-bold">{booking.created_at ? new Date(booking.created_at).toLocaleString('id-ID') : '—'}</span>
                </p>
                <p className="flex justify-between">
                  <span>Customer DB ID:</span>
                  <span className="font-bold">{booking.customer_id || 'Walk-in (Tidak Taut Akun)'}</span>
                </p>
                <p className="flex justify-between">
                  <span>System UUID:</span>
                  <span className="select-all font-bold">{booking.id}</span>
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end bg-zinc-50 dark:bg-zinc-900/50">
              <button 
                onClick={onClose}
                className="admin-btn-ghost rounded-xl py-2 text-xs font-bold"
              >
                Tutup Detail
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ──────────────────────────────────────────
// Main Page Component
// ──────────────────────────────────────────
export default function ReportsPage() {
  const [bookings, setBookings]           = useState<Booking[]>([]);
  const [loading, setLoading]             = useState(true);
  const [commissionPct, setCommissionPct] = useState(30);

  // Filter States
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all'); // 'all' or 'YYYY-MM'
  const [activeTab, setActiveTab]           = useState<'dashboard' | 'history'>('dashboard');
  const [searchTerm, setSearchTerm]         = useState<string>('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [{ data }, { data: settingsRows }] = await Promise.all([
      supabase.from('bookings')
        .select(`
          id, customer_name, phone, service_name, booking_date, booking_time, price, final_price,
          discount_total, shared_discount_total, therapist_discount_total, status, bhp_cost, notes, created_at, customer_id,
          booking_items(id, commission_earned, service_name, price, bhp_cost, duration, therapist_id, parent_bundle_name, therapists(name, commission_pct)),
          booking_discounts(id, discount_label, discount_value, discount_value_type, discount_amount, is_owner_borne)
        `)
        .eq('status', 'Completed')
        .order('booking_date'),
      supabase.from('settings').select('key, value').eq('key', 'terapis_commission_pct'),
    ]);
    if (data) setBookings(data as unknown as Booking[]);
    if (settingsRows) {
      settingsRows.forEach(({ key, value }) => {
        if (key === 'terapis_commission_pct') setCommissionPct(Number(value) || 30);
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => { 
    fetchData(); 
  }, [fetchData]);

  // Extract distinct available periods (YYYY-MM) from bookings
  const periodOptions = useMemo(() => {
    const periods = new Set<string>();
    bookings.forEach(b => {
      if (b.booking_date) {
        periods.add(b.booking_date.substring(0, 7)); // Extract "YYYY-MM"
      }
    });
    return Array.from(periods).sort().reverse(); // Sort latest first
  }, [bookings]);

  const formatPeriodLabel = (period: string) => {
    const [year, month] = period.split('-');
    const mIdx = parseInt(month, 10) - 1;
    return `${MONTHS_ID[mIdx]} ${year}`;
  };

  const calcTerapisCut = useCallback((b: Booking) => {
    if (b.booking_items && b.booking_items.length > 0) {
      return b.booking_items.reduce((ss: number, i) => ss + (Number(i.commission_earned) || 0), 0);
    }
    const grossPrice = b.price ?? 0;
    const grossComm = Math.round(grossPrice * commissionPct / 100);
    const sharedDiscBears = Math.round((b.shared_discount_total ?? 0) * 50 / 100);
    const therapistDiscBears = Number(b.therapist_discount_total) || 0;
    return Math.max(0, grossComm - sharedDiscBears - therapistDiscBears);
  }, [commissionPct]);

  // ── Filter bookings by selected month/year period ──
  const periodFilteredBookings = useMemo(() => {
    if (selectedPeriod === 'all') return bookings;
    return bookings.filter(b => b.booking_date && b.booking_date.substring(0, 7) === selectedPeriod);
  }, [bookings, selectedPeriod]);

  // Pagination State
  const [itemsPerPage, setItemsPerPage] = useState<number | 'all'>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // ── Filter bookings by month AND search query (for the list table) ──
  const tableFilteredBookings = useMemo(() => {
    if (!searchTerm.trim()) return periodFilteredBookings;
    const q = searchTerm.toLowerCase();
    return periodFilteredBookings.filter(b => 
      b.customer_name?.toLowerCase().includes(q) ||
      b.service_name?.toLowerCase().includes(q) ||
      b.id.toLowerCase().includes(q)
    );
  }, [periodFilteredBookings, searchTerm]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedPeriod, itemsPerPage]);

  const sortedBookings = useMemo(() => {
    return [...tableFilteredBookings].reverse();
  }, [tableFilteredBookings]);

  const totalFilteredCount = sortedBookings.length;
  const numPerPage = itemsPerPage === 'all' ? totalFilteredCount : Number(itemsPerPage);
  const totalPages = itemsPerPage === 'all' || totalFilteredCount === 0 ? 1 : Math.ceil(totalFilteredCount / numPerPage);

  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = totalFilteredCount === 0 ? 0 : (safeCurrentPage - 1) * numPerPage;
  const endIndex = itemsPerPage === 'all' ? totalFilteredCount : Math.min(startIndex + numPerPage, totalFilteredCount);

  const paginatedBookings = useMemo(() => {
    return itemsPerPage === 'all'
      ? sortedBookings
      : sortedBookings.slice(startIndex, endIndex);
  }, [sortedBookings, itemsPerPage, startIndex, endIndex]);

  // ── Monthly chart data leading up to the selected period (6-month range) ──
  const monthlyData = useMemo(() => {
    const endMonthDate = selectedPeriod === 'all' 
      ? new Date() 
      : new Date(parseInt(selectedPeriod.split('-')[0]), parseInt(selectedPeriod.split('-')[1]) - 1, 1);
      
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(endMonthDate.getFullYear(), endMonthDate.getMonth() - (5 - i), 1);
      const y = d.getFullYear();
      const m = d.getMonth();
      
      const mb = bookings.filter(b => {
        if (!b.booking_date) return false;
        const bd = new Date(b.booking_date + 'T00:00:00');
        return bd.getFullYear() === y && bd.getMonth() === m;
      });

      const gross    = mb.reduce((s, b) => s + (b.final_price ?? b.price ?? 0), 0);
      const discount = mb.reduce((s, b) => s + (b.discount_total ?? 0), 0);
      const terapis  = mb.reduce((s, b) => s + calcTerapisCut(b), 0);
      const bhp      = mb.reduce((s, b) => s + (b.bhp_cost ?? 0), 0);
      const net      = gross - terapis - bhp;
      return { 
        month: `${MONTHS_ID[m]} ${y.toString().slice(-2)}`, 
        bookings: mb.length, 
        gross, 
        discount, 
        terapis, 
        bhp, 
        net 
      };
    });
  }, [bookings, selectedPeriod, calcTerapisCut]);

  // ── Service breakdown calculated from period-filtered bookings ──
  const serviceBreakdown = useMemo(() => {
    const serviceMap: Record<string, { count: number; gross: number; discount: number; terapis: number; bhp: number }> = {};
    periodFilteredBookings.forEach(b => {
      if (!b.service_name) return;
      if (!serviceMap[b.service_name]) serviceMap[b.service_name] = { count: 0, gross: 0, discount: 0, terapis: 0, bhp: 0 };
      serviceMap[b.service_name].count += 1;
      serviceMap[b.service_name].gross += b.price ?? 0;
      serviceMap[b.service_name].discount += b.discount_total ?? 0;
      serviceMap[b.service_name].bhp   += b.bhp_cost ?? 0;
      serviceMap[b.service_name].terapis += b.booking_items?.reduce((ss, i) => ss + (Number(i.commission_earned) || 0), 0) || 0;
    });

    return Object.entries(serviceMap)
      .map(([name, v]) => ({
        name,
        count:   v.count,
        gross:   v.gross,
        discount: v.discount,
        terapis: v.terapis,
        bhp:     Math.round(v.bhp),
        net:     Math.round((v.gross - v.discount) - v.terapis - v.bhp),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [periodFilteredBookings]);

  // Global calculations for selected period
  const totalGross    = periodFilteredBookings.reduce((s, b) => s + (b.final_price ?? b.price ?? 0), 0);
  const totalDiscount = periodFilteredBookings.reduce((s, b) => s + (b.discount_total ?? 0), 0);
  const totalBhp      = periodFilteredBookings.reduce((s, b) => s + (b.bhp_cost ?? 0), 0);
  const totalTerapis  = periodFilteredBookings.reduce((s, b) => s + calcTerapisCut(b), 0);
  const totalNet      = totalGross - totalTerapis - totalBhp;
  const totalBookings = periodFilteredBookings.length;
  const topService    = serviceBreakdown[0];
  const hasBhpData    = totalBhp > 0;

  const exportCSV = () => {
    const dataToExport = periodFilteredBookings;
    if (dataToExport.length === 0) {
      alert("Tidak ada data transaksi completed untuk diexport pada periode ini.");
      return;
    }

    const headers = [
      'Tanggal Transaksi',
      'ID Booking',
      'Nama Pelanggan',
      'Layanan Utama',
      'Status',
      'Harga Awal (Gross)',
      'Total Diskon',
      'Diskon yang Diterapkan',
      'Pendapatan Setelah Diskon (DPP / Net Sales)',
      'Komisi Terapis & Transport',
      'Biaya Bahan Habis Pakai (BHP)',
      'Pendapatan Bersih Owner (Net Income)'
    ];

    const rows = dataToExport.map(b => {
      const gross = b.price ?? 0;
      const discount = b.discount_total ?? 0;
      const appliedDiscs = b.booking_discounts && b.booking_discounts.length > 0
        ? b.booking_discounts.map(d => `${d.discount_label} (${d.discount_value_type === 'percentage' ? d.discount_value + '%' : formatRp(d.discount_amount)})`).join(', ')
        : '—';
      const netSales = b.final_price ?? gross;
      const terapis = calcTerapisCut(b);
      const bhp = b.bhp_cost ?? 0;
      const ownerNet = netSales - terapis - bhp;

      return [
        `"${b.booking_date}"`,
        `"${b.id}"`,
        `"${b.customer_name ?? ''}"`,
        `"${b.service_name ?? ''}"`,
        `"${b.status}"`,
        gross,
        discount,
        `"${appliedDiscs}"`,
        netSales,
        terapis,
        bhp,
        ownerNet
      ];
    });

    const totalRow = [
      '"TOTAL"', '', '', '', '',
      dataToExport.reduce((s, b) => s + (b.price ?? 0), 0),
      dataToExport.reduce((s, b) => s + (b.discount_total ?? 0), 0),
      '',
      dataToExport.reduce((s, b) => s + (b.final_price ?? b.price ?? 0), 0),
      dataToExport.reduce((s, b) => s + calcTerapisCut(b), 0),
      dataToExport.reduce((s, b) => s + (b.bhp_cost ?? 0), 0),
      dataToExport.reduce((s, b) => s + ((b.final_price ?? b.price ?? 0) - calcTerapisCut(b) - (b.bhp_cost ?? 0)), 0),
    ];

    const csvContent = '\uFEFF' + [headers, ...rows, [], totalRow].map(r => r.join(';')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const periodStr = selectedPeriod === 'all' ? 'All_Time' : selectedPeriod;
    link.download = `SerenaRaga_Report_${periodStr}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Recharts Solid Tooltip (No Backdrop Blur)
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xl text-xs font-sans">
          <p className="font-bold text-zinc-900 dark:text-white mb-2 border-b border-zinc-150 dark:border-zinc-800 pb-1.5">
            {payload[0].payload.month}
          </p>
          <div className="space-y-1.5 font-semibold">
            <div className="flex items-center justify-between gap-6 text-[#8B5E3C]">
              <span>Gross Sales:</span>
              <span className="font-mono font-bold">{formatRp(payload[0].payload.gross)}</span>
            </div>
            <div className="flex items-center justify-between gap-6 text-amber-600">
              <span>Komisi Terapis:</span>
              <span className="font-mono">{formatRp(payload[0].payload.terapis)}</span>
            </div>
            <div className="flex items-center justify-between gap-6 text-blue-500">
              <span>Bahan (BHP):</span>
              <span className="font-mono">{formatRp(payload[0].payload.bhp)}</span>
            </div>
            <div className="flex items-center justify-between gap-6 text-emerald-600 dark:text-emerald-450 border-t border-dashed border-zinc-200 dark:border-zinc-800 pt-1.5 font-bold">
              <span>Bersih Owner:</span>
              <span className="font-mono">{formatRp(payload[0].payload.net)}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const handleOpenDrawer = (b: Booking) => {
    setSelectedBooking(b);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedBooking(null);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Redesign */}
      <div className="flex items-center justify-between flex-wrap gap-4 pb-2">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <BarChart3 size={20} className="text-earth-primary" /> Laporan Keuangan & Performa
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
            Overview performa bisnis · hanya mencatat transaksi berstatus{' '}
            <span className="font-extrabold text-earth-primary">COMPLETED</span>
            {!hasBhpData && (
              <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-955/20 px-2 py-0.5 rounded-md border border-amber-250/20">
                <FlaskConical size={11} /> BHP belum terinput
              </span>
            )}
          </p>
        </div>
        
        {/* Global Controls */}
        <div className="flex items-center gap-3.5 flex-wrap">
          {/* Monthly Period Dropdown Filter */}
          <div className="relative inline-flex items-center">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="appearance-none bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 pl-9 pr-9 py-2 rounded-xl text-xs font-bold text-zinc-650 dark:text-zinc-300 cursor-pointer shadow-sm hover:border-earth-primary/50 transition-all outline-none"
            >
              <option value="all">Semua Periode</option>
              {periodOptions.map(p => (
                <option key={p} value={p}>{formatPeriodLabel(p)}</option>
              ))}
            </select>
            <Calendar size={13} className="absolute left-3.5 text-zinc-400 pointer-events-none" />
            <ChevronDown size={13} className="absolute right-3.5 text-zinc-400 pointer-events-none" />
          </div>

          <button onClick={exportCSV} className="admin-btn-ghost rounded-xl text-xs font-bold py-2">
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {loading ? (
        <AdminSkeleton rows={6} />
      ) : (
        <>
          {/* Tabs Switcher */}
          <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-6">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`pb-3 text-xs font-bold uppercase tracking-wider relative transition-all ${
                activeTab === 'dashboard'
                  ? 'text-earth-primary'
                  : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300'
              }`}
            >
              Ringkasan Laporan
              {activeTab === 'dashboard' && (
                <span className="absolute bottom-0 inset-x-0 h-0.5 bg-earth-primary rounded-full" />
              )}
            </button>
            <button
              onClick={() => {
                setActiveTab('history');
                setSearchTerm('');
              }}
              className={`pb-3 text-xs font-bold uppercase tracking-wider relative transition-all ${
                activeTab === 'history'
                  ? 'text-earth-primary'
                  : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300'
              }`}
            >
              Riwayat Transaksi ({periodFilteredBookings.length})
              {activeTab === 'history' && (
                <span className="absolute bottom-0 inset-x-0 h-0.5 bg-earth-primary rounded-full" />
              )}
            </button>
          </div>

          {/* TAB 1: DASHBOARD VIEW */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {/* Total Bookings */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 font-semibold">Total Booking</p>
                  <p className="text-2xl font-extrabold text-zinc-900 dark:text-white font-mono leading-none mt-1">{totalBookings}</p>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-550 mt-3.5 flex items-center gap-1 font-bold uppercase tracking-wider">
                    <ClipboardList size={11} className="text-earth-primary" />
                    Status Completed
                  </p>
                </div>

                {/* Gross Sales */}
                <div className="bg-[#FAF7F2] dark:bg-zinc-900/60 border border-[#EBE3D5] dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 font-semibold">Pendapatan Bersih (Net Sales)</p>
                  <p className="text-2xl font-extrabold text-zinc-900 dark:text-white font-mono leading-none mt-1">{formatRp(totalGross)}</p>
                  {totalDiscount > 0 ? (
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-3.5 font-bold uppercase tracking-wider">
                      Diskon terpakai: -{formatRp(totalDiscount)}
                    </p>
                  ) : (
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-550 mt-3.5 font-bold uppercase tracking-wider">Setelah promo / voucher</p>
                  )}
                </div>

                {/* Operational cuts */}
                <div className="bg-[#FFFDF5] dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/40 rounded-2xl p-5 shadow-sm">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 font-semibold">Beban Terapis & Bahan BHP</p>
                  <p className="text-2xl font-extrabold text-amber-700 dark:text-amber-400 font-mono leading-none mt-1">{formatRp(totalTerapis + totalBhp)}</p>
                  <p className="text-[10px] text-amber-600 dark:text-amber-500/80 mt-3.5 flex items-center justify-between font-bold uppercase tracking-wider">
                    <span>Komisi: {formatRp(totalTerapis)}</span>
                    <span>BHP: {formatRp(totalBhp)}</span>
                  </p>
                </div>

                {/* Owner net income */}
                <div className="bg-[#F6FAF7] dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/40 rounded-2xl p-5 shadow-sm">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 font-semibold">Margin Bersih Owner</p>
                  <p className="text-2xl font-extrabold text-emerald-705 dark:text-emerald-400 font-mono leading-none mt-1">{formatRp(totalNet)}</p>
                  <p className="text-[10px] text-emerald-700/70 dark:text-emerald-500/80 mt-3.5 font-bold uppercase tracking-wider">
                    {totalGross > 0 ? `${Math.round((totalNet / totalGross) * 100)}% Margin Bersih` : '0% Margin'}
                  </p>
                </div>
              </div>

              {/* Best Service Section */}
              {topService && (
                <div className="bg-[#FAF7F2] dark:bg-zinc-900/30 border border-[#EBE3D5] dark:border-zinc-800 rounded-2xl p-5 relative overflow-hidden">
                  <div className="absolute right-4 top-4 opacity-5 pointer-events-none">
                    <BarChart3 size={100} className="text-earth-primary" />
                  </div>
                  <div className="relative z-10">
                    <p className="text-xs text-zinc-550 mb-1 font-bold uppercase tracking-wider">Layanan Terlaris</p>
                    <h3 className="text-base font-extrabold text-[#8B5E3C] dark:text-earth-primary mt-1.5">{topService.name}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-[#EBE3D5] dark:border-zinc-800">
                      <div>
                        <span className="text-[9px] text-zinc-400 dark:text-zinc-500 block uppercase font-extrabold tracking-wider">Total Dipesan</span>
                        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 font-mono mt-0.5 block">{topService.count} Booking</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-zinc-400 dark:text-zinc-500 block uppercase font-extrabold tracking-wider">Kotor</span>
                        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 font-mono mt-0.5 block">{formatRp(topService.gross)}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-zinc-400 dark:text-zinc-500 block uppercase font-extrabold tracking-wider">BHP</span>
                        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 font-mono mt-0.5 block">{formatRp(topService.bhp)}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-emerald-600 block uppercase font-extrabold tracking-wider">Bersih Owner</span>
                        <span className="text-xs font-extrabold text-emerald-600 font-mono mt-0.5 block">{formatRp(topService.net)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Revenue Recharts Chart */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-earth-primary/5 flex items-center justify-center text-earth-primary shrink-0">
                      <TrendingUp size={16} />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-zinc-900 dark:text-white">Tren Pendapatan & Profit</h2>
                      <p className="text-xs text-zinc-400 mt-0.5 font-medium">Analisis 6 bulan terakhir</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-[9px] text-zinc-455 font-bold uppercase tracking-wider shrink-0 flex-wrap">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-[#8B5E3C] inline-block" />Kotor</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-amber-400 inline-block" />Terapis</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-blue-400 inline-block" />BHP</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-emerald-500 inline-block" />Bersih</span>
                  </div>
                </div>
                <div className="h-64">
                  {isMounted && (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: -15, bottom: 0 }} barCategoryGap="25%" barGap={3}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F4F4F5" className="dark:stroke-zinc-850" />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#71717A', fontWeight: 700 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: '#71717A', fontWeight: 600 }}
                          tickFormatter={v => v >= 1000000 ? `${(v/1000000).toFixed(1)}jt` : String(v)} />
                        <Tooltip
                          content={<CustomTooltip />}
                          cursor={{ fill: 'rgba(139,94,60,0.03)', radius: 4 }}
                        />
                        <Bar dataKey="gross"   name="gross"   fill="#8B5E3C" radius={[4,4,0,0]} />
                        <Bar dataKey="terapis" name="terapis" fill="#FBBF24" radius={[4,4,0,0]} />
                        <Bar dataKey="bhp"     name="bhp"     fill="#60A5FA" radius={[4,4,0,0]} />
                        <Bar dataKey="net"     name="net"     fill="#10B981" radius={[4,4,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Service Breakdown Table */}
              {serviceBreakdown.length > 0 && (
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
                  <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h2 className="text-sm font-bold text-zinc-900 dark:text-white">Performa per Layanan</h2>
                      <p className="text-xs text-zinc-400 mt-0.5 font-medium">Kontribusi finansial tiap layanan terlaris</p>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 z-10 font-bold uppercase tracking-wider text-zinc-500">
                          <th className="px-6 py-3">Layanan</th>
                          <th className="px-4 py-3 text-right">Booking</th>
                          <th className="px-4 py-3 text-right">Kotor (Gross)</th>
                          <th className="px-4 py-3 text-right text-amber-600">Terapis</th>
                          <th className="px-4 py-3 text-right text-blue-500">BHP</th>
                          <th className="px-4 py-3 text-right text-emerald-600">Bersih</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-150 dark:divide-zinc-850 text-zinc-700 dark:text-zinc-300">
                        {serviceBreakdown.map(s => (
                          <tr key={s.name} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                            <td className="px-6 py-3.5 font-bold">{s.name}</td>
                            <td className="px-4 py-3.5 text-right tabular-nums font-mono font-medium">{s.count}</td>
                            <td className="px-4 py-3.5 text-right tabular-nums font-mono font-medium">{formatRp(s.gross)}</td>
                            <td className="px-4 py-3.5 text-right tabular-nums font-mono font-medium text-amber-600">{formatRp(s.terapis)}</td>
                            <td className="px-4 py-3.5 text-right tabular-nums font-mono font-medium text-blue-500">
                              {s.bhp > 0 ? formatRp(s.bhp) : <span className="text-zinc-300 dark:text-zinc-700">—</span>}
                            </td>
                            <td className="px-4 py-3.5 text-right tabular-nums font-mono font-extrabold text-emerald-650 dark:text-emerald-400">{formatRp(s.net)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="border-t border-zinc-200 dark:border-zinc-850 bg-zinc-50/80 dark:bg-zinc-900/50">
                        <tr className="font-bold text-zinc-800 dark:text-zinc-200">
                          <td className="px-6 py-4">TOTAL</td>
                          <td className="px-4 py-4 text-right font-mono text-xs">{totalBookings}</td>
                          <td className="px-4 py-4 text-right font-mono text-xs">{formatRp(totalGross)}</td>
                          <td className="px-4 py-4 text-right font-mono text-xs text-amber-600">{formatRp(totalTerapis)}</td>
                          <td className="px-4 py-4 text-right font-mono text-xs text-blue-500">{formatRp(totalBhp)}</td>
                          <td className="px-4 py-4 text-right font-mono text-xs text-emerald-600">{formatRp(totalNet)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: RIWAYAT TRANSAKSI VIEW */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              {/* Search Control */}
              <div className="relative">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                <input 
                  type="text"
                  className="admin-input pl-10 rounded-xl py-2.5 text-xs font-semibold border-zinc-200 dark:border-zinc-800" 
                  placeholder="Cari transaksi berdasarkan nama pelanggan, ID, atau layanan..."
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)} 
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Transactions Table (With Viewport Scroll Lock) */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-auto max-h-[calc(100vh-340px)] md:max-h-[calc(100vh-280px)] minimal-scrollbar">
                  <table className="w-full text-xs text-left relative">
                    <thead className="sticky top-0 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 z-10 font-bold uppercase tracking-wider text-zinc-500">
                      <tr>
                        <th className="px-6 py-3 whitespace-nowrap">Tanggal</th>
                        <th className="px-4 py-3">Pelanggan</th>
                        <th className="px-4 py-3">Layanan</th>
                        <th className="px-4 py-3 text-right">Kotor (Gross)</th>
                        <th className="px-4 py-3 text-right text-emerald-600">Diskon</th>
                        <th className="px-4 py-3 text-right">Dibayar</th>
                        <th className="px-4 py-3 text-right text-emerald-700 dark:text-emerald-450">Bersih Owner</th>
                        <th className="px-6 py-3 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-150 dark:divide-zinc-850 text-zinc-700 dark:text-zinc-300">
                      {paginatedBookings.map(b => {
                        const paidTotal = b.final_price ?? b.price;
                        const discount = b.discount_total ?? 0;
                        const terapisCut = calcTerapisCut(b);
                        const bhpCost = b.bhp_cost ?? 0;
                        const ownerNet = paidTotal - terapisCut - bhpCost;

                        return (
                          <tr key={b.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                            <td className="px-6 py-3.5 whitespace-nowrap font-semibold font-mono text-[10px]">
                              {new Date(b.booking_date + 'T00:00:00').toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </td>
                            <td className="px-4 py-3.5 font-bold text-zinc-900 dark:text-white">
                              {b.customer_name || 'Walk-in'}
                            </td>
                            <td className="px-4 py-3.5 truncate max-w-[180px] font-medium" title={b.service_name}>
                              {b.service_name}
                            </td>
                            <td className="px-4 py-3.5 text-right font-mono text-[10px] font-semibold text-zinc-400">
                              {formatRp(b.price)}
                            </td>
                            <td className="px-4 py-3.5 text-right font-mono text-[10px] font-semibold text-emerald-650 dark:text-emerald-400">
                              {discount > 0 ? `-${formatRp(discount)}` : '—'}
                            </td>
                            <td className="px-4 py-3.5 text-right font-mono font-extrabold text-zinc-800 dark:text-zinc-200">
                              {formatRp(paidTotal)}
                            </td>
                            <td className="px-4 py-3.5 text-right font-mono font-extrabold text-emerald-700 dark:text-emerald-400">
                              {formatRp(ownerNet)}
                            </td>
                            <td className="px-6 py-3.5 text-center">
                              <button
                                onClick={() => handleOpenDrawer(b)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold bg-earth-primary/5 hover:bg-earth-primary/10 text-earth-primary rounded-xl transition-all active:scale-[0.97]"
                              >
                                Detail <ChevronRight size={12} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {tableFilteredBookings.length === 0 && (
                        <tr>
                          <td colSpan={8} className="px-6 py-12 text-center text-zinc-400 italic">
                            Tidak ada riwayat transaksi berstatus completed ditemukan.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Footer Pagination & Rows Per Page Bar */}
                {!loading && totalFilteredCount > 0 && (
                  <div className="px-4 py-3 bg-zinc-50/80 dark:bg-zinc-950/40 border-t border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    {/* Info text */}
                    <div className="text-zinc-500 dark:text-zinc-400 text-[11px] font-medium">
                      Menampilkan <span className="font-bold text-zinc-900 dark:text-white font-mono">{startIndex + 1}</span> - <span className="font-bold text-zinc-900 dark:text-white font-mono">{endIndex}</span> dari <span className="font-bold text-zinc-900 dark:text-white font-mono">{totalFilteredCount}</span> transaksi
                    </div>

                    {/* Controls right */}
                    <div className="flex flex-wrap items-center gap-3">
                      {/* Rows per page selector */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">Tampilkan:</span>
                        <select
                          value={itemsPerPage}
                          onChange={e => setItemsPerPage(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                          className="admin-input py-1 px-2 text-xs font-semibold w-auto"
                        >
                          <option value={10}>10 / hal</option>
                          <option value={25}>25 / hal</option>
                          <option value={50}>50 / hal</option>
                          <option value={100}>100 / hal</option>
                          <option value="all">Semua</option>
                        </select>
                      </div>

                      {/* Page Nav */}
                      {totalPages > 1 && (
                        <div className="flex items-center gap-1.5">
                          <button
                            disabled={safeCurrentPage <= 1}
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            className="px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                          >
                            ‹ Prev
                          </button>
                          <span className="text-[11px] font-mono font-bold text-zinc-600 dark:text-zinc-400 px-1">
                            {safeCurrentPage} / {totalPages}
                          </span>
                          <button
                            disabled={safeCurrentPage >= totalPages}
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            className="px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                          >
                            Next ›
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {bookings.length === 0 && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-center py-16 text-sm text-zinc-450 italic">
              <CheckCircle2 size={40} className="mx-auto mb-3 text-zinc-300 dark:text-zinc-700" />
              Belum ada transaksi dengan status Completed. Selesaikan pesanan di halaman Bookings atau POS untuk melihat data laporan.
            </div>
          )}
        </>
      )}

      {/* TRANSACTION DETAIL DRAWER (Blur-free) */}
      <ReportDrawer
        booking={selectedBooking}
        isOpen={drawerOpen}
        onClose={handleCloseDrawer}
        calcTerapisCut={calcTerapisCut}
      />
    </div>
  );
}
