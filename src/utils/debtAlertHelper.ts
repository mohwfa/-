import { Party } from '../types';

export interface OverdueCustomerDebt {
  partyId: string;
  partyName: string;
  partyType: string;
  phone: string;
  address: string;
  totalDebt: number; // المبلغ الإجمالي المتبقي بذمة العميل
  oldestUnpaidDate: string; // تاريخ أقدم حركة غير مسددة
  daysElapsed: number; // إجمالي الأيام المنقضية منذ أقدم حركة
  daysOverdue: number; // عدد الأيام التي تجاوزت فترة السماح
  oldestRef: string; // رقم الفاتورة أو المرجع
  severity: 'urgent' | 'warning' | 'notice'; // درجة الخطورة
}

/**
 * Calculates customers who have debit balances (debts owed to the company)
 * and determines the age of the oldest unpaid transaction using FIFO matching.
 */
export function calculateOverdueCustomerDebts(
  parties: Party[],
  getPartyBalance: (partyId: string) => { debit: number; credit: number; net: number; status: 'debit' | 'credit' | 'balanced' },
  getPartyStatement: (partyId: string) => Array<{
    id: string;
    date: string;
    type: string;
    refNumber: string;
    description: string;
    debit: number;
    credit: number;
  }>,
  gracePeriodDays: number = 30,
  referenceDateStr?: string
): OverdueCustomerDebt[] {
  const refDate = referenceDateStr ? new Date(referenceDateStr) : new Date();
  const results: OverdueCustomerDebt[] = [];

  // Consider customers and 'both' (common accounts that have customer transactions)
  // Exclude system cash account
  const eligibleParties = parties.filter(
    (p) => !p.isSystem && (p.type === 'customer' || p.type === 'both')
  );

  for (const party of eligibleParties) {
    const bal = getPartyBalance(party.id);
    if (bal.status !== 'debit' || bal.net <= 0.001) {
      continue;
    }

    const totalNetDebt = bal.net;
    const statement = getPartyStatement(party.id);

    // Calculate total payments/credits received from this party
    let totalCredits = 0;
    statement.forEach((item) => {
      totalCredits += Number(item.credit) || 0;
    });

    // Match credits against debits chronologically (FIFO) to find the oldest unpaid debit
    let remainingCreditsToApply = totalCredits;
    let oldestUnpaidDate = party.createdAt || '2026-01-01';
    let oldestRef = 'رصيد سابق';
    let foundUnpaid = false;

    for (const item of statement) {
      const debitAmount = Number(item.debit) || 0;
      if (debitAmount <= 0) continue;

      if (remainingCreditsToApply >= debitAmount) {
        // This debit is fully covered by payments
        remainingCreditsToApply -= debitAmount;
      } else {
        // Partially covered or not covered at all: this is the oldest unpaid transaction!
        oldestUnpaidDate = item.date;
        oldestRef = item.refNumber && item.refNumber !== '-' ? item.refNumber : item.type;
        foundUnpaid = true;
        break;
      }
    }

    // If for some reason all debits appeared covered but net > 0, fallback to party createdAt
    if (!foundUnpaid && statement.length > 0) {
      oldestUnpaidDate = statement[0].date;
      oldestRef = statement[0].refNumber || 'حركة سابقة';
    }

    // Calculate days elapsed
    const itemDate = new Date(oldestUnpaidDate);
    const timeDiffMs = refDate.getTime() - itemDate.getTime();
    const daysElapsed = Math.max(0, Math.floor(timeDiffMs / (1000 * 60 * 60 * 24)));

    // Check if it exceeds grace period
    if (daysElapsed > gracePeriodDays) {
      const daysOverdue = daysElapsed - gracePeriodDays;

      let severity: 'urgent' | 'warning' | 'notice' = 'notice';
      if (daysOverdue > 30) {
        severity = 'urgent'; // متأخر جداً (أكثر من 30 يوم فوق السماح)
      } else if (daysOverdue > 15) {
        severity = 'warning'; // متأخر بوضوح (15 إلى 30 يوم)
      } else {
        severity = 'notice'; // حديث التأخر (أقل من 15 يوم)
      }

      results.push({
        partyId: party.id,
        partyName: party.name,
        partyType: party.type,
        phone: party.phone,
        address: party.address,
        totalDebt: Math.round(totalNetDebt * 100) / 100,
        oldestUnpaidDate,
        daysElapsed,
        daysOverdue,
        oldestRef,
        severity,
      });
    }
  }

  // Sort by severity (urgent first) then by daysOverdue descending
  return results.sort((a, b) => {
    if (a.severity === 'urgent' && b.severity !== 'urgent') return -1;
    if (b.severity === 'urgent' && a.severity !== 'urgent') return 1;
    return b.daysOverdue - a.daysOverdue;
  });
}
