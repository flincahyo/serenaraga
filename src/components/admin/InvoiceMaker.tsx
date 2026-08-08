'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { toPng } from 'html-to-image';
import {
  Download, Plus, Trash2, Loader2, Share2, Users, Percent,
  Tag, X, Check, Award, Hash, Bus, Globe, Smartphone, Building2, Banknote, CreditCard,
  QrCode, Landmark, Wallet, Coins
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useUser } from '@/lib/user-context';
import { SerenaLogoSvg, SerenaLogoPaths } from '../SerenaLogoSvg';

const InstagramIcon = ({ size = 11, ...props }: React.SVGProps<SVGSVGElement> & { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

type Item = { id: number | string; db_id?: string; therapist_id?: string; name: string; duration: string; price: number; details?: string; parent_bundle_name?: string };
type TransportEntry = { id: string; therapist_id: string; fee: number | ''; pct: number };
type Service = { id: string; name: string; price: number; details: string; category: string; is_bundle?: boolean; bundle_child_ids?: string[] };
type Booking = {
  id: string; customer_name: string; phone: string;
  service_name: string; booking_date: string; booking_time?: string; price: number; status: string;
};
type Discount = {
  id: string; name: string; type: string; value_type: string; value: number;
  min_orders: number | null; max_uses: number | null; uses_count: number;
  is_active: boolean; valid_from: string | null; valid_to: string | null;
  is_owner_borne?: boolean;
  borne_by?: 'owner' | 'shared' | 'therapist';
  is_voucher?: boolean;
  target_type?: 'global' | 'service' | 'category';
  target_service_id?: string | null;
  target_category_id?: string | null;
};
type AppliedDiscount = {
  discountId: string; label: string; value_type: string;
  value: number; amount: number; is_owner_borne: boolean; // Rp computed
  borne_by: 'owner' | 'shared' | 'therapist';
};
type Customer = {
  id: string; wa_number: string; name: string | null; visit_count_base: number;
};

const pad = (n: number) => String(n).padStart(3, '0');
const genInvoiceNo = () => {
  const now = new Date();
  return `SR-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${pad(Math.floor(Math.random() * 900) + 100)}`;
};
const formatRp = (n: number) => `Rp ${Number(n).toLocaleString('id-ID')}`;
// CATEGORY_LABELS removed in favor of dynamic service_categories database table

// ──────────────────────────────────────────
// Discount helpers
// ──────────────────────────────────────────
function computeAmount(d: Discount, gross: number, items: Item[] = [], servicesList: Service[] = []): number {
  if (d.target_type === 'service' && d.target_service_id) {
    const matchingItems = items.filter(item => {
      const svc = servicesList.find(s => s.name === item.name);
      return svc && svc.id === d.target_service_id;
    });
    const matchingGross = matchingItems.reduce((sum, item) => sum + Number(item.price), 0);
    const basis = matchingGross > 0 ? matchingGross : gross;
    if (d.value_type === 'percentage') return Math.round(basis * d.value / 100);
    return d.value;
  }

  if (d.target_type === 'category' && d.target_category_id) {
    const matchingItems = items.filter(item => {
      const svc = servicesList.find(s => s.name === item.name);
      return svc && svc.category === d.target_category_id;
    });
    const matchingGross = matchingItems.reduce((sum, item) => sum + Number(item.price), 0);
    const basis = matchingGross > 0 ? matchingGross : gross;
    if (d.value_type === 'percentage') return Math.round(basis * d.value / 100);
    return d.value;
  }

  if (d.value_type === 'percentage') return Math.round(gross * d.value / 100);
  return d.value;
}

function isDiscountValid(d: Discount): boolean {
  if (!d.is_active) return false;
  const today = new Date().toISOString().split('T')[0];
  if (d.valid_from && today < d.valid_from) return false;
  if (d.valid_to && today > d.valid_to) return false;
  // Audit #3 Bug #3: enforce max_uses limit
  if (d.max_uses !== null && d.uses_count >= d.max_uses) return false;
  return true;
}

// ──────────────────────────────────────────
const InvoiceMaker = () => {
  const { user } = useUser();
  const isOwner = user?.role !== 'cashier';

  const invoiceRef = useRef<HTMLDivElement>(null);
  // Audit #2 Bug #1: prevent double-completion if kasir clicks both Download & WA
  const hasSavedRef = useRef(false);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [date, setDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [items, setItems] = useState<Item[]>([{ id: 1, name: '', duration: '', price: 0 }]);
  const [services, setServices] = useState<Service[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [generating, setGenerating] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState('');
  const [invoiceFooter, setInvoiceFooter] = useState('Terima kasih telah mempercayakan ketenangan raga Anda kepada kami.');
  const [invoiceSocial, setInvoiceSocial] = useState('Instagram & Threads: @serena.raga');
  const [commissionPct, setCommissionPct] = useState(30);
  const [completing, setCompleting] = useState(false);
  const [transportEntries, setTransportEntries] = useState<TransportEntry[]>([{ id: '1', therapist_id: '', fee: '', pct: 100 }]);
  const [transportLabel, setTransportLabel] = useState('Biaya Transport Tambahan');
  // Pool of therapist IDs allowed in transport dropdown. Empty = all therapists (manual mode).
  const [transportTherapistPool, setTransportTherapistPool] = useState<string[]>([]);

  // Discount + customer state
  const [allDiscounts, setAllDiscounts] = useState<Discount[]>([]);
  const [appliedDiscounts, setAppliedDiscounts] = useState<AppliedDiscount[]>([]);
  const [customerRecord, setCustomerRecord] = useState<Customer | null>(null);
  const [effectiveCount, setEffectiveCount] = useState<number | null>(null);
  const [eligibleDiscounts, setEligibleDiscounts] = useState<Discount[]>([]);
  const [lookingUpCustomer, setLookingUpCustomer] = useState(false);
  const [addDiscountId, setAddDiscountId] = useState('');
  const [customDiscountName, setCustomDiscountName] = useState('');
  const [customDiscountAmount, setCustomDiscountAmount] = useState('');
  const [therapists, setTherapists] = useState<{ id: string; name: string; commission_pct: number }[]>([]);
  const [reEngageDays, setReEngageDays] = useState(60);
  // Voucher
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherChecking, setVoucherChecking] = useState(false);
  const [voucherError, setVoucherError] = useState('');
  const [voucherApplied, setVoucherApplied] = useState<{ id: string; code: string; label: string; value: number; value_type: string } | null>(null);
  const [returningPromos, setReturningPromos] = useState<Discount[]>([]); // suggested returning customer promos
  const [categories, setCategories] = useState<any[]>([]);
  const [paymentAccount, setPaymentAccount] = useState<string>('qris');
  const [availableAccounts, setAvailableAccounts] = useState<{ id: string; label: string; icon: string }[]>([
    { id: 'qris', label: 'QRIS', icon: 'Smartphone' },
    { id: 'bca', label: 'BCA', icon: 'Building2' },
    { id: 'cash', label: 'Cash', icon: 'Banknote' },
    { id: 'edc', label: 'EDC', icon: 'CreditCard' },
  ]);

  const ACCOUNT_ICONS: Record<string, any> = {
    Smartphone, Building2, Banknote, CreditCard, QrCode, Landmark, Wallet, Coins,
  };

  const supabase = createClient();
  const grossTotal = items.reduce((s, i) => s + Number(i.price), 0);

  const fetchAll = useCallback(async () => {
    const [{ data: svcData }, { data: bkgData }, { data: settingsData }, { data: discData }, { data: therapistData }, { data: catData }] = await Promise.all([
      supabase.from('services').select('id,name,price,details,category,is_bundle,bundle_child_ids,estimated_duration').order('category').order('sort_order'),
      supabase.from('bookings').select('id,customer_name,phone,service_name,booking_date,booking_time,price,status')
        .in('status', ['Pending', 'Confirmed']).order('booking_date', { ascending: false }).limit(50),
      supabase.from('settings').select('key, value').in('key', ['invoice_footer_text', 'invoice_social_text', 'terapis_commission_pct', 're_engagement_days', 'payment_accounts']),
      supabase.from('discounts').select('*').eq('is_active', true),
      supabase.from('therapists').select('id,name,commission_pct').eq('is_active', true).order('name'),
      supabase.from('service_categories').select('*').order('sort_order'),
    ]);
    if (svcData) setServices(svcData);
    if (bkgData) setBookings(bkgData);
    if (discData) setAllDiscounts(discData);
    if (therapistData) setTherapists(therapistData);
    if (catData && catData.length > 0) {
      setCategories(catData);
    } else {
      setCategories([
        { id: 'packages', label: 'Paket Massage' },
        { id: 'services', label: 'Massage Services' },
        { id: 'reflexology', label: 'Refleksi' },
        { id: 'addons', label: 'Add-On' },
        { id: 'split_items', label: 'Internal Split Item' },
      ]);
    }
    if (settingsData) {
      settingsData.forEach(({ key, value }) => {
        if (key === 'invoice_footer_text') setInvoiceFooter(value);
        if (key === 'invoice_social_text') setInvoiceSocial(value);
        if (key === 'terapis_commission_pct') setCommissionPct(Number(value) || 30);
        if (key === 're_engagement_days') setReEngageDays(Number(value) || 60);
        if (key === 'payment_accounts' && value) {
          try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed) && parsed.length > 0) {
              const filtered = parsed.filter((a: any) => a.show_in_invoice !== false);
              if (filtered.length > 0) {
                setAvailableAccounts(filtered);
                setPaymentAccount(prev => (filtered.some((f: any) => f.id === prev) ? prev : filtered[0].id));
              }
            }
          } catch (e) {
            console.error('Error parsing payment_accounts setting:', e);
          }
        }
      });
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Initialize client-only values to prevent SSR hydration mismatch
  // (Math.random and new Date() produce different values on server vs client)
  useEffect(() => {
    setInvoiceNumber(genInvoiceNo());
    setDate(new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }));
  }, []);

  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const [scheduleData, setScheduleData] = useState<{ shifts: any[], offs: any[], bks: any[] }>({ shifts: [], offs: [], bks: [] });

  useEffect(() => {
    if (!date) return;
    const loadDaySchedule = async () => {
      const dW = new Date(date).getDay();
      const [{ data: s }, { data: o }, { data: b }] = await Promise.all([
        supabase.from('therapist_shifts').select('*').eq('day_of_week', dW),
        supabase.from('therapist_timeoffs').select('*').eq('off_date', date),
        supabase.from('booking_items').select('therapist_id, bookings!inner(id, booking_time, status)').eq('bookings.booking_date', date)
      ]);
      setScheduleData({ shifts: s || [], offs: o || [], bks: b || [] });
    };
    loadDaySchedule();
  }, [date, supabase]);

  useEffect(() => {
    if (!bookingTime) { setConflictWarning(null); return; }

    for (const item of items) {
      if (item.therapist_id) {
        const tid = item.therapist_id;
        const tname = therapists.find(t => t.id === tid)?.name;

        const off = scheduleData.offs.find(o => o.therapist_id === tid);
        if (off && off.is_full_day) {
          setConflictWarning(`⚠️ Terapis ${tname} sedang Cuti/Libur Penuh hari ini!`);
          return;
        }
        const shift = scheduleData.shifts.find(s => s.therapist_id === tid);
        if (shift && !shift.is_working) {
          setConflictWarning(`⚠️ ${tname} sedang Off/Libur reguler di hari ini.`);
          return;
        }
        if (shift && shift.break_start_time && shift.break_end_time) {
          if (bookingTime >= shift.break_start_time && bookingTime <= shift.break_end_time) {
            setConflictWarning(`⚠️ Jam ${bookingTime} berbenturan dengan Jam Istirahat ${tname} (${shift.break_start_time.slice(0, 5)}-${shift.break_end_time.slice(0, 5)}).`);
            return;
          }
        }

        const overlappingBk = scheduleData.bks.find(b => {
          if (b.therapist_id !== tid || b.bookings.status === 'Canceled' || b.bookings.id === selectedBookingId || !b.bookings.booking_time) return false;
          // approximate 2 hr window conflict warning
          const h1 = parseInt(b.bookings.booking_time.split(':')[0]);
          const h2 = parseInt(bookingTime.split(':')[0]);
          return Math.abs(h1 - h2) < 2;
        });

        if (overlappingBk) {
          setConflictWarning(`🚨 Peringatan: ${tname} kemungkinan memiliki booking lain pada jam ${overlappingBk.bookings.booking_time.slice(0, 5)}! Mohon cek Tracker Gantt.`);
          return;
        }
      }
    }
    setConflictWarning(null);
  }, [items, bookingTime, scheduleData, selectedBookingId, therapists]);

  // Reset save guard whenever a new booking is selected
  useEffect(() => { hasSavedRef.current = false; }, [selectedBookingId]);

  // BHP
  const calcBhp = async (serviceName: string): Promise<number> => {
    const svc = services.find(s => s.name === serviceName);
    if (!svc) return 0;
    const [{ data: svcMats }, { data: globalMats }] = await Promise.all([
      supabase.from('service_materials').select('qty_multiplier, material:materials(id,pack_price,customers_per_pack,is_global)').eq('service_id', svc.id),
      supabase.from('materials').select('id, pack_price, customers_per_pack').eq('is_global', true),
    ]);
    const getMat = (r: any) => Array.isArray(r) ? r[0] ?? null : r ?? null;
    const rows = (svcMats ?? []) as any[];
    const assignedGlobal = new Set(rows.map(sm => getMat(sm.material)).filter((m: any) => m?.is_global).map((m: any) => m.id));
    let total = 0;
    for (const sm of rows) {
      const m = getMat(sm.material);
      if (m && m.customers_per_pack > 0) total += sm.qty_multiplier * (m.pack_price / m.customers_per_pack);
    }
    for (const gm of (globalMats ?? []) as any[]) {
      if (!assignedGlobal.has(gm.id) && gm.customers_per_pack > 0) total += gm.pack_price / gm.customers_per_pack;
    }
    return Math.round(total);
  };


  // ── Customer lookup by WA ──
  const lookupCustomer = useCallback(async (phone: string) => {
    let clean = phone.replace(/\D/g, '');
    if (clean.startsWith('0')) clean = '62' + clean.substring(1);

    if (clean.length < 6) { setCustomerRecord(null); setEffectiveCount(null); setEligibleDiscounts([]); return; }
    setLookingUpCustomer(true);
    const [{ data: cust }, { data: completedB }] = await Promise.all([
      supabase.from('customers').select('id,wa_number,name,visit_count_base').eq('wa_number', clean).single(),
      supabase.from('bookings').select('id').eq('status', 'Completed').eq('phone', clean),
    ]);
    const base = cust?.visit_count_base ?? 0;
    const dbCnt = (completedB?.length ?? 0);
    const eff = base + dbCnt;
    setCustomerRecord(cust ?? null);
    if (cust?.name && !customerName) setCustomerName(cust.name);
    setEffectiveCount(eff);

    // Eligible discounts (valid, within date range)
    const today = new Date().toISOString().split('T')[0];
    const eligible = allDiscounts.filter(d => {
      if (!isDiscountValid(d)) return false;
      if (d.type === 'first_customer') return eff === 0;
      if (d.type === 'loyal') return d.min_orders !== null && eff >= d.min_orders;
      return false; // manual / returning_customer not auto-suggested here
    });

    // Check if returning customer (last booking date)
    setReturningPromos([]);
    const { data: lastBkg } = await supabase
      .from('bookings')
      .select('booking_date')
      .eq('phone', clean)
      .eq('status', 'Completed')
      .order('booking_date', { ascending: false })
      .limit(1);
    if (lastBkg && lastBkg.length > 0) {
      const daysSince = Math.floor((Date.now() - new Date(lastBkg[0].booking_date).getTime()) / 86400000);
      if (daysSince >= reEngageDays) {
        const returningDiscs = allDiscounts.filter(d =>
          d.is_active && d.type === 'returning_customer' &&
          isDiscountValid(d) &&
          (d.min_orders === null || daysSince >= d.min_orders)
        );
        setReturningPromos(returningDiscs);
      }
    }

    setLookingUpCustomer(false);
  }, [allDiscounts]);

  // Debounce phone lookup
  useEffect(() => {
    const t = setTimeout(() => { if (customerPhone) lookupCustomer(customerPhone); }, 600);
    return () => clearTimeout(t);
  }, [customerPhone, lookupCustomer]);

  const lastAutoAppliedRef = useRef('');

  // Reactively update applied discounts' amounts when items or subtotal changes (fixes stale amount bug)
  useEffect(() => {
    setAppliedDiscounts(prev => {
      let changed = false;
      const next = prev.map(a => {
        const d = allDiscounts.find(x => x.id === a.discountId) ||
          (a.discountId.startsWith('voucher_') ? { id: a.discountId, target_type: 'global', value_type: a.value_type, value: a.value } : null);
        const newAmt = d
          ? computeAmount(d as any, grossTotal, items, services)
          : a.value_type === 'percentage' ? Math.round(grossTotal * a.value / 100) : a.value;
        if (newAmt !== a.amount) {
          changed = true;
          return { ...a, amount: newAmt };
        }
        return a;
      });
      return changed ? next : prev;
    });
  }, [items, grossTotal, services, allDiscounts]);

  // Reactive calculation of eligibleDiscounts when cart or customer changes
  useEffect(() => {
    if (effectiveCount === null) {
      setEligibleDiscounts([]);
      return;
    }
    const eligible = allDiscounts.filter(d => {
      if (!isDiscountValid(d)) return false;
      if (d.type === 'first_customer') return effectiveCount === 0;
      if (d.type === 'loyal') return d.min_orders !== null && effectiveCount >= d.min_orders;

      // Targeted discounts are auto-suggested if cart contains matching service or category
      if (d.target_type === 'service' && d.target_service_id) {
        return items.some(item => {
          const svc = services.find(s => s.name === item.name);
          return svc && svc.id === d.target_service_id;
        });
      }
      if (d.target_type === 'category' && d.target_category_id) {
        return items.some(item => {
          const svc = services.find(s => s.name === item.name);
          return svc && svc.category === d.target_category_id;
        });
      }
      return false;
    });

    const loyalEligible = eligible
      .filter(d => d.type === 'loyal')
      .sort((a, b) => (b.min_orders ?? 0) - (a.min_orders ?? 0))
      .slice(0, 1);
    const nonLoyalEligible = eligible.filter(d => d.type !== 'loyal');

    setEligibleDiscounts([...nonLoyalEligible, ...loyalEligible]);
  }, [allDiscounts, effectiveCount, items, services]);

  // Auto-apply best eligible discount (highest savings)
  useEffect(() => {
    if (eligibleDiscounts.length === 0) {
      setAppliedDiscounts(prev => prev.filter(a => !allDiscounts.some(d => d.id === a.discountId && (d.type === 'first_customer' || d.type === 'loyal' || d.target_type !== 'global'))));
      return;
    }

    const cartStateStr = `${customerPhone}-${items.map(i => `${i.name}-${i.price}`).join(',')}`;
    if (lastAutoAppliedRef.current === cartStateStr) return;
    lastAutoAppliedRef.current = cartStateStr;

    let bestDiscount: any = null;
    let maxAmount = 0;

    eligibleDiscounts.forEach(d => {
      const amt = computeAmount(d, grossTotal, items, services);
      if (amt > maxAmount) {
        maxAmount = amt;
        bestDiscount = d;
      }
    });

    setAppliedDiscounts(prev => {
      const clean = prev.filter(a => !eligibleDiscounts.some(e => e.id === a.discountId));
      if (bestDiscount) {
        return [...clean, {
          discountId: bestDiscount.id,
          label: bestDiscount.name,
          value_type: bestDiscount.value_type,
          value: bestDiscount.value,
          amount: maxAmount,
          is_owner_borne: bestDiscount.borne_by ? (bestDiscount.borne_by === 'owner') : (bestDiscount.is_owner_borne ?? true),
          borne_by: bestDiscount.borne_by ?? (bestDiscount.is_owner_borne ? 'owner' : 'shared'),
        }];
      }
      return clean;
    });
  }, [eligibleDiscounts, grossTotal, items, services, customerPhone, allDiscounts]);

  // ── Booking select ──
  const onBookingSelect = async (bookingId: string) => {
    setSelectedBookingId(bookingId);
    if (!bookingId) {
      // Reset transport entries and pool when clearing booking selection
      setTransportEntries([{ id: Date.now().toString(), therapist_id: '', fee: '', pct: 100 }]);
      setTransportTherapistPool([]);
      setBookingTime('');
      setInvoiceNumber(genInvoiceNo());
      return;
    }
    const bk = bookings.find(b => b.id === bookingId);
    if (!bk) return;
    setCustomerName(bk.customer_name);
    setCustomerPhone(bk.phone ?? '');
    if (bk.booking_date) setDate(bk.booking_date);
    if (bk.booking_time) setBookingTime(bk.booking_time);

    // Set deterministic invoice number based on date and UUID suffix
    const dateObj = new Date(bk.booking_date + 'T00:00:00');
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const last4 = bk.id.substring(bk.id.length - 4).toUpperCase();
    setInvoiceNumber(`SR-${y}${m}-${last4}`);

    // Load booking_items (multi-service)
    const { data: bkItems } = await supabase
      .from('booking_items').select('*').eq('booking_id', bookingId).order('sort_order');

    if (bkItems && bkItems.length > 0) {
      const normalItems = bkItems.filter(bi => bi.service_name !== 'Biaya Transport');
      const transportItems = bkItems.filter(bi => bi.service_name === 'Biaya Transport');

      setItems(normalItems.map((bi, i) => {
        const svc = services.find(s => s.name === bi.service_name);
        return {
          id: bi.id ?? (Date.now() + i),
          db_id: bi.id,
          therapist_id: bi.therapist_id || '',
          name: bi.service_name,
          duration: bi.duration ?? '',
          price: bi.price,
          details: svc?.details ?? '',
          parent_bundle_name: bi.parent_bundle_name ?? '',
        };
      }));

      // Build transport therapist pool from assigned therapists in this booking
      const assignedTherapistIds = [...new Set(
        normalItems.map(bi => bi.therapist_id).filter(Boolean)
      )] as string[];
      setTransportTherapistPool(assignedTherapistIds);

      if (transportItems.length > 0) {
        setTransportEntries(transportItems.map(ti => ({
          id: ti.id,
          therapist_id: ti.therapist_id || '',
          fee: '' as '',  // Always start empty — transport cost is situational per session
          pct: 100,
        })));
      } else {
        // Pre-create 1 entry per assigned therapist for convenience
        const initialEntries = assignedTherapistIds.length > 0
          ? assignedTherapistIds.map((tid, i) => ({ id: `${Date.now()}_${i}`, therapist_id: tid, fee: '' as '', pct: 100 }))
          : [{ id: Date.now().toString(), therapist_id: '', fee: '' as '', pct: 100 }];
        setTransportEntries(initialEntries);
      }
    } else {
      // Fallback for old single-service bookings
      const svc = services.find(s => s.name === bk.service_name);
      const durationMatch = svc?.details?.match(/(\d+)\s*m(?:enit)?/i);
      setItems([{ id: Date.now(), name: bk.service_name ?? '', duration: durationMatch?.[1] ? `${durationMatch[1]}m` : '', price: bk.price ?? svc?.price ?? 0, details: svc?.details ?? '', parent_bundle_name: '' }]);
    }
    setAppliedDiscounts([]);
  };

  const addItem = () => setItems(p => [...p, { id: Date.now(), name: '', duration: '', price: 0, therapist_id: '' }]);
  const removeItem = (id: string | number) => setItems(p => p.filter(i => i.id !== id));
  const updateItem = (id: string | number, field: keyof Item, value: string | number) =>
    setItems(p => p.map(i => i.id === id ? { ...i, [field]: value } : i));
  const onServiceSelect = (itemId: string | number, serviceName: string) => {
    const s = services.find(x => x.name === serviceName);
    if (!s) { updateItem(itemId, 'name', serviceName); return; }

    if (s.is_bundle && s.bundle_child_ids && s.bundle_child_ids.length > 0) {
      const children = s.bundle_child_ids.map(cid => services.find(x => x.id === cid)).filter(Boolean) as Service[];
      if (children.length > 0) {
        setItems(prev => {
          const newItems = [...prev];
          const idx = newItems.findIndex(i => i.id === itemId);
          if (idx > -1) {
            newItems[idx] = { ...newItems[idx], name: children[0].name, price: children[0].price, duration: (children[0] as any).estimated_duration ? String((children[0] as any).estimated_duration) : '', details: children[0].details || '', parent_bundle_name: s.name };
            for (let i = 1; i < children.length; i++) {
              newItems.splice(idx + i, 0, {
                id: Date.now() + i,
                therapist_id: '',
                name: children[i].name,
                price: children[i].price,
                duration: (children[i] as any).estimated_duration ? String((children[i] as any).estimated_duration) : '',
                details: children[i].details || '',
                parent_bundle_name: s.name
              });
            }
          }
          return newItems;
        });
        return;
      }
    }

    setItems(p => p.map(i => i.id === itemId ? {
      ...i, name: s.name, price: s.price, duration: (s as any).estimated_duration ? String((s as any).estimated_duration) : '', details: s.details, parent_bundle_name: ''
    } : i));
  };

  // ── Discount ops ──

  const toggleEligibleDiscount = (d: Discount) => {
    const already = appliedDiscounts.find(a => a.discountId === d.id);
    if (already) {
      setAppliedDiscounts(prev => prev.filter(a => a.discountId !== d.id));
    } else {
      setAppliedDiscounts(prev => {
        const clean = prev.filter(a => !eligibleDiscounts.some(e => e.id === a.discountId));
        return [...clean, {
          discountId: d.id, label: d.name, value_type: d.value_type,
          value: d.value, amount: computeAmount(d, grossTotal, items, services),
          is_owner_borne: d.borne_by ? (d.borne_by === 'owner') : (d.is_owner_borne ?? true),
          borne_by: d.borne_by ?? (d.is_owner_borne ? 'owner' : 'shared'),
        }];
      });
    }
  };

  const addManualDiscount = () => {
    if (!addDiscountId) return;
    const d = allDiscounts.find(x => x.id === addDiscountId);
    if (!d || appliedDiscounts.find(a => a.discountId === d.id)) return;
    setAppliedDiscounts(prev => [...prev, {
      discountId: d.id, label: d.name, value_type: d.value_type,
      value: d.value, amount: computeAmount(d, grossTotal, items, services),
      is_owner_borne: d.borne_by ? (d.borne_by === 'owner') : (d.is_owner_borne ?? true),
      borne_by: d.borne_by ?? (d.is_owner_borne ? 'owner' : 'shared'),
    }]);
    setAddDiscountId('');
  };

  const addCustomDiscount = () => {
    if (!customDiscountName || !customDiscountAmount) return;
    setAppliedDiscounts(prev => [...prev, {
      discountId: `custom_${Date.now()}`,
      label: customDiscountName,
      value_type: 'flat',
      value: Number(customDiscountAmount),
      amount: Number(customDiscountAmount),
      is_owner_borne: true,
      borne_by: 'owner',
    }]);
    setCustomDiscountName('');
    setCustomDiscountAmount('');
  };

  const removeApplied = (discountId: string) =>
    setAppliedDiscounts(prev => prev.filter(a => a.discountId !== discountId));

  // ── Voucher ops ──
  const checkVoucher = async () => {
    if (!voucherCode.trim()) return;
    setVoucherChecking(true);
    setVoucherError('');
    try {
      const res = await fetch(`/api/vouchers/validate?code=${encodeURIComponent(voucherCode.trim().toUpperCase())}`);
      const json = await res.json();
      if (!json.valid) { setVoucherError(json.error || 'Voucher tidak valid.'); }
      else { setVoucherApplied({ id: json.voucher.id, code: voucherCode.trim().toUpperCase(), label: `Voucher: ${json.voucher.name}`, value: json.voucher.value, value_type: json.voucher.value_type }); }
    } catch { setVoucherError('Gagal memeriksa voucher.'); }
    setVoucherChecking(false);
  };

  const applyVoucher = () => {
    if (!voucherApplied) return;
    const amount = voucherApplied.value_type === 'percentage' ? Math.round(grossTotal * voucherApplied.value / 100) : voucherApplied.value;
    if (appliedDiscounts.find(a => a.discountId === `voucher_${voucherApplied.id}`)) return;
    setAppliedDiscounts(prev => [...prev, {
      discountId: `voucher_${voucherApplied.id}`,
      label: voucherApplied.label,
      value_type: voucherApplied.value_type,
      value: voucherApplied.value,
      amount,
      is_owner_borne: true,
      borne_by: 'owner',
    }]);
    setVoucherApplied(null);
    setVoucherCode('');
  };

  const totalDiscount = appliedDiscounts.reduce((s, a) => s + a.amount, 0);
  const sharedDiscountAmount = appliedDiscounts
    .filter(a => (a.borne_by ?? (a.is_owner_borne ? 'owner' : 'shared')) === 'shared')
    .reduce((s, a) => s + a.amount, 0);
  const rawTherapistDiscountAmount = appliedDiscounts
    .filter(a => (a.borne_by ?? (a.is_owner_borne ? 'owner' : 'shared')) === 'therapist')
    .reduce((s, a) => s + a.amount, 0);

  // 2-Layer Separation Logic:
  // If customer is New Customer (effectiveCount === 0), therapist ALWAYS bears the 5% basis reduction,
  // EVEN IF the customer uses an owner-borne voucher!
  const isNewCustomer = effectiveCount === 0;
  const therapistDiscountAmount = isNewCustomer
    ? Math.max(rawTherapistDiscountAmount, Math.round(grossTotal * 5 / 100))
    : rawTherapistDiscountAmount;

  // Transport: sum all entries
  const totalTransportFee = transportEntries.reduce((s, e) => s + Number(e.fee || 0), 0);

  const finalTotal = Math.max(0, grossTotal - totalDiscount) + totalTransportFee;

  // Per-item commission: use each item's assigned therapist pct, fallback to global commissionPct
  const sharedDiscountPerGross = grossTotal > 0 ? sharedDiscountAmount / grossTotal : 0;
  const therapistDiscountPerGross = grossTotal > 0 ? therapistDiscountAmount / grossTotal : 0;
  const commissionServices = items.reduce((sum, item) => {
    const itemSharedDisc = item.price * sharedDiscountPerGross;
    const itemTherapistDisc = item.price * therapistDiscountPerGross;
    let pct = commissionPct; // global fallback
    if (item.therapist_id) {
      const t = therapists.find(x => x.id === item.therapist_id);
      if (t) pct = t.commission_pct;
    }
    const maxBasisReduction = Math.round(item.price * 5 / 100);
    const basisReduction = Math.min(itemTherapistDisc, maxBasisReduction);
    const itemBasis = item.price - basisReduction;
    const grossCommission = Math.round(itemBasis * pct / 100);
    const therapistBearsShared = Math.round(itemSharedDisc * 50 / 100);
    const itemCommission = Math.max(0, grossCommission - therapistBearsShared);
    return sum + itemCommission;
  }, 0);
  // Transport commission: only if entry has a therapist assigned; no therapist → full goes to owner
  const commissionTransport = transportEntries.reduce((s, e) => {
    if (!e.therapist_id) return s;
    return s + Math.round(Number(e.fee || 0) * (e.pct / 100));
  }, 0);
  const commission = commissionServices + commissionTransport;
  const ownerNet = finalTotal - commission;

  // ── Tier badge helper ──
  const tierBadge = (): string | null => {
    if (effectiveCount === null) return null;
    if (effectiveCount === 0) return '✨ Pelanggan Baru';
    const loyal = allDiscounts
      .filter(d => d.type === 'loyal' && isDiscountValid(d) && d.min_orders !== null && effectiveCount >= d.min_orders)
      .sort((a, b) => (b.min_orders ?? 0) - (a.min_orders ?? 0))[0];
    return loyal ? `🏅 ${loyal.name}` : null;
  };

  // ── Shared capture helper — unlocks parent overflow before toPng ──
  // html-to-image uses getBoundingClientRect() which returns visible area only;
  // we temporarily remove parent clipping so the full invoice height is captured.
  const captureInvoice = async (): Promise<{ dataUrl: string; blob: Blob } | null> => {
    if (!invoiceRef.current) return null;
    const el = invoiceRef.current;

    type Saved = { el: HTMLElement; overflow: string; height: string; maxHeight: string };
    const saved: Saved[] = [];
    let cur = el.parentElement;
    while (cur && cur !== document.body) {
      const cs = window.getComputedStyle(cur);
      if (cs.overflow !== 'visible' || cs.overflowX !== 'visible' || cs.overflowY !== 'visible') {
        saved.push({ el: cur, overflow: cur.style.overflow, height: cur.style.height, maxHeight: cur.style.maxHeight });
        cur.style.overflow = 'visible';
        cur.style.height = 'auto';
        cur.style.maxHeight = 'none';
      }
      cur = cur.parentElement;
    }
    const elOverflow = el.style.overflow;
    el.style.overflow = 'visible';

    await new Promise(r => requestAnimationFrame(r));
    await document.fonts.ready;

    const scale = 3;
    const fullHeight = el.scrollHeight;

    let result: { dataUrl: string; blob: Blob } | null = null;
    try {
      const dataUrl = await toPng(el, { cacheBust: true, pixelRatio: scale, width: 480, height: fullHeight });
      const blob = await (await fetch(dataUrl)).blob();
      result = { dataUrl, blob };
    } catch (e) { console.error(e); }

    el.style.overflow = elOverflow;
    saved.forEach(s => {
      s.el.style.overflow = s.overflow;
      s.el.style.height = s.height;
      s.el.style.maxHeight = s.maxHeight;
    });

    return result;
  };

  const generateImage = async () => {
    if (!invoiceRef.current) return null;
    setGenerating(true);
    const result = await captureInvoice();
    setGenerating(false);
    return result;
  };


  // ── Save: complete booking + record discounts ──
  const completeAndSave = async () => {
    if (!selectedBookingId) return;
    // Audit #2 Bug #1: double-completion guard
    if (hasSavedRef.current) return;
    hasSavedRef.current = true;

    // Fix #15: verify current status from DB before proceeding
    const { data: currentBooking } = await supabase
      .from('bookings').select('status').eq('id', selectedBookingId).single();
    if (currentBooking?.status === 'Completed') {
      const confirmed = window.confirm(
        'Booking ini sudah berstatus COMPLETED.\n\nMelanjutkan akan menimpa data invoice, komisi, dan diskon yang telah tersimpan.\n\nYakin ingin mengubah data?'
      );
      if (!confirmed) {
        hasSavedRef.current = false;
        return;
      }
    }

    setCompleting(true);
    try {
      let clean = customerPhone.replace(/\D/g, '');
      if (clean.startsWith('0')) clean = '62' + clean.substring(1);

      // 1. Upsert customer
      let customerId = customerRecord?.id ?? null;
      if (clean && clean.length > 5) {
        if (!customerId) {
          const { data: newCust } = await supabase
            .from('customers')
            .upsert({ wa_number: clean, name: customerName },
              { onConflict: 'wa_number', ignoreDuplicates: true })
            .select('id').single();
          if (!newCust) {
            const { data: ex } = await supabase.from('customers').select('id').eq('wa_number', clean).single();
            customerId = ex?.id ?? null;
          } else customerId = newCust.id;
        }
      }

      // Fetch BHP for each item
      const itemsWithBhp = await Promise.all(
        items.map(async (item) => {
          const bhp = await calcBhp(item.name);
          return { ...item, bhp };
        })
      );
      const totalBhp = itemsWithBhp.reduce((s, i) => s + i.bhp, 0);

      const isNewCustomer = effectiveCount === 0;
      const effectiveTherapistDiscountAmount = isNewCustomer
        ? Math.max(therapistDiscountAmount, Math.round(grossTotal * 5 / 100))
        : therapistDiscountAmount;

      // 2. Update booking
      const displayName = items.map(i => i.name).join(' + ');
      await supabase.from('bookings').update({
        status: 'Completed',
        service_name: displayName,
        customer_id: customerId,
        discount_total: totalDiscount,
        final_price: finalTotal,
        price: grossTotal + totalTransportFee,
        bhp_cost: totalBhp,
        shared_discount_total: sharedDiscountAmount,
        therapist_discount_total: effectiveTherapistDiscountAmount,
      }).eq('id', selectedBookingId);

      // 3. Clean up stale booking_items and update/insert active items
      const currentDbIds = itemsWithBhp.map(i => i.db_id).filter(Boolean);
      if (currentDbIds.length > 0) {
        await supabase
          .from('booking_items')
          .delete()
          .eq('booking_id', selectedBookingId)
          .neq('service_name', 'Biaya Transport')
          .not('id', 'in', `(${currentDbIds.join(',')})`);
      } else {
        await supabase
          .from('booking_items')
          .delete()
          .eq('booking_id', selectedBookingId)
          .neq('service_name', 'Biaya Transport');
      }

      const sharedDiscountPerGross = grossTotal > 0 ? sharedDiscountAmount / grossTotal : 0;
      const therapistDiscountPerGross = grossTotal > 0 ? effectiveTherapistDiscountAmount / grossTotal : 0;
      for (const item of itemsWithBhp) {
        const itemSharedDiscount = item.price * sharedDiscountPerGross;
        const itemTherapistDiscount = item.price * therapistDiscountPerGross;
        let pct = commissionPct;
        if (item.therapist_id) {
          const t = therapists.find(x => x.id === item.therapist_id);
          if (t) pct = t.commission_pct;
        }
        const maxBasisReduction = Math.round(item.price * 5 / 100);
        const basisReduction = Math.min(itemTherapistDiscount, maxBasisReduction);
        const itemBasis = item.price - basisReduction;
        const grossCommission = Math.round(itemBasis * pct / 100);
        const therapistBearsShared = Math.round(itemSharedDiscount * 50 / 100);
        const itemCommission = item.therapist_id ? Math.max(0, grossCommission - therapistBearsShared) : 0;

        const svc = services.find(s => s.name === item.name);
        const serviceId = svc?.id || null;
        if (item.db_id) {
          // UPDATE existing item
          await supabase.from('booking_items').update({
            service_name: item.name,
            price: item.price,
            therapist_id: item.therapist_id || null,
            commission_earned: itemCommission,
            bhp_cost: item.bhp,
            service_id: serviceId,
          }).eq('id', item.db_id);
        } else {
          // Audit #2 Bug #6: INSERT items that have no db_id yet
          await supabase.from('booking_items').insert({
            booking_id: selectedBookingId,
            service_name: item.name,
            price: item.price,
            therapist_id: item.therapist_id || null,
            commission_earned: itemCommission,
            bhp_cost: item.bhp,
            service_id: serviceId,
          });
        }
      }

      await supabase.from('booking_items').delete().eq('booking_id', selectedBookingId).eq('service_name', 'Biaya Transport');
      for (const entry of transportEntries) {
        if (Number(entry.fee) > 0) {
          // No therapist assigned → commission_earned = 0 (full transport amount to owner)
          const entryCommission = entry.therapist_id
            ? Math.round(Number(entry.fee) * (entry.pct / 100))
            : 0;
          await supabase.from('booking_items').insert({
            booking_id: selectedBookingId,
            service_name: 'Biaya Transport',
            price: Number(entry.fee),
            commission_earned: entryCommission,
            therapist_id: entry.therapist_id || null,
            sort_order: 999,
          });
        }
      }

      // 4. Audit #2 Bug #2: DELETE existing discounts first to prevent duplicates on re-complete
      await supabase.from('booking_discounts').delete().eq('booking_id', selectedBookingId);
      if (appliedDiscounts.length > 0) {
        await supabase.from('booking_discounts').insert(
          appliedDiscounts.map(a => ({
            booking_id: selectedBookingId,
            discount_id: a.discountId.startsWith('custom_') ? null : (a.discountId.startsWith('voucher_') ? a.discountId.replace('voucher_', '') : a.discountId),
            discount_label: a.label,
            discount_value_type: a.value_type,
            discount_value: a.value,
            discount_amount: a.amount,
            is_owner_borne: a.is_owner_borne,
          }))
        );
        // Audit #2 Bug #4: re-fetch from DB before increment to avoid stale read race condition
        for (const a of appliedDiscounts) {
          if (a.discountId.startsWith('custom_')) continue;
          const realId = a.discountId.startsWith('voucher_') ? a.discountId.replace('voucher_', '') : a.discountId;
          const { data: fresh } = await supabase.from('discounts').select('uses_count').eq('id', realId).single();
          await supabase.from('discounts')
            .update({ uses_count: (fresh?.uses_count ?? 0) + 1 })
            .eq('id', realId);
        }
      }

      // 5. Sync to cash_transactions ledger automatically
      try {
        await supabase.from('cash_transactions').delete().eq('reference_id', invoiceNumber);
        await supabase.from('cash_transactions').insert({
          transaction_date: new Date().toISOString(),
          type: 'inflow',
          category: 'service_income',
          payment_account: paymentAccount,
          amount: finalTotal,
          description: `${customerName || 'Pelanggan'} - ${invoiceNumber}`,
          reference_id: invoiceNumber,
          created_by: user?.displayName || user?.email || 'Admin'
        });
      } catch (cashErr) {
        console.error('Failed to sync transaction to cash_transactions:', cashErr);
      }

      // Audit #2 Bug #5: refresh booking list so completed booking disappears from dropdown
      await fetchAll();
    } catch (err) {
      console.error(err);
      hasSavedRef.current = false;
    } finally {
      setCompleting(false);
    }
  };

  const downloadInvoice = async () => {
    await completeAndSave();
    const r = await generateImage();
    if (!r) return;
    const link = document.createElement('a');
    link.download = `Invoice-${invoiceNumber}.png`;
    link.href = r.dataUrl;
    link.click();
  };

  const shareToWhatsApp = async () => {
    await completeAndSave();
    const r = await generateImage();
    if (!r) return;
    const file = new File([r.blob], `Invoice-${invoiceNumber}.png`, { type: 'image/png' });
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file], title: `Invoice ${invoiceNumber} - SerenaRaga`, text: `Invoice untuk ${customerName || 'pelanggan'} — Total: ${formatRp(finalTotal)}` }); return; }
      catch (e) { if ((e as Error).name === 'AbortError') return; }
    }
    const msg = `Invoice ${invoiceNumber} untuk ${customerName || 'pelanggan'}\nTotal: ${formatRp(finalTotal)}\n*(Gambar invoice dilampirkan)*`;
    const phone = customerPhone.replace(/\D/g, '');
    if (phone) window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
    const link = document.createElement('a');
    link.download = `Invoice-${invoiceNumber}.png`;
    link.href = r.dataUrl;
    link.click();
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

  const unappliedDiscounts = allDiscounts.filter(d =>
    isDiscountValid(d) && !d.is_voucher && !appliedDiscounts.find(a => a.discountId === d.id)
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
      {/* ── FORM SECTION ── */}
      <div className="lg:col-span-7 space-y-6 bg-white dark:bg-zinc-900 p-5 sm:p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div>
          <h2 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider mb-1">Rincian POS / Checkout</h2>
          <p className="text-xs text-zinc-450 dark:text-zinc-500">Lengkapi detail treatment, terapis, diskon, dan transport pelanggan.</p>
        </div>

        {/* Pick from Booking */}
        <div className="bg-zinc-50 dark:bg-zinc-950/40 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 space-y-2">
          <div className="flex items-center gap-2">
            <Users size={14} className="text-earth-primary" />
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Pilih dari Antrean Booking</label>
          </div>
          <select value={selectedBookingId} onChange={e => onBookingSelect(e.target.value)} className="admin-input text-xs">
            <option value="">-- Pilih booking untuk auto-isi --</option>
            {bookings.map(b => (
              <option key={b.id} value={b.id}>
                {b.customer_name} · {b.service_name} {b.booking_date ? `(${formatDate(b.booking_date)})` : ''} · {b.status}
              </option>
            ))}
          </select>
          {selectedBookingId && (
            <p className="text-[10px] text-zinc-450 dark:text-zinc-550 font-medium">
              Data booking terisi otomatis. Anda masih dapat memodifikasi item di bawah.
            </p>
          )}
        </div>

        {/* No + Date + Time */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-[10px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-wider mb-1.5 block">No. Invoice</label>
            <input type="text" value={invoiceNumber} readOnly className="admin-input font-mono text-xs opacity-60 cursor-not-allowed bg-zinc-50 dark:bg-zinc-900" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-wider mb-1.5 block">Tanggal</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="admin-input text-xs font-mono" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-wider mb-1.5 block">Waktu / Jam</label>
            <input type="time" value={bookingTime} onChange={e => setBookingTime(e.target.value)} className="admin-input text-xs font-mono" />
          </div>
        </div>

        {/* Customer Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-wider mb-1.5 block">Nama Pelanggan</label>
            <input type="text" placeholder="Ibu Rina" value={customerName} onChange={e => setCustomerName(e.target.value)} className="admin-input text-xs" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-wider mb-1.5 block">No. WhatsApp</label>
            <div className="relative">
              <input type="tel" placeholder="628xxx" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="admin-input pr-8 text-xs font-mono" />
              {lookingUpCustomer && <Loader2 size={13} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-zinc-450" />}
            </div>
          </div>
        </div>

        {/* Customer info card */}
        {effectiveCount !== null && (
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/20 p-4 space-y-3.5 shadow-sm">
            <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-zinc-150 dark:border-zinc-850">
              <div className="flex items-center gap-2">
                <Users size={14} className="text-earth-primary" />
                <span className="text-xs font-bold text-zinc-850 dark:text-zinc-200">Profil Pelanggan</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300/10 dark:border-zinc-700 font-mono">
                  KUNJUNGAN KE-{effectiveCount + 1}
                </span>
                {tierBadge() && (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-earth-primary/10 text-earth-primary border border-earth-primary/20">
                    {tierBadge()}
                  </span>
                )}
              </div>
            </div>

            {/* Eligible discounts */}
            {eligibleDiscounts.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-wider">Diskon Otomatis Tersedia</p>
                <div className="space-y-1.5">
                  {eligibleDiscounts.map(d => {
                    const applied = !!appliedDiscounts.find(a => a.discountId === d.id);
                    const amt = computeAmount(d, grossTotal, items, services);
                    return (
                      <label key={d.id} className="flex items-center justify-between cursor-pointer group p-1.5 rounded-lg hover:bg-zinc-100/50 dark:hover:bg-zinc-800/30 transition-colors">
                        <div className="flex items-center gap-2.5">
                          <input type="checkbox" checked={applied} onChange={() => toggleEligibleDiscount(d)}
                            className="rounded border-zinc-300 dark:border-zinc-700 text-earth-primary focus:ring-earth-primary w-4 h-4" />
                          <span className="text-xs text-zinc-700 dark:text-zinc-300 font-medium">
                            {d.name} {d.value_type === 'percentage' ? `(${d.value}%)` : ''}
                          </span>
                        </div>
                        <span className={`text-xs font-mono font-bold ${applied ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400'}`}>
                          -{formatRp(amt)}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Returning Customer Promo Suggestion */}
            {returningPromos.length > 0 && (
              <div className="rounded-xl border border-orange-200 dark:border-orange-900 bg-orange-50/50 dark:bg-orange-950/10 p-3 space-y-2">
                <p className="text-[10px] font-bold text-orange-600 dark:text-orange-400 flex items-center gap-1.5 uppercase tracking-wider">
                  🔄 Pelanggan Loyal Lama — Promo Kembali
                </p>
                <div className="space-y-1.5">
                  {returningPromos.map(d => {
                    const applied = !!appliedDiscounts.find(a => a.discountId === d.id);
                    return (
                      <label key={d.id} className="flex items-center justify-between cursor-pointer p-1 rounded hover:bg-orange-100/20">
                        <div className="flex items-center gap-2">
                          <input type="checkbox" checked={applied} onChange={() => toggleEligibleDiscount(d)}
                            className="rounded border-orange-300 text-orange-600 focus:ring-orange-500 w-4 h-4" />
                          <span className="text-xs text-orange-850 dark:text-orange-300 font-medium">
                            {d.name} {d.value_type === 'percentage' ? `(${d.value}%)` : ''}
                          </span>
                        </div>
                        <span className={`text-xs font-mono font-bold ${applied ? 'text-orange-600 dark:text-orange-450' : 'text-orange-300'}`}>
                          -{formatRp(computeAmount(d, grossTotal, items, services))}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Applied discounts list */}
            {appliedDiscounts.length > 0 && (
              <div className="space-y-1.5 border-t border-zinc-150 dark:border-zinc-850 pt-3">
                <p className="text-[10px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-wider">Diskon Terpasang</p>
                <div className="space-y-1">
                  {appliedDiscounts
                    .filter(a => !eligibleDiscounts.find(e => e.id === a.discountId))
                    .map(a => (
                      <div key={a.discountId} className="flex items-center justify-between text-xs bg-white dark:bg-zinc-950 p-2 rounded-lg border border-zinc-100 dark:border-zinc-850">
                        <div className="flex items-center gap-2 min-w-0">
                          <Tag size={12} className="text-earth-primary shrink-0" />
                          <span className="text-zinc-700 dark:text-zinc-300 font-medium truncate">{a.label}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">-{formatRp(a.amount)}</span>
                          <button onClick={() => removeApplied(a.discountId)} className="text-zinc-400 hover:text-red-500 p-0.5 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded">
                            <X size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Add manual discount selector */}
            <div className="flex gap-2 pt-2">
              <select value={addDiscountId} onChange={e => setAddDiscountId(e.target.value)}
                className="admin-input text-xs flex-1">
                <option value="">+ Pasang diskon terdaftar...</option>
                {unappliedDiscounts
                  .filter(d => !eligibleDiscounts.find(e => e.id === d.id))
                  .map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} — {d.value_type === 'percentage' ? `${d.value}%` : formatRp(d.value)}
                    </option>
                  ))}
              </select>
              {addDiscountId && (
                <button onClick={addManualDiscount} className="admin-btn-primary py-1.5 px-3 shrink-0">
                  <Check size={14} />
                </button>
              )}
            </div>

            {/* Voucher Code */}
            <div className="pt-3 border-t border-zinc-150 dark:border-zinc-850">
              <p className="text-[10px] font-bold text-earth-primary mb-1.5 uppercase tracking-wider">🎁 Kode Voucher / Gift Card</p>
              <div className="flex gap-2">
                <input
                  placeholder="SRAGA-XXXX"
                  value={voucherCode}
                  onChange={e => { setVoucherCode(e.target.value.toUpperCase()); setVoucherError(''); setVoucherApplied(null); }}
                  className="admin-input text-xs flex-1 font-mono tracking-widest uppercase"
                  onKeyDown={e => e.key === 'Enter' && checkVoucher()}
                />
                <button onClick={checkVoucher} disabled={!voucherCode.trim() || voucherChecking} className="admin-btn-ghost py-1.5 px-3.5 shrink-0 text-xs disabled:opacity-50">
                  {voucherChecking ? <Loader2 size={13} className="animate-spin" /> : 'Periksa'}
                </button>
              </div>
              {voucherError && <p className="text-[10px] font-bold text-red-500 mt-1">{voucherError}</p>}
              {voucherApplied && (
                <div className="mt-2 flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250/20 rounded-xl px-3.5 py-2.5">
                  <div>
                    <p className="text-xs font-bold text-emerald-800 dark:text-emerald-400">{voucherApplied.label}</p>
                    <p className="text-[10px] text-emerald-650 dark:text-emerald-500 font-medium">
                      Potongan: {voucherApplied.value_type === 'flat' ? formatRp(voucherApplied.value) : `${voucherApplied.value}% dari subtotal`}
                    </p>
                  </div>
                  <button onClick={applyVoucher} className="admin-btn-primary text-xs py-1 px-3">
                    Pakai Voucher
                  </button>
                </div>
              )}
            </div>

            {/* Custom Manual Discount */}
            <div className="pt-3 border-t border-zinc-150 dark:border-zinc-850">
              <p className="text-[10px] font-bold text-zinc-450 dark:text-zinc-550 mb-1.5 uppercase tracking-wider">+ Custom Potongan Manual</p>
              <div className="flex gap-2">
                <input placeholder="Keterangan diskon..." value={customDiscountName} onChange={e => setCustomDiscountName(e.target.value)} className="admin-input text-xs flex-[2]" />
                <input type="number" placeholder="Rp potongan..." value={customDiscountAmount} onChange={e => setCustomDiscountAmount(e.target.value)} className="admin-input text-xs flex-[1.2] font-mono text-right" />
                <button onClick={addCustomDiscount} disabled={!customDiscountName || !customDiscountAmount} className="admin-btn-primary py-1.5 px-3 shrink-0 disabled:opacity-50">
                  <Check size={14} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Items List */}
        <div className="space-y-3">
          <div className="flex justify-between items-center pb-1">
            <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">Layanan yang Dipesan</label>
            <button onClick={addItem} className="text-xs text-earth-primary font-bold hover:underline flex items-center gap-1">+ Tambah Item</button>
          </div>

          {conflictWarning && (
            <div className="px-3.5 py-2.5 bg-red-500/5 border border-red-500/10 rounded-xl text-xs font-semibold text-red-650 dark:text-red-400">
              {conflictWarning}
            </div>
          )}

          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={item.id} className="bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 space-y-3 shadow-sm relative">
                <div className="flex items-center justify-between border-b border-zinc-155 dark:border-zinc-850 pb-2">
                  <span className="text-[10px] font-bold text-zinc-450 dark:text-zinc-500">ITEM #{idx + 1}</span>
                  {items.length > 1 && (
                    <button onClick={() => removeItem(item.id)} className="text-red-550 hover:bg-red-50 dark:hover:bg-red-950/20 p-1 rounded-lg transition-colors">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>

                {/* Select standard service */}
                <div>
                  <label className="text-[9px] text-zinc-400 font-extrabold uppercase mb-1 block tracking-wider">Pilih Menu Treatment</label>
                  <select value={item.name} onChange={e => onServiceSelect(item.id, e.target.value)} className="admin-input text-xs">
                    <option value="">-- Pilih dari pricelist --</option>
                    {categories.map(cat => (
                      <optgroup key={cat.id} label={cat.label}>
                        {services.filter(s => s.category === cat.id).map(s => (
                          <option key={s.id} value={s.name}>{s.name} — {formatRp(s.price)}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                {/* Overwrite details manually */}
                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-6">
                    <label className="text-[9px] text-zinc-400 font-extrabold uppercase mb-1 block tracking-wider">Nama Treatment</label>
                    <input placeholder="Nama..." value={item.name} onChange={e => updateItem(item.id, 'name', e.target.value)} className="admin-input text-xs" />
                  </div>
                  <div className="col-span-3">
                    <label className="text-[9px] text-zinc-400 font-extrabold uppercase mb-1 block tracking-wider text-center">Durasi</label>
                    <input placeholder="90m..." value={item.duration} onChange={e => updateItem(item.id, 'duration', e.target.value)} className="admin-input text-xs text-center font-mono" />
                  </div>
                  <div className="col-span-3">
                    <label className="text-[9px] text-zinc-400 font-extrabold uppercase mb-1 block tracking-wider text-right">Harga</label>
                    <input type="number" placeholder="Rp..." value={item.price || ''} onChange={e => updateItem(item.id, 'price', Number(e.target.value))} className="admin-input text-xs text-right font-mono" />
                  </div>
                </div>

                {/* Therapist selection */}
                <div>
                  <label className="text-[9px] text-zinc-400 font-extrabold uppercase mb-1 block tracking-wider">Terapis Penanggung Jawab</label>
                  <select className="admin-input text-xs" value={item.therapist_id || ''} onChange={e => updateItem(item.id, 'therapist_id', e.target.value)}>
                    <option value="">-- Pilih Terapis --</option>
                    {therapists.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} {isOwner ? `(Fee ${t.commission_pct}%)` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Transport fee per therapist */}
        <div className="bg-zinc-50 dark:bg-zinc-955/20 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 space-y-3.5 shadow-sm">
          <div className="flex items-center justify-between border-b border-zinc-150 dark:border-zinc-850 pb-2">
            <div className="flex items-center gap-1.5">
              <Bus size={14} className="text-earth-primary" />
              <input
                type="text"
                value={transportLabel}
                onChange={e => setTransportLabel(e.target.value)}
                className="bg-transparent text-xs font-bold text-zinc-700 dark:text-zinc-300 outline-none border-b border-dashed border-zinc-300 dark:border-zinc-700 hover:border-earth-primary focus:border-earth-primary w-40 pb-0.5"
              />
            </div>
            {totalTransportFee > 0 && (
              <span className="text-xs text-earth-primary font-mono font-bold">
                {formatRp(totalTransportFee)}
              </span>
            )}
          </div>

          <div className="space-y-2">
            {transportEntries.map((entry) => {
              const poolTherapists = transportTherapistPool.length > 0
                ? therapists.filter(t => transportTherapistPool.includes(t.id))
                : therapists;
              const usedIds = transportEntries
                .filter(te => te.id !== entry.id && te.therapist_id)
                .map(te => te.therapist_id);
              const availableTherapists = poolTherapists.filter(t => !usedIds.includes(t.id));

              return (
                <div key={entry.id} className="flex gap-2 items-center">
                  <select
                    value={entry.therapist_id}
                    onChange={e => setTransportEntries(prev => prev.map(te => te.id === entry.id ? { ...te, therapist_id: e.target.value } : te))}
                    className="admin-input text-xs flex-1 min-w-0"
                  >
                    <option value="">→ Ke Owner (Milik Spa)</option>
                    {availableTherapists.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    {entry.therapist_id && !availableTherapists.find(t => t.id === entry.therapist_id) && (() => {
                      const t = therapists.find(x => x.id === entry.therapist_id);
                      return t ? <option key={t.id} value={t.id}>{t.name}</option> : null;
                    })()}
                  </select>
                  <input
                    type="number"
                    placeholder="Fee Rp..."
                    value={entry.fee}
                    onChange={e => setTransportEntries(prev => prev.map(te => te.id === entry.id ? { ...te, fee: e.target.value === '' ? '' : Number(e.target.value) } : te))}
                    className="admin-input text-xs font-mono w-28 text-right"
                  />
                  {isOwner && entry.therapist_id && (
                    <div className="flex items-center gap-0.5 bg-white dark:bg-zinc-950 px-2 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-850 shrink-0">
                      <input
                        type="number"
                        max={100}
                        min={0}
                        value={entry.pct}
                        onChange={e => setTransportEntries(prev => prev.map(te => te.id === entry.id ? { ...te, pct: Number(e.target.value) } : te))}
                        className="bg-transparent text-end font-mono text-xs font-bold text-earth-primary w-[30px] outline-none"
                      />
                      <span className="text-[10px] text-zinc-450 font-bold">%</span>
                    </div>
                  )}
                  {transportEntries.length > 1 && (
                    <button
                      onClick={() => setTransportEntries(prev => prev.filter(te => te.id !== entry.id))}
                      className="text-red-500 hover:text-red-650 p-1 shrink-0"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <button
            onClick={() => setTransportEntries(prev => [...prev, { id: Date.now().toString(), therapist_id: '', fee: '', pct: 100 }])}
            className="text-xs text-earth-primary font-bold hover:underline flex items-center gap-1 mt-1"
          >
            <Plus size={12} /> Tambah Transport Lain
          </button>
        </div>

        {/* Pricing Summary card */}
        <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800 p-5 space-y-3.5 shadow-sm">
          <div className="flex justify-between items-center text-xs">
            <span className="text-zinc-550 dark:text-zinc-450 font-semibold uppercase">Subtotal Menu</span>
            <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300 font-mono">{formatRp(grossTotal)}</span>
          </div>

          {appliedDiscounts.map(a => (
            <div key={a.discountId} className="flex justify-between items-center text-xs">
              <span className="text-zinc-500 flex items-center gap-1"><Tag size={11} className="text-earth-primary" /> {a.label}</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">-{formatRp(a.amount)}</span>
            </div>
          ))}

          {totalDiscount > 0 && (
            <div className="flex justify-between items-center pt-2.5 border-t border-dashed border-zinc-200 dark:border-zinc-800">
              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase">Total Tagihan</span>
              <span className="text-lg font-bold text-earth-primary font-mono">{formatRp(finalTotal)}</span>
            </div>
          )}

          {!totalDiscount && (
            <div className="flex justify-between items-center pt-2.5 border-t border-dashed border-zinc-200 dark:border-zinc-800">
              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase">Total Invoice</span>
              <span className="text-lg font-bold text-earth-primary font-mono">{formatRp(finalTotal)}</span>
            </div>
          )}

          {isOwner && commission > 0 && finalTotal > 0 && (
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-zinc-200 dark:border-zinc-800 text-xs">
              <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 p-2.5 rounded-xl">
                <span className="flex items-center gap-1 text-[10px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-wider">
                  <Percent size={11} className="text-amber-500" /> Terapis ({items.some(i => i.therapist_id && therapists.find(t => t.id === i.therapist_id)) ? 'Detail' : `${commissionPct}%`})
                </span>
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400 block mt-1">{formatRp(commission)}</span>
              </div>
              <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 p-2.5 rounded-xl text-right">
                <span className="text-[10px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-wider">Net Pemilik</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 block mt-1">{formatRp(ownerNet)}</span>
              </div>
            </div>
          )}
        </div>

        {/* ── STICKY FOOTER (Summary & Actions) ── */}
        <div className="sticky bottom-4 z-20 bg-white dark:bg-zinc-900 p-4 sm:p-5 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold tracking-wider text-zinc-450 uppercase mb-0.5">Total Tagihan</p>
              <p className="text-xl font-bold text-earth-primary font-mono leading-none">{formatRp(finalTotal)}</p>
            </div>

            <div className="text-right">
              {selectedBookingId && (
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold uppercase tracking-wide mb-0.5">Booking → Completed</p>
              )}
              {isOwner && commissionPct > 0 && finalTotal > 0 && (
                <p className="text-[10px] text-zinc-450 font-bold">Net Pemilik: <span className="font-mono text-zinc-700 dark:text-zinc-300 font-extrabold">{formatRp(ownerNet)}</span></p>
              )}
            </div>
          </div>

          {/* Payment Account Selection */}
          <div className="pt-2.5 border-t border-zinc-150 dark:border-zinc-800">
            <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block mb-1.5">
              Metode Pembayaran (Buku Kas)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {availableAccounts.map(method => {
                const Icon = ACCOUNT_ICONS[method.icon] || Wallet;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setPaymentAccount(method.id)}
                    className={`px-2 py-1.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      paymentAccount === method.id
                        ? 'bg-earth-primary text-white border-earth-primary shadow-xs'
                        : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-earth-primary/50'
                    }`}
                  >
                    <Icon size={13} />
                    <span className="truncate">{method.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={shareToWhatsApp} disabled={generating || completing}
              className="admin-btn-primary flex-1 justify-center py-3 disabled:opacity-60 shadow-md">
              {generating || completing ? <Loader2 size={14} className="animate-spin" /> : <Share2 size={14} />}
              {selectedBookingId ? 'Selesaikan & Kirim WA' : 'Kirim WA'}
            </button>
            <button onClick={downloadInvoice} disabled={generating || completing}
              className="admin-btn-ghost px-4 py-3 disabled:opacity-60 bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-800 rounded-xl" title="Download PNG">
              <Download size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ── PREVIEW SECTION ── */}
      <div className="lg:col-span-5 lg:sticky lg:top-6 space-y-3">
        <h3 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest px-1">Preview Invoice</h3>
        {/* overflow-x-auto wraps the 480px invoice so mobile can scroll horizontally */}
        <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-lg">
          <div style={{ minWidth: 480 }}>
            <div ref={invoiceRef} className="bg-[#FDFBF7] text-zinc-900 font-sans relative overflow-hidden" style={{ width: 480, minHeight: 680 }}>
              {/* Top Accent Strip */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-[#8B5E3C]" />

              {/* Watermark Logo (Tiled Banking Style - Sharp Vector) */}
              <div className="absolute inset-0 z-0 pointer-events-none select-none">
                <svg className="w-full h-full" style={{ opacity: 0.12 }}>
                  <defs>
                    <pattern
                      id="watermark-pattern-maker"
                      width="130"
                      height="130"
                      patternUnits="userSpaceOnUse"
                      patternTransform="rotate(-20)"
                    >
                      <g transform="translate(20, 20) scale(0.06)">
                        <SerenaLogoPaths monochrome={true} color="#8b5e3c" idSuffix="watermark-maker" />
                      </g>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#watermark-pattern-maker)" />
                </svg>
              </div>

              {/* Content Container */}
              <div className="relative z-10 p-10 mt-2">

                {/* Header */}
                <div className="flex justify-between items-start mb-12">
                  <div>
                    <div className="relative flex items-center justify-start h-[56px] w-[220px] overflow-hidden -ml-2 mb-1">
                      <SerenaLogoSvg
                        className="absolute h-[260px] w-auto max-w-none object-contain -ml-6"
                        idSuffix="header-maker"
                      />
                    </div>
                    <p style={{ fontSize: 8, letterSpacing: '0.3em', fontWeight: 700, color: '#8B5E3C', marginTop: 4 }}>COMFORTABLE HOME MASSAGE</p>
                  </div>
                  <div className="text-right">
                    <div style={{ display: 'inline-block', padding: '4px 12px', background: '#8B5E3C', color: '#fff', fontSize: 10, fontWeight: 900, fontStyle: 'italic', borderRadius: 6, marginBottom: 8, letterSpacing: '0.1em' }}>INVOICE</div>
                    <div className="font-mono text-[10px] font-bold text-zinc-500">{invoiceNumber}</div>
                    <div className="text-[9px] font-medium text-zinc-400 mt-1">
                      {new Date(date + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                  </div>
                </div>

                {/* Bill To */}
                <div style={{ borderLeft: '3px solid #8B5E3C', paddingLeft: 16, marginBottom: 40 }}>
                  <p style={{ fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#8B5E3C', opacity: 0.7, marginBottom: 4 }}>Ditujukan Untuk:</p>
                  <h4 style={{ fontSize: 20, fontWeight: 800, color: '#27272a', letterSpacing: '-0.02em' }}>{customerName || 'Nama Pelanggan'}</h4>
                </div>

                {/* Items */}
                <div style={{ marginBottom: 40 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e4e4e7', paddingBottom: 10, marginBottom: 14, fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#a1a1aa' }}>
                    <span>Item &amp; Layanan</span><span>Harga</span>
                  </div>
                  {Object.values(
                    items.reduce((acc, item) => {
                      const key = item.parent_bundle_name || String(item.id);
                      if (!acc[key]) {
                        let parentDetails = item.details;
                        let parentDuration = item.duration;
                        if (item.parent_bundle_name) {
                          const parentSvc = services.find(s => s.name === item.parent_bundle_name);
                          if (parentSvc) {
                            parentDetails = parentSvc.details || '';
                            const dMatch = parentSvc.details?.match(/(\d+)\s*m(?:enit)?/i);
                            parentDuration = dMatch?.[1] ? `${dMatch[1]}m` : '';
                          } else {
                            parentDetails = '';
                            parentDuration = '';
                          }
                        }
                        acc[key] = { ...item, name: item.parent_bundle_name || item.name, price: 0, duration: parentDuration || '', details: parentDetails || '' };
                      }
                      acc[key].price += Number(item.price);
                      return acc;
                    }, {} as Record<string, Item>)
                  ).map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, paddingBottom: 12, borderBottom: '1px dashed #e4e4e7' }}>
                      <div>
                        <p style={{ fontWeight: 700, color: '#27272a', fontSize: 13, marginBottom: 2 }}>{item.name || 'Pilih Layanan...'}</p>
                        {item.details && <p style={{ fontSize: 9, color: '#71717a', lineHeight: 1.3, maxWidth: 260 }}>{item.details}</p>}
                      </div>
                      <p style={{ fontWeight: 700, fontSize: 13, color: '#3f3f46' }}>Rp {Number(item.price).toLocaleString('id-ID')}</p>
                    </div>
                  ))}

                  {totalTransportFee > 0 && (() => {
                    const tCount = transportEntries.filter(e => Number(e.fee) > 0 && e.therapist_id).length;
                    const suffix = tCount === 1 ? ' (1 Terapis)' : tCount > 1 ? ` (${tCount} Terapis)` : '';
                    return (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, padding: '10px 12px', background: 'rgba(139,94,60,0.06)', borderRadius: 8, border: '1px solid rgba(139,94,60,0.1)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Bus size={13} color="#8B5E3C" />
                          <p style={{ fontWeight: 600, color: '#8B5E3C', fontSize: 11, letterSpacing: '0.02em' }}>
                            {transportLabel}{suffix}
                          </p>
                        </div>
                        <p style={{ fontWeight: 700, color: '#8B5E3C', fontSize: 12 }}>Rp {totalTransportFee.toLocaleString('id-ID')}</p>
                      </div>
                    );
                  })()}

                  {/* Discount lines */}
                  <div style={{ marginTop: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: appliedDiscounts.length > 0 ? 6 : 10 }}>
                      <span>Subtotal</span><span>Rp {(grossTotal + totalTransportFee).toLocaleString('id-ID')}</span>
                    </div>
                    {appliedDiscounts.length > 0 && (
                      <div style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', color: '#059669', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Tag size={10} /> <span>Discount Applied</span>
                      </div>
                    )}
                    {appliedDiscounts.map(a => (
                      <div key={a.discountId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#059669', marginBottom: 6, paddingLeft: 14 }}>
                        <span>↳ {a.label} {a.value_type === 'percentage' ? `(${a.value}%)` : ''}</span>
                        <span style={{ fontWeight: 700 }}>-Rp {a.amount.toLocaleString('id-ID')}</span>
                      </div>
                    ))}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: '#8B5E3C', borderRadius: '12px 12px 12px 0', color: '#fff', marginTop: 14, boxShadow: '0 4px 12px rgba(139,94,60,0.2)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.3)' }}></div>
                        <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.9)' }}>Total Bayar</span>
                      </div>
                      <span style={{ fontSize: 20, fontWeight: 700, fontStyle: 'italic', letterSpacing: '0.02em' }}>Rp {finalTotal.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div style={{ textAlign: 'center', margin: '40px auto 0', borderTop: '1px solid #f4f4f5', paddingTop: 20, paddingBottom: 10 }}>
                  <p style={{ fontSize: 11.5, fontStyle: 'italic', fontFamily: 'Georgia, serif', color: '#8B5E3C', opacity: 0.8, marginBottom: 12 }}>"{invoiceFooter}"</p>

                  {/* Minimalist social details styled like Feed Studio */}
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14, fontSize: 9.5, fontWeight: 700, color: '#8B5E3C', letterSpacing: '0.05em', opacity: 0.8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <InstagramIcon size={11} />
                      <span style={{ textTransform: 'lowercase' }}>{(() => {
                        const parts = invoiceSocial.split('/').map(p => p.trim());
                        let instagram = parts[0]?.replace(/Instagram\s*&\s*Threads:\s*/i, '').trim() || '@serena.raga';
                        if (!instagram.startsWith('@') && instagram.length > 0) instagram = `@${instagram}`;
                        return instagram;
                      })()}</span>
                    </div>
                    <div style={{ width: 1, height: 10, background: 'rgba(139,94,60,0.25)' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Globe size={11} style={{ strokeWidth: 2.5 }} />
                      <span style={{ textTransform: 'lowercase' }}>{(() => {
                        const parts = invoiceSocial.split('/').map(p => p.trim());
                        return parts[1] || 'www.serenaraga.fit';
                      })()}</span>
                    </div>
                  </div>
                </div>

              </div> {/* End of Content Container */}
            </div> {/* end invoiceRef */}
          </div> {/* end minWidth:480 wrapper */}
        </div> {/* end overflow-x-auto */}
      </div> {/* end space-y-3 preview section */}
    </div>
  );
};

export default InvoiceMaker;
