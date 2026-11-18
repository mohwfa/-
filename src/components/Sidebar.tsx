import React from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  Receipt,
  FileCheck2,
  Landmark,
  Users2,
  UserSquare2,
  BarChart3,
  ShieldCheck,
  Lock,
} from 'lucide-react';

export type TabType =
  | 'dashboard'
  | 'invoices'
  | 'vouchers'
  | 'treasuries'
  | 'parties'
  | 'employees'
  | 'reports'
  | 'users';

interface SidebarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const { currentUser, invoices, vouchers, parties, employees, treasuries } = useApp();
  const perms = currentUser.permissions;

  const navItems = [
    {
      id: 'dashboard' as TabType,
      label: 'لوحة التحكم',
      desc: 'نظرة شاملة وسريعة',
      icon: LayoutDashboard,
      allowed: perms.canViewDashboard,
    },
    {
      id: 'invoices' as TabType,
      label: 'الفواتير اليومية',
      desc: 'مبيعات ومشتريات ومصروفات',
      icon: Receipt,
      count: invoices.length,
      allowed: true, // visible, internal actions checked
    },
    {
      id: 'vouchers' as TabType,
      label: 'سندات القبض والصرف',
      desc: 'إيصالات السداد والدفعات',
      icon: FileCheck2,
      count: vouchers.length,
      allowed: true,
    },
    {
      id: 'treasuries' as TabType,
      label: 'الخزائن والمصارف',
      desc: 'السيولة وحركات السحب والإيداع',
      icon: Landmark,
      count: treasuries.length,
      allowed: true,
    },
    {
      id: 'parties' as TabType,
      label: 'العملاء والموردين',
      desc: 'الحسابات العامة والترصيد',
      icon: Users2,
      count: parties.length,
      allowed: true,
    },
    {
      id: 'employees' as TabType,
      label: 'الموظفون والعمولات',
      desc: 'الرواتب، السلف، ونسب الفواتير',
      icon: UserSquare2,
      count: employees.length,
      allowed: perms.canManageEmployees || perms.canViewEmployeeFinancials || currentUser.role === 'admin',
    },
    {
      id: 'reports' as TabType,
      label: 'التقارير المالية',
      desc: 'الأرباح والخسائر وكشوف الحساب',
      icon: BarChart3,
      allowed: perms.canViewReports || currentUser.role === 'admin',
    },
    {
      id: 'users' as TabType,
      label: 'المستخدمون والصلاحيات',
      desc: 'التحكم بالوصول والبيانات الحساسة',
      icon: ShieldCheck,
      allowed: perms.canManageUsers || currentUser.role === 'admin',
    },
  ];

  return (
    <aside className="w-full lg:w-68 bg-white border-l border-slate-200 p-3 lg:p-4 flex flex-col gap-1 shrink-0 no-print">
      <div className="text-[11px] font-bold text-slate-400 px-3 py-1 uppercase tracking-wider mb-1 hidden lg:block">
        أقسام المنظومة
      </div>

      <div className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 scrollbar-none">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          const isAllowed = item.allowed;

          return (
            <button
              key={item.id}
              disabled={!isAllowed}
              onClick={() => isAllowed && onSelectTab(item.id)}
              className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-2xl text-right transition-all shrink-0 lg:shrink text-xs sm:text-sm font-medium ${
                isActive
                  ? 'bg-emerald-600 text-white font-bold shadow-sm shadow-emerald-600/30'
                  : isAllowed
                  ? 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900'
                  : 'text-slate-400 opacity-60 cursor-not-allowed bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <div className="text-right">
                  <div className="leading-tight">{item.label}</div>
                  <div className={`text-[10px] hidden lg:block ${isActive ? 'text-emerald-100' : 'text-slate-400'}`}>
                    {item.desc}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {!isAllowed ? (
                  <span title="صلاحية مقيدة">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                  </span>
                ) : item.count !== undefined ? (
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {item.count}
                  </span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>


      {/* Helper Box */}
      <div className="pt-2 hidden lg:block">
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/50 border border-emerald-100 text-emerald-950 text-xs">
          <p className="font-bold mb-1 flex items-center gap-1.5 text-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            فواتير ورقية سريعة
          </p>
          <p className="text-[11px] text-emerald-700 leading-relaxed">
            المنظومة مخصصة لإدخال القيمة الإجمالية ورقم الفاتورة الورقية دون إضاعة الوقت في تسجيل الأصناف والمخزون.
          </p>
        </div>
      </div>
    </aside>
  );
};
