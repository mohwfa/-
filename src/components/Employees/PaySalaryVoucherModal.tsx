import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Employee, PaymentMethod } from '../../types';
import { FileCheck2, X, CheckCircle, Banknote, CreditCard, Landmark } from 'lucide-react';

interface PaySalaryVoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
}

export const PaySalaryVoucherModal: React.FC<PaySalaryVoucherModalProps> = ({
  isOpen,
  onClose,
  employee,
}) => {
  const { treasuries, getEmployeeBalance, payEmployeeViaVoucher, settings, addToast } = useApp();

  const balanceInfo = employee ? getEmployeeBalance(employee.id) : { net: 0 };
  const defaultAmount = balanceInfo.net > 0 ? balanceInfo.net : employee?.baseSalary || 0;

  const [amount, setAmount] = useState<number | ''>(defaultAmount);
  const [treasuryId, setTreasuryId] = useState(treasuries[0]?.id || '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [month, setMonth] = useState(new Date().toISOString().substring(0, 7));
  const [notes, setNotes] = useState('');

  React.useEffect(() => {
    if (employee && isOpen) {
      const bInfo = getEmployeeBalance(employee.id);
      const defAmt = bInfo.net > 0 ? bInfo.net : employee.baseSalary || 0;
      setAmount(defAmt);
      setTreasuryId(treasuries[0]?.id || '');
      setPaymentMethod('cash');
      setMonth(new Date().toISOString().substring(0, 7));
      setNotes('');
    }
  }, [employee, isOpen, treasuries]);

  if (!isOpen || !employee) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      addToast('error', 'يرجى إدخال مبلغ صحيح للصرف');
      return;
    }
    if (!treasuryId) {
      addToast('error', 'يرجى تحديد الخزينة أو المصرف');
      return;
    }

    payEmployeeViaVoucher(
      employee.id,
      Number(amount),
      treasuryId,
      paymentMethod,
      month,
      notes.trim()
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">صرف الراتب بسند صرف مالي</h2>
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
          {/* Current balance notification */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-slate-400 block text-[11px] font-bold">الرصيد الصافي المستحق له حالياً:</span>
              <span className="font-black text-emerald-700 text-base">
                {balanceInfo.net > 0 ? balanceInfo.net.toLocaleString() : 0} {settings.currency}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setAmount(balanceInfo.net > 0 ? balanceInfo.net : employee.baseSalary)}
              className="text-[11px] font-bold text-purple-700 hover:underline bg-purple-50 px-2 py-1 rounded-lg border border-purple-200"
            >
              صرف كامل المستحق
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              مبلغ سند الصرف <span className="text-rose-500">*</span>
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
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">الخصم من خزينة/مصرف</label>
              <select
                value={treasuryId}
                onChange={(e) => setTreasuryId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-medium"
              >
                {treasuries.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">طريقة الدفع</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
              >
                <option value="cash">نقدي (كاش)</option>
                <option value="bank_transfer">تحويل بنكي / صك</option>
                <option value="card">بطاقة مصرفية</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">شهر الاستحقاق</label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-bold bg-white text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">البيان وملاحظات السند</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: تسوية وصرف راتب شهر..."
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
              className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <CheckCircle className="w-4 h-4" />
              <span>إصدار سند الصرف وخصم السيولة</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
