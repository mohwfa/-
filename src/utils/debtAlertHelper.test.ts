import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateOverdueCustomerDebts } from './debtAlertHelper';
import { Party } from '../types';

test('calculateOverdueCustomerDebts accurately detects overdue customer exceeding grace period', () => {
  const mockParties: Party[] = [
    {
      id: 'customer_1',
      name: 'شركة النور للمقاولات',
      type: 'customer',
      phone: '0911122334',
      address: 'طرابلس',
      openingBalance: 1000,
      openingBalanceType: 'debit',
      createdAt: '2026-01-01',
    },
    {
      id: 'customer_2',
      name: 'زبون ملتزم',
      type: 'customer',
      phone: '0922233445',
      address: 'طرابلس',
      openingBalance: 500,
      openingBalanceType: 'debit',
      createdAt: '2026-03-25',
    },
    {
      id: 'supplier_1',
      name: 'مورد مواد',
      type: 'supplier',
      phone: '0933344556',
      address: 'مصراتة',
      openingBalance: 2000,
      openingBalanceType: 'credit',
      createdAt: '2026-01-01',
    },
  ];

  // Party 1 has net debit 1000, statement shows opening balance on 2026-01-01
  // Party 2 has net debit 500, created on 2026-03-25
  const mockGetPartyBalance = (id: string) => {
    if (id === 'customer_1') {
      return { debit: 1000, credit: 0, net: 1000, status: 'debit' as const };
    }
    if (id === 'customer_2') {
      return { debit: 500, credit: 0, net: 500, status: 'debit' as const };
    }
    return { debit: 0, credit: 2000, net: -2000, status: 'credit' as const };
  };

  const mockGetPartyStatement = (id: string) => {
    if (id === 'customer_1') {
      return [
        {
          id: 'op1',
          date: '2026-01-01',
          type: 'رصيد افتتاحي',
          refNumber: '-',
          description: 'رصيد افتتاحي',
          debit: 1000,
          credit: 0,
        },
      ];
    }
    if (id === 'customer_2') {
      return [
        {
          id: 'op2',
          date: '2026-03-25',
          type: 'رصيد افتتاحي',
          refNumber: '-',
          description: 'رصيد افتتاحي',
          debit: 500,
          credit: 0,
        },
      ];
    }
    return [];
  };

  // If reference date is 2026-04-01 and grace period is 30 days:
  // customer_1: elapsed ~90 days, 90 > 30 => OVERDUE by ~60 days, severity = urgent
  // customer_2: elapsed 7 days, 7 <= 30 => NOT overdue
  const overdue = calculateOverdueCustomerDebts(
    mockParties,
    mockGetPartyBalance,
    mockGetPartyStatement,
    30,
    '2026-04-01'
  );

  assert.strictEqual(overdue.length, 1);
  assert.strictEqual(overdue[0].partyId, 'customer_1');
  assert.strictEqual(overdue[0].partyName, 'شركة النور للمقاولات');
  assert.strictEqual(overdue[0].totalDebt, 1000);
  assert.strictEqual(overdue[0].daysElapsed, 90);
  assert.strictEqual(overdue[0].daysOverdue, 60);
  assert.strictEqual(overdue[0].severity, 'urgent');
});

test('calculateOverdueCustomerDebts handles FIFO settlement of earlier transactions', () => {
  const mockParties: Party[] = [
    {
      id: 'customer_3',
      name: 'شركة الأفق الحديثة',
      type: 'customer',
      phone: '0944455667',
      address: 'بنغازي',
      openingBalance: 0,
      openingBalanceType: 'debit',
      createdAt: '2026-01-01',
    },
  ];

  // Old invoice on 2026-01-10 for 1000, fully paid on 2026-01-15
  // New invoice on 2026-03-28 for 1200, unpaid
  const mockGetPartyBalance = () => ({
    debit: 2200,
    credit: 1000,
    net: 1200,
    status: 'debit' as const,
  });

  const mockGetPartyStatement = () => [
    {
      id: 'inv1',
      date: '2026-01-10',
      type: 'فاتورة مبيعات',
      refNumber: 'INV-100',
      description: 'فاتورة سابقة',
      debit: 1000,
      credit: 0,
    },
    {
      id: 'rec1',
      date: '2026-01-15',
      type: 'سند قبض',
      refNumber: 'REC-01',
      description: 'سداد',
      debit: 0,
      credit: 1000,
    },
    {
      id: 'inv2',
      date: '2026-03-28',
      type: 'فاتورة مبيعات',
      refNumber: 'INV-105',
      description: 'فاتورة جديدة',
      debit: 1200,
      credit: 0,
    },
  ];

  // Reference date: 2026-04-01, grace period: 30 days
  // The first invoice of Jan 10 is fully paid by receipt of 1000.
  // The oldest unpaid is inv2 on 2026-03-28, which is only 4 days old (4 <= 30 => NOT overdue!)
  const overdueWith30Days = calculateOverdueCustomerDebts(
    mockParties,
    mockGetPartyBalance,
    mockGetPartyStatement,
    30,
    '2026-04-01'
  );
  assert.strictEqual(overdueWith30Days.length, 0);

  // If grace period is reduced to 2 days:
  // 4 > 2 => overdue by 2 days!
  const overdueWith2Days = calculateOverdueCustomerDebts(
    mockParties,
    mockGetPartyBalance,
    mockGetPartyStatement,
    2,
    '2026-04-01'
  );
  assert.strictEqual(overdueWith2Days.length, 1);
  assert.strictEqual(overdueWith2Days[0].oldestUnpaidDate, '2026-03-28');
  assert.strictEqual(overdueWith2Days[0].daysOverdue, 2);
});
