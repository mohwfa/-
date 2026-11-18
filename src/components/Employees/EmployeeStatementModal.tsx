import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Employee } from '../../types';
import {
  UserSquare2,
  X,
  Printer,
  Calendar,
  DollarSign,
  TrendingUp,
  Percent,
  PlusCircle,
  Clock,
  Briefcase,
  ExternalLink,
  Building,
} from 'lucide-react';
import { printElement, openPrintWindow, downloadPrintableHtml } from '../../utils/printHelper';
import { getPrintStyles } from '../../utils/printStyleHelper';
import { Download } from 'lucide-react';

interface EmployeeStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
}

export const EmployeeStatementModal: React.FC<EmployeeStatementModalProps> = ({
  isOpen,
  onClose,
  employee,
}) => {
  const {
    getEmployeeStatement,
    deleteEmployeeTransaction,
    settings,
    currentUser,
    addToast,
  } = useApp();

  const printStyles = getPrintStyles(settings);

  const [selectedMonth, setSelectedMonth] = useState('');

  const statement = useMemo(() => {
    if (!employee) {
      return {
        employee: null,
        baseSalary: 0,
        totalSalariesAccrued: 0,
        totalCommissions: 0,
        totalBonuses: 0,
        totalAdvances: 0,
        totalDeductions: 0,
        totalPayouts: 0,
        netDue: 0,
        transactions: [],
      };
    }
    return getEmployeeStatement(employee.id, selectedMonth || undefined);
  }, [employee, selectedMonth, getEmployeeStatement]);

  if (!isOpen || !employee) return null;

  const handlePrint = () => {
    addToast('info', 'جارِ تجهيز كشف حساب الموظف للطباعة بمقاس A4...');
    const printed = printElement('employeePrintableArea', {
      title: `كشف_حساب_${employee.name}`,
      companyName: settings.companyName,
      paperSize: 'A4',
    });
    if (printed) {
      addToast('success', 'تم استدعاء أمر الطباعة بنجاح');
    }
  };

  const handleOpenStandalone = () => {
    addToast('info', 'جارِ فتح كشف الحساب في نافذة طباعة مستقلة...');
    const win = openPrintWindow('employeePrintableArea', {
      title: `كشف_حساب_${employee.name}`,
      companyName: settings.companyName,
      paperSize: 'A4',
      autoPrint: true,
    });
    if (win) {
      addToast('success', 'تم فتح كشف الحساب في نافذة مستقلة للطباعة بمقاس A4');
    } else {
      // Fallback to direct iframe print if popup blocker intervened
      printElement('employeePrintableArea', {
        title: `كشف_حساب_${employee.name}`,
        companyName: settings.companyName,
        paperSize: 'A4',
      });
      addToast('info', 'تم تحويل أمر الطباعة تلقائياً للمعاينة المباشرة لتجاوز حظر النوافذ');
    }
  };

  const handleDownloadHtml = () => {
    downloadPrintableHtml('employeePrintableArea', `كشف_حساب_${employee.name}`, {
      title: `كشف_حساب_${employee.name}`,
      companyName: settings.companyName,
      paperSize: 'A4',
    });
    addToast('success', 'تم تنزيل كشف الحساب بصيغة HTML جاهز للطباعة أو حفظ PDF');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      {/* Scoped A4 Portrait Page Print Rule */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait !important;
            margin: 8mm 10mm !important;
          }
        }
      `}</style>

      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[94vh] print-card-container">
        {/* Header (Screen Only) */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 bg-slate-50 no-print">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <UserSquare2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900">{employee.name}</h2>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                  {employee.jobTitle}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                  مقاس A4
                </span>
              </div>
              <p className="text-xs text-slate-500">
                كشف حساب تفصيلي: الراتب، نسب الفواتير، السلف، الخصومات والمكافآت
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة كشف الحساب (A4)</span>
            </button>
            <button
              onClick={handleOpenStandalone}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="فتح في نافذة مستقلة للطباعة دون قيود المتصفح"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-300" />
              <span className="hidden sm:inline">نافذة مستقلة (A4)</span>
            </button>
            <button
              onClick={handleDownloadHtml}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 rounded-xl transition-colors cursor-pointer"
              title="تنزيل كشف الحساب بصيغة HTML جاهز للطباعة"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Content (Formatted for A4) */}
        <div
          id="employeePrintableArea"
          className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm flex-1 print:p-0 print:bg-white a4-paper-sheet max-w-[210mm] mx-auto w-full"
        >
          {/* Executive Printable Company Header (Configurable Logo + Company Info) */}
          <div className="border-b-2 border-slate-900 pb-3 mb-4">
            <div className="flex items-center justify-between gap-3">
              {/* Right: Small Logo + Company Name */}
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
                  <div className="text-[11px] text-slate-600 mt-0.5 space-y-0.5">
                    {printStyles.showAddressPhone && (
                      <div className="flex items-center gap-2">
                        {settings.phone && <span>هاتف: {settings.phone}</span>}
                        {settings.address && <span>• المقر: {settings.address}</span>}
                      </div>
                    )}
                    <div className="flex items-center gap-2 font-mono text-[10px]">
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

              {/* Left: Document Badge */}
              <div className="text-left bg-slate-50 border-2 border-slate-900 rounded-xl p-2.5 min-w-[210px] shrink-0 text-slate-900">
                <div className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 text-right">
                  كشف حساب ومستحقات الموظف
                </div>
                <div className="text-[11px] text-slate-700 mt-1 space-y-0.5 text-right font-mono">
                  <div className="flex justify-between gap-2">
                    <span className="font-semibold text-slate-500">الفترة:</span>
                    <span className="font-bold text-slate-900">{selectedMonth || 'كافة الفترات'}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="font-semibold text-slate-500">تاريخ الطباعة:</span>
                    <span className="font-bold text-slate-900">{new Date().toLocaleDateString('ar-LY')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Top Filter Controls (Screen Only) */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 no-print">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">تصفية حسب شهر الاستحقاق:</span>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-white font-bold"
              />
              {selectedMonth && (
                <button
                  onClick={() => setSelectedMonth('')}
                  className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                >
                  كافة الفترات
                </button>
              )}
            </div>

            <div className="text-xs text-slate-600">
              الراتب الشهري الأساسي:{' '}
              <strong className="text-slate-900 font-mono">
                {employee.baseSalary.toLocaleString()} {settings.currency}
              </strong>
            </div>
          </div>

          {/* Employee Header & Big Net Due Card */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-300 flex flex-wrap items-center justify-between gap-3 print:bg-slate-50 print:border-slate-800">
            <div>
              <span className="text-slate-500 block text-[11px]">اسم الموظف / الوظيفة:</span>
              <div className="font-black text-slate-950 text-base">{employee.name}</div>
              <span className="text-xs text-slate-600 block">{employee.jobTitle}</span>
            </div>
            <div className="bg-emerald-50 px-4 py-2.5 rounded-xl border-2 border-emerald-600 text-center print:bg-white print:border-slate-800">
              <span className="text-[10px] font-bold text-emerald-900 block">صافي الرصيد المستحق للموظف:</span>
              <div className="text-xl font-black text-emerald-950 font-mono mt-0.5">
                {statement.netDue.toLocaleString()} <span className="text-xs font-bold">{settings.currency}</span>
              </div>
            </div>
          </div>

          {/* Breakdown KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-center">
            <div className="p-2.5 rounded-xl bg-white border border-slate-300 print:border-slate-800">
              <span className="text-[10px] text-slate-500 block font-bold">
                {statement.totalSalariesAccrued > 0 ? 'الرواتب المثبتة' : 'الراتب الأساسي'}
              </span>
              <span className="font-extrabold text-slate-900 text-xs sm:text-sm font-mono">
                {(statement.totalSalariesAccrued > 0
                  ? statement.totalSalariesAccrued
                  : statement.baseSalary
                ).toLocaleString()}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-300 print:bg-white print:border-slate-800">
              <span className="text-[10px] text-amber-800 block font-bold">نسب الفواتير</span>
              <span className="font-black text-amber-950 text-xs sm:text-sm font-mono">
                +{statement.totalCommissions.toLocaleString()}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 print:bg-white print:border-slate-800">
              <span className="text-[10px] text-emerald-800 block font-bold">المكافآت</span>
              <span className="font-black text-emerald-950 text-xs sm:text-sm font-mono">
                +{statement.totalBonuses.toLocaleString()}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-300 print:bg-white print:border-slate-800">
              <span className="text-[10px] text-rose-800 block font-bold">السلف المسحوبة</span>
              <span className="font-black text-rose-900 text-xs sm:text-sm font-mono">
                -{statement.totalAdvances.toLocaleString()}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-300 print:bg-white print:border-slate-800">
              <span className="text-[10px] text-rose-800 block font-bold">الخصومات</span>
              <span className="font-black text-rose-900 text-xs sm:text-sm font-mono">
                -{statement.totalDeductions.toLocaleString()}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-300 print:bg-white print:border-slate-800">
              <span className="text-[10px] text-purple-800 block font-bold">ما صُرف له</span>
              <span className="font-black text-purple-950 text-xs sm:text-sm font-mono">
                {statement.totalPayouts.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Statement Movements Table */}
          <div className="border border-slate-300 rounded-xl overflow-hidden shadow-2xs print:border-slate-800 print:shadow-none">
            <table className={`w-full text-right ${printStyles.tableFontClass}`}>
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 print:bg-slate-200 print:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">التاريخ</th>
                  <th className="py-2.5 px-3">نوع القيد</th>
                  <th className="py-2.5 px-3">الشهر</th>
                  <th className="py-2.5 px-3">رقم الفاتورة الورقية</th>
                  <th className="py-2.5 px-3">البيان والملاحظات</th>
                  <th className="py-2.5 px-3">القيمة</th>
                  <th className="py-2.5 px-3 text-center no-print">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 print:divide-slate-300">
                {statement.transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      لا توجد معاملات مسجلة للموظف في هذه الفترة
                    </td>
                  </tr>
                ) : (
                  statement.transactions.map((tx) => {
                    let label = 'معاملة';
                    let color = 'text-slate-800';
                    let prefix = '';

                    if (tx.type === 'salary') {
                      label = 'إثبات استحقاق راتب';
                      color = 'text-blue-700 font-bold';
                      prefix = '+';
                    } else if (tx.type === 'commission') {
                      label = 'نسبة من فاتورة ورقية';
                      color = 'text-amber-700 font-bold';
                      prefix = '+';
                    } else if (tx.type === 'bonus') {
                      label = 'مكافأة إضافية';
                      color = 'text-emerald-700 font-bold';
                      prefix = '+';
                    } else if (tx.type === 'advance') {
                      label = 'سلفة نقدية مسحوبة';
                      color = 'text-rose-700 font-bold';
                      prefix = '-';
                    } else if (tx.type === 'deduction') {
                      label = 'خصم / جزاء';
                      color = 'text-rose-700 font-bold';
                      prefix = '-';
                    } else if (tx.type === 'payout') {
                      label = 'صرف راتب / مستحقات';
                      color = 'text-purple-700 font-bold';
                      prefix = 'مسدد: ';
                    }

                    return (
                      <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2 px-3 text-slate-600 font-mono whitespace-nowrap">{tx.date}</td>
                        <td className="py-2 px-3 font-bold whitespace-nowrap">
                          <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] bg-slate-100 ${color}`}>
                            {label}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-600">{tx.month}</td>
                        <td className="py-2 px-3 font-mono font-bold text-slate-800">
                          {tx.invoiceNumber || '-'}
                        </td>
                        <td className="py-2 px-3 text-slate-700 text-[11px]">{tx.notes || '-'}</td>
                        <td className={`py-2 px-3 text-xs font-mono whitespace-nowrap ${color}`}>
                          {prefix}
                          {tx.amount.toLocaleString()} {settings.currency}
                        </td>
                        <td className="py-2 px-3 text-center no-print">
                          <button
                            onClick={() => {
                              if (confirm('هل أنت متأكد من حذف هذه المعاملة من سجل الموظف؟')) {
                                deleteEmployeeTransaction(tx.id);
                              }
                            }}
                            className="text-slate-400 hover:text-rose-600 p-1 rounded-lg cursor-pointer"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-800 print:bg-slate-200">
                <tr>
                  <td colSpan={5} className="py-2.5 px-3 text-right">
                    صافي المستحق للموظف ({statement.transactions.length} حركة):
                  </td>
                  <td colSpan={2} className="py-2.5 px-3 font-black text-emerald-800 font-mono text-sm">
                    {statement.netDue.toLocaleString()} {settings.currency}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Executive Sign-off Footer (No stamp box) */}
          <div className="mt-8 pt-4 border-t-2 border-slate-800">
            <div className="grid grid-cols-2 gap-8 text-center text-xs text-slate-700">
              <div className="flex flex-col justify-between h-20 border-t-2 border-slate-800 pt-2">
                <span className="font-bold text-slate-900">{printStyles.auditorLabel}</span>
                <span className="text-[11px] text-slate-500">{currentUser?.fullName || 'المسؤول المالي'}</span>
                <span className="text-[10px] text-slate-400">التوقيع: .......................................</span>
              </div>

              <div className="flex flex-col justify-between h-20 border-t-2 border-slate-800 pt-2">
                <span className="font-bold text-slate-900">توقيع واستلام الموظف</span>
                <span className="text-[11px] text-slate-500">{employee.name}</span>
                <span className="text-[10px] text-slate-400">التوقيع بالاستلام: .......................................</span>
              </div>
            </div>

            {/* Legal Notice */}
            <div className="mt-4 pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>تم استخراج كشف حساب الموظف آلياً عبر {settings.companyName} (A4)</span>
              <span>وقت الطباعة: {new Date().toLocaleString('ar-LY')}</span>
            </div>
          </div>
        </div>

        {/* Modal Footer (Screen Only) */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end no-print">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
