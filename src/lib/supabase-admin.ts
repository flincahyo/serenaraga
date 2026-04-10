import { createClient } from '@supabase/supabase-js';

// Service role client — hanya dipakai di Server (API routes)
// JANGAN pernah import file ini di komponen client/'use client'
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
