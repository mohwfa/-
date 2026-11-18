import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateFinancialSummary,
  rolloverPartyBalances,
  rolloverTreasuryBalances,
  rolloverEmployeeBalances,
  createFiscalYearArchive,
  zeroOutAccountsAndEntities,
} from './fiscalYearHelper';
import { Party, Treasury, Employee, Invoice, Voucher } from '../types';

test('calculateFinancialSummary correctly aggregates sales, purchases, expenses and net profit', () => {
  const dummyInvoices: Invoice[] = [
    {
      id: 'inv_1',
      invoiceNumber: 'INV-101',
      type: 'sale',
      partyId: 'p1',
      partyName: 'عميل 1',
      date: '2026-05-01',
      totalAmount: 10000,
      paymentStatus: 'paid',
      paidAmount: 10000,
      hasEmployeeCommission: true,
      commissionAmount: 500,
      createdBy: 'مدير',
      createdAt: '2026-05-01',
    },
    {
      id: 'inv_2',
      invoiceNumber: 'PUR-201',
      type: 'purchase',
      partyId: 'p2',
      partyName: 'مورد 1',
      date: '2026-06-01',
      totalAmount: 4000,
      paymentStatus: 'paid',
      paidAmount: 4000,
      createdBy: 'مدير',
      createdAt: '2026-06-01',
    },
    {
      id: 'inv_3',
      invoiceNumber: 'EXP-301',
      type: 'expense',
      partyId: 'p_cash',
      partyName: 'حساب نقدي',
      date: '2026-07-01',
      totalAmount: 1500,
      paymentStatus: 'paid',
      paidAmount: 1500,
      createdBy: 'مدير',
      createdAt: '2026-07-01',
    },
  ];

  const summary = calculateFinancialSummary(dummyInvoices);
  assert.equal(summary.salesTotal, 10000);
  assert.equal(summary.purchasesTotal, 4000);
  assert.equal(summary.expensesTotal, 1500);
  assert.equal(summary.commissionsTotal, 500);
  assert.equal(summary.totalCosts, 6000); // 4000 + 1500 + 500
  assert.equal(summary.netProfit, 4000); // 10000 - 6000
  assert.equal(summary.profitMargin, 40); // 40%
});

test('rolloverPartyBalances keeps all party entities while carrying forward ending balance', () => {
  const parties: Party[] = [
    {
      id: 'c1',
      name: 'شركة النور',
      type: 'customer',
      phone: '091',
      address: 'طرابلس',
      openingBalance: 100,
      openingBalanceType: 'debit',
      createdAt: '2026-01-01',
    },
    {
      id: 's1',
      name: 'مؤسسة البركة',
      type: 'supplier',
      phone: '092',
      address: 'مصراتة',
      openingBalance: 500,
      openingBalanceType: 'credit',
      createdAt: '2026-01-01',
    },
  ];

  const mockGetPartyBalance = (id: string) => {
    if (id === 'c1') {
      return { debit: 5000, credit: 2000, net: 3000, status: 'debit' as const };
    }
    return { debit: 1000, credit: 4000, net: -3000, status: 'credit' as const };
  };

  const rolledOver = rolloverPartyBalances(parties, mockGetPartyBalance);

  assert.equal(rolledOver.length, 2);
  assert.equal(rolledOver[0].name, 'شركة النور');
  assert.equal(rolledOver[0].openingBalance, 3000);
  assert.equal(rolledOver[0].openingBalanceType, 'debit');

  assert.equal(rolledOver[1].name, 'مؤسسة البركة');
  assert.equal(rolledOver[1].openingBalance, 3000);
  assert.equal(rolledOver[1].openingBalanceType, 'credit');
});

test('rolloverTreasuryBalances sets actual current liquidity as new opening balance', () => {
  const treasuries: Treasury[] = [
    {
      id: 't_cash',
      name: 'الخزينة الرئيسية',
      type: 'cash',
      openingBalance: 1000,
      createdAt: '2026-01-01',
    },
    {
      id: 't_bank',
      name: 'حساب مصرف الجمهورية',
      type: 'bank',
      openingBalance: 20000,
      createdAt: '2026-01-01',
    },
  ];

  const mockGetTreasuryBalance = (id: string) => (id === 't_cash' ? 7500 : 42300);

  const rolledOver = rolloverTreasuryBalances(treasuries, mockGetTreasuryBalance);

  assert.equal(rolledOver.length, 2);
  assert.equal(rolledOver[0].openingBalance, 7500);
  assert.equal(rolledOver[1].openingBalance, 42300);
});

test('zeroOutAccountsAndEntities resets opening balances to 0 while preserving entity records', () => {
  const parties: Party[] = [
    {
      id: 'p1',
      name: 'زبون 1',
      type: 'customer',
      phone: '091',
      address: 'طرابلس',
      openingBalance: 5000,
      openingBalanceType: 'debit',
      createdAt: '2026-01-01',
    },
  ];
  const treasuries: Treasury[] = [
    {
      id: 't1',
      name: 'صندوق',
      type: 'cash',
      openingBalance: 12000,
      createdAt: '2026-01-01',
    },
  ];
  const employees: Employee[] = [
    {
      id: 'e1',
      name: 'أحمد',
      jobTitle: 'محاسب',
      phone: '092',
      baseSalary: 2500,
      status: 'active',
      openingBalance: 600,
      openingBalanceType: 'credit',
      joinDate: '2026-01-01',
      createdAt: '2026-01-01',
    },
  ];

  const zeroed = zeroOutAccountsAndEntities(parties, treasuries, employees);

  assert.equal(zeroed.parties[0].openingBalance, 0);
  assert.equal(zeroed.parties[0].name, 'زبون 1');
  assert.equal(zeroed.treasuries[0].openingBalance, 0);
  assert.equal(zeroed.treasuries[0].name, 'صندوق');
  assert.equal(zeroed.employees[0].openingBalance, 0);
  assert.equal(zeroed.employees[0].baseSalary, 2500);
});
