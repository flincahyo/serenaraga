'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Download, BarChart3, Loader2, TrendingUp, Wallet } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { createClient } from '@/lib/supabase';
import { useSettings } from '@/lib/settings';

type Booking = {
  id: string; service_name: string; booking_date: string;
  price: number; status: string;
};

const formatRp = (n: number) => `Rp ${Number(n).toLocaleString('id-ID')}`;
const formatRpShort = (n: number) => n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}jt` : n >= 1_000 ? `${(n / 1_000).toFixed(0)}rb` : String(n);
const MONTHS_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];

export default function ReportsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const { settings } = useSettings();
  const commissionPct = Number(settings.terapis_commission_pct ?? 30);
  const ownerPct = 100 - commissionPct;

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('bookings').select('id,service_name,booking_date,price,status')
      .neq('status', 'Canceled').order('booking_date');
    if (data) setBookings(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const now = new Date();

  // Last 6 months chart data
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const [y, m] = [d.getFullYear(), d.getMonth()];
    const mb = bookings.filter(b => { const bd = new Date(b.booking_date); return bd.getFullYear() === y && bd.getMonth() === m; });
    const gross = mb.reduce((s, b) => s + (b.price ?? 0), 0);
    const terapis = Math.round(gross * commissionPct / 100);
    const net = gross - terapis;
    return { month: MONTHS_ID[m], gross, terapis, net };
  });

  // Service breakdown
  const serviceMap: Record<string, { count: number; gross: number }> = {};
  bookings.forEach(b => {
    if (!b.service_name) return;
    if (!serviceMap[b.service_name]) serviceMap[b.service_name] = { count: 0, gross: 0 };
    serviceMap[b.service_name].count += 1;
    serviceMap[b.service_name].gross += b.price ?? 0;
  });
  const serviceRows = Object.entries(serviceMap)
    .map(([name, v]) => ({
      name,
      count: v.count,
      gross: v.gross,
      terapis: Math.round(v.gross * commissionPct / 100),
      net: Math.round(v.gross * ownerPct / 100),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const totalGross   = bookings.reduce((s, b) => s + (b.price ?? 0), 0);
  const totalTerapis = Math.round(totalGross * commissionPct / 100);
  const totalNet     = totalGross - totalTerapis;
  const topService   = serviceRows[0];

  const exportCSV = () => {
    const headers = ['Bulan', 'Booking', 'Pendapatan Kotor', 'Terapis', 'Pendapatan Bersih'];
    const rows = monthlyData.map(d => [d.month, d.gross > 0 ? '?' : 0, d.gross, d.terapis, d.net]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `SerenaRaga_Report_${new Date().toISOString().slice(0, 7)}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">Reports</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">Performa bisnis SerenaRaga</p>
        </div>
        <button onClick={exportCSV} className="admin-btn-ghost">
          <Download size={15} /> Export CSV
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-earth-primary" size={28} /></div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={14} className="text-zinc-400" />
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Pendapatan Kotor</p>
              </div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white tabular-nums">{formatRp(totalGross)}</p>
              <p className="text-xs text-zinc-400 mt-1">Semua waktu (non-canceled)</p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <p className="text-xs text-amber-600 dark:text-amber-400">Bagian Terapis ({commissionPct}%)</p>
              </div>
              <p className="text-2xl font-bold text-amber-700 dark:text-amber-300 tabular-nums">{formatRp(totalTerapis)}</p>
              <p className="text-xs text-amber-500 mt-1">Total komisi terapis</p>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Wallet size={14} className="text-emerald-500" />
                <p className="text-xs text-emerald-600 dark:text-emerald-400">Pendapatan Bersih ({ownerPct}%)</p>
              </div>
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 tabular-nums">{formatRp(totalNet)}</p>
              <p className="text-xs text-emerald-500 mt-1">Penghasilan pemilik</p>
            </div>
          </div>

          {/* Top Service */}
          {topService && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
              <p className="text-xs text-zinc-500 mb-1">Layanan Terlaris</p>
              <p className="text-base font-bold text-zinc-900 dark:text-white">{topService.name}</p>
              <p className="text-xs text-zinc-400 mt-1">{topService.count} booking · Kotor: {formatRp(topService.gross)} · Bersih: {formatRp(topService.net)}</p>
            </div>
          )}

          {/* Revenue Chart */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 size={16} className="text-earth-primary" />
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
                Pendapatan 6 Bulan Terakhir
              </h2>
            </div>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F4F4F5" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#A1A1AA' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#A1A1AA' }} tickFormatter={formatRpShort} />
                  <Tooltip
                    formatter={(v: unknown, name: string) => [formatRp(Number(v)), name === 'gross' ? 'Kotor' : name === 'terapis' ? 'Terapis' : 'Bersih (Pemilik)']}
                    contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', fontSize: 12 }}
                    cursor={{ fill: 'rgba(139,94,60,0.04)' }}
                  />
                  <Legend formatter={(v) => v === 'gross' ? 'Kotor' : v === 'terapis' ? 'Terapis' : 'Bersih'} />
                  <Bar dataKey="net"     fill="#10B981" radius={[4, 4, 0, 0]} stackId="a" name="net" />
                  <Bar dataKey="terapis" fill="#F59E0B" radius={[0, 0, 0, 0]} stackId="a" name="terapis" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[10px] text-zinc-400 text-center mt-2">
              Hijau = pemilik ({ownerPct}%) · Kuning = terapis ({commissionPct}%)
            </p>
          </div>

          {/* Service Breakdown */}
          {serviceRows.length > 0 && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Performa per Layanan</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-100 dark:border-zinc-800 text-left">
                      <th className="px-5 py-3 text-xs font-medium text-zinc-500">Layanan</th>
                      <th className="px-5 py-3 text-xs font-medium text-zinc-500 text-right">Booking</th>
                      <th className="px-5 py-3 text-xs font-medium text-zinc-500 text-right hidden sm:table-cell">Kotor</th>
                      <th className="px-5 py-3 text-xs font-medium text-amber-500 text-right hidden sm:table-cell">Terapis</th>
                      <th className="px-5 py-3 text-xs font-medium text-emerald-600 text-right">Bersih</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {serviceRows.map(s => (
                      <tr key={s.name} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                        <td className="px-5 py-3 text-zinc-800 dark:text-zinc-200 font-medium max-w-[160px] truncate">{s.name}</td>
                        <td className="px-5 py-3 text-right tabular-nums text-zinc-500">{s.count}</td>
                        <td className="px-5 py-3 text-right tabular-nums text-zinc-500 text-xs font-mono hidden sm:table-cell">{formatRp(s.gross)}</td>
                        <td className="px-5 py-3 text-right tabular-nums text-amber-600 text-xs font-mono hidden sm:table-cell">{formatRp(s.terapis)}</td>
                        <td className="px-5 py-3 text-right tabular-nums text-emerald-600 dark:text-emerald-400 text-xs font-mono font-semibold">{formatRp(s.net)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
                    <tr>
                      <td className="px-5 py-3 text-xs font-bold text-zinc-600 dark:text-zinc-300">Total</td>
                      <td className="px-5 py-3 text-right text-xs font-bold text-zinc-600 dark:text-zinc-300 tabular-nums">{bookings.length}</td>
                      <td className="px-5 py-3 text-right text-xs font-mono font-bold text-zinc-600 hidden sm:table-cell">{formatRp(totalGross)}</td>
                      <td className="px-5 py-3 text-right text-xs font-mono font-bold text-amber-600 hidden sm:table-cell">{formatRp(totalTerapis)}</td>
                      <td className="px-5 py-3 text-right text-xs font-mono font-bold text-emerald-600">{formatRp(totalNet)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {bookings.length === 0 && (
            <div className="text-center py-12 text-sm text-zinc-400">
              Belum ada data booking.
            </div>
          )}
        </>
      )}
    </div>
  );
}
