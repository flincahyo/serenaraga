import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import bcrypt from 'bcryptjs';

const STAFF_EMAIL_DOMAIN = '@staff.serenaraga.internal';

// POST /api/staff/login
export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();
    if (!username || !password) {
      return NextResponse.json({ error: 'Username dan password wajib diisi.' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // 1. Cek akun di staff_users (username + bcrypt)
    const { data: staff, error } = await supabase
      .from('staff_users')
      .select('id, username, password, role, display_name, is_active, supabase_uid')
      .eq('username', username.toLowerCase().trim())
      .single();

    if (error || !staff || !staff.is_active) {
      return NextResponse.json({ error: 'Username atau password salah.' }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, staff.password);
    if (!valid) {
      return NextResponse.json({ error: 'Username atau password salah.' }, { status: 401 });
    }

    // Update last_login
    await supabase.from('staff_users').update({ last_login: new Date().toISOString() }).eq('id', staff.id);

    // 2. Sign in ke Supabase Auth (pseudo email) agar browser kasir dapat sesi authenticated resmi
    const pseudoEmail = `${staff.username}${STAFF_EMAIL_DOMAIN}`;
    const { data: authData, error: authError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: pseudoEmail,
    });

    // Fallback: gunakan signInWithPassword jika generateLink tidak tersedia  
    // Kita respond dengan info yang client butuhkan untuk sign in
    return NextResponse.json({
      success: true,
      pseudo_email: pseudoEmail,
      plaintext_password: password, // client perlu ini untuk signInWithPassword
      staff: {
        staff_id: staff.id,
        username: staff.username,
        display_name: staff.display_name,
        role: staff.role,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 });
  }
}
