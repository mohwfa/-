import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Treasury } from '../../types';
import {
  Landmark,
  Plus,
  ArrowLeftRight,
  ArrowDownLeft,
  ArrowUpRight,
  FileSpreadsheet,
  Edit2,
  Trash2,
  Banknote,
  CreditCard,
  Wallet,
} from 'lucide-react';
import { TreasuryModal } from './TreasuryModal';
import { TreasuryActionModal } from './TreasuryActionModal';
import { TransferModal } from './TransferModal';
import { TreasuryStatementModal } from './TreasuryStatementModal';

export const TreasuryList: React.FC = () => {
  const { treasuries, getTreasuryBalance, getTotalLiquidity, deleteTreasury, settings, currentUser } =
    useApp();

  const liquidity = getTotalLiquidity();

  const [isTreasuryModalOpen, setIsTreasuryModalOpen] = useState(false);
  const [treasuryToEdit, setTreasuryToEdit] = useState<Treasury | null>(null);

  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionTreasuryId, setActionTreasuryId] = useState<string>('');
  const [actionType, setActionType] = useState<'deposit' | 'withdrawal'>('deposit');

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);
  const [selectedTreasuryForStatement, setSelectedTreasuryForStatement] = useState<Treasury | null>(null);

  const handleOpenDeposit = (id: string) => {
    setActionTreasuryId(id);
    setActionType('deposit');
    setIsActionModalOpen(true);
  };

  const handleOpenWithdrawal = (id: string) => {
    setActionTreasuryId(id);
    setActionType('withdrawal');
    setIsActionModalOpen(true);
  };

  const handleOpenStatement = (t: Treasury) => {
    setSelectedTreasuryForStatement(t);
    setIsStatementModalOpen(true);
  };

  const handleDelete = (t: Treasury) => {
    if (confirm(`هل أنت متأكد من حذف ${t.name}؟`)) {
      deleteTreasury(t.id);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Landmark className="w-6 h-6 text-emerald-600" />
            <span>الخزائن والمصارف والسيولة النقدية</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            إدارة أرصدة الخزائن الكاش والحسابات المصرفية، السحب والإيداع، والتحويل المباشر بين الحسابات
          </p>
        </div>

        {currentUser.permissions.canManageTreasuries && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsTransferModalOpen(true)}
              className="px-3.5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span>تحويل بين الخزائن والمصارف</span>
            </button>
            <button
              onClick={() => {
                setTreasuryToEdit(null);
                setIsTreasuryModalOpen(true);
              }}
              className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm shadow-emerald-600/30 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة خزينة / مصرف</span>
            </button>
          </div>
        )}
      </div>

      {/* Liquidity High-Level Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-md shadow-emerald-600/20">
          <div className="flex items-center justify-between">
            <span className="text-xs text-emerald-100 font-bold">إجمالي السيولة المالية الكلية</span>
            <Wallet className="w-5 h-5 text-emerald-200" />
          </div>
          <div className="text-2xl font-black mt-2">
            {liquidity.total.toLocaleString()} <span className="text-xs font-normal text-emerald-200">{settings.currency}</span>
          </div>
          <p className="text-[11px] text-emerald-100/90 mt-1">مجموع السيولة المتاحة فوراً في كافة الخزائن والمصارف</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-amber-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-800 font-bold">إجمالي النقدية السائلة (الكاش)</span>
            <Banknote className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-950 mt-2">
            {liquidity.cash.toLocaleString()} <span className="text-xs font-normal text-slate-400">{settings.currency}</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">السيولة النقدية في أدراج وخزائن المحل</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-blue-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-blue-800 font-bold">إجمالي الأرصدة المصرفية (البنوك)</span>
            <CreditCard className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-950 mt-2">
            {liquidity.bank.toLocaleString()} <span className="text-xs font-normal text-slate-400">{settings.currency}</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">السيولة بالحسابات الجارية وأجهزة نقاط البيع POS</p>
        </div>
      </div>

      {/* Treasuries Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {treasuries.map((t) => {
          const balance = getTreasuryBalance(t.id);
          const isCash = t.type === 'cash';

          return (
            <div
              key={t.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                        isCash ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {isCash ? <Banknote className="w-6 h-6" /> : <CreditCard className="w-6 h-6" />}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight">{t.name}</h3>
                      <span className="text-[11px] font-bold text-slate-400">
                        {isCash ? 'خزينة نقدية (درج كاش)' : 'حساب مصرفي / بنك'}
                      </span>
                    </div>
                  </div>

                  {currentUser.permissions.canManageTreasuries && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setTreasuryToEdit(t);
                          setIsTreasuryModalOpen(true);
                        }}
                        className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                        title="تعديل الخزينة"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(t)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                        title="حذف الخزينة"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {t.accountNumber && (
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-[11px] font-mono text-slate-600">
                    رقم الحساب: {t.accountNumber}
                  </div>
                )}

                <div className="pt-2">
                  <span className="text-[11px] font-medium text-slate-400 block">الرصيد الفعلي الحالي:</span>
                  <div
                    className={`text-2xl font-black mt-0.5 ${
                      balance >= 0 ? 'text-slate-900' : 'text-rose-600'
                    }`}
                  >
                    {balance.toLocaleString()} <span className="text-xs font-normal text-slate-500">{settings.currency}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 flex justify-between">
                    <span>رصيد البداية: {t.openingBalance.toLocaleString()} {settings.currency}</span>
                  </div>
                </div>

                {t.notes && <p className="text-xs text-slate-500 border-t border-slate-100 pt-2">{t.notes}</p>}
              </div>

              {/* Action Buttons for this treasury */}
              <div className="p-3 bg-slate-50/80 border-t border-slate-100 flex flex-wrap items-center justify-between gap-1 text-xs">
                <button
                  onClick={() => handleOpenStatement(t)}
                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold flex items-center gap-1 transition-colors"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
                  <span>كشف حركات تفصيلي</span>
                </button>

                {currentUser.permissions.canManageTreasuries && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenDeposit(t.id)}
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 font-bold flex items-center gap-1 transition-colors text-[11px]"
                      title="إيداع نقدي مباشر"
                    >
                      <ArrowDownLeft className="w-3 h-3 text-emerald-600" />
                      <span>إيداع</span>
                    </button>
                    <button
                      onClick={() => handleOpenWithdrawal(t.id)}
                      className="px-2.5 py-1.5 rounded-xl bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200 font-bold flex items-center gap-1 transition-colors text-[11px]"
                      title="سحب نقدي مباشر"
                    >
                      <ArrowUpRight className="w-3 h-3 text-rose-600" />
                      <span>سحب</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modals */}
      <TreasuryModal
        isOpen={isTreasuryModalOpen}
        onClose={() => {
          setIsTreasuryModalOpen(false);
          setTreasuryToEdit(null);
        }}
        treasuryToEdit={treasuryToEdit}
      />

      <TreasuryActionModal
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        treasuryId={actionTreasuryId}
        defaultType={actionType}
      />

      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
      />

      <TreasuryStatementModal
        isOpen={isStatementModalOpen}
        onClose={() => {
          setIsStatementModalOpen(false);
          setSelectedTreasuryForStatement(null);
        }}
        treasury={selectedTreasuryForStatement}
      />
    </div>
  );
};
