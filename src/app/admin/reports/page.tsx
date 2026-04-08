'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Download, BarChart3, Loader2 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { createClient } from '@/lib/supabase';
import { fetchSettings, DEFAULT_SETTINGS, type AppSettings } from '@/lib/settings';

type Booking = {
  id: string;
  service_name: string;
  booking_date: string;
  price: number;
  status: string;
};

const formatRp = (n: number) => `Rp ${Number(n).toLocaleString('id-ID')}`;
const MONTHS_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];

export default function ReportsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [{ data }, appSettings] = await Promise.all([
      supabase.from('bookings').select('id,service_name,booking_date,price,status').neq('status', 'Canceled').order('booking_date'),
      fetchSettings(),
    ]);
    if (data) setBookings(data);
    setSettings(appSettings);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const commissionPct = settings.terapis_commission_pct;

  // Monthly data (last 6 months)
  const now = new Date();
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const y = d.getFullYear(), m = d.getMonth();
    const monthBookings = bookings.filter(b => {
      const bd = new Date(b.booking_date);
      return bd.getFullYear() === y && bd.getMonth() === m;
    });
    const gross = monthBookings.reduce((s, b) => s + (b.price ?? 0), 0);
    const terapisCut = Math.round(gross * commissionPct / 100);
    return {
      month: MONTHS_ID[m],
      gross,
      terapis: terapisCut,
      net: gross - terapisCut,
      bookings: monthBookings.length,
    };
  });

  // Service breakdown
  const serviceMap: Record<string, { count: number; gross: number }> = {};
  bookings.forEach(b => {
    if (!b.service_name) return;
    if (!serviceMap[b.service_name]) serviceMap[b.service_name] = { count: 0, gross: 0 };
    serviceMap[b.service_name].count += 1;
    serviceMap[b.service_name].gross += b.price ?? 0;
  });
  const serviceBreakdown = Object.entries(serviceMap)
    .map(([name, v]) => ({
      name,
      count: v.count,
      gross: v.gross,
      terapis: Math.round(v.gross * commissionPct / 100),
      net: v.gross - Math.round(v.gross * commissionPct / 100),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const totalGross = bookings.reduce((s, b) => s + (b.price ?? 0), 0);
  const totalTerapis = Math.round(totalGross * commissionPct / 100);
  const totalNet = totalGross - totalTerapis;
  const topService = serviceBreakdown[0];

  const exportCSV = () => {
    const headers = ['Bulan', 'Booking', 'Pendapatan Kotor', `Komisi Terapis (${commissionPct}%)`, 'Pendapatan Bersih'];
    const rows = monthlyData.map(d => [d.month, d.bookings, d.gross, d.terapis, d.net]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SerenaRaga_Report_${new Date().toISOString().slice(0, 7)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">Reports</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">Ringkasan performa bisnis — Komisi terapis: {commissionPct}%</p>
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
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Total Pendapatan Kotor</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white tabular-nums font-mono">{formatRp(totalGross)}</p>
              <p className="text-xs text-zinc-400 mt-1">Semua waktu (non-canceled)</p>
            </div>
            <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900 rounded-xl p-4">
              <p className="text-xs text-rose-500 mb-1">Bagi Hasil Terapis ({commissionPct}%)</p>
              <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 tabular-nums font-mono">{formatRp(totalTerapis)}</p>
              <p className="text-xs text-rose-400 mt-1">Total potongan terapis</p>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 rounded-xl p-4">
              <p className="text-xs text-emerald-600 mb-1">Pendapatan Bersih Pemilik</p>
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 tabular-nums font-mono">{formatRp(totalNet)}</p>
              <p className="text-xs text-emerald-500 mt-1">{100 - commissionPct}% dari pendapatan kotor</p>
            </div>
          </div>

          {/* Top Service */}
          {topService && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex items-center gap-4">
              <div>
                <p className="text-xs text-zinc-500 mb-0.5">Layanan Terlaris</p>
                <p className="text-lg font-bold text-zinc-900 dark:text-white">{topService.name}</p>
                <p className="text-xs text-zinc-400">{topService.count} booking · Kotor: {formatRp(topService.gross)} · Bersih: {formatRp(topService.net)}</p>
              </div>
            </div>
          )}

          {/* Revenue Chart (bar stacked: net + terapis) */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 size={16} className="text-earth-primary" />
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Pendapatan 6 Bulan Terakhir</h2>
            </div>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F4F4F5" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#A1A1AA' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#A1A1AA' }} tickFormatter={v => v >= 1000000 ? `${v/1000000}jt` : String(v)} />
                  <Tooltip
                    formatter={(v: unknown, name: string) => [formatRp(Number(v)), name === 'net' ? 'Bersih (Pemilik)' : name === 'terapis' ? 'Terapis' : String(name)]}
                    contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', fontSize: 12 }}
                    cursor={{ fill: 'rgba(139,94,60,0.04)' }}
                  />
                  <Legend formatter={v => v === 'net' ? 'Bersih (Pemilik)' : v === 'terapis' ? 'Terapis' : v} />
                  <Bar dataKey="net"     name="net"     stackId="a" fill="#8B5E3C" radius={[0,0,0,0]} />
                  <Bar dataKey="terapis" name="terapis" stackId="a" fill="#F87171" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Service Breakdown Table */}
          {serviceBreakdown.length > 0 && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Performa per Layanan</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[540px]">
                  <thead>
                    <tr className="text-left border-b border-zinc-100 dark:border-zinc-800">
                      <th className="px-6 py-3 text-xs font-medium text-zinc-500">Layanan</th>
                      <th className="px-4 py-3 text-xs font-medium text-zinc-500 text-right">Booking</th>
                      <th className="px-4 py-3 text-xs font-medium text-zinc-500 text-right">Kotor</th>
                      <th className="px-4 py-3 text-xs font-medium text-rose-500 text-right">Terapis</th>
                      <th className="px-4 py-3 text-xs font-medium text-emerald-600 text-right">Bersih</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {serviceBreakdown.map(s => (
                      <tr key={s.name} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                        <td className="px-6 py-3 text-zinc-800 dark:text-zinc-200 font-medium">{s.name}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-zinc-600 dark:text-zinc-400">{s.count}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-zinc-600 dark:text-zinc-400 font-mono text-xs">{formatRp(s.gross)}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-rose-500 font-mono text-xs">{formatRp(s.terapis)}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-emerald-600 dark:text-emerald-400 font-mono text-xs font-semibold">{formatRp(s.net)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
