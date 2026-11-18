import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ArrowDownLeft, ArrowUpRight, X, CheckCircle } from 'lucide-react';

interface TreasuryActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  treasuryId?: string;
  defaultType?: 'deposit' | 'withdrawal';
}

export const TreasuryActionModal: React.FC<TreasuryActionModalProps> = ({
  isOpen,
  onClose,
  treasuryId: initialTreasuryId,
  defaultType = 'deposit',
}) => {
  const { treasuries, directTreasuryAction, settings, addToast } = useApp();

  const [type, setType] = useState<'deposit' | 'withdrawal'>(defaultType);
  const [treasuryId, setTreasuryId] = useState(initialTreasuryId || treasuries[0]?.id || '');
  const [amount, setAmount] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      addToast('error', 'يرجى إدخال مبلغ صحيح');
      return;
    }
    if (!treasuryId) {
      addToast('error', 'يرجى اختيار الخزينة أو المصرف');
      return;
    }

    directTreasuryAction(treasuryId, type, Number(amount), notes, date);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                type === 'deposit' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
              }`}
            >
              {type === 'deposit' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">
                {type === 'deposit' ? 'إيداع نقدي مباشر' : 'سحب نقدي مباشر'}
              </h2>
              <p className="text-xs text-slate-500">تعديل مباشر لرصيد الخزينة أو المصرف</p>
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
          {/* Action Type Toggle */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setType('deposit')}
              className={`py-2 px-3 rounded-xl font-bold border transition-all ${
                type === 'deposit'
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              إيداع مباشر (وارد)
            </button>
            <button
              type="button"
              onClick={() => setType('withdrawal')}
              className={`py-2 px-3 rounded-xl font-bold border transition-all ${
                type === 'withdrawal'
                  ? 'bg-rose-600 text-white border-rose-600'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              سحب مباشر (صادر)
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">الخزينة أو الحساب المصرفي</label>
            <select
              value={treasuryId}
              onChange={(e) => setTreasuryId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-medium"
            >
              {treasuries.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.type === 'cash' ? 'خزينة نقدية' : 'مصرف'})
                </option>
              ))}
            </select>
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

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ العملية</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">البيان وسبب العملية</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: تغذية الخزينة من المالك، سحب شخصي، إيداع فائض..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
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
              className={`px-5 py-2 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm ${
                type === 'deposit' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              <span>تأكيد العملية</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
