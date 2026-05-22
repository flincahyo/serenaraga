const fs = require('fs');
let file = 'src/app/admin/feed-studio-v2/page.tsx';
let c = fs.readFileSync(file, 'utf8');

// 1. Add Moon icon
c = c.replace('Loader2 } from \'lucide-react\';', 'Loader2, Moon } from \'lucide-react\';');

// 2. Add the control functions
const handlerInjection = `  const toggleDarken = () => {
    if (!activeDraft) return;
    const current = viewDraft?.darkenIntensity || 0;
    const next = current === 0 ? 60 : 0;
    
    if (isCarousel && activeDraft.slides) {
      const newSlides = [...activeDraft.slides];
      newSlides[currentSlideIndex] = {
        ...newSlides[currentSlideIndex],
        darkenIntensity: next
      };
      setActiveDraft({ ...activeDraft, slides: newSlides });
    } else {
      setActiveDraft({ ...activeDraft, darkenIntensity: next });
    }
  };

  const changeDarkenIntensity = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!activeDraft) return;
    const intensity = parseInt(e.target.value);
    
    if (isCarousel && activeDraft.slides) {
      const newSlides = [...activeDraft.slides];
      newSlides[currentSlideIndex] = {
        ...newSlides[currentSlideIndex],
        darkenIntensity: intensity
      };
      setActiveDraft({ ...activeDraft, slides: newSlides });
    } else {
      setActiveDraft({ ...activeDraft, darkenIntensity: intensity });
    }
  };
`;
c = c.replace('  const changeVignetteIntensity = (e: React.ChangeEvent<HTMLInputElement>) => {', handlerInjection + '\n  const changeVignetteIntensity = (e: React.ChangeEvent<HTMLInputElement>) => {');

// 3. Add the UI below Vignette Controls
const uiInjection = `
                    <div className="w-[1px] h-4 bg-slate-300" />
                    {/* Darken Controls */}
                    <div className="flex items-center gap-2 px-2">
                      <button 
                        onClick={toggleDarken}
                        title="Gelapkan Background"
                        className={\`p-1.5 rounded-full border transition-colors \${!viewDraft.darkenIntensity ? 'border-transparent text-slate-400 hover:bg-slate-100' : 'bg-slate-800 text-white border-slate-800 shadow-sm'}\`}
                      >
                        <Moon size={14} />
                      </button>
                      {viewDraft.darkenIntensity > 0 && (
                        <input 
                          type="range" 
                          min="0" max="100" 
                          value={viewDraft.darkenIntensity} 
                          onChange={changeDarkenIntensity}
                          className="w-16 h-1 accent-earth-primary cursor-pointer"
                        />
                      )}
                    </div>`;

c = c.replace('                    {/* Vignette Controls */}', uiInjection + '\n                    {/* Vignette Controls */}');

// 4. Update Carousel Slide types to accept darkenIntensity
c = c.replace('vignetteIntensity?: number;', 'vignetteIntensity?: number;\n  darkenIntensity?: number;');

fs.writeFileSync(file, c, 'utf8');
