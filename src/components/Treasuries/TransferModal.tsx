import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ArrowLeftRight, X, CheckCircle } from 'lucide-react';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TransferModal: React.FC<TransferModalProps> = ({ isOpen, onClose }) => {
  const { treasuries, transferBetweenTreasuries, settings, addToast } = useApp();

  const [fromTreasuryId, setFromTreasuryId] = useState(treasuries[0]?.id || '');
  const [toTreasuryId, setToTreasuryId] = useState(treasuries[1]?.id || treasuries[0]?.id || '');
  const [amount, setAmount] = useState<number | ''>('');
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      addToast('error', 'يرجى إدخال مبلغ صحيح للتحويل');
      return;
    }
    if (fromTreasuryId === toTreasuryId) {
      addToast('error', 'يرجى اختيار خزينتين مختلفتين للتحويل بينهما');
      return;
    }

    transferBetweenTreasuries(fromTreasuryId, toTreasuryId, Number(amount), notes, date);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">تحويل بين الخزائن والمصارف</h2>
              <p className="text-xs text-slate-500">نقل سيولة من خزينة كاش لمصرف أو العكس</p>
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
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">من الخزينة / المصرف (المحول منه):</label>
            <select
              value={fromTreasuryId}
              onChange={(e) => setFromTreasuryId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs bg-white font-medium"
            >
              {treasuries.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.type === 'cash' ? 'خزينة كاش' : 'مصرف'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">إلى الخزينة / المصرف (المحول إليه):</label>
            <select
              value={toTreasuryId}
              onChange={(e) => setToTreasuryId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs bg-white font-medium"
            >
              {treasuries.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.type === 'cash' ? 'خزينة كاش' : 'مصرف'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              مبلغ التحويل <span className="text-rose-500">*</span>
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
            <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ التحويل</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات التحويل</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: توريد إيراد كاش للمصرف، سحب صك لتغذية الخزينة..."
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
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <CheckCircle className="w-4 h-4" />
              <span>تنفيذ التحويل</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
