'use client';

import React from 'react';
import { BarChart3, TrendingUp, TrendingDown, PieChart, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { CashTransaction } from '@/types/finance';

interface FinanceReportTabProps {
  transactions: CashTransaction[];
  totalInflow: number;
  totalOutflow: number;
  netProfit: number;
  currentMonthStr: string;
  formatRp: (val: number) => string;
}

export function FinanceReportTab({
  transactions,
  totalInflow,
  totalOutflow,
  netProfit,
  currentMonthStr,
  formatRp,
}: FinanceReportTabProps) {
  // Category breakdown calculations
  const outflowCategoriesMap: Record<string, number> = {};
  const inflowCategoriesMap: Record<string, number> = {};

  transactions.forEach((t) => {
    if (t.category === 'internal_transfer') return;
    const amt = Number(t.amount) || 0;
    if (t.type === 'outflow') {
      outflowCategoriesMap[t.category] = (outflowCategoriesMap[t.category] || 0) + amt;
    } else if (t.type === 'inflow') {
      inflowCategoriesMap[t.category] = (inflowCategoriesMap[t.category] || 0) + amt;
    }
  });

  const getCategoryLabel = (cat: string) => {
    if (cat === 'service_income') return 'Layanan & Booking';
    if (cat === 'retail_income') return 'Produk Retail';
    if (cat === 'owner_capital') return 'Suntikan Modal Owner';
    if (cat === 'supplies') return 'Bahan Habis Pakai (BHP)';
    if (cat === 'payroll') return 'Gaji & Komisi Terapis';
    if (cat === 'operational') return 'Operasional & Utilitas';
    if (cat === 'marketing') return 'Marketing & Iklan';
    if (cat === 'owner_prive') return 'Penarikan Owner (Prive)';
    if (cat === 'maintenance') return 'Perbaikan & Maintenance';
    return cat.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const netMarginPercent = totalInflow > 0 ? ((netProfit / totalInflow) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-4">
      {/* P&L Statement Summary Card */}
      <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <BarChart3 size={16} className="text-earth-primary" />
              <span>Laporan Laba Rugi Kas (Periode {currentMonthStr})</span>
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Ringkasan laba bersih kas operasional venue SerenaRaga.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
              Net Profit Margin: <strong>{netMarginPercent}%</strong>
            </span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40">
            <span className="text-[11px] font-bold uppercase text-emerald-800 dark:text-emerald-300">Total Pemasukan (Omset)</span>
            <p className="text-lg font-bold font-mono text-emerald-700 dark:text-emerald-300 mt-1">{formatRp(totalInflow)}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/40">
            <span className="text-[11px] font-bold uppercase text-rose-800 dark:text-rose-300">Total Pengeluaran Kas</span>
            <p className="text-lg font-bold font-mono text-rose-700 dark:text-rose-300 mt-1">{formatRp(totalOutflow)}</p>
          </div>
          <div className={`p-3.5 rounded-xl border ${
            netProfit >= 0
              ? 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-200/60 dark:border-blue-900/40'
              : 'bg-red-50/60 dark:bg-red-950/30 border-red-200/60 dark:border-red-900/40'
          }`}>
            <span className="text-[11px] font-bold uppercase text-zinc-800 dark:text-zinc-200">Sisa Laba Bersih Kas</span>
            <p className={`text-lg font-bold font-mono mt-1 ${netProfit >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-red-700 dark:text-red-400'}`}>
              {formatRp(netProfit)}
            </p>
          </div>
        </div>
      </div>

      {/* Breakdown Breakdown Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Outflow Breakdown */}
        <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 p-4 shadow-2xs space-y-3">
          <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <TrendingDown size={14} className="text-rose-600" />
            <span>Rincian Pengeluaran</span>
          </h4>
          {Object.keys(outflowCategoriesMap).length === 0 ? (
            <p className="text-xs text-zinc-400 py-6 text-center">Belum ada data pengeluaran.</p>
          ) : (
            <div className="space-y-2.5">
              {Object.entries(outflowCategoriesMap)
                .sort(([, a], [, b]) => b - a)
                .map(([cat, amt]) => {
                  const pct = totalOutflow > 0 ? ((amt / totalOutflow) * 100).toFixed(1) : '0';
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium text-zinc-800 dark:text-zinc-200">
                        <span>{getCategoryLabel(cat)}</span>
                        <span className="font-mono font-bold">
                          {formatRp(amt)} <span className="text-[10px] text-zinc-400 font-normal">({pct}%)</span>
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                        <div
                          className="h-full bg-rose-500 rounded-full transition-all"
                          style={{ width: `${Math.min(100, Number(pct))}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Inflow Breakdown */}
        <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 p-4 shadow-2xs space-y-3">
          <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp size={14} className="text-emerald-600" />
            <span>Rincian Pemasukan</span>
          </h4>
          {Object.keys(inflowCategoriesMap).length === 0 ? (
            <p className="text-xs text-zinc-400 py-6 text-center">Belum ada data pemasukan.</p>
          ) : (
            <div className="space-y-2.5">
              {Object.entries(inflowCategoriesMap)
                .sort(([, a], [, b]) => b - a)
                .map(([cat, amt]) => {
                  const pct = totalInflow > 0 ? ((amt / totalInflow) * 100).toFixed(1) : '0';
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium text-zinc-800 dark:text-zinc-200">
                        <span>{getCategoryLabel(cat)}</span>
                        <span className="font-mono font-bold">
                          {formatRp(amt)} <span className="text-[10px] text-zinc-400 font-normal">({pct}%)</span>
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all"
                          style={{ width: `${Math.min(100, Number(pct))}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
