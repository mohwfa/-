import React, { useState, useMemo } from 'react';
import { loadSingleCompanyBundle } from '../../utils/portalHelper';
import { printElement, downloadPrintableHtml } from '../../utils/printHelper';
import {
  Building,
  Printer,
  Download,
  Share2,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Phone,
  MapPin,
  Mail,
  Calendar,
  Search,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Scale,
  FileText,
  Receipt,
  FileCheck2,
} from 'lucide-react';
import { StatementItem } from '../../context/AppContext';

interface PublicStatementPortalProps {
  token: string;
  onExitPortal?: () => void;
}

export const PublicStatementPortal: React.FC<PublicStatementPortalProps> = ({
  token,
  onExitPortal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // تحميل بيانات الشركة والأطراف
  const { settings, party, statement, balanceInfo, isValid, errorReason } = useMemo(() => {
    const data = loadSingleCompanyBundle();
    const targetParty = data.parties.find((p) => p.portalToken === token);
    if (!targetParty) {
      return { isValid: false, errorReason: 'رابط كشف الحساب غير صحيح أو منتهي الصلاحية.' };
    }

    if (targetParty.isPortalActive === false) {
      return { isValid: false, errorReason: 'تم إيقاف رابط كشف الحساب مؤقتاً من قبل إدارة المنشأة.' };
    }

    // بناء كشف الحساب التراكمي
    const items: {
      id: string;
      date: string;
      type: string;
      refNumber: string;
      description: string;
      debit: number;
      credit: number;
      createdAt: string;
    }[] = [];

    // 1. الرصيد الافتتاحي
    if (targetParty.openingBalance > 0) {
      items.push({
        id: 'opening_balance',
        date: targetParty.createdAt.split('T')[0] || '2026-01-01',
        type: 'رصيد افتتاحي سابق',
        refNumber: 'OPEN-BAL',
        description: targetParty.notes ? `رصيد سابق: ${targetParty.notes}` : 'رصيد افتتاحي سابق مسجل بالنظام',
        debit: targetParty.openingBalanceType === 'debit' ? targetParty.openingBalance : 0,
        credit: targetParty.openingBalanceType === 'credit' ? targetParty.openingBalance : 0,
        createdAt: targetParty.createdAt,
      });
    }

    // 2. الفواتير
    const partyInvoices = data.invoices.filter((inv) => inv.partyId === targetParty.id);
    for (const inv of partyInvoices) {
      if (inv.type === 'sale') {
        items.push({
          id: `inv_${inv.id}`,
          date: inv.date,
          type: 'فاتورة مبيعات ورقية',
          refNumber: inv.invoiceNumber,
          description: inv.notes ? `فاتورة مبيعات (${inv.notes})` : 'فاتورة مبيعات بضائع/خدمات',
          debit: inv.totalAmount,
          credit: 0,
          createdAt: inv.createdAt,
        });

        if (inv.paidAmount > 0) {
          items.push({
            id: `inv_pay_${inv.id}`,
            date: inv.date,
            type: 'سداد فوري مع الفاتورة',
            refNumber: inv.invoiceNumber,
            description: `دفعة نقدية مسددة فوراً للفاتورة رقم ${inv.invoiceNumber}`,
            debit: 0,
            credit: inv.paidAmount,
            createdAt: inv.createdAt,
          });
        }
      } else if (inv.type === 'purchase') {
        items.push({
          id: `inv_pur_${inv.id}`,
          date: inv.date,
          type: 'فاتورة مشتريات وتوريد',
          refNumber: inv.invoiceNumber,
          description: inv.notes ? `توريد بضاعة (${inv.notes})` : 'فاتورة مشتريات من المورد',
          debit: 0,
          credit: inv.totalAmount,
          createdAt: inv.createdAt,
        });

        if (inv.paidAmount > 0) {
          items.push({
            id: `inv_pur_pay_${inv.id}`,
            date: inv.date,
            type: 'سداد فوري للمورد',
            refNumber: inv.invoiceNumber,
            description: `دفعة فورية مسددة للمورد مع الفاتورة رقم ${inv.invoiceNumber}`,
            debit: inv.paidAmount,
            credit: 0,
            createdAt: inv.createdAt,
          });
        }
      }
    }

    // 3. السندات
    const partyVouchers = data.vouchers.filter((v) => v.partyId === targetParty.id);
    for (const v of partyVouchers) {
      if (v.type === 'receipt') {
        items.push({
          id: `vouc_${v.id}`,
          date: v.date,
          type: 'سند قبض نقدي / بنكي',
          refNumber: v.voucherNumber,
          description: v.notes || (v.referenceInvoiceNumber ? `سداد للفاتورة رقم ${v.referenceInvoiceNumber}` : 'إيصال استلام دفعة'),
          debit: 0,
          credit: v.amount,
          createdAt: v.createdAt,
        });
      } else if (v.type === 'payment') {
        items.push({
          id: `vouc_${v.id}`,
          date: v.date,
          type: 'سند صرف ودفع',
          refNumber: v.voucherNumber,
          description: v.notes || 'سند صرف دفعة نقدية / حوالة للمستفيد',
          debit: v.amount,
          credit: 0,
          createdAt: v.createdAt,
        });
      }
    }

    // ترتيب زمني
    items.sort((a, b) => {
      const cmpDate = a.date.localeCompare(b.date);
      if (cmpDate !== 0) return cmpDate;
      return a.createdAt.localeCompare(b.createdAt);
    });

    let cumulativeBalance = 0;
    const finalStatement: StatementItem[] = items.map((item) => {
      cumulativeBalance += item.debit - item.credit;
      return {
        id: item.id,
        date: item.date,
        type: item.type,
        refNumber: item.refNumber,
        description: item.description,
        debit: item.debit,
        credit: item.credit,
        balance: cumulativeBalance,
      };
    });

    let totalDebit = 0;
    let totalCredit = 0;
    for (const it of finalStatement) {
      totalDebit += it.debit;
      totalCredit += it.credit;
    }
    const net = totalDebit - totalCredit;
    const status: 'debit' | 'credit' | 'balanced' =
      net > 0.001 ? 'debit' : net < -0.001 ? 'credit' : 'balanced';

    return {
      isValid: true,
      settings: data.settings,
      party: targetParty,
      statement: finalStatement,
      balanceInfo: { debit: totalDebit, credit: totalCredit, net: Math.abs(net), status },
    };
  }, [token]);

  if (!isValid || !party || !settings) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 max-w-md w-full p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
            <Building className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-slate-900">تعذر عرض كشف الحساب</h2>
          <p className="text-slate-600 text-sm leading-relaxed">{errorReason}</p>
          <div className="pt-4 border-t border-slate-100">
            <button
              onClick={() => {
                if (onExitPortal) {
                  onExitPortal();
                } else {
                  window.location.href = window.location.origin;
                }
              }}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-colors cursor-pointer"
            >
              الانتقال للصفحة الرئيسية للمنظومة المالية
            </button>
          </div>
        </div>
      </div>
    );
  }

  // التصفية والبحث
  const filteredStatement = statement.filter((item) => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchText =
        item.refNumber.toLowerCase().includes(q) ||
        item.type.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q);
      if (!matchText) return false;
    }
    if (startDate && item.date < startDate) return false;
    if (endDate && item.date > endDate) return false;
    return true;
  });

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handlePrint = () => {
    printElement('publicPrintablePortal', {
      title: `كشف_حساب_${party.name}`,
      companyName: settings.companyName,
      paperSize: 'A4',
    });
  };

  const handleDownloadHtml = () => {
    downloadPrintableHtml('publicPrintablePortal', `كشف_حساب_${party.name}`, {
      title: `كشف_حساب_${party.name}`,
      companyName: settings.companyName,
      paperSize: 'A4',
    });
  };

  const currency = settings.currency || 'د.ل';

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 antialiased py-6 px-3 sm:px-6 lg:px-8">
      {/* Top Bar for Portal Actions */}
      <div className="max-w-5xl mx-auto mb-4 no-print flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold shadow-xs">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-slate-900 text-sm sm:text-base">
                {settings.companyName}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                كشف حساب مباشر ومحدث
              </span>
            </div>
            <p className="text-xs text-slate-500">
              بوابة كشف الحساب الإلكتروني المباشر للشركة
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="نسخ الرابط لمشاركته"
          >
            <Share2 className="w-3.5 h-3.5 text-slate-500" />
            <span>{copiedLink ? 'تم النسخ!' : 'نسخ الرابط'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة (A4)</span>
          </button>

          <button
            onClick={handleDownloadHtml}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-300" />
            <span className="hidden sm:inline">حفظ ملف</span>
          </button>

          {onExitPortal && (
            <button
              onClick={onExitPortal}
              className="px-3 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>دخول المنظومة</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar (Screen Only) */}
      <div className="max-w-5xl mx-auto mb-4 no-print bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="بحث برقم الفاتورة، السند، أو البيان..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-9 pl-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-emerald-500 bg-slate-50"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-bold">من:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs bg-slate-50 focus:outline-emerald-500"
          />
          <span className="text-slate-500 font-bold">إلى:</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs bg-slate-50 focus:outline-emerald-500"
          />
          {(startDate || endDate || searchTerm) && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setSearchTerm('');
              }}
              className="text-xs font-bold text-rose-600 hover:underline px-1 cursor-pointer"
            >
              إلغاء التصفية
            </button>
          )}
        </div>
      </div>

      {/* Main Printable Statement Document */}
      <div
        id="publicPrintablePortal"
        className="max-w-5xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden print-card-container"
      >
        {/* Printable Header */}
        <div className="p-6 sm:p-8 border-b-2 border-emerald-600 bg-gradient-to-br from-emerald-50/50 via-white to-slate-50">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-wider uppercase px-2 py-0.5 rounded-md bg-emerald-600 text-white">
                  كشف حساب مباشر
                </span>
                <span className="text-xs font-bold text-emerald-800">
                  كشف حساب إلكتروني موثق
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {settings.companyName}
              </h1>
              {settings.headerNote && (
                <p className="text-xs text-slate-500 font-medium">{settings.headerNote}</p>
              )}
            </div>

            <div className="text-right sm:text-left text-xs text-slate-600 space-y-1 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
              {settings.phone && (
                <p className="flex items-center sm:justify-end gap-1.5 font-bold">
                  <span>{settings.phone}</span>
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                </p>
              )}
              {settings.address && (
                <p className="flex items-center sm:justify-end gap-1.5 text-slate-500">
                  <span>{settings.address}</span>
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                </p>
              )}
              {settings.email && (
                <p className="flex items-center sm:justify-end gap-1.5 text-slate-500">
                  <span>{settings.email}</span>
                  <Mail className="w-3.5 h-3.5 text-emerald-600" />
                </p>
              )}
            </div>
          </div>

          {/* Party Info Card */}
          <div className="mt-6 p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                كشف حساب العميل / المورد
              </span>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900">{party.name}</h3>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {party.type === 'customer'
                    ? 'عميل'
                    : party.type === 'supplier'
                    ? 'مورد'
                    : 'حساب عام (عميل ومورد)'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {party.phone ? `هاتف: ${party.phone}` : ''}{' '}
                {party.address ? `• العنوان: ${party.address}` : ''}
              </p>
            </div>

            <div className="text-right">
              <div className="text-[11px] font-bold text-slate-400">تاريخ استخراج الكشف</div>
              <div className="text-xs font-bold text-slate-700">
                {new Date().toISOString().split('T')[0]}
              </div>
            </div>
          </div>
        </div>

        {/* 3 Summary Cards */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-3 border-b border-slate-200 bg-slate-50/50">
          <div
            className={`p-4 rounded-2xl border ${
              balanceInfo.status === 'debit'
                ? 'bg-rose-50/80 border-rose-200 text-rose-950'
                : balanceInfo.status === 'credit'
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                : 'bg-blue-50/80 border-blue-200 text-blue-950'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold">الرصيد الصافي المتبقي</span>
              <Scale className="w-4 h-4 opacity-70" />
            </div>
            <div className="text-2xl font-black">
              {balanceInfo.net.toLocaleString()} {currency}
            </div>
            <div className="text-[11px] font-bold mt-1">
              {balanceInfo.status === 'debit'
                ? '⚠️ مطلوب سداده من العميل (مدين عليه)'
                : balanceInfo.status === 'credit'
                ? '✅ مستحق للطرف الآخر (دائن له)'
                : '🎉 الحساب خالص ومتوازن بالكامل (0.00)'}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 text-slate-800 shadow-2xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-slate-500">إجمالي الحركات المدينة (الفواتير)</span>
              <TrendingUp className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-xl font-black text-slate-900">
              {balanceInfo.debit.toLocaleString()} {currency}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              إجمالي المبيعات أو المسحوبات المسجلة
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 text-slate-800 shadow-2xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-slate-500">إجمالي الحركات الدائنة (السدادات)</span>
              <TrendingDown className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-xl font-black text-slate-900">
              {balanceInfo.credit.toLocaleString()} {currency}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              إجمالي السندات والدفعات المستلمة
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="p-4 sm:p-6 overflow-x-auto">
          <div className="text-xs font-bold text-slate-500 mb-3 flex items-center justify-between">
            <span>سجل المعاملات والعمليات التفصيلية ({filteredStatement.length} حركة)</span>
            <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
              مرتبة زمنياً من الأقدم للأحدث
            </span>
          </div>

          <table className="w-full text-right border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                <th className="p-2.5 font-bold w-10 text-center">#</th>
                <th className="p-2.5 font-bold">التاريخ</th>
                <th className="p-2.5 font-bold">نوع المعاملة</th>
                <th className="p-2.5 font-bold">رقم السند/الفاتورة</th>
                <th className="p-2.5 font-bold">البيان والتفاصيل</th>
                <th className="p-2.5 font-bold text-rose-600 text-left">مدين (لنا)</th>
                <th className="p-2.5 font-bold text-emerald-600 text-left">دائن (مسدد)</th>
                <th className="p-2.5 font-bold text-slate-900 text-left">الرصيد التراكمي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStatement.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    لا توجد حركات مسجلة لهذا الحساب ضمن المعايير المحددة
                  </td>
                </tr>
              ) : (
                filteredStatement.map((item, idx) => {
                  const isDebitPositive = item.balance > 0.001;
                  const isCreditPositive = item.balance < -0.001;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-2.5 text-slate-400 text-center font-mono text-xs">{idx + 1}</td>
                      <td className="p-2.5 font-mono text-xs text-slate-600 whitespace-nowrap">{item.date}</td>
                      <td className="p-2.5 font-bold text-slate-800 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5">
                          {item.type.includes('فاتورة') ? (
                            <Receipt className="w-3.5 h-3.5 text-indigo-600" />
                          ) : (
                            <FileCheck2 className="w-3.5 h-3.5 text-teal-600" />
                          )}
                          <span>{item.type}</span>
                        </span>
                      </td>
                      <td className="p-2.5 font-mono font-bold text-xs text-slate-700 whitespace-nowrap">
                        {item.refNumber}
                      </td>
                      <td className="p-2.5 text-slate-600 max-w-xs">{item.description}</td>
                      <td className="p-2.5 font-bold font-mono text-rose-600 text-left whitespace-nowrap">
                        {item.debit > 0 ? `${item.debit.toLocaleString()} ${currency}` : '-'}
                      </td>
                      <td className="p-2.5 font-bold font-mono text-emerald-600 text-left whitespace-nowrap">
                        {item.credit > 0 ? `${item.credit.toLocaleString()} ${currency}` : '-'}
                      </td>
                      <td className="p-2.5 font-mono font-black text-left whitespace-nowrap">
                        <span
                          className={
                            isDebitPositive
                              ? 'text-rose-700'
                              : isCreditPositive
                              ? 'text-emerald-700'
                              : 'text-slate-500'
                          }
                        >
                          {Math.abs(item.balance).toLocaleString()} {currency}
                        </span>{' '}
                        <span className="text-[10px] font-bold text-slate-400">
                          {isDebitPositive ? '(عليه)' : isCreditPositive ? '(له)' : '(خالص)'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 font-black text-slate-900 border-t-2 border-slate-300">
                <td colSpan={5} className="p-3 text-right">
                  الإجمالي النهائي للأستاذ
                </td>
                <td className="p-3 text-left font-mono text-rose-600 whitespace-nowrap">
                  {balanceInfo.debit.toLocaleString()} {currency}
                </td>
                <td className="p-3 text-left font-mono text-emerald-600 whitespace-nowrap">
                  {balanceInfo.credit.toLocaleString()} {currency}
                </td>
                <td className="p-3 text-left font-mono text-base whitespace-nowrap">
                  {balanceInfo.net.toLocaleString()} {currency}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Legal Terms & Stamp Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="space-y-1 text-center sm:text-right">
            <p className="font-bold text-slate-700">
              كشف الحساب هذا صادر ومحدث إلكترونياً مباشرة من النظام المالي الخاص بالشركة ({settings.companyName}).
            </p>
            <p className="text-[11px]">
              في حال وجود أي استفسار أو ملاحظة حول المعاملات، يرجى مراجعة إدارة الحسابات بالشركة.
            </p>
          </div>

          <div className="flex items-center gap-6 text-center">
            <div>
              <div className="text-[11px] text-slate-400 mb-1">ختم وتوقيع المنشأة</div>
              <div className="w-28 h-10 border-b border-dashed border-slate-400"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-5xl mx-auto mt-6 text-center text-xs text-slate-400 no-print">
        <p className="flex items-center justify-center gap-1.5 font-bold">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>المنظومة المالية البسيطة - إدارة الفواتير الورقية وكشوف الحسابات المباشرة</span>
        </p>
      </div>
    </div>
  );
};
