'use client';

import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Settings2,
  Check,
  Building2,
  Smartphone,
  Banknote,
  CreditCard,
  Wallet,
  Loader2,
  ShieldCheck,
  Sparkles,
  Users,
  FlaskConical,
  Gem,
} from 'lucide-react';
import { CustomAccount, AccountTag, DEFAULT_ACCOUNTS } from '@/types/finance';
import { createClient } from '@/lib/supabase';

interface AccountSettingsModalProps {
  open: boolean;
  onClose: () => void;
  accounts: CustomAccount[];
  onSaved: () => void;
  showAlert: (title: string, msg: string, type?: 'success' | 'danger') => void;
}

const AVAILABLE_ICONS = [
  { id: 'Building2', label: 'Bank', icon: Building2 },
  { id: 'Smartphone', label: 'QRIS / Digital', icon: Smartphone },
  { id: 'Banknote', label: 'Kas Tunai', icon: Banknote },
  { id: 'CreditCard', label: 'Kartu / EDC', icon: CreditCard },
  { id: 'Wallet', label: 'Dompet', icon: Wallet },
];

const AVAILABLE_COLORS = [
  { id: 'purple', label: 'Ungu', bg: 'bg-purple-500' },
  { id: 'blue', label: 'Biru', bg: 'bg-blue-500' },
  { id: 'emerald', label: 'Hijau', bg: 'bg-emerald-500' },
  { id: 'amber', label: 'Kuning / Emas', bg: 'bg-amber-500' },
  { id: 'rose', label: 'Merah', bg: 'bg-rose-500' },
  { id: 'zinc', label: 'Abu-abu Netral', bg: 'bg-zinc-600' },
];

const TAG_DEFINITIONS: { id: AccountTag; label: string; desc: string; icon: any; color: string }[] = [
  {
    id: 'cashier',
    label: 'Kasir & Pemasukan',
    desc: 'Akun pembayaran default di kasir POS & invoice booking.',
    icon: Banknote,
    color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/50 dark:text-purple-300',
  },
  {
    id: 'bhp_operational',
    label: 'Pos Alokasi Bahan (BHP)',
    desc: 'Wadah dana simpanan untuk belanja bahan dan obat treatment.',
    icon: FlaskConical,
    color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-300',
  },
  {
    id: 'therapist_commission',
    label: 'Rekening Pembayaran Terapis',
    desc: 'Rekening sumber transfer komisi terapis saat cetak slip / bayar gaji.',
    icon: Users,
    color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/50 dark:text-blue-300',
  },
  {
    id: 'owner_profit',
    label: 'Rekening Laba Bersih Owner',
    desc: 'Rekening penampung profit bersih salon / dividen prive.',
    icon: Gem,
    color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-300',
  },
  {
    id: 'general',
    label: 'Rekening Umum / Lainnya',
    desc: 'Akun kas standar tanpa alokasi khusus.',
    icon: Wallet,
    color: 'text-zinc-600 bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-300',
  },
];

export function AccountSettingsModal({
  open,
  onClose,
  accounts,
  onSaved,
  showAlert,
}: AccountSettingsModalProps) {
  const [accountList, setAccountList] = useState<CustomAccount[]>(
    accounts && accounts.length > 0 ? accounts : DEFAULT_ACCOUNTS
  );
  const [saving, setSaving] = useState(false);

  // Form for adding new account
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newIcon, setNewIcon] = useState('Building2');
  const [newColor, setNewColor] = useState('blue');
  const [newTag, setNewTag] = useState<AccountTag>('general');
  const [newAccNumber, setNewAccNumber] = useState('');
  const [newAccHolder, setNewAccHolder] = useState('');

  const supabase = createClient();

  if (!open) return null;

  const handleUpdateTag = (accountId: string, tag: AccountTag) => {
    setAccountList((prev) =>
      prev.map((acc) => (acc.id === accountId ? { ...acc, tag } : acc))
    );
  };

  const handleToggleInvoice = (accountId: string) => {
    setAccountList((prev) =>
      prev.map((acc) =>
        acc.id === accountId ? { ...acc, show_in_invoice: !acc.show_in_invoice } : acc
      )
    );
  };

  const handleDeleteAccount = (accountId: string) => {
    if (accountList.length <= 1) {
      showAlert('Peringatan', 'Minimal harus ada 1 akun rekening di sistem.', 'danger');
      return;
    }
    setAccountList((prev) => prev.filter((acc) => acc.id !== accountId));
  };

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) {
      showAlert('Nama Wajib Diisi', 'Silakan masukkan nama akun/rekening.', 'danger');
      return;
    }

    const newId = `acc_${Date.now().toString(36)}`;
    const newAcc: CustomAccount = {
      id: newId,
      label: newLabel.trim(),
      icon: newIcon,
      color: newColor,
      tag: newTag,
      account_number: newAccNumber.trim() || undefined,
      account_holder: newAccHolder.trim() || undefined,
      show_in_invoice: true,
    };

    setAccountList((prev) => [...prev, newAcc]);
    setNewLabel('');
    setNewAccNumber('');
    setNewAccHolder('');
    setShowAddForm(false);
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      // Upsert into settings table
      const { error } = await supabase
        .from('settings')
        .upsert(
          {
            key: 'payment_accounts',
            value: JSON.stringify(accountList),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'key' }
        );

      if (error) throw error;

      showAlert(
        'Pengaturan Disimpan',
        'Pengaturan rekening & pos alokasi berhasil diperbarui.',
        'success'
      );
      onSaved();
      onClose();
    } catch (err: any) {
      console.error(err);
      showAlert('Gagal Menyimpan', err.message || 'Terjadi kesalahan sistem.', 'danger');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs animate-fadeIn">
      <div className="relative max-w-2xl w-full max-h-[90vh] flex flex-col bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800">
        {/* Header */}
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-earth-primary/10 text-earth-primary flex items-center justify-center">
              <Settings2 size={18} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white">
                Pengaturan Rekening & Pos Alokasi
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Atur peran masing-masing rekening kas (Kasir, Alokasi BHP, Payout Terapis, & Laba Owner).
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Tag Guidelines */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/70 dark:border-zinc-700/60">
            {TAG_DEFINITIONS.filter((t) => t.id !== 'general').map((tDef) => {
              const Icon = tDef.icon;
              return (
                <div key={tDef.id} className="flex items-start gap-2">
                  <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${tDef.color}`}>
                    <Icon size={13} />
                  </div>
                  <div>
                    <span className="font-bold text-[11px] text-zinc-900 dark:text-white">
                      {tDef.label}
                    </span>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-tight">
                      {tDef.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Account List */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-900 dark:text-white">
                Daftar Rekening Kas Aktif ({accountList.length})
              </span>
              <button
                type="button"
                onClick={() => setShowAddForm(!showAddForm)}
                className="text-xs font-semibold text-earth-primary hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus size={14} />
                <span>Tambah Rekening Baru</span>
              </button>
            </div>

            {/* Add Account Inline Form */}
            {showAddForm && (
              <form
                onSubmit={handleAddAccount}
                className="p-3.5 rounded-xl border border-earth-primary/30 bg-earth-primary/5 space-y-3 animate-fadeIn"
              >
                <span className="text-xs font-bold text-zinc-900 dark:text-white block">
                  Tambah Rekening / Akun Baru
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10.5px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      Nama Akun / Bank *
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Bank Mandiri (Payout Terapis)"
                      value={newLabel}
                      onChange={(e) => setNewLabel(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-medium text-zinc-900 dark:text-white outline-none focus:border-zinc-950 dark:focus:border-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10.5px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      Fungsi / Pos Alokasi *
                    </label>
                    <select
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value as AccountTag)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-medium text-zinc-900 dark:text-white outline-none focus:border-zinc-950 dark:focus:border-white cursor-pointer"
                    >
                      {TAG_DEFINITIONS.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10.5px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      Nomor Rekening (Opsional)
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: 123-456-7890"
                      value={newAccNumber}
                      onChange={(e) => setNewAccNumber(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-medium text-zinc-900 dark:text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10.5px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      Atas Nama (Opsional)
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: PT Serena Raga Indonesia"
                      value={newAccHolder}
                      onChange={(e) => setNewAccHolder(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-medium text-zinc-900 dark:text-white outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-3 py-1 rounded-lg text-xs font-semibold text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-1 rounded-lg bg-earth-primary hover:bg-earth-primary/90 text-white text-xs font-bold shadow-2xs cursor-pointer"
                  >
                    Tambahkan ke Daftar
                  </button>
                </div>
              </form>
            )}

            {/* Account Rows */}
            <div className="space-y-2">
              {accountList.map((acc) => {
                const currentTagDef = TAG_DEFINITIONS.find((t) => t.id === (acc.tag || 'general'));
                const TagIcon = currentTagDef?.icon || Wallet;

                return (
                  <div
                    key={acc.id}
                    className="p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="size-9 rounded-xl bg-zinc-200/80 dark:bg-zinc-700 flex items-center justify-center text-zinc-800 dark:text-zinc-100 shrink-0 font-bold">
                        <Building2 size={16} />
                      </div>
                      <div>
                        <p className="font-bold text-zinc-900 dark:text-white text-xs sm:text-sm">
                          {acc.label}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {acc.account_number && (
                            <span className="text-[10.5px] font-mono text-zinc-500 dark:text-zinc-400">
                              No: {acc.account_number}
                            </span>
                          )}
                          {acc.account_holder && (
                            <span className="text-[10.5px] text-zinc-500 dark:text-zinc-400">
                              a.n {acc.account_holder}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Tag Selector & Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <div className="flex items-center gap-1.5">
                        <label className="text-[10.5px] text-zinc-500 dark:text-zinc-400 font-semibold">
                          Peran:
                        </label>
                        <select
                          value={acc.tag || 'general'}
                          onChange={(e) => handleUpdateTag(acc.id, e.target.value as AccountTag)}
                          className="px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-[11px] font-semibold text-zinc-900 dark:text-white outline-none cursor-pointer"
                        >
                          {TAG_DEFINITIONS.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <button
                        type="button"
                        title="Hapus Rekening"
                        onClick={() => handleDeleteAccount(acc.id)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-zinc-50/50 dark:bg-zinc-800/30">
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 hidden sm:block">
            Perubahan rekening akan langsung disinkronkan ke kasir POS, form booking, dan slip terapis.
          </p>
          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-semibold cursor-pointer"
            >
              Tutup
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleSaveSettings}
              className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all active:scale-[0.98]"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              <span>Simpan Pengaturan Rekening</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
