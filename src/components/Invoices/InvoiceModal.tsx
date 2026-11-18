import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Invoice, InvoiceManualItem, InvoiceType, PartyType, PaymentMethod } from '../../types';
import { sanitizeManualItems, computeManualItemTotal } from '../../utils/invoicePrintItems';
import {
  Receipt,
  X,
  Plus,
  Percent,
  CheckCircle,
  Building,
  Calendar,
  DollarSign,
  AlertCircle,
  UserCheck,
  CreditCard,
  Banknote,
  Send,
  UserPlus,
  FolderPlus,
  Printer,
  Trash2,
  Table2,
} from 'lucide-react';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceToEdit?: Invoice | null;
  onSavedAndPrint?: (invoice: Invoice) => void;
  initialType?: InvoiceType;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  invoiceToEdit,
  onSavedAndPrint,
  initialType = 'sale',
}) => {
  const {
    parties,
    treasuries,
    employees,
    settings,
    addInvoice,
    updateInvoice,
    addParty,
    addExpenseCategory,
    addToast,
  } = useApp();

  const [type, setType] = useState<InvoiceType>(initialType);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [partyId, setPartyId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  const [totalAmount, setTotalAmount] = useState<number | ''>('');
  const [expenseCategory, setExpenseCategory] = useState(settings.expenseCategories[0] || 'صيانة ومرافق');

  // Quick Add Party Dialog
  const [showAddPartyModal, setShowAddPartyModal] = useState(false);
  const [newPartyName, setNewPartyName] = useState('');
  const [newPartyType, setNewPartyType] = useState<PartyType>('customer');
  const [newPartyPhone, setNewPartyPhone] = useState('');
  const [newPartyBalance, setNewPartyBalance] = useState<number | ''>(0);
  const [newPartyBalanceType, setNewPartyBalanceType] = useState<'debit' | 'credit'>('debit');

  // Quick Add Expense Category Dialog
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Payment
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'credit' | 'partial'>('paid');
  const [paidAmount, setPaidAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [treasuryId, setTreasuryId] = useState('');

  // Employee commission (ONLY in sales invoices!)
  const [hasEmployeeCommission, setHasEmployeeCommission] = useState(false);
  const [employeeId, setEmployeeId] = useState('');
  const [commissionRate, setCommissionRate] = useState<number | ''>(5);
  const [commissionAmount, setCommissionAmount] = useState<number | ''>('');
  const [commissionMonth, setCommissionMonth] = useState(new Date().toISOString().substring(0, 7));

  const [manualItems, setManualItems] = useState<InvoiceManualItem[]>([]);
  const [notes, setNotes] = useState('');

  // Pre-fill when editing or opening
  useEffect(() => {
    if (invoiceToEdit) {
      setType(invoiceToEdit.type);
      setInvoiceNumber(invoiceToEdit.invoiceNumber);
      setPartyId(invoiceToEdit.partyId);
      setDate(invoiceToEdit.date);
      setTotalAmount(invoiceToEdit.totalAmount);
      setExpenseCategory(invoiceToEdit.expenseCategory || settings.expenseCategories[0] || 'صيانة ومرافق');
      setPaymentStatus(invoiceToEdit.paymentStatus);
      setPaidAmount(invoiceToEdit.paidAmount);
      setPaymentMethod(invoiceToEdit.paymentMethod || 'cash');
      setTreasuryId(invoiceToEdit.treasuryId || (treasuries[0]?.id || ''));
      setHasEmployeeCommission(invoiceToEdit.type === 'sale' && !!invoiceToEdit.hasEmployeeCommission);
      setEmployeeId(invoiceToEdit.employeeId || '');
      setCommissionRate(invoiceToEdit.commissionRate || '');
      setCommissionAmount(invoiceToEdit.commissionAmount || '');
      setCommissionMonth(invoiceToEdit.commissionMonth || invoiceToEdit.date.substring(0, 7));
      setManualItems(invoiceToEdit.manualItems ? invoiceToEdit.manualItems.map((item) => ({ ...item })) : []);
      setNotes(invoiceToEdit.notes || '');
    } else {
      setType(initialType);
      const prefix = initialType === 'sale' ? 'INV-' : initialType === 'purchase' ? 'PUR-' : 'EXP-';
      setInvoiceNumber(`${prefix}${Math.floor(1000 + Math.random() * 9000)}`);
      const cashParty = parties.find((p) => p.id === 'party_cash');
      setPartyId(cashParty ? cashParty.id : parties[0]?.id || '');
      setDate(new Date().toISOString().substring(0, 10));
      setTotalAmount('');
      setPaidAmount('');
      setPaymentStatus('paid');
      setPaymentMethod('cash');
      setTreasuryId(treasuries[0]?.id || '');
      setHasEmployeeCommission(false);
      setEmployeeId(employees[0]?.id || '');
      setCommissionRate(5);
      setCommissionAmount('');
      setCommissionMonth(new Date().toISOString().substring(0, 7));
      setManualItems([]);
      setNotes('');
    }
  }, [invoiceToEdit, isOpen, initialType, parties, treasuries, employees, settings.expenseCategories]);

  // When type changes, adjust defaults
  const handleTypeChange = (newType: InvoiceType) => {
    setType(newType);
    if (newType !== 'sale') {
      setHasEmployeeCommission(false);
    }
    if (!invoiceToEdit) {
      const prefix = newType === 'sale' ? 'INV-' : newType === 'purchase' ? 'PUR-' : 'EXP-';
      setInvoiceNumber(`${prefix}${Math.floor(1000 + Math.random() * 9000)}`);
    }
  };

  // Recalculate commission when totalAmount or rate changes
  useEffect(() => {
    if (type === 'sale' && hasEmployeeCommission && totalAmount && Number(totalAmount) > 0) {
      if (commissionRate !== '') {
        const calculated = (Number(totalAmount) * Number(commissionRate)) / 100;
        setCommissionAmount(Number(calculated.toFixed(2)));
      }
    }
  }, [totalAmount, commissionRate, hasEmployeeCommission, type]);

  // Sync paidAmount when paymentStatus changes
  useEffect(() => {
    if (paymentStatus === 'paid' && totalAmount !== '') {
      setPaidAmount(Number(totalAmount));
    } else if (paymentStatus === 'credit') {
      setPaidAmount(0);
    }
  }, [paymentStatus, totalAmount]);

  if (!isOpen) return null;

  // Handle Quick Add Party
  const handleQuickAddParty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartyName.trim()) {
      addToast('error', 'يرجى إدخال اسم العميل أو المورد');
      return;
    }

    const created = addParty({
      name: newPartyName.trim(),
      type: newPartyType,
      phone: newPartyPhone.trim(),
      address: '',
      openingBalance: Number(newPartyBalance) || 0,
      openingBalanceType: newPartyBalanceType,
    });

    setPartyId(created.id);
    setNewPartyName('');
    setNewPartyPhone('');
    setNewPartyBalance(0);
    setShowAddPartyModal(false);
  };

  // Handle Quick Add Expense Category
  const handleQuickAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    addExpenseCategory(newCategoryName.trim());
    setExpenseCategory(newCategoryName.trim());
    setNewCategoryName('');
    setShowAddExpenseModal(false);
  };

  const handleSubmit = (keepOpenAfterSave = false, shouldPrint = false) => {
    if (!invoiceNumber.trim()) {
      addToast('error', 'يرجى كتابة رقم الفاتورة الورقية');
      return;
    }
    if (!totalAmount || Number(totalAmount) <= 0) {
      addToast('error', 'يرجى إدخال القيمة الإجمالية للفاتورة');
      return;
    }
    if (!partyId) {
      addToast('error', 'يرجى تحديد العميل أو المورد أو الحساب النقدي');
      return;
    }

    const selectedParty = parties.find((p) => p.id === partyId);
    const selectedEmployee = employees.find((e) => e.id === employeeId);

    const actualPaidAmount =
      paymentStatus === 'paid'
        ? Number(totalAmount)
        : paymentStatus === 'credit'
        ? 0
        : Number(paidAmount) || 0;

    if (paymentStatus === 'partial') {
      if (actualPaidAmount <= 0) {
        addToast('error', 'في حالة السداد الجزئي، يجب إدخال المبلغ المدفوع أكبر من صفر');
        return;
      }
      if (actualPaidAmount >= Number(totalAmount)) {
        addToast('error', 'المبلغ المدفوع جزئياً يجب أن يكون أقل من إجمالي الفاتورة (أو حدد الحالة: مدفوع بالكامل)');
        return;
      }
    }

    if (actualPaidAmount > 0 && !treasuryId) {
      addToast('error', 'يرجى تحديد الخزينة أو الحساب المصرفي لتسجيل المبلغ المدفوع');
      return;
    }

    if (type === 'sale' && hasEmployeeCommission) {
      if (!employeeId) {
        addToast('error', 'يرجى اختيار الموظف المستحق للنسبة');
        return;
      }
      if (!commissionAmount || Number(commissionAmount) <= 0) {
        addToast('error', 'يرجى التأكد من نسبة أو قيمة عمولة الموظف');
        return;
      }
    }

    const invoicePayload: Omit<Invoice, 'id' | 'createdAt' | 'createdBy'> = {
      invoiceNumber: invoiceNumber.trim(),
      type,
      expenseCategory: type === 'expense' ? expenseCategory : undefined,
      partyId,
      partyName: selectedParty?.name || 'حساب غير محدد',
      date,
      totalAmount: Number(totalAmount),
      paymentStatus,
      paidAmount: actualPaidAmount,
      paymentMethod: actualPaidAmount > 0 ? paymentMethod : undefined,
      treasuryId: actualPaidAmount > 0 ? treasuryId : undefined,
      hasEmployeeCommission: type === 'sale' && hasEmployeeCommission && !!employeeId && Number(commissionAmount) > 0,
      employeeId: type === 'sale' && hasEmployeeCommission ? employeeId : undefined,
      employeeName: type === 'sale' && hasEmployeeCommission ? selectedEmployee?.name : undefined,
      commissionRate: type === 'sale' && hasEmployeeCommission ? Number(commissionRate) : undefined,
      commissionAmount: type === 'sale' && hasEmployeeCommission ? Number(commissionAmount) : undefined,
      commissionMonth: type === 'sale' && hasEmployeeCommission ? commissionMonth : undefined,
      manualItems: sanitizeManualItems(manualItems),
      notes: notes.trim(),
    };

    if (invoiceToEdit) {
      updateInvoice(invoiceToEdit.id, invoicePayload);
      if (shouldPrint && onSavedAndPrint) {
        onSavedAndPrint({
          ...invoicePayload,
          id: invoiceToEdit.id,
          createdBy: invoiceToEdit.createdBy,
          createdAt: invoiceToEdit.createdAt,
        });
      }
      onClose();
    } else {
      const savedInvoice = addInvoice(invoicePayload);

      if (shouldPrint && onSavedAndPrint) {
        onSavedAndPrint(savedInvoice);
      }

      if (keepOpenAfterSave) {
        const nextNum = parseInt(invoiceNumber.replace(/\D/g, ''), 10);
        const prefix = type === 'sale' ? 'INV-' : type === 'purchase' ? 'PUR-' : 'EXP-';
        setInvoiceNumber(nextNum ? `${prefix}${nextNum + 1}` : '');
        setTotalAmount('');
        setPaidAmount('');
        setManualItems([]);
        setNotes('');
        setHasEmployeeCommission(false);
      } else {
        onClose();
      }
    }
  };

  const relevantParties = parties.filter((p) => {
    if (p.id === 'party_cash') return true;
    if (type === 'sale') return p.type === 'customer' || p.type === 'both';
    if (type === 'purchase') return p.type === 'supplier' || p.type === 'both';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                {invoiceToEdit ? 'تعديل الفاتورة المسجلة' : 'إدخال فاتورة ورقية جديدة'}
              </h2>
              <p className="text-xs text-slate-500">
                إدخال سريع للقيمة الإجمالية ورقم الفاتورة الورقية وترصيد الحسابات
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

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 min-h-0 space-y-5 text-xs sm:text-sm">
          {/* Invoice Type Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">نوع الفاتورة الورقية:</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleTypeChange('sale')}
                className={`py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm border transition-all ${
                  type === 'sale'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/30'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                فاتورة مبيعات
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('purchase')}
                className={`py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm border transition-all ${
                  type === 'purchase'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-600/30'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                فاتورة مشتريات
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('expense')}
                className={`py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm border transition-all ${
                  type === 'expense'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-sm shadow-rose-600/30'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                فاتورة مصروفات
              </button>
            </div>
          </div>

          {/* Primary Row: Invoice # and Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                رقم الفاتورة الورقية <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="مثال: INV-1042 أو رقم الدفتر الورقي"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">تاريخ الفاتورة</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>
          </div>

          {/* Secondary Row: Party (Customer / Supplier / Cash Account) + Quick Add Button */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-1">
              <label className="block text-xs font-bold text-slate-700">
                {type === 'sale'
                  ? 'اسم العميل / المشتري'
                  : type === 'purchase'
                  ? 'اسم المورد / البائع'
                  : 'الجهة / حساب المصروف'}
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setNewPartyType(type === 'purchase' ? 'supplier' : 'customer');
                    setShowAddPartyModal(true);
                  }}
                  className="text-[11px] font-bold text-teal-700 hover:text-teal-800 bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-200 flex items-center gap-1 transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ إضافة {type === 'purchase' ? 'مورد' : 'عميل'} جديد فوراً</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPartyId('party_cash')}
                  className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-1"
                >
                  ⚡ الحساب النقدي
                </button>
              </div>
            </div>

            <select
              value={partyId}
              onChange={(e) => setPartyId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white font-medium"
            >
              {relevantParties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.type === 'both' ? '(حساب عام: مورد وعميل)' : ''} {p.phone && p.phone !== '-' ? `• ${p.phone}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Add Party Nested Dialog */}
          {showAddPartyModal && (
            <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200 space-y-3 animate-in fade-in">
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-xs text-teal-950 flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-teal-700" />
                  إضافة بطاقة {newPartyType === 'supplier' ? 'مورد' : 'عميل'} جديد مباشرة:
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddPartyModal(false)}
                  className="text-slate-400 hover:text-slate-700 text-xs"
                >
                  ✕ إلغاء
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">الاسم الكامل *</label>
                  <input
                    type="text"
                    value={newPartyName}
                    onChange={(e) => setNewPartyName(e.target.value)}
                    placeholder="اسم العميل أو المورد"
                    className="w-full px-3 py-1.5 rounded-xl border border-teal-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">نوع الحساب</label>
                  <select
                    value={newPartyType}
                    onChange={(e) => setNewPartyType(e.target.value as PartyType)}
                    className="w-full px-3 py-1.5 rounded-xl border border-teal-300 bg-white"
                  >
                    <option value="customer">عميل (زبون)</option>
                    <option value="supplier">مورد</option>
                    <option value="both">حساب عام (عميل ومورد)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">رقم الهاتف (اختياري)</label>
                  <input
                    type="text"
                    value={newPartyPhone}
                    onChange={(e) => setNewPartyPhone(e.target.value)}
                    placeholder="091xxxxxxx"
                    className="w-full px-3 py-1.5 rounded-xl border border-teal-300 bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">رصيد سابق إن وجد</label>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={newPartyBalance}
                      onChange={(e) => setNewPartyBalance(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      placeholder="0.00"
                      className="w-1/2 px-2 py-1.5 rounded-xl border border-teal-300 bg-white font-bold"
                    />
                    <select
                      value={newPartyBalanceType}
                      onChange={(e) => setNewPartyBalanceType(e.target.value as 'debit' | 'credit')}
                      className="w-1/2 px-2 py-1.5 rounded-xl border border-teal-300 bg-white text-[10px]"
                    >
                      <option value="debit">عليه (مدين)</option>
                      <option value="credit">له (دائن)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleQuickAddParty}
                  className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold"
                >
                  حفظ واختيار الحساب فوراً
                </button>
              </div>
            </div>
          )}

          {/* Expense Category if expense + Quick Add Category button */}
          {type === 'expense' && (
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-bold text-slate-700">بند وتصنيف المصروف</label>
                <button
                  type="button"
                  onClick={() => setShowAddExpenseModal(!showAddExpenseModal)}
                  className="text-[11px] font-bold text-rose-700 hover:text-rose-800 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200 flex items-center gap-1"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>+ إضافة نوع مصروف جديد</span>
                </button>
              </div>

              {showAddExpenseModal && (
                <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl space-y-2 mb-2 animate-in fade-in">
                  <span className="block text-[11px] font-bold text-rose-900">إضافة نوع وتصنيف مصروف جديد للقائمة:</span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="مثال: وقود ومحروقات، بضاعة محلية، دعاية وإعلان..."
                      className="flex-1 px-3 py-1.5 rounded-xl border border-rose-300 text-xs bg-white"
                    />
                    <button
                      type="button"
                      onClick={handleQuickAddCategory}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shrink-0"
                    >
                      إضافة
                    </button>
                  </div>
                </div>
              )}

              <select
                value={expenseCategory}
                onChange={(e) => setExpenseCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm bg-white font-medium"
              >
                {settings.expenseCategories.map((cat, idx) => (
                  <option key={idx} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Total Amount Box */}
          <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200">
            <label className="block text-xs font-extrabold text-emerald-900 mb-1.5">
              القيمة الإجمالية للفاتورة الورقية <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="any"
                min="0"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                placeholder="0.00"
                className="w-full pl-16 pr-4 py-3 rounded-xl border border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xl font-black text-emerald-950 bg-white"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                {settings.currency}
              </span>
            </div>
          </div>

          {/* Payment Status & Treasury */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/40 space-y-3">
            <label className="block text-xs font-bold text-slate-700">حالة السداد وطريقة الدفع:</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentStatus('paid')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                  paymentStatus === 'paid'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                مسددة نقداً فورياً
              </button>
              <button
                type="button"
                onClick={() => setPaymentStatus('credit')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                  paymentStatus === 'credit'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                آجل (على الحساب)
              </button>
              <button
                type="button"
                onClick={() => setPaymentStatus('partial')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                  paymentStatus === 'partial'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                سداد جزئي
              </button>
            </div>

            {paymentStatus !== 'credit' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                {paymentStatus === 'partial' && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">المبلغ المسدد الآن</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      placeholder="0.00"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-bold"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">طريقة السداد</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    <option value="cash">نقدي (كاش)</option>
                    <option value="bank_transfer">تحويل بنكي / صك</option>
                    <option value="card">بطاقة مصرفية / POS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    {type === 'sale' ? 'الإيداع في خزينة/مصرف:' : 'الخصم من خزينة/مصرف:'}
                  </label>
                  <select
                    value={treasuryId}
                    onChange={(e) => setTreasuryId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-bold"
                  >
                    {treasuries.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.type === 'cash' ? 'خزينة نقدية' : 'مصرف'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Employee Commission Section (ONLY in Sales Invoices as explicitly requested!) */}
          {type === 'sale' && (
            <div className="border border-amber-200 rounded-2xl p-4 bg-amber-50/40 animate-in fade-in">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasEmployeeCommission}
                    onChange={(e) => setHasEmployeeCommission(e.target.checked)}
                    className="w-4 h-4 rounded-md text-amber-600 focus:ring-amber-500 border-slate-300"
                  />
                  <span className="font-extrabold text-xs text-amber-950">
                    احتساب نسبة / عمولة لموظف من إجمالي فاتورة المبيعات
                  </span>
                </label>
                <span className="text-[11px] font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                  فواتير المبيعات فقط
                </span>
              </div>

              {hasEmployeeCommission && (
                <div className="mt-3.5 space-y-3 pt-3 border-t border-amber-200">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-amber-900 mb-1">اختيار الموظف</label>
                      <select
                        value={employeeId}
                        onChange={(e) => setEmployeeId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-amber-300 text-xs bg-white font-medium"
                      >
                        {employees.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.name} ({emp.jobTitle}) {emp.status === 'on_leave' ? '• إجازة' : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-amber-900 mb-1">النسبة المئوية (%)</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={commissionRate}
                          onChange={(e) => {
                            const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                            setCommissionRate(val);
                            if (val !== '' && totalAmount && Number(totalAmount) > 0) {
                              setCommissionAmount(Number(((Number(totalAmount) * Number(val)) / 100).toFixed(2)));
                            }
                          }}
                          placeholder="5"
                          className="w-full pl-8 pr-3 py-2 rounded-xl border border-amber-300 text-xs bg-white font-bold"
                        />
                        <Percent className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-amber-900 mb-1">
                        قيمة المكافأة المستحقة
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={commissionAmount}
                          onChange={(e) => setCommissionAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                          placeholder="0.00"
                          className="w-full pl-12 pr-3 py-2 rounded-xl border border-amber-300 text-xs bg-white font-black text-amber-900"
                        />
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-500">
                          {settings.currency}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-amber-100/70 text-[11px] text-amber-900 flex items-center justify-between">
                    <span>
                      💡 سيتم ترصيد مبلغ <strong className="font-extrabold">{commissionAmount || 0} {settings.currency}</strong> في حساب الموظف كمستحق يصرف مع راتب شهر ({commissionMonth}).
                    </span>
                    <input
                      type="month"
                      value={commissionMonth}
                      onChange={(e) => setCommissionMonth(e.target.value)}
                      className="px-2 py-0.5 rounded-lg border border-amber-300 text-[11px] bg-white font-bold"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Manual Items Table (Optional - Prints above Notes) */}
          <div className="border border-slate-200 rounded-2xl p-3.5 bg-slate-50/50 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Table2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    جدول الأصناف (إدخال يدوي - يظهر فوق الملاحظات عند الطباعة)
                  </span>
                  <span className="text-[10px] text-slate-500">
                    اختياري: أدخل الأصناف يدوياً هنا أو اتركها لتظهر كمساحة جدول فارغة للكتابة بالقلم عند الطباعة
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setManualItems((prev) => [
                    ...prev,
                    { serial: String(prev.length + 1), name: '', quantity: '', unitPrice: '', totalPrice: '' },
                  ])
                }
                className="px-2.5 py-1.5 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-[11px] font-bold flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة صف</span>
              </button>
            </div>

            {manualItems.length > 0 && (
              <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
                <table className="w-full text-right border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                      <th className="p-2 font-bold w-18 text-center">رقم تسلسلي</th>
                      <th className="p-2 font-bold min-w-[140px]">الصنف</th>
                      <th className="p-2 font-bold w-20 text-center">الكمية</th>
                      <th className="p-2 font-bold w-24 text-center">سعر الوحدة</th>
                      <th className="p-2 font-bold w-28 text-center">السعر الإجمالي</th>
                      <th className="p-2 w-9"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {manualItems.map((item, idx) => (
                      <tr key={idx} className="border-b border-slate-100 last:border-b-0">
                        <td className="p-1.5">
                          <input
                            type="text"
                            aria-label={`رقم تسلسلي صف ${idx + 1}`}
                            value={item.serial}
                            onChange={(e) => {
                              const val = e.target.value;
                              setManualItems((prev) =>
                                prev.map((row, i) => (i === idx ? { ...row, serial: val } : row))
                              );
                            }}
                            placeholder={String(idx + 1)}
                            className="w-full px-1.5 py-1.5 rounded-lg border border-slate-200 text-center text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="text"
                            aria-label={`الصنف صف ${idx + 1}`}
                            value={item.name}
                            onChange={(e) => {
                              const val = e.target.value;
                              setManualItems((prev) =>
                                prev.map((row, i) => (i === idx ? { ...row, name: val } : row))
                              );
                            }}
                            placeholder="اسم الصنف أو البيان يدوياً..."
                            className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="text"
                            aria-label={`الكمية صف ${idx + 1}`}
                            value={item.quantity || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setManualItems((prev) =>
                                prev.map((row, i) => {
                                  if (i !== idx) return row;
                                  const autoTotal = computeManualItemTotal(val, row.unitPrice);
                                  return {
                                    ...row,
                                    quantity: val,
                                    totalPrice: autoTotal !== null ? autoTotal : row.totalPrice,
                                  };
                                })
                              );
                            }}
                            placeholder="0"
                            className="w-full px-1.5 py-1.5 rounded-lg border border-slate-200 text-center font-mono text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="text"
                            aria-label={`سعر الوحدة صف ${idx + 1}`}
                            value={item.unitPrice || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setManualItems((prev) =>
                                prev.map((row, i) => {
                                  if (i !== idx) return row;
                                  const autoTotal = computeManualItemTotal(row.quantity, val);
                                  return {
                                    ...row,
                                    unitPrice: val,
                                    totalPrice: autoTotal !== null ? autoTotal : row.totalPrice,
                                  };
                                })
                              );
                            }}
                            placeholder="0.00"
                            className="w-full px-1.5 py-1.5 rounded-lg border border-slate-200 text-center font-mono text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="text"
                            aria-label={`السعر الإجمالي صف ${idx + 1}`}
                            value={item.totalPrice}
                            onChange={(e) => {
                              const val = e.target.value;
                              setManualItems((prev) =>
                                prev.map((row, i) => (i === idx ? { ...row, totalPrice: val } : row))
                              );
                            }}
                            placeholder="0.00"
                            className="w-full px-1.5 py-1.5 rounded-lg border border-slate-200 text-center font-mono text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </td>
                        <td className="p-1.5 text-center">
                          <button
                            type="button"
                            aria-label={`حذف صف ${idx + 1}`}
                            onClick={() =>
                              setManualItems((prev) => prev.filter((_, i) => i !== idx))
                            }
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">ملاحظات الفاتورة الورقية (اختياري)</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: تفاصيل البضاعة المسجلة يدوياً في الدفتر الورقي أو رقم الإرسالية..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
            ></textarea>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
          {!invoiceToEdit ? (
            <button
              type="button"
              onClick={() => handleSubmit(true)}
              className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4 text-emerald-600" />
              <span>حفظ وإدخال فاتورة أخرى فوراً</span>
            </button>
          ) : (
            <div></div>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={() => handleSubmit(false, false)}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{invoiceToEdit ? 'تحديث فقط' : 'حفظ الفاتورة'}</span>
            </button>
            <button
              type="button"
              onClick={() => handleSubmit(false, true)}
              className="px-4.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-emerald-600/30 transition-all active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>حفظ ومعاينة طباعة A4 🖨️</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
