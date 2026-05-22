const fs = require('fs');
let c = fs.readFileSync('src/components/canvas/FeedTemplates.tsx', 'utf8');

const darkenLayer = `
        {draft.darkenIntensity ? (
          <div className="absolute inset-0 bg-black" style={{ opacity: draft.darkenIntensity / 100 }} />
        ) : null}`;

// 1. SplitScreenDark — find the closing </div> after the vignette block (unique text)
c = c.replace(
  `{draft.vignetteColor && draft.vignetteColor !== 'none' && (
          <div 
            className={\`absolute inset-0 bg-gradient-to-b \${draft.vignetteColor === 'black' ? 'from-black via-black/40' : 'from-white via-white/40'} to-transparent\`}
            style={{ opacity: draft.vignetteIntensity ? draft.vignetteIntensity / 100 : 0.5 }}
          />
        )}
      </div>`,
  `{draft.vignetteColor && draft.vignetteColor !== 'none' && (
          <div 
            className={\`absolute inset-0 bg-gradient-to-b \${draft.vignetteColor === 'black' ? 'from-black via-black/40' : 'from-white via-white/40'} to-transparent\`}
            style={{ opacity: draft.vignetteIntensity ? draft.vignetteIntensity / 100 : 0.5 }}
          />
        )}` + darkenLayer + `
      </div>`
);

// 2. ClassicGlass & EditorialOverlay — use from-bottom vignette (to-t)
// They share the same pattern but differ in being inside {draft.bgImage && (...)}
const vignetteToT = `{draft.vignetteColor && draft.vignetteColor !== 'none' && (
            <div 
              className={\`absolute inset-0 bg-gradient-to-t \${draft.vignetteColor === 'black' ? 'from-black via-black/50' : 'from-white via-white/50'} to-transparent\`}
              style={{ opacity: draft.vignetteIntensity ? draft.vignetteIntensity / 100 : 0.5 }}
            />
          )}
        </div>
      )}`;

const vignetteToTReplaced = `{draft.vignetteColor && draft.vignetteColor !== 'none' && (
            <div 
              className={\`absolute inset-0 bg-gradient-to-t \${draft.vignetteColor === 'black' ? 'from-black via-black/50' : 'from-white via-white/50'} to-transparent\`}
              style={{ opacity: draft.vignetteIntensity ? draft.vignetteIntensity / 100 : 0.5 }}
            />
          )}
          {draft.darkenIntensity ? (
            <div className="absolute inset-0 bg-black" style={{ opacity: draft.darkenIntensity / 100 }} />
          ) : null}
        </div>
      )}`;

// Replace all occurrences (ClassicGlass + EditorialOverlay both use same pattern)
while (c.includes(vignetteToT)) {
  c = c.replace(vignetteToT, vignetteToTReplaced);
}

fs.writeFileSync('src/components/canvas/FeedTemplates.tsx', c, 'utf8');

// Verify
const count = (c.match(/draft\.darkenIntensity/g) || []).length;
console.log('Total darkenIntensity occurrences after patch:', count, '(expected: 6)');
