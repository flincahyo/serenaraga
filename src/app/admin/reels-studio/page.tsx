"use client";

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, Loader2, Sparkles, ImagePlay, Download, Play, Pause, RefreshCw, Type, AlignLeft, ArrowRight } from 'lucide-react';
import { toPng } from 'html-to-image';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

const PRESETS = [
  {
    id: 'shoulder',
    label: 'Leher & Bahu',
    prompt: 'Cinematic ultra close-up video of professional deep tissue massage on tense shoulders and neck, warm moody lighting, slow motion, relaxing luxury spa aesthetic, 4k, photorealistic'
  },
  {
    id: 'back',
    label: 'Punggung',
    prompt: 'Cinematic close up of thumb pressure on lower back muscles, therapeutic massage, relaxing dark spa environment with candle light reflection, 4k'
  },
  {
    id: 'foot',
    label: 'Refleksi Kaki',
    prompt: 'Slow motion close up of gentle foot reflexology massage, relieving stress, warm soft lighting, luxurious towel, 4k'
  }
];

export default function ReelsStudio() {
  const [activePreset, setActivePreset] = useState<string>('');
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(true);
  const [progressMsg, setProgressMsg] = useState('');

  // FFmpeg & Render State
  const ffmpegRef = useRef<any>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);

  const [overlay, setOverlay] = useState({
    hook: 'SERING PUSING KLIENGAN?',
    subhead: 'Mungkin leher & bahu Anda kaku. Waktunya rilis ketegangan sekarang.',
    cta: 'Booking Sekarang ➔'
  });

  const pollVideoStatus = async (requestId: string) => {
    try {
      const res = await fetch(`/api/ai/grok-video?request_id=${requestId}`);
      const data = await res.json();

      if (data.status === 'done' && data.url) {
        setVideoUrl(data.url);
        setIsPlaying(true);
        setGenerating(false);
        setProgressMsg('');
      } else if (data.status === 'failed') {
        alert('Gagal menghasilkan video. Silakan coba lagi.');
        setGenerating(false);
        setProgressMsg('');
      } else {
        // Pending
        setProgressMsg(data.progress ? `Merender Video: ${data.progress}%` : 'Video sedang diproses di server Grok...');
        setTimeout(() => pollVideoStatus(requestId), 5000);
      }
    } catch (e) {
      console.error(e);
      setGenerating(false);
      setProgressMsg('');
    }
  };

  const handleGenerate = async () => {
    if (!prompt) return;
    setGenerating(true);
    setProgressMsg('Mengirim prompt ke Grok...');
    try {
      const res = await fetch('/api/ai/grok-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      const data = await res.json();
      
      if (data.status === 'done' && data.url) {
        // Fallback or synchronous response
        setVideoUrl(data.url);
        setIsPlaying(true);
        setGenerating(false);
        setProgressMsg('');
      } else if (data.request_id) {
        // Asynchronous polling
        setProgressMsg('Prompt diterima! Memulai antrean render...');
        pollVideoStatus(data.request_id);
      } else {
        setGenerating(false);
        setProgressMsg('');
      }
    } catch (e) {
      console.error(e);
      setGenerating(false);
      setProgressMsg('');
    }
  };

  const handleDownload = async () => {
    if (!videoUrl || !overlayRef.current) return;
    try {
      setIsRendering(true);
      setRenderProgress(0);
      setProgressMsg('Memuat Mesin Render...');

      if (!ffmpegRef.current) {
        ffmpegRef.current = new FFmpeg();
      }
      const ffmpeg = ffmpegRef.current;
      
      if (!ffmpeg.loaded) {
        ffmpeg.on('progress', ({ progress }: { progress: number }) => {
          setRenderProgress(Math.round(progress * 100));
          setProgressMsg(`Menyatukan Video: ${Math.round(progress * 100)}%`);
        });
        
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
        await ffmpeg.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
      }

      setProgressMsg('Menyiapkan Grafis Canvas (High-Res)...');
      // Capture PNG at 5x pixel ratio for 4K-like sharpness (360x640 -> 1800x3200)
      const dataUrl = await toPng(overlayRef.current, { 
        pixelRatio: 5, 
        quality: 1.0,
        cacheBust: true 
      });
      
      setProgressMsg('Memproses MP4...');
      // Menggunakan proxy lokal untuk mem-bypass pemblokiran CORS dari Grok API
      const proxiedUrl = `/api/proxy-video?url=${encodeURIComponent(videoUrl)}`;
      ffmpeg.writeFile('input.mp4', await fetchFile(proxiedUrl));
      ffmpeg.writeFile('overlay.png', await fetchFile(dataUrl));

      setProgressMsg('Mulai Rendering (Memakan waktu)...');
      // 1. Crop original video to 9:16
      // 2. Scale the cropped video UP to 1080x1920
      // 3. Scale the high-res PNG to EXACTLY 1080x1920
      // 4. Overlay the text on the video
      await ffmpeg.exec([
        '-i', 'input.mp4',
        '-i', 'overlay.png',
        '-filter_complex', '[0:v]crop=ih*9/16:ih,scale=1080:1920[vid_bg];[1:v]scale=1080:1920[ov];[vid_bg][ov]overlay=0:0',
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', '18',
        '-c:a', 'copy',
        'output.mp4'
      ]);

      setProgressMsg('Menyimpan File...');
      const data = await ffmpeg.readFile('output.mp4');
      const url = URL.createObjectURL(new Blob([data as Uint8Array], { type: 'video/mp4' }));
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `SerenaRaga-Reels-Final-${Date.now()}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setIsRendering(false);
      setRenderProgress(0);
      setProgressMsg('');
    } catch (e) {
      console.error('Render failed', e);
      setIsRendering(false);
      setProgressMsg('');
      alert('Gagal merender video. Men-download video mentah sebagai alternatif.');
      window.open(videoUrl, '_blank'); 
    }
  };

  const handleReset = () => {
    setVideoUrl('');
    setPrompt('');
    setActivePreset('');
    setOverlay({
      hook: 'SERING PUSING KLIENGAN?',
      subhead: 'Mungkin leher & bahu Anda kaku. Waktunya rilis ketegangan sekarang.',
      cta: 'Booking Sekarang ➔'
    });
  };

  return (
    <div className="min-h-[100dvh] bg-[#050505] text-white flex flex-col md:flex-row font-sans overflow-hidden relative">
      
      {/* Abstract Background Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-900/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-emerald-900/10 blur-[120px] rounded-full pointer-events-none" />

      {/* LEFT PANEL - Controls */}
      <div className="w-full md:w-[400px] h-full flex-shrink-0 border-r border-white/10 bg-black/40 backdrop-blur-3xl p-6 lg:p-8 flex flex-col gap-8 z-10 overflow-y-auto">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
            <Video size={18} strokeWidth={1.5} className="text-white/80" />
          </div>
          <div>
            <h1 className="text-lg font-medium tracking-wide">Reels Studio</h1>
            <p className="text-xs text-white/40">Grok-powered Video Generator</p>
          </div>
        </div>

        {/* Section: Video Generation */}
        <div className="space-y-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-mono tracking-widest text-white/50 uppercase">Video Prompt</label>
              <Sparkles size={12} className="text-white/30" />
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              {PRESETS.map(p => (
                <button 
                  key={p.id}
                  onClick={() => {
                    setActivePreset(p.id);
                    setPrompt(p.prompt);
                  }}
                  className={`py-2 px-2 rounded-lg text-[10px] font-medium transition-all duration-300 border ${activePreset === p.id ? 'bg-white/10 border-white/20 text-white' : 'bg-transparent border-white/5 text-white/50 hover:bg-white/5 hover:text-white/80'}`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <textarea 
              value={prompt}
              onChange={e => {
                setPrompt(e.target.value);
                setActivePreset('');
              }}
              placeholder="Jelaskan scene video yang Anda inginkan secara detail..."
              className="w-full h-32 bg-black/50 border border-white/10 rounded-xl p-4 text-[13px] leading-relaxed text-white/90 placeholder:text-white/20 focus:outline-none focus:border-white/30 focus:bg-white/5 transition-all resize-none"
            />
          </div>

          <button 
            onClick={handleGenerate}
            disabled={!prompt || generating}
            className="w-full h-12 bg-white text-black rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? (
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" /> 
                  <span>{progressMsg || 'Generating Cinematic Video...'}</span>
                </div>
              </div>
            ) : (
              <><ImagePlay size={16} strokeWidth={1.5} /> Generate Background</>
            )}
          </button>
        </div>

        <div className="h-[1px] w-full bg-white/10 my-2" />

        {/* Section: Text Overlays */}
        <div className="space-y-5 flex-1">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-mono tracking-widest text-white/50 uppercase">Text Overlay</label>
            <Type size={12} className="text-white/30" />
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] text-white/40 ml-1">Hook / Headline</label>
              <input 
                value={overlay.hook}
                onChange={e => setOverlay(o => ({ ...o, hook: e.target.value }))}
                className="w-full bg-transparent border-b border-white/10 pb-2 px-1 text-[13px] text-white/90 focus:outline-none focus:border-white/40 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-white/40 ml-1">Body Text / Penjelasan</label>
              <textarea 
                value={overlay.subhead}
                onChange={e => setOverlay(o => ({ ...o, subhead: e.target.value }))}
                rows={2}
                className="w-full bg-transparent border-b border-white/10 pb-2 px-1 text-[13px] text-white/90 focus:outline-none focus:border-white/40 transition-all resize-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-white/40 ml-1">Call To Action (CTA)</label>
              <input 
                value={overlay.cta}
                onChange={e => setOverlay(o => ({ ...o, cta: e.target.value }))}
                className="w-full bg-transparent border-b border-white/10 pb-2 px-1 text-[13px] text-white/90 focus:outline-none focus:border-white/40 transition-all"
              />
            </div>
          </div>
        </div>

      </div>

      {/* RIGHT PANEL - Canvas */}
      <div className="flex-1 flex flex-col h-full relative z-10">
        
        {/* Topbar */}
        <div className="h-16 border-b border-white/10 flex items-center justify-end px-8 gap-4 bg-black/20 backdrop-blur-md">
          <button 
            onClick={handleReset}
            className="flex items-center gap-2 text-xs font-medium text-white/50 hover:text-white transition-colors"
          >
            <RefreshCw size={14} strokeWidth={1.5} /> Reset Canvas
          </button>
          <div className="w-[1px] h-4 bg-white/10" />
          <button 
            onClick={handleDownload}
            disabled={!videoUrl || isRendering}
            className="flex items-center gap-2 text-xs font-medium bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors border border-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRendering ? (
              <><Loader2 size={14} className="animate-spin" /> {renderProgress}%</>
            ) : (
              <><Download size={14} strokeWidth={1.5} /> Render & Download</>
            )}
          </button>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 overflow-auto flex items-center justify-center p-8 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#111] to-[#050505]">
          
          {/* Mobile 9:16 Frame */}
          <div className="w-[360px] h-[640px] bg-black rounded-[2rem] border border-white/10 shadow-2xl shadow-black/50 overflow-hidden relative group">
            
            {/* Video Background */}
            <div className="absolute inset-0 bg-[#0a0a0a] flex items-center justify-center z-0">
              {videoUrl ? (
                <video 
                  src={videoUrl} 
                  autoPlay={isPlaying} 
                  loop 
                  muted 
                  playsInline
                  className="w-full h-full object-cover opacity-80"
                />
              ) : (
                <div className="flex flex-col items-center gap-3 text-white/20">
                  <Video size={32} strokeWidth={1} />
                  <p className="text-xs font-medium tracking-wide">Empty Canvas</p>
                </div>
              )}
            </div>

            {/* Video Controls (Hover) */}
            {videoUrl && (
              <div className="absolute top-4 right-4 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-white"
                >
                  {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                </button>
              </div>
            )}

            {/* OVERLAY WRAPPER FOR RENDERING */}
            <div ref={overlayRef} className="absolute inset-0 z-10 pointer-events-none">
              {/* Overlay Gradient for Text Readability */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />

              {/* UI Overlay */}
              <div className="absolute inset-0 flex flex-col justify-between p-6">
                {/* Header area */}
                <div className="flex justify-end items-center opacity-70">
                  <div className="relative w-[110px] h-[26px] overflow-hidden">
                    <img 
                      src="/serenalogo2.svg" 
                      alt="logo" 
                      className="absolute top-1/2 -left-[10px] -translate-y-1/2 h-[130px] w-auto max-w-none object-contain brightness-0 invert" 
                    />
                  </div>
                </div>

                {/* Main Text Content */}
                <div className="mb-8">
                  <AnimatePresence mode="wait">
                    <motion.div 
                      key={overlay.hook + overlay.subhead}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                      className="space-y-4"
                    >
                      {overlay.hook && (
                        <h2 className="text-[28px] leading-[1.1] font-bold tracking-tight text-white drop-shadow-lg uppercase">
                          {overlay.hook}
                        </h2>
                      )}
                      {overlay.subhead && (
                        <p className="text-[13px] leading-relaxed text-white/90 font-medium drop-shadow-md">
                          {overlay.subhead}
                        </p>
                      )}
                      {overlay.cta && (
                        <div className="pt-2">
                          <button className="bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-full flex items-center gap-2 hover:bg-white/20 transition-all">
                            {overlay.cta}
                          </button>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
