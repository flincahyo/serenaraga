'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Gift, Plus, Copy, Check, X, Loader2, Tag, Clock, Users, RefreshCw, Ban, Palette, Layers, ChevronRight, Printer, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { AdminSkeleton } from '@/components/admin/AdminSkeleton';
import { useUser } from '@/lib/user-context';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

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

  const [tab, setTab] = useState<'list' | 'create' | 'bulk'>('list');
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
    const value = voucherValue;
    const payload = {
      code: form.code.trim().toUpperCase(),
      name: form.name,
      type: 'manual',
      value_type: form.valueType,
      value,
      max_uses: form.maxUses,
      uses_count: 0,
      is_active: true,
      is_owner_borne: true,
      is_voucher: true,
      recipient_name: form.recipientName || null,
      buyer_name: form.buyerName || null,
      amount_paid: form.amountPaid || null,
      target_service: form.serviceId || null,
      valid_from: null,
      valid_to: form.useExpiry && form.expiryDate ? form.expiryDate : null,
      description: JSON.stringify({
        tagline: form.tagline,
        terms1: form.terms1,
        terms2: form.terms2,
        terms3: form.terms3,
      }),
    };
    const { data, error } = await supabase.from('discounts').insert(payload).select().single();
    if (!error && data) {
      setTab('list');
      fetchData();
      setForm(f => ({ ...f, code: `SRAGA-${genCode(4)}`, name: '', serviceId: '', customValue: 0, useServicePrice: true, valueType: 'flat', recipientName: '', buyerName: '', amountPaid: 0, maxUses: 1, useExpiry: false, expiryDate: '', tagline: '' }));
    }
    setSaving(false);
  };

  const handleCreateBulk = async () => {
    if (!bulkForm.batchName || !bulkForm.name || !bulkForm.prefix || bulkForm.quantity < 1 || bulkForm.customValue <= 0) return;
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
      value_type: bulkForm.valueType,
      value: bulkForm.customValue,
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
      }),
    }));

    const { error } = await supabase.from('discounts').insert(payload);
    if (!error) {
      setTab('list');
      fetchData();
      setBulkForm(f => ({ ...f, quantity: 100, prefix: 'SRAGA', batchName: '', name: '', customValue: 0, valueType: 'flat', maxUses: 1, useExpiry: false, expiryDate: '', tagline: '' }));
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
                        return (
                          <div key={name} className="group relative bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-earth-primary/5 rounded-bl-full -z-0" />
                            <div className="relative z-10 flex flex-col h-full">
                              <div className="flex justify-between items-start mb-4">
                                <h3 className="font-bold text-zinc-900 dark:text-white text-base leading-tight pr-4">{name}</h3>
                                <span className="bg-earth-primary/10 text-earth-primary text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider whitespace-nowrap">
                                  {batchVouchers.length} Codes
                                </span>
                              </div>
                              
                              <div className="space-y-2 mb-6">
                                <p className="text-xs text-zinc-500 flex items-center gap-2">
                                  <Tag size={12} className="text-zinc-400" />
                                  <span className="font-mono font-medium text-zinc-700 dark:text-zinc-300">
                                    {sample.value_type === 'flat' ? fmtRp(sample.value) : `${sample.value}%`}
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
                        return (
                          <div key={v.id} className={`bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col gap-4 ${status !== 'active' ? 'opacity-50 grayscale-[50%]' : ''}`}>
                            
                            {/* Top row */}
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h3 className="font-bold text-sm text-zinc-900 dark:text-white mb-1 line-clamp-1">{v.name}</h3>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${sc.cls}`}>
                                  {sc.label}
                                </span>
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
                                <span className="font-mono font-medium">{v.value_type === 'flat' ? fmtRp(v.value) : `${v.value}%`}</span>
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
                                <button onClick={() => router.push(`/admin/feed-studio-v2?mode=voucher&code=${encodeURIComponent(v.code)}&value=${encodeURIComponent(v.value)}&valueType=${encodeURIComponent(v.value_type)}&name=${encodeURIComponent(v.name)}&to=${encodeURIComponent(v.recipient_name || '')}&from=${encodeURIComponent(v.buyer_name || '')}&exp=${encodeURIComponent(v.valid_to || '')}&tagline=${encodeURIComponent(v.description || '')}`)} className="p-2 rounded-lg bg-zinc-50 hover:bg-earth-primary/10 text-zinc-500 hover:text-earth-primary transition-colors" title="Desain di Studio">
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
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-6">Buat Voucher Satuan</h2>
              
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Nama Voucher / Promo</label>
                    <input className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-earth-primary/30 outline-none transition-all" placeholder="Misal: Gift Postnatal, Promo Lebaran..." value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex justify-between">
                      Kode Unik
                      <button onClick={() => setForm(f => ({ ...f, code: `SRAGA-${genCode(4)}` }))} className="text-earth-primary hover:underline text-[10px] flex items-center gap-1"><RefreshCw size={10} /> Generate</button>
                    </label>
                    <input className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm font-mono tracking-widest uppercase focus:ring-2 focus:ring-earth-primary/30 outline-none transition-all" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} />
                  </div>
                </div>

                {/* Value Configuration */}
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
                    <span className="text-zinc-500">Nilai Final: </span>
                    <strong className="text-earth-primary font-mono text-lg">{form.valueType === 'flat' ? fmtRp(voucherValue) : `${voucherValue}%`}</strong>
                  </div>
                  <button onClick={handleCreate} disabled={saving || !form.name || voucherValue <= 0} className="bg-earth-primary text-white px-8 py-3.5 rounded-xl font-bold tracking-wide hover:shadow-lg hover:shadow-earth-primary/30 transition-all disabled:opacity-50 disabled:shadow-none flex items-center gap-2">
                    {saving ? <Loader2 size={18} className="animate-spin" /> : <Gift size={18} />}
                    Simpan & Terbitkan
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB: BULK GENERATE */}
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
              
              <div className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Nama Batch (Sistem) *</label>
                    <input className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-earth-primary/30 outline-none transition-all" placeholder="Cth: Bazar JCC Hari 1" value={bulkForm.batchName} onChange={e => setBulkForm(f => ({ ...f, batchName: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Nama Voucher (Fisik) *</label>
                    <input className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-earth-primary/30 outline-none transition-all" placeholder="Cth: Voucher Relaksasi" value={bulkForm.name} onChange={e => setBulkForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Prefix Kode Voucher</label>
                    <input className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm font-mono uppercase focus:ring-2 focus:ring-earth-primary/30 outline-none transition-all" value={bulkForm.prefix} onChange={e => setBulkForm(f => ({ ...f, prefix: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') }))} />
                    <p className="text-[10px] text-zinc-400 font-mono">Hasil: {bulkForm.prefix || 'SRAGA'}-XXXXXX</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Jumlah Voucher</label>
                    <input type="number" min={1} max={500} className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-lg font-bold text-earth-primary font-mono outline-none focus:border-earth-primary text-center" value={bulkForm.quantity} onChange={e => setBulkForm(f => ({ ...f, quantity: Number(e.target.value) }))} />
                    <p className="text-[10px] text-zinc-400 text-center">Max 500 per generate</p>
                  </div>
                  
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

                <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
                  <button onClick={handleCreateBulk} disabled={saving || !bulkForm.batchName || !bulkForm.name || !bulkForm.prefix || bulkForm.quantity < 1 || bulkForm.customValue <= 0} className="w-full md:w-auto bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-10 py-4 rounded-xl font-bold tracking-wide hover:shadow-xl transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-3">
                    {saving ? <Loader2 size={18} className="animate-spin" /> : <Layers size={18} />}
                    Generate {bulkForm.quantity} Voucher
                  </button>
                </div>

              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
