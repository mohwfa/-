import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { PaymentMethod, Voucher, VoucherSubType, VoucherType } from '../../types';
import { FileCheck2, X, CheckCircle, DollarSign, Building, Calendar, ArrowDownLeft, ArrowUpRight, Printer } from 'lucide-react';

interface VoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  voucherToEdit?: Voucher | null;
  initialType?: VoucherType;
  initialPartyId?: string;
  onSavedAndPrint?: (voucher: Voucher) => void;
}

export const VoucherModal: React.FC<VoucherModalProps> = ({
  isOpen,
  onClose,
  voucherToEdit,
  initialType = 'receipt',
  initialPartyId,
  onSavedAndPrint,
}) => {
  const { parties, treasuries, employees, settings, getPartyBalance, addVoucher, updateVoucher, addToast } = useApp();

  const [type, setType] = useState<VoucherType>(initialType);
  const [voucherNumber, setVoucherNumber] = useState('');
  const [subType, setSubType] = useState<VoucherSubType>('customer_receipt');
  const [partyType, setPartyType] = useState<'party' | 'employee' | 'none'>('party');
  const [partyId, setPartyId] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [treasuryId, setTreasuryId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  const [referenceInvoiceNumber, setReferenceInvoiceNumber] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (voucherToEdit) {
      setType(voucherToEdit.type);
      setVoucherNumber(voucherToEdit.voucherNumber);
      setSubType(voucherToEdit.subType);
      setPartyType(voucherToEdit.partyType);
      setPartyId(voucherToEdit.partyId || '');
      setEmployeeId(voucherToEdit.employeeId || '');
      setAmount(voucherToEdit.amount);
      setPaymentMethod(voucherToEdit.paymentMethod);
      setTreasuryId(voucherToEdit.treasuryId);
      setDate(voucherToEdit.date);
      setReferenceInvoiceNumber(voucherToEdit.referenceInvoiceNumber || '');
      setNotes(voucherToEdit.notes || '');
    } else {
      setType(initialType);
      const prefix = initialType === 'receipt' ? 'REC-' : 'PAY-';
      setVoucherNumber(`${prefix}${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
      
      const targetParty = initialPartyId ? parties.find((p) => p.id === initialPartyId) : null;
      if (targetParty) {
        setPartyType('party');
        setPartyId(targetParty.id);
        if (targetParty.type === 'supplier') {
          setSubType(initialType === 'receipt' ? 'other' : 'supplier_payment');
        } else {
          setSubType(initialType === 'receipt' ? 'customer_receipt' : 'other');
        }
      } else {
        setSubType(initialType === 'receipt' ? 'customer_receipt' : 'supplier_payment');
        setPartyType('party');
        const cashParty = parties.find((p) => p.id === 'party_cash');
        setPartyId(cashParty ? cashParty.id : parties[0]?.id || '');
      }

      setEmployeeId(employees[0]?.id || '');
      setAmount('');
      setPaymentMethod('cash');
      setTreasuryId(treasuries[0]?.id || '');
      setDate(new Date().toISOString().substring(0, 10));
      setReferenceInvoiceNumber('');
      setNotes('');
    }
  }, [voucherToEdit, isOpen, initialType, initialPartyId, parties, treasuries, employees]);

  if (!isOpen) return null;

  const handleSubmit = (shouldPrint = true) => {
    if (!voucherNumber.trim()) {
      addToast('error', 'يرجى إدخال رقم السند');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      addToast('error', 'يرجى إدخال مبلغ السند');
      return;
    }
    if (!treasuryId) {
      addToast('error', 'يرجى تحديد الخزينة أو المصرف');
      return;
    }

    if (partyType === 'party' && !partyId) {
      addToast('error', 'يرجى اختيار الحساب أو العميل / المورد');
      return;
    }

    if (partyType === 'employee' && !employeeId) {
      addToast('error', 'يرجى اختيار الموظف المستفيد');
      return;
    }

    let pName: string | undefined = undefined;
    let eName: string | undefined = undefined;

    if (partyType === 'party' && partyId) {
      pName = parties.find((p) => p.id === partyId)?.name;
    } else if (partyType === 'employee' && employeeId) {
      eName = employees.find((e) => e.id === employeeId)?.name;
    }

    const payload: Omit<Voucher, 'id' | 'createdAt' | 'createdBy'> = {
      voucherNumber: voucherNumber.trim(),
      type,
      subType,
      partyType,
      partyId: partyType === 'party' ? partyId : undefined,
      partyName: pName,
      employeeId: partyType === 'employee' ? employeeId : undefined,
      employeeName: eName,
      amount: Number(amount),
      paymentMethod,
      treasuryId,
      date,
      referenceInvoiceNumber: referenceInvoiceNumber.trim(),
      notes: notes.trim(),
    };

    if (voucherToEdit) {
      updateVoucher(voucherToEdit.id, payload);
      if (shouldPrint && onSavedAndPrint) {
        onSavedAndPrint({
          ...payload,
          id: voucherToEdit.id,
          createdBy: voucherToEdit.createdBy,
          createdAt: voucherToEdit.createdAt,
        });
      }
    } else {
      const savedVoucher = addVoucher(payload);
      if (shouldPrint && onSavedAndPrint) {
        onSavedAndPrint(savedVoucher);
      }
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                type === 'receipt' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
              }`}
            >
              {type === 'receipt' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                {voucherToEdit
                  ? 'تعديل السند المالي'
                  : type === 'receipt'
                  ? 'إصدار سند قبض (استلام أموال)'
                  : 'إصدار سند صرف (دفع أموال)'}
              </h2>
              <p className="text-xs text-slate-500">
                إيصالات قبض ودفع ثمن الفواتير، الدفعات المقدمة، أو المصروفات
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 min-h-0 space-y-4 text-xs sm:text-sm">
          {/* Voucher Type Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setType('receipt');
                setSubType('customer_receipt');
              }}
              className={`py-2.5 px-3 rounded-xl font-bold border transition-all flex items-center justify-center gap-2 ${
                type === 'receipt'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/30'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>سند قبض (وارد)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setType('payment');
                setSubType('supplier_payment');
              }}
              className={`py-2.5 px-3 rounded-xl font-bold border transition-all flex items-center justify-center gap-2 ${
                type === 'payment'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-sm shadow-rose-600/30'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>سند صرف (صادر)</span>
            </button>
          </div>

          {/* Number & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">رقم السند</label>
              <input
                type="text"
                value={voucherNumber}
                onChange={(e) => setVoucherNumber(e.target.value)}
                placeholder="REC-001"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">تاريخ السند</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>
          </div>

          {/* SubType classification */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">سبب وغرض السند:</label>
            <select
              value={subType}
              onChange={(e) => setSubType(e.target.value as VoucherSubType)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white font-medium"
            >
              {type === 'receipt' ? (
                <>
                  <option value="customer_receipt">قبض دفعة من عميل / تسوية حساب</option>
                  <option value="invoice_payment">قبض ثمن فاتورة مبيعات ورقية</option>
                  <option value="advance_payment">دفعة مقدمة / عربون على الحساب</option>
                  <option value="direct_deposit">إيداع نقدي مباشر في الخزينة/المصرف</option>
                  <option value="other">قبض نقدي آخر</option>
                </>
              ) : (
                <>
                  <option value="supplier_payment">دفع مستحقات لمورد / تسوية حساب</option>
                  <option value="purchase_payment">دفع قيمة مشتريات ورقية</option>
                  <option value="expense_payment">دفع مصروفات تشغيلية</option>
                  <option value="advance_payment">دفعة مقدمة لمورد / عربون</option>
                  <option value="direct_withdrawal">سحب نقدي مباشر من الخزينة/المصرف</option>
                  <option value="other">صرف نقدي آخر</option>
                </>
              )}
            </select>
          </div>

          {/* Party Selection Type */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-bold text-slate-700">
                {type === 'receipt' ? 'استلمنا من:' : 'صرفنا إلى:'}
              </label>
              <div className="flex gap-2 text-xs">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name="partyType"
                    checked={partyType === 'party'}
                    onChange={() => setPartyType('party')}
                  />
                  <span>عميل / مورد</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name="partyType"
                    checked={partyType === 'employee'}
                    onChange={() => setPartyType('employee')}
                  />
                  <span>موظف</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name="partyType"
                    checked={partyType === 'none'}
                    onChange={() => setPartyType('none')}
                  />
                  <span>حركة مباشرة</span>
                </label>
              </div>
            </div>

            {partyType === 'party' && (
              <div className="space-y-1.5">
                <select
                  value={partyId}
                  onChange={(e) => setPartyId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white font-medium"
                >
                  {parties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.type === 'both' ? '(حساب عام)' : ''}
                    </option>
                  ))}
                </select>

                {/* Selected Party Current Balance & Quick Fill Button */}
                {partyId && (() => {
                  const partyBal = getPartyBalance(partyId);
                  const absBal = Math.abs(partyBal.net);
                  return (
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500 text-[11px]">الرصيد الصافي للحساب:</span>
                        <span
                          className={`font-black ${
                            partyBal.status === 'debit'
                              ? 'text-rose-700'
                              : partyBal.status === 'credit'
                              ? 'text-blue-700'
                              : 'text-emerald-700'
                          }`}
                        >
                          {absBal.toLocaleString()} {settings.currency}{' '}
                          <span className="font-normal text-[10px]">
                            ({partyBal.status === 'debit' ? 'عليه للمنشأة' : partyBal.status === 'credit' ? 'له على المنشأة' : 'متزن (0)'})
                          </span>
                        </span>
                      </div>
                      {absBal > 0 && (
                        <button
                          type="button"
                          onClick={() => setAmount(absBal)}
                          className="text-[10px] font-bold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-2 py-1 rounded-lg border border-teal-200 transition-colors cursor-pointer"
                          title="إدراج كامل الرصيد في خانة المبلغ"
                        >
                          إدراج كامل الرصيد ({absBal.toLocaleString()})
                        </button>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {partyType === 'employee' && (
              <select
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white font-medium"
              >
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name} ({e.jobTitle})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Amount Box */}
          <div
            className={`p-4 rounded-2xl border ${
              type === 'receipt' ? 'bg-emerald-50/60 border-emerald-200' : 'bg-rose-50/60 border-rose-200'
            }`}
          >
            <label
              className={`block text-xs font-extrabold mb-1.5 ${
                type === 'receipt' ? 'text-emerald-900' : 'text-rose-900'
              }`}
            >
              مبلغ السند <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="any"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                placeholder="0.00"
                className="w-full pl-16 pr-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xl font-black text-slate-900 bg-white"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                {settings.currency}
              </span>
            </div>
          </div>

          {/* Payment Method & Treasury */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">طريقة الدفع/القبض</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white"
              >
                <option value="cash">نقدي (كاش)</option>
                <option value="bank_transfer">تحويل بنكي / صك مصرفي</option>
                <option value="card">بطاقة مصرفية / POS</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {type === 'receipt' ? 'إيداع في خزينة/مصرف:' : 'صرف من خزينة/مصرف:'}
              </label>
              <select
                value={treasuryId}
                onChange={(e) => setTreasuryId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white font-bold"
              >
                {treasuries.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.type === 'cash' ? 'خزينة كاش' : 'مصرف'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Reference Invoice # */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              رقم الفاتورة الورقية المرتبطة (إن وجدت)
            </label>
            <input
              type="text"
              value={referenceInvoiceNumber}
              onChange={(e) => setReferenceInvoiceNumber(e.target.value)}
              placeholder="مثال: INV-1042 أو PUR-891"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">البيان وملاحظات السند</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: دفعة من الحساب نقداً، تسوية رصيد..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <CheckCircle className="w-4 h-4" />
            <span>{voucherToEdit ? 'تحديث السند' : 'حفظ السند فقط'}</span>
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            className={`px-4.5 py-2.5 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer ${
              type === 'receipt'
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
                : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>حفظ ومعاينة طباعة A4 🖨️</span>
          </button>
        </div>
      </div>
    </div>
  );
};
