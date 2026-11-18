import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Employee } from '../../types';
import { Calendar, DollarSign, X, CheckCircle, AlertTriangle } from 'lucide-react';

interface AccrueSalaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
}

export const AccrueSalaryModal: React.FC<AccrueSalaryModalProps> = ({
  isOpen,
  onClose,
  employee,
}) => {
  const { accrueEmployeeSalary, settings, addToast } = useApp();

  const [month, setMonth] = useState(new Date().toISOString().substring(0, 7));
  const [amount, setAmount] = useState<number | ''>(employee?.baseSalary || 0);
  const [notes, setNotes] = useState('');

  React.useEffect(() => {
    if (employee && isOpen) {
      setMonth(new Date().toISOString().substring(0, 7));
      setAmount(employee.status === 'on_leave' ? 0 : employee.baseSalary || 0);
      setNotes('');
    }
  }, [employee, isOpen]);

  if (!isOpen || !employee) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAmt = Number(amount);
    if (finalAmt < 0) {
      addToast('error', 'المبلغ لا يمكن أن يكون سالباً');
      return;
    }

    accrueEmployeeSalary(employee.id, month, finalAmt, notes.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">إثبات استحقاق الراتب الشهري</h2>
              <p className="text-xs text-slate-500">{employee.name} • {employee.jobTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs sm:text-sm">
          {employee.status === 'on_leave' && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-amber-900 text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">الموظف في حالة إجازة بدون راتب</strong>
                <span>يمكنك تسجيل الراتب بقيمة 0 د.ل أو تعديل القيمة إذا تم الاتفاق على صرف راتب جزئي.</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">الشهر المستحق عنه الراتب</label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold bg-white"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              قيمة الراتب المستحق للترصيد في حسابه <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="any"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                placeholder="0.00"
                className="w-full pl-16 pr-4 py-2.5 rounded-xl border border-slate-300 text-lg font-black text-slate-900"
                required
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                {settings.currency}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              الراتب الأساسي المسجل في بطاقة الموظف: {employee.baseSalary} {settings.currency}
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">البيان / ملاحظات الإثبات</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: استحقاق راتب كامل عن شهر..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
            />
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
            💡 سيتم تقييد هذا المبلغ في حساب الموظف كـ <strong>(مستحق له)</strong>، ويمكنك صرفه لاحقاً بالكامل أو على دفعات عن طريق زر <strong>"صرف مستحقات (سند صرف)"</strong>.
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
              <span>إثبات وترصيد في الحساب</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
