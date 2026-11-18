import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Invoice, InvoiceManualItem, Voucher } from '../../types';
import {
  Printer,
  X,
  ExternalLink,
  Download,
  Copy,
  Check,
  Building,
  CheckCircle2,
  Table2,
  Plus,
  Trash2,
  Save,
} from 'lucide-react';
import {
  printElement,
  openPrintWindow,
  downloadPrintableHtml,
} from '../../utils/printHelper';
import { getPrintStyles } from '../../utils/printStyleHelper';
import {
  sanitizeManualItems,
  buildPrintableManualItemRows,
  computeManualItemTotal,
} from '../../utils/invoicePrintItems';

interface PrintSlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice?: Invoice;
  voucher?: Voucher;
}

export const PrintSlipModal: React.FC<PrintSlipModalProps> = ({
  isOpen,
  onClose,
  invoice,
  voucher,
}) => {
  const { settings, treasuries, invoices, updateInvoice, addToast } = useApp();
  const [copied, setCopied] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [showManualItemsEditor, setShowManualItemsEditor] = useState(false);
  const [blankRowsCount, setBlankRowsCount] = useState<number>(5);
  const [draftManualItems, setDraftManualItems] = useState<InvoiceManualItem[]>([]);

  const activeInvoice = invoice
    ? invoices.find((inv) => inv.id === invoice.id) || invoice
    : undefined;

  useEffect(() => {
    if (isOpen && activeInvoice) {
      setDraftManualItems(
        activeInvoice.manualItems ? activeInvoice.manualItems.map((item) => ({ ...item })) : []
      );
      setShowManualItemsEditor(false);
    }
  }, [isOpen, activeInvoice?.id]);

  if (!isOpen || (!activeInvoice && !voucher)) return null;

  const printStyles = getPrintStyles(settings);

  const isVoucher = Boolean(voucher);
  const isInvoice = Boolean(activeInvoice);
  const voucherPaperSize = settings.printVoucherSize || 'A5_landscape';
  const paperSize = isVoucher ? voucherPaperSize : 'A4';
  const isVoucherA5 = isVoucher && voucherPaperSize === 'A5_landscape';

  const docTitle = activeInvoice
    ? `فاتورة_${activeInvoice.type === 'sale' ? 'مبيعات' : activeInvoice.type === 'purchase' ? 'مشتريات' : 'مصروف'}_${activeInvoice.invoiceNumber}`
    : voucher
    ? `سند_${voucher.type === 'receipt' ? 'قبض' : 'صرف'}_${voucher.voucherNumber}`
    : 'إيصال_مالي_رسمي';

  const handleDirectPrint = () => {
    setIsPrinting(true);
    addToast(
      'info',
      isVoucherA5
        ? 'جارِ تجهيز وإرسال أمر الطباعة بمقاس A5 أفقي...'
        : 'جارِ تجهيز وإرسال أمر الطباعة بمقاس A4...'
    );

    const printed = printElement('printableArea', {
      title: docTitle,
      companyName: settings.companyName,
      paperSize,
    });

    setTimeout(() => {
      setIsPrinting(false);
      if (printed) {
        addToast('success', 'تم استدعاء أمر الطباعة بنجاح');
      }
    }, 700);
  };

  const handleOpenStandalone = () => {
    addToast(
      'info',
      isVoucherA5
        ? 'جارِ فتح السند في نافذة طباعة مستقلة بمقاس A5 أفقي...'
        : 'جارِ فتح المستند في نافذة طباعة مستقلة بمقاس A4...'
    );
    const win = openPrintWindow('printableArea', {
      title: docTitle,
      companyName: settings.companyName,
      paperSize,
      autoPrint: true,
    });
    if (win) {
      addToast('success', 'تم فتح المستند في نافذة مستقلة للطباعة المباشرة');
    } else {
      // Automatic fallback to hidden iframe print if popups are blocked by browser
      printElement('printableArea', {
        title: docTitle,
        companyName: settings.companyName,
        paperSize,
      });
      addToast('info', 'تم تحويل أمر الطباعة تلقائياً للمعاينة المباشرة لتجاوز حظر النوافذ المنبثقة');
    }
  };

  const handleDownloadHtml = () => {
    downloadPrintableHtml('printableArea', docTitle, {
      title: docTitle,
      companyName: settings.companyName,
      paperSize,
    });
    addToast(
      'success',
      isVoucherA5
        ? 'تم تنزيل السند بصيغة HTML جاهز للطباعة بمقاس A5 أفقي'
        : 'تم تنزيل المستند بصيغة HTML جاهز للطباعة بمقاس A4'
    );
  };

  const handleSaveManualItems = () => {
    if (!activeInvoice) return;
    const cleaned = sanitizeManualItems(draftManualItems);
    setDraftManualItems(cleaned);
    if (activeInvoice.id && activeInvoice.id !== 'temp') {
      updateInvoice(activeInvoice.id, { manualItems: cleaned });
    } else {
      addToast('success', 'تم تجهيز جدول الأصناف للطباعة');
    }
    setShowManualItemsEditor(false);
  };

  const printableManualRows = buildPrintableManualItemRows(draftManualItems, blankRowsCount);

  const handleCopySummary = () => {
    let summary = '';
    if (activeInvoice) {
      const filledItems = sanitizeManualItems(draftManualItems);
      const itemsText =
        filledItems.length > 0
          ? `\nالأصناف:\n${filledItems
              .map(
                (it, i) =>
                  `- ${it.serial || i + 1}: ${it.name}${
                    it.quantity ? ` | الكمية: ${it.quantity}` : ''
                  }${it.unitPrice ? ` | سعر الوحدة: ${it.unitPrice}` : ''} (${it.totalPrice})`
              )
              .join('\n')}`
          : '';
      summary = `مستند: ${activeInvoice.type === 'sale' ? 'فاتورة مبيعات' : activeInvoice.type === 'purchase' ? 'فاتورة مشتريات' : 'فاتورة مصروفات'}
الشركة: ${settings.companyName}
رقم الفاتورة: ${activeInvoice.invoiceNumber}
الجهة / العميل: ${activeInvoice.partyName}
التاريخ: ${activeInvoice.date}
الإجمالي: ${activeInvoice.totalAmount} ${settings.currency}
المسدد: ${activeInvoice.paidAmount} ${settings.currency}
المتبقي: ${activeInvoice.totalAmount - activeInvoice.paidAmount} ${settings.currency}${itemsText}
${activeInvoice.notes ? `ملاحظات: ${activeInvoice.notes}` : ''}`;
    } else if (voucher) {
      summary = `مستند: ${voucher.type === 'receipt' ? 'سند قبض مالي' : 'سند صرف مالي'}
الشركة: ${settings.companyName}
رقم السند: ${voucher.voucherNumber}
المبلغ: ${voucher.amount} ${settings.currency}
الجهة: ${voucher.partyName || voucher.employeeName || 'حساب نقدي مباشر'}
التاريخ: ${voucher.date}
${voucher.notes ? `البيان: ${voucher.notes}` : ''}`;
    }

    navigator.clipboard.writeText(summary);
    setCopied(true);
    addToast('success', 'تم نسخ ملخص المستند إلى الحافظة');
    setTimeout(() => setCopied(false), 2000);
  };

  const getTreasuryName = (id?: string) => {
    return treasuries.find((t) => t.id === id)?.name || 'الخزينة النقدية الرئيسية';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      {/* Dynamic Scoped Page Print Rules based on selected paper size */}
      <style>{`
        @media print {
          @page {
            size: ${isVoucherA5 ? 'A5 landscape !important' : 'A4 portrait !important'};
            margin: ${isVoucherA5 ? '6mm 8mm !important' : '8mm 10mm !important'};
          }
        }
      `}</style>

      <div
        className={`bg-white rounded-3xl shadow-2xl w-full overflow-hidden flex flex-col max-h-[96vh] print-card-container ${
          isVoucherA5 ? 'max-w-4xl' : 'max-w-4xl'
        }`}
      >
        {/* Modal Top Control Bar (Hidden on print) */}
        <div className="px-4 sm:px-6 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 no-print bg-slate-50">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-xs sm:text-sm">
            <Printer className="w-4 h-4 text-emerald-600" />
            <span>
              {isVoucherA5
                ? 'معاينة الطباعة بمقاس A5 أفقي (سند)'
                : 'معاينة الطباعة بمقاس ورقة A4 (فاتورة)'}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                isVoucherA5 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {isVoucherA5 ? 'A5 أفقي' : 'A4 رأسي'}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Primary Print Button */}
            <button
              type="button"
              onClick={handleDirectPrint}
              disabled={isPrinting}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm shadow-emerald-600/30 transition-all cursor-pointer"
              title={isVoucherA5 ? 'طباعة مباشرة بمقاس A5 أفقي' : 'طباعة مباشرة بمقاس A4'}
            >
              <Printer className="w-4 h-4" />
              <span>
                {isPrinting ? 'جارِ الإرسال...' : isVoucherA5 ? 'طباعة سند A5 أفقي' : 'طباعة فاتورة A4'}
              </span>
            </button>

            {/* Toggle Manual Items Table Editor (Invoices only) */}
            {isInvoice && (
              <button
                type="button"
                onClick={() => setShowManualItemsEditor((prev) => !prev)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-colors cursor-pointer ${
                  showManualItemsEditor
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
                title="إدخال أو تعديل جدول الأصناف يدوياً أو ضبط عدد الصفوف الفارغة للكتابة بالقلم"
              >
                <Table2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>جدول الأصناف اليدوي</span>
              </button>
            )}

            {/* Standalone Window Button */}
            <button
              type="button"
              onClick={handleOpenStandalone}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              title="فتح المستند في نافذة مستقلة للطباعة المباشرة أو حفظ كـ PDF"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-300" />
              <span>نافذة مستقلة ({isVoucherA5 ? 'A5' : 'A4'})</span>
            </button>

            {/* Download HTML Button */}
            <button
              type="button"
              onClick={handleDownloadHtml}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 rounded-xl transition-colors cursor-pointer"
              title="تنزيل المستند كملف HTML للطباعة"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Copy Summary */}
            <button
              type="button"
              onClick={handleCopySummary}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 rounded-xl transition-colors cursor-pointer"
              title="نسخ ملخص المستند"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 rounded-xl transition-colors cursor-pointer"
              title="إغلاق النافذة"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Paper Size Indicator Banner */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-6 py-1.5 text-[11px] text-slate-600 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>
              {isVoucherA5 ? (
                <>تم ضبط هذا السند بالمقاس القياسي <strong>A5 أفقي (210×148 مم)</strong>.</>
              ) : (
                <>تم ضبط المستند بمقاس ورقة الطباعة القياسية <strong>A4 (210×297 مم)</strong>.</>
              )}
            </span>
          </div>
          <span className="hidden sm:inline text-slate-400">
            (يمكنك ضبط حجم الشعار وتنسيقات الطباعة يدوياً عبر أيقونة الإعدادات)
          </span>
        </div>

        {/* Inline Manual Items Editor Panel (Outside printableArea, Hidden on print) */}
        {isInvoice && showManualItemsEditor && (
          <div className="bg-emerald-50/60 border-b border-emerald-200 px-4 sm:px-6 py-3 space-y-2.5 no-print max-h-64 overflow-y-auto">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Table2 className="w-4 h-4 text-emerald-700" />
                <span className="text-xs font-black text-emerald-950">
                  تعبئة جدول الأصناف يدوياً (رقم تسلسلي - الصنف - الكمية - سعر الوحدة - السعر الإجمالي)
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5">
                  <span>عدد الصفوف الفارغة للكتابة بالقلم:</span>
                  <select
                    value={blankRowsCount}
                    onChange={(e) => setBlankRowsCount(Number(e.target.value))}
                    className="px-2 py-1 rounded-lg border border-slate-300 bg-white text-xs font-bold"
                  >
                    <option value={0}>بدون صفوف فارغة</option>
                    <option value={3}>3 صفوف</option>
                    <option value={5}>5 صفوف (افتراضي)</option>
                    <option value={8}>8 صفوف</option>
                    <option value={10}>10 صفوف</option>
                  </select>
                </label>

                <button
                  type="button"
                  onClick={() =>
                    setDraftManualItems((prev) => [
                      ...prev,
                      { serial: String(prev.length + 1), name: '', quantity: '', unitPrice: '', totalPrice: '' },
                    ])
                  }
                  className="px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة صف</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveManualItems}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>حفظ الجدول</span>
                </button>
              </div>
            </div>

            {draftManualItems.length > 0 ? (
              <div className="border border-emerald-200 rounded-xl overflow-x-auto bg-white">
                <table className="w-full text-right border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                      <th className="p-1.5 font-bold w-18 text-center">رقم تسلسلي</th>
                      <th className="p-1.5 font-bold min-w-[140px]">الصنف</th>
                      <th className="p-1.5 font-bold w-20 text-center">الكمية</th>
                      <th className="p-1.5 font-bold w-24 text-center">سعر الوحدة</th>
                      <th className="p-1.5 font-bold w-28 text-center">السعر الإجمالي</th>
                      <th className="p-1.5 w-9"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {draftManualItems.map((row, idx) => (
                      <tr key={idx} className="border-b border-slate-100 last:border-b-0">
                        <td className="p-1">
                          <input
                            type="text"
                            aria-label={`معاينة رقم تسلسلي صف ${idx + 1}`}
                            value={row.serial}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDraftManualItems((prev) =>
                                prev.map((r, i) => (i === idx ? { ...r, serial: val } : r))
                              );
                            }}
                            placeholder={String(idx + 1)}
                            className="w-full px-1.5 py-1 rounded border border-slate-200 text-center text-xs"
                          />
                        </td>
                        <td className="p-1">
                          <input
                            type="text"
                            aria-label={`معاينة الصنف صف ${idx + 1}`}
                            value={row.name}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDraftManualItems((prev) =>
                                prev.map((r, i) => (i === idx ? { ...r, name: val } : r))
                              );
                            }}
                            placeholder="اكتب اسم الصنف يدوياً..."
                            className="w-full px-2 py-1 rounded border border-slate-200 text-xs"
                          />
                        </td>
                        <td className="p-1">
                          <input
                            type="text"
                            aria-label={`معاينة الكمية صف ${idx + 1}`}
                            value={row.quantity || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDraftManualItems((prev) =>
                                prev.map((r, i) => {
                                  if (i !== idx) return r;
                                  const autoTotal = computeManualItemTotal(val, r.unitPrice);
                                  return {
                                    ...r,
                                    quantity: val,
                                    totalPrice: autoTotal !== null ? autoTotal : r.totalPrice,
                                  };
                                })
                              );
                            }}
                            placeholder="0"
                            className="w-full px-1.5 py-1 rounded border border-slate-200 text-center font-mono text-xs"
                          />
                        </td>
                        <td className="p-1">
                          <input
                            type="text"
                            aria-label={`معاينة سعر الوحدة صف ${idx + 1}`}
                            value={row.unitPrice || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDraftManualItems((prev) =>
                                prev.map((r, i) => {
                                  if (i !== idx) return r;
                                  const autoTotal = computeManualItemTotal(r.quantity, val);
                                  return {
                                    ...r,
                                    unitPrice: val,
                                    totalPrice: autoTotal !== null ? autoTotal : r.totalPrice,
                                  };
                                })
                              );
                            }}
                            placeholder="0.00"
                            className="w-full px-1.5 py-1 rounded border border-slate-200 text-center font-mono text-xs"
                          />
                        </td>
                        <td className="p-1">
                          <input
                            type="text"
                            aria-label={`معاينة السعر الإجمالي صف ${idx + 1}`}
                            value={row.totalPrice}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDraftManualItems((prev) =>
                                prev.map((r, i) => (i === idx ? { ...r, totalPrice: val } : r))
                              );
                            }}
                            placeholder="0.00"
                            className="w-full px-1.5 py-1 rounded border border-slate-200 text-center font-mono text-xs"
                          />
                        </td>
                        <td className="p-1 text-center">
                          <button
                            type="button"
                            aria-label={`حذف صف معاينة ${idx + 1}`}
                            onClick={() =>
                              setDraftManualItems((prev) => prev.filter((_, i) => i !== idx))
                            }
                            className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-[11px] text-emerald-800">
                لم يتم إدخال أصناف إلكترونياً — سيظهر جدول فارغ بـ ({blankRowsCount}) صفوف للكتابة اليدوية بالقلم، أو اضغط &quot;إضافة صف&quot; للكتابة الآن.
              </p>
            )}
          </div>
        )}

        {/* Scrollable Preview Area */}
        <div
          className={`p-3 sm:p-6 overflow-y-auto flex-1 font-sans bg-slate-100/70 print:p-0 print:bg-white ${printStyles.fontSizeClass}`}
          id="printableArea"
        >
          {/* ========================================================================= */}
          {/* OPTION A: A4 INVOICE SHEET (الفواتير - مقاس A4 رأسي)                        */}
          {/* ========================================================================= */}
          {activeInvoice && (
            <div
              id="printableA4Page"
              className="w-full max-w-[210mm] mx-auto bg-white border border-slate-300 shadow-md print:shadow-none print:border-none p-6 sm:p-8 rounded-2xl print:rounded-none a4-paper-sheet text-slate-900"
            >
              {/* Header: Company Details & Configured Logo */}
              <div className="border-b-2 border-slate-900 pb-4 mb-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  {/* Right: Logo & Company Identity */}
                  <div className="flex items-center gap-3 text-right">
                    {printStyles.showLogo && (
                      <>
                        {settings.logoUrl ? (
                          <div
                            className={`${printStyles.logoWrapperClass} rounded-lg overflow-hidden flex items-center justify-center p-0.5 bg-white border border-slate-200 shrink-0`}
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
                      <div className="text-[11px] text-slate-500 mt-0.5 space-y-0.5">
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

                  {/* Left: Document Badge & Serial Box */}
                  <div className="text-center sm:text-left bg-slate-50 border-2 border-slate-900 rounded-xl p-2.5 min-w-[200px] shrink-0">
                    <div className="text-xs font-black uppercase tracking-wider text-slate-900">
                      {activeInvoice.type === 'sale'
                        ? 'فاتورة مبيعات رسمية'
                        : activeInvoice.type === 'purchase'
                        ? 'فاتورة مشتريات رسمية'
                        : 'فاتورة مصروفات رسمية'}
                    </div>

                    <div className="mt-0.5 font-mono font-black text-slate-900 text-base sm:text-lg">
                      {activeInvoice.invoiceNumber}
                    </div>

                    <div className="text-[11px] text-slate-600 mt-1 border-t border-slate-300 pt-1 flex justify-between gap-3">
                      <span className="font-semibold">التاريخ:</span>
                      <span className="font-mono">{activeInvoice.date}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Invoice Meta Table */}
              <div className="space-y-4 text-xs sm:text-sm text-slate-800">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-300">
                  <div>
                    <span className="text-slate-500 block text-[11px]">اسم العميل / المورد / الحساب:</span>
                    <span className="font-black text-slate-950 text-sm">{activeInvoice.partyName}</span>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[11px]">رقم الفاتورة الورقية المطابقة:</span>
                    <span className="font-bold text-slate-900 font-mono text-sm">{activeInvoice.invoiceNumber}</span>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[11px]">حالة السداد:</span>
                    <span className="font-bold">
                      {activeInvoice.paymentStatus === 'paid'
                        ? 'مسددة بالكامل فوراً'
                        : activeInvoice.paymentStatus === 'credit'
                        ? 'آجل على الحساب بالكامل'
                        : 'مسددة جزئياً'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[11px]">الخزينة / طريقة السداد:</span>
                    <span className="font-semibold text-slate-800">
                      {activeInvoice.paidAmount > 0
                        ? `${getTreasuryName(activeInvoice.treasuryId)} (${
                            activeInvoice.paymentMethod === 'cash'
                              ? 'نقداً'
                              : activeInvoice.paymentMethod === 'bank_transfer'
                              ? 'تحويل مصرفي'
                              : 'بطاقة'
                          })`
                        : 'غير مسدد (آجل)'}
                    </span>
                  </div>
                </div>

                {/* Financial Details Table */}
                <div className="border-2 border-slate-900 rounded-xl overflow-hidden mt-3">
                  <div className="bg-slate-900 text-white p-2 font-bold text-xs flex justify-between items-center">
                    <span>بيان المبالغ والقيم المالية</span>
                    <span>العملة: {settings.currency}</span>
                  </div>

                  <table className="w-full text-right border-collapse">
                    <tbody>
                      <tr className="border-b border-slate-300 bg-white">
                        <td className="p-2.5 font-semibold text-slate-700 w-1/2">القيمة الإجمالية للفاتورة:</td>
                        <td className="p-2.5 font-black text-slate-950 text-base text-left font-mono">
                          {activeInvoice.totalAmount.toLocaleString()} {settings.currency}
                        </td>
                      </tr>

                      <tr className="border-b border-slate-300 bg-emerald-50/50">
                        <td className="p-2.5 font-semibold text-emerald-900">المبلغ المسدد والواصل فوراً:</td>
                        <td className="p-2.5 font-bold text-emerald-700 text-left font-mono">
                          {activeInvoice.paidAmount.toLocaleString()} {settings.currency}
                        </td>
                      </tr>

                      <tr className="bg-white">
                        <td className="p-2.5 font-semibold text-slate-700">المتبقي على الحساب (دين آجل):</td>
                        <td className="p-2.5 font-black text-rose-600 text-base text-left font-mono">
                          {(activeInvoice.totalAmount - activeInvoice.paidAmount).toLocaleString()} {settings.currency}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Manual Items Table (Dedicated space above Notes: رقم تسلسلي - الصنف - الكمية - سعر الوحدة - السعر الإجمالي) */}
                {printableManualRows.length > 0 && (
                  <div className="border-2 border-slate-900 rounded-xl overflow-hidden mt-3">
                    <div className="bg-slate-100 border-b-2 border-slate-900 px-3 py-1.5 font-bold text-xs text-slate-900 flex justify-between items-center">
                      <span>جدول الأصناف</span>
                      <button
                        type="button"
                        onClick={() => setShowManualItemsEditor((prev) => !prev)}
                        className="no-print text-[11px] font-bold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
                      >
                        {showManualItemsEditor ? 'إخفاء محرر الجدول' : 'تعبئة / تعديل الأصناف يدوياً'}
                      </button>
                    </div>

                    <table className="w-full text-right border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-400 text-slate-900">
                          <th className="py-2 px-2 font-black border-l border-slate-300 w-20 text-center">
                            رقم تسلسلي
                          </th>
                          <th className="py-2 px-3 font-black border-l border-slate-300">
                            الصنف
                          </th>
                          <th className="py-2 px-2 font-black border-l border-slate-300 w-20 text-center">
                            الكمية
                          </th>
                          <th className="py-2 px-2 font-black border-l border-slate-300 w-24 text-center">
                            سعر الوحدة
                          </th>
                          <th className="py-2 px-2 font-black w-28 text-center">
                            السعر الإجمالي
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {printableManualRows.map((row, idx) => (
                          <tr key={idx} className="border-b border-slate-300 last:border-b-0 bg-white h-8">
                            <td className="py-1.5 px-2 border-l border-slate-300 text-center font-mono font-semibold text-slate-800">
                              {row.serial || '\u00A0'}
                            </td>
                            <td className="py-1.5 px-3 border-l border-slate-300 font-medium text-slate-900">
                              {row.name || '\u00A0'}
                            </td>
                            <td className="py-1.5 px-2 border-l border-slate-300 text-center font-mono text-slate-800">
                              {row.quantity || '\u00A0'}
                            </td>
                            <td className="py-1.5 px-2 border-l border-slate-300 text-center font-mono text-slate-800">
                              {row.unitPrice || '\u00A0'}
                            </td>
                            <td className="py-1.5 px-2 text-center font-mono font-bold text-slate-900">
                              {row.totalPrice || '\u00A0'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Notes */}
                {activeInvoice.notes && (
                  <div className="p-2.5 bg-slate-50 border border-slate-300 rounded-xl">
                    <span className="font-bold text-slate-700 block text-xs mb-0.5">البيان والملاحظات:</span>
                    <p className="text-slate-800 leading-relaxed text-xs">{activeInvoice.notes}</p>
                  </div>
                )}
              </div>

              {/* Official Signatures Section (Configurable labels from settings) */}
              <div className="mt-8 pt-3 grid grid-cols-2 gap-8 text-center text-xs text-slate-700">
                <div className="flex flex-col justify-between h-20 border-t-2 border-slate-800 pt-2">
                  <span className="font-bold text-slate-900">{printStyles.recipientLabel}</span>
                  <span className="text-[11px] text-slate-400">التوقيع: .......................................</span>
                </div>

                <div className="flex flex-col justify-between h-20 border-t-2 border-slate-800 pt-2">
                  <span className="font-bold text-slate-900">{printStyles.auditorLabel}</span>
                </div>
              </div>

              {/* Metadata Footer */}
              <div className="mt-5 pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>تم الإصدار عبر: {settings.companyName} (A4)</span>
                <span>وقت الطباعة: {new Date().toLocaleString('ar-LY')}</span>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* OPTION B: VOUCHER SHEET (A5 Landscape or A4 Portrait)                      */}
          {/* ========================================================================= */}
          {voucher && (
            <div
              id={isVoucherA5 ? 'printableA5LandscapePage' : 'printableA4Page'}
              className={`w-full max-w-[210mm] mx-auto bg-white border border-slate-300 shadow-md print:shadow-none print:border-none p-4 sm:p-6 rounded-2xl print:rounded-none ${
                isVoucherA5 ? 'a5-landscape-sheet' : 'a4-paper-sheet'
              } text-slate-900 flex flex-col justify-between`}
              style={isVoucherA5 ? { minHeight: '142mm' } : {}}
            >
              {/* Top Header */}
              <div>
                <div className="border-b-2 border-slate-900 pb-2.5 mb-3">
                  <div className="flex items-center justify-between gap-3">
                    {/* Company Identity */}
                    <div className="flex items-center gap-2.5 text-right">
                      {printStyles.showLogo && (
                        <>
                          {settings.logoUrl ? (
                            <div
                              className={`${printStyles.logoWrapperClass} rounded-lg overflow-hidden flex items-center justify-center p-0.5 bg-white border border-slate-200 shrink-0`}
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
                        <h1 className="text-lg font-black text-slate-950 tracking-tight leading-tight">
                          {settings.companyName}
                        </h1>
                        <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5 font-mono">
                          {printStyles.showAddressPhone && settings.phone && <span>هاتف: {settings.phone}</span>}
                          {printStyles.showTaxAndCR && settings.commercialRegister && (
                            <span>• س.ت: {settings.commercialRegister}</span>
                          )}
                          {printStyles.showAddressPhone && settings.address && (
                            <span>• {settings.address}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Voucher Badge & Serial Box */}
                    <div className="text-center bg-slate-50 border-2 border-slate-900 rounded-xl px-3 py-1.5 min-w-[190px] shrink-0">
                      <div className="text-xs font-black uppercase tracking-wider text-slate-900">
                        {voucher.type === 'receipt' ? 'سند قبض مالي معتمد' : 'سند صرف مالي معتمد'}
                      </div>
                      <div className="font-mono font-black text-slate-950 text-base">
                        {voucher.voucherNumber}
                      </div>
                      <div className="text-[10px] text-slate-600 border-t border-slate-300 mt-0.5 pt-0.5 flex justify-between gap-2">
                        <span className="font-semibold">التاريخ:</span>
                        <span className="font-mono">{voucher.date}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Horizontal Voucher Body */}
                <div className="grid grid-cols-12 gap-3 items-stretch text-xs">
                  {/* Beneficiary & Payment Method */}
                  <div className="col-span-12 sm:col-span-7 bg-slate-50 p-3 rounded-xl border border-slate-300 flex flex-col justify-between space-y-2">
                    <div className="border-b border-slate-200 pb-1.5">
                      <span className="text-slate-500 block text-[11px] font-semibold">
                        {voucher.type === 'receipt'
                          ? 'وصلنا واستلمنا من السيد / السادة:'
                          : 'صرفنا وأدينا إلى السيد / السادة:'}
                      </span>
                      <span className="font-black text-slate-950 text-base block mt-0.5">
                        {voucher.partyName || voucher.employeeName || 'حساب نقدي مباشر'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-0.5">
                      <div>
                        <span className="text-slate-500 block text-[10px]">طريقة السداد:</span>
                        <span className="font-bold text-slate-900">
                          {voucher.paymentMethod === 'cash'
                            ? 'نقداً'
                            : voucher.paymentMethod === 'bank_transfer'
                            ? 'تحويل مصرفي'
                            : 'بطاقة مصرفية'}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-500 block text-[10px]">الخزينة / الحساب:</span>
                        <span className="font-bold text-slate-900">{getTreasuryName(voucher.treasuryId)}</span>
                      </div>

                      {voucher.referenceInvoiceNumber && (
                        <div className="col-span-2 text-[10px] text-slate-600 border-t border-slate-200 pt-1">
                          <span>مرتبط بالفاتورة رقم: </span>
                          <span className="font-mono font-bold text-slate-900">{voucher.referenceInvoiceNumber}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Big Amount Card */}
                  <div
                    className={`col-span-12 sm:col-span-5 p-3 rounded-xl border-2 flex flex-col items-center justify-center text-center ${
                      voucher.type === 'receipt'
                        ? 'bg-emerald-50/70 border-emerald-600 text-emerald-950'
                        : 'bg-rose-50/70 border-rose-600 text-rose-950'
                    }`}
                  >
                    <span className="text-[11px] font-bold block">
                      {voucher.type === 'receipt' ? 'المبلغ المستلم نقداً / مصرفياً' : 'المبلغ المصروف والمدفوع'}
                    </span>
                    <div className="text-2xl sm:text-3xl font-black font-mono mt-1">
                      {voucher.amount.toLocaleString()}{' '}
                      <span className="text-sm font-bold">{settings.currency}</span>
                    </div>
                  </div>
                </div>

                {/* Voucher Reason / Notes */}
                {voucher.notes && (
                  <div className="mt-2.5 p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs">
                    <span className="font-bold text-slate-700 inline-block ml-1 text-[11px]">وذلك عن (البيان):</span>
                    <span className="text-slate-900">{voucher.notes}</span>
                  </div>
                )}
              </div>

              {/* Bottom Area: Terms & Signatures */}
              <div className="mt-3 pt-2 border-t border-slate-200">
                <div className="grid grid-cols-2 gap-8 text-center text-xs text-slate-700">
                  <div className="flex flex-col justify-between h-16 border-t-2 border-slate-800 pt-1.5">
                    <span className="font-bold text-slate-900 text-xs">{printStyles.recipientLabel}</span>
                    <span className="text-[10px] text-slate-400">التوقيع: .......................................</span>
                  </div>

                  <div className="flex flex-col justify-between h-16 border-t-2 border-slate-800 pt-1.5">
                    <span className="font-bold text-slate-900 text-xs">{printStyles.auditorLabel}</span>
                  </div>
                </div>

                {/* Footer Metadata */}
                <div className="mt-2 pt-1 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-400 font-mono">
                  <span>
                    تم الإصدار عبر: {settings.companyName} ({isVoucherA5 ? 'A5 أفقي' : 'A4'})
                  </span>
                  <span>وقت الطباعة: {new Date().toLocaleString('ar-LY')}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
