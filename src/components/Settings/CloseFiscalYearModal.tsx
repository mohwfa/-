import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Calendar,
  Lock,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Landmark,
  ShieldCheck,
  CheckCircle,
  Download,
  AlertCircle,
  X,
  FileSpreadsheet,
  Check,
} from 'lucide-react';
import { calculateFinancialSummary } from '../../utils/fiscalYearHelper';

interface CloseFiscalYearModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenArchive?: () => void;
}

export const CloseFiscalYearModal: React.FC<CloseFiscalYearModalProps> = ({
  isOpen,
  onClose,
  onOpenArchive,
}) => {
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
    closeFiscalYear,
    exportDatabase,
    addToast,
  } = useApp();

  const currentYearDefault = Number(settings.currentFiscalYear) || new Date().getFullYear();
  const nextYearDefault = currentYearDefault + 1;

  const [closingYear, setClosingYear] = useState<number>(currentYearDefault);
  const [nextYear, setNextYear] = useState<number>(nextYearDefault);
  const [closingNotes, setClosingNotes] = useState<string>('');

  // Options
  const [rolloverParties, setRolloverParties] = useState<boolean>(true);
  const [rolloverTreasuries, setRolloverTreasuries] = useState<boolean>(true);
  const [rolloverEmployees, setRolloverEmployees] = useState<boolean>(true);
  const [downloadBackupFirst, setDownloadBackupFirst] = useState<boolean>(true);

  // Financial summary of the closing year
  const financialSummary = useMemo(() => {
    return calculateFinancialSummary(invoices);
  }, [invoices]);

  // Aggregate Treasury liquidity at closing
  const treasuryLiquidity = useMemo(() => {
    return treasuries.reduce((sum, t) => sum + getTreasuryBalance(t.id), 0);
  }, [treasuries, getTreasuryBalance]);

  // Aggregate Party Balances
  const partyStats = useMemo(() => {
    let customerDebtsTotal = 0; // عليه (لنا)
    let supplierCreditsTotal = 0; // له (علينا)

    parties.forEach((p) => {
      const bal = getPartyBalance(p.id);
      if (bal.status === 'debit') {
        customerDebtsTotal += Math.abs(bal.net);
      } else if (bal.status === 'credit') {
        supplierCreditsTotal += Math.abs(bal.net);
      }
    });

    return { customerDebtsTotal, supplierCreditsTotal };
  }, [parties, getPartyBalance]);

  if (!isOpen) return null;

  const handleCloseYear = () => {
    if (currentUser.role !== 'admin') {
      addToast('error', 'إقفال السنة المالية متاح لمدير النظام فقط');
      return;
    }

    if (!closingYear || !nextYear) {
      addToast('error', 'يرجى تحديد السنة المالية المغلقة وسنة البدء الجديدة');
      return;
    }

    if (closingYear >= nextYear) {
      addToast('error', 'يجب أن تكون السنة المالية الجديدة أكبر من السنة المغلقة');
      return;
    }

    // Optional safety backup download
    if (downloadBackupFirst) {
      exportDatabase();
    }

    const archive = closeFiscalYear({
      yearToClose: String(closingYear),
      nextYear: String(nextYear),
      notes: closingNotes,
      rolloverParties,
      rolloverTreasuries,
      rolloverEmployees,
    });

    addToast(
      'success',
      `تم إقفال السنة المالية ${closingYear} بنجاح وفتح السنة المالية الجديدة ${nextYear}، مع الحفاظ الكامل على الأسماء وترحيل الأرصدة`
    );

    onClose();
    if (onOpenArchive) {
      onOpenArchive();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs no-print">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[94vh] animate-in fade-in zoom-in-95 border border-emerald-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-emerald-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 via-teal-50/50 to-blue-50">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 shrink-0">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                  إقفال السنة المالية وفتح سنة جديدة
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  السنة الحالية: {closingYear}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                أرشفة الحسابات والتقارير للرجوع إليها، وترحيل الأرصدة مع بقاء كافة الأسماء
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 text-slate-700 text-xs">
          {/* Important Preservation Guarantee Banner */}
          <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="font-black text-emerald-950 text-xs">
                ضمان حفظ البيانات ودليل الحسابات (وفق متطلباتك بدقة):
              </div>
              <p className="text-[11px] text-emerald-900 leading-relaxed">
                عند إقفال السنة المالية،{' '}
                <strong className="underline decoration-emerald-500 font-extrabold">
                  تبقى أسماء وبيانات الموظفين والزبائن والموردين والخزائن موجودة بالكامل
                </strong>
                . سيتم ترحيل الأرصدة النهائية تلقائياً لتصبح أرصدة افتتاحية مضبوطة للعام الجديد،
                وحفظ نسخة أرشيفية كاملة للسنة المغلقة للاطلاع والمراجعة والطباعة في أي وقت.
              </p>
            </div>
          </div>

          {/* Year Selection Row */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="text-xs font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>تحديد فترة الإقفال والسنة المالية الجديدة</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  السنة المالية المراد إقفالها وأرشفتها:
                </label>
                <input
                  type="number"
                  value={closingYear}
                  onChange={(e) => setClosingYear(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold text-slate-900 text-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  السنة المالية الجديدة للبدء بها:
                </label>
                <input
                  type="number"
                  value={nextYear}
                  onChange={(e) => setNextYear(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold text-emerald-900 text-sm bg-emerald-50/50"
                />
              </div>
            </div>
          </div>

          {/* Closing Financial Metrics Snapshot */}
          <div className="space-y-2">
            <div className="text-xs font-extrabold text-slate-900 flex items-center justify-between">
              <span>ملخص النتائج المالية للسنة المغلقة ({closingYear}):</span>
              <span className="text-[10px] text-slate-400 font-normal">سيتم حفظها بالأرشيف للمراجعة</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-emerald-50/80 p-3 rounded-2xl border border-emerald-200 text-right">
                <span className="text-[10px] font-bold text-emerald-800 block mb-1">إجمالي المبيعات</span>
                <span className="text-sm sm:text-base font-black text-emerald-900 font-mono">
                  {financialSummary.salesTotal.toLocaleString()} {settings.currency}
                </span>
              </div>

              <div className="bg-blue-50/80 p-3 rounded-2xl border border-blue-200 text-right">
                <span className="text-[10px] font-bold text-blue-800 block mb-1">إجمالي المشتريات</span>
                <span className="text-sm sm:text-base font-black text-blue-900 font-mono">
                  {financialSummary.purchasesTotal.toLocaleString()} {settings.currency}
                </span>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-right">
                <span className="text-[10px] font-bold text-slate-600 block mb-1">المصروفات والعمولات</span>
                <span className="text-sm sm:text-base font-black text-slate-800 font-mono">
                  {(
                    financialSummary.expensesTotal + financialSummary.commissionsTotal
                  ).toLocaleString()}{' '}
                  {settings.currency}
                </span>
              </div>

              <div
                className={`p-3 rounded-2xl border text-right ${
                  financialSummary.netProfit >= 0
                    ? 'bg-teal-50/80 border-teal-200 text-teal-950'
                    : 'bg-rose-50/80 border-rose-200 text-rose-950'
                }`}
              >
                <span className="text-[10px] font-bold block mb-1">صافي أرباح السنة</span>
                <span className="text-sm sm:text-base font-black font-mono">
                  {financialSummary.netProfit.toLocaleString()} {settings.currency}
                </span>
              </div>
            </div>
          </div>

          {/* Rollover Balances Details */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
              <span>الأرصدة والأسماء التي سيتم ترحيلها للسنة الجديدة ({nextYear}):</span>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">
                تتحول تلقائياً إلى أرصدة افتتاحية
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                  <Landmark className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-medium">
                    الخزائن المحفوظة ({treasuries.length})
                  </div>
                  <div className="text-xs font-black text-slate-900 font-mono">
                    {treasuryLiquidity.toLocaleString()} {settings.currency}
                  </div>
                  <div className="text-[9px] text-emerald-700 font-bold">ترحيل رصيد افتتاحي</div>
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-medium">
                    الزبائن والموردين ({parties.length})
                  </div>
                  <div className="text-xs font-black text-slate-900 font-mono">
                    لنا: {partyStats.customerDebtsTotal.toLocaleString()} | علينا:{' '}
                    {partyStats.supplierCreditsTotal.toLocaleString()}
                  </div>
                  <div className="text-[9px] text-emerald-700 font-bold">بقاء الأسماء وترحيل الديون</div>
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-medium">
                    الموظفين المحفوظين ({employees.length})
                  </div>
                  <div className="text-xs font-black text-slate-900 font-mono">
                    {employees.filter((e) => e.status === 'active').length} موظف نشط
                  </div>
                  <div className="text-[9px] text-emerald-700 font-bold">بقاء البيانات وترحيل المستحقات</div>
                </div>
              </div>
            </div>
          </div>

          {/* Rollover Settings Checkboxes */}
          <div className="space-y-2 bg-white p-4 rounded-2xl border border-slate-200">
            <div className="text-xs font-bold text-slate-900 mb-2">خيارات المعالجة والترحيل:</div>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={rolloverParties}
                onChange={(e) => setRolloverParties(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded-sm border-slate-300 focus:ring-emerald-500"
              />
              <span className="text-xs text-slate-800 font-semibold">
                ترحيل أرصدة الزبائن والموردين كأرصدة افتتاحية (مع بقاء كافة الأسماء وسجلاتهم)
              </span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={rolloverTreasuries}
                onChange={(e) => setRolloverTreasuries(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded-sm border-slate-300 focus:ring-emerald-500"
              />
              <span className="text-xs text-slate-800 font-semibold">
                ترحيل أرصدة الخزائن الحالية لتصبح أرصدة افتتاحية للخزائن في السنة الجديدة
              </span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={rolloverEmployees}
                onChange={(e) => setRolloverEmployees(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded-sm border-slate-300 focus:ring-emerald-500"
              />
              <span className="text-xs text-slate-800 font-semibold">
                ترحيل مستحقات الموظفين كأرصدة افتتاحية مع الاحتفاظ الكامل بملفات الموظفين
              </span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={downloadBackupFirst}
                onChange={(e) => setDownloadBackupFirst(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded-sm border-slate-300 focus:ring-emerald-500"
              />
              <span className="text-xs text-emerald-800 font-bold">
                تنزيل نسخة احتياطية تأمينية كاملة (JSON) تلقائياً قبل تنفيذ الإقفال (موصى به)
              </span>
            </label>
          </div>

          {/* Notes Input */}
          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1">
              ملاحظات أو توصيات ختامية للإقفال المالي (اختياري، تظهر في تقرير الأرشيف):
            </label>
            <textarea
              rows={2}
              value={closingNotes}
              onChange={(e) => setClosingNotes(e.target.value)}
              placeholder="مثال: تم تدقيق ومطابقة أرصدة الصناديق والمصارف واعتماد الأرباح السنوية"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            إلغاء التراجع
          </button>

          <button
            type="button"
            onClick={handleCloseYear}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all active:scale-95 cursor-pointer"
          >
            <Lock className="w-4 h-4" />
            <span>تأكيد إقفال سنة {closingYear} وفتح سنة {nextYear}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
