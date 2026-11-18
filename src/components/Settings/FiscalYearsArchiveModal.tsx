import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { FiscalYearArchive } from '../../types';
import {
  Calendar,
  FileSpreadsheet,
  Printer,
  Download,
  Trash2,
  ChevronLeft,
  X,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Building2,
  Users,
  Landmark,
  ShieldCheck,
  CheckCircle,
  FileText,
  Clock,
  Eye,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { printElement } from '../../utils/printHelper';
import { getPrintStyles } from '../../utils/printStyleHelper';

interface FiscalYearsArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCloseYearWizard?: () => void;
}

export const FiscalYearsArchiveModal: React.FC<FiscalYearsArchiveModalProps> = ({
  isOpen,
  onClose,
  onOpenCloseYearWizard,
}) => {
  const { fiscalYears, deleteFiscalYearArchive, settings, currentUser, addToast } = useApp();
  const [selectedArchive, setSelectedArchive] = useState<FiscalYearArchive | null>(
    fiscalYears.length > 0 ? fiscalYears[0] : null
  );

  React.useEffect(() => {
    if ((!selectedArchive || !fiscalYears.some((f) => f.id === selectedArchive.id)) && fiscalYears.length > 0) {
      setSelectedArchive(fiscalYears[0]);
    }
  }, [fiscalYears, selectedArchive]);

  const [archiveDetailTab, setArchiveDetailTab] = useState<'summary' | 'parties' | 'treasuries' | 'employees'>('summary');
  const [partySearchTerm, setPartySearchTerm] = useState('');

  const printableRef = useRef<HTMLDivElement>(null);
  const printStyles = getPrintStyles(settings);

  if (!isOpen) return null;

  const handlePrintArchiveReport = () => {
    if (!selectedArchive) return;
    if (printableRef.current) {
      printElement(printableRef.current.innerHTML, {
        title: `تقرير_الإقفال_المالي_لسنة_${selectedArchive.year}`,
        paperSize: 'A4',
        companyName: settings.companyName,
      });
    }
  };

  const handleDownloadSingleArchive = (archive: FiscalYearArchive) => {
    const dataStr = JSON.stringify(archive, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `أرشيف_السنة_المالية_${archive.year}_${settings.companyName || 'منظومة'}.json`;
    link.click();
    URL.revokeObjectURL(url);
    addToast('success', `تم تنزيل ملف أرشيف سنة ${archive.year} بنجاح`);
  };

  const handleDeleteArchive = (archive: FiscalYearArchive) => {
    if (confirm(`هل أنت متأكد من حذف السجل الأرشيفي للسنة المالية ${archive.year}؟ لا يمكن التراجع عن هذا الإجراء.`)) {
      deleteFiscalYearArchive(archive.id);
      addToast('info', `تم حذف أرشيف سنة ${archive.year}`);
      if (selectedArchive?.id === archive.id) {
        const remaining = fiscalYears.filter((y) => y.id !== archive.id);
        setSelectedArchive(remaining.length > 0 ? remaining[0] : null);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs no-print">
      <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full overflow-hidden flex flex-col max-h-[94vh] animate-in fade-in zoom-in-95 border border-slate-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/90">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/20 shrink-0">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                  أرشيف السنوات المالية السابقة
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-800">
                  {fiscalYears.length} سنوات مؤرشفة
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                مراجعة وتدقيق التقارير الختامية، الأرباح، وأرصدة الحسابات لجميع السنوات المغلقة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenCloseYearWizard && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCloseYearWizard();
                }}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Calendar className="w-4 h-4" />
                <span>إقفال سنة مالية جديدة</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Layout */}
        {fiscalYears.length === 0 ? (
          <div className="p-12 text-center flex-1 flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center">
              <Calendar className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-900">لا توجد سنوات مالية مؤرشفة حالياً</h3>
              <p className="text-xs text-slate-500 max-w-md">
                السنة المالية الحالية نشطة ومفتوحة. عند انتهاء السنة، يمكنك استخدام ميزة "إقفال السنة
                المالية" لحفظ لقطة كاملة للأرباح والميزانية وترحيل الأرصدة تلقائياً.
              </p>
            </div>
            {onOpenCloseYearWizard && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCloseYearWizard();
                }}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
                <span>بدء إقفال السنة المالية الحالية الآن</span>
              </button>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Sidebar List of Years */}
            <div className="w-full md:w-64 border-b md:border-b-0 md:border-l border-slate-200 bg-slate-50/70 p-3 overflow-y-auto space-y-2 shrink-0">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2">
                قائمة السنوات المغلقة:
              </div>
              {fiscalYears.map((archive) => {
                const isSelected = selectedArchive?.id === archive.id;
                return (
                  <div
                    key={archive.id}
                    onClick={() => setSelectedArchive(archive)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer text-right flex items-center justify-between ${
                      isSelected
                        ? 'bg-white border-indigo-600 shadow-sm ring-1 ring-indigo-500'
                        : 'bg-white/80 border-slate-200 hover:border-slate-300 hover:bg-white'
                    }`}
                  >
                    <div>
                      <div className="font-black text-sm text-slate-900">سنة {archive.year}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>أقفلت: {new Date(archive.closedAt).toLocaleDateString('ar-LY')}</span>
                      </div>
                      <div className="text-[11px] font-bold font-mono mt-1 text-emerald-700">
                        ربح: {archive.financialSummary.netProfit.toLocaleString()} {settings.currency}
                      </div>
                    </div>
                    <ChevronLeft
                      className={`w-4 h-4 transition-transform ${
                        isSelected ? 'text-indigo-600 -translate-x-0.5' : 'text-slate-300'
                      }`}
                    />
                  </div>
                );
              })}
            </div>

            {/* Main Details View */}
            {selectedArchive ? (
              <div className="flex-1 flex flex-col overflow-hidden bg-white">
                {/* Details Top Toolbar */}
                <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-white">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black text-slate-900">
                        التقرير الختامي المعتمد لسنة {selectedArchive.year}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                        مغلقة ومعتمدة
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      تم الإقفال بواسطة: {selectedArchive.closedBy} • بتاريخ:{' '}
                      {new Date(selectedArchive.closedAt).toLocaleString('ar-LY')}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handlePrintArchiveReport}
                      className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="طباعة التقرير الختامي A4"
                    >
                      <Printer className="w-4 h-4 text-slate-600" />
                      <span>طباعة التقرير A4</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDownloadSingleArchive(selectedArchive)}
                      className="px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="تنزيل نسخة JSON للسنة"
                    >
                      <Download className="w-4 h-4 text-indigo-600" />
                      <span>تنزيل JSON</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteArchive(selectedArchive)}
                      className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                      title="حذف هذا الأرشيف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Subtabs for Detail Review */}
                <div className="flex items-center border-b border-slate-200 bg-slate-50/60 px-4 pt-2 gap-2 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setArchiveDetailTab('summary')}
                    className={`px-3.5 py-2 rounded-t-xl transition-all cursor-pointer ${
                      archiveDetailTab === 'summary'
                        ? 'bg-white text-indigo-700 border-t-2 border-indigo-600 shadow-2xs font-extrabold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    ملخص الأرباح والميزانية
                  </button>

                  <button
                    type="button"
                    onClick={() => setArchiveDetailTab('parties')}
                    className={`px-3.5 py-2 rounded-t-xl transition-all cursor-pointer ${
                      archiveDetailTab === 'parties'
                        ? 'bg-white text-indigo-700 border-t-2 border-indigo-600 shadow-2xs font-extrabold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    أرصدة الزبائن والموردين ({selectedArchive.partyBalances.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setArchiveDetailTab('treasuries')}
                    className={`px-3.5 py-2 rounded-t-xl transition-all cursor-pointer ${
                      archiveDetailTab === 'treasuries'
                        ? 'bg-white text-indigo-700 border-t-2 border-indigo-600 shadow-2xs font-extrabold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    أرصدة الخزائن والمصارف ({selectedArchive.treasuryBalances.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setArchiveDetailTab('employees')}
                    className={`px-3.5 py-2 rounded-t-xl transition-all cursor-pointer ${
                      archiveDetailTab === 'employees'
                        ? 'bg-white text-indigo-700 border-t-2 border-indigo-600 shadow-2xs font-extrabold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    مستحقات الموظفين ({selectedArchive.employeeBalances.length})
                  </button>
                </div>

                {/* Tab Content */}
                <div className="p-5 overflow-y-auto flex-1 space-y-5 text-xs text-slate-700">
                  {/* TAB 1: SUMMARY */}
                  {archiveDetailTab === 'summary' && (
                    <div className="space-y-4">
                      {/* Financial Metrics Cards */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200">
                          <span className="text-[10px] font-bold text-emerald-700 block mb-1">إجمالي المبيعات</span>
                          <span className="text-base font-black text-emerald-950 font-mono">
                            {selectedArchive.financialSummary.salesTotal.toLocaleString()} {settings.currency}
                          </span>
                        </div>

                        <div className="bg-blue-50/70 p-3.5 rounded-2xl border border-blue-200">
                          <span className="text-[10px] font-bold text-blue-700 block mb-1">إجمالي المشتريات</span>
                          <span className="text-base font-black text-blue-950 font-mono">
                            {selectedArchive.financialSummary.purchasesTotal.toLocaleString()} {settings.currency}
                          </span>
                        </div>

                        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-600 block mb-1">المصروفات والعمولات</span>
                          <span className="text-base font-black text-slate-800 font-mono">
                            {(
                              selectedArchive.financialSummary.expensesTotal +
                              selectedArchive.financialSummary.commissionsTotal
                            ).toLocaleString()}{' '}
                            {settings.currency}
                          </span>
                        </div>

                        <div
                          className={`p-3.5 rounded-2xl border ${
                            selectedArchive.financialSummary.netProfit >= 0
                              ? 'bg-teal-50/70 border-teal-200 text-teal-950'
                              : 'bg-rose-50/70 border-rose-200 text-rose-950'
                          }`}
                        >
                          <span className="text-[10px] font-bold block mb-1">صافي الأرباح السنوية</span>
                          <span className="text-base font-black font-mono">
                            {selectedArchive.financialSummary.netProfit.toLocaleString()} {settings.currency}
                          </span>
                        </div>
                      </div>

                      {/* Closing Notes */}
                      {selectedArchive.notes && (
                        <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900">
                          <span className="font-bold text-[11px] block mb-0.5">ملاحظات الإقفال المعتمدة:</span>
                          <p className="text-xs leading-relaxed">{selectedArchive.notes}</p>
                        </div>
                      )}

                      {/* High-level Counts */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <div className="text-sm font-black text-slate-900">
                            {selectedArchive.financialSummary.invoicesCount}
                          </div>
                          <div className="text-[10px] text-slate-500">فواتير مؤرشفة</div>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <div className="text-sm font-black text-slate-900">
                            {selectedArchive.financialSummary.vouchersCount}
                          </div>
                          <div className="text-[10px] text-slate-500">سندات مؤرشفة</div>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <div className="text-sm font-black text-slate-900">
                            {selectedArchive.partyBalances.length}
                          </div>
                          <div className="text-[10px] text-slate-500">حسابات أطراف رحلت</div>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <div className="text-sm font-black text-slate-900">
                            {selectedArchive.treasuryBalances.length}
                          </div>
                          <div className="text-[10px] text-slate-500">خزائن وصناديق رحلت</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: PARTIES */}
                  {archiveDetailTab === 'parties' && (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={partySearchTerm}
                        onChange={(e) => setPartySearchTerm(e.target.value)}
                        placeholder="بحث باسم الزبون أو المورد..."
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />

                      <div className="border border-slate-200 rounded-2xl overflow-hidden">
                        <table className="w-full text-right text-xs">
                          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-bold">
                            <tr>
                              <th className="p-2.5">الطرف</th>
                              <th className="p-2.5">النوع</th>
                              <th className="p-2.5">الرصيد الختامي</th>
                              <th className="p-2.5">الحالة</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {selectedArchive.partyBalances
                              .filter((p) =>
                                p.name.toLowerCase().includes(partySearchTerm.toLowerCase())
                              )
                              .map((p) => (
                                <tr key={p.id} className="hover:bg-slate-50/50">
                                  <td className="p-2.5 font-bold text-slate-900">{p.name}</td>
                                  <td className="p-2.5 text-slate-500">
                                    {p.type === 'customer'
                                      ? 'زبون'
                                      : p.type === 'supplier'
                                      ? 'مورد'
                                      : 'زبون ومورد'}
                                  </td>
                                  <td className="p-2.5 font-mono font-bold">
                                    {p.endingBalance.toLocaleString()} {settings.currency}
                                  </td>
                                  <td className="p-2.5">
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                        p.status === 'debit'
                                          ? 'bg-rose-100 text-rose-800'
                                          : p.status === 'credit'
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : 'bg-slate-100 text-slate-600'
                                      }`}
                                    >
                                      {p.status === 'debit'
                                        ? 'عليه (مدين)'
                                        : p.status === 'credit'
                                        ? 'له (دائن)'
                                        : 'خالص (صفر)'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: TREASURIES */}
                  {archiveDetailTab === 'treasuries' && (
                    <div className="border border-slate-200 rounded-2xl overflow-hidden">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-bold">
                          <tr>
                            <th className="p-2.5">اسم الخزينة / الحساب</th>
                            <th className="p-2.5">النوع</th>
                            <th className="p-2.5">الرصيد النهائي المرحل</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {selectedArchive.treasuryBalances.map((t) => (
                            <tr key={t.id} className="hover:bg-slate-50/50">
                              <td className="p-2.5 font-bold text-slate-900">{t.name}</td>
                              <td className="p-2.5 text-slate-500">
                                {t.type === 'cash' ? 'صندوق نقدي' : 'حساب بنكي'}
                              </td>
                              <td className="p-2.5 font-mono font-bold text-emerald-800">
                                {t.endingBalance.toLocaleString()} {settings.currency}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* TAB 4: EMPLOYEES */}
                  {archiveDetailTab === 'employees' && (
                    <div className="border border-slate-200 rounded-2xl overflow-hidden">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-bold">
                          <tr>
                            <th className="p-2.5">اسم الموظف</th>
                            <th className="p-2.5">المسمى الوظيفي</th>
                            <th className="p-2.5">المستحق المرحل</th>
                            <th className="p-2.5">الحالة</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {selectedArchive.employeeBalances.map((e) => (
                            <tr key={e.id} className="hover:bg-slate-50/50">
                              <td className="p-2.5 font-bold text-slate-900">{e.name}</td>
                              <td className="p-2.5 text-slate-500">{e.jobTitle || 'موظف'}</td>
                              <td className="p-2.5 font-mono font-bold">
                                {e.netDue.toLocaleString()} {settings.currency}
                              </td>
                              <td className="p-2.5">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    e.netDue > 0
                                      ? 'bg-amber-100 text-amber-800'
                                      : e.netDue < 0
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  {e.netDue > 0
                                    ? 'مستحق للموظف'
                                    : e.netDue < 0
                                    ? 'سلفة عليه'
                                    : 'خالص'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* HIDDEN PRINTABLE TEMPLATE (A4 Official Audit Report) */}
        {selectedArchive && (
          <div className="hidden">
            <div ref={printableRef} className="p-8 max-w-4xl mx-auto bg-white text-slate-900 font-sans" dir="rtl">
              {/* Header */}
              <div className="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-black">{settings.companyName}</h1>
                  <p className="text-xs text-slate-600 mt-1">{settings.headerNote || 'تقرير الإقفال المالي والحسابات الختامية'}</p>
                  <p className="text-xs text-slate-500">{settings.address} • {settings.phone}</p>
                </div>
                <div className="text-left">
                  <div className="inline-block px-3 py-1 bg-slate-900 text-white font-bold text-sm rounded">
                    تقرير إقفال سنة {selectedArchive.year}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">تاريخ الإقفال: {new Date(selectedArchive.closedAt).toLocaleDateString('ar-LY')}</p>
                  <p className="text-[10px] text-slate-500">المعتمد: {selectedArchive.closedBy}</p>
                </div>
              </div>

              {/* Summary Statement */}
              <h2 className="text-sm font-bold border-b border-slate-300 pb-1 mb-3">1. بيان الأرباح والخسائر الختامي:</h2>
              <table className="w-full text-right text-xs mb-6 border border-slate-300">
                <thead className="bg-slate-100 font-bold border-b border-slate-300">
                  <tr>
                    <th className="p-2 border-l border-slate-300">البند المالي</th>
                    <th className="p-2 text-left">المبلغ ({settings.currency})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="p-2 font-medium border-l border-slate-300">إجمالي المبيعات والإيرادات</td>
                    <td className="p-2 text-left font-mono font-bold">{selectedArchive.financialSummary.salesTotal.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-medium border-l border-slate-300">تكلفة المشتريات البضاعة</td>
                    <td className="p-2 text-left font-mono font-bold">{selectedArchive.financialSummary.purchasesTotal.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-medium border-l border-slate-300">المصروفات التشغيلية والعمولات</td>
                    <td className="p-2 text-left font-mono font-bold">{(selectedArchive.financialSummary.expensesTotal + selectedArchive.financialSummary.commissionsTotal).toLocaleString()}</td>
                  </tr>
                  <tr className="bg-slate-100 font-black">
                    <td className="p-2 border-l border-slate-300">صافي الربح / الخسارة السنوية</td>
                    <td className="p-2 text-left font-mono text-sm">{selectedArchive.financialSummary.netProfit.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>

              {/* Treasury Balances */}
              <h2 className="text-sm font-bold border-b border-slate-300 pb-1 mb-3">2. أرصدة الخزائن والمصارف المرحلة للسنة الجديدة:</h2>
              <table className="w-full text-right text-xs mb-6 border border-slate-300">
                <thead className="bg-slate-100 font-bold border-b border-slate-300">
                  <tr>
                    <th className="p-2 border-l border-slate-300">اسم الخزينة</th>
                    <th className="p-2 border-l border-slate-300">النوع</th>
                    <th className="p-2 text-left">الرصيد الختامي المرحل ({settings.currency})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {selectedArchive.treasuryBalances.map((t) => (
                    <tr key={t.id}>
                      <td className="p-2 border-l border-slate-300 font-bold">{t.name}</td>
                      <td className="p-2 border-l border-slate-300">{t.type === 'cash' ? 'نقدي' : 'بنكي'}</td>
                      <td className="p-2 text-left font-mono font-bold">{t.endingBalance.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Signatures */}
              <div className="pt-12 grid grid-cols-3 gap-6 text-center text-xs font-bold border-t border-slate-300">
                <div>
                  <p>المحاسب المسؤول</p>
                  <div className="h-12 border-b border-dashed border-slate-400 mt-2"></div>
                </div>
                <div>
                  <p>المدير المالي</p>
                  <div className="h-12 border-b border-dashed border-slate-400 mt-2"></div>
                </div>
                <div>
                  <p>ختم واعتماد المنشأة</p>
                  <div className="h-12 border-b border-dashed border-slate-400 mt-2"></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
