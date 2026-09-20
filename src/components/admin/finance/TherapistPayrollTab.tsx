'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Users,
  CheckCircle2,
  Clock,
  Banknote,
  Send,
  Loader2,
  X,
  Check,
  Calendar,
  Sparkles,
  ArrowUpRight,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileText,
  Filter,
} from 'lucide-react';
import { CustomAccount, PeriodFilterMode } from '@/types/finance';
import { createClient } from '@/lib/supabase';

export type TherapistBookingDetail = {
  bookingId: string;
  customerName: string;
  serviceName: string;
  bookingDate: string;
  bookingTime?: string;
  price: number;
  commissionEarned: number;
};

export type TherapistPayrollItem = {
  therapistId: string;
  name: string;
  phone?: string;
  bankInfo?: string;
  completedBookingsCount: number;
  totalCommissionEarned: number;
  totalPaid: number;
  isPaid: boolean;
  bookings: TherapistBookingDetail[];
  payoutTxId?: string;
};

interface TherapistPayrollTabProps {
  payrollItems: TherapistPayrollItem[];
  periodMode: PeriodFilterMode;
  onPeriodModeChange: (mode: PeriodFilterMode) => void;
  customDate: string;
  onCustomDateChange: (dateStr: string) => void;
  currentMonthStr: string;
  accounts: CustomAccount[];
  formatRp: (val: number) => string;
  onRefresh: () => void;
  showAlert: (title: string, msg: string, type?: 'success' | 'danger') => void;
}

export function TherapistPayrollTab({
  payrollItems,
  periodMode,
  onPeriodModeChange,
  customDate,
  onCustomDateChange,
  currentMonthStr,
  accounts,
  formatRp,
  onRefresh,
  showAlert,
}: TherapistPayrollTabProps) {
  const [selectedTherapist, setSelectedTherapist] = useState<TherapistPayrollItem | null>(null);
  const [expandedTherapistId, setExpandedTherapistId] = useState<string | null>(null);

  // Default payment account: auto-select account tagged with 'therapist_commission' or 'bca'
  const defaultPayoutAccount = useMemo(() => {
    const tagged = accounts.find((a) => a.tag === 'therapist_commission');
    if (tagged) return tagged.id;
    const bca = accounts.find((a) => a.id === 'bca');
    if (bca) return bca.id;
    return accounts[0]?.id || 'cash';
  }, [accounts]);

  const [paymentAccount, setPaymentAccount] = useState(defaultPayoutAccount);
  const [bonusAmount, setBonusAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [paying, setPaying] = useState(false);

  const supabase = createClient();

  const totalEarned = payrollItems.reduce((sum, item) => sum + item.totalCommissionEarned, 0);
  const totalPaid = payrollItems.reduce((sum, item) => sum + item.totalPaid, 0);
  const totalUnpaid = Math.max(0, totalEarned - totalPaid);

  const handleOpenPayoutModal = (item: TherapistPayrollItem) => {
    setSelectedTherapist(item);
    setPaymentAccount(defaultPayoutAccount);
    setBonusAmount('');
    setNotes('');
  };

  const getPeriodDisplayLabel = () => {
    if (periodMode === 'today') return 'Hari Ini';
    if (periodMode === 'yesterday') return 'Kemarin';
    if (periodMode === 'custom_date') return `Tanggal ${customDate}`;
    if (periodMode === 'month') return `Bulan ${currentMonthStr}`;
    return 'Semua Periode';
  };

  const handleExecutePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTherapist) return;

    setPaying(true);
    try {
      const bonus = Number(bonusAmount.replace(/\D/g, '')) || 0;
      const unpaid = Math.max(0, selectedTherapist.totalCommissionEarned - selectedTherapist.totalPaid);
      const totalPayout = unpaid + bonus;

      const tShortId = selectedTherapist.therapistId.slice(0, 8);
      const dateTag = periodMode === 'month' ? currentMonthStr : customDate;
      const refId = `PAYOUT-${tShortId}-${dateTag}-${dateTag}`;

      const desc = `Gaji & Komisi Terapis ${selectedTherapist.name} (${getPeriodDisplayLabel()}) - ${
        selectedTherapist.completedBookingsCount
      } Jobs${bonus > 0 ? ` (+ Bonus/Tips ${formatRp(bonus)})` : ''}${notes ? ` - ${notes}` : ''}`;

      const { error } = await supabase.from('cash_transactions').insert({
        transaction_date: new Date().toISOString(),
        type: 'outflow',
        category: 'payroll',
        payment_account: paymentAccount,
        amount: totalPayout,
        description: desc,
        reference_id: refId,
        created_by: 'Payroll Manager',
      });

      if (error) throw error;

      showAlert(
        'Pembayaran Komisi Berhasil',
        `Komisi sebesar ${formatRp(totalPayout)} untuk ${selectedTherapist.name} telah dicatat di Buku Kas.`,
        'success'
      );
      setSelectedTherapist(null);
      onRefresh();
    } catch (err: any) {
      console.error(err);
      showAlert('Gagal Memproses Pembayaran', err.message || 'Terjadi kesalahan.', 'danger');
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Period Filter Bar (Hari Ini, Kemarin, Pilih Tanggal, Bulan Ini) */}
      <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 p-3.5 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 mr-1 flex items-center gap-1">
            <Filter size={13} />
            <span>Periode:</span>
          </span>

          <button
            type="button"
            onClick={() => onPeriodModeChange('today')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              periodMode === 'today'
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-2xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            Hari Ini (Daily)
          </button>

          <button
            type="button"
            onClick={() => onPeriodModeChange('yesterday')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              periodMode === 'yesterday'
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-2xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            Kemarin
          </button>

          <button
            type="button"
            onClick={() => onPeriodModeChange('custom_date')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              periodMode === 'custom_date'
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-2xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            Pilih Tanggal
          </button>

          <button
            type="button"
            onClick={() => onPeriodModeChange('month')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              periodMode === 'month'
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-2xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            Rekap Bulan Ini
          </button>
        </div>

        {/* Date Picker if custom_date is active */}
        {periodMode === 'custom_date' && (
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
              Tanggal:
            </label>
            <input
              type="date"
              value={customDate}
              onChange={(e) => onCustomDateChange(e.target.value)}
              className="px-2.5 py-1 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-bold text-zinc-900 dark:text-white outline-none cursor-pointer"
            />
          </div>
        )}

        <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
          Menampilkan: <span className="font-bold text-zinc-900 dark:text-white">{getPeriodDisplayLabel()}</span>
        </div>
      </div>

      {/* Payroll Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 p-4 shadow-2xs">
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            Total Hak Komisi ({getPeriodDisplayLabel()})
          </span>
          <p className="text-xl font-bold font-mono text-zinc-950 dark:text-white mt-1.5">
            {formatRp(totalEarned)}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 p-4 shadow-2xs">
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Sudah Dicairkan / Dibayar</span>
          <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1.5">
            {formatRp(totalPaid)}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 p-4 shadow-2xs">
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Sisa Belum Dibayar (Pending)</span>
          <p className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1.5">
            {formatRp(totalUnpaid)}
          </p>
        </div>
      </div>

      {/* Therapist List Table */}
      <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-xl bg-earth-primary/10 text-earth-primary flex items-center justify-center">
              <Users size={15} />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white">
                Daftar Komisi Terapis ({getPeriodDisplayLabel()})
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Otomatis dihitung dari order selesai. Sinkron dengan fitur Cetak Slip di halaman Terapis.
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 text-zinc-500 dark:text-zinc-400 uppercase font-semibold text-[10px] tracking-wider">
                <th className="py-3 px-4">Nama Terapis</th>
                <th className="py-3 px-4 text-center">Order Selesai</th>
                <th className="py-3 px-4 text-right">Total Hak Komisi</th>
                <th className="py-3 px-4 text-right">Sudah Dibayar</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {payrollItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-400 dark:text-zinc-500">
                    Belum ada data layanan selesai pada periode {getPeriodDisplayLabel()}.
                  </td>
                </tr>
              ) : (
                payrollItems.map((item) => {
                  const unpaidAmount = Math.max(0, item.totalCommissionEarned - item.totalPaid);
                  const isExpanded = expandedTherapistId === item.therapistId;

                  return (
                    <React.Fragment key={item.therapistId}>
                      <tr className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors">
                        {/* Name */}
                        <td className="py-3 px-4">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-zinc-900 dark:text-white">{item.name}</p>
                              {item.bookings.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedTherapistId(isExpanded ? null : item.therapistId)
                                  }
                                  className="text-[10.5px] text-earth-primary hover:underline font-semibold flex items-center gap-0.5 cursor-pointer"
                                >
                                  <span>{isExpanded ? 'Tutup Rincian' : 'Lihat Rincian'}</span>
                                  {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                </button>
                              )}
                            </div>
                            {item.bankInfo && (
                              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
                                {item.bankInfo}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Orders Count */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[11px] font-semibold text-zinc-800 dark:text-zinc-200">
                            {item.completedBookingsCount} Layanan
                          </span>
                        </td>

                        {/* Total Commission */}
                        <td className="py-3 px-4 text-right font-mono font-bold text-zinc-900 dark:text-white whitespace-nowrap">
                          {formatRp(item.totalCommissionEarned)}
                        </td>

                        {/* Total Paid */}
                        <td className="py-3 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                          {formatRp(item.totalPaid)}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          {item.isPaid ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10.5px] font-bold">
                              <CheckCircle2 size={12} />
                              <span>Lunas</span>
                            </span>
                          ) : item.totalCommissionEarned > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 text-[10.5px] font-bold">
                              <Clock size={12} />
                              <span>Belum Dibayar ({formatRp(unpaidAmount)})</span>
                            </span>
                          ) : (
                            <span className="text-zinc-400 text-[10px]">-</span>
                          )}
                        </td>

                        {/* Action Buttons */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            {item.isPaid ? (
                              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                                ✓ Lunas
                              </span>
                            ) : item.totalCommissionEarned > 0 ? (
                              <button
                                type="button"
                                onClick={() => handleOpenPayoutModal(item)}
                                className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 text-xs font-bold transition-all shadow-2xs active:scale-[0.98] cursor-pointer"
                              >
                                Bayar Komisi
                              </button>
                            ) : (
                              <span className="text-zinc-400 text-[11px]">-</span>
                            )}

                            <Link
                              href="/admin/therapists"
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                              title="Buka Slip Payout di Halaman Terapis"
                            >
                              <ExternalLink size={13} />
                            </Link>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Booking Details */}
                      {isExpanded && (
                        <tr className="bg-zinc-50/80 dark:bg-zinc-800/40">
                          <td colSpan={6} className="p-3.5 pl-6 border-b border-zinc-100 dark:border-zinc-800">
                            <div className="space-y-1.5">
                              <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block">
                                Rincian Pekerjaan ({item.bookings.length} Order Selesai):
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                {item.bookings.map((bk, idx) => (
                                  <div
                                    key={bk.bookingId + idx}
                                    className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-700/80 space-y-1 text-[11px]"
                                  >
                                    <div className="flex justify-between items-start">
                                      <span className="font-bold text-zinc-900 dark:text-white truncate">
                                        {bk.customerName}
                                      </span>
                                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                        +{formatRp(bk.commissionEarned)}
                                      </span>
                                    </div>
                                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                                      {bk.serviceName}
                                    </p>
                                    <div className="flex justify-between text-[9.5px] text-zinc-400 font-mono pt-1 border-t border-zinc-100 dark:border-zinc-800">
                                      <span>{bk.bookingDate} {bk.bookingTime || ''}</span>
                                      <span>Tarif: {formatRp(bk.price)}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payout Confirmation Modal */}
      {selectedTherapist && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs animate-fadeIn">
          <div className="relative max-w-md w-full bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800">
            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Banknote size={16} className="text-earth-primary" />
                <span>Pembayaran Komisi ({selectedTherapist.name})</span>
              </h3>
              <button
                onClick={() => setSelectedTherapist(null)}
                className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleExecutePayout} className="p-4 space-y-3.5 text-xs">
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/60 space-y-1">
                <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                  <span>Periode:</span>
                  <span className="font-bold text-zinc-900 dark:text-white">
                    {getPeriodDisplayLabel()}
                  </span>
                </div>
                <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                  <span>Hak Komisi Belum Dibayar:</span>
                  <span className="font-bold font-mono text-zinc-900 dark:text-white">
                    {formatRp(Math.max(0, selectedTherapist.totalCommissionEarned - selectedTherapist.totalPaid))}
                  </span>
                </div>
                <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                  <span>Total Layanan Selesai:</span>
                  <span className="font-semibold text-zinc-900 dark:text-white">
                    {selectedTherapist.completedBookingsCount} Layanan
                  </span>
                </div>
              </div>

              {/* Payment Account */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Dibayar Menggunakan Rekening / Kas *
                </label>
                <select
                  value={paymentAccount}
                  onChange={(e) => setPaymentAccount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-xs font-medium text-zinc-900 dark:text-white outline-none focus:border-zinc-950 dark:focus:border-white transition-colors cursor-pointer"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white">
                      {acc.label} {acc.tag === 'therapist_commission' ? '(Rekening Payout)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Optional Bonus / Tips */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Bonus / Tips Tambahan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 50000"
                  value={bonusAmount}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setBonusAmount(val ? Number(val).toLocaleString('id-ID') : '');
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-sm font-mono font-bold text-zinc-900 dark:text-white outline-none focus:border-zinc-950 dark:focus:border-white transition-colors"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Catatan Tambahan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Transfer via m-BCA"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-xs text-zinc-900 dark:text-white outline-none focus:border-zinc-950 dark:focus:border-white transition-colors"
                />
              </div>

              {/* Total Payout Summary */}
              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-semibold">Total Yang Dicairkan:</span>
                  <p className="text-base font-bold font-mono text-zinc-950 dark:text-white">
                    {formatRp(
                      Math.max(0, selectedTherapist.totalCommissionEarned - selectedTherapist.totalPaid) +
                        (Number(bonusAmount.replace(/\D/g, '')) || 0)
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedTherapist(null)}
                    className="px-3 py-1.5 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-semibold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={paying}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-[0.98]"
                  >
                    {paying ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                    <span>Konfirmasi Bayar</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
