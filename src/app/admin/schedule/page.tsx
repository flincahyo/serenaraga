'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Share2, Image as ImageIcon, Download, MessageCircle, RefreshCw, Eye, EyeOff, ClipboardPaste, Calendar, Pencil, Check } from 'lucide-react';
import { toPng } from 'html-to-image';
import { createClient } from '@/lib/supabase';
import { AdminSkeleton } from '@/components/admin/AdminSkeleton';

type DaySchedule = {
  id: string;
  dateStr: string;
  label: string;
  active: boolean;
  timeText: string;
  visible: boolean;
};

const getNextDays = (count: number = 7): DaySchedule[] => {
  const days: DaySchedule[] = [];
  const today = new Date();

  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);

    // Format: "Rabu, 15 April"
    const weekday = d.toLocaleDateString('id-ID', { weekday: 'long' });
    const dayNum = d.getDate();
    const month = d.toLocaleDateString('id-ID', { month: 'long' });

    const label = `${weekday}, ${dayNum} ${month}`;
    const dateStr = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });

    days.push({
      id: `day_${i}`,
      dateStr,
      label,
      active: false,
      timeText: '10:00 - 20:00',
      visible: true,
    });
  }
  return days;
};

export default function SchedulePage() {
  const [schedules, setSchedules] = useState<DaySchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [promoNote, setPromoNote] = useState(' Dapatkan diskon spesial:\n• 5% untuk New Customer\n• 10% untuk Loyal Customer (min. 10x order)');
  const [pasteText, setPasteText] = useState('');
  const [weekMode, setWeekMode] = useState<1 | 2>(1);
  // inline canvas editing — label
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [editingLabelValue, setEditingLabelValue] = useState('');
  // inline canvas editing — time
  const [editingTimeId, setEditingTimeId] = useState<string | null>(null);
  const [editingTimeValue, setEditingTimeValue] = useState('');

  const [promos, setPromos] = useState<any[]>([]);

  const previewRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    setSchedules(getNextDays(7));

    const fetchPromos = async () => {
      const { data } = await supabase.from('discounts').select('*').eq('is_active', true);
      if (data) setPromos(data);
      setLoading(false);
    };
    fetchPromos();
  }, []);

  // When weekMode changes, regenerate days whilst preserving existing edits
  const handleWeekModeChange = (mode: 1 | 2) => {
    const newDays = getNextDays(mode === 2 ? 14 : 7);
    setWeekMode(mode);
    // Merge: keep existing edits for days that overlap
    setSchedules(prev => {
      const prevMap = new Map(prev.map(d => [d.id, d]));
      return newDays.map(d => prevMap.get(d.id) ?? d);
    });
  };

  const toggleDay = (dayId: string) => {
    setSchedules(prev => prev.map(day =>
      day.id === dayId ? { ...day, active: !day.active } : day
    ));
  };

  const toggleVisibility = (dayId: string) => {
    setSchedules(prev => prev.map(day =>
      day.id === dayId ? { ...day, visible: !day.visible } : day
    ));
  };

  const updateTimeText = (dayId: string, value: string) => {
    setSchedules(prev => prev.map(day =>
      day.id === dayId ? { ...day, timeText: value } : day
    ));
  };

  const startEditTime = (day: DaySchedule) => {
    setEditingTimeId(day.id);
    setEditingTimeValue(day.timeText);
  };

  const commitEditTime = () => {
    if (editingTimeId) {
      updateTimeText(editingTimeId, editingTimeValue.trim() || editingTimeValue);
    }
    setEditingTimeId(null);
    setEditingTimeValue('');
  };

  const updateLabel = (dayId: string, value: string) => {
    setSchedules(prev => prev.map(day =>
      day.id === dayId ? { ...day, label: value } : day
    ));
  };

  const startEditLabel = (day: DaySchedule) => {
    setEditingLabelId(day.id);
    setEditingLabelValue(day.label);
  };

  const commitEditLabel = () => {
    if (editingLabelId) {
      updateLabel(editingLabelId, editingLabelValue.trim() || editingLabelValue);
    }
    setEditingLabelId(null);
    setEditingLabelValue('');
  };

  const handleSmartPaste = () => {
    if (!pasteText.trim()) return;

    const lines = pasteText.split('\n');
    let newSchedules = [...schedules];

    // Hide all initially, we only show matched days. Default to FULL.
    newSchedules = newSchedules.map(d => ({ ...d, visible: false, active: false }));

    lines.forEach(line => {
      if (!line.trim()) return;

      const lineLower = line.toLowerCase();

      const matchedDayIndex = newSchedules.findIndex(day => {
        const parts = day.label.split(',');
        const dayName = parts[0].trim().toLowerCase();
        const dateNum = parts[1]?.trim().split(' ')[0];
        return lineLower.includes(dayName) && dateNum && lineLower.includes(dateNum);
      });

      if (matchedDayIndex !== -1) {
        const matchedDay = { ...newSchedules[matchedDayIndex] };
        matchedDay.visible = true;

        if (lineLower.includes('full')) {
          matchedDay.active = false;
          matchedDay.timeText = '10:00 - 20:00';
        } else {
          matchedDay.active = true;

          const sep = (lineLower.includes('&') || lineLower.includes('dan')) ? '&' : '-';

          // Extract time using regex
          const timeRegex = /\b\d{1,2}[.:]\d{2}\b/g;
          const timesObj = line.match(timeRegex);

          if (timesObj && timesObj.length > 0) {
            const padTime = (t: string) => t.length === 4 ? `0${t}` : t;
            const normalized = timesObj.map(t => padTime(t.replace('.', ':')));

            if (normalized.length >= 2) {
              matchedDay.timeText = `${normalized[0]} ${sep} ${normalized[normalized.length - 1]}`;
            } else {
              matchedDay.timeText = normalized[0];
            }
          }
        }
        newSchedules[matchedDayIndex] = matchedDay;
      }
    });

    setSchedules(newSchedules);
    setPasteText(''); // Clear after successful paste
  };

  const generateImage = async (action: 'download' | 'share') => {
    if (!previewRef.current) return;
    // Commit any open edits before generating
    if (editingLabelId) commitEditLabel();
    if (editingTimeId) commitEditTime();
    setGenerating(true);

    try {
      const dataUrl = await toPng(previewRef.current, {
        quality: 0.95,
        width: 1080,
        height: 1920,
        cacheBust: true,
        style: { transform: 'scale(1)', transformOrigin: 'top left' }
      });

      if (action === 'download') {
        const link = document.createElement('a');
        link.download = `Jadwal_SerenaRaga_${new Date().toISOString().slice(0, 10)}.png`;
        link.href = dataUrl;
        link.click();
      } else if (action === 'share') {
        try {
          const blob = await (await fetch(dataUrl)).blob();
          const file = new File([blob], 'jadwal.png', { type: 'image/png' });
          if (navigator.share) {
            await navigator.share({
              title: 'Jadwal SerenaRaga',
              files: [file]
            });
          } else {
            alert('Browser Anda tidak mendukung fitur native share. Gambar akan diunduh sebagai gantinya.');
            generateImage('download');
          }
        } catch (e) {
          console.error("Share failed", e);
        }
      }
    } catch (error) {
      console.error('Error generating image', error);
      alert('Gagal menghasilkan gambar');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <AdminSkeleton rows={5} />;

  const visibleSchedules = schedules.filter(d => d.visible);


  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
          <Share2 className="text-earth-primary" /> Share Jadwal
        </h1>
        <p className="text-sm text-zinc-500 mt-1">Atur ketersediaan jadwal dan hasilkan gambar untuk IG/WA Story.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* LEFT PANEL: Editor */}
        <div className="lg:col-span-3 space-y-5">
          {/* Smart Paste Block */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden p-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-sm font-semibold dark:text-white flex items-center gap-2">
                <ClipboardPaste size={16} className="text-earth-primary" /> Smart Paste
              </h2>
              <button onClick={handleSmartPaste} disabled={!pasteText.trim()} className="admin-btn-primary text-xs py-1.5 px-3 disabled:opacity-50">
                Auto Format
              </button>
            </div>
            <textarea
              className="admin-input h-28 text-xs font-mono resize-none w-full bg-zinc-50 dark:bg-zinc-800/50"
              placeholder={`Contoh Paste:\nRabu, 15 April FULL\nKamis, 16 April 08.00\nJumat, 17 April 16.00-22.00`}
              value={pasteText}
              onChange={e => setPasteText(e.target.value)}
            ></textarea>
            <p className="text-[10px] text-zinc-400 mt-2">
              Paste teks jadwal mentah dari WhatsApp atau Instagram. Sistem akan otomatis menyortir hari, jam, dan status FULL-nya.
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold dark:text-white shrink-0">Slot Tersedia</h2>

              {/* Week Mode Toggle */}
              <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
                <button
                  onClick={() => handleWeekModeChange(1)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${weekMode === 1 ? 'bg-white dark:bg-zinc-700 shadow text-earth-primary' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                >
                  <Calendar size={12} /> 1 Minggu
                </button>
                <button
                  onClick={() => handleWeekModeChange(2)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${weekMode === 2 ? 'bg-white dark:bg-zinc-700 shadow text-earth-primary' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                >
                  <Calendar size={12} /> 2 Minggu
                </button>
              </div>

              <button onClick={() => { setSchedules(getNextDays(weekMode === 2 ? 14 : 7)); }} className="text-xs flex items-center gap-1 text-zinc-500 hover:text-earth-primary transition-colors shrink-0">
                <RefreshCw size={12} /> Reset
              </button>
            </div>

            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {/* Week 1 group header when 2-week mode */}
              {weekMode === 2 && (
                <div className="px-4 py-2 bg-earth-primary/5 border-b border-earth-primary/10">
                  <p className="text-[11px] font-bold text-earth-primary uppercase tracking-widest">Minggu 1</p>
                </div>
              )}
              {schedules.slice(0, 7).map(day => (
                <DayRow
                  key={day.id}
                  day={day}
                  onToggleVisibility={toggleVisibility}
                  onToggleDay={toggleDay}
                />
              ))}

              {/* Week 2 */}
              {weekMode === 2 && (
                <>
                  <div className="px-4 py-2 bg-earth-primary/5 border-b border-earth-primary/10">
                    <p className="text-[11px] font-bold text-earth-primary uppercase tracking-widest">Minggu 2</p>
                  </div>
                  {schedules.slice(7, 14).map(day => (
                    <DayRow
                      key={day.id}
                      day={day}
                      onToggleVisibility={toggleVisibility}
                      onToggleDay={toggleDay}
                    />
                  ))}
                </>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-semibold dark:text-white">Custom Note / Promo</h2>
              {promos.length > 0 && (
                <select
                  className="admin-input py-1 text-xs w-48 bg-zinc-50 font-medium text-earth-primary"
                  onChange={e => {
                    const p = promos.find((x: any) => x.id === e.target.value);
                    if (p) {
                      const valStr = p.value_type === 'percentage' ? `${p.value}%` : `Rp ${p.value.toLocaleString('id-ID')}`;
                      setPromoNote(`✨ ${p.name}\n${p.description ? `• ${p.description}\n` : ''}• Diskon: ${valStr}`);
                    }
                  }}
                  defaultValue=""
                >
                  <option value="" disabled>Pilih Promo...</option>
                  {promos.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              )}
            </div>
            <textarea
              className="admin-input resize-none h-24"
              value={promoNote}
              onChange={(e) => setPromoNote(e.target.value)}
              placeholder="Kosongkan jika tidak ada notes."
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => generateImage('download')}
              disabled={generating}
              className="flex-1 admin-btn-primary justify-center py-2.5"
            >
              <Download size={16} /> Unduh PNG
            </button>
            <button
              onClick={() => generateImage('share')}
              disabled={generating}
              className="flex-1 admin-btn-ghost bg-zinc-100 dark:bg-zinc-800 justify-center py-2.5"
            >
              <MessageCircle size={16} /> Share WA/IG
            </button>
          </div>
        </div>

        {/* RIGHT PANEL: Live Preview */}
        <div className="lg:col-span-2">
          <div className="sticky top-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide flex items-center gap-2">
                Live Preview (9:16)
                {generating && <span className="text-earth-primary font-normal flex items-center gap-1 animate-pulse"><ImageIcon size={12} /> Rendering...</span>}
              </p>
              <p className="text-[10px] text-zinc-400 flex items-center gap-1">
                <Pencil size={10} /> Klik tanggal / jam untuk edit
              </p>
            </div>

            {/* The wrapper that scales the 1080x1920 canvas down to fit the web layout */}
            <div className="relative w-full rounded-2xl overflow-hidden shadow-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
              style={{ aspectRatio: '9/16' }}>

              <div
                className="absolute top-0 left-0 origin-top-left"
                style={{ width: '1080px', height: '1920px', transform: 'scale(calc(100% / 1080 * var(--tw-scale-x, 1)))' }}
                ref={(el) => {
                  if (el) {
                    const parentWidth = el.parentElement?.clientWidth || 0;
                    el.style.transform = `scale(${parentWidth / 1080})`;
                  }
                }}
              >
                {/* 1080x1920 Canvas Content */}
                <div
                  ref={previewRef}
                  className="w-[1080px] h-[1920px] bg-[#FAF8F5] relative flex flex-col p-12 overflow-hidden"
                  style={{
                    backgroundImage: 'linear-gradient(145deg, #FAF8F5 0%, #EFEBE1 100%)'
                  }}
                >
                  {/* Subtle decorative circles */}
                  <div className="absolute -top-[200px] -right-[200px] w-[800px] h-[800px] rounded-full bg-[#D2B48C]/30 blur-[150px] pointer-events-none" />
                  <div className="absolute -bottom-[300px] -left-[200px] w-[900px] h-[900px] rounded-full bg-[#E8D1A7]/40 blur-[150px] pointer-events-none" />

                  {/* Header */}
                  <div className="relative z-10 flex flex-col items-center justify-center mt-6 mb-4 h-[180px]">
                    <img
                      src="/serenalogo.svg"
                      alt="SerenaRaga"
                      className="absolute h-[700px] w-auto object-contain max-w-none"
                      crossOrigin="anonymous"
                    />
                  </div>

                  <div className="relative z-10 w-full h-px bg-gradient-to-r from-transparent via-[#DCD3C6] to-transparent mb-8" />

                  {/* Title */}
                  <div className="relative z-10 text-center mb-8">
                    <h2 className="text-[56px] font-bold text-[#3D2E1F] tracking-tight drop-shadow-sm">
                      Available Slots
                    </h2>
                    <p className="text-[26px] text-[#8E7962] mt-2 font-medium italic">
                      Berikut jadwal yang masih tersedia:
                    </p>
                  </div>

                  {/* Schedule Body */}
                  {weekMode === 1 ? (
                    // Single week layout
                    <div className="relative z-10 flex-1 space-y-5 ml-4">
                      {visibleSchedules.map(day => (
                        <CanvasDayRow
                          key={`preview_${day.id}`}
                          day={day}
                          editingLabelId={editingLabelId}
                          editingLabelValue={editingLabelValue}
                          onStartEditLabel={startEditLabel}
                          onLabelChange={setEditingLabelValue}
                          onCommitLabel={commitEditLabel}
                          editingTimeId={editingTimeId}
                          editingTimeValue={editingTimeValue}
                          onStartEditTime={startEditTime}
                          onTimeChange={setEditingTimeValue}
                          onCommitTime={commitEditTime}
                          fontSize="text-3xl"
                          timeFontSize="text-[26px]"
                        />
                      ))}
                    </div>
                  ) : (
                    // Two week layout: side-by-side columns
                    <div className="relative z-10 flex-1 flex gap-6">
                      {/* Week 1 column */}
                      <div className="flex-1 flex flex-col">
                        <div className="space-y-5">
                          {schedules.slice(0, 7).filter(d => d.visible).map(day => (
                            <CanvasDayRow
                              key={`preview_${day.id}`}
                              day={day}
                              editingLabelId={editingLabelId}
                              editingLabelValue={editingLabelValue}
                              onStartEditLabel={startEditLabel}
                              onLabelChange={setEditingLabelValue}
                              onCommitLabel={commitEditLabel}
                              editingTimeId={editingTimeId}
                              editingTimeValue={editingTimeValue}
                              onStartEditTime={startEditTime}
                              onTimeChange={setEditingTimeValue}
                              onCommitTime={commitEditTime}
                              fontSize="text-3xl"
                              timeFontSize="text-[26px]"
                            />
                          ))}
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="w-px bg-gradient-to-b from-transparent via-[#DCD3C6] to-transparent self-stretch" />

                      {/* Week 2 column */}
                      <div className="flex-1 flex flex-col">
                        <div className="space-y-5">
                          {schedules.slice(7, 14).filter(d => d.visible).map(day => (
                            <CanvasDayRow
                              key={`preview_${day.id}`}
                              day={day}
                              editingLabelId={editingLabelId}
                              editingLabelValue={editingLabelValue}
                              onStartEditLabel={startEditLabel}
                              onLabelChange={setEditingLabelValue}
                              onCommitLabel={commitEditLabel}
                              editingTimeId={editingTimeId}
                              editingTimeValue={editingTimeValue}
                              onStartEditTime={startEditTime}
                              onTimeChange={setEditingTimeValue}
                              onCommitTime={commitEditTime}
                              fontSize="text-3xl"
                              timeFontSize="text-[26px]"
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Promo Box */}
                  {promoNote && (
                    <div className="relative z-10 mt-auto mb-6 w-full p-6 rounded-[24px] bg-gradient-to-br from-[#E8D1A7] to-[#C9AB75] shadow-xl overflow-hidden border border-[#F2D7A5]/50">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-white/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 mix-blend-overlay pointer-events-none" />
                      <div className="relative z-10 text-[#543310] text-2xl leading-snug font-medium whitespace-pre-wrap">
                        {promoNote}
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="relative z-10 text-center pt-5 border-t border-[#DCD3C6] pb-2">
                    <p className="text-2xl font-medium text-[#8E7962]">
                      Reply untuk mengamankan slot Anda
                    </p>
                  </div>

                </div>
              </div>
            </div>
            {/* Realtime Scaling handler */}
            <DynamicScaler />
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function DayRow({
  day,
  onToggleVisibility,
  onToggleDay,
}: {
  day: DaySchedule;
  onToggleVisibility: (id: string) => void;
  onToggleDay: (id: string) => void;
}) {
  return (
    <div className={`p-4 space-y-3 transition-opacity duration-200 border-l-[3px] ${!day.visible ? 'opacity-40 bg-zinc-50/50 dark:bg-zinc-900/30 grayscale border-zinc-200' : 'border-earth-primary/50'}`}>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onToggleVisibility(day.id)}
            className="p-1.5 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 transition-colors"
            title={day.visible ? "Sembunyikan tanggal ini" : "Tampilkan tanggal ini"}
          >
            {day.visible ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
          <p className={`font-semibold text-sm flex items-center gap-2 ${!day.visible ? 'text-zinc-500' : 'dark:text-white'}`}>
            {day.label}
            {!day.active && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold tracking-wider">FULL</span>}
          </p>
        </div>
        <button
          onClick={() => onToggleDay(day.id)}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-200 ${day.active ? 'bg-earth-primary text-white border-earth-primary shadow-sm' : 'bg-transparent text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-earth-primary/50'}`}
        >
          {day.active ? 'Tersedia' : 'Set Tersedia'}
        </button>
      </div>

    </div>
  );
}

function CanvasDayRow({
  day,
  editingLabelId,
  editingLabelValue,
  onStartEditLabel,
  onLabelChange,
  onCommitLabel,
  editingTimeId,
  editingTimeValue,
  onStartEditTime,
  onTimeChange,
  onCommitTime,
  fontSize,
  timeFontSize,
}: {
  day: DaySchedule;
  editingLabelId: string | null;
  editingLabelValue: string;
  onStartEditLabel: (day: DaySchedule) => void;
  onLabelChange: (val: string) => void;
  onCommitLabel: () => void;
  editingTimeId: string | null;
  editingTimeValue: string;
  onStartEditTime: (day: DaySchedule) => void;
  onTimeChange: (val: string) => void;
  onCommitTime: () => void;
  fontSize: string;
  timeFontSize: string;
}) {
  const isEditingLabel = editingLabelId === day.id;
  const isEditingTime = editingTimeId === day.id;
  const labelInputRef = useRef<HTMLInputElement>(null);
  const timeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingLabel && labelInputRef.current) {
      labelInputRef.current.focus();
      labelInputRef.current.select();
    }
  }, [isEditingLabel]);

  useEffect(() => {
    if (isEditingTime && timeInputRef.current) {
      timeInputRef.current.focus();
      timeInputRef.current.select();
    }
  }, [isEditingTime]);

  return (
    <div className="space-y-2.5">
      {/* Label (tanggal) */}
      {isEditingLabel ? (
        <div className="flex items-center gap-2">
          <input
            ref={labelInputRef}
            value={editingLabelValue}
            onChange={e => onLabelChange(e.target.value)}
            onBlur={onCommitLabel}
            onKeyDown={e => { if (e.key === 'Enter') onCommitLabel(); if (e.key === 'Escape') onCommitLabel(); }}
            className={`${fontSize} font-bold text-[#4A3C2D] bg-transparent border-b-2 border-[#C9AB75] outline-none flex-1 min-w-0`}
            style={{ fontFamily: 'inherit' }}
          />
          <button
            onMouseDown={e => { e.preventDefault(); onCommitLabel(); }}
            className="flex-shrink-0 w-8 h-8 rounded-full bg-[#C9AB75] flex items-center justify-center text-white hover:bg-[#B89A60] transition-colors"
          >
            <Check size={14} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => onStartEditLabel(day)}
          className="group flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
          title="Klik untuk edit tanggal"
        >
          <h3 className={`${fontSize} font-bold text-[#4A3C2D] drop-shadow-sm text-left`}>{day.label}</h3>
          <Pencil size={16} className="text-[#C9AB75] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
        </button>
      )}

      {/* Time / FULL badge */}
      <div className="flex flex-wrap gap-2">
        {!day.active ? (
          <div className="px-5 py-2 bg-white border border-[#E8D1A7] rounded-full flex items-center gap-2 shadow-sm">
            <span className="text-[24px] font-bold tracking-wider text-[#C04949]">FULL</span>
            <span className="text-[20px] text-[#D87D7D] font-medium">Booked</span>
          </div>
        ) : isEditingTime ? (
          <div className="flex items-center gap-2">
            <input
              ref={timeInputRef}
              value={editingTimeValue}
              onChange={e => onTimeChange(e.target.value)}
              onBlur={onCommitTime}
              onKeyDown={e => { if (e.key === 'Enter') onCommitTime(); if (e.key === 'Escape') onCommitTime(); }}
              className={`${timeFontSize} font-bold tracking-widest text-[#5C4836] bg-transparent border-b-2 border-[#C9AB75] outline-none min-w-0 w-64`}
              placeholder="mis: 10:00 - 20:00"
              style={{ fontFamily: 'inherit' }}
            />
            <button
              onMouseDown={e => { e.preventDefault(); onCommitTime(); }}
              className="flex-shrink-0 w-8 h-8 rounded-full bg-[#C9AB75] flex items-center justify-center text-white hover:bg-[#B89A60] transition-colors"
            >
              <Check size={14} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => onStartEditTime(day)}
            className="group flex items-center gap-2 cursor-pointer"
            title="Klik untuk edit jam"
          >
            <div className="px-6 py-2 bg-gradient-to-br from-[#FFFFFF] to-[#FAF8F5] border border-[#E8D1A7] shadow-sm rounded-full flex items-center gap-2 group-hover:border-[#C9AB75] transition-colors">
              <span className={`${timeFontSize} font-bold tracking-widest text-[#5C4836]`}>
                {day.timeText}
              </span>
              <Pencil size={14} className="text-[#C9AB75] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </div>
          </button>
        )}
      </div>
    </div>
  );
}

// Helper to rescale preview on window resize so it stays responsive
function DynamicScaler() {
  useEffect(() => {
    const handleResize = () => {
      window.dispatchEvent(new CustomEvent('re-scale-preview'));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return null;
}
