import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Type, AlignLeft, AlignCenter, AlignRight, Palette, Trash2, Maximize2, GripHorizontal } from 'lucide-react';

export interface CanvasElementData {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  textAlign: 'left' | 'center' | 'right';
  fontWeight: 'normal' | 'medium' | 'bold';
  letterSpacing?: number;
  width?: number;
}

interface DraggableTextProps {
  element: CanvasElementData;
  onChange: (el: CanvasElementData) => void;
  onRemove: (id: string) => void;
  isActive: boolean;
  onClick: () => void;
  onDuplicate?: (el: CanvasElementData) => void;
  onDragUpdate?: (id: string, x: number, y: number, w: number, h: number) => [number, number] | void;
  onDragEnd?: () => void;
}

export const DraggableText: React.FC<DraggableTextProps> = ({ element, onChange, onRemove, onDuplicate, isActive, onClick, onDragUpdate, onDragEnd }) => {
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const lastPropText = useRef(element.text);

  useEffect(() => {
    if (contentRef.current) {
      if (element.text !== lastPropText.current || !contentRef.current.innerHTML) {
        contentRef.current.innerHTML = element.text.replace(/\n/g, '<br>');
        lastPropText.current = element.text;
      }
    }
  }, [element.text]);

  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, elX: 0, elY: 0 });

  const handlePointerDown = (e: React.PointerEvent) => {
    // Only allow drag if not active, or if active and clicking the border (padding area)
    if (isActive && e.target !== containerRef.current) return;
    
    e.stopPropagation();
    isDragging.current = true;
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      elX: element.x,
      elY: element.y
    };
    
    // Calculate effective zoom scale dynamically
    const rect = containerRef.current?.getBoundingClientRect();
    const offsetW = containerRef.current?.offsetWidth;
    const effectiveZoom = rect && offsetW ? rect.width / offsetW : 1;
    
    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (!isDragging.current) return;
      const dx = (moveEvent.clientX - dragStart.current.x) / effectiveZoom;
      const dy = (moveEvent.clientY - dragStart.current.y) / effectiveZoom;
      
      const newX = dragStart.current.elX + dx;
      const newY = dragStart.current.elY + dy;
      
      let snappedX = newX;
      let snappedY = newY;
      
      if (onDragUpdate && containerRef.current) {
         const result = onDragUpdate(element.id, newX, newY, containerRef.current.offsetWidth, containerRef.current.offsetHeight);
         if (result && Array.isArray(result)) {
           snappedX = result[0];
           snappedY = result[1];
         }
      }
      
      onChange({ ...element, x: snappedX, y: snappedY });
    };
    
    const handlePointerUp = () => {
      isDragging.current = false;
      if (onDragEnd) onDragEnd();
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
    
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const isResizing = useRef(false);
  const resizeStart = useRef({ x: 0, startWidth: 0 });

  const handleResizePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    isResizing.current = true;
    
    const rect = containerRef.current?.getBoundingClientRect();
    const offsetW = containerRef.current?.offsetWidth;
    const effectiveZoom = rect && offsetW ? rect.width / offsetW : 1;
    
    const startWidth = element.width || contentRef.current?.offsetWidth || 100;
    
    resizeStart.current = {
      x: e.clientX,
      startWidth
    };
    
    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (!isResizing.current) return;
      const dx = (moveEvent.clientX - resizeStart.current.x) / effectiveZoom;
      const newWidth = Math.max(50, resizeStart.current.startWidth + dx);
      onChange({ ...element, width: newWidth });
    };
    
    const handlePointerUp = () => {
      isResizing.current = false;
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
    
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  return (
    <div
      className={`absolute ${!isActive ? 'cursor-move' : ''} ${isActive ? 'z-50' : 'z-10'}`}
      style={{ left: element.x, top: element.y }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onPointerDown={handlePointerDown}
    >
      <div 
        ref={containerRef}
        className={`relative p-1.5 -m-1.5 ${isActive ? 'ring-[1.5px] ring-dashed ring-earth-primary ring-offset-4 rounded-sm cursor-grab active:cursor-grabbing' : isHovered ? 'ring-1 ring-dashed ring-earth-primary/50 ring-offset-2 rounded-sm' : ''}`}
      >

        {isActive && (
          <div
            onPointerDown={handleResizePointerDown}
            className="absolute -right-3 top-1/2 -translate-y-1/2 w-2.5 h-6 bg-white border border-earth-primary/50 rounded-full cursor-col-resize shadow-md hover:scale-110 hover:bg-earth-primary/10 transition-transform flex items-center justify-center z-50 pointer-events-auto"
            title="Tarik untuk mengubah lebar box text"
          >
            <div className="w-[1px] h-3 bg-earth-primary/50 rounded-full" />
          </div>
        )}

        <div
          ref={contentRef}
          contentEditable={isActive}
          suppressContentEditableWarning
          onBlur={(e) => {
            const newText = e.currentTarget.innerText;
            lastPropText.current = newText;
            onChange({ ...element, text: newText });
          }}
          className="bg-transparent border-none outline-none overflow-hidden block whitespace-pre-wrap break-words"
          style={{
            fontSize: `${element.fontSize}px`,
            color: element.color,
            textAlign: element.textAlign,
            fontWeight: element.fontWeight,
            letterSpacing: `${element.letterSpacing || 0}px`,
            minWidth: '50px',
            width: element.width ? `${element.width}px` : 'max-content',
            lineHeight: '1.4',
            cursor: 'text'
          }}
        />
      </div>
    </div>
  );
};
