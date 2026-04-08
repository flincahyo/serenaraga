'use client';

import React from 'react';
import InvoiceMaker from '@/components/admin/InvoiceMaker';
import { Receipt } from 'lucide-react';

export default function InvoicesPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Receipt className="text-earth-primary" size={28} />
            <h1 className="text-3xl font-serif font-bold text-text-primary dark:text-white">Billing & Invoices</h1>
          </div>
          <p className="text-text-secondary dark:text-white/40 max-w-xl">
            Buat rincian biaya profesional untuk pelanggan dan kirim langsung melalui WhatsApp dalam format gambar.
          </p>
        </div>
      </div>

      {/* Main Feature */}
      <InvoiceMaker />
    </div>
  );
}
