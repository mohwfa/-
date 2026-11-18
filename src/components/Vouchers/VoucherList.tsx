import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Voucher, VoucherType } from '../../types';
import {
  FileCheck2,
  Search,
  Plus,
  Printer,
  Edit2,
  Trash2,
  Calendar,
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  Banknote,
  Landmark,
} from 'lucide-react';

interface VoucherListProps {
  onOpenNewVoucher: (type?: VoucherType) => void;
  onEditVoucher: (voucher: Voucher) => void;
  onPrintVoucher: (voucher: Voucher) => void;
}

export const VoucherList: React.FC<VoucherListProps> = ({
  onOpenNewVoucher,
  onEditVoucher,
  onPrintVoucher,
}) => {
  const { vouchers, treasuries, deleteVoucher, settings, currentUser } = useApp();
  const [activeTab, setActiveTab] = useState<'all' | VoucherType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const getTreasuryName = (id: string) => {
    return treasuries.find((t) => t.id === id)?.name || id;
  };

  const filteredVouchers = useMemo(() => {
    return vouchers.filter((v) => {
      if (activeTab !== 'all' && v.type !== activeTab) return false;
      if (dateFilter && v.date !== dateFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesNum = v.voucherNumber.toLowerCase().includes(q);
        const matchesParty = v.partyName?.toLowerCase().includes(q) || false;
        const matchesEmp = v.employeeName?.toLowerCase().includes(q) || false;
        const matchesNotes = v.notes?.toLowerCase().includes(q) || false;
        const matchesRef = v.referenceInvoiceNumber?.toLowerCase().includes(q) || false;
        if (!matchesNum && !matchesParty && !matchesEmp && !matchesNotes && !matchesRef) return false;
      }
      return true;
    });
  }, [vouchers, activeTab, searchTerm, dateFilter]);

  const stats = useMemo(() => {
    let receipts = 0;
    let payments = 0;

    vouchers.forEach((v) => {
      if (v.type === 'receipt') receipts += v.amount;
      else payments += v.amount;
    });

    return { receipts, payments, net: receipts - payments };
  }, [vouchers]);

  const handleDelete = (id: string, num: string) => {
    if (confirm(`هل أنت متأكد من حذف السند رقم ${num}؟ سيتم التراجع عن تأثيره على الخزينة والحساب.`)) {
      deleteVoucher(id);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <FileCheck2 className="w-6 h-6 text-emerald-600" />
            <span>سندات القبض والصرف (الإيصالات المالية)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            إثبات قبض ثمن الفواتير، الدفعات المقدمة، العرابين، أو دفع قيمة المشتريات والمصروفات
          </p>
        </div>

        {currentUser.permissions.canManageVouchers && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenNewVoucher('receipt')}
              className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm shadow-emerald-600/30 transition-all active:scale-95"
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>سند قبض جديد</span>
            </button>
            <button
              onClick={() => onOpenNewVoucher('payment')}
              className="px-3.5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm shadow-rose-600/30 transition-all active:scale-95"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>سند صرف جديد</span>
            </button>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] font-bold text-emerald-700 block mb-1">إجمالي المقبوضات (سندات القبض)</span>
          <div className="text-lg font-black text-slate-900">
            {stats.receipts.toLocaleString()} <span className="text-xs font-normal text-slate-500">{settings.currency}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] font-bold text-rose-700 block mb-1">إجمالي المدفوعات (سندات الصرف)</span>
          <div className="text-lg font-black text-slate-900">
            {stats.payments.toLocaleString()} <span className="text-xs font-normal text-slate-500">{settings.currency}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-600 block mb-1">صافي حركة السندات</span>
          <div className={`text-lg font-black ${stats.net >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            {stats.net >= 0 ? '+' : ''}{stats.net.toLocaleString()} <span className="text-xs font-normal text-slate-500">{settings.currency}</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              كافة السندات ({vouchers.length})
            </button>
            <button
              onClick={() => setActiveTab('receipt')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'receipt' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              سندات قبض ({vouchers.filter((v) => v.type === 'receipt').length})
            </button>
            <button
              onClick={() => setActiveTab('payment')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'payment' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              سندات صرف ({vouchers.filter((v) => v.type === 'payment').length})
            </button>
          </div>

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

        <div className="relative">
          <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث برقم السند، اسم الطرف، البيان، أو رقم الفاتورة الورقية..."
            className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50 focus:bg-white"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {filteredVouchers.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs sm:text-sm">
            <FileCheck2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="font-bold text-slate-700">لا توجد سندات مسجلة مطابقة لبحثك</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">رقم السند</th>
                  <th className="py-3 px-4">النوع</th>
                  <th className="py-3 px-4">استلمنا من / صرفنا إلى</th>
                  <th className="py-3 px-4">التاريخ</th>
                  <th className="py-3 px-4">المبلغ</th>
                  <th className="py-3 px-4">طريقة الدفع</th>
                  <th className="py-3 px-4">الخزينة / المصرف</th>
                  <th className="py-3 px-4">البيان / الفاتورة المرتبطة</th>
                  <th className="py-3 px-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVouchers.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{v.voucherNumber}</td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {v.type === 'receipt' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <ArrowDownLeft className="w-3 h-3" /> سند قبض
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <ArrowUpRight className="w-3 h-3" /> سند صرف
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      {v.partyName || v.employeeName || 'حركة نقدية مباشرة'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">{v.date}</td>
                    <td className="py-3.5 px-4 font-black text-slate-900 text-sm whitespace-nowrap">
                      {v.amount.toLocaleString()} <span className="text-[11px] font-normal text-slate-500">{settings.currency}</span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg">
                        {v.paymentMethod === 'cash' ? (
                          <>
                            <Banknote className="w-3 h-3 text-amber-600" /> نقدي
                          </>
                        ) : v.paymentMethod === 'bank_transfer' ? (
                          <>
                            <Landmark className="w-3 h-3 text-blue-600" /> تحويل بنكي
                          </>
                        ) : (
                          <>
                            <CreditCard className="w-3 h-3 text-purple-600" /> بطاقة مصرفية
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium whitespace-nowrap">
                      {getTreasuryName(v.treasuryId)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 max-w-xs">
                      {v.referenceInvoiceNumber && (
                        <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 font-mono text-[10px] text-slate-700 ml-1">
                          فاتورة #{v.referenceInvoiceNumber}
                        </span>
                      )}
                      <span>{v.notes || '-'}</span>
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onPrintVoucher(v)}
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="طباعة السند"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        {currentUser.permissions.canManageVouchers && (
                          <>
                            <button
                              onClick={() => onEditVoucher(v)}
                              className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                              title="تعديل السند"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(v.id, v.voucherNumber)}
                              className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                              title="حذف السند"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
