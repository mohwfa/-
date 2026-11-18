import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Lock, Key, Shield, UserCheck, Eye, EyeOff, Building, ArrowRight } from 'lucide-react';

export const LockScreen: React.FC = () => {
  const { isLocked, currentUser, users, unlockSystem, switchUserWithPassword, settings } = useApp();

  const [password, setPassword] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(currentUser.id);
  const [showPassword, setShowPassword] = useState(false);
  const [isSwitchingUser, setIsSwitchingUser] = useState(false);

  if (!isLocked) return null;

  const targetUser = users.find((u) => u.id === selectedUserId) || currentUser;

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSwitchingUser) {
      const ok = switchUserWithPassword(selectedUserId, password);
      if (ok) {
        setPassword('');
        setIsSwitchingUser(false);
      }
    } else {
      const ok = unlockSystem(password);
      if (ok) {
        setPassword('');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in zoom-in-95">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-900 p-6 text-white text-center relative">
          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md mx-auto flex items-center justify-center text-emerald-400 mb-3 shadow-inner">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-black">{settings.companyName}</h2>
          <p className="text-xs text-slate-300 mt-1">المنظومة المالية مؤمنة بكلمة مرور</p>
        </div>

        {/* Content */}
        <form onSubmit={handleUnlock} className="p-6 space-y-5 text-xs sm:text-sm">
          {!isSwitchingUser ? (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-base">
                  {targetUser.fullName.charAt(0)}
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 font-bold block">المستخدم الحالي:</span>
                  <div className="font-extrabold text-slate-900 text-sm">{targetUser.fullName}</div>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {targetUser.role === 'admin'
                      ? 'مدير عام'
                      : targetUser.role === 'accountant'
                      ? 'محاسب'
                      : 'كاشير'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsSwitchingUser(true)}
                className="text-xs font-bold text-emerald-700 hover:underline"
              >
                تبديل المستخدم
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700">اختر المستخدم للدخول:</label>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedUserId(currentUser.id);
                    setIsSwitchingUser(false);
                  }}
                  className="text-xs text-slate-500 hover:underline"
                >
                  إلغاء التبديل
                </button>
              </div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {users.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => setSelectedUserId(u.id)}
                    className={`w-full text-right p-2.5 rounded-xl text-xs flex items-center justify-between border transition-all ${
                      selectedUserId === u.id
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-slate-200 flex items-center justify-center text-slate-700 font-bold">
                        {u.fullName.charAt(0)}
                      </div>
                      <span>{u.fullName}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {u.role === 'admin' ? 'مدير' : u.role === 'accountant' ? 'محاسب' : 'كاشير'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Password Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              كلمة مرور المستخدم ({targetUser.fullName}) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="أدخل كلمة المرور..."
                autoFocus
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-bold"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              (كلمة المرور الافتراضية التجريبية للمستخدمين هي: <code className="font-bold text-emerald-700">123</code>)
            </p>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm shadow-emerald-600/30 transition-all active:scale-95"
          >
            <Key className="w-4 h-4" />
            <span>فتح المنظومة ومتابعة العمل</span>
          </button>
        </form>
      </div>
    </div>
  );
};
