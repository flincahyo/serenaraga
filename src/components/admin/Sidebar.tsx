'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  CalendarCheck, 
  ClipboardList, 
  Receipt, 
  BarChart3, 
  Settings,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

const Sidebar = () => {
  const pathname = usePathname();

  const menuItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} />, href: '/admin/dashboard' },
    { name: 'Bookings', icon: <CalendarCheck size={20} />, href: '/admin/bookings' },
    { name: 'Services', icon: <ClipboardList size={20} />, href: '/admin/services' },
    { name: 'Invoices', icon: <Receipt size={20} />, href: '/admin/invoices' },
    { name: 'Reports', icon: <BarChart3 size={20} />, href: '/admin/reports' },
  ];

  return (
    <aside className="w-72 min-h-screen bg-white dark:bg-zinc-950 border-r border-earth-primary/5 dark:border-white/5 flex flex-col p-6 fixed left-0 top-0 z-40 transition-colors duration-300">
      {/* Brand Logo */}
      <div className="mb-12 px-2">
        <Link href="/admin/dashboard" className="text-2xl font-serif font-bold tracking-tight dark:text-white">
          Serena<span className="text-earth-primary">Raga</span>
          <span className="block text-[10px] uppercase tracking-[0.3em] font-black text-earth-primary opacity-50 mt-1">Admin Panel</span>
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex-grow space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center justify-between p-4 rounded-2xl transition-all duration-300 group ${
                isActive 
                ? 'bg-earth-primary text-white shadow-lg shadow-earth-primary/20' 
                : 'text-text-secondary hover:bg-bg-cream dark:hover:bg-white/5 dark:text-white/60 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-4">
                <span className={`${isActive ? 'text-white' : 'text-earth-primary dark:text-white/40'}`}>
                  {item.icon}
                </span>
                <span className="font-bold text-sm tracking-wide">
                  {item.name}
                </span>
              </div>
              {isActive && <ChevronRight size={16} />}
            </Link>
          );
        })}
      </nav>

      {/* Footer / Controls */}
      <div className="mt-auto space-y-4 pt-6 border-t border-earth-primary/5 dark:border-white/5">
        <div className="flex items-center justify-between p-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-earth-primary/10 flex items-center justify-center font-bold text-earth-primary tracking-tighter">
              SR
            </div>
            <div>
              <p className="text-xs font-bold dark:text-white">Administrator</p>
              <p className="text-[10px] text-text-secondary dark:text-white/40 italic">Super Admin</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
        
        <Link 
          href="/admin"
          className="flex items-center gap-3 p-4 rounded-2xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors w-full font-bold text-xs uppercase tracking-widest"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;
