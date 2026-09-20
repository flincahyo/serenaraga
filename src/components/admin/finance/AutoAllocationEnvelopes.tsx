'use client';

import React from 'react';
import {
  FlaskConical,
  Users,
  Gem,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Settings2,
  CheckCircle2,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { CustomAccount } from '@/types/finance';

interface AutoAllocationEnvelopesProps {
  totalRevenue: number;
  bhpAllocated: number;
  therapistAllocated: number;
  therapistPaid: number;
  otherExpenses: number;
  accounts: CustomAccount[];
  formatRp: (val: number) => string;
  onOpenSettings: () => void;
  onOpenPayrollTab?: () => void;
}

export function AutoAllocationEnvelopes({
  totalRevenue,
  bhpAllocated,
  therapistAllocated,
  therapistPaid,
  otherExpenses,
  accounts,
  formatRp,
  onOpenSettings,
  onOpenPayrollTab,
}: AutoAllocationEnvelopesProps) {
  const therapistPending = Math.max(0, therapistAllocated - therapistPaid);
  const ownerProfitEstimated = Math.max(
    0,
    totalRevenue - bhpAllocated - therapistAllocated - otherExpenses
  );

  const bhpAccount = accounts.find((a) => a.tag === 'bhp_operational') || accounts.find((a) => a.id === 'cash');
  const therapistAccount = accounts.find((a) => a.tag === 'therapist_commission') || accounts.find((a) => a.id === 'bca');
  const ownerAccount = accounts.find((a) => a.tag === 'owner_profit') || accounts.find((a) => a.id === 'bca');

  const bhpPct = totalRevenue > 0 ? Math.round((bhpAllocated / totalRevenue) * 100) : 0;
  const therapistPct = totalRevenue > 0 ? Math.round((therapistAllocated / totalRevenue) * 100) : 0;
  const ownerPct = totalRevenue > 0 ? Math.round((ownerProfitEstimated / totalRevenue) * 100) : 0;

  return (
    <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 p-4 sm:p-5 shadow-2xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-xl bg-earth-primary/10 text-earth-primary flex items-center justify-center shrink-0">
            <Sparkles size={16} />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <span>Alokasi Pos Otomatis Dari Omset Layanan</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
                Auto-Split
              </span>
            </h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Uang kas otomatis terbagi untuk Pos Bahan (BHP), Komisi Terapis, & Laba Bersih Owner.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenSettings}
          className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-earth-primary flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Settings2 size={13} />
          <span>Atur Rekening Alokasi</span>
        </button>
      </div>

      {/* 3 Envelopes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* 1. Pos Alokasi BHP */}
        <div className="p-4 rounded-xl border border-amber-200/70 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 font-bold text-xs">
              <FlaskConical size={15} />
              <span>Pos Bahan (BHP)</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200/60 dark:bg-amber-800/60 text-amber-900 dark:text-amber-200">
              {bhpPct}% Omset
            </span>
          </div>
          <div>
            <p className="text-lg font-bold font-mono text-zinc-950 dark:text-white">
              {formatRp(bhpAllocated)}
            </p>
            <p className="text-[10.5px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              Dana aman dicadangkan untuk restock produk & obat treatment.
            </p>
          </div>
          <div className="pt-2 border-t border-amber-200/50 dark:border-amber-800/40 flex items-center justify-between text-[10.5px]">
            <span className="text-zinc-500 dark:text-zinc-400">Rekening Wadah:</span>
            <span className="font-semibold text-zinc-800 dark:text-zinc-200 font-mono">
              {bhpAccount?.label || 'Kas Laci Kasir'}
            </span>
          </div>
        </div>

        {/* 2. Pos Komisi Terapis */}
        <div className="p-4 rounded-xl border border-blue-200/70 dark:border-blue-900/40 bg-blue-50/40 dark:bg-blue-950/20 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-blue-800 dark:text-blue-300 font-bold text-xs">
              <Users size={15} />
              <span>Pos Komisi Terapis</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-200/60 dark:bg-blue-800/60 text-blue-900 dark:text-blue-200">
              {therapistPct}% Omset
            </span>
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <p className="text-lg font-bold font-mono text-zinc-950 dark:text-white">
                {formatRp(therapistAllocated)}
              </p>
              {therapistPending > 0 ? (
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <Clock size={11} />
                  <span>Sisa: {formatRp(therapistPending)}</span>
                </span>
              ) : (
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 size={11} />
                  <span>Lunas</span>
                </span>
              )}
            </div>
            <p className="text-[10.5px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              Siap ditransfer via Cetak Slip di menu Terapis / Tab Payroll.
            </p>
          </div>
          <div className="pt-2 border-t border-blue-200/50 dark:border-blue-800/40 flex items-center justify-between text-[10.5px]">
            <span className="text-zinc-500 dark:text-zinc-400">Rekening Transfer:</span>
            <span className="font-semibold text-zinc-800 dark:text-zinc-200 font-mono">
              {therapistAccount?.label || 'Bank BCA'}
            </span>
          </div>
        </div>

        {/* 3. Pos Laba Bersih Owner */}
        <div className="p-4 rounded-xl border border-emerald-200/70 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
              <Gem size={15} />
              <span>Pos Laba Bersih Owner</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200/60 dark:bg-emerald-800/60 text-emerald-900 dark:text-emerald-200">
              {ownerPct}% Omset
            </span>
          </div>
          <div>
            <p className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {formatRp(ownerProfitEstimated)}
            </p>
            <p className="text-[10.5px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              Profit murni aman ditarik untuk prive owner atau dividen.
            </p>
          </div>
          <div className="pt-2 border-t border-emerald-200/50 dark:border-emerald-800/40 flex items-center justify-between text-[10.5px]">
            <span className="text-zinc-500 dark:text-zinc-400">Rekening Profit:</span>
            <span className="font-semibold text-zinc-800 dark:text-zinc-200 font-mono">
              {ownerAccount?.label || 'Bank BCA'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
