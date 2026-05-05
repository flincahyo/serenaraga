import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { code, booking_id } = body as { code: string; booking_id?: string };

  if (!code) {
    return NextResponse.json({ success: false, error: 'Kode voucher wajib diisi.' }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Re-validate before redeeming
  const { data, error } = await supabase
    .from('discounts')
    .select('id, max_uses, uses_count, valid_to, is_active, is_voucher')
    .eq('code', code.trim().toUpperCase())
    .eq('is_voucher', true)
    .single();

  if (error || !data) {
    return NextResponse.json({ success: false, error: 'Kode voucher tidak ditemukan.' }, { status: 404 });
  }
  if (!data.is_active) {
    return NextResponse.json({ success: false, error: 'Voucher sudah tidak aktif.' }, { status: 400 });
  }
  if (data.max_uses !== null && data.uses_count >= data.max_uses) {
    return NextResponse.json({ success: false, error: 'Batas pemakaian voucher sudah habis.' }, { status: 400 });
  }
  if (data.valid_to) {
    const expiry = new Date(data.valid_to);
    expiry.setHours(23, 59, 59, 999);
    if (new Date() > expiry) {
      return NextResponse.json({ success: false, error: 'Voucher sudah kadaluarsa.' }, { status: 400 });
    }
  }

  // Increment uses_count
  const newCount = data.uses_count + 1;
  const shouldDeactivate = data.max_uses !== null && newCount >= data.max_uses;

  const { error: updateError } = await supabase
    .from('discounts')
    .update({
      uses_count: newCount,
      ...(shouldDeactivate ? { is_active: false } : {}),
    })
    .eq('id', data.id);

  if (updateError) {
    return NextResponse.json({ success: false, error: 'Gagal memproses voucher.' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: shouldDeactivate
      ? 'Voucher berhasil di-redeem dan kini sudah tidak aktif (batas pemakaian tercapai).'
      : 'Voucher berhasil di-redeem.',
    voucher_id: data.id,
    new_uses_count: newCount,
  });
}
