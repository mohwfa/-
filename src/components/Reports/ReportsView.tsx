import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  BarChart3,
  Calendar,
  Printer,
  Download,
  Lock,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Percent,
  FileSpreadsheet,
  Users2,
  Landmark,
  UserSquare2,
  Building,
  ExternalLink,
} from 'lucide-react';
import { getPrintStyles } from '../../utils/printStyleHelper';
import { printElement, openPrintWindow, downloadPrintableHtml } from '../../utils/printHelper';
import { FiscalYearsArchiveModal } from '../Settings/FiscalYearsArchiveModal';
import { CloseFiscalYearModal } from '../Settings/CloseFiscalYearModal';
import { Party, Treasury, Employee } from '../../types';
import { PartyStatementModal } from '../Parties/PartyStatementModal';
import { TreasuryStatementModal } from '../Treasuries/TreasuryStatementModal';
import { EmployeeStatementModal } from '../Employees/EmployeeStatementModal';

export const ReportsView: React.FC = () => {
  const {
    invoices,
    vouchers,
    treasuries,
    parties,
    employees,
    getPartyBalance,
    getTreasuryBalance,
    getEmployeeStatement,
    settings,
    currentUser,
    fiscalYears,
    addToast,
  } = useApp();

  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showCloseYearModal, setShowCloseYearModal] = useState(false);

  // Statement Modals State
  const [selectedPartyForStatement, setSelectedPartyForStatement] = useState<Party | null>(null);
  const [isPartyStatementOpen, setIsPartyStatementOpen] = useState(false);

  const [selectedTreasuryForStatement, setSelectedTreasuryForStatement] = useState<Treasury | null>(null);
  const [isTreasuryStatementOpen, setIsTreasuryStatementOpen] = useState(false);

  const [selectedEmployeeForStatement, setSelectedEmployeeForStatement] = useState<Employee | null>(null);
  const [isEmployeeStatementOpen, setIsEmployeeStatementOpen] = useState(false);

  const handleOpenPartyStatement = (party: Party) => {
    setSelectedPartyForStatement(party);
    setIsPartyStatementOpen(true);
  };

  const handleOpenTreasuryStatement = (treasury: Treasury) => {
    setSelectedTreasuryForStatement(treasury);
    setIsTreasuryStatementOpen(true);
  };

  const handleOpenEmployeeStatement = (employee: Employee) => {
    setSelectedEmployeeForStatement(employee);
    setIsEmployeeStatementOpen(true);
  };

  const perms = currentUser.permissions;
  const printStyles = getPrintStyles(settings);

  // Period Preset
  const [periodPreset, setPeriodPreset] = useState<'today' | 'this_month' | 'last_month' | 'year' | 'custom'>('this_month');
  
  // Custom Date Range
  const todayStr = new Date().toISOString().substring(0, 10);
  const currentMonthStart = `${todayStr.substring(0, 7)}-01`;
  const [startDate, setStartDate] = useState(currentMonthStart);
  const [endDate, setEndDate] = useState(todayStr);

  const [activeReportTab, setActiveReportTab] = useState<'pnl' | 'parties' | 'treasuries' | 'employees'>('pnl');

  // Set date ranges when preset changes
  const handlePresetChange = (preset: typeof periodPreset) => {
    setPeriodPreset(preset);
    const d = new Date();
    if (preset === 'today') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === 'this_month') {
      setStartDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`);
      setEndDate(todayStr);
    } else if (preset === 'last_month') {
      const prevYear = d.getMonth() === 0 ? d.getFullYear() - 1 : d.getFullYear();
      const prevMonth = d.getMonth() === 0 ? 12 : d.getMonth();
      const prevMonthStr = String(prevMonth).padStart(2, '0');
      const lastDay = new Date(prevYear, prevMonth, 0).getDate();
      setStartDate(`${prevYear}-${prevMonthStr}-01`);
      setEndDate(`${prevYear}-${prevMonthStr}-${String(lastDay).padStart(2, '0')}`);
    } else if (preset === 'year') {
      setStartDate(`${d.getFullYear()}-01-01`);
      setEndDate(todayStr);
    }
  };

  // Filter invoices for selected period
  const periodInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (startDate && inv.date < startDate) return false;
      if (endDate && inv.date > endDate) return false;
      return true;
    });
  }, [invoices, startDate, endDate]);

  // Aggregate Period Data
  const financialSummary = useMemo(() => {
    let salesTotal = 0;
    let purchasesTotal = 0;
    let expensesTotal = 0;
    let commissionsTotal = 0;

    periodInvoices.forEach((inv) => {
      if (inv.type === 'sale') salesTotal += inv.totalAmount;
      else if (inv.type === 'purchase') purchasesTotal += inv.totalAmount;
      else if (inv.type === 'expense') expensesTotal += inv.totalAmount;

      if (inv.hasEmployeeCommission && inv.commissionAmount) {
        commissionsTotal += inv.commissionAmount;
      }
    });

    // Total expenses includes purchases, operating expenses, and employee commissions
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
    };
  }, [periodInvoices]);

  // Parties balances summary
  const partiesSummary = useMemo(() => {
    return parties.map((p) => {
      const bal = getPartyBalance(p.id);
      return {
        party: p,
        debit: bal.debit,
        credit: bal.credit,
        net: bal.net,
        status: bal.status,
      };
    });
  }, [parties, getPartyBalance]);

  // Parties aggregate totals
  const partiesTotals = useMemo(() => {
    let totalDebit = 0;
    let totalCredit = 0;
    partiesSummary.forEach((r) => {
      totalDebit += r.debit;
      totalCredit += r.credit;
    });
    return {
      totalDebit,
      totalCredit,
      netDifference: totalDebit - totalCredit,
    };
  }, [partiesSummary]);

  // Treasuries aggregate totals
  const treasuriesTotals = useMemo(() => {
    let totalOpening = 0;
    let totalCurrent = 0;
    treasuries.forEach((t) => {
      totalOpening += t.openingBalance;
      totalCurrent += getTreasuryBalance(t.id);
    });
    return {
      totalOpening,
      totalCurrent,
    };
  }, [treasuries, getTreasuryBalance]);

  // Employees aggregate totals
  const employeesTotals = useMemo(() => {
    let totalBaseSalaries = 0;
    let totalCommissions = 0;
    let totalAdvances = 0;
    let totalPayouts = 0;
    let totalNetDue = 0;

    employees.forEach((emp) => {
      const stmt = getEmployeeStatement(emp.id);
      totalBaseSalaries += emp.baseSalary;
      totalCommissions += stmt.totalCommissions;
      totalAdvances += stmt.totalAdvances;
      totalPayouts += stmt.totalPayouts;
      totalNetDue += stmt.netDue;
    });

    return {
      totalBaseSalaries,
      totalCommissions,
      totalAdvances,
      totalPayouts,
      totalNetDue,
    };
  }, [employees, getEmployeeStatement]);

  // Report title by tab
  const getReportTitle = () => {
    switch (activeReportTab) {
      case 'pnl':
        return 'تقرير الأرباح والخسائر والتحليل المالي التشغيلي';
      case 'parties':
        return 'كشف وميزان مراجعة أرصدة العملاء والموردين الشامل';
      case 'treasuries':
        return 'تقرير السيولة النقدية وأرصدة الخزائن والمصارف';
      case 'employees':
        return 'كشف المسيرات ومستحقات وعمولات الموظفين';
    }
  };

  // Export report table to CSV with UTF-8 BOM
  const exportToCSV = () => {
    let csvContent = '\uFEFF';

    if (activeReportTab === 'pnl') {
      csvContent += `تقرير الأرباح والخسائر - ${settings.companyName}\n`;
      csvContent += `الفترة من,${startDate},إلى,${endDate}\n`;
      csvContent += `تاريخ التصدير,${new Date().toLocaleDateString('ar-LY')}\n\n`;
      csvContent += `البند المالي,القيمة (${settings.currency})\n`;
      csvContent += `إجمالي المبيعات,${financialSummary.salesTotal}\n`;
      csvContent += `إجمالي المشتريات,${financialSummary.purchasesTotal}\n`;
      csvContent += `إجمالي المصروفات التشغيلية,${financialSummary.expensesTotal}\n`;
      csvContent += `نسب وعمولات الموظفين,${financialSummary.commissionsTotal}\n`;
      csvContent += `إجمالي التكاليف والمصروفات,${financialSummary.totalCosts}\n`;
      csvContent += `صافي الربح / الخسارة,${financialSummary.netProfit}\n`;
      csvContent += `هامش الربح التشغيلي,${financialSummary.profitMargin.toFixed(2)}%\n\n`;

      csvContent += `تفاصيل فواتير الفترة\n`;
      csvContent += `رقم الفاتورة,النوع,الطرف,التاريخ,القيمة الإجمالية,المسدد,المتبقي\n`;
      periodInvoices.forEach((inv) => {
        csvContent += `"${inv.invoiceNumber}","${
          inv.type === 'sale' ? 'مبيعات' : inv.type === 'purchase' ? 'مشتريات' : 'مصروف'
        }","${inv.partyName}","${inv.date}",${inv.totalAmount},${inv.paidAmount},${inv.totalAmount - inv.paidAmount}\n`;
      });
    } else if (activeReportTab === 'parties') {
      csvContent += `كشف أرصدة العملاء والموردين - ${settings.companyName}\n`;
      csvContent += `حتى تاريخ,${endDate}\n\n`;
      csvContent += `الاسم,التصنيف,إجمالي المدين (عليه),إجمالي الدائن (له),الصافي,الحالة\n`;
      partiesSummary.forEach((row) => {
        const typeStr =
          row.party.type === 'customer'
            ? 'عميل'
            : row.party.type === 'supplier'
            ? 'مورد'
            : 'حساب عام (مورد وعميل)';
        const statusStr =
          row.status === 'debit'
            ? 'عليه (مطلوب منه)'
            : row.status === 'credit'
            ? 'له (مستحق له)'
            : 'متزن (0)';
        csvContent += `"${row.party.name}","${typeStr}",${row.debit},${row.credit},${row.net},"${statusStr}"\n`;
      });
      csvContent += `الإجمالي العام,,${partiesTotals.totalDebit},${partiesTotals.totalCredit},${partiesTotals.netDifference},\n`;
    } else if (activeReportTab === 'treasuries') {
      csvContent += `تقرير الخزائن والمصارف والسيولة - ${settings.companyName}\n`;
      csvContent += `حتى تاريخ,${endDate}\n\n`;
      csvContent += `الخزينة / المصرف,النوع,رقم الحساب,رصيد البداية,الرصيد الفعلي الحالي\n`;
      treasuries.forEach((t) => {
        const bal = getTreasuryBalance(t.id);
        csvContent += `"${t.name}","${t.type === 'cash' ? 'خزينة نقدية' : 'مصرف'}","${t.accountNumber || '-'} ",${t.openingBalance},${bal}\n`;
      });
      csvContent += `الإجمالي العام,,,${treasuriesTotals.totalOpening},${treasuriesTotals.totalCurrent}\n`;
    } else if (activeReportTab === 'employees') {
      csvContent += `كشف مستحقات الموظفين والعمولات - ${settings.companyName}\n`;
      csvContent += `حتى تاريخ,${endDate}\n\n`;
      csvContent += `اسم الموظف,المسمى الوظيفي,الراتب الأساسي,نسب الفواتير,السلف والمسحوبات,المصروف,الصافي المتبقي\n`;
      employees.forEach((emp) => {
        const stmt = getEmployeeStatement(emp.id);
        csvContent += `"${emp.name}","${emp.jobTitle}",${emp.baseSalary},${stmt.totalCommissions},${stmt.totalAdvances},${stmt.totalPayouts},${stmt.netDue}\n`;
      });
      csvContent += `الإجمالي العام,,${employeesTotals.totalBaseSalaries},${employeesTotals.totalCommissions},${employeesTotals.totalAdvances},${employeesTotals.totalPayouts},${employeesTotals.totalNetDue}\n`;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `تقرير_${activeReportTab}_${settings.companyName}_${startDate}_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    addToast('info', 'جارِ تجهيز التقرير المالي للطباعة بمقاس A4...');
    const printed = printElement('reportsPrintableArea', {
      title: getReportTitle(),
      companyName: settings.companyName,
      paperSize: 'A4',
    });
    if (printed) {
      addToast('success', 'تم استدعاء أمر الطباعة بنجاح');
    }
  };

  const handleOpenStandalone = () => {
    addToast('info', 'جارِ فتح التقرير في نافذة مستقلة للطباعة...');
    const win = openPrintWindow('reportsPrintableArea', {
      title: getReportTitle(),
      companyName: settings.companyName,
      paperSize: 'A4',
      autoPrint: true,
    });
    if (win) {
      addToast('success', 'تم فتح التقرير في نافذة مستقلة للطباعة بمقاس A4');
    } else {
      printElement('reportsPrintableArea', {
        title: getReportTitle(),
        companyName: settings.companyName,
        paperSize: 'A4',
      });
      addToast('info', 'تم تحويل أمر الطباعة تلقائياً للمعاينة المباشرة لتجاوز حظر النوافذ');
    }
  };

  const handleDownloadHtml = () => {
    downloadPrintableHtml('reportsPrintableArea', `تقرير_${activeReportTab}_${settings.companyName}`, {
      title: getReportTitle(),
      companyName: settings.companyName,
      paperSize: 'A4',
    });
    addToast('success', 'تم تنزيل التقرير بصيغة HTML جاهز للطباعة أو حفظ PDF');
  };

  return (
    <div className="space-y-6">
      {/* Scoped A4 Portrait Page Print Rule */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait !important;
            margin: 8mm 10mm !important;
          }
        }
      `}</style>

      {/* Top Banner (Screen Only) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-emerald-600" />
            <span>التقارير المالية والأرباح والخسائر</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            تحليل إجمالي المبيعات والمشتريات والمصروفات حسب فترة زمنية، وأرصدة العملاء والخزائن
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handlePrint}
            className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-emerald-600/30 transition-all cursor-pointer active:scale-95"
            title="طباعة التقرير المالي الحالي بمقاس A4"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة التقرير (A4)</span>
          </button>
          <button
            onClick={handleOpenStandalone}
            className="px-3 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            title="فتح التقرير في نافذة مستقلة للطباعة المباشرة دون قيود المتصفح"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-300" />
            <span className="hidden sm:inline">نافذة مستقلة (A4)</span>
          </button>
          <button
            onClick={handleDownloadHtml}
            className="p-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer"
            title="تنزيل التقرير كملف HTML للطباعة"
          >
            <Download className="w-4 h-4 text-slate-700" />
          </button>
          <button
            onClick={exportToCSV}
            className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>تصدير Excel (CSV)</span>
          </button>

          <button
            onClick={() => setShowArchiveModal(true)}
            className="px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
            title="استعراض وتدقيق تقارير السنوات المالية السابقة المقفلة"
          >
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span>أرشيف السنوات السابقة</span>
            {fiscalYears.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-indigo-200 text-indigo-900 text-[10px] font-extrabold">
                {fiscalYears.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Date Period Selector Card (Screen Only) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3 no-print">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => handlePresetChange('today')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                periodPreset === 'today' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              اليوم
            </button>
            <button
              onClick={() => handlePresetChange('this_month')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                periodPreset === 'this_month' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              هذا الشهر
            </button>
            <button
              onClick={() => handlePresetChange('last_month')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                periodPreset === 'last_month' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              الشهر السابق
            </button>
            <button
              onClick={() => handlePresetChange('year')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                periodPreset === 'year' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              هذا العام
            </button>
            <button
              onClick={() => setPeriodPreset('custom')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                periodPreset === 'custom' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600'
              }`}
            >
              فترة مخصصة (من - إلى)
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">من:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPeriodPreset('custom');
              }}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50"
            />
            <span className="text-slate-500 font-medium">إلى:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPeriodPreset('custom');
              }}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50"
            />
          </div>
        </div>
      </div>

      {/* Report Sub-Tabs (Screen Only) */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 no-print overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveReportTab('pnl')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all ${
            activeReportTab === 'pnl'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>المبيعات، المشتريات، والأرباح</span>
        </button>

        <button
          onClick={() => setActiveReportTab('parties')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all ${
            activeReportTab === 'parties'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users2 className="w-4 h-4" />
          <span>أرصدة العملاء والموردين</span>
        </button>

        <button
          onClick={() => setActiveReportTab('treasuries')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all ${
            activeReportTab === 'treasuries'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Landmark className="w-4 h-4" />
          <span>أرصدة الخزائن والمصارف</span>
        </button>

        <button
          onClick={() => setActiveReportTab('employees')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all ${
            activeReportTab === 'employees'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <UserSquare2 className="w-4 h-4" />
          <span>مستحقات وعمولات الموظفين</span>
        </button>
      </div>

      {/* 
        ====================================================================
        PRINTABLE REPORT CONTAINER (Isolated for pristine A4 paper printing)
        ====================================================================
      */}
      <div id="reportsPrintableArea" className="space-y-6">
        {/* Executive Printable Company Header (Visible on print & in standalone preview) */}
        <div className="hidden print:block border-b-2 border-slate-900 pb-3 mb-5">
          <div className="flex items-center justify-between gap-4">
            {/* Right: Company Logo & Identity */}
            <div className="flex items-center gap-3 text-right">
              {printStyles.showLogo && (
                <>
                  {settings.logoUrl ? (
                    <div
                      className={`${printStyles.logoWrapperClass} rounded-lg overflow-hidden flex items-center justify-center p-0.5 bg-white border border-slate-300 shrink-0`}
                    >
                      <img
                        src={settings.logoUrl}
                        alt={settings.companyName}
                        className={printStyles.logoImgClass}
                      />
                    </div>
                  ) : (
                    <div
                      className={`${printStyles.logoWrapperClass} rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0`}
                    >
                      <Building className={`${printStyles.fallbackIconClass} text-emerald-400`} />
                    </div>
                  )}
                </>
              )}

              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight leading-tight">
                  {settings.companyName}
                </h1>
                <div className="text-xs text-slate-600 mt-1 space-y-0.5">
                  {printStyles.showAddressPhone && (
                    <div className="flex items-center gap-3">
                      {settings.phone && <span>هاتف: {settings.phone}</span>}
                      {settings.address && <span>• المقر: {settings.address}</span>}
                    </div>
                  )}
                  <div className="flex items-center gap-3 font-mono text-[11px]">
                    {printStyles.showTaxAndCR && settings.commercialRegister && (
                      <span>س.ت: {settings.commercialRegister}</span>
                    )}
                    {printStyles.showTaxAndCR && settings.taxNumber && (
                      <span>• ر.ض: {settings.taxNumber}</span>
                    )}
                    {printStyles.showEmail && settings.email && (
                      <span>• {settings.email}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Left: Report Document Badge & Period */}
            <div className="text-left bg-slate-50 border-2 border-slate-900 rounded-xl p-3 min-w-[240px] shrink-0 text-slate-900">
              <div className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1.5 text-right">
                {getReportTitle()}
              </div>

              <div className="text-[11px] text-slate-700 mt-1.5 space-y-1 text-right">
                <div className="flex justify-between items-center gap-2">
                  <span className="font-semibold text-slate-500">الفترة المالية:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {activeReportTab === 'pnl' ? `من ${startDate} إلى ${endDate}` : `حتى تاريخ ${endDate}`}
                  </span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="font-semibold text-slate-500">تاريخ الطباعة:</span>
                  <span className="font-mono text-slate-800">{new Date().toLocaleDateString('ar-LY')}</span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="font-semibold text-slate-500">المحاسب المسؤول:</span>
                  <span className="font-bold text-slate-900">{currentUser.fullName}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 
          ====================================================================
          TAB 1: P&L REPORT
          ====================================================================
        */}
        {activeReportTab === 'pnl' && (
        <div className="space-y-6">
          {/* Main 4 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-white border border-emerald-200 shadow-2xs print:border-slate-800 print:shadow-none">
              <span className="text-xs font-bold text-emerald-800 block mb-1">إجمالي المبيعات بالفترة</span>
              <div className="text-xl font-black text-emerald-950 font-mono">
                {financialSummary.salesTotal.toLocaleString()} <span className="text-xs font-normal text-slate-500">{settings.currency}</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                {periodInvoices.filter((i) => i.type === 'sale').length} فاتورة مبيعات
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-blue-200 shadow-2xs print:border-slate-800 print:shadow-none">
              <span className="text-xs font-bold text-blue-800 block mb-1">إجمالي المشتريات بالفترة</span>
              <div className="text-xl font-black text-blue-950 font-mono">
                {financialSummary.purchasesTotal.toLocaleString()} <span className="text-xs font-normal text-slate-500">{settings.currency}</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                {periodInvoices.filter((i) => i.type === 'purchase').length} فاتورة مشتريات
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-rose-200 shadow-2xs print:border-slate-800 print:shadow-none">
              <span className="text-xs font-bold text-rose-800 block mb-1">المصروفات التشغيلية</span>
              <div className="text-xl font-black text-rose-950 font-mono">
                {financialSummary.expensesTotal.toLocaleString()} <span className="text-xs font-normal text-slate-500">{settings.currency}</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                {periodInvoices.filter((i) => i.type === 'expense').length} فاتورة مصروف
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-amber-200 shadow-2xs bg-amber-50/20 print:border-slate-800 print:bg-white print:shadow-none">
              <span className="text-xs font-bold text-amber-800 block mb-1">نسب وعمولات الموظفين</span>
              <div className="text-xl font-black text-amber-950 font-mono">
                {financialSummary.commissionsTotal.toLocaleString()} <span className="text-xs font-normal text-slate-500">{settings.currency}</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">مكافآت مستحقة عن الفواتير</span>
            </div>
          </div>

          {/* Profit & Loss Calculation Box (Permission Protected) */}
          {perms.canViewProfitAndLoss ? (
            <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-xl space-y-4 print:bg-white print:text-slate-950 print:border-2 print:border-slate-900 print:shadow-none print:p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700/80 pb-4 print:border-slate-900">
                <div>
                  <h3 className="text-lg font-black flex items-center gap-2 print:text-slate-950">
                    <TrendingUp className="w-5 h-5 text-emerald-400 print:text-slate-900" />
                    <span>تقرير الأرباح والخسائر التقديري للفترة المحددّة</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 print:text-slate-600">
                    الفترة من <span className="text-white font-mono print:text-slate-900 font-bold">{startDate}</span> إلى{' '}
                    <span className="text-white font-mono print:text-slate-900 font-bold">{endDate}</span>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block font-medium print:text-slate-600">صافي الربح / الخسارة</span>
                  <div
                    className={`text-2xl sm:text-3xl font-black font-mono ${
                      financialSummary.netProfit >= 0 ? 'text-emerald-400 print:text-emerald-800' : 'text-rose-400 print:text-rose-800'
                    }`}
                  >
                    {financialSummary.netProfit >= 0 ? '+' : ''}
                    {financialSummary.netProfit.toLocaleString()} <span className="text-sm font-normal text-slate-300 print:text-slate-700">{settings.currency}</span>
                  </div>
                </div>
              </div>

              {/* Equation breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2">
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 print:bg-slate-50 print:border-slate-300 print:rounded-xl">
                  <span className="text-slate-400 block mb-1 print:text-slate-600 font-semibold">إجمالي الإيرادات (المبيعات):</span>
                  <span className="font-extrabold text-emerald-300 text-base font-mono print:text-slate-900">
                    +{financialSummary.salesTotal.toLocaleString()} {settings.currency}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 print:bg-slate-50 print:border-slate-300 print:rounded-xl">
                  <span className="text-slate-400 block mb-1 print:text-slate-600 font-semibold">إجمالي التكاليف والمصروفات والعمولات:</span>
                  <span className="font-extrabold text-rose-300 text-base font-mono print:text-slate-900">
                    -{financialSummary.totalCosts.toLocaleString()} {settings.currency}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 print:bg-slate-50 print:border-slate-300 print:rounded-xl">
                  <span className="text-slate-400 block mb-1 print:text-slate-600 font-semibold">هامش الربح التشغيلي:</span>
                  <span className="font-extrabold text-amber-300 text-base font-mono print:text-slate-900">
                    {financialSummary.profitMargin.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-slate-100 border border-slate-200 text-center text-slate-500 text-xs">
              <Lock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="font-bold text-slate-700">تقرير الأرباح والخسائر محجوب عن حسابك</p>
              <p className="text-[11px] text-slate-400 mt-1">تتطلب هذه البيانات صلاحية مدير النظام المالي الحساسة</p>
            </div>
          )}

          {/* List of Invoices for this period */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden print:border-slate-800 print:shadow-none">
            <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs print:bg-slate-100 print:border-slate-800">
              <span className="font-bold text-slate-800">بيان تفاصيل فواتير الفترة ({periodInvoices.length} فاتورة مسجلة)</span>
              <span className="font-semibold text-slate-600 print:block">العملة: {settings.currency}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 print:bg-slate-200 print:border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">رقم الفاتورة</th>
                    <th className="py-2.5 px-3">النوع</th>
                    <th className="py-2.5 px-3">الطرف</th>
                    <th className="py-2.5 px-3">التاريخ</th>
                    <th className="py-2.5 px-3">القيمة الإجمالية</th>
                    <th className="py-2.5 px-3">المسدد نقداً/بنك</th>
                    <th className="py-2.5 px-3">المتبقي (آجل)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 print:divide-slate-300">
                  {periodInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 print:border print:border-slate-400">
                          {inv.type === 'sale' ? 'مبيعات' : inv.type === 'purchase' ? 'مشتريات' : 'مصروف'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-800 font-semibold">
                        {(() => {
                          const matchingParty = parties.find(
                            (p) => p.id === inv.partyId || p.name === inv.partyName
                          );
                          if (matchingParty) {
                            return (
                              <button
                                type="button"
                                onClick={() => handleOpenPartyStatement(matchingParty)}
                                className="text-right hover:text-emerald-700 hover:underline transition-colors font-semibold cursor-pointer inline-flex items-center gap-1 group"
                                title="انقر لعرض كشف حساب هذا الطرف"
                              >
                                <span>{inv.partyName}</span>
                                <ExternalLink className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity print:hidden" />
                              </button>
                            );
                          }
                          return <span>{inv.partyName}</span>;
                        })()}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 font-mono whitespace-nowrap">{inv.date}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 font-mono">{inv.totalAmount.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-emerald-700 font-mono font-medium">{inv.paidAmount.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-rose-700 font-mono font-medium">
                        {(inv.totalAmount - inv.paidAmount).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-800 print:bg-slate-200">
                  <tr>
                    <td colSpan={4} className="py-3 px-3 text-right">
                      إجمالي مبالغ فواتير الفترة ({periodInvoices.length} فاتورة):
                    </td>
                    <td className="py-3 px-3 font-black font-mono">
                      {periodInvoices.reduce((acc, i) => acc + i.totalAmount, 0).toLocaleString()} {settings.currency}
                    </td>
                    <td className="py-3 px-3 font-black text-emerald-800 font-mono">
                      {periodInvoices.reduce((acc, i) => acc + i.paidAmount, 0).toLocaleString()} {settings.currency}
                    </td>
                    <td className="py-3 px-3 font-black text-rose-800 font-mono">
                      {periodInvoices.reduce((acc, i) => acc + (i.totalAmount - i.paidAmount), 0).toLocaleString()} {settings.currency}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 
        ====================================================================
        TAB 2: PARTIES (CUSTOMERS & SUPPLIERS) REPORT
        ====================================================================
      */}
      {activeReportTab === 'parties' && (
        <div className="space-y-5">
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-white border border-rose-200 shadow-2xs print:border-slate-800 print:shadow-none">
              <span className="text-xs font-bold text-rose-800 block mb-1">إجمالي ديون المنشأة (لنا على العملاء)</span>
              <div className="text-xl font-black text-rose-950 font-mono">
                {partiesTotals.totalDebit.toLocaleString()} <span className="text-xs font-normal text-slate-500">{settings.currency}</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">إجمالي الذمم المدينة</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-blue-200 shadow-2xs print:border-slate-800 print:shadow-none">
              <span className="text-xs font-bold text-blue-800 block mb-1">إجمالي التزامات المنشأة (علينا للموردين)</span>
              <div className="text-xl font-black text-blue-950 font-mono">
                {partiesTotals.totalCredit.toLocaleString()} <span className="text-xs font-normal text-slate-500">{settings.currency}</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">إجمالي الذمم الدائنة</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-300 shadow-2xs print:border-slate-800 print:shadow-none">
              <span className="text-xs font-bold text-slate-700 block mb-1">المركز المالي الصافي للذمم</span>
              <div className={`text-xl font-black font-mono ${partiesTotals.netDifference >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {partiesTotals.netDifference >= 0 ? '+' : ''}
                {partiesTotals.netDifference.toLocaleString()} <span className="text-xs font-normal text-slate-500">{settings.currency}</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                {partiesTotals.netDifference >= 0 ? 'فائض لصالح المنشأة' : 'عجز والتزامات فائضة'}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden print:border-slate-800 print:shadow-none">
            <div className="p-3.5 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-800 flex flex-wrap justify-between items-center gap-2 print:bg-slate-100 print:border-slate-800">
              <div className="flex items-center gap-2">
                <span>كشف أرصدة وميزان مراجعة العملاء والموردين الشامل ({partiesSummary.length} حساب)</span>
                <span className="hidden sm:inline-block text-[11px] font-normal text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200 print:hidden">
                  💡 انقر على أي حساب أو زر كشف المعاملات للاطلاع على تفاصيل فواتيره وسنداته
                </span>
              </div>
              <span className="font-semibold text-slate-600">العملة: {settings.currency}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 print:bg-slate-200 print:border-slate-800">
                  <tr>
                    <th className="py-3 px-3.5">#</th>
                    <th className="py-3 px-3.5">اسم الحساب</th>
                    <th className="py-3 px-3.5">التصنيف</th>
                    <th className="py-3 px-3.5 text-rose-700">إجمالي المدين (عليه)</th>
                    <th className="py-3 px-3.5 text-blue-700">إجمالي الدائن (له)</th>
                    <th className="py-3 px-3.5">الرصيد الصافي</th>
                    <th className="py-3 px-3.5">الحالة</th>
                    <th className="py-3 px-3.5 text-center print:hidden">كشف المعاملات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 print:divide-slate-300">
                  {partiesSummary.map((row, idx) => (
                    <tr
                      key={row.party.id}
                      onClick={() => handleOpenPartyStatement(row.party)}
                      className="hover:bg-emerald-50/70 cursor-pointer transition-colors group"
                      title="انقر لعرض كشف حساب ومعاملات هذا الحساب"
                    >
                      <td className="py-3 px-3.5 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-3.5 font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                        <div className="flex items-center justify-between gap-2">
                          <span className="underline decoration-dotted decoration-slate-300 group-hover:decoration-emerald-500">
                            {row.party.name}
                          </span>
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md print:hidden flex items-center gap-1">
                            <FileSpreadsheet className="w-3 h-3" />
                            <span>كشف الحساب</span>
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3.5 text-slate-500">
                        {row.party.type === 'customer'
                          ? 'عميل'
                          : row.party.type === 'supplier'
                          ? 'مورد'
                          : 'حساب عام (مورد وعميل)'}
                      </td>
                      <td className="py-3 px-3.5 font-bold text-rose-600 font-mono">{row.debit.toLocaleString()}</td>
                      <td className="py-3 px-3.5 font-bold text-blue-600 font-mono">{row.credit.toLocaleString()}</td>
                      <td className="py-3 px-3.5 font-black text-sm text-slate-900 font-mono">
                        {Math.abs(row.net).toLocaleString()} {settings.currency}
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            row.status === 'debit'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200 print:bg-white print:border-rose-400'
                              : row.status === 'credit'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200 print:bg-white print:border-blue-400'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200 print:bg-white print:border-emerald-400'
                          }`}
                        >
                          {row.status === 'debit'
                            ? 'عليه (مطلوب منه)'
                            : row.status === 'credit'
                            ? 'له (مستحق له)'
                            : 'متزن (0)'}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-center print:hidden" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleOpenPartyStatement(row.party)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors shadow-2xs cursor-pointer"
                          title="عرض كشف حساب معاملات هذا الحساب"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                          <span>كشف الحساب</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-800 print:bg-slate-200">
                  <tr>
                    <td colSpan={3} className="py-3 px-3.5 text-right">
                      المجموع العام ({partiesSummary.length} حساب):
                    </td>
                    <td className="py-3 px-3.5 font-black text-rose-800 font-mono">
                      {partiesTotals.totalDebit.toLocaleString()} {settings.currency}
                    </td>
                    <td className="py-3 px-3.5 font-black text-blue-800 font-mono">
                      {partiesTotals.totalCredit.toLocaleString()} {settings.currency}
                    </td>
                    <td colSpan={2} className="py-3 px-3.5 font-black text-slate-900 font-mono">
                      الصافي: {partiesTotals.netDifference.toLocaleString()} {settings.currency}
                    </td>
                    <td className="print:hidden"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 
        ====================================================================
        TAB 3: TREASURIES REPORT
        ====================================================================
      */}
      {activeReportTab === 'treasuries' && (
        <div className="space-y-5">
          {/* Summary Card */}
          <div className="p-4 rounded-2xl bg-white border border-emerald-200 shadow-2xs print:border-slate-800 print:shadow-none">
            <span className="text-xs font-bold text-emerald-800 block mb-1">إجمالي السيولة المالية الحالية (النقدية والمصرفية)</span>
            <div className="text-2xl font-black text-emerald-950 font-mono">
              {treasuriesTotals.totalCurrent.toLocaleString()} <span className="text-sm font-normal text-slate-500">{settings.currency}</span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              رصيد البداية الإجمالي: {treasuriesTotals.totalOpening.toLocaleString()} {settings.currency}
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden print:border-slate-800 print:shadow-none">
            <div className="p-3.5 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-800 flex flex-wrap justify-between items-center gap-2 print:bg-slate-100 print:border-slate-800">
              <div className="flex items-center gap-2">
                <span>أرصدة الخزائن والمصارف والسيولة اللحظية ({treasuries.length} خزينة/حساب)</span>
                <span className="hidden sm:inline-block text-[11px] font-normal text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200 print:hidden">
                  💡 انقر على أي خزينة أو مصرف لعرض كشف الحركات والسيولة
                </span>
              </div>
              <span className="font-semibold text-slate-600">العملة: {settings.currency}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 print:bg-slate-200 print:border-slate-800">
                  <tr>
                    <th className="py-3 px-3.5">الخزينة / المصرف</th>
                    <th className="py-3 px-3.5">النوع</th>
                    <th className="py-3 px-3.5">رقم الحساب</th>
                    <th className="py-3 px-3.5">رصيد البداية</th>
                    <th className="py-3 px-3.5 text-emerald-800">الرصيد الفعلي الحالي</th>
                    <th className="py-3 px-3.5 text-center print:hidden">كشف الحركات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 print:divide-slate-300">
                  {treasuries.map((t) => {
                    const bal = getTreasuryBalance(t.id);
                    return (
                      <tr
                        key={t.id}
                        onClick={() => handleOpenTreasuryStatement(t)}
                        className="hover:bg-emerald-50/70 cursor-pointer transition-colors group"
                        title="انقر لعرض كشف حركات الخزينة / المصرف"
                      >
                        <td className="py-3 px-3.5 font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                          <div className="flex items-center justify-between gap-2">
                            <span className="underline decoration-dotted decoration-slate-300 group-hover:decoration-emerald-500">
                              {t.name}
                            </span>
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md print:hidden flex items-center gap-1">
                              <FileSpreadsheet className="w-3 h-3" />
                              <span>كشف الحركات</span>
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3.5 text-slate-500">{t.type === 'cash' ? 'خزينة نقدية (صندوق)' : 'حساب مصرفي'}</td>
                        <td className="py-3 px-3.5 font-mono text-slate-600">{t.accountNumber || '-'}</td>
                        <td className="py-3 px-3.5 text-slate-600 font-mono">{t.openingBalance.toLocaleString()} {settings.currency}</td>
                        <td className="py-3 px-3.5 font-black text-sm text-emerald-700 font-mono">
                          {bal.toLocaleString()} {settings.currency}
                        </td>
                        <td className="py-3 px-3.5 text-center print:hidden" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => handleOpenTreasuryStatement(t)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors shadow-2xs cursor-pointer"
                            title="عرض كشف حركات الخزينة / المصرف"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                            <span>كشف الحركات</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-800 print:bg-slate-200">
                  <tr>
                    <td colSpan={3} className="py-3 px-3.5 text-right">
                      إجمالي السيولة المتاحة:
                    </td>
                    <td className="py-3 px-3.5 font-bold text-slate-700 font-mono">
                      {treasuriesTotals.totalOpening.toLocaleString()} {settings.currency}
                    </td>
                    <td className="py-3 px-3.5 font-black text-emerald-800 font-mono text-sm">
                      {treasuriesTotals.totalCurrent.toLocaleString()} {settings.currency}
                    </td>
                    <td className="print:hidden"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 
        ====================================================================
        TAB 4: EMPLOYEES REPORT
        ====================================================================
      */}
      {activeReportTab === 'employees' && (
        <div className="space-y-5">
          {perms.canViewEmployeeFinancials ? (
            <>
              {/* Summary Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs print:border-slate-800 print:shadow-none">
                  <span className="text-xs font-bold text-slate-600 block mb-1">إجمالي الرواتب الأساسية</span>
                  <div className="text-xl font-black text-slate-900 font-mono">
                    {employeesTotals.totalBaseSalaries.toLocaleString()} <span className="text-xs font-normal text-slate-500">{settings.currency}</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-amber-200 shadow-2xs print:border-slate-800 print:shadow-none">
                  <span className="text-xs font-bold text-amber-800 block mb-1">إجمالي عمولات الفواتير</span>
                  <div className="text-xl font-black text-amber-950 font-mono">
                    {employeesTotals.totalCommissions.toLocaleString()} <span className="text-xs font-normal text-slate-500">{settings.currency}</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-rose-200 shadow-2xs print:border-slate-800 print:shadow-none">
                  <span className="text-xs font-bold text-rose-800 block mb-1">إجمالي السلف والخصومات</span>
                  <div className="text-xl font-black text-rose-950 font-mono">
                    {employeesTotals.totalAdvances.toLocaleString()} <span className="text-xs font-normal text-slate-500">{settings.currency}</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-emerald-200 shadow-2xs print:border-slate-800 print:shadow-none">
                  <span className="text-xs font-bold text-emerald-800 block mb-1">إجمالي الصافي المستحق</span>
                  <div className="text-xl font-black text-emerald-950 font-mono">
                    {employeesTotals.totalNetDue.toLocaleString()} <span className="text-xs font-normal text-slate-500">{settings.currency}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden print:border-slate-800 print:shadow-none">
                <div className="p-3.5 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-800 flex flex-wrap justify-between items-center gap-2 print:bg-slate-100 print:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span>كشف مستحقات وسلف الموظفين ونسب الفواتير ({employees.length} موظف)</span>
                    <span className="hidden sm:inline-block text-[11px] font-normal text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200 print:hidden">
                      💡 انقر على أي موظف لعرض كشف حسابه التفصيلي
                    </span>
                  </div>
                  <span className="font-semibold text-slate-600">العملة: {settings.currency}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 print:bg-slate-200 print:border-slate-800">
                      <tr>
                        <th className="py-3 px-3.5">اسم الموظف</th>
                        <th className="py-3 px-3.5">المسمى الوظيفي</th>
                        <th className="py-3 px-3.5">الراتب الأساسي</th>
                        <th className="py-3 px-3.5 text-amber-700">نسب الفواتير</th>
                        <th className="py-3 px-3.5 text-rose-700">السلف والمسحوبات</th>
                        <th className="py-3 px-3.5 text-purple-700">ما تم صرفه</th>
                        <th className="py-3 px-3.5 text-emerald-800">الصافي المتبقي</th>
                        <th className="py-3 px-3.5 text-center print:hidden">كشف الحساب</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 print:divide-slate-300">
                      {employees.map((emp) => {
                        const stmt = getEmployeeStatement(emp.id);
                        return (
                          <tr
                            key={emp.id}
                            onClick={() => handleOpenEmployeeStatement(emp)}
                            className="hover:bg-emerald-50/70 cursor-pointer transition-colors group"
                            title="انقر لعرض كشف حساب الموظف التفصيلي"
                          >
                            <td className="py-3 px-3.5 font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                              <div className="flex items-center justify-between gap-2">
                                <span className="underline decoration-dotted decoration-slate-300 group-hover:decoration-emerald-500">
                                  {emp.name}
                                </span>
                                <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md print:hidden flex items-center gap-1">
                                  <FileSpreadsheet className="w-3 h-3" />
                                  <span>كشف الحساب</span>
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-3.5 text-slate-500">{emp.jobTitle}</td>
                            <td className="py-3 px-3.5 text-slate-700 font-mono">{emp.baseSalary.toLocaleString()}</td>
                            <td className="py-3 px-3.5 font-bold text-amber-700 font-mono">+{stmt.totalCommissions.toLocaleString()}</td>
                            <td className="py-3 px-3.5 font-bold text-rose-700 font-mono">-{stmt.totalAdvances.toLocaleString()}</td>
                            <td className="py-3 px-3.5 text-purple-700 font-mono">{stmt.totalPayouts.toLocaleString()}</td>
                            <td className="py-3 px-3.5 font-black text-sm text-emerald-700 font-mono">
                              {stmt.netDue.toLocaleString()} {settings.currency}
                            </td>
                            <td className="py-3 px-3.5 text-center print:hidden" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => handleOpenEmployeeStatement(emp)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors shadow-2xs cursor-pointer"
                                title="عرض كشف حساب الموظف التفصيلي"
                              >
                                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                                <span>كشف الحساب</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-800 print:bg-slate-200">
                      <tr>
                        <td colSpan={2} className="py-3 px-3.5 text-right">
                          المجموع الإجمالي:
                        </td>
                        <td className="py-3 px-3.5 font-bold font-mono">{employeesTotals.totalBaseSalaries.toLocaleString()}</td>
                        <td className="py-3 px-3.5 font-bold text-amber-800 font-mono">+{employeesTotals.totalCommissions.toLocaleString()}</td>
                        <td className="py-3 px-3.5 font-bold text-rose-800 font-mono">-{employeesTotals.totalAdvances.toLocaleString()}</td>
                        <td className="py-3 px-3.5 font-bold text-purple-800 font-mono">{employeesTotals.totalPayouts.toLocaleString()}</td>
                        <td className="py-3 px-3.5 font-black text-emerald-800 font-mono text-sm">
                          {employeesTotals.totalNetDue.toLocaleString()} {settings.currency}
                        </td>
                        <td className="print:hidden"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="p-8 rounded-2xl bg-slate-100 border border-slate-200 text-center text-slate-500 text-xs">
              <Lock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="font-bold text-slate-700">بيانات رواتب الموظفين محجوبة عن صلاحيات حسابك</p>
            </div>
          )}
        </div>
      )}

      {/* 
        ====================================================================
        PROFESSIONAL PRINT-ONLY EXECUTIVE SIGN-OFF FOOTER (No stamp box)
        ====================================================================
      */}
      <div className="hidden print:block mt-12 pt-6 border-t-2 border-slate-900">
        <div className="grid grid-cols-2 gap-12 text-center text-xs text-slate-800">
          <div className="flex flex-col justify-between h-28 border-t-2 border-slate-800 pt-3">
            <span className="font-black text-slate-950">إعداد وتدقيق المحاسب المسؤول</span>
            <span className="text-[11px] text-slate-600">المحاسب: {currentUser.fullName}</span>
            <span className="text-[11px] text-slate-400">التوقيع: .................................................</span>
          </div>

          <div className="flex flex-col justify-between h-28 border-t-2 border-slate-800 pt-3">
            <span className="font-black text-slate-950">اعتماد الإدارة المالية / المدير العام</span>
            <span className="text-[11px] text-slate-600">{settings.companyName}</span>
            <span className="text-[11px] text-slate-400">التوقيع والاعتماد: .................................................</span>
          </div>
        </div>

        {/* Legal Disclaimer & Verification */}
        <div className="mt-8 pt-3 border-t border-slate-300 flex items-center justify-between text-[10px] text-slate-500 font-mono">
          <span>تم استخراج هذا التقرير آلياً من المنظومة المحاسبية المعتمدة • يعتبر هذا الكشف ملزماً بعد اعتماده وتوقيعه</span>
          <span>تاريخ الطباعة: {new Date().toLocaleDateString('ar-LY')} - {new Date().toLocaleTimeString('ar-LY')}</span>
        </div>
      </div>
      {/* End of reportsPrintableArea */}
      </div>

      <FiscalYearsArchiveModal
        isOpen={showArchiveModal}
        onClose={() => setShowArchiveModal(false)}
        onOpenCloseYearWizard={() => setShowCloseYearModal(true)}
      />

      <CloseFiscalYearModal
        isOpen={showCloseYearModal}
        onClose={() => setShowCloseYearModal(false)}
        onOpenArchive={() => setShowArchiveModal(true)}
      />

      {/* Account Transactions Statement Modals */}
      <PartyStatementModal
        isOpen={isPartyStatementOpen}
        onClose={() => {
          setIsPartyStatementOpen(false);
          setSelectedPartyForStatement(null);
        }}
        party={selectedPartyForStatement}
      />

      <TreasuryStatementModal
        isOpen={isTreasuryStatementOpen}
        onClose={() => {
          setIsTreasuryStatementOpen(false);
          setSelectedTreasuryForStatement(null);
        }}
        treasury={selectedTreasuryForStatement}
      />

      <EmployeeStatementModal
        isOpen={isEmployeeStatementOpen}
        onClose={() => {
          setIsEmployeeStatementOpen(false);
          setSelectedEmployeeForStatement(null);
        }}
        employee={selectedEmployeeForStatement}
      />
    </div>
  );
};
