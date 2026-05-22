import React from 'react';
import { Globe } from 'lucide-react';

export interface TemplateProps {
  draft: any;
  Logo: React.FC<{ invert?: boolean; scale?: number }>;
  WAIco: React.FC<{ size?: number }>;
  InstagramIco: React.FC<{ size?: number }>;
  onEdit?: (field: string, value: string) => void;
}

const EditableText = ({ 
  tag: Tag = 'div', 
  value, 
  field, 
  onEdit, 
  className 
}: { 
  tag?: any, 
  value: string, 
  field: string, 
  onEdit?: (field: string, value: string) => void, 
  className?: string 
}) => {
  return (
    <Tag 
      contentEditable={!!onEdit}
      suppressContentEditableWarning 
      className={`outline-none transition-colors ${onEdit ? 'hover:ring-2 hover:ring-white/30 focus:ring-2 focus:ring-white/50 rounded px-2 -mx-2 cursor-text' : ''} ${className}`}
      onBlur={(e: any) => {
        if (onEdit && e.target.innerText !== value) {
          onEdit(field, e.target.innerText);
        }
      }}
    >
      {value}
    </Tag>
  );
};

export const SplitScreenDark: React.FC<TemplateProps> = ({ draft, Logo, WAIco, InstagramIco, onEdit }) => {
  return (
    <div className={`relative z-10 w-[1080px] ${draft.format === 'story' ? 'h-[1920px]' : draft.format === 'square' ? 'h-[1080px]' : 'h-[1350px]'} bg-[#1a1a1a] flex flex-col justify-between p-[80px]`}>
      <div className="absolute inset-0 z-0">
        {draft.bgImage && (
          <img src={draft.bgImage} className="w-full h-full object-cover" crossOrigin="anonymous" />
        )}
        {/* Heavy gradient at the bottom to blend with text area */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-[#1a1a1a]/80 to-transparent" />
        
        {draft.vignetteColor && draft.vignetteColor !== 'none' && (
          <div 
            className={`absolute inset-0 bg-gradient-to-b ${draft.vignetteColor === 'black' ? 'from-black via-black/40' : 'from-white via-white/40'} to-transparent`}
            style={{ opacity: draft.vignetteIntensity ? draft.vignetteIntensity / 100 : 0.5 }}
          />
        )}
      </div>

      <div className="relative z-10 w-full">
        <Logo invert={draft.colorMode === 'dark' ? false : draft.colorMode === 'light' ? true : false} scale={0.7} />
      </div>

      <div className="relative z-10 w-full flex flex-col gap-8 mt-auto">
        <div className="flex flex-col gap-4">
          {draft.quote ? (
            <div className="flex flex-col items-center justify-center h-full max-w-[85%] mx-auto text-center">
              <EditableText tag="p" value={`"${draft.quote}"`} field="quote" onEdit={onEdit} className="text-[48px] leading-[1.3] font-serif italic text-white/90 mb-8" />
              {draft.author && (
                <EditableText tag="p" value={`— ${draft.author}`} field="author" onEdit={onEdit} className="text-[20px] font-sans font-medium tracking-widest text-earth-primary uppercase" />
              )}
            </div>
          ) : draft.myth || draft.fact ? (
            <div className="grid grid-cols-2 gap-8 h-full items-center">
              <div className="p-8 rounded-3xl border-l-4 border-earth-primary/50 bg-earth-primary/10">
                <p className="text-[20px] font-sans font-medium text-earth-primary mb-2 tracking-[0.2em] uppercase">Mitos</p>
                <EditableText tag="p" value={draft.myth} field="myth" onEdit={onEdit} className="text-[30px] leading-[1.4] font-sans font-light text-white" />
              </div>
              <div className="p-8 rounded-3xl border-l-4 border-green-500/50 bg-green-500/10">
                <p className="text-[20px] font-sans font-medium text-green-400 mb-2 tracking-[0.2em] uppercase">Fakta</p>
                <EditableText tag="p" value={draft.fact} field="fact" onEdit={onEdit} className="text-[30px] leading-[1.4] font-sans font-light text-white" />
              </div>
            </div>
          ) : (
            <>
              <EditableText tag="h1" value={draft.title} field="title" onEdit={onEdit} className="text-[85px] leading-[1.1] font-sans font-medium tracking-[0.1em] text-white uppercase" />
              <EditableText tag="p" value={draft.description} field="description" onEdit={onEdit} className="text-[32px] leading-[1.5] font-sans font-light text-white/70 max-w-[95%]" />
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center w-full pt-8">
           <span className={`px-6 py-3 backdrop-blur-md rounded-full text-[16px] font-sans font-medium tracking-widest uppercase flex items-center gap-3 ${draft.colorMode === 'dark' ? 'bg-black/10 border border-black/20 text-[#4a4138]' : 'bg-white/5 border border-white/10 text-white/80'}`}>
             <Globe size={18} /> WWW.SERENARAGA.FIT
           </span>
           <span className={`px-6 py-3 backdrop-blur-md rounded-full text-[16px] font-sans font-medium tracking-widest uppercase flex items-center gap-3 ${draft.colorMode === 'dark' ? 'bg-black/10 border border-black/20 text-[#4a4138]' : 'bg-white/5 border border-white/10 text-white/80'}`}>
             <WAIco size={18} /> 0895-1835-9037
           </span>
           <span className={`px-6 py-3 backdrop-blur-md rounded-full text-[16px] font-sans font-medium tracking-widest uppercase flex items-center gap-3 ${draft.colorMode === 'dark' ? 'bg-black/10 border border-black/20 text-[#4a4138]' : 'bg-white/5 border border-white/10 text-white/80'}`}>
             <InstagramIco size={18} /> @SERENA.RAGA
           </span>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════
   3. Classic Glassmorphism
══════════════════════════════════════════════════ */
export const ClassicGlass: React.FC<TemplateProps> = ({ draft, Logo, WAIco, InstagramIco, onEdit }) => {
  return (
    <div className={`relative z-10 w-[1080px] ${draft.format === 'story' ? 'h-[1920px]' : draft.format === 'square' ? 'h-[1080px]' : 'h-[1350px]'} flex flex-col justify-between p-[80px]`}>
      {draft.bgImage && (
        <div className="absolute inset-0 z-0">
          <img src={draft.bgImage} alt="Background" className="w-full h-full object-cover" crossOrigin="anonymous" />
          {draft.vignetteColor && draft.vignetteColor !== 'none' && (
            <div 
              className={`absolute inset-0 bg-gradient-to-t ${draft.vignetteColor === 'black' ? 'from-black via-black/50' : 'from-white via-white/50'} to-transparent`}
              style={{ opacity: draft.vignetteIntensity ? draft.vignetteIntensity / 100 : 0.5 }}
            />
          )}
        </div>
      )}

      <div className="relative z-10 w-full h-full flex flex-col justify-between">
        <div className="flex w-full justify-center">
          <Logo invert={draft.colorMode === 'dark' ? false : draft.colorMode === 'light' ? true : false} scale={0.7} />
        </div>

        <div className="flex flex-col w-full items-center justify-center flex-grow">
          <div className="flex flex-col gap-6 max-w-[95%] items-center text-center">
            {draft.quote ? (
            <div className="flex flex-col items-center justify-center max-w-[85%] mx-auto text-center mt-[150px]">
              <EditableText tag="p" value={`"${draft.quote}"`} field="quote" onEdit={onEdit} className="text-[54px] leading-[1.3] font-serif italic text-white mb-8 drop-shadow-md" />
              {draft.author && (
                <EditableText tag="p" value={`— ${draft.author}`} field="author" onEdit={onEdit} className="text-[22px] font-sans font-medium tracking-widest text-earth-primary uppercase drop-shadow-md" />
              )}
            </div>
          ) : draft.myth || draft.fact ? (
            <div className="grid grid-cols-2 gap-10 w-full items-center mt-[150px]">
              <div className="p-10 rounded-3xl bg-black/40 backdrop-blur-md border border-earth-primary/30">
                <p className="text-[22px] font-sans font-medium text-earth-primary mb-4 tracking-[0.2em] uppercase drop-shadow-md">Mitos</p>
                <EditableText tag="p" value={draft.myth} field="myth" onEdit={onEdit} className="text-[30px] leading-[1.4] font-sans font-light text-white drop-shadow-md" />
              </div>
              <div className="p-10 rounded-3xl bg-black/40 backdrop-blur-md border border-green-500/30">
                <p className="text-[22px] font-sans font-medium text-green-400 mb-4 tracking-[0.2em] uppercase drop-shadow-md">Fakta</p>
                <EditableText tag="p" value={draft.fact} field="fact" onEdit={onEdit} className="text-[30px] leading-[1.4] font-sans font-light text-white drop-shadow-md" />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center mt-[150px]">
              <EditableText tag="h1" value={draft.title} field="title" onEdit={onEdit} className="text-[90px] leading-[1.1] font-sans font-medium tracking-[0.05em] text-white uppercase drop-shadow-lg mb-8" />
              <EditableText tag="p" value={draft.description} field="description" onEdit={onEdit} className="text-[36px] leading-[1.5] font-sans font-light text-white/90 max-w-[90%] drop-shadow-md" />
            </div>
          )}
          </div>
        </div>

        <div className="flex justify-center items-center gap-6 w-full">
           <span className={`px-6 py-3 backdrop-blur-lg rounded-full text-[18px] font-sans font-medium tracking-widest shadow-lg uppercase flex items-center gap-3 ${draft.colorMode === 'dark' ? 'bg-black/10 border border-black/20 text-[#4a4138]' : 'bg-white/10 border border-white/20 text-white'}`}>
             <Globe size={20} /> WWW.SERENARAGA.FIT
           </span>
           <span className={`px-6 py-3 backdrop-blur-lg rounded-full text-[18px] font-sans font-medium tracking-widest shadow-lg uppercase flex items-center gap-3 ${draft.colorMode === 'dark' ? 'bg-black/10 border border-black/20 text-[#4a4138]' : 'bg-white/10 border border-white/20 text-white'}`}>
             <WAIco size={20} /> 0895-1835-9037
           </span>
           <span className={`px-6 py-3 backdrop-blur-lg rounded-full text-[18px] font-sans font-medium tracking-widest shadow-lg uppercase flex items-center gap-3 ${draft.colorMode === 'dark' ? 'bg-black/10 border border-black/20 text-[#4a4138]' : 'bg-white/10 border border-white/20 text-white'}`}>
             <InstagramIco size={20} /> @SERENA.RAGA
           </span>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════
   4. Editorial Overlay
══════════════════════════════════════════════════ */
export const EditorialOverlay: React.FC<TemplateProps> = ({ draft, Logo, WAIco, InstagramIco, onEdit }) => {
  return (
    <div className={`relative z-10 w-[1080px] ${draft.format === 'story' ? 'h-[1920px]' : draft.format === 'square' ? 'h-[1080px]' : 'h-[1350px]'} flex flex-col justify-end p-[80px]`}>
      {draft.bgImage && (
        <div className="absolute inset-0 z-0">
          <img src={draft.bgImage} alt="Background" className="w-full h-full object-cover" crossOrigin="anonymous" />
          {draft.vignetteColor && draft.vignetteColor !== 'none' && (
            <div 
              className={`absolute inset-0 bg-gradient-to-t ${draft.vignetteColor === 'black' ? 'from-black via-black/50' : 'from-white via-white/50'} to-transparent`}
              style={{ opacity: draft.vignetteIntensity ? draft.vignetteIntensity / 100 : 0.5 }}
            />
          )}
        </div>
      )}

      <div className="relative z-10 w-full h-full flex flex-col justify-between">
        <div className="w-full flex justify-between items-start">
          <Logo invert={false} scale={0.7} />
        </div>

        <div className="w-full flex flex-col gap-6 justify-end flex-grow pb-12">
          
          {draft.quote ? (
            <div className="flex flex-col gap-6">
              <EditableText tag="p" value={`"${draft.quote}"`} field="quote" onEdit={onEdit} className="text-[60px] leading-[1.3] font-sans font-light drop-shadow-lg text-white max-w-[90%]" />
              {draft.author && (
                <EditableText tag="p" value={`— ${draft.author}`} field="author" onEdit={onEdit} className="text-[22px] font-sans font-medium tracking-[0.15em] uppercase drop-shadow-md mt-4 text-white/60" />
              )}
            </div>
          ) : draft.myth || draft.fact ? (
            <div className="flex flex-col gap-6 w-full">
              <div className="p-8 rounded-3xl border-l-4 border-red-500/50 bg-red-500/10 backdrop-blur-md shadow-xl w-[85%]">
                <p className="text-[20px] font-sans font-medium text-red-400 mb-2 tracking-[0.2em] uppercase">Mitos</p>
                <EditableText tag="p" value={draft.myth} field="myth" onEdit={onEdit} className="text-[30px] leading-[1.4] font-sans font-light text-white drop-shadow-md" />
              </div>
              <div className="p-8 rounded-3xl border-l-4 border-green-500/50 bg-green-500/10 backdrop-blur-md shadow-xl w-[85%]">
                <p className="text-[20px] font-sans font-medium text-green-400 mb-2 tracking-[0.2em] uppercase">Fakta</p>
                <EditableText tag="p" value={draft.fact} field="fact" onEdit={onEdit} className="text-[30px] leading-[1.4] font-sans font-light text-white drop-shadow-md" />
              </div>
            </div>
          ) : (
            <>
              <EditableText tag="h1" value={draft.title} field="title" onEdit={onEdit} className="text-[110px] leading-[0.9] text-white font-sans font-medium uppercase tracking-[0.05em] drop-shadow-2xl max-w-[90%]" />
              <EditableText tag="p" value={draft.description} field="description" onEdit={onEdit} className="text-[34px] leading-[1.4] text-white/80 font-sans font-light drop-shadow-lg max-w-[85%] mt-4" />
            </>
          )}
        </div>

        <div className="flex justify-between items-center w-full">
           <span className={`px-6 py-3 backdrop-blur-md rounded-full text-[16px] font-sans font-medium tracking-widest uppercase flex items-center gap-3 shadow-lg ${draft.colorMode === 'dark' ? 'bg-black/10 border border-black/20 text-[#4a4138]' : 'bg-white/10 border border-white/20 text-white/90'}`}>
             <Globe size={18} /> WWW.SERENARAGA.FIT
           </span>
           <span className={`px-6 py-3 backdrop-blur-md rounded-full text-[16px] font-sans font-medium tracking-widest uppercase flex items-center gap-3 shadow-lg ${draft.colorMode === 'dark' ? 'bg-black/10 border border-black/20 text-[#4a4138]' : 'bg-white/10 border border-white/20 text-white/90'}`}>
             <WAIco size={18} /> 0895-1835-9037
           </span>
           <span className={`px-6 py-3 backdrop-blur-md rounded-full text-[16px] font-sans font-medium tracking-widest uppercase flex items-center gap-3 shadow-lg ${draft.colorMode === 'dark' ? 'bg-black/10 border border-black/20 text-[#4a4138]' : 'bg-white/10 border border-white/20 text-white/90'}`}>
             <InstagramIco size={18} /> @SERENA.RAGA
           </span>
        </div>
      </div>
    </div>
  );
};
/* 
--------------------------------------------------
   5. Story Minimalist (For 9:16 IG Stories)
-------------------------------------------------- */
export const StoryMinimalist: React.FC<TemplateProps> = ({ draft, Logo, WAIco, InstagramIco, onEdit }) => {
  return (
    <div className={"relative z-10 w-[1080px] ${draft.format === 'story' ? 'h-[1920px]' : draft.format === 'square' ? 'h-[1080px]' : 'h-[1350px]'} flex flex-col items-center justify-center p-[100px]"}>
      {draft.bgImage && (
        <div className="absolute inset-0 z-0">
          <img src={draft.bgImage} alt="Background" className="w-full h-full object-cover" crossOrigin="anonymous" />
          <div className="absolute inset-0 bg-black/20" />
          {draft.vignetteColor && draft.vignetteColor !== 'none' && (
            <div 
              className={"absolute inset-0 bg-gradient-to-b ${draft.vignetteColor === 'black' ? 'from-black via-black/40' : 'from-white via-white/40'} to-transparent"}
              style={{ opacity: draft.vignetteIntensity ? draft.vignetteIntensity / 100 : 0.5 }}
            />
          )}
        </div>
      )}

      {/* Top Logo - Pushed down to avoid IG Profile safe zone */}
      <div className="absolute top-[300px] w-full flex justify-center z-10">
        <Logo invert={draft.colorMode === 'dark' ? false : draft.colorMode === 'light' ? true : false} scale={0.8} />
      </div>

      <div className="relative z-10 w-full max-w-[85%] flex flex-col gap-6 text-center mt-[100px]">
        {draft.quote ? (
          <div className="flex flex-col items-center justify-center gap-8 bg-white/10 backdrop-blur-xl p-16 rounded-[3rem] border border-white/20 shadow-2xl">
            <EditableText tag="p" value={"${draft.quote}"} field="quote" onEdit={onEdit} className="text-[52px] leading-[1.3] font-serif italic text-white drop-shadow-md" />
            {draft.author && (
              <EditableText tag="p" value={"� ${draft.author}"} field="author" onEdit={onEdit} className="text-[22px] font-sans font-medium tracking-widest text-earth-primary uppercase bg-black/20 px-6 py-2 rounded-full" />
            )}
          </div>
        ) : draft.myth || draft.fact ? (
          <div className="flex flex-col gap-8 bg-white/10 backdrop-blur-xl p-12 rounded-[3rem] border border-white/20 shadow-2xl text-left">
            <div className="flex flex-col gap-2">
              <span className="text-[18px] font-sans font-bold text-earth-primary tracking-widest uppercase bg-black/20 self-start px-4 py-1 rounded-md mb-2">Mitos</span>
              <EditableText tag="p" value={draft.myth} field="myth" onEdit={onEdit} className="text-[32px] leading-[1.4] font-sans font-light text-white" />
            </div>
            <div className="w-full h-px bg-white/20" />
            <div className="flex flex-col gap-2">
              <span className="text-[18px] font-sans font-bold text-green-400 tracking-widest uppercase bg-black/20 self-start px-4 py-1 rounded-md mb-2">Fakta</span>
              <EditableText tag="p" value={draft.fact} field="fact" onEdit={onEdit} className="text-[32px] leading-[1.4] font-sans font-light text-white" />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-8 items-center justify-center bg-white/10 backdrop-blur-xl p-16 rounded-[3rem] border border-white/20 shadow-2xl">
            <EditableText tag="h1" value={draft.title} field="title" onEdit={onEdit} className="text-[75px] leading-[1.15] font-sans font-bold tracking-[0.05em] text-white uppercase drop-shadow-lg" />
            <div className="w-20 h-2 bg-earth-primary rounded-full" />
            <EditableText tag="p" value={draft.description} field="description" onEdit={onEdit} className="text-[36px] leading-[1.5] font-sans font-light text-white/90" />
          </div>
        )}
      </div>

      {/* Footer - Pushed up to avoid IG Reply safe zone */}
      <div className="absolute bottom-[400px] w-full flex flex-col items-center gap-4 z-10">
         <span className={"px-8 py-4 backdrop-blur-xl rounded-full text-[18px] font-sans font-medium tracking-widest uppercase flex items-center gap-3 shadow-2xl ${draft.colorMode === 'dark' ? 'bg-black/20 border border-black/30 text-white' : 'bg-white/20 border border-white/30 text-white'}"}>
           <WAIco size={20} /> BOOK NOW: 0895-1835-9037
         </span>
      </div>
    </div>
  );
};

