'use client';

import React, { useState } from 'react';
import { Download, TrendingUp, BarChart3 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';

interface MonthlyReport {
  month: string;
  bookings: number;
  revenue: number;
}

const reportData: MonthlyReport[] = [
  { month: 'Jan', bookings: 28, revenue: 5600000 },
  { month: 'Feb', bookings: 32, revenue: 6400000 },
  { month: 'Mar', bookings: 41, revenue: 8200000 },
  { month: 'Apr', bookings: 47, revenue: 9400000 },
];

const serviceBreakdown = [
  { name: 'Signature Massage', count: 52, revenue: 13000000 },
  { name: 'Traditional Javanese', count: 38, revenue: 5700000 },
  { name: 'Foot Reflexology', count: 31, revenue: 3720000 },
  { name: 'Aromatherapy', count: 20, revenue: 5500000 },
  { name: 'LactaFlow Therapy', count: 7, revenue: 1400000 },
];

const formatRp = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;

const exportCSV = (data: MonthlyReport[]) => {
  const headers = ['Bulan', 'Total Booking', 'Total Pendapatan'];
  const rows = data.map(d => [d.month, d.bookings, d.revenue]);
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `SerenaRaga_Report_${new Date().toISOString().slice(0, 7)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

export default function ReportsPage() {
  const totalRevenue = reportData.reduce((s, d) => s + d.revenue, 0);
  const totalBookings = reportData.reduce((s, d) => s + d.bookings, 0);
  const topService = serviceBreakdown[0];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">Reports</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">Ringkasan performa bisnis SerenaRaga</p>
        </div>
        <button
          onClick={() => exportCSV(reportData)}
          className="admin-btn-ghost"
        >
          <Download size={15} /> Export CSV
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Total Pendapatan</p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white tabular-nums">{formatRp(totalRevenue)}</p>
          <p className="text-xs text-emerald-500 mt-1 flex items-center gap-1"><TrendingUp size={11} /> +18% dari periode lalu</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Total Booking</p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white tabular-nums">{totalBookings}</p>
          <p className="text-xs text-emerald-500 mt-1 flex items-center gap-1"><TrendingUp size={11} /> +12% dari periode lalu</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Layanan Terlaris</p>
          <p className="text-lg font-bold text-zinc-900 dark:text-white">{topService.name}</p>
          <p className="text-xs text-zinc-400 mt-1">{topService.count} booking · {formatRp(topService.revenue)}</p>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 size={16} className="text-earth-primary" />
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Pendapatan Bulanan</h2>
        </div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={reportData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F4F4F5" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#A1A1AA' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#A1A1AA' }} tickFormatter={v => `${v / 1000000}jt`} />
              <Tooltip
                formatter={(v: unknown) => formatRp(Number(v))}
                contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', fontSize: 12 }}
                cursor={{ fill: 'rgba(139,94,60,0.04)' }}
              />
              <Bar dataKey="revenue" fill="#8B5E3C" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Service Breakdown Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Performa per Layanan</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-zinc-100 dark:border-zinc-800">
              <th className="px-6 py-3 text-xs font-medium text-zinc-500">Layanan</th>
              <th className="px-6 py-3 text-xs font-medium text-zinc-500 text-right">Booking</th>
              <th className="px-6 py-3 text-xs font-medium text-zinc-500 text-right">Pendapatan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {serviceBreakdown.map(s => (
              <tr key={s.name} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                <td className="px-6 py-3 text-zinc-800 dark:text-zinc-200 font-medium">{s.name}</td>
                <td className="px-6 py-3 text-right tabular-nums text-zinc-600 dark:text-zinc-400">{s.count}</td>
                <td className="px-6 py-3 text-right tabular-nums text-zinc-600 dark:text-zinc-400 font-mono text-xs">{formatRp(s.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
