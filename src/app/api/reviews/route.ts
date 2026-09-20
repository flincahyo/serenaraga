import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { createClient } from '@/lib/supabase';

export interface CustomerReview {
  id: string;
  booking_id?: string | null;
  invoice_number?: string | null;
  customer_name: string;
  customer_phone?: string | null;
  service_name?: string | null;
  therapist_id?: string | null;
  therapist_name?: string | null;
  rating: number; // 1 to 5
  tags: string[];
  note?: string | null;
  created_at: string;
  is_featured?: boolean;
}

// Helper to get supabase client
function getSupabase() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ? createAdminClient() : createClient();
}

export async function GET() {
  try {
    const supabase = getSupabase();

    // 1. Try fetching from native customer_reviews SQL table first
    const { data: tableData, error: tableErr } = await supabase
      .from('customer_reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (!tableErr && Array.isArray(tableData)) {
      return NextResponse.json({ success: true, reviews: tableData });
    }

    // 2. Fallback to settings.customer_reviews JSON
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'customer_reviews')
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching reviews from settings:', error);
      return NextResponse.json({ success: false, reviews: [] }, { status: 500 });
    }

    let reviews: CustomerReview[] = [];
    if (data?.value) {
      try {
        reviews = JSON.parse(data.value);
      } catch (e) {
        console.error('Failed parsing customer_reviews JSON:', e);
      }
    }

    // Sort newest first
    reviews.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({ success: true, reviews });
  } catch (err: any) {
    console.error('GET /api/reviews error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      bookingId,
      invoiceNumber,
      rating = 5,
      tags = [],
      note = '',
      customerName: customName,
      customerPhone: customPhone,
    } = body;

    const supabase = getSupabase();

    let finalCustomerName = customName || 'Pelanggan';
    let finalCustomerPhone = customPhone || '';
    let finalServiceName = 'Layanan SerenaRaga';
    let assignedTherapistId: string | null = null;
    let assignedTherapistName: string | null = null;

    // 1. Resolve booking and assigned therapist if bookingId or invoiceNumber provided
    let matchedBooking: any = null;

    if (bookingId) {
      const { data: bk } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .maybeSingle();
      matchedBooking = bk;
    }

    if (!matchedBooking && invoiceNumber) {
      const cleanCode = String(invoiceNumber).trim();
      const { data: noteMatch } = await supabase
        .from('bookings')
        .select('*')
        .ilike('notes', `%${cleanCode}%`)
        .limit(1);
      if (noteMatch && noteMatch.length > 0) {
        matchedBooking = noteMatch[0];
      }
    }

    if (matchedBooking) {
      finalCustomerName = matchedBooking.customer_name || finalCustomerName;
      finalCustomerPhone = matchedBooking.phone || finalCustomerPhone;
      finalServiceName = matchedBooking.service_name || finalServiceName;

      // Find assigned therapist from booking_items
      const { data: bkItems } = await supabase
        .from('booking_items')
        .select('therapist_id, service_name')
        .eq('booking_id', matchedBooking.id)
        .neq('service_name', 'Biaya Transport');

      if (bkItems && bkItems.length > 0) {
        const primaryItem = bkItems.find((i) => i.therapist_id) || bkItems[0];
        if (primaryItem?.therapist_id) {
          assignedTherapistId = primaryItem.therapist_id;
          const { data: tData } = await supabase
            .from('therapists')
            .select('name')
            .eq('id', primaryItem.therapist_id)
            .maybeSingle();
          if (tData?.name) assignedTherapistName = tData.name;
        }
      }

      // Append review note to booking notes for quick visibility in booking table/drawer
      const currentNotes = matchedBooking.notes || '';
      const tagText = tags.length > 0 ? ` [Tags: ${tags.join(', ')}]` : '';
      const noteText = note?.trim() ? ` [Ulasan: "${note.trim()}"]` : '';
      const reviewStamp = `\n⭐ Rating: ${rating}/5${tagText}${noteText}`;

      if (!currentNotes.includes('⭐ Rating:')) {
        await supabase
          .from('bookings')
          .update({ notes: `${currentNotes}${reviewStamp}`.trim() })
          .eq('id', matchedBooking.id);
      }
    }

    // 2. Fetch existing reviews array from settings
    const { data: existingData } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'customer_reviews')
      .maybeSingle();

    let reviewsList: CustomerReview[] = [];
    if (existingData?.value) {
      try {
        reviewsList = JSON.parse(existingData.value);
      } catch (e) {
        reviewsList = [];
      }
    }

    // 3. Try inserting into native customer_reviews table if available
    try {
      await supabase.from('customer_reviews').insert({
        booking_id: matchedBooking?.id || bookingId || null,
        invoice_number: invoiceNumber || null,
        customer_name: finalCustomerName,
        customer_phone: finalCustomerPhone,
        service_name: finalServiceName,
        therapist_id: assignedTherapistId,
        therapist_name: assignedTherapistName,
        rating: Number(rating) || 5,
        tags: Array.isArray(tags) ? tags : [],
        note: note?.trim() || null,
        is_featured: false,
      });
    } catch (tblErr) {
      // Table might not exist yet, ignore and fallback to settings
    }

    // 4. Create review item and sync to settings JSON store
    const newReview: CustomerReview = {
      id: `rev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      booking_id: matchedBooking?.id || bookingId || null,
      invoice_number: invoiceNumber || null,
      customer_name: finalCustomerName,
      customer_phone: finalCustomerPhone,
      service_name: finalServiceName,
      therapist_id: assignedTherapistId,
      therapist_name: assignedTherapistName,
      rating: Number(rating) || 5,
      tags: Array.isArray(tags) ? tags : [],
      note: note?.trim() || null,
      created_at: new Date().toISOString(),
      is_featured: false,
    };

    // Filter out previous review for the exact same booking if already submitted
    if (newReview.booking_id) {
      reviewsList = reviewsList.filter((r) => r.booking_id !== newReview.booking_id);
    }

    reviewsList.unshift(newReview);

    // Save updated reviews list to settings
    const { error: saveErr } = await supabase
      .from('settings')
      .upsert({ key: 'customer_reviews', value: JSON.stringify(reviewsList) }, { onConflict: 'key' });

    if (saveErr) {
      console.error('Error saving review to settings:', saveErr);
      return NextResponse.json({ success: false, error: saveErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, review: newReview });
  } catch (err: any) {
    console.error('POST /api/reviews error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, is_featured } = await req.json();
    if (!id) return NextResponse.json({ error: 'Review ID required' }, { status: 400 });

    const supabase = getSupabase();

    // 1. Try updating native table
    try {
      await supabase
        .from('customer_reviews')
        .update({ is_featured: !!is_featured })
        .eq('id', id);
    } catch {
      // Ignore if table not present
    }

    // 2. Update settings fallback
    const { data: existingData } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'customer_reviews')
      .maybeSingle();

    if (existingData?.value) {
      const list: CustomerReview[] = JSON.parse(existingData.value);
      const updatedList = list.map((r) => (r.id === id ? { ...r, is_featured: !!is_featured } : r));

      await supabase
        .from('settings')
        .upsert({ key: 'customer_reviews', value: JSON.stringify(updatedList) }, { onConflict: 'key' });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Review ID required' }, { status: 400 });

    const supabase = getSupabase();

    // 1. Try deleting from native table
    try {
      await supabase.from('customer_reviews').delete().eq('id', id);
    } catch {
      // Ignore if table not present
    }

    // 2. Delete from settings fallback
    const { data: existingData } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'customer_reviews')
      .maybeSingle();

    if (existingData?.value) {
      const list: CustomerReview[] = JSON.parse(existingData.value);
      const updatedList = list.filter((r) => r.id !== id);

      await supabase
        .from('settings')
        .upsert({ key: 'customer_reviews', value: JSON.stringify(updatedList) }, { onConflict: 'key' });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
