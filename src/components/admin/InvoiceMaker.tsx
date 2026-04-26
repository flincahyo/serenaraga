'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { toPng } from 'html-to-image';
import {
  Download, Plus, Trash2, Loader2, Share2, Users, Percent,
  Tag, X, Check, Award, Hash, Bus
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useUser } from '@/lib/user-context';

type Item = { id: number | string; db_id?: string; therapist_id?: string; name: string; duration: string; price: number; details?: string; parent_bundle_name?: string };
type TransportEntry = { id: string; therapist_id: string; fee: number | ''; pct: number };
type Service = { id: string; name: string; price: number; details: string; category: string; is_bundle?: boolean; bundle_child_ids?: string[] };
type Booking = {
  id: string; customer_name: string; phone: string;
  service_name: string; booking_date: string; price: number; status: string;
};
type Discount = {
  id: string; name: string; type: string; value_type: string; value: number;
  min_orders: number | null; max_uses: number | null; uses_count: number;
  is_active: boolean; valid_from: string | null; valid_to: string | null;
  is_owner_borne?: boolean;
};
type AppliedDiscount = {
  discountId: string; label: string; value_type: string;
  value: number; amount: number; is_owner_borne: boolean; // Rp computed
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
const CATEGORY_LABELS: Record<string, string> = {
  packages: 'Paket Massage', services: 'Massage Services',
  reflexology: 'Refleksi', addons: 'Add-On', split_items: 'Internal Split Item'
};

// ──────────────────────────────────────────
// Discount helpers
// ──────────────────────────────────────────
function computeAmount(d: Discount, gross: number): number {
  if (d.value_type === 'percentage') return Math.round(gross * d.value / 100);
  return d.value;
}

function isDiscountValid(d: Discount): boolean {
  if (!d.is_active) return false;
  const today = new Date().toISOString().split('T')[0];
  if (d.valid_from && today < d.valid_from) return false;
  if (d.valid_to   && today > d.valid_to)   return false;
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
  const [customerName, setCustomerName]   = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [date, setDate]                   = useState('');
  const [items, setItems]                 = useState<Item[]>([{ id: 1, name: '', duration: '', price: 0 }]);
  const [services, setServices]           = useState<Service[]>([]);
  const [bookings, setBookings]           = useState<Booking[]>([]);
  const [generating, setGenerating]       = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState('');
  const [invoiceFooter, setInvoiceFooter] = useState('Terima kasih telah mempercayakan ketenangan raga Anda kepada kami.');
  const [invoiceSocial, setInvoiceSocial] = useState('Instagram & Threads: @serena.raga');
  const [commissionPct, setCommissionPct] = useState(30);
  const [completing, setCompleting]       = useState(false);
  const [transportEntries, setTransportEntries] = useState<TransportEntry[]>([{ id: '1', therapist_id: '', fee: '', pct: 100 }]);
  const [transportLabel, setTransportLabel] = useState('Biaya Transport Tambahan');
  // Pool of therapist IDs allowed in transport dropdown. Empty = all therapists (manual mode).
  const [transportTherapistPool, setTransportTherapistPool] = useState<string[]>([]);

  // Discount + customer state
  const [allDiscounts, setAllDiscounts]           = useState<Discount[]>([]);
  const [appliedDiscounts, setAppliedDiscounts]   = useState<AppliedDiscount[]>([]);
  const [customerRecord, setCustomerRecord]       = useState<Customer | null>(null);
  const [effectiveCount, setEffectiveCount]       = useState<number | null>(null);
  const [eligibleDiscounts, setEligibleDiscounts] = useState<Discount[]>([]);
  const [lookingUpCustomer, setLookingUpCustomer] = useState(false);
  const [addDiscountId, setAddDiscountId]         = useState('');
  const [customDiscountName, setCustomDiscountName] = useState('');
  const [customDiscountAmount, setCustomDiscountAmount] = useState('');
  const [therapists, setTherapists] = useState<{id: string; name: string; commission_pct: number}[]>([]);
  const [reEngageDays, setReEngageDays]           = useState(60);
  const [returningPromos, setReturningPromos]     = useState<Discount[]>([]); // suggested returning customer promos

  const supabase = createClient();

  const fetchAll = useCallback(async () => {
    const [{ data: svcData }, { data: bkgData }, { data: settingsData }, { data: discData }, { data: therapistData }] = await Promise.all([
      supabase.from('services').select('id,name,price,details,category,is_bundle,bundle_child_ids').order('category').order('sort_order'),
      supabase.from('bookings').select('id,customer_name,phone,service_name,booking_date,price,status')
        .in('status', ['Pending', 'Confirmed']).order('booking_date', { ascending: false }).limit(50),
    supabase.from('settings').select('key, value').in('key', ['invoice_footer_text', 'invoice_social_text', 'terapis_commission_pct', 're_engagement_days']),
      supabase.from('discounts').select('*').eq('is_active', true),
      supabase.from('therapists').select('id,name,commission_pct').eq('is_active', true).order('name'),
    ]);
    if (svcData) setServices(svcData);
    if (bkgData) setBookings(bkgData);
    if (discData) setAllDiscounts(discData);
    if (therapistData) setTherapists(therapistData);
    if (settingsData) {
      settingsData.forEach(({ key, value }) => {
        if (key === 'invoice_footer_text') setInvoiceFooter(value);
        if (key === 'invoice_social_text') setInvoiceSocial(value);
        if (key === 'terapis_commission_pct') setCommissionPct(Number(value) || 30);
        if (key === 're_engagement_days') setReEngageDays(Number(value) || 60);
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

  // Reset save guard whenever a new booking is selected
  useEffect(() => { hasSavedRef.current = false; }, [selectedBookingId]);

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
    const base  = cust?.visit_count_base ?? 0;
    const dbCnt = (completedB?.length ?? 0);
    const eff   = base + dbCnt;
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

    // For loyal: keep only the highest tier eligible
    const loyalEligible = eligible
      .filter(d => d.type === 'loyal')
      .sort((a, b) => (b.min_orders ?? 0) - (a.min_orders ?? 0))
      .slice(0, 1);
    const firstEligible = eligible.filter(d => d.type === 'first_customer');

    setEligibleDiscounts([...firstEligible, ...loyalEligible]);
    setLookingUpCustomer(false);
  }, [allDiscounts]);

  // Debounce phone lookup
  useEffect(() => {
    const t = setTimeout(() => { if (customerPhone) lookupCustomer(customerPhone); }, 600);
    return () => clearTimeout(t);
  }, [customerPhone, lookupCustomer]);

  // ── Booking select ──
  const onBookingSelect = async (bookingId: string) => {
    setSelectedBookingId(bookingId);
    if (!bookingId) {
      // Reset transport entries and pool when clearing booking selection
      setTransportEntries([{ id: Date.now().toString(), therapist_id: '', fee: '', pct: 100 }]);
      setTransportTherapistPool([]);
      return;
    }
    const bk = bookings.find(b => b.id === bookingId);
    if (!bk) return;
    setCustomerName(bk.customer_name);
    setCustomerPhone(bk.phone ?? '');
    if (bk.booking_date) setDate(bk.booking_date);

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
            newItems[idx] = { ...newItems[idx], name: children[0].name, price: children[0].price, details: children[0].details || '', parent_bundle_name: s.name };
            for (let i = 1; i < children.length; i++) {
              newItems.splice(idx + i, 0, {
                id: Date.now() + i,
                therapist_id: '',
                name: children[i].name,
                price: children[i].price,
                duration: '',
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

    const durationMatch = s.details?.match(/(\d+)\s*m(?:enit)?/i);
    setItems(p => p.map(i => i.id === itemId ? {
      ...i, name: s.name, price: s.price, duration: durationMatch?.[1] ? `${durationMatch[1]}m` : '', details: s.details, parent_bundle_name: ''
    } : i));
  };

  // ── Discount ops ──
  const grossTotal = items.reduce((s, i) => s + Number(i.price), 0);

  const toggleEligibleDiscount = (d: Discount) => {
    const already = appliedDiscounts.find(a => a.discountId === d.id);
    if (already) {
      setAppliedDiscounts(prev => prev.filter(a => a.discountId !== d.id));
    } else {
      setAppliedDiscounts(prev => [...prev, {
        discountId: d.id, label: d.name, value_type: d.value_type,
        value: d.value, amount: computeAmount(d, grossTotal),
        is_owner_borne: d.is_owner_borne ?? true,
      }]);
    }
  };

  const addManualDiscount = () => {
    if (!addDiscountId) return;
    const d = allDiscounts.find(x => x.id === addDiscountId);
    if (!d || appliedDiscounts.find(a => a.discountId === d.id)) return;
    setAppliedDiscounts(prev => [...prev, {
      discountId: d.id, label: d.name, value_type: d.value_type,
      value: d.value, amount: computeAmount(d, grossTotal),
      is_owner_borne: d.is_owner_borne ?? true,
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
    }]);
    setCustomDiscountName('');
    setCustomDiscountAmount('');
  };

  const removeApplied = (discountId: string) =>
    setAppliedDiscounts(prev => prev.filter(a => a.discountId !== discountId));

  const totalDiscount = appliedDiscounts.reduce((s, a) => s + a.amount, 0);
  const sharedDiscountAmount = appliedDiscounts.filter(a => !a.is_owner_borne).reduce((s, a) => s + a.amount, 0);

  // Transport: sum all entries
  const totalTransportFee = transportEntries.reduce((s, e) => s + Number(e.fee || 0), 0);
  
  const finalTotal    = Math.max(0, grossTotal - totalDiscount) + totalTransportFee;
  const terapisBase   = Math.max(0, grossTotal - sharedDiscountAmount);
  
  // Per-item commission: use each item's assigned therapist pct, fallback to global commissionPct
  const sharedDiscountPerGross = grossTotal > 0 ? sharedDiscountAmount / grossTotal : 0;
  const commissionServices = items.reduce((sum, item) => {
    const itemSharedDisc = item.price * sharedDiscountPerGross;
    const itemBase = Math.max(0, item.price - itemSharedDisc);
    let pct = commissionPct; // global fallback
    if (item.therapist_id) {
      const t = therapists.find(x => x.id === item.therapist_id);
      if (t) pct = t.commission_pct;
    }
    return sum + Math.round(itemBase * pct / 100);
  }, 0);
  // Transport commission: only if entry has a therapist assigned; no therapist → full goes to owner
  const commissionTransport = transportEntries.reduce((s, e) => {
    if (!e.therapist_id) return s;
    return s + Math.round(Number(e.fee || 0) * (e.pct / 100));
  }, 0);
  const commission    = commissionServices + commissionTransport;
  const ownerNet      = finalTotal - commission;

  // ── Tier badge helper ──
  const tierBadge = (): string | null => {
    if (effectiveCount === null) return null;
    if (effectiveCount === 0) return '✨ Pelanggan Baru';
    const loyal = allDiscounts
      .filter(d => d.type === 'loyal' && isDiscountValid(d) && d.min_orders !== null && effectiveCount >= d.min_orders)
      .sort((a, b) => (b.min_orders ?? 0) - (a.min_orders ?? 0))[0];
    return loyal ? `🏅 ${loyal.name}` : null;
  };

  const generateImage = async () => {
    if (!invoiceRef.current) return null;
    setGenerating(true);
    try {
      const dataUrl = await toPng(invoiceRef.current, { cacheBust: true, pixelRatio: 2 });
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      return { dataUrl, blob };
    } catch (e) { console.error(e); return null; }
    finally { setGenerating(false); }
  };

  // ── Save: complete booking + record discounts ──
  const completeAndSave = async () => {
    if (!selectedBookingId) return;
    // Audit #2 Bug #1: double-completion guard
    if (hasSavedRef.current) return;

    // Fix #15: verify current status from DB before proceeding
    const { data: currentBooking } = await supabase
      .from('bookings').select('status').eq('id', selectedBookingId).single();
    if (currentBooking?.status === 'Completed') {
      const confirmed = window.confirm(
        'Booking ini sudah berstatus COMPLETED.\n\nMelanjutkan akan menimpa data invoice, komisi, dan diskon yang telah tersimpan.\n\nYakin ingin mengubah data?'
      );
      if (!confirmed) return;
    }

    hasSavedRef.current = true;
    setCompleting(true);
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

    // 2. Update booking
    const displayName = items.map(i => i.name).join(' + ');
    await supabase.from('bookings').update({
      status: 'Completed',
      service_name: displayName,
      customer_id: customerId,
      discount_total: totalDiscount,
      final_price: finalTotal,
      price: grossTotal + totalTransportFee,
    }).eq('id', selectedBookingId);

    // 3. Update/insert booking_items per item
    const sharedDiscountPerGross = grossTotal > 0 ? sharedDiscountAmount / grossTotal : 0;
    for (const item of items) {
      const itemSharedDiscount = item.price * sharedDiscountPerGross;
      const itemTerapisBase = Math.max(0, item.price - itemSharedDiscount);
      let pct = commissionPct;
      if (item.therapist_id) {
        const t = therapists.find(x => x.id === item.therapist_id);
        if (t) pct = t.commission_pct;
      }
      const itemCommission = Math.round(itemTerapisBase * pct / 100);
      if (item.db_id) {
        // UPDATE existing item
        await supabase.from('booking_items').update({
          therapist_id: item.therapist_id || null,
          commission_earned: itemCommission
        }).eq('id', item.db_id);
      } else {
        // Audit #2 Bug #6: INSERT items that have no db_id yet
        await supabase.from('booking_items').insert({
          booking_id: selectedBookingId,
          service_name: item.name,
          price: item.price,
          therapist_id: item.therapist_id || null,
          commission_earned: itemCommission,
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
          discount_id: a.discountId.startsWith('custom_') ? null : a.discountId,
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
        const { data: fresh } = await supabase.from('discounts').select('uses_count').eq('id', a.discountId).single();
        await supabase.from('discounts')
          .update({ uses_count: (fresh?.uses_count ?? 0) + 1 })
          .eq('id', a.discountId);
      }
    }

    // Audit #2 Bug #5: refresh booking list so completed booking disappears from dropdown
    await fetchAll();
    setCompleting(false);
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
    isDiscountValid(d) && !appliedDiscounts.find(a => a.discountId === d.id)
  );

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 xl:gap-12">
      {/* ── FORM SECTION ── */}
      <div className="space-y-4 bg-white dark:bg-zinc-900 p-5 sm:p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800">

        {/* Pick from Booking */}
        <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4 border border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center gap-2 mb-3">
            <Users size={15} className="text-earth-primary" />
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Pilih dari Booking</label>
          </div>
          <select value={selectedBookingId} onChange={e => onBookingSelect(e.target.value)} className="admin-input text-xs">
            <option value="">-- Pilih booking untuk auto-isi --</option>
            {bookings.map(b => (
              <option key={b.id} value={b.id}>
                {b.customer_name} · {b.service_name} {b.booking_date ? `(${formatDate(b.booking_date)})` : ''} · {b.status}
              </option>
            ))}
          </select>
          {selectedBookingId && <p className="text-[10px] text-zinc-400 mt-2">Data terisi. Kamu tetap bisa edit dan tambah item di bawah.</p>}
        </div>

        {/* No + Date */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-zinc-500 mb-1.5 block">No. Invoice</label>
            <input type="text" value={invoiceNumber} readOnly className="admin-input font-mono text-xs opacity-60 cursor-not-allowed" />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-500 mb-1.5 block">Tanggal</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="admin-input" />
          </div>
        </div>

        {/* Customer */}
        <div>
          <label className="text-xs font-medium text-zinc-500 mb-1.5 block">Nama Pelanggan</label>
          <input type="text" placeholder="Ibu Rina" value={customerName} onChange={e => setCustomerName(e.target.value)} className="admin-input" />
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-500 mb-1.5 block">No. WhatsApp</label>
          <div className="relative">
            <input type="tel" placeholder="628xxx" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="admin-input pr-8" />
            {lookingUpCustomer && <Loader2 size={13} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-zinc-400" />}
          </div>
        </div>

        {/* Customer info card */}
        {effectiveCount !== null && (
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/40 p-3.5 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                <Hash size={11} /> Kunjungan ke-{effectiveCount + 1}
              </span>
              {tierBadge() && (
                <span className="text-[11px] font-medium text-earth-primary flex items-center gap-1">
                  <Award size={11} /> {tierBadge()}
                </span>
              )}
            </div>

            {/* Eligible discounts */}
            {eligibleDiscounts.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[11px] font-medium text-zinc-500">Diskon tersedia:</p>
                {eligibleDiscounts.map(d => {
                  const applied = !!appliedDiscounts.find(a => a.discountId === d.id);
                  const amt = computeAmount(d, grossTotal);
                  return (
                    <label key={d.id} className="flex items-center gap-2.5 cursor-pointer group">
                      <input type="checkbox" checked={applied} onChange={() => toggleEligibleDiscount(d)}
                        className="accent-earth-primary w-4 h-4" />
                      <span className="text-xs text-zinc-700 dark:text-zinc-300 flex-1">
                        {d.name} — {d.value_type === 'percentage' ? `${d.value}%` : formatRp(d.value)}
                      </span>
                      <span className={`text-xs font-mono font-semibold ${applied ? 'text-earth-primary' : 'text-zinc-400'}`}>
                        -{formatRp(amt)}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}

            {/* 🔄 Returning Customer Promo Suggestion */}
            {returningPromos.length > 0 && (
              <div className="rounded-lg border border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-950/20 p-3 space-y-2">
                <p className="text-[11px] font-bold text-orange-600 dark:text-orange-400 flex items-center gap-1.5">
                  🔄 Pelanggan Returning — Promo Tersedia
                </p>
                {returningPromos.map(d => {
                  const applied = !!appliedDiscounts.find(a => a.discountId === d.id);
                  return (
                    <label key={d.id} className="flex items-center gap-2.5 cursor-pointer">
                      <input type="checkbox" checked={applied} onChange={() => toggleEligibleDiscount(d)}
                        className="accent-orange-500 w-4 h-4" />
                      <span className="text-xs text-orange-700 dark:text-orange-300 flex-1">
                        {d.name} — {d.value_type === 'percentage' ? `${d.value}%` : formatRp(d.value)}
                      </span>
                      <span className={`text-xs font-mono font-semibold ${applied ? 'text-orange-500' : 'text-orange-300'}`}>
                        -{formatRp(computeAmount(d, grossTotal))}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}

            {/* Applied discounts list */}
            {appliedDiscounts.length > 0 && (
              <div className="space-y-1">
                {appliedDiscounts
                  .filter(a => !eligibleDiscounts.find(e => e.id === a.discountId))
                  .map(a => (
                    <div key={a.discountId} className="flex items-center gap-2 text-xs">
                      <Tag size={11} className="text-earth-primary shrink-0" />
                      <span className="flex-1 text-zinc-700 dark:text-zinc-300">{a.label}</span>
                      <span className="font-mono font-semibold text-earth-primary">-{formatRp(a.amount)}</span>
                      <button onClick={() => removeApplied(a.discountId)} className="text-zinc-400 hover:text-red-500 p-0.5">
                        <X size={12} />
                      </button>
                    </div>
                  ))}
              </div>
            )}

            {/* Add manual discount */}
            <div className="flex gap-2">
              <select value={addDiscountId} onChange={e => setAddDiscountId(e.target.value)}
                className="admin-input text-xs flex-1">
                <option value="">+ Tambah diskon lain...</option>
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
                  <Check size={13} />
                </button>
              )}
            </div>

            {/* Custom Manual Discount */}
            <div className="pt-2 mt-2 border-t border-zinc-200 dark:border-zinc-700/50">
              <p className="text-[10px] font-medium text-zinc-500 mb-1.5">+ Custom Diskon (manual/kasus khusus)</p>
              <div className="flex gap-2">
                <input placeholder="Nama/Detail diskon..." value={customDiscountName} onChange={e => setCustomDiscountName(e.target.value)} className="admin-input text-xs flex-[2]" />
                <input type="number" placeholder="Rp potongan..." value={customDiscountAmount} onChange={e => setCustomDiscountAmount(e.target.value)} className="admin-input text-xs flex-[1] font-mono" />
                <button onClick={addCustomDiscount} disabled={!customDiscountName || !customDiscountAmount} className="admin-btn-primary py-1.5 px-3 shrink-0 disabled:opacity-50">
                  <Check size={13} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Items */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-medium text-zinc-500">Daftar Layanan</label>
            <button onClick={addItem} className="text-xs text-earth-primary font-semibold hover:underline">+ Tambah Item</button>
          </div>
          <div className="space-y-3">
            {items.map(item => (
              <div key={item.id} className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-3 space-y-2 border border-zinc-200 dark:border-zinc-700">
                <select value={item.name} onChange={e => onServiceSelect(item.id, e.target.value)} className="admin-input text-xs">
                  <option value="">-- Pilih dari pricelist (opsional) --</option>
                  {['packages', 'services', 'reflexology', 'addons', 'split_items'].map(cat => (
                    <optgroup key={cat} label={CATEGORY_LABELS[cat]}>
                      {services.filter(s => s.category === cat).map(s => (
                        <option key={s.id} value={s.name}>{s.name} — Rp {s.price.toLocaleString('id-ID')}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <div className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5">
                    <input placeholder="Nama layanan" value={item.name} onChange={e => updateItem(item.id, 'name', e.target.value)} className="admin-input text-xs w-full" />
                  </div>
                  <div className="col-span-3">
                    <input placeholder="Durasi" value={item.duration} onChange={e => updateItem(item.id, 'duration', e.target.value)} className="admin-input text-xs w-full text-center" />
                  </div>
                  <div className="col-span-3">
                    <input type="number" placeholder="Harga" value={item.price || ''} onChange={e => updateItem(item.id, 'price', Number(e.target.value))} className="admin-input text-xs w-full text-right font-mono" />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-500 p-1"><Trash2 size={14} /></button>
                  </div>
                </div>
                <div className="mt-2">
                  <select className="admin-input text-xs bg-white dark:bg-zinc-900 border-dashed" value={item.therapist_id || ''} onChange={e => updateItem(item.id, 'therapist_id', e.target.value)}>
                    <option value="">-- Assign Terapis (opsional) --</option>
                    {therapists.map(t => <option key={t.id} value={t.id}>{t.name} {isOwner ? `(Fee ${t.commission_pct}%)` : ''}</option>)}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Transport Fee — per terapis */}
        <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4 border border-zinc-200 dark:border-zinc-700 space-y-2.5">
          <div className="flex items-center justify-between">
            <input type="text" value={transportLabel} onChange={e => setTransportLabel(e.target.value)}
              className="bg-transparent text-xs font-semibold text-zinc-600 dark:text-zinc-300 outline-none border-b border-dashed border-zinc-300 dark:border-zinc-600 hover:border-earth-primary focus:border-earth-primary w-fit pb-0.5" />
            {totalTransportFee > 0 && (
              <span className="text-[10px] text-earth-primary font-mono font-semibold">
                Total: Rp {totalTransportFee.toLocaleString('id-ID')}
              </span>
            )}
          </div>
          <div className="space-y-2">
            {transportEntries.map((entry) => {
              // Therapists available in pool (booking-filtered or all)
              const poolTherapists = transportTherapistPool.length > 0
                ? therapists.filter(t => transportTherapistPool.includes(t.id))
                : therapists;
              // Exclude therapists already selected in OTHER entries (prevent duplicates)
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
                  <option value="">→ Ke Owner</option>
                  {availableTherapists.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  {/* Show current value even if not in pool (e.g. re-loaded from DB) */}
                  {entry.therapist_id && !availableTherapists.find(t => t.id === entry.therapist_id) && (() => {
                    const t = therapists.find(x => x.id === entry.therapist_id);
                    return t ? <option key={t.id} value={t.id}>{t.name}</option> : null;
                  })()}
                </select>
                <input
                  type="number" placeholder="Nominal"
                  value={entry.fee}
                  onChange={e => setTransportEntries(prev => prev.map(te => te.id === entry.id ? { ...te, fee: e.target.value === '' ? '' : Number(e.target.value) } : te))}
                  className="admin-input text-xs font-mono w-[110px] text-right"
                />
                {isOwner && entry.therapist_id && (
                  <div className="flex items-center gap-0.5 bg-white dark:bg-zinc-900 px-2 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 shrink-0">
                    <input
                      type="number" max={100} min={0} value={entry.pct}
                      onChange={e => setTransportEntries(prev => prev.map(te => te.id === entry.id ? { ...te, pct: Number(e.target.value) } : te))}
                      className="bg-transparent text-end font-mono text-xs font-bold text-earth-primary w-[35px] outline-none"
                    />
                    <span className="text-[10px] text-zinc-400 font-bold">%</span>
                  </div>
                )}
                {transportEntries.length > 1 && (
                  <button
                    onClick={() => setTransportEntries(prev => prev.filter(te => te.id !== entry.id))}
                    className="text-red-400 hover:text-red-500 p-1 shrink-0"
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
            className="text-xs text-earth-primary font-semibold hover:underline flex items-center gap-1"
          >
            <Plus size={12} /> Tambah Transport Lain
          </button>
        </div>

        {/* Summary + Commission breakdown */}
        <div className="rounded-xl bg-earth-primary/5 dark:bg-earth-primary/10 p-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">Subtotal</span>
            <span className="text-base font-bold text-zinc-700 dark:text-zinc-300 font-mono">{formatRp(grossTotal)}</span>
          </div>
          {appliedDiscounts.map(a => (
            <div key={a.discountId} className="flex justify-between items-center text-sm">
              <span className="text-xs text-zinc-500 flex items-center gap-1"><Tag size={10} /> {a.label}</span>
              <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold">-{formatRp(a.amount)}</span>
            </div>
          ))}
          {totalDiscount > 0 && (
            <div className="flex justify-between items-center pt-1 border-t border-earth-primary/10">
              <span className="text-sm font-bold text-zinc-700 dark:text-zinc-200">Total Bayar</span>
              <span className="text-lg font-bold text-earth-primary font-mono">{formatRp(finalTotal)}</span>
            </div>
          )}
          {!totalDiscount && (
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">Total Invoice</span>
              <span className="text-lg font-bold text-earth-primary font-mono">{formatRp(finalTotal)}</span>
            </div>
          )}
          {isOwner && commission > 0 && finalTotal > 0 && (
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-earth-primary/10">
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                <span className="flex items-center gap-1"><Percent size={11} className="text-amber-500" /> Terapis ({items.some(i => i.therapist_id && therapists.find(t => t.id === i.therapist_id)) ? 'per terapis' : `${commissionPct}%`}{totalTransportFee > 0 ? ' + Transport' : ''})</span>
                <span className="font-mono font-semibold text-amber-600 dark:text-amber-400">{formatRp(commission)}</span>
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 text-right">
                <span>Pemilik (Net)</span>
                <p className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">{formatRp(ownerNet)}</p>
              </div>
            </div>
          )}
        </div>

        {/* ── STICKY FOOTER (Summary & Actions) ── */}
        <div className="sticky bottom-4 z-20 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl p-4 sm:p-5 rounded-2xl shadow-[0_-10px_30px_-5px_rgba(0,0,0,0.05)] dark:shadow-none border border-zinc-200 dark:border-zinc-700/50 space-y-3">
          
          {/* Action Buttons */}
          <div className="flex gap-3">
            <button onClick={shareToWhatsApp} disabled={generating || completing}
              className="admin-btn-primary flex-1 justify-center py-3.5 disabled:opacity-60 shadow-lg shadow-earth-primary/20">
              {generating || completing ? <Loader2 size={15} className="animate-spin" /> : <Share2 size={15} />}
              {selectedBookingId ? 'Selesaikan & Kirim WA' : 'Kirim WA'}
            </button>
            <button onClick={downloadInvoice} disabled={generating || completing}
              className="admin-btn-ghost px-4 py-3.5 disabled:opacity-60 bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700" title="Download PNG">
              <Download size={15} />
            </button>
          </div>

          <div className="flex items-center justify-between px-2">
            <div>
              <p className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase">Total Tagihan</p>
              <p className="text-xl font-bold text-earth-primary font-mono leading-none">{formatRp(finalTotal)}</p>
            </div>
            
            <div className="text-right">
               {selectedBookingId && (
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mb-0.5">Booking → Completed</p>
               )}
               {isOwner && commissionPct > 0 && finalTotal > 0 && (
                 <p className="text-[10px] text-zinc-500 font-medium">Net Pemilik: <span className="font-mono text-zinc-700 dark:text-zinc-300 font-bold">{formatRp(ownerNet)}</span></p>
               )}
            </div>
          </div>
        </div>
      </div>

      {/* ── PREVIEW SECTION ── */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest px-1">Preview Invoice</h3>
        <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-lg">
          <div ref={invoiceRef} className="bg-[#FDFBF7] text-zinc-900 font-sans relative overflow-hidden" style={{ width: 480, minHeight: 680 }}>
            {/* Top Accent Strip */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-[#8B5E3C]" />
            
            {/* Watermark Logo */}
            <div className="absolute inset-0 z-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none -translate-y-24">
              <img src="/serenalogo2.svg" alt="watermark" className="w-[120%] h-auto max-w-none grayscale -rotate-[15deg] mix-blend-multiply" />
            </div>

            {/* Content Container */}
            <div className="relative z-10 p-10 mt-2">
            
            {/* Header */}
            <div className="flex justify-between items-start mb-12">
              <div>
                <div className="relative flex items-center justify-start h-[56px] w-[220px] overflow-hidden -ml-2 mb-1">
                  <img 
                    src="/serenalogo2.svg" 
                    alt="SerenaRaga" 
                    className="absolute h-[260px] w-auto max-w-none object-contain -ml-6" 
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
            <div style={{ textAlign: 'center', margin: '40px auto 0', borderTop: '1px solid #f4f4f5', paddingTop: 24, paddingBottom: 10 }}>
              <p style={{ fontSize: 11.5, fontStyle: 'italic', fontFamily: 'Georgia, serif', color: '#8B5E3C', opacity: 0.8, marginBottom: 16, whiteSpace: 'nowrap' }}>"{invoiceFooter}"</p>
              <div style={{ display: 'inline-block', background: 'rgba(139,94,60,0.06)', padding: '8px 16px', borderRadius: 100, border: '1px solid rgba(139,94,60,0.1)' }}>
                <p style={{ fontSize: 9, fontWeight: 700, color: '#a1a1aa', letterSpacing: '0.15em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  {invoiceSocial}
                </p>
              </div>
            </div>
            
            </div> {/* End of Content Container */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceMaker;
