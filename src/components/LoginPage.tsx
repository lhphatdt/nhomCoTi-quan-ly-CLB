import React, { useState } from 'react';
import {
  LogIn,
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Lock,
  GraduationCap,
} from 'lucide-react';
import { AuthUser, UserRole } from '../types.ts';
import { authenticateUser } from '../domain/clubLogic.ts';

interface LoginPageProps {
  authUsers: AuthUser[];
  onLoginSuccess: (user: AuthUser) => void;
  onNavigateToRegister: () => void;
  onGoogleSignIn?: () => Promise<void> | void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  authUsers,
  onLoginSuccess,
  onNavigateToRegister,
  onGoogleSignIn,
}) => {
  const [identifier, setIdentifier] = useState('B21DCCN001');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const trimmedId = identifier.trim();
    if (!trimmedId) {
      setLoginError('Vui lòng nhập Email hoặc Mã số sinh viên (MSSV).');
      return;
    }
    if (!password) {
      setLoginError('Vui lòng nhập mật khẩu tài khoản.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const res = authenticateUser(trimmedId, password, authUsers);
      setIsLoading(false);

      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setLoginError(res.error || 'Thông tin đăng nhập không chính xác. Vui lòng kiểm tra lại!');
      }
    }, 250);
  };

  const handleQuickDemoLogin = (role: UserRole) => {
    const user = authUsers.find((u) => u.role === role);
    if (user) {
      onLoginSuccess(user);
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-12rem)] flex items-center justify-center py-6 px-3">
      <div className="w-full max-w-5xl bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* LEFT COLUMN: BRAND HERO WITH CAMPUS ASSETS */}
        <div className="lg:col-span-5 bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle graphic overlay */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none bg-cover bg-center"
            style={{ backgroundImage: "url('/assets/uniclub-background.jpg')" }}
          />
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-indigo-500/20 blur-3xl" />

          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-3">
              <img
                src="/assets/uniclub-logo.png"
                alt="UniClub Logo"
                className="w-12 h-12 rounded-2xl object-contain bg-white p-1 ring-2 ring-white/30 shadow-md"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
              <div>
                <h1 className="text-xl font-extrabold tracking-tight text-white">UniClub Hub</h1>
                <p className="text-xs text-indigo-200">Hệ thống Điều hành Câu lạc bộ Sinh viên</p>
              </div>
            </div>

            <div className="space-y-3 pt-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Bảo mật phân quyền RBAC & Database Realtime</span>
              </span>
              <h2 className="text-2xl font-bold text-white leading-snug">
                Chào mừng bạn trở lại với giảng đường UniClub
              </h2>
              <p className="text-sm text-indigo-100/90 leading-relaxed">
                Đăng nhập để theo dõi lịch trình sự kiện, tham gia hoạt động chuyên môn, đối soát sổ quỹ và điểm danh sinh hoạt câu lạc bộ.
              </p>
            </div>
          </div>

          {/* DEMO ACCOUNTS QUICK SHORTCUTS */}
          <div className="relative z-10 mt-8 pt-6 border-t border-indigo-700/50">
            <div className="text-xs font-semibold text-indigo-200 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Đăng nhập nhanh mẫu (Kiểm thử phân quyền):</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('admin')}
                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-left transition-all border border-white/10 flex flex-col"
              >
                <span className="font-bold">👑 Chủ nhiệm</span>
                <span className="text-[10px] text-indigo-200 truncate">B21DCCN001</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('treasurer')}
                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-left transition-all border border-white/10 flex flex-col"
              >
                <span className="font-bold">💰 Thủ quỹ</span>
                <span className="text-[10px] text-indigo-200 truncate">B22DCCN105</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('event_lead')}
                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-left transition-all border border-white/10 flex flex-col"
              >
                <span className="font-bold">🎪 Ban Sự kiện</span>
                <span className="text-[10px] text-indigo-200 truncate">B22DCCN518</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('member')}
                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-left transition-all border border-white/10 flex flex-col"
              >
                <span className="font-bold">👤 Hội viên</span>
                <span className="text-[10px] text-indigo-200 truncate">B23DCCN204</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: DEDICATED LOGIN FORM */}
        <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-center bg-white">
          <div className="max-w-md mx-auto w-full">
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 mb-3">
                <Lock className="w-3.5 h-3.5" />
                <span>Trang Đăng Nhập Hệ Thống</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Đăng nhập tài khoản
              </h2>
              <p className="text-sm text-slate-500 mt-1.5">
                Nhập Email hoặc Mã số sinh viên (MSSV) và mật khẩu đã được cấp
              </p>
            </div>

            {/* ERROR ALERT */}
            {loginError && (
              <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3 animate-shake">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-rose-900">Đăng nhập không thành công</div>
                  <div className="text-xs text-rose-700 mt-0.5">{loginError}</div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* IDENTIFIER FIELD */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Email hoặc Mã sinh viên (MSSV) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="VD: B21DCCN001 hoặc phat.le@university.edu.vn"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* PASSWORD FIELD WITH TOGGLE EYE */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Mật khẩu truy cập <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-xs text-slate-400">Mặc định test: <code className="font-mono text-indigo-600 font-bold">admin123</code></span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu..."
                    className="w-full pl-10 pr-11 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 transition-colors"
                    title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang kiểm tra...</span>
                  </span>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Đăng nhập hệ thống</span>
                  </>
                )}
              </button>
            </form>

            {/* GOOGLE SIGN IN OPTION */}
            {onGoogleSignIn && (
              <div className="mt-5">
                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink mx-4 text-xs uppercase tracking-wider text-slate-400 font-semibold">
                    hoặc tiếp tục với
                  </span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>

                <button
                  type="button"
                  onClick={onGoogleSignIn}
                  className="w-full mt-2 py-2.5 px-4 rounded-xl border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-800 text-sm font-semibold transition-all flex items-center justify-center gap-2.5 shadow-xs"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Đăng nhập với Google Sinh viên</span>
                </button>
              </div>
            )}

            {/* SWITCH TO REGISTER LINK */}
            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              <p className="text-sm text-slate-600">
                Chưa có tài khoản thành viên?{' '}
                <button
                  type="button"
                  onClick={onNavigateToRegister}
                  className="font-bold text-indigo-600 hover:text-indigo-700 hover:underline inline-flex items-center gap-1 transition-colors ml-1"
                >
                  <span>Đăng ký ngay</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
