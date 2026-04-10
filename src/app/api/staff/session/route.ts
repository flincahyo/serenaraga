import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// GET /api/staff/session — baca staff session dari httpOnly cookie
export async function GET() {
  const cookieStore = await cookies();
  const staffCookie = cookieStore.get('sr_staff_session');

  if (!staffCookie?.value) {
    return NextResponse.json({ staff: null });
  }

  try {
    const session = JSON.parse(staffCookie.value);
    // Validasi masih fresh (8 jam)
    const eightHours = 8 * 60 * 60 * 1000;
    if (Date.now() - (session.issued_at ?? 0) > eightHours) {
      const res = NextResponse.json({ staff: null });
      res.cookies.delete('sr_staff_session');
      return res;
    }
    return NextResponse.json({ staff: session });
  } catch {
    return NextResponse.json({ staff: null });
  }
}
