import { test } from 'node:test';
import assert from 'node:assert';
import {
  generatePortalToken,
  loadSingleCompanyBundle,
  saveSingleCompanyItem,
  SINGLE_COMPANY_STORAGE_PREFIX,
} from './portalHelper';

test('generatePortalToken generates unique secure tokens with prefix', () => {
  const t1 = generatePortalToken();
  const t2 = generatePortalToken();
  assert.ok(t1.startsWith('bn_tok_'));
  assert.ok(t2.startsWith('bn_tok_'));
  assert.notStrictEqual(t1, t2);
  assert.ok(t1.length > 15);
});

test('loadSingleCompanyBundle loads single-company state and ensures party portal tokens', () => {
  const store: Record<string, string> = {};
  global.localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, val: string) => {
      store[key] = val;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      for (const k in store) delete store[k];
    },
    key: () => null,
    length: 0,
  } as unknown as Storage;

  saveSingleCompanyItem('settings', {
    companyName: 'شركة الاختبار الوحيدة',
    phone: '0910000000',
    address: 'طرابلس',
    currency: 'د.ل',
    expenseCategories: [],
    requirePasswordLogin: false,
  });

  saveSingleCompanyItem('parties', [
    {
      id: 'p1',
      name: 'عميل 1',
      type: 'customer',
      phone: '0911111111',
      address: '',
      openingBalance: 0,
      openingBalanceType: 'debit',
      createdAt: '2026-01-01',
    },
  ]);

  const bundle = loadSingleCompanyBundle();
  assert.strictEqual(bundle.settings.companyName, 'شركة الاختبار الوحيدة');
  assert.strictEqual(bundle.parties.length, 1);
  assert.ok(bundle.parties[0].portalToken?.startsWith('bn_tok_'));
  assert.ok(store[`${SINGLE_COMPANY_STORAGE_PREFIX}_settings`]);
});
