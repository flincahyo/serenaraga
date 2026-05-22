const fs = require('fs');
let file = 'src/app/admin/feed-studio-v2/page.tsx';
let c = fs.readFileSync(file, 'utf8');

// 1. Remove the old bulk PDF container
const hiddenRegex = /\{\/\* Hidden Container for Bulk PDF Rendering \*\/\}[\s\S]*?(?=\s*<\/div>\s*<\/div>\s*\);\s*\})/m;
c = c.replace(hiddenRegex, '');

// 2. Add renderProgress state
if (!c.includes('const [renderProgress')) {
    c = c.replace('const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);', 'const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);\n  const [renderProgress, setRenderProgress] = useState<{current: number, total: number} | null>(null);');
}

// 3. Rewrite handleGeneratePDF
const newHandleGenerate = `
  const handleGeneratePDF = async () => {
    if (!activeDraft || batchVouchers.length === 0) return;
    setIsGeneratingPDF(true);
    setRenderProgress({ current: 1, total: batchVouchers.length });

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = 210;
      const pdfHeight = 297;
      const margin = 10;
      const usableWidth = pdfWidth - margin * 2; // 190mm
      const voucherRatio = 1200 / 520;
      const printHeight = usableWidth / voucherRatio; // ~82.3mm
      let yOffset = margin;

      // Allow React to render the first hidden voucher
      await new Promise(r => setTimeout(r, 500));

      for (let i = 0; i < batchVouchers.length; i++) {
        setRenderProgress({ current: i + 1, total: batchVouchers.length });
        
        // Wait for React to update the DOM with the new voucher data
        await new Promise(r => setTimeout(r, 300));
        
        if (!batchContainerRef.current) continue;
        const node = batchContainerRef.current.firstElementChild as HTMLElement;
        if (!node) continue;

        const dataUrl = await htmlToImage.toJpeg(node, {
          quality: 0.95,
          width: 1200,
          height: 520,
          pixelRatio: 2,
          style: { overflow: 'visible' },
        });

        if (yOffset + printHeight > pdfHeight - margin) {
          pdf.addPage();
          yOffset = margin;
        }

        pdf.addImage(dataUrl, 'JPEG', margin, yOffset, usableWidth, printHeight);
        yOffset += printHeight + 5; // 5mm gap
      }

      pdf.save(\`Voucher_Batch_\${batchName}.pdf\`);
    } catch (e) {
      console.error(e);
      alert('Gagal mencetak PDF.');
    } finally {
      setIsGeneratingPDF(false);
      setRenderProgress(null);
    }
  };
`;
// Replace the old handleGeneratePDF
const generatePdfRegex = /const handleGeneratePDF = async \(\) => \{[\s\S]*?pdf\.save[^}]*\} catch[\s\S]*?finally \{[\s\S]*?\}[\s\S]*?\};/m;
c = c.replace(generatePdfRegex, newHandleGenerate.trim());

// 4. Update the Button text
c = c.replace(
  '{isGeneratingPDF ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />} <span className="text-sm ml-2 font-bold">Download PDF Bulk</span>',
  '{isGeneratingPDF ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />} <span className="text-sm ml-2 font-bold">{isGeneratingPDF ? `Memproses (${renderProgress?.current}/${renderProgress?.total})` : "Download PDF Bulk"}</span>'
);

// 5. Append the optimized hidden container
const newHiddenContainer = `
      {/* Optimized Single Node Hidden Container for Bulk PDF Rendering */}
      {batchName && batchVouchers.length > 0 && activeDraft && isGeneratingPDF && renderProgress && (
        <div 
          ref={batchContainerRef} 
          style={{ position: 'fixed', top: '-9999px', left: '-9999px', zIndex: -100, pointerEvents: 'none' }}
        >
          <div style={{ width: 1200, height: 520, position: 'relative', overflow: 'hidden' }}>
            <GiftVoucher 
              draft={{ 
                ...activeDraft, 
                voucherData: { 
                  ...activeDraft.voucherData, 
                  ...(batchVouchers[renderProgress.current - 1] || {}) 
                } 
              }}
              Logo={Logo} WAIco={WAIco} InstagramIco={InstagramIco}
            />
          </div>
        </div>
      )}
`;
const insertIndex = c.lastIndexOf('</div>');
if (insertIndex !== -1) {
    const before = c.substring(0, insertIndex);
    const after = c.substring(insertIndex);
    c = before + newHiddenContainer + after;
}

fs.writeFileSync(file, c, 'utf8');
