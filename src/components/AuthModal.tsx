import React, { useState } from 'react';
import {
  LogIn,
  UserPlus,
  KeyRound,
  Mail,
  User,
  Phone,
  Building2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Lock,
  X,
} from 'lucide-react';
import { AuthUser, Department, RegisterFormData, UserRole } from '../types.ts';
import { authenticateUser, validateRegistration } from '../domain/clubLogic.ts';

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onLoginSuccess: (user: AuthUser) => void;
  authUsers: AuthUser[];
  onRegisterNewUser: (newUser: AuthUser) => void;
  isMandatory?: boolean; // if true, cannot close without logging in
  onGoogleSignIn?: () => Promise<void> | void;
}

const REGISTRATION_DEPARTMENTS: Department[] = [
  'Ban Chuyên môn',
  'Ban Truyền thông',
  'Ban Sự kiện',
  'Ban Đối ngoại - Hậu cần',
];

export function AuthModal({
  isOpen,
  onClose,
  onLoginSuccess,
  authUsers,
  onRegisterNewUser,
  isMandatory = false,
  onGoogleSignIn,
}: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('B21DCCN001');
  const [loginPassword, setLoginPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Register form state
  const [registerData, setRegisterData] = useState<RegisterFormData>({
    fullName: '',
    mssv: '',
    email: '',
    phone: '',
    department: 'Ban Chuyên môn',
    password: '',
    confirmPassword: '',
  });
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirm, setShowRegisterConfirm] = useState(false);
  const [registerErrors, setRegisterErrors] = useState<Record<string, string>>({});
  const [registerSuccess, setRegisterSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const res = authenticateUser(loginIdentifier, loginPassword, authUsers);
    if (res.success && res.user) {
      onLoginSuccess(res.user);
    } else {
      setLoginError(res.error || 'Thông tin đăng nhập không chính xác');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterErrors({});
    setRegisterSuccess(null);

    const validation = validateRegistration(registerData, authUsers);
    if (!validation.isValid) {
      setRegisterErrors(validation.errors);
      return;
    }

    // Check duplicate email
    const emailNorm = registerData.email.trim().toLowerCase();
    if (authUsers.some((u) => u.email.trim().toLowerCase() === emailNorm)) {
      setRegisterErrors({ email: 'Email này đã được sử dụng. Vui lòng đăng nhập!' });
      return;
    }

    // Check duplicate MSSV
    const mssvNorm = registerData.mssv.trim().toUpperCase();
    if (authUsers.some((u) => u.mssv.trim().toUpperCase() === mssvNorm)) {
      setRegisterErrors({ mssv: 'Mã số sinh viên này đã có tài khoản trên hệ thống!' });
      return;
    }

    // Create new member user (Strictly enforced role = member, cannot self-register admin)
    const newUser: AuthUser = {
      id: `user-${Date.now()}`,
      mssv: mssvNorm,
      fullName: registerData.fullName.trim(),
      email: emailNorm,
      phone: registerData.phone.trim(),
      department: registerData.department,
      role: 'member',
      roleTitle: 'Ứng viên (Chờ phân quyền)',
      status: 'pending',
      password: registerData.password,
    };

    onRegisterNewUser(newUser);
    setRegisterSuccess('Đăng ký thành công! Hồ sơ đã được đưa vào bảng nhân sự và đang chờ Chủ nhiệm phân quyền.');
    setRegisterData({
      fullName: '',
      mssv: '',
      email: '',
      phone: '',
      department: 'Ban Chuyên môn',
      password: '',
      confirmPassword: '',
    });
  };

  const handleQuickLogin = (user: AuthUser) => {
    onLoginSuccess(user);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-8 animate-in fade-in duration-200">
        {/* Top decorative gradient */}
        <div className="h-1.5 w-full bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-500" />

        {/* Header */}
        <div className="p-6 sm:p-7 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/assets/uniclub-logo.png"
                alt="UniClub Logo"
                className="w-11 h-11 rounded-2xl object-contain bg-white p-0.5 ring-1 ring-slate-200 shadow-sm"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  UniClub Hub Authentication
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    RBAC Gate
                  </span>
                </h2>
                <p className="text-xs text-slate-500">
                  Hệ thống phân quyền quản lý CLB Sinh viên & Chứng chỉ CI/CD
                </p>
              </div>
            </div>

            {!isMandatory && onClose ? (
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition-colors"
                title="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                <Lock className="w-3 h-3 text-amber-600" />
                <span>Bắt buộc</span>
              </span>
            )}
          </div>

          {/* Mode Switch Tabs */}
          <div className="grid grid-cols-2 gap-2 mt-5 p-1 bg-slate-100 rounded-2xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setLoginError(null);
              }}
              className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
                mode === 'login'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Đăng nhập tài khoản</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setRegisterErrors({});
              }}
              className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
                mode === 'register'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Đăng ký thành viên</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-7 max-h-[calc(85vh-12rem)] overflow-y-auto">
          {mode === 'login' ? (
            <div className="space-y-5">
              {onGoogleSignIn && (
                <button
                  type="button"
                  onClick={() => onGoogleSignIn()}
                  className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 transition-all cursor-pointer shadow-xs"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Đăng nhập với Google (Firebase Auth)</span>
                </button>
              )}

              {onGoogleSignIn && (
                <div className="relative flex items-center justify-center my-1">
                  <div className="border-t border-slate-200 w-full" />
                  <span className="bg-white px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Hoặc đăng nhập sinh viên
                  </span>
                </div>
              )}

              {loginError && (
                <div className="flex items-start gap-2.5 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Mã số sinh viên (MSSV) hoặc Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder="VD: B21DCCN001 hoặc phat.le@university.edu.vn"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Mật khẩu
                    </label>
                    <span className="text-[11px] text-slate-500 font-mono">admin123</span>
                  </div>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Nhập mật khẩu..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-10 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition-all mt-2 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Đăng nhập vào Hệ thống</span>
                </button>
              </form>

              {/* 1-Click Fast Login Box */}
              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Đăng nhập nhanh mẫu (Kiểm thử vai trò):</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {authUsers.slice(0, 4).map((u) => {
                    const roleColor =
                      u.role === 'admin'
                        ? 'border-purple-200 bg-purple-50 text-purple-900 hover:bg-purple-100'
                        : u.role === 'treasurer'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100'
                        : u.role === 'event_lead'
                        ? 'border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100'
                        : 'border-blue-200 bg-blue-50 text-blue-900 hover:bg-blue-100';

                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => handleQuickLogin(u)}
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${roleColor}`}
                      >
                        <div className="truncate">
                          <div className="text-xs font-bold truncate">{u.fullName}</div>
                          <div className="text-[10px] opacity-80 truncate">{u.roleTitle}</div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 shrink-0 opacity-60 ml-1" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* Registration Form */
            <div className="space-y-4">
              {registerSuccess && (
                <div className="flex items-center gap-2.5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{registerSuccess}</span>
                </div>
              )}

              {registerErrors.general && (
                <div className="flex items-center gap-2.5 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{registerErrors.general}</span>
                </div>
              )}

              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Họ và tên *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={registerData.fullName}
                        onChange={(e) => setRegisterData({ ...registerData, fullName: e.target.value })}
                        placeholder="Nguyễn Văn Nam"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      MSSV *
                    </label>
                    <input
                      type="text"
                      required
                      value={registerData.mssv}
                      onChange={(e) => setRegisterData({ ...registerData, mssv: e.target.value.toUpperCase() })}
                      placeholder="B23DCCN999"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 uppercase font-mono focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    {registerErrors.mssv && (
                      <p className="text-[10px] text-rose-600 mt-0.5">{registerErrors.mssv}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Email sinh viên *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={registerData.email}
                        onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                        placeholder="nam.nguyen@university.edu.vn"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    {registerErrors.email && (
                      <p className="text-[10px] text-rose-600 mt-0.5">{registerErrors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Số điện thoại *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="tel"
                        required
                        value={registerData.phone}
                        onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                        placeholder="0912345678"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Nguyện vọng Ban chuyên môn *
                  </label>
                  <select
                    value={registerData.department}
                    onChange={(e) => setRegisterData({ ...registerData, department: e.target.value as Department })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {REGISTRATION_DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Mật khẩu (≥ 6 ký tự) *
                    </label>
                    <div className="relative">
                      <input
                        type={showRegisterPassword ? 'text' : 'password'}
                        required
                        value={registerData.password}
                        onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                        placeholder="Tối thiểu 6 ký tự"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 pr-8 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showRegisterPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Xác nhận mật khẩu *
                    </label>
                    <div className="relative">
                      <input
                        type={showRegisterConfirm ? 'text' : 'password'}
                        required
                        value={registerData.confirmPassword}
                        onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                        placeholder="Nhập lại mật khẩu"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 pr-8 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegisterConfirm(!showRegisterConfirm)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showRegisterConfirm ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition-all mt-3 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Xác nhận Đăng ký Hội viên</span>
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
