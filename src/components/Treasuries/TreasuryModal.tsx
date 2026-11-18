import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Treasury, TreasuryType } from '../../types';
import { Landmark, X, CheckCircle, Banknote, CreditCard } from 'lucide-react';

interface TreasuryModalProps {
  isOpen: boolean;
  onClose: () => void;
  treasuryToEdit?: Treasury | null;
}

export const TreasuryModal: React.FC<TreasuryModalProps> = ({
  isOpen,
  onClose,
  treasuryToEdit,
}) => {
  const { addTreasury, updateTreasury, settings, addToast } = useApp();

  const [name, setName] = useState('');
  const [type, setType] = useState<TreasuryType>('cash');
  const [accountNumber, setAccountNumber] = useState('');
  const [openingBalance, setOpeningBalance] = useState<number | ''>(0);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (treasuryToEdit) {
      setName(treasuryToEdit.name);
      setType(treasuryToEdit.type);
      setAccountNumber(treasuryToEdit.accountNumber || '');
      setOpeningBalance(treasuryToEdit.openingBalance);
      setNotes(treasuryToEdit.notes || '');
    } else {
      setName('');
      setType('cash');
      setAccountNumber('');
      setOpeningBalance(0);
      setNotes('');
    }
  }, [treasuryToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast('error', 'يرجى إدخال اسم الخزينة أو المصرف');
      return;
    }

    const payload: Omit<Treasury, 'id' | 'createdAt'> = {
      name: name.trim(),
      type,
      accountNumber: type === 'bank' ? accountNumber.trim() : undefined,
      openingBalance: Number(openingBalance) || 0,
      notes: notes.trim(),
    };

    if (treasuryToEdit) {
      updateTreasury(treasuryToEdit.id, payload);
    } else {
      addTreasury(payload);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">
                {treasuryToEdit ? 'تعديل الخزينة / المصرف' : 'إضافة خزينة أو حساب مصرفي'}
              </h2>
              <p className="text-xs text-slate-500">إدارة أوعية السيولة النقدية والمصرفية</p>
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
          {/* Type */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">النوع:</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('cash')}
                className={`py-2 px-3 rounded-xl font-bold border transition-all flex items-center justify-center gap-1.5 ${
                  type === 'cash'
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Banknote className="w-4 h-4" />
                <span>خزينة نقدية (كاش)</span>
              </button>
              <button
                type="button"
                onClick={() => setType('bank')}
                className={`py-2 px-3 rounded-xl font-bold border transition-all flex items-center justify-center gap-1.5 ${
                  type === 'bank'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>حساب مصرفي / بنك</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              اسم الخزينة أو المصرف <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: الخزينة الرئيسية، درج الكاشير، مصرف الجمهورية..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold"
              required
            />
          </div>

          {type === 'bank' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">رقم الحساب المصرفي (IBAN / رقم الحساب)</label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="مثال: 0012-0044-8899"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              رصيد بداية المدة (الرصيد الافتتاحي)
            </label>
            <div className="relative">
              <input
                type="number"
                step="any"
                min="0"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value === '' ? '' : parseFloat(e.target.value))}
                placeholder="0.00"
                className="w-full pl-16 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm font-bold"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                {settings.currency}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">الرصيد الفعلي الموجود بالخزينة/المصرف عند بدء العمل بالمنظومة</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات إضافية</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: مخصصة للمبيعات النقدية المباشرة..."
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
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{treasuryToEdit ? 'تحديث البيانات' : 'إضافة الخزينة'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
