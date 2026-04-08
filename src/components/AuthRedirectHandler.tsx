'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

export function AuthRedirectHandler() {
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;

    // Parse hash params
    const params = new URLSearchParams(hash.substring(1));
    const type = params.get('type');
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if ((type === 'recovery' || type === 'invite') && accessToken && refreshToken) {
      const supabase = createClient();
      
      // Set session from the tokens in hash
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      }).then(() => {
        // Clear the hash from URL and redirect to set password
        window.history.replaceState(null, '', window.location.pathname);
        router.push('/auth/update-password');
      });
    }
  }, [router]);

  return null;
}
