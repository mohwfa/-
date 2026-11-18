import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Invoice, InvoiceType } from '../../types';
import {
  Receipt,
  Search,
  Filter,
  Plus,
  Printer,
  Edit2,
  Trash2,
  Percent,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';

interface InvoiceListProps {
  onOpenNewInvoice: (type?: InvoiceType) => void;
  onEditInvoice: (inv: Invoice) => void;
  onPrintInvoice: (inv: Invoice) => void;
}

export const InvoiceList: React.FC<InvoiceListProps> = ({
  onOpenNewInvoice,
  onEditInvoice,
  onPrintInvoice,
}) => {
  const { invoices, deleteInvoice, settings, currentUser } = useApp();
  const [activeTab, setActiveTab] = useState<'all' | InvoiceType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Filtered list
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (activeTab !== 'all' && inv.type !== activeTab) return false;
      if (dateFilter && inv.date !== dateFilter) return false;
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesNum = inv.invoiceNumber.toLowerCase().includes(query);
        const matchesParty = inv.partyName.toLowerCase().includes(query);
        const matchesNotes = inv.notes?.toLowerCase().includes(query);
        const matchesEmp = inv.employeeName?.toLowerCase().includes(query);
        if (!matchesNum && !matchesParty && !matchesNotes && !matchesEmp) return false;
      }
      return true;
    });
  }, [invoices, activeTab, searchTerm, dateFilter]);

  // Aggregate stats
  const stats = useMemo(() => {
    let sales = 0;
    let purchases = 0;
    let expenses = 0;
    let commissions = 0;

    invoices.forEach((inv) => {
      if (inv.type === 'sale') sales += inv.totalAmount;
      else if (inv.type === 'purchase') purchases += inv.totalAmount;
      else if (inv.type === 'expense') expenses += inv.totalAmount;

      if (inv.hasEmployeeCommission && inv.commissionAmount) {
        commissions += inv.commissionAmount;
      }
    });

    return { sales, purchases, expenses, commissions };
  }, [invoices]);

  const handleDelete = (id: string, num: string) => {
    if (confirm(`هل أنت متأكد من حذف الفاتورة رقم ${num}؟ سيتم إلغاء تأثيرها المالي وعمولة الموظف المرتبطة بها.`)) {
      deleteInvoice(id);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Banner & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Receipt className="w-6 h-6 text-emerald-600" />
            <span>سجل الفواتير اليومية الورقية</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            إدخال وتتبع قيم الفواتير الورقية لمبيعات ومشتريات ومصروفات المتجر دون تفاصيل الأصناف
          </p>
        </div>

        {currentUser.permissions.canManageInvoices && (
          <button
            onClick={() => onOpenNewInvoice()}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-sm shadow-emerald-600/30 transition-all active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>إدخال فاتورة ورقية جديدة</span>
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] font-bold text-emerald-700 block mb-1">إجمالي المبيعات</span>
          <div className="text-lg font-black text-slate-900">
            {stats.sales.toLocaleString()} <span className="text-xs font-normal text-slate-500">{settings.currency}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] font-bold text-blue-700 block mb-1">إجمالي المشتريات</span>
          <div className="text-lg font-black text-slate-900">
            {stats.purchases.toLocaleString()} <span className="text-xs font-normal text-slate-500">{settings.currency}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] font-bold text-rose-700 block mb-1">إجمالي المصروفات</span>
          <div className="text-lg font-black text-slate-900">
            {stats.expenses.toLocaleString()} <span className="text-xs font-normal text-slate-500">{settings.currency}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-amber-200 shadow-2xs bg-amber-50/30">
          <span className="text-[11px] font-bold text-amber-800 block mb-1 flex items-center gap-1">
            <Percent className="w-3.5 h-3.5 text-amber-600" />
            عمولات ونسب الموظفين
          </span>
          <div className="text-lg font-black text-amber-950">
            {stats.commissions.toLocaleString()} <span className="text-xs font-normal text-slate-500">{settings.currency}</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              الكل ({invoices.length})
            </button>
            <button
              onClick={() => setActiveTab('sale')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'sale' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              مبيعات ({invoices.filter((i) => i.type === 'sale').length})
            </button>
            <button
              onClick={() => setActiveTab('purchase')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'purchase' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              مشتريات ({invoices.filter((i) => i.type === 'purchase').length})
            </button>
            <button
              onClick={() => setActiveTab('expense')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'expense' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              مصروفات ({invoices.filter((i) => i.type === 'expense').length})
            </button>
          </div>

          {/* Date Filter & Clear */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <Calendar className="w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white"
              />
            </div>
            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                className="text-[11px] font-bold text-rose-600 hover:underline"
              >
                إلغاء الفلتر
              </button>
            )}
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث برقم الفاتورة الورقية، اسم العميل، اسم المورد، الموظف، أو البيان..."
            className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50 focus:bg-white"
          />
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {filteredInvoices.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs sm:text-sm">
            <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="font-bold text-slate-700">لا توجد فواتير مطابقة لبحثك</p>
            <p className="text-slate-400 mt-1">يمكنك إدخال فاتورة ورقية جديدة بالضغط على الزر أعلاه</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">رقم الفاتورة الورقية</th>
                  <th className="py-3 px-4">النوع</th>
                  <th className="py-3 px-4">العميل / المورد / الجهة</th>
                  <th className="py-3 px-4">التاريخ</th>
                  <th className="py-3 px-4">القيمة الإجمالية</th>
                  <th className="py-3 px-4">حالة السداد</th>
                  <th className="py-3 px-4">نسبة الموظف</th>
                  <th className="py-3 px-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((inv) => {
                  let badgeType = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                  let typeLabel = 'مبيعات';
                  if (inv.type === 'purchase') {
                    badgeType = 'bg-blue-50 text-blue-700 border-blue-200';
                    typeLabel = 'مشتريات';
                  } else if (inv.type === 'expense') {
                    badgeType = 'bg-rose-50 text-rose-700 border-rose-200';
                    typeLabel = `مصروف (${inv.expenseCategory || 'عام'})`;
                  }

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-xs sm:text-sm">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold border ${badgeType}`}>
                          {typeLabel}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        {inv.partyName}
                        {inv.notes && (
                          <span className="block text-[11px] text-slate-400 truncate max-w-xs">{inv.notes}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">{inv.date}</td>
                      <td className="py-3.5 px-4 font-extrabold text-slate-900 text-sm whitespace-nowrap">
                        {inv.totalAmount.toLocaleString()} <span className="text-[11px] font-normal text-slate-500">{settings.currency}</span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {inv.paymentStatus === 'paid' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> مسددة نقداً
                          </span>
                        ) : inv.paymentStatus === 'credit' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                            <Clock className="w-3 h-3" /> آجل (على الحساب)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            جزئي (مسدد: {inv.paidAmount})
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {inv.hasEmployeeCommission && inv.employeeName ? (
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px]">
                            <Percent className="w-3 h-3 text-amber-600" />
                            <span className="font-bold">{inv.employeeName}</span>
                            <span className="font-extrabold text-amber-700">({inv.commissionAmount} {settings.currency})</span>
                          </div>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onPrintInvoice(inv)}
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="طباعة إيصال الفاتورة"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          {currentUser.permissions.canManageInvoices && (
                            <>
                              <button
                                onClick={() => onEditInvoice(inv)}
                                className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                                title="تعديل الفاتورة"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(inv.id, inv.invoiceNumber)}
                                className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                                title="حذف الفاتورة"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
