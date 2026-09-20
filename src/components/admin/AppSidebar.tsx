'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarDays,
  CalendarCheck,
  Receipt,
  Wallet,
  ClipboardList,
  FlaskConical,
  Users,
  UserSquare2,
  UserCog,
  ImagePlay,
  Video,
  FileText,
  Share2,
  Tag,
  Gift,
  Image as ImageIcon,
  BarChart3,
  Settings2,
  ShoppingCart,
  Star,
  LucideIcon,
} from 'lucide-react';
import { useUser } from '@/lib/user-context';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { UserMenu } from '@/components/admin/UserMenu';
import { SerenaLogoPaths } from '@/components/SerenaLogoSvg';

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  followUpCount?: number;
}

type NavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  badge?: string;
  badgeVariant?: 'warning' | 'amber';
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

export function AppSidebar({
  followUpCount = 0,
  ...props
}: AppSidebarProps) {
  const pathname = usePathname();
  const { user } = useUser();

  const isCashier = user?.role === 'cashier';

  const ownerNav: NavGroup[] = [
    {
      title: 'Main Menu',
      items: [
        { title: 'Dashboard', url: '/admin/dashboard', icon: LayoutDashboard },
        { title: 'Tracker Jadwal', url: '/admin/calendar', icon: CalendarDays },
        { title: 'Bookings', url: '/admin/bookings', icon: CalendarCheck },
        { title: 'Invoices', url: '/admin/invoices', icon: Receipt },
        { title: 'Ulasan & Rating', url: '/admin/reviews', icon: Star },
      ],
    },
    {
      title: 'Management',
      items: [
        { title: 'Layanan & Treatment', url: '/admin/services', icon: ClipboardList },
        { title: 'Bahan (BHP)', url: '/admin/materials', icon: FlaskConical },
        {
          title: 'Pelanggan / CRM',
          url: '/admin/customers',
          icon: Users,
          badge: followUpCount > 0 ? `${followUpCount} Follow-up` : undefined,
          badgeVariant: 'amber',
        },
        { title: 'Terapis', url: '/admin/therapists', icon: UserSquare2 },
        { title: 'Staff & Kasir', url: '/admin/staff', icon: UserCog },
      ],
    },
    {
      title: 'Marketing & Studio',
      items: [
        { title: 'Feed Studio', url: '/admin/feed-studio-v2', icon: ImagePlay },
        { title: 'Reels Studio', url: '/admin/reels-studio', icon: Video },
        { title: 'Surat Resmi', url: '/admin/letters', icon: FileText },
        { title: 'Share Jadwal', url: '/admin/schedule', icon: Share2 },
        { title: 'Diskon & Promo', url: '/admin/discounts', icon: Tag },
        { title: 'Voucher', url: '/admin/vouchers', icon: Gift },
        { title: 'Konten Web', url: '/admin/content', icon: ImageIcon },
      ],
    },
    {
      title: 'Sistem',
      items: [
        { title: 'Laporan (Reports)', url: '/admin/reports', icon: BarChart3 },
        { title: 'Pengaturan (Settings)', url: '/admin/settings', icon: Settings2 },
      ],
    },
  ];

  const cashierNav: NavGroup[] = [
    {
      title: 'Operasional Kasir',
      items: [
        { title: 'POS Kasir', url: '/admin/pos', icon: ShoppingCart },
        { title: 'Bookings', url: '/admin/bookings', icon: CalendarCheck },
        { title: 'Invoices', url: '/admin/invoices', icon: Receipt },
        { title: 'Ulasan & Rating', url: '/admin/reviews', icon: Star },
        { title: 'Pelanggan', url: '/admin/customers', icon: Users },
      ],
    },
    {
      title: 'Media & Jadwal',
      items: [
        { title: 'Share Jadwal', url: '/admin/schedule', icon: Share2 },
      ],
    },
  ];

  const navGroups = isCashier ? cashierNav : ownerNav;

  return (
    <Sidebar variant="floating" collapsible="icon" className="bg-transparent" {...props}>
      {/* Header: Clean & seamless logo header */}
      <SidebarHeader className="p-3 pb-1.5 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:justify-center">
        <Link
          href="/admin/dashboard"
          className="flex items-center gap-2.5 overflow-hidden rounded-xl p-1 transition-colors hover:bg-sidebar-accent group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center"
        >
          {/* Expanded Sidebar: Official SerenaRaga Logo */}
          <div className="flex items-center group-data-[collapsible=icon]:hidden py-0.5">
            <svg
              viewBox="60 560 1370 370"
              className="h-8.5 w-auto max-w-[170px] text-zinc-900 dark:text-zinc-100"
              aria-label="SerenaRaga"
            >
              <SerenaLogoPaths monochrome={false} />
            </svg>
          </div>

          {/* Collapsed Icon Mode: Lotus Emblem Only */}
          <div className="hidden group-data-[collapsible=icon]:flex items-center justify-center size-9 rounded-xl bg-earth-primary/10 text-earth-primary shrink-0 p-1">
            <svg
              viewBox="60 560 510 370"
              className="size-6 text-earth-primary"
              aria-label="SerenaRaga"
            >
              <SerenaLogoPaths monochrome color="#8b5e3c" />
            </svg>
          </div>
        </Link>
      </SidebarHeader>

      {/* Main Nav Content */}
      <SidebarContent className="gap-0 py-1.5">
        {navGroups.map((group) => (
          <SidebarGroup key={group.title} className="py-1">
            <SidebarGroupLabel className="text-xs font-bold uppercase tracking-wider text-zinc-950 dark:text-zinc-100 px-3 py-1">
              {group.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive =
                    pathname === item.url ||
                    (item.url !== '/admin/dashboard' && pathname.startsWith(item.url));
                  const Icon = item.icon;

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        render={<Link href={item.url} />}
                        isActive={isActive}
                        tooltip={item.title}
                        className={`h-9 text-[13.5px] font-medium transition-all ${
                          isActive
                            ? 'bg-zinc-100 dark:bg-zinc-800/90 text-black dark:text-white font-semibold shadow-2xs'
                            : 'hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60 text-zinc-950 dark:text-zinc-50 hover:text-black dark:hover:text-white'
                        }`}
                      >
                        <Icon
                          className={`h-4.5 w-4.5 shrink-0 transition-colors ${
                            isActive
                              ? 'text-black dark:text-white'
                              : 'text-zinc-900 dark:text-zinc-100 group-hover/menu-button:text-black dark:group-hover/menu-button:text-white'
                          }`}
                        />
                        <span className="truncate flex-1">{item.title}</span>
                        {item.badge && (
                          <span className="group-data-[collapsible=icon]:hidden rounded-full bg-amber-500/10 px-2 py-0.5 text-[10.5px] font-semibold text-amber-700 dark:text-amber-300">
                            {item.badge}
                          </span>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* Footer / User Profile Popover */}
      <SidebarFooter className="p-2 group-data-[collapsible=icon]:p-1.5 group-data-[collapsible=icon]:justify-center">
        <SidebarMenu>
          <SidebarMenuItem>
            <UserMenu />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
