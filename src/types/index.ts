export type PartyType = 'customer' | 'supplier' | 'both';

export interface Party {
  id: string;
  name: string;
  type: PartyType;
  phone: string;
  address: string;
  openingBalance: number; // positive number
  openingBalanceType: 'debit' | 'credit'; // 'debit' = عليه (مدين), 'credit' = له (دائن)
  notes?: string;
  isSystem?: boolean; // e.g. "حساب نقدي"
  portalToken?: string;
  isPortalActive?: boolean;
  createdAt: string;
}

export type TreasuryType = 'cash' | 'bank';

export interface Treasury {
  id: string;
  name: string;
  type: TreasuryType;
  accountNumber?: string;
  openingBalance: number;
  notes?: string;
  createdAt: string;
}

export type InvoiceType = 'sale' | 'purchase' | 'expense';

export type PaymentMethod = 'cash' | 'bank_transfer' | 'card';

export interface InvoiceManualItem {
  serial: string;
  name: string;
  quantity?: string;
  unitPrice?: string;
  totalPrice: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // المطابق لرقم الفاتورة الورقية
  type: InvoiceType;
  expenseCategory?: string; // في حال كانت فاتورة مصروفات (إيجار، صيانة، بضاعة، إلخ)
  partyId: string; // معرف العميل أو المورد أو الحساب النقدي
  partyName: string;
  date: string; // YYYY-MM-DD
  totalAmount: number; // القيمة الإجمالية للفاتورة
  
  // حالة السداد
  paymentStatus: 'paid' | 'credit' | 'partial'; // مسددة بالكامل فورياً / آجل على الحساب / مسددة جزئياً
  paidAmount: number; // المبلغ المدفوع فوراً
  paymentMethod?: PaymentMethod; // طريقة السداد عند الدفع
  treasuryId?: string; // الخزينة أو المصرف المودع فيه أو المسحوب منه المبلغ المدفوع
  
  // نسبة أو مكافأة الموظف (في فواتير المبيعات فقط)
  hasEmployeeCommission?: boolean;
  employeeId?: string;
  employeeName?: string;
  commissionRate?: number; // نسبة مئوية متغيرة مثلاً 5%
  commissionAmount?: number; // القيمة المحسوبة بالدينار/العملة
  commissionMonth?: string; // شهر الاستحقاق مثلاً 2026-10
  
  // جدول الأصناف اليدوي (اختياري للطباعة: رقم تسلسلي - الصنف - السعر الإجمالي)
  manualItems?: InvoiceManualItem[];

  notes?: string;
  createdBy: string;
  createdAt: string;
}

export type VoucherType = 'receipt' | 'payment'; // سند قبض أو سند صرف

export type VoucherSubType = 
  | 'invoice_payment'    // قبض أو دفع ثمن فاتورة
  | 'advance_payment'    // دفعة مقدمة أو عربون
  | 'direct_deposit'     // إيداع مباشر في الخزينة
  | 'direct_withdrawal'  // سحب مباشر من الخزينة
  | 'expense_payment'    // دفع مصروفات
  | 'supplier_payment'   // دفع مستحقات مورد
  | 'customer_receipt'   // قبض دفعة من عميل
  | 'salary_payout'      // صرف راتب أو مستحقات موظف
  | 'other';             // أخرى

export interface Voucher {
  id: string;
  voucherNumber: string; // رقم السند
  type: VoucherType; // قبض أو صرف
  subType: VoucherSubType;
  partyType: 'party' | 'employee' | 'none';
  partyId?: string;
  partyName?: string;
  employeeId?: string;
  employeeName?: string;
  amount: number;
  paymentMethod: PaymentMethod;
  treasuryId: string; // الخزينة أو المصرف المتأثر
  date: string;
  referenceInvoiceNumber?: string; // رقم الفاتورة الورقية المرتبطة إن وجدت
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export interface TreasuryTransfer {
  id: string;
  fromTreasuryId: string;
  fromTreasuryName: string;
  toTreasuryId: string;
  toTreasuryName: string;
  amount: number;
  date: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export type EmployeeStatus = 'active' | 'on_leave' | 'inactive';

export interface Employee {
  id: string;
  name: string;
  jobTitle: string;
  phone: string;
  baseSalary: number; // الراتب الشهري الأساسي
  linkedPartyId?: string; // ربط بحساب عميل إن كان الموظف يتعامل كعميل أيضاً
  status: EmployeeStatus; // نشط / إيقاف مؤقت - إجازة بدون راتب / موقوف
  openingBalance?: number; // رصيد سابق مستحق له أو عليه
  openingBalanceType?: 'credit' | 'debit'; // credit = له مستحق، debit = عليه سلفة سابقة
  joinDate: string;
  notes?: string;
  createdAt: string;
}

export type EmployeeTransactionType = 
  | 'salary'        // إثبات استحقاق راتب شهري
  | 'commission'    // عمولة/نسبة من فاتورة مبيعات
  | 'bonus'         // مكافأة إضافية
  | 'deduction'     // خصم أو جزاء
  | 'advance'       // سلفة مسحوبة
  | 'payout';       // صرف راتب / تسوية مستحقات نقدية

export interface EmployeeTransaction {
  id: string;
  employeeId: string;
  employeeName: string;
  type: EmployeeTransactionType;
  amount: number;
  date: string;
  month: string; // YYYY-MM
  invoiceId?: string;
  invoiceNumber?: string;
  treasuryId?: string; // في حالة الصرف النقدي الفوري
  voucherId?: string; // ربط بسند الصرف
  paymentMethod?: PaymentMethod;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export type UserRole = 'admin' | 'accountant' | 'cashier' | 'viewer';

export interface UserPermissions {
  canViewDashboard: boolean;
  canManageInvoices: boolean;       // إضافة وتعديل الفواتير
  canManageVouchers: boolean;       // سندات القبض والصرف
  canManageTreasuries: boolean;     // الخزائن وحركات السحب والإيداع
  canManageParties: boolean;        // العملاء والموردين
  canManageEmployees: boolean;      // الموظفين والرواتب والعمولات
  canViewReports: boolean;          // التقارير المالية العامة
  canViewProfitAndLoss: boolean;    // تقرير الأرباح والخسائر الحساس
  canViewEmployeeFinancials: boolean; // تفاصيل رواتب وسلف الموظفين الحساسة
  canManageUsers: boolean;          // إدارة المستخدمين والصلاحيات
  canExportBackup: boolean;         // تصدير ونسخ احتياطي
}

export interface User {
  id: string;
  username: string;
  fullName: string;
  password?: string;
  role: UserRole;
  permissions: UserPermissions;
  isActive: boolean;
  createdAt: string;
}

export type PrintLogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'hidden';
export type PrintFontSize = 'compact' | 'normal' | 'comfortable';
export type PrintVoucherPaperSize = 'A5_landscape' | 'A4_portrait';

export interface CompanySettings {
  companyName: string;
  phone: string;
  address: string;
  currency: string;
  logoUrl?: string;
  headerNote?: string;
  commercialRegister?: string; // السجل التجاري
  taxNumber?: string;          // الرقم الضريبي
  email?: string;              // البريد الإلكتروني
  invoiceFooterTerms?: string; // شروط وملاحظات أسفل الفاتورة والطباعة
  expenseCategories: string[];
  requirePasswordLogin: boolean;

  // إعدادات وتنسيق مستندات الطباعة يدوياً
  printLogoSize?: PrintLogoSize;               // حجم الشعار في الطباعة
  showLogoInPrint?: boolean;                   // إظهار الشعار في الطباعة
  printFontSize?: PrintFontSize;               // حجم خط ونصوص الطباعة
  showTaxAndCRInPrint?: boolean;               // إظهار السجل التجاري والضريبي
  showAddressPhoneInPrint?: boolean;           // إظهار العنوان والهاتف
  showEmailInPrint?: boolean;                  // إظهار البريد الإلكتروني
  recipientSignatureLabel?: string;            // مسمى توقيع المستلم
  auditorSignatureLabel?: string;              // مسمى توقيع المحاسب
  printVoucherSize?: PrintVoucherPaperSize;    // مقاس طباعة السندات الافتراضي

  // السنة المالية
  currentFiscalYear?: string;                  // السنة المالية الحالية النشطة مثل 2026
  lastYearClosedAt?: string;                   // تاريخ آخر إقفال سنة مالية

  // تنبيهات الديون والذمم
  debtGracePeriodDays?: number;                // فترة السماح الافتراضية للديون بالأيام (مثلاً 30 يوماً)
}

export interface FiscalYearArchive {
  id: string;
  year: string; // e.g. "2026"
  title: string; // e.g. "السنة المالية 2026"
  closedAt: string; // ISO date string
  closedBy: string; // Name of accountant/admin who closed the year
  notes?: string;

  // ملخص الأداء المالي النهائي للسنة المغلقة
  financialSummary: {
    salesTotal: number;
    purchasesTotal: number;
    expensesTotal: number;
    commissionsTotal: number;
    totalCosts: number;
    netProfit: number;
    profitMargin: number;
    invoicesCount: number;
    vouchersCount: number;
  };

  // الأرصدة الختامية للعملاء والموردين
  partyBalances: {
    id: string;
    name: string;
    type: PartyType;
    endingBalance: number;
    status: 'debit' | 'credit' | 'balanced';
  }[];

  // الأرصدة الختامية للخزائن والمصارف والسيولة
  treasuryBalances: {
    id: string;
    name: string;
    type: TreasuryType;
    endingBalance: number;
  }[];

  // الأرصدة والمستحقات الختامية للموظفين
  employeeBalances: {
    id: string;
    name: string;
    jobTitle: string;
    baseSalary: number;
    netDue: number;
  }[];

  // نسخ مؤرشفة غير قابلة للتعديل لكافة عمليات السنة
  invoices: Invoice[];
  vouchers: Voucher[];
  transfers?: TreasuryTransfer[];
  employeeTransactions?: EmployeeTransaction[];
}
