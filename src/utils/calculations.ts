/**
 * Pure calculation utilities for simple paper invoice accounting system
 */

export function calculateCommission(totalAmount: number, rate: number): number {
  if (!totalAmount || !rate || totalAmount <= 0 || rate <= 0) return 0;
  return Number(((totalAmount * rate) / 100).toFixed(2));
}

export interface EmployeeBalanceInput {
  baseSalary: number;
  openingBalance?: number;
  openingBalanceType?: 'credit' | 'debit';
  transactions: Array<{
    type: 'salary' | 'commission' | 'bonus' | 'deduction' | 'advance' | 'payout';
    amount: number;
  }>;
}

export function calculateEmployeeBalance(input: EmployeeBalanceInput) {
  let entitlements = 0; // له (دائن)
  let paidAndDeducted = 0; // عليه (مدين)

  if (input.openingBalance && input.openingBalance > 0) {
    if (input.openingBalanceType === 'credit') {
      entitlements += Number(input.openingBalance);
    } else {
      paidAndDeducted += Number(input.openingBalance);
    }
  }

  input.transactions.forEach((tx) => {
    const amt = Number(tx.amount) || 0;
    if (tx.type === 'salary' || tx.type === 'commission' || tx.type === 'bonus') {
      entitlements += amt;
    } else if (tx.type === 'advance' || tx.type === 'deduction' || tx.type === 'payout') {
      paidAndDeducted += amt;
    }
  });

  const net = entitlements - paidAndDeducted;
  let status: 'credit' | 'debit' | 'balanced' = 'balanced';
  if (net > 0.001) status = 'credit';
  else if (net < -0.001) status = 'debit';

  return { entitlements, paidAndDeducted, net, status };
}

export function calculateNetProfit(
  totalSales: number,
  totalPurchases: number,
  totalExpenses: number,
  totalCommissions: number = 0
): number {
  return totalSales - totalPurchases - totalExpenses - totalCommissions;
}

export interface PartyTransactionInput {
  type: 'sale' | 'purchase' | 'expense' | 'receipt' | 'payment';
  totalAmount?: number;
  paidAmount?: number;
  amount?: number;
}

export function calculatePartyBalancePure(
  openingBalance: number = 0,
  openingBalanceType: 'debit' | 'credit' = 'debit',
  transactions: PartyTransactionInput[]
) {
  let debit = 0; // مدين (عليه)
  let credit = 0; // دائن (له)

  if (openingBalance > 0) {
    if (openingBalanceType === 'debit') {
      debit += Number(openingBalance);
    } else {
      credit += Number(openingBalance);
    }
  }

  transactions.forEach((tx) => {
    if (tx.type === 'sale') {
      // بيع: مدين بكامل الفاتورة
      debit += Number(tx.totalAmount || 0);
      // سداد فوري: دائن بما دفعه
      if ((tx.paidAmount || 0) > 0) {
        credit += Number(tx.paidAmount);
      }
    } else if (tx.type === 'purchase' || tx.type === 'expense') {
      // شراء/مصروف: دائن بقيمة الفاتورة
      credit += Number(tx.totalAmount || 0);
      // سداد فوري: مدين بما تم صرفه له
      if ((tx.paidAmount || 0) > 0) {
        debit += Number(tx.paidAmount);
      }
    } else if (tx.type === 'receipt') {
      // سند قبض: دائن بقيمة المبلغ المقبوض
      credit += Number(tx.amount || 0);
    } else if (tx.type === 'payment') {
      // سند صرف: مدين بقيمة المبلغ المصروف
      debit += Number(tx.amount || 0);
    }
  });

  const net = Number((debit - credit).toFixed(2));
  let status: 'debit' | 'credit' | 'balanced' = 'balanced';
  if (net > 0.001) status = 'debit';
  else if (net < -0.001) status = 'credit';

  return { debit, credit, net, status };
}

export interface TreasuryTransactionInput {
  type: 'inflow' | 'outflow';
  amount: number;
}

export function calculateTreasuryBalancePure(
  openingBalance: number = 0,
  transactions: TreasuryTransactionInput[]
): number {
  let balance = Number(openingBalance) || 0;
  transactions.forEach((tx) => {
    const amt = Number(tx.amount) || 0;
    if (tx.type === 'inflow') {
      balance += amt;
    } else if (tx.type === 'outflow') {
      balance -= amt;
    }
  });
  return Number(balance.toFixed(2));
}
