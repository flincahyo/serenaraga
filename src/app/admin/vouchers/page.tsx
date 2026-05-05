'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Gift, Plus, Copy, Download, Check, X, Loader2, Tag, Clock, Users, RefreshCw, Ban, Eye } from 'lucide-react';
import { toPng } from 'html-to-image';
import { createClient } from '@/lib/supabase';
import { AdminSkeleton } from '@/components/admin/AdminSkeleton';
import { useUser } from '@/lib/user-context';
import { useRouter } from 'next/navigation';

type Service = { id: string; name: string; price: number; category: string; category_label: string; details?: string; };
type Voucher = {
  id: string; code: string; name: string; value: number; value_type: string;
  max_uses: number | null; uses_count: number; valid_to: string | null;
  is_active: boolean; created_at: string;
  recipient_name: string | null; buyer_name: string | null;
  amount_paid: number | null; target_service: string | null;
};

const genCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'SRAGA-';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
};

const fmtRp = (n: number) => `Rp ${Number(n).toLocaleString('id-ID')}`;
const fmtDate = (d: string | null) => {
  if (!d) return 'Lifetime';
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
};

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  active:  { label: 'Aktif',    cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' },
  used:    { label: 'Terpakai', cls: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400' },
  expired: { label: 'Expired',  cls: 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400' },
};

function getStatus(v: Voucher): 'active' | 'used' | 'expired' {
  if (!v.is_active) return 'used';
  if (v.max_uses !== null && v.uses_count >= v.max_uses) return 'used';
  if (v.valid_to && new Date(v.valid_to) < new Date()) return 'expired';
  return 'active';
}

function VoucherCard({name,code,value,vt,svc,details,to,from,exp,mx,wa}:{name:string;code:string;value:number;vt:string;svc?:string;details?:string;to?:string;from?:string;exp?:string|null;mx:number;wa?:string}) {
  const vStr = vt==='flat'?`Rp ${Number(value).toLocaleString('id-ID')}`:`${value}%`;
  const dStr = exp?new Date(exp).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'}):'Lifetime';
  const waDisplay = wa?`0${wa.startsWith('62')?wa.slice(2):wa}`:'0895-1835-9037';
  const tc = ['Voucher berlaku khusus untuk layanan Homecare Spa (Terapis datang ke rumah).','Wajib melakukan reservasi maksimal H-1 sebelum waktu kedatangan.',`Voucher bersifat ${mx}x pakai, tidak dapat diuangkan atau digabung promo lain.`];
  const subText = details || svc || '';
  return (
    <div style={{width:1200,height:520,display:'flex',fontFamily:'Georgia,serif',background:'#FAF6EF',overflow:'hidden',position:'relative'}}>
      
      {/* Left Dark Panel */}
      <div style={{width:200,height:'100%',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',background:'linear-gradient(170deg,#2C1408 0%,#1A0A04 100%)',position:'relative'}}>
        <div style={{position:'absolute',top:0,left:0,right:0,bottom:0,background:'radial-gradient(ellipse at 50% 50%,rgba(201,169,110,.15) 0%,transparent 70%)'}} />
        
        {/* Center Container for Logo & Text */}
        <div style={{display:'flex',flexDirection:'row',alignItems:'center',justifyContent:'center',gap:12,position:'relative',zIndex:1}}>
          
          {/* Vertical Logo (Left) */}
          <div style={{width:45,height:160,position:'relative'}}>
            {/* Cropping Wrapper */}
            <div style={{position:'absolute',top:'50%',left:'50%',width:160,height:45,transform:'translate(-50%,-50%) rotate(-90deg)',overflow:'hidden'}}>
              <img src="/serenalogo2.svg" style={{position:'absolute',top:'50%',left:-8,transform:'translateY(-50%)',height:180,width:'auto',maxWidth:'none',objectFit:'contain',filter:'brightness(0) invert(1)',opacity:.9}} crossOrigin="anonymous"/>
            </div>
          </div>

          {/* Vertical Text (Right) */}
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:24}}>
            <div style={{width:1,height:80,background:'linear-gradient(180deg,transparent,rgba(201,169,110,.6))'}}/>
            <p style={{
              fontSize:17,
              letterSpacing:'.4em',
              color:'rgba(201,169,110,.8)',
              fontFamily:'sans-serif',
              writingMode: 'vertical-rl',
              transform: 'rotate(180deg)',
              margin: 0,
              whiteSpace: 'nowrap'
            }}>
              GIFT VOUCHER
            </p>
            <div style={{width:1,height:80,background:'linear-gradient(0deg,transparent,rgba(201,169,110,.6))'}}/>
          </div>

        </div>

        {/* Social & Web Info */}
        <div style={{position:'absolute',bottom:25,left:0,right:0,display:'flex',justifyContent:'center',zIndex:1}}>
          <div style={{display:'flex',flexDirection:'column',alignItems:'flex-start',gap:6}}>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(201,169,110,.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
              <p style={{fontSize:10,letterSpacing:'.1em',color:'rgba(201,169,110,.8)',fontFamily:'sans-serif',margin:0,fontWeight:600}}>@serena.raga</p>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(201,169,110,.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
              </svg>
              <p style={{fontSize:10,letterSpacing:'.1em',color:'rgba(201,169,110,.8)',fontFamily:'sans-serif',margin:0,fontWeight:600}}>serenaraga.fit</p>
            </div>
          </div>
        </div>

      </div>

      <div style={{width:3,height:'100%',background:'linear-gradient(180deg,transparent 0%,#C9A96E 50%,transparent 100%)',flexShrink:0}}/>

      {/* Right Content */}
      <div style={{flex:1,height:'100%',display:'flex',flexDirection:'column',position:'relative'}}>
        
        {/* Watermark */}
        <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',zIndex:0,pointerEvents:'none',opacity:0.04}}>
          <img src="/serenalogo.svg" style={{height:750,width:'auto',maxWidth:'none',objectFit:'contain',filter:'grayscale(100%) brightness(0)'}} crossOrigin="anonymous"/>
        </div>
        
        {/* Main content body */}
        <div style={{flex:1,padding:'35px 45px 15px',display:'flex',flexDirection:'column',position:'relative',zIndex:1,overflow:'hidden'}}>
          {/* Top row */}
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',height:60,flexShrink:0}}>
            <div style={{position:'relative',width:200,height:60,overflow:'hidden'}}>
              <img src="/serenalogo.svg" style={{position:'absolute',top:'50%',left:-8,transform:'translateY(-50%)',height:160,width:'auto',maxWidth:'none',objectFit:'contain'}} crossOrigin="anonymous"/>
            </div>
            <div style={{textAlign:'right'}}>
              <p style={{fontSize:11,letterSpacing:'.18em',color:'#8B6340',fontFamily:'sans-serif',fontWeight:'bold',marginBottom:4,marginTop:0}}>SPECIAL GIFT VOUCHER</p>
              <p style={{fontSize:11,letterSpacing:'.06em',color:'#8B6340',fontFamily:'sans-serif',margin:0}}>KODE : <span style={{fontFamily:'monospace',fontWeight:'bold',letterSpacing:'.14em'}}>{code}</span></p>
            </div>
          </div>

          {/* Center */}
          <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',textAlign:'center'}}>
            <p style={{fontSize:14,color:'#8B6B4E',fontStyle:'italic',marginBottom:12,marginTop:0}}>{to?`Dipersembahkan untuk ${to}${from?` dari ${from}`:''}`:svc?'Voucher ini berlaku untuk layanan:':'Special Gift Voucher'}</p>
            <h2 style={{fontSize:60,fontWeight:'bold',color:'#5A3418',lineHeight:1.1,marginBottom:10,marginTop:0}}>{name||'Gift Voucher'}</h2>
            {subText&&<p style={{fontSize:13,color:'#7A6555',fontFamily:'sans-serif',maxWidth:650,lineHeight:1.5,marginBottom:14,marginTop:0}}>{subText}</p>}
            <div style={{width:200,height:1,background:'linear-gradient(90deg,transparent,#C9A870,transparent)',margin:'6px auto'}}/>
            <p style={{fontSize:13,letterSpacing:'.22em',fontWeight:'bold',color:'#8B6340',fontFamily:'sans-serif',margin:'10px 0'}}>SENILAI {vStr.toUpperCase()}</p>
            <div style={{width:200,height:1,background:'linear-gradient(90deg,transparent,#C9A870,transparent)',margin:'6px auto'}}/>
          </div>
        </div>

        {/* Bottom strip */}
        <div style={{height:100,flexShrink:0,background:'transparent',padding:'0 45px',display:'flex',justifyContent:'space-between',alignItems:'center',gap:40,position:'relative',zIndex:1,borderTop:'1px solid #EADDD2',boxSizing:'border-box'}}>
          <div style={{flex:1}}>
            <p style={{fontSize:9,letterSpacing:'.18em',fontWeight:'bold',color:'#6B4E37',fontFamily:'sans-serif',marginBottom:6,marginTop:0}}>SYARAT &amp; KETENTUAN SERENARAGA:</p>
            {tc.map((t,i)=>(<div key={i} style={{display:'flex',gap:6,marginBottom:3}}><span style={{fontSize:10,color:'#7A6050',fontFamily:'sans-serif',flexShrink:0,lineHeight:1.3}}>•</span><p style={{fontSize:10,color:'#7A6050',fontFamily:'sans-serif',lineHeight:1.3,margin:0}}>{t}</p></div>))}
          </div>
          
          {/* Vertical Divider */}
          <div style={{width:1,height:45,background:'#EADDD2',flexShrink:0}}/>

          <div style={{display:'flex',gap:60,flexShrink:0,alignItems:'center'}}>
            <div style={{textAlign:'center'}}>
              <p style={{fontSize:10,letterSpacing:'.1em',fontWeight:600,color:'#9BA3AF',fontFamily:'sans-serif',marginBottom:6,marginTop:0}}>VALID HINGGA</p>
              <p style={{fontSize:16,fontWeight:700,color:'#2D3748',fontFamily:'sans-serif',margin:0}}>{dStr}</p>
            </div>
            <div style={{textAlign:'center'}}>
              <p style={{fontSize:10,letterSpacing:'.1em',fontWeight:600,color:'#9BA3AF',fontFamily:'sans-serif',marginBottom:6,marginTop:0}}>RESERVASI (WHATSAPP)</p>
              <div style={{display:'flex',alignItems:'center',gap:6,justifyContent:'center'}}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="#25D366">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                <p style={{fontSize:16,fontWeight:700,color:'#25D366',fontFamily:'sans-serif',margin:0}}>{waDisplay}</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function VouchersPage() {
  const { user } = useUser();
  const router = useRouter();
  const previewRef = useRef<HTMLDivElement>(null);

  const [tab, setTab] = useState<'list' | 'create'>('list');
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState('');
  const [previewVoucher, setPreviewVoucher] = useState<Voucher | null>(null);
  const [waNumber, setWaNumber] = useState('');
  const [filterStatus, setFilterStatus] = useState<'semua' | 'active' | 'used' | 'expired'>('semua');

  const [form, setForm] = useState({
    code: genCode(),
    name: '',
    serviceId: '',
    customValue: 0,
    useServicePrice: true,
    valueType: 'flat' as 'flat' | 'percentage',
    recipientName: '',
    buyerName: '',
    amountPaid: 0,
    maxUses: 1,
    useExpiry: false,
    expiryDate: '',
  });

  const supabase = createClient();

  const selectedService = services.find(s => s.id === form.serviceId);
  const voucherValue = form.useServicePrice && selectedService ? selectedService.price : form.customValue;

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [{ data: vs }, { data: svcs }, { data: settings }] = await Promise.all([
      supabase.from('discounts').select('*').eq('is_voucher', true).order('created_at', { ascending: false }),
      supabase.from('services').select('id,name,price,category,category_label,details').neq('category', 'split_items').order('sort_order'),
      supabase.from('settings').select('key,value').eq('key', 'wa_number'),
    ]);
    if (vs) setVouchers(vs as Voucher[]);
    if (svcs) setServices(svcs);
    const wa = settings?.find(s => s.key === 'wa_number')?.value;
    if (wa) setWaNumber(wa);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Owner-only guard
  if (user && user.role !== 'owner') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 text-zinc-500">
        <Ban size={40} className="text-red-400" />
        <p className="text-sm font-medium">Halaman ini khusus Owner.</p>
      </div>
    );
  }

  const handleCreate = async () => {
    if (!form.name || !form.code) return;
    setSaving(true);
    const value = voucherValue;
    const payload = {
      code: form.code.trim().toUpperCase(),
      name: form.name,
      type: 'manual',
      value_type: form.valueType,
      value,
      max_uses: form.maxUses,
      uses_count: 0,
      is_active: true,
      is_owner_borne: true,
      is_voucher: true,
      recipient_name: form.recipientName || null,
      buyer_name: form.buyerName || null,
      amount_paid: form.amountPaid || null,
      target_service: form.serviceId || null,
      valid_from: null,
      valid_to: form.useExpiry && form.expiryDate ? form.expiryDate : null,
      description: form.recipientName
        ? `Gift dari ${form.buyerName || 'Anonim'} untuk ${form.recipientName}`
        : null,
    };
    const { data, error } = await supabase.from('discounts').insert(payload).select().single();
    if (!error && data) {
      setPreviewVoucher(data as Voucher);
      setTab('list');
      fetchData();
      setForm({ code: genCode(), name: '', serviceId: '', customValue: 0, useServicePrice: true, valueType: 'flat', recipientName: '', buyerName: '', amountPaid: 0, maxUses: 1, useExpiry: false, expiryDate: '' });
    }
    setSaving(false);
  };

  const handleRevoke = async (id: string) => {
    if (!confirm('Nonaktifkan voucher ini?')) return;
    await supabase.from('discounts').update({ is_active: false }).eq('id', id);
    fetchData();
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(''), 2000);
  };

  const downloadImage = async () => {
    if (!previewRef.current) return;
    setGenerating(true);
    try {
      const dataUrl = await toPng(previewRef.current, { quality: 0.95, width: 1200, height: 520, cacheBust: true, style: { transform: 'scale(1)', transformOrigin: 'top left' } });
      const link = document.createElement('a');
      link.download = `Voucher_${previewVoucher?.code ?? 'SerenaRaga'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) { console.error(e); }
    setGenerating(false);
  };

  const filtered = vouchers.filter(v => {
    if (filterStatus === 'semua') return true;
    return getStatus(v) === filterStatus;
  });

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
            <Gift size={20} className="text-earth-primary" /> Voucher & Gift Card
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {vouchers.filter(v => getStatus(v) === 'active').length} aktif · {vouchers.length} total
          </p>
        </div>
        <button onClick={() => setTab(tab === 'create' ? 'list' : 'create')} className="admin-btn-primary">
          {tab === 'create' ? <X size={16} /> : <Plus size={16} />}
          {tab === 'create' ? 'Batal' : 'Buat Voucher'}
        </button>
      </div>

      {/* Create Form */}
      {tab === 'create' && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-5">
          <h2 className="font-semibold text-zinc-900 dark:text-white text-sm">Detail Voucher</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-zinc-500 mb-1 block">Nama Voucher *</label>
              <input className="admin-input" placeholder="Gift Voucher Postnatal, Promo Lebaran..." value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500 mb-1 block flex items-center justify-between">
                Kode Unik
                <button onClick={() => setForm(f => ({ ...f, code: genCode() }))} className="text-earth-primary hover:underline text-[10px] font-bold flex items-center gap-1"><RefreshCw size={10} /> Generate Ulang</button>
              </label>
              <input className="admin-input font-mono tracking-widest uppercase" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} />
            </div>
          </div>

          {/* Layanan & Nilai */}
          <div className="border border-zinc-100 dark:border-zinc-800 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Layanan & Nilai</p>
            <div>
              <label className="text-xs font-medium text-zinc-500 mb-1 block">Pilih Layanan (Opsional)</label>
              <select className="admin-input" value={form.serviceId} onChange={e => setForm(f => ({ ...f, serviceId: e.target.value }))}>
                <option value="">— Tidak terikat layanan spesifik —</option>
                {services.map(s => <option key={s.id} value={s.id}>{s.name} ({fmtRp(s.price)})</option>)}
              </select>
            </div>
            {form.serviceId && (
              <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300 cursor-pointer">
                <input type="checkbox" className="rounded" checked={form.useServicePrice} onChange={e => setForm(f => ({ ...f, useServicePrice: e.target.checked }))} />
                Gunakan harga layanan ({fmtRp(selectedService?.price ?? 0)}) sebagai nilai voucher
              </label>
            )}
            {(!form.useServicePrice || !form.serviceId) && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-zinc-500 mb-1 block">Tipe Nilai</label>
                  <select className="admin-input" value={form.valueType} onChange={e => setForm(f => ({ ...f, valueType: e.target.value as 'flat' | 'percentage' }))}>
                    <option value="flat">Nominal (Rp)</option>
                    <option value="percentage">Persentase (%)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-500 mb-1 block">{form.valueType === 'flat' ? 'Nilai (Rp)' : 'Diskon (%)'}</label>
                  <input type="number" className="admin-input font-mono" value={form.customValue || ''} onChange={e => setForm(f => ({ ...f, customValue: Number(e.target.value) }))} />
                </div>
              </div>
            )}
            <div className="px-3 py-2 bg-earth-primary/5 border border-earth-primary/15 rounded-lg text-xs text-earth-primary font-semibold">
              Nilai Voucher: {form.valueType === 'flat' ? fmtRp(voucherValue) : `${voucherValue}%`}
            </div>
          </div>

          {/* Gift Details */}
          <div className="border border-zinc-100 dark:border-zinc-800 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Detail Gift (Opsional)</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-zinc-500 mb-1 block">Nama Penerima</label>
                <input className="admin-input" placeholder="Budi Wati..." value={form.recipientName} onChange={e => setForm(f => ({ ...f, recipientName: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-500 mb-1 block">Nama Pembeli</label>
                <input className="admin-input" placeholder="Rina Dewi..." value={form.buyerName} onChange={e => setForm(f => ({ ...f, buyerName: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500 mb-1 block">Harga yang Dibayar Customer (Rp)</label>
              <input type="number" className="admin-input font-mono" value={form.amountPaid || ''} onChange={e => setForm(f => ({ ...f, amountPaid: Number(e.target.value) }))} />
            </div>
          </div>

          {/* Validity */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-zinc-500 mb-1 block">Maks. Pemakaian</label>
              <input type="number" min={1} className="admin-input font-mono" value={form.maxUses} onChange={e => setForm(f => ({ ...f, maxUses: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500 mb-1 block flex items-center gap-2">
                <input type="checkbox" checked={form.useExpiry} onChange={e => setForm(f => ({ ...f, useExpiry: e.target.checked }))} />
                Ada Tanggal Kadaluarsa?
              </label>
              {form.useExpiry && <input type="date" className="admin-input" value={form.expiryDate} onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))} />}
              {!form.useExpiry && <p className="text-xs text-zinc-400 mt-2">Lifetime (tidak ada batas waktu)</p>}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={handleCreate} disabled={saving || !form.name || voucherValue <= 0} className="admin-btn-primary disabled:opacity-50">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Gift size={14} />} Simpan & Generate Voucher
            </button>
          </div>

          {/* Live Preview */}
          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-2">Live Preview Kartu</p>
            <div className="relative w-full rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700" style={{ aspectRatio: '1200/520' }}>
              <div className="absolute top-0 left-0 origin-top-left" ref={(el) => { if (el) { const pw = el.parentElement?.clientWidth || 0; el.style.transform = `scale(${pw / 1200})`; } }}>
                <VoucherCard name={form.name || 'Nama Voucher'} code={form.code} value={voucherValue} vt={form.valueType} svc={selectedService?.name} details={selectedService?.details} to={form.recipientName || undefined} from={form.buyerName || undefined} exp={form.useExpiry ? (form.expiryDate || null) : null} mx={form.maxUses} wa={waNumber} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview generated voucher image */}
      {previewVoucher && (
        <div className="bg-white dark:bg-zinc-900 border border-earth-primary/20 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
              <Eye size={16} className="text-earth-primary" /> Preview Kartu Voucher
            </h2>
            <div className="flex gap-2">
              <button onClick={() => setPreviewVoucher(null)} className="admin-btn-ghost text-xs py-1.5 px-3"><X size={14} /> Tutup</button>
              <button onClick={downloadImage} disabled={generating} className="admin-btn-primary text-xs py-1.5 px-3 disabled:opacity-60">
                {generating ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />} Download
              </button>
            </div>
          </div>

          {/* Voucher Card Preview */}
          <div className="relative w-full rounded-xl overflow-hidden border border-zinc-200" style={{ aspectRatio: '1200/520' }}>
            <div className="absolute top-0 left-0 origin-top-left" ref={(el) => { if (el) { const pw = el.parentElement?.clientWidth || 0; el.style.transform = `scale(${pw / 1200})`; } }}>
              <div ref={previewRef}>
                <VoucherCard name={previewVoucher!.name} code={previewVoucher!.code} value={previewVoucher!.value} vt={previewVoucher!.value_type} svc={services.find(s => s.id === previewVoucher!.target_service)?.name} details={services.find(s => s.id === previewVoucher!.target_service)?.details} to={previewVoucher!.recipient_name ?? undefined} from={previewVoucher!.buyer_name ?? undefined} exp={previewVoucher!.valid_to} mx={previewVoucher!.max_uses ?? 1} wa={waNumber} />
              </div>
            </div>
          </div>
        </div>
      )}



      {/* Filter & List */}
      {tab === 'list' && (
        <>
          <div className="flex gap-2 flex-wrap">
            {(['semua', 'active', 'used', 'expired'] as const).map(f => (
              <button key={f} onClick={() => setFilterStatus(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${
                  filterStatus === f ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900' : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-zinc-200'
                }`}>
                {f === 'semua' ? 'Semua' : STATUS_MAP[f]?.label ?? f}
              </button>
            ))}
          </div>

          {loading ? <AdminSkeleton rows={4} /> : filtered.length === 0 ? (
            <div className="text-center py-16 text-sm text-zinc-400 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <Gift size={32} className="mx-auto mb-3 opacity-30" />
              {vouchers.length === 0 ? 'Belum ada voucher. Klik "Buat Voucher" untuk mulai.' : 'Tidak ada voucher dengan status ini.'}
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(v => {
                const status = getStatus(v);
                const sc = STATUS_MAP[status];
                return (
                  <div key={v.id} className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-4 flex items-start gap-4 ${status !== 'active' ? 'opacity-60' : ''}`}>
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm text-zinc-900 dark:text-white">{v.name}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sc.cls}`}>{sc.label}</span>
                        {v.recipient_name && <span className="text-[10px] text-zinc-500">untuk <strong>{v.recipient_name}</strong></span>}
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <code className="font-mono text-sm font-bold text-earth-primary tracking-wider">{v.code}</code>
                        <button onClick={() => handleCopy(v.code)} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors" title="Salin kode">
                          {copied === v.code ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} className="text-zinc-400" />}
                        </button>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-zinc-400 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Tag size={11} /> {v.value_type === 'flat' ? fmtRp(v.value) : `${v.value}%`}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users size={11} /> {v.uses_count}/{v.max_uses ?? '∞'}× pakai
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={11} /> {fmtDate(v.valid_to)}
                        </span>
                        {v.buyer_name && <span>dari {v.buyer_name}</span>}
                        {v.amount_paid && <span className="text-emerald-600 font-medium">Dibayar: {fmtRp(v.amount_paid)}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => setPreviewVoucher(v)} className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400" title="Lihat kartu voucher">
                        <Eye size={15} />
                      </button>
                      {status === 'active' && (
                        <button onClick={() => handleRevoke(v.id)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-red-400" title="Nonaktifkan">
                          <Ban size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
