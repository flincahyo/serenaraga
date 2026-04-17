'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Upload, Crop, Droplets, Save, RefreshCw, X, Trash2, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase';

// Helper to load image
const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.src = url;
  });
};

export default function TestimonialEditor() {
  const [images, setImages] = useState<string[]>([]); // Current saved URLs
  const [loading, setLoading] = useState(true);

  // Editor State
  const [editorOpen, setEditorOpen] = useState(false);
  const [editSrc, setEditSrc] = useState<string | null>(null);
  const [canvasMode, setCanvasMode] = useState<'crop' | 'blur'>('blur');
  const [isProcessing, setIsProcessing] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Selection box state
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });

  // Original image state for reset
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);

  // Fetch existing testimonials
  const fetchTestimonials = async () => {
    const supabase = createClient();
    const { data } = await supabase.from('settings').select('value').eq('key', 'whatsapp_testimonials').single();
    if (data && data.value) {
      try {
        setImages(JSON.parse(data.value));
      } catch (e) { console.error("Error parsing testimonials JSON"); }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = await loadImage(url);
    setOriginalImage(img);
    setEditSrc(url);
    setEditorOpen(true);
    setCanvasMode('blur');
  };

  // Setup Canvas when editSrc changes
  useEffect(() => {
    if (editorOpen && originalImage && canvasRef.current && containerRef.current) {
      const cvs = canvasRef.current;
      const ctx = cvs.getContext('2d');
      if (!ctx) return;

      // Set canvas to actual image resolution for high quality editing
      cvs.width = originalImage.width;
      cvs.height = originalImage.height;
      ctx.drawImage(originalImage, 0, 0);
    }
  }, [editorOpen, originalImage]);

  // Handle Mouse Events for Canvas
  const getMousePos = (e: React.MouseEvent | React.TouchEvent) => {
    if (!canvasRef.current || !containerRef.current) return { x: 0, y: 0 };
    const cvs = canvasRef.current;
    const rect = cvs.getBoundingClientRect();
    
    // Support touch
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    // Scale mouse coordinates to actual canvas resolution
    const scaleX = cvs.width / rect.width;
    const scaleY = cvs.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const pos = getMousePos(e);
    setIsDrawing(true);
    setStartPos(pos);
    setCurrentPos(pos);
  };

  const moveDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    setCurrentPos(getMousePos(e));
  };

  const endDraw = async () => {
    if (!isDrawing || !canvasRef.current) return;
    setIsDrawing(false);

    const cvs = canvasRef.current;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;

    const x = Math.min(startPos.x, currentPos.x);
    const y = Math.min(startPos.y, currentPos.y);
    const w = Math.abs(startPos.x - currentPos.x);
    const h = Math.abs(startPos.y - currentPos.y);

    if (w < 10 || h < 10) return; // Ignore very small selections

    if (canvasMode === 'blur') {
      // Create a temporary canvas to hold the blured slice
      const tempCvs = document.createElement('canvas');
      tempCvs.width = w;
      tempCvs.height = h;
      const tempCtx = tempCvs.getContext('2d')!;
      
      // Draw the region we want to blur into the temp canvas
      tempCtx.drawImage(cvs, x, y, w, h, 0, 0, w, h);
      
      // Now draw it back over the original but with a CSS filter
      ctx.filter = 'blur(10px)';
      ctx.drawImage(tempCvs, x, y, w, h);
      ctx.filter = 'none'; // reset
      
      // Store new state so crop works sequentially
      const newImg = await loadImage(cvs.toDataURL('image/png'));
      setOriginalImage(newImg);

    } else if (canvasMode === 'crop') {
      // Crop Mode
      const tempCvs = document.createElement('canvas');
      tempCvs.width = w;
      tempCvs.height = h;
      const tempCtx = tempCvs.getContext('2d')!;
      tempCtx.drawImage(cvs, x, y, w, h, 0, 0, w, h);
      
      // Overwrite main canvas size and content
      cvs.width = w;
      cvs.height = h;
      ctx.drawImage(tempCvs, 0, 0);

      // Store new state
      const newImg = await loadImage(tempCvs.toDataURL('image/png'));
      setOriginalImage(newImg);
    }
  };

  const resetCanvas = () => {
    if (!editSrc) return;
    loadImage(editSrc).then(img => {
      setOriginalImage(img);
    });
  };

  const saveToSupabase = async () => {
    if (!canvasRef.current) return;
    setIsProcessing(true);
    
    canvasRef.current.toBlob(async (blob) => {
      if (!blob) {
        setIsProcessing(false);
        return;
      }

      const supabase = createClient();
      const fileName = `testimonial_${Date.now()}.png`;

      // 1. Upload to Storage
      const { data, error } = await supabase.storage
        .from('media')
        .upload(fileName, blob, { contentType: 'image/png' });

      if (error) {
        alert('Gagal upload: ' + error.message);
        setIsProcessing(false);
        return;
      }

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(fileName);

      // 3. Update Settings Table
      const newImages = [...images, publicUrl];
      const { error: dbError } = await supabase
        .from('settings')
        .upsert({ key: 'whatsapp_testimonials', value: JSON.stringify(newImages) });

      if (dbError) {
        alert('Gagal menyimpan ke database.');
      } else {
        setImages(newImages);
        setEditorOpen(false);
      }
      setIsProcessing(false);
      
    }, 'image/png', 0.9);
  };

  const deleteTestimonial = async (index: number) => {
    if (!confirm("Hapus testimoni ini?")) return;
    
    // Note: We should ideally delete from Storage too, but keeping it simple for now
    const newImages = images.filter((_, i) => i !== index);
    
    const supabase = createClient();
    await supabase.from('settings').upsert({ key: 'whatsapp_testimonials', value: JSON.stringify(newImages) });
    setImages(newImages);
  };

  if (loading) return <div className="text-sm text-zinc-500">Memuat testimoni...</div>;

  return (
    <div className="space-y-6">
      {/* Gallery Section */}
      {!editorOpen && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-white">Galeri Testimoni Aktif</h2>
            <label className="admin-btn-primary flex items-center gap-2 cursor-pointer py-1.5 px-3 text-xs">
              <Upload size={14} /> Tambah Baru
              <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
            </label>
          </div>

          {images.length === 0 ? (
            <div className="bg-zinc-50 dark:bg-zinc-900 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl p-8 text-center text-zinc-500 text-sm">
              Belum ada testimoni WA. Klik "Tambah Baru" untuk mengupload screenshot.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {images.map((url, i) => (
                <div key={i} className="group relative aspect-[9/16] bg-zinc-100 dark:bg-zinc-800 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800">
                  <img src={url} alt={`Testimoni ${i}`} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button onClick={() => deleteTestimonial(i)} className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Fullscreen Editor Canvas */}
      {editorOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
          {/* Header */}
          <div className="h-16 border-b border-zinc-800 flex items-center justify-between px-6 bg-zinc-950">
            <div className="flex items-center gap-4">
              <h3 className="text-white font-medium">Editor Privasi WA</h3>
              <div className="flex bg-zinc-900 p-1 rounded-lg">
                <button 
                  onClick={() => setCanvasMode('blur')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors ${canvasMode === 'blur' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'}`}
                >
                  <Droplets size={14} /> Sensor Blur
                </button>
                <button 
                  onClick={() => setCanvasMode('crop')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors ${canvasMode === 'crop' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'}`}
                >
                  <Crop size={14} /> Potong
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={resetCanvas} className="text-zinc-400 hover:text-white flex items-center gap-1.5 text-xs px-3 py-1.5">
                <RefreshCw size={14} /> Ulangi
              </button>
              <button onClick={() => setEditorOpen(false)} className="text-zinc-400 hover:text-white p-2">
                <X size={18} />
              </button>
              <button 
                onClick={saveToSupabase}
                disabled={isProcessing}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50"
              >
                {isProcessing ? 'Menyimpan...' : <><Save size={14} /> Simpan ke Web</>}
              </button>
            </div>
          </div>

          {/* Canvas Area */}
          <div className="flex-1 overflow-auto flex items-center justify-center p-8 relative" ref={containerRef}>
            <p className="absolute top-4 left-1/2 -translate-x-1/2 text-zinc-500 text-xs text-center z-0">
              {canvasMode === 'blur' ? 'Tarik (Drag) kursor ke nomor telpon atau foto profil untuk mem-blur (sensor privasi).' : 'Tarik (Drag) kotak untuk area panen yang ingin diambil.'}
            </p>

            <div className="relative inline-block border border-zinc-700 shadow-2xl bg-[url('https://transparenttextures.com/patterns/cubes.png')] z-10">
              <canvas
                ref={canvasRef}
                onMouseDown={startDraw}
                onMouseMove={moveDraw}
                onMouseUp={endDraw}
                onMouseLeave={endDraw}
                onTouchStart={startDraw}
                onTouchMove={moveDraw}
                onTouchEnd={endDraw}
                className="cursor-crosshair max-w-full max-h-[80vh] object-contain"
                style={{ width: originalImage ? 'auto' : '100%', height: originalImage ? 'auto' : '100%' }}
              />

              {/* Selection Drawing Overlay UI */}
              {isDrawing && canvasRef.current && (
                <div 
                  className={`absolute pointer-events-none border-2 border-dashed flex items-center justify-center bg-white/10 backdrop-blur-sm z-20 ${canvasMode === 'blur' ? 'border-blue-500' : 'border-emerald-500'}`}
                  style={{
                    left: `${(Math.min(startPos.x, currentPos.x) / canvasRef.current.width) * 100}%`,
                    top: `${(Math.min(startPos.y, currentPos.y) / canvasRef.current.height) * 100}%`,
                    width: `${(Math.abs(currentPos.x - startPos.x) / canvasRef.current.width) * 100}%`,
                    height: `${(Math.abs(currentPos.y - startPos.y) / canvasRef.current.height) * 100}%`,
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
