const fs = require('fs');
let file = 'src/components/admin/InvoiceMaker.tsx';
let c = fs.readFileSync(file, 'utf8');

c = c.replace(
  /discount_id: a\.discountId\.startsWith\('custom_'\) \? null : a\.discountId,/,
  "discount_id: a.discountId.startsWith('custom_') ? null : (a.discountId.startsWith('voucher_') ? a.discountId.replace('voucher_', '') : a.discountId),"
);

const searchStr = `      for (const a of appliedDiscounts) {
        if (a.discountId.startsWith('custom_')) continue;
        const { data: fresh } = await supabase.from('discounts').select('uses_count').eq('id', a.discountId).single();
        await supabase.from('discounts')
          .update({ uses_count: (fresh?.uses_count ?? 0) + 1 })
          .eq('id', a.discountId);
      }`;

const replaceStr = `      for (const a of appliedDiscounts) {
        if (a.discountId.startsWith('custom_')) continue;
        const realId = a.discountId.startsWith('voucher_') ? a.discountId.replace('voucher_', '') : a.discountId;
        const { data: fresh } = await supabase.from('discounts').select('uses_count').eq('id', realId).single();
        await supabase.from('discounts')
          .update({ uses_count: (fresh?.uses_count ?? 0) + 1 })
          .eq('id', realId);
      }`;

c = c.replace(searchStr, replaceStr);

fs.writeFileSync(file, c);
