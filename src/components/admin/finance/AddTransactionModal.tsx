'use client';

import React, { useState } from 'react';
import {
  X,
  Plus,
  Loader2,
  Upload,
  Image as ImageIcon,
  Check,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { CustomAccount, CATEGORIES_INFLOW, CATEGORIES_OUTFLOW, TransactionType } from '@/types/finance';
import { createClient } from '@/lib/supabase';

interface AddTransactionModalProps {
  isOpen: boolean;
  initialType: TransactionType;
  accounts: CustomAccount[];
  onClose: () => void;
  onSuccess: () => void;
  showAlert: (title: string, msg: string, type?: 'success' | 'danger') => void;
}

export function AddTransactionModal({
  isOpen,
  initialType,
  accounts,
  onClose,
  onSuccess,
  showAlert,
}: AddTransactionModalProps) {
  const [type, setType] = useState<TransactionType>(initialType);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(initialType === 'inflow' ? 'owner_capital' : 'supplies');
  const [paymentAccount, setPaymentAccount] = useState(accounts[0]?.id || 'cash');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const supabase = createClient();

  if (!isOpen) return null;

  const categories = type === 'inflow' ? CATEGORIES_INFLOW : CATEGORIES_OUTFLOW;

  // Compress image on client side before upload
  const compressImage = (file: File, maxWidth = 1200, quality = 0.75): Promise<File> => {
    return new Promise((resolve) => {
      if (!file.type.startsWith('image/') || file.size < 200 * 1024) {
        return resolve(file);
      }

      const img = new Image();
      const url = URL.createObjectURL(file);
      img.src = url;

      img.onload = () => {
        URL.revokeObjectURL(url);
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxWidth) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxWidth) / height);
            height = maxWidth;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(file);

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) return resolve(file);
            const compressed = new File([blob], file.name.replace(/\.[^/.]+$/, '') + '.jpg', {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressed);
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(file);
      };
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptFile(file);
      setReceiptPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount.replace(/\D/g, ''));
    if (!numAmount || numAmount <= 0) {
      showAlert('Nominal Tidak Valid', 'Harap masukkan nominal transaksi yang valid.', 'danger');
      return;
    }
    if (!description.trim()) {
      showAlert('Keterangan Diperlukan', 'Harap isi keterangan transaksi.', 'danger');
      return;
    }

    setSaving(true);
    try {
      let receiptUrl: string | null = null;
      if (receiptFile) {
        const compressed = await compressImage(receiptFile);
        const ext = compressed.name.split('.').pop() || 'jpg';
        const fileName = `receipt_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from('media')
          .upload(fileName, compressed, { contentType: compressed.type });

        if (!uploadErr) {
          const { data } = supabase.storage.from('media').getPublicUrl(fileName);
          receiptUrl = data.publicUrl;
        }
      }

      const { error } = await supabase.from('cash_transactions').insert({
        transaction_date: `${transactionDate}T12:00:00Z`,
        type,
        category,
        payment_account: paymentAccount,
        amount: numAmount,
        description: description.trim(),
        receipt_url: receiptUrl,
        created_by: 'Admin Manual',
      });

      if (error) {
        throw error;
      }

      showAlert('Transaksi Berhasil Dicatat', 'Data telah tersimpan di Buku Kas.', 'success');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      showAlert('Gagal Menyimpan', err.message || 'Terjadi kesalahan.', 'danger');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs animate-fadeIn">
      <div className="relative max-w-md w-full bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800">
        {/* Header */}
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            {type === 'inflow' ? (
              <div className="h-6 w-6 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                <TrendingUp size={14} />
              </div>
            ) : (
              <div className="h-6 w-6 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
                <TrendingDown size={14} />
              </div>
            )}
            <span>{type === 'inflow' ? 'Catat Pemasukan Kas' : 'Catat Pengeluaran Kas'}</span>
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 cursor-pointer">
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 text-xs">
          {/* Type Switcher */}
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800">
            <button
              type="button"
              onClick={() => {
                setType('outflow');
                setCategory('supplies');
              }}
              className={`py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                type === 'outflow'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
              }`}
            >
              Pengeluaran (-)
            </button>
            <button
              type="button"
              onClick={() => {
                setType('inflow');
                setCategory('owner_capital');
              }}
              className={`py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                type === 'inflow'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
              }`}
            >
              Pemasukan (+)
            </button>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Nominal (Rp) *
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: 150000"
              value={amount}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                setAmount(val ? Number(val).toLocaleString('id-ID') : '');
              }}
              className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-sm font-mono font-bold text-zinc-900 dark:text-white outline-none focus:border-zinc-950 dark:focus:border-white transition-colors"
            />
          </div>

          {/* Category & Account */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Kategori *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-xs font-medium text-zinc-900 dark:text-white outline-none focus:border-zinc-950 dark:focus:border-white transition-colors cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white">
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Rekening / Kas *
              </label>
              <select
                value={paymentAccount}
                onChange={(e) => setPaymentAccount(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-xs font-medium text-zinc-900 dark:text-white outline-none focus:border-zinc-950 dark:focus:border-white transition-colors cursor-pointer"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white">
                    {acc.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date & Description */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Tanggal Transaksi *
            </label>
            <input
              type="date"
              required
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-xs font-medium text-zinc-900 dark:text-white outline-none focus:border-zinc-950 dark:focus:border-white transition-colors cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Keterangan / Catatan *
            </label>
            <textarea
              required
              rows={2}
              placeholder="Contoh: Beli minyak massage lavender & handuk"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-xs text-zinc-900 dark:text-white outline-none focus:border-zinc-950 dark:focus:border-white transition-colors resize-none"
            />
          </div>

          {/* Receipt Upload */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Foto Struk / Nota (Opsional)
            </label>
            {receiptPreview ? (
              <div className="relative rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 p-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img src={receiptPreview} alt="Preview" className="h-10 w-10 object-cover rounded-lg" />
                  <span className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300 truncate max-w-[180px]">
                    {receiptFile?.name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setReceiptFile(null);
                    setReceiptPreview(null);
                  }}
                  className="p-1 rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center p-3 rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500 bg-zinc-50/50 dark:bg-zinc-800/30 cursor-pointer transition-colors text-center">
                <Upload size={16} className="text-zinc-400 mb-1" />
                <span className="text-[11px] text-zinc-600 dark:text-zinc-400 font-medium">
                  Upload Foto Struk / Nota
                </span>
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-semibold cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className={`px-4 py-2 rounded-xl text-white font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-[0.98] ${
                type === 'inflow' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              <span>Simpan Transaksi</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
