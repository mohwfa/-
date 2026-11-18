import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Employee, EmployeeStatus } from '../../types';
import { UserSquare2, X, CheckCircle, Phone, Calendar, Link2, AlertTriangle } from 'lucide-react';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeToEdit?: Employee | null;
}

export const EmployeeModal: React.FC<EmployeeModalProps> = ({
  isOpen,
  onClose,
  employeeToEdit,
}) => {
  const { parties, addEmployee, updateEmployee, settings, addToast } = useApp();

  const [name, setName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [phone, setPhone] = useState('');
  const [baseSalary, setBaseSalary] = useState<number | ''>(0);
  const [status, setStatus] = useState<EmployeeStatus>('active');
  const [openingBalance, setOpeningBalance] = useState<number | ''>(0);
  const [openingBalanceType, setOpeningBalanceType] = useState<'credit' | 'debit'>('credit');
  const [linkedPartyId, setLinkedPartyId] = useState('');
  const [joinDate, setJoinDate] = useState(new Date().toISOString().substring(0, 10));
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (employeeToEdit) {
      setName(employeeToEdit.name);
      setJobTitle(employeeToEdit.jobTitle);
      setPhone(employeeToEdit.phone || '');
      setBaseSalary(employeeToEdit.baseSalary);
      setStatus(employeeToEdit.status || 'active');
      setOpeningBalance(employeeToEdit.openingBalance || 0);
      setOpeningBalanceType(employeeToEdit.openingBalanceType || 'credit');
      setLinkedPartyId(employeeToEdit.linkedPartyId || '');
      setJoinDate(employeeToEdit.joinDate);
      setNotes(employeeToEdit.notes || '');
    } else {
      setName('');
      setJobTitle('');
      setPhone('');
      setBaseSalary(2000);
      setStatus('active');
      setOpeningBalance(0);
      setOpeningBalanceType('credit');
      setLinkedPartyId('');
      setJoinDate(new Date().toISOString().substring(0, 10));
      setNotes('');
    }
  }, [employeeToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast('error', 'يرجى إدخال اسم الموظف');
      return;
    }

    const payload: Omit<Employee, 'id' | 'createdAt'> = {
      name: name.trim(),
      jobTitle: jobTitle.trim() || 'موظف',
      phone: phone.trim(),
      baseSalary: Number(baseSalary) || 0,
      status,
      openingBalance: Number(openingBalance) || 0,
      openingBalanceType,
      linkedPartyId: linkedPartyId || undefined,
      joinDate,
      notes: notes.trim(),
    };

    if (employeeToEdit) {
      updateEmployee(employeeToEdit.id, payload);
    } else {
      addEmployee(payload);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <UserSquare2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">
                {employeeToEdit ? 'تعديل بيانات الموظف' : 'إضافة موظف جديد'}
              </h2>
              <p className="text-xs text-slate-500">إدارة بطاقات الموظفين، الحالة الوظيفية، والترصيد</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs sm:text-sm max-h-[80vh] overflow-y-auto">
          {/* Status Selection (active, on_leave, inactive) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">الحالة الوظيفية للحساب:</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setStatus('active')}
                className={`py-2 px-2 rounded-xl font-bold text-xs border transition-all ${
                  status === 'active'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                نشط (Active)
              </button>
              <button
                type="button"
                onClick={() => setStatus('on_leave')}
                className={`py-2 px-2 rounded-xl font-bold text-xs border transition-all ${
                  status === 'on_leave'
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
                title="إيقاف مؤقت في حالة الإجازة بدون راتب"
              >
                إيقاف مؤقت (إجازة)
              </button>
              <button
                type="button"
                onClick={() => setStatus('inactive')}
                className={`py-2 px-2 rounded-xl font-bold text-xs border transition-all ${
                  status === 'inactive'
                    ? 'bg-rose-600 text-white border-rose-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                موقوف (Inactive)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                اسم الموظف الكامل <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: محمد الهادي"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">المسمى الوظيفي</label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="مثال: مسؤول مبيعات، فني، محاسب..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">رقم الهاتف</label>
              <div className="relative">
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="091xxxxxxx"
                  className="w-full pr-8 pl-3 py-2.5 rounded-xl border border-slate-300 font-mono text-xs"
                />
                <Phone className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ المباشرة</label>
              <input
                type="date"
                value={joinDate}
                onChange={(e) => setJoinDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              الراتب الشهري الأساسي
            </label>
            <div className="relative">
              <input
                type="number"
                step="any"
                min="0"
                value={baseSalary}
                onChange={(e) => setBaseSalary(e.target.value === '' ? '' : parseFloat(e.target.value))}
                placeholder="0.00"
                className="w-full pl-16 pr-4 py-2.5 rounded-xl border border-slate-300 text-lg font-black text-slate-900 bg-white"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                {settings.currency}
              </span>
            </div>
          </div>

          {/* Opening Balance (ترصيد سابق للموظف) */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <label className="block text-xs font-extrabold text-slate-800">
              الترصيد السابق للموظف (رصيد مستحق له أو سلفة سابقة عليه قبل العمل بالمنظومة):
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] text-slate-500 block mb-1">حالة الرصيد:</span>
                <select
                  value={openingBalanceType}
                  onChange={(e) => setOpeningBalanceType(e.target.value as 'credit' | 'debit')}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-bold"
                >
                  <option value="credit">له مستحق على المنشأة (دائن)</option>
                  <option value="debit">عليه سلفة للمنشأة (مدين)</option>
                </select>
              </div>

              <div>
                <span className="text-[11px] text-slate-500 block mb-1">المبلغ:</span>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={openingBalance}
                    onChange={(e) => setOpeningBalance(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    placeholder="0.00"
                    className="w-full pl-14 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-black text-slate-900 bg-white"
                  />
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">
                    {settings.currency}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Linked Customer Card */}
          <div className="p-3.5 rounded-2xl bg-teal-50/50 border border-teal-200 space-y-1.5">
            <label className="block text-xs font-extrabold text-teal-950 flex items-center gap-1.5">
              <Link2 className="w-4 h-4 text-teal-700" />
              ربط ببطاقة عميل (إذا كان الموظف يشتري كزبون وعميل):
            </label>
            <select
              value={linkedPartyId}
              onChange={(e) => setLinkedPartyId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-teal-300 text-xs bg-white font-medium"
            >
              <option value="">-- بدون ربط ببطاقة عميل --</option>
              {parties
                .filter((p) => !p.isSystem)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.type === 'customer' ? 'عميل' : p.type === 'both' ? 'حساب عام' : 'مورد'})
                  </option>
                ))}
            </select>
            <p className="text-[11px] text-teal-700 leading-relaxed">
              تتيح لك متابعة تعاملات الموظف التجارية وفواتير مشترياته الشخصية كعميل بشكل منفصل عن مستحقات راتبه.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="شروط الإجازة، تفاصيل النسبة..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
            ></textarea>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{employeeToEdit ? 'تحديث الموظف' : 'إضافة الموظف'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
