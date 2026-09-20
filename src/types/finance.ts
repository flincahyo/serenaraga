export type TransactionType = 'inflow' | 'outflow';

export type AccountTag = 'cashier' | 'bhp_operational' | 'therapist_commission' | 'owner_profit' | 'general';

export type CustomAccount = {
  id: string;
  label: string;
  icon: string;
  color: string;
  tag?: AccountTag;
  account_number?: string;
  account_holder?: string;
  show_in_invoice?: boolean;
};

export type CashTransaction = {
  id: string;
  transaction_date: string;
  type: TransactionType;
  category: string;
  payment_account: string;
  amount: number;
  description: string;
  reference_id?: string | null;
  receipt_url?: string | null;
  created_by?: string | null;
  created_at?: string;
};

export type CategoryItem = {
  id: string;
  label: string;
  iconName: string;
  type: TransactionType | 'both';
};

export type PeriodFilterMode = 'today' | 'yesterday' | 'custom_date' | 'month' | 'all';

export type AutoAllocationSummary = {
  totalRevenue: number;
  bhpAllocated: number;
  therapistAllocated: number;
  ownerProfitAllocated: number;
  otherExpenses: number;
  netCashProfit: number;
};

export const CATEGORIES_OUTFLOW: CategoryItem[] = [
  { id: 'supplies', label: 'BHP & Bahan Treatment', iconName: 'ShoppingBag', type: 'outflow' },
  { id: 'payroll', label: 'Gaji & Komisi Terapis', iconName: 'Users', type: 'outflow' },
  { id: 'operational', label: 'Operasional (Listrik/Air/Wifi)', iconName: 'Zap', type: 'outflow' },
  { id: 'marketing', label: 'Marketing & Iklan', iconName: 'Megaphone', type: 'outflow' },
  { id: 'owner_prive', label: 'Penarikan Owner (Prive)', iconName: 'UserCheck', type: 'outflow' },
  { id: 'maintenance', label: 'Perbaikan & Maintenance', iconName: 'Wrench', type: 'outflow' },
  { id: 'other', label: 'Pengeluaran Lainnya', iconName: 'MoreHorizontal', type: 'outflow' },
];

export const CATEGORIES_INFLOW: CategoryItem[] = [
  { id: 'service_income', label: 'Pemasukan Layanan / Treatment', iconName: 'Sparkles', type: 'inflow' },
  { id: 'retail_income', label: 'Penjualan Produk Retail', iconName: 'Package', type: 'inflow' },
  { id: 'owner_capital', label: 'Suntikan Modal Owner', iconName: 'Briefcase', type: 'inflow' },
  { id: 'other_income', label: 'Pemasukan Lainnya', iconName: 'MoreHorizontal', type: 'inflow' },
];

export const TRANSFER_CATEGORY: CategoryItem = {
  id: 'internal_transfer',
  label: 'Transfer Antar Rekening',
  iconName: 'ArrowLeftRight',
  type: 'both',
};

export const DEFAULT_ACCOUNTS: CustomAccount[] = [
  { id: 'qris', label: 'QRIS Utama', icon: 'Smartphone', color: 'purple', tag: 'cashier', show_in_invoice: true },
  { id: 'bca', label: 'Bank BCA (Payout & Profit)', icon: 'Building2', color: 'blue', tag: 'therapist_commission', show_in_invoice: true },
  { id: 'cash', label: 'Kas Laci Kasir', icon: 'Banknote', color: 'emerald', tag: 'cashier', show_in_invoice: true },
  { id: 'edc', label: 'Kartu EDC / Debit', icon: 'CreditCard', color: 'amber', tag: 'cashier', show_in_invoice: true },
];
