import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Employee, EmployeeTransactionType, PaymentMethod } from '../../types';
import { X, CheckCircle, DollarSign } from 'lucide-react';

interface EmployeeActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  defaultType?: EmployeeTransactionType;
}

export const EmployeeActionModal: React.FC<EmployeeActionModalProps> = ({
  isOpen,
  onClose,
  employee,
  defaultType = 'advance',
}) => {
  const { treasuries, addEmployeeTransaction, settings, addToast } = useApp();

  const [type, setType] = useState<EmployeeTransactionType>(defaultType);
  const [amount, setAmount] = useState<number | ''>('');
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  const [month, setMonth] = useState(new Date().toISOString().substring(0, 7));
  const [treasuryId, setTreasuryId] = useState(treasuries[0]?.id || '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [notes, setNotes] = useState('');

  React.useEffect(() => {
    if (employee && isOpen) {
      setType(defaultType);
      setAmount('');
      setDate(new Date().toISOString().substring(0, 10));
      setMonth(new Date().toISOString().substring(0, 7));
      setTreasuryId(treasuries[0]?.id || '');
      setPaymentMethod('cash');
      setNotes('');
    }
  }, [employee, isOpen, defaultType, treasuries]);

  if (!isOpen || !employee) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      addToast('error', 'يرجى إدخال مبلغ صحيح');
      return;
    }

    addEmployeeTransaction({
      employeeId: employee.id,
      employeeName: employee.name,
      type,
      amount: Number(amount),
      date,
      month,
      treasuryId: type === 'advance' || type === 'payout' ? treasuryId : undefined,
      paymentMethod: type === 'advance' || type === 'payout' ? paymentMethod : undefined,
      notes: notes.trim(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-base font-black text-slate-900">تسجيل حركة مالية للموظف</h2>
            <p className="text-xs text-slate-500">{employee.name} • {employee.jobTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">نوع العملية:</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('advance')}
                className={`py-2 px-2 rounded-xl font-bold text-xs border transition-all ${
                  type === 'advance'
                    ? 'bg-rose-600 text-white border-rose-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                سلفة نقدية (مسحوبة)
              </button>
              <button
                type="button"
                onClick={() => setType('payout')}
                className={`py-2 px-2 rounded-xl font-bold text-xs border transition-all ${
                  type === 'payout'
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                صرف راتب / مستحقات
              </button>
              <button
                type="button"
                onClick={() => setType('bonus')}
                className={`py-2 px-2 rounded-xl font-bold text-xs border transition-all ${
                  type === 'bonus'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                مكافأة تشجيعية
              </button>
              <button
                type="button"
                onClick={() => setType('deduction')}
                className={`py-2 px-2 rounded-xl font-bold text-xs border transition-all ${
                  type === 'deduction'
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                خصم / استقطاع
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              المبلغ <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="any"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                placeholder="0.00"
                className="w-full pl-16 pr-4 py-2.5 rounded-xl border border-slate-300 text-lg font-bold"
                required
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                {settings.currency}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ المعاملة</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">شهر الاستحقاق</label>
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold"
              />
            </div>
          </div>

          {(type === 'advance' || type === 'payout') && (
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <span className="block text-xs font-extrabold text-slate-800">
                طريقة الصرف النقدي والخزينة المتأثرة:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">الخزينة / المصرف:</label>
                  <select
                    value={treasuryId}
                    onChange={(e) => setTreasuryId(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-white font-medium"
                  >
                    {treasuries.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">طريقة الدفع:</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    <option value="cash">نقدي (كاش)</option>
                    <option value="bank_transfer">تحويل بنكي</option>
                    <option value="card">بطاقة</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">البيان وملاحظات</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: سلفة مستعجلة، صرف راتب شهر..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
            />
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
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <CheckCircle className="w-4 h-4" />
              <span>تسجيل الحركة</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
