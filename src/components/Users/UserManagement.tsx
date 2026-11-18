import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { User, UserPermissions, UserRole } from '../../types';
import {
  ShieldCheck,
  Plus,
  UserCheck,
  Edit2,
  Trash2,
  CheckCircle,
  X,
  Lock,
  Eye,
  Shield,
  Key,
} from 'lucide-react';

export const UserManagement: React.FC = () => {
  const { users, currentUser, setCurrentUser, addUser, updateUser, deleteUser, addToast } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);

  // Form states
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('123');
  const [role, setRole] = useState<UserRole>('cashier');

  // Permissions state
  const [permissions, setPermissions] = useState<UserPermissions>({
    canViewDashboard: true,
    canManageInvoices: true,
    canManageVouchers: true,
    canManageTreasuries: false,
    canManageParties: true,
    canManageEmployees: false,
    canViewReports: false,
    canViewProfitAndLoss: false,
    canViewEmployeeFinancials: false,
    canManageUsers: false,
    canExportBackup: false,
  });

  const handleRolePreset = (selectedRole: UserRole) => {
    setRole(selectedRole);
    if (selectedRole === 'admin') {
      setPermissions({
        canViewDashboard: true,
        canManageInvoices: true,
        canManageVouchers: true,
        canManageTreasuries: true,
        canManageParties: true,
        canManageEmployees: true,
        canViewReports: true,
        canViewProfitAndLoss: true,
        canViewEmployeeFinancials: true,
        canManageUsers: true,
        canExportBackup: true,
      });
    } else if (selectedRole === 'accountant') {
      setPermissions({
        canViewDashboard: true,
        canManageInvoices: true,
        canManageVouchers: true,
        canManageTreasuries: true,
        canManageParties: true,
        canManageEmployees: true,
        canViewReports: true,
        canViewProfitAndLoss: true,
        canViewEmployeeFinancials: true,
        canManageUsers: false,
        canExportBackup: true,
      });
    } else if (selectedRole === 'cashier') {
      setPermissions({
        canViewDashboard: true,
        canManageInvoices: true,
        canManageVouchers: true,
        canManageTreasuries: false,
        canManageParties: true,
        canManageEmployees: false,
        canViewReports: false,
        canViewProfitAndLoss: false,
        canViewEmployeeFinancials: false,
        canManageUsers: false,
        canExportBackup: false,
      });
    } else if (selectedRole === 'viewer') {
      setPermissions({
        canViewDashboard: true,
        canManageInvoices: false,
        canManageVouchers: false,
        canManageTreasuries: false,
        canManageParties: false,
        canManageEmployees: false,
        canViewReports: true,
        canViewProfitAndLoss: false,
        canViewEmployeeFinancials: false,
        canManageUsers: false,
        canExportBackup: false,
      });
    }
  };

  const handleOpenAdd = () => {
    setUserToEdit(null);
    setUsername('');
    setFullName('');
    setPassword('123');
    handleRolePreset('cashier');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (u: User) => {
    setUserToEdit(u);
    setUsername(u.username);
    setFullName(u.fullName);
    setPassword(u.password || '123');
    setRole(u.role);
    setPermissions(u.permissions);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !fullName.trim()) {
      addToast('error', 'يرجى إدخال اسم المستخدم والاسم الكامل');
      return;
    }

    if (userToEdit) {
      updateUser(userToEdit.id, {
        username: username.trim(),
        fullName: fullName.trim(),
        password: password.trim() || '123',
        role,
        permissions,
      });
    } else {
      addUser({
        username: username.trim(),
        fullName: fullName.trim(),
        password: password.trim() || '123',
        role,
        permissions,
        isActive: true,
      });
    }
    setIsModalOpen(false);
  };

  const handleDelete = (u: User) => {
    if (confirm(`هل أنت متأكد من حذف المستخدم ${u.fullName}؟`)) {
      deleteUser(u.id);
    }
  };

  if (!currentUser.permissions.canManageUsers && currentUser.role !== 'admin') {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center max-w-lg mx-auto my-12 space-y-4">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto">
          <Lock className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-black text-slate-800">صلاحية الوصول مقيدة</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          حسابك الحالي لا يمتلك صلاحية إدارة المستخدمين وتعديل الصلاحيات أو كلمات المرور. يرجى تسجيل الدخول بحساب مدير النظام.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-purple-600" />
            <span>نظام المستخدمين والصلاحيات والتحكم بالوصول</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            إضافة مستخدمين جدد، وتحديد الأدوار والمهام المتاحة لهم، وحماية البيانات الحساسة (الأرباح والرواتب)
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-sm shadow-purple-600/30 transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة مستخدم جديد</span>
        </button>
      </div>

      {/* Current Active Session Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-900 to-indigo-900 text-white shadow-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center font-black text-lg">
            {currentUser.fullName.charAt(0)}
          </div>
          <div>
            <span className="text-[11px] text-purple-200 block font-bold">المستخدم النشط حالياً:</span>
            <div className="text-lg font-black">{currentUser.fullName} ({currentUser.username})</div>
            <span className="text-xs text-purple-200/80">
              {currentUser.role === 'admin'
                ? 'مدير النظام (كامل الصلاحيات)'
                : currentUser.role === 'accountant'
                ? 'محاسب مالي'
                : 'كاشير / مدخل فواتير'}
            </span>
          </div>
        </div>

        <div className="text-xs text-purple-200 bg-white/10 px-3.5 py-2 rounded-xl">
          💡 يمكنك النقر على زر "دخول بهذا الحساب" لأي مستخدم أدناه لاختبار الصلاحيات مباشرة
        </div>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((u) => {
          const isCurrent = currentUser.id === u.id;
          const p = u.permissions;

          return (
            <div
              key={u.id}
              className={`bg-white rounded-2xl border shadow-2xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow ${
                isCurrent ? 'border-purple-400 ring-2 ring-purple-100' : 'border-slate-200'
              }`}
            >
              <div className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center font-bold text-base">
                      {u.fullName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">{u.fullName}</h3>
                      <span className="text-xs text-slate-400 font-mono">@{u.username}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(u)}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                      title="تعديل الصلاحيات"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {!isCurrent && (
                      <button
                        onClick={() => handleDelete(u)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                        title="حذف المستخدم"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                      u.role === 'admin'
                        ? 'bg-purple-100 text-purple-800'
                        : u.role === 'accountant'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {u.role === 'admin' ? 'مدير عام' : u.role === 'accountant' ? 'محاسب' : 'كاشير'}
                  </span>
                  {isCurrent && (
                    <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5" /> مسجل دخوله حالياً
                    </span>
                  )}
                </div>

                {/* Permissions Badges */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <span className="text-[11px] font-bold text-slate-500 block">الصلاحيات والمهام:</span>
                  <div className="flex flex-wrap gap-1.5 text-[10px]">
                    <span
                      className={`px-2 py-0.5 rounded-md ${
                        p.canManageInvoices ? 'bg-emerald-100 text-emerald-800 font-bold' : 'bg-slate-200 text-slate-400 line-through'
                      }`}
                    >
                      الفواتير الورقية
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md ${
                        p.canManageVouchers ? 'bg-emerald-100 text-emerald-800 font-bold' : 'bg-slate-200 text-slate-400 line-through'
                      }`}
                    >
                      سندات القبض/الصرف
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md ${
                        p.canManageTreasuries ? 'bg-blue-100 text-blue-800 font-bold' : 'bg-slate-200 text-slate-400 line-through'
                      }`}
                    >
                      الخزائن والسيولة
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md ${
                        p.canViewProfitAndLoss ? 'bg-purple-100 text-purple-800 font-bold' : 'bg-rose-100 text-rose-700 font-bold'
                      }`}
                      title={p.canViewProfitAndLoss ? 'مسموح برؤية الأرباح' : 'محجوبة الأرباح'}
                    >
                      {p.canViewProfitAndLoss ? 'رؤية الأرباح' : 'حجب الأرباح 🔒'}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md ${
                        p.canViewEmployeeFinancials ? 'bg-amber-100 text-amber-800 font-bold' : 'bg-rose-100 text-rose-700 font-bold'
                      }`}
                    >
                      {p.canViewEmployeeFinancials ? 'رواتب الموظفين' : 'حجب الرواتب 🔒'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom switch user action */}
              <div className="p-3 bg-slate-50/80 border-t border-slate-100 flex justify-between items-center text-xs">
                {!isCurrent ? (
                  <button
                    onClick={() => {
                      setCurrentUser(u);
                      addToast('success', `تم التحويل إلى المستخدم: ${u.fullName}`);
                    }}
                    className="w-full py-1.5 bg-white hover:bg-purple-50 text-purple-700 border border-purple-200 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>تسجيل الدخول بهذا الحساب</span>
                  </button>
                ) : (
                  <span className="text-[11px] font-bold text-slate-400 text-center w-full">
                    الحساب النشط المعتمد
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900">
                    {userToEdit ? 'تعديل المستخدم والصلاحيات' : 'إضافة مستخدم جديد للنظام'}
                  </h2>
                  <p className="text-xs text-slate-500">تحديد الأدوار والمهام وحجب البيانات الحساسة</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    اسم المستخدم (لتسجيل الدخول) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="مثال: cashier1, ahmed"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    الاسم الكامل للمستخدم <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="مثال: أحمد عبد الله"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold"
                    required
                  />
                </div>
              </div>

              {/* Password field */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  كلمة المرور لتأمين حساب المستخدم <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="أدخل كلمة مرور (مثال: 123)"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 font-mono font-bold"
                    required
                  />
                  <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">تستخدم لقفل النظام وفتح الجلسة الخاصة بهذا المستخدم</p>
              </div>

              {/* Role Preset */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">الدور الوظيفي الرئيسي:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleRolePreset('admin')}
                    className={`py-2 px-2 rounded-xl font-bold text-xs border transition-all ${
                      role === 'admin'
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    مدير عام (Admin)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRolePreset('accountant')}
                    className={`py-2 px-2 rounded-xl font-bold text-xs border transition-all ${
                      role === 'accountant'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    محاسب (Accountant)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRolePreset('cashier')}
                    className={`py-2 px-2 rounded-xl font-bold text-xs border transition-all ${
                      role === 'cashier'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    كاشير (Cashier)
                  </button>
                </div>
              </div>

              {/* Granular Checkboxes */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <span className="block text-xs font-extrabold text-slate-800">
                  تحديد الصلاحيات الدقيقة المتاحة للمستخدم:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-white border border-slate-200">
                    <input
                      type="checkbox"
                      checked={permissions.canManageInvoices}
                      onChange={(e) => setPermissions({ ...permissions, canManageInvoices: e.target.checked })}
                      className="rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span>إدخال وتعديل الفواتير الورقية</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-white border border-slate-200">
                    <input
                      type="checkbox"
                      checked={permissions.canManageVouchers}
                      onChange={(e) => setPermissions({ ...permissions, canManageVouchers: e.target.checked })}
                      className="rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span>إصدار سندات القبض والصرف</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-white border border-slate-200">
                    <input
                      type="checkbox"
                      checked={permissions.canManageTreasuries}
                      onChange={(e) => setPermissions({ ...permissions, canManageTreasuries: e.target.checked })}
                      className="rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span>إدارة الخزائن والمصارف والسيولة</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-white border border-slate-200">
                    <input
                      type="checkbox"
                      checked={permissions.canManageParties}
                      onChange={(e) => setPermissions({ ...permissions, canManageParties: e.target.checked })}
                      className="rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span>إدارة بطاقات العملاء والموردين</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-white border border-slate-200">
                    <input
                      type="checkbox"
                      checked={permissions.canManageEmployees}
                      onChange={(e) => setPermissions({ ...permissions, canManageEmployees: e.target.checked })}
                      className="rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span>إدارة الموظفين والسلف</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-white border border-slate-200">
                    <input
                      type="checkbox"
                      checked={permissions.canViewReports}
                      onChange={(e) => setPermissions({ ...permissions, canViewReports: e.target.checked })}
                      className="rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span>الاطلاع على التقارير العامة</span>
                  </label>
                </div>

                {/* Sensitive Permissions Box */}
                <div className="pt-2 border-t border-slate-200 space-y-2">
                  <span className="block text-[11px] font-bold text-rose-800">
                    ⚠️ الصلاحيات الحساسة (يجب تقييدها عن الكاشير والموظفين العاديين):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-rose-50/60 border border-rose-200">
                      <input
                        type="checkbox"
                        checked={permissions.canViewProfitAndLoss}
                        onChange={(e) =>
                          setPermissions({ ...permissions, canViewProfitAndLoss: e.target.checked })
                        }
                        className="rounded text-rose-600 focus:ring-rose-500"
                      />
                      <span className="font-bold text-rose-900">الاطلاع على الأرباح والخسائر</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-rose-50/60 border border-rose-200">
                      <input
                        type="checkbox"
                        checked={permissions.canViewEmployeeFinancials}
                        onChange={(e) =>
                          setPermissions({ ...permissions, canViewEmployeeFinancials: e.target.checked })
                        }
                        className="rounded text-rose-600 focus:ring-rose-500"
                      />
                      <span className="font-bold text-rose-900">تفاصيل رواتب وسلف الموظفين</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-rose-50/60 border border-rose-200">
                      <input
                        type="checkbox"
                        checked={permissions.canManageUsers}
                        onChange={(e) => setPermissions({ ...permissions, canManageUsers: e.target.checked })}
                        className="rounded text-rose-600 focus:ring-rose-500"
                      />
                      <span className="font-bold text-rose-900">إدارة المستخدمين والصلاحيات</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-rose-50/60 border border-rose-200">
                      <input
                        type="checkbox"
                        checked={permissions.canExportBackup}
                        onChange={(e) => setPermissions({ ...permissions, canExportBackup: e.target.checked })}
                        className="rounded text-rose-600 focus:ring-rose-500"
                      />
                      <span className="font-bold text-rose-900">النسخ الاحتياطي وتصدير البيانات</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{userToEdit ? 'تحديث المستخدم' : 'حفظ المستخدم'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
