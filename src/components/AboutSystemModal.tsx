import React, { useState } from 'react';
import {
  Info,
  X,
  BookOpen,
  CheckCircle2,
  Receipt,
  FileCheck2,
  Landmark,
  Users2,
  UserSquare2,
  BarChart3,
  ShieldCheck,
  Printer,
  Settings,
  Zap,
  Database,
  Sparkles,
  Bell,
  Calendar,
  Globe,
} from 'lucide-react';
import { TabType } from './Sidebar';

interface AboutSystemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab?: (tab: TabType) => void;
  onOpenCompanySettings?: () => void;
}

export const AboutSystemModal: React.FC<AboutSystemModalProps> = ({
  isOpen,
  onClose,
  onNavigateToTab,
  onOpenCompanySettings,
}) => {
  const [activeSection, setActiveSection] = useState<'howItWorks' | 'tasks' | 'features'>('howItWorks');

  if (!isOpen) return null;

  const handleNavigate = (tab: TabType) => {
    if (onNavigateToTab) {
      onNavigateToTab(tab);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-4xl w-full flex flex-col max-h-[92vh] overflow-hidden text-right">
        {/* Modal Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white flex items-start justify-between gap-4 shrink-0 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
          
          <div className="flex items-center gap-3.5 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  حول المنظومة المالية البسيطة
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                  سندات وفواتير وخزائن
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
                منظومة محاسبية متكاملة ومخصصة لشركة واحدة لإدارة الفواتير الورقية، السندات، الخزائن، حسابات العملاء والموردين والموظفين، مع روابط كشوف الحساب المباشرة.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer shrink-0 relative z-10"
            title="إغلاق النافذة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-6 pt-3 flex gap-2 overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveSection('howItWorks')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeSection === 'howItWorks'
                ? 'bg-white text-emerald-800 border-emerald-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100'
            }`}
          >
            <Zap className="w-4 h-4 text-emerald-600" />
            <span>كيف يعمل النظام؟ (آلية العمل)</span>
          </button>

          <button
            onClick={() => setActiveSection('tasks')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeSection === 'tasks'
                ? 'bg-white text-emerald-800 border-emerald-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
            <span>المهام التي يمكن إنجازها</span>
          </button>

          <button
            onClick={() => setActiveSection('features')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeSection === 'features'
                ? 'bg-white text-emerald-800 border-emerald-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>المعايير المعتمدة والمزايا الذكية</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-slate-700 flex-1 text-xs sm:text-sm">
          {/* Section 1: How the System Works */}
          {activeSection === 'howItWorks' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 text-emerald-950 flex items-start gap-3">
                <Info className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-extrabold text-emerald-950 text-sm">
                    الفلسفة المحاسبية للمنظومة: بساطة وسرعة دون تعقيد دفتري
                  </h4>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    صُمم النظام خصيصاً للمنشآت والمحلات التي تستخدم الدفاتر الورقية يومياً وتتراكم لديها الفواتير والسندات، بحيث يقوم النظام بأتمتة كافة العمليات المحاسبية المعقدة خلف الكواليس بمجرد إدخال رقم الفاتورة الورقية والمبلغ.
                  </p>
                </div>
              </div>

              {/* Step-by-Step Flow */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs hover:border-emerald-300 transition-colors space-y-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                      1
                    </span>
                    <h5 className="font-black text-slate-900 text-sm">توثيق الفواتير الورقية وجدول الأصناف</h5>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed pr-9">
                    تُسجل فواتير المبيعات والمشتريات والمصروفات برقمها الدفتري الورقي وحالة الدفع (نقداً أو آجل أو جزئي) وطريقة السداد. كما يمكنك إدخال <strong>جدول الأصناف</strong> يدوياً (رقم تسلسلي، الصنف، الكمية، سعر الوحدة، والسعر الإجمالي التلقائي) عند الحاجة.
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs hover:border-emerald-300 transition-colors space-y-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                      2
                    </span>
                    <h5 className="font-black text-slate-900 text-sm">حساب عمولات ونسب الموظفين آلياً</h5>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed pr-9">
                    عند اختيار موظف المبيعات وتحديد نسبته بالفاتورة، يحسب النظام العمولة فوراً ويقيدها في كشف حساب الموظف الشهري، مع حجب ظهور هذه النسبة تماماً في فواتير الطباعة الموجهة للعملاء.
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs hover:border-emerald-300 transition-colors space-y-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                      3
                    </span>
                    <h5 className="font-black text-slate-900 text-sm">حركة الخزائن والسيولة النقدية والمصرفية</h5>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed pr-9">
                    تتوزع السيولة المالية بين الخزائن النقدية (الكاش) والحسابات المصرفية (البنوك). كل إيصال قبض أو صرف أو تحويل أو تسوية يحدّث رصيد الخزينة المحددة في أجزاء من الثانية.
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs hover:border-emerald-300 transition-colors space-y-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                      4
                    </span>
                    <h5 className="font-black text-slate-900 text-sm">كشوفات الحساب والروابط المباشرة للعملاء</h5>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed pr-9">
                    لكل عميل أو مورد أو حساب عام سجل تاريخي بالحركات مع رصيد مستمر (دائن/مدين)، وخيار العرض كشبكة أو قائمة، وإمكانية مشاركة <strong>رابط كشف حساب مباشر</strong> يتابعه العميل في أي وقت دون تسجيل دخول.
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs hover:border-emerald-300 transition-colors space-y-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                      5
                    </span>
                    <h5 className="font-black text-slate-900 text-sm">تنبيهات الديون المتأخرة وفترة السماح</h5>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed pr-9">
                    تعرض لوحة التحكم بطاقة تنبيهات خاصة ترصد العملاء أصحاب الديون التي تجاوزت فترة السماح المحددة (15، 30، 45، 60 يوماً أو مدة مخصصة)، مع أزرار سريعة لقبض الدفعة أو استعراض كشف الحساب والاتصال.
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs hover:border-emerald-300 transition-colors space-y-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                      6
                    </span>
                    <h5 className="font-black text-slate-900 text-sm">طباعة الفواتير (A4) وسندات القبض والصرف (A5)</h5>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed pr-9">
                    تُطبع الفواتير بمقاس A4 رأسي متضمنة جدول الأصناف واسم المحاسب المسؤول الفعلي المسجل بالنظام، بينما تُطبع السندات بمقاس A5 أفقي متضمنة المبلغ بالأرقام والكلمات والتوقيعات الرسمية.
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs hover:border-emerald-300 transition-colors space-y-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                      7
                    </span>
                    <h5 className="font-black text-slate-900 text-sm">التقارير المالية والأرباح وصافي الدخل</h5>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed pr-9">
                    شاشة تقارير تفاعلية تحتسب إجمالي المبيعات، كلفة المشتريات، المصروفات التشغيلية، وصافي الربح المحقق مع مؤشرات بيانية تسهل اتخاذ القرارات المالية للشركة.
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs hover:border-emerald-300 transition-colors space-y-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                      8
                    </span>
                    <h5 className="font-black text-slate-900 text-sm">إقفال السنة المالية وأرشيف السنوات</h5>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed pr-9">
                    تتيح المنظومة إقفال السنة المالية وأرشفة بياناتها وترحيل الأرصدة الختامية كأرصدة افتتاحية للسنة الجديدة مع الحفاظ على كافة أسماء الحسابات والعملاء والموردين والخزائن والموظفين.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Section 2: Tasks Accomplished */}
          {activeSection === 'tasks' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <h4 className="font-black text-slate-900 text-sm mb-2">
                قائمة المهام التي يمكنك إنجازها عبر المنظومة:
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Task 1 */}
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 transition-all shadow-2xs flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <span className="font-bold text-slate-900 block text-xs">إدخال الفواتير الورقية وجدول الأصناف</span>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      تسجيل فواتير المبيعات والمشتريات والمصروفات برقم الدفتر عبر «شريط الإدخال السريع» أو النموذج التفصيلي مع جدول الأصناف اليدوي (الكمية، سعر الوحدة، والإجمالي التلقائي).
                    </p>
                  </div>
                </div>

                {/* Task 2 */}
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 transition-all shadow-2xs flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 mt-0.5">
                    <FileCheck2 className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <span className="font-bold text-slate-900 block text-xs">إصدار وطباعة سندات القبض والصرف</span>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      إثبات استلام الأموال من العملاء أو صرف الدفعات للموردين بمقاس A5 أفقي أنيق ومفصل مع خيارات التحويل المصرفي أو السداد نقداً.
                    </p>
                  </div>
                </div>

                {/* Task 3 */}
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 transition-all shadow-2xs flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Landmark className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <span className="font-bold text-slate-900 block text-xs">إدارة الخزائن والمصارف والتحويل الداخلي</span>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      متابعة أرصدة الكاش وحسابات البنوك بدقة، والتحويل بين الخزائن مع إثبات فوري للعملية في كشف حساب الخزينة.
                    </p>
                  </div>
                </div>

                {/* Task 4 */}
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 transition-all shadow-2xs flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Users2 className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <span className="font-bold text-slate-900 block text-xs">العملاء والموردين (عرض شبكة / قائمة)</span>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      رصد مديونيات الزبائن والتزامات الموردين والحسابات العامة المشتركة، مع التبديل المرن بين عرض الشبكة والقائمة ومشاركة روابط كشوف الحساب المباشرة.
                    </p>
                  </div>
                </div>

                {/* Task 5 */}
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 transition-all shadow-2xs flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <span className="font-bold text-slate-900 block text-xs">متابعة تنبيهات الديون المتأخرة</span>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      رصد تلقائي للعملاء الذين تجاوزت ديونهم فترة السماح المحددة (15 / 30 / 45 / 60 يوماً أو مخصص) مع زر قبض دفعة فوري من لوحة التحكم.
                    </p>
                  </div>
                </div>

                {/* Task 6 */}
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 transition-all shadow-2xs flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                    <UserSquare2 className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <span className="font-bold text-slate-900 block text-xs">إدارة رواتب الموظفين والسلف والعمولات</span>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      تسجيل الرواتب الأساسية، احتساب نسب الفواتير آلياً، تسجيل السلف النقدية والخصومات والمكافآت، وطباعة كشف حساب الموظف بمقاس A4.
                    </p>
                  </div>
                </div>

                {/* Task 7 */}
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 transition-all shadow-2xs flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center shrink-0 mt-0.5">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <span className="font-bold text-slate-900 block text-xs">تقارير الأرباح والخسائر وحركة السيولة</span>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      استعراض التقارير الدورية (شهري، سنوي، أو فترة مخصصة) مع تتبع مؤشرات صافي الأرباح وقوة التدفقات النقدية والطباعة بمقاس A4.
                    </p>
                  </div>
                </div>

                {/* Task 8 */}
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 transition-all shadow-2xs flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Printer className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <span className="font-bold text-slate-900 block text-xs">تنسيق وتخصيص مستندات الطباعة</span>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      التحكم بحجم الشعار في الطباعة (صغير جداً، صغير، متوسط، كبير، أو مخفي)، حجم خط الجداول، مقاس السندات، والبيانات المطبوعة بالترويسة.
                    </p>
                  </div>
                </div>

                {/* Task 9 */}
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 transition-all shadow-2xs flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <span className="font-bold text-slate-900 block text-xs">إقفال السنة المالية والتصفير الآمن</span>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      ترحيل أرصدة العملاء والموردين والخزائن والموظفين تلقائياً لسنة مالية جديدة مع حفظ أرشيف السنوات المغلقة أو تصفير البيانات مع بقاء الأسماء.
                    </p>
                  </div>
                </div>

                {/* Task 10 */}
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 transition-all shadow-2xs flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Database className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <span className="font-bold text-slate-900 block text-xs">النسخ الاحتياطي وحماية البيانات محلياً</span>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      تصدير قاعدة البيانات بالكامل كملف JSON بنقرة واحدة، واستعادتها في أي وقت، والعمل الكامل محلياً دون الحاجة لاتصال بالإنترنت.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section 3: Standards & Smart Features */}
          {activeSection === 'features' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <h4 className="font-black text-slate-900 text-sm mb-2">
                المعايير المعتمدة والمزايا الاستثنائية في المنظومة:
              </h4>

              <div className="space-y-3">
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-slate-900 text-xs">معيار المقاسات الورقية المعتمد</h5>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      • <strong>مقاس A4 رأسي (210×297 مم)</strong>: مخصص للفواتير الورقية، التقارير المالية، كشوفات حساب العملاء، الموردين، والموظفين.<br />
                      • <strong>مقاس A5 أفقي (210×148 مم)</strong>: مخصص لسندات القبض والصرف، مما يوفر استهلاك الورق ويمنح السند مظهراً رسمياً مريحاً.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-slate-900 text-xs">خصوصية ودقة مستندات الطباعة</h5>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      • حجب عمولة ونسبة الموظف وأي عبارات داخلية من الفاتورة المطبوعة.<br />
                      • عرض <strong>الاسم الفعلي للمحاسب أو المستخدم المسجل بالنظام</strong> أسفل «المحاسب المسؤول / الإدارة» بدلاً من أي تسمية عامة، مع تذييل نظيف بدون خانات زائدة.<br />
                      • إمكانية إدراج <strong>جدول الأصناف</strong> بـ 5 أعمدة (م، الصنف، الكمية، سعر الوحدة، السعر الإجمالي) مع حساب الإجمالي تلقائياً.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-slate-900 text-xs">حماية حقول الأرقام من التعديل العرضي</h5>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      تم تعطيل تغيير القيم الرقمية عبر عجلة التمرير في الفأرة (Mouse Wheel) في جميع حقول إدخال المبالغ والكميات لمنع تعديل الأرقام بالخطأ أثناء التمرير.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-slate-900 text-xs">نظام الصلاحيات وقفل الشاشة السريع</h5>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      دعم 4 مستويات مستخدمين: <strong>مدير النظام</strong> (كامل الصلاحيات)، <strong>محاسب مالي</strong>، <strong>كاشير / مدخل فواتير</strong> (لا يرى الأرباح ولا رواتب الموظفين)، و<strong>مشاهد</strong>. مع زر قفل فوري للشاشة بكلمة مرور.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-teal-200 bg-teal-50/70 flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-teal-950 text-xs">نظام مخصص لشركة واحدة بكامل المزايا</h5>
                    <p className="text-xs text-teal-900 mt-1 leading-relaxed">
                      تعمل المنظومة بشكل مخصص ومستقل لإدارة بيانات وحسابات شركة واحدة فقط، وتتوفر كافة الوظائف المحاسبية والتقارير دون اشتراكات أو قيود زمنية.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 flex items-start gap-3">
                  <Globe className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-emerald-950 text-xs">رابط كشف الحساب المباشر للعميل والمورد (Live Statement Portal)</h5>
                    <p className="text-xs text-emerald-900 mt-1 leading-relaxed">
                      إمكانية إرسال رابط آمن ومباشر للعميل أو المورد (عبر واتساب أو نسخ الرابط) لتمكينه من الاطلاع على كشف حسابه ورصيده المتبقي ومعاملاته بشكل حي ومحدث في أي لحظة دون الحاجة لتسجيل دخول.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Navigation Footer Cards */}
          <div className="pt-4 border-t border-slate-200">
            <div className="text-[11px] font-bold text-slate-400 mb-2">روابط سريعة لأقسام المنظومة:</div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleNavigate('invoices')}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>الفواتير اليومية</span>
              </button>

              <button
                onClick={() => handleNavigate('vouchers')}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <FileCheck2 className="w-3.5 h-3.5" />
                <span>سندات القبض والصرف</span>
              </button>

              <button
                onClick={() => handleNavigate('treasuries')}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Landmark className="w-3.5 h-3.5" />
                <span>الخزائن والمصارف</span>
              </button>

              <button
                onClick={() => handleNavigate('parties')}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Users2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>العملاء والموردين</span>
              </button>

              <button
                onClick={() => handleNavigate('employees')}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <UserSquare2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>الموظفون والعمولات</span>
              </button>

              <button
                onClick={() => handleNavigate('reports')}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>التقارير والأرباح</span>
              </button>

              {onOpenCompanySettings && (
                <button
                  onClick={() => {
                    onOpenCompanySettings();
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-purple-50 text-slate-700 hover:text-purple-700 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5 text-purple-600" />
                  <span>إعدادات وتنسيق الطباعة</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-slate-500 font-medium">
            المنظومة المالية البسيطة • سهولة في الإدخال ودقة في الحسابات
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
          >
            إغلاق الدليل
          </button>
        </div>
      </div>
    </div>
  );
};
