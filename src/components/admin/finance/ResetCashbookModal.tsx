'use client';

import React, { useState } from 'react';
import { AlertTriangle, X, Loader2, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase';

interface ResetCashbookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  showAlert: (title: string, msg: string, type?: 'success' | 'danger') => void;
}

export function ResetCashbookModal({
  isOpen,
  onClose,
  onSuccess,
  showAlert,
}: ResetCashbookModalProps) {
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  if (!isOpen) return null;

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmText.trim().toUpperCase() !== 'RESET') {
      showAlert('Konfirmasi Salah', 'Ketik teks "RESET" untuk mengonfirmasi penghapusan data.', 'danger');
      return;
    }

    setLoading(true);
    try {
      // Delete all transactions from cash_transactions
      const { error } = await supabase
        .from('cash_transactions')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Standard idiom to delete all rows

      if (error) throw error;

      showAlert(
        'Database Buku Kas Telah Dibersihkan',
        'Seluruh data transaksi lama telah berhasil dihapus. Pembukuan kini mulai dari lembaran baru.',
        'success'
      );
      setConfirmText('');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      showAlert('Gagal Mereset Data', err.message || 'Terjadi kesalahan.', 'danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-xs animate-fadeIn">
      <div className="relative max-w-md w-full bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl border border-red-200 dark:border-red-900/50">
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border-b border-red-100 dark:border-red-900/40 flex items-center justify-between">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertTriangle size={18} />
            <h3 className="text-sm font-bold">Reset / Bersihkan Data Buku Kas</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/60 text-red-500 cursor-pointer">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleReset} className="p-5 space-y-4 text-xs">
          <div className="space-y-2 text-zinc-600 dark:text-zinc-300 leading-relaxed">
            <p className="font-semibold text-zinc-900 dark:text-white">
              Tindakan ini akan <strong>menghapus seluruh data riwayat transaksi kas</strong> yang ada di database.
            </p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Data pesanan (bookings) & pelanggan <strong>tidak akan terhapus</strong>. Hanya data pencatatan buku kas yang akan di-reset ke nol untuk memulai pembukuan baru yang bersih.
            </p>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Ketik kata <strong className="text-red-600">RESET</strong> untuk konfirmasi:
            </label>
            <input
              type="text"
              required
              placeholder="Ketik RESET"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-red-300 dark:border-red-800 bg-red-50/30 dark:bg-red-950/20 text-sm font-mono font-bold text-red-600 dark:text-red-400 outline-none focus:border-red-600 uppercase"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-semibold cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={confirmText.trim().toUpperCase() !== 'RESET' || loading}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-[0.98]"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              <span>Kosongkan & Reset Buku Kas</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
