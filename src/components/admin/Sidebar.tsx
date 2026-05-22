'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, CalendarCheck, CalendarDays, ClipboardList,
  Receipt, BarChart3, Image, X, LogOut, Settings2, FlaskConical, Users, Tag, UserSquare2, UserCog, ShoppingCart, Share2, ImagePlay, FileText, ChevronDown, ChevronLeft, ChevronRight, Gift, Video
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { useUser } from '@/lib/user-context';

// Nav items per role
const OWNER_NAV_GROUPS = [
  {
    label: 'Main Menu',
    items: [
      { name: 'Dashboard',      icon: LayoutDashboard, href: '/admin/dashboard' },
      { name: 'Tracker Jadwal', icon: CalendarDays,    href: '/admin/calendar' },
      { name: 'Bookings',       icon: CalendarCheck,   href: '/admin/bookings' },
      { name: 'Invoices',       icon: Receipt,         href: '/admin/invoices' },
    ]
  },
  {
    label: 'Management',
    items: [
      { name: 'Services',       icon: ClipboardList,   href: '/admin/services' },
      { name: 'Bahan (BHP)',    icon: FlaskConical,    href: '/admin/materials' },
      { name: 'Customers',      icon: Users,           href: '/admin/customers' },
      { name: 'Terapis',        icon: UserSquare2,     href: '/admin/therapists' },
      { name: 'Staff & Kasir',  icon: UserCog,         href: '/admin/staff' },
    ]
  },
  {
    label: 'Marketing & Publikasi',
    items: [
      { name: 'Feed Studio',    icon: ImagePlay,       href: '/admin/feed-studio-v2' },
      { name: 'Reels Studio',   icon: Video,           href: '/admin/reels-studio' },
      { name: 'Surat Resmi',    icon: FileText,        href: '/admin/letters' },
      { name: 'Share Jadwal',   icon: Share2,          href: '/admin/schedule' },
      { name: 'Diskon & Promo', icon: Tag,             href: '/admin/discounts' },
      { name: 'Voucher',        icon: Gift,            href: '/admin/vouchers' },
      { name: 'Konten',         icon: Image,           href: '/admin/content' },
    ]
  },
  {
    label: 'Sistem',
    items: [
      { name: 'Reports',        icon: BarChart3,       href: '/admin/reports' },
      { name: 'Settings',       icon: Settings2,       href: '/admin/settings' },
    ]
  }
];

const CASHIER_NAV_GROUPS = [
  {
    label: 'Operasional Kasir',
    items: [
      { name: 'POS Kasir',      icon: ShoppingCart,   href: '/admin/pos' },
      { name: 'Bookings',       icon: CalendarCheck,  href: '/admin/bookings' },
      { name: 'Invoices',       icon: Receipt,        href: '/admin/invoices' },
      { name: 'Customers',      icon: Users,          href: '/admin/customers' },
    ]
  },
  {
    label: 'Media',
    items: [
      { name: 'Share Jadwal',   icon: Share2,         href: '/admin/schedule' },
    ]
  }
];

interface SidebarProps { 
  open: boolean; 
  onClose: () => void; 
  isCollapsed?: boolean; 
  onToggleCollapse?: () => void; 
}

const Sidebar = ({ open, onClose, isCollapsed, onToggleCollapse }: SidebarProps) => {
  const pathname = usePathname();
  const { user, logout } = useUser();

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'Main Menu': true,
    'Management': true,
    'Operasional Kasir': true // Default for cashier
  });

  const toggleGroup = (label: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [label]: !prev[label]
    }));
  };

  const navGroups = user?.role === 'cashier' ? CASHIER_NAV_GROUPS : OWNER_NAV_GROUPS;
  const roleBadge = user?.role === 'cashier' ? 'Kasir' : 'Owner';
  const roleColor = user?.role === 'cashier'
    ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400'
    : 'bg-earth-primary/10 text-earth-primary';

  return (
    <>
      {/* Mobile Overlay */}
      {open && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={onClose} />
      )}

      <aside className={`
        fixed left-0 top-0 h-full z-40 flex flex-col
        bg-white dark:bg-zinc-950
        border-r border-zinc-100 dark:border-zinc-800
        transition-all duration-300 ease-in-out
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
        ${isCollapsed ? 'w-20' : 'w-64'}
      `}>
        {/* Header */}
        <div className={`flex items-center justify-between py-5 border-b border-zinc-100 dark:border-zinc-800 transition-all duration-300 ${isCollapsed ? 'px-0 justify-center' : 'px-6'}`}>
          <Link href="/admin/dashboard" className={`flex flex-col leading-tight gap-1 overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`} onClick={onClose}>
            <div className="relative flex items-center justify-start h-[32px] w-[140px] overflow-hidden -ml-2">
              <img 
                src="/serenalogo2.svg" 
                alt="SerenaRaga" 
                className="absolute h-[160px] w-auto max-w-none object-contain -ml-3 dark:brightness-0 dark:invert dark:opacity-90" 
              />
            </div>
            <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-medium">
              {user?.role === 'cashier' ? 'Kasir Panel' : 'Owner Panel'}
            </span>
          </Link>
          <div className="flex items-center">
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="hidden lg:flex p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 active:scale-95 transition-all"
              >
                {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
              </button>
            )}
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto minimal-scrollbar">
          {navGroups.map((group, idx) => {
            const isExpanded = !!expandedGroups[group.label];
            return (
              <div key={idx} className="mb-6 last:mb-0">
                <button 
                  onClick={() => !isCollapsed && toggleGroup(group.label)}
                  className={`w-full flex items-center justify-between mb-2 group/header select-none ${isCollapsed ? 'px-0 justify-center cursor-default' : 'px-2 cursor-pointer'}`}
                >
                  <h3 className={`text-[10px] font-bold tracking-widest text-zinc-400 dark:text-zinc-500 uppercase transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0 overflow-hidden hidden' : 'w-auto opacity-100 group-hover/header:text-zinc-600 dark:group-hover/header:text-zinc-300'}`}>
                    {group.label}
                  </h3>
                  {!isCollapsed && (
                    <ChevronDown size={14} className={`text-zinc-400 dark:text-zinc-500 group-hover/header:text-zinc-600 dark:group-hover/header:text-zinc-400 transition-transform duration-200 ${isExpanded ? '' : '-rotate-90'}`} />
                  )}
                </button>
                
                <div 
                  className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                >
                  <div className="overflow-hidden space-y-0.5">
                    {group.items.map(({ name, icon: Icon, href }) => {
                      const active = pathname === href || pathname.startsWith(href + '/');
                      return (
                        <Link
                          key={href}
                          href={href}
                          onClick={onClose}
                          title={isCollapsed ? name : undefined}
                          className={`
                            flex items-center gap-3 py-2.5 rounded-xl text-sm font-medium transition-all relative overflow-hidden
                            ${isCollapsed ? 'px-0 justify-center mb-1' : 'px-3'}
                            ${active
                              ? 'bg-earth-primary shadow-sm text-white'
                              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 hover:text-zinc-900 dark:hover:text-white'
                            }
                          `}
                        >
                          <Icon size={isCollapsed ? 20 : 18} className={`shrink-0 transition-all duration-300 ${active ? "opacity-100" : "opacity-75"}`} />
                          <span className={`whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
                            {name}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className={`border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/10 transition-all duration-300 ${isCollapsed ? 'p-2' : 'p-4'}`}>
          {/* User Profile Card */}
          <div className={`flex items-center mb-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm transition-all duration-300 overflow-hidden ${isCollapsed ? 'p-2 justify-center gap-0' : 'p-2 gap-3'}`}>
            <div className={`rounded-full bg-earth-primary/10 flex items-center justify-center shrink-0 transition-all duration-300 ${isCollapsed ? 'w-10 h-10' : 'w-9 h-9'}`}>
              <span className={`font-bold text-earth-primary ${isCollapsed ? 'text-lg' : 'text-sm'}`}>
                {user?.displayName?.charAt(0)?.toUpperCase() ?? 'A'}
              </span>
            </div>
            {!isCollapsed && (
              <div className="leading-tight min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-[13px] font-bold text-zinc-900 dark:text-white truncate">{user?.displayName ?? 'Admin'}</p>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md shrink-0 uppercase tracking-wider ${roleColor}`}>
                    {roleBadge}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 truncate mt-0.5">{user?.email ?? user?.username ?? ''}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className={`flex items-center gap-2 transition-all duration-300 ${isCollapsed ? 'flex-col' : ''}`}>
            <div className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shrink-0 flex items-center justify-center transition-all ${isCollapsed ? 'w-full py-2' : ''}`}>
              <ThemeToggle />
            </div>
            <button
              onClick={logout}
              className={`flex items-center justify-center gap-2 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 dark:text-red-400 dark:bg-red-950/40 dark:hover:bg-red-900/60 border border-transparent dark:border-red-900/30 transition-all ${isCollapsed ? 'p-3 w-full' : 'flex-1 px-3 py-2.5'}`}
              title="Logout"
            >
              <LogOut size={isCollapsed ? 18 : 15} />
              {!isCollapsed && "Logout Session"}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
