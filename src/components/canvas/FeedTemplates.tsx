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
  className?: string,
  draft?: any
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
        {draft.darkenIntensity ? (
          <div className="absolute inset-0 bg-black" style={{ opacity: draft.darkenIntensity / 100 }} />
        ) : null}
      </div>

      <div className="relative z-10 w-full">
        <Logo invert={draft.colorMode === 'dark' ? true : draft.colorMode === 'light' ? false : true} scale={0.7} />
      </div>

      <div className="relative z-10 w-full flex flex-col gap-8 mt-auto">
        <div className="flex flex-col gap-4">
          {draft.quote ? (
            <div className="flex flex-col items-center justify-center h-full max-w-[85%] mx-auto text-center">
              <EditableText draft={draft} tag="p" value={`"${draft.quote}"`} field="quote" onEdit={onEdit} className="text-[48px] leading-[1.3] font-serif italic text-white/90 mb-8" />
              {draft.author && (
                <EditableText draft={draft} tag="p" value={`— ${draft.author}`} field="author" onEdit={onEdit} className="text-[20px] font-sans font-medium tracking-widest text-earth-primary uppercase" />
              )}
            </div>
          ) : draft.myth || draft.fact ? (
            <div className="grid grid-cols-2 gap-8 h-full items-center">
              <div className="p-8 rounded-3xl border-l-4 border-earth-primary/50 bg-earth-primary/10">
                <p className="text-[20px] font-sans font-medium text-earth-primary mb-2 tracking-[0.2em] uppercase">Mitos</p>
                <EditableText draft={draft} tag="p" value={draft.myth} field="myth" onEdit={onEdit} className="text-[30px] leading-[1.4] font-sans font-light text-white" />
              </div>
              <div className="p-8 rounded-3xl border-l-4 border-green-500/50 bg-green-500/10">
                <p className="text-[20px] font-sans font-medium text-green-400 mb-2 tracking-[0.2em] uppercase">Fakta</p>
                <EditableText draft={draft} tag="p" value={draft.fact} field="fact" onEdit={onEdit} className="text-[30px] leading-[1.4] font-sans font-light text-white" />
              </div>
            </div>
          ) : (
            <>
              <EditableText draft={draft} tag="h1" value={draft.title} field="title" onEdit={onEdit} className="text-[85px] leading-[1.1] font-sans font-medium tracking-[0.1em] text-white uppercase" />
              <EditableText draft={draft} tag="p" value={draft.description} field="description" onEdit={onEdit} className="text-[32px] leading-[1.5] font-sans font-light text-white/70 max-w-[95%]" />
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center w-full pt-8">
          <span className={`px-6 py-3 backdrop-blur-md rounded-full text-[16px] font-sans font-medium tracking-widest uppercase flex items-center gap-3 ${draft.colorMode === 'light' ? 'bg-black/10 border border-black/20 text-[#4a4138]' : 'bg-white/5 border border-white/10 text-white/80'}`}>
            <Globe size={18} /> WWW.SERENARAGA.FIT
          </span>
          <span className={`px-6 py-3 backdrop-blur-md rounded-full text-[16px] font-sans font-medium tracking-widest uppercase flex items-center gap-3 ${draft.colorMode === 'light' ? 'bg-black/10 border border-black/20 text-[#4a4138]' : 'bg-white/5 border border-white/10 text-white/80'}`}>
            <WAIco size={18} /> 0895-1835-9037
          </span>
          <span className={`px-6 py-3 backdrop-blur-md rounded-full text-[16px] font-sans font-medium tracking-widest uppercase flex items-center gap-3 ${draft.colorMode === 'light' ? 'bg-black/10 border border-black/20 text-[#4a4138]' : 'bg-white/5 border border-white/10 text-white/80'}`}>
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
          {draft.darkenIntensity ? (
            <div className="absolute inset-0 bg-black" style={{ opacity: draft.darkenIntensity / 100 }} />
          ) : null}
        </div>
      )}

      <div className="relative z-10 w-full h-full flex flex-col justify-between">
        <div className="flex w-full justify-center">
          <Logo invert={draft.colorMode === 'dark' ? true : draft.colorMode === 'light' ? false : true} scale={0.7} />
        </div>

        <div className="flex flex-col w-full items-center justify-center flex-grow">
          <div className="flex flex-col gap-6 max-w-[95%] items-center text-center">
            {draft.quote ? (
              <div className="flex flex-col items-center justify-center max-w-[85%] mx-auto text-center mt-[150px]">
                <EditableText draft={draft} tag="p" value={`"${draft.quote}"`} field="quote" onEdit={onEdit} className="text-[54px] leading-[1.3] font-serif italic text-white mb-8 drop-shadow-md" />
                {draft.author && (
                  <EditableText draft={draft} tag="p" value={`— ${draft.author}`} field="author" onEdit={onEdit} className="text-[22px] font-sans font-medium tracking-widest text-earth-primary uppercase drop-shadow-md" />
                )}
              </div>
            ) : draft.myth || draft.fact ? (
              <div className="grid grid-cols-2 gap-10 w-full items-center mt-[150px]">
                <div className="p-10 rounded-3xl bg-black/40 backdrop-blur-md border border-earth-primary/30">
                  <p className="text-[22px] font-sans font-medium text-earth-primary mb-4 tracking-[0.2em] uppercase drop-shadow-md">Mitos</p>
                  <EditableText draft={draft} tag="p" value={draft.myth} field="myth" onEdit={onEdit} className="text-[30px] leading-[1.4] font-sans font-light text-white drop-shadow-md" />
                </div>
                <div className="p-10 rounded-3xl bg-black/40 backdrop-blur-md border border-green-500/30">
                  <p className="text-[22px] font-sans font-medium text-green-400 mb-4 tracking-[0.2em] uppercase drop-shadow-md">Fakta</p>
                  <EditableText draft={draft} tag="p" value={draft.fact} field="fact" onEdit={onEdit} className="text-[30px] leading-[1.4] font-sans font-light text-white drop-shadow-md" />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center mt-[150px]">
                <EditableText draft={draft} tag="h1" value={draft.title} field="title" onEdit={onEdit} className="text-[90px] leading-[1.1] font-sans font-medium tracking-[0.05em] text-white uppercase drop-shadow-lg mb-8" />
                <EditableText draft={draft} tag="p" value={draft.description} field="description" onEdit={onEdit} className="text-[36px] leading-[1.5] font-sans font-light text-white/90 max-w-[90%] drop-shadow-md" />
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-center items-center gap-6 w-full">
          <span className={`px-6 py-3 backdrop-blur-lg rounded-full text-[18px] font-sans font-medium tracking-widest shadow-lg uppercase flex items-center gap-3 ${draft.colorMode === 'light' ? 'bg-black/10 border border-black/20 text-[#4a4138]' : 'bg-white/10 border border-white/20 text-white'}`}>
            <Globe size={20} /> WWW.SERENARAGA.FIT
          </span>
          <span className={`px-6 py-3 backdrop-blur-lg rounded-full text-[18px] font-sans font-medium tracking-widest shadow-lg uppercase flex items-center gap-3 ${draft.colorMode === 'light' ? 'bg-black/10 border border-black/20 text-[#4a4138]' : 'bg-white/10 border border-white/20 text-white'}`}>
            <WAIco size={20} /> 0895-1835-9037
          </span>
          <span className={`px-6 py-3 backdrop-blur-lg rounded-full text-[18px] font-sans font-medium tracking-widest shadow-lg uppercase flex items-center gap-3 ${draft.colorMode === 'light' ? 'bg-black/10 border border-black/20 text-[#4a4138]' : 'bg-white/10 border border-white/20 text-white'}`}>
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
          {draft.darkenIntensity ? (
            <div className="absolute inset-0 bg-black" style={{ opacity: draft.darkenIntensity / 100 }} />
          ) : null}
        </div>
      )}

      <div className="relative z-10 w-full h-full flex flex-col justify-between">
        <div className="w-full flex justify-between items-start">
          <Logo invert={draft.colorMode === 'dark' ? true : draft.colorMode === 'light' ? false : true} scale={0.7} />
        </div>

        <div className="w-full flex flex-col gap-6 justify-end flex-grow pb-12">

          {draft.quote ? (
            <div className="flex flex-col gap-6">
              <EditableText draft={draft} tag="p" value={`"${draft.quote}"`} field="quote" onEdit={onEdit} className="text-[60px] leading-[1.3] font-sans font-light drop-shadow-lg text-white max-w-[90%]" />
              {draft.author && (
                <EditableText draft={draft} tag="p" value={`— ${draft.author}`} field="author" onEdit={onEdit} className="text-[22px] font-sans font-medium tracking-[0.15em] uppercase drop-shadow-md mt-4 text-white/60" />
              )}
            </div>
          ) : draft.myth || draft.fact ? (
            <div className="flex flex-col gap-6 w-full">
              <div className="p-8 rounded-3xl border-l-4 border-red-500/50 bg-red-500/10 backdrop-blur-md shadow-xl w-[85%]">
                <p className="text-[20px] font-sans font-medium text-red-400 mb-2 tracking-[0.2em] uppercase">Mitos</p>
                <EditableText draft={draft} tag="p" value={draft.myth} field="myth" onEdit={onEdit} className="text-[30px] leading-[1.4] font-sans font-light text-white drop-shadow-md" />
              </div>
              <div className="p-8 rounded-3xl border-l-4 border-green-500/50 bg-green-500/10 backdrop-blur-md shadow-xl w-[85%]">
                <p className="text-[20px] font-sans font-medium text-green-400 mb-2 tracking-[0.2em] uppercase">Fakta</p>
                <EditableText draft={draft} tag="p" value={draft.fact} field="fact" onEdit={onEdit} className="text-[30px] leading-[1.4] font-sans font-light text-white drop-shadow-md" />
              </div>
            </div>
          ) : (
            <>
              <EditableText draft={draft} tag="h1" value={draft.title} field="title" onEdit={onEdit} className="text-[110px] leading-[0.9] text-white font-sans font-medium uppercase tracking-[0.05em] drop-shadow-2xl max-w-[90%]" />
              <EditableText draft={draft} tag="p" value={draft.description} field="description" onEdit={onEdit} className="text-[34px] leading-[1.4] text-white/80 font-sans font-light drop-shadow-lg max-w-[85%] mt-4" />
            </>
          )}
        </div>

        <div className="flex justify-between items-center w-full">
          <span className={`px-6 py-3 backdrop-blur-md rounded-full text-[16px] font-sans font-medium tracking-widest uppercase flex items-center gap-3 shadow-lg ${draft.colorMode === 'light' ? 'bg-black/10 border border-black/20 text-[#4a4138]' : 'bg-white/10 border border-white/20 text-white/90'}`}>
            <Globe size={18} /> WWW.SERENARAGA.FIT
          </span>
          <span className={`px-6 py-3 backdrop-blur-md rounded-full text-[16px] font-sans font-medium tracking-widest uppercase flex items-center gap-3 shadow-lg ${draft.colorMode === 'light' ? 'bg-black/10 border border-black/20 text-[#4a4138]' : 'bg-white/10 border border-white/20 text-white/90'}`}>
            <WAIco size={18} /> 0895-1835-9037
          </span>
          <span className={`px-6 py-3 backdrop-blur-md rounded-full text-[16px] font-sans font-medium tracking-widest uppercase flex items-center gap-3 shadow-lg ${draft.colorMode === 'light' ? 'bg-black/10 border border-black/20 text-[#4a4138]' : 'bg-white/10 border border-white/20 text-white/90'}`}>
            <InstagramIco size={18} /> @SERENA.RAGA
          </span>
        </div>
      </div>
    </div>
  );
};

/* 
══════════════════════════════════════════════════
   5. Story Minimalist (For 9:16 IG Stories)
══════════════════════════════════════════════════ */
export const StoryMinimalist: React.FC<TemplateProps> = ({ draft, Logo, WAIco, InstagramIco, onEdit }) => {
  return (
    <div className={`relative z-10 w-[1080px] ${draft.format === 'story' ? 'h-[1920px]' : draft.format === 'square' ? 'h-[1080px]' : 'h-[1350px]'} flex flex-col items-center justify-center p-[100px]`}>
      {draft.bgImage && (
        <div className="absolute inset-0 z-0">
          <img src={draft.bgImage} alt="Background" className="w-full h-full object-cover" crossOrigin="anonymous" />
          <div className="absolute inset-0 bg-black/20" />
          {draft.vignetteColor && draft.vignetteColor !== 'none' && (
            <div
              className={`absolute inset-0 bg-gradient-to-b ${draft.vignetteColor === 'black' ? 'from-black via-black/40' : 'from-white via-white/40'} to-transparent`}
              style={{ opacity: draft.vignetteIntensity ? draft.vignetteIntensity / 100 : 0.5 }}
            />
          )}
          {draft.darkenIntensity ? (
            <div className="absolute inset-0 bg-black" style={{ opacity: draft.darkenIntensity / 100 }} />
          ) : null}
        </div>
      )}

      {/* Top Logo - Pushed down to avoid IG Profile safe zone */}
      <div className="absolute top-[120px] w-full flex justify-center z-10">
        <Logo invert={draft.colorMode === 'dark' ? true : draft.colorMode === 'light' ? false : true} scale={0.8} />
      </div>

      <div className="relative z-10 w-full max-w-[85%] flex flex-col gap-6 text-center mt-[100px]">
        {draft.quote ? (
          <div className="flex flex-col items-center justify-center gap-8 bg-white/10 backdrop-blur-xl p-16 rounded-[3rem] border border-white/20 shadow-2xl">
            <EditableText draft={draft} tag="p" value={`"${draft.quote}"`} field="quote" onEdit={onEdit} className="text-[52px] leading-[1.3] font-serif italic text-white drop-shadow-md" />
            {draft.author && (
              <EditableText draft={draft} tag="p" value={`— ${draft.author}`} field="author" onEdit={onEdit} className="text-[22px] font-sans font-medium tracking-widest text-earth-primary uppercase bg-black/20 px-6 py-2 rounded-full" />
            )}
          </div>
        ) : draft.myth || draft.fact ? (
          <div className="flex flex-col gap-8 bg-white/10 backdrop-blur-xl p-12 rounded-[3rem] border border-white/20 shadow-2xl text-left">
            <div className="flex flex-col gap-2">
              <span className="text-[18px] font-sans font-bold text-earth-primary tracking-widest uppercase bg-black/20 self-start px-4 py-1 rounded-md mb-2">Mitos</span>
              <EditableText draft={draft} tag="p" value={draft.myth} field="myth" onEdit={onEdit} className="text-[32px] leading-[1.4] font-sans font-light text-white" />
            </div>
            <div className="w-full h-px bg-white/20" />
            <div className="flex flex-col gap-2">
              <span className="text-[18px] font-sans font-bold text-green-400 tracking-widest uppercase bg-black/20 self-start px-4 py-1 rounded-md mb-2">Fakta</span>
              <EditableText draft={draft} tag="p" value={draft.fact} field="fact" onEdit={onEdit} className="text-[32px] leading-[1.4] font-sans font-light text-white" />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-8 items-center justify-center bg-white/10 backdrop-blur-xl p-16 rounded-[3rem] border border-white/20 shadow-2xl">
            <EditableText draft={draft} tag="h1" value={draft.title} field="title" onEdit={onEdit} className="text-[75px] leading-[1.15] font-sans font-bold tracking-[0.05em] text-white uppercase drop-shadow-lg" />
            <div className="w-20 h-2 bg-earth-primary rounded-full" />
            <EditableText draft={draft} tag="p" value={draft.description} field="description" onEdit={onEdit} className="text-[36px] leading-[1.5] font-sans font-light text-white/90" />
          </div>
        )}
      </div>

      {/* Footer - Pushed up to avoid IG Reply safe zone */}
      <div className="absolute bottom-[120px] w-full flex flex-col items-center gap-4 z-10">
        <span className={`px-8 py-4 backdrop-blur-xl rounded-full text-[18px] font-sans font-medium tracking-widest uppercase flex items-center gap-3 shadow-2xl ${draft.colorMode === 'dark' ? 'bg-black/20 border border-black/30 text-white' : 'bg-white/20 border border-white/30 text-white'}`}>
          <WAIco size={20} /> BOOK NOW: 0895-1835-9037
        </span>
      </div>
    </div>
  );
};

export const GiftVoucher: React.FC<TemplateProps> = ({ draft, Logo, WAIco, InstagramIco, onEdit }) => {
  const vData = draft.voucherData || { code: 'SRAGA-1234', value: '100000', valueType: 'flat', name: 'GIFT VOUCHER', to: '', from: '', exp: '' };

  const vStr = vData.valueType === 'flat' ? `Rp ${Number(vData.value).toLocaleString('id-ID')}` : `${vData.value}%`;

  let dStr = 'Lifetime';
  if (vData.exp) {
    const parsed = new Date(vData.exp);
    if (isNaN(parsed.getTime())) {
      dStr = vData.exp; // Use raw string if it's not a valid ISO date
    } else {
      dStr = parsed.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    }
  }

  // Custom theme control (defaults to light background voucher if auto)
  const isLight = draft.colorMode === 'light' || draft.colorMode === 'auto';

  return (
    <div className="relative z-10 w-[1200px] h-[520px] flex overflow-hidden">
      {/* Dynamic AI Background filling entire 1200x520 */}
      <div className="absolute inset-0 z-0 bg-[#FAF6EF]">
        {draft.bgImage && (
          <img src={draft.bgImage} className="w-full h-full object-cover opacity-90" crossOrigin="anonymous" />
        )}
        <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px]" />
        {draft.darkenIntensity ? (
          <div className="absolute inset-0 bg-black" style={{ opacity: draft.darkenIntensity / 100 }} />
        ) : null}


        {draft.vignetteColor && draft.vignetteColor !== 'none' && (
          <div
            className={`absolute inset-0 bg-gradient-to-r ${draft.vignetteColor === 'black' ? 'from-black/80 via-black/20' : 'from-white/90 via-white/40'} to-transparent`}
            style={{ opacity: draft.vignetteIntensity ? draft.vignetteIntensity / 100 : 0.7 }}
          />
        )}
      </div>

      {/* LEFT PANEL */}
      <div className="w-[250px] h-full flex-shrink-0 flex flex-col justify-between items-center relative z-10 border-r border-white/20 font-sans py-10"
        style={{ background: isLight ? 'rgba(255,255,255,0.7)' : 'rgba(26,10,4,0.7)', backdropFilter: 'blur(10px)' }}>

        <div className="flex-1" />

        <div className="flex flex-row items-center justify-center gap-[12px] relative z-10">
          <div className="w-[45px] h-[160px] relative">
            <div className="absolute top-1/2 left-1/2 w-[160px] h-[45px] -translate-x-1/2 -translate-y-1/2 -rotate-90 overflow-hidden">
              <img src="/serenalogo2.svg" className={`absolute top-1/2 -left-2 -translate-y-1/2 h-[180px] w-auto max-w-none object-contain ${isLight ? 'brightness-0' : 'brightness-0 invert'} opacity-90`} crossOrigin="anonymous" />
            </div>
          </div>
          <div className="flex flex-col items-center justify-center gap-[12px]">
            <div className={`w-[1px] h-[80px] ${isLight ? 'bg-gradient-to-b from-transparent to-[#4a4138]/60' : 'bg-gradient-to-b from-transparent to-white/60'}`} />
            <p className={`text-[12px] tracking-[.4em] uppercase font-sans m-0 whitespace-nowrap ${isLight ? 'text-[#4a4138]' : 'text-white/80'} focus:outline-none focus:bg-white/10 px-1 py-1 rounded-sm cursor-text`} 
               style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
               contentEditable suppressContentEditableWarning
               onBlur={(e) => { if (onEdit) onEdit('voucherData.to', e.currentTarget.textContent || ''); }}
            >
              {vData.to ? `UNTUK ${vData.to}${vData.from ? ` DARI ${vData.from}` : ''}` : 'SPECIAL GIFT VOUCHER'}
            </p>
            <div className={`w-[1px] h-[80px] ${isLight ? 'bg-gradient-to-t from-transparent to-[#4a4138]/60' : 'bg-gradient-to-t from-transparent to-white/60'}`} />
          </div>
        </div>

        {/* Bottom Socials */}
        <div className={`flex-1 flex flex-col justify-end items-center gap-2.5 pb-2 ${isLight ? 'text-[#4a4138]' : 'text-white/70'} text-[12px] tracking-widest uppercase font-semibold font-sans`}>
          <div className="flex items-center gap-2 opacity-80">
            <InstagramIco size={15} />
            <span>@serena.raga</span>
          </div>
          <div className="flex items-center gap-2 opacity-80">
            <Globe size={15} />
            <span>serenaraga.fit</span>
          </div>
        </div>

      </div>

      {/* RIGHT CONTENT */}
      <div className="flex-1 h-full flex flex-col relative z-10">

        {/* Main content body */}
        <div className="flex-1 px-[45px] pt-[20px] pb-[10px] flex flex-col relative z-10">
          <div className="flex justify-between items-start h-[60px] flex-shrink-0 font-sans">
            <div className="relative w-[200px] h-[60px] overflow-hidden">
              <img src="/serenalogo.svg" className={`absolute top-1/2 -left-2 -translate-y-1/2 h-[160px] w-auto max-w-none object-contain ${isLight ? 'brightness-0' : 'brightness-0 invert'} opacity-80`} crossOrigin="anonymous" />
            </div>
          </div>

          {/* Center */}
          <div className="flex-1 flex flex-col items-center justify-center text-center font-sans -mt-10">
            {vData.tagline && (
              <p className={`text-[15px] font-sans italic tracking-wide max-w-[400px] mb-1 mt-0 ${isLight ? 'text-[#8B6B4E]/90' : 'text-white/70'} focus:outline-none focus:bg-white/10 px-2 py-1 rounded-sm cursor-text`}
                contentEditable suppressContentEditableWarning
                onBlur={(e) => { if (onEdit) onEdit('voucherData.tagline', e.currentTarget.textContent || ''); }}
              >
                {vData.tagline}
              </p>
            )}
            
            <h2 className={`text-[60px] font-bold font-sans leading-[1.1] mb-4 mt-1 ${isLight ? 'text-[#2C1408]' : 'text-white'} focus:outline-none focus:bg-white/10 px-2 rounded-sm cursor-text`}
              contentEditable suppressContentEditableWarning
              onBlur={(e) => { if (onEdit) onEdit('voucherData.name', e.currentTarget.textContent || ''); }}
            >
              {vData.name || 'Gift Voucher'}
            </h2>

            <div className={`w-[200px] h-[1px] my-[4px] mx-auto ${isLight ? 'bg-gradient-to-r from-transparent via-[#8B6B4E] to-transparent' : 'bg-gradient-to-r from-transparent via-white/50 to-transparent'}`} />

            <div className="flex items-end justify-center gap-3 my-[6px]">
              <p className={`text-[44px] leading-none tracking-[.05em] font-bold font-sans m-0 ${isLight ? 'text-[#8B6340]' : 'text-[#e5d4c3]'} focus:outline-none focus:bg-white/10 px-2 py-1 rounded-sm cursor-text`}
                contentEditable suppressContentEditableWarning
                onBlur={(e) => {
                  const val = e.currentTarget.textContent || '';
                  const numStr = val.replace(/\D/g, '');
                  if (numStr && onEdit) onEdit('voucherData.value', numStr);
                }}
              >
                {vStr.toUpperCase()}
              </p>
              <span className={`text-[20px] leading-none tracking-[.15em] font-bold font-sans mb-[8px] ${isLight ? 'text-[#8B6340]' : 'text-[#e5d4c3]'}`}>
                OFF
              </span>
            </div>

            <div className={`w-[200px] h-[1px] my-[4px] mx-auto ${isLight ? 'bg-gradient-to-r from-transparent via-[#8B6B4E] to-transparent' : 'bg-gradient-to-r from-transparent via-white/50 to-transparent'}`} />

            {/* Voucher Code placed here as a classic coupon badge */}
            <div className={`mt-4 px-6 py-1.5 border-[2px] ${isLight ? 'border-[#8B6340] text-[#8B6340]' : 'border-white/50 text-white/90'} border-dashed rounded-xl inline-block bg-black/5`}>
              <p className="text-[9px] tracking-[.2em] font-sans font-bold m-0 opacity-70 uppercase text-center mb-0.5">KODE VOUCHER</p>
              <p className="font-sans font-bold tracking-[.25em] text-[22px] focus:outline-none m-0 text-center uppercase"
                contentEditable suppressContentEditableWarning
                onBlur={(e) => { if (onEdit) onEdit('voucherData.code', e.currentTarget.textContent || ''); }}
              >
                {vData.code}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom strip */}
        <div className={`h-[100px] flex-shrink-0 px-[45px] flex justify-between items-center gap-[40px] relative z-10 border-t ${isLight ? 'border-[#4a4138]/20 bg-white/40' : 'border-white/20 bg-black/40'} backdrop-blur-md font-sans`}>
          <div className="flex-1">
            <p className={`text-[11px] tracking-[.18em] font-bold font-sans mb-1.5 mt-0 ${isLight ? 'text-[#6B4E37]' : 'text-white/60'}`}>SYARAT & KETENTUAN:</p>
            <div className="flex gap-1.5 mb-1">
              <span className={`text-[12px] font-sans flex-shrink-0 leading-[1.3] ${isLight ? 'text-[#7A6050]' : 'text-white/50'}`}>•</span>
              <p className={`text-[12px] font-sans leading-[1.3] m-0 ${isLight ? 'text-[#7A6050]' : 'text-white/50'} focus:outline-none focus:bg-white/10 px-1 rounded-sm cursor-text`}
                contentEditable suppressContentEditableWarning
                onBlur={(e) => { if (onEdit) onEdit('voucherData.terms1', e.currentTarget.textContent || ''); }}>
                {vData.terms1 || 'Berlaku untuk layanan Home Service Massage.'}
              </p>
            </div>
            <div className="flex gap-1.5 mb-1">
              <span className={`text-[12px] font-sans flex-shrink-0 leading-[1.3] ${isLight ? 'text-[#7A6050]' : 'text-white/50'}`}>•</span>
              <p className={`text-[12px] font-sans leading-[1.3] m-0 ${isLight ? 'text-[#7A6050]' : 'text-white/50'} focus:outline-none focus:bg-white/10 px-1 rounded-sm cursor-text`}
                contentEditable suppressContentEditableWarning
                onBlur={(e) => { if (onEdit) onEdit('voucherData.terms2', e.currentTarget.textContent || ''); }}>
                {vData.terms2 || 'Wajib melakukan reservasi maksimal H-1 sebelum kedatangan.'}
              </p>
            </div>
            <div className="flex gap-1.5 mb-1">
              <span className={`text-[12px] font-sans flex-shrink-0 leading-[1.3] ${isLight ? 'text-[#7A6050]' : 'text-white/50'}`}>•</span>
              <p className={`text-[12px] font-sans leading-[1.3] m-0 ${isLight ? 'text-[#7A6050]' : 'text-white/50'} focus:outline-none focus:bg-white/10 px-1 rounded-sm cursor-text`}
                contentEditable suppressContentEditableWarning
                onBlur={(e) => { if (onEdit) onEdit('voucherData.terms3', e.currentTarget.textContent || ''); }}>
                {vData.terms3 || 'Voucher tidak dapat diuangkan atau digabung dengan promo lainnya.'}
              </p>
            </div>
          </div>

          <div className={`w-[1px] h-[45px] flex-shrink-0 ${isLight ? 'bg-[#4a4138]/20' : 'bg-white/20'}`} />

          <div className="flex gap-[60px] flex-shrink-0 items-center">
            <div className="text-center">
              <p className={`text-[10px] tracking-[.1em] font-semibold font-sans mb-1.5 mt-0 ${isLight ? 'text-[#7A6050]' : 'text-white/50'}`}>VALID HINGGA</p>
              <p className={`text-[16px] font-bold font-sans m-0 ${isLight ? 'text-[#2D3748]' : 'text-white'} focus:outline-none focus:bg-white/10 px-2 rounded-sm cursor-text`}
                contentEditable suppressContentEditableWarning
                onBlur={(e) => { if (onEdit) onEdit('voucherData.exp', e.currentTarget.textContent || ''); }}>
                {dStr}
              </p>
            </div>
            <div className="text-center">
              <p className={`text-[10px] tracking-[.1em] font-semibold font-sans mb-1.5 mt-0 ${isLight ? 'text-[#7A6050]' : 'text-white/50'}`}>RESERVASI</p>
              <div className={`flex items-center gap-[6px] justify-center ${isLight ? 'text-[#25D366]' : 'text-white'}`}>
                <WAIco size={18} />
                <p className="text-[16px] font-bold font-sans m-0 focus:outline-none focus:bg-white/10 px-2 rounded-sm cursor-text"
                  contentEditable suppressContentEditableWarning
                  onBlur={(e) => { if (onEdit) onEdit('voucherData.contact', e.currentTarget.textContent || ''); }}>
                  {vData.contact || '0895-1835-9037'}
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
