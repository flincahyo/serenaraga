import React from 'react';
import { Globe } from 'lucide-react';
import QRCode from 'react-qr-code';

const ThreadsIco = ({ size = 15, className }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 192 192" fill="currentColor" className={className}>
    <path d="M141.537 88.9883C140.71 88.5919 139.87 88.2104 139.019 87.8451C137.537 60.5382 122.616 44.905 97.5619 44.745C97.4484 44.7443 97.3355 44.7443 97.222 44.7443C82.2364 44.7443 69.7731 51.1409 62.102 62.7807L75.881 72.2328C81.6116 63.5383 90.6052 61.6848 97.2286 61.6848C97.3051 61.6848 97.3819 61.6848 97.4576 61.6855C105.707 61.7381 111.932 64.1366 115.961 68.814C118.893 72.2193 120.854 76.925 121.825 82.8638C114.511 81.6207 106.601 81.2385 98.145 81.7233C74.3247 83.0954 59.0111 96.9879 60.0396 116.292C60.5615 126.084 65.4397 134.508 73.775 140.011C80.8224 144.663 89.899 146.938 99.3323 146.423C111.79 145.74 121.563 140.987 128.381 132.296C133.559 125.696 136.834 117.143 138.28 106.366C144.217 109.949 148.617 114.664 151.047 120.332C155.179 129.967 155.42 145.8 142.501 158.708C131.182 170.016 117.576 174.908 97.0135 175.059C74.2042 174.89 56.9538 167.575 45.7381 153.317C35.2355 139.966 29.8077 120.682 29.6052 96C29.8077 71.3178 35.2355 52.0336 45.7381 38.6827C56.9538 24.4249 74.2039 17.11 97.0132 16.9405C119.988 17.1113 137.539 24.4614 149.184 38.788C154.894 45.8136 159.199 54.6488 162.037 64.9503L178.184 60.6422C174.744 47.9622 169.331 37.0357 161.965 27.974C147.036 9.60668 125.202 0.195148 97.0695 0H96.9569C68.8816 0.19447 47.2921 9.6418 32.7883 28.0793C19.8819 44.4864 13.2244 67.3157 13.0007 95.9325L13 96L13.0007 96.0675C13.2244 124.684 19.8819 147.514 32.7883 163.921C47.2921 182.358 68.8816 191.806 96.9569 192H97.0695C122.03 191.827 139.624 185.292 154.118 170.811C173.081 151.866 172.51 128.119 166.26 113.541C161.776 103.087 153.227 94.5962 141.537 88.9883ZM98.4405 129.507C88.0005 130.095 77.1544 125.409 76.6196 115.372C76.2232 107.93 81.9158 99.626 99.0812 98.6368C101.047 98.5234 102.976 98.468 104.871 98.468C111.106 98.468 116.939 99.0737 122.242 100.233C120.264 124.935 108.662 128.946 98.4405 129.507Z"/>
  </svg>
);

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
  const selectedBgColor = vData.bg_color || vData.bgColor || '#FAF6EF';
  const isDarkColor = ['#321B0F', '#2B2927'].includes(selectedBgColor.toUpperCase());
  const isLight = draft.colorMode === 'light' ? true : draft.colorMode === 'dark' ? false : !isDarkColor;

  return (
    <div className="relative z-10 w-[1200px] h-[520px] flex overflow-hidden">
      {/* Dynamic AI Background filling entire 1200x520 */}
      <div className="absolute inset-0 z-0" style={{ backgroundColor: selectedBgColor }}>
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

export const EventRedemptionVoucher: React.FC<TemplateProps> = ({ draft, Logo, WAIco, InstagramIco, onEdit }) => {
  const vData = draft.voucherData || {
    name: 'VOUCHER PENUKARAN',
    event_item: '1x Merchandise Kaos',
    qr_url: 'https://instagram.com/serena.raga'
  };

  const selectedBgColor = vData.bg_color || vData.bgColor || '#FAF6EF';
  const isDarkColor = ['#321B0F', '#2B2927'].includes(selectedBgColor.toUpperCase());
  const isLight = draft.colorMode === 'light' ? true : draft.colorMode === 'dark' ? false : !isDarkColor;
  
  const textColorClass = isLight ? 'text-stone-900' : 'text-stone-50';
  const subTextColorClass = isLight ? 'text-stone-500/80' : 'text-[#FAF6EF]/60';
  const dividerColorClass = isLight ? 'bg-stone-900/10' : 'bg-white/10';

  return (
    <div className="relative z-10 w-[1200px] h-[520px] flex overflow-hidden">
      {/* Background with textures and vignette */}
      <div className="absolute inset-0 z-0" style={{ backgroundColor: selectedBgColor }}>
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

      {/* Main Container */}
      <div className="relative z-10 w-full h-full flex p-20 gap-16 items-center justify-between">
        
        {/* LEFT SIDE: Brand & Title & Item */}
        <div className="flex flex-col justify-between h-full w-[50%] flex-shrink-0">
          {/* Logo */}
          <div className="flex flex-col items-start">
            <div className="relative w-[220px] h-[60px] overflow-hidden">
              <img src="/serenalogo.svg" className={`absolute top-1/2 -left-2 -translate-y-1/2 h-[150px] w-auto max-w-none object-contain ${isLight ? 'brightness-0' : 'brightness-0 invert'} opacity-95`} crossOrigin="anonymous" />
            </div>
          </div>

          {/* Title & Item description */}
          <div className="flex flex-col items-start gap-3 my-auto">
            <h2 className={`text-[12px] font-bold tracking-[0.25em] uppercase m-0 ${subTextColorClass} focus:outline-none focus:bg-white/10 px-2 py-0.5 rounded cursor-text`}
              contentEditable suppressContentEditableWarning
              onBlur={(e) => { if (onEdit) onEdit('voucherData.name', e.currentTarget.textContent || ''); }}
            >
              {vData.name || 'VOUCHER PENUKARAN'}
            </h2>

            <h1 className={`text-[46px] font-serif font-normal italic tracking-wide m-0 leading-tight ${textColorClass} focus:outline-none focus:bg-white/10 px-3 py-1 rounded cursor-text -mx-3`}
              contentEditable suppressContentEditableWarning
              onBlur={(e) => { if (onEdit) onEdit('voucherData.event_item', e.currentTarget.textContent || ''); }}
            >
              {vData.event_item || vData.eventItem || '1x Merchandise'}
            </h1>
          </div>
        </div>

        {/* MIDDLE DIVIDER LINE */}
        <div className={`w-[1px] h-[280px] ${dividerColorClass} flex-shrink-0`} />

        {/* RIGHT SIDE: QR Code / Barcode */}
        <div className="w-[40%] flex-shrink-0 h-full flex flex-col items-center justify-center gap-3">
          {/* QR Code Container */}
          <div className="bg-white p-3.5 rounded-2xl shadow-sm flex items-center justify-center">
            <QRCode
              value={vData.qr_url || vData.qrUrl || 'https://instagram.com/serena.raga'}
              size={180}
              style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
              viewBox="0 0 256 256"
            />
          </div>
          {/* Social Info List (Left-Aligned inside Centered Block) */}
          <div className="flex flex-col gap-2.5 mt-3 items-start justify-center">
            {/* Instagram */}
            <div className={`flex items-center gap-2.5 text-[14px] font-sans font-bold tracking-wider ${textColorClass} opacity-80`}>
              <div className="shrink-0 flex items-center justify-center w-[18px]"><InstagramIco size={14} /></div>
              <span>{(vData.instagram || '@serena.raga').toLowerCase()}</span>
            </div>
            
            {/* WhatsApp */}
            <div className={`flex items-center gap-2.5 text-[14px] font-sans font-bold tracking-wider ${textColorClass} opacity-80`}>
              <div className="shrink-0 flex items-center justify-center w-[18px]"><WAIco size={14} /></div>
              <span>{(vData.whatsapp || vData.contact || '0895-1835-9037')}</span>
            </div>

            {/* Threads */}
            <div className={`flex items-center gap-2.5 text-[14px] font-sans font-bold tracking-wider ${textColorClass} opacity-80`}>
              <div className="shrink-0 flex items-center justify-center w-[18px]"><ThreadsIco size={14} /></div>
              <span>{(vData.threads || '@serena.raga').toLowerCase()}</span>
            </div>

            {/* Website */}
            <div className={`flex items-center gap-2.5 text-[14px] font-sans font-bold tracking-wider ${textColorClass} opacity-80`}>
              <div className="shrink-0 flex items-center justify-center w-[18px]"><Globe size={14} /></div>
              <span>{(vData.website || 'serenaraga.fit').toLowerCase()}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
