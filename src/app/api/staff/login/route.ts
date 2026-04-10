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

    // Return session payload (disimpan di localStorage client)
    return NextResponse.json({
      success: true,
      session: {
        staff_id: staff.id,
        username: staff.username,
        display_name: staff.display_name,
        role: staff.role,
        issued_at: Date.now(),
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 });
  }
}
