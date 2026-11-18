import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  AlertTriangle,
  Trash2,
  Download,
  Users,
  Building2,
  FileText,
  RotateCcw,
  CheckCircle,
  X,
  ShieldAlert,
  ArrowRight,
  Info,
} from 'lucide-react';

interface ZeroOutSystemModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ZeroOutSystemModal: React.FC<ZeroOutSystemModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    invoices,
    vouchers,
    parties,
    treasuries,
    employees,
    settings,
    currentUser,
    exportDatabase,
    zeroOutSystem,
    addToast,
  } = useApp();

  // Mode: 'keep_names' (recommended) or 'factory_reset'
  const [mode, setMode] = useState<'keep_names' | 'factory_reset'>('keep_names');
  const [confirmationInput, setConfirmationInput] = useState('');
  const [hasDownloadedBackup, setHasDownloadedBackup] = useState(false);
  const [keepCompanyProfile, setKeepCompanyProfile] = useState(true);

  if (!isOpen) return null;

  const totalInvoicesCount = invoices.length;
  const totalVouchersCount = vouchers.length;
  const totalPartiesCount = parties.length;
  const totalEmployeesCount = employees.length;
  const totalTreasuriesCount = treasuries.length;

  const isConfirmed = confirmationInput.trim() === 'تصفير';

  const handleDownloadBackup = () => {
    exportDatabase();
    setHasDownloadedBackup(true);
    addToast('success', 'تم تنزيل النسخة الاحتياطية التأمينية بنجاح');
  };

  const handleExecuteZeroOut = () => {
    if (currentUser.role !== 'admin') {
      addToast('error', 'تصفير المنظومة متاح لمدير النظام فقط');
      return;
    }

    if (!isConfirmed) {
      addToast('error', 'يرجى كتابة كلمة "تصفير" في الحقل المخصص لتأكيد العملية');
      return;
    }

    if (mode === 'keep_names') {
      zeroOutSystem({
        mode: 'zero_balances_keep_names',
      });
      addToast(
        'success',
        'تم تصفير العمليات بنجاح مع الإبقاء على كافة أسماء وسجلات الموظفين، الزبائن، الموردين، والخزائن'
      );
    } else {
      zeroOutSystem({
        mode: 'factory_clean_reset',
      });
      addToast('warning', 'تم إعادة ضبط المنظومة وتصفيرها بالكامل');
    }

    setConfirmationInput('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs no-print">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[94vh] animate-in fade-in zoom-in-95 border border-rose-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-rose-100 flex items-center justify-between bg-gradient-to-r from-rose-50 via-red-50/50 to-orange-50">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-lg shadow-rose-600/30 shrink-0">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                  تصفير المنظومة والبدء من جديد
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
                  إجراء حساس
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                إفراغ الحركات المالية القديمة والبدء بدفاتر حسابية جديدة ونظيفة
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 text-slate-700 text-xs">
          {/* Current System Statistics Banner */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <div className="text-[11px] font-bold text-slate-500 mb-2.5 flex items-center justify-between">
              <span>البيانات والعمليات المسجلة حالياً في المنظومة:</span>
              <span className="text-slate-400 text-[10px]">تحديث لحظي</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
              <div className="bg-white p-2 rounded-xl border border-slate-200">
                <div className="text-base font-black text-slate-900">{totalInvoicesCount}</div>
                <div className="text-[10px] text-slate-500">فاتورة مسجلة</div>
              </div>
              <div className="bg-white p-2 rounded-xl border border-slate-200">
                <div className="text-base font-black text-slate-900">{totalVouchersCount}</div>
                <div className="text-[10px] text-slate-500">سند قبض وصرف</div>
              </div>
              <div className="bg-white p-2 rounded-xl border border-emerald-200 bg-emerald-50/30">
                <div className="text-base font-black text-emerald-800">{totalPartiesCount}</div>
                <div className="text-[10px] text-emerald-700 font-bold">زبون ومورد</div>
              </div>
              <div className="bg-white p-2 rounded-xl border border-blue-200 bg-blue-50/30">
                <div className="text-base font-black text-blue-800">{totalEmployeesCount}</div>
                <div className="text-[10px] text-blue-700 font-bold">موظف مسجل</div>
              </div>
              <div className="bg-white p-2 rounded-xl border border-amber-200 bg-amber-50/30">
                <div className="text-base font-black text-amber-800">{totalTreasuriesCount}</div>
                <div className="text-[10px] text-amber-700 font-bold">خزينة وحساب</div>
              </div>
            </div>
          </div>

          {/* Mode Selector */}
          <div className="space-y-2.5">
            <label className="font-extrabold text-slate-900 text-xs block">
              اختر نوع وطريقة التصفير المطلوبة:
            </label>

            {/* Option A: Keep Directory Names (Recommended) */}
            <div
              onClick={() => setMode('keep_names')}
              className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
                mode === 'keep_names'
                  ? 'border-emerald-600 bg-emerald-50/50 shadow-sm ring-1 ring-emerald-600'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-5 h-5 rounded-full mt-0.5 flex items-center justify-center shrink-0 border ${
                    mode === 'keep_names'
                      ? 'border-emerald-600 bg-emerald-600 text-white'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {mode === 'keep_names' && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-xs text-slate-900">
                      تصفير الحركات مع الإبقاء على الأسماء (الموصى به)
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                      موصى به
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    حذف جميع الفواتير، السندات، الحركات، والتحويلات القديمة. وفي نفس الوقت{' '}
                    <strong className="text-emerald-800 font-bold">
                      يتم الاحتفاظ بأسماء الموظفين والزبائن والموردين والخزائن وبيانات الشركة
                    </strong>{' '}
                    مع تصفير أرصدتها المالية للبدء فوراً دون إعادة إدخال الأسماء ودليل الحسابات.
                  </p>
                </div>
              </div>
            </div>

            {/* Option B: Complete Factory Reset */}
            <div
              onClick={() => setMode('factory_reset')}
              className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
                mode === 'factory_reset'
                  ? 'border-rose-600 bg-rose-50/50 shadow-sm ring-1 ring-rose-600'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-5 h-5 rounded-full mt-0.5 flex items-center justify-center shrink-0 border ${
                    mode === 'factory_reset'
                      ? 'border-rose-600 bg-rose-600 text-white'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {mode === 'factory_reset' && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-xs text-slate-900">
                      تصفير شامل بالكامل (إعادة المنظومة كأنها جديدة تماماً)
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black">
                      مسح كامل
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    مسح كافة البيانات من جذورها (الفواتير، السندات، الزبائن، الموردين، الموظفين،
                    والخزائن) وإرجاع النظام إلى نقطة البداية الصفرية المطلقة.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Backup Protection Step */}
          <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                <span>الخطوة 1: تنزيل نسخة احتياطية تأمينية قبل التصفير</span>
              </div>
              {hasDownloadedBackup && (
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  <CheckCircle className="w-3.5 h-3.5" />
                  تم التنزيل
                </span>
              )}
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              ننصح بشدة بتنزيل نسخة احتياطية كاملة بصيغة JSON حتى تتمكن من استرجاع أي بيانات لاحقاً إذا
              احتجت إلى مراجعتها.
            </p>
            <button
              type="button"
              onClick={handleDownloadBackup}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>تنزيل نسخة احتياطية تأمينية للبيانات الحالية (JSON)</span>
            </button>
          </div>

          {/* Confirmation Input Step */}
          <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-4 space-y-3">
            <label className="block text-xs font-bold text-slate-900 leading-relaxed">
              الخطوة 2: اكتب كلمة <span className="text-rose-700 font-black font-mono">تصفير</span>{' '}
              في المربع أدناه لتأكيد الإجراء:
            </label>
            <input
              type="text"
              value={confirmationInput}
              onChange={(e) => setConfirmationInput(e.target.value)}
              placeholder="اكتب كلمة تصفير هنا"
              className="w-full px-3.5 py-2.5 rounded-xl border border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white font-bold text-rose-800 text-center text-sm"
            />
            {confirmationInput && !isConfirmed && (
              <p className="text-[11px] text-rose-600 font-semibold">
                يرجى كتابة كلمة "تصفير" تحديداً (بدون مسافات إضافية)
              </p>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            إلغاء التراجع
          </button>

          <button
            type="button"
            disabled={!isConfirmed}
            onClick={handleExecuteZeroOut}
            className={`px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
              isConfirmed
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/30 active:scale-95'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-70'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            <span>
              {mode === 'keep_names'
                ? 'تأكيد تصفير العمليات (مع بقاء الأسماء والخزائن)'
                : 'تأكيد التصفير الشامل وإعادة ضبط المصنع'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
