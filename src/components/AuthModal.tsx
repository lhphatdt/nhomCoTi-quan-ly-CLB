import React, { useState } from 'react';
import {
  LogIn,
  UserPlus,
  Shield,
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
  GraduationCap,
  Lock,
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
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
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
  const [registerErrors, setRegisterErrors] = useState<Record<string, string>>({});
  const [registerSuccess, setRegisterSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle Login submission
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const result = authenticateUser(loginIdentifier, loginPassword, authUsers);
    if (result.success && result.user) {
      onLoginSuccess(result.user);
      if (onClose) onClose();
    } else {
      setLoginError(result.error || 'Đăng nhập không thành công.');
    }
  };

  // Quick 1-Click login for faculty/reviewers
  const handleQuickLogin = (user: AuthUser) => {
    onLoginSuccess(user);
    if (onClose) onClose();
  };

  // Handle Registration submission
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterErrors({});
    setRegisterSuccess(null);

    const validation = validateRegistration(registerData, authUsers);
    if (!validation.isValid) {
      setRegisterErrors(validation.errors);
      return;
    }

    const newUser: AuthUser = {
      id: `user-${Date.now()}`,
      mssv: registerData.mssv.trim().toUpperCase(),
      fullName: registerData.fullName.trim(),
      email: registerData.email.trim().toLowerCase(),
      phone: registerData.phone.trim(),
      department: registerData.department,
      role: 'member',
      roleTitle: `Thành viên (${registerData.department})`,
      status: 'official',
      password: registerData.password,
    };

    onRegisterNewUser(newUser);
    setRegisterSuccess('Đăng ký tài khoản thành công! Đang tự động đăng nhập...');

    setTimeout(() => {
      onLoginSuccess(newUser);
      if (onClose) onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8">
        {/* Top decorative gradient */}
        <div className="h-2 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400" />

        {/* Header */}
        <div className="p-6 sm:p-8 border-b border-slate-800/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  UniClub Hub Authentication
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    RBAC Gate
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Hệ thống phân quyền quản lý CLB Sinh viên & Chứng chỉ CI/CD
                </p>
              </div>
            </div>

            {!isMandatory && onClose ? (
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
                title="Đóng"
              >
                ✕
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Bắt buộc đăng nhập</span>
              </span>
            )}
          </div>

          {/* Mode Switch Tabs */}
          <div className="grid grid-cols-2 gap-2 mt-6 p-1 bg-slate-950 rounded-2xl border border-slate-800/60">
            <button
              onClick={() => {
                setMode('login');
                setLoginError(null);
              }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                mode === 'login'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LogIn className="w-4 h-4" />
              Đăng nhập tài khoản
            </button>
            <button
              onClick={() => {
                setMode('register');
                setRegisterErrors({});
              }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                mode === 'register'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              Đăng ký thành viên
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8">
          {mode === 'login' ? (
            <div className="space-y-6">
              {onGoogleSignIn && (
                <button
                  type="button"
                  onClick={() => onGoogleSignIn()}
                  className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-800 transition-all cursor-pointer shadow-md"
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
                <div className="relative flex items-center justify-center my-2">
                  <div className="border-t border-slate-800 w-full" />
                  <span className="bg-slate-900 px-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    Hoặc đăng nhập sinh viên
                  </span>
                </div>
              )}

              {loginError && (
                <div className="flex items-start gap-3 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Mã số sinh viên (MSSV) hoặc Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder="VD: B21DCCN001 hoặc an.nguyen@university.edu.vn"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      Mật khẩu
                    </label>
                    <span className="text-[11px] text-slate-500">Mặc định: [role]123</span>
                  </div>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Nhập mật khẩu..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition-all mt-2"
                >
                  <LogIn className="w-4 h-4" />
                  Đăng nhập vào Hệ thống
                </button>
              </form>

              {/* 1-Click Fast Login Box (Extremely helpful for demo & grading) */}
              <div className="pt-5 border-t border-slate-800/80">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-300 mb-3">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Đăng nhập nhanh 1-Click (Dành cho Giảng viên & Hội đồng):</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {authUsers.map((u) => {
                    const roleColor =
                      u.role === 'admin'
                        ? 'border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10 text-purple-300'
                        : u.role === 'treasurer'
                        ? 'border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-300'
                        : u.role === 'event_lead'
                        ? 'border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 text-amber-300'
                        : 'border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 text-blue-300';

                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => handleQuickLogin(u)}
                        className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${roleColor}`}
                      >
                        <div className="truncate">
                          <div className="text-xs font-bold truncate text-white">{u.fullName}</div>
                          <div className="text-[11px] opacity-80 truncate">{u.roleTitle}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">MSSV: {u.mssv}</div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 shrink-0 opacity-60 ml-2" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* Registration Form */
            <div className="space-y-5">
              {registerSuccess && (
                <div className="flex items-center gap-3 p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-xs">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{registerSuccess}</span>
                </div>
              )}

              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Họ và tên sinh viên *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        required
                        value={registerData.fullName}
                        onChange={(e) =>
                          setRegisterData({ ...registerData, fullName: e.target.value })
                        }
                        placeholder="Nguyễn Văn Nam"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    {registerErrors.fullName && (
                      <p className="text-[11px] text-rose-400 mt-1">{registerErrors.fullName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Mã số sinh viên (MSSV) *
                    </label>
                    <input
                      type="text"
                      required
                      value={registerData.mssv}
                      onChange={(e) =>
                        setRegisterData({ ...registerData, mssv: e.target.value.toUpperCase() })
                      }
                      placeholder="B23DCCN999"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 uppercase font-mono"
                    />
                    {registerErrors.mssv && (
                      <p className="text-[11px] text-rose-400 mt-1">{registerErrors.mssv}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Email sinh viên *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="email"
                        required
                        value={registerData.email}
                        onChange={(e) =>
                          setRegisterData({ ...registerData, email: e.target.value })
                        }
                        placeholder="nam.nguyen@university.edu.vn"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    {registerErrors.email && (
                      <p className="text-[11px] text-rose-400 mt-1">{registerErrors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Số điện thoại liên hệ *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="tel"
                        required
                        value={registerData.phone}
                        onChange={(e) =>
                          setRegisterData({ ...registerData, phone: e.target.value })
                        }
                        placeholder="0912345678"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    {registerErrors.phone && (
                      <p className="text-[11px] text-rose-400 mt-1">{registerErrors.phone}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nguyện vọng đăng ký vào Ban chuyên môn *
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <select
                      value={registerData.department}
                      onChange={(e) =>
                        setRegisterData({
                          ...registerData,
                          department: e.target.value as Department,
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="Ban Chuyên môn">Ban Chuyên môn (Lập trình, Nghiên cứu, Thi đấu)</option>
                      <option value="Ban Truyền thông">Ban Truyền thông (Thiết kế, Content, Fanpage)</option>
                      <option value="Ban Sự kiện">Ban Sự kiện (Tổ chức Workshop, Teambuilding)</option>
                      <option value="Ban Đối ngoại - Hậu cần">Ban Đối ngoại - Hậu cần (Tài trợ, Mua sắm)</option>
                      <option value="Ban Chủ nhiệm">Ban Chủ nhiệm (Ban Cố vấn, Quản trị)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Mật khẩu (tối thiểu 6 ký tự) *
                    </label>
                    <input
                      type="password"
                      required
                      value={registerData.password}
                      onChange={(e) =>
                        setRegisterData({ ...registerData, password: e.target.value })
                      }
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                    {registerErrors.password && (
                      <p className="text-[11px] text-rose-400 mt-1">{registerErrors.password}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Xác nhận mật khẩu *
                    </label>
                    <input
                      type="password"
                      required
                      value={registerData.confirmPassword}
                      onChange={(e) =>
                        setRegisterData({ ...registerData, confirmPassword: e.target.value })
                      }
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                    {registerErrors.confirmPassword && (
                      <p className="text-[11px] text-rose-400 mt-1">
                        {registerErrors.confirmPassword}
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-[11px] text-slate-400 flex items-start gap-2">
                  <Shield className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <span>
                    Bằng việc nhấn Đăng ký, bạn cam kết tuân thủ Điều lệ Hoạt động và Nội quy Quản lý Tài chính CLB Sinh viên UniClub Hub.
                  </span>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition-all"
                >
                  <UserPlus className="w-4 h-4" />
                  Hoàn tất Đăng ký & Kích hoạt Tài khoản
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
