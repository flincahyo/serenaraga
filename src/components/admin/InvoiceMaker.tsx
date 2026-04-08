'use client';

import React, { useState, useRef } from 'react';
import { toPng } from 'html-to-image';
import { 
  Download, 
  Copy, 
  Send, 
  RefreshCcw, 
  Plus, 
  Trash2,
  Image as ImageIcon
} from 'lucide-react';

const InvoiceMaker = () => {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [invoiceNumber, setInvoiceNumber] = useState(`SR-${new Date().getFullYear()}-001`);
  const [customerName, setCustomerName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState([
    { id: 1, name: 'Traditional Massage', duration: '90m', price: 250000 },
  ]);

  const addItem = () => {
    setItems([...items, { id: Date.now(), name: '', duration: '', price: 0 }]);
  };

  const removeItem = (id: number) => {
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: number, field: string, value: any) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const totalPrice = items.reduce((sum, item) => sum + Number(item.price), 0);

  const downloadInvoice = async () => {
    if (invoiceRef.current === null) return;
    
    try {
      const dataUrl = await toPng(invoiceRef.current, { cacheBust: true, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `Invoice-${invoiceNumber}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('oops, something went wrong!', err);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
      {/* Form Section */}
      <div className="space-y-8 bg-white dark:bg-white/5 p-8 md:p-10 rounded-[2.5rem] border border-earth-primary/5 dark:border-white/5 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-earth-primary/10 rounded-2xl flex items-center justify-center text-earth-primary">
            <Plus size={24} />
          </div>
          <h2 className="text-xl font-bold dark:text-white">Buat Invoice Baru</h2>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-black tracking-widest text-text-secondary/60 ml-2">No. Invoice</label>
              <input 
                type="text" 
                value={invoiceNumber} 
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full bg-bg-cream dark:bg-white/5 p-4 rounded-2xl text-sm border-none outline-none dark:text-white" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-black tracking-widest text-text-secondary/60 ml-2">Tanggal</label>
              <input 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-bg-cream dark:bg-white/5 p-4 rounded-2xl text-sm border-none outline-none dark:text-white" 
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase font-black tracking-widest text-text-secondary/60 ml-2">Nama Pelanggan</label>
            <input 
              type="text" 
              placeholder="Contoh: Ibu Rina"
              value={customerName} 
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full bg-bg-cream dark:bg-white/5 p-4 rounded-2xl text-sm border-none outline-none dark:text-white" 
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center px-2">
              <label className="text-[10px] uppercase font-black tracking-widest text-text-secondary/60">Daftar Layanan</label>
              <button onClick={addItem} className="text-earth-primary text-xs font-bold hover:underline">+ Tambah Item</button>
            </div>
            
            {items.map((item) => (
              <div key={item.id} className="grid grid-cols-12 gap-3 items-end bg-bg-cream/50 dark:bg-white/5 p-4 rounded-2xl border border-earth-primary/5">
                <div className="col-span-12 md:col-span-5 space-y-1">
                  <input 
                    placeholder="Nama Layanan"
                    value={item.name} 
                    onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                    className="w-full bg-transparent p-1 border-b border-earth-primary/10 outline-none text-sm dark:text-white" 
                  />
                </div>
                <div className="col-span-4 md:col-span-2 space-y-1">
                  <input 
                    placeholder="Duraso"
                    value={item.duration} 
                    onChange={(e) => updateItem(item.id, 'duration', e.target.value)}
                    className="w-full bg-transparent p-1 border-b border-earth-primary/10 outline-none text-sm dark:text-white text-center" 
                  />
                </div>
                <div className="col-span-6 md:col-span-4 space-y-1">
                  <input 
                    type="number"
                    placeholder="Harga"
                    value={item.price} 
                    onChange={(e) => updateItem(item.id, 'price', e.target.value)}
                    className="w-full bg-transparent p-1 border-b border-earth-primary/10 outline-none text-sm dark:text-white text-right font-mono" 
                  />
                </div>
                <div className="col-span-2 md:col-span-1 pb-1">
                  <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-500 transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Preview & Snapshot Section */}
      <div className="space-y-8">
        <div className="flex justify-between items-center px-4">
          <h3 className="text-sm font-bold text-text-primary dark:text-white uppercase tracking-widest flex items-center gap-2">
            <ImageIcon size={18} className="text-earth-primary" /> Visual Preview
          </h3>
          <div className="flex gap-3">
            <button 
              onClick={downloadInvoice}
              className="p-3 bg-earth-primary text-white rounded-xl hover:bg-earth-dark transition-all shadow-lg"
              title="Download as Image"
            >
              <Download size={20} />
            </button>
          </div>
        </div>

        {/* The Capture Area (Optimized for Image Snapshot) */}
        <div className="overflow-hidden rounded-[2.5rem] shadow-2xl border border-earth-primary/5">
          <div 
            ref={invoiceRef} 
            className="bg-[#FDFBF7] p-12 w-[500px] min-h-[700px] text-zinc-900 font-sans"
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-16">
              <div>
                <h1 className="text-3xl font-serif font-black tracking-tighter text-zinc-900">
                  Serena<span className="text-[#8B5E3C]">Raga</span>
                </h1>
                <p className="text-[8px] uppercase tracking-[0.4em] font-bold text-[#8B5E3C] mt-1">Exclusive Home Massage</p>
              </div>
              <div className="text-right">
                <div className="inline-block px-4 py-1.5 bg-[#8B5E3C] text-white text-[10px] font-black italic rounded-lg mb-3">INVOICE</div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{invoiceNumber}</p>
              </div>
            </div>

            {/* Bill To */}
            <div className="border-l-4 border-[#8B5E3C] pl-6 mb-16">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#8B5E3C]/50 mb-2">Ditujukan Untuk:</p>
              <h4 className="text-xl font-bold">{customerName || 'Nama Pelanggan'}</h4>
              <p className="text-xs text-zinc-400 mt-1">{new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>

            {/* Table */}
            <div className="space-y-6 mb-20 text-sm">
              <div className="grid grid-cols-12 border-b border-zinc-100 pb-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                <div className="col-span-8">Layanan & Durasi</div>
                <div className="col-span-4 text-right">Harga</div>
              </div>
              
              {items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 items-center">
                  <div className="col-span-8">
                    <p className="font-bold text-zinc-800">{item.name || 'Pilih Layanan...'}</p>
                    <p className="text-[10px] text-zinc-400 italic font-medium">{item.duration}</p>
                  </div>
                  <div className="col-span-4 text-right font-bold text-zinc-900 tabular-nums">
                    Rp {Number(item.price).toLocaleString('id-ID')}
                  </div>
                </div>
              ))}

              <div className="pt-10 space-y-3">
                <div className="flex justify-between items-center text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                  <span>Subtotal</span>
                  <span>Rp {totalPrice.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between items-center p-6 bg-[#8B5E3C] rounded-2xl text-white">
                  <span className="text-xs font-black uppercase tracking-widest">Total Bayar</span>
                  <span className="text-xl font-bold italic">Rp {totalPrice.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center pt-10 border-t border-zinc-100">
              <p className="text-xs italic text-zinc-400">Terima kasih telah mempercayakan ketenangan raga Anda kepada kami.</p>
              <p className="text-[10px] font-bold text-[#8B5E3C] uppercase tracking-[0.2em] mt-3">Instagram: @serena.raga</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-emerald-500/10 p-6 rounded-2xl border border-emerald-500/20">
          <div className="bg-emerald-500 text-white p-2 rounded-lg">
            <Send size={20} />
          </div>
          <div>
            <p className="text-xs font-bold text-emerald-800 dark:text-emerald-400">Siap Kirim WhatsApp</p>
            <p className="text-[10px] text-emerald-600/70 dark:text-emerald-400/50 mt-1">Download gambar dan tempel langsung ke chat pelanggan.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceMaker;
