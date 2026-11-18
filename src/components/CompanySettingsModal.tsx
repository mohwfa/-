import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  Building,
  Upload,
  Trash2,
  CheckCircle,
  X,
  FileText,
  Phone,
  MapPin,
  Mail,
  ShieldCheck,
  Image as ImageIcon,
  HelpCircle,
  Printer,
  Sliders,
  Check,
  Eye,
  Type,
  FileSpreadsheet,
  Shield,
  Users,
  UserCheck,
  Lock,
  Download,
  RefreshCw,
  ChevronLeft,
  Database,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { PrintLogoSize, PrintFontSize, PrintVoucherPaperSize } from '../types';
import { CloseFiscalYearModal } from './Settings/CloseFiscalYearModal';
import { ZeroOutSystemModal } from './Settings/ZeroOutSystemModal';
import { FiscalYearsArchiveModal } from './Settings/FiscalYearsArchiveModal';

interface CompanySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToUsers?: () => void;
  initialTab?: 'general' | 'print' | 'admin' | 'fiscal';
}

export const CompanySettingsModal: React.FC<CompanySettingsModalProps> = ({
  isOpen,
  onClose,
  onNavigateToUsers,
  initialTab,
}) => {
  const {
    settings,
    updateSettings,
    currentUser,
    users,
    setCurrentUser,
    lockSystem,
    exportDatabase,
    importDatabase,
    resetToDemoData,
    fiscalYears,
    addToast,
  } = useApp();

  // Active Tab: 'print' | 'general' | 'admin' | 'fiscal'
  const [activeTab, setActiveTab] = useState<'general' | 'print' | 'admin' | 'fiscal'>(
    initialTab || 'print'
  );

  // Submodals
  const [showCloseYearModal, setShowCloseYearModal] = useState(false);
  const [showZeroOutModal, setShowZeroOutModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);

  React.useEffect(() => {
    if (initialTab && isOpen) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  // General Settings State
  const [companyName, setCompanyName] = useState(settings.companyName || '');
  const [phone, setPhone] = useState(settings.phone || '');
  const [address, setAddress] = useState(settings.address || '');
  const [currency, setCurrency] = useState(settings.currency || 'د.ل');
  const [headerNote, setHeaderNote] = useState(settings.headerNote || '');
  const [commercialRegister, setCommercialRegister] = useState(settings.commercialRegister || '');
  const [taxNumber, setTaxNumber] = useState(settings.taxNumber || '');
  const [email, setEmail] = useState(settings.email || '');
  const [invoiceFooterTerms, setInvoiceFooterTerms] = useState(
    settings.invoiceFooterTerms ||
      'البضاعة المباعة لا ترد ولا تستبدل بعد 3 أيام • تعتبر هذه الفاتورة سنداً ملزماً للطرفين'
  );
  const [logoUrl, setLogoUrl] = useState<string | undefined>(settings.logoUrl);
  const [debtGracePeriodDays, setDebtGracePeriodDays] = useState<number>(
    settings.debtGracePeriodDays || 30
  );

  // Manual Print Formatting Customization State
  const [printLogoSize, setPrintLogoSize] = useState<PrintLogoSize>(
    settings.printLogoSize || 'sm'
  );
  const [showLogoInPrint, setShowLogoInPrint] = useState<boolean>(
    settings.showLogoInPrint !== false
  );
  const [printFontSize, setPrintFontSize] = useState<PrintFontSize>(
    settings.printFontSize || 'normal'
  );
  const [showTaxAndCRInPrint, setShowTaxAndCRInPrint] = useState<boolean>(
    settings.showTaxAndCRInPrint !== false
  );
  const [showAddressPhoneInPrint, setShowAddressPhoneInPrint] = useState<boolean>(
    settings.showAddressPhoneInPrint !== false
  );
  const [showEmailInPrint, setShowEmailInPrint] = useState<boolean>(
    settings.showEmailInPrint !== false
  );
  const [recipientSignatureLabel, setRecipientSignatureLabel] = useState<string>(
    settings.recipientSignatureLabel || 'توقيع المستلم / العميل'
  );
  const [auditorSignatureLabel, setAuditorSignatureLabel] = useState<string>(
    settings.auditorSignatureLabel || 'المحاسب المسؤول / الإدارة'
  );
  const [printVoucherSize, setPrintVoucherSize] = useState<PrintVoucherPaperSize>(
    settings.printVoucherSize || 'A5_landscape'
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addToast('error', 'يرجى اختيار ملف صورة صالح (PNG, JPG, SVG, WebP)');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      addToast('warning', 'حجم الصورة كبير نسبياً (يفضل أقل من 3 ميجابايت لسرعة التحميل)');
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setLogoUrl(result);
        setShowLogoInPrint(true);
        if (printLogoSize === 'hidden') setPrintLogoSize('sm');
        addToast('success', 'تم تحميل الشعار بنجاح، يمكنك الآن ضبط حجمه أدناه');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoUrl(undefined);
    if (fileInputRef.current) fileInputRef.current.value = '';
    addToast('info', 'تمت إزالة الشعار');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      addToast('error', 'يرجى إدخال اسم المنشأة أو الشركة');
      return;
    }

    updateSettings({
      companyName: companyName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      currency: currency.trim() || 'د.ل',
      headerNote: headerNote.trim(),
      commercialRegister: commercialRegister.trim(),
      taxNumber: taxNumber.trim(),
      email: email.trim(),
      invoiceFooterTerms: invoiceFooterTerms.trim(),
      logoUrl: logoUrl || undefined,
      debtGracePeriodDays: Math.max(1, Number(debtGracePeriodDays) || 30),

      // Manual Print Formatting Customizations
      printLogoSize,
      showLogoInPrint: showLogoInPrint && printLogoSize !== 'hidden',
      printFontSize,
      showTaxAndCRInPrint,
      showAddressPhoneInPrint,
      showEmailInPrint,
      recipientSignatureLabel: recipientSignatureLabel.trim() || 'توقيع المستلم / العميل',
      auditorSignatureLabel: auditorSignatureLabel.trim() || 'المحاسب المسؤول / الإدارة',
      printVoucherSize,
    });

    addToast('success', 'تم حفظ إعدادات الشركة وتنسيقات الطباعة بنجاح');
    onClose();
  };

  // Preview logo dimensions
  const getPreviewLogoClass = () => {
    if (printLogoSize === 'hidden' || !showLogoInPrint) return 'hidden';
    if (printLogoSize === 'xs') return 'w-8 h-8 max-h-8 max-w-12';
    if (printLogoSize === 'sm') return 'w-10 h-10 max-h-10 max-w-16';
    if (printLogoSize === 'md') return 'w-13 h-13 max-h-13 max-w-22';
    if (printLogoSize === 'lg') return 'w-16 h-16 max-h-16 max-w-28';
    return 'w-10 h-10 max-h-10 max-w-16';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs no-print">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[94vh] animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                إعدادات المنشأة وتنسيق مستندات الطباعة
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                تعديل بيانات الشركة والشعار والتحكم الكامل في أحجام وتنسيقات ورقة الطباعة
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

        {/* Navigation Tabs */}
        <div className="flex items-center border-b border-slate-200 bg-slate-100/60 px-4 pt-2 gap-2 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('print')}
            className={`px-4 py-2.5 rounded-t-xl flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'print'
                ? 'bg-white text-emerald-700 border-t-2 border-emerald-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Printer className="w-4 h-4 text-emerald-600" />
            <span>تنسيق مستندات الطباعة يدوياً</span>
            <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px]">
              جديد
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`px-4 py-2.5 rounded-t-xl flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'general'
                ? 'bg-white text-slate-900 border-t-2 border-slate-800 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building className="w-4 h-4 text-slate-500" />
            <span>بيانات الشركة وشعار الحساب</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('admin')}
            className={`px-4 py-2.5 rounded-t-xl flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'admin'
                ? 'bg-white text-indigo-750 border-t-2 border-indigo-600 shadow-2xs text-indigo-700'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="w-4 h-4 text-indigo-600" />
            <span>الإدارة والمستخدمين والصلاحيات</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('fiscal')}
            className={`px-4 py-2.5 rounded-t-xl flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'fiscal'
                ? 'bg-white text-amber-900 border-t-2 border-amber-500 shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4 text-amber-600" />
            <span>إقفال السنة والتصفير</span>
            {fiscalYears.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px]">
                {fiscalYears.length} مؤرشفة
              </span>
            )}
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-700">
          {/* ========================================================================= */}
          {/* TAB 1: MANUAL PRINT FORMATTING CUSTOMIZATION (تنسيق مستندات الطباعة)        */}
          {/* ========================================================================= */}
          {activeTab === 'print' && (
            <div className="space-y-6">
              {/* Section 1: Logo Size & Presence */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-emerald-600" />
                    <span>حجم ومظهر شعار الشركة في الطباعة (Logo Size)</span>
                  </label>
                  <span className="text-[11px] text-slate-500">اختر المقاس المناسب لورقة الطباعة</span>
                </div>

                {/* Radio Presets for Logo Size */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setPrintLogoSize('xs');
                      setShowLogoInPrint(true);
                    }}
                    className={`p-2.5 rounded-xl border-2 text-right transition-all cursor-pointer ${
                      printLogoSize === 'xs' && showLogoInPrint
                        ? 'border-emerald-600 bg-emerald-50/50 text-emerald-950 font-bold'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-xs">صغير جداً</span>
                      {printLogoSize === 'xs' && showLogoInPrint && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    </div>
                    <span className="text-[10px] text-slate-500 block">32 بكسل (أقصى توفير للمساحة)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPrintLogoSize('sm');
                      setShowLogoInPrint(true);
                    }}
                    className={`p-2.5 rounded-xl border-2 text-right transition-all cursor-pointer ${
                      printLogoSize === 'sm' && showLogoInPrint
                        ? 'border-emerald-600 bg-emerald-50/50 text-emerald-950 font-bold'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-xs">صغير (افتراضي)</span>
                      {printLogoSize === 'sm' && showLogoInPrint && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    </div>
                    <span className="text-[10px] text-emerald-700 font-bold block">40 بكسل (الموصى به)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPrintLogoSize('md');
                      setShowLogoInPrint(true);
                    }}
                    className={`p-2.5 rounded-xl border-2 text-right transition-all cursor-pointer ${
                      printLogoSize === 'md' && showLogoInPrint
                        ? 'border-emerald-600 bg-emerald-50/50 text-emerald-950 font-bold'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-xs">متوسط</span>
                      {printLogoSize === 'md' && showLogoInPrint && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    </div>
                    <span className="text-[10px] text-slate-500 block">52 بكسل (متوازن)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPrintLogoSize('lg');
                      setShowLogoInPrint(true);
                    }}
                    className={`p-2.5 rounded-xl border-2 text-right transition-all cursor-pointer ${
                      printLogoSize === 'lg' && showLogoInPrint
                        ? 'border-emerald-600 bg-emerald-50/50 text-emerald-950 font-bold'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-xs">كبير وبارز</span>
                      {printLogoSize === 'lg' && showLogoInPrint && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    </div>
                    <span className="text-[10px] text-slate-500 block">68 بكسل (شعارات عريضة)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPrintLogoSize('hidden');
                      setShowLogoInPrint(false);
                    }}
                    className={`p-2.5 rounded-xl border-2 text-right transition-all cursor-pointer col-span-2 sm:col-span-1 ${
                      !showLogoInPrint || printLogoSize === 'hidden'
                        ? 'border-rose-600 bg-rose-50/50 text-rose-950 font-bold'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-xs text-rose-700">إخفاء الشعار</span>
                      {(!showLogoInPrint || printLogoSize === 'hidden') && (
                        <Check className="w-3.5 h-3.5 text-rose-600" />
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 block">طباعة نصوص الترويسة فقط</span>
                  </button>
                </div>

                {/* Interactive Live Print Header Preview Box */}
                <div className="mt-3 p-3 bg-white rounded-xl border border-slate-300">
                  <div className="text-[10px] font-bold text-slate-400 mb-2 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-slate-400" />
                    <span>معاينة حية لشكل ترويسة الفاتورة المطبوعة بالمقاس المحدد:</span>
                  </div>

                  <div className="p-3 bg-slate-50/70 border border-slate-200 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {showLogoInPrint && printLogoSize !== 'hidden' && (
                        <>
                          {logoUrl ? (
                            <div
                              className={`${getPreviewLogoClass()} rounded-md overflow-hidden bg-white border border-slate-300 p-0.5 flex items-center justify-center shrink-0 shadow-2xs`}
                            >
                              <img src={logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
                            </div>
                          ) : (
                            <div
                              className={`${getPreviewLogoClass()} rounded-md bg-slate-900 text-white flex items-center justify-center shrink-0`}
                            >
                              <Building className="w-4 h-4 text-emerald-400" />
                            </div>
                          )}
                        </>
                      )}

                      <div>
                        <div className="font-black text-slate-950 text-sm sm:text-base leading-tight">
                          {companyName || 'اسم شركتك أو مؤسستك الرسمية'}
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5 font-mono">
                          {showAddressPhoneInPrint && <span>هاتف: {phone || '091XXXXXXX'}</span>}
                          {showTaxAndCRInPrint && <span>• س.ت: {commercialRegister || 'CR-XXXXX'}</span>}
                        </div>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold text-slate-400 px-2 py-1 bg-white border border-slate-200 rounded">
                      نموذج الترويسة
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 2: Print Typography Size */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <label className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <Type className="w-4 h-4 text-emerald-600" />
                  <span>حجم خط ونصوص الجداول في الطباعة (Print Font Size)</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setPrintFontSize('compact')}
                    className={`p-3 rounded-xl border-2 text-right transition-all cursor-pointer ${
                      printFontSize === 'compact'
                        ? 'border-emerald-600 bg-emerald-50/50 text-emerald-950 font-bold'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <span className="font-extrabold block text-xs mb-0.5">خط مضغوط وموفر (Compact)</span>
                    <span className="text-[11px] text-slate-500 block">
                      حجم 11 بكسل - مثالي للفواتير ذات البنود الكثيرة وكشوف الحساب الممتلئة.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPrintFontSize('normal')}
                    className={`p-3 rounded-xl border-2 text-right transition-all cursor-pointer ${
                      printFontSize === 'normal'
                        ? 'border-emerald-600 bg-emerald-50/50 text-emerald-950 font-bold'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <span className="font-extrabold block text-xs mb-0.5">خط قياسي متوازن (Standard)</span>
                    <span className="text-[11px] text-slate-500 block">
                      حجم 12 بكسل - الحجم الافتراضي المتناسق لجميع أنواع المستندات.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPrintFontSize('comfortable')}
                    className={`p-3 rounded-xl border-2 text-right transition-all cursor-pointer ${
                      printFontSize === 'comfortable'
                        ? 'border-emerald-600 bg-emerald-50/50 text-emerald-950 font-bold'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <span className="font-extrabold block text-xs mb-0.5">خط واضح ومريح (Comfortable)</span>
                    <span className="text-[11px] text-slate-500 block">
                      حجم 13 بكسل - قراءة سهلة وواضحة جداً للأرقام والمبالغ المالية.
                    </span>
                  </button>
                </div>
              </div>

              {/* Section 3: Voucher Print Paper Size Option */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <label className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>مقاس طباعة سندات القبض والصرف (Vouchers Paper Size)</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <button
                    type="button"
                    onClick={() => setPrintVoucherSize('A5_landscape')}
                    className={`p-3.5 rounded-xl border-2 text-right transition-all cursor-pointer ${
                      printVoucherSize === 'A5_landscape'
                        ? 'border-emerald-600 bg-emerald-50/50 text-emerald-950 font-bold'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-black text-xs">مقاس A5 أفقي (210×148 مم)</span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                        موصى به
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      نصف ورقة A4 بالعرض، مدمجة ومثالية لسندات وإيصالات القبض والصرف المالي السريعة.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPrintVoucherSize('A4_portrait')}
                    className={`p-3.5 rounded-xl border-2 text-right transition-all cursor-pointer ${
                      printVoucherSize === 'A4_portrait'
                        ? 'border-emerald-600 bg-emerald-50/50 text-emerald-950 font-bold'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <span className="font-black block text-xs mb-1">مقاس A4 رأسي (210×297 مم)</span>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      طباعة السند على ورقة A4 كاملة رأسياً مثل الفواتير والتقارير.
                    </p>
                  </button>
                </div>
              </div>

              {/* Section 4: Header Information Visibility Toggles */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <label className="text-xs font-bold text-slate-900 block">
                  عناصر الترويسة المطبوعة (Header Info Controls):
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <label className="flex items-center gap-2.5 p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showTaxAndCRInPrint}
                      onChange={(e) => setShowTaxAndCRInPrint(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300"
                    />
                    <span className="font-bold text-slate-800">إظهار السجل التجاري والضريبي</span>
                  </label>

                  <label className="flex items-center gap-2.5 p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showAddressPhoneInPrint}
                      onChange={(e) => setShowAddressPhoneInPrint(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300"
                    />
                    <span className="font-bold text-slate-800">إظهار العنوان ورقم الهاتف</span>
                  </label>

                  <label className="flex items-center gap-2.5 p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showEmailInPrint}
                      onChange={(e) => setShowEmailInPrint(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300"
                    />
                    <span className="font-bold text-slate-800">إظهار البريد الإلكتروني</span>
                  </label>
                </div>
              </div>

              {/* Section 5: Signature Custom Labels */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <label className="text-xs font-bold text-slate-900 block">
                  تخصيص مسميات خانات التوقيع في أسفل الورقة (Signatures):
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-600 mb-1 text-[11px] font-bold">
                      مسمى خانة الطرف الأول (المستلم):
                    </label>
                    <input
                      type="text"
                      value={recipientSignatureLabel}
                      onChange={(e) => setRecipientSignatureLabel(e.target.value)}
                      placeholder="توقيع المستلم / العميل"
                      className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-xs font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1 text-[11px] font-bold">
                      مسمى خانة الطرف الثاني (المحاسب / الإدارة):
                    </label>
                    <input
                      type="text"
                      value={auditorSignatureLabel}
                      onChange={(e) => setAuditorSignatureLabel(e.target.value)}
                      placeholder="المحاسب المسؤول / الإدارة"
                      className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-xs font-bold text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Section 6: Footer Terms */}
              <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200/80">
                <label className="block text-xs font-bold text-amber-950 mb-1.5 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-amber-700" />
                  <span>شروط وملاحظات أسفل الفاتورة والطباعة (Footer Terms)</span>
                </label>
                <textarea
                  rows={2}
                  value={invoiceFooterTerms}
                  onChange={(e) => setInvoiceFooterTerms(e.target.value)}
                  placeholder="مثال: البضاعة المباعة لا ترد ولا تستبدل بعد 3 أيام • تعتبر هذه الفاتورة سنداً ملزماً للطرفين • شكراً لتعاملكم معنا"
                  className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs leading-relaxed"
                ></textarea>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: GENERAL COMPANY DATA & LOGO UPLOAD (بيانات الشركة والشعار)            */}
          {/* ========================================================================= */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              {/* Logo Upload Section */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <label className="block text-xs font-bold text-slate-900 mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-emerald-600" />
                    <span>شعار الشركة الرسمي (Logo)</span>
                  </span>
                  <span className="text-[11px] font-normal text-slate-500">
                    يمكن تصغير حجمه أو تخصيصه من تبويب "تنسيق الطباعة"
                  </span>
                </label>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Logo Preview Frame */}
                  <div className="w-28 h-20 rounded-xl border-2 border-dashed border-slate-300 bg-white flex items-center justify-center overflow-hidden shrink-0 relative group shadow-2xs">
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt="Company Logo Preview"
                        className="w-full h-full object-contain p-2"
                      />
                    ) : (
                      <div className="text-center p-2">
                        <Building className="w-6 h-6 text-slate-300 mx-auto" />
                        <span className="text-[10px] text-slate-400 block mt-1">لا يوجد شعار</span>
                      </div>
                    )}
                  </div>

                  {/* Upload Controls */}
                  <div className="flex-1 space-y-2 text-right w-full sm:w-auto">
                    <div className="flex items-center gap-2 flex-wrap">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        accept="image/png, image/jpeg, image/jpg, image/svg+xml, image/webp"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>رفع صورة للشعار</span>
                      </button>

                      {logoUrl && (
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>حذف الشعار</span>
                        </button>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      الصيغ المدعومة: PNG, JPG, WebP, SVG. يتم حفظ الشعار تلقائياً في المتصفح.
                    </p>
                  </div>
                </div>
              </div>

              {/* Company Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-900 mb-1.5 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-slate-500" />
                    <span>اسم الشركة / المؤسسة / المحل <span className="text-rose-500">*</span></span>
                  </label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="مثال: شركة الأفق للمقاولات والتجارة العامة"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>أرقام الهاتف والتواصل</span>
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="مثال: 0912345678 / 021445566"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1.5 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    <span>البريد الإلكتروني / الموقع</span>
                  </label>
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="مثال: info@company.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-900 mb-1.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span>العنوان والمقر</span>
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="مثال: شارع النصر، طرابلس"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1.5 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                    <span>رقم السجل التجاري (إن وجد)</span>
                  </label>
                  <input
                    type="text"
                    value={commercialRegister}
                    onChange={(e) => setCommercialRegister(e.target.value)}
                    placeholder="مثال: CR-89210-LY"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1.5 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                    <span>الرقم الضريبي (إن وجد)</span>
                  </label>
                  <input
                    type="text"
                    value={taxNumber}
                    onChange={(e) => setTaxNumber(e.target.value)}
                    placeholder="مثال: TAX-99410-01"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1.5">رمز / مسمى العملة المالية</label>
                  <input
                    type="text"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    placeholder="مثال: د.ل أو ر.س أو $"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-bold text-emerald-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1.5">الشعار اللفظي أو الترويسة</label>
                  <input
                    type="text"
                    value={headerNote}
                    onChange={(e) => setHeaderNote(e.target.value)}
                    placeholder="مثال: الجودة والمصداقية في خدمتكم"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                  />
                </div>

                <div className="sm:col-span-2 bg-amber-50/70 p-3.5 rounded-xl border border-amber-200">
                  <label className="block text-xs font-bold text-amber-950 mb-1 flex items-center justify-between">
                    <span>فترة السماح الافتراضية للديون (أيام)</span>
                    <span className="text-[11px] font-normal text-amber-800">
                      تحدد متى يعتبر دين العميل متأخراً في بطاقة التنبيهات
                    </span>
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={debtGracePeriodDays}
                      onChange={(e) => setDebtGracePeriodDays(Number(e.target.value))}
                      className="w-32 px-3.5 py-2 rounded-lg border border-amber-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs font-bold text-amber-900"
                    />
                    <span className="text-xs text-amber-800 font-medium">
                      يوماً من تاريخ أقدم حركة غير مسددة
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: ADMINISTRATION & USERS (الإدارة والمستخدمين والصلاحيات)               */}
          {/* ========================================================================= */}
          {activeTab === 'admin' && (
            <div className="space-y-6">
              {/* Active Session Card */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-sm">
                    {currentUser.fullName.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 text-sm">{currentUser.fullName}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        المستخدم النشط حالياً
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 block mt-0.5">
                      {currentUser.role === 'admin' && 'مدير النظام — كامل الصلاحيات والتحكم'}
                      {currentUser.role === 'accountant' && 'محاسب مالي — إدارة الفواتير والسندات والتقارير'}
                      {currentUser.role === 'cashier' && 'كاشير — مدخل فواتير وسندات مع حجب الأرباح'}
                      {currentUser.role === 'viewer' && 'مشاهد فقط — استعراض السجلات'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    lockSystem();
                  }}
                  className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Lock className="w-4 h-4 text-rose-600" />
                  <span>قفل النظام الآن 🔒</span>
                </button>
              </div>

              {/* User Switcher for Role Testing */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <span>تبديل المستخدم النشط (لاختبار صلاحيات الأدوار)</span>
                  </label>
                  <span className="text-[11px] text-slate-400">انقر للتبديل الفوري بين حسابات المنظومة</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {users.map((u) => {
                    const isActive = currentUser.id === u.id;
                    return (
                      <div
                        key={u.id}
                        onClick={() => {
                          setCurrentUser(u);
                          addToast('info', `تم التبديل بنجاح إلى: ${u.fullName} (${u.role})`);
                        }}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                          isActive
                            ? 'bg-emerald-50/80 border-emerald-500 shadow-xs ring-1 ring-emerald-500'
                            : 'bg-slate-50/50 border-slate-200 hover:border-slate-300 hover:bg-slate-100/60'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                              isActive
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {u.fullName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-xs">{u.fullName}</div>
                            <div className="text-[10px] text-slate-500">
                              {u.role === 'admin'
                                ? 'مدير عام (كامل الصلاحيات)'
                                : u.role === 'accountant'
                                ? 'محاسب مالي'
                                : u.role === 'cashier'
                                ? 'كاشير / مدخل فواتير'
                                : 'مشاهد فقط'}
                            </div>
                          </div>
                        </div>

                        {isActive ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white">
                            مُفعل
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-slate-400">تبديل</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Advanced User Management Link */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-indigo-600" />
                    <span>إدارة المستخدمين والصلاحيات والأدوار الدقيقة</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    إضافة مستخدمين جدد، تعيين كلمات المرور، وتحديد صلاحيات الفواتير والتقارير والخزائن لكل مستخدم.
                  </p>
                </div>

                {onNavigateToUsers && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigateToUsers();
                    }}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    <Users className="w-4 h-4" />
                    <span>فتح شاشة إدارة المستخدمين ←</span>
                  </button>
                )}
              </div>

              {/* Data Backups & Reset */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <Database className="w-4 h-4 text-slate-600" />
                  <span>النسخ الاحتياطي وحماية البيانات محلياً</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => exportDatabase()}
                    className="p-3 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 text-right transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-emerald-600 mb-1" />
                    <div className="text-xs font-bold text-slate-900">تصدير نسخة احتياطية</div>
                    <div className="text-[10px] text-slate-500">تحميل ملف JSON كامل لكافة العمليات</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (fileInputRef.current) fileInputRef.current.click();
                    }}
                    className="p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 text-right transition-colors cursor-pointer"
                  >
                    <Upload className="w-4 h-4 text-blue-600 mb-1" />
                    <div className="text-xs font-bold text-slate-900">استيراد نسخة سابقة</div>
                    <div className="text-[10px] text-slate-500">استرجاع البيانات من ملف محفوظ سابقاً</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('هل أنت متأكد من إعادة ضبط البيانات إلى الحالة التجريبية الافتراضية؟')) {
                        resetToDemoData();
                        onClose();
                      }
                    }}
                    className="p-3 rounded-xl border border-slate-200 hover:border-rose-300 hover:bg-rose-50/50 text-right transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4 text-rose-600 mb-1" />
                    <div className="text-xs font-bold text-rose-700">إعادة الضبط الافتراضي</div>
                    <div className="text-[10px] text-slate-500">استعادة البيانات التجريبية الأولية</div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: FISCAL YEAR CLOSING & SYSTEM ZEROING (إقفال السنة والتصفير)        */}
          {/* ========================================================================= */}
          {activeTab === 'fiscal' && (
            <div className="space-y-5">
              {/* Info Header */}
              <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-amber-50 p-4 rounded-2xl border border-emerald-200">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-5 h-5 text-emerald-700" />
                  <h3 className="text-sm font-extrabold text-slate-900">
                    إدارة الدورات المحاسبية السنوية وتصفير المنظومة
                  </h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  هنا يمكنك تصفير العمليات للبدء من جديد، أو إقفال السنة المالية الحالية وترحيل الأرصدة الختامية لتصبح أرصدة افتتاحية للسنة الجديدة، مع الحفاظ التام على جميع أسماء الموظفين والزبائن والموردين والخزائن.
                </p>
              </div>

              {/* Card 1: إقفال السنة المالية وفتح سنة جديدة */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-emerald-200 hover:border-emerald-300 shadow-xs transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-slate-900">
                          إقفال السنة المالية الحالية وفتح سنة جديدة
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          السنة الحالية: {settings.currentFiscalYear || new Date().getFullYear()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed max-w-xl">
                        أرشفة تقارير الأرباح والخسائر وحسابات السنة المنتهية، مع{' '}
                        <strong className="text-emerald-800 font-bold">
                          بقاء أسماء وبيانات الموظفين والزبائن والموردين والخزائن
                        </strong>{' '}
                        وترحيل الأرصدة النهائية تلقائياً كأرصدة افتتاحية للسنة الجديدة.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowCloseYearModal(true)}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm shadow-emerald-600/30 transition-all active:scale-95 cursor-pointer shrink-0"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>إقفال السنة وترحيل الأرصدة ←</span>
                  </button>
                </div>
              </div>

              {/* Card 2: أرشيف السنوات المالية السابقة */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 hover:border-indigo-300 shadow-xs transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/20">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-slate-900">
                          أرشيف السنوات المالية السابقة والتقارير المعتمدة
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                          {fiscalYears.length} سنوات مؤرشفة
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed max-w-xl">
                        الاطلاع على الميزانيات الختامية وحسابات الأرباح للسنوات المقفلة، طباعة التقارير المعتمدة بصيغة A4 للتدقيق والمراجعة، وتصدير الأرشيف كملف JSON في أي وقت.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowArchiveModal(true)}
                    className="px-5 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer shrink-0"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                    <span>استعراض الأرشيف والتقارير ←</span>
                  </button>
                </div>
              </div>

              {/* Card 3: تصفير المنظومة والبدء من جديد */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-rose-200 hover:border-rose-300 shadow-xs transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-600/20">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-slate-900">
                          تصفير المنظومة والبدء من جديد (صفرية السجلات)
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          إجراء حساس ومحمي
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed max-w-xl">
                        تصفير الحركات والمعاملات مع{' '}
                        <strong className="text-emerald-800 font-bold">
                          خيار الإبقاء على أسماء الموظفين والزبائن والموردين والخزائن (صفرية الأرصدة)
                        </strong>
                        ، أو التصفير الشامل واستعادة المنظومة كأنها جديدة تماماً مع إمكانية تنزيل نسخة احتياطية أولاً.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowZeroOutModal(true)}
                    className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm shadow-rose-600/30 transition-all active:scale-95 cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>تصفير المنظومة الآن ←</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>يتم تطبيق تنسيقات الطباعة تلقائياً وفورياً على جميع الفواتير والسندات</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-emerald-600/30 transition-all active:scale-95 cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              <span>حفظ الإعدادات وتنسيقات الطباعة</span>
            </button>
          </div>
        </div>

        {/* Submodals for Fiscal Operations */}
        <CloseFiscalYearModal
          isOpen={showCloseYearModal}
          onClose={() => setShowCloseYearModal(false)}
          onOpenArchive={() => setShowArchiveModal(true)}
        />

        <FiscalYearsArchiveModal
          isOpen={showArchiveModal}
          onClose={() => setShowArchiveModal(false)}
          onOpenCloseYearWizard={() => setShowCloseYearModal(true)}
        />

        <ZeroOutSystemModal
          isOpen={showZeroOutModal}
          onClose={() => setShowZeroOutModal(false)}
        />
      </div>
    </div>
  );
};
