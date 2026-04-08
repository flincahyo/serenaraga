'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { toPng } from 'html-to-image';
import { Download, Plus, Trash2, Loader2, Share2, Users, Percent } from 'lucide-react';
import { createClient } from '@/lib/supabase';

type Item = { id: number; name: string; duration: string; price: number; };
type Service = { id: string; name: string; price: number; details: string; category: string; };
type Booking = {
  id: string;
  customer_name: string;
  phone: string;
  service_name: string;
  booking_date: string;
  price: number;
  status: string;
};

const pad = (n: number) => String(n).padStart(3, '0');
const genInvoiceNo = () => {
  const now = new Date();
  return `SR-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${pad(Math.floor(Math.random() * 900) + 100)}`;
};

const CATEGORY_LABELS: Record<string, string> = {
  packages: 'Paket Massage', services: 'Massage Services',
  reflexology: 'Refleksi', addons: 'Add-On',
};

const InvoiceMaker = () => {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [invoiceNumber] = useState(genInvoiceNo);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState<Item[]>([{ id: 1, name: '', duration: '', price: 0 }]);
  const [services, setServices] = useState<Service[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [generating, setGenerating] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState('');
  const [invoiceFooter, setInvoiceFooter] = useState('Terima kasih telah mempercayakan ketenangan raga Anda kepada kami.');
  const [invoiceSocial, setInvoiceSocial] = useState('Instagram & Threads: @serena.raga');
  const [commissionPct, setCommissionPct]  = useState(30);

  const supabase = createClient();

  const fetchAll = useCallback(async () => {
    const [{ data: svcData }, { data: bkgData }, { data: settingsData }] = await Promise.all([
      supabase.from('services').select('id,name,price,details,category').order('category').order('sort_order'),
      supabase.from('bookings').select('id,customer_name,phone,service_name,booking_date,price,status')
        .in('status', ['Pending', 'Confirmed']).order('booking_date', { ascending: false }).limit(50),
      supabase.from('settings').select('key, value').in('key', ['invoice_footer_text', 'invoice_social_text', 'terapis_commission_pct']),
    ]);
    if (svcData) setServices(svcData);
    if (bkgData) setBookings(bkgData);
    if (settingsData) {
      settingsData.forEach(({ key, value }) => {
        if (key === 'invoice_footer_text')   setInvoiceFooter(value);
        if (key === 'invoice_social_text')   setInvoiceSocial(value);
        if (key === 'terapis_commission_pct') setCommissionPct(Number(value) || 30);
      });
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // When a booking is selected, auto-fill customer + add service item
  const onBookingSelect = (bookingId: string) => {
    setSelectedBookingId(bookingId);
    if (!bookingId) return;
    const bk = bookings.find(b => b.id === bookingId);
    if (!bk) return;

    setCustomerName(bk.customer_name);
    setCustomerPhone(bk.phone ?? '');
    if (bk.booking_date) setDate(bk.booking_date);

    // Find service details
    const svc = services.find(s => s.name === bk.service_name);
    const durationMatch = svc?.details?.match(/(\d+)\s*m(?:enit)?/i);
    const duration = durationMatch ? `${durationMatch[1]}m` : '';

    setItems([{
      id: Date.now(),
      name: bk.service_name ?? '',
      duration,
      price: bk.price ?? svc?.price ?? 0,
    }]);
  };

  const addItem = () => setItems(p => [...p, { id: Date.now(), name: '', duration: '', price: 0 }]);
  const removeItem = (id: number) => setItems(p => p.filter(i => i.id !== id));
  const updateItem = (id: number, field: keyof Item, value: string | number) =>
    setItems(p => p.map(i => i.id === id ? { ...i, [field]: value } : i));

  const onServiceSelect = (itemId: number, serviceName: string) => {
    const svc = services.find(s => s.name === serviceName);
    if (!svc) return;
    const durationMatch = svc.details?.match(/(\d+)\s*m(?:enit)?/i);
    const duration = durationMatch ? `${durationMatch[1]}m` : '';
    setItems(p => p.map(i => i.id === itemId ? { ...i, name: svc.name, price: svc.price, duration } : i));
  };

  const totalPrice = items.reduce((s, i) => s + Number(i.price), 0);

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

  const downloadInvoice = async () => {
    const r = await generateImage();
    if (!r) return;
    const link = document.createElement('a');
    link.download = `Invoice-${invoiceNumber}.png`;
    link.href = r.dataUrl;
    link.click();
  };

  const shareToWhatsApp = async () => {
    const r = await generateImage();
    if (!r) return;
    const file = new File([r.blob], `Invoice-${invoiceNumber}.png`, { type: 'image/png' });

    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: `Invoice ${invoiceNumber} - SerenaRaga`,
          text: `Invoice untuk ${customerName || 'pelanggan'} — Total: Rp ${totalPrice.toLocaleString('id-ID')}`,
        });
        return;
      } catch (e) { if ((e as Error).name === 'AbortError') return; }
    }

    // Desktop fallback
    const msg = `Invoice ${invoiceNumber} untuk ${customerName || 'pelanggan'}\nTotal: Rp ${totalPrice.toLocaleString('id-ID')}\n*(Gambar invoice dilampirkan)*`;
    const phone = (customerPhone || '').replace(/\D/g, '');
    if (phone) window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
    const link = document.createElement('a');
    link.download = `Invoice-${invoiceNumber}.png`;
    link.href = r.dataUrl;
    link.click();
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

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
          <select
            value={selectedBookingId}
            onChange={e => onBookingSelect(e.target.value)}
            className="admin-input text-xs"
          >
            <option value="">-- Pilih booking untuk auto-isi pelanggan & layanan --</option>
            {bookings.map(b => (
              <option key={b.id} value={b.id}>
                {b.customer_name} · {b.service_name} {b.booking_date ? `(${formatDate(b.booking_date)})` : ''} · {b.status}
              </option>
            ))}
          </select>
          {selectedBookingId && (
            <p className="text-[10px] text-zinc-400 mt-2">Data telah diisi. Kamu tetap bisa edit dan tambah item di bawah.</p>
          )}
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
          <input type="tel" placeholder="628xxx" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="admin-input" />
        </div>

        {/* Items */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-medium text-zinc-500">Daftar Layanan</label>
            <button onClick={addItem} className="text-xs text-earth-primary font-semibold hover:underline">+ Tambah Item</button>
          </div>
          <div className="space-y-3">
            {items.map(item => (
              <div key={item.id} className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-3 space-y-2 border border-zinc-200 dark:border-zinc-700">
                <select
                  value={item.name}
                  onChange={e => onServiceSelect(item.id, e.target.value)}
                  className="admin-input text-xs"
                >
                  <option value="">-- Pilih dari pricelist (opsional) --</option>
                  {['packages', 'services', 'reflexology', 'addons'].map(cat => (
                    <optgroup key={cat} label={CATEGORY_LABELS[cat]}>
                      {services.filter(s => s.category === cat).map(s => (
                        <option key={s.id} value={s.name}>{s.name} — Rp {s.price.toLocaleString('id-ID')}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <div className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5">
                    <input placeholder="Nama layanan" value={item.name} onChange={e => updateItem(item.id, 'name', e.target.value)} className="admin-input text-xs" />
                  </div>
                  <div className="col-span-3">
                    <input placeholder="Durasi" value={item.duration} onChange={e => updateItem(item.id, 'duration', e.target.value)} className="admin-input text-xs text-center" />
                  </div>
                  <div className="col-span-3">
                    <input type="number" placeholder="Harga" value={item.price || ''} onChange={e => updateItem(item.id, 'price', Number(e.target.value))} className="admin-input text-xs text-right font-mono" />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-500 p-1"><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Total + Commission breakdown */}
        <div className="rounded-xl bg-earth-primary/5 dark:bg-earth-primary/10 p-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">Total Invoice</span>
            <span className="text-lg font-bold text-earth-primary font-mono">Rp {totalPrice.toLocaleString('id-ID')}</span>
          </div>
          {commissionPct > 0 && totalPrice > 0 && (
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-earth-primary/10">
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                <span className="flex items-center gap-1"><Percent size={11} className="text-amber-500" /> Terapis ({commissionPct}%)</span>
                <span className="font-mono font-semibold text-amber-600 dark:text-amber-400">Rp {Math.round(totalPrice * commissionPct / 100).toLocaleString('id-ID')}</span>
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 text-right">
                <span>Pemilik ({100 - commissionPct}%)</span>
                <p className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">Rp {Math.round(totalPrice * (100 - commissionPct) / 100).toLocaleString('id-ID')}</p>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button onClick={shareToWhatsApp} disabled={generating} className="admin-btn-primary flex-1 justify-center py-3 disabled:opacity-60">
            {generating ? <Loader2 size={15} className="animate-spin" /> : <Share2 size={15} />} Kirim WA
          </button>
          <button onClick={downloadInvoice} disabled={generating} className="admin-btn-ghost px-4 py-3 disabled:opacity-60" title="Download PNG">
            <Download size={15} />
          </button>
        </div>

        <p className="text-[10px] text-zinc-400 text-center leading-relaxed">
          Di HP: gambar invoice langsung ke share sheet → pilih WA.<br />
          Di laptop: gambar di-download + WA Web dibuka otomatis.
        </p>
      </div>

      {/* ── PREVIEW SECTION ── */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest px-1">Preview Invoice</h3>
        <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-lg">
          <div ref={invoiceRef} className="bg-[#FDFBF7] p-10 text-zinc-900 font-sans" style={{ width: 480, minHeight: 680 }}>
            {/* Header */}
            <div className="flex justify-between items-start mb-14">
              <div>
                <h1 className="text-2xl font-serif font-black tracking-tighter text-zinc-900">
                  Serena<span style={{ color: '#8B5E3C' }}>Raga</span>
                </h1>
                <p style={{ fontSize: 8, letterSpacing: '0.3em', fontWeight: 700, color: '#8B5E3C', marginTop: 4 }}>EXCLUSIVE HOME MASSAGE</p>
              </div>
              <div className="text-right">
                <div style={{ display: 'inline-block', padding: '4px 12px', background: '#8B5E3C', color: '#fff', fontSize: 10, fontWeight: 900, fontStyle: 'italic', borderRadius: 6, marginBottom: 8 }}>INVOICE</div>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#a1a1aa', letterSpacing: '0.15em' }}>{invoiceNumber}</p>
              </div>
            </div>

            {/* Bill To */}
            <div style={{ borderLeft: '4px solid #8B5E3C', paddingLeft: 20, marginBottom: 40 }}>
              <p style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(139,94,60,0.5)', marginBottom: 6 }}>Ditujukan Untuk:</p>
              <h4 style={{ fontSize: 18, fontWeight: 700 }}>{customerName || 'Nama Pelanggan'}</h4>
              <p style={{ fontSize: 11, color: '#a1a1aa', marginTop: 4 }}>
                {new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>

            {/* Items */}
            <div style={{ marginBottom: 40 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f4f4f5', paddingBottom: 10, marginBottom: 14, fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#a1a1aa' }}>
                <span>Layanan &amp; Durasi</span><span>Harga</span>
              </div>
              {items.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div>
                    <p style={{ fontWeight: 700, color: '#27272a', fontSize: 13 }}>{item.name || 'Pilih Layanan...'}</p>
                    {item.duration && <p style={{ fontSize: 10, color: '#a1a1aa', fontStyle: 'italic' }}>{item.duration}</p>}
                  </div>
                  <p style={{ fontWeight: 700, fontSize: 13 }}>Rp {Number(item.price).toLocaleString('id-ID')}</p>
                </div>
              ))}
              <div style={{ marginTop: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
                  <span>Subtotal</span><span>Rp {totalPrice.toLocaleString('id-ID')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', background: '#8B5E3C', borderRadius: 12, color: '#fff' }}>
                  <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Total Bayar</span>
                  <span style={{ fontSize: 18, fontWeight: 700, fontStyle: 'italic' }}>Rp {totalPrice.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ textAlign: 'center', paddingTop: 20, borderTop: '1px solid #f4f4f5' }}>
              <p style={{ fontSize: 11, fontStyle: 'italic', color: '#a1a1aa' }}>
                {invoiceFooter}
              </p>
              <p style={{ fontSize: 9, fontWeight: 700, color: '#8B5E3C', textTransform: 'uppercase', letterSpacing: '0.2em', marginTop: 8 }}>
                {invoiceSocial}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceMaker;
