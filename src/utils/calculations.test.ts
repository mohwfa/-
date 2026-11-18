import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateCommission,
  calculateEmployeeBalance,
  calculateNetProfit,
  calculatePartyBalancePure,
  calculateTreasuryBalancePure,
} from './calculations.ts';

test('calculateCommission calculates percentage correctly', () => {
  assert.equal(calculateCommission(1000, 5), 50);
  assert.equal(calculateCommission(2500, 3.5), 87.5);
  assert.equal(calculateCommission(0, 10), 0);
  assert.equal(calculateCommission(1500, 0), 0);
});

test('calculateEmployeeBalance computes entitlements and payouts accurately', () => {
  const result = calculateEmployeeBalance({
    baseSalary: 2000,
    openingBalance: 500,
    openingBalanceType: 'credit', // له سابق 500
    transactions: [
      { type: 'salary', amount: 2000 },      // +2000
      { type: 'commission', amount: 150 },    // +150
      { type: 'bonus', amount: 100 },         // +100
      { type: 'advance', amount: 300 },       // -300
      { type: 'deduction', amount: 50 },      // -50
      { type: 'payout', amount: 1800 },       // -1800
    ],
  });

  // Entitlements: 500 + 2000 + 150 + 100 = 2750
  assert.equal(result.entitlements, 2750);
  // Paid and deducted: 300 + 50 + 1800 = 2150
  assert.equal(result.paidAndDeducted, 2150);
  // Net remaining: 2750 - 2150 = 600
  assert.equal(result.net, 600);
  assert.equal(result.status, 'credit');
});

test('calculateEmployeeBalance handles debit opening balance', () => {
  const result = calculateEmployeeBalance({
    baseSalary: 1500,
    openingBalance: 400,
    openingBalanceType: 'debit', // عليه سلفة 400
    transactions: [
      { type: 'salary', amount: 1500 },
      { type: 'payout', amount: 1500 },
    ],
  });

  assert.equal(result.entitlements, 1500);
  assert.equal(result.paidAndDeducted, 1900);
  assert.equal(result.net, -400);
  assert.equal(result.status, 'debit');
});

test('calculateNetProfit calculates bottom-line profit and loss', () => {
  const profit = calculateNetProfit(50000, 30000, 5000, 1500);
  // 50000 - 30000 - 5000 - 1500 = 13500
  assert.equal(profit, 13500);
});

test('calculatePartyBalancePure correctly handles customer sales, partial payments and vouchers', () => {
  // Customer with 500 opening debit (عليه 500)
  // Buys 2000 on credit, pays 500 immediately -> debit +2000, credit +500
  // Later pays 1000 with a receipt voucher -> credit +1000
  const result = calculatePartyBalancePure(500, 'debit', [
    { type: 'sale', totalAmount: 2000, paidAmount: 500 },
    { type: 'receipt', amount: 1000 },
  ]);

  // Total debit = 500 + 2000 = 2500
  assert.equal(result.debit, 2500);
  // Total credit = 500 + 1000 = 1500
  assert.equal(result.credit, 1500);
  // Net = 2500 - 1500 = 1000 (عليه للمنشأة)
  assert.equal(result.net, 1000);
  assert.equal(result.status, 'debit');
});

test('calculatePartyBalancePure correctly handles supplier purchases and payment vouchers', () => {
  // Supplier with 1000 opening credit (له 1000)
  // We buy 5000, pay 2000 upfront -> credit +5000, debit +2000
  // We pay 3000 with payment voucher -> debit +3000
  const result = calculatePartyBalancePure(1000, 'credit', [
    { type: 'purchase', totalAmount: 5000, paidAmount: 2000 },
    { type: 'payment', amount: 3000 },
  ]);

  // Total debit = 2000 + 3000 = 5000
  assert.equal(result.debit, 5000);
  // Total credit = 1000 + 5000 = 6000
  assert.equal(result.credit, 6000);
  // Net = 5000 - 6000 = -1000 (له على المنشأة)
  assert.equal(result.net, -1000);
  assert.equal(result.status, 'credit');
});

test('calculatePartyBalancePure detects fully balanced accounts', () => {
  const result = calculatePartyBalancePure(0, 'debit', [
    { type: 'sale', totalAmount: 1200, paidAmount: 1200 },
  ]);
  assert.equal(result.net, 0);
  assert.equal(result.status, 'balanced');
});

test('calculateTreasuryBalancePure calculates accurate liquidity from inflows and outflows', () => {
  const balance = calculateTreasuryBalancePure(5000, [
    { type: 'inflow', amount: 1500 },  // Cash sale
    { type: 'inflow', amount: 2000 },  // Receipt voucher
    { type: 'outflow', amount: 800 },  // Expense invoice
    { type: 'outflow', amount: 1200 }, // Payment voucher
    { type: 'inflow', amount: 3000 },  // Transfer received
    { type: 'outflow', amount: 1000 }, // Transfer sent
  ]);
  // 5000 + 1500 + 2000 - 800 - 1200 + 3000 - 1000 = 8500
  assert.equal(balance, 8500);
});

