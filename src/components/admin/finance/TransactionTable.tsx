'use client';

import React, { useState } from 'react';
import {
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeftRight,
  Download,
  Trash2,
  Eye,
  FileText,
  Plus,
  X,
  RotateCcw,
  Receipt,
  Sparkles,
  ShoppingBag,
  Zap,
  Users,
  Megaphone,
  UserCheck,
  Package,
  Briefcase,
  MoreHorizontal,
} from 'lucide-react';
import { CashTransaction, CustomAccount } from '@/types/finance';

interface TransactionTableProps {
  transactions: CashTransaction[];
  accounts: CustomAccount[];
  selectedAccount: string;
  onSelectAccount: (accId: string) => void;
  typeFilter: 'all' | 'inflow' | 'outflow' | 'transfer';
  onTypeFilterChange: (type: 'all' | 'inflow' | 'outflow' | 'transfer') => void;
  categoryFilter: string;
  onCategoryFilterChange: (cat: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenAddModal: (type: 'inflow' | 'outflow') => void;
  onOpenTransferModal: () => void;
  onOpenResetModal: () => void;
  onDeleteTransaction: (id: string) => void;
  onExportCSV: () => void;
  formatRp: (val: number) => string;
}

export function TransactionTable({
  transactions,
  accounts,
  selectedAccount,
  onSelectAccount,
  typeFilter,
  onTypeFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  searchQuery,
  onSearchChange,
  onOpenAddModal,
  onOpenTransferModal,
  onOpenResetModal,
  onDeleteTransaction,
  onExportCSV,
  formatRp,
}: TransactionTableProps) {
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Filtered list
  const filtered = transactions.filter((t) => {
    // Type filter
    if (typeFilter === 'transfer') {
      if (t.category !== 'internal_transfer') return false;
    } else if (typeFilter !== 'all') {
      if (t.type !== typeFilter || t.category === 'internal_transfer') return false;
    }

    // Account filter
    if (selectedAccount !== 'all' && t.payment_account !== selectedAccount) return false;

    // Category filter
    if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchDesc = t.description?.toLowerCase().includes(q);
      const matchRef = t.reference_id?.toLowerCase().includes(q);
      const matchCat = t.category?.toLowerCase().includes(q);
      return matchDesc || matchRef || matchCat;
    }

    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginated = filtered.slice((safeCurrentPage - 1) * itemsPerPage, safeCurrentPage * itemsPerPage);

  const getAccountLabel = (accId: string) => {
    const acc = accounts.find((a) => a.id === accId);
    return acc ? acc.label : accId.toUpperCase();
  };

  const getCategoryLabel = (cat: string, type: string) => {
    if (cat === 'internal_transfer') return 'Transfer Kas';
    if (cat === 'service_income') return 'Layanan & Booking';
    if (cat === 'retail_income') return 'Produk Retail';
    if (cat === 'owner_capital') return 'Modal Owner';
    if (cat === 'supplies') return 'Bahan Treatment (BHP)';
    if (cat === 'payroll') return 'Gaji / Komisi Terapis';
    if (cat === 'operational') return 'Operasional';
    if (cat === 'marketing') return 'Marketing';
    if (cat === 'owner_prive') return 'Prive Owner';
    return cat.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 shadow-2xs overflow-hidden">
      {/* Header Actions & Filters */}
      <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left: Search & Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search Box */}
          <div className="relative min-w-[200px] flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
            <input
              type="text"
              placeholder="Cari transaksi / kode..."
              value={searchQuery}
              onChange={(e) => {
                onSearchChange(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none focus:border-zinc-950 dark:focus:border-white transition-colors"
            />
          </div>

          {/* Type Filter Pills */}
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-xl text-xs font-medium">
            <button
              onClick={() => {
                onTypeFilterChange('all');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                typeFilter === 'all'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-950 dark:text-white shadow-2xs font-semibold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
              }`}
            >
              Semua ({transactions.length})
            </button>
            <button
              onClick={() => {
                onTypeFilterChange('inflow');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                typeFilter === 'inflow'
                  ? 'bg-emerald-500 text-white shadow-2xs font-semibold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-emerald-600'
              }`}
            >
              Masuk
            </button>
            <button
              onClick={() => {
                onTypeFilterChange('outflow');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                typeFilter === 'outflow'
                  ? 'bg-rose-500 text-white shadow-2xs font-semibold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-rose-600'
              }`}
            >
              Keluar
            </button>
            <button
              onClick={() => {
                onTypeFilterChange('transfer');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                typeFilter === 'transfer'
                  ? 'bg-blue-500 text-white shadow-2xs font-semibold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-blue-600'
              }`}
            >
              Transfer
            </button>
          </div>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onOpenAddModal('outflow')}
            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all active:scale-[0.98]"
          >
            <Plus size={14} />
            <span>Catat Pengeluaran</span>
          </button>
          <button
            onClick={() => onOpenAddModal('inflow')}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all active:scale-[0.98]"
          >
            <Plus size={14} />
            <span>Catat Pemasukan</span>
          </button>
          <button
            onClick={onOpenTransferModal}
            className="px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all active:scale-[0.98]"
          >
            <ArrowLeftRight size={14} />
            <span>Transfer Kas</span>
          </button>
          <button
            onClick={onExportCSV}
            className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all"
            title="Download CSV"
          >
            <Download size={14} />
          </button>
          <button
            onClick={onOpenResetModal}
            className="p-2 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/40 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all"
            title="Reset / Bersihkan Data Buku Kas"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 text-zinc-500 dark:text-zinc-400 uppercase font-semibold text-[10px] tracking-wider">
              <th className="py-3 px-4">Tanggal</th>
              <th className="py-3 px-4">Tipe & Kategori</th>
              <th className="py-3 px-4">Deskripsi / Referensi</th>
              <th className="py-3 px-4">Rekening / Kas</th>
              <th className="py-3 px-4 text-right">Nominal</th>
              <th className="py-3 px-4 text-center">Bukti / Struk</th>
              <th className="py-3 px-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-zinc-400 dark:text-zinc-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Receipt size={28} className="opacity-40" />
                    <p className="font-medium text-xs">Belum ada transaksi pada filter ini.</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginated.map((tx) => {
                const isTransfer = tx.category === 'internal_transfer';
                const isInflow = tx.type === 'inflow';
                const isOutflow = tx.type === 'outflow';

                return (
                  <tr
                    key={tx.id}
                    className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors group"
                  >
                    {/* Date */}
                    <td className="py-3 px-4 whitespace-nowrap font-medium text-zinc-900 dark:text-zinc-100 font-mono text-[11px]">
                      {formatDate(tx.transaction_date)}
                    </td>

                    {/* Type & Category */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-6 w-6 rounded-lg flex items-center justify-center shrink-0 ${
                            isTransfer
                              ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400'
                              : isInflow
                              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
                              : 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400'
                          }`}
                        >
                          {isTransfer ? (
                            <ArrowLeftRight size={12} />
                          ) : isInflow ? (
                            <ArrowUpRight size={13} />
                          ) : (
                            <ArrowDownRight size={13} />
                          )}
                        </div>
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {getCategoryLabel(tx.category, tx.type)}
                        </span>
                      </div>
                    </td>

                    {/* Description / Reference ID */}
                    <td className="py-3 px-4 min-w-[200px]">
                      <div className="space-y-0.5">
                        <p className="text-zinc-800 dark:text-zinc-200 line-clamp-1">{tx.description}</p>
                        {tx.reference_id && (
                          <span className="inline-block px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-[10px] font-mono text-zinc-600 dark:text-zinc-400">
                            Ref: {tx.reference_id}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Payment Account */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700/60 text-[11px] font-semibold text-zinc-800 dark:text-zinc-200">
                        {getAccountLabel(tx.payment_account)}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-4 whitespace-nowrap text-right font-mono font-bold">
                      <span
                        className={
                          isTransfer
                            ? 'text-blue-600 dark:text-blue-400'
                            : isInflow
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }
                      >
                        {isInflow ? '+' : '-'} {formatRp(Number(tx.amount))}
                      </span>
                    </td>

                    {/* Receipt Preview */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {tx.receipt_url ? (
                        <button
                          onClick={() => setPreviewImageUrl(tx.receipt_url!)}
                          className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-blue-600 dark:text-blue-400 transition-colors inline-flex items-center gap-1 cursor-pointer font-medium text-[11px]"
                          title="Lihat Struk/Nota"
                        >
                          <Eye size={13} />
                          <span>Struk</span>
                        </button>
                      ) : (
                        <span className="text-zinc-300 dark:text-zinc-600 text-[10px]">-</span>
                      )}
                    </td>

                    {/* Delete Action */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => onDeleteTransaction(tx.id)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                        title="Hapus Transaksi"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="p-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <span>
            Menampilkan {paginated.length} dari {filtered.length} transaksi
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safeCurrentPage === 1}
              className="px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 disabled:opacity-40 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer disabled:cursor-not-allowed"
            >
              Sebelumnya
            </button>
            <span className="px-2 font-mono font-medium">
              {safeCurrentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safeCurrentPage === totalPages}
              className="px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 disabled:opacity-40 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer disabled:cursor-not-allowed"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      )}

      {/* Receipt Image Modal */}
      {previewImageUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-xs animate-fadeIn"
          onClick={() => setPreviewImageUrl(null)}
        >
          <div
            className="relative max-w-lg w-full bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl p-4 border border-zinc-200 dark:border-zinc-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <h4 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Receipt size={16} />
                <span>Bukti Struk / Nota Pembayaran</span>
              </h4>
              <button
                onClick={() => setPreviewImageUrl(null)}
                className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            <div className="mt-3 flex items-center justify-center max-h-[70vh] overflow-auto rounded-xl bg-zinc-50 dark:bg-zinc-950 p-2">
              <img
                src={previewImageUrl}
                alt="Receipt Struk"
                className="max-h-[65vh] w-auto object-contain rounded-lg shadow-sm"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
