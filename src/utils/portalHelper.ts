import {
  CompanySettings,
  Employee,
  EmployeeTransaction,
  FiscalYearArchive,
  Invoice,
  Party,
  Treasury,
  TreasuryTransfer,
  User,
  Voucher,
} from '../types';
import {
  initialCompanySettings,
  initialEmployees,
  initialEmployeeTransactions,
  initialInvoices,
  initialParties,
  initialTreasuries,
  initialUsers,
  initialVouchers,
} from '../data/initialData';

export const SINGLE_COMPANY_STORAGE_PREFIX = 'simple_finance_system_v2';
const LEGACY_COMPANY_STORAGE_PREFIX = 'barqnet_cmp_alofok';

/**
 * توليد رمز آمن وفريد لكشف حساب العميل أو المورد المباشر
 */
export function generatePortalToken(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let token = 'bn_tok_';
  for (let i = 0; i < 16; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export function loadSingleCompanyItem<T>(key: string, fallback: T): T {
  try {
    const primary = localStorage.getItem(`${SINGLE_COMPANY_STORAGE_PREFIX}_${key}`);
    if (primary) return JSON.parse(primary) as T;

    // Fallback for seamless continuity if data was previously saved under default company prefix
    const legacy = localStorage.getItem(`${LEGACY_COMPANY_STORAGE_PREFIX}_${key}`);
    if (legacy) return JSON.parse(legacy) as T;
  } catch (e) {
    console.error(`Failed to load ${key} from localStorage`, e);
  }
  return fallback;
}

export function saveSingleCompanyItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(`${SINGLE_COMPANY_STORAGE_PREFIX}_${key}`, JSON.stringify(value));
  } catch (e) {
    console.error(`Failed to save ${key} to localStorage`, e);
  }
}

export interface SingleCompanyBundle {
  settings: CompanySettings;
  parties: Party[];
  treasuries: Treasury[];
  transfers: TreasuryTransfer[];
  invoices: Invoice[];
  vouchers: Voucher[];
  employees: Employee[];
  employeeTransactions: EmployeeTransaction[];
  users: User[];
  currentUser: User;
  isLocked: boolean;
  fiscalYears: FiscalYearArchive[];
}

export function loadSingleCompanyBundle(): SingleCompanyBundle {
  const settings = loadSingleCompanyItem<CompanySettings>('settings', initialCompanySettings);
  const rawParties = loadSingleCompanyItem<Party[]>('parties', initialParties);
  const parties = rawParties.map((p) =>
    p.portalToken
      ? p
      : { ...p, portalToken: generatePortalToken(), isPortalActive: p.isPortalActive ?? true }
  );
  const treasuries = loadSingleCompanyItem<Treasury[]>('treasuries', initialTreasuries);
  const transfers = loadSingleCompanyItem<TreasuryTransfer[]>('transfers', []);
  const invoices = loadSingleCompanyItem<Invoice[]>('invoices', initialInvoices);
  const vouchers = loadSingleCompanyItem<Voucher[]>('vouchers', initialVouchers);
  const employees = loadSingleCompanyItem<Employee[]>('employees', initialEmployees);
  const employeeTransactions = loadSingleCompanyItem<EmployeeTransaction[]>(
    'emp_tx',
    initialEmployeeTransactions
  );
  const users = loadSingleCompanyItem<User[]>('users', initialUsers);
  const currentUser = loadSingleCompanyItem<User>('currentUser', users[0] || initialUsers[0]);
  const isLocked = loadSingleCompanyItem<boolean>('isLocked', false);
  const fiscalYears = loadSingleCompanyItem<FiscalYearArchive[]>('fiscal_years', []);

  return {
    settings,
    parties,
    treasuries,
    transfers,
    invoices,
    vouchers,
    employees,
    employeeTransactions,
    users,
    currentUser,
    isLocked,
    fiscalYears,
  };
}
