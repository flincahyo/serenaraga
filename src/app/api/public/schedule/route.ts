import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export const revalidate = 0; // Disable static caching so it's always real-time

export async function GET() {
  try {
    const supabase = createAdminClient();

    // FIX BUG 2: Use WIB (Asia/Jakarta, UTC+7) timezone consistently.
    // new Date() returns UTC on most servers. We derive "today" in WIB
    // by formatting with the correct timezone and re-parsing as a date-only string.
    const daysName   = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const monthsName = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];

    const dateStrings: string[] = [];
    const dayOfWeeks:  number[] = [];
    const labels:      string[] = [];

    for (let i = 0; i < 14; i++) {
      // Build the date string in WIB by advancing from today (UTC) then formatting
      // with the Jakarta locale — this is safe even when the server is in UTC.
      const raw = new Date(Date.now() + i * 86_400_000);
      const dateStr = raw.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }); // "YYYY-MM-DD"

      // Reconstruct a local Date object for WIB so .getDay() / .getDate() etc. are correct
      const [y, mo, d] = dateStr.split('-').map(Number);
      const wibDate = new Date(y, mo - 1, d); // local midnight — correct for day-of-week

      dateStrings.push(dateStr);
      dayOfWeeks.push(wibDate.getDay());
      labels.push(`${daysName[wibDate.getDay()]}, ${wibDate.getDate()} ${monthsName[wibDate.getMonth()]}`);
    }

    const startDateStr = dateStrings[0];
    const endDateStr   = dateStrings[13];

    // Fetch dependencies concurrently
    // FIX BUG 1: 'therapist_timeoff' → 'therapist_timeoffs' (correct table name)
    // FIX BUG 4: booking_items query now filtered to the 14-day window only
    const [thRes, shRes, offRes, bRes, setRes] = await Promise.all([
      supabase.from('therapists').select('id, name, is_active').eq('is_active', true),
      supabase.from('therapist_shifts').select('therapist_id, day_of_week, start_time, end_time, is_working, break_start_time, break_end_time'),
      supabase.from('therapist_timeoffs').select('therapist_id, off_date, is_full_day, start_time, end_time, reason').gte('off_date', startDateStr).lte('off_date', endDateStr),
      supabase.from('booking_items').select('id, therapist_id, service_name, duration, bookings!inner(id, booking_date, booking_time, status)').neq('bookings.status', 'Canceled').gte('bookings.booking_date', startDateStr).lte('bookings.booking_date', endDateStr),
      supabase.from('settings').select('value').eq('key', 'default_buffer_time').maybeSingle()
    ]);

    const therapists    = thRes.data  || [];
    const shifts        = shRes.data  || [];
    const timeoffs      = offRes.data || [];
    const rawBookings   = bRes.data   || [];
    const defaultBuffer = setRes.data?.value ? Number(setRes.data.value) : 30;

    // Group booking_items by (booking_id + therapist_id) to prevent double-counting buffer
    const groupedMap: Record<string, { therapist_id: string; booking_date: string; booking_time: string; duration: number }> = {};

    rawBookings.forEach((b: any) => {
      if (!b.therapist_id) return;

      let dur = parseInt(String(b.duration)) || 0;
      if (dur === 0) {
        const nameLower = (b.service_name || '').toLowerCase();
        if (nameLower.includes('60') || nameLower.includes('1 jam')) dur = 60;
        else if (nameLower.includes('120') || nameLower.includes('2 jam')) dur = 120;
        else dur = 90;
      }
      // Skip pure transport/call-out items explicitly set to 0 duration
      if (b.service_name?.toLowerCase().includes('panggilan') && dur === 0) return;

      if (dur > 0) {
        const groupId = `${b.bookings?.id || b.id}_${b.therapist_id}`;
        if (!groupedMap[groupId]) {
          groupedMap[groupId] = {
            therapist_id: b.therapist_id,
            booking_date: b.bookings.booking_date,
            booking_time: b.bookings.booking_time,
            duration: dur,
          };
        } else {
          groupedMap[groupId].duration += dur;
        }
      }
    });

    const groupedBookings = Object.values(groupedMap);

    const timeToMins = (t: string) => {
      if (!t) return 0;
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };
    const minsToTime = (mins: number) => {
      const hh = Math.floor(mins / 60);
      const mm = mins % 60;
      return `${String(hh).padStart(2, '0')}.${String(mm).padStart(2, '0')}`;
    };

    const publicSchedule = [];

    for (let i = 0; i < 14; i++) {
      const dateStr = dateStrings[i];
      const dow     = dayOfWeeks[i];
      const label   = labels[i];

      let workingCount = 0;
      const shopFreeBlocks: { s: number; e: number }[] = [];

      therapists.forEach(th => {
        const tid      = th.id;
        const thShift  = shifts.find(s => s.therapist_id === tid && s.day_of_week === dow);
        const thOff    = timeoffs.find(o => o.therapist_id === tid && o.off_date === dateStr);

        // Full-day off → therapist completely unavailable today
        if (thOff?.is_full_day) return;
        // No shift defined or explicitly not working → skip
        if (!thShift || !thShift.is_working) return;

        workingCount++;
        let tFree: { s: number; e: number }[] = [{ s: timeToMins(thShift.start_time), e: timeToMins(thShift.end_time) }];

        const removeBlock = (start: number, end: number) => {
          const newFree: { s: number; e: number }[] = [];
          for (const f of tFree) {
            if (end <= f.s || start >= f.e) {
              newFree.push(f);            // no overlap — keep as-is
            } else {
              if (start > f.s) newFree.push({ s: f.s,   e: start }); // left remainder
              if (end   < f.e) newFree.push({ s: end,   e: f.e   }); // right remainder
            }
          }
          tFree = newFree;
        };

        // Remove break time
        if (thShift.break_start_time && thShift.break_end_time) {
          removeBlock(timeToMins(thShift.break_start_time), timeToMins(thShift.break_end_time));
        }
        // Remove partial day-off window
        if (thOff && !thOff.is_full_day && thOff.start_time && thOff.end_time) {
          removeBlock(timeToMins(thOff.start_time), timeToMins(thOff.end_time));
        }

        // Remove each booking window (duration + travel buffer)
        const thBookings = groupedBookings.filter(b => b.therapist_id === tid && b.booking_date === dateStr);
        for (const bk of thBookings) {
          const start = timeToMins(bk.booking_time);
          removeBlock(start, start + bk.duration + defaultBuffer);
        }

        // A slot must be at least 90 min (shortest realistic service 60m + 30m min buffer)
        tFree = tFree.filter(f => (f.e - f.s) >= 90);
        shopFreeBlocks.push(...tFree);
      });

      if (workingCount === 0 || shopFreeBlocks.length === 0) {
        publicSchedule.push({ date: dateStr, label, timeText: 'FULL BOOKED', freeBlocks: [], isFull: true });
        continue;
      }

      // Merge overlapping free blocks across all therapists (union — any therapist can take it)
      shopFreeBlocks.sort((a, b) => a.s - b.s);
      const mergedBlocks: { s: number; e: number }[] = [shopFreeBlocks[0]];

      for (let j = 1; j < shopFreeBlocks.length; j++) {
        const curr = shopFreeBlocks[j];
        const last = mergedBlocks[mergedBlocks.length - 1];
        if (curr.s <= last.e) {
          last.e = Math.max(last.e, curr.e);
        } else {
          mergedBlocks.push(curr);
        }
      }

      const timeParts = mergedBlocks.map(b => `${minsToTime(b.s)} - ${minsToTime(b.e)}`);
      publicSchedule.push({
        date: dateStr,
        label,
        timeText: timeParts.join(' & '),
        freeBlocks: mergedBlocks,
        isFull: false,
      });
    }

    return NextResponse.json({ success: true, data: publicSchedule }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch (error: any) {
    console.error('Failed to fetch public schedule:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
