'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/admin/Sidebar';
import { Menu, Users, X, Wallet, ChevronRight } from 'lucide-react';
import { UserProvider } from '@/lib/user-context';
import { createClient } from '@/lib/supabase';
import Link from 'next/link';

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);

  const [followUpCount, setFollowUpCount] = useState(0);
  const [hasPendingAllocations, setHasPendingAllocations] = useState(false);
  const [activeBannerSlide, setActiveBannerSlide] = useState<'crm' | 'finance'>('crm');
  const [dismissBanner, setDismissBanner] = useState(true); // Default to true (hidden) to prevent SSR hydration mismatch

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const dismissed = sessionStorage.getItem('dismiss_crm_banner') === 'true';
      if (!dismissed) {
        setDismissBanner(false);
      }
    }
  }, []);

  const handleDismissBanner = () => {
    setDismissBanner(true);
    sessionStorage.setItem('dismiss_crm_banner', 'true');
  };

  const supabase = createClient();

  const fetchCRMData = useCallback(async () => {
    if (pathname === '/admin') return;

    try {
      const now = new Date();
      const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      const [{ data: allBookings }, { data: settingsRows }, { data: custs }, { data: discs }, { data: cashData }] = await Promise.all([
        supabase.from('bookings').select('customer_id, status, booking_date'),
        supabase.from('settings').select('key, value').in('key', ['re_engagement_days']),
        supabase.from('customers').select('id, visit_count_base'),
        supabase.from('discounts').select('type, min_orders, is_active').eq('is_active', true),
        supabase.from('cash_transactions').select('id, type, category, amount, description, created_by').gte('transaction_date', `${currentMonthStr}-01`),
      ]);

      // 1. Calculate CRM Follow-ups
      if (custs && allBookings) {
        const countMap: Record<string, number> = {};
        const lastMap: Record<string, string> = {};
        
        allBookings.forEach(r => {
          if (!r.customer_id) return;
          countMap[r.customer_id] = (countMap[r.customer_id] ?? 0) + (r.status === 'Completed' ? 1 : 0);
          if (r.status === 'Completed') {
            if (!lastMap[r.customer_id] || r.booking_date > lastMap[r.customer_id]) {
              lastMap[r.customer_id] = r.booking_date;
            }
          }
        });

        const reDays = settingsRows?.find(s => s.key === 're_engagement_days')?.value 
          ? Number(settingsRows.find(s => s.key === 're_engagement_days')?.value) 
          : 60;
        
        let fCount = 0;
        custs.forEach(c => {
          const effCount = (c.visit_count_base ?? 0) + (countMap[c.id] ?? 0);
          const lastVisit = lastMap[c.id] ?? null;
          
          let dormant = false;
          let days = 0;
          if (lastVisit) {
            days = Math.floor((Date.now() - new Date(lastVisit + 'T00:00:00').getTime()) / 86400000);
            dormant = days >= reDays;
          }

          let eligiblePromo = false;
          const nextCount = effCount + 1;
          const loyalPromo = discs?.some(d => d.type === 'loyal' && d.min_orders && nextCount >= d.min_orders);
          
          if (loyalPromo) {
            eligiblePromo = true;
          } else if (lastVisit && days >= reDays) {
            const rcPromo = discs?.some(d => d.type === 'returning_customer');
            if (rcPromo) eligiblePromo = true;
          }

          if (dormant || eligiblePromo) {
            fCount++;
          }
        });
        setFollowUpCount(fCount);
      }

      // 2. Calculate Pending Cashbook Allocations
      if (cashData) {
        const monthlyInflow = cashData
          .filter(t => t.type === 'inflow' && t.category !== 'internal_transfer' && t.category !== 'owner_capital')
          .reduce((sum, t) => sum + Number(t.amount), 0);

        const executedAllocations = cashData
          .filter(t => t.type === 'inflow' && t.category === 'internal_transfer' && (
            t.description?.toLowerCase().includes('alokasi') ||
            t.description?.toLowerCase().includes('pos ') ||
            t.created_by === 'Smart Allocation Helper'
          ))
          .reduce((sum, t) => sum + Number(t.amount), 0);

        const pending = monthlyInflow > 0 && monthlyInflow > (executedAllocations + 100);
        setHasPendingAllocations(pending);

        // Auto select slide if only one is available
        if (pending && followUpCount === 0) {
          setActiveBannerSlide('finance');
        } else if (!pending && followUpCount > 0) {
          setActiveBannerSlide('crm');
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, [pathname, supabase, followUpCount]);

  useEffect(() => {
    fetchCRMData();
    const handleUpdate = () => {
      fetchCRMData();
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('cashbook_updated', handleUpdate);
      return () => window.removeEventListener('cashbook_updated', handleUpdate);
    }
  }, [fetchCRMData]);

  // Alternating Banner Timer if both notifications exist
  useEffect(() => {
    if (!dismissBanner && followUpCount > 0 && hasPendingAllocations) {
      const timer = setInterval(() => {
        setActiveBannerSlide(prev => (prev === 'crm' ? 'finance' : 'crm'));
      }, 7000);
      return () => clearInterval(timer);
    }
  }, [dismissBanner, followUpCount, hasPendingAllocations]);

  // Login page — no sidebar
  if (pathname === '/admin') {
    return <>{children}</>;
  }

  const showBanner = !dismissBanner && (followUpCount > 0 || hasPendingAllocations);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 print:bg-white">
      <div className="print:hidden">
        <Sidebar 
          open={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
          isCollapsed={desktopCollapsed}
          onToggleCollapse={() => setDesktopCollapsed(!desktopCollapsed)}
        />
      </div>

      {/* Main Content */}
      <div className={`transition-all duration-300 ease-in-out ${desktopCollapsed ? 'lg:pl-20' : 'lg:pl-64'} print:pl-0 flex flex-col min-h-screen print:min-h-0`}>
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
          {/* Alternating Notification Banner Carousel */}
          {showBanner && (
            <div className="mb-5 relative rounded-2xl transition-all animate-fadeIn print:hidden overflow-hidden">
              {/* Slide 1: Finance Allocation Reminder */}
              {activeBannerSlide === 'finance' && hasPendingAllocations && (
                <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-amber-50 dark:from-blue-950/30 dark:via-indigo-950/20 dark:to-amber-950/20 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <Wallet size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-900 dark:text-white">Buku Kas & Alokasi Transfer m-Banking</p>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                        Ada booking completed baru. Silakan konfirmasi dan pisahkan jatah <strong className="text-blue-600 dark:text-blue-400">BHP, Komisi Terapis & Laba Owner</strong> di Buku Kas.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <Link href="/admin/finance" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-[0.98] flex items-center gap-1.5">
                      <span>Buka Buku Kas</span>
                      <ChevronRight size={14} />
                    </Link>
                    <button onClick={handleDismissBanner} className="p-2 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-600 rounded-lg transition-colors">
                      <X size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* Slide 2: CRM Follow-up Reminder */}
              {(activeBannerSlide === 'crm' || !hasPendingAllocations) && followUpCount > 0 && (
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                      <Users size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-900 dark:text-white">CRM Follow-up Reminder</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                        Ada <strong className="text-orange-600 dark:text-orange-400">{followUpCount} pelanggan</strong> yang sudah lama tidak berkunjung atau berhak mendapatkan promo loyalty khusus.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <Link href="/admin/customers?filter=followup" className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-[0.98]">
                      Lihat Pelanggan
                    </Link>
                    <button onClick={handleDismissBanner} className="p-2 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-600 rounded-lg transition-colors">
                      <X size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* Slide Indicator Tabs (if both exist) */}
              {followUpCount > 0 && hasPendingAllocations && (
                <div className="bg-white/80 dark:bg-zinc-900/80 px-4 py-1 flex items-center justify-center gap-3 border-t border-zinc-100 dark:border-zinc-800 text-[10px] font-bold">
                  <button
                    onClick={() => setActiveBannerSlide('finance')}
                    className={`flex items-center gap-1 transition-colors ${activeBannerSlide === 'finance' ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-400 hover:text-zinc-600'}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${activeBannerSlide === 'finance' ? 'bg-blue-600' : 'bg-zinc-300'}`} />
                    <span>Alokasi Buku Kas</span>
                  </button>
                  <span className="text-zinc-300">|</span>
                  <button
                    onClick={() => setActiveBannerSlide('crm')}
                    className={`flex items-center gap-1 transition-colors ${activeBannerSlide === 'crm' ? 'text-orange-600 dark:text-orange-400' : 'text-zinc-400 hover:text-zinc-600'}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${activeBannerSlide === 'crm' ? 'bg-orange-600' : 'bg-zinc-300'}`} />
                    <span>CRM Follow-up ({followUpCount})</span>
                  </button>
                </div>
              )}
            </div>
          )}
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
