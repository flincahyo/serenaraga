'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/admin/Sidebar';
import { Menu } from 'lucide-react';
import { UserProvider } from '@/lib/user-context';

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Login page — no sidebar
  if (pathname === '/admin') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 print:bg-white">
      <div className="print:hidden">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main Content */}
      <div className="lg:pl-64 print:pl-0 flex flex-col min-h-screen print:min-h-0">
        {/* Top Bar (mobile only) */}
        <header className="sticky top-0 z-20 lg:hidden print:hidden flex items-center gap-3 px-4 py-3 bg-white dark:bg-zinc-950 border-b border-zinc-100 dark:border-zinc-800">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500"
          >
            <Menu size={20} />
          </button>
          <span className="text-sm font-semibold dark:text-white font-sans">
            Serena<span className="text-earth-primary">Raga</span>
          </span>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-8 print:p-0">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </UserProvider>
  );
}
