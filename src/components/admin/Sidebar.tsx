'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, CalendarCheck, ClipboardList,
  Receipt, BarChart3, Image, X, LogOut, Settings2, FlaskConical, Users, Tag, UserSquare2,
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { createClient } from '@/lib/supabase';

const navItems = [
  { name: 'Dashboard',      icon: LayoutDashboard, href: '/admin/dashboard' },
  { name: 'Bookings',       icon: CalendarCheck,   href: '/admin/bookings' },
  { name: 'Services',       icon: ClipboardList,   href: '/admin/services' },
  { name: 'Bahan (BHP)',    icon: FlaskConical,    href: '/admin/materials' },
  { name: 'Customers',      icon: Users,           href: '/admin/customers' },
  { name: 'Terapis',        icon: UserSquare2,     href: '/admin/therapists' },
  { name: 'Diskon & Promo', icon: Tag,             href: '/admin/discounts' },
  { name: 'Invoices',       icon: Receipt,         href: '/admin/invoices' },
  { name: 'Reports',        icon: BarChart3,       href: '/admin/reports' },
  { name: 'Konten',         icon: Image,           href: '/admin/content' },
  { name: 'Settings',       icon: Settings2,       href: '/admin/settings' },
];

interface SidebarProps { open: boolean; onClose: () => void; }

const Sidebar = ({ open, onClose }: SidebarProps) => {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/admin');
    router.refresh();
  };

  return (
    <>
      {/* Mobile Overlay */}
      {open && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={onClose} />
      )}

      <aside className={`
        fixed left-0 top-0 h-full z-40 flex flex-col
        w-64 bg-white dark:bg-zinc-950
        border-r border-zinc-100 dark:border-zinc-800
        transition-transform duration-300 ease-in-out
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100 dark:border-zinc-800">
          <Link href="/admin/dashboard" className="flex flex-col leading-tight" onClick={onClose}>
            <span className="text-lg font-bold tracking-tight dark:text-white font-sans">
              Serena<span className="text-earth-primary">Raga</span>
            </span>
            <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-medium">
              Admin Panel
            </span>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(({ name, icon: Icon, href }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${active
                    ? 'bg-earth-primary text-white'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white'
                  }
                `}
              >
                <Icon size={17} />
                {name}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-zinc-100 dark:border-zinc-800 space-y-1">
          <div className="flex items-center justify-between px-3 py-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-earth-primary/10 flex items-center justify-center">
                <span className="text-xs font-bold text-earth-primary">SR</span>
              </div>
              <div className="leading-tight">
                <p className="text-xs font-semibold dark:text-white">Admin</p>
                <p className="text-[10px] text-zinc-400">SerenaRaga</p>
              </div>
            </div>
            <ThemeToggle />
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          >
            <LogOut size={17} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
