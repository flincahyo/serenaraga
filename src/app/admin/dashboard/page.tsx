'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  CalendarCheck, Clock, ShoppingBag, TrendingUp, Wallet,
  ArrowUpRight, Loader2, CalendarDays, ChevronLeft, ChevronRight, X, Star, Info,
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useUser } from '@/lib/user-context';
import Link from 'next/link';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AdminSkeleton } from '@/components/admin/AdminSkeleton';
import { TherapistTracker } from '@/components/admin/TherapistTracker';

type Booking = {
  id: string; customer_name: string; service_name: string;
  booking_date: string; booking_time: string; price: number;
  final_price?: number; discount_total?: number; shared_discount_total?: number;
  status: string; phone?: string; notes?: string; bhp_cost?: number;
};

const statusColor: Record<string, string> = {
  Confirmed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  Pending:   'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  Completed: 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
  Canceled:  'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400',
};
const statusDot: Record<string, string> = {
  Confirmed: 'bg-emerald-500', Pending: 'bg-amber-400',
  Completed: 'bg-blue-500',   Canceled: 'bg-red-400',
};

const DAYS_ID   = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];
const MONTHS_ID = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const formatRp  = (n: number) => n >= 1000000 ? `Rp ${(n/1000000).toFixed(1).replace('.',',')}JT` : `Rp ${n.toLocaleString('id-ID')}`;
const toWIBDateStr = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
const getWIBParts  = (d: Date) => { const w = new Date(d.toLocaleString('en-US',{timeZone:'Asia/Jakarta'})); return { y:w.getFullYear(),m:w.getMonth(),day:w.getDate() }; };

export default function DashboardPage() {
  const { user } = useUser();
  const isOwner = user?.role !== 'cashier';

  const [loading, setLoading]         = useState(true);
  const [bookings, setBookings]       = useState<Booking[]>([]);
  const [weeklyData, setWeeklyData]   = useState<{ day:string; bookings:number }[]>([]);
  const [commissionPct, setCommissionPct] = useState(30);

  const [calMonth, setCalMonth] = useState(() => { const {y,m} = getWIBParts(new Date()); return {y,m}; });
  const [selectedDate, setSelectedDate]   = useState<string | null>(null);
  const [detailBooking, setDetailBooking] = useState<Booking | null>(null);
  const [summaryPeriod, setSummaryPeriod] = useState<'today' | 'month'>('today');

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setLoading(true);
    const now = new Date();
    const [{ data: allBookings }, { data: settingsRows }] = await Promise.all([
      supabase.from('bookings').select('*, booking_items(service_name, price, commission_earned)').order('booking_date', { ascending: false }),
      supabase.from('settings').select('key, value').in('key', ['terapis_commission_pct']),
    ]);
    if (allBookings) {
      setBookings(allBookings);
      const last7: { day:string; bookings:number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - (6-i)*24*60*60*1000);
        const dateStr = toWIBDateStr(d);
        const count = allBookings.filter(b => b.booking_date === dateStr).length;
        const dayIdx = new Date(d.toLocaleString('en-US',{timeZone:'Asia/Jakarta'})).getDay();
        last7.push({ day: DAYS_ID[dayIdx], bookings: count });
      }
      setWeeklyData(last7);
    }
    if (settingsRows) {
      settingsRows.forEach(({ key, value }) => {
        if (key === 'terapis_commission_pct') setCommissionPct(Number(value) || 30);
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const now          = new Date();
  const todayStr     = toWIBDateStr(now);
  const { y:wibY, m:wibM } = getWIBParts(now);
  const startOfMonth = `${wibY}-${String(wibM+1).padStart(2,'0')}-01`;

  const monthBookings  = bookings.filter(b => b.booking_date >= startOfMonth);
  const completedMonth = monthBookings.filter(b => b.status === 'Completed');
  const calcTerapisCut = (b: any, fallbackPct: number) => {
    if (b.booking_items && b.booking_items.length > 0) {
      return b.booking_items.reduce((ss: number, i: any) => ss + (Number(i.commission_earned) || 0), 0);
    }
    const terapisBase = Math.max(0, (b.price ?? 0) - (b.shared_discount_total ?? 0));
    return Math.round(terapisBase * fallbackPct / 100);
  };

  // Retain for cashier fallback view
  const grossRevenue   = completedMonth.reduce((s,b) => s+(b.final_price ?? b.price ?? 0), 0);
  const terapisCut     = completedMonth.reduce((s,b) => s + calcTerapisCut(b, commissionPct), 0);
  const bhpActual      = completedMonth.reduce((s,b) => s+(b.bhp_cost ?? 0), 0);
  const netRevenue     = grossRevenue - terapisCut - bhpActual;
  const ownerPct       = Math.max(0, 100 - commissionPct);

  const todayBookings = bookings.filter(b => b.booking_date === todayStr);
  const todayActive   = todayBookings.filter(b => b.status === 'Confirmed' || b.status === 'Pending');

  const prevWibM     = wibM === 0 ? 11 : wibM - 1;
  const prevWibY     = wibM === 0 ? wibY - 1 : wibY;
  const prevMonthStart = `${prevWibY}-${String(prevWibM+1).padStart(2,'0')}-01`;
  const prevMonthEnd   = `${prevWibY}-${String(prevWibM+1).padStart(2,'0')}-${String(new Date(wibY,wibM,0).getDate()).padStart(2,'0')}`;
  const prevMonthBkg   = bookings.filter(b => b.booking_date >= prevMonthStart && b.booking_date <= prevMonthEnd);
  const bookingChange  = prevMonthBkg.length > 0 ? Math.round(((monthBookings.length - prevMonthBkg.length) / prevMonthBkg.length) * 100) : 0;

  const today = now.toLocaleDateString('id-ID', { weekday:'long', day:'numeric', month:'long', year:'numeric', timeZone:'Asia/Jakarta' });

  const calFirstDay    = new Date(calMonth.y, calMonth.m, 1).getDay();
  const calDaysInMonth = new Date(calMonth.y, calMonth.m+1, 0).getDate();
  const bookingsByDate = bookings.reduce<Record<string,Booking[]>>((acc,b) => {
    if (!acc[b.booking_date]) acc[b.booking_date] = [];
    acc[b.booking_date].push(b);
    return acc;
  }, {});
  const selectedBookings = selectedDate ? (bookingsByDate[selectedDate] ?? []) : [];

  // ── Kasir-only simplified view ──
  if (!isOwner) {
    return (
      <div className="space-y-5 max-w-4xl mx-auto">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">
            Selamat datang, {user?.displayName} 👋
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">{today}</p>
        </div>

        {/* Quick stats untuk kasir */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
            <div className="w-8 h-8 rounded-lg bg-earth-primary/10 flex items-center justify-center mb-3">
              <CalendarCheck size={16} className="text-earth-primary" />
            </div>
            <p className="text-2xl font-bold text-zinc-900 dark:text-white">{todayBookings.length}</p>
            <p className="text-xs text-zinc-500 mt-0.5">Jadwal Hari Ini</p>
            <p className="text-[10px] text-zinc-400">{todayActive.length} aktif</p>
          </div>
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center mb-3">
              <ShoppingBag size={16} className="text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-zinc-900 dark:text-white">{monthBookings.length}</p>
            <p className="text-xs text-zinc-500 mt-0.5">Booking Bulan Ini</p>
            <p className="text-[10px] text-zinc-400">{completedMonth.length} selesai</p>
          </div>
        </div>

        {/* Shortcut Kasir */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link href="/admin/invoices" className="group bg-earth-primary hover:bg-earth-dark text-white rounded-xl p-5 flex items-center gap-4 transition-colors">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
            <div>
              <p className="font-semibold">Buat Invoice</p>
              <p className="text-xs text-white/70">Checkout & kirim ke WA</p>
            </div>
            <ArrowUpRight size={18} className="ml-auto opacity-60 group-hover:opacity-100" />
          </Link>
          <Link href="/admin/bookings" className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-earth-primary/40 rounded-xl p-5 flex items-center gap-4 transition-colors">
            <div className="w-10 h-10 bg-earth-primary/10 rounded-lg flex items-center justify-center">
              <CalendarDays size={20} className="text-earth-primary" />
            </div>
            <div>
              <p className="font-semibold text-zinc-900 dark:text-white">Kelola Booking</p>
              <p className="text-xs text-zinc-500">Tambah & update jadwal</p>
            </div>
            <ArrowUpRight size={18} className="ml-auto text-zinc-300 group-hover:text-earth-primary" />
          </Link>
        </div>

        {/* Jadwal Hari Ini sederhana */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={15} className="text-earth-primary" />
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Jadwal Hari Ini</h2>
          </div>
          {todayBookings.length === 0 ? (
            <p className="text-sm text-zinc-400 text-center py-8">Tidak ada jadwal hari ini</p>
          ) : (
            <div className="space-y-3">
              {todayBookings.sort((a,b) => (a.booking_time??'').localeCompare(b.booking_time??'')).map(b => (
                <div key={b.id} className="flex items-center gap-3 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                  <span className="text-xs font-mono text-zinc-400 w-10 shrink-0">{b.booking_time?.slice(0,5) ?? '--:--'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{b.customer_name}</p>
                    <p className="text-xs text-zinc-400 truncate">{b.service_name}</p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${statusColor[b.status]??''}`}>{b.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Full Owner Dashboard ──
  // ── Full Owner Dashboard ──
  const activeBookings = summaryPeriod === 'today' ? todayBookings : monthBookings;
  const filteredCompleted = activeBookings.filter(b => b.status === 'Completed');
  const filteredPending = activeBookings.filter(b => b.status === 'Confirmed' || b.status === 'Pending');

  const calcGross = filteredCompleted.reduce((s,b) => s+(b.final_price ?? b.price ?? 0), 0);
  const calcTerapisCutTotal = filteredCompleted.reduce((s,b) => s + calcTerapisCut(b, commissionPct), 0);
  const calcBhp = filteredCompleted.reduce((s,b) => s+(b.bhp_cost ?? 0), 0);
  const calcNet = calcGross - calcTerapisCutTotal - calcBhp;
  const calcProjected = filteredPending.reduce((s,b) => s+(b.final_price ?? b.price ?? 0), 0);

  const stats = summaryPeriod === 'today' ? [
    { label: 'Selesai Hari Ini', value: String(filteredCompleted.length), icon: ShoppingBag, change: `${filteredPending.length} menunggu`, up: true },
    { label: 'Masuk (Completed)', value: formatRp(calcGross), icon: Wallet, change: '', up: true, sub: 'Pendapatan 100% Selesai' },
    { label: 'Proyeksi (Aktif)', value: formatRp(calcProjected), icon: Clock, change: '', up: true, sub: 'Potensi dari jadwal sisa' },
    { label: 'Estimasi Bersih (Net)', value: formatRp(calcNet), icon: TrendingUp, change: `Owner ${ownerPct}%`, up: true, sub: 'Setelah potong komisi & BHP' },
  ] : [
    { label: 'Booking Bulan Ini', value: String(monthBookings.length), icon: ShoppingBag, change: bookingChange >= 0 ? `+${bookingChange}%` : `${bookingChange}%`, up: bookingChange >= 0 },
    { label: 'Pendapatan Kotor', value: formatRp(calcGross), icon: TrendingUp, change: '', up: true, sub: 'Transaksi selesai bulan ini' },
    { label: 'Penghasilan Bersih', value: formatRp(calcNet), icon: Wallet, change: `Owner ${ownerPct}%`, up: true, sub: 'Setelah terapis & BHP' },
    { label: 'Jadwal Hari Ini', value: String(todayBookings.length), icon: Star, change: todayBookings.length > 0 ? `${todayActive.length} aktif` : '', up: true },
  ];

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">{today}</p>
        </div>
        <div className="flex bg-white dark:bg-zinc-900 p-1 rounded-lg border border-zinc-200 dark:border-zinc-800 self-start sm:self-auto shadow-sm">
          <button
            onClick={() => setSummaryPeriod('today')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${summaryPeriod === 'today' ? 'bg-earth-primary text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}
          >Hari Ini</button>
          <button
            onClick={() => setSummaryPeriod('month')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${summaryPeriod === 'month' ? 'bg-earth-primary text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}
          >Bulan Ini</button>
        </div>
      </div>

      {loading ? (
        <AdminSkeleton rows={6} />
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map(({ label, value, icon:Icon, change, up, sub }) => (
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

          {/* Rincian Bagi Hasil */}
          {calcGross > 0 && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-zinc-100 dark:border-zinc-800">
                <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">Rincian Bagi Hasil {summaryPeriod === 'today' ? 'Hari Ini' : 'Bulan Ini'}</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-zinc-100 dark:divide-zinc-800">
                <div className="px-5 py-4">
                  <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-wide mb-1">Pendapatan Kotor</p>
                  <p className="text-lg font-bold text-zinc-900 dark:text-white tabular-nums">{formatRp(calcGross)}</p>
                  <p className="text-[10px] text-zinc-400 mt-1">100% (Completed)</p>
                </div>
                <div className="px-5 py-4">
                  <p className="text-[10px] font-medium text-amber-500 uppercase tracking-wide mb-1">Bagian Terapis</p>
                  <p className="text-lg font-bold text-amber-600 dark:text-amber-400 tabular-nums">{formatRp(calcTerapisCutTotal)}</p>
                  <p className="text-[10px] text-amber-400 mt-1">{commissionPct}% statis/dinamis</p>
                </div>
                <div className="px-5 py-4">
                  <p className="text-[10px] font-medium text-blue-500 uppercase tracking-wide mb-1">Modal BHP</p>
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400 tabular-nums">{formatRp(calcBhp)}</p>
                  <p className="text-[10px] text-blue-400 mt-1">Data riil per layanan</p>
                </div>
                <div className="px-5 py-4 bg-emerald-50/50 dark:bg-emerald-950/20">
                  <p className="text-[10px] font-medium text-emerald-600 uppercase tracking-wide mb-1">Penghasilan Bersih</p>
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{formatRp(calcNet)}</p>
                  <p className="text-[10px] text-emerald-500 mt-1">{ownerPct}%</p>
                </div>
              </div>
              <div className="h-1.5 flex">
                <div className="bg-amber-400" style={{ width:`${commissionPct}%` }} />
                {calcBhp > 0 && calcGross > 0 && (
                  <div className="bg-blue-400" style={{ width:`${Math.min(100-commissionPct, calcGross > 0 ? Math.round(calcBhp/calcGross*100) : 0)}%` }} />
                )}
                <div className="bg-emerald-400 flex-1" />
              </div>
            </div>
          )}

          {/* Tracker Operasional */}
          <div className="mb-6">
            <TherapistTracker date={todayStr} />
          </div>

          {/* Chart + Today */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            <div className="lg:col-span-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Booking Mingguan</h2>
                  <p className="text-xs text-zinc-400 mt-0.5">7 hari terakhir</p>
                </div>
                <Link href="/admin/bookings" className="flex items-center gap-1 text-xs text-earth-primary font-medium hover:underline">
                  Lihat semua <ArrowUpRight size={12} />
                </Link>
              </div>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyData} margin={{ top:5, right:5, left:-25, bottom:0 }}>
                    <defs>
                      <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#8B5E3C" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#8B5E3C" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F4F4F5" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize:11, fill:'#A1A1AA' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize:11, fill:'#A1A1AA' }} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius:8, border:'none', boxShadow:'0 4px 6px -1px rgba(0,0,0,0.1)', fontSize:12 }} />
                    <Area type="monotone" dataKey="bookings" stroke="#8B5E3C" strokeWidth={2} fill="url(#grad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

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
                  {todayBookings.sort((a,b) => (a.booking_time??'').localeCompare(b.booking_time??'')).slice(0,5).map(b => (
                    <div key={b.id} className="flex items-center gap-3">
                      <span className="text-xs font-mono text-zinc-400 w-10 shrink-0">{b.booking_time?.slice(0,5) ?? '--:--'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{b.customer_name}</p>
                        <p className="text-xs text-zinc-400 truncate">{b.service_name}</p>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${statusColor[b.status]??''}`}>{b.status}</span>
                    </div>
                  ))}
                  {todayBookings.length > 5 && <p className="text-[11px] text-zinc-400 text-center pt-1">+{todayBookings.length - 5} lainnya</p>}
                </div>
              )}
            </div>
          </div>

          {/* Calendar */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <CalendarDays size={16} className="text-earth-primary" />
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
                  Kalender Booking — {MONTHS_ID[calMonth.m]} {calMonth.y}
                </h2>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => { setCalMonth(p => { const pm = p.m===0?11:p.m-1; const py = p.m===0?p.y-1:p.y; return {y:py,m:pm}; }); setSelectedDate(null); }} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500">
                  <ChevronLeft size={15} />
                </button>
                <button onClick={() => { const {y,m} = getWIBParts(new Date()); setCalMonth({y,m}); setSelectedDate(null); }} className="px-2 py-1 text-[11px] font-medium rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                  Hari Ini
                </button>
                <button onClick={() => { setCalMonth(p => { const nm = p.m===11?0:p.m+1; const ny = p.m===11?p.y+1:p.y; return {y:ny,m:nm}; }); setSelectedDate(null); }} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500">
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-zinc-100 dark:divide-zinc-800">
              <div className="md:col-span-2 p-4">
                <div className="grid grid-cols-7 mb-2">
                  {DAYS_ID.map(d => <div key={d} className="text-center text-[10px] font-semibold text-zinc-400 uppercase py-1">{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({length:calFirstDay}).map((_,i) => <div key={`e-${i}`} />)}
                  {Array.from({length:calDaysInMonth},(_,i)=>i+1).map(day => {
                    const dateStr = `${calMonth.y}-${String(calMonth.m+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                    const dayBkg  = bookingsByDate[dateStr] ?? [];
                    const isToday = dateStr === todayStr;
                    const isSel   = dateStr === selectedDate;
                    const domStatus = dayBkg.find(b => b.status==='Confirmed')?.status ?? dayBkg.find(b => b.status==='Pending')?.status ?? dayBkg[0]?.status;
                    return (
                      <button key={day} onClick={() => setSelectedDate(isSel ? null : dateStr)}
                        className={`relative aspect-square flex flex-col items-center justify-start pt-1 rounded-lg text-xs font-medium transition-all
                          ${isSel ? 'bg-earth-primary text-white' : isToday ? 'bg-earth-primary/10 text-earth-primary font-bold' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'}`}>
                        <span>{day}</span>
                        {dayBkg.length > 0 && (
                          <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                            {dayBkg.slice(0,3).map((b,idx) => <span key={idx} className={`w-1 h-1 rounded-full ${isSel?'bg-white/80':(statusDot[b.status]??'bg-zinc-400')}`} />)}
                          </div>
                        )}
                        {dayBkg.length > 3 && !isSel && <span className="text-[8px] text-zinc-400">+{dayBkg.length-3}</span>}
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-4 mt-4 px-1">
                  {[['Confirmed','bg-emerald-500'],['Pending','bg-amber-400'],['Completed','bg-blue-500'],['Canceled','bg-red-400']].map(([label,color]) => (
                    <div key={label} className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${color}`} />
                      <span className="text-[10px] text-zinc-400">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4">
                {!selectedDate ? (
                  <div className="flex flex-col items-center justify-center h-full min-h-[200px] gap-2">
                    <CalendarDays size={28} className="text-zinc-300 dark:text-zinc-600" />
                    <p className="text-sm text-zinc-400">Pilih tanggal untuk melihat detail</p>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-xs text-zinc-400">{new Date(selectedDate+'T00:00:00').toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long'})}</p>
                        <p className="text-sm font-semibold text-zinc-900 dark:text-white">{selectedBookings.length} booking</p>
                      </div>
                      <button onClick={() => setSelectedDate(null)} className="p-1 rounded text-zinc-400 hover:text-zinc-600"><X size={14} /></button>
                    </div>
                    {selectedBookings.length === 0 ? (
                      <p className="text-sm text-zinc-400 text-center py-8">Tidak ada booking</p>
                    ) : (
                      <div className="space-y-3">
                        {selectedBookings.sort((a,b) => (a.booking_time??'').localeCompare(b.booking_time??'')).map(b => (
                          <div key={b.id} className="rounded-xl border border-zinc-100 dark:border-zinc-800 p-3 cursor-pointer hover:border-earth-primary/30 transition-colors" onClick={() => setDetailBooking(detailBooking?.id===b.id ? null : b)}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-mono text-zinc-400">{b.booking_time?.slice(0,5)??'--:--'}</span>
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColor[b.status]??''}`}>{b.status}</span>
                            </div>
                            <p className="text-sm font-semibold text-zinc-900 dark:text-white">{b.customer_name}</p>
                            <p className="text-xs text-zinc-500 mt-0.5">{b.service_name}</p>
                            <p className="text-xs font-mono text-earth-primary mt-1">Rp {(b.price??0).toLocaleString('id-ID')}</p>
                            {detailBooking?.id === b.id && (
                              <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-1.5 text-xs text-zinc-500">
                                {b.phone && <div className="flex justify-between"><span>WhatsApp</span><a href={`https://wa.me/${b.phone}`} target="_blank" rel="noreferrer" className="font-mono text-emerald-600 hover:underline">{b.phone}</a></div>}
                                {b.notes && <div><span className="text-zinc-400">Catatan:</span><p className="text-zinc-600 dark:text-zinc-400 mt-0.5 italic">{b.notes}</p></div>}
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
