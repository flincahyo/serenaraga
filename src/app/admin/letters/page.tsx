'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FileText, Printer, FileDown, Image as ImageIcon, Loader2 } from 'lucide-react';

const INITIAL_FORM = {
  // Kop
  logo: '/serenalogo.svg',
  companyName: 'SERENARAGA',
  wa: '0812-3456-7890',
  email: 'admin@serenaraga.fit',
  website: 'www.serenaraga.fit',
  address: 'Yogyakarta, Indonesia',
  
  // Header Surat
  nomor: '001/SR/VIII/2026',
  lampiran: '-',
  perihal: 'Surat Pemberitahuan',
  tempat: 'Yogyakarta',
  tanggal: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
  yth: 'Kepada Yth,\nSeluruh Terapis SerenaRaga\nDi Tempat',
  
  // Isi Surat
  body: 'Dengan hormat,\n\nSehubungan dengan komitmen manajemen untuk terus meningkatkan performa layanan, bersama ini kami sampaikan bahwa...\n\nDemikian surat edaran ini dibuat untuk dilaksanakan dengan sebaik-baiknya. Atas perhatian dan kerja samanya, kami ucapkan terima kasih.',
  
  // Penutup
  penutup: 'Hormat kami,',
  nama_terang: 'Nama Owner/Manajemen',
  jabatan: 'Direktur SerenaRaga',
};

export default function SuratResmiPage() {
  const [form, setForm] = useState(INITIAL_FORM);
  const printRef = useRef<HTMLDivElement>(null);
  const kopRef = useRef<HTMLDivElement>(null);
  const [downloadingKop, setDownloadingKop] = useState(false);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setForm(f => ({ ...f, logo: url }));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const downloadKop = async () => {
    if (!kopRef.current) return;
    setDownloadingKop(true);
    try {
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(kopRef.current, {
        backgroundColor: '#ffffff',
        pixelRatio: 3, // High quality PNG
      });
      const link = document.createElement('a');
      link.download = 'Kop_Surat_SerenaRaga.png';
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to download Kop:', err);
    } finally {
      setDownloadingKop(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 print:p-0 print:m-0 print:space-y-0 print:max-w-none print:w-full">
      <div className="print:hidden">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
          <FileText className="text-earth-primary" /> Surat Resmi
        </h1>
        <p className="text-sm text-zinc-500 mt-1">Buat PDF surat edaran, pemberitahuan, atau dokumen resmi dengan kop SerenaRaga.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 print:block print:gap-0">
        
        {/* LEFT PANEL: Editor */}
        <div className="lg:col-span-5 space-y-6 print:hidden">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 space-y-4 shadow-sm">
            
            <div>
              <h2 className="text-sm font-semibold dark:text-white mb-3">Informasi Kop Surat</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-medium text-zinc-500 uppercase mb-1">Upload Logo</label>
                  <label className="flex items-center justify-center w-full bg-zinc-50 dark:bg-zinc-800 border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-lg p-2 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors">
                    <span className="text-[11px] font-medium text-zinc-500">Ganti Logo Kop...</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                  </label>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-medium text-zinc-500 uppercase mb-1">Nama Perusahaan / Judul</label>
                  <input className="admin-input text-xs font-bold" value={form.companyName} onChange={e => setForm(f => ({ ...f, companyName: e.target.value.toUpperCase() }))} />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-zinc-500 uppercase mb-1">WhatsApp</label>
                  <input className="admin-input text-xs" value={form.wa} onChange={e => setForm(f => ({ ...f, wa: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-zinc-500 uppercase mb-1">Email</label>
                  <input className="admin-input text-xs" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-zinc-500 uppercase mb-1">Website</label>
                  <input className="admin-input text-xs" value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-zinc-500 uppercase mb-1">Alamat</label>
                  <input className="admin-input text-xs" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <h2 className="text-sm font-semibold dark:text-white mb-3">Header Surat</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-medium text-zinc-500 uppercase mb-1">Nomor Surat</label>
                  <input className="admin-input text-xs" value={form.nomor} onChange={e => setForm(f => ({ ...f, nomor: e.target.value }))} />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-medium text-zinc-500 uppercase mb-1">Lampiran</label>
                  <input className="admin-input text-xs" value={form.lampiran} onChange={e => setForm(f => ({ ...f, lampiran: e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-medium text-zinc-500 uppercase mb-1">Perihal</label>
                  <input className="admin-input text-xs" value={form.perihal} onChange={e => setForm(f => ({ ...f, perihal: e.target.value }))} />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-medium text-zinc-500 uppercase mb-1">Tempat</label>
                  <input className="admin-input text-xs" value={form.tempat} onChange={e => setForm(f => ({ ...f, tempat: e.target.value }))} />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-medium text-zinc-500 uppercase mb-1">Tanggal</label>
                  <input className="admin-input text-xs" value={form.tanggal} onChange={e => setForm(f => ({ ...f, tanggal: e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-medium text-zinc-500 uppercase mb-1">Tujuan / Yth.</label>
                  <textarea className="admin-input text-xs resize-none" rows={3} value={form.yth} onChange={e => setForm(f => ({ ...f, yth: e.target.value }))} />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <h2 className="text-sm font-semibold dark:text-white mb-3">Isi Surat</h2>
              <textarea 
                className="admin-input text-xs" 
                rows={10} 
                value={form.body} 
                onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                placeholder="Ketik isi surat di sini..."
              />
              <p className="text-[10px] text-zinc-400 mt-2">Gunakan tombol Enter untuk paragraf baru.</p>
            </div>

            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <h2 className="text-sm font-semibold dark:text-white mb-3">Tanda Tangan</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-[10px] font-medium text-zinc-500 uppercase mb-1">Penutup (contoh: Hormat kami,)</label>
                  <input className="admin-input text-xs" value={form.penutup} onChange={e => setForm(f => ({ ...f, penutup: e.target.value }))} />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-medium text-zinc-500 uppercase mb-1">Nama Terang</label>
                  <input className="admin-input text-xs font-semibold" value={form.nama_terang} onChange={e => setForm(f => ({ ...f, nama_terang: e.target.value }))} />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-medium text-zinc-500 uppercase mb-1">Jabatan</label>
                  <input className="admin-input text-xs" value={form.jabatan} onChange={e => setForm(f => ({ ...f, jabatan: e.target.value }))} />
                </div>
              </div>
            </div>

            <div className="pt-4 mt-2 space-y-3">
              <button
                onClick={handlePrint}
                className="w-full admin-btn-primary justify-center py-3 text-sm shadow-md"
              >
                <Printer size={18} /> Cetak / Download PDF
              </button>
              
              <button
                onClick={downloadKop}
                disabled={downloadingKop}
                className="w-full admin-btn-ghost justify-center py-2.5 text-sm"
              >
                {downloadingKop ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
                Download Kop (PNG)
              </button>
            </div>

          </div>
        </div>

        {/* RIGHT PANEL: Live Preview */}
        <div className="lg:col-span-7 print:block print:w-full scroll-smooth">
          <div className="sticky top-6 print:static print:w-full">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3 print:hidden">
              Live Preview (A4)
            </p>

            <div className="w-full overflow-x-auto pb-4 custom-scrollbar print:overflow-visible print:pb-0">
              <div className="min-w-[800px] print:min-w-0 border border-zinc-200 dark:border-zinc-800 shadow-xl print:border-none print:shadow-none bg-zinc-100 dark:bg-zinc-900 rounded-xl overflow-hidden print:overflow-visible relative print:rounded-none">
                
                {/* 
                  Wrapper for Print Scaling 
                  On screen: we scale it down slightly if needed, though horizontally it scrolls if too wide.
                  A4 size at 96 DPI is usually ~ 794px width x 1123px height. 
                  We use mm directly so it prints perfectly.
                */}
                <div className="p-4 md:p-8 flex justify-center bg-zinc-200/50 dark:bg-zinc-800/20 print:p-0 print:bg-white box-border print:block">
                  
                  {/* The A4 Paper */}
                  <div 
                    ref={printRef}
                    className="relative bg-white mx-auto print:mx-0 shadow-sm print:shadow-none box-border text-black w-[210mm] min-h-[297mm] print:w-full print:min-h-0 print:h-auto"
                    style={{
                      padding: '20mm 20mm', // standard A4 padding
                      fontFamily: '"Times New Roman", Times, serif',
                    }}
                  >
                    
                    {/* --- KOP DAN HEADER WRAPPER (Untuk Download PNG) --- */}
                    <div ref={kopRef} className="bg-white pt-2 print:pt-0">
                      {/* --- KOP SURAT --- */}
                      <div className="flex items-center justify-between border-b-[3px] border-double border-black pb-4 mb-8 relative overflow-hidden">
                        {/* Logo Left */}
                        <div className="w-64 h-24 shrink-0 flex items-center justify-start pointer-events-none">
                          <img 
                            src={form.logo} 
                            alt={form.companyName} 
                            className={`brightness-0 ${form.logo === '/serenalogo.svg' ? 'w-full h-auto max-w-none scale-90 origin-left -ml-8' : 'w-auto h-full max-w-[200px] object-contain'}`}
                            crossOrigin="anonymous" 
                          />
                        </div>
                        
                        {/* Text Right */}
                        <div className="text-right leading-snug">
                          <h1 className="text-2xl font-bold tracking-tight">{form.companyName}</h1>
                          <p className="text-[13px] mt-1.5">{form.address}</p>
                          <p className="text-[13px] mt-0.5">
                            WA: {form.wa} | Email: {form.email}
                          </p>
                          <p className="text-[13px] mt-0.5">{form.website}</p>
                        </div>
                      </div>

                      {/* --- HEADER SURAT --- */}
                      <div className="flex justify-between items-start text-[14px] leading-relaxed mb-8">
                        {/* Kiri: Nomor, Hal, Lampiran */}
                        <div>
                          <table className="border-collapse">
                            <tbody>
                              <tr>
                                <td className="pr-4 align-top py-0.5">Nomor</td>
                                <td className="px-1 align-top py-0.5">:</td>
                                <td className="align-top py-0.5">{form.nomor}</td>
                              </tr>
                              <tr>
                                <td className="pr-4 align-top py-0.5">Lampiran</td>
                                <td className="px-1 align-top py-0.5">:</td>
                                <td className="align-top py-0.5">{form.lampiran}</td>
                              </tr>
                              <tr>
                                <td className="pr-4 align-top py-0.5">Perihal</td>
                                <td className="px-1 align-top py-0.5">:</td>
                                <td className="align-top py-0.5 font-bold">{form.perihal}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        
                        {/* Kanan: Tanggal */}
                        <div className="text-right">
                          <p>{form.tempat}, {form.tanggal}</p>
                        </div>
                      </div>
                    </div>

                    {/* Tujuan */}
                    <div className="text-[14px] mb-8 whitespace-pre-line leading-relaxed">
                      {form.yth}
                    </div>

                    {/* --- ISI SURAT --- */}
                    <div className="text-[14px] mb-16 whitespace-pre-wrap leading-relaxed text-justify">
                      {form.body}
                    </div>

                    {/* --- TANDA TANGAN --- */}
                    <div className="flex justify-end pt-4">
                      <div className="text-center w-64 leading-relaxed">
                        <p>{form.penutup}</p>
                        <div className="h-24"></div> {/* Space for physical signature/stamp */}
                        <p className="font-bold underline">{form.nama_terang}</p>
                        <p>{form.jabatan}</p>
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>

      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        /* When on screen, override .print-only to be relative for preview */
        @media screen {
          .print-only { position: relative !important; }
        }
      `}} />

    </div>
  );
}
