'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { TrendingUp, ShoppingBag, Star, Clock, ArrowUpRight, Loader2, Wallet, ChevronLeft, ChevronRight, CalendarDays, X } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import { createClient } from '@/lib/supabase';

type Booking = {
  id: string; customer_name: string; service_name: string;
  booking_date: string; booking_time: string; price: number;
  final_price?: number; discount_total?: number;
  status: string; phone?: string; notes?: string; bhp_cost?: number;
};

const statusColor: Record<string, string> = {
  Confirmed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  Pending:   'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  Completed: 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
  Canceled:  'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400',
};
const statusDot: Record<string, string> = {
  Confirmed: 'bg-emerald-500',
  Pending:   'bg-amber-400',
  Completed: 'bg-blue-500',
  Canceled:  'bg-red-400',
};

const DAYS_ID    = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const DAYS_FULL  = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const MONTHS_ID  = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const formatRp   = (n: number) => n >= 1000000
  ? `Rp ${(n / 1000000).toFixed(1).replace('.', ',')}JT`
  : `Rp ${n.toLocaleString('id-ID')}`;
const formatRpFull = (n: number) => `Rp ${Number(n).toLocaleString('id-ID')}`;

// Helper: tanggal dalam format YYYY-MM-DD sesuai WIB (UTC+7), bukan UTC
const toWIBDateStr = (date: Date): string =>
  date.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });

// Helper: ambil tahun & bulan lokal WIB dari Date object
const getWIBParts = (date: Date) => {
  const wib = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
  return { y: wib.getFullYear(), m: wib.getMonth(), day: wib.getDate() };
};

export default function DashboardPage() {
  const [loading, setLoading]             = useState(true);
  const [bookings, setBookings]           = useState<Booking[]>([]);
  const [weeklyData, setWeeklyData]       = useState<{ day: string; bookings: number }[]>([]);
  const [commissionPct, setCommissionPct] = useState(30);
  const [bhpPct, setBhpPct]               = useState(10);

  // Calendar state — gunakan WIB untuk inisialisasi
  const [calMonth, setCalMonth] = useState(() => {
    const { y, m } = getWIBParts(new Date());
    return { y, m };
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [detailBooking, setDetailBooking] = useState<Booking | null>(null);

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setLoading(true);
    const now = new Date();
    const [{ data: allBookings }, { data: settingsRows }] = await Promise.all([
      supabase.from('bookings').select('*').order('booking_date', { ascending: false }),
      supabase.from('settings').select('key, value').in('key', ['terapis_commission_pct', 'bhp_pct']),
    ]);
    if (allBookings) {
      setBookings(allBookings);
      const last7: { day: string; bookings: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        // Gunakan offset milidetik agar hari ke-i dihitung dalam WIB
        const d = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
        const dateStr = toWIBDateStr(d);
        const count   = allBookings.filter(b => b.booking_date === dateStr).length;
        // getDay() dari representasi WIB
        const dayIdx  = new Date(d.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' })).getDay();
        last7.push({ day: DAYS_ID[dayIdx], bookings: count });
      }
      setWeeklyData(last7);
    }
    if (settingsRows) {
      settingsRows.forEach(({ key, value }) => {
        if (key === 'terapis_commission_pct') setCommissionPct(Number(value) || 30);
        if (key === 'bhp_pct')               setBhpPct(Number(value) || 10);
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const now             = new Date();
  // Semua perbandingan tanggal menggunakan WIB (UTC+7)
  const todayStr        = toWIBDateStr(now);
  const { y: wibY, m: wibM } = getWIBParts(now);
  const startOfMonth    = `${wibY}-${String(wibM + 1).padStart(2, '0')}-01`;

  const monthBookings  = bookings.filter(b => b.booking_date >= startOfMonth);
  const completedMonth = monthBookings.filter(b => b.status === 'Completed');
  const grossRevenue   = completedMonth.reduce((s, b) => s + (b.final_price ?? b.price ?? 0), 0);
  const totalDiscount  = completedMonth.reduce((s, b) => s + (b.discount_total ?? 0), 0);
  const terapisCut     = Math.round(grossRevenue * commissionPct / 100);

  // BHP: gunakan bhp_cost aktual dari per-booking
  const bhpActual  = completedMonth.reduce((s, b) => s + (b.bhp_cost ?? 0), 0);
  const bhpCut     = bhpActual;
  const netRevenue = grossRevenue - terapisCut - bhpCut;
  const ownerPct   = Math.max(0, 100 - commissionPct);

  const todayBookings  = bookings.filter(b => b.booking_date === todayStr);

  // Bulan lalu dalam WIB
  const prevWibM        = wibM === 0 ? 11 : wibM - 1;
  const prevWibY        = wibM === 0 ? wibY - 1 : wibY;
  const prevMonthStart  = `${prevWibY}-${String(prevWibM + 1).padStart(2, '0')}-01`;
  const prevMonthLastDay = new Date(wibY, wibM, 0).getDate();
  const prevMonthEnd    = `${prevWibY}-${String(prevWibM + 1).padStart(2, '0')}-${String(prevMonthLastDay).padStart(2, '0')}`;
  const prevMonthBkg    = bookings.filter(b => b.booking_date >= prevMonthStart && b.booking_date <= prevMonthEnd);
  const bookingChange   = prevMonthBkg.length > 0
    ? Math.round(((monthBookings.length - prevMonthBkg.length) / prevMonthBkg.length) * 100) : 0;

  // Tampilkan tanggal hari ini dalam WIB
  const today = now.toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    timeZone: 'Asia/Jakarta',
  });

  // ── Calendar helpers ──
  const calFirstDay = new Date(calMonth.y, calMonth.m, 1).getDay();
  const calDaysInMonth = new Date(calMonth.y, calMonth.m + 1, 0).getDate();

  const bookingsByDate = bookings.reduce<Record<string, Booking[]>>((acc, b) => {
    if (!acc[b.booking_date]) acc[b.booking_date] = [];
    acc[b.booking_date].push(b);
    return acc;
  }, {});

  const selectedDateStr = selectedDate;
  const selectedBookings = selectedDateStr ? (bookingsByDate[selectedDateStr] ?? []) : [];

  const prevCal = () => {
    setCalMonth(p => {
      const pm = p.m === 0 ? 11 : p.m - 1;
      const py = p.m === 0 ? p.y - 1 : p.y;
      return { y: py, m: pm };
    });
    setSelectedDate(null);
  };
  const nextCal = () => {
    setCalMonth(p => {
      const nm = p.m === 11 ? 0 : p.m + 1;
      const ny = p.m === 11 ? p.y + 1 : p.y;
      return { y: ny, m: nm };
    });
    setSelectedDate(null);
  };

  const stats = [
    { label: 'Booking Bulan Ini', value: String(monthBookings.length), icon: ShoppingBag,
      change: bookingChange >= 0 ? `+${bookingChange}%` : `${bookingChange}%`, up: bookingChange >= 0 },
    { label: 'Pendapatan Kotor',  value: formatRp(grossRevenue),  icon: TrendingUp,
      change: '', up: true, sub: 'Transaksi selesai bulan ini' },
    { label: 'Penghasilan Bersih', value: formatRp(netRevenue),   icon: Wallet,
      change: `Owner ${ownerPct}%`, up: true, sub: `Setelah terapis & BHP` },
    { label: 'Jadwal Hari Ini',   value: String(todayBookings.length), icon: Star,
      change: todayBookings.length > 0 ? `${todayBookings.filter(b => b.status === 'Confirmed' || b.status === 'Pending').length} aktif` : '', up: true },
  ];

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">Dashboard</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">{today}</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-earth-primary" size={28} /></div>
      ) : (
        <>
          {/* ── Stat Cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map(({ label, value, icon: Icon, change, up, sub }) => (
              <div key={label} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 rounded-lg bg-earth-primary/10 flex items-center justify-center">
                    <Icon size={16} className="text-earth-primary" />
                  </div>
                  {change && (
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${up ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400' : 'text-red-500 bg-red-50'}`}>
                      {change}
                    </span>
                  )}
                </div>
                <p className="text-2xl font-bold text-zinc-900 dark:text-white tabular-nums leading-tight">{value}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{label}</p>
                {sub && <p className="text-[10px] text-zinc-400 mt-0.5">{sub}</p>}
              </div>
            ))}
          </div>

          {/* ── Rincian Bagi Hasil 4-kolom ── */}
          {grossRevenue > 0 && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-zinc-100 dark:border-zinc-800">
                <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">
                  Rincian Bagi Hasil Bulan Ini
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-zinc-100 dark:divide-zinc-800">
                {/* Gross */}
                <div className="px-5 py-4">
                  <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-wide mb-1">Pendapatan Kotor</p>
                  <p className="text-lg font-bold text-zinc-900 dark:text-white tabular-nums">{formatRp(grossRevenue)}</p>
                  <p className="text-[10px] text-zinc-400 mt-1">100%</p>
                </div>
                {/* Terapis */}
                <div className="px-5 py-4">
                  <p className="text-[10px] font-medium text-amber-500 uppercase tracking-wide mb-1">Bagian Terapis</p>
                  <p className="text-lg font-bold text-amber-600 dark:text-amber-400 tabular-nums">{formatRp(terapisCut)}</p>
                  <p className="text-[10px] text-amber-400 mt-1">{commissionPct}%</p>
                </div>
                {/* BHP */}
                <div className="px-5 py-4">
                  <p className="text-[10px] font-medium text-blue-500 uppercase tracking-wide mb-1">Modal BHP</p>
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400 tabular-nums">{formatRp(bhpCut)}</p>
                  <p className="text-[10px] text-blue-400 mt-1">dari data per booking</p>
                </div>
                {/* Net */}
                <div className="px-5 py-4 bg-emerald-50/50 dark:bg-emerald-950/20">
                  <p className="text-[10px] font-medium text-emerald-600 uppercase tracking-wide mb-1">Penghasilan Bersih</p>
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{formatRp(netRevenue)}</p>
                  <p className="text-[10px] text-emerald-500 mt-1">{ownerPct}%</p>
                </div>
              </div>
              {/* Progress bar: terapis + bhp (% dari gross) + sisa */}
              <div className="h-1.5 flex">
                <div className="bg-amber-400 transition-all" style={{ width: `${commissionPct}%` }} />
                {bhpCut > 0 && grossRevenue > 0 && (
                  <div className="bg-blue-400 transition-all" style={{ width: `${Math.min(100 - commissionPct, Math.round(bhpCut / grossRevenue * 100))}%` }} />
                )}
                <div className="bg-emerald-500 transition-all flex-1" />
              </div>
            </div>
          )}

          {/* ── Chart + Today Schedule ── */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            {/* Weekly Booking Chart */}
            <div className="lg:col-span-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Booking Mingguan</h2>
                  <p className="text-xs text-zinc-400 mt-0.5">7 hari terakhir</p>
                </div>
                <a href="/admin/bookings" className="flex items-center gap-1 text-xs text-earth-primary font-medium hover:underline">
                  Lihat semua <ArrowUpRight size={12} />
                </a>
              </div>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#8B5E3C" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#8B5E3C" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F4F4F5" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#A1A1AA' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#A1A1AA' }} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', fontSize: 12 }} cursor={{ stroke: '#8B5E3C', strokeWidth: 1, strokeDasharray: '4 4' }} />
                    <Area type="monotone" dataKey="bookings" stroke="#8B5E3C" strokeWidth={2} fill="url(#grad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Today Schedule */}
            <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-5">
                <Clock size={15} className="text-earth-primary" />
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Jadwal Hari Ini</h2>
              </div>
              {todayBookings.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-center">
                  <p className="text-sm text-zinc-400">Tidak ada jadwal hari ini</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {todayBookings
                    .sort((a, b) => (a.booking_time ?? '').localeCompare(b.booking_time ?? ''))
                    .slice(0, 5).map(b => (
                    <div key={b.id} className="flex items-center gap-3">
                      <span className="text-xs font-mono text-zinc-400 w-10 shrink-0">
                        {b.booking_time ? b.booking_time.slice(0, 5) : '--:--'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{b.customer_name}</p>
                        <p className="text-xs text-zinc-400 truncate">{b.service_name}</p>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${statusColor[b.status] ?? ''}`}>
                        {b.status}
                      </span>
                    </div>
                  ))}
                  {todayBookings.length > 5 && (
                    <p className="text-[11px] text-zinc-400 text-center pt-1">+{todayBookings.length - 5} lainnya</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Calendar View ── */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
            {/* Calendar Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <CalendarDays size={16} className="text-earth-primary" />
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
                  Kalender Booking — {MONTHS_ID[calMonth.m]} {calMonth.y}
                </h2>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={prevCal} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500">
                  <ChevronLeft size={15} />
                </button>
                <button
                  onClick={() => { const { y, m } = getWIBParts(new Date()); setCalMonth({ y, m }); setSelectedDate(null); }}
                  className="px-2 py-1 text-[11px] font-medium rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                >
                  Hari Ini
                </button>
                <button onClick={nextCal} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500">
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-zinc-100 dark:divide-zinc-800">
              {/* Calendar Grid */}
              <div className="md:col-span-2 p-4">
                {/* Day headers */}
                <div className="grid grid-cols-7 mb-2">
                  {DAYS_FULL.map(d => (
                    <div key={d} className="text-center text-[10px] font-semibold text-zinc-400 uppercase py-1">{d}</div>
                  ))}
                </div>
                {/* Day cells */}
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: calFirstDay }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  {Array.from({ length: calDaysInMonth }, (_, i) => i + 1).map(day => {
                    const dateStr = `${calMonth.y}-${String(calMonth.m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const dayBookings = bookingsByDate[dateStr] ?? [];
                    const isToday    = dateStr === todayStr;
                    const isSelected = dateStr === selectedDate;
                    const hasBooking = dayBookings.length > 0;
                    // Dominant status for dot color
                    const domStatus  = dayBookings.find(b => b.status === 'Confirmed')?.status
                      ?? dayBookings.find(b => b.status === 'Pending')?.status
                      ?? dayBookings[0]?.status;

                    return (
                      <button
                        key={day}
                        onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                        className={`relative aspect-square flex flex-col items-center justify-start pt-1 rounded-lg text-xs font-medium transition-all
                          ${isSelected ? 'bg-earth-primary text-white' : isToday ? 'bg-earth-primary/10 text-earth-primary font-bold' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'}
                        `}
                      >
                        <span>{day}</span>
                        {hasBooking && (
                          <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                            {dayBookings.slice(0, 3).map((b, idx) => (
                              <span
                                key={idx}
                                className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white/80' : (statusDot[b.status] ?? 'bg-zinc-400')}`}
                              />
                            ))}
                          </div>
                        )}
                        {dayBookings.length > 3 && !isSelected && (
                          <span className="text-[8px] text-zinc-400">+{dayBookings.length - 3}</span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex items-center gap-4 mt-4 px-1">
                  {[['Confirmed', 'bg-emerald-500'], ['Pending', 'bg-amber-400'], ['Completed', 'bg-blue-500'], ['Canceled', 'bg-red-400']].map(([label, color]) => (
                    <div key={label} className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${color}`} />
                      <span className="text-[10px] text-zinc-400">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Selected Day Detail Panel */}
              <div className="p-4">
                {!selectedDate ? (
                  <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center gap-2">
                    <CalendarDays size={28} className="text-zinc-300 dark:text-zinc-600" />
                    <p className="text-sm text-zinc-400">Pilih tanggal untuk melihat detail booking</p>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-xs text-zinc-400">
                          {new Date(selectedDate + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </p>
                        <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                          {selectedBookings.length} booking
                        </p>
                      </div>
                      <button onClick={() => setSelectedDate(null)} className="p-1 rounded text-zinc-400 hover:text-zinc-600">
                        <X size={14} />
                      </button>
                    </div>

                    {selectedBookings.length === 0 ? (
                      <p className="text-sm text-zinc-400 text-center py-8">Tidak ada booking</p>
                    ) : (
                      <div className="space-y-3">
                        {selectedBookings
                          .sort((a, b) => (a.booking_time ?? '').localeCompare(b.booking_time ?? ''))
                          .map(b => (
                            <div
                              key={b.id}
                              className="rounded-xl border border-zinc-100 dark:border-zinc-800 p-3 cursor-pointer hover:border-earth-primary/30 transition-colors"
                              onClick={() => setDetailBooking(detailBooking?.id === b.id ? null : b)}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-mono text-zinc-400">{b.booking_time ? b.booking_time.slice(0, 5) : '--:--'}</span>
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColor[b.status] ?? ''}`}>
                                  {b.status}
                                </span>
                              </div>
                              <p className="text-sm font-semibold text-zinc-900 dark:text-white">{b.customer_name}</p>
                              <p className="text-xs text-zinc-500 mt-0.5">{b.service_name}</p>
                              <p className="text-xs font-mono text-earth-primary mt-1">
                                Rp {(b.price ?? 0).toLocaleString('id-ID')}
                              </p>

                              {/* Expanded detail */}
                              {detailBooking?.id === b.id && (
                                <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-1.5 text-xs text-zinc-500">
                                  {b.phone && (
                                    <div className="flex justify-between">
                                      <span className="text-zinc-400">WhatsApp</span>
                                      <a href={`https://wa.me/${b.phone}`} target="_blank" rel="noreferrer" className="font-mono text-emerald-600 hover:underline">{b.phone}</a>
                                    </div>
                                  )}
                                  {b.notes && (
                                    <div>
                                      <span className="text-zinc-400">Catatan:</span>
                                      <p className="text-zinc-600 dark:text-zinc-400 mt-0.5 italic">{b.notes}</p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
