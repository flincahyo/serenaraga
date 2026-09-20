'use client';

import React, { useState } from 'react';
import { X, ArrowLeftRight, Loader2, Check } from 'lucide-react';
import { CustomAccount } from '@/types/finance';
import { createClient } from '@/lib/supabase';

interface TransferCashModalProps {
  isOpen: boolean;
  accounts: CustomAccount[];
  onClose: () => void;
  onSuccess: () => void;
  showAlert: (title: string, msg: string, type?: 'success' | 'danger') => void;
}

export function TransferCashModal({
  isOpen,
  accounts,
  onClose,
  onSuccess,
  showAlert,
}: TransferCashModalProps) {
  const [sourceAccount, setSourceAccount] = useState(accounts[0]?.id || 'cash');
  const [targetAccount, setTargetAccount] = useState(accounts[1]?.id || 'bca');
  const [amount, setAmount] = useState('');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const supabase = createClient();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount.replace(/\D/g, ''));
    if (!numAmount || numAmount <= 0) {
      showAlert('Nominal Tidak Valid', 'Harap masukkan nominal transfer yang valid.', 'danger');
      return;
    }
    if (sourceAccount === targetAccount) {
      showAlert('Rekening Sama', 'Rekening asal dan tujuan tidak boleh sama.', 'danger');
      return;
    }

    setSaving(true);
    try {
      const sourceLabel = accounts.find((a) => a.id === sourceAccount)?.label || sourceAccount;
      const targetLabel = accounts.find((a) => a.id === targetAccount)?.label || targetAccount;
      const note = description.trim() || `Transfer kas dari ${sourceLabel} ke ${targetLabel}`;
      const refId = `TRF-${Date.now().toString(36).toUpperCase()}`;

      // 1. Outflow from source account
      const outflowPayload = {
        transaction_date: `${transactionDate}T12:00:00Z`,
        type: 'outflow' as const,
        category: 'internal_transfer',
        payment_account: sourceAccount,
        amount: numAmount,
        description: `(Keluar) ${note}`,
        reference_id: refId,
        created_by: 'Admin Transfer',
      };

      // 2. Inflow to target account
      const inflowPayload = {
        transaction_date: `${transactionDate}T12:00:00Z`,
        type: 'inflow' as const,
        category: 'internal_transfer',
        payment_account: targetAccount,
        amount: numAmount,
        description: `(Masuk) ${note}`,
        reference_id: refId,
        created_by: 'Admin Transfer',
      };

      const { error } = await supabase.from('cash_transactions').insert([outflowPayload, inflowPayload]);
      if (error) throw error;

      showAlert('Transfer Berhasil Dicatat', `Saldo ${numAmount.toLocaleString('id-ID')} dipindahkan ke ${targetLabel}.`, 'success');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      showAlert('Gagal Transfer', err.message || 'Terjadi kesalahan.', 'danger');
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
            <div className="h-6 w-6 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
              <ArrowLeftRight size={14} />
            </div>
            <span>Transfer Saldo Antar Rekening</span>
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 cursor-pointer">
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 text-xs">
          {/* Source & Target Accounts */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Dari Rekening / Kas *
              </label>
              <select
                value={sourceAccount}
                onChange={(e) => setSourceAccount(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-xs font-medium text-zinc-900 dark:text-white outline-none focus:border-zinc-950 dark:focus:border-white transition-colors cursor-pointer"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white">
                    {acc.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Ke Rekening Tujuan *
              </label>
              <select
                value={targetAccount}
                onChange={(e) => setTargetAccount(e.target.value)}
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

          {/* Amount */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Nominal Transfer (Rp) *
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: 500000"
              value={amount}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                setAmount(val ? Number(val).toLocaleString('id-ID') : '');
              }}
              className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-sm font-mono font-bold text-zinc-900 dark:text-white outline-none focus:border-zinc-950 dark:focus:border-white transition-colors"
            />
          </div>

          {/* Date & Note */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Tanggal Transfer *
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
              Keterangan (Opsional)
            </label>
            <input
              type="text"
              placeholder="Contoh: Setoran uang tunai kasir ke Bank BCA"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-xs text-zinc-900 dark:text-white outline-none focus:border-zinc-950 dark:focus:border-white transition-colors"
            />
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
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-[0.98]"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              <span>Simpan Transfer</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
