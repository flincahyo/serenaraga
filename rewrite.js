const fs = require('fs');
const file = 'src/app/admin/feed-studio-v2/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add jsPDF import and Printer icon
content = content.replace(
    "import * as htmlToImage from 'html-to-image';",
    "import * as htmlToImage from 'html-to-image';\nimport jsPDF from 'jspdf';"
);
content = content.replace(
    "Phone, Droplet, Palette } from 'lucide-react';",
    "Phone, Droplet, Palette, Printer, Loader2 } from 'lucide-react';"
);

if (!content.includes('createClient')) {
    content = content.replace(
        "import * as htmlToImage from 'html-to-image';",
        "import { createClient } from '@/lib/supabase';\nimport * as htmlToImage from 'html-to-image';"
    );
}

// 2. Add State variables
const stateVars = `
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);
  
  // Bulk PDF State
  const [batchName, setBatchName] = useState<string | null>(null);
  const [batchVouchers, setBatchVouchers] = useState<VoucherData[]>([]);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const batchContainerRef = useRef<HTMLDivElement>(null);
`;
content = content.replace("  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);", stateVars);

// 3. Modify useEffect to detect batch parameter
const batchEffect = `
      if (params.get('batch')) {
        const batch = params.get('batch');
        setBatchName(batch);
        setTargetFormat('voucher');
        setStudioMode('smart');
        
        const fetchBatch = async () => {
          const supabase = createClient();
          const { data } = await supabase.from('discounts').select('*').eq('buyer_name', \`Batch: \${batch}\`).eq('is_active', true);
          if (data && data.length > 0) {
            const parsedVouchers = data.map((v: any) => ({
              code: v.code,
              value: String(v.value),
              valueType: v.value_type,
              name: v.name,
              to: v.recipient_name || '',
              from: v.buyer_name || '',
              exp: v.valid_to || ''
            }));
            setBatchVouchers(parsedVouchers);
            
            const vData = parsedVouchers[0];
            const vDraft = {
              id: \`voucher-\${Date.now()}\`,
              theme: 'gift_voucher',
              label: 'Voucher',
              title: vData.name,
              price: '', description: '', quote: '', author: '', myth: '', fact: '', caption: '',
              format: 'voucher' as any,
              voucherData: vData,
              bgImage: '',
              colorMode: 'dark' as any,
            };
            setActiveDraft(vDraft);
            setPrompt(\`Buatkan background mewah dan premium untuk gift voucher spesial \${vData.name}. Nuansa hangat, elegan, dan estetik.\`);
          }
        };
        fetchBatch();
        window.history.replaceState({}, document.title, window.location.pathname);
      }
`;
content = content.replace(
    "if (params.get('mode') === 'voucher') {",
    batchEffect + "\n      else if (params.get('mode') === 'voucher') {"
);

// 4. Add handleGeneratePDF method
const generatePdfMethod = `
  const handleGeneratePDF = async () => {
    if (!activeDraft || batchVouchers.length === 0 || !batchContainerRef.current) return;
    setIsGeneratingPDF(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const nodes = Array.from(batchContainerRef.current.children) as HTMLElement[];
      
      const pdfWidth = 210;
      const pdfHeight = 297;
      const margin = 10;
      const usableWidth = pdfWidth - margin * 2; // 190mm
      const voucherRatio = 1200 / 520;
      const printHeight = usableWidth / voucherRatio; // ~82.6mm
      
      let yOffset = margin;
      
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        
        // Wait for rendering
        await new Promise(r => setTimeout(r, 150));
        
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
    }
  };

  const handleDownload = async () => {
`;
content = content.replace("  const handleDownload = async () => {", generatePdfMethod);

// 5. Add bulk PDF button next to download button
const pdfBtnHtml = `
              {batchName && batchVouchers.length > 0 && (
                <button 
                  onClick={handleGeneratePDF}
                  disabled={isGeneratingPDF}
                  className="bg-earth-primary text-white p-3 rounded-full hover:bg-earth-primary/90 transition-all flex items-center justify-center disabled:opacity-50 shadow-md"
                  title="Cetak PDF Bulk"
                >
                  {isGeneratingPDF ? <Loader2 size={18} className="animate-spin" /> : <Printer size={18} />}
                </button>
              )}
`;

content = content.replace(
    /<button \n\s*onClick=\{handleDownload\}/,
    pdfBtnHtml + "\n              <button \n                onClick={handleDownload}"
);

// 6. Add hidden container
const hiddenContainerHtml = `
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
    </div>
  );
}
`;
content = content.replace("    </div>\n  );\n}", hiddenContainerHtml);

fs.writeFileSync(file, content, 'utf8');
