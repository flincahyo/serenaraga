'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';

export type UserRole = 'owner' | 'cashier' | null;

export type AppUser = {
  role: UserRole;
  displayName: string;
  email?: string;
  username?: string;
  staffId?: string;
};

type UserContextType = {
  user: AppUser | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const UserContext = createContext<UserContextType>({
  user: null,
  loading: true,
  logout: async () => {},
  refreshUser: async () => {},
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const refreshUser = useCallback(async () => {
    setLoading(true);

    // 1. Cek Supabase Auth session (Owner)
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      setUser({ role: 'owner', displayName: 'Owner', email: authUser.email });
      setLoading(false);
      return;
    }

    // 2. Cek staff session via API (membaca httpOnly cookie)
    try {
      const res = await fetch('/api/staff/session');
      if (res.ok) {
        const data = await res.json();
        if (data.staff) {
          setUser({
            role: 'cashier',
            displayName: data.staff.display_name,
            username: data.staff.username,
            staffId: data.staff.staff_id,
          });
          setLoading(false);
          return;
        }
      }
    } catch { /* ignore */ }

    setUser(null);
    setLoading(false);
  }, [supabase]);

  const logout = async () => {
    // Logout owner
    await supabase.auth.signOut();
    // Logout kasir — hapus cookie via API
    await fetch('/api/staff/logout', { method: 'POST' });
    setUser(null);
    window.location.href = '/admin';
  };

  useEffect(() => {
    refreshUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      refreshUser();
    });
    return () => subscription.unsubscribe();
  }, [refreshUser, supabase]);

  return (
    <UserContext.Provider value={{ user, loading, logout, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
