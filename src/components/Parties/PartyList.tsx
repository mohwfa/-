import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Party, PartyType, VoucherType } from '../../types';
import {
  Users2,
  Search,
  Plus,
  Phone,
  MapPin,
  FileSpreadsheet,
  ArrowDownLeft,
  ArrowUpRight,
  Edit2,
  Trash2,
  LayoutGrid,
  List,
  Lock,
} from 'lucide-react';
import { PartyModal } from './PartyModal';
import { PartyStatementModal } from './PartyStatementModal';
import { SharePartyPortalModal } from './SharePartyPortalModal';
import { Globe } from 'lucide-react';

interface PartyListProps {
  onOpenNewVoucherForParty: (partyId: string, type: VoucherType) => void;
}

export const PartyList: React.FC<PartyListProps> = ({ onOpenNewVoucherForParty }) => {
  const { parties, getPartyBalance, deleteParty, settings, currentUser } = useApp();

  const [activeTab, setActiveTab] = useState<'all' | PartyType>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // View Mode: 'grid' (cards) or 'list' (detailed table)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    try {
      const saved = localStorage.getItem('al_ofoq_parties_view_mode');
      return saved === 'list' ? 'list' : 'grid';
    } catch {
      return 'grid';
    }
  });

  const handleSetViewMode = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    try {
      localStorage.setItem('al_ofoq_parties_view_mode', mode);
    } catch {}
  };

  const [isPartyModalOpen, setIsPartyModalOpen] = useState(false);
  const [partyToEdit, setPartyToEdit] = useState<Party | null>(null);

  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);
  const [selectedPartyForStatement, setSelectedPartyForStatement] = useState<Party | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedPartyForShare, setSelectedPartyForShare] = useState<Party | null>(null);

  // Filtered
  const filteredParties = useMemo(() => {
    return parties.filter((p) => {
      if (activeTab !== 'all' && p.type !== activeTab) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesPhone = p.phone?.toLowerCase().includes(q) || false;
        const matchesAddr = p.address?.toLowerCase().includes(q) || false;
        const matchesNotes = p.notes?.toLowerCase().includes(q) || false;
        if (!matchesName && !matchesPhone && !matchesAddr && !matchesNotes) return false;
      }
      return true;
    });
  }, [parties, activeTab, searchTerm]);

  // Totals
  const totals = useMemo(() => {
    let customerDebts = 0; // لنا عند العملاء
    let supplierCredits = 0; // علينا للموردين

    parties.forEach((p) => {
      const bal = getPartyBalance(p.id);
      if (bal.status === 'debit') {
        customerDebts += bal.net;
      } else if (bal.status === 'credit') {
        supplierCredits += Math.abs(bal.net);
      }
    });

    return { customerDebts, supplierCredits };
  }, [parties, getPartyBalance]);

  const handleDelete = (p: Party) => {
    if (confirm(`هل أنت متأكد من حذف الحساب: ${p.name}؟`)) {
      deleteParty(p.id);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Users2 className="w-6 h-6 text-teal-600" />
            <span>العملاء والموردين والحسابات العامة</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            إدارة بطاقات الشركاء والزبائن، الحسابات المشتركة، الترصيد السابق وكشوفات الحساب
          </p>
        </div>

        {currentUser.permissions.canManageParties && (
          <button
            onClick={() => {
              setPartyToEdit(null);
              setIsPartyModalOpen(true);
            }}
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-sm shadow-teal-600/30 transition-all active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة بطاقة حساب جديدة</span>
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-rose-200 shadow-2xs bg-rose-50/20">
          <span className="text-[11px] font-bold text-rose-800 block mb-1">
            إجمالي مديونيات العملاء (أموال لنا في السوق)
          </span>
          <div className="text-xl font-black text-rose-900">
            {totals.customerDebts.toLocaleString()} <span className="text-xs font-normal text-slate-500">{settings.currency}</span>
          </div>
          <p className="text-[11px] text-rose-600/80 mt-0.5">مجموع الأرصدة الآجلة المطلوبة من الزبائن</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-blue-200 shadow-2xs bg-blue-50/20">
          <span className="text-[11px] font-bold text-blue-800 block mb-1">
            إجمالي مستحقات الموردين (التزامات علينا)
          </span>
          <div className="text-xl font-black text-blue-900">
            {totals.supplierCredits.toLocaleString()} <span className="text-xs font-normal text-slate-500">{settings.currency}</span>
          </div>
          <p className="text-[11px] text-blue-600/80 mt-0.5">مجموع الأرصدة المستحقة لموردي البضائع والمواد</p>
        </div>
      </div>

      {/* Filter Tabs & Search & View Switcher */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              كافة الحسابات ({parties.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('customer')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'customer' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              العملاء ({parties.filter((p) => p.type === 'customer').length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('supplier')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'supplier' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              الموردين ({parties.filter((p) => p.type === 'supplier').length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('both')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'both' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="عميل ومورد في نفس الوقت"
            >
              حسابات عامة مشتركة ({parties.filter((p) => p.type === 'both').length})
            </button>
          </div>

          {/* View Mode Toggle (Grid vs List) */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold border border-slate-200/80">
            <button
              type="button"
              onClick={() => handleSetViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-teal-800 shadow-xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="عرض الشبكة (بطاقات)"
            >
              <LayoutGrid className="w-4 h-4" />
              <span>شبكة</span>
            </button>
            <button
              type="button"
              onClick={() => handleSetViewMode('list')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white text-teal-800 shadow-xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="عرض القائمة (جدول تفصيلي)"
            >
              <List className="w-4 h-4" />
              <span>قائمة</span>
            </button>
          </div>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث باسم العميل، المورد، رقم الهاتف، أو المدينة..."
            className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50/50 focus:bg-white"
          />
        </div>
      </div>

      {/* Main Content: Empty State, List View (Table), or Grid View (Cards) */}
      {filteredParties.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
          <Users2 className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <p className="font-bold text-slate-600 text-sm">لا توجد حسابات مطابقة لمعايير البحث</p>
          <p className="mt-1 text-slate-400">جرّب كتابة اسم آخر أو مسح حقول التصفية</p>
        </div>
      ) : viewMode === 'list' ? (
        /* List View: Detailed accounting table */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-3 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700 flex justify-between items-center">
            <span>قائمة الحسابات ({filteredParties.length} حساب)</span>
            <span className="text-[11px] text-slate-500">العملة: {settings.currency}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                <tr>
                  <th className="py-3 px-3.5">#</th>
                  <th className="py-3 px-3.5">اسم الحساب</th>
                  <th className="py-3 px-3.5">التصنيف</th>
                  <th className="py-3 px-3.5">الهاتف والعنوان</th>
                  <th className="py-3 px-3.5">الرصيد السابق</th>
                  <th className="py-3 px-3.5">الرصيد الصافي الحالي</th>
                  <th className="py-3 px-3.5">الحالة</th>
                  <th className="py-3 px-3.5 text-center">الإجراءات والعمليات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredParties.map((p, idx) => {
                  const bal = getPartyBalance(p.id);
                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-slate-50/90 transition-colors ${
                        p.isSystem ? 'bg-emerald-50/20' : ''
                      }`}
                    >
                      <td className="py-3 px-3.5 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-3.5 font-bold text-slate-900">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPartyForStatement(p);
                              setIsStatementModalOpen(true);
                            }}
                            className="font-extrabold text-slate-900 hover:text-teal-700 hover:underline transition-colors text-right cursor-pointer"
                            title="انقر لعرض كشف حساب ومعاملات هذا الحساب"
                          >
                            {p.name}
                          </button>
                          {p.isSystem && (
                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                              افتراضي
                            </span>
                          )}
                        </div>
                        {p.notes && (
                          <p className="text-[11px] text-slate-400 font-normal line-clamp-1 mt-0.5 max-w-xs">
                            {p.notes}
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-3.5">
                        <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                          {p.type === 'customer'
                            ? 'عميل (زبون)'
                            : p.type === 'supplier'
                            ? 'مورد (بائع)'
                            : 'حساب عام (عميل ومورد)'}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-slate-600">
                        <div className="space-y-0.5 text-xs">
                          {p.phone && p.phone !== '-' && (
                            <div className="flex items-center gap-1 font-mono text-[11px] text-slate-700">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{p.phone}</span>
                            </div>
                          )}
                          {p.address && (
                            <div className="flex items-center gap-1 text-[11px] text-slate-500">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              <span className="truncate max-w-[150px]">{p.address}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3.5 font-mono text-slate-600 text-xs">
                        {p.openingBalance > 0 ? (
                          <span>
                            {p.openingBalance.toLocaleString()} {settings.currency}{' '}
                            <span className="text-[10px] text-slate-400">
                              ({p.openingBalanceType === 'debit' ? 'عليه' : 'له'})
                            </span>
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-3.5">
                        <span
                          className={`text-base font-black font-mono ${
                            bal.status === 'debit'
                              ? 'text-rose-700'
                              : bal.status === 'credit'
                              ? 'text-blue-700'
                              : 'text-slate-900'
                          }`}
                        >
                          {Math.abs(bal.net).toLocaleString()} {settings.currency}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            bal.status === 'debit'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : bal.status === 'credit'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {bal.status === 'debit'
                            ? 'عليه (مدين)'
                            : bal.status === 'credit'
                            ? 'له (دائن)'
                            : 'متزن (0)'}
                        </span>
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPartyForStatement(p);
                              setIsStatementModalOpen(true);
                            }}
                            className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold flex items-center gap-1 transition-colors text-[11px] shadow-2xs cursor-pointer"
                            title="كشف حساب المعاملات"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
                            <span>كشف حساب</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPartyForShare(p);
                              setIsShareModalOpen(true);
                            }}
                            className="px-2 py-1 rounded-xl bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200 font-bold flex items-center gap-1 transition-colors text-[11px] shadow-2xs cursor-pointer"
                            title="رابط كشف حساب مباشر للعميل/المورد"
                          >
                            <Globe className="w-3.5 h-3.5 text-teal-600" />
                            <span>رابط مباشر</span>
                          </button>

                          {currentUser.permissions.canManageVouchers && (
                            <>
                              <button
                                type="button"
                                onClick={() => onOpenNewVoucherForParty(p.id, 'receipt')}
                                className="px-2 py-1 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 font-bold flex items-center gap-1 transition-colors text-[11px] cursor-pointer"
                                title="سند قبض منه"
                              >
                                <ArrowDownLeft className="w-3 h-3 text-emerald-600" />
                                <span>قبض منه</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => onOpenNewVoucherForParty(p.id, 'payment')}
                                className="px-2 py-1 rounded-xl bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200 font-bold flex items-center gap-1 transition-colors text-[11px] cursor-pointer"
                                title="سند صرف له"
                              >
                                <ArrowUpRight className="w-3 h-3 text-rose-600" />
                                <span>صرف له</span>
                              </button>
                            </>
                          )}

                          {currentUser.permissions.canManageParties && !p.isSystem && (
                            <div className="flex items-center gap-0.5 border-r border-slate-200 pr-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setPartyToEdit(p);
                                  setIsPartyModalOpen(true);
                                }}
                                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
                                title="تعديل البيانات"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(p)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                                title="حذف الحساب"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid of Parties (Cards) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredParties.map((p) => {
            const bal = getPartyBalance(p.id);

            return (
              <div
                key={p.id}
                className={`bg-white rounded-2xl border shadow-2xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow ${
                  p.isSystem ? 'border-emerald-300 ring-2 ring-emerald-100' : 'border-slate-200/90'
                }`}
              >
                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">{p.name}</h3>
                        {p.isSystem && (
                          <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                            افتراضي
                          </span>
                        )}
                      </div>
                      <span className="inline-block mt-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                        {p.type === 'customer'
                          ? 'عميل (زبون)'
                          : p.type === 'supplier'
                          ? 'مورد (بائع)'
                          : 'حساب عام (عميل ومورد)'}
                      </span>
                    </div>

                    {currentUser.permissions.canManageParties && !p.isSystem && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setPartyToEdit(p);
                            setIsPartyModalOpen(true);
                          }}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
                          title="تعديل البيانات"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(p)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                          title="حذف الحساب"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Contact info */}
                  <div className="space-y-1 text-xs text-slate-600">
                    {p.phone && p.phone !== '-' && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-mono">{p.phone}</span>
                      </div>
                    )}
                    {p.address && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{p.address}</span>
                      </div>
                    )}
                  </div>

                  {/* Balance Status Block */}
                  <div className="pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-400 text-[11px]">الرصيد الصافي الحالي:</span>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          bal.status === 'debit'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : bal.status === 'credit'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {bal.status === 'debit'
                          ? 'عليه (مدين للمنشأة)'
                          : bal.status === 'credit'
                          ? 'له (دائن على المنشأة)'
                          : 'متزن (0)'}
                      </span>
                    </div>

                    <div
                      className={`text-2xl font-black ${
                        bal.status === 'debit'
                          ? 'text-rose-700'
                          : bal.status === 'credit'
                          ? 'text-blue-700'
                          : 'text-slate-900'
                      }`}
                    >
                      {Math.abs(bal.net).toLocaleString()} <span className="text-xs font-normal text-slate-500">{settings.currency}</span>
                    </div>

                    {p.openingBalance > 0 && (
                      <div className="text-[11px] text-slate-400 mt-1">
                        الرصيد السابق المسجل: {p.openingBalance.toLocaleString()} {settings.currency} (
                        {p.openingBalanceType === 'debit' ? 'عليه' : 'له'})
                      </div>
                    )}
                  </div>

                  {p.notes && <p className="text-xs text-slate-500 border-t border-slate-100 pt-2">{p.notes}</p>}
                </div>

                {/* Bottom Actions */}
                <div className="p-3 bg-slate-50/80 border-t border-slate-100 flex flex-wrap items-center justify-between gap-1 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPartyForStatement(p);
                      setIsStatementModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
                    <span>كشف حساب</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPartyForShare(p);
                      setIsShareModalOpen(true);
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200 font-bold flex items-center gap-1 transition-colors cursor-pointer text-xs"
                    title="رابط كشف حساب مباشر للعميل"
                  >
                    <Globe className="w-3.5 h-3.5 text-teal-600" />
                    <span>رابط مباشر</span>
                  </button>

                  {currentUser.permissions.canManageVouchers && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onOpenNewVoucherForParty(p.id, 'receipt')}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 font-bold flex items-center gap-1 transition-colors text-[11px] cursor-pointer"
                        title="سند قبض منه"
                      >
                        <ArrowDownLeft className="w-3 h-3 text-emerald-600" />
                        <span>قبض منه</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenNewVoucherForParty(p.id, 'payment')}
                        className="px-2.5 py-1.5 rounded-xl bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200 font-bold flex items-center gap-1 transition-colors text-[11px] cursor-pointer"
                        title="سند صرف له"
                      >
                        <ArrowUpRight className="w-3 h-3 text-rose-600" />
                        <span>صرف له</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <PartyModal
        isOpen={isPartyModalOpen}
        onClose={() => {
          setIsPartyModalOpen(false);
          setPartyToEdit(null);
        }}
        partyToEdit={partyToEdit}
      />

      <PartyStatementModal
        isOpen={isStatementModalOpen}
        onClose={() => {
          setIsStatementModalOpen(false);
          setSelectedPartyForStatement(null);
        }}
        party={selectedPartyForStatement}
      />

      <SharePartyPortalModal
        isOpen={isShareModalOpen}
        onClose={() => {
          setIsShareModalOpen(false);
          setSelectedPartyForShare(null);
        }}
        party={selectedPartyForShare}
      />
    </div>
  );
};
