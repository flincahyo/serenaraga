import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase-admin';
import { createClient } from '@/lib/supabase';
import { PublicInvoiceView, PublicInvoiceData } from '@/components/invoice/PublicInvoiceView';

interface PageProps {
  params: Promise<{ code: string }>;
}

async function getInvoiceData(code: string): Promise<PublicInvoiceData | null> {
  const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY ? createAdminClient() : createClient();
  const cleanCode = decodeURIComponent(code).trim();

  // 1. Fetch settings for invoice footer and social first
  const { data: settingsList } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', ['invoice_footer_text', 'invoice_social_text']);

  let footerText = 'Terima kasih telah mempercayakan ketenangan raga Anda kepada kami.';
  let socialText = 'Instagram & Threads: @serena.raga / www.serenaraga.fit';

  settingsList?.forEach((s) => {
    if (s.key === 'invoice_footer_text' && s.value) footerText = s.value;
    if (s.key === 'invoice_social_text' && s.value) socialText = s.value;
  });

  // 2. Try to find in bookings table directly
  let booking: any = null;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanCode);

  if (isUuid) {
    const { data } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', cleanCode)
      .maybeSingle();
    booking = data;
  }

  // Search by notes containing the invoice number [Invoice: SR-xxxxxx-xxxx]
  if (!booking) {
    const { data: noteMatch } = await supabase
      .from('bookings')
      .select('*')
      .ilike('notes', `%${cleanCode}%`)
      .limit(1);
    if (noteMatch && noteMatch.length > 0) {
      booking = noteMatch[0];
    }
  }

  // Search by UUID suffix (e.g., SR-202609-9200 -> ends with 9200)
  const last4 = cleanCode.replace(/^SR-\d{6}-/i, '').slice(-4).toLowerCase();

  if (!booking && last4.length >= 3) {
    const { data: list } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (list && list.length > 0) {
      booking = list.find((b) => b.id.toLowerCase().endsWith(last4));
    }
  }

  // 3. Try to find in cash_transactions
  const { data: txList } = await supabase
    .from('cash_transactions')
    .select('*')
    .or(`reference_id.eq.${cleanCode},id.eq.${cleanCode}`)
    .limit(1);

  const matchedTx = txList && txList.length > 0 ? txList[0] : null;

  // If found in cash_transactions and booking is still null, try finding booking by description or date
  if (!booking && matchedTx) {
    const desc = matchedTx.description || '';
    const nameMatch = desc.split(' - ')[0]?.trim();
    if (nameMatch) {
      const { data: matchByName } = await supabase
        .from('bookings')
        .select('*')
        .ilike('customer_name', `%${nameMatch}%`)
        .order('created_at', { ascending: false })
        .limit(1);
      if (matchByName && matchByName.length > 0) {
        booking = matchByName[0];
      }
    }
  }

  // If we have a booking with full details
  if (booking) {
    const { data: itemsData } = await supabase
      .from('booking_items')
      .select('id, service_name, price, service_id')
      .eq('booking_id', booking.id);

    const { data: discountsData } = await supabase
      .from('booking_discounts')
      .select('id, discount_label, discount_amount, discount_value, discount_value_type')
      .eq('booking_id', booking.id);

    const { data: servicesList } = await supabase
      .from('services')
      .select('name, details');

    const dateObj = new Date((booking.booking_date || new Date().toISOString().split('T')[0]) + 'T00:00:00');
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const bLast4 = booking.id.substring(booking.id.length - 4).toUpperCase();
    const invoiceNumber = cleanCode.startsWith('SR-') ? cleanCode : `SR-${y}${m}-${bLast4}`;

    const normalItems: { name: string; price: number; details?: string; duration?: string }[] = [];
    let totalTransport = 0;

    if (itemsData && itemsData.length > 0) {
      itemsData.forEach((item) => {
        if (item.service_name === 'Biaya Transport') {
          totalTransport += Number(item.price || 0);
        } else {
          const matchSvc = servicesList?.find((s) => s.name === item.service_name);
          normalItems.push({
            name: item.service_name || 'Layanan Treatment',
            price: Number(item.price || 0),
            details: matchSvc?.details || '',
          });
        }
      });
    } else {
      const matchSvc = servicesList?.find((s) => s.name === booking.service_name);
      normalItems.push({
        name: booking.service_name || 'Treatment SerenaRaga',
        price: Number(booking.price || 0),
        details: matchSvc?.details || '',
      });
    }

    const appliedDiscounts =
      discountsData?.map((d) => ({
        label: d.discount_label || 'Diskon',
        amount: Number(d.discount_amount || 0),
        value: d.discount_value,
        value_type: d.discount_value_type,
      })) || [];

    const grossTotal = normalItems.reduce((s, i) => s + i.price, 0);
    const finalTotal = Number(booking.final_price || booking.price || grossTotal + totalTransport);

    return {
      invoiceNumber,
      date: booking.booking_date || new Date().toISOString().split('T')[0],
      customerName: booking.customer_name || 'Pelanggan',
      customerPhone: booking.phone || '',
      items: normalItems,
      totalTransportFee: totalTransport,
      transportLabel: 'Biaya Transport Operasional',
      appliedDiscounts,
      grossTotal,
      finalTotal,
      invoiceFooter: footerText,
      invoiceSocial: socialText,
      bookingId: booking.id,
    };
  }

  // If found in cash_transactions but not directly in bookings
  if (matchedTx) {
    const desc = matchedTx.description || '';
    const nameMatch = desc.split(' - ')[0] || 'Pelanggan';
    const amount = Number(matchedTx.amount || 0);
    const txDate = matchedTx.transaction_date ? matchedTx.transaction_date.split('T')[0] : new Date().toISOString().split('T')[0];

    return {
      invoiceNumber: matchedTx.reference_id || cleanCode,
      date: txDate,
      customerName: nameMatch,
      items: [
        {
          name: 'Layanan Treatment SerenaRaga',
          price: amount,
          details: 'Home Spa & Massage Personal Care',
        },
      ],
      totalTransportFee: 0,
      appliedDiscounts: [],
      grossTotal: amount,
      finalTotal: amount,
      invoiceFooter: footerText,
      invoiceSocial: socialText,
    };
  }

  return null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { code } = await params;
  const data = await getInvoiceData(code);

  if (!data) {
    return {
      title: 'Invoice Tidak Ditemukan | SerenaRaga',
    };
  }

  const title = `Invoice #${data.invoiceNumber} - ${data.customerName} | SerenaRaga`;
  const description = `Total: Rp ${data.finalTotal.toLocaleString(
    'id-ID'
  )} • Status: LUNAS • Terima kasih telah mempercayakan ketenangan raga Anda kepada SerenaRaga.`;

  const siteUrl = 'https://serenaraga.fit';
  const ogImageUrl = `${siteUrl}/api/og/invoice?code=${encodeURIComponent(
    data.invoiceNumber
  )}&customer=${encodeURIComponent(data.customerName)}&total=${
    data.finalTotal
  }&service=${encodeURIComponent(data.items[0]?.name || 'Treatment')}&date=${encodeURIComponent(
    data.date
  )}`;

  return {
    metadataBase: new URL(siteUrl),
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${siteUrl}/invoice/${encodeURIComponent(data.invoiceNumber)}`,
      siteName: 'SerenaRaga Home Spa & Massage',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          type: 'image/png',
          alt: `Invoice #${data.invoiceNumber} - ${data.customerName}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function InvoicePage({ params }: PageProps) {
  const { code } = await params;
  const invoiceData = await getInvoiceData(code);

  if (!invoiceData) {
    notFound();
  }

  return <PublicInvoiceView data={invoiceData} />;
}
