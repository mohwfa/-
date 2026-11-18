import {
  Invoice,
  Voucher,
  Party,
  Treasury,
  Employee,
  EmployeeTransaction,
  TreasuryTransfer,
  FiscalYearArchive,
} from '../types';

export interface FinancialSummaryData {
  salesTotal: number;
  purchasesTotal: number;
  expensesTotal: number;
  commissionsTotal: number;
  totalCosts: number;
  netProfit: number;
  profitMargin: number;
  invoicesCount: number;
  vouchersCount: number;
}

/**
 * Computes complete financial summary for a set of invoices and vouchers
 */
export const calculateFinancialSummary = (
  invoices: Invoice[],
  vouchers: Voucher[] = []
): FinancialSummaryData => {
  let salesTotal = 0;
  let purchasesTotal = 0;
  let expensesTotal = 0;
  let commissionsTotal = 0;

  invoices.forEach((inv) => {
    const amt = Number(inv.totalAmount) || 0;
    if (inv.type === 'sale') {
      salesTotal += amt;
    } else if (inv.type === 'purchase') {
      purchasesTotal += amt;
    } else if (inv.type === 'expense') {
      expensesTotal += amt;
    }

    if (inv.hasEmployeeCommission && inv.commissionAmount) {
      commissionsTotal += Number(inv.commissionAmount) || 0;
    }
  });

  const totalCosts = purchasesTotal + expensesTotal + commissionsTotal;
  const netProfit = salesTotal - totalCosts;
  const profitMargin = salesTotal > 0 ? (netProfit / salesTotal) * 100 : 0;

  return {
    salesTotal,
    purchasesTotal,
    expensesTotal,
    commissionsTotal,
    totalCosts,
    netProfit,
    profitMargin,
    invoicesCount: invoices.length,
    vouchersCount: vouchers.length,
  };
};

/**
 * Calculates new rolled-over opening balances for parties when closing a fiscal year.
 * Retains all party information while transferring their net ending debt/credit.
 */
export const rolloverPartyBalances = (
  parties: Party[],
  getPartyBalance: (partyId: string) => { debit: number; credit: number; net: number; status: 'debit' | 'credit' | 'balanced' }
): Party[] => {
  return parties.map((party) => {
    const balance = getPartyBalance(party.id);
    const absNet = Math.abs(balance.net);
    const roundedNet = Math.round(absNet * 100) / 100;

    return {
      ...party,
      openingBalance: roundedNet > 0.001 ? roundedNet : 0,
      openingBalanceType: balance.status === 'credit' ? 'credit' : 'debit',
    };
  });
};

/**
 * Calculates new rolled-over opening balances for treasuries when closing a fiscal year.
 * Retains all treasury and bank accounts while setting their actual ending liquidity as opening balance.
 */
export const rolloverTreasuryBalances = (
  treasuries: Treasury[],
  getTreasuryBalance: (treasuryId: string) => number
): Treasury[] => {
  return treasuries.map((treasury) => {
    const currentActualBalance = getTreasuryBalance(treasury.id);
    const roundedBalance = Math.round(currentActualBalance * 100) / 100;

    return {
      ...treasury,
      openingBalance: roundedBalance,
    };
  });
};

/**
 * Calculates new rolled-over opening balances for employees when closing a fiscal year.
 * Retains all employee details while transferring their net dues as opening balance.
 */
export const rolloverEmployeeBalances = (
  employees: Employee[],
  getEmployeeBalance: (employeeId: string) => { entitlements: number; paidAndDeducted: number; net: number; status: 'credit' | 'debit' | 'balanced' }
): Employee[] => {
  return employees.map((employee) => {
    const balance = getEmployeeBalance(employee.id);
    const absNet = Math.abs(balance.net);
    const roundedNet = Math.round(absNet * 100) / 100;

    return {
      ...employee,
      openingBalance: roundedNet > 0.001 ? roundedNet : 0,
      openingBalanceType: balance.status === 'debit' ? 'debit' : 'credit',
    };
  });
};

/**
 * Prepares a complete immutable fiscal year archive object
 */
export const createFiscalYearArchive = (params: {
  year: string;
  closedBy: string;
  notes?: string;
  invoices: Invoice[];
  vouchers: Voucher[];
  transfers: TreasuryTransfer[];
  employeeTransactions: EmployeeTransaction[];
  parties: Party[];
  treasuries: Treasury[];
  employees: Employee[];
  getPartyBalance: (partyId: string) => { debit: number; credit: number; net: number; status: 'debit' | 'credit' | 'balanced' };
  getTreasuryBalance: (treasuryId: string) => number;
  getEmployeeBalance: (employeeId: string) => { entitlements: number; paidAndDeducted: number; net: number; status: 'credit' | 'debit' | 'balanced' };
}): FiscalYearArchive => {
  const financialSummary = calculateFinancialSummary(params.invoices, params.vouchers);

  const partyBalances = params.parties.map((p) => {
    const bal = params.getPartyBalance(p.id);
    return {
      id: p.id,
      name: p.name,
      type: p.type,
      endingBalance: Math.round(Math.abs(bal.net) * 100) / 100,
      status: bal.status,
    };
  });

  const treasuryBalances = params.treasuries.map((t) => {
    const bal = params.getTreasuryBalance(t.id);
    return {
      id: t.id,
      name: t.name,
      type: t.type,
      endingBalance: Math.round(bal * 100) / 100,
    };
  });

  const employeeBalances = params.employees.map((e) => {
    const bal = params.getEmployeeBalance(e.id);
    return {
      id: e.id,
      name: e.name,
      jobTitle: e.jobTitle,
      baseSalary: e.baseSalary,
      netDue: Math.round(bal.net * 100) / 100,
    };
  });

  return {
    id: `fy_${params.year}_${Date.now()}`,
    year: params.year,
    title: `السنة المالية ${params.year}`,
    closedAt: new Date().toISOString(),
    closedBy: params.closedBy,
    notes: params.notes,
    financialSummary,
    partyBalances,
    treasuryBalances,
    employeeBalances,
    invoices: JSON.parse(JSON.stringify(params.invoices)),
    vouchers: JSON.parse(JSON.stringify(params.vouchers)),
    transfers: JSON.parse(JSON.stringify(params.transfers)),
    employeeTransactions: JSON.parse(JSON.stringify(params.employeeTransactions)),
  };
};

/**
 * Creates clean zeroed-out state where accounts/names are preserved but all balances are set to 0
 */
export const zeroOutAccountsAndEntities = (
  parties: Party[],
  treasuries: Treasury[],
  employees: Employee[]
) => {
  const zeroedParties: Party[] = parties.map((p) => ({
    ...p,
    openingBalance: 0,
    openingBalanceType: 'debit',
  }));

  const zeroedTreasuries: Treasury[] = treasuries.map((t) => ({
    ...t,
    openingBalance: 0,
  }));

  const zeroedEmployees: Employee[] = employees.map((e) => ({
    ...e,
    openingBalance: 0,
    openingBalanceType: 'credit',
  }));

  return {
    parties: zeroedParties,
    treasuries: zeroedTreasuries,
    employees: zeroedEmployees,
  };
};
