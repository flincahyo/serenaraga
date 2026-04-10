import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import bcrypt from 'bcryptjs';

// POST /api/staff/login
// Body: { username: string, password: string }
export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username dan password wajib diisi.' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data: staff, error } = await supabase
      .from('staff_users')
      .select('id, username, password, role, display_name, is_active')
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

    const sessionPayload = {
      staff_id: staff.id,
      username: staff.username,
      display_name: staff.display_name,
      role: staff.role,
      issued_at: Date.now(),
    };

    const response = NextResponse.json({ success: true, session: sessionPayload });

    // Set HttpOnly cookie so middleware can detect the staff session
    response.cookies.set('sr_staff_session', JSON.stringify(sessionPayload), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8, // 8 jam
      path: '/',
    });

    return response;
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 });
  }
}
