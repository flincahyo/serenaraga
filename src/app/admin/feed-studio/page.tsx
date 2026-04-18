'use client';
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Sparkles, Download, CheckCircle2, Wand2, Globe, Upload, Pencil, Plus, Trash2, Type, X, ChevronDown, ChevronUp } from 'lucide-react';
import * as htmlToImage from 'html-to-image';

/* ═══════════════════════════════════════
   TYPES
═══════════════════════════════════════ */
type Theme = 'aura' | 'zen' | 'editorial' | 'quote' | 'promo' | 'mythfact' | 'testimonial' | 'gradient' | 'minimal' | 'boldoverlay' | 'softpastel' | 'benefits' | 'luxurygold' | 'carousel' | 'announcement' | 'nightvibe' | 'earthy' | 'portrait' | 'pricelist' | 'dualtone' | 'collage';

interface TextLayer {
  id: string;
  text: string;
  posX: number; // canvas px (0-1080)
  posY: number; // canvas px (0-1350)
  fontSize: number;
  fontId: string;
  color: string;
  textAlign: 'left' | 'center' | 'right';
  maxWidth: number;
}

interface DragState {
  id: string;
  startX: number; startY: number;
  origPosX: number; origPosY: number;
  elemW: number; // canvas px — element rendered width
  elemH: number; // canvas px — element rendered height
}

/* ═══════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════ */
const SCALE = 0.3703;

const THEMES: { id: Theme; label: string }[] = [
  { id: 'aura',         label: 'Aura' },
  { id: 'zen',          label: 'Zen' },
  { id: 'editorial',    label: 'Editorial' },
  { id: 'quote',        label: 'Quote' },
  { id: 'promo',        label: 'Promo' },
  { id: 'mythfact',     label: 'Mitos/Fakta' },
  { id: 'testimonial',  label: 'Testimoni' },
  { id: 'gradient',     label: 'Gradient' },
  { id: 'minimal',      label: 'Minimal' },
  { id: 'boldoverlay',  label: 'Bold Text' },
  { id: 'softpastel',   label: 'Soft Pastel' },
  { id: 'benefits',     label: 'Manfaat' },
  { id: 'luxurygold',   label: 'Luxury Gold' },
  { id: 'carousel',     label: 'Carousel' },
  { id: 'announcement', label: 'Pengumuman' },
  { id: 'nightvibe',    label: 'Night Vibe' },
  { id: 'earthy',       label: 'Earthy' },
  { id: 'portrait',     label: 'Portrait' },
  { id: 'pricelist',    label: 'Price List' },
  { id: 'dualtone',     label: 'Dual Tone' },
  { id: 'collage',      label: 'Collage' },
];

const FONTS: { id: string; name: string; style: React.CSSProperties }[] = [
  { id: 'serif-italic', name: 'Serif Italic', style: { fontFamily: 'Georgia, serif', fontStyle: 'italic' } },
  { id: 'serif-bold',   name: 'Serif Bold',   style: { fontFamily: 'Georgia, serif', fontWeight: '900' } },
  { id: 'sans-clean',   name: 'Sans Clean',   style: { fontFamily: 'system-ui, sans-serif', fontWeight: '400' } },
  { id: 'sans-bold',    name: 'Sans Bold',    style: { fontFamily: 'system-ui, sans-serif', fontWeight: '900' } },
  { id: 'wide-caps',    name: 'Wide Caps',    style: { fontFamily: 'system-ui, sans-serif', fontWeight: '300', letterSpacing: '0.4em', textTransform: 'uppercase' } as React.CSSProperties },
  { id: 'mono',         name: 'Monospace',    style: { fontFamily: "'Courier New', monospace", letterSpacing: '0.05em' } },
  { id: 'gold-serif',   name: 'Gold Serif',   style: { fontFamily: 'Georgia, serif', fontWeight: '400', letterSpacing: '0.1em' } },
];

// Recommended font IDs per template
const TEMPLATE_FONTS: Record<Theme, string[]> = {
  aura: ['serif-italic', 'wide-caps', 'serif-bold'],
  zen: ['serif-italic', 'sans-clean', 'wide-caps'],
  editorial: ['sans-bold', 'mono', 'wide-caps'],
  quote: ['serif-italic', 'serif-bold', 'sans-clean'],
  promo: ['serif-bold', 'sans-bold', 'wide-caps'],
  mythfact: ['sans-bold', 'sans-clean', 'mono'],
  testimonial: ['serif-italic', 'sans-clean', 'wide-caps'],
  gradient: ['serif-italic', 'wide-caps', 'serif-bold'],
  minimal: ['serif-italic', 'sans-clean', 'wide-caps'],
  boldoverlay: ['sans-bold', 'serif-bold', 'wide-caps'],
  softpastel: ['serif-italic', 'sans-clean', 'gold-serif'],
  benefits: ['sans-bold', 'sans-clean', 'mono'],
  luxurygold: ['gold-serif', 'wide-caps', 'serif-italic'],
  carousel: ['sans-bold', 'mono', 'wide-caps'],
  announcement: ['sans-bold', 'serif-bold', 'wide-caps'],
  nightvibe: ['serif-italic', 'wide-caps', 'sans-bold'],
  earthy: ['serif-italic', 'sans-clean', 'gold-serif'],
  portrait: ['serif-italic', 'wide-caps', 'serif-bold'],
  pricelist: ['sans-bold', 'sans-clean', 'wide-caps'],
  dualtone: ['serif-italic', 'sans-bold', 'wide-caps'],
  collage: ['serif-italic', 'sans-bold', 'sans-clean'],
};

const WA_PATH = "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z";

/* ═══════════════════════════════════════
   MINI PREVIEW THUMBNAILS
═══════════════════════════════════════ */
function MiniPreview({ id }: { id: Theme }) {
  const L = ({ w = 'w-3/4', h = 'h-[3px]', c = 'bg-white/40', x = '' }: { w?: string; h?: string; c?: string; x?: string }) =>
    <div className={`${h} ${w} ${c} rounded-full ${x}`} />;

  const templates: Record<Theme, React.ReactNode> = {
    aura: (
      <div className="w-full h-full relative bg-zinc-800 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/95" />
        <div className="absolute top-[8%] left-0 right-0 flex justify-center"><L w="w-[55%]" /></div>
        <div className="absolute top-[43%] left-0 right-0 flex flex-col items-center gap-[3px] px-3">
          <L w="w-[40%]" h="h-[2px]" c="bg-white/30" /><L w="w-[70%]" h="h-[5px]" /><L w="w-[55%]" h="h-[7px]" c="bg-[#f5dfb8]/70" />
        </div>
        <div className="absolute bottom-[6%] left-0 right-0 flex justify-center gap-2"><div className="h-[5px] w-[28%] bg-white/20 rounded-full" /><div className="h-[5px] w-[28%] bg-white/20 rounded-full" /></div>
      </div>
    ),
    zen: (
      <div className="w-full h-full flex flex-col bg-stone-100 overflow-hidden">
        <div className="flex-[0_0_55%] bg-stone-400 relative">
          <div className="absolute bottom-0 left-0 right-0 h-[30%] bg-gradient-to-t from-stone-100 to-transparent" />
          <div className="absolute top-[25%] left-0 right-0 flex justify-center"><L w="w-[45%]" h="h-[2px]" c="bg-white/60" /></div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-[3px] px-3">
          <L w="w-[40%]" h="h-[2px]" c="bg-[#8b5e3c]/50" /><L w="w-[65%]" h="h-[4px]" c="bg-zinc-500/50" /><L w="w-[50%]" h="h-[4px]" c="bg-[#8b5e3c]/60" />
          <div className="mt-2 flex gap-1"><div className="h-[4px] w-[30%] bg-zinc-300 rounded-full" /><div className="h-[4px] w-[30%] bg-zinc-300 rounded-full" /></div>
        </div>
      </div>
    ),
    editorial: (
      <div className="w-full h-full bg-white overflow-hidden p-[6%]">
        <div className="w-full h-full border-[2px] border-zinc-700 flex flex-col overflow-hidden">
          <div className="border-b-[2px] border-zinc-700 px-[8%] py-[5%] flex justify-between items-center"><L w="w-[40%]" h="h-[2px]" c="bg-zinc-400" /><L w="w-[20%]" h="h-[2px]" c="bg-zinc-300" /></div>
          <div className="flex-1 flex overflow-hidden">
            <div className="w-[42%] border-r-[2px] border-zinc-700 p-[6%] flex flex-col justify-end gap-[3px]"><L w="w-full" h="h-[3px]" c="bg-zinc-600" /><L w="w-[80%]" h="h-[6px]" c="bg-[#8b5e3c]/60" /></div>
            <div className="flex-1 bg-zinc-300" />
          </div>
          <div className="border-t-[2px] border-zinc-700 py-[4%] flex justify-center gap-1"><div className="h-[3px] w-[25%] bg-zinc-300 rounded-full" /><div className="h-[3px] w-[25%] bg-zinc-300 rounded-full" /></div>
        </div>
      </div>
    ),
    quote: (
      <div className="w-full h-full flex flex-col bg-[#fdf8f2] overflow-hidden">
        <div className="flex-[0_0_48%] bg-stone-400 relative"><div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#fdf8f2]" /><div className="absolute top-[22%] left-0 right-0 flex justify-center"><L w="w-[42%]" h="h-[2px]" c="bg-white/60" /></div></div>
        <div className="flex-1 flex flex-col items-center justify-center px-2 gap-[3px] pb-[10%]">
          <div className="text-[18px] text-[#8b5e3c]/25 font-serif leading-none">"</div>
          <L w="w-[78%]" h="h-[2px]" c="bg-zinc-400/50" /><L w="w-[68%]" h="h-[2px]" c="bg-zinc-400/40" />
        </div>
        <div className="pb-[6%] flex justify-center gap-1"><div className="h-[3px] w-[25%] bg-[#8b5e3c]/30 rounded-full" /><div className="h-[3px] w-[25%] bg-[#8b5e3c]/30 rounded-full" /></div>
      </div>
    ),
    promo: (
      <div className="w-full h-full flex flex-col overflow-hidden">
        <div className="flex-[0_0_50%] bg-stone-400 relative"><div className="absolute top-[22%] left-0 right-0 flex justify-center"><L w="w-[42%]" h="h-[2px]" c="bg-white/60" /></div></div>
        <div className="flex-1 bg-[#8b5e3c] flex flex-col items-center justify-center gap-[3px] px-2"><L w="w-[40%]" h="h-[2px]" c="bg-white/40" /><L w="w-[65%]" h="h-[4px]" c="bg-white/70" /><L w="w-[55%]" h="h-[6px]" c="bg-[#f5dfb8]/70" /></div>
      </div>
    ),
    mythfact: (
      <div className="w-full h-full flex flex-col bg-zinc-900 overflow-hidden">
        <div className="flex-[0_0_35%] bg-zinc-700 relative"><div className="absolute inset-0 bg-zinc-900/60" /><div className="absolute top-[22%] left-0 right-0 flex justify-center"><L w="w-[42%]" h="h-[2px]" /></div></div>
        <div className="flex-1 flex flex-col justify-center px-[8%] gap-[5px]">
          <div className="bg-red-900/40 border border-red-500/30 rounded-[3px] p-[5%] flex gap-[4px] items-center"><div className="w-[8px] h-[8px] bg-red-500/60 rounded-sm flex-shrink-0" /><L w="w-full" h="h-[2px]" c="bg-white/30" /></div>
          <div className="bg-green-900/40 border border-green-500/30 rounded-[3px] p-[5%] flex gap-[4px] items-center"><div className="w-[8px] h-[8px] bg-green-500/60 rounded-sm flex-shrink-0" /><L w="w-full" h="h-[2px]" c="bg-white/30" /></div>
        </div>
      </div>
    ),
    testimonial: (
      <div className="w-full h-full flex flex-col bg-[#f5ede4] overflow-hidden">
        <div className="flex-[0_0_40%] bg-stone-400 relative">
          <div className="absolute inset-0 bg-[#8b5e3c]/30" />
          <div className="absolute top-[22%] left-0 right-0 flex justify-center"><L w="w-[40%]" h="h-[2px]" c="bg-white/60" /></div>
          <div className="absolute bottom-[15%] left-0 right-0 flex justify-center gap-[2px]">{[...Array(5)].map((_,i)=><div key={i} className="text-yellow-400 text-[6px]">★</div>)}</div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-2 gap-[3px]">
          <div className="text-[12px] text-[#8b5e3c]/20 font-serif leading-none">"</div>
          <L w="w-[72%]" h="h-[2px]" c="bg-zinc-400/50" /><L w="w-[62%]" h="h-[2px]" c="bg-zinc-400/40" />
        </div>
      </div>
    ),
    gradient: (
      <div className="w-full h-full relative overflow-hidden" style={{background:'linear-gradient(135deg,#92400e 0%,#44403c 60%,#000 100%)'}}>
        <div className="absolute top-[8%] left-0 right-0 flex justify-center"><L w="w-[50%]" /></div>
        <div className="absolute top-[38%] left-0 right-0 flex flex-col items-center gap-[3px] px-3">
          <div className="bg-white/10 border border-[#f5dfb8]/20 rounded-full px-2 py-[1%] flex justify-center mb-1"><L w="w-[40%]" h="h-[2px]" c="bg-[#f5dfb8]/50" /></div>
          <L w="w-[68%]" h="h-[4px]" /><L w="w-[54%]" h="h-[7px]" c="bg-[#f5dfb8]/60" />
        </div>
        <div className="absolute bottom-[6%] left-0 right-0 flex justify-center gap-2"><div className="h-[4px] w-[27%] bg-white/20 rounded-full" /><div className="h-[4px] w-[27%] bg-white/20 rounded-full" /></div>
      </div>
    ),
    minimal: (
      <div className="w-full h-full bg-white flex flex-col overflow-hidden">
        <div className="pt-[8%] flex justify-center"><L w="w-[50%]" h="h-[2px]" c="bg-zinc-400" /></div>
        <div className="flex justify-center my-[5%]"><div className="w-[40%] aspect-square rounded-full bg-stone-300 border-2 border-white shadow" /></div>
        <div className="flex items-center gap-1 px-[8%] mb-[3%]"><div className="flex-1 h-[1px] bg-zinc-200" /><L w="w-[20%]" h="h-[2px]" c="bg-[#8b5e3c]/40" /><div className="flex-1 h-[1px] bg-zinc-200" /></div>
        <div className="flex flex-col items-center gap-[3px] px-[8%]"><L w="w-[68%]" h="h-[3px]" c="bg-zinc-500" /><L w="w-[52%]" h="h-[4px]" c="bg-[#8b5e3c]/50" /></div>
        <div className="mt-auto border-t border-zinc-100 py-[5%] flex justify-center gap-1"><div className="h-[3px] w-[26%] bg-zinc-200 rounded-full" /><div className="h-[3px] w-[26%] bg-zinc-200 rounded-full" /></div>
      </div>
    ),
    boldoverlay: (
      <div className="w-full h-full relative bg-zinc-700 overflow-hidden">
        <div className="absolute inset-0 bg-zinc-900/50" />
        <div className="absolute top-[8%] left-[8%]"><L w="w-[42%]" h="h-[2px]" /></div>
        <div className="absolute top-[38%] left-[8%] right-[5%] flex flex-col gap-[3px]">
          <L w="w-[85%]" h="h-[9px]" c="bg-white/80" /><L w="w-[70%]" h="h-[9px]" c="bg-white/80" />
          <div className="w-[30%] h-[3px] bg-[#8b5e3c] rounded-full my-1" />
          <L w="w-[65%]" h="h-[4px]" c="bg-[#f5dfb8]/60" />
        </div>
        <div className="absolute bottom-[6%] left-0 right-0 flex justify-center gap-2"><div className="h-[4px] w-[27%] bg-white/20 rounded-full" /><div className="h-[4px] w-[27%] bg-white/20 rounded-full" /></div>
      </div>
    ),
    softpastel: (
      <div className="w-full h-full flex flex-col overflow-hidden" style={{background:'linear-gradient(160deg,#fdf6f0,#f5e0d0)'}}>
        <div className="pt-[8%] flex justify-center"><L w="w-[50%]" h="h-[2px]" c="bg-[#8b5e3c]/40" /></div>
        <div className="flex justify-center my-[5%]"><div className="w-[42%] aspect-square rounded-full bg-stone-300 border-[3px] border-white/80 shadow-lg" /></div>
        <div className="flex flex-col items-center gap-[3px] px-[8%]"><L w="w-[38%]" h="h-[2px]" c="bg-[#8b5e3c]/50" /><L w="w-[68%]" h="h-[4px]" c="bg-[#5c3d2e]/50" /><L w="w-[52%]" h="h-[5px]" c="bg-[#8b5e3c]/60" /></div>
        <div className="mt-auto pb-[6%] flex justify-center gap-1"><div className="h-[4px] w-[28%] bg-[#8b5e3c]/30 rounded-full" /><div className="h-[4px] w-[28%] bg-[#8b5e3c]/30 rounded-full" /></div>
      </div>
    ),
    benefits: (
      <div className="w-full h-full flex flex-col bg-[#f4ede3] overflow-hidden">
        <div className="flex-[0_0_33%] bg-stone-500 relative"><div className="absolute inset-0 bg-[#3d2b1f]/50" /><div className="absolute top-[22%] left-0 right-0 flex justify-center"><L w="w-[40%]" h="h-[2px]" /></div></div>
        <div className="flex-1 flex flex-col justify-center px-[8%] gap-[4px]">
          {[...Array(5)].map((_,i)=>(<div key={i} className="flex items-center gap-[4px]"><div className="w-[9px] h-[9px] bg-[#8b5e3c] rounded-[2px] flex-shrink-0" /><L w="w-full" h="h-[2px]" c="bg-[#3d2b1f]/30" /></div>))}
        </div>
      </div>
    ),
    luxurygold: (
      <div className="w-full h-full relative bg-zinc-950 overflow-hidden">
        <div className="absolute inset-[4%] border border-[#c9a84c]/30" /><div className="absolute inset-[7%] border border-[#c9a84c]/15" />
        <div className="absolute top-[14%] left-0 right-0 flex justify-center"><L w="w-[48%]" h="h-[2px]" c="bg-[#c9a84c]/50" /></div>
        <div className="absolute top-[42%] left-0 right-0 flex flex-col items-center gap-[3px] px-[10%]">
          <L w="w-[62%]" h="h-[4px]" c="bg-white/60" />
          <div className="flex items-center gap-1 w-full"><div className="flex-1 h-[1px] bg-[#c9a84c]/30" /><div className="text-[#c9a84c]/50 text-[5px]">✦</div><div className="flex-1 h-[1px] bg-[#c9a84c]/30" /></div>
          <L w="w-[52%]" h="h-[6px]" c="bg-[#d4af37]/60" />
        </div>
        <div className="absolute bottom-[6%] left-0 right-0 flex justify-center gap-1"><div className="h-[4px] w-[27%] bg-[#c9a84c]/20 border border-[#c9a84c]/30 rounded-full" /><div className="h-[4px] w-[27%] bg-[#c9a84c]/20 border border-[#c9a84c]/30 rounded-full" /></div>
      </div>
    ),
    carousel: (
      <div className="w-full h-full bg-white flex flex-col overflow-hidden border-[2px] border-zinc-900">
        <div className="bg-zinc-900 flex items-center px-[8%] py-[6%] justify-between"><L w="w-[30%]" h="h-[2px]" /><div className="text-white/60 text-[7px] font-bold">1/5</div></div>
        <div className="flex-1 flex flex-col justify-center px-[8%] gap-[4px]">
          <div className="w-[15%] h-[2px] bg-[#8b5e3c] rounded-full" />
          <L w="w-[88%]" h="h-[10px]" c="bg-zinc-800" /><L w="w-[78%]" h="h-[10px]" c="bg-zinc-800" />
          <L w="w-[68%]" h="h-[2px]" c="bg-zinc-400" x="mt-1" />
        </div>
        <div className="border-t border-zinc-200 py-[5%] flex justify-center gap-1"><div className="h-[3px] w-[25%] bg-zinc-200 rounded-full" /><div className="h-[3px] w-[25%] bg-zinc-200 rounded-full" /></div>
      </div>
    ),
    announcement: (
      <div className="w-full h-full bg-white flex flex-col overflow-hidden">
        <div className="bg-red-600 flex items-center justify-center py-[6%]"><L w="w-[55%]" h="h-[3px]" c="bg-white/70" /></div>
        <div className="flex-[0_0_32%] bg-stone-400"><div className="w-full h-full bg-white/10" /></div>
        <div className="flex-1 flex flex-col items-center justify-center gap-[4px] px-[8%]"><L w="w-[78%]" h="h-[8px]" c="bg-zinc-800" /><L w="w-[68%]" h="h-[8px]" c="bg-zinc-800" /><div className="h-[1px] w-[40%] bg-zinc-200 my-1" /><L w="w-[68%]" h="h-[2px]" c="bg-zinc-300" /></div>
        <div className="border-t border-zinc-100 py-[5%] flex justify-center gap-1"><div className="h-[3px] w-[25%] bg-zinc-200 rounded-full" /><div className="h-[3px] w-[25%] bg-zinc-200 rounded-full" /></div>
      </div>
    ),
    nightvibe: (
      <div className="w-full h-full relative overflow-hidden" style={{background:'linear-gradient(135deg,#0f2027 0%,#1a3a4a 50%,#0d1b2a 100%)'}}>
        <div className="absolute top-[8%] left-0 right-0 flex justify-center"><L w="w-[50%]" c="bg-teal-400/50" /></div>
        <div className="absolute top-[40%] left-0 right-0 flex flex-col items-center gap-[3px] px-3"><L w="w-[43%]" h="h-[2px]" c="bg-teal-300/50" /><L w="w-[68%]" h="h-[5px]" c="bg-white/70" /><L w="w-[52%]" h="h-[7px]" c="bg-teal-300/60" /></div>
        <div className="absolute bottom-[6%] left-0 right-0 flex justify-center gap-2"><div className="h-[4px] w-[27%] bg-teal-400/20 border border-teal-400/30 rounded-full" /><div className="h-[4px] w-[27%] bg-teal-400/20 border border-teal-400/30 rounded-full" /></div>
      </div>
    ),
    earthy: (
      <div className="w-full h-full relative overflow-hidden" style={{background:'#f5ede4'}}>
        <div className="absolute top-[-15%] right-[-15%] w-[55%] h-[55%] bg-[#c4795a]/30 rounded-full" /><div className="absolute bottom-[-10%] left-[-10%] w-[45%] h-[45%] bg-[#8b5e3c]/20 rounded-full" />
        <div className="absolute top-[8%] left-0 right-0 flex justify-center"><L w="w-[50%]" h="h-[2px]" c="bg-[#8b5e3c]/40" /></div>
        <div className="absolute top-[32%] left-0 right-0 flex justify-center"><div className="w-[35%] aspect-square rounded-full bg-[#c4795a]/40 border-2 border-[#8b5e3c]/20" /></div>
        <div className="absolute top-[68%] left-0 right-0 flex flex-col items-center gap-[3px] px-3"><L w="w-[62%]" h="h-[4px]" c="bg-[#5c3d2e]/60" /><L w="w-[48%]" h="h-[3px]" c="bg-[#8b5e3c]/50" /></div>
        <div className="absolute bottom-[6%] left-0 right-0 flex justify-center gap-2"><div className="h-[4px] w-[27%] bg-[#8b5e3c]/30 rounded-full" /><div className="h-[4px] w-[27%] bg-[#8b5e3c]/30 rounded-full" /></div>
      </div>
    ),
    portrait: (
      <div className="w-full h-full relative bg-zinc-600 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/90" />
        <div className="absolute top-[8%] left-0 right-0 flex justify-center"><L w="w-[50%]" c="bg-white/50" /></div>
        <div className="absolute bottom-[14%] left-[8%] right-[8%] flex flex-col gap-[3px]"><L w="w-[58%]" h="h-[3px]" /><L w="w-[48%]" h="h-[6px]" c="bg-[#f5dfb8]/70" /></div>
        <div className="absolute bottom-[5%] left-0 right-0 flex justify-center gap-2"><div className="h-[4px] w-[27%] bg-white/20 rounded-full" /><div className="h-[4px] w-[27%] bg-white/20 rounded-full" /></div>
      </div>
    ),
    pricelist: (
      <div className="w-full h-full flex flex-col bg-[#fdfaf5] overflow-hidden">
        <div className="h-[25%] bg-[#8b5e3c] flex flex-col items-center justify-center gap-[3px]"><L w="w-[50%]" h="h-[2px]" /><L w="w-[65%]" h="h-[3px]" c="bg-white/70" /></div>
        <div className="flex-1 flex flex-col justify-center px-[8%] gap-[4px]">
          {[...Array(4)].map((_,i)=>(<div key={i} className="flex justify-between items-center border-b border-[#8b5e3c]/15 py-[3%]"><L w="w-[50%]" h="h-[2px]" c="bg-zinc-400" /><L w="w-[20%]" h="h-[3px]" c="bg-[#8b5e3c]/60" /></div>))}
        </div>
        <div className="h-[12%] flex justify-center items-center gap-1"><div className="h-[3px] w-[25%] bg-[#8b5e3c]/30 rounded-full" /><div className="h-[3px] w-[25%] bg-[#8b5e3c]/30 rounded-full" /></div>
      </div>
    ),
    dualtone: (
      <div className="w-full h-full relative overflow-hidden">
        <div className="absolute inset-0 bg-stone-400" />
        <div className="absolute inset-0 bg-[#8b5e3c]" style={{clipPath:'polygon(100% 0, 100% 100%, 0 100%)' }} />
        <div className="absolute top-[8%] left-[8%]"><L w="w-[45%]" h="h-[2px]" /></div>
        <div className="absolute top-[38%] left-[8%] right-[8%] flex flex-col gap-[3px]"><L w="w-[75%]" h="h-[5px]" c="bg-white/80" /><L w="w-[60%]" h="h-[4px]" c="bg-white/60" /><div className="h-[2px] w-[30%] bg-[#f5dfb8]/60 mt-1" /></div>
        <div className="absolute bottom-[6%] left-0 right-0 flex justify-center gap-2"><div className="h-[4px] w-[27%] bg-white/30 rounded-full" /><div className="h-[4px] w-[27%] bg-white/30 rounded-full" /></div>
      </div>
    ),
    collage: (
      <div className="w-full h-full flex flex-col overflow-hidden bg-white">
        <div className="flex-[0_0_55%] flex">
          <div className="flex-1 bg-stone-400 border-r border-white/50" /><div className="flex-1 bg-stone-600" />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-[3px] px-[8%] border-t-2 border-zinc-100">
          <L w="w-[50%]" h="h-[2px]" c="bg-zinc-400" /><L w="w-[70%]" h="h-[4px]" c="bg-zinc-700" /><L w="w-[52%]" h="h-[3px]" c="bg-[#8b5e3c]/50" />
          <div className="mt-2 flex gap-1"><div className="h-[3px] w-[25%] bg-zinc-200 rounded-full" /><div className="h-[3px] w-[25%] bg-zinc-200 rounded-full" /></div>
        </div>
      </div>
    ),
  };

  return <>{templates[id] ?? <div className="w-full h-full bg-zinc-300" />}</>;
}

/* ═══════════════════════════════════════
   SHARED CANVAS COMPONENTS
═══════════════════════════════════════ */
function Logo({ invert = true, scale = 1 }: { invert?: boolean; scale?: number }) {
  const h  = Math.round(90  * scale);
  const iH = Math.round(420 * scale);
  const ml = Math.round(-40 * scale);
  return (
    <div className="flex items-center justify-center w-full">
      <div className="relative overflow-hidden flex items-center justify-center" style={{ width: Math.round(500 * scale), height: h }}>
        <img src="/serenalogo2.svg" alt="SerenaRaga" className={`absolute w-auto max-w-none ${invert ? 'brightness-0 invert' : 'mix-blend-multiply'}`} style={{ height: iH, marginLeft: ml, marginTop: -4 }} />
      </div>
    </div>
  );
}

function Pills({ dark = true }: { dark?: boolean }) {
  return (
    <div className="w-full flex justify-center">
      <div className="flex items-center gap-6 flex-wrap justify-center">
        <div className={`${dark ? 'bg-white' : 'bg-[#8b5e3c]'} rounded-full px-7 py-3 flex items-center gap-4 shadow-xl`}>
          <div className={`w-[50px] h-[50px] ${dark ? 'bg-[#25D366]' : 'bg-white/20'} rounded-full flex items-center justify-center -ml-4 p-2 flex-shrink-0`}>
            <svg className="w-full h-full text-white" fill="currentColor" viewBox="0 0 24 24"><path d={WA_PATH} /></svg>
          </div>
          <span className={`text-[28px] font-bold ${dark ? 'text-[#8b5e3c]' : 'text-white'}`}>0895-1835-9037</span>
        </div>
        <div className={`${dark ? 'bg-white' : 'bg-[#8b5e3c]'} rounded-full px-7 py-3 flex items-center gap-4 shadow-xl`}>
          <div className={`w-[50px] h-[50px] ${dark ? 'bg-[#8b5e3c]' : 'bg-white/20'} rounded-full flex items-center justify-center -ml-4`}>
            <Globe className="w-6 h-6 text-white" />
          </div>
          <span className={`text-[28px] font-bold ${dark ? 'text-[#8b5e3c]' : 'text-white'}`}>www.serenaraga.fit</span>
        </div>
      </div>
    </div>
  );
}

function ET({ value, onChange, className, tag = 'p', dark = true }: { value: string; onChange: (v: string) => void; className: string; tag?: 'p'|'h1'|'h2'|'h3'|'span'|'div'; dark?: boolean; }) {
  const Tag = tag as any;
  return (
    <Tag contentEditable suppressContentEditableWarning onInput={(e: React.FormEvent<HTMLElement>) => onChange(e.currentTarget.innerText)}
      className={`${className} cursor-text outline-none`} style={{ caretColor: dark ? 'white' : '#8b5e3c' }}
      dangerouslySetInnerHTML={{ __html: value }} />
  );
}

/* ═══════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════ */
export default function FeedEditor() {
  const postRef        = useRef<HTMLDivElement>(null);
  const wrapperRef     = useRef<HTMLDivElement>(null);
  const fileRef        = useRef<HTMLInputElement>(null);
  const bgFileRef      = useRef<HTMLInputElement>(null); // second image for collage

  const [isGen,        setIsGen      ] = useState(false);
  const [downloaded,   setDownloaded ] = useState(false);
  const [theme,        setTheme      ] = useState<Theme>('aura');
  const [bgImage,      setBgImage    ] = useState('/featured-renewal.png');
  const [bgImage2,     setBgImage2   ] = useState('/featured-renewal.png');
  const [aiPrompt,     setAiPrompt   ] = useState('');
  const [showTextPanel,setShowTextPanel] = useState(false);

  // Editable template fields
  const [label,  setLabel ] = useState('FLASH SALE');
  const [title,  setTitle ] = useState('Weekend Bliss');
  const [price,  setPrice ] = useState('Diskon 30%');
  const [desc,   setDesc  ] = useState('Sembuhkan pegal bahu akhir pekan ini.');
  const [quote,  setQuote ] = useState('"Tubuh yang rileks adalah jiwa yang bebas. Biarkan kami hadir merawatnya."');
  const [author, setAuthor] = useState('— Pelanggan SerenaRaga, Jogja');
  const [myth,   setMyth  ] = useState('Pijat hanya untuk orang tua');
  const [fact,   setFact  ] = useState('Pijat bermanfaat untuk semua usia dalam meningkatkan sirkulasi dan relaksasi otot.');

  // Price List items
  const [priceItems, setPriceItems] = useState([
    { service: 'Swedish Massage',      dur: '60 min', harga: 'Rp 150.000' },
    { service: 'Deep Tissue Massage',  dur: '90 min', harga: 'Rp 200.000' },
    { service: 'Hot Stone Therapy',    dur: '90 min', harga: 'Rp 250.000' },
    { service: 'Aromatherapy Massage', dur: '60 min', harga: 'Rp 175.000' },
    { service: 'Pregnancy Massage',    dur: '60 min', harga: 'Rp 180.000' },
  ]);
  const updatePriceItem = (i: number, field: 'service'|'dur'|'harga', val: string) =>
    setPriceItems(items => items.map((x, idx) => idx === i ? {...x, [field]: val} : x));

  // Benefits items
  const [benefitItems, setBenefitItems] = useState([
    'Melancarkan sirkulasi darah & oksigen',
    'Meredakan nyeri otot & sendi',
    'Menurunkan kadar hormon stres (kortisol)',
    'Meningkatkan kualitas tidur secara alami',
    'Dipanggil ke rumah — tanpa perlu keluar',
  ]);
  const updateBenefitItem = (i: number, val: string) =>
    setBenefitItems(items => items.map((x, idx) => idx === i ? val : x));


  // Custom text layers
  const [textLayers,    setTextLayers   ] = useState<TextLayer[]>([]);
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null);
  const [dragging,      setDragging     ] = useState<DragState | null>(null);

  // Upload
  const onUpload  = useCallback((e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) setBgImage(URL.createObjectURL(f)); }, []);
  const onUpload2 = useCallback((e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) setBgImage2(URL.createObjectURL(f)); }, []);

  // AI
  const onGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setIsGen(true);
    try {
      const res  = await fetch('/api/ai/generate', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ prompt: aiPrompt }) });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setLabel(data.title?.split(' ')[0]?.toUpperCase() || label);
      setTitle(data.title || title);
      setPrice(data.price || price);
      setDesc(data.description || desc);
      setQuote(`"${data.description || desc}"`);
    } catch(e) { console.error(e); }
    finally { setIsGen(false); }
  };

  // Download
  const onDownload = async () => {
    if (!postRef.current) return;
    // Temporarily hide selection outline
    setSelectedLayer(null);
    try {
      await new Promise(r => setTimeout(r, 80)); // let outline disappear
      const url = await htmlToImage.toPng(postRef.current, { quality: 1, pixelRatio: 2, fetchRequestInit: { mode: 'cors' } });
      Object.assign(document.createElement('a'), { download: `serenaraga-${theme}-${Date.now()}.png`, href: url }).click();
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 3000);
    } catch(e) { console.error(e); }
  };

  // Text layers CRUD
  const addTextLayer = () => {
    const recs = TEMPLATE_FONTS[theme];
    const id = `tl-${Date.now()}`;
    const newLayer: TextLayer = {
      id, text: 'Ketik teks di sini', posX: 80, posY: 600,
      fontSize: 60, fontId: recs[0] || 'serif-italic',
      color: '#ffffff', textAlign: 'left', maxWidth: 900,
    };
    setTextLayers(l => [...l, newLayer]);
    setSelectedLayer(id);
  };
  const updateLayer = (id: string, patch: Partial<TextLayer>) => setTextLayers(l => l.map(x => x.id === id ? {...x, ...patch} : x));
  const removeLayer = (id: string) => { setTextLayers(l => l.filter(x => x.id !== id)); if (selectedLayer === id) setSelectedLayer(null); };

  // Drag
  const startDrag = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    const layer = textLayers.find(l => l.id === id);
    if (!layer) return;
    setSelectedLayer(id);
    // Measure rendered element size in display px, convert to canvas px
    const el = e.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    const elemW = rect.width / SCALE;
    const elemH = rect.height / SCALE;
    setDragging({ id, startX: e.clientX, startY: e.clientY, origPosX: layer.posX, origPosY: layer.posY, elemW, elemH });
  };
  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return;
    const dx = (e.clientX - dragging.startX) / SCALE;
    const dy = (e.clientY - dragging.startY) / SCALE;
    let newX = Math.max(0, dragging.origPosX + dx);
    let newY = Math.max(0, dragging.origPosY + dy);

    // Snap element CENTER to canvas center (±40 canvas px tolerance)
    const SNAP = 40;
    const CANVAS_CX = 540;
    const CANVAS_CY = 675;
    const elemCX = newX + dragging.elemW / 2; // element center X
    const elemCY = newY + dragging.elemH / 2; // element center Y
    if (Math.abs(elemCX - CANVAS_CX) < SNAP) newX = CANVAS_CX - dragging.elemW / 2;
    if (Math.abs(elemCY - CANVAS_CY) < SNAP) newY = CANVAS_CY - dragging.elemH / 2;

    setTextLayers(layers => layers.map(l =>
      l.id === dragging.id ? { ...l, posX: newX, posY: newY } : l
    ));
  }, [dragging]);
  const onMouseUp = useCallback(() => setDragging(null), []);

  // Click on canvas background deselects
  const onCanvasClick = () => setSelectedLayer(null);

  const selectedLayerData = textLayers.find(l => l.id === selectedLayer);
  const recommendedFontIds = TEMPLATE_FONTS[theme];

  /* ────── Canvas content switch ────── */
  const canvas = (() => {
    switch (theme) {
      case 'aura': return (
        <>
          <div className="absolute inset-0"><img src={bgImage} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" /><div className="absolute inset-0 bg-black/45" /><div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-black/80 to-transparent" /><div className="absolute bottom-0 left-0 w-full h-[600px] bg-gradient-to-t from-black/90 via-black/40 to-transparent" /></div>
          <div className="relative z-10 h-full flex flex-col items-center justify-between py-[80px] px-[70px]">
            <Logo invert scale={1} />
            <div className="flex flex-col items-center text-center space-y-5 w-full">
              <ET value={label} onChange={setLabel} className="text-[32px] font-bold uppercase tracking-[0.45em] text-white/80" /><ET value={title} onChange={setTitle} className="text-[92px] font-serif italic text-white leading-none drop-shadow-xl" tag="h2" /><ET value={price} onChange={setPrice} className="text-[118px] font-serif font-bold text-[#f5dfb8] leading-[0.9] drop-shadow-2xl" tag="h1" /><ET value={desc} onChange={setDesc} className="text-[30px] text-white/75 font-light max-w-[85%] leading-snug" /><p className="text-[18px] text-white/40 italic">*Syarat & Ketentuan Berlaku</p>
            </div>
            <Pills />
          </div>
        </>
      );
      case 'zen': return (
        <div className="flex flex-col h-full bg-[#fdfaf5]">
          <div className="relative overflow-hidden" style={{height:'58%'}}><img src={bgImage} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" /><div className="absolute inset-0 bg-earth-primary/10 mix-blend-multiply" /><div className="absolute bottom-0 left-0 right-0 h-[200px] bg-gradient-to-t from-[#fdfaf5] to-transparent" /><div className="absolute top-8 left-0 right-0"><Logo invert scale={0.75} /></div></div>
          <div className="flex-1 flex flex-col items-center justify-center px-[80px] text-center gap-4"><ET value={label} onChange={setLabel} className="text-[30px] font-bold uppercase tracking-[0.35em] text-earth-primary" dark={false} /><ET value={title} onChange={setTitle} className="text-[82px] font-serif italic text-text-primary leading-none" tag="h1" dark={false} /><ET value={price} onChange={setPrice} className="text-[70px] font-serif font-bold text-earth-primary leading-none" tag="h2" dark={false} /><ET value={desc} onChange={setDesc} className="text-[28px] text-zinc-500 italic max-w-[90%] leading-relaxed" dark={false} /><div className="mt-4 w-full"><Pills dark={false} /></div></div>
        </div>
      );
      case 'editorial': return (
        <div className="bg-white flex flex-col h-full p-[55px]">
          <div className="flex-1 border-[5px] border-zinc-900 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-12 py-8 border-b-[5px] border-zinc-900"><Logo invert={false} scale={0.7} /><div className="text-right"><ET value={label} onChange={setLabel} className="text-[22px] font-black uppercase tracking-[0.35em] text-zinc-400" dark={false} /></div></div>
            <div className="flex-1 flex overflow-hidden">
              <div className="w-[42%] flex flex-col justify-end p-12 border-r-[5px] border-zinc-900 gap-5"><ET value={title} onChange={setTitle} className="text-[54px] font-serif font-black text-zinc-800 leading-[0.9]" tag="h2" dark={false} /><ET value={price} onChange={setPrice} className="text-[88px] font-serif font-black text-earth-primary leading-[0.85]" tag="h1" dark={false} /><ET value={desc} onChange={setDesc} className="text-[23px] text-zinc-500 leading-relaxed border-t-2 border-zinc-200 pt-5" dark={false} /></div>
              <div className="flex-1 relative"><img src={bgImage} alt="" className="absolute inset-0 w-full h-full object-cover" crossOrigin="anonymous" /><div className="absolute top-5 right-5 bg-zinc-900 text-white w-[140px] h-[140px] rounded-full flex items-center justify-center text-center rotate-12 text-[17px] font-black uppercase leading-tight">Limited<br/>Offer</div></div>
            </div>
            <div className="p-10 border-t-[5px] border-zinc-900"><Pills dark={false} /></div>
          </div>
        </div>
      );
      case 'quote': return (
        <div className="h-full flex flex-col relative bg-[#fdf8f2] overflow-hidden">
          <div className="absolute top-0 left-0 text-[700px] font-serif text-earth-primary/5 leading-none select-none z-0" style={{marginTop:'-80px',marginLeft:'-20px'}}>"</div>
          <div className="relative overflow-hidden" style={{height:'50%'}}><img src={bgImage} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" /><div className="absolute inset-0 bg-gradient-to-b from-[#fdf8f2]/0 via-[#fdf8f2]/20 to-[#fdf8f2]" /><div className="absolute top-8 left-0 right-0"><Logo invert scale={0.7} /></div></div>
          <div className="flex-1 relative z-10 flex flex-col items-center justify-center px-[90px] text-center gap-8 pb-[80px]"><ET value={quote} onChange={setQuote} className="text-[50px] font-serif italic text-text-primary leading-snug" tag="h1" dark={false} /><ET value={author} onChange={setAuthor} className="text-[30px] font-semibold tracking-wider text-earth-primary" dark={false} /><div className="w-[120px] h-[5px] bg-earth-primary/30 rounded-full" /></div>
          <div className="absolute bottom-6 left-0 right-0"><Pills dark={false} /></div>
        </div>
      );
      case 'promo': return (
        <div className="h-full flex flex-col overflow-hidden bg-white">
          <div className="relative overflow-hidden" style={{height:'52%'}}><img src={bgImage} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" /><div className="absolute inset-0 bg-black/20" /><div className="absolute top-8 left-0 right-0"><Logo invert scale={0.7} /></div></div>
          <div className="flex-1 bg-earth-primary relative flex flex-col items-center justify-center text-center px-[80px] py-[60px] overflow-hidden">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full translate-x-1/2 -translate-y-1/2" /><div className="absolute bottom-0 left-0 w-[350px] h-[350px] bg-black/10 rounded-full -translate-x-1/3 translate-y-1/3" />
            <div className="relative z-10 w-full space-y-4"><ET value={label} onChange={setLabel} className="text-[30px] font-bold uppercase tracking-[0.45em] text-white/70" /><ET value={title} onChange={setTitle} className="text-[72px] font-serif italic text-white leading-none drop-shadow-lg" tag="h2" /><ET value={price} onChange={setPrice} className="text-[110px] font-serif font-black text-[#f5dfb8] leading-[0.85] drop-shadow-2xl" tag="h1" /><ET value={desc} onChange={setDesc} className="text-[28px] text-white/80 mx-auto leading-relaxed max-w-[90%]" /></div>
            <div className="absolute bottom-6 left-0 right-0"><Pills /></div>
          </div>
        </div>
      );
      case 'mythfact': return (
        <div className="h-full flex flex-col bg-zinc-950 text-white">
          <div className="relative" style={{height:'40%'}}><img src={bgImage} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" /><div className="absolute inset-0 bg-zinc-950/60" /><div className="absolute top-8 left-0 right-0"><Logo invert scale={0.7} /></div></div>
          <div className="flex-1 flex flex-col px-[80px] py-[60px] gap-8">
            <p className="text-center text-[32px] font-black uppercase tracking-[0.4em] text-earth-primary">MITOS vs FAKTA</p>
            <div className="bg-red-900/30 border border-red-500/40 rounded-3xl p-10"><div className="flex items-center gap-4 mb-4"><div className="w-[70px] h-[70px] bg-red-500/20 text-red-400 rounded-2xl flex items-center justify-center text-[40px] font-black">✕</div><p className="text-[26px] font-bold uppercase tracking-wider text-red-400">MITOS</p></div><ET value={myth} onChange={setMyth} className="text-[34px] font-serif italic text-white/90 leading-snug" dark /></div>
            <div className="bg-green-900/30 border border-green-500/40 rounded-3xl p-10"><div className="flex items-center gap-4 mb-4"><div className="w-[70px] h-[70px] bg-green-500/20 text-green-400 rounded-2xl flex items-center justify-center text-[40px] font-black">✓</div><p className="text-[26px] font-bold uppercase tracking-wider text-green-400">FAKTA</p></div><ET value={fact} onChange={setFact} className="text-[30px] text-white/85 leading-relaxed" dark /></div>
          </div>
          <div className="pb-8"><Pills /></div>
        </div>
      );
      case 'testimonial': return (
        <div className="h-full bg-[#f5ede4] flex flex-col">
          <div className="relative" style={{height:'42%'}}><img src={bgImage} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" /><div className="absolute inset-0 bg-[#8b5e3c]/30 mix-blend-multiply" /><div className="absolute top-8 left-0 right-0"><Logo invert scale={0.7} /></div><div className="absolute bottom-10 left-0 right-0 flex justify-center gap-4">{[...Array(5)].map((_,i)=><div key={i} className="text-[50px] text-yellow-400 drop-shadow-lg">★</div>)}</div></div>
          <div className="flex-1 flex flex-col items-center justify-center px-[80px] text-center gap-6 py-[60px]"><div className="text-[120px] font-serif text-earth-primary/20 leading-none -mb-8">"</div><ET value={quote} onChange={setQuote} className="text-[46px] font-serif italic text-text-primary leading-snug" tag="h1" dark={false} /><div className="w-[100px] h-[4px] bg-earth-primary/40 rounded-full my-4" /><ET value={author} onChange={setAuthor} className="text-[30px] font-bold text-earth-primary tracking-wider" dark={false} /><ET value={label} onChange={setLabel} className="text-[24px] text-zinc-400 uppercase tracking-widest" dark={false} /></div>
          <div className="pb-8"><Pills dark={false} /></div>
        </div>
      );
      case 'gradient': return (
        <>
          <div className="absolute inset-0"><img src={bgImage} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" /><div className="absolute inset-0 bg-gradient-to-br from-amber-900/90 via-stone-900/75 to-black/90" /><div className="absolute top-[-200px] right-[-200px] w-[800px] h-[800px] bg-earth-primary/20 rounded-full blur-3xl" /><div className="absolute bottom-[-200px] left-[-200px] w-[600px] h-[600px] bg-amber-600/20 rounded-full blur-3xl" /></div>
          <div className="relative z-10 h-full flex flex-col items-center justify-between py-[80px] px-[75px]"><Logo invert scale={0.85} /><div className="text-center space-y-6 -mt-16"><div className="inline-block bg-earth-primary/30 border border-[#f5dfb8]/30 rounded-full px-12 py-3 mb-4"><ET value={label} onChange={setLabel} className="text-[28px] font-bold uppercase tracking-[0.4em] text-[#f5dfb8]" /></div><ET value={title} onChange={setTitle} className="text-[90px] font-serif italic text-white leading-none drop-shadow-2xl" tag="h2" /><ET value={price} onChange={setPrice} className="text-[125px] font-serif font-black text-[#f5dfb8] leading-[0.85] drop-shadow-2xl" tag="h1" /><ET value={desc} onChange={setDesc} className="text-[30px] text-white/70 max-w-[88%] mx-auto leading-relaxed" /></div><Pills /></div>
        </>
      );
      case 'minimal': return (
        <div className="h-full bg-white flex flex-col">
          <div className="flex-1 relative px-[80px] pt-[80px] pb-[40px] flex flex-col gap-8"><Logo invert={false} scale={0.85} /><div className="flex justify-center"><div className="w-[500px] h-[500px] rounded-full overflow-hidden border-[12px] border-zinc-100 shadow-2xl"><img src={bgImage} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" /></div></div><div className="flex items-center gap-6 w-full"><div className="flex-1 h-[2px] bg-zinc-100" /><ET value={label} onChange={setLabel} className="text-[26px] font-black uppercase tracking-[0.4em] text-earth-primary" dark={false} /><div className="flex-1 h-[2px] bg-zinc-100" /></div><div className="text-center space-y-5"><ET value={title} onChange={setTitle} className="text-[76px] font-serif italic text-zinc-900 leading-none" tag="h2" dark={false} /><ET value={price} onChange={setPrice} className="text-[90px] font-serif font-black text-earth-primary leading-[0.9]" tag="h1" dark={false} /><ET value={desc} onChange={setDesc} className="text-[28px] text-zinc-500 max-w-[85%] mx-auto leading-relaxed italic" dark={false} /></div></div>
          <div className="py-10 border-t border-zinc-100"><Pills dark={false} /></div>
        </div>
      );
      case 'boldoverlay': return (
        <>
          <div className="absolute inset-0"><img src={bgImage} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" /><div className="absolute inset-0 bg-zinc-900/55" /></div>
          <div className="relative z-10 h-full flex flex-col justify-between py-[80px] px-[80px]"><div className="flex justify-between items-start w-full"><Logo invert scale={0.7} /><ET value={label} onChange={setLabel} className="text-[28px] font-black uppercase tracking-[0.3em] text-white/50 self-center" /></div><div className="space-y-0"><p className="text-[28px] font-light uppercase tracking-[0.5em] text-white/60 mb-6">{label}</p><ET value={title} onChange={setTitle} className="text-[130px] font-serif font-black text-white leading-[0.82] drop-shadow-2xl" tag="h1" /><div className="w-[160px] h-[8px] bg-earth-primary rounded-full mt-10 mb-8" /><ET value={price} onChange={setPrice} className="text-[72px] font-bold text-[#f5dfb8] tracking-tight drop-shadow-xl" tag="h2" /><ET value={desc} onChange={setDesc} className="text-[28px] text-white/70 max-w-[80%] leading-relaxed mt-4" /></div><Pills /></div>
        </>
      );
      case 'softpastel': return (
        <div className="h-full flex flex-col" style={{background:'linear-gradient(160deg,#fdf6f0 0%,#f9ede3 50%,#f5e0d0 100%)'}}>
          <div className="absolute top-[-300px] right-[-300px] w-[900px] h-[900px] rounded-full border-[80px] border-earth-primary/5" /><div className="absolute bottom-[-200px] left-[-200px] w-[700px] h-[700px] rounded-full border-[60px] border-earth-primary/5" />
          <div className="pt-[70px]"><Logo invert={false} scale={0.85} /></div>
          <div className="flex justify-center mt-8"><div className="w-[520px] h-[520px] rounded-full overflow-hidden shadow-2xl border-[20px] border-white/70"><img src={bgImage} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" /></div></div>
          <div className="flex-1 flex flex-col items-center justify-center text-center px-[90px] gap-5 pb-[60px]"><ET value={label} onChange={setLabel} className="text-[28px] font-bold uppercase tracking-[0.4em] text-earth-primary/70" dark={false} /><ET value={title} onChange={setTitle} className="text-[80px] font-serif italic text-[#5c3d2e] leading-none" tag="h2" dark={false} /><ET value={price} onChange={setPrice} className="text-[90px] font-serif font-black text-earth-primary leading-[0.9]" tag="h1" dark={false} /><ET value={desc} onChange={setDesc} className="text-[28px] text-[#8b6a55] italic max-w-[90%] leading-relaxed" dark={false} /></div>
          <div className="pb-12"><Pills dark={false} /></div>
        </div>
      );
      case 'benefits': return (
        <div className="h-full flex flex-col bg-[#f4ede3]">
          <div className="relative overflow-hidden" style={{height:'35%'}}><img src={bgImage} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" /><div className="absolute inset-0 bg-[#3d2b1f]/50" /><div className="absolute top-8 left-0 right-0"><Logo invert scale={0.7} /></div><div className="absolute bottom-10 left-0 right-0 text-center"><ET value={title} onChange={setTitle} className="text-[64px] font-serif italic text-white leading-none drop-shadow-xl" tag="h2" /></div></div>
          <div className="flex-1 flex flex-col justify-center px-[80px] py-[50px] gap-6">
            <ET value={label} onChange={setLabel} className="text-[26px] font-black uppercase tracking-[0.35em] text-earth-primary mb-2" dark={false} />
            {benefitItems.map((text, i) => (
              <div key={i} className="flex items-start gap-6">
                <div className="w-[70px] h-[70px] bg-earth-primary rounded-2xl flex items-center justify-center flex-shrink-0">
                  <span className="text-[24px] font-black text-white">{String(i + 1).padStart(2, '0')}</span>
                </div>
                <div contentEditable suppressContentEditableWarning onInput={e => updateBenefitItem(i, e.currentTarget.innerText)}
                  className="text-[30px] text-[#3d2b1f] leading-snug font-medium self-center outline-none cursor-text border-b-2 border-transparent hover:border-earth-primary/30 focus:border-earth-primary/60 transition-colors w-full"
                  dangerouslySetInnerHTML={{ __html: text }} />
              </div>
            ))}
          </div>
          <div className="pb-10"><Pills dark={false} /></div>
        </div>
      );

      case 'luxurygold': return (
        <>
          <div className="absolute inset-0"><img src={bgImage} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" /><div className="absolute inset-0 bg-zinc-950/80" /><div className="absolute inset-0" style={{background:'repeating-linear-gradient(45deg,transparent,transparent 80px,rgba(212,175,55,0.03) 80px,rgba(212,175,55,0.03) 81px)'}} /></div>
          <div className="absolute inset-6 border border-[#c9a84c]/30 z-10" /><div className="absolute inset-8 border border-[#c9a84c]/15 z-10" />
          <div className="relative z-20 h-full flex flex-col items-center justify-between py-[100px] px-[90px]"><div className="flex flex-col items-center gap-5 w-full"><Logo invert scale={0.8} /><div className="flex items-center gap-4 w-full"><div className="flex-1 h-[1px] bg-[#c9a84c]/40" /><div className="text-[20px] text-[#c9a84c]/60 tracking-[0.4em] uppercase font-light">Est. 2024</div><div className="flex-1 h-[1px] bg-[#c9a84c]/40" /></div></div><div className="text-center space-y-6"><ET value={label} onChange={setLabel} className="text-[28px] font-light uppercase tracking-[0.6em] text-[#c9a84c]/80" /><ET value={title} onChange={setTitle} className="text-[96px] font-serif italic text-white leading-none" tag="h2" /><div className="flex items-center gap-6 justify-center"><div className="flex-1 h-[1px] bg-[#c9a84c]/30" /><div className="text-[30px] text-[#c9a84c] font-light">✦</div><div className="flex-1 h-[1px] bg-[#c9a84c]/30" /></div><ET value={price} onChange={setPrice} className="text-[110px] font-serif font-bold text-[#d4af37] leading-[0.9] drop-shadow-2xl" tag="h1" /><ET value={desc} onChange={setDesc} className="text-[28px] text-white/60 font-light max-w-[85%] mx-auto leading-relaxed tracking-wide" /></div><div className="w-full flex justify-center"><div className="flex items-center gap-5"><div className="border border-[#c9a84c]/50 bg-[#c9a84c]/10 rounded-full px-8 py-3 flex items-center gap-4"><div className="w-[45px] h-[45px] bg-[#25D366] rounded-full flex items-center justify-center -ml-4 p-2"><svg className="w-full h-full text-white" fill="currentColor" viewBox="0 0 24 24"><path d={WA_PATH} /></svg></div><span className="text-[26px] font-semibold text-[#d4af37] tracking-wide">0895-1835-9037</span></div><div className="border border-[#c9a84c]/50 bg-[#c9a84c]/10 rounded-full px-8 py-3 flex items-center gap-4"><div className="w-[45px] h-[45px] bg-[#c9a84c]/30 rounded-full flex items-center justify-center -ml-4"><Globe className="w-6 h-6 text-[#d4af37]" /></div><span className="text-[26px] font-semibold text-[#d4af37] tracking-wide">www.serenaraga.fit</span></div></div></div></div>
        </>
      );
      case 'carousel': return (
        <div className="h-full flex flex-col bg-white relative overflow-hidden">
          <div className="bg-zinc-900 flex items-center justify-between px-[80px] py-[52px]"><Logo invert scale={0.65} /><div className="flex flex-col items-end gap-1"><p className="text-[18px] font-light text-white/50 uppercase tracking-widest">SERI</p><ET value={label} onChange={setLabel} className="text-[64px] font-black text-white leading-none" dark /></div></div>
          <div className="flex-1 flex flex-col justify-center px-[80px] py-[60px] gap-6"><div className="w-[80px] h-[6px] bg-earth-primary rounded-full" /><ET value={title} onChange={setTitle} className="text-[112px] font-serif font-black text-zinc-900 leading-[0.88]" tag="h1" dark={false} /><div className="h-[1px] w-full bg-zinc-200" /><ET value={desc} onChange={setDesc} className="text-[32px] text-zinc-500 leading-relaxed max-w-[85%]" dark={false} /><div className="flex items-center gap-5 mt-2"><span className="text-[28px] font-black text-earth-primary tracking-wider">SWIPE →</span><ET value={price} onChange={setPrice} className="text-[26px] text-zinc-400 font-medium" dark={false} /></div></div>
          <div className="border-t border-zinc-100 py-10"><Pills dark={false} /></div>
        </div>
      );
      case 'announcement': return (
        <div className="h-full flex flex-col bg-white overflow-hidden">
          <div className="bg-red-600 py-[42px] px-[70px] flex items-center gap-6"><div className="text-[50px]">⚡</div><div><p className="text-[22px] font-black uppercase tracking-[0.5em] text-white/80">PENTING</p><ET value={label} onChange={setLabel} className="text-[52px] font-black text-white leading-none uppercase" /></div></div>
          <div className="relative overflow-hidden" style={{height:'33%'}}><img src={bgImage} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" /><div className="absolute inset-0 bg-white/10" /></div>
          <div className="flex-1 flex flex-col items-center justify-center text-center px-[80px] py-[50px] gap-5"><Logo invert={false} scale={0.65} /><ET value={title} onChange={setTitle} className="text-[78px] font-serif italic text-zinc-900 leading-none" tag="h2" dark={false} /><ET value={price} onChange={setPrice} className="text-[100px] font-serif font-black text-red-600 leading-[0.85]" tag="h1" dark={false} /><ET value={desc} onChange={setDesc} className="text-[28px] text-zinc-500 leading-relaxed" dark={false} /></div>
          <div className="py-10 border-t border-zinc-100"><Pills dark={false} /></div>
        </div>
      );
      case 'nightvibe': return (
        <>
          <div className="absolute inset-0" style={{background:'linear-gradient(145deg,#0f2027 0%,#1a3a4a 50%,#0d1b2a 100%)'}}><img src={bgImage} alt="" className="w-full h-full object-cover opacity-25" crossOrigin="anonymous" /></div>
          <div className="absolute top-[-200px] right-[-200px] w-[700px] h-[700px] bg-teal-500/15 rounded-full blur-3xl" /><div className="absolute bottom-[-200px] left-[-200px] w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute top-0 left-0 right-0 h-[4px] bg-gradient-to-r from-transparent via-teal-400/60 to-transparent" />
          <div className="relative z-10 h-full flex flex-col items-center justify-between py-[80px] px-[75px]">
            <div className="flex flex-col items-center gap-5 w-full"><Logo invert scale={0.82} /><div className="flex items-center gap-4 w-full"><div className="flex-1 h-[1px] bg-teal-400/20" /><ET value={label} onChange={setLabel} className="text-[24px] font-bold uppercase tracking-[0.4em] text-teal-400/70" /><div className="flex-1 h-[1px] bg-teal-400/20" /></div></div>
            <div className="text-center space-y-5"><ET value={title} onChange={setTitle} className="text-[96px] font-serif italic text-white leading-none drop-shadow-2xl" tag="h2" /><ET value={price} onChange={setPrice} className="text-[115px] font-serif font-black text-teal-300 leading-[0.85] drop-shadow-2xl" tag="h1" /><ET value={desc} onChange={setDesc} className="text-[30px] text-white/60 max-w-[88%] mx-auto leading-relaxed" /></div>
            <div className="w-full flex justify-center"><div className="flex items-center gap-5"><div className="bg-teal-900/50 border border-teal-400/30 rounded-full px-7 py-3 flex items-center gap-3"><div className="w-[46px] h-[46px] bg-[#25D366] rounded-full flex items-center justify-center -ml-3 p-2"><svg className="w-full h-full text-white" fill="currentColor" viewBox="0 0 24 24"><path d={WA_PATH} /></svg></div><span className="text-[26px] font-bold text-teal-200">0895-1835-9037</span></div><div className="bg-teal-900/50 border border-teal-400/30 rounded-full px-7 py-3 flex items-center gap-3"><div className="w-[46px] h-[46px] bg-teal-700/60 rounded-full flex items-center justify-center -ml-3"><Globe className="w-6 h-6 text-teal-300" /></div><span className="text-[26px] font-bold text-teal-200">www.serenaraga.fit</span></div></div></div>
          </div>
        </>
      );
      case 'earthy': return (
        <div className="h-full relative overflow-hidden" style={{background:'#f5ede4'}}>
          <div className="absolute top-[-200px] right-[-250px] w-[800px] h-[800px] bg-[#c4795a]/20 rounded-full" /><div className="absolute bottom-[-250px] left-[-200px] w-[700px] h-[700px] bg-[#8b5e3c]/15 rounded-full" /><div className="absolute top-[300px] right-[-100px] w-[350px] h-[350px] bg-[#c4795a]/10 rounded-full" />
          <div className="relative z-10 h-full flex flex-col items-center justify-between py-[80px] px-[70px]"><Logo invert={false} scale={0.82} /><div className="w-[500px] h-[500px] rounded-full overflow-hidden border-[16px] border-[#c4795a]/30 shadow-2xl"><img src={bgImage} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" /></div><div className="text-center space-y-4"><ET value={label} onChange={setLabel} className="text-[28px] font-bold uppercase tracking-[0.4em] text-[#c4795a]/80" dark={false} /><ET value={title} onChange={setTitle} className="text-[82px] font-serif italic text-[#3d2b1f] leading-none" tag="h2" dark={false} /><ET value={price} onChange={setPrice} className="text-[90px] font-serif font-black text-[#8b5e3c] leading-[0.9]" tag="h1" dark={false} /><ET value={desc} onChange={setDesc} className="text-[28px] text-[#7a5a40] max-w-[88%] mx-auto leading-relaxed italic" dark={false} /></div><Pills dark={false} /></div>
        </div>
      );
      case 'portrait': return (
        <>
          <div className="absolute inset-0"><img src={bgImage} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" /><div className="absolute bottom-0 left-0 right-0 h-[55%] bg-gradient-to-t from-black via-black/60 to-transparent" /><div className="absolute top-0 left-0 right-0 h-[200px] bg-gradient-to-b from-black/50 to-transparent" /></div>
          <div className="relative z-10 h-full flex flex-col justify-between py-[70px] px-[70px]"><Logo invert scale={0.75} /><div className="flex flex-col gap-4"><ET value={label} onChange={setLabel} className="text-[28px] font-bold uppercase tracking-[0.5em] text-white/60" /><ET value={title} onChange={setTitle} className="text-[112px] font-serif italic text-white leading-[0.88] drop-shadow-2xl" tag="h1" /><ET value={price} onChange={setPrice} className="text-[72px] font-serif font-bold text-[#f5dfb8] leading-none drop-shadow-xl" tag="h2" /><ET value={desc} onChange={setDesc} className="text-[28px] text-white/70 max-w-[80%] leading-relaxed" /><div className="mt-4"><Pills /></div></div></div>
        </>
      );

      /* ═══ 3 TEMPLATE BARU ═══ */
      case 'pricelist': return (
        <div className="h-full flex flex-col bg-[#fdfaf5]">
          {/* Header */}
          <div className="bg-earth-primary relative overflow-hidden py-[75px] px-[80px] flex-[0_0_auto]">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/5 rounded-full translate-x-1/2 -translate-y-1/2" />
            <div className="relative z-10"><Logo invert scale={0.75} /><div className="mt-8 text-center"><ET value={title} onChange={setTitle} className="text-[56px] font-serif italic text-white leading-none" tag="h1" /><ET value={label} onChange={setLabel} className="text-[24px] font-black uppercase tracking-[0.4em] text-white/70 mt-3" /></div></div>
          </div>
          {/* Price items — fully editable */}
          <div className="flex-1 flex flex-col justify-center px-[80px] py-[40px] gap-0">
            {priceItems.map((item, i) => (
              <div key={i} className={`flex items-center justify-between py-7 ${i < 4 ? 'border-b border-[#8b5e3c]/15' : ''}`}>
                <div>
                  <div contentEditable suppressContentEditableWarning onInput={e => updatePriceItem(i, 'service', e.currentTarget.innerText)}
                    className="text-[32px] font-semibold text-zinc-800 outline-none cursor-text border-b-2 border-transparent hover:border-earth-primary/30 focus:border-earth-primary/60 transition-colors"
                    dangerouslySetInnerHTML={{ __html: item.service }} />
                  <div contentEditable suppressContentEditableWarning onInput={e => updatePriceItem(i, 'dur', e.currentTarget.innerText)}
                    className="text-[24px] text-zinc-400 outline-none cursor-text border-b border-transparent hover:border-zinc-300 focus:border-zinc-400 transition-colors"
                    dangerouslySetInnerHTML={{ __html: item.dur }} />
                </div>
                <div contentEditable suppressContentEditableWarning onInput={e => updatePriceItem(i, 'harga', e.currentTarget.innerText)}
                  className="text-[34px] font-black text-earth-primary outline-none cursor-text border-b-2 border-transparent hover:border-earth-primary/30 focus:border-earth-primary/60 transition-colors"
                  dangerouslySetInnerHTML={{ __html: item.harga }} />
              </div>
            ))}
          </div>
          <div className="mt-4 pb-10"><Pills dark={false} /></div>
        </div>
      );


      case 'dualtone': return (
        <div className="h-full relative overflow-hidden bg-white">
          {/* Left half - earthy block */}
          <div className="absolute inset-0 bg-[#3d2b1f]" style={{clipPath:'polygon(0 0, 55% 0, 45% 100%, 0 100%)'}} />
          {/* Right half - image */}
          <div className="absolute inset-0" style={{clipPath:'polygon(55% 0, 100% 0, 100% 100%, 45% 100%)'}}>
            <img src={bgImage} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
            <div className="absolute inset-0 bg-black/15" />
          </div>
          {/* Diagonal accent line */}
          <div className="absolute top-0 bottom-0 bg-earth-primary" style={{left:'calc(50% - 18px)', width:'36px', transform:'skewX(-6deg)'}} />
          {/* Content */}
          <div className="relative z-10 h-full flex flex-col justify-between py-[80px] px-[80px]">
            <Logo invert scale={0.8} />
            <div className="space-y-5">
              <ET value={label} onChange={setLabel} className="text-[26px] font-bold uppercase tracking-[0.4em] text-[#f5dfb8]/80" />
              <ET value={title} onChange={setTitle} className="text-[100px] font-serif italic text-white leading-[0.88] drop-shadow-2xl max-w-[700px]" tag="h1" />
              <div className="w-[100px] h-[6px] bg-earth-primary rounded-full" />
              <ET value={price} onChange={setPrice} className="text-[80px] font-serif font-black text-[#f5dfb8] leading-none drop-shadow-xl" tag="h2" />
              <ET value={desc} onChange={setDesc} className="text-[28px] text-white/70 max-w-[600px] leading-relaxed" />
            </div>
            <Pills />
          </div>
        </div>
      );

      case 'collage': return (
        <div className="h-full flex flex-col bg-white overflow-hidden">
          {/* Dual photo grid */}
          <div className="flex overflow-hidden" style={{height:'55%'}}>
            <div className="flex-1 relative border-r-[8px] border-white"><img src={bgImage} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" /><div className="absolute inset-0 bg-black/10" /></div>
            <div className="flex-1 relative"><img src={bgImage2} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" /><div className="absolute inset-0 bg-black/10" /></div>
          </div>
          {/* Logo strip */}
          <div className="bg-earth-primary py-8 flex justify-center"><Logo invert scale={0.62} /></div>
          {/* Text */}
          <div className="flex-1 flex flex-col items-center justify-center text-center px-[80px] py-[40px] gap-5">
            <ET value={label} onChange={setLabel} className="text-[28px] font-bold uppercase tracking-[0.4em] text-earth-primary" dark={false} />
            <ET value={title} onChange={setTitle} className="text-[76px] font-serif italic text-zinc-900 leading-none" tag="h2" dark={false} />
            <ET value={price} onChange={setPrice} className="text-[90px] font-serif font-black text-earth-primary leading-[0.9]" tag="h1" dark={false} />
            <ET value={desc} onChange={setDesc} className="text-[26px] text-zinc-500 max-w-[90%] leading-relaxed" dark={false} />
          </div>
          <div className="py-8 border-t border-zinc-100"><Pills dark={false} /></div>
        </div>
      );
    }
  })();

  /* ═══════════════════════════════════════
     RENDER
  ═══════════════════════════════════════ */
  return (
    <div className="max-w-5xl mx-auto p-6 pb-24 space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-earth-primary/10 via-transparent to-transparent p-8 rounded-3xl border border-earth-primary/10">
        <h1 className="text-3xl font-serif italic text-text-primary mb-2 flex items-center gap-3">
          SerenaRaga AI Studio <Sparkles className="text-earth-primary animate-pulse" size={26} />
        </h1>
        <p className="text-text-secondary text-sm leading-relaxed">Pilih template → Upload foto → Edit teks di kanvas → Add Text Layer → Download PNG HD</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">

        {/* ══ LEFT PANEL ══ */}
        <div className="space-y-5">

          {/* Template Picker */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 p-6 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-5">Template ({THEMES.length})</h3>
            <div className="grid grid-cols-3 gap-3">
              {THEMES.map(t => (
                <button key={t.id} onClick={() => setTheme(t.id)}
                  className={`group flex flex-col items-center gap-2 p-2 rounded-2xl border-2 transition-all ${theme === t.id ? 'border-earth-primary bg-earth-primary/5 shadow-sm' : 'border-zinc-100 dark:border-zinc-800 hover:border-earth-primary/30'}`}
                >
                  <div className="w-full aspect-[4/5] rounded-xl overflow-hidden">
                    <MiniPreview id={t.id} />
                  </div>
                  <span className={`text-[9px] font-bold uppercase tracking-widest leading-tight text-center transition-colors ${theme === t.id ? 'text-earth-primary' : 'text-zinc-400 group-hover:text-earth-primary'}`}>
                    {t.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Image Upload */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 p-6 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-4 flex items-center gap-2"><Upload size={14} className="text-earth-primary" /> Gambar Latar</h3>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onUpload} />
            <button onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-2xl py-7 flex flex-col items-center gap-3 hover:border-earth-primary/50 hover:bg-earth-primary/5 transition-all group"
            >
              <Upload size={24} className="text-zinc-300 group-hover:text-earth-primary transition-colors" />
              <p className="text-sm font-semibold text-zinc-500 group-hover:text-earth-primary">Upload Foto Utama</p>
            </button>
            {theme === 'collage' && (
              <>
                <input ref={bgFileRef} type="file" accept="image/*" className="hidden" onChange={onUpload2} />
                <button onClick={() => bgFileRef.current?.click()}
                  className="w-full border-2 border-dashed border-teal-200 dark:border-teal-800 rounded-2xl py-5 flex items-center justify-center gap-3 hover:border-teal-400/50 hover:bg-teal-900/5 transition-all group mt-3"
                >
                  <Upload size={18} className="text-teal-400" />
                  <p className="text-sm font-semibold text-teal-500">Upload Foto Kedua (Collage)</p>
                </button>
              </>
            )}
          </div>

          {/* Text Layers Panel */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden">
            <button onClick={() => setShowTextPanel(v => !v)}
              className="w-full px-6 py-5 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Type size={16} className="text-earth-primary" />
                <span className="text-xs font-black uppercase tracking-widest text-zinc-500">Text Layers</span>
                {textLayers.length > 0 && <span className="bg-earth-primary text-white text-[10px] font-black px-2 py-0.5 rounded-full">{textLayers.length}</span>}
              </div>
              {showTextPanel ? <ChevronUp size={16} className="text-zinc-400" /> : <ChevronDown size={16} className="text-zinc-400" />}
            </button>

            {showTextPanel && (
              <div className="px-6 pb-6 space-y-4 border-t border-zinc-100 dark:border-zinc-800 pt-4">
                {/* Recommended fonts for this template */}
                <div>
                  <p className="text-[10px] text-zinc-400 uppercase tracking-widest mb-2 font-bold">Font yang cocok untuk {THEMES.find(t => t.id === theme)?.label}:</p>
                  <div className="flex flex-wrap gap-1">
                    {recommendedFontIds.map(fid => {
                      const f = FONTS.find(x => x.id === fid);
                      if (!f) return null;
                      return <span key={fid} className="text-[10px] bg-earth-primary/10 text-earth-primary rounded-full px-3 py-1 font-medium">{f.name}</span>;
                    })}
                  </div>
                </div>

                {/* Text Layer List */}
                {textLayers.map(layer => {
                  const font = FONTS.find(f => f.id === layer.fontId) || FONTS[0];
                  const isSelected = selectedLayer === layer.id;
                  return (
                    <div key={layer.id} className={`rounded-2xl border-2 p-4 space-y-3 transition-all ${isSelected ? 'border-earth-primary bg-earth-primary/5' : 'border-zinc-100 dark:border-zinc-800'}`}>
                      {/* Text input */}
                      <div className="flex items-start gap-2">
                        <input className="flex-1 text-sm p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-earth-primary/20" value={layer.text} onChange={e => updateLayer(layer.id, { text: e.target.value })} onClick={() => setSelectedLayer(layer.id)} placeholder="Teks..." />
                        <button onClick={() => removeLayer(layer.id)} className="p-2 text-zinc-400 hover:text-red-500 transition-colors"><Trash2 size={15} /></button>
                      </div>
                      {/* Font selector */}
                      <div>
                        <p className="text-[10px] text-zinc-400 mb-1.5 font-bold uppercase tracking-wider">Font</p>
                        <div className="grid grid-cols-2 gap-1">
                          {FONTS.map(f => (
                            <button key={f.id} onClick={() => updateLayer(layer.id, { fontId: f.id })}
                              className={`text-[10px] px-3 py-1.5 rounded-xl border transition-all text-left relative ${layer.fontId === f.id ? 'border-earth-primary bg-earth-primary/10 text-earth-primary' : 'border-zinc-100 text-zinc-500 hover:border-earth-primary/30'}`}
                              style={f.style as any}
                            >
                              {f.name}
                              {recommendedFontIds.includes(f.id) && <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-earth-primary rounded-full" />}
                            </button>
                          ))}
                        </div>
                      </div>
                      {/* Size & Color */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <p className="text-[10px] text-zinc-400 mb-1 font-bold">Ukuran: {layer.fontSize}px</p>
                          <input type="range" min={30} max={200} value={layer.fontSize} onChange={e => updateLayer(layer.id, { fontSize: +e.target.value })} className="w-full accent-[#8b5e3c]" />
                        </div>
                        <div>
                          <p className="text-[10px] text-zinc-400 mb-1 font-bold">Warna</p>
                          <input type="color" value={layer.color} onChange={e => updateLayer(layer.id, { color: e.target.value })} className="w-10 h-10 rounded-xl border border-zinc-200 cursor-pointer" />
                        </div>
                      </div>
                      {/* Align */}
                      <div className="flex gap-2">
                        {(['left','center','right'] as const).map(a => (
                          <button key={a} onClick={() => updateLayer(layer.id, { textAlign: a })} className={`flex-1 text-[10px] py-1.5 rounded-xl border font-bold uppercase transition-all ${layer.textAlign === a ? 'border-earth-primary bg-earth-primary text-white' : 'border-zinc-200 text-zinc-400 hover:border-earth-primary/40'}`}>{a}</button>
                        ))}
                      </div>
                      {/* Position Quick Snap */}
                      <div>
                        <p className="text-[10px] text-zinc-400 mb-2 font-bold uppercase tracking-wider">Snap Cepat</p>
                        <div className="flex gap-2">
                          <button onClick={() => updateLayer(layer.id, { posX: 540, textAlign: 'center' })}
                            className="flex-1 text-[11px] py-2.5 rounded-xl border border-sky-200 bg-sky-50 text-sky-600 hover:bg-sky-100 font-bold transition-all">↔ Center Horizontal</button>
                          <button onClick={() => updateLayer(layer.id, { posY: 675 })}
                            className="flex-1 text-[11px] py-2.5 rounded-xl border border-sky-200 bg-sky-50 text-sky-600 hover:bg-sky-100 font-bold transition-all">↕ Center Vertikal</button>
                        </div>
                        <p className="text-[10px] text-zinc-400 text-center mt-2 italic">Atau drag — garis merah muncul otomatis saat mendekati tengah</p>
                      </div>

                    </div>
                  );
                })}

                <button onClick={addTextLayer}
                  className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-earth-primary/40 rounded-2xl py-4 text-earth-primary text-sm font-bold hover:bg-earth-primary/5 transition-all"
                >
                  <Plus size={16} /> Tambah Text Layer
                </button>
              </div>
            )}
          </div>

          {/* AI Assist */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 p-6 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-4 flex items-center gap-2"><Wand2 size={14} className="text-earth-primary" /> AI Auto-Isi Teks</h3>
            <textarea value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} placeholder="Contoh: Promo pijat Ramadhan diskon 25%..." className="w-full text-sm p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-earth-primary/20 resize-none mb-3 h-[90px]" />
            <button onClick={onGenerate} disabled={isGen || !aiPrompt.trim()} className="w-full bg-zinc-900 dark:bg-earth-primary/90 text-white rounded-2xl py-3 font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-30 disabled:cursor-not-allowed">
              {isGen ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Meracik Teks…</> : <><Sparkles size={16} /> Generate Semua Teks</>}
            </button>
          </div>

          <div className="flex items-center gap-3 bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400 rounded-2xl px-5 py-3 text-xs font-medium">
            <Pencil size={14} /> Klik teks template untuk edit. Drag text layer custom untuk memindahkan.
          </div>

          {/* Download */}
          <button onClick={onDownload} className="w-full bg-earth-primary hover:bg-earth-dark text-white rounded-3xl py-5 flex items-center justify-center gap-3 font-bold text-base shadow-xl shadow-earth-primary/20 transition-all hover:scale-[1.02] active:scale-100">
            {downloaded ? <><CheckCircle2 size={22} /> Tersimpan!</> : <><Download size={22} /> Download PNG HD</>}
          </button>
        </div>

        {/* ══ RIGHT PANEL: CANVAS ══ */}
        <div className="flex flex-col items-center sticky top-12">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-400 mb-4">Live Preview 1080 × 1350px</p>

          {/* Canvas wrapper — handles drag */}
          <div
            ref={wrapperRef}
            className="w-[400px] h-[500px] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.25)] rounded-lg overflow-hidden flex items-start justify-start border border-zinc-100 relative bg-zinc-100"
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
          >
            {/* Actual 1080x1350 canvas */}
            <div
              ref={postRef}
              className="w-[1080px] h-[1350px] relative overflow-hidden bg-white"
              style={{ transform: `scale(${SCALE})`, transformOrigin: 'top left', position: 'absolute', top: 0, left: 0 }}
              onClick={onCanvasClick}
            >
              {/* Template content */}
              {canvas}

              {/* ── CUSTOM TEXT LAYERS ── */}
              {textLayers.map(layer => {
                const font = FONTS.find(f => f.id === layer.fontId) || FONTS[0];
                const isSelected = selectedLayer === layer.id;
                return (
                  <div
                    key={layer.id}
                    className={`absolute z-50 ${isSelected ? 'ring-[4px] ring-sky-400 ring-offset-2' : ''}`}
                    style={{
                      left: layer.posX,
                      top: layer.posY,
                      maxWidth: layer.maxWidth,
                      cursor: dragging?.id === layer.id ? 'grabbing' : 'grab',
                    }}
                    onMouseDown={e => startDrag(e, layer.id)}
                    onClick={e => { e.stopPropagation(); setSelectedLayer(layer.id); }}
                  >
                    <div
                      style={{
                        fontSize: layer.fontSize,
                        color: layer.color,
                        textAlign: layer.textAlign,
                        userSelect: 'none',
                        ...font.style,
                      } as React.CSSProperties}
                    >
                      {layer.text}
                    </div>
                  </div>
                );
              })}
              {/* ── SNAP GUIDE LINES — appear when element CENTER is on canvas center ── */}
              {(() => {
                if (!dragging) return null;
                const layer = textLayers.find(l => l.id === dragging.id);
                if (!layer) return null;
                // Guide shows when element center is snapped to canvas center (tight 3px tolerance)
                const elemCX = layer.posX + dragging.elemW / 2;
                const elemCY = layer.posY + dragging.elemH / 2;
                const onCenterH = Math.abs(elemCX - 540) < 3;
                const onCenterV = Math.abs(elemCY - 675) < 3;
                return (
                  <>
                    {/* Vertical guide at canvas center X — element center H snapped */}
                    {onCenterH && (
                      <div
                        className="absolute top-0 bottom-0 pointer-events-none z-[200]"
                        style={{ left: 540, width: 2, background: '#e11d48', boxShadow: '0 0 10px rgba(225,29,72,0.7)', transform: 'translateX(-50%)' }}
                      >
                        <div style={{ position: 'absolute', top: '50%', left: 12, transform: 'translateY(-50%)', background: '#e11d48', color: 'white', padding: '4px 14px', borderRadius: 24, fontSize: 20, fontWeight: 700, whiteSpace: 'nowrap' }}>
                          ┆ tengah
                        </div>
                      </div>
                    )}
                    {/* Horizontal guide at canvas center Y — element center V snapped */}
                    {onCenterV && (
                      <div
                        className="absolute left-0 right-0 pointer-events-none z-[200]"
                        style={{ top: 675, height: 2, background: '#e11d48', boxShadow: '0 0 10px rgba(225,29,72,0.7)', transform: 'translateY(-50%)' }}
                      >
                        <div style={{ position: 'absolute', left: '50%', top: 12, transform: 'translateX(-50%)', background: '#e11d48', color: 'white', padding: '4px 14px', borderRadius: 24, fontSize: 20, fontWeight: 700, whiteSpace: 'nowrap' }}>
                          ┈ tengah
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>

          <div className="mt-4 text-center space-y-1">
            <p className="text-[10px] text-zinc-400">✏️ Klik teks template untuk edit langsung</p>
            <p className="text-[10px] text-zinc-400">✋ Drag layer — garis merah muncul & snaps ke tengah otomatis</p>
          </div>
        </div>

      </div>
    </div>
  );
}
