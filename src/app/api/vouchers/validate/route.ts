import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')?.trim().toUpperCase();
  if (!code) {
    return NextResponse.json({ valid: false, error: 'Kode voucher tidak boleh kosong.' }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from('discounts')
    .select('id, name, value, value_type, max_uses, uses_count, valid_to, is_active, is_voucher, recipient_name, buyer_name, target_service')
    .eq('code', code)
    .eq('is_voucher', true)
    .single();

  if (error || !data) {
    return NextResponse.json({ valid: false, error: 'Kode voucher tidak ditemukan.' }, { status: 404 });
  }

  if (!data.is_active) {
    return NextResponse.json({ valid: false, error: 'Voucher ini sudah tidak aktif.' }, { status: 400 });
  }

  if (data.max_uses !== null && data.uses_count >= data.max_uses) {
    return NextResponse.json({ valid: false, error: 'Voucher ini sudah mencapai batas pemakaian maksimal.' }, { status: 400 });
  }

  if (data.valid_to) {
    const expiry = new Date(data.valid_to);
    expiry.setHours(23, 59, 59, 999);
    if (new Date() > expiry) {
      return NextResponse.json({ valid: false, error: `Voucher sudah kadaluarsa sejak ${data.valid_to}.` }, { status: 400 });
    }
  }

  const remaining = data.max_uses !== null ? data.max_uses - data.uses_count : null;

  return NextResponse.json({
    valid: true,
    voucher: {
      id: data.id,
      name: data.name,
      value: data.value,
      value_type: data.value_type,
      recipient_name: data.recipient_name,
      buyer_name: data.buyer_name,
      target_service: data.target_service,
      remaining_uses: remaining,
      valid_to: data.valid_to,
    }
  });
}
