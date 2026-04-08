'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="relative p-3 rounded-2xl bg-bg-cream dark:bg-white/5 border border-earth-primary/10 dark:border-white/10 hover:border-earth-primary/30 transition-all group overflow-hidden"
      aria-label="Toggle Theme"
    >
      <div className="relative z-10 text-earth-primary dark:text-white/80 group-hover:scale-110 transition-transform">
        <Sun className="h-[1.5rem] w-[1.5rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute top-0 h-[1.5rem] w-[1.5rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      </div>
      <div className="absolute inset-0 bg-earth-primary/5 dark:bg-white/5 scale-0 group-hover:scale-100 transition-transform duration-300 rounded-full" />
    </button>
  );
}
