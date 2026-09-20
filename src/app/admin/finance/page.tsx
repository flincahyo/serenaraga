'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Wallet,
  Calendar,
  Receipt,
  Users,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  Download,
  Settings2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
import {
  CashTransaction,
  CustomAccount,
  DEFAULT_ACCOUNTS,
  PeriodFilterMode,
} from '@/types/finance';
import { FinanceSummaryCards } from '@/components/admin/finance/FinanceSummaryCards';
import { AccountBalanceBar } from '@/components/admin/finance/AccountBalanceBar';
import { AutoAllocationEnvelopes } from '@/components/admin/finance/AutoAllocationEnvelopes';
import { TransactionTable } from '@/components/admin/finance/TransactionTable';
import { AddTransactionModal } from '@/components/admin/finance/AddTransactionModal';
import { TransferCashModal } from '@/components/admin/finance/TransferCashModal';
import {
  TherapistPayrollTab,
  TherapistPayrollItem,
  TherapistBookingDetail,
} from '@/components/admin/finance/TherapistPayrollTab';
import { FinanceReportTab } from '@/components/admin/finance/FinanceReportTab';
import { ResetCashbookModal } from '@/components/admin/finance/ResetCashbookModal';
import { AccountSettingsModal } from '@/components/admin/finance/AccountSettingsModal';

export default function FinancePage() {
  const supabase = createClient();

  const now = new Date();
  const defaultCurrentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const todayStr = now.toISOString().split('T')[0];

  // State
  const [globalMonthFilter, setGlobalMonthFilter] = useState<string>(defaultCurrentMonthStr);
  const [activeTab, setActiveTab] = useState<'transactions' | 'payroll' | 'reports'>('transactions');
  const [transactions, setTransactions] = useState<CashTransaction[]>([]);
  const [accounts, setAccounts] = useState<CustomAccount[]>(DEFAULT_ACCOUNTS);
  const [completedBookings, setCompletedBookings] = useState<any[]>([]);
  const [therapists, setTherapists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Payroll specific filter mode (Daily by default)
  const [payrollPeriodMode, setPayrollPeriodMode] = useState<PeriodFilterMode>('today');
  const [payrollCustomDate, setPayrollCustomDate] = useState<string>(todayStr);

  // Filters
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'inflow' | 'outflow' | 'transfer'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalInitialType, setAddModalInitialType] = useState<'inflow' | 'outflow'>('outflow');
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isAccountSettingsModalOpen, setIsAccountSettingsModalOpen] = useState(false);

  // Alerts
  const [alertInfo, setAlertInfo] = useState<{ title: string; msg: string; type: 'success' | 'danger' } | null>(null);

  const showAlert = useCallback((title: string, msg: string, type: 'success' | 'danger' = 'success') => {
    setAlertInfo({ title, msg, type });
    setTimeout(() => {
      setAlertInfo(null);
    }, 4500);
  }, []);

  const formatRp = useCallback((num: number) => {
    return 'Rp ' + (num || 0).toLocaleString('id-ID');
  }, []);

  // Fetch all finance data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch transactions
      const { data: txData, error: txErr } = await supabase
        .from('cash_transactions')
        .select('*')
        .order('transaction_date', { ascending: false });

      if (!txErr && txData) {
        setTransactions(txData);
      }

      // 2. Fetch custom accounts from settings if available
      const { data: settingsData } = await supabase
        .from('settings')
        .select('key, value')
        .eq('key', 'payment_accounts')
        .maybeSingle();

      if (settingsData?.value) {
        try {
          const parsed = typeof settingsData.value === 'string' ? JSON.parse(settingsData.value) : settingsData.value;
          if (Array.isArray(parsed) && parsed.length > 0) {
            setAccounts(parsed);
          }
        } catch (e) {
          console.error('Failed to parse accounts:', e);
        }
      }

      // 3. Fetch completed bookings & items for payroll & allocation calculations
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select('id, customer_name, service_name, booking_date, booking_time, status, price, bhp_cost, booking_items(therapist_id, commission_earned, service_name, price)')
        .eq('status', 'Completed');

      if (bookingsData) {
        setCompletedBookings(bookingsData);
      }

      // 4. Fetch therapists
      const { data: therapistsData } = await supabase
        .from('therapists')
        .select('id, name, phone, bank_info');

      if (therapistsData) {
        setTherapists(therapistsData);
      }
    } catch (err) {
      console.error('Error fetching finance data:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchData();

    // Listen for events from POS or Bookings
    const handleCashbookUpdate = () => {
      fetchData();
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('cashbook_updated', handleCashbookUpdate);
      return () => window.removeEventListener('cashbook_updated', handleCashbookUpdate);
    }
  }, [fetchData]);

  // Dynamic list of available YYYY-MM for the month selector
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    set.add(defaultCurrentMonthStr);
    transactions.forEach((t) => {
      if (t.transaction_date) {
        const ym = t.transaction_date.slice(0, 7);
        if (ym && ym.length === 7) set.add(ym);
      }
    });
    return Array.from(set).sort().reverse();
  }, [transactions, defaultCurrentMonthStr]);

  const formatMonthLabel = useCallback((ymStr: string) => {
    if (ymStr === 'all') return 'Semua Periode (All Time)';
    const [y, m] = ymStr.split('-');
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
    ];
    const idx = parseInt(m, 10) - 1;
    return `${monthNames[idx] || m} ${y}`;
  }, []);

  // Filtered transactions for the selected global month
  const currentPeriodTransactions = useMemo(() => {
    if (globalMonthFilter === 'all') return transactions;
    return transactions.filter((t) => t.transaction_date?.startsWith(globalMonthFilter));
  }, [transactions, globalMonthFilter]);

  // Filtered completed bookings: ONLY include bookings that have matching inflow records in the active cash transactions
  const currentPeriodBookings = useMemo(() => {
    const inflowTxList = currentPeriodTransactions.filter((t) => t.type === 'inflow');
    if (inflowTxList.length === 0) {
      return [];
    }

    return completedBookings.filter((b) => {
      // 1. Check date/month filter
      const isDateMatch =
        globalMonthFilter === 'all' || b.booking_date?.startsWith(globalMonthFilter);
      if (!isDateMatch) return false;

      // 2. Generate standard reference ID for this booking
      const last4 = b.id ? b.id.substring(b.id.length - 4).toUpperCase() : '';
      let refId = '';
      if (b.booking_date) {
        const dateObj = new Date(b.booking_date + 'T00:00:00');
        const y = dateObj.getFullYear();
        const m = String(dateObj.getMonth() + 1).padStart(2, '0');
        refId = `SR-${y}${m}-${last4}`;
      }

      // 3. Match against recorded inflow transactions
      return inflowTxList.some((t) => {
        if (t.reference_id) {
          if (t.reference_id === b.id || t.reference_id === refId) return true;
          if (last4 && t.reference_id.toUpperCase().includes(last4)) return true;
        }
        if (t.description) {
          if (last4 && t.description.toUpperCase().includes(last4)) return true;
          if (b.customer_name && t.description.toLowerCase().includes(b.customer_name.toLowerCase())) {
            if (
              Number(t.amount) === Number(b.price) ||
              (t.transaction_date && t.transaction_date.startsWith(b.booking_date))
            ) {
              return true;
            }
          }
        }
        return false;
      });
    });
  }, [completedBookings, currentPeriodTransactions, globalMonthFilter]);

  // Overall account balances (all-time cumulative)
  const accountBalances = useMemo(() => {
    const balances: Record<string, number> = {};
    accounts.forEach((acc) => {
      balances[acc.id] = 0;
    });

    transactions.forEach((t) => {
      const accId = t.payment_account || 'cash';
      const amt = Number(t.amount) || 0;
      if (balances[accId] === undefined) {
        balances[accId] = 0;
      }
      if (t.type === 'inflow') {
        balances[accId] += amt;
      } else if (t.type === 'outflow') {
        balances[accId] -= amt;
      }
    });

    return balances;
  }, [transactions, accounts]);

  // Summary Metrics (Exclude internal transfer & capital injection from sales turnover)
  const totalInflow = useMemo(() => {
    return currentPeriodTransactions
      .filter((t) => t.type === 'inflow' && t.category !== 'internal_transfer')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  }, [currentPeriodTransactions]);

  const totalOutflow = useMemo(() => {
    return currentPeriodTransactions
      .filter((t) => t.type === 'outflow' && t.category !== 'internal_transfer')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  }, [currentPeriodTransactions]);

  const netProfit = totalInflow - totalOutflow;

  // Auto Allocation calculations for envelopes (Strictly synced with recorded cash inflow)
  const totalRevenue = useMemo(() => {
    return totalInflow;
  }, [totalInflow]);

  const bhpAllocated = useMemo(() => {
    return currentPeriodBookings.reduce((sum, b) => sum + Number(b.bhp_cost || 0), 0);
  }, [currentPeriodBookings]);

  const therapistAllocated = useMemo(() => {
    let total = 0;
    currentPeriodBookings.forEach((b) => {
      if (b.booking_items && Array.isArray(b.booking_items)) {
        b.booking_items.forEach((item: any) => {
          total += Number(item.commission_earned || 0);
        });
      }
    });
    return total;
  }, [currentPeriodBookings]);

  const therapistPaidAllMonth = useMemo(() => {
    return currentPeriodTransactions
      .filter((t) => t.category === 'payroll' && t.type === 'outflow')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  }, [currentPeriodTransactions]);

  const otherExpenses = useMemo(() => {
    return currentPeriodTransactions
      .filter((t) => t.type === 'outflow' && t.category !== 'payroll' && t.category !== 'internal_transfer')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  }, [currentPeriodTransactions]);

  // Date helpers for Daily / Period Payroll calculation
  const targetPayrollDate = useMemo(() => {
    if (payrollPeriodMode === 'today') return todayStr;
    if (payrollPeriodMode === 'yesterday') {
      const yDate = new Date();
      yDate.setDate(yDate.getDate() - 1);
      return yDate.toISOString().split('T')[0];
    }
    if (payrollPeriodMode === 'custom_date') return payrollCustomDate;
    return null;
  }, [payrollPeriodMode, todayStr, payrollCustomDate]);

  // Therapist Payroll Items (calculated according to selected period: Daily or Monthly, strictly synced with active cashbook)
  const payrollItems: TherapistPayrollItem[] = useMemo(() => {
    const periodBookings = currentPeriodBookings.filter((b) => {
      if (payrollPeriodMode === 'month' || payrollPeriodMode === 'all') {
        return true;
      }
      return b.booking_date === targetPayrollDate;
    });

    // Sum commissions, completed count, and booking detail per therapist
    const commByTherapist: Record<string, number> = {};
    const countByTherapist: Record<string, number> = {};
    const detailsByTherapist: Record<string, TherapistBookingDetail[]> = {};

    periodBookings.forEach((b) => {
      if (b.booking_items && Array.isArray(b.booking_items)) {
        b.booking_items.forEach((item: any) => {
          if (item.therapist_id) {
            const tId = item.therapist_id;
            const comm = Number(item.commission_earned) || 0;
            commByTherapist[tId] = (commByTherapist[tId] || 0) + comm;
            countByTherapist[tId] = (countByTherapist[tId] || 0) + 1;

            if (!detailsByTherapist[tId]) detailsByTherapist[tId] = [];
            detailsByTherapist[tId].push({
              bookingId: b.id,
              customerName: b.customer_name || 'Customer',
              serviceName: item.service_name || b.service_name || 'Treatment',
              bookingDate: b.booking_date,
              bookingTime: b.booking_time,
              price: Number(item.price || b.price || 0),
              commissionEarned: comm,
            });
          }
        });
      }
    });

    // Check paid payouts in cash_transactions for the chosen period
    const paidByTherapist: Record<string, number> = {};
    transactions
      .filter((t) => t.category === 'payroll' && t.type === 'outflow')
      .forEach((t) => {
        const isDateMatch =
          payrollPeriodMode === 'month'
            ? globalMonthFilter === 'all' || t.transaction_date?.startsWith(globalMonthFilter)
            : payrollPeriodMode === 'all' ||
              (t.reference_id && targetPayrollDate && t.reference_id.includes(targetPayrollDate)) ||
              t.transaction_date?.startsWith(targetPayrollDate || '');

        if (isDateMatch) {
          therapists.forEach((th) => {
            const tShort = th.id.slice(0, 8);
            if (
              (t.reference_id && t.reference_id.includes(tShort)) ||
              (th.name && t.description?.toLowerCase().includes(th.name.toLowerCase()))
            ) {
              paidByTherapist[th.id] = (paidByTherapist[th.id] || 0) + Number(t.amount || 0);
            }
          });
        }
      });

    return therapists.map((th) => {
      const earned = commByTherapist[th.id] || 0;
      const paid = paidByTherapist[th.id] || 0;
      return {
        therapistId: th.id,
        name: th.name,
        phone: th.phone,
        bankInfo: th.bank_info,
        completedBookingsCount: countByTherapist[th.id] || 0,
        totalCommissionEarned: earned,
        totalPaid: paid,
        isPaid: earned > 0 && paid >= earned,
        bookings: detailsByTherapist[th.id] || [],
      };
    });
  }, [
    completedBookings,
    transactions,
    therapists,
    payrollPeriodMode,
    globalMonthFilter,
    targetPayrollDate,
  ]);

  const unpaidCommission = useMemo(() => {
    return payrollItems.reduce(
      (sum, item) => sum + Math.max(0, item.totalCommissionEarned - item.totalPaid),
      0
    );
  }, [payrollItems]);

  // Export CSV
  const handleExportCSV = () => {
    if (currentPeriodTransactions.length === 0) return;
    const headers = ['ID', 'Tanggal', 'Tipe', 'Kategori', 'Rekening', 'Nominal', 'Keterangan', 'Referensi', 'Dibuat Oleh'];
    const rows = currentPeriodTransactions.map((t) => [
      t.id,
      t.transaction_date,
      t.type,
      t.category,
      t.payment_account,
      t.amount,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      t.reference_id || '',
      t.created_by || '',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `buku_kas_serenaraga_${globalMonthFilter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Toast Alert Notification */}
      {alertInfo && (
        <div
          className={`fixed bottom-5 right-5 z-50 p-4 rounded-2xl shadow-xl flex items-center gap-3 animate-fadeIn border text-xs font-semibold ${
            alertInfo.type === 'success'
              ? 'bg-emerald-950 text-emerald-200 border-emerald-800'
              : 'bg-red-950 text-red-200 border-red-800'
          }`}
        >
          {alertInfo.type === 'success' ? (
            <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle size={18} className="text-red-400 shrink-0" />
          )}
          <div>
            <p className="font-bold">{alertInfo.title}</p>
            <p className="text-[11px] opacity-80 mt-0.5">{alertInfo.msg}</p>
          </div>
          <button onClick={() => setAlertInfo(null)} className="p-1 hover:opacity-75 cursor-pointer ml-2">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Page Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl font-bold text-zinc-950 dark:text-white tracking-tight">
              Buku Kas & Keuangan
            </h1>

            {/* Global Month Selector */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-2.5 py-1 shadow-2xs">
              <Calendar size={13} className="text-earth-primary shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Periode:</span>
              <select
                value={globalMonthFilter}
                onChange={(e) => setGlobalMonthFilter(e.target.value)}
                className="bg-transparent text-xs font-bold text-zinc-900 dark:text-white cursor-pointer outline-none"
              >
                <option value="all" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white font-bold">
                  Semua Periode (All Time)
                </option>
                {availableMonths.map((ym) => (
                  <option key={ym} value={ym} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white font-bold">
                    {formatMonthLabel(ym)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Pencatatan kas venue real-time, terintegrasi otomatis dengan POS Kasir & Booking.
          </p>
        </div>

        {/* Tab Navigation Switcher & Settings Button */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/70 border border-zinc-200/50 dark:border-zinc-700/50 text-xs font-medium">
            <button
              onClick={() => setActiveTab('transactions')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'transactions'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-950 dark:text-white shadow-2xs font-bold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
              }`}
            >
              Arus Kas ({currentPeriodTransactions.length})
            </button>
            <button
              onClick={() => setActiveTab('payroll')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'payroll'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-950 dark:text-white shadow-2xs font-bold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
              }`}
            >
              <span>Payroll Terapis</span>
              {unpaidCommission > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'reports'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-950 dark:text-white shadow-2xs font-bold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
              }`}
            >
              Laporan & P&L
            </button>
          </div>

          {/* Account Settings Button */}
          <button
            type="button"
            onClick={() => setIsAccountSettingsModalOpen(true)}
            className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer shadow-2xs"
            title="Pengaturan Rekening & Pos Alokasi"
          >
            <Settings2 size={16} />
          </button>
        </div>
      </div>

      {/* 1. Summary KPI Cards */}
      <FinanceSummaryCards
        totalInflow={totalInflow}
        totalOutflow={totalOutflow}
        netProfit={netProfit}
        unpaidCommission={unpaidCommission}
        formatRp={formatRp}
      />

      {/* 2. Auto Allocation Envelopes (Auto-Split from Revenue) */}
      <AutoAllocationEnvelopes
        totalRevenue={totalRevenue}
        bhpAllocated={bhpAllocated}
        therapistAllocated={therapistAllocated}
        therapistPaid={therapistPaidAllMonth}
        otherExpenses={otherExpenses}
        accounts={accounts}
        formatRp={formatRp}
        onOpenSettings={() => setIsAccountSettingsModalOpen(true)}
        onOpenPayrollTab={() => setActiveTab('payroll')}
      />

      {/* 3. Account Balance Bar */}
      <AccountBalanceBar
        accounts={accounts}
        accountBalances={accountBalances}
        selectedAccount={selectedAccount}
        onSelectAccount={setSelectedAccount}
        formatRp={formatRp}
      />

      {/* 4. Dynamic Tab Content */}
      {activeTab === 'transactions' && (
        <TransactionTable
          transactions={currentPeriodTransactions}
          accounts={accounts}
          selectedAccount={selectedAccount}
          onSelectAccount={setSelectedAccount}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          categoryFilter={categoryFilter}
          onCategoryFilterChange={setCategoryFilter}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenAddModal={(t) => {
            setAddModalInitialType(t);
            setIsAddModalOpen(true);
          }}
          onOpenTransferModal={() => setIsTransferModalOpen(true)}
          onOpenResetModal={() => setIsResetModalOpen(true)}
          onDeleteTransaction={async (id) => {
            if (!confirm('Apakah kamu yakin ingin menghapus transaksi ini?')) return;
            const { error } = await supabase.from('cash_transactions').delete().eq('id', id);
            if (error) {
              showAlert('Gagal Menghapus', error.message, 'danger');
            } else {
              showAlert('Transaksi Dihapus', 'Data transaksi berhasil dihapus.', 'success');
              fetchData();
            }
          }}
          onExportCSV={handleExportCSV}
          formatRp={formatRp}
        />
      )}

      {activeTab === 'payroll' && (
        <TherapistPayrollTab
          payrollItems={payrollItems}
          periodMode={payrollPeriodMode}
          onPeriodModeChange={setPayrollPeriodMode}
          customDate={payrollCustomDate}
          onCustomDateChange={setPayrollCustomDate}
          currentMonthStr={globalMonthFilter}
          accounts={accounts}
          formatRp={formatRp}
          onRefresh={fetchData}
          showAlert={showAlert}
        />
      )}

      {activeTab === 'reports' && (
        <FinanceReportTab
          transactions={currentPeriodTransactions}
          totalInflow={totalInflow}
          totalOutflow={totalOutflow}
          netProfit={netProfit}
          currentMonthStr={globalMonthFilter}
          formatRp={formatRp}
        />
      )}

      {/* Modals */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        initialType={addModalInitialType}
        accounts={accounts}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchData}
        showAlert={showAlert}
      />

      <TransferCashModal
        isOpen={isTransferModalOpen}
        accounts={accounts}
        onClose={() => setIsTransferModalOpen(false)}
        onSuccess={fetchData}
        showAlert={showAlert}
      />

      <ResetCashbookModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onSuccess={fetchData}
        showAlert={showAlert}
      />

      <AccountSettingsModal
        open={isAccountSettingsModalOpen}
        onClose={() => setIsAccountSettingsModalOpen(false)}
        accounts={accounts}
        onSaved={fetchData}
        showAlert={showAlert}
      />
    </div>
  );
}
