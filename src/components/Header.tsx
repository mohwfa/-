import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  PlusCircle,
  FileText,
  UserCheck,
  Shield,
  Download,
  Upload,
  RefreshCw,
  Settings,
  ChevronDown,
  Building,
  Lock,
  HelpCircle,
  ChevronLeft,
  Sliders,
  Database,
  Printer,
  Calendar,
  AlertTriangle,
  FileSpreadsheet,
} from 'lucide-react';

interface HeaderProps {
  onOpenNewInvoice: () => void;
  onOpenNewVoucher: () => void;
  onNavigateToEmployees?: () => void;
  onNavigateToUsers: () => void;
  onOpenCompanySettings: (tab?: 'general' | 'print' | 'admin' | 'fiscal') => void;
  onOpenAbout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNewInvoice,
  onOpenNewVoucher,
  onNavigateToUsers,
  onOpenCompanySettings,
  onOpenAbout,
}) => {
  const {
    settings,
    currentUser,
    users,
    setCurrentUser,
    exportDatabase,
    importDatabase,
    resetToDemoData,
    lockSystem,
    fiscalYears,
    addToast,
  } = useApp();

  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
  const settingsMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(e.target as Node)) {
        setSettingsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          importDatabase(content);
        }
      };
      reader.readAsText(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setSettingsMenuOpen(false);
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        {/* Left: Company Branding */}
        <div className="flex items-center gap-3">
          {settings.logoUrl ? (
            <div className="w-11 h-11 rounded-xl border border-slate-200 bg-white flex items-center justify-center p-1 shadow-xs shrink-0">
              <img
                src={settings.logoUrl}
                alt={settings.companyName}
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-800 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 shrink-0">
              <Building className="w-6 h-6 text-white" />
            </div>
          )}

          <div>
            <h1 className="font-extrabold text-slate-900 text-base sm:text-lg tracking-tight leading-tight">
              {settings.companyName}
            </h1>
            {settings.headerNote && (
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block mt-0.5">
                {settings.headerNote}
              </p>
            )}
          </div>
        </div>

        {/* Right: Actions & Unified Settings Button */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* About System Button */}
          <button
            onClick={onOpenAbout}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 transition-all shadow-2xs active:scale-95 cursor-pointer"
            title="حول المنظومة: كيف يعمل النظام وما المهام التي يمكن إنجازها من خلاله"
          >
            <HelpCircle className="w-4 h-4 text-emerald-600" />
            <span>حول</span>
          </button>

          {/* Quick Invoice Button */}
          {currentUser.permissions.canManageInvoices && (
            <button
              onClick={onOpenNewInvoice}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-sm shadow-emerald-600/30 active:scale-95 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>فاتورة جديدة</span>
            </button>
          )}

          {/* Quick Voucher Button */}
          {currentUser.permissions.canManageVouchers && (
            <button
              onClick={onOpenNewVoucher}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition-all active:scale-95 cursor-pointer"
            >
              <FileText className="w-4 h-4 text-slate-500" />
              <span>سند قبض / صرف</span>
            </button>
          )}

          {/* Unified Settings Button (Merges Company Settings & Administration) */}
          <div className="relative" ref={settingsMenuRef}>
            <button
              onClick={() => setSettingsMenuOpen(!settingsMenuOpen)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all shadow-2xs active:scale-95 cursor-pointer font-bold text-xs sm:text-sm ${
                settingsMenuOpen
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
              }`}
              title="الإعدادات: ضبط بيانات الشركة والإدارة"
            >
              <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Settings className="w-3.5 h-3.5 text-emerald-700" />
              </div>
              <div className="text-right flex items-center gap-1.5">
                <span>الإعدادات</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                    settingsMenuOpen ? 'rotate-180 text-emerald-600' : ''
                  }`}
                />
              </div>
            </button>

            {settingsMenuOpen && (
              <div className="absolute left-0 mt-2 w-80 sm:w-88 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 z-50 animate-in fade-in zoom-in-95 max-h-[85vh] overflow-y-auto">
                {/* Dropdown Header */}
                <div className="px-2 py-1.5 border-b border-slate-100 mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-emerald-600" />
                    <span className="font-extrabold text-slate-900 text-xs">لوحة الإعدادات والإدارة</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    تحكم مركزي
                  </span>
                </div>

                {/* Section 1: ضبط بيانات الشركة والطباعة */}
                <div className="mb-3 space-y-1.5">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 flex items-center gap-1.5">
                    <Building className="w-3 h-3 text-emerald-600" />
                    <span>ضبط بيانات الشركة والطباعة</span>
                  </div>

                  <button
                    onClick={() => {
                      onOpenCompanySettings('general');
                      setSettingsMenuOpen(false);
                    }}
                    className="w-full text-right p-2.5 rounded-xl bg-gradient-to-l from-emerald-50 to-teal-50/50 border border-emerald-200 hover:border-emerald-400 hover:shadow-xs transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Building className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-black text-slate-900 group-hover:text-emerald-900">
                          بيانات الشركة وشعار الحساب
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          تعديل الاسم، الهاتف، العنوان، السجل، والشعار
                        </div>
                      </div>
                    </div>
                    <ChevronLeft className="w-4 h-4 text-emerald-600 group-hover:-translate-x-0.5 transition-transform shrink-0" />
                  </button>

                  <button
                    onClick={() => {
                      onOpenCompanySettings('print');
                      setSettingsMenuOpen(false);
                    }}
                    className="w-full text-right p-2 rounded-xl bg-slate-50 hover:bg-emerald-50/70 border border-slate-200 hover:border-emerald-300 transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-slate-200 group-hover:bg-emerald-200 text-slate-700 group-hover:text-emerald-800 flex items-center justify-center shrink-0">
                        <Printer className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-900">
                          تنسيق مستندات الطباعة يدوياً
                        </div>
                        <div className="text-[10px] text-slate-500">
                          حجم الشعار، مقاسات A4/A5، الخطوط، والتوقيعات
                        </div>
                      </div>
                    </div>
                    <ChevronLeft className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 group-hover:-translate-x-0.5 transition-transform shrink-0" />
                  </button>
                </div>

                <div className="h-px bg-slate-100 my-2"></div>

                {/* Section 2: الإدارة والمستخدمين والصلاحيات */}
                <div className="mb-3">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1.5 flex items-center gap-1.5">
                    <Shield className="w-3 h-3 text-indigo-600" />
                    <span>الإدارة والمستخدمين</span>
                  </div>

                  {/* Current Active User Card */}
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-800 font-bold text-xs flex items-center justify-center">
                        {currentUser.fullName.charAt(0)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">{currentUser.fullName}</div>
                        <div className="text-[10px] text-slate-500">
                          {currentUser.role === 'admin' && 'مدير النظام (كامل الصلاحيات)'}
                          {currentUser.role === 'accountant' && 'محاسب مالي'}
                          {currentUser.role === 'cashier' && 'كاشير / مدخل فواتير'}
                          {currentUser.role === 'viewer' && 'مشاهد فقط'}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      نشط حالياً
                    </span>
                  </div>

                  {/* Switch User List */}
                  <div className="space-y-1 mb-2">
                    <div className="text-[10px] font-bold text-slate-400 px-2">تبديل المستخدم (لاختبار الصلاحيات):</div>
                    {users.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => {
                          setCurrentUser(u);
                          setSettingsMenuOpen(false);
                          addToast('info', `تم التبديل إلى المستخدم: ${u.fullName}`);
                        }}
                        className={`w-full text-right px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                          currentUser.id === u.id
                            ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-md bg-slate-100 flex items-center justify-center text-slate-600 text-[10px] font-bold">
                            {u.fullName.charAt(0)}
                          </div>
                          <span className="text-[11px]">{u.fullName}</span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            ({u.role === 'admin' ? 'مدير' : u.role === 'accountant' ? 'محاسب' : 'كاشير'})
                          </span>
                        </div>
                        {currentUser.id === u.id && <UserCheck className="w-3.5 h-3.5 text-emerald-600" />}
                      </button>
                    ))}
                  </div>

                  {/* Direct Link to Manage Users Screen */}
                  <button
                    onClick={() => {
                      setSettingsMenuOpen(false);
                      onNavigateToUsers();
                    }}
                    className="w-full text-right px-2.5 py-2 rounded-xl text-xs font-semibold text-teal-800 hover:bg-teal-50 border border-teal-100 flex items-center justify-between transition-colors cursor-pointer mb-1.5"
                  >
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-teal-600" />
                      <span>إدارة المستخدمين والأدوار الدقيقة</span>
                    </div>
                    <ChevronLeft className="w-3.5 h-3.5 text-teal-500" />
                  </button>

                  {/* Quick Lock Button */}
                  <button
                    onClick={() => {
                      setSettingsMenuOpen(false);
                      lockSystem();
                    }}
                    className="w-full text-right px-2.5 py-2 rounded-xl text-xs font-semibold text-rose-700 hover:bg-rose-50 border border-rose-100 flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-rose-600" />
                      <span>قفل النظام بكلمة المرور 🔒</span>
                    </div>
                    <span className="text-[10px] text-rose-500">فوري</span>
                  </button>
                </div>

                <div className="h-px bg-slate-100 my-2"></div>

                {/* Section 3: السنوات المالية والتصفير */}
                <div className="mb-3">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-amber-600" />
                      <span>إقفال السنة والتصفير</span>
                    </span>
                    <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                      حفظ الأسماء
                    </span>
                  </div>

                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        setSettingsMenuOpen(false);
                        onOpenCompanySettings('fiscal');
                      }}
                      className="w-full text-right p-2 rounded-xl bg-amber-50/60 hover:bg-amber-100/70 border border-amber-200 transition-all flex items-center justify-between group cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
                          <Calendar className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-amber-950">إقفال السنة المالية وفتح سنة جديدة</div>
                          <div className="text-[10px] text-amber-800">ترحيل الأرصدة وبقاء كافة أسماء الحسابات</div>
                        </div>
                      </div>
                      <ChevronLeft className="w-3.5 h-3.5 text-amber-600 group-hover:-translate-x-0.5 transition-transform shrink-0" />
                    </button>

                    <button
                      onClick={() => {
                        setSettingsMenuOpen(false);
                        onOpenCompanySettings('fiscal');
                      }}
                      className="w-full text-right px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
                        <span>أرشيف السنوات المغلقة</span>
                      </div>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                        {fiscalYears.length}
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        setSettingsMenuOpen(false);
                        onOpenCompanySettings('fiscal');
                      }}
                      className="w-full text-right px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-700 hover:bg-rose-50 flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        <span>تصفير المنظومة والبدء من جديد</span>
                      </div>
                      <span className="text-[10px] text-rose-500">خيارات آمنة</span>
                    </button>
                  </div>
                </div>

                <div className="h-px bg-slate-100 my-2"></div>

                {/* Section 4: النسخ الاحتياطي وإدارة البيانات */}
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1.5 flex items-center gap-1.5">
                    <Database className="w-3 h-3 text-slate-500" />
                    <span>النسخ الاحتياطي والبيانات</span>
                  </div>

                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        exportDatabase();
                        setSettingsMenuOpen(false);
                      }}
                      className="w-full text-right px-2.5 py-1.5 rounded-lg font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 text-xs cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-600" />
                      <span>تصدير نسخة احتياطية (JSON)</span>
                    </button>

                    <button
                      onClick={() => {
                        fileInputRef.current?.click();
                      }}
                      className="w-full text-right px-2.5 py-1.5 rounded-lg font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 text-xs cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-blue-600" />
                      <span>استيراد نسخة سابقة</span>
                    </button>

                    <button
                      onClick={() => {
                        if (confirm('هل أنت متأكد من إعادة ضبط البيانات إلى الحالة التجريبية الافتراضية؟')) {
                          resetToDemoData();
                        }
                        setSettingsMenuOpen(false);
                      }}
                      className="w-full text-right px-2.5 py-1.5 rounded-lg font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2 text-xs cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>إعادة ضبط البيانات التجريبية</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".json"
              className="hidden"
            />
          </div>
        </div>
      </div>

    </header>
  );
};
