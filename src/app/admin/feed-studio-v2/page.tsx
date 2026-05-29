'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Wand2, Download, Copy, Image as ImageIcon, LayoutTemplate, Layers, CheckCircle2, ChevronLeft, ChevronRight, Hash, Globe, Phone, Droplet, Palette, Printer, Loader2, Moon, AlignLeft, AlignCenter, AlignRight, Trash2, GripHorizontal, Type } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import * as htmlToImage from 'html-to-image';
import jsPDF from 'jspdf';
import { SplitScreenDark, ClassicGlass, EditorialOverlay, StoryMinimalist, GiftVoucher } from '@/components/canvas/FeedTemplates';
import { PosterCanvas } from '@/components/canvas/PosterCanvas';
import { CanvasElementData } from '@/components/canvas/DraggableText';

/* ═══════════════════════════════════════
   TYPES & SHARED STATE
═══════════════════════════════════════ */
type GenerationStep = 'idle' | 'ideating' | 'visualizing' | 'ready';

interface CarouselSlide {
  title?: string;
  description?: string;
  quote?: string;
  author?: string;
  myth?: string;
  fact?: string;
  price?: string;
  listItems?: { label: string, value: string }[];
  elements?: CanvasElementData[];
  bgImage?: string;
  visualSubject?: string;
  theme?: string;
  vignetteColor?: 'black' | 'white' | 'none';
  vignetteIntensity?: number;
  darkenIntensity?: number;
  colorMode?: 'auto' | 'light' | 'dark';
  voucherData?: VoucherData;
}

export interface VoucherData {
  code: string;
  value: string;
  valueType: string;
  name: string;
  to: string;
  from: string;
  exp: string;
  terms1?: string;
  terms2?: string;
  terms3?: string;
  contact?: string;
  tagline?: string;
}

interface PostDraft {
  id: string;
  theme: string;
  label: string;
  title: string;
  price: string;
  description: string;
  quote: string;
  author: string;
  myth: string;
  fact: string;
  caption: string;
  format?: 'feed' | 'story' | 'square' | 'voucher';
  visualSubject?: string;
  seasonalNuance?: string;
  artStyle?: string;
  bgImage?: string;
  layoutConfig?: any;
  vignetteColor?: 'black' | 'white' | 'none';
  vignetteIntensity?: number;
  darkenIntensity?: number;
  colorMode?: 'auto' | 'light' | 'dark';
  listItems?: { label: string, value: string }[];
  elements?: CanvasElementData[];
  isCarousel?: boolean;
  slides?: CarouselSlide[];
  voucherData?: VoucherData;
}

/* ═══════════════════════════════════════
   COMPONENTS
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


const WAIco = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const InstagramIco = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

/* ═══════════════════════════════════════
   MAIN COMPONENT (Bento 2.0 Paradigm)
═══════════════════════════════════════ */
export default function FeedStudioV2() {
  const [prompt, setPrompt] = useState('');
  const [targetFormat, setTargetFormat] = useState<'feed' | 'story' | 'square' | 'voucher'>('feed');
  const [studioMode, setStudioMode] = useState<'smart' | 'pro'>('smart');
  const [step, setStep] = useState<GenerationStep>('idle');
  const [activeDraft, setActiveDraft] = useState<PostDraft | null>(null);
  const [draftHistory, setDraftHistory] = useState<PostDraft[]>([]);

  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);
  
  // Layout States
  const [activeTool, setActiveTool] = useState<'intelligence' | 'drafts' | 'copywriting' | null>('intelligence');
  
  // Bulk PDF State
  const [batchName, setBatchName] = useState<string | null>(null);
  const [batchVouchers, setBatchVouchers] = useState<VoucherData[]>([]);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [renderProgress, setRenderProgress] = useState<{current: number, total: number} | null>(null);
  const batchContainerRef = useRef<HTMLDivElement>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  
  // Canvas Refs
  const postRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [showBgPrompt, setShowBgPrompt] = useState(false);
  const [bgPromptText, setBgPromptText] = useState('');
  const [showThemePrompt, setShowThemePrompt] = useState(false);
  const [isCanvasSelected, setIsCanvasSelected] = useState(false);
  const [draftToDelete, setDraftToDelete] = useState<string | null>(null);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);

  // LocalStorage Persistence
  useEffect(() => {
    const saved = localStorage.getItem('sragaloveca_feed_drafts_v2');
    if (saved) {
      try {
        setDraftHistory(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load drafts', e);
      }
    }
    
    // Check URL for Voucher mode injection
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      
      if (params.get('batch')) {
        const batch = params.get('batch');
        setBatchName(batch);
        setTargetFormat('voucher');
        setStudioMode('smart');
        
        const fetchBatch = async () => {
          const supabase = createClient();
          const { data } = await supabase.from('discounts').select('*').eq('buyer_name', `Batch: ${batch}`).eq('is_active', true);
          if (data && data.length > 0) {
            const parsedVouchers = data.map((v: any) => {
              let parsedDesc: any = {};
              try {
                parsedDesc = JSON.parse(v.description || '{}');
              } catch (e) {
                parsedDesc = { tagline: v.description || '' };
              }
              
              return {
                code: v.code,
                value: String(v.value),
                valueType: v.value_type,
                name: v.name,
                to: v.recipient_name || '',
                from: v.buyer_name?.startsWith('Batch: ') ? '' : (v.buyer_name || ''),
                exp: v.valid_to || '',
                tagline: parsedDesc.tagline || '',
                terms1: parsedDesc.terms1 || '',
                terms2: parsedDesc.terms2 || '',
                terms3: parsedDesc.terms3 || '',
              };
            });
            setBatchVouchers(parsedVouchers);
            
            const vData = parsedVouchers[0];
            const vDraft = {
              id: `voucher-${Date.now()}`,
              theme: 'gift_voucher',
              label: 'Voucher',
              title: vData.name,
              price: '', description: '', quote: '', author: '', myth: '', fact: '', caption: '',
              format: 'voucher' as any,
              voucherData: vData,
              bgImage: '',
              colorMode: 'dark' as any,
            };
            setActiveDraft(vDraft);
            setPrompt(`Buatkan background mewah dan premium untuk gift voucher spesial ${vData.name}. Nuansa hangat, elegan, dan estetik.`);
          }
        };
        fetchBatch();
        // removed replaceState to keep batch query param
      }

      else if (params.get('mode') === 'voucher') {
        setTargetFormat('voucher');
        setStudioMode('smart'); // Voucher uses smart template
        
        let parsedDesc: any = {};
        try {
          parsedDesc = JSON.parse(params.get('tagline') || '{}');
        } catch(e) {
          parsedDesc = { tagline: params.get('tagline') || '' };
        }
        
        const vData = {
          code: params.get('code') || '',
          value: params.get('value') || '',
          valueType: params.get('valueType') || 'flat',
          name: params.get('name') || '',
          to: params.get('to') || '',
          from: (params.get('from') || '').startsWith('Batch: ') ? '' : (params.get('from') || ''),
          exp: params.get('exp') || '',
          tagline: parsedDesc.tagline || '',
          terms1: parsedDesc.terms1 || '',
          terms2: parsedDesc.terms2 || '',
          terms3: parsedDesc.terms3 || '',
        };
        const vDraft: PostDraft = {
          id: `voucher-${Date.now()}`,
          theme: 'gift_voucher',
          label: 'Voucher',
          title: vData.name,
          price: '', description: '', quote: '', author: '', myth: '', fact: '', caption: '',
          format: 'voucher',
          voucherData: vData,
          bgImage: '',
          colorMode: 'dark', // usually looks premium with dark text on light generated bg, or vice versa
        };
        setActiveDraft(vDraft);
        setPrompt(`Buatkan background mewah dan premium untuk gift voucher spesial ${vData.name}. Nuansa hangat, elegan, dan estetik.`);
        // Clean up URL without reloading
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  // Debounced auto-save: only writes to localStorage 1s after the last change
  useEffect(() => {
    if (!activeDraft) return;

    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);

    autoSaveTimerRef.current = setTimeout(() => {
      setDraftHistory(prev => {
        const index = prev.findIndex(d => d.id === activeDraft.id);
        if (index === -1) return prev;
        if (JSON.stringify(prev[index]) === JSON.stringify(activeDraft)) return prev;

        const newHistory = [...prev];
        newHistory[index] = activeDraft;
        try {
          localStorage.setItem('sragaloveca_feed_drafts_v2', JSON.stringify(newHistory));
        } catch (e) {
          console.warn('Auto-save quota exceeded, keeping only latest 2 drafts');
          try { localStorage.setItem('sragaloveca_feed_drafts_v2', JSON.stringify(newHistory.slice(0, 2))); } catch (e2) {}
        }
        return newHistory;
      });
    }, 1000);

    return () => { if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current); };
  }, [activeDraft]);

  const saveDrafts = (drafts: PostDraft[]) => {
    setDraftHistory(drafts);
    try {
      localStorage.setItem('sragaloveca_feed_drafts_v2', JSON.stringify(drafts));
    } catch (e) {
      console.warn("Storage quota exceeded, keeping only latest 2 drafts");
      try {
        localStorage.setItem('sragaloveca_feed_drafts_v2', JSON.stringify(drafts.slice(0, 2)));
      } catch (e2) {
        try { localStorage.setItem('sragaloveca_feed_drafts_v2', JSON.stringify(drafts.slice(0, 1))); } catch (e3) {}
      }
    }
  };

  const deleteDraft = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDraftToDelete(id);
  };

  const confirmDeleteDraft = () => {
    if (!draftToDelete) return;
    const filtered = draftHistory.filter(d => d.id !== draftToDelete);
    saveDrafts(filtered);
    if (activeDraft?.id === draftToDelete) setActiveDraft(null);
    setDraftToDelete(null);
  };

  const handleFormatChange = (fmt: 'feed' | 'story' | 'square' | 'voucher') => {
    setTargetFormat(fmt);
    if (activeDraft) {
      setActiveDraft({
        ...activeDraft,
        format: fmt,
        theme: fmt === 'voucher' ? 'gift_voucher' : (activeDraft.theme === 'gift_voucher' ? 'classic_glass' : activeDraft.theme)
      });
    }
  };

  // The 3-Step Fluid Engine
  const generatePost = async () => {
    if (!prompt.trim()) return;
    
    try {
      // Step 1: Ideation (Grok Text)
      setStep('ideating');
      const textRes = await fetch('/api/ai/generate', { 
        method: 'POST', 
        headers: {'Content-Type':'application/json'}, 
        body: JSON.stringify({ prompt, format: targetFormat }) 
      });
      const textData = await textRes.json();
      if (textData.error) throw new Error(textData.error);

      const isCarousel = !!textData.isCarousel;
      const slides: CarouselSlide[] = isCarousel && textData.slides ? textData.slides.map((s: any) => ({
        theme: s.theme || textData.theme || 'classic_glass',
        title: s.title || '',
        description: s.description || '',
        price: s.price || '',
        myth: s.myth || '',
        fact: s.fact || '',
        quote: s.quote || '',
        author: s.author || '',
        listItems: s.listItems || [],
        visualSubject: s.visualSubject || textData.visualSubject,
        bgImage: '',
        elements: [],
        vignetteColor: 'black',
        vignetteIntensity: 50,
        colorMode: 'auto',
      })) : [];

      const newDraft: PostDraft = {
        id: Math.random().toString(36).substr(2, 9),
        theme: targetFormat === 'voucher' ? 'gift_voucher' : (textData.theme || 'classic_glass'),
        label: textData.label || 'INFO',
        title: textData.title || '',
        price: textData.price || '',
        description: textData.description || '',
        quote: textData.quote || '',
        author: textData.author || '',
        myth: textData.myth || '',
        fact: textData.fact || '',
        format: targetFormat,
        caption: textData.caption || '',
        visualSubject: textData.visualSubject,
        seasonalNuance: textData.seasonalNuance,
        artStyle: textData.artStyle,
        layoutConfig: textData.layout_config || null,
        vignetteColor: 'black',
        vignetteIntensity: 50,
        colorMode: 'auto',
        listItems: textData.listItems || [],
        elements: [],
        isCarousel,
        slides,
        voucherData: activeDraft?.voucherData
      };

      setActiveDraft(newDraft);
      setActiveSlideIndex(0);

      // Step 2: Visualization (Grok Image)
      if (isCarousel && newDraft.slides && newDraft.slides.length > 0) {
        setStep('visualizing');
        const promises = newDraft.slides.map(async (slide, idx) => {
          const subject = slide.visualSubject || textData.visualSubject;
          if (!subject) return { idx, url: '' };

          try {
            const imgRes = await fetch('/api/ai/grok-image', {
              method: 'POST',
              headers: {'Content-Type':'application/json'},
              body: JSON.stringify({ 
                visualSubject: subject, 
                seasonalNuance: textData.seasonalNuance,
                artStyle: textData.artStyle,
                format: targetFormat,
                title: slide.title,
                description: slide.description,
                quote: slide.quote,
                myth: slide.myth,
                fact: slide.fact
              })
            });
            const imgData = await imgRes.json();
            return { idx, url: imgData.url || '' };
          } catch (e) {
            console.error(`Failed to generate image for slide ${idx}`, e);
            return { idx, url: '' };
          }
        });

        const results = await Promise.all(promises);
        const updatedSlides = [...newDraft.slides];
        results.forEach(res => {
          if (res.url) {
            updatedSlides[res.idx].bgImage = res.url;
          }
        });

        const finishedDraft = { 
          ...newDraft, 
          slides: updatedSlides,
          bgImage: updatedSlides[0]?.bgImage || '' 
        };
        setActiveDraft(finishedDraft);
        saveDrafts([finishedDraft, ...draftHistory]);
      } else if (textData.visualSubject && textData.seasonalNuance) {
        setStep('visualizing');
        const imgRes = await fetch('/api/ai/grok-image', {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({ 
            visualSubject: textData.visualSubject, 
            seasonalNuance: textData.seasonalNuance,
            artStyle: textData.artStyle,
            format: targetFormat,
            title: textData.title,
            description: textData.description,
            quote: textData.quote,
            myth: textData.myth,
            fact: textData.fact
          })
        });
        const imgData = await imgRes.json();
        
        if (imgData.url) {
          const finishedDraft = { ...newDraft, bgImage: imgData.url };
          setActiveDraft(finishedDraft);
          saveDrafts([finishedDraft, ...draftHistory]);
        }
      } else {
        saveDrafts([newDraft, ...draftHistory]);
      }
      
      // Step 3: Ready
      setStep('ready');

    } catch (error) {
      console.error("Generation failed:", error);
      alert("Gagal merender AI. Silakan coba lagi.");
      setStep('idle');
    }
  };


  const handleGeneratePDF = async () => {
    if (!activeDraft || batchVouchers.length === 0) return;
    setIsGeneratingPDF(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a3');
      const pdfWidth = 297;
      const pdfHeight = 420;
      const gapX = 3; // 3mm gap for cutting tolerance
      const gapY = 3; 
      const marginX = 7; // (297 - 140*2 - 3) / 2 = 7
      const marginY = 10;
      const usableWidth = 140; // 14cm width for a proper, premium voucher size
      const voucherRatio = 1200 / 520;
      const printHeight = usableWidth / voucherRatio; // ~60.6mm
      
      let yOffset = marginY;
      let col = 0;

      // Allow React to render the first hidden voucher
      await new Promise(r => setTimeout(r, 500));

      for (let i = 0; i < batchVouchers.length; i++) {
        setRenderProgress({ current: i + 1, total: batchVouchers.length });
        
        // Wait for React to update the DOM with the new voucher data
        await new Promise(r => setTimeout(r, 250));
        
        if (!batchContainerRef.current) continue;
        const node = batchContainerRef.current.firstElementChild as HTMLElement;
        if (!node) continue;

        const dataUrl = await htmlToImage.toJpeg(node, {
          quality: 0.95,
          width: 1200,
          height: 520,
          pixelRatio: 2,
          style: { overflow: 'visible' },
        });

        // Determine X offset based on column
        let xOffset = marginX;
        if (col === 1) {
          xOffset = marginX + usableWidth + gapX; // Horizontal gap
        }

        // Check if we need a new page
        if (yOffset + printHeight > pdfHeight - marginY) {
          pdf.addPage();
          yOffset = marginY;
        }

        pdf.addImage(dataUrl, 'JPEG', xOffset, yOffset, usableWidth, printHeight);

        // Move to next position
        if (col === 1) {
          col = 0;
          yOffset += printHeight + gapY; // Vertical gap for easy cutting
        } else {
          col = 1;
        }
      }

      pdf.save(`Voucher_Batch_${batchName}.pdf`);
    } catch (e) {
      console.error(e);
      alert('Gagal mencetak PDF.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleDownload = async () => {

    if (!postRef.current || !activeDraft) return;
    setIsDownloading(true);

    const doCapture = async (index: number): Promise<string> => {
      setActiveSlideIndex(index);
      await new Promise(r => setTimeout(r, 200));
      if (!postRef.current) throw new Error('postRef missing');

      const fmt = activeDraft.format || 'feed';
      const tWidth  = fmt === 'voucher' ? 1200 : 1080;
      const tHeight = fmt === 'story'   ? 1920
                    : fmt === 'square'  ? 1080
                    : fmt === 'voucher' ? 520
                    :                    1350;

      // postRef itself has NO transform (scale is on its parent wrapper).
      // We temporarily un-scale the parent wrapper so html-to-image can see
      // the full-size element without any ancestor clipping interference.
      const scaleWrapper = postRef.current.parentElement;
      const savedTransform = scaleWrapper?.style.transform ?? '';
      const savedOverflow  = scaleWrapper?.style.overflow  ?? '';
      if (scaleWrapper) {
        scaleWrapper.style.transform = 'none';
        scaleWrapper.style.overflow  = 'visible';
      }

      // Also un-clip the outer aspect-ratio container and the scroll column
      const aspectBox   = scaleWrapper?.parentElement;
      const scrollCol   = aspectBox?.parentElement?.parentElement;
      const savedAspect = aspectBox?.style.overflow ?? '';
      const savedScroll = scrollCol?.style.overflow ?? '';
      if (aspectBox)  aspectBox.style.overflow  = 'visible';
      if (scrollCol)  scrollCol.style.overflow  = 'visible';

      // Give browser one frame to repaint at full size
      await new Promise(r => setTimeout(r, 50));

      try {
        const dataUrl = await htmlToImage.toJpeg(postRef.current, {
          quality: 0.95,
          width: tWidth,
          height: tHeight,
          pixelRatio: 2,
          style: { overflow: 'visible' },
        });
        return dataUrl;
      } finally {
        // Always restore styles
        if (scaleWrapper) {
          scaleWrapper.style.transform = savedTransform;
          scaleWrapper.style.overflow  = savedOverflow;
        }
        if (aspectBox)  aspectBox.style.overflow  = savedAspect;
        if (scrollCol)  scrollCol.style.overflow  = savedScroll;
      }
    };

    try {
      const fmt = activeDraft.format || 'feed';
      if (activeDraft.isCarousel && activeDraft.slides) {
        const originalIndex = activeSlideIndex;
        for (let i = 0; i < activeDraft.slides.length; i++) {
          const dataUrl = await doCapture(i);
          await new Promise(r => setTimeout(r, 200));
          const link = document.createElement('a');
          link.download = `SerenaRaga_${activeDraft.title?.replace(/\s+/g, '_') || fmt}_Slide_${i + 1}.jpg`;
          link.href = dataUrl;
          link.click();
          await new Promise(r => setTimeout(r, 300));
        }
        setActiveSlideIndex(originalIndex);
      } else {
        const dataUrl = await doCapture(0);
        const link = document.createElement('a');
        link.download = `SerenaRaga_${activeDraft.title?.replace(/\s+/g, '_') || fmt}.jpg`;
        link.href = dataUrl;
        link.click();
      }
    } catch (err) {
      console.error('Download failed', err);
      alert('Gagal mengunduh. Coba lagi.');
    } finally {
      setIsDownloading(false);
    }

  };

  const cycleVignetteColor = () => {
    if (!activeDraft) return;
    const colors: ('none' | 'black' | 'white')[] = ['none', 'black', 'white'];
    const current = viewDraft?.vignetteColor || 'none';
    const next = colors[(colors.indexOf(current) + 1) % colors.length];
    
    if (isCarousel && activeDraft.slides) {
      const newSlides = [...activeDraft.slides];
      newSlides[activeSlideIndex] = {
        ...newSlides[activeSlideIndex],
        vignetteColor: next
      };
      setActiveDraft({ ...activeDraft, slides: newSlides });
    } else {
      setActiveDraft({ ...activeDraft, vignetteColor: next });
    }
  };

  const toggleDarken = useCallback(() => {
    if (!activeDraft) return;
    const current = (activeDraft.slides?.[activeSlideIndex]?.darkenIntensity ?? activeDraft.darkenIntensity) || 0;
    const next = current === 0 ? 60 : 0;
    
    if (activeDraft.isCarousel && activeDraft.slides) {
      const newSlides = [...activeDraft.slides];
      newSlides[activeSlideIndex] = { ...newSlides[activeSlideIndex], darkenIntensity: next };
      setActiveDraft({ ...activeDraft, slides: newSlides });
    } else {
      setActiveDraft({ ...activeDraft, darkenIntensity: next });
    }
  }, [activeDraft, activeSlideIndex]);

  const changeDarkenIntensity = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!activeDraft) return;
    const intensity = parseInt(e.target.value);
    
    if (activeDraft.isCarousel && activeDraft.slides) {
      const newSlides = [...activeDraft.slides];
      newSlides[activeSlideIndex] = { ...newSlides[activeSlideIndex], darkenIntensity: intensity };
      setActiveDraft({ ...activeDraft, slides: newSlides });
    } else {
      setActiveDraft({ ...activeDraft, darkenIntensity: intensity });
    }
  }, [activeDraft, activeSlideIndex]);

  const changeVignetteIntensity = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!activeDraft) return;
    const intensity = parseInt(e.target.value);
    if (activeDraft.isCarousel && activeDraft.slides) {
      const newSlides = [...activeDraft.slides];
      newSlides[activeSlideIndex] = { ...newSlides[activeSlideIndex], vignetteIntensity: intensity };
      setActiveDraft({ ...activeDraft, slides: newSlides });
    } else {
      setActiveDraft({ ...activeDraft, vignetteIntensity: intensity });
    }
  }, [activeDraft, activeSlideIndex]);

  const cycleColorMode = useCallback(() => {
    if (!activeDraft) return;
    const modes: ('auto' | 'light' | 'dark')[] = ['auto', 'light', 'dark'];
    const current = (activeDraft.slides?.[activeSlideIndex]?.colorMode ?? activeDraft.colorMode) || 'auto';
    const next = modes[(modes.indexOf(current) + 1) % modes.length];
    if (activeDraft.isCarousel && activeDraft.slides) {
      const newSlides = [...activeDraft.slides];
      newSlides[activeSlideIndex] = { ...newSlides[activeSlideIndex], colorMode: next };
      setActiveDraft({ ...activeDraft, slides: newSlides });
    } else {
      setActiveDraft({ ...activeDraft, colorMode: next });
    }
  }, [activeDraft, activeSlideIndex]);

  const isCarousel = !!(activeDraft && activeDraft.isCarousel && activeDraft.slides && activeDraft.slides.length > 0);
  const currentSlide = isCarousel && activeDraft?.slides ? activeDraft.slides[activeSlideIndex] : null;

  // Memoized to prevent unnecessary re-renders of the canvas on unrelated state changes
  const viewDraft = useMemo(() => activeDraft ? {
    ...activeDraft,
    theme: currentSlide?.theme || activeDraft.theme,
    title: currentSlide?.title || activeDraft.title,
    description: currentSlide?.description || activeDraft.description,
    price: currentSlide?.price || activeDraft.price,
    myth: currentSlide?.myth || activeDraft.myth,
    fact: currentSlide?.fact || activeDraft.fact,
    quote: currentSlide?.quote || activeDraft.quote,
    author: currentSlide?.author || activeDraft.author,
    listItems: currentSlide?.listItems || activeDraft.listItems,
    elements: currentSlide?.elements || activeDraft.elements || [],
    bgImage: currentSlide?.bgImage || activeDraft.bgImage,
    vignetteColor: currentSlide?.vignetteColor || activeDraft.vignetteColor,
    vignetteIntensity: currentSlide?.vignetteIntensity !== undefined ? currentSlide.vignetteIntensity : activeDraft.vignetteIntensity,
    darkenIntensity: currentSlide?.darkenIntensity !== undefined ? currentSlide.darkenIntensity : activeDraft.darkenIntensity,
    colorMode: currentSlide?.colorMode || activeDraft.colorMode,
  } : null, [activeDraft, currentSlide]);

  const handleSetElements = useCallback((newEls: CanvasElementData[]) => {
    if (!activeDraft) return;
    if (isCarousel && activeDraft.slides) {
      const newSlides = [...activeDraft.slides];
      newSlides[activeSlideIndex] = { ...newSlides[activeSlideIndex], elements: newEls };
      setActiveDraft({ ...activeDraft, slides: newSlides });
    } else {
      setActiveDraft({ ...activeDraft, elements: newEls });
    }
  }, [activeDraft, isCarousel, activeSlideIndex]);

  const handleAddText = () => {
    if (!activeDraft) return;
    const newEl: CanvasElementData = {
      id: `text-${Date.now()}`,
      text: 'New Text',
      x: 200,
      y: 200,
      fontSize: 48,
      color: '#ffffff',
      textAlign: 'center',
      fontWeight: 'bold'
    };
    if (isCarousel && activeDraft.slides) {
      const newSlides = [...activeDraft.slides];
      const activeSlide = newSlides[activeSlideIndex];
      newSlides[activeSlideIndex] = {
        ...activeSlide,
        elements: [...(activeSlide.elements || []), newEl]
      };
      setActiveDraft({ ...activeDraft, slides: newSlides });
    } else {
      setActiveDraft({
        ...activeDraft,
        elements: [...(activeDraft.elements || []), newEl]
      });
    }
  };

  const handleTextEdit = useCallback((field: string, value: string) => {
    if (!activeDraft) return;
    
    // Clean up decorative characters that were added for display
    let cleanValue = value;
    if (field === 'quote') {
      cleanValue = cleanValue.replace(/^["“”]/, '').replace(/["“”]$/, '');
    } else if (field === 'author') {
      cleanValue = cleanValue.replace(/^—\s*/, '');
    }

    if (field.startsWith('voucherData.')) {
      const vKey = field.split('.')[1];
      if (isCarousel && activeDraft.slides) {
        const newSlides = [...activeDraft.slides];
        newSlides[activeSlideIndex] = {
          ...newSlides[activeSlideIndex],
          voucherData: { ...(newSlides[activeSlideIndex].voucherData || {}), [vKey]: cleanValue } as VoucherData
        };
        setActiveDraft({ ...activeDraft, slides: newSlides });
      } else {
        setActiveDraft({
          ...activeDraft,
          voucherData: { ...(activeDraft.voucherData || {}), [vKey]: cleanValue } as VoucherData
        });
      }
      return;
    }

    if (isCarousel && activeDraft.slides) {
      const newSlides = [...activeDraft.slides];
      newSlides[activeSlideIndex] = {
        ...newSlides[activeSlideIndex],
        [field]: cleanValue
      };
      setActiveDraft({ ...activeDraft, slides: newSlides });
    } else {
      setActiveDraft({
        ...activeDraft,
        [field]: cleanValue
      });
    }
  }, [activeDraft, isCarousel, activeSlideIndex]);

  const openBgPrompt = () => {
    if (!activeDraft) return;
    let currentSubject = activeDraft.visualSubject || "";
    if (viewDraft && isCarousel && activeDraft.slides) {
      currentSubject = activeDraft.slides[activeSlideIndex]?.visualSubject || currentSubject;
    }
    setBgPromptText(currentSubject);
    setShowBgPrompt(true);
  };

  const submitRegenerateBackground = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeDraft || !bgPromptText) return;

    setShowBgPrompt(false);
    setStep('visualizing');
    
    try {
      const imgRes = await fetch('/api/ai/grok-image', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ 
          visualSubject: bgPromptText, 
          seasonalNuance: "none",
          artStyle: activeDraft.artStyle || "photorealistic",
          format: targetFormat,
          title: activeDraft.title,
          description: activeDraft.description
        })
      });
      const imgData = await imgRes.json();
      
      if (imgData.url) {
        if (isCarousel && activeDraft.slides) {
          const newSlides = [...activeDraft.slides];
          newSlides[activeSlideIndex] = {
            ...newSlides[activeSlideIndex],
            bgImage: imgData.url,
            visualSubject: bgPromptText
          };
          setActiveDraft({ ...activeDraft, slides: newSlides });
        } else {
          setActiveDraft({
            ...activeDraft,
            bgImage: imgData.url,
            visualSubject: bgPromptText
          });
        }
      } else {
        alert("Gagal regenerate background. Coba lagi.");
      }
    } catch (e) {
      console.error(e);
      alert("Terjadi kesalahan saat regenerate background.");
    } finally {
      setStep('ready');
    }
  };

  return (
    <div className="-m-4 h-[calc(100dvh-56px)] lg:h-[100dvh] overflow-hidden bg-[#f7f6f3] p-4 flex flex-col relative">
      {/* Subtle Grain Overlay for Premium Feel */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-multiply" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/stardust.png")' }}></div>
      
      {/* HEADER */}
      <header className="max-w-none w-full mb-4 flex items-center shrink-0 relative z-10 px-2 gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight text-stone-900 flex items-center gap-3">
            Feed Studio
          </h1>
          <p className="text-stone-500 mt-2 text-sm font-medium">Hybrid AI Content & Poster Generation Engine</p>
        </div>

        {/* Format Selector (Moved to Top) */}
        <div className="flex bg-white/90 backdrop-blur-xl rounded-full shadow-lg shadow-stone-200/50 border border-stone-200 p-1.5 shrink-0 items-center justify-center gap-1">
          <button 
            onClick={() => handleFormatChange('feed')}
            className={`px-5 py-2 rounded-full text-xs font-bold tracking-wide transition-all whitespace-nowrap active:scale-95 ${targetFormat === 'feed' ? 'bg-earth-primary text-white shadow-md' : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100'}`}
          >
            Feed
          </button>
          <button 
            onClick={() => handleFormatChange('story')}
            className={`px-5 py-2 rounded-full text-xs font-bold tracking-wide transition-all whitespace-nowrap active:scale-95 ${targetFormat === 'story' ? 'bg-earth-primary text-white shadow-md' : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100'}`}
          >
            Story
          </button>
          <button 
            onClick={() => handleFormatChange('square')}
            className={`px-5 py-2 rounded-full text-xs font-bold tracking-wide transition-all whitespace-nowrap active:scale-95 ${targetFormat === 'square' ? 'bg-earth-primary text-white shadow-md' : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100'}`}
          >
            Square
          </button>
          <button 
            onClick={() => handleFormatChange('voucher')}
            className={`px-5 py-2 rounded-full text-xs font-bold tracking-wide transition-all whitespace-nowrap active:scale-95 ${targetFormat === 'voucher' ? 'bg-earth-primary text-white shadow-md' : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100'}`}
          >
            Voucher
          </button>
        </div>

        {/* Studio Mode Switcher */}
        <div className="flex-1 flex justify-end">
          <div className="flex bg-stone-200/50 p-1.5 rounded-full border border-stone-200/80 shadow-sm shrink-0">
            <button 
              onClick={() => setStudioMode('smart')}
              className={`px-6 py-2 rounded-full text-sm font-semibold tracking-wide transition-all active:scale-95 ${studioMode === 'smart' ? 'bg-white text-stone-900 shadow-md border border-stone-100' : 'text-stone-500 hover:text-stone-700'}`}
            >
              Smart Template
            </button>
            <button 
              onClick={() => setStudioMode('pro')}
              className={`px-6 py-2 rounded-full text-sm font-semibold tracking-wide transition-all active:scale-95 ${studioMode === 'pro' ? 'bg-earth-primary text-white shadow-md' : 'text-stone-500 hover:text-stone-700'}`}
            >
              Pro Canvas (Poster)
            </button>
          </div>
        </div>
      </header>

      {/* CANVA-STYLE TOOL RIBBON & FLYOUT LAYOUT */}
      <div className="w-full flex gap-0 flex-1 min-h-0 relative z-10 px-2 pb-2">
        
        {/* TOOL RIBBON */}
        <div className="w-16 shrink-0 flex flex-col items-center gap-4 py-6 bg-white/90 backdrop-blur-2xl border border-stone-200/60 rounded-3xl shadow-md z-30 relative">
          <button 
            onClick={() => setActiveTool(activeTool === 'intelligence' ? null : 'intelligence')}
            className={`p-3 rounded-xl transition-all active:scale-95 flex flex-col items-center gap-1.5 ${activeTool === 'intelligence' ? 'bg-earth-primary/10 text-earth-primary shadow-sm' : 'text-stone-400 hover:text-stone-600 hover:bg-stone-50'}`}
            title="Intelligence"
          >
            <Sparkles size={20} />
          </button>
          <button 
            onClick={() => setActiveTool(activeTool === 'drafts' ? null : 'drafts')}
            className={`p-3 rounded-xl transition-all active:scale-95 flex flex-col items-center gap-1.5 ${activeTool === 'drafts' ? 'bg-earth-primary/10 text-earth-primary shadow-sm' : 'text-stone-400 hover:text-stone-600 hover:bg-stone-50'}`}
            title="Drafts"
          >
            <Layers size={20} />
          </button>
          <button 
            onClick={() => setActiveTool(activeTool === 'copywriting' ? null : 'copywriting')}
            className={`p-3 rounded-xl transition-all active:scale-95 flex flex-col items-center gap-1.5 ${activeTool === 'copywriting' ? 'bg-earth-primary/10 text-earth-primary shadow-sm' : 'text-stone-400 hover:text-stone-600 hover:bg-stone-50'}`}
            title="Copywriting"
          >
            <Hash size={20} />
          </button>
        </div>

        {/* FLYOUT PANEL (ABSOLUTE OVERLAY) */}
        <div className={`absolute left-[80px] top-0 bottom-2 bg-white/95 backdrop-blur-3xl shadow-2xl shadow-stone-900/10 border border-stone-200/60 rounded-3xl transition-all duration-300 ease-in-out overflow-hidden z-20 flex flex-col ${activeTool ? 'w-[340px] opacity-100 translate-x-0 pointer-events-auto' : 'w-[340px] opacity-0 -translate-x-8 pointer-events-none'}`}>
          <div className="p-6 flex-1 overflow-y-auto minimal-scrollbar flex flex-col min-w-[340px] gap-6">
            
            {/* FLYOUT: INTELLIGENCE */}
            {activeTool === 'intelligence' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4 h-full">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-stone-400 flex items-center gap-2">
                    <Sparkles size={14} /> Intelligence
                  </h2>
                  <button onClick={() => setActiveTool(null)} className="text-stone-400 hover:text-stone-600 p-1"><ChevronLeft size={16}/></button>
                </div>
                <div className="relative">
                  <textarea 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Contoh: Buatkan promo pijat spesial Hari Raya..."
                    className="w-full bg-[#faf9f7] rounded-2xl p-5 text-stone-800 focus:outline-none focus:ring-2 focus:ring-earth-primary/30 border border-stone-100 resize-none h-40 transition-all placeholder:text-stone-400 text-sm leading-relaxed"
                  />
                  <motion.button 
                    whileHover={{ scale: 0.98 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={generatePost}
                    disabled={step !== 'idle' && step !== 'ready'}
                    className="absolute bottom-4 right-4 bg-earth-primary text-white p-3.5 rounded-xl shadow-lg shadow-earth-primary/30 disabled:opacity-50 flex items-center justify-center gap-2 transition-shadow"
                  >
                    {step === 'ideating' || step === 'visualizing' ? (
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, ease: "linear", duration: 1 }}>
                        <Sparkles size={18} />
                      </motion.div>
                    ) : (
                      <Wand2 size={18} />
                    )}
                  </motion.button>
                </div>
                <AnimatePresence mode="wait">
                  {step !== 'idle' && step !== 'ready' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2 text-sm text-earth-primary font-medium flex items-center gap-2"
                    >
                      <div className="w-2 h-2 rounded-full bg-earth-primary animate-pulse" />
                      {step === 'ideating' ? 'Menganalisis ide & copy...' : 'Melukis visual...'}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* FLYOUT: DRAFTS */}
            {activeTool === 'drafts' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4 h-full">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-stone-400 flex items-center gap-2">
                    <Layers size={14} /> Drafts
                  </h2>
                  <button onClick={() => setActiveTool(null)} className="text-stone-400 hover:text-stone-600 p-1"><ChevronLeft size={16}/></button>
                </div>
                <div className="flex flex-col gap-3 flex-1 overflow-y-auto minimal-scrollbar pb-10">
                  <AnimatePresence>
                    {draftHistory.length === 0 ? (
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-stone-400 text-center py-8">
                        Belum ada draft. Ketik prompt di Intelligence untuk memulai.
                      </motion.p>
                    ) : (
                      draftHistory.map((draft, idx) => (
                        <motion.div 
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          key={draft.id}
                          onClick={() => { setActiveDraft(draft); setActiveSlideIndex(0); }}
                          className={`p-5 rounded-2xl cursor-pointer transition-all border relative group active:scale-[0.98] ${activeDraft?.id === draft.id ? 'bg-[#faf9f7] border-earth-primary/30 shadow-sm' : 'bg-white border-stone-100 hover:border-stone-300 hover:bg-stone-50'}`}
                        >
                          <h3 className="font-semibold text-stone-800 line-clamp-1 pr-6 tracking-tight">{draft.title || "Untitled Draft"}</h3>
                          <p className="text-xs text-stone-500 mt-1.5 line-clamp-1 leading-relaxed">{draft.description || draft.caption}</p>
                          <button 
                            onClick={(e) => deleteDraft(draft.id, e)}
                            className="absolute top-4 right-4 text-stone-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                            title="Hapus Draft"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                          </button>
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}

            {/* FLYOUT: COPYWRITING */}
            {activeTool === 'copywriting' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4 h-full">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-stone-400 flex items-center gap-2">
                    <Hash size={14} /> Copywriting
                  </h2>
                  <div className="flex items-center gap-1">
                    {activeDraft && (
                      <button 
                        onClick={() => navigator.clipboard.writeText(activeDraft.caption)}
                        className="text-earth-primary hover:bg-earth-primary/10 px-2 py-1 rounded-lg transition-colors flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase active:scale-95"
                      >
                        <Copy size={12} /> COPY
                      </button>
                    )}
                    <button onClick={() => setActiveTool(null)} className="text-stone-400 hover:text-stone-600 p-1"><ChevronLeft size={16}/></button>
                  </div>
                </div>

                {activeDraft ? (
                  <div className="flex-grow minimal-scrollbar">
                    <textarea 
                      className="w-full h-full min-h-[300px] bg-[#faf9f7] border border-stone-100 rounded-2xl p-6 text-[13px] text-stone-700 leading-relaxed focus:outline-none focus:ring-2 focus:ring-earth-primary/30 resize-none"
                      value={activeDraft.caption}
                      onChange={(e) => setActiveDraft({ ...activeDraft, caption: e.target.value })}
                    />
                  </div>
                ) : (
                  <div className="flex-grow flex items-center justify-center text-sm text-stone-400 text-center px-6 border-2 border-dashed border-stone-200/50 rounded-2xl m-1">
                    Tulisan caption, hashtag, dan call-to-action akan muncul di sini.
                  </div>
                )}
              </motion.div>
            )}

          </div>
        </div>

        {/* CENTER PANEL: The Stage (Canvas - Flex-1) */}
        <div 
          className="flex-1 flex flex-col items-center gap-6 relative overflow-y-auto minimal-scrollbar p-4 ml-4 z-10"
          onClick={() => setIsCanvasSelected(false)}
        >
           
          {/* Zoom Slider (Footer / Bottom Right) */}
          <div className="fixed bottom-6 right-8 z-50 bg-white/90 backdrop-blur-xl rounded-full shadow-xl shadow-stone-200/50 border border-stone-200 px-5 py-2.5 flex items-center gap-3">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em]">Zoom</span>
            <input 
              type="range" 
              min="0.3" 
              max="2" 
              step="0.05" 
              value={zoom} 
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-28 accent-earth-primary h-1 bg-stone-200 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-[10px] font-mono font-bold text-stone-500 w-8 text-right">{Math.round(zoom * 100)}%</span>
          </div>

           {activeDraft && viewDraft ? (
             <div 
               ref={containerRef}
               className={`flex flex-col items-center gap-6 w-full ${viewDraft.format === 'voucher' ? 'max-w-[1000px]' : 'max-w-[480px]'} m-auto transition-all duration-300 origin-top pt-24 pb-32`}
               style={{ zoom: zoom }}
             >
               <div 
                 onClick={(e) => {
                   e.stopPropagation();
                   setIsCanvasSelected(true);
                   setSelectedTextId(null);
                 }}
                 className={`group relative w-full ${viewDraft.format === 'story' ? 'aspect-[9/16]' : viewDraft.format === 'square' ? 'aspect-square' : viewDraft.format === 'voucher' ? 'aspect-[30/13]' : 'aspect-[4/5]'} bg-white shadow-[0_30px_80px_-20px_rgba(0,0,0,0.25)] transition-all duration-200 cursor-pointer`}
               >
                 {/* Selection Border Overlay */}
                 <div className={`absolute inset-0 pointer-events-none transition-all duration-200 z-50 ${isCanvasSelected ? 'ring-2 ring-inset ring-blue-500' : 'ring-1 ring-inset ring-transparent group-hover:ring-2 group-hover:ring-blue-400/50'}`}></div>
                 {/* THE CANVAS */}
                 <div 
                   className="absolute top-0 left-0"
                   style={{ 
                     zoom: viewDraft.format === 'voucher' ? (1000/1200) : (480/1080) 
                   }}
                 >
                   <div 
                     ref={postRef}
                     className={`relative bg-[#fdfaf5] overflow-hidden`}
                     style={{ 
                       width: viewDraft.format === 'voucher' ? 1200 : 1080,
                       height: viewDraft.format === 'story' ? 1920 : viewDraft.format === 'square' ? 1080 : viewDraft.format === 'voucher' ? 520 : 1350,
                     }}
                   >
                    {/* MODULAR TEMPLATE REGISTRY OR POSTER CANVAS */}
                    {(() => {
                      if (studioMode === 'pro') {
                        return (
                          <PosterCanvas 
                            draft={viewDraft} 
                            elements={viewDraft.elements || []} 
                            setElements={handleSetElements} 
                            Logo={Logo} 
                            WAIco={WAIco} 
                            InstagramIco={InstagramIco} 
                            activeId={selectedTextId}
                            setActiveId={setSelectedTextId}
                          />
                        );
                      }

                      let templateId = viewDraft.theme || 'classic_glass';
                      
                      // Force full-bleed templates for vector style (SplitScreenDark crops the top half)
                      if (viewDraft.artStyle === 'vector' && templateId === 'split_screen_dark') {
                        templateId = 'classic_glass';
                      }

                      const props = { draft: viewDraft, Logo, WAIco, InstagramIco, onEdit: handleTextEdit };

                      switch (templateId) {
                        case 'split_screen_dark':
                          return <SplitScreenDark {...props} />;
                        case 'editorial_overlay':
                          return <EditorialOverlay {...props} />;
                        case 'story_minimalist':
                          return <StoryMinimalist {...props} />;
                        case 'gift_voucher':
                          return <GiftVoucher {...props} />;
                        case 'classic_glass':
                        default:
                          return <ClassicGlass {...props} />;
                      }
                    })()}
                   </div>
                 </div>
  
                 {/* Top Floating Control Bar (Canva Style) */}
                 <div 
                   className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 z-50 origin-bottom pointer-events-none transition-opacity duration-300"
                   style={{ 
                     zoom: 1 / zoom,
                     opacity: isCanvasSelected ? 1 : 0
                   }}
                 >
                   <div 
                     onClick={(e) => e.stopPropagation()}
                     className={`bg-white/95 backdrop-blur-2xl border border-stone-200 shadow-xl shadow-stone-200/50 rounded-xl px-2 py-1.5 flex items-center gap-2 transition-transform duration-300 pointer-events-auto ${isCanvasSelected ? 'translate-y-0' : 'translate-y-2'}`}
                   >
                    {(() => {
                      const activeElement = selectedTextId ? viewDraft.elements?.find(e => e.id === selectedTextId) : null;
                      if (activeElement) {
                        return (
                          <>
                            <div className="p-1.5 rounded-lg text-stone-400 mr-1 flex items-center justify-center">
                              <Type size={14} />
                            </div>

                            {/* Font Size */}
                            <div className="flex items-center gap-1.5 bg-stone-100/80 rounded-lg p-1.5 border border-stone-200/50">
                              <button className="px-2 py-0.5 hover:bg-white rounded shadow-sm text-stone-600 font-bold active:scale-90 transition-all" onClick={() => {
                                const newEls = viewDraft.elements!.map(e => e.id === activeElement.id ? {...e, fontSize: Math.max(12, e.fontSize - 4)} : e);
                                handleSetElements(newEls);
                              }}>-</button>
                              <span className="text-[11px] font-mono font-bold w-7 text-center text-stone-600">{activeElement.fontSize}</span>
                              <button className="px-2 py-0.5 hover:bg-white rounded shadow-sm text-stone-600 font-bold active:scale-90 transition-all" onClick={() => {
                                const newEls = viewDraft.elements!.map(e => e.id === activeElement.id ? {...e, fontSize: e.fontSize + 4} : e);
                                handleSetElements(newEls);
                              }}>+</button>
                            </div>
                            
                            {/* Letter Spacing */}
                            <div className="flex items-center gap-1.5 bg-stone-100/80 rounded-lg p-1.5 border border-stone-200/50">
                              <span className="text-[9px] font-bold tracking-widest uppercase text-stone-400 pl-1">Spc</span>
                              <button className="px-2 py-0.5 hover:bg-white rounded shadow-sm text-stone-600 font-bold active:scale-90 transition-all" onClick={() => {
                                const newEls = viewDraft.elements!.map(e => e.id === activeElement.id ? {...e, letterSpacing: Math.max(-5, (e.letterSpacing || 0) - 1)} : e);
                                handleSetElements(newEls);
                              }}>-</button>
                              <span className="text-[11px] font-mono font-bold w-6 text-center text-stone-600">{activeElement.letterSpacing || 0}</span>
                              <button className="px-2 py-0.5 hover:bg-white rounded shadow-sm text-stone-600 font-bold active:scale-90 transition-all" onClick={() => {
                                const newEls = viewDraft.elements!.map(e => e.id === activeElement.id ? {...e, letterSpacing: Math.min(20, (e.letterSpacing || 0) + 1)} : e);
                                handleSetElements(newEls);
                              }}>+</button>
                            </div>

                            <div className="w-px h-6 bg-stone-200" />
                            
                            {/* Alignment */}
                            <div className="flex items-center gap-1">
                              <button className={`p-2 rounded-lg transition-all active:scale-90 ${activeElement.textAlign === 'left' ? 'bg-earth-primary text-white shadow-md shadow-earth-primary/20' : 'text-stone-500 hover:bg-stone-100'}`} onClick={() => {
                                const newEls = viewDraft.elements!.map(e => e.id === activeElement.id ? {...e, textAlign: 'left' as const} : e);
                                handleSetElements(newEls);
                              }}><AlignLeft size={14}/></button>
                              <button className={`p-2 rounded-lg transition-all active:scale-90 ${activeElement.textAlign === 'center' ? 'bg-earth-primary text-white shadow-md shadow-earth-primary/20' : 'text-stone-500 hover:bg-stone-100'}`} onClick={() => {
                                const newEls = viewDraft.elements!.map(e => e.id === activeElement.id ? {...e, textAlign: 'center' as const} : e);
                                handleSetElements(newEls);
                              }}><AlignCenter size={14}/></button>
                              <button className={`p-2 rounded-lg transition-all active:scale-90 ${activeElement.textAlign === 'right' ? 'bg-earth-primary text-white shadow-md shadow-earth-primary/20' : 'text-stone-500 hover:bg-stone-100'}`} onClick={() => {
                                const newEls = viewDraft.elements!.map(e => e.id === activeElement.id ? {...e, textAlign: 'right' as const} : e);
                                handleSetElements(newEls);
                              }}><AlignRight size={14}/></button>
                            </div>

                            <div className="w-px h-6 bg-stone-200" />
                            
                            {/* Curated Brand Colors */}
                            <div className="flex items-center gap-2">
                              {['#ffffff', '#1c1917', '#8B5E3C', '#D2C5B8', '#8DA399'].map(c => (
                                <button key={c} className={`w-5 h-5 rounded-full border border-stone-200 shadow-sm transition-transform active:scale-90 ${activeElement.color === c ? 'ring-2 ring-offset-2 ring-earth-primary scale-110' : 'hover:scale-110'}`} style={{backgroundColor: c}} onClick={() => {
                                  const newEls = viewDraft.elements!.map(e => e.id === activeElement.id ? {...e, color: c} : e);
                                  handleSetElements(newEls);
                                }} />
                              ))}
                            </div>

                            <div className="w-px h-6 bg-stone-200" />

                            <div className="flex items-center gap-1">
                              <button className="p-2 hover:bg-stone-100 text-stone-500 rounded-lg transition-colors active:scale-90" title="Duplicate" onClick={() => {
                                const newEl = { ...activeElement, id: `text-${Date.now()}`, x: activeElement.x + 20, y: activeElement.y + 20 };
                                handleSetElements([...viewDraft.elements!, newEl]);
                                setSelectedTextId(newEl.id);
                              }}>
                                <Copy size={14} />
                              </button>
                              <button className="p-2 hover:bg-red-50 hover:text-red-600 text-stone-400 rounded-lg transition-colors active:scale-90" title="Delete" onClick={() => {
                                handleSetElements(viewDraft.elements!.filter(e => e.id !== activeElement.id));
                                setSelectedTextId(null);
                              }}>
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </>
                        );
                      }

                      return (
                        <>
                    <div className="relative">
                      {showThemePrompt && (
                        <div className="absolute top-full mt-4 left-0 w-[220px] bg-white rounded-2xl shadow-2xl shadow-stone-200/60 border border-stone-200 p-3 z-50">
                          <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] mb-2 px-1">Pilih Tema</h4>
                          <div className="flex flex-col gap-1">
                            {[
                              { id: 'classic_glass', label: 'Classic Glass' },
                              { id: 'split_screen_dark', label: 'Split Screen Dark' },
                              { id: 'editorial_overlay', label: 'Editorial Overlay' },
                              { id: 'story_minimalist', label: 'Story Minimalist' },
                              { id: 'gift_voucher', label: 'Gift Voucher' }
                            ].map(theme => (
                              <button 
                                key={theme.id}
                                onClick={() => {
                                  if (isCarousel && activeDraft?.slides) {
                                    const newSlides = [...activeDraft.slides];
                                    newSlides[activeSlideIndex] = { ...newSlides[activeSlideIndex], theme: theme.id };
                                    setActiveDraft({ ...activeDraft, slides: newSlides });
                                  } else if (activeDraft) {
                                    setActiveDraft({ ...activeDraft, theme: theme.id });
                                  }
                                  setShowThemePrompt(false);
                                }}
                                className={`text-left px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                                  (isCarousel && activeDraft?.slides ? activeDraft.slides[activeSlideIndex]?.theme : activeDraft?.theme) === theme.id || 
                                  (!(isCarousel && activeDraft?.slides ? activeDraft.slides[activeSlideIndex]?.theme : activeDraft?.theme) && theme.id === 'classic_glass') 
                                    ? 'bg-earth-primary text-white shadow-sm' 
                                    : 'text-stone-600 hover:bg-stone-100'
                                }`}
                              >
                                {theme.label}
                              </button>
                            ))}
                          </div>
                          <div className="absolute -top-2 left-6 w-4 h-4 bg-white border-t border-l border-stone-200 transform rotate-45" />
                        </div>
                      )}
                      <button 
                        onClick={() => { setShowThemePrompt(!showThemePrompt); setShowBgPrompt(false); }}
                        title="Ganti Tema"
                        className={`p-2 transition-colors relative z-10 hover:scale-105 active:scale-95 ${showThemePrompt ? 'text-earth-primary' : 'text-stone-500 hover:text-earth-primary'}`}
                      >
                        <LayoutTemplate size={18} />
                      </button>
                    </div>
                    <div className="relative">
                      {showBgPrompt && (
                        <div className="absolute top-full mt-4 left-0 w-[320px] bg-white rounded-2xl shadow-2xl shadow-stone-200/60 border border-stone-200 p-4 z-50">
                          <form onSubmit={submitRegenerateBackground} className="flex flex-col gap-3">
                            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em]">Regenerate Prompt</label>
                            <textarea 
                              autoFocus
                              value={bgPromptText}
                              onChange={(e) => setBgPromptText(e.target.value)}
                              className="w-full h-24 text-sm p-3 rounded-xl bg-stone-50 border border-stone-200 focus:outline-none focus:ring-2 focus:ring-earth-primary/50 resize-none text-stone-700"
                              placeholder="Ketik prompt baru untuk gambar latar..."
                            />
                            <div className="flex justify-end gap-2 mt-1">
                              <button type="button" onClick={() => setShowBgPrompt(false)} className="px-4 py-2 text-xs font-bold text-stone-500 hover:text-stone-800 transition-colors active:scale-95">Batal</button>
                              <button type="submit" className="px-4 py-2 text-xs font-bold bg-earth-primary text-white rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 active:scale-95">
                                <Sparkles size={14} /> Generate
                              </button>
                            </div>
                          </form>
                          {/* Triangle pointer */}
                          <div className="absolute -top-2 left-6 w-4 h-4 bg-white border-t border-l border-stone-200 transform rotate-45" />
                        </div>
                      )}
                      <button 
                        onClick={() => { openBgPrompt(); setShowThemePrompt(false); }}
                        title="Regenerate Image"
                        className="p-2 text-stone-500 hover:text-earth-primary transition-colors disabled:opacity-50 relative z-10 hover:scale-105 active:scale-95"
                        disabled={step !== 'idle' && step !== 'ready'}
                      >
                        <ImageIcon size={18} />
                      </button>
                    </div>
                    <div className="w-[1px] h-5 bg-stone-200" />
                    

                    <div className="w-[1px] h-5 bg-stone-200" />
                    {/* Darken Controls */}
                    <div className="flex items-center gap-2 px-2">
                      <button 
                        onClick={toggleDarken}
                        title="Gelapkan Background"
                        className={`p-2 rounded-full transition-all active:scale-95 ${!viewDraft.darkenIntensity ? 'text-stone-400 hover:bg-stone-100 hover:text-stone-600' : 'bg-stone-800 text-white shadow-md shadow-stone-800/20'}`}
                      >
                        <Moon size={16} />
                      </button>
                      {(viewDraft.darkenIntensity ?? 0) > 0 && (
                        <input 
                          type="range" 
                          min="0" max="100" 
                          value={viewDraft.darkenIntensity ?? 0} 
                          onChange={changeDarkenIntensity}
                          className="w-20 h-1.5 accent-earth-primary bg-stone-200 rounded-lg appearance-none cursor-pointer"
                        />
                      )}
                    </div>
                    {/* Vignette Controls */}
                    <div className="flex items-center gap-2 px-2">
                      <button 
                        onClick={cycleVignetteColor}
                        title={`Vignette: ${viewDraft.vignetteColor || 'none'}`}
                        className={`p-2 rounded-full transition-all active:scale-95 border ${!viewDraft.vignetteColor || viewDraft.vignetteColor === 'none' ? 'border-transparent text-stone-400 hover:bg-stone-100 hover:text-stone-600' : viewDraft.vignetteColor === 'black' ? 'bg-black text-white border-black shadow-md' : 'bg-white text-black border-stone-200 shadow-sm'}`}
                      >
                        <Droplet size={16} />
                      </button>
                      {viewDraft.vignetteColor && viewDraft.vignetteColor !== 'none' && (
                        <input 
                          type="range" 
                          min="0" max="100" 
                          value={viewDraft.vignetteIntensity || 50} 
                          onChange={changeVignetteIntensity}
                          className="w-20 h-1.5 accent-earth-primary bg-stone-200 rounded-lg appearance-none cursor-pointer"
                        />
                      )}
                    </div>
  
                    <div className="w-[1px] h-5 bg-stone-200" />
                    
                    {studioMode === 'pro' && (
                      <>
                        <button 
                          onClick={handleAddText}
                          className="flex items-center gap-1.5 bg-white hover:bg-stone-50 text-stone-700 px-4 py-2 rounded-xl border border-stone-200 text-xs font-bold shadow-sm transition-all whitespace-nowrap shrink-0 active:scale-95"
                        >
                          + Add Text
                        </button>
                        <div className="w-[1px] h-5 bg-stone-200" />
                      </>
                    )}
  
                    {/* Color Mode Control */}
                    <button 
                      onClick={cycleColorMode}
                      title={`Color Mode: ${viewDraft.colorMode || 'auto'}`}
                      className={`p-2 rounded-full transition-all flex items-center justify-center active:scale-95 border ${viewDraft.colorMode === 'auto' ? 'border-transparent text-stone-400 hover:bg-stone-100 hover:text-stone-600' : viewDraft.colorMode === 'dark' ? 'bg-black text-white border-black shadow-md' : 'bg-white text-black border-stone-200 shadow-sm'}`}
                    >
                      <Palette size={16} />
                    </button>
  
                    <div className="w-[1px] h-5 bg-stone-200" />
                    
              {batchName && batchVouchers.length > 0 && (
                <button 
                  onClick={handleGeneratePDF}
                  disabled={isGeneratingPDF}
                  className="bg-earth-primary text-white px-6 py-2.5 rounded-full hover:bg-earth-primary/90 transition-all flex items-center justify-center disabled:opacity-50 shadow-md shadow-earth-primary/20 active:scale-95"
                  title="Cetak PDF Bulk"
                >
                  {isGeneratingPDF ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />} <span className="text-sm ml-2 font-bold">{isGeneratingPDF ? `Memproses (${renderProgress?.current}/${renderProgress?.total})` : "Download PDF Bulk"}</span>
                </button>
              )}

              <button 
                onClick={handleDownload}
                      disabled={isDownloading}
                      className="flex items-center gap-2 bg-earth-primary text-white px-6 py-2.5 rounded-full text-xs font-bold hover:bg-earth-primary/90 transition-all disabled:opacity-50 shadow-md shadow-earth-primary/20 active:scale-95"
                    >
                      <Download size={14} /> {isCarousel ? `Download All` : `Download`}
                    </button>
                        </>
                      );
                    })()}
                 </div>
                 </div>
               </div>
               
               {/* Carousel Indicator & Pagination Pill */}
               {isCarousel && activeDraft.slides && (
                 <div className="flex items-center gap-4 bg-stone-900/95 backdrop-blur-md text-white rounded-full px-6 py-3 shadow-xl border border-stone-800 self-center">
                   <button 
                     disabled={activeSlideIndex === 0}
                     onClick={() => setActiveSlideIndex(prev => prev - 1)}
                     className="p-1.5 rounded-full hover:bg-stone-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-white active:scale-90"
                   >
                     <ChevronLeft size={18} />
                   </button>
                   <span className="text-xs font-bold tracking-[0.15em] uppercase select-none min-w-[80px] text-center text-stone-200">
                     Slide {activeSlideIndex + 1} / {activeDraft.slides.length}
                   </span>
                   <button 
                     disabled={activeSlideIndex === activeDraft.slides.length - 1}
                     onClick={() => setActiveSlideIndex(prev => prev + 1)}
                     className="p-1.5 rounded-full hover:bg-stone-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-white active:scale-90"
                   >
                     <ChevronRight size={18} />
                   </button>
                 </div>
               )}
             </div>
           ) : (
             <div className="text-center text-stone-400 flex flex-col items-center m-auto">
                <LayoutTemplate size={48} className="mb-5 opacity-20" />
                <p className="font-semibold text-stone-500">The Stage is Empty</p>
                <p className="text-sm mt-1">Generate a post to preview the canvas.</p>
             </div>
           )}

        </div>

      </div>
    
      {/* REMOVED: Old O(n) bulk container that rendered ALL vouchers at once — replaced by the single-node renderer below */}

      {/* Optimized Single Node Hidden Container for Bulk PDF Rendering */}
      <div 
        ref={batchContainerRef} 
        style={{ position: 'fixed', top: '-9999px', left: '-9999px', zIndex: -100, pointerEvents: 'none' }}
      >
        {batchName && batchVouchers.length > 0 && activeDraft && isGeneratingPDF && renderProgress && (
          <div style={{ width: 1200, height: 520, position: 'relative', overflow: 'hidden' }}>
            <GiftVoucher 
              draft={{ 
                ...activeDraft, 
                voucherData: { 
                  ...activeDraft.voucherData, 
                  ...(batchVouchers[renderProgress.current - 1] || {}) 
                } 
              }}
              Logo={Logo} WAIco={WAIco} InstagramIco={InstagramIco}
            />
          </div>
        )}
      </div>

      {/* Simple Delete Confirmation Modal */}
      {draftToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-[320px] max-w-[90vw] animate-in fade-in zoom-in-95 duration-200">
            <h3 className="font-bold text-stone-800 text-lg mb-2">Hapus Draft</h3>
            <p className="text-stone-500 text-sm mb-6">Apakah Anda yakin ingin menghapus draft ini? Tindakan ini tidak dapat dibatalkan.</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setDraftToDelete(null)}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-stone-600 hover:bg-stone-100 transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={confirmDeleteDraft}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors shadow-sm"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
