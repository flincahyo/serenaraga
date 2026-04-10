'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';

export type UserRole = 'owner' | 'cashier' | null;

export type AppUser = {
  role: UserRole;
  displayName: string;
  email?: string;
  username?: string;
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
  const [user, setUser]     = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const refreshUser = useCallback(async () => {
    setLoading(true);

    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (authUser) {
      const isStaff = authUser.user_metadata?.is_staff === true;
      if (isStaff) {
        // Kasir: role dari Supabase user_metadata
        setUser({
          role: 'cashier',
          displayName: authUser.user_metadata?.display_name ?? 'Kasir',
          username: authUser.user_metadata?.username,
        });
      } else {
        // Owner: login dengan email asli
        setUser({
          role: 'owner',
          displayName: 'Owner',
          email: authUser.email,
        });
      }
    } else {
      setUser(null);
    }

    setLoading(false);
  }, [supabase]);

  const logout = async () => {
    await supabase.auth.signOut();
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
