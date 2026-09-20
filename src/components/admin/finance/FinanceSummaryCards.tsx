'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Wallet, Users, Sparkles, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface FinanceSummaryCardsProps {
  totalInflow: number;
  totalOutflow: number;
  netProfit: number;
  unpaidCommission: number;
  formatRp: (val: number) => string;
}

export function FinanceSummaryCards({
  totalInflow,
  totalOutflow,
  netProfit,
  unpaidCommission,
  formatRp,
}: FinanceSummaryCardsProps) {
  const isNetPositive = netProfit >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {/* 1. Omset Penjualan */}
      <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 p-4 shadow-2xs hover:shadow-xs transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Total Omset Masuk</span>
          <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <TrendingUp size={16} />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-xl font-bold font-mono text-zinc-950 dark:text-white tracking-tight">
            {formatRp(totalInflow)}
          </p>
          <div className="flex items-center gap-1 mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            <ArrowUpRight size={13} />
            <span>Pemasukan layanan & kasir</span>
          </div>
        </div>
      </div>

      {/* 2. Total Pengeluaran */}
      <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 p-4 shadow-2xs hover:shadow-xs transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Total Pengeluaran</span>
          <div className="h-8 w-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <TrendingDown size={16} />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-xl font-bold font-mono text-zinc-950 dark:text-white tracking-tight">
            {formatRp(totalOutflow)}
          </p>
          <div className="flex items-center gap-1 mt-1 text-[11px] text-rose-600 dark:text-rose-400 font-medium">
            <ArrowDownRight size={13} />
            <span>Operasional, bahan & gaji</span>
          </div>
        </div>
      </div>

      {/* 3. Laba Bersih Kas */}
      <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 p-4 shadow-2xs hover:shadow-xs transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Laba Bersih Kas (Net)</span>
          <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${
            isNetPositive
              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
          }`}>
            <Wallet size={16} />
          </div>
        </div>
        <div className="mt-3">
          <p className={`text-xl font-bold font-mono tracking-tight ${
            isNetPositive
              ? 'text-zinc-950 dark:text-white'
              : 'text-rose-600 dark:text-rose-400'
          }`}>
            {formatRp(netProfit)}
          </p>
          <div className="flex items-center gap-1 mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
            <span>{isNetPositive ? 'Margin kas positif' : 'Defisit arus kas periode ini'}</span>
          </div>
        </div>
      </div>

      {/* 4. Komisi Terapis Belum Bayar */}
      <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 p-4 shadow-2xs hover:shadow-xs transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Komisi Terapis Siap Bayar</span>
          <div className="h-8 w-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Users size={16} />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400 tracking-tight">
            {formatRp(unpaidCommission)}
          </p>
          <div className="flex items-center gap-1 mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
            <span>{unpaidCommission > 0 ? 'Perlu dicairkan di tab Payroll' : '✓ Semua komisi telah lunas'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
