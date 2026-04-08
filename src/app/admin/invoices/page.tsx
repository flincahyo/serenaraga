'use client';

import React from 'react';
import InvoiceMaker from '@/components/admin/InvoiceMaker';

export default function InvoicesPage() {
  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">Invoice</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
          Buat & kirim rincian biaya langsung ke WhatsApp pelanggan
        </p>
      </div>
      <InvoiceMaker />
    </div>
  );
}
