const fs = require('fs');
let file = 'src/app/admin/feed-studio-v2/page.tsx';
let c = fs.readFileSync(file, 'utf8');

const badInjection = `
      {/* Hidden Container for Bulk PDF Rendering */}
      {batchName && batchVouchers.length > 0 && activeDraft && (
        <div 
          ref={batchContainerRef} 
          style={{ position: 'fixed', top: '-9999px', left: '-9999px', zIndex: -100, pointerEvents: 'none' }}
        >
          {batchVouchers.map((v, i) => (
            <div key={i} style={{ width: 1200, height: 520, position: 'relative', overflow: 'hidden' }}>
              <GiftVoucher 
                draft={{ ...activeDraft, voucherData: { ...activeDraft.voucherData, ...v } }}
                Logo={Logo} WAIco={WAIco} InstagramIco={InstagramIco}
              />
            </div>
          ))}
        </div>
      )}
`;

c = c.replace(badInjection, '');

// Also remove replaceState to fix the back button/refresh issue
c = c.replace('window.history.replaceState({}, document.title, window.location.pathname);', '// removed replaceState to keep batch query param');

// Replace the Printer button text
c = c.replace(
  '{isGeneratingPDF ? <Loader2 size={18} className="animate-spin" /> : <Printer size={18} />}', 
  '{isGeneratingPDF ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />} <span className="text-sm ml-2 font-bold">Download PDF Bulk</span>'
);

// Change button style slightly to accommodate text
c = c.replace(
  'className="bg-earth-primary text-white p-3 rounded-full hover:bg-earth-primary/90 transition-all flex items-center justify-center disabled:opacity-50 shadow-md"', 
  'className="bg-earth-primary text-white px-6 py-3 rounded-full hover:bg-earth-primary/90 transition-all flex items-center justify-center disabled:opacity-50 shadow-md"'
);

// Now insert badInjection at the proper end of the file.
// The file should end with something like:
//       </div>
//     </div>
//   );
// }
// We can append it just before the final `</div>\n    </div>\n  );\n}`.
// Alternatively, since the last component is FeedStudioV2, we can just replace the last </div> before the end.

const insertIndex = c.lastIndexOf('</div>');
if (insertIndex !== -1) {
    const before = c.substring(0, insertIndex);
    const after = c.substring(insertIndex);
    c = before + badInjection + after;
}

fs.writeFileSync(file, c, 'utf8');
