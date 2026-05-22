const fs = require('fs');

// 1. Update PostDraft interface in page.tsx
let pageFile = 'src/app/admin/feed-studio-v2/page.tsx';
let pageC = fs.readFileSync(pageFile, 'utf8');

if (!pageC.includes('darkenIntensity?: number;')) {
    pageC = pageC.replace('vignetteIntensity?: number;', 'vignetteIntensity?: number;\n  darkenIntensity?: number;');
}

// Inject UI for Darken Background
const uiInjection = `          <div>
            <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block mb-2">Gelapkan Background</label>
            <input type="range" min="0" max="90" value={activeDraft.darkenIntensity || 0} onChange={e => {
               const val = Number(e.target.value);
               setActiveDraft(p => p ? { ...p, darkenIntensity: val } : null);
            }} className="w-full accent-earth-primary" />
          </div>`;

if (!pageC.includes('Gelapkan Background')) {
    pageC = pageC.replace(
        '<label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block mb-2">Vignette & Theme</label>',
        uiInjection + '\n\n          <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block mt-4 mb-2">Vignette & Theme</label>'
    );
}

fs.writeFileSync(pageFile, pageC, 'utf8');

// 2. Update FeedTemplates.tsx
let feedFile = 'src/components/canvas/FeedTemplates.tsx';
let feedC = fs.readFileSync(feedFile, 'utf8');

// Add darken overlay
if (!feedC.includes('draft.darkenIntensity ?')) {
    const darkenLayer = `
        {draft.darkenIntensity ? (
          <div className="absolute inset-0 bg-black" style={{ opacity: draft.darkenIntensity / 100 }} />
        ) : null}
`;
    feedC = feedC.replace('<div className="absolute inset-0 bg-white/10 backdrop-blur-[2px]" />', '<div className="absolute inset-0 bg-white/10 backdrop-blur-[2px]" />' + darkenLayer);
}

// Replace font-mono with font-sans ONLY inside GiftVoucher
const startIndex = feedC.indexOf('export const GiftVoucher');
if (startIndex !== -1) {
    const before = feedC.substring(0, startIndex);
    const target = feedC.substring(startIndex);
    const updatedTarget = target.replace(/font-mono/g, 'font-sans');
    feedC = before + updatedTarget;
}

fs.writeFileSync(feedFile, feedC, 'utf8');
