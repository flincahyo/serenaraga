'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { TrendingUp, Users, ShoppingBag, Star, Clock, ArrowUpRight, Loader2, Wallet } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import { createClient } from '@/lib/supabase';


type Booking = {
  id: string; customer_name: string; service_name: string;
  booking_date: string; booking_time: string; price: number; status: string;
};

const statusColor: Record<string, string> = {
  Confirmed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  Pending:   'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  Completed: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  Canceled:  'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400',
};

const DAYS_ID  = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const formatRp = (n: number) => n >= 1000000
  ? `Rp ${(n / 1000000).toFixed(1).replace('.', ',')}JT`
  : `Rp ${n.toLocaleString('id-ID')}`;

export default function DashboardPage() {
  const [loading, setLoading]         = useState(true);
  const [bookings, setBookings]       = useState<Booking[]>([]);
  const [weeklyData, setWeeklyData]   = useState<{ day: string; bookings: number }[]>([]);
  const [commissionPct, setCommissionPct] = useState(30);
  const [bhpPct, setBhpPct]               = useState(10);

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
        const d = new Date(now);
        d.setDate(d.getDate() - (6 - i));
        const dateStr = d.toISOString().split('T')[0];
        const count   = allBookings.filter(b => b.booking_date === dateStr).length;
        last7.push({ day: DAYS_ID[d.getDay()], bookings: count });
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

  const now          = new Date();
  const todayStr     = now.toISOString().split('T')[0];
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

  const monthBookings   = bookings.filter(b => b.booking_date >= startOfMonth);
  // Revenue: only Completed bookings
  const completedMonth  = monthBookings.filter(b => b.status === 'Completed');
  const grossRevenue    = completedMonth.reduce((s, b) => s + (b.price ?? 0), 0);
  const terapisCut      = Math.round(grossRevenue * commissionPct / 100);
  const bhpCut          = Math.round(grossRevenue * bhpPct / 100);
  const netRevenue      = grossRevenue - terapisCut - bhpCut;

  const todayBookings   = bookings.filter(b => b.booking_date === todayStr && (b.status === 'Confirmed' || b.status === 'Pending'));

  const prevMonthStart  = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
  const prevMonthEnd    = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
  const prevMonthBookings = bookings.filter(b => b.booking_date >= prevMonthStart && b.booking_date <= prevMonthEnd);
  const bookingChange   = prevMonthBookings.length > 0
    ? Math.round(((monthBookings.length - prevMonthBookings.length) / prevMonthBookings.length) * 100)
    : 0;

  const today = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const stats = [
    { label: 'Booking Bulan Ini', value: String(monthBookings.length), icon: ShoppingBag, change: bookingChange >= 0 ? `+${bookingChange}%` : `${bookingChange}%`, up: bookingChange >= 0 },
    { label: 'Pendapatan Kotor',   value: formatRp(grossRevenue), icon: TrendingUp, change: '', up: true, sub: 'Transaksi selesai bulan ini' },
    { label: 'Penghasilan Bersih', value: formatRp(netRevenue),   icon: Wallet, change: `Terapis ${commissionPct}% · BHP ${bhpPct}%`, up: true, sub: `Owner ${Math.max(0, 100 - commissionPct - bhpPct)}%` },
    { label: 'Jadwal Hari Ini',    value: String(todayBookings.length), icon: Star, change: 'menunggu', up: true },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">Dashboard</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">{today}</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-earth-primary" size={28} />
        </div>
      ) : (
        <>
          {/* Stats */}
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

          {/* Bagi Hasil Bulan Ini */}
          {grossRevenue > 0 && (
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-3">
                Rincian Bagi Hasil Bulan Ini ({commissionPct}% terapis)
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <p className="text-[10px] text-amber-500 mb-1">Pendapatan Kotor</p>
                  <p className="font-bold text-sm text-amber-800 dark:text-amber-300 font-mono">{formatRp(grossRevenue)}</p>
                </div>
                <div className="text-center border-x border-amber-200 dark:border-amber-700">
                  <p className="text-[10px] text-amber-500 mb-1">Terapis ({commissionPct}%)</p>
                  <p className="font-bold text-sm text-amber-700 dark:text-amber-400 font-mono">{formatRp(terapisCut)}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-amber-500 mb-1">Pemilik ({100 - commissionPct}%)</p>
                  <p className="font-bold text-sm text-emerald-700 dark:text-emerald-400 font-mono">{formatRp(netRevenue)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Chart + Schedule */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
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
              <div className="h-52">
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

            <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <Clock size={15} className="text-earth-primary" />
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Jadwal Hari Ini</h2>
              </div>
              {todayBookings.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40">
                  <p className="text-sm text-zinc-400">Tidak ada jadwal hari ini</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {todayBookings.slice(0, 5).map(b => (
                    <div key={b.id} className="flex items-start gap-3">
                      <span className="text-xs font-mono text-zinc-400 w-10 shrink-0 pt-0.5">{b.booking_time ?? '--:--'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{b.customer_name}</p>
                        <p className="text-xs text-zinc-400 truncate">{b.service_name}</p>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${statusColor[b.status] ?? ''}`}>
                        {b.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
