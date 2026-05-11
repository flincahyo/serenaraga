'use client';
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Sparkles, Download, CheckCircle2, Wand2, Globe, Upload, Pencil, Plus, Trash2, Type, X, ChevronDown, ChevronUp, User, MessageSquare } from 'lucide-react';
import * as htmlToImage from 'html-to-image';

/* ═══════════════════════════════════════
   TYPES
═══════════════════════════════════════ */
type Theme = 'aura' | 'zen' | 'editorial' | 'quote' | 'promo' | 'mythfact' | 'testimonial' | 'watestimonial' | 'gradient' | 'minimal' | 'boldoverlay' | 'softpastel' | 'benefits' | 'luxurygold' | 'carousel' | 'announcement' | 'nightvibe' | 'earthy' | 'portrait' | 'pricelist' | 'dualtone' | 'collage' | 'magazine' | 'polaroid' | 'split' | 'glass' | 'focus' | 'elegant' | 'vibrant' | 'classic' | 'modern';

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
  { id: 'watestimonial',label: 'Real WA Testimoni' },
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
  { id: 'magazine',     label: 'Magazine' },
  { id: 'polaroid',     label: 'Polaroid' },
  { id: 'split',        label: 'Split Layout' },
  { id: 'glass',        label: 'Glassmorphism' },
  { id: 'focus',        label: 'Center Focus' },
  { id: 'elegant',      label: 'Elegant Thin' },
  { id: 'vibrant',      label: 'Vibrant' },
  { id: 'classic',      label: 'Classic' },
  { id: 'modern',       label: 'Modern Sharp' },
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
  watestimonial: ['sans-clean', 'sans-bold', 'mono'],
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
  magazine: ['sans-bold', 'mono', 'wide-caps'],
  polaroid: ['serif-italic', 'sans-clean', 'mono'],
  split: ['sans-bold', 'serif-bold', 'wide-caps'],
  glass: ['sans-clean', 'wide-caps', 'serif-italic'],
  focus: ['serif-bold', 'sans-clean', 'wide-caps'],
  elegant: ['gold-serif', 'serif-italic', 'wide-caps'],
  vibrant: ['sans-bold', 'serif-bold', 'wide-caps'],
  classic: ['serif-italic', 'serif-bold', 'sans-clean'],
  modern: ['sans-bold', 'mono', 'wide-caps'],
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
    watestimonial: (
      <div className="w-full h-full flex flex-col bg-zinc-100 overflow-hidden px-2 py-4 gap-2">
        <L w="w-[40%]" h="h-[2px]" c="bg-zinc-300" />
        <L w="w-[80%]" h="h-[6px]" c="bg-zinc-600 mx-auto" />
        <div className="flex-1 w-[80%] mx-auto bg-white rounded-lg shadow-sm border border-zinc-200 mt-1 flex flex-col justify-end p-2 gap-1">
           <L w="w-[30%]" h="h-[3px]" c="bg-green-100" />
           <L w="w-[80%]" h="h-[10px]" c="bg-zinc-200" />
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
    magazine: (
      <div className="w-full h-full bg-white p-[6%]">
        <div className="w-full h-full border-[1.5px] border-zinc-800 flex flex-col justify-between p-[4%]">
          <L w="w-[90%]" h="h-[4px]" c="bg-zinc-800" />
          <div className="w-full flex-[0_0_55%] bg-stone-300" />
          <L w="w-[60%]" h="h-[2px]" c="bg-zinc-800 mx-auto" />
        </div>
      </div>
    ),
    polaroid: (
      <div className="w-full h-full bg-[#f4f4f5] p-[8%] flex flex-col items-center">
        <div className="w-full bg-white shadow-sm p-[6%] pb-[15%] flex flex-col items-center">
          <div className="w-full aspect-square bg-stone-400" />
          <div className="mt-[8%]"><L w="w-[60%]" h="h-[2px]" c="bg-zinc-400" /></div>
        </div>
      </div>
    ),
    split: (
      <div className="w-full h-full flex flex-col">
        <div className="flex-1 bg-stone-400" />
        <div className="flex-1 bg-[#8b5e3c]/10 flex flex-col items-center justify-center gap-1">
          <L w="w-[60%]" h="h-[3px]" c="bg-[#8b5e3c]" />
          <L w="w-[40%]" h="h-[2px]" c="bg-zinc-500" />
        </div>
      </div>
    ),
    glass: (
      <div className="w-full h-full bg-stone-300 relative flex items-center justify-center p-[8%]">
        <div className="w-full py-[15%] bg-white/40 backdrop-blur-[2px] border border-white/60 rounded flex flex-col items-center gap-[4px] shadow-sm">
          <L w="w-[70%]" h="h-[3px]" c="bg-zinc-800" />
          <L w="w-[40%]" h="h-[2px]" c="bg-zinc-600" />
        </div>
      </div>
    ),
    focus: (
      <div className="w-full h-full bg-stone-200 flex flex-col items-center justify-center relative p-[8%] gap-[10%]">
        <L w="w-[40%]" h="h-[3px]" c="bg-zinc-800" />
        <div className="w-[55%] aspect-square rounded-full bg-stone-400 shadow-inner" />
        <L w="w-[30%]" h="h-[2px]" c="bg-zinc-600" />
      </div>
    ),
    elegant: (
      <div className="w-full h-full bg-white border-[3px] border-stone-100 flex flex-col items-center justify-center p-3 gap-[5px]">
        <L w="w-[1px]" h="h-[8px]" c="bg-stone-300" />
        <L w="w-[70%]" h="h-[2px]" c="bg-stone-500" />
        <L w="w-[50%]" h="h-[1.5px]" c="bg-stone-400" />
        <L w="w-[1px]" h="h-[8px]" c="bg-stone-300" />
      </div>
    ),
    vibrant: (
      <div className="w-full h-full bg-gradient-to-tr from-[#8b5e3c] via-[#e8b877] to-[#fdfaf5] p-3 flex flex-col items-center justify-center gap-[4px]">
        <L w="w-[80%]" h="h-[4px]" c="bg-white shadow-sm" />
        <L w="w-[60%]" h="h-[2px]" c="bg-white/70" />
      </div>
    ),
    classic: (
      <div className="w-full h-full bg-[#3d2b1f] p-[5%] flex flex-col justify-between">
        <div className="flex justify-center mt-2"><L w="w-[30%]" h="h-[2px]" c="bg-[#d4b996]" /></div>
        <div className="flex-1 bg-stone-500/40 m-2 border border-[#d4b996]/30" />
        <div className="flex justify-center mb-2"><L w="w-[50%]" h="h-[3px]" c="bg-[#d4b996]" /></div>
      </div>
    ),
    modern: (
      <div className="w-full h-full bg-zinc-900 relative">
        <div className="absolute top-[25%] left-0 bg-[#8b5e3c] py-[6%] px-[8%] w-[85%] rounded-r flex items-center">
          <L w="w-[80%]" h="h-[3px]" c="bg-white" />
        </div>
        <div className="absolute bottom-[25%] right-0 bg-white/10 py-[4%] px-[6%] w-[65%] rounded-l flex items-center justify-end">
          <L w="w-[50%]" h="h-[2px]" c="bg-white/50" />
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
  const textColor = dark ? 'text-white/90' : 'text-[#3d2b1f]';
  const iconColor = dark ? 'text-[#f5dfb8]' : 'text-[#8b5e3c]';
  const dividerColor = dark ? 'bg-white/20' : 'bg-[#8b5e3c]/20';

  return (
    <div className="w-full flex justify-center mt-2">
      <div className={`flex items-center gap-5 px-4 py-5 border-t ${dark ? 'border-white/10' : 'border-[#8b5e3c]/10'} w-full justify-center`}>
        <div className={`flex items-center gap-3 ${textColor} whitespace-nowrap`}>
          <svg className={`w-[32px] h-[32px] ${iconColor} flex-shrink-0`} fill="currentColor" viewBox="0 0 24 24"><path d={WA_PATH} /></svg>
          <span className="text-[32px] font-medium tracking-wide">0895-1835-9037</span>
        </div>
        
        <div className={`w-[2px] h-[36px] ${dividerColor} flex-shrink-0`} />
        
        <div className={`flex items-center gap-3 ${textColor} whitespace-nowrap`}>
          <svg className={`w-[32px] h-[32px] ${iconColor} flex-shrink-0`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
          <span className="text-[32px] font-medium tracking-wide">@serena.raga</span>
        </div>
        
        <div className={`w-[2px] h-[36px] ${dividerColor} flex-shrink-0`} />
        
        <div className={`flex items-center gap-3 ${textColor} whitespace-nowrap`}>
          <Globe className={`w-[32px] h-[32px] ${iconColor} flex-shrink-0`} />
          <span className="text-[32px] font-medium tracking-wide">www.serenaraga.fit</span>
        </div>
      </div>
    </div>
  );
}

/* Editable Text — cursor-safe: uses ref to avoid dangerouslySetInnerHTML re-renders that reset cursor
   External value changes only propagate when the element is NOT focused. */
function ET({ value, onChange, className, tag = 'p', dark = true }: { value: string; onChange: (v: string) => void; className: string; tag?: 'p'|'h1'|'h2'|'h3'|'span'|'div'; dark?: boolean; }) {
  const ref     = useRef<HTMLElement>(null);
  const focused = useRef(false);
  const Tag = tag as any;

  const highlightClass = dark ? 'text-[#f5dfb8] drop-shadow-md' : 'text-earth-primary';

  useEffect(() => {
    if (ref.current && !focused.current) {
      if (value.includes('**')) ref.current.innerHTML = value.replace(/\*\*(.*?)\*\*/g, `<span class="${highlightClass}">$1</span>`);
      else ref.current.innerText = value;
    }
  }, [value, dark, highlightClass]);

  return (
    <Tag
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onFocus={() => { 
        focused.current = true; 
        if (ref.current) ref.current.innerText = value;
      }}
      onBlur={(e: React.FocusEvent<HTMLElement>) => { 
        focused.current = false; 
        const val = e.currentTarget.innerText;
        onChange(val); 
        if (ref.current) {
          if (val.includes('**')) ref.current.innerHTML = val.replace(/\*\*(.*?)\*\*/g, `<span class="${highlightClass}">$1</span>`);
          else ref.current.innerText = val;
        }
      }}
      onInput={(e: React.FormEvent<HTMLElement>) => onChange(e.currentTarget.innerText)}
      className={`${className} cursor-text outline-none`}
      style={{ caretColor: dark ? 'white' : '#8b5e3c' }}
    />
  );
}

/* Inline EditableField — same cursor-safe pattern, for multiline-safe div fields */
function EF({ value, onChange, className }: { value: string; onChange: (v: string) => void; className?: string }) {
  const ref     = useRef<HTMLDivElement>(null);
  const focused = useRef(false);

  useEffect(() => {
    if (ref.current && !focused.current && ref.current.innerText !== value) {
      ref.current.innerText = value;
    }
  }, [value]);

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onFocus={() => { focused.current = true; }}
      onBlur={(e) => { focused.current = false; onChange(e.currentTarget.innerText); }}
      onInput={(e) => onChange(e.currentTarget.innerText)}
      className={className}
    />
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
  const [isGenWeek,    setIsGenWeek  ] = useState(false);
  const [downloaded,   setDownloaded ] = useState(false);
  const [theme,        setTheme      ] = useState<Theme>('aura');
  const [bgImage,      setBgImage    ] = useState('/featured-renewal.png');
  const [bgImage2,     setBgImage2   ] = useState('/featured-renewal.png');
  const [waImage,      setWaImage    ] = useState<string>('');
  const [aiPrompt,     setAiPrompt   ] = useState('');
  const [caption,      setCaption    ] = useState('');
  const [showTextPanel,setShowTextPanel] = useState(false);
  const [showTemplates,setShowTemplates] = useState(false);

  // Weekly Bulk state
  const [bulkCount, setBulkCount] = useState(6);
  const [format, setFormat] = useState('single');
  const [matrix, setMatrix] = useState('campur');
  const [angle, setAngle] = useState('default');
  const [weeklyPlan, setWeeklyPlan] = useState<any[]>([]);
  const [activeDayIdx, setActiveDayIdx] = useState<number>(-1);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState<Record<number, boolean>>({});

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
  const onUpload  = useCallback((e: React.ChangeEvent<HTMLInputElement>) => { 
    const f = e.target.files?.[0]; 
    if (f) {
      const url = URL.createObjectURL(f);
      setBgImage(url);
      if (activeDayIdx !== -1) {
        setWeeklyPlan(plan => {
          const newPlan = [...plan];
          if (newPlan[activeDayIdx]) newPlan[activeDayIdx].bgImage = url;
          return newPlan;
        });
      }
    }
  }, [activeDayIdx]);
  const onUpload2 = useCallback((e: React.ChangeEvent<HTMLInputElement>) => { 
    const f = e.target.files?.[0]; 
    if (f) {
      const url = URL.createObjectURL(f);
      setBgImage2(url); 
      if (activeDayIdx !== -1) {
        setWeeklyPlan(plan => {
          const newPlan = [...plan];
          if (newPlan[activeDayIdx]) newPlan[activeDayIdx].bgImage2 = url;
          return newPlan;
        });
      }
    }
  }, [activeDayIdx]);

  const onUploadWA = useCallback((e: React.ChangeEvent<HTMLInputElement>) => { 
    const f = e.target.files?.[0]; 
    if (f) {
      const url = URL.createObjectURL(f);
      setWaImage(url); 
      if (activeDayIdx !== -1) {
        setWeeklyPlan(plan => {
          const newPlan = [...plan];
          if (newPlan[activeDayIdx]) newPlan[activeDayIdx].waImage = url;
          return newPlan;
        });
      }
    }
  }, [activeDayIdx]);

  // Load a day into editor
  const loadDayIntoEditor = (index: number) => {
    const day = weeklyPlan[index];
    if (!day) return;
    setActiveDayIdx(index);
    setTheme(day.theme as Theme);
    setLabel(day.label || day.title?.split(' ')[0]?.toUpperCase() || label);
    setTitle(day.title || '');
    setPrice(day.price || '');
    setDesc(day.description || '');
    if (day.quote) setQuote(`"${day.quote}"`);
    if (day.author) setAuthor(day.author);
    if (day.myth) setMyth(day.myth);
    if (day.fact) setFact(day.fact);
    if (day.caption) setCaption(day.caption);
    setBgImage(day.bgImage || '/featured-renewal.png');
    setBgImage2(day.bgImage2 || '/featured-renewal.png');
    setWaImage(day.waImage || '');
  };

  // Generate Image for a specific day
  const generateImageForDay = async (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const day = weeklyPlan[index];
    if (!day) return;
    
    setIsGeneratingImage(prev => ({ ...prev, [index]: true }));
    try {
      const imagePrompt = `${day.title}. ${day.description || day.quote || day.myth || ''}`;
      const res = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: imagePrompt })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      if (data.imageUrl) {
        setWeeklyPlan(plan => {
          const newPlan = [...plan];
          newPlan[index] = { ...newPlan[index], bgImage: data.imageUrl };
          return newPlan;
        });
        if (activeDayIdx === index) {
          setBgImage(data.imageUrl);
        }
      }
    } catch(err) {
      console.error(err);
      alert('Gagal membuat gambar latar AI.');
    } finally {
      setIsGeneratingImage(prev => ({ ...prev, [index]: false }));
    }
  };

  // AI Weekly Generate
  const onGenerateWeek = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenWeek(true);
    try {
      const res = await fetch('/api/ai/generate-week', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ prompt: aiPrompt, count: bulkCount, format, matrix, angle }) });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (Array.isArray(data) && data.length === bulkCount) {
        setWeeklyPlan(data);
        // Load day 1 automatically
        setActiveDayIdx(0);
        const day = data[0];
        setTheme(day.theme as Theme);
        setLabel(day.label || day.title?.split(' ')[0]?.toUpperCase() || label);
        setTitle(day.title || '');
        setPrice(day.price || '');
        setDesc(day.description || '');
        if (day.quote) setQuote(`"${day.quote}"`);
        if (day.author) setAuthor(day.author);
        if (day.myth) setMyth(day.myth);
        if (day.fact) setFact(day.fact);
        if (day.caption) setCaption(day.caption);
      }
    } catch(e) { console.error(e); alert('Failed to generate week. See console.'); }
    finally { setIsGenWeek(false); }
  };

  // AI Single Generate
  const onGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setIsGen(true);
    try {
      const res  = await fetch('/api/ai/generate', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ prompt: aiPrompt }) });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setLabel(data.label || data.title?.split(' ')[0]?.toUpperCase() || label);
      setTitle(data.title || title);
      setPrice(data.price || price);
      setDesc(data.description || desc);
      setQuote(`"${data.description || desc}"`);
      if (data.caption) setCaption(data.caption);
    } catch(e) { console.error(e); }
    finally { setIsGen(false); }
  };

  // Download — clones the canvas at full 1080×1350, captures without CSS transform
  // NOTE: We clone instead of mutating the original to keep images rendering correctly.
  const onDownload = async () => {
    if (!postRef.current) return;
    setSelectedLayer(null);
    await new Promise(r => setTimeout(r, 120)); // wait for ring to disappear

    // Off-screen container: position absolute far to the left, NOT fixed
    // (fixed elements at -9999px can be excluded from browser compositing)
    const offscreen = document.createElement('div');
    offscreen.style.cssText =
      'position:absolute;top:0;left:-99999px;width:1080px;height:1350px;overflow:hidden;pointer-events:none;z-index:-9999;';
    document.body.appendChild(offscreen);

    // Deep clone — class-based styles still apply; only override inline transform
    const clone = postRef.current.cloneNode(true) as HTMLElement;
    clone.style.transform      = 'none';
    clone.style.transformOrigin = 'top left';
    clone.style.position       = 'relative';
    clone.style.top            = '0';
    clone.style.left           = '0';
    clone.style.width          = '1080px';
    clone.style.height         = '1350px';
    offscreen.appendChild(clone);

    try {
      await new Promise(r => setTimeout(r, 80)); // let clone images settle in DOM
      const url = await htmlToImage.toPng(clone, {
        quality: 1,
        pixelRatio: 2,          // → 2160 × 2700 HD
        width: 1080,
        height: 1350,
        fetchRequestInit: { mode: 'cors' },
      });
      Object.assign(document.createElement('a'), {
        download: `serenaraga-${theme}-${Date.now()}.png`,
        href: url,
      }).click();
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 3000);
    } catch (e) {
      console.error('Download error:', e);
    } finally {
      document.body.removeChild(offscreen);
    }
  };

  // Download All (7 Days)
  const onDownloadWeek = async () => {
    setIsDownloadingAll(true);
    setShowPreviewModal(false);
    try {
      for (let i = 0; i < weeklyPlan.length; i++) {
        loadDayIntoEditor(i);
        // Wait for React to render the new state into the DOM
        await new Promise(r => setTimeout(r, 600)); 
        
        if (!postRef.current) continue;
        
        const offscreen = document.createElement('div');
        offscreen.style.cssText = 'position:absolute;top:0;left:-99999px;width:1080px;height:1350px;overflow:hidden;pointer-events:none;z-index:-9999;';
        document.body.appendChild(offscreen);

        const clone = postRef.current.cloneNode(true) as HTMLElement;
        clone.style.transform = 'none';
        clone.style.transformOrigin = 'top left';
        clone.style.position = 'relative';
        clone.style.top = '0';
        clone.style.left = '0';
        clone.style.width = '1080px';
        clone.style.height = '1350px';
        offscreen.appendChild(clone);

        try {
          await new Promise(r => setTimeout(r, 80)); // let clone images settle
          const url = await htmlToImage.toPng(clone, {
            quality: 1,
            pixelRatio: 2,
            width: 1080,
            height: 1350,
            fetchRequestInit: { mode: 'cors' },
          });
          Object.assign(document.createElement('a'), {
            download: `SerenaRaga_${weeklyPlan[i].dayName}_${weeklyPlan[i].theme}.png`,
            href: url,
          }).click();
        } finally {
          document.body.removeChild(offscreen);
        }
        await new Promise(r => setTimeout(r, 600)); // Delay between downloads
      }
      alert('✅ 7 Gambar berhasil didownload!');
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat download beruntun.');
    } finally {
      setIsDownloadingAll(false);
    }
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
      case 'watestimonial': return (
          <div className="h-full bg-zinc-100 flex flex-col relative overflow-hidden">
            <div className="absolute -top-[200px] -right-[200px] w-[600px] h-[600px] bg-green-200/50 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-[200px] -left-[200px] w-[600px] h-[600px] bg-earth-primary/20 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 flex-1 flex flex-col px-[60px] py-[80px]">
              <div className="flex items-center justify-between mb-8">
                <Logo invert={false} scale={0.7} />
                <ET value={label} onChange={setLabel} className="text-[24px] font-bold text-zinc-500 uppercase tracking-widest bg-white px-6 py-2 rounded-full shadow-sm" dark={false} />
              </div>
              
              <div className="flex-1 flex flex-col justify-center items-center mt-4">
                <ET value={title} onChange={setTitle} className="text-[64px] font-serif font-bold text-zinc-800 leading-tight text-center mb-10 max-w-[90%]" tag="h1" dark={false} />
                
                {waImage ? (
                  <div className="relative shadow-2xl rounded-[40px] overflow-hidden border-[8px] border-white w-[85%] max-w-[800px] bg-white transition-transform hover:scale-[1.02]">
                    <div className="bg-[#075e54] text-white px-6 py-4 flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                        <User size={24} className="text-white" />
                      </div>
                      <div>
                        <div className="font-bold text-[22px]">Pelanggan SerenaRaga</div>
                        <div className="text-white/80 text-[16px]">online</div>
                      </div>
                    </div>
                    <img src={waImage} alt="WA Screenshot" className="w-full h-auto object-contain bg-[#efe6dd]" crossOrigin="anonymous" />
                  </div>
                ) : (
                  <div className="w-[85%] max-w-[800px] aspect-[4/3] bg-zinc-200/50 rounded-[40px] border-4 border-dashed border-zinc-300 flex flex-col items-center justify-center text-zinc-400 gap-4">
                    <MessageSquare size={64} className="opacity-50" />
                    <p className="text-[28px] font-medium">Screenshot WA belum diupload</p>
                    <p className="text-[20px]">Gunakan panel kiri untuk upload foto bukti chat.</p>
                  </div>
                )}
              </div>
              
              <div className="mt-12">
                <Pills dark={false} />
              </div>
            </div>
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
                <EF value={text} onChange={v => updateBenefitItem(i, v)}
                  className="text-[30px] text-[#3d2b1f] leading-snug font-medium self-center outline-none cursor-text border-b-2 border-transparent hover:border-earth-primary/30 focus:border-earth-primary/60 transition-colors w-full" />
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
          {/* Price items — fully editable, cursor-safe */}
          <div className="flex-1 flex flex-col justify-center px-[80px] py-[40px] gap-0">
            {priceItems.map((item, i) => (
              <div key={i} className={`flex items-center justify-between py-7 ${i < 4 ? 'border-b border-[#8b5e3c]/15' : ''}`}>
                <div>
                  <EF value={item.service} onChange={v => updatePriceItem(i, 'service', v)}
                    className="text-[32px] font-semibold text-zinc-800 outline-none cursor-text border-b-2 border-transparent hover:border-earth-primary/30 focus:border-earth-primary/60 transition-colors" />
                  <EF value={item.dur} onChange={v => updatePriceItem(i, 'dur', v)}
                    className="text-[24px] text-zinc-400 outline-none cursor-text border-b border-transparent hover:border-zinc-300 focus:border-zinc-400 transition-colors" />
                </div>
                <EF value={item.harga} onChange={v => updatePriceItem(i, 'harga', v)}
                  className="text-[34px] font-black text-earth-primary outline-none cursor-text border-b-2 border-transparent hover:border-earth-primary/30 focus:border-earth-primary/60 transition-colors" />
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
      case 'magazine': return (
        <div className="bg-white flex flex-col h-full p-[65px]">
          <div className="flex-1 border-[6px] border-zinc-900 flex flex-col overflow-hidden">
            <div className="border-b-[6px] border-zinc-900 px-14 py-8 flex justify-between items-center"><Logo invert={false} scale={0.7} /></div>
            <div className="flex-1 flex flex-col relative">
              <div className="absolute inset-0"><img src={bgImage} alt="" className="w-full h-full object-cover grayscale-[20%]" crossOrigin="anonymous" /><div className="absolute inset-0 bg-white/10" /></div>
              <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center p-[60px] bg-white/80 backdrop-blur-md m-[80px] border-[4px] border-zinc-900 shadow-2xl gap-6">
                <ET value={label} onChange={setLabel} className="text-[28px] font-black uppercase tracking-[0.4em] text-zinc-900" dark={false} />
                <ET value={title} onChange={setTitle} className="text-[85px] font-serif font-black text-zinc-900 leading-[0.9]" tag="h2" dark={false} />
                <ET value={price} onChange={setPrice} className="text-[120px] font-serif font-black text-earth-primary leading-[0.85]" tag="h1" dark={false} />
                <div className="w-[80%] h-[4px] bg-zinc-900 my-4" />
                <ET value={desc} onChange={setDesc} className="text-[28px] text-zinc-700 leading-relaxed font-mono" dark={false} />
              </div>
            </div>
            <div className="border-t-[6px] border-zinc-900 py-6"><Pills dark={false} /></div>
          </div>
        </div>
      );
      case 'polaroid': return (
        <div className="h-full bg-[#f4f4f5] flex flex-col p-[80px] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-earth-primary/10 rounded-full blur-3xl -mr-[100px] -mt-[100px]" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-stone-300/30 rounded-full blur-3xl -ml-[150px] -mb-[150px]" />
          <div className="relative z-10 flex-1 bg-white shadow-2xl p-[50px] pb-[100px] flex flex-col items-center rotate-[1deg] hover:rotate-0 transition-transform duration-500">
            <div className="w-full aspect-square bg-zinc-200 relative overflow-hidden shadow-inner mb-[60px]">
              <img src={bgImage} alt="" className="absolute inset-0 w-full h-full object-cover" crossOrigin="anonymous" />
            </div>
            <Logo invert={false} scale={0.8} />
            <div className="flex flex-col items-center text-center gap-6 w-[80%] mt-[60px]">
              <ET value={title} onChange={setTitle} className="text-[64px] font-serif italic text-zinc-800 leading-[1.1]" tag="h2" dark={false} />
              <ET value={price} onChange={setPrice} className="text-[48px] font-bold text-earth-primary" tag="h1" dark={false} />
              <div className="w-[100px] h-[2px] bg-zinc-300" />
              <ET value={desc} onChange={setDesc} className="text-[28px] text-zinc-500 italic leading-relaxed font-serif" dark={false} />
            </div>
          </div>
          <div className="absolute bottom-[30px] left-0 right-0 z-20"><Pills dark={false} /></div>
        </div>
      );
      case 'split': return (
        <div className="h-full flex flex-col bg-white">
          <div className="flex-1 relative">
            <img src={bgImage} alt="" className="absolute inset-0 w-full h-full object-cover" crossOrigin="anonymous" />
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute top-10 left-0 right-0"><Logo invert scale={0.8} /></div>
          </div>
          <div className="flex-1 bg-[#fdfaf5] flex flex-col justify-center px-[100px] gap-8 relative border-t-[8px] border-earth-primary">
            <ET value={label} onChange={setLabel} className="text-[26px] font-bold uppercase tracking-[0.4em] text-earth-primary" dark={false} />
            <ET value={title} onChange={setTitle} className="text-[85px] font-serif font-black text-zinc-900 leading-[0.9]" tag="h2" dark={false} />
            <ET value={price} onChange={setPrice} className="text-[100px] font-black text-earth-primary leading-none" tag="h1" dark={false} />
            <ET value={desc} onChange={setDesc} className="text-[32px] text-zinc-600 leading-relaxed max-w-[90%]" dark={false} />
            <div className="absolute bottom-0 left-0 right-0"><Pills dark={false} /></div>
          </div>
        </div>
      );
      case 'glass': return (
        <div className="h-full relative flex items-center justify-center p-[60px]">
          <div className="absolute inset-0"><img src={bgImage} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" /><div className="absolute inset-0 bg-stone-900/40" /></div>
          <div className="relative z-10 w-full bg-white/20 backdrop-blur-xl border border-white/50 shadow-2xl rounded-3xl p-[80px] flex flex-col items-center text-center gap-8">
            <Logo invert scale={0.9} />
            <ET value={label} onChange={setLabel} className="text-[28px] font-bold uppercase tracking-[0.4em] text-white/90 drop-shadow-sm mt-10" />
            <ET value={title} onChange={setTitle} className="text-[95px] font-serif italic text-white leading-none drop-shadow-md" tag="h2" />
            <ET value={price} onChange={setPrice} className="text-[110px] font-black text-[#f5dfb8] leading-none drop-shadow-lg" tag="h1" />
            <div className="w-[120px] h-[3px] bg-white/40 my-4" />
            <ET value={desc} onChange={setDesc} className="text-[32px] text-white/90 leading-relaxed" />
          </div>
          <div className="absolute bottom-[40px] left-0 right-0 z-20"><Pills /></div>
        </div>
      );
      case 'focus': return (
        <div className="h-full bg-[#e8e6e1] relative flex flex-col overflow-hidden">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white rounded-full blur-[100px] opacity-60" />
          <div className="pt-[60px]"><Logo invert={false} scale={0.8} /></div>
          <div className="flex-1 flex flex-col items-center justify-center z-10 gap-10">
            <ET value={label} onChange={setLabel} className="text-[30px] font-bold uppercase tracking-[0.4em] text-zinc-500" dark={false} />
            <div className="w-[600px] h-[600px] rounded-full overflow-hidden border-[15px] border-white shadow-2xl relative">
              <img src={bgImage} alt="" className="absolute inset-0 w-full h-full object-cover" crossOrigin="anonymous" />
            </div>
            <div className="flex flex-col items-center text-center gap-4 mt-6">
              <ET value={title} onChange={setTitle} className="text-[75px] font-serif font-black text-zinc-800 leading-none" tag="h2" dark={false} />
              <ET value={price} onChange={setPrice} className="text-[60px] font-bold text-earth-primary" tag="h1" dark={false} />
              <ET value={desc} onChange={setDesc} className="text-[28px] text-zinc-500 max-w-[800px] leading-relaxed mt-4" dark={false} />
            </div>
          </div>
          <div className="pb-[40px]"><Pills dark={false} /></div>
        </div>
      );
      case 'elegant': return (
        <div className="h-full bg-white border-[25px] border-[#f5f0e6] flex flex-col p-[60px] relative">
          <div className="absolute inset-[60px] border-[2px] border-zinc-200 pointer-events-none" />
          <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center gap-10 px-[60px]">
            <Logo invert={false} scale={0.85} />
            <div className="h-[60px] w-[2px] bg-zinc-300" />
            <ET value={label} onChange={setLabel} className="text-[26px] font-light uppercase tracking-[0.6em] text-zinc-400" dark={false} />
            <ET value={title} onChange={setTitle} className="text-[100px] font-serif italic text-zinc-800 leading-[1.1]" tag="h2" dark={false} />
            <div className="w-[100px] h-[2px] bg-earth-primary/50" />
            <ET value={price} onChange={setPrice} className="text-[55px] font-serif text-earth-primary leading-none" tag="h1" dark={false} />
            <div className="h-[60px] w-[2px] bg-zinc-300" />
            <ET value={desc} onChange={setDesc} className="text-[32px] text-zinc-500 font-light leading-relaxed max-w-[80%]" dark={false} />
          </div>
          <div className="mt-auto relative z-10"><Pills dark={false} /></div>
        </div>
      );
      case 'vibrant': return (
        <div className="h-full relative flex flex-col overflow-hidden bg-[#8b5e3c]">
          <div className="absolute inset-0 mix-blend-overlay opacity-40"><img src={bgImage} alt="" className="w-full h-full object-cover grayscale" crossOrigin="anonymous" /></div>
          <div className="absolute inset-0 bg-gradient-to-tr from-[#8b5e3c] via-[#d48c44] to-[#f5dfb8] opacity-90" />
          <div className="relative z-10 flex-1 flex flex-col p-[80px]">
            <Logo invert scale={0.9} />
            <div className="flex-1 flex flex-col justify-center text-center items-center gap-8">
              <ET value={label} onChange={setLabel} className="text-[30px] font-black uppercase tracking-[0.4em] text-white/80 bg-black/10 px-8 py-3 rounded-full backdrop-blur-sm" />
              <ET value={title} onChange={setTitle} className="text-[120px] font-black text-white leading-[0.9] drop-shadow-xl" tag="h2" />
              <ET value={price} onChange={setPrice} className="text-[85px] font-bold text-[#4a2e1b] bg-white/90 px-10 py-4 rounded-[40px] shadow-2xl -rotate-2 transform hover:rotate-0 transition-transform" tag="h1" />
              <ET value={desc} onChange={setDesc} className="text-[36px] font-medium text-white/90 leading-relaxed max-w-[85%] mt-8 drop-shadow-md" />
            </div>
          </div>
          <div className="relative z-10 mb-8"><Pills /></div>
        </div>
      );
      case 'classic': return (
        <div className="h-full bg-[#2a1f18] p-[50px] flex flex-col relative">
          <div className="absolute inset-[50px] border-[3px] border-[#d4b996]/30 pointer-events-none" />
          <div className="relative z-10 pt-10"><Logo invert scale={0.8} /></div>
          <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-[80px] gap-8 mt-10">
            <div className="w-[120px] h-[2px] bg-[#d4b996]" />
            <ET value={label} onChange={setLabel} className="text-[26px] font-serif uppercase tracking-[0.4em] text-[#d4b996]/80" />
            <ET value={title} onChange={setTitle} className="text-[95px] font-serif italic text-[#f5dfb8] leading-none" tag="h2" />
            <div className="w-[120px] h-[2px] bg-[#d4b996]" />
            <div className="w-full h-[350px] my-10 relative border-y-[4px] border-[#d4b996]/40 overflow-hidden">
              <img src={bgImage} alt="" className="absolute inset-0 w-full h-full object-cover" crossOrigin="anonymous" />
              <div className="absolute inset-0 bg-[#2a1f18]/30 mix-blend-color" />
            </div>
            <ET value={price} onChange={setPrice} className="text-[60px] font-serif font-bold text-[#d4b996] leading-none" tag="h1" />
            <ET value={desc} onChange={setDesc} className="text-[30px] text-[#f5dfb8]/70 italic leading-relaxed" />
          </div>
          <div className="relative z-10 pb-8"><Pills /></div>
        </div>
      );
      case 'modern': return (
        <div className="h-full bg-zinc-950 relative flex flex-col overflow-hidden">
          <div className="absolute inset-0"><img src={bgImage} alt="" className="w-full h-full object-cover opacity-50 grayscale-[50%]" crossOrigin="anonymous" /></div>
          <div className="absolute top-[20%] left-0 w-[85%] bg-[#8b5e3c] py-[60px] pl-[80px] pr-[100px] rounded-r-[50px] shadow-2xl z-10">
            <Logo invert scale={0.8} />
            <div className="mt-10 flex flex-col gap-6">
              <ET value={label} onChange={setLabel} className="text-[26px] font-mono uppercase tracking-[0.3em] text-white/60" />
              <ET value={title} onChange={setTitle} className="text-[85px] font-black text-white leading-none tracking-tight" tag="h2" />
              <ET value={price} onChange={setPrice} className="text-[65px] font-black text-[#f5dfb8] leading-none" tag="h1" />
            </div>
          </div>
          <div className="absolute bottom-[22%] right-0 w-[70%] bg-white/10 backdrop-blur-xl border border-white/20 py-[50px] px-[80px] rounded-l-[50px] shadow-2xl z-20 flex flex-col justify-center">
            <div className="w-[80px] h-[4px] bg-[#f5dfb8] mb-6" />
            <ET value={desc} onChange={setDesc} className="text-[32px] text-white/90 leading-relaxed font-light" />
          </div>
          <div className="absolute bottom-[40px] w-full z-30"><Pills /></div>
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
            <button 
              onClick={() => setShowTemplates(!showTemplates)}
              className="w-full flex items-center justify-between group"
            >
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 group-hover:text-earth-primary transition-colors">Template ({THEMES.length})</h3>
              {showTemplates ? <ChevronUp size={16} className="text-zinc-400 group-hover:text-earth-primary transition-colors" /> : <ChevronDown size={16} className="text-zinc-400 group-hover:text-earth-primary transition-colors" />}
            </button>
            
            {showTemplates && (
              <div className="grid grid-cols-3 gap-3 mt-5">
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
            )}
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
              {theme === 'watestimonial' && (
                <>
                  <input ref={bgFileRef} type="file" accept="image/*" className="hidden" onChange={onUploadWA} />
                  <button onClick={() => bgFileRef.current?.click()}
                    className="w-full border-2 border-dashed border-green-200 dark:border-green-800 rounded-2xl py-5 flex items-center justify-center gap-3 hover:border-green-400/50 hover:bg-green-900/5 transition-all group mt-3"
                  >
                    <Upload size={18} className="text-green-400" />
                    <p className="text-sm font-semibold text-green-500">Upload Screenshot WA</p>
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
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 block mb-1">Format</label>
                  <select value={format} onChange={e=>setFormat(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-[10px] px-2 py-1.5 outline-none font-medium">
                    <option value="single">Single Post</option>
                    <option value="carousel">Carousel</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 block mb-1">Matrix</label>
                  <select value={matrix} onChange={e=>setMatrix(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-[10px] px-2 py-1.5 outline-none font-medium">
                    <option value="campur">Campur</option>
                    <option value="8020">80/20 Rule</option>
                    <option value="promo">Full Promo</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 block mb-1">Angle Psikologi</label>
                  <select value={angle} onChange={e=>setAngle(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-[10px] px-2 py-1.5 outline-none font-medium">
                    <option value="default">Normal</option>
                    <option value="fomo">FOMO</option>
                    <option value="relatable">Relatable</option>
                    <option value="curiosity">Curiosity</option>
                  </select>
                </div>
              </div>
            <textarea value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} placeholder="Contoh: Promo pijat Ramadhan diskon 25%..." className="w-full text-sm p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-earth-primary/20 resize-none mb-3 h-[90px]" />
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button onClick={onGenerate} disabled={isGen || isGenWeek || !aiPrompt.trim()} className="w-full bg-zinc-900 dark:bg-zinc-800 text-white rounded-xl py-3 font-bold text-[11px] flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-30 disabled:cursor-not-allowed">
                {isGen ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Sparkles size={14} />} 1 Post
              </button>
              <div className="flex gap-1 w-full">
                <select 
                  value={bulkCount} 
                  onChange={(e) => setBulkCount(Number(e.target.value))}
                  disabled={isGen || isGenWeek}
                  className="bg-earth-primary text-white rounded-l-xl px-2 py-3 font-bold text-[11px] outline-none cursor-pointer hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <option value={3}>3x</option>
                  <option value={6}>6x</option>
                  <option value={9}>9x</option>
                </select>
                <button onClick={onGenerateWeek} disabled={isGen || isGenWeek || !aiPrompt.trim()} className="flex-1 bg-earth-primary text-white rounded-r-xl py-3 font-bold text-[11px] flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-30 disabled:cursor-not-allowed shadow-md shadow-earth-primary/20">
                  {isGenWeek ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Sparkles size={14} />} Bulk
                </button>
              </div>
            </div>
            
            {caption && (
              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Hasil Caption IG/FB</h4>
                  <button onClick={() => { navigator.clipboard.writeText(caption); alert('Caption disalin!'); }} className="text-[10px] font-bold uppercase tracking-wider text-earth-primary bg-earth-primary/10 px-3 py-1 rounded-full hover:bg-earth-primary/20 transition-colors">Copy</button>
                </div>
                <div className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-xl text-xs text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap leading-relaxed max-h-[150px] overflow-y-auto">
                  {caption}
                </div>
              </div>
            )}
          </div>

          {/* Weekly Plan Schedule */}
          {weeklyPlan.length > 0 && (
            <div className="bg-earth-primary/5 rounded-3xl border border-earth-primary/20 p-6 shadow-sm">
              <h3 className="text-xs font-black uppercase tracking-widest text-earth-primary mb-4 flex items-center gap-2">📅 Draft Bulk Konten</h3>
              <div className="grid grid-cols-1 gap-2">
                {weeklyPlan.map((day, idx) => (
                  <div key={idx} className={`rounded-xl border transition-all flex flex-col overflow-hidden ${activeDayIdx === idx ? 'bg-earth-primary/10 border-earth-primary shadow-sm' : 'bg-white border-zinc-200'}`}>
                    <button 
                      onClick={() => loadDayIntoEditor(idx)}
                      className={`text-left px-4 py-3 flex items-center justify-between w-full hover:bg-earth-primary/5 transition-colors ${activeDayIdx === idx ? 'bg-earth-primary text-white' : 'text-zinc-600'}`}
                    >
                      <div>
                        <p className="text-xs font-bold uppercase">{day.dayName}</p>
                        <p className={`text-[10px] ${activeDayIdx === idx ? 'text-white/80' : 'text-zinc-400'}`}>Tema: {THEMES.find(t=>t.id===day.theme)?.label || day.theme}</p>
                      </div>
                      {activeDayIdx === idx && <CheckCircle2 size={16} />}
                    </button>
                    
                    {activeDayIdx === idx && (
                      <div className="px-4 py-3 bg-white dark:bg-zinc-900 border-t border-earth-primary/20 flex justify-end">
                        <button 
                          onClick={(e) => generateImageForDay(idx, e)}
                          disabled={isGeneratingImage[idx]}
                          className="bg-zinc-900 hover:bg-black dark:bg-earth-primary dark:hover:bg-earth-dark text-white px-4 py-2 rounded-xl text-[10px] font-bold flex items-center gap-2 transition-all disabled:opacity-50 shadow-sm"
                        >
                          {isGeneratingImage[idx] ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Wand2 size={12} />}
                          {day.bgImage ? 'Regenerate Bg AI' : 'Generate Bg AI'}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400 rounded-2xl px-5 py-3 text-xs font-medium">
            <Pencil size={14} /> Klik teks template untuk edit. Drag text layer custom untuk memindahkan.
          </div>

          {/* Download */}
          <div className="space-y-3">
            <button onClick={onDownload} className="w-full bg-zinc-900 hover:bg-black text-white rounded-2xl py-4 flex items-center justify-center gap-3 font-bold text-sm shadow-xl transition-all">
              {downloaded ? <><CheckCircle2 size={18} /> Tersimpan!</> : <><Download size={18} /> Download Gambar Ini</>}
            </button>
            {weeklyPlan.length > 0 && (
              <button onClick={() => setShowPreviewModal(true)} className="w-full bg-earth-primary hover:bg-earth-dark text-white rounded-2xl py-4 flex items-center justify-center gap-3 font-bold text-sm shadow-xl shadow-earth-primary/20 transition-all">
                <Globe size={18} /> Preview & Download 1 Minggu
              </button>
            )}
          </div>
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

      {/* Preview 1 Minggu Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 md:p-10">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-5xl h-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2"><Globe className="text-earth-primary" /> Preview Jadwal 1 Minggu</h2>
                <p className="text-sm text-zinc-500">Review seluruh caption dan template sebelum mendownload 7 gambar sekaligus.</p>
              </div>
              <button onClick={() => setShowPreviewModal(false)} className="p-2 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors rounded-full">
                <X size={20} className="text-zinc-600 dark:text-zinc-300" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-2 gap-6 bg-zinc-100/50 dark:bg-zinc-950">
              {weeklyPlan.map((day, i) => (
                <div key={i} className="flex gap-5 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md transition-shadow">
                  {/* Visual Preview */}
                  <div className="w-[120px] shrink-0 flex flex-col gap-3">
                    <div className="w-full aspect-[4/5] rounded-xl overflow-hidden shadow-md border border-zinc-100 dark:border-zinc-800 bg-zinc-100">
                      <MiniPreview id={day.theme as Theme} />
                    </div>
                    <div className="text-center">
                      <span className="bg-earth-primary/10 text-earth-primary font-black text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full inline-block mb-1">{day.dayName}</span>
                      <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">{THEMES.find(t=>t.id===day.theme)?.label || day.theme}</p>
                    </div>
                  </div>
                  
                  {/* Content Preview */}
                  <div className="flex-1 space-y-3 min-w-0">
                    <div>
                      <h3 className="text-base font-serif font-bold text-zinc-900 dark:text-white leading-snug line-clamp-2" title={day.title}>{day.title}</h3>
                      <p className="text-earth-primary font-black text-xs mt-1 uppercase tracking-wider">{day.price || day.label}</p>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 italic">"{day.description || day.quote || day.myth}"</p>
                    
                    <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[9px] text-zinc-400 uppercase tracking-widest font-bold">Caption Text</p>
                      </div>
                      <div className="bg-zinc-50 dark:bg-zinc-950 rounded-lg p-2 max-h-[100px] overflow-y-auto">
                        <p className="text-[11px] text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap leading-relaxed">{day.caption}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="px-8 py-5 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between">
              <p className="text-xs text-zinc-500 font-medium">⚠️ Saat klik download, gambar akan diproses dan diunduh satu per satu secara otomatis. Mohon jangan tutup browser.</p>
              <button onClick={onDownloadWeek} disabled={isDownloadingAll} className="bg-earth-primary hover:bg-earth-dark text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 transition-all shadow-lg shadow-earth-primary/20">
                {isDownloadingAll ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Memproses 7 Gambar...</> : <><Download size={18} /> Download Semua (7 Post)</>}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

