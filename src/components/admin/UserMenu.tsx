'use client';

import * as React from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import {
  ChevronsUpDown,
  LogOut,
  Moon,
  Sun,
  Settings2,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { useUser } from '@/lib/user-context';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarMenuButton, useSidebar } from '@/components/ui/sidebar';

export function UserMenu() {
  const { user, logout } = useUser();
  const { setTheme, theme, resolvedTheme } = useTheme();

  let isMobile = false;
  try {
    const sidebar = useSidebar();
    isMobile = sidebar.isMobile;
  } catch {
    // fallback
  }

  const isCashier = user?.role === 'cashier';
  const currentTheme = theme === 'system' ? resolvedTheme : theme;

  const toggleTheme = () => {
    setTheme(currentTheme === 'dark' ? 'light' : 'dark');
  };

  const displayName = user?.displayName || (isCashier ? 'Kasir SerenaRaga' : 'Owner SerenaRaga');
  const displayEmail = user?.email || (isCashier ? 'kasir@serenaraga.com' : 'owner@serenaraga.com');
  const roleLabel = isCashier ? 'Kasir / Staff' : 'Owner (Full Access)';

  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((n: string) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'SR';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <SidebarMenuButton
            size="lg"
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:bg-sidebar-accent cursor-pointer"
          />
        }
      >
        <Avatar className="h-8 w-8 rounded-lg bg-earth-primary/10 text-earth-primary border border-earth-primary/20">
          <AvatarFallback className="rounded-lg text-xs font-bold text-earth-primary">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
          <span className="truncate font-semibold text-[13.5px] text-black dark:text-white">
            {displayName}
          </span>
          <span className="truncate text-xs text-zinc-600 dark:text-zinc-400">
            {displayEmail}
          </span>
        </div>
        <ChevronsUpDown className="ml-auto h-4 w-4 text-zinc-800 dark:text-zinc-200 group-data-[collapsible=icon]:hidden" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-56 rounded-xl border border-sidebar-border bg-sidebar p-1 shadow-lg"
        side={isMobile ? 'bottom' : 'right'}
        align="end"
        sideOffset={8}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2.5 px-2 py-2 text-left text-xs">
            <Avatar className="h-8 w-8 rounded-lg bg-earth-primary/10 text-earth-primary border border-earth-primary/20">
              <AvatarFallback className="rounded-lg text-xs font-bold text-earth-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-xs leading-tight">
              <span className="truncate font-semibold text-sidebar-foreground">
                {displayName}
              </span>
              <span className="truncate text-[10px] text-muted-foreground">
                Role: <span className="font-medium text-sidebar-foreground capitalize">{isCashier ? 'Kasir' : 'Owner'}</span>
              </span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-1" />
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={toggleTheme}
            className="flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-xs text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <span className="flex items-center gap-2">
              {currentTheme === 'dark' ? (
                <Sun className="h-3.5 w-3.5 text-amber-500" />
              ) : (
                <Moon className="h-3.5 w-3.5 text-blue-500" />
              )}
              <span>Mode Tampilan</span>
            </span>
            <span className="text-[10px] text-muted-foreground uppercase font-medium">
              {currentTheme === 'dark' ? 'Gelap' : 'Terang'}
            </span>
          </DropdownMenuItem>

          {!isCashier && (
            <DropdownMenuItem
              render={<Link href="/admin/settings" />}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <Settings2 className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Pengaturan Toko</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="my-1" />
        <DropdownMenuItem
          onClick={logout}
          className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Keluar (Logout)</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
