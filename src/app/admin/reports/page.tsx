'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Download, BarChart3, FlaskConical } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { createClient } from '@/lib/supabase';
import { AdminSkeleton } from '@/components/admin/AdminSkeleton';

type BookingItemLinked = { commission_earned: number; service_name: string; price: number; therapist_id: string; therapists?: any };
type Booking = {
  id: string; customer_name?: string; service_name: string; booking_date: string;
  price: number; final_price?: number; discount_total?: number;
  shared_discount_total?: number;
  status: string; bhp_cost?: number;
  booking_items?: BookingItemLinked[];
};

const formatRp = (n: number) => `Rp ${Number(n).toLocaleString('id-ID')}`;
const MONTHS_ID = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'];

export default function ReportsPage() {
  const [bookings, setBookings]           = useState<Booking[]>([]);
  const [loading, setLoading]             = useState(true);
  const [commissionPct, setCommissionPct] = useState(30);

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [{ data }, { data: settingsRows }] = await Promise.all([
      supabase.from('bookings')
        .select(`id, customer_name, service_name, booking_date, price, final_price, discount_total, shared_discount_total, status, bhp_cost,
          booking_items(commission_earned, service_name, price, therapist_id, therapists(name))`)
        .eq('status', 'Completed')
        .order('booking_date'),
      supabase.from('settings').select('key, value').eq('key', 'terapis_commission_pct'),
    ]);
    if (data) setBookings(data);
    if (settingsRows) {
      settingsRows.forEach(({ key, value }) => {
        if (key === 'terapis_commission_pct') setCommissionPct(Number(value) || 30);
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Monthly chart (last 6 months) ──
  const now = new Date();
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const y = d.getFullYear();
    const m = d.getMonth();
    const mb = bookings.filter(b => {
      const bd = new Date(b.booking_date + 'T00:00:00');
      return bd.getFullYear() === y && bd.getMonth() === m;
    });
    
    const calcTerapisCut = (b: any) => {
      if (b.booking_items && b.booking_items.length > 0) {
        return b.booking_items.reduce((ss: number, i: any) => ss + (Number(i.commission_earned) || 0), 0);
      }
      const terapisBase = Math.max(0, (b.price ?? 0) - (b.shared_discount_total ?? 0));
      return Math.round(terapisBase * commissionPct / 100);
    };

    const originalGross = mb.reduce((s, b) => s + (b.price ?? 0), 0);
    const gross    = mb.reduce((s, b) => s + (b.final_price ?? b.price ?? 0), 0);
    const discount = mb.reduce((s, b) => s + (b.discount_total ?? 0), 0);
    const terapis  = mb.reduce((s, b) => s + calcTerapisCut(b), 0);
    const bhp      = mb.reduce((s, b) => s + (b.bhp_cost ?? 0), 0);
    const net      = gross - terapis - bhp;
    return { month: MONTHS_ID[m], bookings: mb.length, gross, discount, terapis, bhp, net };
  });

  // ── Service breakdown ──
  const serviceMap: Record<string, { count: number; gross: number; discount: number; terapis: number; bhp: number }> = {};
  bookings.forEach(b => {
    if (!b.service_name) return;
    if (!serviceMap[b.service_name]) serviceMap[b.service_name] = { count: 0, gross: 0, discount: 0, terapis: 0, bhp: 0 };
    serviceMap[b.service_name].count += 1;
    serviceMap[b.service_name].gross += b.price ?? 0;
    serviceMap[b.service_name].discount += b.discount_total ?? 0;
    serviceMap[b.service_name].bhp   += b.bhp_cost ?? 0;
    serviceMap[b.service_name].terapis += b.booking_items?.reduce((ss, i) => ss + (Number(i.commission_earned) || 0), 0) || 0;
  });
  const serviceBreakdown = Object.entries(serviceMap)
    .map(([name, v]) => ({
      name,
      count:   v.count,
      gross:   v.gross,
      discount: v.discount,
      terapis: v.terapis,
      bhp:     Math.round(v.bhp),
      net:     Math.round((v.gross - v.discount) - v.terapis - v.bhp),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const calcTerapisCutForTotal = (b: any) => {
    if (b.booking_items && b.booking_items.length > 0) {
      return b.booking_items.reduce((ss: number, i: any) => ss + (Number(i.commission_earned) || 0), 0);
    }
    const terapisBase = Math.max(0, (b.price ?? 0) - (b.shared_discount_total ?? 0));
    return Math.round(terapisBase * commissionPct / 100);
  };

  const totalOriginalGross = bookings.reduce((s, b) => s + (b.price ?? 0), 0);
  const totalGross    = bookings.reduce((s, b) => s + (b.final_price ?? b.price ?? 0), 0);
  const totalDiscount = bookings.reduce((s, b) => s + (b.discount_total ?? 0), 0);
  const totalBhp      = bookings.reduce((s, b) => s + (b.bhp_cost ?? 0), 0);
  const totalTerapis  = bookings.reduce((s, b) => s + calcTerapisCutForTotal(b), 0);
  const totalNet      = totalGross - totalTerapis - totalBhp;
  const totalBookings = bookings.length;
  const topService    = serviceBreakdown[0];
  const hasBhpData    = totalBhp > 0;

  const exportCSV = () => {
    const headers = ['Bulan','Total Booking','Diskon','Pendapatan (after diskon)','Bagian Terapis','Modal BHP (aktual)','Penghasilan Bersih'];
    const rows = monthlyData.map(d => [d.month, d.bookings, d.discount ?? 0, d.gross, d.terapis, d.bhp, d.net]);
    const csv  = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SerenaRaga_Report_${new Date().toISOString().slice(0, 7)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">Reports</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Ringkasan performa bisnis · hanya transaksi <span className="font-semibold text-blue-600 dark:text-blue-400">Completed</span>
            {!hasBhpData && (
              <span className="ml-2 inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                <FlaskConical size={11} /> BHP belum ada data — input bahan di halaman Bahan (BHP)
              </span>
            )}
          </p>
        </div>
        <button onClick={exportCSV} className="admin-btn-ghost">
          <Download size={15} /> Export CSV
        </button>
      </div>

      {loading ? (
        <AdminSkeleton rows={6} />
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Total Booking</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white tabular-nums">{totalBookings}</p>
              <p className="text-xs text-zinc-400 mt-1">Semua waktu (Completed)</p>
            </div>
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Pendapatan (after diskon)</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white tabular-nums">{formatRp(totalGross)}</p>
              {totalDiscount > 0 && <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">Diskon: -{formatRp(totalDiscount)}</p>}
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
            <p className="text-xs text-amber-600 dark:text-amber-400 mb-1">Bagian Terapis + BHP</p>
              <p className="text-2xl font-bold text-amber-700 dark:text-amber-400 tabular-nums">{formatRp(totalTerapis + totalBhp)}</p>
              <p className="text-xs text-amber-600/60 mt-1">Total potongan</p>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">Penghasilan Bersih Owner</p>
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">{formatRp(totalNet)}</p>
              <p className="text-xs text-emerald-600/60 mt-1">Setelah semua potongan</p>
            </div>
          </div>

          {/* Top Service */}
          {topService && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
              <p className="text-xs text-zinc-500 mb-1">Layanan Terlaris</p>
              <p className="text-base font-bold text-zinc-900 dark:text-white">{topService.name}</p>
              <p className="text-xs text-zinc-400 mt-1">
                {topService.count} booking · Kotor: {formatRp(topService.gross)} · BHP: {formatRp(topService.bhp)} · Bersih: {formatRp(topService.net)}
              </p>
            </div>
          )}

          {/* Revenue Chart */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <BarChart3 size={16} className="text-earth-primary" />
                <div>
                  <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Pendapatan 6 Bulan Terakhir</h2>
                  <p className="text-xs text-zinc-400 mt-0.5">Rincian: Kotor · Terapis · BHP aktual · Bersih Owner</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-zinc-400 shrink-0">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-[#8B5E3C] inline-block"/>Kotor</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block"/>Terapis</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-blue-400 inline-block"/>BHP</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block"/>Bersih</span>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: -15, bottom: 0 }} barCategoryGap="30%" barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F4F4F5" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#A1A1AA' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#A1A1AA' }}
                    tickFormatter={v => v >= 1000000 ? `${(v/1000000).toFixed(1)}jt` : String(v)} />
                  <Tooltip
                    formatter={(v: unknown, name: unknown) => {
                      const labels: Record<string, string> = { gross: 'Kotor', terapis: 'Terapis', bhp: 'BHP (aktual)', net: 'Bersih Owner' };
                      return [formatRp(Number(v)), labels[String(name)] ?? String(name)];
                    }}
                    contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', fontSize: 12 }}
                    cursor={{ fill: 'rgba(139,94,60,0.03)' }}
                  />
                  <Bar dataKey="gross"   name="gross"   fill="#8B5E3C" radius={[3,3,0,0]} />
                  <Bar dataKey="terapis" name="terapis" fill="#FBBF24" radius={[3,3,0,0]} />
                  <Bar dataKey="bhp"     name="bhp"     fill="#60A5FA" radius={[3,3,0,0]} />
                  <Bar dataKey="net"     name="net"     fill="#10b981" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Service Breakdown */}
          {serviceBreakdown.length > 0 && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Performa per Layanan</h2>
                <div className="flex items-center gap-4 text-[10px] text-zinc-400">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-earth-primary inline-block"/>Kotor</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block"/>Terapis</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block"/>BHP</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"/>Bersih</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-zinc-100 dark:border-zinc-800">
                      <th className="px-6 py-3 text-xs font-medium text-zinc-500">Layanan</th>
                      <th className="px-4 py-3 text-xs font-medium text-zinc-500 text-right">Booking</th>
                      <th className="px-4 py-3 text-xs font-medium text-zinc-500 text-right">Kotor</th>
                      <th className="px-4 py-3 text-xs font-medium text-amber-600 text-right">Terapis</th>
                      <th className="px-4 py-3 text-xs font-medium text-blue-500 text-right">BHP</th>
                      <th className="px-4 py-3 text-xs font-medium text-emerald-600 text-right">Bersih</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {serviceBreakdown.map(s => (
                      <tr key={s.name} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                        <td className="px-6 py-3 text-zinc-800 dark:text-zinc-200 font-medium">{s.name}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-zinc-600 dark:text-zinc-400">{s.count}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-zinc-600 dark:text-zinc-400 font-mono text-xs">{formatRp(s.gross)}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-amber-600 font-mono text-xs">{formatRp(s.terapis)}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-blue-500 font-mono text-xs">
                          {s.bhp > 0 ? formatRp(s.bhp) : <span className="text-zinc-300 dark:text-zinc-600">—</span>}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-emerald-600 font-mono text-xs font-semibold">{formatRp(s.net)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 border-zinc-200 dark:border-zinc-700">
                    <tr className="bg-zinc-50 dark:bg-zinc-800/50">
                      <td className="px-6 py-3 text-xs font-bold text-zinc-700 dark:text-zinc-300">TOTAL</td>
                      <td className="px-4 py-3 text-right tabular-nums text-xs font-bold text-zinc-700 dark:text-zinc-300">{totalBookings}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-mono text-xs font-bold text-zinc-700 dark:text-zinc-300">{formatRp(totalGross)}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-mono text-xs font-bold text-amber-600">{formatRp(totalTerapis)}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-mono text-xs font-bold text-blue-500">{formatRp(totalBhp)}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-mono text-xs font-bold text-emerald-600">{formatRp(totalNet)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* History / Detail Tiap Order */}
          {bookings.length > 0 && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden mt-6">
              <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Riwayat Transaksi (Completed)</h2>
                <p className="text-xs text-zinc-500 mt-1">Detail pendapatan tiap order</p>
              </div>
              <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full text-sm relative">
                  <thead className="sticky top-0 bg-white dark:bg-zinc-900 shadow-sm">
                    <tr className="text-left border-b border-zinc-100 dark:border-zinc-800">
                      <th className="px-6 py-3 text-xs font-medium text-zinc-500 whitespace-nowrap">Tanggal</th>
                      <th className="px-4 py-3 text-xs font-medium text-zinc-500 whitespace-nowrap">Customer</th>
                      <th className="px-4 py-3 text-xs font-medium text-zinc-500">Layanan</th>
                      <th className="px-4 py-3 text-xs font-medium text-zinc-500 text-right whitespace-nowrap">Jasa Kotor</th>
                      <th className="px-4 py-3 text-xs font-medium text-zinc-500 text-right whitespace-nowrap">Transport</th>
                      <th className="px-4 py-3 text-xs font-medium text-emerald-600 text-right whitespace-nowrap">Diskon</th>
                      <th className="px-4 py-3 text-xs font-medium text-zinc-700 dark:text-zinc-300 text-right whitespace-nowrap">Dibayar</th>
                      <th className="px-4 py-3 text-xs font-medium text-amber-600 text-right whitespace-nowrap">Terapis</th>
                      <th className="px-4 py-3 text-xs font-medium text-blue-500 text-right whitespace-nowrap">BHP</th>
                      <th className="px-4 py-3 text-xs font-medium text-emerald-700 dark:text-emerald-400 text-right whitespace-nowrap">Bersih Owner</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {[...bookings].reverse().map(b => {
                      const totalGross = b.price ?? 0;
                      const transportItem = b.booking_items?.find(i => i.service_name === 'Biaya Transport');
                      const transportPrice = transportItem ? Number(transportItem.price || 0) : 0;
                      const serviceGross = Math.max(0, totalGross - transportPrice);

                      const finalPrice = b.final_price ?? totalGross;
                      const discount = b.discount_total ?? 0;

                      let terapis = 0;
                      if (b.booking_items && b.booking_items.length > 0) {
                        terapis = b.booking_items.reduce((ss, i) => ss + (Number(i.commission_earned) || 0), 0);
                      } else {
                        const terapisBase = Math.max(0, totalGross - (b.shared_discount_total ?? 0));
                        terapis = Math.round(terapisBase * commissionPct / 100);
                      }

                      const therapistNames = [...new Set(b.booking_items?.filter(i => i.service_name !== 'Biaya Transport').map(i => i.therapists?.name).filter(Boolean))].join(', ');
                      const bhp = b.bhp_cost ?? 0;
                      const net = finalPrice - terapis - bhp;
                      return (
                        <tr key={b.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                          <td className="px-6 py-3 text-zinc-800 dark:text-zinc-200 text-xs whitespace-nowrap">{new Date(b.booking_date + 'T00:00:00').toLocaleDateString('id-ID')}</td>
                          <td className="px-4 py-3 text-zinc-800 dark:text-zinc-200 text-xs">{b.customer_name || '-'}</td>
                          <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400 text-xs max-w-[200px] truncate" title={b.service_name}>{b.service_name}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-zinc-500 font-mono text-xs">{formatRp(serviceGross)}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-zinc-500 font-mono text-xs">{transportPrice > 0 ? formatRp(transportPrice) : '-'}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-emerald-600 font-mono text-xs">{discount > 0 ? `-${formatRp(discount)}` : '-'}</td>
                          <td className="px-4 py-3 text-right tabular-nums font-semibold text-zinc-800 dark:text-zinc-200 font-mono text-xs">{formatRp(finalPrice)}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex flex-col items-end">
                              <span className="tabular-nums text-amber-600 font-mono text-xs">{formatRp(terapis)}</span>
                              {therapistNames && <span className="text-[10px] text-zinc-400 mt-0.5">{therapistNames}</span>}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-blue-500 font-mono text-xs">{bhp > 0 ? formatRp(bhp) : '-'}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-emerald-700 dark:text-emerald-400 font-bold font-mono text-xs">{formatRp(net)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {bookings.length === 0 && (
            <div className="text-center py-12 text-sm text-zinc-400">
              Belum ada transaksi Completed. Ubah status booking menjadi Completed untuk melihat laporan.
            </div>
          )}
        </>
      )}
    </div>
  );
}
