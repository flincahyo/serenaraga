const fs = require('fs');
let file = 'src/app/admin/feed-studio-v2/page.tsx';
let c = fs.readFileSync(file, 'utf8');

const searchRegex = /const pdf = new jsPDF\('p', 'mm', 'a4'\);[\s\S]*?pdf\.save\(`Voucher_Batch_\$\{batchName\}\.pdf`\);/m;

const replacement = `const pdf = new jsPDF('p', 'mm', 'a3');
      const pdfWidth = 297;
      const pdfHeight = 420;
      const margin = 15;
      const usableWidth = 120; // 12 cm width
      const voucherRatio = 1200 / 520;
      const printHeight = usableWidth / voucherRatio; // ~52mm
      const gapX = pdfWidth - (margin * 2) - (usableWidth * 2); // Gap between columns = 27mm
      
      let yOffset = margin;
      let col = 0;

      // Allow React to render the first hidden voucher
      await new Promise(r => setTimeout(r, 500));

      for (let i = 0; i < batchVouchers.length; i++) {
        setRenderProgress({ current: i + 1, total: batchVouchers.length });
        
        // Wait for React to update the DOM with the new voucher data
        await new Promise(r => setTimeout(r, 250));
        
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

        // Determine X offset based on column
        let xOffset = margin;
        if (col === 1) {
          xOffset = margin + usableWidth + gapX;
        }

        // Check if we need a new page
        if (yOffset + printHeight > pdfHeight - margin) {
          pdf.addPage();
          yOffset = margin;
        }

        pdf.addImage(dataUrl, 'JPEG', xOffset, yOffset, usableWidth, printHeight);

        // Move to next position
        if (col === 1) {
          col = 0;
          yOffset += printHeight + 5; // 5mm vertical gap between rows
        } else {
          col = 1;
        }
      }

      pdf.save(\`Voucher_Batch_\${batchName}.pdf\`);`;

c = c.replace(searchRegex, replacement);

fs.writeFileSync(file, c, 'utf8');
