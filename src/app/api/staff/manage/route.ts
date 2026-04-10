import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

const STAFF_EMAIL_DOMAIN = '@staff.serenaraga.internal';

// Helper: verifikasi bahwa requester adalah Owner (Supabase Auth session)
async function verifyOwner() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// GET /api/staff/manage — list semua staff
export async function GET() {
  const owner = await verifyOwner();
  if (!owner) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('staff_users')
    .select('id, username, display_name, role, is_active, created_at, last_login')
    .order('created_at');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ staff: data });
}

// POST /api/staff/manage — tambah akun kasir baru
export async function POST(request: Request) {
  const owner = await verifyOwner();
  if (!owner) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { username, password, display_name, role = 'cashier' } = await request.json();
  if (!username || !password || !display_name) {
    return NextResponse.json({ error: 'Semua field wajib diisi.' }, { status: 400 });
  }

  const cleanUsername = username.toLowerCase().trim();
  const pseudoEmail   = `${cleanUsername}${STAFF_EMAIL_DOMAIN}`;
  const hashed        = await bcrypt.hash(password, 12);
  const supabase      = createAdminClient();

  // 1. Buat akun Supabase Auth (pseudo-email) agar kasir punya sesi autentikasi resmi
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: pseudoEmail,
    password,
    email_confirm: true,
    user_metadata: { role, display_name, username: cleanUsername, is_staff: true },
  });

  if (authError) {
    if (authError.message.includes('already')) {
      return NextResponse.json({ error: 'Username sudah dipakai.' }, { status: 409 });
    }
    return NextResponse.json({ error: authError.message }, { status: 500 });
  }

  // 2. Simpan ke tabel staff_users dengan supabase_uid
  const { data, error } = await supabase.from('staff_users').insert({
    username: cleanUsername,
    password: hashed,
    display_name: display_name.trim(),
    role,
    supabase_uid: authData.user.id,
  }).select('id, username, display_name, role, is_active').single();

  if (error) {
    // Rollback auth user jika insert gagal
    await supabase.auth.admin.deleteUser(authData.user.id);
    if (error.code === '23505') return NextResponse.json({ error: 'Username sudah dipakai.' }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ staff: data });
}

// PATCH /api/staff/manage — update (reset password / toggle aktif)
export async function PATCH(request: Request) {
  const owner = await verifyOwner();
  if (!owner) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, password, is_active, display_name } = await request.json();
  if (!id) return NextResponse.json({ error: 'ID wajib.' }, { status: 400 });

  const supabase = createAdminClient();
  const patch: Record<string, unknown> = {};

  if (password) {
    patch.password = await bcrypt.hash(password, 12);

    // Sync password ke Supabase Auth juga
    const { data: staff } = await supabase
      .from('staff_users').select('supabase_uid').eq('id', id).single();
    if (staff?.supabase_uid) {
      await supabase.auth.admin.updateUserById(staff.supabase_uid, { password });
    }
  }
  if (typeof is_active === 'boolean') patch.is_active = is_active;
  if (display_name) {
    patch.display_name = display_name.trim();
    // Sync display_name ke Supabase Auth metadata
    const { data: staff } = await supabase
      .from('staff_users').select('supabase_uid').eq('id', id).single();
    if (staff?.supabase_uid) {
      await supabase.auth.admin.updateUserById(staff.supabase_uid, {
        user_metadata: { display_name: display_name.trim() },
      });
    }
  }

  const { data, error } = await supabase.from('staff_users').update(patch).eq('id', id)
    .select('id, username, display_name, role, is_active').single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ staff: data });
}

// DELETE /api/staff/manage — hapus akun kasir
export async function DELETE(request: Request) {
  const owner = await verifyOwner();
  if (!owner) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: 'ID wajib.' }, { status: 400 });

  const supabase = createAdminClient();

  // Hapus Supabase Auth user juga
  const { data: staff } = await supabase
    .from('staff_users').select('supabase_uid').eq('id', id).single();
  if (staff?.supabase_uid) {
    await supabase.auth.admin.deleteUser(staff.supabase_uid);
  }

  const { error } = await supabase.from('staff_users').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
