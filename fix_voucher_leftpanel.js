const fs = require('fs');

let feedFile = 'src/components/canvas/FeedTemplates.tsx';
let feedC = fs.readFileSync(feedFile, 'utf8');

// 1. Fix WhatsApp icon color
const searchWa = \`              <div className="flex items-center gap-[6px] justify-center">
                <WAIco size={18} />
                <p className={\\\`text-[16px] font-bold font-sans m-0 \${isLight ? 'text-[#25D366]' : 'text-white'} focus:outline-none focus:bg-white/10 px-2 rounded-sm cursor-text\\\`}
                   contentEditable suppressContentEditableWarning
                   onBlur={(e) => { if (onEdit) onEdit('voucherData.contact', e.currentTarget.textContent || ''); }}>\`;

const replaceWa = \`              <div className={\\\`flex items-center gap-[6px] justify-center \${isLight ? 'text-[#25D366]' : 'text-white'}\\\`}>
                <WAIco size={18} />
                <p className="text-[16px] font-bold font-sans m-0 focus:outline-none focus:bg-white/10 px-2 rounded-sm cursor-text"
                   contentEditable suppressContentEditableWarning
                   onBlur={(e) => { if (onEdit) onEdit('voucherData.contact', e.currentTarget.textContent || ''); }}>\`;

feedC = feedC.replace(searchWa, replaceWa);

// 2. Update Left Panel to include Socials
const searchLeftPanel = \`      {/* LEFT PANEL */}
      <div className="w-[250px] h-full flex-shrink-0 flex items-center justify-center relative z-10 border-r border-white/20 font-sans"
           style={{ background: isLight ? 'rgba(255,255,255,0.7)' : 'rgba(26,10,4,0.7)', backdropFilter: 'blur(10px)' }}>
        
        <div className="flex flex-row items-center justify-center gap-[12px] relative z-10">
          <div className="w-[45px] h-[160px] relative">
            <div className="absolute top-1/2 left-1/2 w-[160px] h-[45px] -translate-x-1/2 -translate-y-1/2 -rotate-90 overflow-hidden">
              <img src="/serenalogo2.svg" className={\\\`absolute top-1/2 -left-2 -translate-y-1/2 h-[180px] w-auto max-w-none object-contain \${isLight ? 'brightness-0' : 'brightness-0 invert'} opacity-90\\\`} crossOrigin="anonymous"/>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center gap-[24px]">
            <div className={\\\`w-[1px] h-[80px] \${isLight ? 'bg-gradient-to-b from-transparent to-[#4a4138]/60' : 'bg-gradient-to-b from-transparent to-white/60'}\\\`}/>
            <p className={\\\`text-[17px] tracking-[.4em] font-sans m-0 whitespace-nowrap \${isLight ? 'text-[#4a4138]' : 'text-white/80'}\\\`} style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
              SERENARAGA
            </p>
            <div className={\\\`w-[1px] h-[80px] \${isLight ? 'bg-gradient-to-t from-transparent to-[#4a4138]/60' : 'bg-gradient-to-t from-transparent to-white/60'}\\\`}/>
          </div>
        </div>
      </div>\`;

const replaceLeftPanel = \`      {/* LEFT PANEL */}
      <div className="w-[250px] h-full flex-shrink-0 flex flex-col justify-between items-center relative z-10 border-r border-white/20 font-sans py-10"
           style={{ background: isLight ? 'rgba(255,255,255,0.7)' : 'rgba(26,10,4,0.7)', backdropFilter: 'blur(10px)' }}>
        
        <div className="flex-1" />

        <div className="flex flex-row items-center justify-center gap-[12px] relative z-10">
          <div className="w-[45px] h-[160px] relative">
            <div className="absolute top-1/2 left-1/2 w-[160px] h-[45px] -translate-x-1/2 -translate-y-1/2 -rotate-90 overflow-hidden">
              <img src="/serenalogo2.svg" className={\\\`absolute top-1/2 -left-2 -translate-y-1/2 h-[180px] w-auto max-w-none object-contain \${isLight ? 'brightness-0' : 'brightness-0 invert'} opacity-90\\\`} crossOrigin="anonymous"/>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center gap-[24px]">
            <div className={\\\`w-[1px] h-[80px] \${isLight ? 'bg-gradient-to-b from-transparent to-[#4a4138]/60' : 'bg-gradient-to-b from-transparent to-white/60'}\\\`}/>
            <p className={\\\`text-[17px] tracking-[.4em] font-sans m-0 whitespace-nowrap \${isLight ? 'text-[#4a4138]' : 'text-white/80'}\\\`} style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
              SERENARAGA
            </p>
            <div className={\\\`w-[1px] h-[80px] \${isLight ? 'bg-gradient-to-t from-transparent to-[#4a4138]/60' : 'bg-gradient-to-t from-transparent to-white/60'}\\\`}/>
          </div>
        </div>

        {/* Bottom Socials */}
        <div className={\\\`flex-1 flex flex-col justify-end items-center gap-2.5 pb-2 \${isLight ? 'text-[#4a4138]' : 'text-white/70'} text-[10px] tracking-widest uppercase font-semibold font-sans\\\`}>
          <div className="flex items-center gap-2 opacity-80">
            <InstagramIco size={13} />
            <span>@serenaraga</span>
          </div>
          <div className="flex items-center gap-2 opacity-80">
            <Globe size={13} />
            <span>serenaraga.com</span>
          </div>
        </div>

      </div>\`;

feedC = feedC.replace(searchLeftPanel, replaceLeftPanel);

fs.writeFileSync(feedFile, feedC, 'utf8');
