'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, MessageCircle, Loader2, ChevronDown, Search, Pencil, Trash2, AlertTriangle, LayoutGrid, List, Calendar, Clock, Phone, DollarSign, Award, Tag, Users, Percent, X, Notebook } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase';
import { useUser } from '@/lib/user-context';
import { AdminSkeleton } from '@/components/admin/AdminSkeleton';
import BookingFormModal from '@/components/admin/BookingFormModal';
import { reconcileMonthlyAllocations } from '@/lib/allocation-reconciler';

type Booking = {
  id: string; created_at: string; customer_name: string; phone: string;
  service_name: string; booking_date: string; booking_time: string;
  price: number; status: string; notes: string; bhp_cost?: number;
  discount_total?: number; shared_discount_total?: number; final_price?: number; customer_id?: string;
};

type Service = { id: string; name: string; price: number; category: string; is_bundle?: boolean; bundle_child_ids?: string[] };

const STATUS_OPTIONS = ['Pending', 'Confirmed', 'Completed', 'Canceled'];
const STATUS_STYLES: Record<string, string> = {
  Pending:   'bg-yellow-50 text-yellow-700 border-yellow-250/20 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-900',
  Confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-255/20 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900',
  Completed: 'bg-blue-50 text-blue-700 border-blue-250/20 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900',
  Canceled:  'bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700',
};

const formatDate = (d: string) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
const formatRp   = (n: number) => `Rp ${Number(n).toLocaleString('id-ID')}`;

// ──────────────────────────────────────────
// BookingDrawer Component
// ──────────────────────────────────────────
function BookingDrawer({
  booking,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onSendWA,
  updateStatus,
  therapists,
  isOwner,
}: {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onSendWA: () => void;
  updateStatus: (id: string, s: string) => Promise<void>;
  therapists: { id: string; name: string }[];
  isOwner: boolean;
}) {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<'info' | 'financial'>('info');
  const [bookingItems, setBookingItems] = useState<any[]>([]);
  const [bookingDiscounts, setBookingDiscounts] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    if (isOpen && booking) {
      setActiveTab('info');
      setLoadingDetails(true);
      Promise.all([
        supabase.from('booking_items').select('*').eq('booking_id', booking.id).order('sort_order'),
        supabase.from('booking_discounts').select('*').eq('booking_id', booking.id)
      ]).then(([{ data: items }, { data: discounts }]) => {
        if (items) setBookingItems(items);
        if (discounts) setBookingDiscounts(discounts);
        setLoadingDetails(false);
      });
    }
  }, [isOpen, booking]);

  if (!booking) return null;

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
            className="fixed right-0 top-0 bottom-0 w-full md:max-w-xl bg-white dark:bg-zinc-950 shadow-2xl z-50 border-l border-zinc-200 dark:border-zinc-800 flex flex-col"
          >
            {/* Header */}
            <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-earth-primary to-emerald-600 flex items-center justify-center text-white font-bold shadow-sm shrink-0">
                  {booking.customer_name.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900 dark:text-white leading-tight">
                    {booking.customer_name}
                  </h3>
                  <p className="text-xs text-zinc-400 font-mono mt-0.5">{booking.phone}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Sub-Tabs Selector */}
            <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1 border-b border-zinc-200 dark:border-zinc-800">
              <button
                onClick={() => setActiveTab('info')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'info'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-850 dark:hover:text-zinc-305'
                }`}
              >
                Info Booking & Layanan
              </button>
              <button
                onClick={() => setActiveTab('financial')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'financial'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-850 dark:hover:text-zinc-305'
                }`}
              >
                Komisi & Finansial
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin">
              {activeTab === 'info' && (
                <div className="space-y-5">
                  {/* Status Badge Select Grid */}
                  <div className="space-y-2">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Status Booking</span>
                    <div className="grid grid-cols-4 gap-1.5 bg-zinc-105 dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200/50 dark:border-zinc-800">
                      {STATUS_OPTIONS.map(s => {
                        const active = booking.status === s;
                        const COLOR_MAP: Record<string, string> = {
                          Pending: 'bg-amber-500 text-white',
                          Confirmed: 'bg-emerald-500 text-white',
                          Completed: 'bg-blue-500 text-white',
                          Canceled: 'bg-zinc-500 text-white',
                        };
                        return (
                          <button
                            key={s}
                            onClick={() => updateStatus(booking.id, s)}
                            className={`py-1.5 rounded-lg text-[10px] font-bold transition-all truncate ${
                              active
                                ? `${COLOR_MAP[s]} shadow-sm`
                                : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                            }`}
                          >
                            {s.toUpperCase()}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Basic details */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
                      <span className="text-[10px] text-zinc-400 font-bold block uppercase">Tanggal Booking</span>
                      <span className="text-xs font-bold text-zinc-700 dark:text-zinc-200 mt-1 block">
                        {booking.booking_date ? formatDate(booking.booking_date) : '-'}
                      </span>
                    </div>
                    <div className="p-3.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
                      <span className="text-[10px] text-zinc-400 font-bold block uppercase">Jam / Waktu</span>
                      <span className="text-xs font-bold text-zinc-700 dark:text-zinc-200 mt-1 block">
                        {booking.booking_time ? booking.booking_time.slice(0, 5) : '-'}
                      </span>
                    </div>
                  </div>

                  {/* Booking items list */}
                  <div className="space-y-2">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Daftar Layanan</span>
                    {loadingDetails ? (
                      <div className="flex justify-center p-6"><Loader2 size={20} className="animate-spin text-zinc-400" /></div>
                    ) : bookingItems.length === 0 ? (
                      <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl text-xs text-zinc-500 border border-dashed text-center">
                        Single service: {booking.service_name}
                      </div>
                    ) : (
                      <div className="border border-zinc-200 dark:border-zinc-850 rounded-2xl divide-y divide-zinc-150 dark:divide-zinc-850 overflow-hidden bg-white dark:bg-zinc-900">
                        {bookingItems.map((item, idx) => {
                          const therapistName = therapists.find(t => t.id === item.therapist_id)?.name || 'Belum di-assign';
                          return (
                            <div key={item.id || idx} className="p-3.5 space-y-1">
                              <div className="flex justify-between items-start text-xs font-bold text-zinc-800 dark:text-zinc-200">
                                <span>{item.service_name}</span>
                                <span className="font-mono text-zinc-600 dark:text-zinc-400">{formatRp(item.price)}</span>
                              </div>
                              <div className="flex items-center justify-between text-[10px] text-zinc-400 font-medium">
                                <span>Terapis: <span className="text-zinc-650 dark:text-zinc-300 font-bold">{therapistName}</span></span>
                                {item.duration && <span>⏱ {item.duration}</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  {booking.notes && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Catatan / Permintaan</span>
                      <div className="p-3.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        {booking.notes}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'financial' && (
                <div className="space-y-5">
                  {/* Total summary board */}
                  <div className="p-4 bg-earth-primary/5 dark:bg-earth-primary/10 border border-earth-primary/10 rounded-2xl space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-550 dark:text-zinc-450 font-bold uppercase">Subtotal</span>
                      <span className="text-sm font-bold font-mono text-zinc-850 dark:text-zinc-200">{formatRp(booking.price)}</span>
                    </div>

                    {bookingDiscounts.map(d => (
                      <div key={d.id} className="flex justify-between items-center text-xs text-emerald-600 dark:text-emerald-400">
                        <span>↳ Diskon: {d.discount_label}</span>
                        <span className="font-mono font-bold">-{formatRp(d.discount_amount)}</span>
                      </div>
                    ))}

                    <div className="flex justify-between items-center pt-2.5 border-t border-dashed border-zinc-200 dark:border-zinc-800 text-xs">
                      <span className="text-zinc-700 dark:text-zinc-300 font-bold uppercase">Total Akhir</span>
                      <span className="text-base font-bold font-mono text-earth-primary">{formatRp(booking.final_price ?? booking.price)}</span>
                    </div>
                  </div>

                  {/* Commission calculation (Owner only) */}
                  {isOwner && booking.status === 'Completed' && (
                    <div className="space-y-3">
                      <span className="text-[10px] text-zinc-450 font-bold uppercase tracking-wider block">Rincian Bagi Hasil & BHP</span>
                      
                      <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl divide-y divide-zinc-150 dark:divide-zinc-855 overflow-hidden bg-white dark:bg-zinc-900">
                        {bookingItems.map((item, idx) => {
                          const t = therapists.find(x => x.id === item.therapist_id);
                          return (
                            <div key={item.id || idx} className="p-3.5 space-y-1.5 text-xs">
                              <div className="flex justify-between items-center font-bold text-zinc-855 dark:text-zinc-200">
                                <span>{item.service_name}</span>
                                {t && <span className="font-mono text-amber-600 dark:text-amber-400">Fee: {formatRp(item.commission_earned)}</span>}
                              </div>
                              <div className="flex justify-between items-center text-[10px] text-zinc-450 dark:text-zinc-400 font-medium">
                                <span>Terapis: {t?.name || 'N/A'}</span>
                                {item.bhp_cost > 0 && <span>BHP: {formatRp(item.bhp_cost)}</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Financial Net */}
                      <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                        <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-2xl">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Total Terapis</span>
                          <span className="font-mono font-bold text-amber-650 dark:text-amber-400 block mt-1">
                            {formatRp(bookingItems.reduce((s, i) => s + (i.commission_earned || 0), 0))}
                          </span>
                        </div>
                        <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-2xl text-right">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Net Pemilik</span>
                          <span className="font-mono font-bold text-emerald-605 dark:text-emerald-400 block mt-1">
                            {formatRp((booking.final_price ?? booking.price) - bookingItems.reduce((s, i) => s + (i.commission_earned || 0), 0))}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {booking.status !== 'Completed' && (
                    <p className="text-xs text-zinc-450 dark:text-zinc-500 text-center py-4 italic leading-relaxed">
                      Rincian komisi dan bagi hasil akan tercatat secara otomatis setelah status booking diubah menjadi **Completed**.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Actions Footer */}
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex gap-2 justify-end">
              <button
                onClick={onSendWA}
                className="admin-btn-ghost text-xs py-2 px-3 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 hover:text-emerald-600 flex items-center gap-1.5"
              >
                <MessageCircle size={14} /> Send WA
              </button>
              <button
                onClick={onEdit}
                className="admin-btn-ghost text-xs py-2 px-3 flex items-center gap-1.5"
              >
                <Pencil size={14} /> Edit
              </button>
              <button
                onClick={onDelete}
                className="admin-btn-primary bg-red-500 hover:bg-red-650 text-white border-red-500 text-xs py-2 px-3 flex items-center gap-1.5"
              >
                <Trash2 size={14} /> Hapus
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
export default function BookingsPage() {
  const { user } = useUser();
  const isOwner = user?.role !== 'cashier';

  const [bookings, setBookings]       = useState<Booking[]>([]);
  const [services, setServices]       = useState<Service[]>([]);
  const [therapists, setTherapists]   = useState<{id: string; name: string; commission_pct: number}[]>([]);
  const [customers, setCustomers]     = useState<{id: string; name: string; wa_number: string}[]>([]);
  const [loading, setLoading]         = useState(true);
  const [filterStatus, setFilterStatus] = useState('Hari Ini');
  const [search, setSearch]           = useState('');

  // Form & Modals state
  const [showForm, setShowForm]   = useState(false);
  const [editId, setEditId]       = useState<string | null>(null);
  const [deleteId, setDeleteId]   = useState<string | null>(null);
  const [deleting, setDeleting]   = useState(false);

  // Drawer state
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [reminderTemplate, setReminderTemplate] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [{ data: b }, { data: s }, { data: settingsData }, { data: t }, { data: c }] = await Promise.all([
      supabase.from('bookings').select('*').order('booking_date', { ascending: false }).order('created_at', { ascending: false }),
      supabase.from('services').select('id, name, price, category, is_bundle, bundle_child_ids, estimated_duration').order('category').order('sort_order'),
      supabase.from('settings').select('value').eq('key', 'whatsapp_reminder_message').single(),
      supabase.from('therapists').select('id, name, commission_pct').eq('is_active', true).order('name'),
      supabase.from('customers').select('id, name, wa_number').order('name', { ascending: true }),
    ]);
    if (b) setBookings(b);
    if (s) setServices(s);
    if (t) setTherapists(t);
    if (c) setCustomers(c);
    if (settingsData) setReminderTemplate(settingsData.value);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateStatus = async (id: string, status: string) => {
    const { data: orig } = await supabase.from('bookings').select('status').eq('id', id).single();
    
    await supabase.from('bookings').update({ status }).eq('id', id);
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
    
    // Sync drawer model state if open
    if (selectedBooking && selectedBooking.id === id) {
      setSelectedBooking(prev => prev ? { ...prev, status } : null);
    }
    
    if (status === 'Completed') {
      const { data: items } = await supabase.from('booking_items').select('*, therapist_id').eq('booking_id', id);
      const { data: bk }    = await supabase.from('bookings').select('price, shared_discount_total, therapist_discount_total, booking_date, customer_name, final_price').eq('id', id).single();
      if (items && bk) {
        const serviceItems = items.filter((i: any) => i.service_name !== 'Biaya Transport');
        const totalPrice = serviceItems.reduce((s: number, i: any) => s + (Number(i.price) || 0), 0);
        const sharedDisc = Number(bk.shared_discount_total) || 0;
        const therapistDisc = Number(bk.therapist_discount_total) || 0;
        await Promise.all(items.map(async (item: any) => {
          if (!item.therapist_id) return;
          const t = therapists.find(x => x.id === item.therapist_id);
          const pct = t?.commission_pct ?? 30;
          const sharedDiscPct = totalPrice > 0 ? sharedDisc / totalPrice : 0;
          const therapistDiscPct = totalPrice > 0 ? therapistDisc / totalPrice : 0;
          
          const itemSharedDiscount = Number(item.price) * sharedDiscPct;
          const itemTherapistDiscount = Number(item.price) * therapistDiscPct;
          
          const maxBasisReduction = Math.round(Number(item.price) * 5 / 100);
          const basisReduction = Math.min(itemTherapistDiscount, maxBasisReduction);
          const itemBasis = Number(item.price) - basisReduction;
          const grossCommission = Math.round(itemBasis * pct / 100);
          const therapistBearsShared = Math.round(itemSharedDiscount * 50 / 100);
          
          const earned = Math.max(0, grossCommission - therapistBearsShared);
          await supabase.from('booking_items').update({ commission_earned: earned }).eq('id', item.id);
        }));

        // Sync cash_transactions ledger for Completed status
        try {
          const dateObj = new Date(bk.booking_date + 'T00:00:00');
          const y = dateObj.getFullYear();
          const m = String(dateObj.getMonth() + 1).padStart(2, '0');
          const last4 = id.substring(id.length - 4).toUpperCase();
          const refId = `SR-${y}${m}-${last4}`;
          const finalTotal = bk.final_price ?? bk.price ?? 0;

          const { data: existingTx } = await supabase.from('cash_transactions').select('id').eq('reference_id', refId).maybeSingle();
          if (existingTx) {
            await supabase.from('cash_transactions').update({
              amount: finalTotal,
              description: `${bk.customer_name} - ${refId}`,
            }).eq('id', existingTx.id);
          } else {
            await supabase.from('cash_transactions').insert({
              transaction_date: new Date().toISOString(),
              type: 'inflow',
              category: 'service_income',
              payment_account: 'qris',
              amount: finalTotal,
              description: `${bk.customer_name} - ${refId}`,
              reference_id: refId,
              created_by: 'Booking Status Update'
            });
          }
        } catch (e) {
          console.error('Cashbook sync error:', e);
        }
      }
    } else if (orig?.status === 'Completed') {
      const { data: oldDiscounts } = await supabase
        .from('booking_discounts')
        .select('discount_id')
        .eq('booking_id', id);
      if (oldDiscounts && oldDiscounts.length > 0) {
        for (const d of oldDiscounts) {
          if (d.discount_id) {
            const { data: fresh } = await supabase.from('discounts').select('uses_count').eq('id', d.discount_id).single();
            if (fresh) {
              await supabase.from('discounts')
                .update({ uses_count: Math.max(0, (fresh.uses_count ?? 0) - 1) })
                .eq('id', d.discount_id);
            }
          }
        }
      }
      await supabase.from('booking_discounts').delete().eq('booking_id', id);
      await supabase.from('booking_items').delete().eq('booking_id', id).eq('service_name', 'Biaya Transport');
      await supabase.from('booking_items').update({ commission_earned: 0 }).eq('booking_id', id);

      // Remove cashbook inflow when status reverts from Completed
      try {
        const targetBk = bookings.find(b => b.id === id);
        if (targetBk?.booking_date) {
          const dateObj = new Date(targetBk.booking_date + 'T00:00:00');
          const y = dateObj.getFullYear();
          const m = String(dateObj.getMonth() + 1).padStart(2, '0');
          const last4 = id.substring(id.length - 4).toUpperCase();
          const refId = `SR-${y}${m}-${last4}`;
          await supabase.from('cash_transactions').delete().eq('reference_id', refId);
        }
      } catch (e) {
        console.error('Cashbook delete sync error:', e);
      }
    }

    // Reconcile Smart Allocation internal transfers (TRF-ALOC) if targets changed
    const targetBkObj = bookings.find(b => b.id === id);
    if (targetBkObj?.booking_date) {
      const monthStr = targetBkObj.booking_date.substring(0, 7);
      await reconcileMonthlyAllocations(supabase, monthStr);
    }
  };

  const openAdd = () => { setEditId(null); setShowForm(true); };
  const openEdit = (b: Booking) => { setEditId(b.id); setShowForm(true); };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const target = bookings.find(b => b.id === deleteId);
    if (target?.status === 'Completed') {
      const confirmed = window.confirm(`Booking ini berstatus COMPLETED dan komisi terapis mungkin sudah tercatat.\n\nMenghapus akan menyebabkan data laporan tidak balance.\n\nYakin ingin tetap menghapus?`);
      if (!confirmed) { setDeleteId(null); return; }
    }
    setDeleting(true);

    if (target?.booking_date) {
      try {
        const dateObj = new Date(target.booking_date + 'T00:00:00');
        const y = dateObj.getFullYear();
        const m = String(dateObj.getMonth() + 1).padStart(2, '0');
        const last4 = target.id.substring(target.id.length - 4).toUpperCase();
        const refId = `SR-${y}${m}-${last4}`;
        await supabase.from('cash_transactions').delete().eq('reference_id', refId);
      } catch (e) {
        console.error('Cashbook delete sync on booking delete error:', e);
      }
    }

    await supabase.from('bookings').delete().eq('id', deleteId);
    setBookings(prev => prev.filter(b => b.id !== deleteId));
    if (selectedBooking?.id === deleteId) {
      setDrawerOpen(false);
    }

    if (target?.booking_date) {
      const monthStr = target.booking_date.substring(0, 7);
      await reconcileMonthlyAllocations(supabase, monthStr);
    }

    setDeleteId(null);
    setDeleting(false);
  };

  const sendWA = (b: Booking) => {
    const template = reminderTemplate ||
      'Halo {nama}, konfirmasi booking SerenaRaga:\n📅 {tanggal} pukul {waktu}\n💆 {layanan}\n💰 {harga}\nTerima kasih! 🙏';
    const msg = template
      .replace('{nama}', b.customer_name)
      .replace('{tanggal}', b.booking_date ? formatDate(b.booking_date) : '-')
      .replace('{waktu}', b.booking_time ?? '-')
      .replace('{layanan}', b.service_name ?? '-')
      .replace('{harga}', formatRp(b.price ?? 0));
    window.open(`https://wa.me/${b.phone?.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const todayString    = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
  const tomorrowString = new Date(new Date().getTime() + 86400000).toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });

  const filtered = bookings
    .filter(b => {
      if (filterStatus === 'Semua') return true;
      if (filterStatus === 'Hari Ini') return b.booking_date === todayString;
      if (filterStatus === 'Besok') return b.booking_date === tomorrowString;
      return b.status === filterStatus;
    })
    .filter(b => !search ||
      b.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      b.service_name?.toLowerCase().includes(search.toLowerCase()));

  const tomorrowConfirmed = bookings.filter(b => b.booking_date === tomorrowString && b.status === 'Confirmed');
  const sendBulkReminder = () => {
    tomorrowConfirmed.forEach((b, i) => {
      setTimeout(() => sendWA(b), i * 600);
    });
  };

  const counts = STATUS_OPTIONS.reduce((acc, s) => ({ ...acc, [s]: bookings.filter(b => b.status === s).length }), {} as Record<string, number>);
  const todayCount    = bookings.filter(b => b.booking_date === todayString).length;
  const tomorrowCount = bookings.filter(b => b.booking_date === tomorrowString).length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Calendar size={20} className="text-earth-primary" /> Antrean Bookings
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 font-medium">
            {bookings.length} total pesanan · {bookings.filter(b => b.status === 'Pending').length} pending · {bookings.filter(b => b.status === 'Confirmed').length} dikonfirmasi
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {/* View toggle */}
          <div className="flex bg-zinc-100 dark:bg-zinc-900 rounded-xl p-1 gap-0.5">
            <button onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors ${ viewMode === 'list' ? 'bg-white dark:bg-zinc-800 shadow-sm text-zinc-900 dark:text-zinc-100' : 'text-zinc-400 hover:text-zinc-650' }`}>
              <List size={15} />
            </button>
            <button onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg transition-colors ${ viewMode === 'kanban' ? 'bg-white dark:bg-zinc-800 shadow-sm text-zinc-900 dark:text-zinc-100' : 'text-zinc-400 hover:text-zinc-650' }`}>
              <LayoutGrid size={15} />
            </button>
          </div>
          <button onClick={openAdd} className="admin-btn-primary text-xs">
            <Plus size={16} /> Tambah Booking
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {['Hari Ini', 'Besok', 'Semua', ...STATUS_OPTIONS].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all border ${
              filterStatus === s
                ? 'bg-zinc-900 border-zinc-900 text-white dark:bg-white dark:border-white dark:text-zinc-900 shadow-sm'
                : 'bg-white border-zinc-200 text-zinc-550 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
            }`}>
            {s}{s === 'Hari Ini' ? ` (${todayCount})` : s === 'Besok' ? ` (${tomorrowCount})` : s !== 'Semua' && counts[s] !== undefined ? ` (${counts[s]})` : s === 'Semua' ? ` (${bookings.length})` : ''}
          </button>
        ))}
      </div>

      {/* Bulk WA Reminder Banner */}
      {tomorrowConfirmed.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250/20 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2">
            <MessageCircle size={15} className="text-emerald-600 shrink-0" />
            <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-400">
              {tomorrowConfirmed.length} booking besok belum diingatkan (confirmed)
            </p>
          </div>
          <button onClick={sendBulkReminder}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-colors shadow-sm shadow-emerald-500/10">
            <MessageCircle size={13} /> Kirim Pengingat Semua
          </button>
        </div>
      )}

      {/* Search — only in list mode */}
      {viewMode === 'list' && (
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          <input className="admin-input pl-10 text-xs" placeholder="Cari nama pelanggan atau jenis layanan..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      )}

      {loading ? (
        <AdminSkeleton rows={5} />
      ) : viewMode === 'kanban' ? (
        // ── Kanban Board ──
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {STATUS_OPTIONS.map(status => {
            const KANBAN_HEADER: Record<string, string> = {
              Pending:   'border-amber-400 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400',
              Confirmed: 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400',
              Completed: 'border-blue-400 bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400',
              Canceled:  'border-zinc-400 bg-zinc-100 dark:bg-zinc-800/50 text-zinc-650 dark:text-zinc-400',
            };
            const KANBAN_DOT: Record<string, string> = {
              Pending: 'bg-amber-400', Confirmed: 'bg-emerald-400',
              Completed: 'bg-blue-400', Canceled: 'bg-zinc-450',
            };
            const colBookings = bookings
              .filter(b => b.status === status)
              .sort((a, b) => a.booking_date?.localeCompare(b.booking_date ?? '') ?? 0);
            return (
              <div key={status} className="space-y-2 bg-zinc-50/50 dark:bg-zinc-950/20 p-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-inner">
                {/* Column header */}
                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border-l-4 font-bold text-xs ${KANBAN_HEADER[status]}`}>
                  <span className={`w-2 h-2 rounded-full ${KANBAN_DOT[status]}`} />
                  <span className="uppercase tracking-wider">{status}</span>
                  <span className="ml-auto text-[10px] bg-zinc-200/50 dark:bg-zinc-800 px-1.5 py-0.5 rounded-full font-bold">{colBookings.length}</span>
                </div>
                {/* Cards */}
                <div className="space-y-2 min-h-[150px] max-h-[70vh] overflow-y-auto pr-1 scrollbar-thin">
                  {colBookings.length === 0 ? (
                    <div className="text-center py-12 text-[10px] text-zinc-400 font-medium italic border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">Kosong</div>
                  ) : (
                    colBookings.map(b => (
                      <div
                        key={b.id}
                        onClick={() => {
                          setSelectedBooking(b);
                          setDrawerOpen(true);
                        }}
                        className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-3.5 shadow-sm hover:border-earth-primary/40 transition-all group cursor-pointer relative"
                      >
                        <div className="flex items-start justify-between gap-1 mb-1.5">
                          <p className="text-xs font-bold text-zinc-850 dark:text-white leading-tight">{b.customer_name}</p>
                          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={e => e.stopPropagation()}>
                            <button onClick={() => openEdit(b)} className="p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-950/20 text-blue-500"><Pencil size={11} /></button>
                            <button onClick={() => setDeleteId(b.id)} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/20 text-red-400"><Trash2 size={11} /></button>
                          </div>
                        </div>
                        <p className="text-[10px] text-zinc-450 dark:text-zinc-400 mb-2.5 line-clamp-1">{b.service_name}</p>
                        
                        <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-850 pt-2 text-[9px] font-bold">
                          <span className="text-zinc-400 font-mono">
                            {b.booking_time ? b.booking_time.slice(0, 5) : ''}
                          </span>
                          <span className="text-earth-primary font-mono font-bold">
                            {formatRp(b.final_price ?? b.price ?? 0)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3 max-h-[calc(100vh-340px)] md:max-h-[calc(100vh-280px)] overflow-y-auto pr-1.5 scrollbar-thin">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-xs text-zinc-400 italic bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl">Tidak ada booking ditemukan.</div>
          ) : (
            filtered.map(b => (
              <div
                key={b.id}
                onClick={() => {
                  setSelectedBooking(b);
                  setDrawerOpen(true);
                }}
                className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 cursor-pointer transition-colors shadow-sm relative overflow-hidden"
              >
                {/* Left Accent Status Bar */}
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                  b.status === 'Pending' ? 'bg-amber-400' :
                  b.status === 'Confirmed' ? 'bg-emerald-500' :
                  b.status === 'Completed' ? 'bg-blue-500' :
                  'bg-zinc-400'
                }`} />

                <div className="pl-2 space-y-3">
                  {/* Line 1: Name & Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="font-bold text-zinc-900 dark:text-white text-xs sm:text-sm leading-tight truncate">
                        {b.customer_name}
                      </h4>
                      <p className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-450 font-medium mt-0.5 truncate">
                        {b.service_name}
                      </p>
                    </div>

                    {/* Interactive Status Select Badge */}
                    <div className="relative shrink-0 flex items-center" onClick={e => e.stopPropagation()}>
                      <select
                        value={b.status}
                        onChange={e => updateStatus(b.id, e.target.value)}
                        className={`appearance-none pl-3 pr-7.5 rounded-full border text-[10px] font-extrabold cursor-pointer transition-all outline-none focus:ring-1 focus:ring-earth-primary/30 h-7 leading-none ${STATUS_STYLES[b.status] ?? STATUS_STYLES.Pending}`}
                      >
                        {STATUS_OPTIONS.map(s => (
                          <option key={s} value={s} className="bg-white text-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 font-bold">
                            {s.toUpperCase()}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                    </div>
                  </div>

                  {/* Line 2: Date & Time */}
                  <div className="flex items-center gap-2 text-[10px] font-semibold text-zinc-450 dark:text-zinc-500 font-mono">
                    <span className="flex items-center gap-1">
                      <Calendar size={11} className="text-zinc-400 shrink-0" />
                      {b.booking_date ? formatDate(b.booking_date) : '-'}
                    </span>
                    <span className="text-zinc-350 dark:text-zinc-750">|</span>
                    <span className="flex items-center gap-1">
                      <Clock size={11} className="text-zinc-400 shrink-0" />
                      {b.booking_time ? b.booking_time.slice(0, 5) : ''}
                    </span>
                  </div>

                  {/* Line 3: Price & Actions */}
                  <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-850 pt-3">
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white font-mono leading-none">
                        {formatRp(b.final_price ?? b.price ?? 0)}
                      </p>
                      {(b.discount_total ?? 0) > 0 && (
                        <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-extrabold mt-0.5">
                          -{formatRp(b.discount_total ?? 0)}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                      <button onClick={() => sendWA(b)} className="p-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-emerald-500 transition-colors" title="Kirim WA">
                        <MessageCircle size={14} />
                      </button>
                      <button onClick={() => openEdit(b)} className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/20 text-blue-500 transition-colors" title="Edit Booking">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => setDeleteId(b.id)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-red-400 transition-colors" title="Hapus Booking">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Booking Details sliding drawer */}
      <BookingDrawer
        booking={selectedBooking}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onEdit={() => {
          if (selectedBooking) {
            setDrawerOpen(false);
            openEdit(selectedBooking);
          }
        }}
        onDelete={() => {
          if (selectedBooking) {
            setDrawerOpen(false);
            setDeleteId(selectedBooking.id);
          }
        }}
        onSendWA={() => {
          if (selectedBooking) sendWA(selectedBooking);
        }}
        updateStatus={updateStatus}
        therapists={therapists}
        isOwner={isOwner}
      />

      {/* Add / Edit Form Modal */}
      <BookingFormModal
        open={showForm}
        onClose={() => { setShowForm(false); setEditId(null); }}
        onSaved={fetchData}
        editBookingId={editId}
        therapists={therapists}
        services={services}
        customers={customers}
        isOwner={isOwner}
      />

      {/* Delete Confirmation Modal (Blur-free) */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 w-full max-w-sm">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center">
                <AlertTriangle size={22} className="text-red-550" />
              </div>
              <h3 className="font-semibold text-zinc-900 dark:text-white text-sm">Hapus Booking?</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Booking atas nama <strong className="text-zinc-700 dark:text-zinc-300">{bookings.find(b => b.id === deleteId)?.customer_name}</strong> akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.
                {bookings.find(b => b.id === deleteId)?.status === 'Completed' && (
                  <span className="block mt-2 text-red-500 font-bold text-[10px] uppercase">
                    ⚠ Perhatian: Booking status Completed. Menghapus akan merusak balance komisi di laporan!
                  </span>
                )}
              </p>
              <div className="flex gap-3 w-full pt-2">
                <button onClick={() => setDeleteId(null)} className="admin-btn-ghost flex-1 justify-center text-xs">Batal</button>
                <button onClick={confirmDelete} disabled={deleting}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-red-500 hover:bg-red-650 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-60 shadow-sm">
                  {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />} Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
