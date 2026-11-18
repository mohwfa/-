import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Treasury } from '../../types';
import {
  Landmark,
  X,
  Printer,
  Banknote,
  CreditCard,
  ArrowDownLeft,
  ArrowUpRight,
  ExternalLink,
  Building,
} from 'lucide-react';
import { printElement, openPrintWindow, downloadPrintableHtml } from '../../utils/printHelper';
import { getPrintStyles } from '../../utils/printStyleHelper';
import { Download } from 'lucide-react';

interface TreasuryStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  treasury: Treasury | null;
}

export const TreasuryStatementModal: React.FC<TreasuryStatementModalProps> = ({
  isOpen,
  onClose,
  treasury,
}) => {
  const { getTreasuryStatement, getTreasuryBalance, settings, currentUser, addToast } = useApp();
  const printStyles = getPrintStyles(settings);

  const statement = useMemo(() => {
    if (!treasury) return [];
    return getTreasuryStatement(treasury.id);
  }, [treasury, getTreasuryStatement]);

  const currentBalance = useMemo(() => {
    if (!treasury) return 0;
    return getTreasuryBalance(treasury.id);
  }, [treasury, getTreasuryBalance]);

  if (!isOpen || !treasury) return null;

  const handlePrint = () => {
    addToast('info', 'جارِ تجهيز كشف الحركات للطباعة بمقاس A4...');
    const printed = printElement('treasuryPrintableArea', {
      title: `كشف_حركات_${treasury.name}`,
      companyName: settings.companyName,
      paperSize: 'A4',
    });
    if (printed) {
      addToast('success', 'تم استدعاء أمر الطباعة بنجاح');
    }
  };

  const handleOpenStandalone = () => {
    addToast('info', 'جارِ فتح كشف السيولة في نافذة طباعة مستقلة...');
    const win = openPrintWindow('treasuryPrintableArea', {
      title: `كشف_حركات_${treasury.name}`,
      companyName: settings.companyName,
      paperSize: 'A4',
      autoPrint: true,
    });
    if (win) {
      addToast('success', 'تم فتح كشف الحساب في نافذة مستقلة للطباعة بمقاس A4');
    } else {
      printElement('treasuryPrintableArea', {
        title: `كشف_حركات_${treasury.name}`,
        companyName: settings.companyName,
        paperSize: 'A4',
      });
      addToast('info', 'تم تحويل أمر الطباعة تلقائياً للمعاينة المباشرة لتجاوز حظر النوافذ');
    }
  };

  const handleDownloadHtml = () => {
    downloadPrintableHtml('treasuryPrintableArea', `كشف_حركات_${treasury.name}`, {
      title: `كشف_حركات_${treasury.name}`,
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
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              {treasury.type === 'cash' ? <Banknote className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900">{treasury.name}</h2>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                  {treasury.type === 'cash' ? 'خزينة نقدية (صندوق)' : 'حساب مصرفي'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                  مقاس A4
                </span>
              </div>
              <p className="text-xs text-slate-500">
                كشف حركات تفصيلي بالوارد والصادر والرصيد التراكمي المستمر
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة كشف الحركات (A4)</span>
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
              title="تنزيل كشف الحركات بصيغة HTML جاهز للطباعة"
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

        {/* Printable Area (Formatted for A4) */}
        <div
          id="treasuryPrintableArea"
          className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm flex-1 print:p-0 print:bg-white a4-paper-sheet max-w-[210mm] mx-auto w-full"
        >
          {/* Executive Printable Company Header (Small Logo + Company Info) */}
          <div className="border-b-2 border-slate-900 pb-3 mb-4">
            <div className="flex items-center justify-between gap-3">
              {/* Right: Logo & Company Name */}
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
              <div className="text-left bg-slate-50 border-2 border-slate-900 rounded-xl p-2.5 min-w-[200px] shrink-0 text-slate-900">
                <div className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 text-right">
                  كشف حركات وسيولة الخزينة
                </div>
                <div className="text-[11px] text-slate-700 mt-1 space-y-0.5 text-right font-mono">
                  <div className="flex justify-between gap-2">
                    <span className="font-semibold text-slate-500">تاريخ الاستخراج:</span>
                    <span className="font-bold text-slate-900">{new Date().toLocaleDateString('ar-LY')}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="font-semibold text-slate-500">العملة المعتمدة:</span>
                    <span className="font-bold text-slate-900">{settings.currency}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Treasury Header Card */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-300 flex flex-wrap items-center justify-between gap-3 print:bg-slate-50 print:border-slate-800">
            <div>
              <span className="text-slate-500 block text-[11px]">اسم الحساب / الخزينة:</span>
              <span className="font-black text-slate-950 text-base">{treasury.name}</span>
              {treasury.accountNumber && (
                <span className="text-xs text-slate-600 block font-mono">رقم الحساب: {treasury.accountNumber}</span>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-slate-500 block text-[11px]">رصيد بداية المدة:</span>
                <span className="font-bold text-slate-800 font-mono">
                  {treasury.openingBalance.toLocaleString()} {settings.currency}
                </span>
              </div>
              <div className="bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-300 print:bg-white print:border-slate-800">
                <span className="text-emerald-900 block text-[10px] font-bold">الرصيد الفعلي الحالي:</span>
                <span className="font-black text-emerald-950 text-base font-mono">
                  {currentBalance.toLocaleString()} {settings.currency}
                </span>
              </div>
            </div>
          </div>

          {/* Statement Table */}
          <div className="border border-slate-300 rounded-xl overflow-hidden shadow-2xs print:border-slate-800 print:shadow-none">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 print:bg-slate-200 print:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">التاريخ</th>
                  <th className="py-2.5 px-3">نوع الحركة</th>
                  <th className="py-2.5 px-3">البيان والتفاصيل</th>
                  <th className="py-2.5 px-3 text-emerald-700">وارد (قبض/إيداع)</th>
                  <th className="py-2.5 px-3 text-rose-700">صادر (صرف/سحب)</th>
                  <th className="py-2.5 px-3 text-slate-900">الرصيد التراكمي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 print:divide-slate-300">
                {statement.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      لا توجد حركات مسجلة على هذه الخزينة حتى الآن
                    </td>
                  </tr>
                ) : (
                  statement.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2 px-3 text-slate-600 font-mono whitespace-nowrap">{row.date}</td>
                      <td className="py-2 px-3 font-bold text-slate-900 whitespace-nowrap">{row.type}</td>
                      <td className="py-2 px-3 text-slate-700 text-[11px]">{row.description}</td>
                      <td className="py-2 px-3 font-bold text-emerald-700 font-mono whitespace-nowrap">
                        {row.debit > 0 ? `+${row.debit.toLocaleString()}` : '-'}
                      </td>
                      <td className="py-2 px-3 font-bold text-rose-700 font-mono whitespace-nowrap">
                        {row.credit > 0 ? `-${row.credit.toLocaleString()}` : '-'}
                      </td>
                      <td className="py-2 px-3 font-black text-slate-950 text-xs font-mono whitespace-nowrap">
                        {row.balance.toLocaleString()} {settings.currency}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-800 print:bg-slate-200">
                <tr>
                  <td colSpan={3} className="py-2.5 px-3 text-right">
                    الرصيد النهائي للخزينة ({statement.length} حركة):
                  </td>
                  <td className="py-2.5 px-3 font-black text-emerald-800 font-mono">
                    +{statement.reduce((acc, r) => acc + r.debit, 0).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 font-black text-rose-800 font-mono">
                    -{statement.reduce((acc, r) => acc + r.credit, 0).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 font-black text-slate-950 font-mono">
                    {currentBalance.toLocaleString()} {settings.currency}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Executive Sign-off Footer (No stamp box) */}
          <div className="mt-8 pt-4 border-t-2 border-slate-800">
            <div className="grid grid-cols-2 gap-8 text-center text-xs text-slate-700">
              <div className="flex flex-col justify-between h-20 border-t-2 border-slate-800 pt-2">
                <span className="font-bold text-slate-900">أمين الخزينة / المسؤول المباشر</span>
                <span className="text-[11px] text-slate-500">{treasury.name}</span>
                <span className="text-[10px] text-slate-400">التوقيع: .......................................</span>
              </div>

              <div className="flex flex-col justify-between h-20 border-t-2 border-slate-800 pt-2">
                <span className="font-bold text-slate-900">المحاسب المسؤول / الإدارة المالية</span>
                <span className="text-[11px] text-slate-500">{currentUser?.fullName || 'المسؤول المالي'}</span>
                <span className="text-[10px] text-slate-400">التوقيع والاعتماد: .......................................</span>
              </div>
            </div>

            {/* Legal Notice */}
            <div className="mt-4 pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>تم استخراج كشف السيولة آلياً عبر {settings.companyName} (A4)</span>
              <span>وقت الطباعة: {new Date().toLocaleString('ar-LY')}</span>
            </div>
          </div>
        </div>

        {/* Footer (Screen Only) */}
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
