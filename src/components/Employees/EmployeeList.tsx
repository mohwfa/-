import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Employee, EmployeeStatus, EmployeeTransactionType } from '../../types';
import {
  UserSquare2,
  Plus,
  Search,
  Phone,
  Percent,
  FileSpreadsheet,
  DollarSign,
  Edit2,
  Trash2,
  Link2,
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  PauseCircle,
  FileCheck2,
} from 'lucide-react';
import { EmployeeModal } from './EmployeeModal';
import { EmployeeStatementModal } from './EmployeeStatementModal';
import { EmployeeActionModal } from './EmployeeActionModal';
import { AccrueSalaryModal } from './AccrueSalaryModal';
import { PaySalaryVoucherModal } from './PaySalaryVoucherModal';

export const EmployeeList: React.FC = () => {
  const {
    employees,
    getEmployeeBalance,
    getEmployeeStatement,
    updateEmployeeStatus,
    parties,
    deleteEmployee,
    settings,
    currentUser,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'all' | EmployeeStatus>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState<Employee | null>(null);

  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);
  const [selectedEmpForStatement, setSelectedEmpForStatement] = useState<Employee | null>(null);

  const [isAccrueModalOpen, setIsAccrueModalOpen] = useState(false);
  const [selectedEmpForAccrue, setSelectedEmpForAccrue] = useState<Employee | null>(null);

  const [isPayVoucherModalOpen, setIsPayVoucherModalOpen] = useState(false);
  const [selectedEmpForPay, setSelectedEmpForPay] = useState<Employee | null>(null);

  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [selectedEmpForAction, setSelectedEmpForAction] = useState<Employee | null>(null);
  const [actionType, setActionType] = useState<EmployeeTransactionType>('bonus');

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    return employees.filter((e) => {
      if (activeTab !== 'all' && e.status !== activeTab) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesName = e.name.toLowerCase().includes(q);
        const matchesJob = e.jobTitle.toLowerCase().includes(q);
        const matchesPhone = e.phone?.toLowerCase().includes(q) || false;
        if (!matchesName && !matchesJob && !matchesPhone) return false;
      }
      return true;
    });
  }, [employees, activeTab, searchTerm]);

  // Aggregate Totals
  const totals = useMemo(() => {
    let totalEntitlements = 0; // رواتب مثبتة ونسب ومكافآت
    let totalPaidAndDeducted = 0; // ما صُرف بسندات صرف وسلف
    let totalNetRemaining = 0; // صافي الرصيد المستحق

    employees.forEach((emp) => {
      const bal = getEmployeeBalance(emp.id);
      totalEntitlements += bal.entitlements;
      totalPaidAndDeducted += bal.paidAndDeducted;
      if (bal.net > 0) {
        totalNetRemaining += bal.net;
      }
    });

    return { totalEntitlements, totalPaidAndDeducted, totalNetRemaining };
  }, [employees, getEmployeeBalance]);

  const handleDelete = (emp: Employee) => {
    if (confirm(`هل أنت متأكد من حذف الموظف ${emp.name}؟`)) {
      deleteEmployee(emp.id);
    }
  };

  const getLinkedPartyName = (partyId?: string) => {
    if (!partyId) return null;
    return parties.find((p) => p.id === partyId)?.name;
  };

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <UserSquare2 className="w-6 h-6 text-amber-600" />
            <span>قسم حسابات وبطاقات الموظفين</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            إدارة بطاقات الموظفين، الحالات الوظيفية (نشط / إجازة بدون راتب / موقوف)، إثبات الرواتب وترصيدها وصرفها بسندات الصرف
          </p>
        </div>

        {currentUser.permissions.canManageEmployees && (
          <button
            onClick={() => {
              setEmployeeToEdit(null);
              setIsEmployeeModalOpen(true);
            }}
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-sm shadow-amber-600/30 transition-all active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة موظف جديد</span>
          </button>
        )}
      </div>

      {/* Aggregate Balance Cards (Matching Party style) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-amber-200 shadow-2xs bg-amber-50/20">
          <span className="text-[11px] font-bold text-amber-800 block mb-1">
            إجمالي المستحقات المثبتة (رواتب + نسب + مكافآت)
          </span>
          <div className="text-xl font-black text-amber-950">
            {totals.totalEntitlements.toLocaleString()} <span className="text-xs font-normal text-slate-500">{settings.currency}</span>
          </div>
          <span className="text-[10px] text-amber-700/80 mt-0.5 block">الرواتب والعمولات المترصدة للموظفين</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-purple-200 shadow-2xs bg-purple-50/20">
          <span className="text-[11px] font-bold text-purple-800 block mb-1">
            إجمالي ما تم صرفه (سندات صرف الرواتب والسلف)
          </span>
          <div className="text-xl font-black text-purple-950">
            {totals.totalPaidAndDeducted.toLocaleString()} <span className="text-xs font-normal text-slate-500">{settings.currency}</span>
          </div>
          <span className="text-[10px] text-purple-700/80 mt-0.5 block">المبالغ المدفوعة فعلياً من الخزائن</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-emerald-200 shadow-2xs bg-emerald-50/20">
          <span className="text-[11px] font-bold text-emerald-800 block mb-1">
            الصافي المتبقي في ذمة المنشأة للموظفين
          </span>
          <div className="text-xl font-black text-emerald-950">
            {totals.totalNetRemaining.toLocaleString()} <span className="text-xs font-normal text-slate-500">{settings.currency}</span>
          </div>
          <span className="text-[10px] text-emerald-700/80 mt-0.5 block">مستحقات معلقة جاهزة للصرف بسندات</span>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              كافة الموظفين ({employees.length})
            </button>
            <button
              onClick={() => setActiveTab('active')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'active' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              نشط ({employees.filter((e) => e.status === 'active').length})
            </button>
            <button
              onClick={() => setActiveTab('on_leave')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'on_leave' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              إجازة بدون راتب ({employees.filter((e) => e.status === 'on_leave').length})
            </button>
            <button
              onClick={() => setActiveTab('inactive')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'inactive' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              موقوف ({employees.filter((e) => e.status === 'inactive').length})
            </button>
          </div>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث باسم الموظف، المسمى الوظيفي، أو رقم الهاتف..."
            className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-slate-50/50 focus:bg-white"
          />
        </div>
      </div>

      {/* Employee Cards Grid (Matching Customer/Supplier Card Aesthetics) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEmployees.map((emp) => {
          const bal = getEmployeeBalance(emp.id);
          const linkedCustomer = getLinkedPartyName(emp.linkedPartyId);

          return (
            <div
              key={emp.id}
              className={`bg-white rounded-2xl border shadow-2xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow ${
                emp.status === 'on_leave'
                  ? 'border-amber-300 ring-2 ring-amber-100'
                  : emp.status === 'inactive'
                  ? 'border-rose-200 opacity-80'
                  : 'border-slate-200/90'
              }`}
            >
              <div className="p-5 space-y-3">
                {/* Header: Name, Title & Status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-base shrink-0 ${
                        emp.status === 'on_leave'
                          ? 'bg-amber-100 text-amber-800'
                          : emp.status === 'inactive'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {emp.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight">{emp.name}</h3>
                      <span className="text-xs text-slate-500 font-medium block">{emp.jobTitle}</span>
                    </div>
                  </div>

                  {currentUser.permissions.canManageEmployees && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEmployeeToEdit(emp);
                          setIsEmployeeModalOpen(true);
                        }}
                        className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                        title="تعديل الموظف"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(emp)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                        title="حذف الموظف"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Status Badge & Quick Status Switcher */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
                  <span className="text-[11px] text-slate-400 font-bold">الحالة:</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateEmployeeStatus(emp.id, 'active')}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${
                        emp.status === 'active'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      نشط
                    </button>
                    <button
                      onClick={() => updateEmployeeStatus(emp.id, 'on_leave')}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${
                        emp.status === 'on_leave'
                          ? 'bg-amber-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                      title="إيقاف مؤقت في حالة الإجازة بدون راتب"
                    >
                      إجازة بدون راتب
                    </button>
                    <button
                      onClick={() => updateEmployeeStatus(emp.id, 'inactive')}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${
                        emp.status === 'inactive'
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      موقوف
                    </button>
                  </div>
                </div>

                {/* Linked customer badge */}
                {linkedCustomer && (
                  <div className="p-2 rounded-xl bg-teal-50 border border-teal-200 text-[11px] text-teal-800 flex items-center gap-1.5 font-bold">
                    <Link2 className="w-3.5 h-3.5 text-teal-600" />
                    <span>مرتبط كعميل: {linkedCustomer}</span>
                  </div>
                )}

                {emp.phone && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-mono">{emp.phone}</span>
                  </div>
                )}

                {/* Financial Ledger Balance Box (Matching Party card layout) */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">الراتب الشهري المسجل:</span>
                    <span className="font-extrabold text-slate-800">
                      {emp.baseSalary.toLocaleString()} {settings.currency}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-amber-900">
                    <span className="text-slate-500">إجمالي المستحق المثبت:</span>
                    <span className="font-bold">
                      +{bal.entitlements.toLocaleString()} {settings.currency}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-purple-900">
                    <span className="text-slate-500">ما صُرف له (سندات صرف):</span>
                    <span className="font-bold">
                      -{bal.paidAndDeducted.toLocaleString()} {settings.currency}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                    <div>
                      <span className="text-slate-700 font-extrabold text-[11px] block">
                        الرصيد الصافي في حسابه:
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {bal.status === 'credit'
                          ? '(مستحق له على المنشأة)'
                          : bal.status === 'debit'
                          ? '(سلف زائدة عليه)'
                          : '(متزن تماماً)'}
                      </span>
                    </div>

                    <div
                      className={`text-xl font-black ${
                        bal.status === 'credit'
                          ? 'text-emerald-700'
                          : bal.status === 'debit'
                          ? 'text-rose-700'
                          : 'text-slate-800'
                      }`}
                    >
                      {Math.abs(bal.net).toLocaleString()} {settings.currency}
                    </div>
                  </div>
                </div>

                {emp.notes && <p className="text-xs text-slate-500 border-t border-slate-100 pt-2">{emp.notes}</p>}
              </div>

              {/* Action Buttons: Accrue Salary, Pay via Voucher, Statement */}
              <div className="p-3 bg-slate-50/80 border-t border-slate-100 flex flex-wrap items-center justify-between gap-1 text-xs">
                <button
                  onClick={() => {
                    setSelectedEmpForStatement(emp);
                    setIsStatementModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold flex items-center gap-1 transition-colors"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
                  <span>كشف حساب</span>
                </button>

                {currentUser.permissions.canManageEmployees && (
                  <div className="flex items-center gap-1">
                    {/* Accrue Salary Button */}
                    <button
                      onClick={() => {
                        setSelectedEmpForAccrue(emp);
                        setIsAccrueModalOpen(true);
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-300 font-bold flex items-center gap-1 transition-colors text-[11px]"
                      title="إثبات استحقاق الراتب الشهري وترصيده في حسابه"
                    >
                      <Calendar className="w-3 h-3 text-amber-600" />
                      <span>إثبات راتب</span>
                    </button>

                    {/* Pay via Voucher Button */}
                    <button
                      onClick={() => {
                        setSelectedEmpForPay(emp);
                        setIsPayVoucherModalOpen(true);
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold flex items-center gap-1 transition-colors text-[11px] shadow-2xs"
                      title="صرف مستحقاته بسند صرف مالي رسمي من الخزينة"
                    >
                      <FileCheck2 className="w-3 h-3" />
                      <span>سند صرف</span>
                    </button>

                    {/* Extra action: advance / bonus / deduction */}
                    <button
                      onClick={() => {
                        setSelectedEmpForAction(emp);
                        setActionType('bonus');
                        setIsActionModalOpen(true);
                      }}
                      className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                      title="مكافأة / سلفة / خصم"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modals */}
      <EmployeeModal
        isOpen={isEmployeeModalOpen}
        onClose={() => {
          setIsEmployeeModalOpen(false);
          setEmployeeToEdit(null);
        }}
        employeeToEdit={employeeToEdit}
      />

      <AccrueSalaryModal
        isOpen={isAccrueModalOpen}
        onClose={() => {
          setIsAccrueModalOpen(false);
          setSelectedEmpForAccrue(null);
        }}
        employee={selectedEmpForAccrue}
      />

      <PaySalaryVoucherModal
        isOpen={isPayVoucherModalOpen}
        onClose={() => {
          setIsPayVoucherModalOpen(false);
          setSelectedEmpForPay(null);
        }}
        employee={selectedEmpForPay}
      />

      <EmployeeStatementModal
        isOpen={isStatementModalOpen}
        onClose={() => {
          setIsStatementModalOpen(false);
          setSelectedEmpForStatement(null);
        }}
        employee={selectedEmpForStatement}
      />

      <EmployeeActionModal
        isOpen={isActionModalOpen}
        onClose={() => {
          setIsActionModalOpen(false);
          setSelectedEmpForAction(null);
        }}
        employee={selectedEmpForAction}
        defaultType={actionType}
      />
    </div>
  );
};
