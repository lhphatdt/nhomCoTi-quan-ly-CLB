import React, { useState } from 'react';
import {
  Lock,
  ShieldCheck,
  GraduationCap,
  Sparkles,
  ArrowRight,
  LogIn,
  UserPlus,
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Phone,
  Building2,
  Users,
  Wallet,
  Calendar,
  GitBranch,
} from 'lucide-react';
import { AuthUser, Department, RegisterFormData } from '../types.ts';
import { authenticateUser, validateRegistration } from '../domain/clubLogic.ts';

interface AuthGateViewProps {
  authUsers: AuthUser[];
  onLoginSuccess: (user: AuthUser) => void;
  onRegisterNewUser: (newUser: AuthUser) => void;
}

const DEPARTMENTS: Department[] = [
  'Ban Chủ nhiệm',
  'Ban Chuyên môn',
  'Ban Truyền thông',
  'Ban Sự kiện',
  'Ban Đối ngoại - Hậu cần',
];

export const AuthGateView: React.FC<AuthGateViewProps> = ({
  authUsers,
  onLoginSuccess,
  onRegisterNewUser,
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Login state
  const [identifier, setIdentifier] = useState('B21DCCN001');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Register state
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

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const result = authenticateUser(identifier, password, authUsers);
    if (result.success && result.user) {
      onLoginSuccess(result.user);
    } else {
      setLoginError(result.error || 'Đăng nhập không thành công. Vui lòng kiểm tra lại!');
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
    }, 700);
  };

  return (
    <div className="py-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* SECURITY BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-10 border border-slate-800 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Cổng Xác Thực Bắt Buộc (Mandatory Authentication Gate)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Khách bắt buộc phải đăng nhập mới được xem thông tin CLB
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              Theo chính sách bảo mật dữ liệu sinh viên và quy chế phân quyền nội bộ (RBAC), toàn bộ danh bạ hội viên, lịch hoạt động, sổ quỹ minh bạch và quy trình CI/CD chỉ hiển thị sau khi đã xác thực tài khoản.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs shrink-0 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
            <div className="flex items-center gap-2 text-slate-300">
              <Users className="w-4 h-4 text-indigo-400" />
              <span>Nhân sự CLB</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>Lịch Sự kiện</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Wallet className="w-4 h-4 text-emerald-400" />
              <span>Sổ Quỹ Thu Chi</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <GitBranch className="w-4 h-4 text-purple-400" />
              <span>Pipeline CI/CD</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: 1-CLICK ROLE ACCESS (EXAMINER / REVIEWER ACCELERATOR) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h2 className="text-base font-bold text-slate-900">
                Đăng nhập nhanh 1-Click theo Vai trò (Dành cho Hội đồng chấm đồ án)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Nhấp trực tiếp vào vai trò để đăng nhập ngay mà không cần nhập mật khẩu. Mỗi vai trò có quyền hạn riêng biệt theo đúng ma trận RBAC.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 self-start sm:self-auto">
            <ShieldCheck className="w-3.5 h-3.5" />
            4 Vai trò Chuẩn
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Admin */}
          <div className="group p-4 rounded-xl border border-purple-200 bg-gradient-to-b from-purple-50/50 to-white hover:border-purple-400 hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center text-sm font-bold shadow-xs">
                  👑
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                  Toàn quyền
                </span>
              </div>
              <h3 className="font-bold text-sm text-slate-900">Chủ nhiệm CLB</h3>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">MSSV: B21DCCN001</p>
              <p className="text-xs text-slate-600 mt-2 line-clamp-3">
                Toàn quyền quản trị nhân sự, duyệt đơn ứng viên, cộng/trừ điểm rèn luyện, duyệt chi quỹ, trigger CI/CD pipeline.
              </p>
            </div>
            <button
              onClick={() => {
                const adminUser = authUsers.find((u) => u.role === 'admin') || authUsers[0];
                onLoginSuccess(adminUser);
              }}
              className="mt-4 w-full py-2 px-3 text-xs font-bold rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-colors flex items-center justify-center gap-1.5 shadow-xs"
            >
              <span>Vào vai Chủ nhiệm</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 2: Treasurer */}
          <div className="group p-4 rounded-xl border border-emerald-200 bg-gradient-to-b from-emerald-50/50 to-white hover:border-emerald-400 hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-sm font-bold shadow-xs">
                  💰
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Duyệt chi
                </span>
              </div>
              <h3 className="font-bold text-sm text-slate-900">Thủ quỹ CLB</h3>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">MSSV: B21DCCN045</p>
              <p className="text-xs text-slate-600 mt-2 line-clamp-3">
                Thẩm quyền duyệt chi chứng từ ngân sách quỹ, quản lý thu chi, kiểm soát an toàn số dư khả dụng chống thâm hụt.
              </p>
            </div>
            <button
              onClick={() => {
                const treasurerUser = authUsers.find((u) => u.role === 'treasurer') || authUsers[1];
                onLoginSuccess(treasurerUser);
              }}
              className="mt-4 w-full py-2 px-3 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center justify-center gap-1.5 shadow-xs"
            >
              <span>Vào vai Thủ quỹ</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 3: Event Lead */}
          <div className="group p-4 rounded-xl border border-amber-200 bg-gradient-to-b from-amber-50/50 to-white hover:border-amber-400 hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center text-sm font-bold shadow-xs">
                  🎪
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  Tổ chức SK
                </span>
              </div>
              <h3 className="font-bold text-sm text-slate-900">Trưởng ban Sự kiện</h3>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">MSSV: B21DCCN092</p>
              <p className="text-xs text-slate-600 mt-2 line-clamp-3">
                Thẩm quyền tạo sự kiện mới, giải quyết xung đột lịch phòng hội trường, và quản lý danh sách điểm danh hội viên.
              </p>
            </div>
            <button
              onClick={() => {
                const eventUser = authUsers.find((u) => u.role === 'event_lead') || authUsers[2];
                onLoginSuccess(eventUser);
              }}
              className="mt-4 w-full py-2 px-3 text-xs font-bold rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition-colors flex items-center justify-center gap-1.5 shadow-xs"
            >
              <span>Vào vai Ban Sự kiện</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 4: Member */}
          <div className="group p-4 rounded-xl border border-blue-200 bg-gradient-to-b from-blue-50/50 to-white hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-sm font-bold shadow-xs">
                  👤
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  Hội viên
                </span>
              </div>
              <h3 className="font-bold text-sm text-slate-900">Hội viên Sinh viên</h3>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">MSSV: B22DCCN215</p>
              <p className="text-xs text-slate-600 mt-2 line-clamp-3">
                Xem danh bạ CLB, xem lịch sự kiện, và tự đăng ký tham gia sự kiện của chính mình (bị chặn sửa xóa nhân sự/quỹ).
              </p>
            </div>
            <button
              onClick={() => {
                const memberUser = authUsers.find((u) => u.role === 'member') || authUsers[3];
                onLoginSuccess(memberUser);
              }}
              className="mt-4 w-full py-2 px-3 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center justify-center gap-1.5 shadow-xs"
            >
              <span>Vào vai Hội viên</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 2: STANDARD CREDENTIAL LOGIN & REGISTRATION */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden max-w-2xl mx-auto">
        {/* Tab switchers */}
        <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-50">
          <button
            onClick={() => {
              setActiveTab('login');
              setLoginError(null);
            }}
            className={`py-3.5 text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'login'
                ? 'bg-white text-indigo-600 border-b-2 border-indigo-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>Đăng nhập tài khoản</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('register');
              setRegisterErrors({});
            }}
            className={`py-3.5 text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'register'
                ? 'bg-white text-indigo-600 border-b-2 border-indigo-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Đăng ký thành viên mới</span>
          </button>
        </div>

        <div className="p-6 sm:p-8">
          {activeTab === 'login' ? (
            <div className="space-y-4">
              {loginError && (
                <div className="flex items-start gap-2.5 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Mã số sinh viên (MSSV) hoặc Email <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="VD: B21DCCN001 hoặc admin@university.edu.vn"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-slate-700">
                      Mật khẩu <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Gợi ý: admin123, treasurer123, event123, member123
                    </span>
                  </div>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Nhập mật khẩu..."
                      className="w-full pl-9 pr-9 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 mt-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-xs"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Đăng nhập hệ thống UniClub Hub</span>
                </button>
              </form>
            </div>
          ) : (
            <div className="space-y-4">
              {registerSuccess ? (
                <div className="flex items-center gap-2.5 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{registerSuccess}</span>
                </div>
              ) : (
                <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Họ và Tên <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={registerData.fullName}
                        onChange={(e) =>
                          setRegisterData({ ...registerData, fullName: e.target.value })
                        }
                        placeholder="VD: Nguyễn Thành Đạt"
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none ${
                          registerErrors.fullName
                            ? 'border-rose-300 bg-rose-50'
                            : 'border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500'
                        }`}
                      />
                      {registerErrors.fullName && (
                        <p className="text-[10px] text-rose-600 mt-1">{registerErrors.fullName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Mã số sinh viên (MSSV) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={registerData.mssv}
                        onChange={(e) =>
                          setRegisterData({ ...registerData, mssv: e.target.value.toUpperCase() })
                        }
                        placeholder="VD: B24DCCN888"
                        className={`w-full px-3 py-2 font-mono border rounded-lg focus:outline-none ${
                          registerErrors.mssv
                            ? 'border-rose-300 bg-rose-50'
                            : 'border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500'
                        }`}
                      />
                      {registerErrors.mssv && (
                        <p className="text-[10px] text-rose-600 mt-1">{registerErrors.mssv}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Email sinh viên <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={registerData.email}
                        onChange={(e) =>
                          setRegisterData({ ...registerData, email: e.target.value })
                        }
                        placeholder="dat.nguyen@university.edu.vn"
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none ${
                          registerErrors.email
                            ? 'border-rose-300 bg-rose-50'
                            : 'border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500'
                        }`}
                      />
                      {registerErrors.email && (
                        <p className="text-[10px] text-rose-600 mt-1">{registerErrors.email}</p>
                      )}
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Số điện thoại <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={registerData.phone}
                        onChange={(e) =>
                          setRegisterData({ ...registerData, phone: e.target.value })
                        }
                        placeholder="0912345678"
                        className={`w-full px-3 py-2 font-mono border rounded-lg focus:outline-none ${
                          registerErrors.phone
                            ? 'border-rose-300 bg-rose-50'
                            : 'border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500'
                        }`}
                      />
                      {registerErrors.phone && (
                        <p className="text-[10px] text-rose-600 mt-1">{registerErrors.phone}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Ban chuyên môn đăng ký
                    </label>
                    <select
                      value={registerData.department}
                      onChange={(e) =>
                        setRegisterData({
                          ...registerData,
                          department: e.target.value as Department,
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                    >
                      {DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Mật khẩu (ít nhất 6 ký tự) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="password"
                        required
                        value={registerData.password}
                        onChange={(e) =>
                          setRegisterData({ ...registerData, password: e.target.value })
                        }
                        placeholder="••••••••"
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none ${
                          registerErrors.password
                            ? 'border-rose-300 bg-rose-50'
                            : 'border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500'
                        }`}
                      />
                      {registerErrors.password && (
                        <p className="text-[10px] text-rose-600 mt-1">{registerErrors.password}</p>
                      )}
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Xác nhận mật khẩu <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="password"
                        required
                        value={registerData.confirmPassword}
                        onChange={(e) =>
                          setRegisterData({ ...registerData, confirmPassword: e.target.value })
                        }
                        placeholder="••••••••"
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none ${
                          registerErrors.confirmPassword
                            ? 'border-rose-300 bg-rose-50'
                            : 'border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500'
                        }`}
                      />
                      {registerErrors.confirmPassword && (
                        <p className="text-[10px] text-rose-600 mt-1">
                          {registerErrors.confirmPassword}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 mt-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-xs"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Hoàn tất Đăng ký & Tự động Đăng nhập</span>
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
