import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Party, PartyType } from '../../types';
import { Users2, X, CheckCircle, Phone, MapPin } from 'lucide-react';

interface PartyModalProps {
  isOpen: boolean;
  onClose: () => void;
  partyToEdit?: Party | null;
  defaultType?: PartyType;
}

export const PartyModal: React.FC<PartyModalProps> = ({
  isOpen,
  onClose,
  partyToEdit,
  defaultType = 'customer',
}) => {
  const { addParty, updateParty, settings, addToast } = useApp();

  const [name, setName] = useState('');
  const [type, setType] = useState<PartyType>(defaultType);
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [openingBalance, setOpeningBalance] = useState<number | ''>(0);
  const [openingBalanceType, setOpeningBalanceType] = useState<'debit' | 'credit'>('debit');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (partyToEdit) {
      setName(partyToEdit.name);
      setType(partyToEdit.type);
      setPhone(partyToEdit.phone || '');
      setAddress(partyToEdit.address || '');
      setOpeningBalance(partyToEdit.openingBalance);
      setOpeningBalanceType(partyToEdit.openingBalanceType);
      setNotes(partyToEdit.notes || '');
    } else {
      setName('');
      setType(defaultType);
      setPhone('');
      setAddress('');
      setOpeningBalance(0);
      setOpeningBalanceType('debit');
      setNotes('');
    }
  }, [partyToEdit, isOpen, defaultType]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast('error', 'يرجى إدخال اسم العميل أو المورد');
      return;
    }

    const payload: Omit<Party, 'id' | 'createdAt'> = {
      name: name.trim(),
      type,
      phone: phone.trim(),
      address: address.trim(),
      openingBalance: Number(openingBalance) || 0,
      openingBalanceType,
      notes: notes.trim(),
    };

    if (partyToEdit) {
      updateParty(partyToEdit.id, payload);
    } else {
      addParty(payload);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
              <Users2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">
                {partyToEdit ? 'تعديل بطاقة الحساب' : 'إضافة بطاقة عميل أو مورد'}
              </h2>
              <p className="text-xs text-slate-500">تسجيل بيانات الطرف والترصيد الافتتاحي</p>
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
          {/* Party Type: Customer, Supplier, or Both (General Account) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">تصنيف الحساب:</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setType('customer')}
                className={`py-2 px-2 rounded-xl font-bold text-xs border transition-all ${
                  type === 'customer'
                    ? 'bg-teal-600 text-white border-teal-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                عميل (زبون)
              </button>
              <button
                type="button"
                onClick={() => setType('supplier')}
                className={`py-2 px-2 rounded-xl font-bold text-xs border transition-all ${
                  type === 'supplier'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                مورد (بائع)
              </button>
              <button
                type="button"
                onClick={() => setType('both')}
                className={`py-2 px-2 rounded-xl font-bold text-xs border transition-all ${
                  type === 'both'
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
                title="في نفس الوقت هو مورد وأحيانا يكون عميل"
              >
                حساب عام (عميل ومورد)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              اسم العميل أو المورد أو الشركة <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: شركة الأمل، أحمد علي، مؤسسة السلام..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold"
              required
            />
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
                  className="w-full pr-8 pl-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                />
                <Phone className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">العنوان / المدينة</label>
              <div className="relative">
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="مثال: شارع النصر، طرابلس"
                  className="w-full pr-8 pl-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
                <MapPin className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Opening Balance (الترصيد السابق) */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <label className="block text-xs font-extrabold text-slate-800">
              الترصيد السابق (إذا كان عليه أو له رصيد سابق قبل المنظومة):
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] text-slate-500 block mb-1">حالة الرصيد السابق:</span>
                <select
                  value={openingBalanceType}
                  onChange={(e) => setOpeningBalanceType(e.target.value as 'debit' | 'credit')}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-bold"
                >
                  <option value="debit">عليه رصيد مدين (مطلوب منه سداده للمنشأة)</option>
                  <option value="credit">له رصيد دائن (مستحق له على المنشأة)</option>
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

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات الحساب</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="شروط الدفع المتفق عليها، تفاصيل الاتصال..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
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
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{partyToEdit ? 'تحديث البطاقة' : 'حفظ البطاقة'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
