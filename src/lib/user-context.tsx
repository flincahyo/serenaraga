'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';

export type UserRole = 'owner' | 'cashier' | null;

export type AppUser = {
  role: UserRole;
  displayName: string;
  email?: string;        // hanya owner
  username?: string;     // hanya kasir
  staffId?: string;      // hanya kasir
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

    // 1. Cek apakah ada sesi Supabase Auth (Owner)
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      setUser({ role: 'owner', displayName: 'Owner', email: authUser.email });
      setLoading(false);
      return;
    }

    // 2. Cek apakah ada sesi kasir di localStorage
    const staffSessionRaw = localStorage.getItem('sr_staff_session');
    if (staffSessionRaw) {
      try {
        const staffSession = JSON.parse(staffSessionRaw);
        // Validasi session masih fresh (max 8 jam)
        const issuedAt = staffSession.issued_at ?? 0;
        const eightHours = 8 * 60 * 60 * 1000;
        if (Date.now() - issuedAt < eightHours) {
          setUser({
            role: 'cashier',
            displayName: staffSession.display_name,
            username: staffSession.username,
            staffId: staffSession.staff_id,
          });
          setLoading(false);
          return;
        } else {
          localStorage.removeItem('sr_staff_session');
        }
      } catch {
        localStorage.removeItem('sr_staff_session');
      }
    }

    setUser(null);
    setLoading(false);
  }, [supabase]);

  const logout = async () => {
    // Logout owner
    await supabase.auth.signOut();
    // Logout kasir
    localStorage.removeItem('sr_staff_session');
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
