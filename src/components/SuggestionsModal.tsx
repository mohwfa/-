import React from 'react';
import { Sparkles, CheckCircle2, Lightbulb, Zap, ShieldAlert, ArrowRight, Printer, RefreshCw } from 'lucide-react';

interface SuggestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab?: (tabName: any) => void;
}

export const SuggestionsModal: React.FC<SuggestionsModalProps> = ({
  isOpen,
  onClose,
  onNavigateToTab,
}) => {
  if (!isOpen) return null;

  const suggestions = [
    {
      title: '1. الاحتساب التلقائي لعمولة ونسبة الموظف (تم تفعيلها بالكامل)',
      desc: 'عند إدخال أي فاتورة مبيعات، يمكنك تفعيل حقل "نسبة الموظف" وتحديد النسبة المئوية (%) أو كتابة القيمة مباشرة. يقوم النظام تلقائياً بقيد هذا المبلغ كمكافأة مستحقة في كشف حساب الموظف المالي لشهر الفاتورة، لتصرف ضمن صافي راتب ذلك الشهر مع إشارة واضحة لرقم الفاتورة الورقية.',
      badge: 'مُفعل وجاهز',
      badgeColor: 'bg-emerald-100 text-emerald-800',
      icon: Zap,
    },
    {
      title: '2. حساب نقدي عام محمي للزبون العابر (مُدمج بالنظام)',
      desc: 'تم توفير حساب باسم "حساب نقدي (زبون عابر / مشتريات نقدية)" بشكل مسبق وثابت. يمكنك اختياره فوراً بنقرة زر عند إدخال الفواتير النقدية السريعة التي لا تحتاج لتسجيل اسم عميل أو مورد خاص، مع المحافظة على ترصيد الخزينة بدقة.',
      badge: 'مُفعل وجاهز',
      badgeColor: 'bg-emerald-100 text-emerald-800',
      icon: CheckCircle2,
    },
    {
      title: '3. كشف حساب المقاصة الموحد للحسابات العامة (عميل + مورد)',
      desc: 'عند اختيار نوع الحساب "عام (عميل ومورد في نفس الوقت)"، يقوم كشف الحساب التفاعلي بدمج فواتير البيع (مدين) وفواتير الشراء (دائن) وسندات القبض والصرف في شريط زمني واحد مع رصيد تراكمي مستمر يوضح هل هو دائن أم مدين في أي لحظة.',
      badge: 'مُفعل وجاهز',
      badgeColor: 'bg-emerald-100 text-emerald-800',
      icon: RefreshCw,
    },
    {
      title: '4. نمط الإدخال السريع المتتالي للفواتير الورقية',
      desc: 'بما أن الفواتير لديكم ورقية وقد تتراكم يومياً، أضفنا زر "حفظ وإدخال فاتورة أخرى" ينقل المؤشر فوراً لرقم الفاتورة التالي بدون إغلاق النافذة، مما يتيح إدخال 50 فاتورة ورقية في بضع دقائق دون أي تعقيد.',
      badge: 'ميزة ذكية',
      badgeColor: 'bg-blue-100 text-blue-800',
      icon: Lightbulb,
    },
    {
      title: '5. طباعة فورية لإيصال الفاتورة وسندات القبض والصرف',
      desc: 'كل فاتورة أو سند يتم حفظه يمكن طباعته بضغطة زر كوصل رسمي مع التوقيعات وترويسة المنشأة، سواء على طابعات الورق العادي A4 أو طابعات الإيصالات الحرارية الصغيرة (80mm).',
      badge: 'ميزة جاهزة',
      badgeColor: 'bg-amber-100 text-amber-800',
      icon: Printer,
    },
    {
      title: '6. حماية البيانات الحساسة (الأرباح ورواتب الموظفين)',
      desc: 'يمكن للكاشير أو مدخل البيانات استخدام النظام لإدخال الفواتير وسندات القبض، لكن تم حجب أرباح المحل وتقارير رواتب وسلف الموظفين عنه بدقة لحماية خصوصية وسرية العمل.',
      badge: 'أمان وصلاحيات',
      badgeColor: 'bg-purple-100 text-purple-800',
      icon: ShieldAlert,
    },
    {
      title: '7. النسخ الاحتياطي السريع (تصدير واستيراد JSON)',
      desc: 'يمكنك بضغطة زر تنزيل نسخة كاملة لجميع الفواتير والسندات والحسابات على جهازك، واستعادتها في أي وقت بدون الحاجة لاتصال بالإنترنت.',
      badge: 'أمان البيانات',
      badgeColor: 'bg-teal-100 text-teal-800',
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-amber-500 via-amber-600 to-emerald-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black">الملاحظات والإضافات المقترحة لمنظومتك</h2>
              <p className="text-xs text-amber-100 mt-0.5">
                إجابة تفصيلية على سؤالك واستعراض للحلول الذكية المصممة خصيصاً لعملك
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content list */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {suggestions.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-4 rounded-2xl border border-slate-200/90 bg-slate-50/50 hover:bg-white transition-all shadow-2xs hover:shadow-sm"
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-slate-700 shrink-0" />
                    <span className="font-bold text-slate-900">{item.title}</span>
                  </div>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                </div>
                <p className="text-slate-600 leading-relaxed text-xs sm:text-xs">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs">
          <span className="text-slate-500 font-medium">كافة هذه الخيارات والمزايا تعمل ومفعلة في نظامك الحالي</span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-colors shadow-xs"
          >
            حسناً، فهمت
          </button>
        </div>
      </div>
    </div>
  );
};
