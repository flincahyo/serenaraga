'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Gift, Plus, Copy, Check, X, Loader2, Tag, Clock, Users, RefreshCw, Ban, Palette, Layers, ChevronRight, Printer, Trash2, Globe } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { AdminSkeleton } from '@/components/admin/AdminSkeleton';
import { useUser } from '@/lib/user-context';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import * as htmlToImage from 'html-to-image';
import jsPDF from 'jspdf';
import QRCode from 'react-qr-code';

const WAIco = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const InstagramIco = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const ThreadsIco = ({ size = 15, className }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 192 192" fill="currentColor" className={className}>
    <path d="M141.537 88.9883C140.71 88.5919 139.87 88.2104 139.019 87.8451C137.537 60.5382 122.616 44.905 97.5619 44.745C97.4484 44.7443 97.3355 44.7443 97.222 44.7443C82.2364 44.7443 69.7731 51.1409 62.102 62.7807L75.881 72.2328C81.6116 63.5383 90.6052 61.6848 97.2286 61.6848C97.3051 61.6848 97.3819 61.6848 97.4576 61.6855C105.707 61.7381 111.932 64.1366 115.961 68.814C118.893 72.2193 120.854 76.925 121.825 82.8638C114.511 81.6207 106.601 81.2385 98.145 81.7233C74.3247 83.0954 59.0111 96.9879 60.0396 116.292C60.5615 126.084 65.4397 134.508 73.775 140.011C80.8224 144.663 89.899 146.938 99.3323 146.423C111.79 145.74 121.563 140.987 128.381 132.296C133.559 125.696 136.834 117.143 138.28 106.366C144.217 109.949 148.617 114.664 151.047 120.332C155.179 129.967 155.42 145.8 142.501 158.708C131.182 170.016 117.576 174.908 97.0135 175.059C74.2042 174.89 56.9538 167.575 45.7381 153.317C35.2355 139.966 29.8077 120.682 29.6052 96C29.8077 71.3178 35.2355 52.0336 45.7381 38.6827C56.9538 24.4249 74.2039 17.11 97.0132 16.9405C119.988 17.1113 137.539 24.4614 149.184 38.788C154.894 45.8136 159.199 54.6488 162.037 64.9503L178.184 60.6422C174.744 47.9622 169.331 37.0357 161.965 27.974C147.036 9.60668 125.202 0.195148 97.0695 0H96.9569C68.8816 0.19447 47.2921 9.6418 32.7883 28.0793C19.8819 44.4864 13.2244 67.3157 13.0007 95.9325L13 96L13.0007 96.0675C13.2244 124.684 19.8819 147.514 32.7883 163.921C47.2921 182.358 68.8816 191.806 96.9569 192H97.0695C122.03 191.827 139.624 185.292 154.118 170.811C173.081 151.866 172.51 128.119 166.26 113.541C161.776 103.087 153.227 94.5962 141.537 88.9883ZM98.4405 129.507C88.0005 130.095 77.1544 125.409 76.6196 115.372C76.2232 107.93 81.9158 99.626 99.0812 98.6368C101.047 98.5234 102.976 98.468 104.871 98.468C111.106 98.468 116.939 99.0737 122.242 100.233C120.264 124.935 108.662 128.946 98.4405 129.507Z" />
  </svg>
);

type Service = { id: string; name: string; price: number; category: string; category_label: string; details?: string; };
type Voucher = {
  id: string; code: string; name: string; value: number; value_type: string;
  max_uses: number | null; uses_count: number; valid_to: string | null;
  is_active: boolean; created_at: string;
  recipient_name: string | null; buyer_name: string | null;
  amount_paid: number | null; target_service: string | null;
  description: string | null;
};

const genCode = (len = 4) => {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const numbers = '23456789';
  let code = '';
  for (let i = 0; i < len; i++) {
    // Alternate Letter and Number for readability (e.g., K7M3P9)
    const source = i % 2 === 0 ? letters : numbers;
    code += source[Math.floor(Math.random() * source.length)];
  }
  return code;
};

const fmtRp = (n: number) => `Rp ${Number(n).toLocaleString('id-ID')}`;
const fmtDate = (d: string | null) => {
  if (!d) return 'Lifetime';
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
};

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  active:  { label: 'Aktif',    cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50' },
  used:    { label: 'Terpakai', cls: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700' },
  expired: { label: 'Expired',  cls: 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400 border border-red-100 dark:border-red-900/50' },
};

function getStatus(v: Voucher): 'active' | 'used' | 'expired' {
  if (!v.is_active) return 'used';
  if (v.max_uses !== null && v.uses_count >= v.max_uses) return 'used';
  if (v.valid_to && new Date(v.valid_to) < new Date()) return 'expired';
  return 'active';
}

export default function VouchersPage() {
  const { user } = useUser();
  const router = useRouter();

  const [tab, setTab] = useState<'list' | 'create' | 'bulk' | 'kupon_generator'>('list');
  const [kuponForm, setKuponForm] = useState({
    title: 'VOUCHER PENUKARAN',
    item: '1x Merchandise',
    qrUrl: 'https://instagram.com/serena.raga',
    instagram: '@serena.raga',
    whatsapp: '0895-1835-9037',
    threads: '@serena.raga',
    website: 'serenaraga.fit',
    bgColor: '#FAF6EF',
    quantity: 12,
    couponWidth: 140,
    canvasWidth: 1200,
    showInstagram: true,
    showWhatsapp: true,
    showThreads: true,
    showWebsite: true,
    terms1: 'Hanya berlaku di booth event SerenaRaga.',
    terms2: 'Wajib follow Instagram @serena.raga & TikTok @serena.raga.',
    terms3: 'Voucher tidak dapat diuangkan dan hanya dapat digunakan 1 kali.',
  });
  const [customLogo, setCustomLogo] = useState<string | null>(null);
  const [isGeneratingKuponPDF, setIsGeneratingKuponPDF] = useState(false);
  const [isDownloadingKuponImage, setIsDownloadingKuponImage] = useState(false);
  const kuponCanvasRef = useRef<HTMLDivElement>(null);

  // Dynamic layout calculations for printing (A3 size)
  const couponAspect = (kuponForm.canvasWidth || 1200) / 520;
  const targetWidth = kuponForm.couponWidth || 140;
  const gapX = 0.3; // Diperkecil menjadi 0.3mm agar tidak banyak kertas terbuang saat dipotong
  const gapY = 0.3; // Diperkecil menjadi 0.3mm agar tidak banyak kertas terbuang saat dipotong
  const margin = 5; // Minimum printer margin (5mm)

  // Portrait layout analysis
  const colsP = Math.max(1, Math.floor((297 - 2 * margin + gapX) / (targetWidth + gapX)));
  const printWidthP = (297 - 2 * margin - (colsP - 1) * gapX) / colsP;
  const printHeightP = printWidthP / couponAspect;
  const rowsP = Math.max(1, Math.floor((420 - 2 * margin + gapY) / (printHeightP + gapY)));
  const capacityP = colsP * rowsP;

  // Landscape layout analysis
  const colsL = Math.max(1, Math.floor((420 - 2 * margin + gapX) / (targetWidth + gapX)));
  const printWidthL = (420 - 2 * margin - (colsL - 1) * gapX) / colsL;
  const printHeightL = printWidthL / couponAspect;
  const rowsL = Math.max(1, Math.floor((297 - 2 * margin + gapY) / (printHeightL + gapY)));
  const capacityL = colsL * rowsL;

  // Auto-select orientation that yields higher capacity
  const isLandscape = capacityL > capacityP;
  const cols = isLandscape ? colsL : colsP;
  const rows = isLandscape ? rowsL : rowsP;
  const maxPerPage = cols * rows;
  const pdfOrientation = isLandscape ? 'l' : 'p';
  const pdfWidth = isLandscape ? 420 : 297;
  const pdfHeight = isLandscape ? 297 : 420;

  // The actual print dimensions scaled up to stretch to the margin borders
  const printWidth = isLandscape ? printWidthL : printWidthP;
  const printHeight = isLandscape ? printHeightL : printHeightP;

  // Live preview dimensions scaling (fits inside 660px wide box)
  const previewCanvasWidth = kuponForm.canvasWidth || 1200;
  const previewScale = 660 / previewCanvasWidth;
  const previewFrameHeight = Math.round(520 * previewScale);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState('');
  const [filterStatus, setFilterStatus] = useState<'semua' | 'active' | 'used' | 'expired'>('semua');
  const [deleteConfirm, setDeleteConfirm] = useState<{ id?: string, batch?: string, type: 'delete' | 'revoke' } | null>(null);

  const [form, setForm] = useState({
    code: `SRAGA-${genCode(4)}`,
    name: '',
    serviceId: '',
    customValue: 0,
    useServicePrice: true,
    valueType: 'flat' as 'flat' | 'percentage',
    recipientName: '',
    buyerName: '',
    amountPaid: 0,
    maxUses: 1,
    useExpiry: false,
    expiryDate: '',
    tagline: '',
    terms1: 'Berlaku untuk layanan Home Service Massage di wilayah Yogyakarta (free transport max 10km).',
    terms2: 'Wajib melakukan reservasi maksimal H-1 sebelum kedatangan.',
    terms3: 'Voucher tidak dapat diuangkan atau digabungkan dengan promo lainnya.',
    // Event specific fields
    voucherType: 'discount' as 'discount' | 'event',
    eventItem: '',
    qrUrl: 'https://instagram.com/serena.raga',
    instagram: '@serena.raga',
    tiktok: '@serena.raga',
    whatsapp: '0895-1835-9037',
    website: 'serenaraga.fit'
  });

  const [bulkForm, setBulkForm] = useState({
    quantity: 100,
    prefix: 'SRAGA',
    batchName: '',
    name: '',
    customValue: 0,
    valueType: 'flat' as 'flat' | 'percentage',
    maxUses: 1,
    useExpiry: false,
    expiryDate: '',
    tagline: '',
    terms1: 'Berlaku untuk layanan Home Service Massage di wilayah Yogyakarta (free transport max 10km).',
    terms2: 'Wajib melakukan reservasi maksimal H-1 sebelum kedatangan.',
    terms3: 'Voucher tidak dapat diuangkan atau digabungkan dengan promo lainnya.',
    // Event specific fields
    voucherType: 'discount' as 'discount' | 'event',
    eventItem: '',
    qrUrl: 'https://instagram.com/serena.raga',
    instagram: '@serena.raga',
    tiktok: '@serena.raga',
    whatsapp: '0895-1835-9037',
    website: 'serenaraga.fit'
  });

  const supabase = createClient();

  const selectedService = services.find(s => s.id === form.serviceId);
  const voucherValue = form.useServicePrice && selectedService ? selectedService.price : form.customValue;

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [{ data: vs }, { data: svcs }] = await Promise.all([
      supabase.from('discounts').select('*').eq('is_voucher', true).order('created_at', { ascending: false }),
      supabase.from('services').select('id,name,price,category,category_label,details').neq('category', 'split_items').order('sort_order'),
    ]);
    if (vs) setVouchers(vs as Voucher[]);
    if (svcs) setServices(svcs);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (user && user.role !== 'owner') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 text-zinc-500">
        <Ban size={40} className="text-red-400" />
        <p className="text-sm font-medium">Halaman ini khusus Owner.</p>
      </div>
    );
  }

  const handleCreate = async () => {
    if (!form.name || !form.code) return;
    setSaving(true);
    const value = form.voucherType === 'event' ? 0 : voucherValue;
    const payload = {
      code: form.code.trim().toUpperCase(),
      name: form.name,
      type: 'manual',
      value_type: form.voucherType === 'event' ? 'flat' : form.valueType,
      value,
      max_uses: form.maxUses,
      uses_count: 0,
      is_active: true,
      is_owner_borne: true,
      is_voucher: true,
      recipient_name: form.voucherType === 'event' ? null : (form.recipientName || null),
      buyer_name: form.voucherType === 'event' ? null : (form.buyerName || null),
      amount_paid: form.voucherType === 'event' ? null : (form.amountPaid || null),
      target_service: form.voucherType === 'event' ? null : (form.serviceId || null),
      valid_from: null,
      valid_to: form.useExpiry && form.expiryDate ? form.expiryDate : null,
      description: JSON.stringify({
        tagline: form.tagline || (form.voucherType === 'event' ? 'Tukarkan voucher ini di booth event kami.' : ''),
        terms1: form.terms1,
        terms2: form.terms2,
        terms3: form.terms3,
        // Event properties
        voucher_type: form.voucherType,
        event_item: form.voucherType === 'event' ? form.eventItem : undefined,
        qr_url: form.voucherType === 'event' ? form.qrUrl : undefined,
        instagram: form.voucherType === 'event' ? form.instagram : undefined,
        tiktok: form.voucherType === 'event' ? form.tiktok : undefined,
        whatsapp: form.voucherType === 'event' ? form.whatsapp : undefined,
        website: form.voucherType === 'event' ? form.website : undefined,
      }),
    };
    const { data, error } = await supabase.from('discounts').insert(payload).select().single();
    if (!error && data) {
      setTab('list');
      fetchData();
      setForm(f => ({
        ...f,
        code: `SRAGA-${genCode(4)}`,
        name: '',
        serviceId: '',
        customValue: 0,
        useServicePrice: true,
        valueType: 'flat',
        recipientName: '',
        buyerName: '',
        amountPaid: 0,
        maxUses: 1,
        useExpiry: false,
        expiryDate: '',
        tagline: '',
        voucherType: 'discount',
        eventItem: '',
        qrUrl: 'https://instagram.com/serena.raga',
        instagram: '@serena.raga',
        tiktok: '@serena.raga',
        whatsapp: '0895-1835-9037',
        website: 'serenaraga.fit'
      }));
    }
    setSaving(false);
  };

  const handleCreateBulk = async () => {
    if (!bulkForm.batchName || !bulkForm.name || !bulkForm.prefix || bulkForm.quantity < 1 || (bulkForm.voucherType !== 'event' && bulkForm.customValue <= 0)) return;
    setSaving(true);
    
    const prefix = bulkForm.prefix.trim().toUpperCase();
    const generatedCodes = new Set<string>();
    while (generatedCodes.size < bulkForm.quantity) {
      // Menggunakan genCode(6) memberikan ~7 Juta kombinasi, cukup aman antar event dan lebih mudah diketik
      generatedCodes.add(`${prefix}-${genCode(6)}`);
    }
    
    const codesArray = Array.from(generatedCodes);
    const uniqueId = genCode(3);
    const dateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    const batchIdentifier = `Batch: ${bulkForm.batchName.trim()} (${dateStr} - ${uniqueId})`;
    
    const payload = codesArray.map((codeStr) => ({
      code: codeStr,
      name: bulkForm.name,
      type: 'manual',
      value_type: bulkForm.voucherType === 'event' ? 'flat' : bulkForm.valueType,
      value: bulkForm.voucherType === 'event' ? 0 : bulkForm.customValue,
      max_uses: bulkForm.maxUses,
      uses_count: 0,
      is_active: true,
      is_owner_borne: true,
      is_voucher: true,
      buyer_name: batchIdentifier, // Identifier for bulk batches
      valid_to: bulkForm.useExpiry && bulkForm.expiryDate ? bulkForm.expiryDate : null,
      description: JSON.stringify({
        tagline: bulkForm.tagline,
        terms1: bulkForm.terms1,
        terms2: bulkForm.terms2,
        terms3: bulkForm.terms3,
        // Event properties
        voucher_type: bulkForm.voucherType,
        event_item: bulkForm.voucherType === 'event' ? bulkForm.eventItem : undefined,
        qr_url: bulkForm.voucherType === 'event' ? bulkForm.qrUrl : undefined,
        instagram: bulkForm.voucherType === 'event' ? bulkForm.instagram : undefined,
        tiktok: bulkForm.voucherType === 'event' ? bulkForm.tiktok : undefined,
        whatsapp: bulkForm.voucherType === 'event' ? bulkForm.whatsapp : undefined,
        website: bulkForm.voucherType === 'event' ? bulkForm.website : undefined,
      }),
    }));

    const { error } = await supabase.from('discounts').insert(payload);
    if (!error) {
      setTab('list');
      fetchData();
      setBulkForm(f => ({
        ...f,
        quantity: 100,
        prefix: 'SRAGA',
        batchName: '',
        name: '',
        customValue: 0,
        valueType: 'flat',
        maxUses: 1,
        useExpiry: false,
        expiryDate: '',
        tagline: '',
        voucherType: 'discount',
        eventItem: '',
        qrUrl: 'https://instagram.com/serena.raga',
        instagram: '@serena.raga',
        tiktok: '@serena.raga',
        whatsapp: '0895-1835-9037',
        website: 'serenaraga.fit'
      }));
    } else {
      alert("Gagal membuat bulk voucher.");
    }
    setSaving(false);
  };

  const handleRevoke = (id: string) => setDeleteConfirm({ id, type: 'revoke' });
  const handleRevokeBatch = (batchName: string) => setDeleteConfirm({ batch: batchName, type: 'revoke' });
  const handleDelete = (id: string) => setDeleteConfirm({ id, type: 'delete' });
  const handleDeleteBatch = (batchName: string) => setDeleteConfirm({ batch: batchName, type: 'delete' });

  const confirmAction = async () => {
    if (!deleteConfirm) return;
    const { id, batch, type } = deleteConfirm;
    
    if (type === 'revoke') {
      if (id) await supabase.from('discounts').update({ is_active: false }).eq('id', id);
      if (batch) await supabase.from('discounts').update({ is_active: false }).eq('buyer_name', `Batch: ${batch}`);
    } else if (type === 'delete') {
      if (id) await supabase.from('discounts').delete().eq('id', id);
      if (batch) await supabase.from('discounts').delete().eq('buyer_name', `Batch: ${batch}`);
    }
    
    setDeleteConfirm(null);
    fetchData();
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(''), 2000);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownloadKuponImage = async () => {
    if (!kuponCanvasRef.current) return;
    setIsDownloadingKuponImage(true);
    try {
      const dataUrl = await htmlToImage.toJpeg(kuponCanvasRef.current, {
        quality: 0.95,
        width: kuponForm.canvasWidth || 1200,
        height: 520,
        pixelRatio: 2,
        style: { transform: 'none' },
      });
      const link = document.createElement('a');
      link.download = `Kupon_${kuponForm.item.replace(/\s+/g, '_') || 'Event'}.jpg`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error(e);
      alert('Gagal mendownload gambar kupon.');
    } finally {
      setIsDownloadingKuponImage(false);
    }
  };

  const handleGenerateKuponPDF = async () => {
    if (!kuponCanvasRef.current) return;
    setIsGeneratingKuponPDF(true);
    try {
      const dataUrl = await htmlToImage.toJpeg(kuponCanvasRef.current, {
        quality: 0.95,
        width: kuponForm.canvasWidth || 1200,
        height: 520,
        pixelRatio: 2,
        style: { transform: 'none' },
      });

      const pdf = new jsPDF(pdfOrientation, 'mm', 'a3');

      // Calculate total dimensions of the printed grid to center it
      const gridWidth = cols * printWidth + (cols - 1) * gapX;
      const gridHeight = rows * printHeight + (rows - 1) * gapY;
      const offsetX = (pdfWidth - gridWidth) / 2;
      const offsetY = (pdfHeight - gridHeight) / 2;

      for (let i = 0; i < kuponForm.quantity; i++) {
        const idxInPage = i % maxPerPage;
        const c = idxInPage % cols;
        const r = Math.floor(idxInPage / cols);

        if (i > 0 && idxInPage === 0) {
          pdf.addPage();
        }

        const x = offsetX + c * (printWidth + gapX);
        const y = offsetY + r * (printHeight + gapY);

        pdf.addImage(dataUrl, 'JPEG', x, y, printWidth, printHeight);
      }

      pdf.save(`Kupon_Cetak_${kuponForm.item.replace(/\s+/g, '_') || 'Event'}.pdf`);
    } catch (e) {
      console.error(e);
      alert('Gagal mencetak PDF.');
    } finally {
      setIsGeneratingKuponPDF(false);
    }
  };

  // Grouping logic for batches
  const batches = vouchers.reduce((acc, v) => {
    if (v.buyer_name?.startsWith('Batch: ')) {
      const batchName = v.buyer_name.replace('Batch: ', '');
      if (!acc[batchName]) acc[batchName] = [];
      acc[batchName].push(v);
    }
    return acc;
  }, {} as Record<string, Voucher[]>);

  const individualVouchers = vouchers.filter(v => !v.buyer_name?.startsWith('Batch: '));

  const filteredIndividual = individualVouchers.filter(v => {
    if (filterStatus === 'semua') return true;
    return getStatus(v) === filterStatus;
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20 relative">
      
      {/* Custom Confirm Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-zinc-900/40"
              onClick={() => setDeleteConfirm(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 10 }} 
              className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-7 rounded-[2rem] shadow-2xl max-w-sm w-full"
            >
              <div className="flex items-start gap-4">
                <div className={`p-4 rounded-2xl shrink-0 ${deleteConfirm.type === 'delete' ? 'bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400' : 'bg-orange-50 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400'}`}>
                  {deleteConfirm.type === 'delete' ? <Trash2 size={24} /> : <Ban size={24} />}
                </div>
                <div className="mt-1">
                  <h3 className="font-bold text-zinc-900 dark:text-white text-lg tracking-wide">
                    {deleteConfirm.type === 'delete' ? 'Hapus Permanen?' : 'Nonaktifkan?'}
                  </h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
                    {deleteConfirm.type === 'delete' 
                      ? 'Tindakan ini akan menghapus data secara permanen dari database. Data tidak dapat dikembalikan.' 
                      : 'Voucher akan dinonaktifkan dan tidak bisa digunakan lagi oleh pelanggan untuk booking.'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-8">
                <button 
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-3 rounded-xl font-bold text-sm tracking-wide text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 active:scale-[0.98] transition-all duration-200"
                >
                  Batal
                </button>
                <button 
                  onClick={confirmAction}
                  className={`flex-1 px-4 py-3 rounded-xl font-bold text-sm tracking-wide text-white shadow-sm active:scale-[0.98] transition-all duration-200 ${deleteConfirm.type === 'delete' ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20' : 'bg-orange-600 hover:bg-orange-700 shadow-orange-600/20'}`}
                >
                  {deleteConfirm.type === 'delete' ? 'Ya, Hapus' : 'Ya, Nonaktifkan'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header Premium */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-3">
            <Gift size={28} className="text-earth-primary" /> 
            <span>Voucher & Gift Card</span>
          </h1>
          <p className="text-sm text-zinc-500 mt-2 tracking-wide font-medium">
            Kelola diskon, gift card, dan cetak voucher massal (bulk).
          </p>
        </div>
        
        <div className="flex items-center gap-1.5 bg-zinc-100/60 dark:bg-zinc-800/60 p-1.5 rounded-[18px] shadow-[inset_0_1px_3px_rgba(0,0,0,0.06)] border border-zinc-200/50 dark:border-zinc-700/50 backdrop-blur-md">
          <button 
            onClick={() => setTab('list')} 
            className={`px-6 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all duration-300 active:scale-[0.98] ${tab === 'list' ? 'bg-white dark:bg-zinc-900 text-earth-primary shadow-[0_2px_10px_-3px_rgba(0,0,0,0.1)] ring-1 ring-black/5 dark:ring-white/10' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200/40 dark:hover:bg-zinc-700/40'}`}
          >
            Daftar Voucher
          </button>
          <button 
            onClick={() => setTab('create')} 
            className={`px-6 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all duration-300 active:scale-[0.98] ${tab === 'create' ? 'bg-white dark:bg-zinc-900 text-earth-primary shadow-[0_2px_10px_-3px_rgba(0,0,0,0.1)] ring-1 ring-black/5 dark:ring-white/10' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200/40 dark:hover:bg-zinc-700/40'}`}
          >
            Satuan
          </button>
          <button 
            onClick={() => setTab('bulk')} 
            className={`px-6 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all duration-300 flex items-center gap-2 active:scale-[0.98] ${tab === 'bulk' ? 'bg-earth-primary text-white shadow-md shadow-earth-primary/20' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200/40 dark:hover:bg-zinc-700/40'}`}
          >
            <Layers size={16} /> Bulk
          </button>
          <button 
            onClick={() => setTab('kupon_generator')} 
            className={`px-6 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all duration-300 flex items-center gap-2 active:scale-[0.98] ${tab === 'kupon_generator' ? 'bg-earth-primary text-white shadow-md shadow-earth-primary/20' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200/40 dark:hover:bg-zinc-700/40'}`}
          >
            <Palette size={16} /> Kupon Generator
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        
        {/* TAB: LIST */}
        {tab === 'list' && (
          <motion.div key="list" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-10">
            
            {loading ? <AdminSkeleton rows={6} /> : (
              <>
                {/* Batches Section */}
                {Object.keys(batches).length > 0 && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-200 tracking-wide flex items-center gap-2">
                      <Layers size={20} className="text-earth-primary" /> Batch Bulk Voucher
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {Object.entries(batches).map(([name, batchVouchers]) => {
                        const activeCount = batchVouchers.filter(v => getStatus(v) === 'active').length;
                        const sample = batchVouchers[0];
                        let parsedDesc: any = {};
                        try {
                          parsedDesc = JSON.parse(sample.description || '{}');
                        } catch (e) {
                          parsedDesc = {};
                        }
                        const isEvent = parsedDesc.voucher_type === 'event';

                        return (
                          <div key={name} className="group relative bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-earth-primary/5 rounded-bl-full -z-0" />
                            <div className="relative z-10 flex flex-col h-full">
                              <div className="flex justify-between items-start mb-4">
                                <div className="flex flex-col gap-1">
                                  <h3 className="font-bold text-zinc-900 dark:text-white text-base leading-tight pr-4">{name}</h3>
                                  {isEvent && (
                                    <span className="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/50 text-[9px] font-bold px-2 py-0.5 rounded-full w-max uppercase tracking-wider">
                                      Event Redemption
                                    </span>
                                  )}
                                </div>
                                <span className="bg-earth-primary/10 text-earth-primary text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider whitespace-nowrap">
                                  {batchVouchers.length} Codes
                                </span>
                              </div>
                              
                              <div className="space-y-2 mb-6">
                                <p className="text-xs text-zinc-500 flex items-center gap-2">
                                  <Tag size={12} className="text-zinc-400" />
                                  <span className="font-mono font-medium text-zinc-700 dark:text-zinc-300">
                                    {isEvent ? `Tukar: ${parsedDesc.event_item || 'Produk'}` : (sample.value_type === 'flat' ? fmtRp(sample.value) : `${sample.value}%`)}
                                  </span>
                                </p>
                                <p className="text-xs text-zinc-500 flex items-center gap-2">
                                  <Clock size={12} className="text-zinc-400" />
                                  {fmtDate(sample.valid_to)}
                                </p>
                                <p className="text-xs text-zinc-500 flex items-center gap-2">
                                  <Check size={12} className="text-emerald-500" />
                                  {activeCount} aktif
                                </p>
                              </div>
                              
                              <div className="mt-auto flex items-center gap-2">
                                <button 
                                  onClick={() => router.push(`/admin/feed-studio-v2?batch=${encodeURIComponent(name)}`)}
                                  className="flex-1 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 py-2.5 rounded-xl text-xs font-bold tracking-wide flex items-center justify-center gap-2 hover:bg-earth-primary dark:hover:bg-earth-primary hover:text-white transition-colors"
                                >
                                  <Printer size={14} /> Cetak Batch
                                </button>
                                  <button 
                                    onClick={() => handleRevokeBatch(name)}
                                    className="p-2.5 bg-zinc-100 text-zinc-500 rounded-xl hover:bg-zinc-200 transition-colors"
                                    title="Nonaktifkan Seluruh Batch"
                                  >
                                    <Ban size={14} />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteBatch(name)}
                                    className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                                    title="Hapus Permanen Seluruh Batch"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Individual Section */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-200 tracking-wide flex items-center gap-2">
                      <Gift size={20} className="text-earth-primary" /> Voucher Individual
                    </h2>
                    
                    <div className="flex gap-1.5 bg-zinc-100/60 dark:bg-zinc-800/60 p-1.5 rounded-2xl border border-zinc-200/50 dark:border-zinc-700/50">
                      {(['semua', 'active', 'used', 'expired'] as const).map(f => (
                        <button key={f} onClick={() => setFilterStatus(f)}
                          className={`px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all duration-300 active:scale-[0.98] ${
                            filterStatus === f ? 'bg-white dark:bg-zinc-700 text-earth-primary shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1)] ring-1 ring-black/5 dark:ring-white/10' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 hover:bg-zinc-200/40'
                          }`}>
                          {f === 'semua' ? 'Semua' : STATUS_MAP[f]?.label ?? f}
                        </button>
                      ))}
                    </div>
                  </div>

                  {filteredIndividual.length === 0 ? (
                    <div className="text-center py-16 text-sm text-zinc-400 bg-white dark:bg-zinc-900/50 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
                      <Gift size={32} className="mx-auto mb-3 opacity-20" />
                      Belum ada voucher individual di kategori ini.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {filteredIndividual.map(v => {
                        const status = getStatus(v);
                        const sc = STATUS_MAP[status];
                        let parsedDesc: any = {};
                        try {
                          parsedDesc = JSON.parse(v.description || '{}');
                        } catch (e) {
                          parsedDesc = {};
                        }
                        const isEvent = parsedDesc.voucher_type === 'event';

                        return (
                          <div key={v.id} className={`bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col gap-4 ${status !== 'active' ? 'opacity-50 grayscale-[50%]' : ''}`}>
                            
                            {/* Top row */}
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h3 className="font-bold text-sm text-zinc-900 dark:text-white mb-1 line-clamp-1">{v.name}</h3>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${sc.cls}`}>
                                    {sc.label}
                                  </span>
                                  {isEvent && (
                                    <span className="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                                      Event
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800/50 px-2.5 py-1.5 rounded-lg border border-zinc-100 dark:border-zinc-800">
                                <code className="font-mono text-xs font-bold text-earth-primary tracking-widest">{v.code}</code>
                                <button onClick={() => handleCopy(v.code)} className="text-zinc-400 hover:text-zinc-600 transition-colors">
                                  {copied === v.code ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                                </button>
                              </div>
                            </div>
                            
                            {/* Middle details */}
                            <div className="grid grid-cols-2 gap-y-2 gap-x-4 mt-2">
                              <div className="flex items-center gap-2 text-xs text-zinc-500">
                                <Tag size={12} className="text-zinc-400" />
                                <span className="font-mono font-medium">
                                  {isEvent ? `Tukar: ${parsedDesc.event_item || 'Produk'}` : (v.value_type === 'flat' ? fmtRp(v.value) : `${v.value}%`)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-zinc-500">
                                <Users size={12} className="text-zinc-400" />
                                <span>{v.uses_count}/{v.max_uses ?? '∞'} dipakai</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-zinc-500">
                                <Clock size={12} className="text-zinc-400" />
                                <span>{fmtDate(v.valid_to)}</span>
                              </div>
                            </div>
                            
                            {/* Bottom row / Actions */}
                            <div className="mt-auto pt-4 border-t border-zinc-100 dark:border-zinc-800/50 flex justify-between items-center">
                              <div className="text-[10px] text-zinc-400">
                                {v.recipient_name && <span>Untuk <strong>{v.recipient_name}</strong></span>}
                                {v.recipient_name && v.buyer_name && <span> · </span>}
                                {v.buyer_name && <span>Dari <strong>{v.buyer_name}</strong></span>}
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button onClick={() => {
                                  if (isEvent) {
                                    setKuponForm({
                                      title: v.name,
                                      item: parsedDesc.event_item || '',
                                      qrUrl: parsedDesc.qr_url || '',
                                      instagram: parsedDesc.instagram || '',
                                      whatsapp: parsedDesc.whatsapp || '',
                                      threads: parsedDesc.tiktok || parsedDesc.threads || '',
                                      website: parsedDesc.website || '',
                                      bgColor: '#FAF6EF',
                                      quantity: 12,
                                      couponWidth: 140,
                                      canvasWidth: 1200,
                                      showInstagram: !!parsedDesc.instagram,
                                      showWhatsapp: !!parsedDesc.whatsapp,
                                      showThreads: !!(parsedDesc.tiktok || parsedDesc.threads),
                                      showWebsite: !!parsedDesc.website,
                                      terms1: parsedDesc.terms1 || 'Hanya berlaku di booth event SerenaRaga.',
                                      terms2: parsedDesc.terms2 || 'Wajib follow Instagram @serena.raga & TikTok @serena.raga.',
                                      terms3: parsedDesc.terms3 || 'Voucher tidak dapat diuangkan dan hanya dapat digunakan 1 kali.',
                                    });
                                    setTab('kupon_generator');
                                  } else {
                                    router.push(`/admin/feed-studio-v2?mode=voucher&code=${encodeURIComponent(v.code)}&value=${encodeURIComponent(v.value)}&valueType=${encodeURIComponent(v.value_type)}&name=${encodeURIComponent(v.name)}&to=${encodeURIComponent(v.recipient_name || '')}&from=${encodeURIComponent(v.buyer_name || '')}&exp=${encodeURIComponent(v.valid_to || '')}&tagline=${encodeURIComponent(v.description || '')}`);
                                  }
                                }} className="p-2 rounded-lg bg-zinc-50 hover:bg-earth-primary/10 text-zinc-500 hover:text-earth-primary transition-colors" title={isEvent ? "Desain Kupon" : "Desain di Studio"}>
                                  <Palette size={14} />
                                </button>
                                {status === 'active' && (
                                  <button onClick={() => handleRevoke(v.id)} className="p-2 rounded-lg bg-zinc-50 hover:bg-zinc-200 text-zinc-400 hover:text-zinc-600 transition-colors" title="Nonaktifkan">
                                    <Ban size={14} />
                                  </button>
                                )}
                                <button onClick={() => handleDelete(v.id)} className="p-2 rounded-lg bg-zinc-50 hover:bg-red-50 text-zinc-400 hover:text-red-500 transition-colors" title="Hapus Permanen">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* TAB: CREATE SINGLE */}
        {tab === 'create' && (
          <motion.div key="create" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-3xl mx-auto">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 rounded-3xl p-8 shadow-sm">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">Buat Voucher Satuan</h2>

              {/* Voucher Type Toggle */}
              <div className="flex gap-2 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-2xl w-max mb-6">
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, voucherType: 'discount' }))}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${form.voucherType !== 'event' ? 'bg-white dark:bg-zinc-900 text-earth-primary shadow-sm' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'}`}
                >
                  Diskon Booking
                </button>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, voucherType: 'event' }))}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${form.voucherType === 'event' ? 'bg-white dark:bg-zinc-900 text-earth-primary shadow-sm' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'}`}
                >
                  Penukaran Event
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Nama Voucher / Promo</label>
                    <input className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-earth-primary/30 outline-none transition-all" placeholder={form.voucherType === 'event' ? 'Cth: Free Kaos Event JCC' : 'Misal: Gift Postnatal, Promo Lebaran...'} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex justify-between">
                      Kode Unik
                      <button onClick={() => setForm(f => ({ ...f, code: `SRAGA-${genCode(4)}` }))} className="text-earth-primary hover:underline text-[10px] flex items-center gap-1"><RefreshCw size={10} /> Generate</button>
                    </label>
                    <input className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm font-mono tracking-widest uppercase focus:ring-2 focus:ring-earth-primary/30 outline-none transition-all" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} />
                  </div>
                </div>

                {form.voucherType === 'event' ? (
                  /* Event Redemption Configuration */
                  <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-5 border border-zinc-100 dark:border-zinc-800 space-y-5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Detail Penukaran Event</h3>
                    
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-600">Nama Barang / Produk Penukaran *</label>
                      <input className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-earth-primary" placeholder="Cth: 1x Kaos Merchandise, Free Matcha Latte..." value={form.eventItem} onChange={e => setForm(f => ({ ...f, eventItem: e.target.value }))} />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-600">Link QR Code (Follow / Claim) *</label>
                      <input className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-earth-primary" placeholder="Cth: https://instagram.com/serena.raga" value={form.qrUrl} onChange={e => setForm(f => ({ ...f, qrUrl: e.target.value }))} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-600">Instagram Handle</label>
                        <input className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-earth-primary" placeholder="@serena.raga" value={form.instagram} onChange={e => setForm(f => ({ ...f, instagram: e.target.value }))} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-600">TikTok Handle</label>
                        <input className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-earth-primary" placeholder="@serena.raga" value={form.tiktok} onChange={e => setForm(f => ({ ...f, tiktok: e.target.value }))} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-600">WhatsApp Kontak</label>
                        <input className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-earth-primary" placeholder="0895-1835-9037" value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-600">Website / Linktree</label>
                        <input className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-earth-primary" placeholder="serenaraga.fit" value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Standard Value Configuration */
                  <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-5 border border-zinc-100 dark:border-zinc-800 space-y-5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Nilai & Layanan</h3>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-600">Pilih Layanan Spesifik (Opsional)</label>
                      <select className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-earth-primary transition-colors" value={form.serviceId} onChange={e => setForm(f => ({ ...f, serviceId: e.target.value }))}>
                        <option value="">— Bisa dipakai untuk layanan apapun —</option>
                        {services.map(s => <option key={s.id} value={s.id}>{s.name} ({fmtRp(s.price)})</option>)}
                      </select>
                    </div>
                    
                    {form.serviceId && (
                      <label className="flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-300 cursor-pointer p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
                        <input type="checkbox" className="w-4 h-4 rounded text-earth-primary focus:ring-earth-primary border-zinc-300" checked={form.useServicePrice} onChange={e => setForm(f => ({ ...f, useServicePrice: e.target.checked }))} />
                        <span className="font-medium">Samakan nilai voucher dengan harga layanan ({fmtRp(selectedService?.price ?? 0)})</span>
                      </label>
                    )}
                    
                    {(!form.useServicePrice || !form.serviceId) && (
                      <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-zinc-600">Tipe Nilai</label>
                          <select className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm outline-none" value={form.valueType} onChange={e => setForm(f => ({ ...f, valueType: e.target.value as 'flat' | 'percentage' }))}>
                            <option value="flat">Nominal Rupiah (Rp)</option>
                            <option value="percentage">Persentase (%)</option>
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-zinc-600">{form.valueType === 'flat' ? 'Jumlah (Rp)' : 'Diskon (%)'}</label>
                          <input type="number" className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm font-mono outline-none focus:border-earth-primary" value={form.customValue || ''} onChange={e => setForm(f => ({ ...f, customValue: Number(e.target.value) }))} />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Usage Limits */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Maksimal Pemakaian</label>
                    <input type="number" min={1} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm font-mono outline-none" value={form.maxUses} onChange={e => setForm(f => ({ ...f, maxUses: Number(e.target.value) }))} />
                    <p className="text-[10px] text-zinc-400">Isi 1 untuk sekali pakai.</p>
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500 mt-1 cursor-pointer">
                      <input type="checkbox" className="rounded" checked={form.useExpiry} onChange={e => setForm(f => ({ ...f, useExpiry: e.target.checked }))} />
                      Batas Masa Berlaku
                    </label>
                    {form.useExpiry ? (
                      <input type="date" className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm outline-none" value={form.expiryDate} onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))} />
                    ) : (
                      <div className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-400 flex items-center justify-center">
                        Berlaku Seumur Hidup
                      </div>
                    )}
                  </div>
                </div>

                {/* Gift Details */}
                {form.voucherType !== 'event' && (
                  <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-5 border border-zinc-100 dark:border-zinc-800">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-4">Informasi Pembeli / Penerima (Opsional)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-600">Penerima Voucher</label>
                        <input className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm outline-none" placeholder="Cth: Budi" value={form.recipientName} onChange={e => setForm(f => ({ ...f, recipientName: e.target.value }))} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-600">Pembeli</label>
                        <input className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm outline-none" placeholder="Cth: Wati" value={form.buyerName} onChange={e => setForm(f => ({ ...f, buyerName: e.target.value }))} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-600">Harga Dibayar (Rp) <span className="font-normal text-zinc-400 text-[10px] ml-1">Jika beli untuk orang lain</span></label>
                      <input type="number" className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm font-mono outline-none" value={form.amountPaid || ''} onChange={e => setForm(f => ({ ...f, amountPaid: Number(e.target.value) }))} />
                    </div>
                    
                    <div className="space-y-1.5 md:col-span-2 mt-2">
                      <label className="text-xs font-medium text-zinc-600">Tagline / Pesan Singkat (Maks. 130 karakter)</label>
                      <textarea maxLength={130} className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm outline-none resize-none" rows={2} placeholder="Cth: Apresiasi untuk tubuhmu yang sudah lelah beraktivitas hari ini. Voucher Relaksasi Rp20.000 dari SerenaRaga." value={form.tagline} onChange={e => setForm(f => ({ ...f, tagline: e.target.value }))} />
                    </div>
                  </div>
                )}

                {/* Terms Details */}
                <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-5 border border-zinc-100 dark:border-zinc-800">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-4">Syarat & Ketentuan (Ditampilkan di PDF)</h3>
                  <div className="space-y-3">
                    <div className="flex gap-3 items-center">
                      <span className="text-zinc-400 text-xs font-mono shrink-0">1.</span>
                      <input className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2 text-xs outline-none" value={form.terms1} onChange={e => setForm(f => ({ ...f, terms1: e.target.value }))} />
                    </div>
                    <div className="flex gap-3 items-center">
                      <span className="text-zinc-400 text-xs font-mono shrink-0">2.</span>
                      <input className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2 text-xs outline-none" value={form.terms2} onChange={e => setForm(f => ({ ...f, terms2: e.target.value }))} />
                    </div>
                    <div className="flex gap-3 items-center">
                      <span className="text-zinc-400 text-xs font-mono shrink-0">3.</span>
                      <input className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2 text-xs outline-none" value={form.terms3} onChange={e => setForm(f => ({ ...f, terms3: e.target.value }))} />
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800">
                  <div className="text-sm">
                    {form.voucherType === 'event' ? (
                      <span className="text-zinc-500">Penukaran: <strong className="text-earth-primary text-base">{form.eventItem || 'Item belum diisi'}</strong></span>
                    ) : (
                      <>
                        <span className="text-zinc-500">Nilai Final: </span>
                        <strong className="text-earth-primary font-mono text-lg">{form.valueType === 'flat' ? fmtRp(voucherValue) : `${voucherValue}%`}</strong>
                      </>
                    )}
                  </div>
                  <button onClick={handleCreate} disabled={saving || !form.name || !form.code || (form.voucherType === 'event' ? !form.eventItem : voucherValue <= 0)} className="bg-earth-primary text-white px-8 py-3.5 rounded-xl font-bold tracking-wide hover:shadow-lg hover:shadow-earth-primary/30 transition-all disabled:opacity-50 disabled:shadow-none flex items-center gap-2">
                    {saving ? <Loader2 size={18} className="animate-spin" /> : <Gift size={18} />}
                    Simpan & Terbitkan
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {tab === 'bulk' && (
          <motion.div key="bulk" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-3xl mx-auto">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 rounded-3xl p-8 shadow-sm">
              
              <div className="mb-8 bg-earth-primary/5 border border-earth-primary/20 rounded-2xl p-5 flex gap-4 items-start">
                <div className="p-3 bg-earth-primary/10 rounded-full text-earth-primary shrink-0">
                  <Layers size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-earth-400 mb-1">Generate Voucher Massal (Bulk)</h2>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    Fitur ini akan men-generate puluhan atau ratusan kode voucher unik sekaligus. Cocok untuk event marketing offline, pembagian pamflet, atau bundling. 
                    Setiap kode yang di-generate hanya bisa dipakai sesuai batas pemakaian.
                  </p>
                </div>
              </div>

              {/* Voucher Type Toggle */}
              <div className="flex gap-2 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-2xl w-max mb-6">
                <button
                  type="button"
                  onClick={() => setBulkForm(f => ({ ...f, voucherType: 'discount' }))}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${bulkForm.voucherType !== 'event' ? 'bg-white dark:bg-zinc-900 text-earth-primary shadow-sm' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'}`}
                >
                  Diskon Booking
                </button>
                <button
                  type="button"
                  onClick={() => setBulkForm(f => ({ ...f, voucherType: 'event' }))}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${bulkForm.voucherType === 'event' ? 'bg-white dark:bg-zinc-900 text-earth-primary shadow-sm' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'}`}
                >
                  Penukaran Event
                </button>
              </div>
              
              <div className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Nama Batch (Sistem) *</label>
                    <input className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-earth-primary/30 outline-none transition-all" placeholder="Cth: Bazar JCC Hari 1" value={bulkForm.batchName} onChange={e => setBulkForm(f => ({ ...f, batchName: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Nama Voucher (Fisik) *</label>
                    <input className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-earth-primary/30 outline-none transition-all" placeholder="Cth: Voucher Relaksasi" value={bulkForm.name} onChange={e => setBulkForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Prefix Kode Voucher</label>
                    <input className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm font-mono uppercase focus:ring-2 focus:ring-earth-primary/30 outline-none transition-all" value={bulkForm.prefix} onChange={e => setBulkForm(f => ({ ...f, prefix: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') }))} />
                    <p className="text-[10px] text-zinc-400 font-mono">Hasil: {bulkForm.prefix || 'SRAGA'}-XXXXXX</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Jumlah Voucher</label>
                    <input type="number" min={1} max={500} className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm font-bold text-earth-primary font-mono outline-none focus:border-earth-primary" value={bulkForm.quantity} onChange={e => setBulkForm(f => ({ ...f, quantity: Number(e.target.value) }))} />
                    <p className="text-[10px] text-zinc-400">Max 500 per generate</p>
                  </div>
                </div>

                {bulkForm.voucherType === 'event' ? (
                  /* Bulk Event Details */
                  <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-5 border border-zinc-100 dark:border-zinc-800 space-y-5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Detail Penukaran Event</h3>
                    
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-600">Nama Barang / Produk Penukaran *</label>
                      <input className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-earth-primary" placeholder="Cth: 1x Kaos Merchandise, Free Matcha Latte..." value={bulkForm.eventItem} onChange={e => setBulkForm(f => ({ ...f, eventItem: e.target.value }))} />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-600">Link QR Code (Follow / Claim) *</label>
                      <input className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-earth-primary" placeholder="Cth: https://instagram.com/serena.raga" value={bulkForm.qrUrl} onChange={e => setBulkForm(f => ({ ...f, qrUrl: e.target.value }))} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-600">Instagram Handle</label>
                        <input className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-earth-primary" placeholder="@serena.raga" value={bulkForm.instagram} onChange={e => setBulkForm(f => ({ ...f, instagram: e.target.value }))} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-600">TikTok Handle</label>
                        <input className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-earth-primary" placeholder="@serena.raga" value={bulkForm.tiktok} onChange={e => setBulkForm(f => ({ ...f, tiktok: e.target.value }))} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-600">WhatsApp Kontak</label>
                        <input className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-earth-primary" placeholder="0895-1835-9037" value={bulkForm.whatsapp} onChange={e => setBulkForm(f => ({ ...f, whatsapp: e.target.value }))} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-600">Website / Linktree</label>
                        <input className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-earth-primary" placeholder="serenaraga.fit" value={bulkForm.website} onChange={e => setBulkForm(f => ({ ...f, website: e.target.value }))} />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Standard Discount Configuration */
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Tipe Diskon</label>
                      <select className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm outline-none" value={bulkForm.valueType} onChange={e => setBulkForm(f => ({ ...f, valueType: e.target.value as 'flat' | 'percentage' }))}>
                        <option value="flat">Nominal (Rp)</option>
                        <option value="percentage">Persentase (%)</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Besar Nilai</label>
                      <input type="number" className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm font-mono outline-none focus:border-earth-primary" value={bulkForm.customValue || ''} onChange={e => setBulkForm(f => ({ ...f, customValue: Number(e.target.value) }))} />
                    </div>
                  </div>
                )}

                <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-5 border border-zinc-100 dark:border-zinc-800 grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-600">Batas Pakai Per Voucher</label>
                    <input type="number" min={1} className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm font-mono outline-none" value={bulkForm.maxUses} onChange={e => setBulkForm(f => ({ ...f, maxUses: Number(e.target.value) }))} />
                    <p className="text-[10px] text-zinc-400">Umumnya 1x pakai untuk event.</p>
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs font-medium text-zinc-600 cursor-pointer">
                      <input type="checkbox" className="rounded" checked={bulkForm.useExpiry} onChange={e => setBulkForm(f => ({ ...f, useExpiry: e.target.checked }))} />
                      Tentukan Tanggal Kedaluwarsa
                    </label>
                    {bulkForm.useExpiry ? (
                      <input type="date" className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm outline-none" value={bulkForm.expiryDate} onChange={e => setBulkForm(f => ({ ...f, expiryDate: e.target.value }))} />
                    ) : (
                      <div className="w-full bg-white/50 dark:bg-zinc-800/30 border border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-400 flex items-center justify-center">
                        Tidak ada kadaluwarsa
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-1.5 md:col-span-2 mt-2">
                    <label className="text-xs font-medium text-zinc-600">Tagline / Pesan Singkat (Maks. 130 karakter)</label>
                    <textarea maxLength={130} className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm outline-none resize-none" rows={2} placeholder="Cth: Apresiasi untuk tubuhmu yang sudah lelah beraktivitas hari ini. Voucher Relaksasi Rp20.000 dari SerenaRaga." value={bulkForm.tagline} onChange={e => setBulkForm(f => ({ ...f, tagline: e.target.value }))} />
                  </div>
                </div>

                {/* Terms Details */}
                <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-5 border border-zinc-100 dark:border-zinc-800">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-4">Syarat & Ketentuan (Ditampilkan di PDF)</h3>
                  <div className="space-y-3">
                    <div className="flex gap-3 items-center">
                      <span className="text-zinc-400 text-xs font-mono shrink-0">1.</span>
                      <input className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2 text-xs outline-none" value={bulkForm.terms1} onChange={e => setBulkForm(f => ({ ...f, terms1: e.target.value }))} />
                    </div>
                    <div className="flex gap-3 items-center">
                      <span className="text-zinc-400 text-xs font-mono shrink-0">2.</span>
                      <input className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2 text-xs outline-none" value={bulkForm.terms2} onChange={e => setBulkForm(f => ({ ...f, terms2: e.target.value }))} />
                    </div>
                    <div className="flex gap-3 items-center">
                      <span className="text-zinc-400 text-xs font-mono shrink-0">3.</span>
                      <input className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2 text-xs outline-none" value={bulkForm.terms3} onChange={e => setBulkForm(f => ({ ...f, terms3: e.target.value }))} />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                  <div className="text-sm">
                    {bulkForm.voucherType === 'event' ? (
                      <span className="text-zinc-500">Penukaran: <strong className="text-earth-primary text-base">{bulkForm.eventItem || 'Item belum diisi'}</strong></span>
                    ) : (
                      <span className="text-zinc-500">Nilai: <strong className="text-earth-primary font-mono text-base">{bulkForm.valueType === 'flat' ? fmtRp(bulkForm.customValue) : `${bulkForm.customValue}%`}</strong></span>
                    )}
                  </div>
                  <button onClick={handleCreateBulk} disabled={saving || !bulkForm.batchName || !bulkForm.name || !bulkForm.prefix || bulkForm.quantity < 1 || (bulkForm.voucherType === 'event' ? !bulkForm.eventItem : bulkForm.customValue <= 0)} className="w-full md:w-auto bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-10 py-4 rounded-xl font-bold tracking-wide hover:shadow-xl transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-3">
                    {saving ? <Loader2 size={18} className="animate-spin" /> : <Layers size={18} />}
                    Generate {bulkForm.quantity} Voucher
                  </button>
                </div>

              </div>
            </div>
          </motion.div>
        )}

        {tab === 'kupon_generator' && (
          <motion.div key="kupon_generator" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT COLUMN: Controls Form (5 cols) */}
            <div className="lg:col-span-5 bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-6">
              <div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-1">Kupon Generator</h2>
                <p className="text-xs text-zinc-500">Kustomisasi voucher offline Anda secara real-time dan unduh hasilnya.</p>
              </div>

              {/* Logo Customization */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">Logo Kupon</label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-2 overflow-hidden shrink-0">
                    {customLogo ? (
                      <img src={customLogo} alt="Custom Logo" className="w-full h-full object-contain" />
                    ) : (
                      <img src="/serenalogo2.svg" alt="Default Logo" className="w-full h-full object-contain brightness-0 dark:brightness-0 dark:invert" />
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="cursor-pointer bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-bold py-2.5 px-4 rounded-xl shadow transition-all block text-center">
                      Upload Logo
                      <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                    </label>
                    {customLogo && (
                      <button onClick={() => setCustomLogo(null)} className="text-[10px] font-bold text-red-500 hover:underline text-left">
                        Hapus Logo Custom
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Fields */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Judul Kupon</label>
                  <input
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-earth-primary/30 outline-none transition-all"
                    placeholder="VOUCHER PENUKARAN"
                    value={kuponForm.title}
                    onChange={e => setKuponForm(f => ({ ...f, title: e.target.value }))}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Detail Penukaran / Barang</label>
                  <input
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-earth-primary/30 outline-none transition-all font-medium"
                    placeholder="1x Merchandise"
                    value={kuponForm.item}
                    onChange={e => setKuponForm(f => ({ ...f, item: e.target.value }))}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Link QR Code</label>
                  <input
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-earth-primary/30 outline-none transition-all font-mono"
                    placeholder="https://..."
                    value={kuponForm.qrUrl}
                    onChange={e => setKuponForm(f => ({ ...f, qrUrl: e.target.value }))}
                  />
                </div>

                <div className="space-y-4 border-t border-zinc-100 dark:border-zinc-800 pt-4">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">Saluran Sosial Media</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Instagram */}
                    <div className="space-y-1.5 bg-zinc-50 dark:bg-zinc-800/30 p-3 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Instagram</span>
                        <label className="flex items-center gap-1.5 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            className="rounded text-earth-primary focus:ring-earth-primary"
                            checked={kuponForm.showInstagram}
                            onChange={e => setKuponForm(f => ({ ...f, showInstagram: e.target.checked }))}
                          />
                          <span className="text-[10px] font-bold text-zinc-400 uppercase">Tampil</span>
                        </label>
                      </div>
                      <input
                        className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-earth-primary/30 outline-none transition-all disabled:opacity-50"
                        placeholder="@serena.raga"
                        disabled={!kuponForm.showInstagram}
                        value={kuponForm.instagram}
                        onChange={e => setKuponForm(f => ({ ...f, instagram: e.target.value }))}
                      />
                    </div>

                    {/* WhatsApp */}
                    <div className="space-y-1.5 bg-zinc-50 dark:bg-zinc-800/30 p-3 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">WhatsApp</span>
                        <label className="flex items-center gap-1.5 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            className="rounded text-earth-primary focus:ring-earth-primary"
                            checked={kuponForm.showWhatsapp}
                            onChange={e => setKuponForm(f => ({ ...f, showWhatsapp: e.target.checked }))}
                          />
                          <span className="text-[10px] font-bold text-zinc-400 uppercase">Tampil</span>
                        </label>
                      </div>
                      <input
                        className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-earth-primary/30 outline-none transition-all disabled:opacity-50"
                        placeholder="0895-..."
                        disabled={!kuponForm.showWhatsapp}
                        value={kuponForm.whatsapp}
                        onChange={e => setKuponForm(f => ({ ...f, whatsapp: e.target.value }))}
                      />
                    </div>

                    {/* Threads */}
                    <div className="space-y-1.5 bg-zinc-50 dark:bg-zinc-800/30 p-3 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Threads</span>
                        <label className="flex items-center gap-1.5 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            className="rounded text-earth-primary focus:ring-earth-primary"
                            checked={kuponForm.showThreads}
                            onChange={e => setKuponForm(f => ({ ...f, showThreads: e.target.checked }))}
                          />
                          <span className="text-[10px] font-bold text-zinc-400 uppercase">Tampil</span>
                        </label>
                      </div>
                      <input
                        className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-earth-primary/30 outline-none transition-all disabled:opacity-50"
                        placeholder="@serena.raga"
                        disabled={!kuponForm.showThreads}
                        value={kuponForm.threads}
                        onChange={e => setKuponForm(f => ({ ...f, threads: e.target.value }))}
                      />
                    </div>

                    {/* Website */}
                    <div className="space-y-1.5 bg-zinc-50 dark:bg-zinc-800/30 p-3 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Website</span>
                        <label className="flex items-center gap-1.5 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            className="rounded text-earth-primary focus:ring-earth-primary"
                            checked={kuponForm.showWebsite}
                            onChange={e => setKuponForm(f => ({ ...f, showWebsite: e.target.checked }))}
                          />
                          <span className="text-[10px] font-bold text-zinc-400 uppercase">Tampil</span>
                        </label>
                      </div>
                      <input
                        className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-earth-primary/30 outline-none transition-all disabled:opacity-50"
                        placeholder="serenaraga.fit"
                        disabled={!kuponForm.showWebsite}
                        value={kuponForm.website}
                        onChange={e => setKuponForm(f => ({ ...f, website: e.target.value }))}
                      />
                    </div>

                  </div>
                </div>

                {/* Terms & Conditions Inputs */}
                <div className="space-y-3 border-t border-zinc-100 dark:border-zinc-800 pt-4">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">Syarat & Ketentuan Kupon</label>
                  <div className="space-y-2">
                    <div className="flex gap-2 items-center">
                      <span className="text-xs font-mono font-bold text-zinc-400 w-4 text-right">1.</span>
                      <input
                        className="flex-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-earth-primary/20 transition-all"
                        placeholder="Syarat ke-1"
                        value={kuponForm.terms1}
                        onChange={e => setKuponForm(f => ({ ...f, terms1: e.target.value }))}
                      />
                    </div>
                    <div className="flex gap-2 items-center">
                      <span className="text-xs font-mono font-bold text-zinc-400 w-4 text-right">2.</span>
                      <input
                        className="flex-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-earth-primary/20 transition-all"
                        placeholder="Syarat ke-2 (Opsional)"
                        value={kuponForm.terms2}
                        onChange={e => setKuponForm(f => ({ ...f, terms2: e.target.value }))}
                      />
                    </div>
                    <div className="flex gap-2 items-center">
                      <span className="text-xs font-mono font-bold text-zinc-400 w-4 text-right">3.</span>
                      <input
                        className="flex-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-earth-primary/20 transition-all"
                        placeholder="Syarat ke-3 (Opsional)"
                        value={kuponForm.terms3}
                        onChange={e => setKuponForm(f => ({ ...f, terms3: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Background Color Swatches */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">Pilihan Warna Latar</label>
                <div className="flex flex-wrap gap-2.5">
                  {[
                    { hex: '#FAF6EF', name: 'Bone Cream' },
                    { hex: '#E6D7C3', name: 'Warm Sand' },
                    { hex: '#C2C5BA', name: 'Muted Sage' },
                    { hex: '#D2A888', name: 'Tuscan Soil' },
                    { hex: '#321B0F', name: 'Espresso' },
                    { hex: '#2B2927', name: 'Charcoal' }
                  ].map(c => {
                    const isActive = kuponForm.bgColor.toUpperCase() === c.hex.toUpperCase();
                    return (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setKuponForm(f => ({ ...f, bgColor: c.hex }))}
                        className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all ${isActive ? 'ring-2 ring-earth-primary border-transparent scale-110 shadow-md' : 'border-zinc-200 dark:border-zinc-700 hover:scale-105'}`}
                        style={{ backgroundColor: c.hex }}
                        title={c.name}
                      >
                        {isActive && (
                          <Check size={14} className={['#321B0F', '#2B2927'].includes(c.hex.toUpperCase()) ? 'text-white' : 'text-stone-900'} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Proporsi Desain Kanvas */}
              <div className="space-y-2.5 border-t border-zinc-100 dark:border-zinc-800 pt-4">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Lebar Desain Kanvas (Horizontal)</label>
                  <span className="text-xs font-mono font-bold text-earth-primary">{kuponForm.canvasWidth || 1200} px</span>
                </div>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min={900}
                    max={1600}
                    step={50}
                    className="flex-1 accent-earth-primary h-1.5 bg-zinc-200 dark:bg-zinc-850 rounded-lg appearance-none cursor-pointer"
                    value={kuponForm.canvasWidth || 1200}
                    onChange={e => setKuponForm(f => ({ ...f, canvasWidth: Number(e.target.value) }))}
                  />
                  <input
                    type="number"
                    min={900}
                    max={1600}
                    className="w-16 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-2 py-1.5 text-xs text-center font-mono font-bold focus:ring-2 focus:ring-earth-primary/30 outline-none"
                    value={kuponForm.canvasWidth || 1200}
                    onChange={e => setKuponForm(f => ({ ...f, canvasWidth: Math.max(900, Math.min(1600, Number(e.target.value))) }))}
                  />
                </div>
                <p className="text-[10px] text-zinc-400">Sesuaikan rasio panjang/pendek kupon. Tinggi desain tetap 520px.</p>
              </div>

              {/* Ukuran Cetak */}
              <div className="space-y-2.5 border-t border-zinc-100 dark:border-zinc-800 pt-4">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Target Lebar Kupon</label>
                  <span className="text-xs font-mono font-bold text-earth-primary">{targetWidth} mm</span>
                </div>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min={80}
                    max={200}
                    step={5}
                    className="flex-1 accent-earth-primary h-1.5 bg-zinc-200 dark:bg-zinc-850 rounded-lg appearance-none cursor-pointer"
                    value={targetWidth}
                    onChange={e => setKuponForm(f => ({ ...f, couponWidth: Number(e.target.value) }))}
                  />
                  <input
                    type="number"
                    min={80}
                    max={200}
                    className="w-16 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-2 py-1.5 text-xs text-center font-mono font-bold focus:ring-2 focus:ring-earth-primary/30 outline-none"
                    value={targetWidth}
                    onChange={e => setKuponForm(f => ({ ...f, couponWidth: Math.max(80, Math.min(200, Number(e.target.value))) }))}
                  />
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-900/40 rounded-2xl p-3 border border-zinc-100 dark:border-zinc-850/50 text-[11px] text-zinc-500 dark:text-zinc-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Dimensi Cetak:</span>
                    <strong className="text-zinc-700 dark:text-zinc-300 font-mono">{Math.round(printWidth)} x {Math.round(printHeight)} mm</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Orientasi Kertas:</span>
                    <strong className="text-zinc-700 dark:text-zinc-300 capitalize">{isLandscape ? 'Landscape (Mendatar)' : 'Portrait (Tegak)'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Tata Letak A3:</span>
                    <strong className="text-zinc-700 dark:text-zinc-300 font-medium">{cols} kolom × {rows} baris</strong>
                  </div>
                  <div className="flex justify-between border-t border-zinc-200/50 dark:border-zinc-800/80 pt-1 mt-1 font-semibold">
                    <span>Kapasitas per Lembar:</span>
                    <strong className="text-earth-primary">{maxPerPage} kupon</strong>
                  </div>
                </div>
              </div>

              {/* Quantity */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">Jumlah Cetak PDF (Grid A3)</label>
                <input
                  type="number"
                  min={1}
                  max={200}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm font-mono font-bold text-earth-primary"
                  value={kuponForm.quantity}
                  onChange={e => setKuponForm(f => ({ ...f, quantity: Math.max(1, Number(e.target.value)) }))}
                />
                <p className="text-[10px] text-zinc-400">Setiap halaman A3 memuat maksimal {maxPerPage} kupon ({cols}x{rows} per lembar).</p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleDownloadKuponImage}
                  disabled={isDownloadingKuponImage}
                  className="flex-1 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 py-3.5 rounded-xl text-xs font-bold tracking-wide transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {isDownloadingKuponImage ? <Loader2 size={14} className="animate-spin" /> : <Palette size={14} />}
                  Unduh JPG
                </button>
                <button
                  type="button"
                  onClick={handleGenerateKuponPDF}
                  disabled={isGeneratingKuponPDF}
                  className="flex-1 bg-earth-primary text-white py-3.5 rounded-xl text-xs font-bold tracking-wide shadow-lg shadow-earth-primary/20 hover:shadow-xl hover:shadow-earth-primary/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {isGeneratingKuponPDF ? <Loader2 size={14} className="animate-spin" /> : <Printer size={14} />}
                  Cetak PDF A3
                </button>
              </div>
            </div>

            {/* RIGHT COLUMN: Interactive Live Preview (7 cols) */}
            <div className="lg:col-span-7 flex flex-col items-center justify-center gap-6">
              <div className="w-full text-center">
                <span className="text-[11px] font-bold tracking-widest uppercase bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-3 py-1 rounded-full border border-zinc-200/50 dark:border-zinc-700/50">
                  Pratinjau Hasil Desain
                </span>
              </div>
              
              {/* Scaled Coupon Frame */}
              <div 
                className="w-[660px] overflow-hidden relative border border-zinc-200/80 dark:border-zinc-800/80 rounded-[2.5rem] shadow-2xl bg-zinc-50 dark:bg-zinc-950 shrink-0"
                style={{ height: `${previewFrameHeight}px` }}
              >
                <div style={{ width: `${previewCanvasWidth}px`, height: '520px', transform: `scale(${previewScale})`, transformOrigin: 'top left' }} className="absolute top-0 left-0">
                  
                  {/* Inside the real canvas */}
                  <div
                    ref={kuponCanvasRef}
                    className="flex text-left relative overflow-hidden"
                    style={{ width: `${previewCanvasWidth}px`, height: '520px', backgroundColor: kuponForm.bgColor }}
                  >
                    {/* Background filters and noise */}
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px] z-0" />
                    
                    {/* Content */}
                    <div className="relative z-10 w-full h-full flex p-20 gap-16 items-center justify-between">
                      {/* Left: Branding & Info */}
                      <div className="flex flex-col justify-between h-full w-[50%] flex-shrink-0">
                        {/* Logo rendering */}
                        <div className="flex flex-col items-start justify-center h-[80px]">
                          {customLogo ? (
                            <img src={customLogo} alt="Custom Logo" className="h-[80px] w-auto max-w-[240px] object-contain" />
                          ) : (
                            <div className="relative w-[220px] h-[60px] overflow-hidden">
                              <img
                                src="/serenalogo2.svg"
                                className={`absolute top-1/2 -left-2 -translate-y-1/2 h-[150px] w-auto max-w-none object-contain ${
                                  ['#FAF6EF', '#E6D7C3', '#C2C5BA', '#D2A888'].includes(kuponForm.bgColor.toUpperCase())
                                    ? 'brightness-0'
                                    : 'brightness-0 invert'
                                } opacity-95`}
                              />
                            </div>
                          )}
                        </div>

                        {/* Title & Offer */}
                        <div className="flex flex-col items-start gap-3 my-auto">
                          <h2 className={`text-[12px] font-bold tracking-[0.25em] uppercase m-0 ${
                            ['#FAF6EF', '#E6D7C3', '#C2C5BA', '#D2A888'].includes(kuponForm.bgColor.toUpperCase())
                              ? 'text-stone-500/80'
                              : 'text-[#FAF6EF]/60'
                          }`}>
                            {kuponForm.title || 'VOUCHER PENUKARAN'}
                          </h2>
                          <h1 className={`text-[46px] font-serif font-normal italic tracking-wide m-0 leading-tight ${
                            ['#FAF6EF', '#E6D7C3', '#C2C5BA', '#D2A888'].includes(kuponForm.bgColor.toUpperCase())
                              ? 'text-stone-900'
                              : 'text-stone-50'
                          }`}>
                            {kuponForm.item || '1x Merchandise'}
                          </h1>
                        </div>

                        {/* Terms & Conditions */}
                        {(kuponForm.terms1 || kuponForm.terms2 || kuponForm.terms3) && (
                          <div className={`mt-auto pt-3.5 border-t border-dashed flex flex-col gap-1.5 ${
                            ['#FAF6EF', '#E6D7C3', '#C2C5BA', '#D2A888'].includes(kuponForm.bgColor.toUpperCase())
                              ? 'border-stone-900/10 text-stone-600/80'
                              : 'border-white/10 text-[#FAF6EF]/60'
                          }`}>
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Syarat & Ketentuan:</span>
                            <div className="flex flex-col gap-1 text-[10px] leading-relaxed font-sans font-medium">
                              {kuponForm.terms1 && (
                                <div className="flex items-start gap-2">
                                  <span className="opacity-40 select-none">•</span>
                                  <span>{kuponForm.terms1}</span>
                                </div>
                              )}
                              {kuponForm.terms2 && (
                                <div className="flex items-start gap-2">
                                  <span className="opacity-40 select-none">•</span>
                                  <span>{kuponForm.terms2}</span>
                                </div>
                              )}
                              {kuponForm.terms3 && (
                                <div className="flex items-start gap-2">
                                  <span className="opacity-40 select-none">•</span>
                                  <span>{kuponForm.terms3}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Divider */}
                      <div className={`w-[1px] h-[280px] ${
                        ['#FAF6EF', '#E6D7C3', '#C2C5BA', '#D2A888'].includes(kuponForm.bgColor.toUpperCase())
                          ? 'bg-stone-900/10'
                          : 'bg-white/10'
                      } flex-shrink-0`} />

                      {/* Right: QR & Social handles */}
                      <div className="w-[40%] flex-shrink-0 h-full flex flex-col items-center justify-center gap-3">
                        {/* QR Code */}
                        <div className="bg-white p-3.5 rounded-2xl shadow-sm flex items-center justify-center">
                          <QRCode
                            value={kuponForm.qrUrl || 'https://instagram.com/serena.raga'}
                            size={180}
                            style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
                            viewBox="0 0 256 256"
                          />
                        </div>
                        
                        {/* Left-aligned Social Handles */}
                        <div className="flex flex-col gap-2.5 mt-3 items-start justify-center">
                          {/* Instagram */}
                          {kuponForm.showInstagram && kuponForm.instagram && (
                            <div className={`flex items-center gap-2.5 text-[14px] font-sans font-bold tracking-wider ${
                              ['#FAF6EF', '#E6D7C3', '#C2C5BA', '#D2A888'].includes(kuponForm.bgColor.toUpperCase())
                                ? 'text-stone-900'
                                : 'text-stone-50'
                            } opacity-80`}>
                              <div className="shrink-0 flex items-center justify-center w-[18px]">
                                <InstagramIco size={14} />
                              </div>
                              <span>{kuponForm.instagram.toLowerCase()}</span>
                            </div>
                          )}

                          {/* WhatsApp */}
                          {kuponForm.showWhatsapp && kuponForm.whatsapp && (
                            <div className={`flex items-center gap-2.5 text-[14px] font-sans font-bold tracking-wider ${
                              ['#FAF6EF', '#E6D7C3', '#C2C5BA', '#D2A888'].includes(kuponForm.bgColor.toUpperCase())
                                ? 'text-stone-900'
                                : 'text-stone-50'
                            } opacity-80`}>
                              <div className="shrink-0 flex items-center justify-center w-[18px]">
                                <WAIco size={14} />
                              </div>
                              <span>{kuponForm.whatsapp}</span>
                            </div>
                          )}

                          {/* Threads */}
                          {kuponForm.showThreads && kuponForm.threads && (
                            <div className={`flex items-center gap-2.5 text-[14px] font-sans font-bold tracking-wider ${
                              ['#FAF6EF', '#E6D7C3', '#C2C5BA', '#D2A888'].includes(kuponForm.bgColor.toUpperCase())
                                ? 'text-stone-900'
                                : 'text-stone-50'
                            } opacity-80`}>
                              <div className="shrink-0 flex items-center justify-center w-[18px]">
                                <ThreadsIco size={14} />
                              </div>
                              <span>{kuponForm.threads.toLowerCase()}</span>
                            </div>
                          )}

                          {/* Website */}
                          {kuponForm.showWebsite && kuponForm.website && (
                            <div className={`flex items-center gap-2.5 text-[14px] font-sans font-bold tracking-wider ${
                              ['#FAF6EF', '#E6D7C3', '#C2C5BA', '#D2A888'].includes(kuponForm.bgColor.toUpperCase())
                                ? 'text-stone-900'
                                : 'text-stone-50'
                            } opacity-80`}>
                              <div className="shrink-0 flex items-center justify-center w-[18px]">
                                <Globe size={14} />
                              </div>
                              <span>{kuponForm.website.toLowerCase()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
