'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/admin/Sidebar';
import { motion } from 'framer-motion';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Halaman Login tidak menampilkan Sidebar
  const isLoginPage = pathname === '/admin';

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-bg-cream dark:bg-zinc-900 flex transition-colors duration-300">
      <Sidebar />
      <main className="flex-grow pl-72">
        <div className="p-8 md:p-12 min-h-screen">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
