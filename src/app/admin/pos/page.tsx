'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { toPng } from 'html-to-image';
import {
  ShoppingCart, Trash2, Plus, Minus, User, Phone, Download,
  Share2, ChevronRight, X, Check, Loader2, Tag, Search,
  Sparkles, Receipt,
} from 'lucide-react';
import { createClient } from '@/lib/supabase';

// ─── Types ───────────────────────────────────────────────────────────────────
type Service = {
  id: string; name: string; price: number; details: string;
  category: string; is_bundle?: boolean; bundle_child_ids?: string[];
};
type CartItem = {
  key: string; service_id: string; name: string; price: number;
  details: string; qty: number; therapist_id?: string; parent_bundle_name?: string;
};
type Therapist = { id: string; name: string; commission_pct: number };
type Discount = {
  id: string; name: string; type: string; value_type: string; value: number;
  min_orders: number | null; is_active: boolean; valid_from: string | null; valid_to: string | null;
  is_owner_borne?: boolean;
};
type Customer = { id: string; wa_number: string; name: string | null; visit_count_base: number };

const CATEGORY_LABELS: Record<string, string> = {
  packages: 'Paket', services: 'Layanan', reflexology: 'Refleksi', addons: 'Add-On',
};
const CATEGORY_COLORS: Record<string, string> = {
  packages: 'bg-earth-primary/10 text-earth-primary border-earth-primary/20',
  services: 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800',
  reflexology: 'bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-950/30 dark:border-purple-800',
  addons: 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800',
};
const formatRp = (n: number) => `Rp ${Number(n).toLocaleString('id-ID')}`;
const pad = (n: number) => String(n).padStart(3, '0');
const genInvoiceNo = () => {
  const now = new Date();
  return `SR-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}-${pad(Math.floor(Math.random()*900)+100)}`;
};

// ─── Main POS Component ──────────────────────────────────────────────────────
export default function POSPage() {
  const invoiceRef           = useRef<HTMLDivElement>(null);
  const [invoiceNumber]      = useState(genInvoiceNo);
  const [services, setServices]     = useState<Service[]>([]);
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [discounts, setDiscounts]   = useState<Discount[]>([]);
  const [cart, setCart]             = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [date, setDate]             = useState(new Date().toISOString().split('T')[0]);
  const [invoiceFooter, setInvoiceFooter] = useState('Terima kasih telah mempercayakan ketenangan raga Anda kepada kami.');
  const [invoiceSocial, setInvoiceSocial] = useState('Instagram & Threads: @serena.raga');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [search, setSearch]         = useState('');
  const [customer, setCustomer]     = useState<Customer | null>(null);
  const [visitCount, setVisitCount] = useState<number>(0);
  const [autoDiscount, setAutoDiscount] = useState<Discount | null>(null);
  const [showCart, setShowCart]     = useState(false); // mobile cart toggle
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);
  const [lookingUp, setLookingUp]   = useState(false);

  const supabase = createClient();

  // ── Fetch data ──
  const fetchAll = useCallback(async () => {
    const [{ data: svcData }, { data: therapistData }, { data: discData }, { data: settingsData }] = await Promise.all([
      supabase.from('services')
        .select('id,name,price,details,category,is_bundle,bundle_child_ids')
        .neq('category', 'split_items').order('category').order('sort_order'),
      supabase.from('therapists').select('id,name,commission_pct').eq('is_active', true).order('name'),
      supabase.from('discounts').select('*').eq('is_active', true),
      supabase.from('settings').select('key, value').in('key', ['invoice_footer_text','invoice_social_text']),
    ]);
    if (svcData)      setServices(svcData);
    if (therapistData) setTherapists(therapistData);
    if (discData)     setDiscounts(discData);
    if (settingsData) settingsData.forEach(({ key, value }) => {
      if (key === 'invoice_footer_text') setInvoiceFooter(value);
      if (key === 'invoice_social_text') setInvoiceSocial(value);
    });
  }, []);
  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Customer lookup ──
  useEffect(() => {
    const phone = customerPhone.replace(/\D/g, '');
    if (phone.length < 6) { setCustomer(null); setVisitCount(0); setAutoDiscount(null); return; }
    const t = setTimeout(async () => {
      setLookingUp(true);
      const { data: cust } = await supabase.from('customers').select('*').eq('wa_number', phone).single();
      if (cust) {
        setCustomer(cust);
        const { count } = await supabase.from('bookings')
          .select('*', { count: 'exact', head: true }).eq('status', 'Completed').eq('phone', phone);
        const totalVisits = (cust.visit_count_base ?? 0) + (count ?? 0);
        setVisitCount(totalVisits);

        // Auto-apply loyalty discount
        const today = new Date().toISOString().split('T')[0];
        const eligible = discounts.filter(d =>
          d.is_active && d.type === 'loyalty' &&
          (!d.valid_from || today >= d.valid_from) && (!d.valid_to || today <= d.valid_to) &&
          (d.min_orders === null || totalVisits >= d.min_orders)
        ).sort((a, b) => (b.min_orders ?? 0) - (a.min_orders ?? 0));
        setAutoDiscount(eligible[0] ?? null);
      } else {
        setCustomer(null); setVisitCount(0); setAutoDiscount(null);
      }
      setLookingUp(false);
    }, 600);
    return () => clearTimeout(t);
  }, [customerPhone, discounts]);

  // ── Cart helpers ──
  const addToCart = (svc: Service) => {
    if (svc.is_bundle && svc.bundle_child_ids?.length) {
      // Bundle: explode ke child services
      const children = services.filter(s => svc.bundle_child_ids!.includes(s.id));
      if (children.length) {
        const newItems: CartItem[] = children.map((child, i) => ({
          key: `${Date.now()}-${i}`,
          service_id: child.id,
          name: child.name,
          price: child.price,
          details: child.details,
          qty: 1,
          parent_bundle_name: svc.name,
        }));
        setCart(prev => [...prev, ...newItems]);
        setShowCart(true);
        return;
      }
    }
    setCart(prev => {
      const existing = prev.find(c => c.service_id === svc.id && !c.parent_bundle_name);
      if (existing) {
        return prev.map(c => c.key === existing.key ? { ...c, qty: c.qty + 1 } : c);
      }
      return [...prev, { key: `${Date.now()}`, service_id: svc.id, name: svc.name, price: svc.price, details: svc.details, qty: 1 }];
    });
    setShowCart(true);
  };

  const removeFromCart = (key: string) => setCart(prev => prev.filter(c => c.key !== key));

  const updateTherapist = (key: string, therapist_id: string) =>
    setCart(prev => prev.map(c => c.key === key ? { ...c, therapist_id } : c));

  // ── Totals ──
  const subtotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const discountAmount = autoDiscount
    ? autoDiscount.value_type === 'percentage'
      ? Math.round(subtotal * autoDiscount.value / 100)
      : autoDiscount.value
    : 0;
  const total = Math.max(0, subtotal - discountAmount);

  // ── Filtered services ──
  const categories = ['all', ...Array.from(new Set(services.map(s => s.category)))];
  const filtered = services.filter(s => {
    const matchCat = activeCategory === 'all' || s.category === activeCategory;
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  // ── Save booking ──
  const saveBooking = async () => {
    if (!customerName || cart.length === 0) return;
    setSaving(true);
    const serviceName = cart.length === 1 ? cart[0].name
      : cart.filter(c => !c.parent_bundle_name).map(c => c.name).join(' + ')
        || [...new Set(cart.map(c => c.parent_bundle_name ?? c.name))].join(' + ');

    // Save booking
    const { data: booking } = await supabase.from('bookings').insert({
      customer_name: customerName,
      phone: customerPhone.replace(/\D/g, ''),
      service_name: serviceName,
      booking_date: date,
      price: subtotal,
      final_price: total,
      discount_total: discountAmount,
      status: 'Confirmed',
      notes: '',
    }).select().single();

    if (booking) {
      // Save booking_items
      for (const item of cart) {
        await supabase.from('booking_items').insert({
          booking_id: booking.id,
          service_name: item.name,
          price: item.price,
          therapist_id: item.therapist_id || null,
          parent_bundle_name: item.parent_bundle_name || null,
        });
      }
      // Upsert customer
      const phone = customerPhone.replace(/\D/g, '');
      if (phone) {
        await supabase.from('customers').upsert({ wa_number: phone, name: customerName }, { onConflict: 'wa_number' });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  };

  // ── Generate invoice image ──
  const generateInvoice = async () => {
    if (!invoiceRef.current) return;
    setGenerating(true);
    try {
      const uri = await toPng(invoiceRef.current, { quality: 0.95, pixelRatio: 2 });
      const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
      if (isMobile && navigator.share) {
        const blob = await (await fetch(uri)).blob();
        await navigator.share({ files: [new File([blob], `invoice-${invoiceNumber}.png`, { type: 'image/png' })], title: 'Invoice SerenaRaga' });
      } else {
        const link = document.createElement('a');
        link.download = `invoice-${invoiceNumber}.png`;
        link.href = uri;
        link.click();
        if (customerPhone) {
          const phone = customerPhone.replace(/\D/g, '');
          window.open(`https://wa.me/${phone}`, '_blank');
        }
      }
    } catch (err) { console.error(err); }
    setGenerating(false);
  };

  // ── Invoice preview items (group bundles) ──
  const invoiceItems = Object.values(
    cart.reduce((acc, item) => {
      const key = item.parent_bundle_name || item.key;
      if (!acc[key]) {
        let name = item.parent_bundle_name || item.name;
        let details = item.details;
        if (item.parent_bundle_name) {
          const parentSvc = services.find(s => s.name === item.parent_bundle_name);
          details = parentSvc?.details || '';
        }
        acc[key] = { name, details, price: 0, qty: 1 };
      }
      acc[key].price += item.price * item.qty;
      return acc;
    }, {} as Record<string, { name: string; details: string; price: number; qty: number }>)
  );

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)] lg:h-[calc(100vh-0px)] gap-0 -m-4 md:-m-8">

      {/* ── LEFT: Service Grid ── */}
      <div className="flex-1 flex flex-col bg-zinc-50 dark:bg-zinc-900 overflow-hidden">

        {/* Header */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Cari layanan..." className="admin-input pl-9"
              />
            </div>
            {/* Mobile cart toggle */}
            <button
              onClick={() => setShowCart(!showCart)}
              className="lg:hidden relative p-2.5 rounded-xl bg-earth-primary text-white"
            >
              <ShoppingCart size={18} />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center">
                  {cart.reduce((s,c) => s+c.qty, 0)}
                </span>
              )}
            </button>
          </div>

          {/* Category pills */}
          <div className="flex gap-1.5 mt-3 overflow-x-auto pb-1 scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  activeCategory === cat
                    ? 'bg-earth-primary text-white border-earth-primary'
                    : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-earth-primary/40'
                }`}
              >
                {cat === 'all' ? '✦ Semua' : (CATEGORY_LABELS[cat] ?? cat)}
              </button>
            ))}
          </div>
        </div>

        {/* Service Cards Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtered.map(svc => (
              <button
                key={svc.id}
                onClick={() => addToCart(svc)}
                className="group text-left bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-4 hover:border-earth-primary/50 hover:shadow-md transition-all duration-200 active:scale-[0.97]"
              >
                {/* Category badge */}
                <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border mb-3 ${CATEGORY_COLORS[svc.category] ?? 'bg-zinc-100 text-zinc-500 border-zinc-200'}`}>
                  {CATEGORY_LABELS[svc.category] ?? svc.category}
                  {svc.is_bundle && <Sparkles size={8} className="ml-1" />}
                </div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-white leading-snug mb-1 group-hover:text-earth-primary transition-colors">{svc.name}</p>
                {svc.details && <p className="text-[10px] text-zinc-400 line-clamp-2 mb-3">{svc.details}</p>}
                <div className="flex items-center justify-between mt-auto">
                  <p className="text-sm font-bold text-earth-primary">{formatRp(svc.price)}</p>
                  <div className="w-7 h-7 rounded-full bg-earth-primary/10 group-hover:bg-earth-primary flex items-center justify-center transition-colors">
                    <Plus size={14} className="text-earth-primary group-hover:text-white transition-colors" />
                  </div>
                </div>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full text-center py-16 text-zinc-400">
                <ShoppingCart size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Tidak ada layanan ditemukan</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── RIGHT: Cart & Checkout ── */}
      <div className={`
        fixed inset-0 z-50 lg:static lg:z-auto lg:flex
        flex-col bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800
        lg:w-96 xl:w-[420px]
        transition-transform duration-300
        ${showCart ? 'flex' : 'hidden lg:flex'}
      `}>
        {/* Cart Header */}
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart size={16} className="text-earth-primary" />
            <h2 className="text-sm font-semibold dark:text-white">
              Pesanan {cart.length > 0 ? `(${cart.reduce((s,c)=>s+c.qty,0)} item)` : ''}
            </h2>
          </div>
          <button onClick={() => setShowCart(false)} className="lg:hidden p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Customer Info */}
          <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 space-y-2.5">
            <div>
              <label className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider block mb-1">Nama Pelanggan</label>
              <div className="relative">
                <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input value={customerName} onChange={e => setCustomerName(e.target.value)}
                  placeholder="Nama pelanggan..." className="admin-input pl-9 text-sm" />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider block mb-1">Nomor WhatsApp</label>
              <div className="relative">
                <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                {lookingUp && <Loader2 size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 animate-spin" />}
                <input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)}
                  placeholder="08xx..." className="admin-input pl-9 text-sm" type="tel" />
              </div>
              {customer && (
                <div className="mt-1.5 flex items-center gap-2 px-2 py-1.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
                  <Check size={12} className="text-emerald-500 shrink-0" />
                  <span className="text-xs text-emerald-700 dark:text-emerald-400">
                    Pelanggan lama · {visitCount} kunjungan
                  </span>
                </div>
              )}
            </div>
            <div>
              <label className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider block mb-1">Tanggal</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="admin-input text-sm" />
            </div>
          </div>

          {/* Cart Items */}
          <div className="p-4 space-y-3">
            {cart.length === 0 ? (
              <div className="text-center py-10">
                <ShoppingCart size={32} className="mx-auto mb-2 text-zinc-200 dark:text-zinc-700" />
                <p className="text-xs text-zinc-400">Tap layanan untuk menambahkan</p>
              </div>
            ) : (
              <>
                {/* Group by bundle */}
                {(() => {
                  const bundles = new Set(cart.filter(c => c.parent_bundle_name).map(c => c.parent_bundle_name!));
                  const standalone = cart.filter(c => !c.parent_bundle_name);
                  return (
                    <>
                      {/* Bundle groups */}
                      {[...bundles].map(bundleName => {
                        const children = cart.filter(c => c.parent_bundle_name === bundleName);
                        return (
                          <div key={bundleName} className="rounded-xl border border-earth-primary/30 bg-earth-primary/5 overflow-hidden">
                            <div className="flex items-center justify-between px-3 py-2 border-b border-earth-primary/20">
                              <div className="flex items-center gap-2">
                                <Sparkles size={12} className="text-earth-primary" />
                                <span className="text-xs font-semibold text-earth-primary">{bundleName}</span>
                              </div>
                              <button onClick={() => setCart(prev => prev.filter(c => c.parent_bundle_name !== bundleName))}
                                className="p-1 text-zinc-400 hover:text-red-500">
                                <X size={13} />
                              </button>
                            </div>
                            {children.map(item => (
                              <div key={item.key} className="px-3 py-2 border-t border-earth-primary/10 first:border-0">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-zinc-600 dark:text-zinc-400">{item.name}</span>
                                  <span className="text-xs font-semibold text-earth-primary">{formatRp(item.price)}</span>
                                </div>
                                {therapists.length > 0 && (
                                  <select value={item.therapist_id ?? ''}
                                    onChange={e => updateTherapist(item.key, e.target.value)}
                                    className="mt-1.5 w-full text-[10px] bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1 text-zinc-500">
                                    <option value="">— Pilih Terapis —</option>
                                    {therapists.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                  </select>
                                )}
                              </div>
                            ))}
                          </div>
                        );
                      })}

                      {/* Standalone items */}
                      {standalone.map(item => (
                        <div key={item.key} className="rounded-xl border border-zinc-200 dark:border-zinc-700 p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">{item.name}</p>
                              <p className="text-xs text-earth-primary font-semibold mt-0.5">{formatRp(item.price * item.qty)}</p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button onClick={() => setCart(prev => prev.map(c => c.key === item.key && c.qty > 1 ? {...c, qty: c.qty - 1} : c))}
                                className="w-6 h-6 rounded-full border border-zinc-200 dark:border-zinc-600 flex items-center justify-center text-zinc-500 hover:border-earth-primary hover:text-earth-primary">
                                <Minus size={10} />
                              </button>
                              <span className="text-xs font-bold w-5 text-center">{item.qty}</span>
                              <button onClick={() => setCart(prev => prev.map(c => c.key === item.key ? {...c, qty: c.qty + 1} : c))}
                                className="w-6 h-6 rounded-full border border-zinc-200 dark:border-zinc-600 flex items-center justify-center text-zinc-500 hover:border-earth-primary hover:text-earth-primary">
                                <Plus size={10} />
                              </button>
                              <button onClick={() => removeFromCart(item.key)}
                                className="w-6 h-6 ml-1 flex items-center justify-center text-zinc-300 hover:text-red-500 transition-colors">
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                          {therapists.length > 0 && (
                            <select value={item.therapist_id ?? ''} onChange={e => updateTherapist(item.key, e.target.value)}
                              className="mt-2 w-full text-[10px] bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1.5 text-zinc-500">
                              <option value="">— Pilih Terapis —</option>
                              {therapists.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                          )}
                        </div>
                      ))}
                    </>
                  );
                })()}
              </>
            )}
          </div>
        </div>

        {/* ── Order Summary & Checkout ── */}
        {cart.length > 0 && (
          <div className="border-t border-zinc-100 dark:border-zinc-800 p-4 space-y-3">
            {/* Loyalty discount badge */}
            {autoDiscount && (
              <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
                <Tag size={12} className="text-amber-500 shrink-0" />
                <span className="text-xs text-amber-700 dark:text-amber-400 flex-1">
                  Diskon {autoDiscount.name}
                </span>
                <span className="text-xs font-bold text-amber-600">-{formatRp(discountAmount)}</span>
              </div>
            )}

            {/* Total */}
            <div className="flex items-center justify-between">
              {discountAmount > 0 && (
                <span className="text-xs text-zinc-400 line-through">{formatRp(subtotal)}</span>
              )}
              <div className="ml-auto text-right">
                <p className="text-xs text-zinc-400">Total</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-white">{formatRp(total)}</p>
              </div>
            </div>

            {/* Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={saveBooking}
                disabled={saving || !customerName || cart.length === 0}
                className="flex items-center justify-center gap-1.5 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 font-semibold text-sm hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 size={15} className="animate-spin" /> : saved ? <Check size={15} className="text-emerald-500" /> : <ChevronRight size={15} />}
                {saved ? 'Tersimpan!' : 'Simpan'}
              </button>
              <button
                onClick={generateInvoice}
                disabled={generating || !customerName || cart.length === 0}
                className="flex items-center justify-center gap-1.5 py-3 rounded-xl bg-earth-primary text-white font-semibold text-sm hover:bg-earth-dark transition-colors disabled:opacity-50"
              >
                {generating ? <Loader2 size={15} className="animate-spin" /> : <Receipt size={15} />}
                Invoice
              </button>
            </div>
            <button onClick={() => setCart([])} className="w-full text-center text-xs text-zinc-400 hover:text-red-400 py-1">
              Kosongkan keranjang
            </button>
          </div>
        )}

        {/* ── Hidden Invoice Preview (for image capture) ── */}
        <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
          <div ref={invoiceRef} className="bg-[#FDFBF7] p-10 text-zinc-900 font-sans" style={{ width: 480 }}>
            {/* Header */}
            <div className="flex justify-between items-start mb-14">
              <div>
                <h1 style={{ fontSize:24, fontWeight:900, letterSpacing:'-0.05em' }}>
                  Serena<span style={{ color:'#8B5E3C' }}>Raga</span>
                </h1>
                <p style={{ fontSize:8, letterSpacing:'0.3em', fontWeight:700, color:'#8B5E3C', marginTop:4 }}>COMFORTABLE HOME MASSAGE</p>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ display:'inline-block', padding:'4px 12px', background:'#8B5E3C', color:'#fff', fontSize:10, fontWeight:900, fontStyle:'italic', borderRadius:6, marginBottom:8 }}>INVOICE</div>
                <p style={{ fontSize:10, fontWeight:700, color:'#a1a1aa', letterSpacing:'0.15em' }}>{invoiceNumber}</p>
              </div>
            </div>
            {/* Bill To */}
            <div style={{ borderLeft:'4px solid #8B5E3C', paddingLeft:20, marginBottom:40 }}>
              <p style={{ fontSize:9, fontWeight:900, textTransform:'uppercase', letterSpacing:'0.2em', color:'rgba(139,94,60,0.5)', marginBottom:6 }}>Ditujukan Untuk:</p>
              <h4 style={{ fontSize:18, fontWeight:700 }}>{customerName || 'Nama Pelanggan'}</h4>
              <p style={{ fontSize:11, color:'#a1a1aa', marginTop:4 }}>
                {new Date(date).toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' })}
              </p>
            </div>
            {/* Items */}
            <div style={{ marginBottom:40 }}>
              <div style={{ display:'flex', justifyContent:'space-between', borderBottom:'1px solid #f4f4f5', paddingBottom:10, marginBottom:14, fontSize:9, fontWeight:900, textTransform:'uppercase', letterSpacing:'0.15em', color:'#a1a1aa' }}>
                <span>Item & Layanan</span><span>Harga</span>
              </div>
              {invoiceItems.map((item, idx) => (
                <div key={idx} style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
                  <div>
                    <p style={{ fontWeight:700, color:'#27272a', fontSize:13, marginBottom:2 }}>{item.name}</p>
                    {item.details && <p style={{ fontSize:9, color:'#71717a', lineHeight:1.3, maxWidth:260 }}>{item.details}</p>}
                  </div>
                  <p style={{ fontWeight:700, fontSize:13 }}>{formatRp(item.price)}</p>
                </div>
              ))}
              {/* Totals */}
              <div style={{ marginTop:20 }}>
                {discountAmount > 0 && (
                  <>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, fontWeight:700, color:'#a1a1aa', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:6 }}>
                      <span>Subtotal</span><span>{formatRp(subtotal)}</span>
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, fontWeight:700, color:'#f59e0b', marginBottom:6 }}>
                      <span>{autoDiscount?.name ?? 'Diskon'}</span><span>-{formatRp(discountAmount)}</span>
                    </div>
                  </>
                )}
                <div style={{ display:'flex', justifyContent:'space-between', paddingTop:12, borderTop:'2px solid #27272a', marginTop:8 }}>
                  <span style={{ fontSize:13, fontWeight:900, textTransform:'uppercase', letterSpacing:'0.1em' }}>Total</span>
                  <span style={{ fontSize:20, fontWeight:900 }}>{formatRp(total)}</span>
                </div>
              </div>
            </div>
            {/* Footer */}
            <div style={{ borderTop:'1px solid #f4f4f5', paddingTop:24, marginTop:24, textAlign:'center' }}>
              <p style={{ fontSize:9, color:'#71717a', lineHeight:1.8 }}>{invoiceFooter}</p>
              <p style={{ fontSize:9, color:'#8B5E3C', marginTop:8, fontWeight:600 }}>{invoiceSocial}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
