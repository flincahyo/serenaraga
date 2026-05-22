import React, { useState, useEffect } from 'react';
import { DraggableText, CanvasElementData } from './DraggableText';

interface PosterCanvasProps {
  draft: any;
  elements: CanvasElementData[];
  setElements: (elements: CanvasElementData[]) => void;
  Logo: React.FC<any>;
  WAIco: React.FC<any>;
  InstagramIco: React.FC<any>;
  activeId: string | null;
  setActiveId: (id: string | null) => void;
}

export const PosterCanvas: React.FC<PosterCanvasProps> = ({ draft, elements, setElements, Logo, WAIco, InstagramIco, activeId, setActiveId }) => {
  const [activeGuides, setActiveGuides] = useState<{ type: 'v' | 'h', pos: number, color: string }[]>([]);

  // Initialize elements based on draft if empty
  useEffect(() => {
    if (elements.length === 0 && draft) {
      const initialElements: CanvasElementData[] = [];
      
      if (draft.title) {
        initialElements.push({ id: 'title', text: draft.title, x: 100, y: 150, fontSize: 80, color: '#ffffff', textAlign: 'left', fontWeight: 'bold' });
      }
      if (draft.description) {
        initialElements.push({ id: 'desc', text: draft.description, x: 100, y: 300, fontSize: 36, color: '#f8f8f8', textAlign: 'left', fontWeight: 'normal' });
      }

      // If it's a list (from AI poster mode)
      if (draft.listItems && draft.listItems.length > 0) {
        let startY = 500;
        draft.listItems.forEach((item: any, i: number) => {
          initialElements.push({ id: `list-l-${i}`, text: item.label, x: 100, y: startY, fontSize: 32, color: '#ffffff', textAlign: 'left', fontWeight: 'bold' });
          initialElements.push({ id: `list-v-${i}`, text: item.value, x: 600, y: startY, fontSize: 32, color: '#ffffff', textAlign: 'right', fontWeight: 'normal' });
          startY += 70;
        });
      }

      setElements(initialElements);
    }
  }, [draft, elements.length, setElements]);

  const updateElement = (newEl: CanvasElementData) => {
    setElements(elements.map(el => el.id === newEl.id ? newEl : el));
  };

  const removeElement = (id: string) => {
    setElements(elements.filter(el => el.id !== id));
  };

  const duplicateElement = (el: CanvasElementData) => {
    const newEl = { ...el, id: `text-${Date.now()}`, x: el.x + 20, y: el.y + 20 };
    setElements([...elements, newEl]);
    setActiveId(newEl.id);
  };

  const handleDragUpdate = (id: string, x: number, y: number, w: number, h: number): [number, number] => {
    const newGuides: { type: 'v' | 'h', pos: number, color: string }[] = [];
    const THRESHOLD = 15;
    
    let snappedX = x;
    let snappedY = y;
    
    const centerX = x + w / 2;
    const centerY = y + h / 2;

    const canvasW = 1080;
    const canvasH = draft.format === 'story' ? 1920 : draft.format === 'square' ? 1080 : draft.format === 'voucher' ? 520 : 1350;

    // Center of canvas (Red Lines)
    if (Math.abs(centerX - canvasW / 2) < THRESHOLD) {
      newGuides.push({ type: 'v', pos: canvasW / 2, color: 'bg-red-500' });
      snappedX = canvasW / 2 - w / 2;
    }
    if (Math.abs(centerY - canvasH / 2) < THRESHOLD) {
      newGuides.push({ type: 'h', pos: canvasH / 2, color: 'bg-red-500' });
      snappedY = canvasH / 2 - h / 2;
    }

    // Align with other elements (Blue Lines)
    elements.forEach(el => {
      if (el.id === id) return;
      // Snap to Left Edge
      if (Math.abs(x - el.x) < THRESHOLD) {
        newGuides.push({ type: 'v', pos: el.x, color: 'bg-blue-400' });
        snappedX = el.x;
      }
      // Snap to Top Edge
      if (Math.abs(y - el.y) < THRESHOLD) {
        newGuides.push({ type: 'h', pos: el.y, color: 'bg-blue-400' });
        snappedY = el.y;
      }
    });

    setActiveGuides(newGuides);
    return [snappedX, snappedY];
  };

  const handleDragEnd = () => {
    setActiveGuides([]);
  };

  const handleCanvasClick = () => {
    setActiveId(null);
  };

  // Determine Background Mode (Solid vs AI Image)
  const isSolidBg = draft.theme === 'solid_poster' || !draft.bgImage;

  return (
    <div 
      className={`relative z-10 w-[1080px] ${draft.format === 'story' ? 'h-[1920px]' : draft.format === 'square' ? 'h-[1080px]' : 'h-[1350px]'} cursor-crosshair`}
      onClick={handleCanvasClick}
      style={{ backgroundColor: isSolidBg ? '#D2C5B8' : '#000000' }}
    >
      {/* Background */}
      {!isSolidBg && draft.bgImage && (
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <img src={draft.bgImage} alt="Background" className="w-full h-full object-cover opacity-60" crossOrigin="anonymous" />
        </div>
      )}

      {/* Vignette Overlay */}
      {draft.vignetteColor && draft.vignetteColor !== 'none' && (
        <div 
          className="absolute inset-0 z-0 pointer-events-none" 
          style={{
            background: `radial-gradient(circle, transparent ${100 - (draft.vignetteIntensity || 50)}%, ${draft.vignetteColor === 'white' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)'} 100%)`
          }}
        />
      )}

      {/* Smart Snapping Guides */}
      <div className="absolute inset-0 z-30 pointer-events-none">
        {activeGuides.map((guide, i) => (
          <div 
            key={i} 
            className={`absolute ${guide.color}`}
            style={{
              ...(guide.type === 'v' ? { left: guide.pos, top: 0, bottom: 0, width: '1px' } : { top: guide.pos, left: 0, right: 0, height: '1px' }),
              boxShadow: '0 0 4px rgba(0,0,0,0.2)'
            }}
          />
        ))}
      </div>

      {/* Freeform Draggable Elements */}
      <div className="absolute inset-0 z-20">
        {elements.map(el => (
          <DraggableText
            key={el.id}
            element={el}
            isActive={activeId === el.id}
            onClick={() => setActiveId(el.id)}
            onChange={updateElement}
            onRemove={removeElement}
            onDuplicate={duplicateElement}
            onDragUpdate={handleDragUpdate}
            onDragEnd={handleDragEnd}
          />
        ))}
      </div>

      {/* Static Brand Footer (Optional/Fixed) */}
      <div className="absolute bottom-[80px] left-[100px] z-10 pointer-events-none">
        <Logo scale={0.7} invert={draft.colorMode === 'light' ? false : draft.colorMode === 'dark' ? true : !isSolidBg} />
      </div>
      <div className={`absolute bottom-[80px] right-[100px] z-10 pointer-events-none flex flex-col gap-2 text-[20px] font-sans ${draft.colorMode === 'light' ? 'text-earth-primary' : draft.colorMode === 'dark' ? 'text-white/90' : isSolidBg ? 'text-earth-primary' : 'text-white/90'}`}>
        <div className="flex items-center gap-2">
           <WAIco size={24} /> 0895-1835-9037
        </div>
        <div className="flex items-center gap-2">
           <InstagramIco size={24} /> @SERENA.RAGA
        </div>
      </div>
    </div>
  );
};
