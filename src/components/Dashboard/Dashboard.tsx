import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Invoice, InvoiceType, Voucher, Party } from '../../types';
import {
  Wallet,
  Receipt,
  FileCheck2,
  Users2,
  TrendingUp,
  Percent,
  Banknote,
  CreditCard,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  Sparkles,
  Zap,
  AlertTriangle,
  BellRing,
  Calendar,
  Phone,
  FileSpreadsheet,
  CheckCircle2,
  ShieldCheck,
  ChevronRight,
  Search,
} from 'lucide-react';
import { calculateOverdueCustomerDebts } from '../../utils/debtAlertHelper';
import { PartyStatementModal } from '../Parties/PartyStatementModal';

interface DashboardProps {
  onOpenNewInvoice: (type?: InvoiceType) => void;
  onOpenNewVoucher: () => void;
  onOpenNewVoucherForParty?: (partyId: string, type: 'receipt' | 'payment') => void;
  onPrintInvoice: (inv: Invoice) => void;
  onPrintVoucher: (v: Voucher) => void;
  onNavigateToTab: (tab: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onOpenNewInvoice,
  onOpenNewVoucher,
  onOpenNewVoucherForParty,
  onPrintInvoice,
  onPrintVoucher,
  onNavigateToTab,
}) => {
  const {
    invoices,
    vouchers,
    parties,
    treasuries,
    employees,
    getTotalLiquidity,
    getPartyBalance,
    getPartyStatement,
    addInvoice,
    settings,
    currentUser,
    addToast,
  } = useApp();

  // Debt Grace Period & Alert states
  const [gracePeriodDays, setGracePeriodDays] = useState<number>(() => {
    return settings.debtGracePeriodDays || 30;
  });
  const [customGraceInput, setCustomGraceInput] = useState<string>('');
  const [showCustomGraceInput, setShowCustomGraceInput] = useState<boolean>(false);
  const [debtAlertSearch, setDebtAlertSearch] = useState<string>('');
  const [statementParty, setStatementParty] = useState<Party | null>(null);
  const [isStatementOpen, setIsStatementOpen] = useState<boolean>(false);

  const liquidity = getTotalLiquidity();
  const todayStr = new Date().toISOString().substring(0, 10);

  // Quick Inline Invoice Form States
  const [quickType, setQuickType] = useState<InvoiceType>('sale');
  const [quickNumber, setQuickNumber] = useState(`INV-${Math.floor(1000 + Math.random() * 9000)}`);
  const [quickAmount, setQuickAmount] = useState<number | ''>('');
  const [quickPartyId, setQuickPartyId] = useState(parties.find((p) => p.id === 'party_cash')?.id || parties[0]?.id || '');
  const [quickPaid, setQuickPaid] = useState(true);

  // Today's metrics
  const todayStats = useMemo(() => {
    let sales = 0;
    let purchases = 0;
    let expenses = 0;
    let count = 0;

    invoices.forEach((inv) => {
      if (inv.date === todayStr) {
        count++;
        if (inv.type === 'sale') sales += inv.totalAmount;
        else if (inv.type === 'purchase') purchases += inv.totalAmount;
        else if (inv.type === 'expense') expenses += inv.totalAmount;
      }
    });

    return { sales, purchases, expenses, count };
  }, [invoices, todayStr]);

  // Market Debts & Receivables
  const marketDues = useMemo(() => {
    let customerReceivables = 0; // لنا بالخارج
    let supplierPayables = 0; // علينا للموردين

    parties.forEach((p) => {
      const bal = getPartyBalance(p.id);
      if (bal.status === 'debit') {
        customerReceivables += bal.net;
      } else if (bal.status === 'credit') {
        supplierPayables += Math.abs(bal.net);
      }
    });

    return { customerReceivables, supplierPayables };
  }, [parties, getPartyBalance]);

  // Overdue Debts Calculation using FIFO aging
  const overdueDebts = useMemo(() => {
    return calculateOverdueCustomerDebts(
      parties,
      getPartyBalance,
      getPartyStatement,
      gracePeriodDays
    );
  }, [parties, getPartyBalance, getPartyStatement, gracePeriodDays]);

  const filteredOverdueDebts = useMemo(() => {
    if (!debtAlertSearch.trim()) return overdueDebts;
    const q = debtAlertSearch.toLowerCase().trim();
    return overdueDebts.filter(
      (d) =>
        d.partyName.toLowerCase().includes(q) ||
        d.phone.includes(q) ||
        d.oldestRef.toLowerCase().includes(q)
    );
  }, [overdueDebts, debtAlertSearch]);

  const totalOverdueAmount = useMemo(() => {
    return overdueDebts.reduce((sum, d) => sum + d.totalDebt, 0);
  }, [overdueDebts]);

  const handleOpenPartyStatement = (partyId: string) => {
    const party = parties.find((p) => p.id === partyId);
    if (party) {
      setStatementParty(party);
      setIsStatementOpen(true);
    }
  };

  const handleSelectGracePeriod = (days: number) => {
    setGracePeriodDays(days);
    setShowCustomGraceInput(false);
  };

  const handleApplyCustomGrace = (e: React.FormEvent) => {
    e.preventDefault();
    const days = parseInt(customGraceInput, 10);
    if (!isNaN(days) && days > 0) {
      setGracePeriodDays(days);
      setShowCustomGraceInput(false);
      setCustomGraceInput('');
    }
  };

  // Quick submit
  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickNumber.trim()) {
      addToast('error', 'يرجى كتابة رقم الفاتورة الورقية');
      return;
    }
    if (!quickAmount || Number(quickAmount) <= 0) {
      addToast('error', 'يرجى كتابة القيمة الإجمالية للفاتورة');
      return;
    }

    const party = parties.find((p) => p.id === quickPartyId);
    const amt = Number(quickAmount);
    const defaultTreasury = treasuries[0]?.id;

    addInvoice({
      invoiceNumber: quickNumber.trim(),
      type: quickType,
      partyId: quickPartyId,
      partyName: party?.name || 'حساب غير محدد',
      date: todayStr,
      totalAmount: amt,
      paymentStatus: quickPaid ? 'paid' : 'credit',
      paidAmount: quickPaid ? amt : 0,
      paymentMethod: quickPaid ? 'cash' : undefined,
      treasuryId: quickPaid ? defaultTreasury : undefined,
      notes: 'إدخال سريع من لوحة التحكم',
    });

    // Reset for next paper entry
    const nextNum = parseInt(quickNumber.replace(/\D/g, ''), 10);
    const prefix = quickType === 'sale' ? 'INV-' : quickType === 'purchase' ? 'PUR-' : 'EXP-';
    setQuickNumber(nextNum ? `${prefix}${nextNum + 1}` : '');
    setQuickAmount('');
  };

  return (
    <div className="space-y-6">
      {/* Welcome & Liquidity Hero Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 rounded-3xl p-6 sm:p-7 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20 text-emerald-100">
                مرحباً بك، {currentUser.fullName}
              </span>
              <span className="text-xs text-emerald-200">({todayStr})</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              المنظومة المالية البسيطة لإدارة الفواتير الورقية
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 max-w-xl leading-relaxed">
              تتبع فوري لمبيعات ومشتريات ومصروفات المتجر، ضبط السيولة النقدية، احتساب نسب الموظفين وكشوفات الحساب.
            </p>
          </div>

          {/* Big Liquidity Counter */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/20 text-right min-w-[240px]">
            <div className="flex items-center justify-between text-xs font-semibold text-emerald-200">
              <span>إجمالي السيولة الحالية</span>
              <Wallet className="w-4 h-4" />
            </div>
            <div className="text-3xl font-black text-white mt-1">
              {liquidity.total.toLocaleString()} <span className="text-sm font-normal text-emerald-200">{settings.currency}</span>
            </div>
            <div className="flex items-center justify-between gap-4 text-xs mt-3 pt-3 border-t border-white/15">
              <div className="flex items-center gap-1.5">
                <Banknote className="w-3.5 h-3.5 text-amber-300" />
                <span className="text-emerald-100">كاش:</span>
                <span className="font-bold">{liquidity.cash.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-blue-300" />
                <span className="text-emerald-100">مصارف:</span>
                <span className="font-bold">{liquidity.bank.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Transactions Quick Counter Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-700">مبيعات اليوم</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-black text-slate-900 mt-1">
            {todayStats.sales.toLocaleString()} <span className="text-xs font-normal text-slate-500">{settings.currency}</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">فواتير مبيعات مسجلة اليوم</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-700">مشتريات اليوم</span>
            <Receipt className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl font-black text-slate-900 mt-1">
            {todayStats.purchases.toLocaleString()} <span className="text-xs font-normal text-slate-500">{settings.currency}</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">توريدات مشتريات اليوم</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-700">مصروفات اليوم</span>
            <ArrowUpRight className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl font-black text-slate-900 mt-1">
            {todayStats.expenses.toLocaleString()} <span className="text-xs font-normal text-slate-500">{settings.currency}</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">مصروفات تشغيلية ونثرية</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-800">أموال لنا في السوق</span>
            <Users2 className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-black text-amber-950 mt-1">
            {marketDues.customerReceivables.toLocaleString()} <span className="text-xs font-normal text-slate-500">{settings.currency}</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">مديونيات على العملاء</span>
        </div>
      </div>

      {/* Overdue Customer Debts Alert Card (بطاقة تنبيهات الديون المتأخرة وتجاوز فترة السماح) */}
      <div
        className={`rounded-3xl border transition-all shadow-xs overflow-hidden ${
          overdueDebts.length > 0
            ? 'bg-gradient-to-b from-amber-50/70 via-white to-white border-amber-200'
            : 'bg-white border-slate-200'
        }`}
      >
        {/* Card Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                overdueDebts.length > 0
                  ? 'bg-amber-500 text-white shadow-amber-500/20'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {overdueDebts.length > 0 ? (
                <BellRing className="w-5 h-5 animate-bounce" />
              ) : (
                <ShieldCheck className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-slate-900 text-base sm:text-lg">
                  تنبيهات ديون العملاء المتأخرة
                </h3>
                {overdueDebts.length > 0 ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>{overdueDebts.length} {overdueDebts.length === 1 ? 'عميل متأخر' : 'عملاء متأخرين'}</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>لا توجد متأخرات</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                حسابات العملاء التي ترتبت عليها ديون مستحقة وتجاوزت فترة السماح المحددة ({gracePeriodDays} يوماً)
              </p>
            </div>
          </div>

          {/* Grace Period Controls & Quick Filters */}
          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
              <span className="px-2 text-[11px] text-slate-500 hidden sm:inline">فترة السماح:</span>
              {[15, 30, 45, 60].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => handleSelectGracePeriod(days)}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    gracePeriodDays === days && !showCustomGraceInput
                      ? 'bg-white text-emerald-800 shadow-2xs font-black'
                      : 'hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  {days} يوم
                </button>
              ))}
              <button
                type="button"
                onClick={() => setShowCustomGraceInput(!showCustomGraceInput)}
                className={`px-2 py-1 rounded-lg transition-all cursor-pointer text-[11px] ${
                  showCustomGraceInput || ![15, 30, 45, 60].includes(gracePeriodDays)
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'hover:bg-slate-200/60'
                }`}
                title="تحديد فترة سماح مخصصة بالأيام"
              >
                {![15, 30, 45, 60].includes(gracePeriodDays) ? `${gracePeriodDays} يوم (مخصص)` : 'مخصص...'}
              </button>
            </div>

            {overdueDebts.length > 0 && (
              <div className="px-3 py-1.5 bg-amber-100/80 border border-amber-200 rounded-xl text-xs text-amber-950 font-black">
                إجمالي المتأخرات: {totalOverdueAmount.toLocaleString()} {settings.currency}
              </div>
            )}
          </div>
        </div>

        {/* Custom Grace Input Dropdown */}
        {showCustomGraceInput && (
          <form
            onSubmit={handleApplyCustomGrace}
            className="p-3 bg-emerald-50/60 border-b border-emerald-100 flex items-center gap-2 text-xs"
          >
            <span className="font-bold text-emerald-900">أدخل عدد أيام فترة السماح:</span>
            <input
              type="number"
              min="1"
              max="365"
              placeholder="مثلاً 20"
              value={customGraceInput}
              onChange={(e) => setCustomGraceInput(e.target.value)}
              className="w-24 px-3 py-1.5 rounded-lg border border-emerald-300 bg-white font-bold text-slate-800"
              autoFocus
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 cursor-pointer"
            >
              تطبيق
            </button>
            <button
              type="button"
              onClick={() => setShowCustomGraceInput(false)}
              className="px-2 py-1.5 text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              إلغاء
            </button>
          </form>
        )}

        {/* Card Body */}
        <div className="p-4 sm:p-5">
          {overdueDebts.length > 0 ? (
            <div className="space-y-3">
              {/* Filter search if more than 2 items */}
              {overdueDebts.length > 2 && (
                <div className="relative max-w-sm mb-3">
                  <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={debtAlertSearch}
                    onChange={(e) => setDebtAlertSearch(e.target.value)}
                    placeholder="بحث باسم العميل أو رقم الهاتف..."
                    className="w-full pr-8 pl-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              )}

              {/* Grid of Overdue Customer Alert Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredOverdueDebts.map((item) => (
                  <div
                    key={item.partyId}
                    className={`p-4 rounded-2xl border transition-all bg-white shadow-2xs hover:shadow-xs flex flex-col justify-between ${
                      item.severity === 'urgent'
                        ? 'border-rose-300 hover:border-rose-400'
                        : 'border-amber-200 hover:border-amber-300'
                    }`}
                  >
                    <div>
                      {/* Top Row: Name, Badge, Urgency */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-black text-slate-900 text-sm truncate">
                              {item.partyName}
                            </h4>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                              {item.partyType === 'both' ? 'حساب عام' : 'عميل'}
                            </span>
                          </div>
                          {item.phone && item.phone !== '-' && (
                            <a
                              href={`tel:${item.phone}`}
                              className="text-[11px] text-slate-500 hover:text-emerald-700 flex items-center gap-1 mt-0.5"
                              dir="ltr"
                            >
                              <Phone className="w-3 h-3 text-emerald-600 inline" />
                              <span>{item.phone}</span>
                            </a>
                          )}
                        </div>

                        {/* Severity Badge */}
                        <div className="shrink-0 text-left">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                              item.severity === 'urgent'
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : 'bg-amber-100 text-amber-900 border border-amber-200'
                            }`}
                          >
                            <AlertTriangle className="w-2.5 h-2.5" />
                            <span>تجاوز بـ {item.daysOverdue} يوم</span>
                          </span>
                        </div>
                      </div>

                      {/* Middle Detail Row: Debt amount & aging timeline */}
                      <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs mb-3">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-medium">
                            إجمالي الدين المستحق
                          </span>
                          <span className="font-black text-rose-700 text-sm">
                            {item.totalDebt.toLocaleString()} {settings.currency}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-medium">
                            أقدم حركة غير مسددة
                          </span>
                          <span className="font-bold text-slate-700 text-[11px] block">
                            {item.oldestUnpaidDate}
                          </span>
                          <span className="text-[10px] text-slate-400 block truncate">
                            (منذ {item.daysElapsed} يوم • {item.oldestRef})
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions Row */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Quick Receipt Voucher */}
                        <button
                          type="button"
                          onClick={() => {
                            if (onOpenNewVoucherForParty) {
                              onOpenNewVoucherForParty(item.partyId, 'receipt');
                            } else {
                              onOpenNewVoucher();
                            }
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs active:scale-95 transition-all cursor-pointer"
                          title="إنشاء سند قبض فوري لسداد مديونية العميل"
                        >
                          <ArrowDownLeft className="w-3.5 h-3.5" />
                          <span>قبض دفعة</span>
                        </button>

                        {/* Statement Modal */}
                        <button
                          type="button"
                          onClick={() => handleOpenPartyStatement(item.partyId)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          title="عرض كشف الحساب التفصيلي للعميل"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
                          <span>كشف الحساب</span>
                        </button>
                      </div>

                      {/* Direct phone call if available */}
                      {item.phone && item.phone !== '-' && (
                        <a
                          href={`tel:${item.phone}`}
                          className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors"
                          title="اتصال هاتفي سريع"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Clean Empty / Safe State */
            <div className="py-6 px-4 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 shadow-2xs">
                <ShieldCheck className="w-7 h-7 text-emerald-600" />
              </div>
              <h4 className="font-extrabold text-slate-800 text-sm sm:text-base">
                لا توجد ديون متأخرة تجاوزت فترة السماح ({gracePeriodDays} يوماً)
              </h4>
              <p className="text-xs text-slate-500 max-w-md mt-1 leading-relaxed">
                جميع التزامات العملاء المدينة إما مسددة بالكامل أو ما زالت حركاتها ضمن المهلة الائتمانية المقبولة للمنشأة.
              </p>
              {gracePeriodDays > 15 && (
                <button
                  type="button"
                  onClick={() => handleSelectGracePeriod(15)}
                  className="mt-3 text-xs text-emerald-700 hover:text-emerald-800 font-bold hover:underline cursor-pointer"
                >
                  فحص الديون التي تجاوزت 15 يوماً ←
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Fast Inline Invoice Box (For ultra-fast cash entry directly on dashboard!) */}
      {currentUser.permissions.canManageInvoices && (
        <div className="bg-white rounded-3xl p-5 border border-emerald-200/90 shadow-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                  شريط الإدخال السريع للفواتير الورقية
                </h3>
                <p className="text-xs text-slate-500">
                  إدخال مباشر وفوري دون الحاجة لفتح نوافذ، مثالي لتسجيل الفواتير الورقية اليومية المتراكمة بسرعة
                </p>
              </div>
            </div>

            <button
              onClick={() => onOpenNewInvoice()}
              className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
            >
              <span>نموذج الفاتورة التفصيلي (مع احتساب عمولة الموظف) ←</span>
            </button>
          </div>

          <form onSubmit={handleQuickSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2 text-xs">
            {/* Type */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">النوع</label>
              <select
                value={quickType}
                onChange={(e) => setQuickType(e.target.value as InvoiceType)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold bg-white"
              >
                <option value="sale">مبيعات</option>
                <option value="purchase">مشتريات</option>
                <option value="expense">مصروف</option>
              </select>
            </div>

            {/* Paper Invoice # */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">رقم الفاتورة الورقية</label>
              <input
                type="text"
                value={quickNumber}
                onChange={(e) => setQuickNumber(e.target.value)}
                placeholder="رقم الدفتر الورقي"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold"
                required
              />
            </div>

            {/* Total Amount */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                القيمة الإجمالية ({settings.currency})
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={quickAmount}
                onChange={(e) => setQuickAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                placeholder="0.00"
                className="w-full px-3 py-2 rounded-xl border border-emerald-300 font-black text-sm bg-emerald-50/30"
                required
              />
            </div>

            {/* Party */}
            <div className="lg:col-span-2">
              <label className="block text-[11px] font-bold text-slate-600 mb-1">العميل / المورد / الحساب</label>
              <select
                value={quickPartyId}
                onChange={(e) => setQuickPartyId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
              >
                {parties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.isSystem ? '⚡' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Submit */}
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-600/30 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>حفظ فوري</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Grid: Recent Invoices & Recent Vouchers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">آخر الفواتير الورقية المسجلة</h3>
              </div>
              <button
                onClick={() => onNavigateToTab('invoices')}
                className="text-xs font-bold text-emerald-700 hover:underline"
              >
                عرض كافة الفواتير ({invoices.length}) ←
              </button>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {invoices.slice(0, 5).map((inv) => (
                <div key={inv.id} className="p-3.5 sm:px-5 hover:bg-slate-50 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">{inv.invoiceNumber}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          inv.type === 'sale'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : inv.type === 'purchase'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {inv.type === 'sale' ? 'مبيعات' : inv.type === 'purchase' ? 'مشتريات' : 'مصروف'}
                      </span>
                    </div>
                    <div className="text-slate-600 mt-1">
                      {inv.partyName} • <span className="text-slate-400">{inv.date}</span>
                    </div>
                  </div>

                  <div className="text-left flex items-center gap-3">
                    <div>
                      <div className="font-black text-slate-900 text-sm">
                        {inv.totalAmount.toLocaleString()} {settings.currency}
                      </div>
                      {inv.hasEmployeeCommission && (
                        <div className="text-[10px] text-amber-700 font-bold">
                          عمولة: {inv.commissionAmount} {settings.currency}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => onPrintInvoice(inv)}
                      className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="طباعة إيصال الفاتورة"
                    >
                      <Receipt className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Vouchers */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">آخر سندات القبض والصرف</h3>
              </div>
              <button
                onClick={() => onNavigateToTab('vouchers')}
                className="text-xs font-bold text-emerald-700 hover:underline"
              >
                عرض كافة السندات ({vouchers.length}) ←
              </button>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {vouchers.slice(0, 5).map((v) => (
                <div key={v.id} className="p-3.5 sm:px-5 hover:bg-slate-50 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">{v.voucherNumber}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          v.type === 'receipt'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {v.type === 'receipt' ? 'قبض' : 'صرف'}
                      </span>
                    </div>
                    <div className="text-slate-600 mt-1">
                      {v.partyName || v.employeeName || 'حركة مباشرة'} • <span className="text-slate-400">{v.date}</span>
                    </div>
                  </div>

                  <div className="text-left flex items-center gap-3">
                    <div className="font-black text-slate-900 text-sm">
                      {v.type === 'receipt' ? '+' : '-'}{v.amount.toLocaleString()} {settings.currency}
                    </div>
                    <button
                      onClick={() => onPrintVoucher(v)}
                      className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="طباعة السند"
                    >
                      <FileCheck2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Statement Modal for Dashboard Quick Action */}
      <PartyStatementModal
        isOpen={isStatementOpen}
        onClose={() => {
          setIsStatementOpen(false);
          setStatementParty(null);
        }}
        party={statementParty}
      />
    </div>
  );
};
