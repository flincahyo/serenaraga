'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Share2, Image as ImageIcon, Plus, X, Download, MessageCircle, RefreshCw, Eye, EyeOff, ClipboardPaste } from 'lucide-react';
import { toPng } from 'html-to-image';
import { createClient } from '@/lib/supabase';
import { AdminSkeleton } from '@/components/admin/AdminSkeleton';

type DaySchedule = {
  id: string;
  dateStr: string;
  label: string;
  active: boolean;
  startTime: string;
  endTime: string;
  visible: boolean;
  separator: string;
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
      startTime: '10:00',
      endTime: '20:00',
      visible: true,
      separator: '-'
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

  const updateTime = (dayId: string, field: 'startTime' | 'endTime' | 'separator', value: string) => {
    setSchedules(prev => prev.map(day => 
      day.id === dayId ? { ...day, [field]: value } : day
    ));
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
        const dateNum = parts[1].trim().split(' ')[0];
        return lineLower.includes(dayName) && lineLower.includes(dateNum);
      });

      if (matchedDayIndex !== -1) {
        const matchedDay = { ...newSchedules[matchedDayIndex] };
        matchedDay.visible = true;

        if (lineLower.includes('full')) {
          matchedDay.active = false;
        } else {
          matchedDay.active = true;
          
          if (lineLower.includes('&') || lineLower.includes('dan')) {
            matchedDay.separator = '&';
          } else {
            matchedDay.separator = '-';
          }

          // Extract time using regex
          const timeRegex = /\b\d{1,2}[\.\:]\d{2}\b/g;
          const timesObj = line.match(timeRegex);

          if (timesObj && timesObj.length > 0) {
            const padTime = (t: string) => t.length === 4 ? `0${t}` : t;
            const normalized = timesObj.map(t => padTime(t.replace('.', ':')));

            if (normalized.length >= 2) {
              matchedDay.startTime = normalized[0];
              matchedDay.endTime = normalized[normalized.length - 1];
            } else if (normalized.length === 1) {
              // Only 1 time detected
              matchedDay.startTime = normalized[0];
              matchedDay.endTime = normalized[0];
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
              placeholder="Contoh Paste:&#10;Rabu, 15 April FULL&#10;Kamis, 16 April 08.00&#10;Jumat, 17 April 16.00-22.00"
              value={pasteText}
              onChange={e => setPasteText(e.target.value)}
            ></textarea>
            <p className="text-[10px] text-zinc-400 mt-2">
              Paste teks jadwal mentah dari WhatsApp atau Instagram. Sistem akan otomatis menyortir hari, jam, dan status FULL-nya.
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-between">
              <h2 className="text-sm font-semibold dark:text-white">Slot Tersedia</h2>
              <button onClick={() => setSchedules(getNextDays(7))} className="text-xs flex items-center gap-1 text-zinc-500 hover:text-earth-primary transition-colors">
                <RefreshCw size={12} /> Reset ke Awal
              </button>
            </div>

            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {schedules.map(day => (
                <div key={day.id} className={`p-4 space-y-3 transition-opacity duration-200 border-l-[3px] ${!day.visible ? 'opacity-40 bg-zinc-50/50 dark:bg-zinc-900/30 grayscale border-zinc-200' : 'border-earth-primary/50'}`}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleVisibility(day.id)}
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
                      onClick={() => toggleDay(day.id)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-200 ${day.active ? 'bg-earth-primary text-white border-earth-primary shadow-sm' : 'bg-transparent text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-earth-primary/50'}`}
                    >
                      {day.active ? 'Tersedia' : 'Set Tersedia'}
                    </button>
                  </div>

                  {day.active && (
                    <div className="flex items-center gap-2 pt-2">
                      <input type="time" value={day.startTime} onChange={e => updateTime(day.id, 'startTime', e.target.value)} className="admin-input py-1.5 text-xs font-mono w-[85px] text-center bg-white dark:bg-zinc-800" />
                      <button 
                        onClick={() => updateTime(day.id, 'separator', day.separator === '-' ? '&' : '-')}
                        className="w-6 h-6 rounded flex justify-center items-center font-black text-xs bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 transition-colors shrink-0"
                        title="Ganti pemisah jam (Sampai / Dan)"
                      >
                        {day.separator || '-'}
                      </button>
                      <input type="time" value={day.endTime} onChange={e => updateTime(day.id, 'endTime', e.target.value)} className="admin-input py-1.5 text-xs font-mono w-[85px] text-center bg-white dark:bg-zinc-800" />
                    </div>
                  )}
                </div>
              ))}
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
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3 flex items-center justify-between">
              Live Preview (9:16)
              {generating && <span className="text-earth-primary font-normal flex items-center gap-1 animate-pulse"><ImageIcon size={12} /> Rendering...</span>}
            </p>

            {/* The wrapper that scales the 1080x1920 canvas down to fit the web layout */}
            <div className="relative w-full rounded-2xl overflow-hidden shadow-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
              style={{ aspectRatio: '9/16' }}>

              <div
                className="absolute top-0 left-0 origin-top-left"
                style={{ width: '1080px', height: '1920px', transform: 'scale(calc(100% / 1080 * var(--tw-scale-x, 1)))' }}
                ref={(el) => {
                  if (el) {
                    // Update scale based on container width dynamically
                    const parentWidth = el.parentElement?.clientWidth || 0;
                    el.style.transform = `scale(${parentWidth / 1080})`;
                  }
                }}
              >
                {/* 1080x1920 Canvas Content (Dark Luxury Theme) */}
                <div
                  ref={previewRef}
                  className="w-[1080px] h-[1920px] bg-[#FAF8F5] relative flex flex-col p-12 overflow-hidden"
                  style={{
                    // Gradient overlay to make it look premium
                    backgroundImage: 'linear-gradient(145deg, #FAF8F5 0%, #EFEBE1 100%)'
                  }}
                >
                  {/* Subtle decorative circle */}
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
                  <div className="relative z-10 text-center mb-10">
                    <h2 className="text-[56px] font-bold text-[#3D2E1F] tracking-tight drop-shadow-sm">
                      Available Slots
                    </h2>
                    <p className="text-[26px] text-[#8E7962] mt-2 font-medium italic">
                      Berikut jadwal yang masih tersedia:
                    </p>
                  </div>

                  {/* Schedule Body */}
                  <div className="relative z-10 flex-1 space-y-6 ml-4">
                    {schedules.filter(d => d.visible).map(day => {
                      return (
                        <div key={`preview_${day.id}`} className="space-y-2.5">
                          <h3 className="text-3xl font-bold text-[#4A3C2D] drop-shadow-sm">{day.label}</h3>

                          <div className="flex flex-wrap gap-3">
                            {!day.active ? (
                              <div className="px-5 py-2 bg-white border border-[#E8D1A7] rounded-full flex items-center gap-2 shadow-sm">
                                <span className="text-[24px] font-bold tracking-wider text-[#C04949]">FULL</span>
                                <span className="text-[20px] text-[#D87D7D] font-medium">Booked</span>
                              </div>
                            ) : (
                              <div className="px-6 py-2 bg-gradient-to-br from-[#FFFFFF] to-[#FAF8F5] border border-[#E8D1A7] shadow-sm rounded-full flex justify-center items-center">
                                <span className="text-[26px] font-bold tracking-widest text-[#5C4836]">
                                  {day.startTime !== day.endTime ? `${day.startTime} ${day.separator || '-'} ${day.endTime}` : day.startTime}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

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

// Helper to rescale preview on window resize so it stays responsive
function DynamicScaler() {
  useEffect(() => {
    const handleResize = () => {
      // Just triggering a re-render or layout reflow is enough for the ref callback to fire
      window.dispatchEvent(new CustomEvent('re-scale-preview'));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return null;
}
