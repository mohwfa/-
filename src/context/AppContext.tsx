import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  CompanySettings,
  Employee,
  EmployeeStatus,
  EmployeeTransaction,
  Invoice,
  Party,
  PaymentMethod,
  Treasury,
  TreasuryTransfer,
  User,
  UserPermissions,
  Voucher,
  FiscalYearArchive,
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
import {
  rolloverPartyBalances,
  rolloverTreasuryBalances,
  rolloverEmployeeBalances,
  createFiscalYearArchive,
  zeroOutAccountsAndEntities,
} from '../utils/fiscalYearHelper';
import {
  generatePortalToken,
  loadSingleCompanyBundle,
  saveSingleCompanyItem,
} from '../utils/portalHelper';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
}

export interface StatementItem {
  id: string;
  date: string;
  type: string;
  refNumber: string;
  description: string;
  debit: number; // مدين
  credit: number; // دائن
  balance: number; // الرصيد بعد الحركة
}

interface AppContextType {
  // Data
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
  fiscalYears: FiscalYearArchive[];
  
  // Security & Lock Screen
  isLocked: boolean;
  lockSystem: () => void;
  unlockSystem: (password: string) => boolean;
  switchUserWithPassword: (userId: string, password: string) => boolean;

  // UI States
  toasts: ToastMessage[];
  addToast: (type: ToastMessage['type'], title: string, message?: string) => void;
  removeToast: (id: string) => void;
  
  // Calculations
  getTreasuryBalance: (treasuryId: string) => number;
  getTotalLiquidity: () => { total: number; cash: number; bank: number };
  getPartyBalance: (partyId: string) => { debit: number; credit: number; net: number; status: 'debit' | 'credit' | 'balanced' };
  getPartyStatement: (partyId: string) => StatementItem[];
  getTreasuryStatement: (treasuryId: string) => StatementItem[];
  getEmployeeBalance: (employeeId: string) => {
    entitlements: number; // إجمالي ما يستحقه (الرواتب والمكافآت والنسب)
    paidAndDeducted: number; // إجمالي ما صُرف له والخصومات والسلف
    net: number; // الصافي المستحق له حالياً
    status: 'credit' | 'debit' | 'balanced'; // credit = له مستحق، debit = عليه سلفة زائدة
  };
  getEmployeeStatement: (employeeId: string, filterMonth?: string) => {
    transactions: EmployeeTransaction[];
    baseSalary: number;
    totalSalariesAccrued: number;
    totalCommissions: number;
    totalBonuses: number;
    totalDeductions: number;
    totalAdvances: number;
    totalPayouts: number;
    netDue: number;
  };
  
  // Invoices
  addInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt' | 'createdBy'>) => Invoice;
  updateInvoice: (id: string, invoice: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;
  
  // Vouchers
  addVoucher: (voucher: Omit<Voucher, 'id' | 'createdAt' | 'createdBy'>) => Voucher;
  updateVoucher: (id: string, voucher: Partial<Voucher>) => void;
  deleteVoucher: (id: string) => void;
  
  // Treasuries
  addTreasury: (treasury: Omit<Treasury, 'id' | 'createdAt'>) => void;
  updateTreasury: (id: string, treasury: Partial<Treasury>) => void;
  deleteTreasury: (id: string) => void;
  transferBetweenTreasuries: (fromId: string, toId: string, amount: number, notes?: string, date?: string) => void;
  directTreasuryAction: (treasuryId: string, type: 'deposit' | 'withdrawal', amount: number, notes: string, date?: string) => void;
  
  // Parties
  addParty: (party: Omit<Party, 'id' | 'createdAt'>) => Party;
  updateParty: (id: string, party: Partial<Party>) => void;
  deleteParty: (id: string) => void;
  regeneratePartyPortalToken: (partyId: string) => void;
  togglePartyPortalActive: (partyId: string) => boolean;
  
  // Employees
  addEmployee: (emp: Omit<Employee, 'id' | 'createdAt'>) => void;
  updateEmployee: (id: string, emp: Partial<Employee>) => void;
  updateEmployeeStatus: (id: string, status: EmployeeStatus) => void;
  deleteEmployee: (id: string) => void;
  addEmployeeTransaction: (tx: Omit<EmployeeTransaction, 'id' | 'createdAt' | 'createdBy'>) => void;
  deleteEmployeeTransaction: (id: string) => void;
  accrueEmployeeSalary: (employeeId: string, month: string, customAmount?: number, notes?: string) => void;
  payEmployeeViaVoucher: (
    employeeId: string,
    amount: number,
    treasuryId: string,
    paymentMethod: PaymentMethod,
    month?: string,
    notes?: string
  ) => void;
  
  // Expense Categories
  addExpenseCategory: (categoryName: string) => void;

  // Users & Permissions
  setCurrentUser: (user: User) => void;
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => void;
  updateUser: (id: string, user: Partial<User>) => void;
  deleteUser: (id: string) => void;
  
  // Settings & System
  updateSettings: (settings: Partial<CompanySettings>) => void;
  exportDatabase: () => void;
  importDatabase: (jsonContent: string) => boolean;
  resetToDemoData: () => void;

  // Fiscal Years & System Zeroing
  closeFiscalYear: (params: {
    yearToClose: string;
    nextYear: string;
    notes?: string;
    rolloverParties?: boolean;
    rolloverTreasuries?: boolean;
    rolloverEmployees?: boolean;
    downloadBackup?: boolean;
  }) => FiscalYearArchive;
  deleteFiscalYearArchive: (id: string) => void;
  zeroOutSystem: (options: {
    mode: 'zero_balances_keep_names' | 'factory_clean_reset';
    notes?: string;
  }) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'simple_finance_system_v2';

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [bundle] = useState(() => loadSingleCompanyBundle());

  // Settings
  const [settings, setSettings] = useState<CompanySettings>(bundle.settings);

  // Parties
  const [parties, setParties] = useState<Party[]>(bundle.parties);

  // Treasuries
  const [treasuries, setTreasuries] = useState<Treasury[]>(bundle.treasuries);

  // Transfers
  const [transfers, setTransfers] = useState<TreasuryTransfer[]>(bundle.transfers);

  // Invoices
  const [invoices, setInvoices] = useState<Invoice[]>(bundle.invoices);

  // Vouchers
  const [vouchers, setVouchers] = useState<Voucher[]>(bundle.vouchers);

  // Employees
  const [employees, setEmployees] = useState<Employee[]>(bundle.employees);

  // Employee Transactions
  const [employeeTransactions, setEmployeeTransactions] = useState<EmployeeTransaction[]>(
    bundle.employeeTransactions
  );

  // Users
  const [users, setUsers] = useState<User[]>(bundle.users);

  // Current logged in user
  const [currentUser, setCurrentUser] = useState<User>(bundle.currentUser);

  // System Lock State
  const [isLocked, setIsLocked] = useState<boolean>(bundle.isLocked);

  // Closed Fiscal Years Archive
  const [fiscalYears, setFiscalYears] = useState<FiscalYearArchive[]>(bundle.fiscalYears);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Sync single-company state to LocalStorage
  useEffect(() => {
    saveSingleCompanyItem('settings', settings);
    saveSingleCompanyItem('parties', parties);
    saveSingleCompanyItem('treasuries', treasuries);
    saveSingleCompanyItem('transfers', transfers);
    saveSingleCompanyItem('invoices', invoices);
    saveSingleCompanyItem('vouchers', vouchers);
    saveSingleCompanyItem('employees', employees);
    saveSingleCompanyItem('emp_tx', employeeTransactions);
    saveSingleCompanyItem('users', users);
    saveSingleCompanyItem('currentUser', currentUser);
    saveSingleCompanyItem('isLocked', isLocked);
    saveSingleCompanyItem('fiscal_years', fiscalYears);
  }, [
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
  ]);

  const addToast = (type: ToastMessage['type'], title: string, message?: string) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Lock and Unlock logic
  const lockSystem = () => {
    setIsLocked(true);
    addToast('info', 'تم قفل النظام', 'أدخل كلمة المرور لإعادة الفتح');
  };

  const unlockSystem = (password: string): boolean => {
    if (!currentUser.password || currentUser.password === password) {
      setIsLocked(false);
      addToast('success', 'تم فتح النظام بنجاح', `مرحباً بك، ${currentUser.fullName}`);
      return true;
    }
    addToast('error', 'كلمة المرور غير صحيحة');
    return false;
  };

  const switchUserWithPassword = (userId: string, password: string): boolean => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) {
      addToast('error', 'المستخدم غير موجود');
      return false;
    }

    if (!targetUser.password || targetUser.password === password) {
      setCurrentUser(targetUser);
      setIsLocked(false);
      addToast('success', `تم تسجيل الدخول بنجاح`, `مرحباً، ${targetUser.fullName}`);
      return true;
    }

    addToast('error', 'كلمة المرور غير صحيحة لهذا المستخدم');
    return false;
  };

  // Calculations: Treasury Balance
  const getTreasuryBalance = (treasuryId: string): number => {
    const target = treasuries.find((t) => t.id === treasuryId);
    if (!target) return 0;

    let balance = Number(target.openingBalance) || 0;

    // Invoices paid directly through this treasury
    invoices.forEach((inv) => {
      if (inv.treasuryId === treasuryId && inv.paidAmount > 0) {
        if (inv.type === 'sale') {
          balance += Number(inv.paidAmount); // وارد
        } else if (inv.type === 'purchase' || inv.type === 'expense') {
          balance -= Number(inv.paidAmount); // صادر
        }
      }
    });

    // Vouchers (سندات القبض والصرف)
    vouchers.forEach((v) => {
      if (v.treasuryId === treasuryId) {
        if (v.type === 'receipt') {
          balance += Number(v.amount); // قبض = وارد للخزينة
        } else if (v.type === 'payment') {
          balance -= Number(v.amount); // صرف = صادر من الخزينة
        }
      }
    });

    // Employee Direct Cash Payouts / Advances that weren't recorded as vouchers
    employeeTransactions.forEach((tx) => {
      if (tx.treasuryId === treasuryId && !tx.voucherId) {
        if (tx.type === 'advance' || tx.type === 'payout') {
          balance -= Number(tx.amount); // صادر
        }
      }
    });

    // Internal Transfers
    transfers.forEach((tr) => {
      if (tr.toTreasuryId === treasuryId) {
        balance += Number(tr.amount);
      }
      if (tr.fromTreasuryId === treasuryId) {
        balance -= Number(tr.amount);
      }
    });

    return balance;
  };

  const getTotalLiquidity = () => {
    let total = 0;
    let cash = 0;
    let bank = 0;

    treasuries.forEach((t) => {
      const bal = getTreasuryBalance(t.id);
      total += bal;
      if (t.type === 'cash') {
        cash += bal;
      } else {
        bank += bal;
      }
    });

    return { total, cash, bank };
  };

  // Calculations: Party Balance
  const getPartyBalance = (partyId: string) => {
    const party = parties.find((p) => p.id === partyId);
    if (!party) return { debit: 0, credit: 0, net: 0, status: 'balanced' as const };

    let debit = 0; // مدين (عليه للمنشأة)
    let credit = 0; // دائن (له على المنشأة)

    // الرصيد الافتتاحي
    if (party.openingBalance > 0) {
      if (party.openingBalanceType === 'debit') {
        debit += Number(party.openingBalance);
      } else {
        credit += Number(party.openingBalance);
      }
    }

    // الفواتير
    invoices.forEach((inv) => {
      if (inv.partyId === partyId) {
        if (inv.type === 'sale') {
          debit += Number(inv.totalAmount);
          if (inv.paidAmount > 0) {
            credit += Number(inv.paidAmount);
          }
        } else if (inv.type === 'purchase') {
          credit += Number(inv.totalAmount);
          if (inv.paidAmount > 0) {
            debit += Number(inv.paidAmount);
          }
        } else if (inv.type === 'expense') {
          credit += Number(inv.totalAmount);
          if (inv.paidAmount > 0) {
            debit += Number(inv.paidAmount);
          }
        }
      }
    });

    // السندات
    vouchers.forEach((v) => {
      if (v.partyId === partyId) {
        if (v.type === 'receipt') {
          credit += Number(v.amount);
        } else if (v.type === 'payment') {
          debit += Number(v.amount);
        }
      }
    });

    const net = debit - credit;
    let status: 'debit' | 'credit' | 'balanced' = 'balanced';
    if (net > 0.001) status = 'debit';
    else if (net < -0.001) status = 'credit';

    return { debit, credit, net, status };
  };

  const getPartyStatement = (partyId: string): StatementItem[] => {
    const party = parties.find((p) => p.id === partyId);
    if (!party) return [];

    const items: Array<{
      id: string;
      date: string;
      type: string;
      refNumber: string;
      description: string;
      debit: number;
      credit: number;
      timestamp: number;
    }> = [];

    if (party.openingBalance > 0) {
      items.push({
        id: 'opening',
        date: party.createdAt || '2026-01-01',
        type: 'رصيد سابق / افتتاحي',
        refNumber: '-',
        description: 'رصيد افتتاحي مسجل في بطاقة الحساب',
        debit: party.openingBalanceType === 'debit' ? party.openingBalance : 0,
        credit: party.openingBalanceType === 'credit' ? party.openingBalance : 0,
        timestamp: new Date(party.createdAt || '2026-01-01').getTime(),
      });
    }

    invoices.forEach((inv) => {
      if (inv.partyId === partyId) {
        if (inv.type === 'sale') {
          items.push({
            id: `inv_${inv.id}`,
            date: inv.date,
            type: 'فاتورة مبيعات ورقية',
            refNumber: inv.invoiceNumber,
            description: inv.notes || 'فاتورة مبيعات ورقية',
            debit: inv.totalAmount,
            credit: 0,
            timestamp: new Date(inv.date).getTime(),
          });
          if (inv.paidAmount > 0) {
            items.push({
              id: `inv_paid_${inv.id}`,
              date: inv.date,
              type: 'سداد فوري مع الفاتورة',
              refNumber: inv.invoiceNumber,
              description: `سداد فوري لفاتورة ${inv.invoiceNumber}`,
              debit: 0,
              credit: inv.paidAmount,
              timestamp: new Date(inv.date).getTime() + 1,
            });
          }
        } else if (inv.type === 'purchase') {
          items.push({
            id: `inv_${inv.id}`,
            date: inv.date,
            type: 'فاتورة مشتريات ورقية',
            refNumber: inv.invoiceNumber,
            description: inv.notes || 'فاتورة مشتريات ورقية',
            debit: 0,
            credit: inv.totalAmount,
            timestamp: new Date(inv.date).getTime(),
          });
          if (inv.paidAmount > 0) {
            items.push({
              id: `inv_paid_${inv.id}`,
              date: inv.date,
              type: 'سداد فوري مع الفاتورة',
              refNumber: inv.invoiceNumber,
              description: `دفعة فورية لفاتورة مشتريات ${inv.invoiceNumber}`,
              debit: inv.paidAmount,
              credit: 0,
              timestamp: new Date(inv.date).getTime() + 1,
            });
          }
        } else if (inv.type === 'expense') {
          items.push({
            id: `inv_${inv.id}`,
            date: inv.date,
            type: 'فاتورة مصروفات',
            refNumber: inv.invoiceNumber,
            description: inv.notes || `مصروفات ${inv.expenseCategory || ''}`,
            debit: 0,
            credit: inv.totalAmount,
            timestamp: new Date(inv.date).getTime(),
          });
          if (inv.paidAmount > 0) {
            items.push({
              id: `inv_paid_${inv.id}`,
              date: inv.date,
              type: 'سداد فوري لمصروف',
              refNumber: inv.invoiceNumber,
              description: `سداد فوري لفاتورة مصروف ${inv.invoiceNumber}`,
              debit: inv.paidAmount,
              credit: 0,
              timestamp: new Date(inv.date).getTime() + 1,
            });
          }
        }
      }
    });

    vouchers.forEach((v) => {
      if (v.partyId === partyId) {
        if (v.type === 'receipt') {
          items.push({
            id: `vouch_${v.id}`,
            date: v.date,
            type: 'سند قبض',
            refNumber: v.voucherNumber,
            description: v.notes || `سند قبض نقدي/مصرفي`,
            debit: 0,
            credit: v.amount,
            timestamp: new Date(v.date).getTime(),
          });
        } else if (v.type === 'payment') {
          items.push({
            id: `vouch_${v.id}`,
            date: v.date,
            type: 'سند صرف',
            refNumber: v.voucherNumber,
            description: v.notes || `سند صرف نقدي/مصرفي`,
            debit: v.amount,
            credit: 0,
            timestamp: new Date(v.date).getTime(),
          });
        }
      }
    });

    items.sort((a, b) => a.timestamp - b.timestamp);

    let currentBalance = 0;
    return items.map((item) => {
      currentBalance += item.debit - item.credit;
      return {
        id: item.id,
        date: item.date,
        type: item.type,
        refNumber: item.refNumber,
        description: item.description,
        debit: item.debit,
        credit: item.credit,
        balance: currentBalance,
      };
    });
  };

  const getTreasuryStatement = (treasuryId: string): StatementItem[] => {
    const treasury = treasuries.find((t) => t.id === treasuryId);
    if (!treasury) return [];

    const items: Array<{
      id: string;
      date: string;
      type: string;
      refNumber: string;
      description: string;
      incoming: number;
      outgoing: number;
      timestamp: number;
    }> = [];

    if (treasury.openingBalance > 0) {
      items.push({
        id: 'opening',
        date: treasury.createdAt || '2026-01-01',
        type: 'رصيد افتتاحي',
        refNumber: '-',
        description: 'رصيد بداية المدة للخزينة/المصرف',
        incoming: treasury.openingBalance,
        outgoing: 0,
        timestamp: new Date(treasury.createdAt || '2026-01-01').getTime(),
      });
    }

    invoices.forEach((inv) => {
      if (inv.treasuryId === treasuryId && inv.paidAmount > 0) {
        if (inv.type === 'sale') {
          items.push({
            id: `inv_${inv.id}`,
            date: inv.date,
            type: 'تحصيل فاتورة بيع فورية',
            refNumber: inv.invoiceNumber,
            description: `قبض فوري من ${inv.partyName} (فاتورة: ${inv.invoiceNumber})`,
            incoming: inv.paidAmount,
            outgoing: 0,
            timestamp: new Date(inv.date).getTime(),
          });
        } else {
          items.push({
            id: `inv_${inv.id}`,
            date: inv.date,
            type: inv.type === 'purchase' ? 'سداد فاتورة مشتريات فورية' : 'سداد فاتورة مصروفات',
            refNumber: inv.invoiceNumber,
            description: `دفع فوري إلى ${inv.partyName} (فاتورة: ${inv.invoiceNumber})`,
            incoming: 0,
            outgoing: inv.paidAmount,
            timestamp: new Date(inv.date).getTime(),
          });
        }
      }
    });

    vouchers.forEach((v) => {
      if (v.treasuryId === treasuryId) {
        if (v.type === 'receipt') {
          items.push({
            id: `vouch_${v.id}`,
            date: v.date,
            type: 'سند قبض',
            refNumber: v.voucherNumber,
            description: `قبض من: ${v.partyName || v.employeeName || 'حساب نقدي'} - ${v.notes || ''}`,
            incoming: v.amount,
            outgoing: 0,
            timestamp: new Date(v.date).getTime(),
          });
        } else {
          items.push({
            id: `vouch_${v.id}`,
            date: v.date,
            type: 'سند صرف',
            refNumber: v.voucherNumber,
            description: `صرف إلى: ${v.partyName || v.employeeName || 'مصروف'} - ${v.notes || ''}`,
            incoming: 0,
            outgoing: v.amount,
            timestamp: new Date(v.date).getTime(),
          });
        }
      }
    });

    employeeTransactions.forEach((tx) => {
      if (tx.treasuryId === treasuryId && !tx.voucherId) {
        if (tx.type === 'advance' || tx.type === 'payout') {
          items.push({
            id: `etx_${tx.id}`,
            date: tx.date,
            type: tx.type === 'advance' ? 'سلفة موظف نقدية' : 'صرف راتب / مستحقات',
            refNumber: '-',
            description: `${tx.type === 'advance' ? 'سلفة' : 'صرف مستحقات'} للموظف: ${tx.employeeName} (${tx.notes || ''})`,
            incoming: 0,
            outgoing: tx.amount,
            timestamp: new Date(tx.date).getTime(),
          });
        }
      }
    });

    transfers.forEach((tr) => {
      if (tr.toTreasuryId === treasuryId) {
        items.push({
          id: `tr_in_${tr.id}`,
          date: tr.date,
          type: 'تحويل وارد',
          refNumber: '-',
          description: `تحويل وارد من ${tr.fromTreasuryName} (${tr.notes || ''})`,
          incoming: tr.amount,
          outgoing: 0,
          timestamp: new Date(tr.date).getTime(),
        });
      }
      if (tr.fromTreasuryId === treasuryId) {
        items.push({
          id: `tr_out_${tr.id}`,
          date: tr.date,
          type: 'تحويل صادر',
          refNumber: '-',
          description: `تحويل صادر إلى ${tr.toTreasuryName} (${tr.notes || ''})`,
          incoming: 0,
          outgoing: tr.amount,
          timestamp: new Date(tr.date).getTime(),
        });
      }
    });

    items.sort((a, b) => a.timestamp - b.timestamp);

    let running = 0;
    return items.map((item) => {
      running += item.incoming - item.outgoing;
      return {
        id: item.id,
        date: item.date,
        type: item.type,
        refNumber: item.refNumber,
        description: item.description,
        debit: item.incoming,
        credit: item.outgoing,
        balance: running,
      };
    });
  };

  // Calculations: Employee Balance (الترصيد الدقيق للموظف مثل بطاقة العميل والمورد)
  const getEmployeeBalance = (employeeId: string) => {
    const emp = employees.find((e) => e.id === employeeId);
    if (!emp) return { entitlements: 0, paidAndDeducted: 0, net: 0, status: 'balanced' as const };

    let entitlements = 0; // دائن - مستحق للموظف على المنشأة (رواتب مثبتة + عمولات + مكافآت)
    let paidAndDeducted = 0; // مدين - ما تم صرفه له أو خصمه أو سلف

    // Opening balance
    if (emp.openingBalance && emp.openingBalance > 0) {
      if (emp.openingBalanceType === 'credit') {
        entitlements += Number(emp.openingBalance);
      } else {
        paidAndDeducted += Number(emp.openingBalance);
      }
    }

    // All employee transactions
    const txs = employeeTransactions.filter((tx) => tx.employeeId === employeeId);
    txs.forEach((tx) => {
      const amt = Number(tx.amount) || 0;
      if (tx.type === 'salary' || tx.type === 'commission' || tx.type === 'bonus') {
        entitlements += amt;
      } else if (tx.type === 'advance' || tx.type === 'deduction' || tx.type === 'payout') {
        paidAndDeducted += amt;
      }
    });

    // Also check payment vouchers specifically issued to this employee
    vouchers.forEach((v) => {
      if (v.employeeId === employeeId && v.type === 'payment') {
        // If this voucher is not already tracked in employeeTransactions with voucherId
        const alreadyTracked = txs.some((tx) => tx.voucherId === v.id);
        if (!alreadyTracked) {
          paidAndDeducted += Number(v.amount);
        }
      }
    });

    const net = entitlements - paidAndDeducted;
    let status: 'credit' | 'debit' | 'balanced' = 'balanced';
    if (net > 0.001) status = 'credit'; // له رصيد
    else if (net < -0.001) status = 'debit'; // عليه سلف

    return { entitlements, paidAndDeducted, net, status };
  };

  const getEmployeeStatement = (employeeId: string, filterMonth?: string) => {
    const emp = employees.find((e) => e.id === employeeId);
    const baseSalary = emp ? Number(emp.baseSalary) : 0;

    let txs = employeeTransactions.filter((tx) => tx.employeeId === employeeId);
    if (filterMonth) {
      txs = txs.filter((tx) => tx.month === filterMonth);
    }

    let totalSalariesAccrued = 0;
    let totalCommissions = 0;
    let totalBonuses = 0;
    let totalDeductions = 0;
    let totalAdvances = 0;
    let totalPayouts = 0;

    txs.forEach((tx) => {
      const amt = Number(tx.amount) || 0;
      switch (tx.type) {
        case 'salary':
          totalSalariesAccrued += amt;
          break;
        case 'commission':
          totalCommissions += amt;
          break;
        case 'bonus':
          totalBonuses += amt;
          break;
        case 'deduction':
          totalDeductions += amt;
          break;
        case 'advance':
          totalAdvances += amt;
          break;
        case 'payout':
          totalPayouts += amt;
          break;
      }
    });

    let openingCredit = 0;
    let openingDebit = 0;
    if (emp && emp.openingBalance && !filterMonth) {
      if (emp.openingBalanceType === 'credit') {
        openingCredit = Number(emp.openingBalance);
      } else {
        openingDebit = Number(emp.openingBalance);
      }
    }

    const netDue =
      (totalSalariesAccrued || (!filterMonth ? baseSalary : 0)) +
      totalCommissions +
      totalBonuses +
      openingCredit -
      totalDeductions -
      totalAdvances -
      totalPayouts -
      openingDebit;

    return {
      transactions: txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      baseSalary,
      totalSalariesAccrued,
      totalCommissions,
      totalBonuses,
      totalDeductions,
      totalAdvances,
      totalPayouts,
      netDue,
      openingBalance: emp?.openingBalance || 0,
      openingBalanceType: emp?.openingBalanceType || 'credit',
    };
  };

  // Actions: Invoices
  const addInvoice = (invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'createdBy'>) => {
    const newId = `inv_${Date.now()}`;
    const newInvoice: Invoice = {
      ...invoiceData,
      id: newId,
      createdBy: currentUser.fullName,
      createdAt: new Date().toISOString(),
    };

    setInvoices((prev) => [newInvoice, ...prev]);

    // إذا كانت فاتورة مبيعات وتم تحديد نسبة موظف: تقيد تلقائياً في حسابه
    if (
      newInvoice.type === 'sale' &&
      newInvoice.hasEmployeeCommission &&
      newInvoice.employeeId &&
      newInvoice.commissionAmount &&
      newInvoice.commissionAmount > 0
    ) {
      const newTx: EmployeeTransaction = {
        id: `etx_${Date.now()}_comm`,
        employeeId: newInvoice.employeeId,
        employeeName: newInvoice.employeeName || '',
        type: 'commission',
        amount: newInvoice.commissionAmount,
        date: newInvoice.date,
        month: newInvoice.commissionMonth || newInvoice.date.substring(0, 7),
        invoiceId: newId,
        invoiceNumber: newInvoice.invoiceNumber,
        notes: `نسبة ${newInvoice.commissionRate}% من إجمالي فاتورة المبيعات الورقية رقم ${newInvoice.invoiceNumber}`,
        createdBy: currentUser.fullName,
        createdAt: new Date().toISOString(),
      };
      setEmployeeTransactions((prev) => [newTx, ...prev]);
    }

    addToast('success', 'تم حفظ الفاتورة بنجاح', `رقم الفاتورة: ${newInvoice.invoiceNumber}`);
    return newInvoice;
  };

  const updateInvoice = (id: string, updatedData: Partial<Invoice>) => {
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === id ? { ...inv, ...updatedData } : inv))
    );

    if (updatedData.type && updatedData.type !== 'sale') {
      setEmployeeTransactions((prev) => prev.filter((tx) => tx.invoiceId !== id));
    } else if (updatedData.hasEmployeeCommission !== undefined || updatedData.commissionAmount !== undefined) {
      setEmployeeTransactions((prev) => {
        const filtered = prev.filter((tx) => tx.invoiceId !== id);
        if (updatedData.hasEmployeeCommission && updatedData.employeeId && (updatedData.commissionAmount || 0) > 0) {
          filtered.unshift({
            id: `etx_${Date.now()}_comm_upd`,
            employeeId: updatedData.employeeId,
            employeeName: updatedData.employeeName || '',
            type: 'commission',
            amount: updatedData.commissionAmount || 0,
            date: updatedData.date || new Date().toISOString().substring(0, 10),
            month: updatedData.commissionMonth || (updatedData.date ? updatedData.date.substring(0, 7) : '2026-10'),
            invoiceId: id,
            invoiceNumber: updatedData.invoiceNumber || '',
            notes: `نسبة ${updatedData.commissionRate}% من فاتورة المبيعات الورقية ${updatedData.invoiceNumber}`,
            createdBy: currentUser.fullName,
            createdAt: new Date().toISOString(),
          });
        }
        return filtered;
      });
    }

    addToast('success', 'تم تعديل الفاتورة بنجاح');
  };

  const deleteInvoice = (id: string) => {
    setInvoices((prev) => prev.filter((inv) => inv.id !== id));
    setEmployeeTransactions((prev) => prev.filter((tx) => tx.invoiceId !== id));
    addToast('info', 'تم حذف الفاتورة');
  };

  // Actions: Vouchers
  const addVoucher = (voucherData: Omit<Voucher, 'id' | 'createdAt' | 'createdBy'>) => {
    const newVoucher: Voucher = {
      ...voucherData,
      id: `vouch_${Date.now()}`,
      createdBy: currentUser.fullName,
      createdAt: new Date().toISOString(),
    };
    setVouchers((prev) => [newVoucher, ...prev]);

    // إذا كان سند صرف لموظف: نسجل حركة صرف في حسابه
    if (newVoucher.partyType === 'employee' && newVoucher.employeeId && newVoucher.type === 'payment') {
      setEmployeeTransactions((prev) => [
        {
          id: `etx_${Date.now()}_vouch`,
          employeeId: newVoucher.employeeId!,
          employeeName: newVoucher.employeeName || '',
          type: newVoucher.subType === 'advance_payment' ? 'advance' : 'payout',
          amount: newVoucher.amount,
          date: newVoucher.date,
          month: newVoucher.date.substring(0, 7),
          voucherId: newVoucher.id,
          treasuryId: newVoucher.treasuryId,
          paymentMethod: newVoucher.paymentMethod,
          notes: newVoucher.notes || `صرف مستحقات بسند صرف رقم ${newVoucher.voucherNumber}`,
          createdBy: currentUser.fullName,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
    }

    addToast(
      'success',
      newVoucher.type === 'receipt' ? 'تم تسجيل سند القبض' : 'تم تسجيل سند الصرف',
      `رقم السند: ${newVoucher.voucherNumber}`
    );
    return newVoucher;
  };

  const updateVoucher = (id: string, updatedData: Partial<Voucher>) => {
    setVouchers((prev) => prev.map((v) => (v.id === id ? { ...v, ...updatedData } : v)));
    // Synchronize any employee transaction tied to this voucher
    setEmployeeTransactions((prev) =>
      prev.map((tx) => {
        if (tx.voucherId === id) {
          return {
            ...tx,
            amount: updatedData.amount !== undefined ? updatedData.amount : tx.amount,
            notes: updatedData.notes !== undefined ? updatedData.notes : tx.notes,
            date: updatedData.date !== undefined ? updatedData.date : tx.date,
            treasuryId: updatedData.treasuryId !== undefined ? updatedData.treasuryId : tx.treasuryId,
            paymentMethod: updatedData.paymentMethod !== undefined ? updatedData.paymentMethod : tx.paymentMethod,
          };
        }
        return tx;
      })
    );
    addToast('success', 'تم تعديل السند بنجاح');
  };

  const deleteVoucher = (id: string) => {
    setVouchers((prev) => prev.filter((v) => v.id !== id));
    setEmployeeTransactions((prev) => prev.filter((tx) => tx.voucherId !== id));
    addToast('info', 'تم حذف السند');
  };

  // Actions: Treasuries
  const addTreasury = (data: Omit<Treasury, 'id' | 'createdAt'>) => {
    const newTreasury: Treasury = {
      ...data,
      id: `treasury_${Date.now()}`,
      createdAt: new Date().toISOString().substring(0, 10),
    };
    setTreasuries((prev) => [...prev, newTreasury]);
    addToast('success', 'تمت إضافة الخزينة/المصرف بنجاح', newTreasury.name);
  };

  const updateTreasury = (id: string, data: Partial<Treasury>) => {
    setTreasuries((prev) => prev.map((t) => (t.id === id ? { ...t, ...data } : t)));
    addToast('success', 'تم تعديل بيانات الخزينة/المصرف');
  };

  const deleteTreasury = (id: string) => {
    if (treasuries.length <= 1) {
      addToast('error', 'لا يمكن حذف كافة الخزائن، يجب الإبقاء على خزينة واحدة على الأقل');
      return;
    }
    const currentBal = getTreasuryBalance(id);
    if (Math.abs(currentBal) > 0.01) {
      addToast('warning', `تنبيه: الخزينة المحذوفة كان بها رصيد (${currentBal.toLocaleString()} ${settings.currency})، يُنصح بتسوية أو تحويل الرصيد`);
    }
    setTreasuries((prev) => prev.filter((t) => t.id !== id));
    addToast('info', 'تم حذف الخزينة');
  };

  const transferBetweenTreasuries = (
    fromId: string,
    toId: string,
    amount: number,
    notes?: string,
    date?: string
  ) => {
    if (!amount || amount <= 0) {
      addToast('error', 'يرجى إدخال مبلغ تحويل صحيح أكبر من الصفر');
      return;
    }
    const from = treasuries.find((t) => t.id === fromId);
    const to = treasuries.find((t) => t.id === toId);
    if (!from || !to) {
      addToast('error', 'الخزينة المحددة غير موجودة');
      return;
    }
    if (fromId === toId) {
      addToast('warning', 'لا يمكن التحويل لنفس الخزينة');
      return;
    }

    const fromBalance = getTreasuryBalance(fromId);
    if (fromBalance < amount) {
      addToast('warning', `تنبيه: رصيد الخزينة المحول منها (${fromBalance.toLocaleString()}) أقل من مبلغ التحويل (${amount.toLocaleString()})`);
    }

    const transferDate = date || new Date().toISOString().substring(0, 10);
    const newTransfer: TreasuryTransfer = {
      id: `tr_${Date.now()}`,
      fromTreasuryId: from.id,
      fromTreasuryName: from.name,
      toTreasuryId: to.id,
      toTreasuryName: to.name,
      amount,
      date: transferDate,
      notes,
      createdBy: currentUser.fullName,
      createdAt: new Date().toISOString(),
    };

    setTransfers((prev) => [newTransfer, ...prev]);
    addToast('success', 'تم تنفيذ التحويل بنجاح', `من ${from.name} إلى ${to.name} بقيمة ${amount} ${settings.currency}`);
  };

  const directTreasuryAction = (
    treasuryId: string,
    type: 'deposit' | 'withdrawal',
    amount: number,
    notes: string,
    date?: string
  ) => {
    const treasury = treasuries.find((t) => t.id === treasuryId);
    if (!treasury) return;

    const opDate = date || new Date().toISOString().substring(0, 10);
    const voucherNumber = `${type === 'deposit' ? 'DEP' : 'WTH'}-${Date.now().toString().slice(-4)}`;

    const newVoucher: Voucher = {
      id: `vouch_${Date.now()}`,
      voucherNumber,
      type: type === 'deposit' ? 'receipt' : 'payment',
      subType: type === 'deposit' ? 'direct_deposit' : 'direct_withdrawal',
      partyType: 'none',
      amount,
      paymentMethod: 'cash',
      treasuryId,
      date: opDate,
      notes: notes || (type === 'deposit' ? 'إيداع نقدي مباشر' : 'سحب نقدي مباشر'),
      createdBy: currentUser.fullName,
      createdAt: new Date().toISOString(),
    };

    setVouchers((prev) => [newVoucher, ...prev]);
    addToast(
      'success',
      type === 'deposit' ? 'تم الإيداع المباشر بنجاح' : 'تم السحب المباشر بنجاح',
      `${treasury.name} - ${amount} ${settings.currency}`
    );
  };

  // Actions: Parties
  const addParty = (data: Omit<Party, 'id' | 'createdAt'>): Party => {
    const newParty: Party = {
      ...data,
      portalToken: data.portalToken || generatePortalToken(),
      isPortalActive: data.isPortalActive !== undefined ? data.isPortalActive : true,
      id: `party_${Date.now()}`,
      createdAt: new Date().toISOString().substring(0, 10),
    };
    setParties((prev) => [...prev, newParty]);
    addToast('success', 'تمت إضافة بطاقة الحساب بنجاح', newParty.name);
    return newParty;
  };

  const updateParty = (id: string, data: Partial<Party>) => {
    setParties((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)));
    addToast('success', 'تم تعديل بيانات الحساب');
  };

  const deleteParty = (id: string) => {
    const party = parties.find((p) => p.id === id);
    if (party?.isSystem) {
      addToast('error', 'لا يمكن حذف الحساب النقدي الافتراضي');
      return;
    }
    setParties((prev) => prev.filter((p) => p.id !== id));
    addToast('info', 'تم حذف الحساب');
  };

  const regeneratePartyPortalToken = (partyId: string) => {
    const newToken = generatePortalToken();
    setParties((prev) =>
      prev.map((p) => (p.id === partyId ? { ...p, portalToken: newToken, isPortalActive: true } : p))
    );
  };

  const togglePartyPortalActive = (partyId: string): boolean => {
    const target = parties.find((p) => p.id === partyId);
    const nextState = target ? target.isPortalActive === false : true;
    setParties((prev) =>
      prev.map((p) => (p.id === partyId ? { ...p, isPortalActive: nextState } : p))
    );
    return nextState;
  };

  // Actions: Employees
  const addEmployee = (data: Omit<Employee, 'id' | 'createdAt'>) => {
    const newEmp: Employee = {
      ...data,
      id: `emp_${Date.now()}`,
      status: data.status || 'active',
      createdAt: new Date().toISOString().substring(0, 10),
    };
    setEmployees((prev) => [...prev, newEmp]);
    addToast('success', 'تمت إضافة بطاقة الموظف بنجاح', newEmp.name);
  };

  const updateEmployee = (id: string, data: Partial<Employee>) => {
    setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, ...data } : e)));
    addToast('success', 'تم تعديل بيانات الموظف');
  };

  const updateEmployeeStatus = (id: string, status: EmployeeStatus) => {
    const emp = employees.find((e) => e.id === id);
    if (!emp) return;

    setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, status } : e)));
    const statusLabel =
      status === 'active'
        ? 'نشط'
        : status === 'on_leave'
        ? 'إيقاف مؤقت (إجازة بدون راتب)'
        : 'موقوف';
    addToast('info', `تم تغيير حالة الموظف ${emp.name}`, statusLabel);
  };

  const deleteEmployee = (id: string) => {
    setEmployees((prev) => prev.filter((e) => e.id !== id));
    setEmployeeTransactions((prev) => prev.filter((tx) => tx.employeeId !== id));
    addToast('info', 'تم حذف الموظف');
  };

  const addEmployeeTransaction = (txData: Omit<EmployeeTransaction, 'id' | 'createdAt' | 'createdBy'>) => {
    let linkedVoucherId: string | undefined = txData.voucherId;

    // إذا كانت سلفة أو صرف راتب مع تحديد خزينة: يتم إنشاء سند صرف رسمي مرتبط
    if ((txData.type === 'advance' || txData.type === 'payout') && txData.treasuryId && !linkedVoucherId) {
      const voucherNum = `PAY-EMP-${Date.now().toString().slice(-4)}`;
      linkedVoucherId = `vouch_${Date.now()}_emp`;
      const v: Voucher = {
        id: linkedVoucherId,
        voucherNumber: voucherNum,
        type: 'payment',
        subType: txData.type === 'advance' ? 'advance_payment' : 'salary_payout',
        partyType: 'employee',
        employeeId: txData.employeeId,
        employeeName: txData.employeeName,
        amount: txData.amount,
        paymentMethod: txData.paymentMethod || 'cash',
        treasuryId: txData.treasuryId,
        date: txData.date,
        notes: `${txData.type === 'advance' ? 'سلفة موظف' : 'صرف مستحقات موظف'}: ${txData.employeeName} (${txData.notes || ''})`,
        createdBy: currentUser.fullName,
        createdAt: new Date().toISOString(),
      };
      setVouchers((vprev) => [v, ...vprev]);
    }

    const newTx: EmployeeTransaction = {
      ...txData,
      id: `etx_${Date.now()}`,
      voucherId: linkedVoucherId,
      createdBy: currentUser.fullName,
      createdAt: new Date().toISOString(),
    };
    setEmployeeTransactions((prev) => [newTx, ...prev]);

    addToast('success', 'تم تسجيل العملية للموظف بنجاح', `${txData.employeeName} - ${txData.amount} ${settings.currency}`);
  };

  const deleteEmployeeTransaction = (id: string) => {
    const target = employeeTransactions.find((tx) => tx.id === id);
    if (target?.voucherId) {
      setVouchers((prev) => prev.filter((v) => v.id !== target.voucherId));
    }
    setEmployeeTransactions((prev) => prev.filter((tx) => tx.id !== id));
    addToast('info', 'تم حذف قيد الموظف');
  };

  // إثبات استحقاق الراتب الشهري وترصيده في حساب الموظف
  const accrueEmployeeSalary = (
    employeeId: string,
    month: string,
    customAmount?: number,
    notes?: string
  ) => {
    const emp = employees.find((e) => e.id === employeeId);
    if (!emp) return;

    if (emp.status === 'on_leave') {
      addToast('warning', `تنبيه: الموظف ${emp.name} في حالة إيقاف مؤقت (إجازة بدون راتب)`);
    }

    const alreadyAccrued = employeeTransactions.some(
      (tx) => tx.employeeId === employeeId && tx.type === 'salary' && tx.month === month
    );
    if (alreadyAccrued) {
      addToast('warning', `تنبيه: تم إثبات راتب شهر ${month} للموظف (${emp.name}) مسبقاً`);
    }

    const salaryAmount = customAmount !== undefined ? customAmount : emp.baseSalary;
    if (salaryAmount <= 0 && emp.status !== 'on_leave') {
      addToast('error', 'الراتب الأساسي للموظف 0');
      return;
    }

    const newTx: EmployeeTransaction = {
      id: `etx_${Date.now()}_salary`,
      employeeId: emp.id,
      employeeName: emp.name,
      type: 'salary',
      amount: salaryAmount,
      date: new Date().toISOString().substring(0, 10),
      month,
      notes: notes || `إثبات استحقاق راتب شهر ${month} للموظف ${emp.name}`,
      createdBy: currentUser.fullName,
      createdAt: new Date().toISOString(),
    };

    setEmployeeTransactions((prev) => [newTx, ...prev]);
    addToast('success', `تم إثبات وترصيد راتب شهر ${month}`, `${emp.name} بمبلغ ${salaryAmount} ${settings.currency}`);
  };

  // صرف مستحقات الموظف عن طريق سند صرف رسمي
  const payEmployeeViaVoucher = (
    employeeId: string,
    amount: number,
    treasuryId: string,
    paymentMethod: PaymentMethod,
    month?: string,
    notes?: string
  ) => {
    const emp = employees.find((e) => e.id === employeeId);
    if (!emp) return;

    const opDate = new Date().toISOString().substring(0, 10);
    const voucherNumber = `PAY-SAL-${Date.now().toString().slice(-4)}`;
    const voucherId = `vouch_${Date.now()}`;

    // 1. Create Payment Voucher
    const newVoucher: Voucher = {
      id: voucherId,
      voucherNumber,
      type: 'payment',
      subType: 'salary_payout',
      partyType: 'employee',
      employeeId: emp.id,
      employeeName: emp.name,
      amount,
      paymentMethod,
      treasuryId,
      date: opDate,
      notes: notes || `صرف مستحقات وراتب ${month ? `شهر ${month}` : ''} للموظف ${emp.name}`,
      createdBy: currentUser.fullName,
      createdAt: new Date().toISOString(),
    };

    setVouchers((prev) => [newVoucher, ...prev]);

    // 2. Create Employee Payout Transaction linked to the voucher
    const newTx: EmployeeTransaction = {
      id: `etx_${Date.now()}_payout`,
      employeeId: emp.id,
      employeeName: emp.name,
      type: 'payout',
      amount,
      date: opDate,
      month: month || opDate.substring(0, 7),
      voucherId,
      treasuryId,
      paymentMethod,
      notes: notes || `صرف مستحقات بسند صرف رقم ${voucherNumber}`,
      createdBy: currentUser.fullName,
      createdAt: new Date().toISOString(),
    };

    setEmployeeTransactions((prev) => [newTx, ...prev]);
    addToast('success', `تم إصدار سند صرف للموظف ${emp.name}`, `سند رقم: ${voucherNumber} بقيمة ${amount} ${settings.currency}`);
  };

  // Dynamic Expense Categories
  const addExpenseCategory = (categoryName: string) => {
    const trimmed = categoryName.trim();
    if (!trimmed) return;
    if (settings.expenseCategories.includes(trimmed)) {
      addToast('info', 'هذا التصنيف موجود بالفعل');
      return;
    }
    const updated = [...settings.expenseCategories, trimmed];
    setSettings((prev) => ({ ...prev, expenseCategories: updated }));
    addToast('success', 'تمت إضافة تصنيف المصروف الجديد بنجاح', trimmed);
  };

  // Actions: Users
  const addUser = (userData: Omit<User, 'id' | 'createdAt'>) => {
    const newUser: User = {
      ...userData,
      password: userData.password || '123',
      id: `usr_${Date.now()}`,
      createdAt: new Date().toISOString().substring(0, 10),
    };
    setUsers((prev) => [...prev, newUser]);
    addToast('success', 'تمت إضافة المستخدم بنجاح', newUser.fullName);
  };

  const updateUser = (id: string, data: Partial<User>) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const updated = { ...u, ...data };
          if (currentUser.id === id) {
            setCurrentUser(updated);
          }
          return updated;
        }
        return u;
      })
    );
    addToast('success', 'تم تعديل المستخدم والصلاحيات');
  };

  const deleteUser = (id: string) => {
    if (id === currentUser.id) {
      addToast('error', 'لا يمكنك حذف حسابك الحالي أثناء تسجيل الدخول به');
      return;
    }
    if (users.length <= 1) {
      addToast('error', 'يجب الإبقاء على مستخدم واحد على الأقل في النظام');
      return;
    }
    setUsers((prev) => prev.filter((u) => u.id !== id));
    addToast('info', 'تم حذف المستخدم');
  };

  const updateSettings = (newSettings: Partial<CompanySettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
    addToast('success', 'تم حفظ إعدادات النظام');
  };

  const exportDatabase = () => {
    const backupData = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      settings,
      parties,
      treasuries,
      transfers,
      invoices,
      vouchers,
      employees,
      employeeTransactions,
      users,
      fiscalYears,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `نسخة_احتياطية_المنظومة_المالية_${new Date().toISOString().substring(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    addToast('success', 'تم تصدير النسخة الاحتياطية بنجاح');
  };

  const importDatabase = (jsonContent: string): boolean => {
    try {
      const data = JSON.parse(jsonContent);
      if (data.parties && data.treasuries && data.invoices) {
        if (data.settings) setSettings(data.settings);
        if (data.parties) setParties(data.parties);
        if (data.treasuries) setTreasuries(data.treasuries);
        if (data.transfers) setTransfers(data.transfers);
        if (data.invoices) setInvoices(data.invoices);
        if (data.vouchers) setVouchers(data.vouchers);
        if (data.employees) setEmployees(data.employees);
        if (data.employeeTransactions) setEmployeeTransactions(data.employeeTransactions);
        if (data.users) setUsers(data.users);
        if (data.fiscalYears) setFiscalYears(data.fiscalYears);
        addToast('success', 'تمت استعادة البيانات بنجاح!');
        return true;
      }
      throw new Error('ملف غير صالح');
    } catch (e) {
      console.error(e);
      addToast('error', 'فشل استيراد الملف', 'تأكد من أن الملف بصيغة JSON صحيحة');
      return false;
    }
  };

  const resetToDemoData = () => {
    setSettings(initialCompanySettings);
    setParties(initialParties);
    setTreasuries(initialTreasuries);
    setTransfers([]);
    setInvoices(initialInvoices);
    setVouchers(initialVouchers);
    setEmployees(initialEmployees);
    setEmployeeTransactions(initialEmployeeTransactions);
    setUsers(initialUsers);
    setCurrentUser(initialUsers[0]);
    setIsLocked(false);
    addToast('info', 'تمت إعادة ضبط البيانات إلى القيم التجريبية الافتراضية');
  };

  // Close Fiscal Year & Open New Fiscal Year
  const closeFiscalYear = (params: {
    yearToClose: string;
    nextYear: string;
    notes?: string;
    rolloverParties?: boolean;
    rolloverTreasuries?: boolean;
    rolloverEmployees?: boolean;
    downloadBackup?: boolean;
  }): FiscalYearArchive => {
    // 1. Optional Safety Backup
    if (params.downloadBackup !== false) {
      try {
        exportDatabase();
      } catch (err) {
        console.warn('Auto backup before year closing failed:', err);
      }
    }

    // 2. Create Immutable Archive Snapshot of the closed year
    const archive = createFiscalYearArchive({
      year: params.yearToClose,
      closedBy: currentUser.fullName,
      notes: params.notes,
      invoices,
      vouchers,
      transfers,
      employeeTransactions,
      parties,
      treasuries,
      employees,
      getPartyBalance,
      getTreasuryBalance,
      getEmployeeBalance,
    });

    // 3. Save to Fiscal Years Archive
    setFiscalYears((prev) => [archive, ...prev.filter((y) => y.year !== params.yearToClose)]);

    // 4. Rollover Parties: Keep all parties and carry forward ending balances as new opening balances
    if (params.rolloverParties !== false) {
      const rolledOverParties = rolloverPartyBalances(parties, getPartyBalance);
      setParties(rolledOverParties);
    }

    // 5. Rollover Treasuries: Keep all accounts and carry forward actual liquidities as new opening balances
    if (params.rolloverTreasuries !== false) {
      const rolledOverTreasuries = rolloverTreasuryBalances(treasuries, getTreasuryBalance);
      setTreasuries(rolledOverTreasuries);
    }

    // 6. Rollover Employees: Keep all employees and carry forward their net due as opening balance
    if (params.rolloverEmployees !== false) {
      const rolledOverEmployees = rolloverEmployeeBalances(employees, getEmployeeBalance);
      setEmployees(rolledOverEmployees);
    }

    // 7. Clear current transactional data for the fresh new fiscal year
    setInvoices([]);
    setVouchers([]);
    setTransfers([]);
    setEmployeeTransactions([]);

    // 8. Update Company Settings with new fiscal year
    setSettings((prev) => ({
      ...prev,
      currentFiscalYear: params.nextYear,
      lastYearClosedAt: new Date().toISOString(),
    }));

    addToast(
      'success',
      `تم إقفال السنة المالية ${params.yearToClose} بنجاح`,
      `تم فتح السنة المالية الجديدة ${params.nextYear} وتدوير أرصدة العملاء والموردين والخزائن والموظفين بنجاح`
    );

    return archive;
  };

  const deleteFiscalYearArchive = (id: string) => {
    setFiscalYears((prev) => prev.filter((fy) => fy.id !== id));
    addToast('info', 'تم حذف أرشيف السنة المالية المحددة');
  };

  // Zero Out System / Factory Reset
  const zeroOutSystem = (options: {
    mode: 'zero_balances_keep_names' | 'factory_clean_reset';
    notes?: string;
  }) => {
    if (options.mode === 'zero_balances_keep_names') {
      // Keeps accounts, employees, treasuries, and settings, but resets transactions & balances to 0
      const zeroed = zeroOutAccountsAndEntities(parties, treasuries, employees);
      setParties(zeroed.parties);
      setTreasuries(zeroed.treasuries);
      setEmployees(zeroed.employees);
      setInvoices([]);
      setVouchers([]);
      setTransfers([]);
      setEmployeeTransactions([]);
      addToast(
        'success',
        'تم تصفير المنظومة والبدء من جديد بنجاح',
        'تم تفريغ كافة الفواتير والسندات وتصفير الأرصدة مع الاحتفاظ بأسماء الموظفين والزبائن والموردين والخزائن'
      );
    } else {
      // Complete clean factory reset
      const cleanCashParty: Party = {
        id: 'party_cash',
        name: 'حساب نقدي (زبون عابر / مشتريات نقدية)',
        type: 'both',
        phone: '-',
        address: 'المحل / نقدي',
        openingBalance: 0,
        openingBalanceType: 'debit',
        isSystem: true,
        portalToken: generatePortalToken(),
        isPortalActive: true,
        createdAt: new Date().toISOString().substring(0, 10),
      };

      const cleanMainTreasury: Treasury = {
        id: 'treasury_main_cash',
        name: 'الخزينة النقدية الرئيسية (الصندوق)',
        type: 'cash',
        openingBalance: 0,
        createdAt: new Date().toISOString().substring(0, 10),
      };

      setParties([cleanCashParty]);
      setTreasuries([cleanMainTreasury]);
      setEmployees([]);
      setInvoices([]);
      setVouchers([]);
      setTransfers([]);
      setEmployeeTransactions([]);
      addToast('success', 'تم تصفير المنظومة بالكامل والبدء بحساب نظيف جديد');
    }
  };

  return (
    <AppContext.Provider
      value={{
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
        fiscalYears,
        isLocked,
        lockSystem,
        unlockSystem,
        switchUserWithPassword,
        toasts,
        addToast,
        removeToast,
        getTreasuryBalance,
        getTotalLiquidity,
        getPartyBalance,
        getPartyStatement,
        getTreasuryStatement,
        getEmployeeBalance,
        getEmployeeStatement,
        addInvoice,
        updateInvoice,
        deleteInvoice,
        addVoucher,
        updateVoucher,
        deleteVoucher,
        addTreasury,
        updateTreasury,
        deleteTreasury,
        transferBetweenTreasuries,
        directTreasuryAction,
        addParty,
        updateParty,
        deleteParty,
        regeneratePartyPortalToken,
        togglePartyPortalActive,
        addEmployee,
        updateEmployee,
        updateEmployeeStatus,
        deleteEmployee,
        addEmployeeTransaction,
        deleteEmployeeTransaction,
        accrueEmployeeSalary,
        payEmployeeViaVoucher,
        addExpenseCategory,
        setCurrentUser,
        addUser,
        updateUser,
        deleteUser,
        updateSettings,
        exportDatabase,
        importDatabase,
        resetToDemoData,
        closeFiscalYear,
        deleteFiscalYearArchive,
        zeroOutSystem,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
