import React, { useState } from 'react';
import { Party } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  Share2,
  X,
  Copy,
  CheckCircle2,
  ExternalLink,
  MessageCircle,
  RefreshCw,
  Power,
  ShieldCheck,
  Globe,
} from 'lucide-react';

interface SharePartyPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  party: Party | null;
}

export const SharePartyPortalModal: React.FC<SharePartyPortalModalProps> = ({
  isOpen,
  onClose,
  party,
}) => {
  const { settings, getPartyBalance, addToast, regeneratePartyPortalToken, togglePartyPortalActive } = useApp();
  const [copied, setCopied] = useState(false);

  if (!isOpen || !party) return null;

  const balanceInfo = getPartyBalance(party.id);
  const portalUrl = `${window.location.origin}/?portal=statement&token=${party.portalToken || ''}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(portalUrl);
    setCopied(true);
    addToast('success', 'تم نسخ رابط كشف الحساب المباشر بنجاح!');
    setTimeout(() => setCopied(false), 3000);
  };

  const handleOpenLive = () => {
    window.open(portalUrl, '_blank');
  };

  const handleSendWhatsApp = () => {
    const balanceText =
      balanceInfo.status === 'debit'
        ? `المطلوب سداده: ${balanceInfo.net.toLocaleString()} ${settings.currency}`
        : balanceInfo.status === 'credit'
        ? `المستحق لكم: ${balanceInfo.net.toLocaleString()} ${settings.currency}`
        : `الرصيد متوازن وخالص بالكامل (0.00)`;

    const text = `مرحباً ${party.name}،\nيمكنكم الاطلاع على كشف حسابكم المحدث لحظياً والمعاملات والفواتير والسندات من خلال الرابط التالي المعتمد:\n${portalUrl}\n\n${balanceText}\n\nمع تحيات: ${settings.companyName}`;

    const cleanPhone = (party.phone || '').replace(/[^0-9]/g, '');
    const waUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;

    window.open(waUrl, '_blank');
  };

  const handleRegenerate = () => {
    if (confirm('هل تريد إلغاء الرابط الحالي وتوليد رابط جديد آمن؟ لن يعمل الرابط القديم بعد ذلك.')) {
      regeneratePartyPortalToken(party.id);
      addToast('success', 'تم توليد رابط جديد آمن لكشف الحساب');
    }
  };

  const handleToggle = () => {
    const nextState = togglePartyPortalActive(party.id);
    addToast('info', nextState ? 'تم تفعيل الرابط المباشر' : 'تم إيقاف الرابط المباشر');
  };

  const isActive = party.isPortalActive !== false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-teal-50 to-emerald-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base sm:text-lg">
                رابط كشف الحساب المباشر
              </h3>
              <p className="text-xs text-teal-800">
                مشاركة كشف حساب حي ومحدث للعميل أو المورد في أي وقت
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-5 text-xs sm:text-sm">
          {/* Party summary badge */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400">اسم الحساب:</span>
              <div className="font-black text-slate-900 text-sm">{party.name}</div>
              <div className="text-[11px] text-slate-500">
                {party.phone ? `هاتف: ${party.phone}` : 'بدون هاتف مسجل'}
              </div>
            </div>
            <div className="text-left">
              <span className="text-[11px] font-bold text-slate-400">الرصيد المباشر:</span>
              <div
                className={`font-mono font-black text-sm ${
                  balanceInfo.status === 'debit'
                    ? 'text-rose-600'
                    : balanceInfo.status === 'credit'
                    ? 'text-emerald-600'
                    : 'text-slate-700'
                }`}
              >
                {balanceInfo.net.toLocaleString()} {settings.currency}
              </div>
              <div className="text-[10px] font-bold text-slate-400">
                {balanceInfo.status === 'debit'
                  ? '(عليه مطلوب)'
                  : balanceInfo.status === 'credit'
                  ? '(له مستحق)'
                  : '(متوازن)'}
              </div>
            </div>
          </div>

          {/* Status info */}
          <div
            className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
              isActive
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                : 'bg-amber-50/80 border-amber-200 text-amber-950'
            }`}
          >
            <div className="flex items-center gap-2 text-xs font-bold">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              ></span>
              <span>{isActive ? 'الرابط مفعل وجاهز للمعاينة' : 'الرابط معطل حالياً ومحجوب'}</span>
            </div>
            <button
              onClick={handleToggle}
              className={`px-3 py-1 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                isActive
                  ? 'bg-white hover:bg-amber-100 text-amber-800 border-amber-300'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white border-transparent'
              }`}
            >
              <span className="flex items-center gap-1">
                <Power className="w-3 h-3" />
                <span>{isActive ? 'إيقاف الرابط' : 'تفعيل الرابط'}</span>
              </span>
            </button>
          </div>

          {/* Link box */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 text-xs flex items-center justify-between">
              <span>رابط المعاينة المباشر:</span>
              <span className="text-[10px] text-slate-400">
                (يستطيع العميل فتحه دون تسجيل دخول)
              </span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={portalUrl}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-700 select-all focus:outline-emerald-500"
              />
              <button
                onClick={handleCopy}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer shrink-0"
              >
                {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'تم النسخ!' : 'نسخ'}</span>
              </button>
            </div>
          </div>

          {/* Share Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
            <button
              onClick={handleSendWhatsApp}
              className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>إرسال عبر واتساب</span>
            </button>

            <button
              onClick={handleOpenLive}
              className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-2xs active:scale-95 transition-all cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              <span>فتح الرابط للتجربة</span>
            </button>
          </div>

          {/* Regenerate security note */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>تأمين الرابط وتغيير الرمز:</span>
            <button
              onClick={handleRegenerate}
              className="text-xs font-bold text-slate-600 hover:text-rose-600 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>توليد رمز جديد آمن</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
