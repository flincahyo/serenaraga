'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Wallet, TrendingUp, TrendingDown, Plus, Download, Search,
  Calendar, ArrowUpRight, ArrowDownRight, Filter, Receipt, Trash2,
  Building2, QrCode, CreditCard, Banknote, FileText, X, Check, Loader2,
  Sparkles, AlertCircle, ShoppingBag, Zap, Users, Megaphone, UserCheck,
  MoreHorizontal, Package, Briefcase, Smartphone, ArrowLeftRight, Upload, Image as ImageIcon, Eye,
  Landmark, Coins, Settings, Pencil
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useUser } from '@/lib/user-context';

type TransactionType = 'inflow' | 'outflow';
type PaymentAccount = string;

export type CustomAccount = {
  id: string;
  label: string;
  icon: string;
  color: string;
  show_in_invoice?: boolean;
};

const DEFAULT_ACCOUNTS: CustomAccount[] = [
  { id: 'qris', label: 'QRIS', icon: 'Smartphone', color: 'purple', show_in_invoice: true },
  { id: 'bca', label: 'Bank BCA', icon: 'Building2', color: 'blue', show_in_invoice: true },
  { id: 'cash', label: 'Kas Laci POS', icon: 'Banknote', color: 'emerald', show_in_invoice: true },
  { id: 'edc', label: 'Kartu EDC', icon: 'CreditCard', color: 'amber', show_in_invoice: true },
];

const ACCOUNT_ICONS: Record<string, any> = {
  Smartphone,
  Building2,
  Banknote,
  CreditCard,
  QrCode,
  Landmark,
  Wallet,
  Coins,
};

const AVAILABLE_ICONS = [
  { id: 'Smartphone', label: 'QRIS / E-Wallet', icon: Smartphone },
  { id: 'Building2', label: 'Gedung Bank', icon: Building2 },
  { id: 'Banknote', label: 'Uang Tunai (Kas)', icon: Banknote },
  { id: 'CreditCard', label: 'Kartu EDC / Debit', icon: CreditCard },
  { id: 'QrCode', label: 'QR Code', icon: QrCode },
  { id: 'Landmark', label: 'Bank Utama / Monumen', icon: Landmark },
  { id: 'Wallet', label: 'Dompet Digital', icon: Wallet },
  { id: 'Coins', label: 'Koin / Tunai', icon: Coins },
];

const AVAILABLE_COLORS: Record<string, { label: string; class: string }> = {
  purple: { label: 'Ungu (QRIS)', class: 'text-purple-600 bg-purple-50 dark:bg-purple-950/30 border-purple-200' },
  blue: { label: 'Biru (BCA)', class: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30 border-blue-200' },
  emerald: { label: 'Hijau (Kas)', class: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200' },
  amber: { label: 'Kuning (EDC)', class: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30 border-amber-200' },
  rose: { label: 'Merah', class: 'text-rose-600 bg-rose-50 dark:bg-rose-950/30 border-rose-200' },
  indigo: { label: 'Nila (Mandiri/BRI)', class: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200' },
};

type CashTransaction = {
  id: string;
  transaction_date: string;
  type: TransactionType;
  category: string;
  payment_account: PaymentAccount;
  amount: number;
  description: string;
  reference_id?: string | null;
  receipt_url?: string | null;
  created_by?: string | null;
  created_at?: string;
};

type CategoryItem = {
  id: string;
  label: string;
  icon: any;
};

const CATEGORIES_OUTFLOW: CategoryItem[] = [
  { id: 'supplies', label: 'Supplies & Bahan Treatment', icon: ShoppingBag },
  { id: 'operational', label: 'Operasional Venue (Listrik/Air/Wifi)', icon: Zap },
  { id: 'payroll', label: 'SDM & Komisi Terapis', icon: Users },
  { id: 'marketing', label: 'Marketing & Iklan', icon: Megaphone },
  { id: 'owner_prive', label: 'Penarikan Owner (Prive)', icon: UserCheck },
  { id: 'other', label: 'Lain-lain', icon: MoreHorizontal },
];

const CATEGORIES_INFLOW: CategoryItem[] = [
  { id: 'service_income', label: 'Pemasukan Service / Treatment', icon: Sparkles },
  { id: 'retail_income', label: 'Penjualan Produk Retail', icon: Package },
  { id: 'owner_capital', label: 'Suntikan Modal Owner', icon: Briefcase },
  { id: 'other_income', label: 'Pemasukan Lainnya', icon: MoreHorizontal },
];

const TRANSFER_CATEGORY: CategoryItem = {
  id: 'internal_transfer', label: 'Transfer Internal Kas', icon: ArrowLeftRight
};

function getCategoryDetails(catRaw: string, type?: TransactionType): CategoryItem {
  if (catRaw === 'internal_transfer') return TRANSFER_CATEGORY;

  const all = [...CATEGORIES_INFLOW, ...CATEGORIES_OUTFLOW];
  const raw = (catRaw || '').toLowerCase();

  let found = all.find(c => c.id === catRaw);
  if (found) return found;

  found = all.find(c => c.id.toLowerCase() === raw);
  if (found) return found;

  found = all.find(c => c.label.toLowerCase() === raw || raw.includes(c.id.toLowerCase()));
  if (found) return found;

  if (raw.includes('transfer')) return TRANSFER_CATEGORY;
  if (raw.includes('service') || raw.includes('treatment') || raw.includes('massage')) return CATEGORIES_INFLOW[0];
  if (raw.includes('retail') || raw.includes('produk')) return CATEGORIES_INFLOW[1];
  if (raw.includes('modal') || raw.includes('capital')) return CATEGORIES_INFLOW[2];
  if (raw.includes('suppli') || raw.includes('bahan')) return CATEGORIES_OUTFLOW[0];
  if (raw.includes('operasional') || raw.includes('listrik') || raw.includes('air') || raw.includes('wifi')) return CATEGORIES_OUTFLOW[1];
  if (raw.includes('sdm') || raw.includes('gaji') || raw.includes('komisi') || raw.includes('payroll')) return CATEGORIES_OUTFLOW[2];
  if (raw.includes('market') || raw.includes('iklan') || raw.includes('promo')) return CATEGORIES_OUTFLOW[3];
  if (raw.includes('prive') || raw.includes('owner')) return CATEGORIES_OUTFLOW[4];

  if (type === 'inflow') return { id: 'other_income', label: catRaw || 'Pemasukan', icon: Sparkles };
  return { id: 'other', label: catRaw || 'Pengeluaran', icon: ShoppingBag };
}

const ACCOUNT_CONFIG: Record<PaymentAccount, { label: string; icon: any; color: string }> = {
  qris: { label: 'QRIS', icon: Smartphone, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/30 border-purple-200' },
  bca: { label: 'Bank BCA', icon: Building2, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30 border-blue-200' },
  cash: { label: 'Kas Laci POS', icon: Banknote, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200' },
  edc: { label: 'Kartu EDC', icon: CreditCard, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30 border-amber-200' },
};

const formatRp = (n: number) => `Rp ${Number(n || 0).toLocaleString('id-ID')}`;

export default function FinancePage() {
  const { user } = useUser();
  const supabase = createClient();

  const [transactions, setTransactions] = useState<CashTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableExists, setTableExists] = useState(true);
  const [bhpPercent, setBhpPercent] = useState<number>(10);

  // Fetch settings for BHP percentage
  useEffect(() => {
    const fetchBhpSetting = async () => {
      const { data } = await supabase.from('settings').select('value').eq('key', 'bhp_pct').single();
      if (data && data.value) {
        setBhpPercent(Number(data.value) || 10);
      }
    };
    fetchBhpSetting();
  }, [supabase]);

  const [customAccounts, setCustomAccounts] = useState<CustomAccount[]>(DEFAULT_ACCOUNTS);
  const [manageAccountsOpen, setManageAccountsOpen] = useState(false);
  const [editingAccId, setEditingAccId] = useState<string | null>(null);
  const [newAccLabel, setNewAccLabel] = useState('');
  const [newAccIcon, setNewAccIcon] = useState('Building2');
  const [newAccColor, setNewAccColor] = useState('blue');
  const [newAccShowInInvoice, setNewAccShowInInvoice] = useState(true);
  const [savingAcc, setSavingAcc] = useState(false);

  // Fetch Custom Accounts from Settings
  const fetchAccounts = useCallback(async () => {
    const { data } = await supabase.from('settings').select('value').eq('key', 'payment_accounts').single();
    if (data && data.value) {
      try {
        const parsed = JSON.parse(data.value);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCustomAccounts(parsed);
        }
      } catch (e) {
        console.error('Error parsing payment_accounts setting:', e);
      }
    }
  }, [supabase]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const getAccountConfig = useCallback((accId: string) => {
    const found = customAccounts.find(a => a.id === accId || a.id.toLowerCase() === (accId || '').toLowerCase());
    if (found) {
      const IconComp = ACCOUNT_ICONS[found.icon] || Wallet;
      const colorClass = AVAILABLE_COLORS[found.color]?.class || AVAILABLE_COLORS.purple.class;
      return {
        label: found.label,
        icon: IconComp,
        color: colorClass,
        iconName: found.icon,
        show_in_invoice: found.show_in_invoice !== false
      };
    }
    return {
      label: accId ? accId.toUpperCase() : 'REKENING',
      icon: Wallet,
      color: 'text-zinc-600 bg-zinc-50 dark:bg-zinc-800 border-zinc-200',
      iconName: 'Wallet',
      show_in_invoice: true
    };
  }, [customAccounts]);

  const startEditAccount = (acc: CustomAccount) => {
    setEditingAccId(acc.id);
    setNewAccLabel(acc.label);
    setNewAccIcon(acc.icon);
    setNewAccColor(acc.color);
    setNewAccShowInInvoice(acc.show_in_invoice !== false);
  };

  const cancelEditAccount = () => {
    setEditingAccId(null);
    setNewAccLabel('');
    setNewAccIcon('Building2');
    setNewAccColor('blue');
    setNewAccShowInInvoice(true);
  };

  // Handle Add or Edit Account
  const handleSaveAccount = async () => {
    if (!newAccLabel.trim()) return;
    setSavingAcc(true);

    let updated: CustomAccount[];
    if (editingAccId) {
      updated = customAccounts.map(a => {
        if (a.id === editingAccId) {
          return {
            ...a,
            label: newAccLabel.trim(),
            icon: newAccIcon,
            color: newAccColor,
            show_in_invoice: newAccShowInInvoice,
          };
        }
        return a;
      });
    } else {
      const generatedId = newAccLabel.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
      const existing = customAccounts.find(a => a.id === generatedId);
      const finalId = existing ? `${generatedId}_${Date.now().toString().slice(-4)}` : generatedId;

      const newAcc: CustomAccount = {
        id: finalId,
        label: newAccLabel.trim(),
        icon: newAccIcon,
        color: newAccColor,
        show_in_invoice: newAccShowInInvoice,
      };
      updated = [...customAccounts, newAcc];
    }

    setCustomAccounts(updated);
    await supabase.from('settings').upsert({
      key: 'payment_accounts',
      value: JSON.stringify(updated),
      updated_at: new Date().toISOString()
    });

    cancelEditAccount();
    setSavingAcc(false);
  };

  // Toggle invoice visibility directly from list
  const handleToggleInvoiceVisibility = async (accId: string) => {
    const updated = customAccounts.map(a => {
      if (a.id === accId) {
        return { ...a, show_in_invoice: a.show_in_invoice === false ? true : false };
      }
      return a;
    });
    setCustomAccounts(updated);
    await supabase.from('settings').upsert({
      key: 'payment_accounts',
      value: JSON.stringify(updated),
      updated_at: new Date().toISOString()
    });
  };

  // Handle Delete Account
  const handleDeleteAccount = async (accId: string) => {
    showConfirm(
      'Hapus Rekening Kas',
      `Yakin ingin menghapus rekening '${getAccountConfig(accId).label}'? Transaksi lama yang menggunakan rekening ini tetap tersimpan.`,
      async () => {
        const updated = customAccounts.filter(a => a.id !== accId);
        setCustomAccounts(updated);
        await supabase.from('settings').upsert({
          key: 'payment_accounts',
          value: JSON.stringify(updated),
          updated_at: new Date().toISOString()
        });
      },
      'danger',
      'Ya, Hapus Rekening'
    );
  };

  // Filters
  const [search, setSearch] = useState('');
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'month' | 'today' | 'all'>('month');

  // Standard Form Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<TransactionType>('outflow');
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string>('supplies');
  const [account, setAccount] = useState<PaymentAccount>('cash');
  const [description, setDescription] = useState<string>('');
  const [transDate, setTransDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // Struk Upload State
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Transfer Modal State
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferAmount, setTransferAmount] = useState<string>('');
  const [transferFrom, setTransferFrom] = useState<PaymentAccount>('qris');
  const [transferTo, setTransferTo] = useState<PaymentAccount>('bca');
  const [transferNotes, setTransferNotes] = useState<string>('');
  const [transferDate, setTransferDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [transferSubmitting, setTransferSubmitting] = useState(false);

  // Receipt Viewer Modal State
  const [viewReceiptUrl, setViewReceiptUrl] = useState<string | null>(null);

  // Custom Confirm/Alert Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type?: 'warning' | 'danger' | 'info';
    confirmLabel?: string;
    cancelLabel?: string | null;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    cancelLabel: 'Batal',
    onConfirm: () => {},
  });

  const showAlert = (title: string, message: string, type: 'warning' | 'danger' | 'info' = 'warning') => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      type,
      cancelLabel: null,
      confirmLabel: 'Mengerti',
      onConfirm: () => {},
    });
  };

  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    type: 'warning' | 'danger' | 'info' = 'warning',
    confirmLabel = 'Ya, Lanjutkan'
  ) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      type,
      cancelLabel: 'Batal',
      confirmLabel,
      onConfirm,
    });
  };

  const [completedBookingsMap, setCompletedBookingsMap] = useState<Record<string, number>>({});

  // Fetch transactions and completed bookings bhp_cost
  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data, error }, { data: bookingsData }] = await Promise.all([
        supabase
          .from('cash_transactions')
          .select('*')
          .order('transaction_date', { ascending: false })
          .order('created_at', { ascending: false }),
        supabase
          .from('bookings')
          .select('id, booking_date, bhp_cost')
          .eq('status', 'Completed')
      ]);

      if (error) {
        if (
          error.code === '42P01' ||
          error.code === 'PGRST205' ||
          error.message?.includes('cash_transactions') ||
          error.message?.includes('does not exist')
        ) {
          setTableExists(false);
        } else {
          console.error('Error fetching cash transactions:', error);
        }
        setTransactions([]);
      } else {
        setTableExists(true);
        setTransactions(data || []);
      }

      if (bookingsData) {
        const map: Record<string, number> = {};
        bookingsData.forEach(b => {
          const cost = Number(b.bhp_cost) || 0;
          map[b.id] = cost;
          map[b.id.substring(0, 8)] = cost;
          
          if (b.booking_date) {
            const dateObj = new Date(b.booking_date + 'T00:00:00');
            const y = dateObj.getFullYear();
            const m = String(dateObj.getMonth() + 1).padStart(2, '0');
            const last4 = b.id.substring(b.id.length - 4).toUpperCase();
            map[`SR-${y}${m}-${last4}`] = cost;
          }
        });
        setCompletedBookingsMap(map);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Upload receipt helper
  const uploadReceiptFile = async (file: File): Promise<string | null> => {
    try {
      const ext = file.name.split('.').pop() || 'png';
      const fileName = `receipt_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from('media').upload(fileName, file, { contentType: file.type });
      if (!uploadErr) {
        const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(fileName);
        return publicUrl;
      }
    } catch (e) {
      console.warn('Storage upload fallback:', e);
    }

    // Fallback: Data URL if storage bucket fails
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  };

  // Helper to format ISO timestamp preserving current local time of day
  const getIsoTransactionDate = (dateStr: string): string => {
    const now = new Date();
    if (!dateStr) return now.toISOString();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    if (dateStr === todayStr) {
      return now.toISOString();
    }
    const [y, m, d] = dateStr.split('-').map(Number);
    const localDate = new Date(y, m - 1, d, now.getHours(), now.getMinutes(), now.getSeconds());
    return localDate.toISOString();
  };

  // Handle Form Submit (Expense / Income)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0 || !description.trim()) return;

    setSubmitting(true);
    try {
      let uploadedUrl: string | null = null;
      if (receiptFile) {
        uploadedUrl = await uploadReceiptFile(receiptFile);
      }

      const payload = {
        transaction_date: getIsoTransactionDate(transDate),
        type: modalType,
        category,
        payment_account: account,
        amount: Number(amount),
        description: description.trim(),
        receipt_url: uploadedUrl,
        created_by: user?.displayName || user?.email || 'Admin',
      };

      const { error } = await supabase.from('cash_transactions').insert(payload);

      if (error) {
        showAlert('Gagal Menyimpan', error.message, 'danger');
      } else {
        setModalOpen(false);
        setAmount('');
        setDescription('');
        setReceiptFile(null);
        setReceiptPreview(null);
        fetchTransactions();
      }
    } catch (err: any) {
      showAlert('Terjadi Kesalahan', err.message, 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Internal Cash Transfer Submit
  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferAmount || Number(transferAmount) <= 0) return;
    if (transferFrom === transferTo) {
      showAlert('Transfer Tidak Valid', 'Rekening asal dan rekening tujuan tidak boleh sama!', 'warning');
      return;
    }

    setTransferSubmitting(true);
    try {
      const refId = `TRF-${Date.now()}`;
      const tDate = getIsoTransactionDate(transferDate);
      const numAmt = Number(transferAmount);
      const userLabel = user?.displayName || user?.email || 'Admin';

      const notesText = transferNotes.trim() ? ` (${transferNotes.trim()})` : '';

      // 1. Outflow from source account
      const outflowPayload = {
        transaction_date: tDate,
        type: 'outflow' as TransactionType,
        category: 'internal_transfer',
        payment_account: transferFrom,
        amount: numAmt,
        description: `Transfer Kas ke ${ACCOUNT_CONFIG[transferTo].label}${notesText}`,
        reference_id: refId,
        created_by: userLabel,
      };

      // 2. Inflow to target account
      const inflowPayload = {
        transaction_date: tDate,
        type: 'inflow' as TransactionType,
        category: 'internal_transfer',
        payment_account: transferTo,
        amount: numAmt,
        description: `Transfer Kas dari ${ACCOUNT_CONFIG[transferFrom].label}${notesText}`,
        reference_id: refId,
        created_by: userLabel,
      };

      const { error } = await supabase.from('cash_transactions').insert([outflowPayload, inflowPayload]);

      if (error) {
        showAlert('Gagal Transfer', error.message, 'danger');
      } else {
        setTransferModalOpen(false);
        setTransferAmount('');
        setTransferNotes('');
        fetchTransactions();
      }
    } catch (err: any) {
      showAlert('Terjadi Kesalahan', err.message, 'danger');
    } finally {
      setTransferSubmitting(false);
    }
  };

  // Delete transaction
  const handleDelete = (id: string) => {
    showConfirm(
      'Hapus Catatan Transaksi',
      'Yakin ingin menghapus catatan transaksi ini dari Buku Kas? Tindakan ini tidak dapat dibatalkan.',
      async () => {
        try {
          const { error } = await supabase.from('cash_transactions').delete().eq('id', id);
          if (error) {
            showAlert('Gagal Menghapus', error.message, 'danger');
          } else {
            fetchTransactions();
          }
        } catch (err: any) {
          showAlert('Gagal Menghapus', err.message, 'danger');
        }
      },
      'danger',
      'Hapus Transaksi'
    );
  };

  // Pagination & Filter calculations
  const [itemsPerPage, setItemsPerPage] = useState<number | 'all'>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const todayStr = now.toISOString().split('T')[0];

  const filteredTransactions = transactions.filter(t => {
    const tDate = t.transaction_date.split('T')[0];
    
    // Date filter
    if (dateFilter === 'month' && !tDate.startsWith(currentMonthStr)) return false;
    if (dateFilter === 'today' && tDate !== todayStr) return false;

    // Account filter
    if (accountFilter !== 'all' && t.payment_account !== accountFilter) return false;

    // Type filter
    if (typeFilter !== 'all' && t.type !== typeFilter) return false;

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchDesc = t.description.toLowerCase().includes(q);
      const matchRef = t.reference_id?.toLowerCase().includes(q);
      const matchCat = t.category.toLowerCase().includes(q);
      return matchDesc || matchRef || matchCat;
    }

    return true;
  });

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, accountFilter, typeFilter, dateFilter, itemsPerPage]);

  const totalFilteredCount = filteredTransactions.length;
  const numPerPage = itemsPerPage === 'all' ? totalFilteredCount : Number(itemsPerPage);
  const totalPages = itemsPerPage === 'all' || totalFilteredCount === 0 ? 1 : Math.ceil(totalFilteredCount / numPerPage);

  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = totalFilteredCount === 0 ? 0 : (safeCurrentPage - 1) * numPerPage;
  const endIndex = itemsPerPage === 'all' ? totalFilteredCount : Math.min(startIndex + numPerPage, totalFilteredCount);

  const paginatedTransactions = itemsPerPage === 'all'
    ? filteredTransactions
    : filteredTransactions.slice(startIndex, endIndex);

  // Calculate Metrics (Exclude internal transfers & owner capital injections from Omset Revenue so Profit/Loss & Turnover aren't inflated)
  const totalLiquid = transactions.reduce((sum, t) => {
    return t.type === 'inflow' ? sum + Number(t.amount) : sum - Number(t.amount);
  }, 0);

  const monthlyTransactions = transactions.filter(t => t.transaction_date.startsWith(currentMonthStr));
  
  // Pure Operational Sales Revenue (Omset Penjualan Service & Produk)
  const monthlyInflow = monthlyTransactions
    .filter(t => t.type === 'inflow' && t.category !== 'internal_transfer' && t.category !== 'owner_capital')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  // Total Inflow Including Capital Injections (For total cash flow view)
  const monthlyTotalInflowInclCapital = monthlyTransactions
    .filter(t => t.type === 'inflow' && t.category !== 'internal_transfer')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const monthlyOutflow = monthlyTransactions
    .filter(t => t.type === 'outflow' && t.category !== 'internal_transfer')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  // Net Operational Cash Flow (Omset - Pengeluaran)
  const netMonthly = monthlyInflow - monthlyOutflow;

  // BHP (Bahan Habis Pakai) Reserve Calculation matching current logged cash transactions
  const monthlyBhpTarget = monthlyTransactions
    .filter(t => t.type === 'inflow' && t.category !== 'internal_transfer' && t.category !== 'owner_capital')
    .reduce((sum, t) => {
      const ref = t.reference_id;
      let matchedBhp = 0;
      if (ref && completedBookingsMap[ref] !== undefined) {
        matchedBhp = completedBookingsMap[ref];
      } else {
        const foundKey = Object.keys(completedBookingsMap).find(k => k && (t.description.includes(k) || (t.reference_id && t.reference_id.includes(k))));
        if (foundKey) {
          matchedBhp = completedBookingsMap[foundKey];
        } else {
          matchedBhp = Math.round((Number(t.amount) * bhpPercent) / 100);
        }
      }
      return sum + matchedBhp;
    }, 0);

  const monthlyBhpSpent = monthlyTransactions
    .filter(t => t.type === 'outflow' && (t.category === 'supplies' || t.description.toLowerCase().includes('bhp') || t.description.toLowerCase().includes('suppli') || t.description.toLowerCase().includes('bahan')))
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const bhpReserveRemaining = monthlyBhpTarget - monthlyBhpSpent;

  // Calculate Account Balances for all custom accounts
  const accountBalances: Record<string, number> = {};
  customAccounts.forEach(a => { accountBalances[a.id] = 0; });
  transactions.forEach(t => {
    if (accountBalances[t.payment_account] === undefined) {
      accountBalances[t.payment_account] = 0;
    }
    if (t.type === 'inflow') accountBalances[t.payment_account] += Number(t.amount);
    else accountBalances[t.payment_account] -= Number(t.amount);
  });

  // Export Excel / CSV with Semicolon Delimiter & UTF-8 BOM for perfect Microsoft Excel column separation
  const exportCSV = () => {
    if (filteredTransactions.length === 0) return;

    const headers = [
      'Waktu Transaksi',
      'Jenis',
      'Kategori',
      'Keterangan',
      'Ref ID / Invoice',
      'Rekening Pembayaran',
      'Nominal (Rp)',
      'Pencatat'
    ];

    const rows = filteredTransactions.map(t => {
      const dateObj = new Date(t.transaction_date);
      const dateFormatted = dateObj.toLocaleDateString('id-ID', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      }) + ' ' + dateObj.toLocaleTimeString('id-ID', {
        hour: '2-digit', minute: '2-digit'
      }).replace('.', ':');

      const jenisStr = t.type === 'inflow' ? 'Pemasukan' : 'Pengeluaran';
      const catStr = getCategoryDetails(t.category, t.type).label;
      const descStr = `"${t.description.replace(/"/g, '""')}"`;
      const refStr = `"${(t.reference_id || '-').replace(/"/g, '""')}"`;
      const accStr = t.payment_account.toUpperCase();
      const nominalVal = t.type === 'inflow' ? Number(t.amount) : -Number(t.amount);
      const creatorStr = `"${(t.created_by || 'Admin').replace(/"/g, '""')}"`;

      return [
        `"${dateFormatted}"`,
        `"${jenisStr}"`,
        `"${catStr}"`,
        descStr,
        refStr,
        `"${accStr}"`,
        nominalVal,
        creatorStr
      ];
    });

    // Subtotal Summary Rows
    const totalInflow = filteredTransactions.filter(t => t.type === 'inflow').reduce((s, t) => s + Number(t.amount), 0);
    const totalOutflow = filteredTransactions.filter(t => t.type === 'outflow').reduce((s, t) => s + Number(t.amount), 0);
    const netTotal = totalInflow - totalOutflow;

    const summaryInflowRow  = ['"TOTAL PEMASUKAN"', '', '', '', '', '', totalInflow, ''];
    const summaryOutflowRow = ['"TOTAL PENGELUARAN"', '', '', '', '', '', -totalOutflow, ''];
    const summaryNetRow     = ['"SALDO ARUS KAS BERSIH"', '', '', '', '', '', netTotal, ''];

    // UTF-8 BOM (\uFEFF) + Semicolon Delimited CSV for automatic Excel Column Splitting
    const csvContent = '\uFEFF' + [
      headers.join(';'),
      ...rows.map(r => r.join(';')),
      '',
      summaryInflowRow.join(';'),
      summaryOutflowRow.join(';'),
      summaryNetRow.join(';')
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Buku_Kas_Serenaraga_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-earth-primary/10 text-earth-primary flex items-center justify-center">
              <Wallet size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Buku Kas & Keuangan</h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Pencatatan kas venue, terintegrasi otomatis dengan POS & Invoice.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full md:w-auto">
          {/* 1. Pengeluaran */}
          <button
            onClick={() => {
              setModalType('outflow');
              setCategory('supplies');
              setReceiptFile(null);
              setReceiptPreview(null);
              setModalOpen(true);
            }}
            className="px-3.5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] transition-all"
          >
            <Plus size={15} />
            <span>Pengeluaran</span>
          </button>

          {/* 2. Pemasukan */}
          <button
            onClick={() => {
              setModalType('inflow');
              setCategory('owner_capital');
              setReceiptFile(null);
              setReceiptPreview(null);
              setModalOpen(true);
            }}
            className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] transition-all"
          >
            <Plus size={15} />
            <span>Pemasukan</span>
          </button>

          {/* 3. Transfer Kas */}
          <button
            onClick={() => {
              setTransferModalOpen(true);
            }}
            className="px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] transition-all"
          >
            <ArrowLeftRight size={15} />
            <span>Transfer Kas</span>
          </button>

          {/* 4. Export */}
          <button
            onClick={exportCSV}
            disabled={filteredTransactions.length === 0}
            className="p-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
            title="Export CSV"
          >
            <Download size={15} />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* SQL Setup Notice (Shown if Table doesn't exist in Supabase yet) */}
      {!tableExists && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-2xl p-5 text-amber-900 dark:text-amber-200 space-y-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="text-amber-600 shrink-0" size={20} />
            <h3 className="font-bold text-sm">Persiapan Tabel Database (`cash_transactions`)</h3>
          </div>
          <p className="text-xs leading-relaxed opacity-90">
            Tabel <code className="bg-amber-100 dark:bg-amber-900/60 px-1.5 py-0.5 rounded font-mono text-[11px]">cash_transactions</code> belum terdeteksi di Supabase project kamu. Silakan jalankan query SQL berikut di <strong>Supabase Dashboard → SQL Editor</strong>:
          </p>
          <pre className="bg-zinc-900 text-zinc-100 text-[11px] p-3 rounded-xl overflow-x-auto font-mono select-all border border-zinc-800">
{`CREATE TABLE IF NOT EXISTS cash_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  type VARCHAR(20) NOT NULL CHECK (type IN ('inflow', 'outflow')),
  category VARCHAR(50) NOT NULL,
  payment_account VARCHAR(20) NOT NULL DEFAULT 'qris',
  amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  description TEXT NOT NULL,
  reference_id TEXT,
  receipt_url TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);`}
          </pre>
          <div className="flex justify-end pt-1">
            <button
              onClick={fetchTransactions}
              className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 transition-colors"
            >
              Cek Ulang Koneksi Database
            </button>
          </div>
        </div>
      )}

      {/* KPI Cards (2x2 Grid on Mobile, 4 Columns on Desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Total Liquid Cash */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 sm:p-5 shadow-sm space-y-1 sm:space-y-2">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-bold text-zinc-400 uppercase tracking-wider truncate">Total Kas Liquid</span>
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-earth-primary/10 text-earth-primary flex items-center justify-center shrink-0">
              <Wallet size={14} className="sm:w-4 sm:h-4" />
            </div>
          </div>
          <p className="text-base sm:text-2xl font-black text-zinc-900 dark:text-white font-mono truncate">{formatRp(totalLiquid)}</p>
          <p className="text-[9px] sm:text-[11px] text-zinc-400 truncate">Saldo seluruh rekening</p>
        </div>

        {/* Omset Penjualan (Pemasukan Operasional) */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 sm:p-5 shadow-sm space-y-1 sm:space-y-2">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider truncate">Omset (Bulan Ini)</span>
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center shrink-0">
              <ArrowUpRight size={14} className="sm:w-[18px] sm:h-[18px]" />
            </div>
          </div>
          <p className="text-base sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono truncate">{formatRp(monthlyInflow)}</p>
          <p className="text-[9px] sm:text-[11px] text-zinc-400 truncate">Total service & POS</p>
        </div>

        {/* Pengeluaran Bulan Ini */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 sm:p-5 shadow-sm space-y-1 sm:space-y-2">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider truncate">Pengeluaran</span>
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center shrink-0">
              <ArrowDownRight size={14} className="sm:w-[18px] sm:h-[18px]" />
            </div>
          </div>
          <p className="text-base sm:text-2xl font-black text-rose-600 dark:text-rose-400 font-mono truncate">{formatRp(monthlyOutflow)}</p>
          <p className="text-[9px] sm:text-[11px] text-zinc-400 truncate">Operasional & supplies</p>
        </div>

        {/* Laba Operasional Kas */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 sm:p-5 shadow-sm space-y-1 sm:space-y-2">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-bold text-zinc-400 uppercase tracking-wider truncate">Laba Kas</span>
            <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 ${netMonthly >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              {netMonthly >= 0 ? <TrendingUp size={14} className="sm:w-4 sm:h-4" /> : <TrendingDown size={14} className="sm:w-4 sm:h-4" />}
            </div>
          </div>
          <p className={`text-base sm:text-2xl font-black font-mono truncate ${netMonthly >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {formatRp(netMonthly)}
          </p>
          <p className="text-[9px] sm:text-[11px] text-zinc-400 truncate">Omset - Pengeluaran</p>
        </div>
      </div>

      {/* BHP Reserve (Bahan Habis Pakai) Card */}
      <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 dark:border-amber-900/40 rounded-2xl p-3.5 sm:p-5 shadow-xs flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        {/* Left Side: Header Info */}
        <div className="flex items-start gap-2.5 sm:gap-3.5">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5 sm:mt-0">
            <Package size={16} className="sm:w-5 sm:h-5" />
          </div>
          <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white">Alokasi & Restock Dana BHP</h3>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[9px] sm:text-[10px] font-extrabold">
                Presisi Per Transaksi
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-zinc-600 dark:text-zinc-400 max-w-xl leading-snug sm:leading-relaxed">
              Akumulasi jatah bahan habis pakai (minyak, tisu, sprei) dari transaksi completed untuk modal restock.
            </p>
          </div>
        </div>

        {/* Right Side: Metrics Box + Action Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 shrink-0">
          {/* Metrics White Container */}
          <div className="bg-white/90 dark:bg-zinc-900/90 p-3 sm:p-3.5 rounded-xl border border-amber-200/50 dark:border-amber-900/30">
            <div className="grid grid-cols-2 sm:flex sm:items-center gap-2.5 sm:gap-4 text-left sm:text-right">
              <div>
                <span className="text-[9px] sm:text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Total Hak BHP</span>
                <span className="text-xs sm:text-sm font-bold text-amber-600 dark:text-amber-400 font-mono">{formatRp(monthlyBhpTarget)}</span>
              </div>
              <div className="w-px h-7 bg-zinc-200 dark:bg-zinc-800 hidden sm:block" />
              <div>
                <span className="text-[9px] sm:text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Dibelanjakan</span>
                <span className="text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400 font-mono">{formatRp(monthlyBhpSpent)}</span>
              </div>
              <div className="w-px h-7 bg-zinc-200 dark:bg-zinc-800 hidden sm:block" />
              <div>
                <span className="text-[9px] sm:text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Sisa Restock</span>
                <span className={`text-xs sm:text-sm font-extrabold font-mono ${bhpReserveRemaining >= 0 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600'}`}>
                  {formatRp(bhpReserveRemaining)}
                </span>
              </div>
              <div className="w-px h-7 bg-zinc-200 dark:bg-zinc-800 hidden sm:block" />
              <div>
                <span className="text-[9px] sm:text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Kas Bebas Owner</span>
                <span className="text-xs sm:text-sm font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                  {formatRp(Math.max(0, netMonthly - Math.max(0, bhpReserveRemaining)))}
                </span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={() => {
              setModalType('outflow');
              setCategory('supplies');
              setAmount(bhpReserveRemaining > 0 ? String(bhpReserveRemaining) : '');
              setDescription('Restock / Pembelian Bahan Habis Pakai (BHP)');
              setReceiptFile(null);
              setReceiptPreview(null);
              setModalOpen(true);
            }}
            className="px-3.5 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] transition-all shrink-0"
            title="Catat pengeluaran belanja bahan habis pakai"
          >
            <ShoppingBag size={15} />
            <span>Belanja BHP</span>
          </button>
        </div>
      </div>

      {/* Account Balances Pills */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Saldo Per Rekening / Kas</span>
          <button
            onClick={() => setManageAccountsOpen(true)}
            className="px-2.5 py-1 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-750 text-[11px] font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Settings size={13} className="text-earth-primary" />
            <span>Kelola Rekening ({customAccounts.length})</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {customAccounts.map((acc) => {
            const cfg = getAccountConfig(acc.id);
            const Icon = cfg.icon;
            const bal = accountBalances[acc.id] || 0;

            return (
              <div key={acc.id} className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-all ${cfg.color}`}>
                <div className="p-2 rounded-xl bg-white/80 dark:bg-zinc-900/80 shrink-0">
                  <Icon size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider opacity-80 truncate">{cfg.label}</p>
                  <p className="text-sm font-bold font-mono truncate">{formatRp(bal)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between shadow-sm">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari transaksi, ref invoice, atau keterangan..."
            className="admin-input pl-9 text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Date Filter */}
          <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setDateFilter('month')}
              className={`px-3 py-1.5 rounded-lg transition-all ${dateFilter === 'month' ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs font-bold' : 'text-zinc-500'}`}
            >
              Bulan Ini
            </button>
            <button
              onClick={() => setDateFilter('today')}
              className={`px-3 py-1.5 rounded-lg transition-all ${dateFilter === 'today' ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs font-bold' : 'text-zinc-500'}`}
            >
              Hari Ini
            </button>
            <button
              onClick={() => setDateFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${dateFilter === 'all' ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs font-bold' : 'text-zinc-500'}`}
            >
              Semua
            </button>
          </div>

          {/* Account Filter */}
          <select
            value={accountFilter}
            onChange={e => setAccountFilter(e.target.value)}
            className="admin-input text-xs w-auto font-medium"
          >
            <option value="all">Semua Rekening</option>
            {customAccounts.map((acc) => (
              <option key={acc.id} value={acc.id}>{acc.label}</option>
            ))}
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="admin-input text-xs w-auto font-medium"
          >
            <option value="all">Semua Arus Kas</option>
            <option value="inflow">Pemasukan (Masuk)</option>
            <option value="outflow">Pengeluaran (Keluar)</option>
          </select>
        </div>
      </div>

      {/* Ledger Table Container (Mobile Card List + Desktop Table) */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        {/* Mobile View: Cards (block md:hidden) */}
        <div className="md:hidden divide-y divide-zinc-100 dark:divide-zinc-800/80">
          {loading ? (
            <div className="text-center py-12 text-zinc-400">
              <Loader2 size={24} className="animate-spin mx-auto mb-2 text-earth-primary" />
              <p className="text-xs">Memuat data buku kas...</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-12 px-4 text-zinc-400">
              <Receipt size={32} className="mx-auto mb-2 opacity-30 text-zinc-400" />
              <p className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">Belum ada transaksi tercatat</p>
              <p className="text-[10px] mt-0.5 opacity-80">
                Selesaikan nota di Invoice/POS, transfer kas, atau catat pengeluaran manual.
              </p>
            </div>
          ) : (
            paginatedTransactions.map((t) => {
              const isInflow = t.type === 'inflow';
              const accCfg = getAccountConfig(t.payment_account);
              const AccIcon = accCfg.icon;
              const catDetails = getCategoryDetails(t.category, t.type);
              const CatIcon = catDetails.icon;

              return (
                <div key={t.id} className="p-3.5 space-y-2 hover:bg-zinc-50/50 dark:hover:bg-zinc-850/40 transition-colors">
                  {/* Card Header: Category Icon + Title + Type Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${t.category === 'internal_transfer' ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400' : isInflow ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'}`}>
                        <CatIcon size={14} />
                      </div>
                      <span className="text-xs font-bold text-zinc-900 dark:text-white truncate">{catDetails.label}</span>
                    </div>
                    <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold shrink-0 ${isInflow ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'}`}>
                      {isInflow ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                      {isInflow ? 'Masuk' : 'Keluar'}
                    </span>
                  </div>

                  {/* Card Body: Description + Amount */}
                  <div className="flex items-baseline justify-between gap-3">
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <p className="text-xs text-zinc-700 dark:text-zinc-300 font-medium leading-snug break-words">{t.description}</p>
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-zinc-400 font-mono">
                        <span>{new Date(t.transaction_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} {new Date(t.transaction_date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                        <span>•</span>
                        <span className="font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                          <AccIcon size={10} />
                          {accCfg.label}
                        </span>
                        {t.reference_id && (
                          <>
                            <span>•</span>
                            <span className="text-earth-primary font-bold">#{t.reference_id}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-sm font-bold font-mono ${isInflow ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {isInflow ? '+' : '-'}{formatRp(t.amount)}
                      </span>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="flex items-center justify-end gap-2 pt-1.5 border-t border-dashed border-zinc-100 dark:border-zinc-800">
                    {t.receipt_url && (
                      <button
                        onClick={() => setViewReceiptUrl(t.receipt_url!)}
                        className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 text-[10px] font-bold flex items-center gap-1 border border-amber-200/50"
                      >
                        <FileText size={11} />
                        <span>Lihat Struk</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="p-1 rounded-lg text-zinc-400 hover:text-rose-600 transition-colors"
                      title="Hapus Transaksi"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop View: Table (hidden md:block) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800 text-[10px] uppercase font-bold text-zinc-400 bg-zinc-50/50 dark:bg-zinc-950/40 tracking-wider">
                <th className="py-3 px-4">Waktu</th>
                <th className="py-3 px-4">Jenis</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Keterangan / Ref</th>
                <th className="py-3 px-4">Rekening</th>
                <th className="py-3 px-4 text-right">Nominal</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-zinc-400">
                    <Loader2 size={24} className="animate-spin mx-auto mb-2 text-earth-primary" />
                    Memuat data buku kas...
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-zinc-400">
                    <Receipt size={36} className="mx-auto mb-2 opacity-30 text-zinc-400" />
                    <p className="font-semibold">Belum ada transaksi tercatat</p>
                    <p className="text-[11px] mt-0.5 opacity-80">
                      Selesaikan nota di Invoice/POS, transfer kas, atau catat pengeluaran manual.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((t) => {
                  const isInflow = t.type === 'inflow';
                  const accCfg = getAccountConfig(t.payment_account);
                  const AccIcon = accCfg.icon;

                  const catDetails = getCategoryDetails(t.category, t.type);
                  const CatIcon = catDetails.icon;

                  return (
                    <tr key={t.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-850/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-[11px] text-zinc-500 whitespace-nowrap">
                        {new Date(t.transaction_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        <span className="text-[10px] block opacity-60">
                          {new Date(t.transaction_date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold ${isInflow ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'}`}>
                          {isInflow ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                          {isInflow ? 'Masuk' : 'Keluar'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${t.category === 'internal_transfer' ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400' : isInflow ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'}`}>
                            <CatIcon size={13} />
                          </div>
                          <span>{catDetails.label}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="font-semibold text-zinc-900 dark:text-white line-clamp-1">{t.description}</p>
                        {t.reference_id && (
                          <span className="text-[10px] font-mono text-earth-primary font-bold block mt-0.5">
                            #{t.reference_id}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300 text-[11px] font-semibold">
                          <AccIcon size={14} className="text-zinc-400" />
                          <span>{accCfg.label}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-sm whitespace-nowrap">
                        <span className={isInflow ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                          {isInflow ? '+' : '-'}{formatRp(t.amount)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          {t.receipt_url && (
                            <button
                              onClick={() => setViewReceiptUrl(t.receipt_url!)}
                              className="px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 hover:bg-amber-100 transition-colors text-[10px] font-bold flex items-center gap-1 border border-amber-200/50"
                              title="Lihat Struk/Nota"
                            >
                              <FileText size={12} />
                              <span>Struk</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(t.id)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                            title="Hapus Transaksi"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination & Rows Per Page Bar */}
        {!loading && totalFilteredCount > 0 && (
          <div className="px-4 py-3 bg-zinc-50/80 dark:bg-zinc-950/40 border-t border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            {/* Info text */}
            <div className="text-zinc-500 dark:text-zinc-400 text-[11px] font-medium">
              Menampilkan <span className="font-bold text-zinc-900 dark:text-white font-mono">{startIndex + 1}</span> - <span className="font-bold text-zinc-900 dark:text-white font-mono">{endIndex}</span> dari <span className="font-bold text-zinc-900 dark:text-white font-mono">{totalFilteredCount}</span> transaksi
            </div>

            {/* Controls right */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Rows per page selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">Tampilkan:</span>
                <select
                  value={itemsPerPage}
                  onChange={e => setItemsPerPage(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                  className="admin-input py-1 px-2 text-xs font-semibold w-auto"
                >
                  <option value={10}>10 / hal</option>
                  <option value={25}>25 / hal</option>
                  <option value={50}>50 / hal</option>
                  <option value={100}>100 / hal</option>
                  <option value="all">Semua</option>
                </select>
              </div>

              {/* Page Nav */}
              {totalPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={safeCurrentPage <= 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className="px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    ‹ Prev
                  </button>
                  <span className="text-[11px] font-mono font-bold text-zinc-600 dark:text-zinc-400 px-1">
                    {safeCurrentPage} / {totalPages}
                  </span>
                  <button
                    disabled={safeCurrentPage >= totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    className="px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    Next ›
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── 1. Standard Transaction Modal (Expense / Income) ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-fadeIn">
            {/* Header */}
            <div className={`p-4 border-b flex items-center justify-between ${modalType === 'inflow' ? 'bg-emerald-50/50 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30' : 'bg-rose-50/50 border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/30'}`}>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${modalType === 'inflow' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
                  {modalType === 'inflow' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                    {modalType === 'inflow' ? 'Catat Pemasukan Manual' : 'Catat Pengeluaran Operasional'}
                  </h3>
                  <p className="text-[10px] text-zinc-500">Isi formulir pencatatan buku kas secara rinci.</p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Nominal */}
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Nominal Transaksi (Rp) *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  placeholder="0"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="admin-input font-mono font-bold text-lg text-earth-primary"
                />
              </div>

              {/* Kategori */}
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
                  Kategori Transaksi *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1 minimal-scrollbar">
                  {(modalType === 'inflow' ? CATEGORIES_INFLOW : CATEGORIES_OUTFLOW).map(c => {
                    const Icon = c.icon;
                    const isSelected = category === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setCategory(c.id)}
                        className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center gap-2 transition-all ${
                          isSelected
                            ? 'bg-earth-primary text-white border-earth-primary shadow-xs'
                            : 'bg-zinc-50 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-earth-primary/50'
                        }`}
                      >
                        <Icon size={15} className={`shrink-0 ${isSelected ? 'text-white' : 'text-zinc-500 dark:text-zinc-400'}`} />
                        <span className="leading-tight flex-1 break-words">{c.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sumber Rekening */}
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  {modalType === 'inflow' ? 'Masuk ke Rekening *' : 'Diambil dari Rekening *'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {customAccounts.map(acc => {
                    const cfg = getAccountConfig(acc.id);
                    const Icon = cfg.icon;
                    return (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => setAccount(acc.id)}
                        className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${
                          account === acc.id
                            ? 'bg-earth-primary text-white border-earth-primary shadow-xs'
                            : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
                        }`}
                      >
                        <Icon size={14} />
                        <span>{cfg.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Keterangan */}
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Keterangan / Detail *
                </label>
                <input
                  type="text"
                  required
                  placeholder={modalType === 'inflow' ? 'Contoh: Suntikan Modal Owner...' : 'Contoh: Beli Galon Air & Tisu...'}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="admin-input text-xs"
                />
              </div>

              {/* Upload Foto Struk / Nota (Optional) */}
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Upload Foto Struk / Nota (Opsional)
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    if (e.target.files?.[0]) {
                      const file = e.target.files[0];
                      setReceiptFile(file);
                      setReceiptPreview(URL.createObjectURL(file));
                    }
                  }}
                />
                {receiptPreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 h-24 bg-zinc-50 flex items-center justify-center">
                    <img src={receiptPreview} alt="Struk Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setReceiptFile(null);
                        setReceiptPreview(null);
                      }}
                      className="absolute top-1.5 right-1.5 p-1 bg-black/60 hover:bg-black text-white rounded-lg transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2.5 px-3 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-earth-primary bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
                  >
                    <Upload size={14} />
                    <span>Upload Nota / Struk Pembelian</span>
                  </button>
                )}
              </div>

              {/* Tanggal */}
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Tanggal Transaksi
                </label>
                <input
                  type="date"
                  value={transDate}
                  onChange={e => setTransDate(e.target.value)}
                  className="admin-input text-xs"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-600 dark:text-zinc-400 flex-1 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting || !amount || !description.trim()}
                  className={`px-4 py-2.5 rounded-xl text-white text-xs font-bold flex-1 flex items-center justify-center gap-1.5 shadow-sm transition-all disabled:opacity-50 ${modalType === 'inflow' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}
                >
                  {submitting ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                  Simpan Catatan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 2. Internal Cash Transfer Modal ── */}
      {transferModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-fadeIn">
            {/* Header */}
            <div className="p-4 border-b border-blue-100 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-950/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                  <ArrowLeftRight size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                    Transfer Antar Rekening (Pindah Kas)
                  </h3>
                  <p className="text-[10px] text-zinc-500">Pindahkan kas antar QRIS, BCA, Cash Laci, atau EDC.</p>
                </div>
              </div>
              <button
                onClick={() => setTransferModalOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleTransferSubmit} className="p-5 space-y-4">
              {/* Nominal */}
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Nominal Transfer (Rp) *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  placeholder="0"
                  value={transferAmount}
                  onChange={e => setTransferAmount(e.target.value)}
                  className="admin-input font-mono font-bold text-lg text-blue-600 dark:text-blue-400"
                />
              </div>

              {/* Dari Rekening (Asal) */}
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Dari Rekening (Asal) *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {customAccounts.map(acc => {
                    const cfg = getAccountConfig(acc.id);
                    const Icon = cfg.icon;
                    return (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => setTransferFrom(acc.id)}
                        className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${
                          transferFrom === acc.id
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs font-bold'
                            : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
                        }`}
                      >
                        <Icon size={14} />
                        <span>{cfg.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Ke Rekening (Tujuan) */}
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Ke Rekening (Tujuan) *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {customAccounts.map(acc => {
                    const cfg = getAccountConfig(acc.id);
                    const Icon = cfg.icon;
                    const isDisabled = transferFrom === acc.id;

                    return (
                      <button
                        key={acc.id}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => setTransferTo(acc.id)}
                        className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${
                          isDisabled
                            ? 'opacity-40 cursor-not-allowed bg-zinc-100 text-zinc-400 border-zinc-200'
                            : transferTo === acc.id
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs font-bold'
                            : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
                        }`}
                      >
                        <Icon size={14} />
                        <span>{cfg.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Catatan Transfer */}
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Catatan / Referensi (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Settlement Midtrans QRIS ke BCA..."
                  value={transferNotes}
                  onChange={e => setTransferNotes(e.target.value)}
                  className="admin-input text-xs"
                />
              </div>

              {/* Tanggal Transfer */}
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Tanggal Transfer
                </label>
                <input
                  type="date"
                  value={transferDate}
                  onChange={e => setTransferDate(e.target.value)}
                  className="admin-input text-xs"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setTransferModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-600 dark:text-zinc-400 flex-1 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={transferSubmitting || !transferAmount || transferFrom === transferTo}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex-1 flex items-center justify-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
                >
                  {transferSubmitting ? <Loader2 size={15} className="animate-spin" /> : <ArrowLeftRight size={15} />}
                  Proses Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 3. Receipt Viewer Modal ── */}
      {viewReceiptUrl && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800">
            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-amber-500" />
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Bukti Struk / Nota</h3>
              </div>
              <button
                onClick={() => setViewReceiptUrl(null)}
                className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4 bg-zinc-900 flex items-center justify-center max-h-[70vh] overflow-auto">
              <img src={viewReceiptUrl} alt="Struk Pembelian" className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-md" />
            </div>
            <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-2">
              <a
                href={viewReceiptUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-earth-primary text-white text-xs font-bold flex items-center gap-1.5 shadow-xs hover:bg-earth-dark transition-all"
              >
                <Download size={14} /> Buka / Unduh Gambar
              </a>
              <button
                onClick={() => setViewReceiptUrl(null)}
                className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 3. Manage Accounts Modal ── */}
      {manageAccountsOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-fadeIn space-y-4 p-5">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-earth-primary/10 text-earth-primary flex items-center justify-center">
                  <Settings size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Kelola Rekening Kas & Bank</h3>
                  <p className="text-[10px] text-zinc-400">Tambah, hapus, dan atur icon rekening kas venue.</p>
                </div>
              </div>
              <button onClick={() => setManageAccountsOpen(false)} className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg">
                <X size={16} />
              </button>
            </div>

            {/* List Active Accounts */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Rekening Kas Aktif ({customAccounts.length})</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                {customAccounts.map(acc => {
                  const cfg = getAccountConfig(acc.id);
                  const Icon = cfg.icon;
                  const isEditingThis = editingAccId === acc.id;

                  return (
                    <div key={acc.id} className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all ${isEditingThis ? 'ring-2 ring-earth-primary border-earth-primary bg-amber-50/50 dark:bg-amber-950/20' : cfg.color}`}>
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Icon size={16} className="shrink-0" />
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-bold truncate block">{acc.label}</span>
                          <button
                            type="button"
                            onClick={() => handleToggleInvoiceVisibility(acc.id)}
                            className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full inline-flex items-center gap-1 transition-colors ${
                              acc.show_in_invoice !== false
                                ? 'bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                                : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400'
                            }`}
                            title="Klik untuk ubah status tampil di Invoice / POS"
                          >
                            {acc.show_in_invoice !== false ? '✓ In Invoice' : '✗ Hide In Invoice'}
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => startEditAccount(acc)}
                          className="p-1 text-zinc-400 hover:text-earth-primary transition-colors"
                          title="Edit Rekening Ini"
                        >
                          <Pencil size={13} />
                        </button>
                        {customAccounts.length > 1 && (
                          <button
                            onClick={() => handleDeleteAccount(acc.id)}
                            className="p-1 text-zinc-400 hover:text-rose-600 transition-colors"
                            title="Hapus Rekening"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Form Add / Edit Account */}
            <div className="bg-zinc-50 dark:bg-zinc-800/40 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-zinc-900 dark:text-white">
                  {editingAccId ? 'Edit Rekening Kas' : 'Tambah Rekening Kas Baru'}
                </h4>
                {editingAccId && (
                  <button
                    onClick={cancelEditAccount}
                    className="text-[11px] font-bold text-rose-600 hover:underline"
                  >
                    Batal Edit
                  </button>
                )}
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 font-semibold mb-1 block">Nama Rekening / Kas *</label>
                <input
                  type="text"
                  placeholder="Cth: Bank Mandiri, GoPay, Kas Petty..."
                  className="admin-input text-xs"
                  value={newAccLabel}
                  onChange={e => setNewAccLabel(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-zinc-400 font-semibold mb-1 block">Pilih Icon Lucide *</label>
                  <select
                    value={newAccIcon}
                    onChange={e => setNewAccIcon(e.target.value)}
                    className="admin-input text-xs font-medium"
                  >
                    {AVAILABLE_ICONS.map(ic => (
                      <option key={ic.id} value={ic.id}>{ic.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 font-semibold mb-1 block">Warna Tema *</label>
                  <select
                    value={newAccColor}
                    onChange={e => setNewAccColor(e.target.value)}
                    className="admin-input text-xs font-medium"
                  >
                    {Object.entries(AVAILABLE_COLORS).map(([cKey, cVal]) => (
                      <option key={cKey} value={cKey}>{cVal.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Invoice Option Toggle Checkbox */}
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={newAccShowInInvoice}
                  onChange={e => setNewAccShowInInvoice(e.target.checked)}
                  className="rounded text-earth-primary focus:ring-earth-primary"
                />
                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Tampilkan opsi rekening ini saat bikin Invoice / POS
                </span>
              </label>

              <div className="flex gap-2 pt-1">
                {editingAccId && (
                  <button
                    type="button"
                    onClick={cancelEditAccount}
                    className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100"
                  >
                    Batal
                  </button>
                )}
                <button
                  onClick={handleSaveAccount}
                  disabled={savingAcc || !newAccLabel.trim()}
                  className="flex-1 admin-btn-primary py-2 text-xs font-bold flex justify-center items-center gap-1.5 disabled:opacity-50"
                >
                  {savingAcc ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                  <span>{editingAccId ? 'Simpan Perubahan' : 'Tambah Rekening Ini'}</span>
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <button
                onClick={() => setManageAccountsOpen(false)}
                className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 4. Custom Confirm / Alert Modal ── */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                confirmDialog.type === 'danger'
                  ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/50'
                  : confirmDialog.type === 'warning'
                  ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/50'
                  : 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200/50'
              }`}>
                <AlertCircle size={20} />
              </div>
              <div className="space-y-1 min-w-0 flex-1">
                <h4 className="text-sm font-bold text-zinc-900 dark:text-white leading-snug">{confirmDialog.title}</h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed whitespace-pre-line break-words">{confirmDialog.message}</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              {confirmDialog.cancelLabel && (
                <button
                  type="button"
                  onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                  className="px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  {confirmDialog.cancelLabel}
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                  confirmDialog.onConfirm();
                }}
                className={`px-4 py-2 rounded-xl text-white text-xs font-bold shadow-xs transition-colors ${
                  confirmDialog.type === 'danger'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : confirmDialog.type === 'warning'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-earth-primary hover:bg-earth-dark'
                }`}
              >
                {confirmDialog.confirmLabel || 'Ya, Lanjutkan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
