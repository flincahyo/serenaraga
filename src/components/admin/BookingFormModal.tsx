'use client';
import React, { useState, useEffect } from 'react';
import { Plus, Loader2, X, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase';

export type BookingItemRow = {
  tempId: number;
  service_id: string;
  service_name: string;
  price: number;
  duration: string;
  therapist_id: string;
  parent_bundle_name?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  editBookingId?: string | null;
  defaultDate?: string;
  therapists: { id: string; name: string; commission_pct: number }[];
  services: { id: string; name: string; price: number; category: string; estimated_duration?: number; is_bundle?: boolean; bundle_child_ids?: string[] }[];
  customers: { id: string; name: string; wa_number: string }[];
  isOwner?: boolean;
};

const STATUS_OPTIONS = ['Pending', 'Confirmed', 'Completed', 'Canceled'];
const CATEGORY_LABELS: Record<string, string> = {
  packages: 'Paket', services: 'Layanan', reflexology: 'Refleksi', addons: 'Add-On', split_items: 'Internal Split',
};
const EMPTY_ITEM = (): BookingItemRow => ({ tempId: Date.now() + Math.random(), service_id: '', service_name: '', price: 0, duration: '', therapist_id: '' });
const EMPTY_FORM = (date = '') => ({ customer_name: '', phone: '62', booking_date: date, booking_time: '', status: 'Pending', notes: '', discount_total: 0, shared_discount_total: 0 });
const fmt = (n: number) => `Rp ${Number(n).toLocaleString('id-ID')}`;
const toMins = (t: string) => { if (!t) return 0; const [h, m] = t.split(':').map(Number); return h * 60 + m; };

export default function BookingFormModal({ open, onClose, onSaved, editBookingId, defaultDate, therapists, services, customers, isOwner }: Props) {
  const supabase = createClient();
  const [form, setForm] = useState(EMPTY_FORM(defaultDate));
  const [items, setItems] = useState<BookingItemRow[]>([EMPTY_ITEM()]);
  const [saving, setSaving] = useState(false);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const [scheduleData, setScheduleData] = useState<{ shifts: any[]; offs: any[]; bks: any[] }>({ shifts: [], offs: [], bks: [] });
  const [defaultBuffer, setDefaultBuffer] = useState(30);
  const [showNameSug, setShowNameSug] = useState(false);
  const [showPhoneSug, setShowPhoneSug] = useState(false);

  // Reset / load on open
  useEffect(() => {
    if (!open) return;
    if (editBookingId) {
      (async () => {
        const [{ data: b }, { data: bi }] = await Promise.all([
          supabase.from('bookings').select('*').eq('id', editBookingId).single(),
          supabase.from('booking_items').select('*').eq('booking_id', editBookingId).order('sort_order'),
        ]);
        if (b) setForm({ customer_name: b.customer_name ?? '', phone: b.phone ?? '62', booking_date: b.booking_date ?? '', booking_time: b.booking_time ?? '', status: b.status ?? 'Pending', notes: b.notes ?? '', discount_total: b.discount_total ?? 0, shared_discount_total: b.shared_discount_total ?? 0 });
        if (bi && bi.length > 0) setItems(bi.map((it: any, i: number) => ({ tempId: i, service_id: it.service_id ?? '', service_name: it.service_name, price: it.price, duration: it.duration ?? '', therapist_id: it.therapist_id ?? '', parent_bundle_name: it.parent_bundle_name ?? '' })));
        else setItems([EMPTY_ITEM()]);
      })();
    } else {
      setForm(EMPTY_FORM(defaultDate ?? ''));
      setItems([EMPTY_ITEM()]);
    }
    supabase.from('settings').select('value').eq('key', 'default_buffer_time').maybeSingle()
      .then(({ data }) => { if (data?.value) setDefaultBuffer(Number(data.value) || 30); });
  }, [open, editBookingId]);

  // Load day schedule when date changes
  useEffect(() => {
    if (!form.booking_date) return;
    const [y, mo, d] = form.booking_date.split('-').map(Number);
    const dW = new Date(y, mo - 1, d).getDay();
    Promise.all([
      supabase.from('therapist_shifts').select('*').eq('day_of_week', dW),
      supabase.from('therapist_timeoffs').select('*').eq('off_date', form.booking_date),
      supabase.from('booking_items').select('therapist_id, duration, bookings!inner(id, booking_time, status)').eq('bookings.booking_date', form.booking_date),
    ]).then(([{ data: s }, { data: o }, { data: b }]) => setScheduleData({ shifts: s || [], offs: o || [], bks: b || [] }));
  }, [form.booking_date]);

  // Conflict detection
  useEffect(() => {
    if (!form.booking_time) { setConflictWarning(null); return; }
    for (const item of items) {
      if (!item.therapist_id) continue;
      const tid = item.therapist_id;
      const tname = therapists.find(t => t.id === tid)?.name ?? tid;
      const off = scheduleData.offs.find(o => o.therapist_id === tid);
      if (off?.is_full_day) { setConflictWarning(`⚠️ ${tname} sedang Cuti/Libur Penuh hari ini!`); return; }
      const shift = scheduleData.shifts.find(s => s.therapist_id === tid);
      if (shift && !shift.is_working) { setConflictWarning(`⚠️ ${tname} sedang Off/Libur reguler.`); return; }
      if (shift?.break_start_time && shift?.break_end_time) {
        const bm = toMins(form.booking_time);
        if (bm >= toMins(shift.break_start_time) && bm < toMins(shift.break_end_time)) {
          setConflictWarning(`⚠️ Jam ${form.booking_time} berbenturan dengan Jam Istirahat ${tname} (${shift.break_start_time.slice(0,5)}-${shift.break_end_time.slice(0,5)}).`);
          return;
        }
      }
      const newStart = toMins(form.booking_time);
      const newDur = items.filter(i => i.therapist_id === tid && i.duration).reduce((a, i) => a + (parseInt(String(i.duration)) || 90), 0) || 90;
      const overlap = scheduleData.bks.find((b: any) => {
        if (b.therapist_id !== tid || b.bookings?.status === 'Canceled' || b.bookings?.id === editBookingId || !b.bookings?.booking_time) return false;
        const es = toMins(b.bookings.booking_time);
        const ee = es + (parseInt(String(b.duration)) || 90) + defaultBuffer; // EC#6: include buffer
        return newStart < ee && es < (newStart + newDur);
      });
      if (overlap) { setConflictWarning(`🚨 ${tname} sudah ada booking jam ${(overlap as any).bookings.booking_time.slice(0,5)} yang bertumpang tindih (termasuk buffer OTW).`); return; }
    }
    setConflictWarning(null);
  }, [items, form.booking_time, scheduleData, editBookingId, therapists, defaultBuffer]);

  // BHP
  const calcBhp = async (serviceName: string): Promise<number> => {
    const svc = services.find(s => s.name === serviceName);
    if (!svc) return 0;
    const [{ data: svcMats }, { data: globalMats }] = await Promise.all([
      supabase.from('service_materials').select('qty_multiplier, material:materials(id,pack_price,customers_per_pack,is_global)').eq('service_id', svc.id),
      supabase.from('materials').select('id, pack_price, customers_per_pack').eq('is_global', true),
    ]);
    const getMat = (r: any) => Array.isArray(r) ? r[0] ?? null : r ?? null;
    const rows = (svcMats ?? []) as any[];
    const assignedGlobal = new Set(rows.map(sm => getMat(sm.material)).filter((m: any) => m?.is_global).map((m: any) => m.id));
    let total = 0;
    for (const sm of rows) { const m = getMat(sm.material); if (m && m.customers_per_pack > 0) total += sm.qty_multiplier * (m.pack_price / m.customers_per_pack); }
    for (const gm of (globalMats ?? []) as any[]) { if (!assignedGlobal.has(gm.id) && gm.customers_per_pack > 0) total += gm.pack_price / gm.customers_per_pack; }
    return Math.round(total);
  };

  // Service selection with bundle support
  const onServiceSelect = (tempId: number, name: string) => {
    const s = services.find(x => x.name === name);
    if (!s) { setItems(prev => prev.map(i => i.tempId === tempId ? { ...i, service_name: name, service_id: '' } : i)); return; }
    if (s.is_bundle && s.bundle_child_ids?.length) {
      const children = s.bundle_child_ids.map(cid => services.find(x => x.id === cid)).filter(Boolean) as any[];
      if (children.length > 0) {
        setItems(prev => {
          const next = [...prev]; const idx = next.findIndex(i => i.tempId === tempId);
          if (idx > -1) {
            next[idx] = { ...next[idx], service_id: children[0].id, service_name: children[0].name, price: children[0].price, parent_bundle_name: s.name };
            for (let i = 1; i < children.length; i++) next.splice(idx + i, 0, { tempId: Date.now() + i, service_id: children[i].id, service_name: children[i].name, price: children[i].price, duration: children[i].estimated_duration ? String(children[i].estimated_duration) : '', therapist_id: '', parent_bundle_name: s.name });
          }
          return next;
        });
        return;
      }
    }
    setItems(prev => prev.map(i => i.tempId === tempId ? { ...i, service_id: s.id, service_name: s.name, price: s.price, parent_bundle_name: '', duration: s.estimated_duration ? String(s.estimated_duration) : '' } : i));
  };

  // Validation: therapist required for every item with a service
  const missingTherapist = items.some(i => i.service_name.trim() && !i.therapist_id);
  const canSave = !saving && !!form.customer_name && !!form.booking_date && !!form.booking_time && items.some(i => i.service_name.trim()) && !missingTherapist;

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    const valid = items.filter(i => i.service_name.trim());
    const withBhp = await Promise.all(valid.map(async it => ({ ...it, bhp: await calcBhp(it.service_name) })));
    const totalPrice = withBhp.reduce((s, i) => s + Number(i.price), 0);
    const totalBhp = withBhp.reduce((s, i) => s + i.bhp, 0);

    let phone = form.phone.replace(/\D/g, '');
    if (phone.startsWith('0')) phone = '62' + phone.substring(1);
    let customerId: string | null = null;
    if (phone && phone.length > 5) {
      const { data: cu } = await supabase.from('customers').upsert({ wa_number: phone, name: form.customer_name }, { onConflict: 'wa_number', ignoreDuplicates: true }).select('id').single();
      if (!cu) { const { data: ex } = await supabase.from('customers').select('id').eq('wa_number', phone).single(); customerId = ex?.id ?? null; }
      else customerId = cu.id;
    }

    const payload = { customer_name: form.customer_name, phone: phone || form.phone, booking_date: form.booking_date, booking_time: form.booking_time, status: form.status, notes: form.notes, service_name: withBhp.map(i => i.service_name).join(' + '), price: totalPrice, bhp_cost: totalBhp, final_price: Math.max(0, totalPrice - (form.discount_total || 0)), discount_total: form.discount_total, shared_discount_total: form.shared_discount_total, customer_id: customerId };

    let bookingId: string;
    if (editBookingId) { await supabase.from('bookings').update(payload).eq('id', editBookingId); bookingId = editBookingId; }
    else { const { data: nb } = await supabase.from('bookings').insert(payload).select('id').single(); bookingId = nb!.id; }

    await supabase.from('booking_items').delete().eq('booking_id', bookingId);
    await supabase.from('booking_items').insert(withBhp.map((item, idx) => {
      let earned = 0;
      if (form.status === 'Completed' && item.therapist_id) {
        const t = therapists.find(x => x.id === item.therapist_id);
        const pct = t?.commission_pct ?? 30;
        const sharedDiscPct = totalPrice > 0 ? (form.shared_discount_total || 0) / totalPrice : 0;
        earned = Math.round(Math.max(0, Number(item.price) * (1 - sharedDiscPct)) * pct / 100);
      }
      return { booking_id: bookingId, service_id: item.service_id || null, service_name: item.service_name, price: Number(item.price), bhp_cost: item.bhp, duration: item.duration || null, therapist_id: item.therapist_id || null, commission_earned: earned, sort_order: idx, parent_bundle_name: item.parent_bundle_name || null };
    }));

    setSaving(false);
    onSaved();
    onClose();
  };

  if (!open) return null;
  const totalPrice = items.reduce((s, i) => s + Number(i.price), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg bg-white dark:bg-zinc-900 rounded-t-2xl sm:rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl z-10 max-h-[92vh] overflow-y-auto flex flex-col">

        {/* Conflict banner */}
        {conflictWarning && (
          <div className="sticky top-0 z-30 flex items-start gap-3 px-5 py-3.5 bg-amber-50 dark:bg-amber-950/60 border-b-2 border-amber-300 dark:border-amber-700 rounded-t-2xl shadow-sm">
            <span className="text-lg shrink-0 mt-0.5">⚠️</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-amber-800 dark:text-amber-300 uppercase tracking-wider mb-0.5">Peringatan Konflik Jadwal</p>
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 leading-snug">{conflictWarning}</p>
              <p className="text-[10px] text-amber-600/70 dark:text-amber-500/60 mt-1">Booking tetap bisa disimpan, namun harap konfirmasi ulang.</p>
            </div>
          </div>
        )}

        {/* Therapist required warning */}
        {missingTherapist && (
          <div className="sticky top-0 z-20 flex items-center gap-2 px-5 py-2.5 bg-red-50 dark:bg-red-950/50 border-b border-red-200 dark:border-red-800">
            <span className="text-sm">🚫</span>
            <p className="text-xs font-semibold text-red-700 dark:text-red-400">Setiap layanan wajib di-assign ke terapis sebelum disimpan.</p>
          </div>
        )}

        <div className="p-6 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-zinc-900 dark:text-white">{editBookingId ? 'Edit Booking' : 'Tambah Booking'}</h3>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400"><X size={16} /></button>
          </div>

          {/* Customer name */}
          <div className="relative">
            <input className="admin-input" placeholder="Nama Pelanggan *" value={form.customer_name}
              onFocus={() => setShowNameSug(true)} onBlur={() => setTimeout(() => setShowNameSug(false), 200)}
              onChange={e => { setForm(f => ({ ...f, customer_name: e.target.value })); setShowNameSug(true); }} />
            {showNameSug && form.customer_name && (
              <div className="absolute z-20 w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg mt-1 max-h-40 overflow-y-auto">
                {customers.filter(c => c.name?.toLowerCase().includes(form.customer_name.toLowerCase()) && c.name?.toLowerCase() !== form.customer_name.toLowerCase()).map(c => (
                  <div key={c.id} className="px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer" onClick={() => { setForm(f => ({ ...f, customer_name: c.name, phone: c.wa_number || f.phone })); setShowNameSug(false); }}>
                    <p className="font-medium text-zinc-900 dark:text-white">{c.name}</p>
                    <p className="text-xs text-zinc-500">{c.wa_number}</p>
                  </div>
                ))}
                {customers.filter(c => c.name?.toLowerCase().includes(form.customer_name.toLowerCase()) && c.name?.toLowerCase() !== form.customer_name.toLowerCase()).length === 0 && <div className="px-3 py-2 text-xs text-zinc-400">Buat pelanggan baru</div>}
              </div>
            )}
          </div>

          {/* Phone */}
          <div className="relative">
            <input className="admin-input" placeholder="Nomor WhatsApp (62xxx)" value={form.phone}
              onFocus={() => setShowPhoneSug(true)} onBlur={() => setTimeout(() => setShowPhoneSug(false), 200)}
              onChange={e => { setForm(f => ({ ...f, phone: e.target.value })); setShowPhoneSug(true); }} />
            {showPhoneSug && form.phone && form.phone !== '62' && (
              <div className="absolute z-20 w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg mt-1 max-h-40 overflow-y-auto">
                {customers.filter(c => c.wa_number?.includes(form.phone) && c.wa_number !== form.phone).map(c => (
                  <div key={c.id} className="px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer" onClick={() => { setForm(f => ({ ...f, customer_name: c.name || f.customer_name, phone: c.wa_number })); setShowPhoneSug(false); }}>
                    <p className="font-medium text-zinc-900 dark:text-white">{c.name}</p>
                    <p className="text-xs text-zinc-500">{c.wa_number}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Service items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-zinc-500">Layanan yang Dipesan *</label>
              <button onClick={() => setItems(p => [...p, EMPTY_ITEM()])} className="text-xs text-earth-primary font-semibold hover:underline flex items-center gap-1"><Plus size={11} /> Tambah Layanan</button>
            </div>
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={item.tempId} className={`bg-zinc-50 dark:bg-zinc-800 rounded-xl p-3 border space-y-2 ${item.service_name && !item.therapist_id ? 'border-red-300 dark:border-red-700' : 'border-zinc-200 dark:border-zinc-700'}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-zinc-400 w-4">{idx + 1}</span>
                    <select className="admin-input text-xs flex-1" value={item.service_name} onChange={e => onServiceSelect(item.tempId, e.target.value)}>
                      <option value="">-- Pilih Layanan --</option>
                      {['packages','services','reflexology','addons','split_items'].map(cat => (
                        <optgroup key={cat} label={CATEGORY_LABELS[cat]}>
                          {services.filter(s => s.category === cat).map(s => <option key={s.id} value={s.name}>{s.name} — {fmt(s.price)}</option>)}
                        </optgroup>
                      ))}
                    </select>
                    {items.length > 1 && <button onClick={() => setItems(p => p.filter(i => i.tempId !== item.tempId))} className="text-red-400 hover:text-red-500 p-1 shrink-0"><X size={14} /></button>}
                  </div>
                  <div className="grid grid-cols-2 gap-2 pl-6">
                    <input className="admin-input text-xs font-mono" placeholder="Nama layanan" value={item.service_name} onChange={e => setItems(p => p.map(i => i.tempId === item.tempId ? { ...i, service_name: e.target.value } : i))} />
                    <input type="number" className="admin-input text-xs font-mono text-right" placeholder="Harga" value={item.price || ''} onChange={e => setItems(p => p.map(i => i.tempId === item.tempId ? { ...i, price: Number(e.target.value) } : i))} />
                  </div>
                  <div className="pl-6">
                    <select className={`admin-input text-xs ${item.service_name && !item.therapist_id ? 'border-red-300 dark:border-red-700' : 'border-dashed'}`}
                      value={item.therapist_id} onChange={e => setItems(p => p.map(i => i.tempId === item.tempId ? { ...i, therapist_id: e.target.value } : i))}>
                      <option value="">-- Assign Terapis (WAJIB) --</option>
                      {therapists.map(t => <option key={t.id} value={t.id}>{t.name}{isOwner ? ` (Fee ${t.commission_pct}%)` : ''}</option>)}
                    </select>
                  </div>
                </div>
              ))}
            </div>
            {items.length > 1 && (
              <div className="flex justify-between items-center mt-2 px-1">
                <span className="text-xs text-zinc-400">{items.length} layanan · 1 kunjungan</span>
                <span className="text-sm font-mono font-semibold text-earth-primary">{fmt(totalPrice)}</span>
              </div>
            )}
          </div>

          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-3">
            <input type="date" className="admin-input" value={form.booking_date} onChange={e => setForm(f => ({ ...f, booking_date: e.target.value }))} />
            <input type="time" className="admin-input" value={form.booking_time} onChange={e => setForm(f => ({ ...f, booking_time: e.target.value }))} />
          </div>

          {/* Status */}
          <select className="admin-input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          {/* Notes */}
          <textarea className="admin-input resize-none" rows={2} placeholder="Catatan (opsional)" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="admin-btn-ghost flex-1 justify-center">Batal</button>
            <button onClick={save} disabled={!canSave} className="admin-btn-primary flex-1 justify-center disabled:opacity-50">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              {editBookingId ? 'Update' : 'Simpan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
