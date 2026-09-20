'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { AppSidebar } from '@/components/admin/AppSidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Users, X, Wallet, ChevronRight, Moon, Sun, Bell } from 'lucide-react';
import { UserProvider, useUser } from '@/lib/user-context';
import { createClient } from '@/lib/supabase';
import { useTheme } from 'next-themes';
import { UserMenu } from '@/components/admin/UserMenu';
import { ModeToggle } from '@/components/mode-toggle';
import Link from 'next/link';

const PAGE_TITLES: Record<string, string> = {
  '/admin/dashboard': 'Dashboard',
  '/admin/calendar': 'Tracker Jadwal',
  '/admin/bookings': 'Bookings',
  '/admin/invoices': 'Invoices',
  '/admin/finance': 'Buku Kas',
  '/admin/pos': 'POS Kasir',
  '/admin/services': 'Layanan & Treatment',
  '/admin/materials': 'Bahan (BHP)',
  '/admin/customers': 'Pelanggan / CRM',
  '/admin/therapists': 'Terapis',
  '/admin/staff': 'Staff & Kasir',
  '/admin/feed-studio-v2': 'Feed Studio',
  '/admin/reels-studio': 'Reels Studio',
  '/admin/letters': 'Surat Resmi',
  '/admin/schedule': 'Share Jadwal',
  '/admin/discounts': 'Diskon & Promo',
  '/admin/vouchers': 'Voucher',
  '/admin/content': 'Konten Web',
  '/admin/reports': 'Laporan Keuangan',
  '/admin/settings': 'Pengaturan Toko',
};

function AdminHeader({
  followUpCount,
}: {
  followUpCount: number;
}) {
  const pathname = usePathname();
  const { user } = useUser();

  const currentPageTitle = PAGE_TITLES[pathname] || (
    pathname.split('/').filter(Boolean).pop()?.replace(/-/g, ' ').toUpperCase() || 'Admin'
  );

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-2 px-4 md:px-6 bg-transparent sticky top-0 z-20 print:hidden">
      <div className="flex items-center gap-2.5">
        <SidebarTrigger className="-ml-1 text-sidebar-foreground hover:bg-sidebar-accent cursor-pointer" />
        <Separator orientation="vertical" className="mr-1 h-3.5 bg-sidebar-border opacity-60" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden sm:inline-flex">
              <BreadcrumbLink render={<Link href="/admin/dashboard" />}>
                SerenaRaga
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden sm:inline-flex" />
            <BreadcrumbItem>
              <BreadcrumbPage className="font-semibold text-sidebar-foreground">
                {currentPageTitle}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex items-center gap-2">
        {/* Quick notification indicators */}
        {followUpCount > 0 && (
          <Link
            href="/admin/customers?filter=followup"
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors"
            title={`${followUpCount} pelanggan perlu follow-up`}
          >
            <Users size={13} />
            <span>{followUpCount} CRM Alert</span>
          </Link>
        )}

        {/* Shadcn Dark/Light Mode Toggle */}
        <ModeToggle />
      </div>
    </header>
  );
}

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [followUpCount, setFollowUpCount] = useState(0);
  const [dismissBanner, setDismissBanner] = useState(true);

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
      const [{ data: allBookings }, { data: settingsRows }, { data: custs }, { data: discs }] = await Promise.all([
        supabase.from('bookings').select('customer_id, status, booking_date'),
        supabase.from('settings').select('key, value').in('key', ['re_engagement_days']),
        supabase.from('customers').select('id, visit_count_base'),
        supabase.from('discounts').select('type, min_orders, is_active').eq('is_active', true),
      ]);

      // Calculate CRM Follow-ups
      if (custs && allBookings) {
        const countMap: Record<string, number> = {};
        const lastMap: Record<string, string> = {};

        allBookings.forEach((r) => {
          if (!r.customer_id) return;
          countMap[r.customer_id] = (countMap[r.customer_id] ?? 0) + (r.status === 'Completed' ? 1 : 0);
          if (r.status === 'Completed') {
            if (!lastMap[r.customer_id] || r.booking_date > lastMap[r.customer_id]) {
              lastMap[r.customer_id] = r.booking_date;
            }
          }
        });

        const reDays = settingsRows?.find((s) => s.key === 're_engagement_days')?.value
          ? Number(settingsRows.find((s) => s.key === 're_engagement_days')?.value)
          : 60;

        let fCount = 0;
        custs.forEach((c) => {
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
          const loyalPromo = discs?.some((d) => d.type === 'loyal' && d.min_orders && nextCount >= d.min_orders);

          if (loyalPromo) {
            eligiblePromo = true;
          } else if (lastVisit && days >= reDays) {
            const rcPromo = discs?.some((d) => d.type === 'returning_customer');
            if (rcPromo) eligiblePromo = true;
          }

          if (dormant || eligiblePromo) {
            fCount++;
          }
        });
        setFollowUpCount(fCount);
      }
    } catch (e) {
      console.error(e);
    }
  }, [pathname, supabase]);

  useEffect(() => {
    fetchCRMData();
  }, [fetchCRMData]);

  // Login page — no sidebar
  if (pathname === '/admin') {
    return <>{children}</>;
  }

  const showBanner = !dismissBanner && followUpCount > 0;

  return (
    <SidebarProvider>
      <AppSidebar followUpCount={followUpCount} />
      <SidebarInset className="min-h-screen bg-zinc-50/50 dark:bg-zinc-950/50">
        <AdminHeader followUpCount={followUpCount} />

        <main className="flex-1 p-4 md:p-6 print:p-0">
          {/* CRM Follow-up Reminder Banner */}
          {showBanner && (
            <div className="mb-6 relative rounded-2xl transition-all animate-fadeIn print:hidden overflow-hidden border border-zinc-200/80 dark:border-zinc-800 shadow-sm">
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/15 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0 shadow-xs">
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
                  <Link
                    href="/admin/customers?filter=followup"
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs active:scale-[0.98]"
                  >
                    Lihat Pelanggan
                  </Link>
                  <button
                    onClick={handleDismissBanner}
                    className="p-2 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-600 rounded-lg transition-colors cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <TooltipProvider>
        <AdminLayoutInner>{children}</AdminLayoutInner>
      </TooltipProvider>
    </UserProvider>
  );
}
