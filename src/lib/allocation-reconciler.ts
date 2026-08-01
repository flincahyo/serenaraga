import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Reconciles Therapist Payout transactions (category === 'payroll') for a given month.
 * If bookings are cancelled or deleted, any recorded PAYOUT transactions for therapists
 * in that month are automatically adjusted or deleted if total valid commission drops.
 */
export async function reconcileTherapistPayouts(
  supabase: SupabaseClient,
  monthStr: string // YYYY-MM format, e.g. "2026-08"
) {
  try {
    const startDate = `${monthStr}-01`;
    const [yearStr, monthStrTwo] = monthStr.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStrTwo, 10);
    const nextYear = month === 12 ? year + 1 : year;
    const nextMonth = month === 12 ? 1 : month + 1;
    const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;

    // 1. Fetch completed bookings with booking_items, payroll transactions & therapists
    const [{ data: bookingsData }, { data: payoutTxs }, { data: allTherapists }] = await Promise.all([
      supabase
        .from('bookings')
        .select('id, booking_date, booking_items(therapist_id, commission_earned)')
        .eq('status', 'Completed')
        .gte('booking_date', startDate)
        .lt('booking_date', endDate),
      supabase
        .from('cash_transactions')
        .select('id, reference_id, amount, description, payment_account, transaction_date')
        .eq('category', 'payroll')
        .gte('transaction_date', startDate)
        .lt('transaction_date', endDate),
      supabase
        .from('therapists')
        .select('id, name'),
    ]);

    if (!payoutTxs || payoutTxs.length === 0) return;

    // 2. Sum valid commission earned per therapist_id for the month
    const validCommissionByTherapist: Record<string, number> = {};
    if (bookingsData) {
      bookingsData.forEach(b => {
        if (b.booking_items && Array.isArray(b.booking_items)) {
          b.booking_items.forEach((item: any) => {
            if (item.therapist_id && item.commission_earned) {
              const tId = item.therapist_id;
              validCommissionByTherapist[tId] = (validCommissionByTherapist[tId] || 0) + Number(item.commission_earned);
            }
          });
        }
      });
    }

    // 3. Reconcile each recorded payout transaction
    for (const tx of payoutTxs) {
      const refId = tx.reference_id || '';
      const desc = tx.description || '';

      // Match therapist by reference_id shortId OR therapist name in description
      let matchedTherapistId: string | null = null;

      if (refId.startsWith('PAYOUT-')) {
        const parts = refId.split('-');
        const tShortId = parts[1];
        if (tShortId && allTherapists) {
          const found = allTherapists.find(t => t.id.toLowerCase().startsWith(tShortId.toLowerCase()) || t.id === tShortId);
          if (found) matchedTherapistId = found.id;
        }
      }

      if (!matchedTherapistId && allTherapists) {
        const found = allTherapists.find(t => t.name && desc.toLowerCase().includes(t.name.toLowerCase()));
        if (found) matchedTherapistId = found.id;
      }

      if (!matchedTherapistId) continue;

      const validComm = validCommissionByTherapist[matchedTherapistId] || 0;

      // Extract tips/kasbon from description if present (e.g. "+ Tips/Kasbon Rp 50.000")
      let tipAmount = 0;
      const tipMatch = desc.match(/Tips\/Kasbon Rp\s*([\d.]+)/i);
      if (tipMatch && tipMatch[1]) {
        tipAmount = Number(tipMatch[1].replace(/\./g, '')) || 0;
      }

      const expectedPayoutTotal = validComm + tipAmount;
      const currentTxAmount = Number(tx.amount);

      if (expectedPayoutTotal <= 0) {
        // All bookings cancelled/deleted -> delete the payout transaction from cashbook
        await supabase.from('cash_transactions').delete().eq('id', tx.id);
      } else if (currentTxAmount > expectedPayoutTotal) {
        // Excess payout -> adjust amount down to exact valid total
        await supabase.from('cash_transactions').update({ amount: expectedPayoutTotal }).eq('id', tx.id);
      }
    }
  } catch (err) {
    console.error('Error reconciling therapist payouts:', err);
  }
}

/**
 * Reconciles Smart Allocation internal transfer transactions (TRF-ALOC) for a given month.
 * If total executed allocations exceed the actual required targets (due to cancelled/deleted bookings),
 * the excess TRF-ALOC transactions are automatically cleaned up or adjusted.
 */
export async function reconcileMonthlyAllocations(
  supabase: SupabaseClient,
  monthStr: string // YYYY-MM format, e.g. "2026-08"
) {
  try {
    const startDate = `${monthStr}-01`;
    const [yearStr, monthStrTwo] = monthStr.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStrTwo, 10);
    const nextYear = month === 12 ? year + 1 : year;
    const nextMonth = month === 12 ? 1 : month + 1;
    const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;

    // 1. Fetch completed bookings, items, cash transactions & settings
    const [{ data: bookingsData }, { data: itemsData }, { data: cashTx }, { data: settingsRows }] = await Promise.all([
      supabase
        .from('bookings')
        .select('id, price, booking_date, bhp_cost')
        .eq('status', 'Completed')
        .gte('booking_date', startDate)
        .lt('booking_date', endDate),
      supabase
        .from('booking_items')
        .select('booking_id, commission_earned, therapist_id'),
      supabase
        .from('cash_transactions')
        .select('id, type, category, payment_account, amount, description, reference_id, created_by, transaction_date')
        .gte('transaction_date', startDate)
        .lt('transaction_date', endDate),
      supabase
        .from('settings')
        .select('key, value')
        .in('key', ['payment_accounts']),
    ]);

    if (!cashTx) return;

    // Parse target accounts from settings
    let targetBhpAcc = 'seabank';
    let targetCommAcc = 'bca';
    let targetProfitAcc = 'blu';

    if (settingsRows) {
      const accSetting = settingsRows.find(s => s.key === 'payment_accounts')?.value;
      if (accSetting && Array.isArray(accSetting)) {
        accSetting.forEach((acc: any) => {
          if (acc.tag === 'bhp') targetBhpAcc = acc.id;
          if (acc.tag === 'therapist_commission') targetCommAcc = acc.id;
          if (acc.tag === 'owner_profit') targetProfitAcc = acc.id;
        });
      }
    }

    // Build Maps matching finance/page.tsx 100%
    const bhpMap: Record<string, number> = {};
    const commMap: Record<string, number> = {};

    const commSumByBookingId: Record<string, number> = {};
    if (itemsData) {
      itemsData.forEach(item => {
        if (item.booking_id && item.therapist_id) {
          commSumByBookingId[item.booking_id] = (commSumByBookingId[item.booking_id] || 0) + (Number(item.commission_earned) || 0);
        }
      });
    }

    if (bookingsData) {
      bookingsData.forEach(b => {
        const cost = Number(b.bhp_cost) || Math.round((Number(b.price) || 0) * 0.05);
        const comm = commSumByBookingId[b.id] || 0;

        bhpMap[b.id] = cost;
        commMap[b.id] = comm;

        bhpMap[b.id.substring(0, 8)] = cost;
        commMap[b.id.substring(0, 8)] = comm;

        if (b.booking_date) {
          const dateObj = new Date(b.booking_date + 'T00:00:00');
          const y = dateObj.getFullYear();
          const m = String(dateObj.getMonth() + 1).padStart(2, '0');
          const last4 = b.id.substring(b.id.length - 4).toUpperCase();
          const refCode = `SR-${y}${m}-${last4}`;

          bhpMap[refCode] = cost;
          commMap[refCode] = comm;
        }
      });
    }

    const findMatchedVal = (t: any, map: Record<string, number>): number | null => {
      const rawRef = (t.reference_id || '').replace(/#/g, '').trim().toUpperCase();
      const rawDesc = (t.description || '').toUpperCase();

      if (rawRef && map[rawRef] !== undefined) return map[rawRef];

      const keys = Object.keys(map);
      for (const k of keys) {
        if (!k) continue;
        const cleanK = k.replace(/#/g, '').trim().toUpperCase();
        if ((rawRef && rawRef.includes(cleanK)) || rawDesc.includes(cleanK)) {
          return map[k];
        }
      }
      return null;
    };

    // Operational Inflows (Omset)
    const operationalInflows = cashTx.filter(t => t.type === 'inflow' && t.category !== 'internal_transfer' && t.category !== 'owner_capital');
    const totalInflow = operationalInflows.reduce((sum, t) => sum + Number(t.amount), 0);

    let totalBhpTarget = 0;
    let totalCommissionTarget = 0;

    operationalInflows.forEach(t => {
      const matchedBhp = findMatchedVal(t, bhpMap);
      const matchedComm = findMatchedVal(t, commMap);

      totalBhpTarget += matchedBhp !== null ? matchedBhp : Math.round((Number(t.amount) || 0) * 0.05);
      totalCommissionTarget += matchedComm !== null ? matchedComm : 0;
    });

    const totalProfitTarget = Math.max(0, totalInflow - totalBhpTarget - totalCommissionTarget);

    // 3. Find executed TRF-ALOC transactions
    const isAllocationTx = (t: any) =>
      t.type === 'inflow' &&
      t.category === 'internal_transfer' &&
      (
        t.description?.toLowerCase().includes('alokasi') ||
        t.description?.toLowerCase().includes('pos ') ||
        t.created_by === 'Smart Allocation Helper' ||
        (t.reference_id && t.reference_id.startsWith('TRF-ALOC-'))
      );

    const allocationInflows = cashTx.filter(isAllocationTx);

    // Group allocation transactions by pos account
    const bhpTxs = allocationInflows.filter(t => t.payment_account === targetBhpAcc);
    const commTxs = allocationInflows.filter(t => t.payment_account === targetCommAcc);
    const profitTxs = allocationInflows.filter(t => t.payment_account === targetProfitAcc);

    const executedBhp = bhpTxs.reduce((sum, t) => sum + Number(t.amount), 0);
    const executedComm = commTxs.reduce((sum, t) => sum + Number(t.amount), 0);
    const executedProfit = profitTxs.reduce((sum, t) => sum + Number(t.amount), 0);

    // Helper to prune excess allocation records
    const pruneExcess = async (txs: any[], executed: number, target: number) => {
      if (executed <= target) return;
      let excess = executed - target;

      const sorted = [...txs].sort((a, b) => (b.transaction_date > a.transaction_date ? 1 : -1));

      for (const t of sorted) {
        if (excess <= 0) break;
        const amt = Number(t.amount);
        const refId = t.reference_id;

        if (amt <= excess) {
          if (refId) {
            await supabase.from('cash_transactions').delete().eq('reference_id', refId);
          } else {
            await supabase.from('cash_transactions').delete().eq('id', t.id);
          }
          excess -= amt;
        } else {
          const newAmt = amt - excess;
          if (refId) {
            await supabase.from('cash_transactions').update({ amount: newAmt }).eq('reference_id', refId);
          } else {
            await supabase.from('cash_transactions').update({ amount: newAmt }).eq('id', t.id);
          }
          excess = 0;
        }
      }
    };

    await pruneExcess(bhpTxs, executedBhp, totalBhpTarget);
    await pruneExcess(commTxs, executedComm, totalCommissionTarget);
    await pruneExcess(profitTxs, executedProfit, totalProfitTarget);

    // 4. Reconcile therapist payouts as well
    await reconcileTherapistPayouts(supabase, monthStr);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('cashbook_updated'));
    }
  } catch (err) {
    console.error('Error reconciling monthly allocations:', err);
  }
}
