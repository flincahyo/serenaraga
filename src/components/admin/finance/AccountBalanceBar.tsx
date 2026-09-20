'use client';

import React from 'react';
import {
  Smartphone,
  Building2,
  Banknote,
  CreditCard,
  QrCode,
  Landmark,
  Wallet,
  Coins,
} from 'lucide-react';
import { CustomAccount } from '@/types/finance';

interface AccountBalanceBarProps {
  accounts: CustomAccount[];
  accountBalances: Record<string, number>;
  selectedAccount: string;
  onSelectAccount: (accountId: string) => void;
  formatRp: (val: number) => string;
}

const ICON_MAP: Record<string, any> = {
  Smartphone,
  Building2,
  Banknote,
  CreditCard,
  QrCode,
  Landmark,
  Wallet,
  Coins,
};

export function AccountBalanceBar({
  accounts,
  accountBalances,
  selectedAccount,
  onSelectAccount,
  formatRp,
}: AccountBalanceBarProps) {
  const totalLiquid = Object.values(accountBalances).reduce((sum, val) => sum + val, 0);

  return (
    <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 p-3.5 backdrop-blur-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2.5 px-0.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white">
            Saldo Per Rekening / Kas
          </span>
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
            (Total Kas: <strong className="text-zinc-950 dark:text-zinc-50 font-bold">{formatRp(totalLiquid)}</strong>)
          </span>
        </div>
        {selectedAccount !== 'all' && (
          <button
            onClick={() => onSelectAccount('all')}
            className="text-[11px] font-semibold text-earth-primary hover:underline self-start sm:self-auto"
          >
            Tampilkan Semua Akun
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {/* All Accounts Option */}
        <button
          onClick={() => onSelectAccount('all')}
          className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
            selectedAccount === 'all'
              ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 border-transparent shadow-xs font-semibold'
              : 'bg-zinc-50/80 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-zinc-200/60 dark:border-zinc-700/60'
          }`}
        >
          <div className="h-7 w-7 rounded-lg bg-zinc-200/50 dark:bg-zinc-700/50 flex items-center justify-center shrink-0">
            <Wallet size={14} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium truncate opacity-80">Semua Kas</p>
            <p className="text-xs font-bold font-mono truncate">{formatRp(totalLiquid)}</p>
          </div>
        </button>

        {/* Dynamic Accounts */}
        {accounts.map((acc) => {
          const IconComponent = ICON_MAP[acc.icon] || Wallet;
          const balance = accountBalances[acc.id] ?? 0;
          const isSelected = selectedAccount === acc.id;

          return (
            <button
              key={acc.id}
              onClick={() => onSelectAccount(acc.id)}
              className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 border-transparent shadow-xs font-semibold'
                  : 'bg-zinc-50/80 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-zinc-200/60 dark:border-zinc-700/60'
              }`}
            >
              <div className="h-7 w-7 rounded-lg bg-earth-primary/10 text-earth-primary flex items-center justify-center shrink-0">
                <IconComponent size={14} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium truncate opacity-80">{acc.label}</p>
                <p className="text-xs font-bold font-mono truncate">{formatRp(balance)}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
