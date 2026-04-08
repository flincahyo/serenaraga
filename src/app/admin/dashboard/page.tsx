'use client';

import React from 'react';
import { TrendingUp, Users, ShoppingBag, Star, Clock, ArrowUpRight } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';

const weeklyData = [
  { day: 'Sen', bookings: 3 },
  { day: 'Sel', bookings: 7 },
  { day: 'Rab', bookings: 5 },
  { day: 'Kam', bookings: 9 },
  { day: 'Jum', bookings: 8 },
  { day: 'Sab', bookings: 14 },
  { day: 'Min', bookings: 11 },
];

const todaySchedule = [
  { time: '09:00', name: 'Ibu Rina', service: 'Signature Massage', duration: '90m', status: 'Confirmed' },
  { time: '11:30', name: 'Bu Sari', service: 'Foot Reflexology', duration: '60m', status: 'Confirmed' },
  { time: '14:00', name: 'Ibu Dewi', service: 'Traditional Javanese', duration: '60m', status: 'Pending' },
  { time: '16:00', name: 'Ibu Mega', service: 'Signature Massage', duration: '90m', status: 'Confirmed' },
];

const stats = [
  { label: 'Booking Bulan Ini', value: '47', icon: ShoppingBag, change: '+12%', up: true },
  { label: 'Pendapatan', value: 'Rp 8,2JT', icon: TrendingUp, change: '+18%', up: true },
  { label: 'Pelanggan Baru', value: '15', icon: Users, change: '+5%', up: true },
  { label: 'Rating Rata-rata', value: '4.9', icon: Star, change: '0.0', up: true },
];

const statusColor: Record<string, string> = {
  Confirmed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  Completed: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  Canceled: 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400',
};

export default function DashboardPage() {
  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">Dashboard</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">{today}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, change, up }) => (
          <div key={label} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded-lg bg-earth-primary/10 flex items-center justify-center">
                <Icon size={16} className="text-earth-primary" />
              </div>
              <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${up ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400' : 'text-red-500'}`}>
                {change}
              </span>
            </div>
            <p className="text-2xl font-bold text-zinc-900 dark:text-white tabular-nums">{value}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Charts + Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Booking Chart */}
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
                    <stop offset="5%" stopColor="#8B5E3C" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#8B5E3C" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F4F4F5" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#A1A1AA' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#A1A1AA' }} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', fontSize: 12 }}
                  cursor={{ stroke: '#8B5E3C', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Area type="monotone" dataKey="bookings" stroke="#8B5E3C" strokeWidth={2} fill="url(#grad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Today's Schedule */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <Clock size={15} className="text-earth-primary" />
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Jadwal Hari Ini</h2>
          </div>

          {todaySchedule.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <p className="text-sm text-zinc-400">Tidak ada jadwal hari ini</p>
            </div>
          ) : (
            <div className="space-y-4">
              {todaySchedule.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-xs font-mono text-zinc-400 w-10 shrink-0 pt-0.5">{item.time}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{item.name}</p>
                    <p className="text-xs text-zinc-400 truncate">{item.service} · {item.duration}</p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${statusColor[item.status]}`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
