import React, { useState } from 'react';
import {
  UserPlus,
  Mail,
  KeyRound,
  User,
  Phone,
  Building2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowLeft,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { AuthUser, Department, RegisterFormData } from '../types.ts';
import { validateRegistration } from '../domain/clubLogic.ts';

interface RegisterPageProps {
  authUsers: AuthUser[];
  onRegisterNewUser: (newUser: AuthUser) => void;
  onNavigateToLogin: () => void;
}

const DEPARTMENTS: Department[] = [
  'Ban Chuyên môn',
  'Ban Truyền thông',
  'Ban Sự kiện',
  'Ban Đối ngoại - Hậu cần',
];

export const RegisterPage: React.FC<RegisterPageProps> = ({
  authUsers,
  onRegisterNewUser,
  onNavigateToLogin,
}) => {
  const [formData, setFormData] = useState<RegisterFormData>({
    fullName: '',
    mssv: '',
    email: '',
    phone: '',
    department: 'Ban Chuyên môn',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // 1. Basic format and security check via domain logic
    const validation = validateRegistration(formData, authUsers);
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0];
      setErrorMsg(firstError || 'Dữ liệu đăng ký không hợp lệ.');
      return;
    }

    // 2. Prevent duplicate email in existing auth users
    const emailNormalized = formData.email.trim().toLowerCase();
    const isEmailTaken = authUsers.some(
      (u) => u.email.trim().toLowerCase() === emailNormalized
    );
    if (isEmailTaken) {
      setErrorMsg(`Email "${formData.email}" đã tồn tại trên hệ thống. Vui lòng sử dụng email khác hoặc đăng nhập!`);
      return;
    }

    // 3. Prevent duplicate MSSV
    const mssvNormalized = formData.mssv.trim().toUpperCase();
    const isMssvTaken = authUsers.some(
      (u) => u.mssv.trim().toUpperCase() === mssvNormalized
    );
    if (isMssvTaken) {
      setErrorMsg(`Mã số sinh viên "${formData.mssv}" đã được đăng ký tài khoản!`);
      return;
    }

    // 4. Enforce member role security (never permit self-registering as admin or lead)
    setIsLoading(true);
    setTimeout(() => {
      const newUser: AuthUser = {
        id: `user-${Date.now()}`,
        mssv: mssvNormalized,
        fullName: formData.fullName.trim(),
        email: emailNormalized,
        phone: formData.phone.trim(),
        department: formData.department,
        role: 'member', // Enforced: Cannot self-assign admin/treasurer
        roleTitle: 'Hội viên mới',
        status: 'official',
        password: formData.password,
      };

      onRegisterNewUser(newUser);
      setIsLoading(false);
      setSuccessMsg('Đăng ký tài khoản thành công! Bạn có thể sử dụng thông tin này để đăng nhập ngay.');

      // Clear sensitive fields
      setFormData((prev) => ({
        ...prev,
        password: '',
        confirmPassword: '',
      }));
    }, 300);
  };

  return (
    <div className="w-full min-h-[calc(100vh-12rem)] flex items-center justify-center py-6 px-3">
      <div className="w-full max-w-5xl bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* LEFT COLUMN: GUIDELINES & CLUB COMMITMENT */}
        <div className="lg:col-span-5 bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-15 pointer-events-none bg-cover bg-center"
            style={{ backgroundImage: "url('/assets/aistudio/khung_nen_f08530c3.jpg')" }}
          />
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-indigo-500/20 blur-3xl" />

          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-3">
              <img
                src="/assets/aistudio/logo_23f94b54.jpg"
                alt="UniClub Logo"
                className="w-12 h-12 rounded-2xl object-cover ring-2 ring-white/30 shadow-md"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
              <div>
                <h1 className="text-xl font-extrabold tracking-tight text-white">UniClub Hub</h1>
                <p className="text-xs text-indigo-200">Gia Nhập Cộng Đồng Sinh Viên Sáng Tạo</p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Quy trình Đăng ký Minh bạch & Tự động</span>
              </span>
              <h2 className="text-2xl font-bold text-white leading-snug">
                Trở thành một phần của UniClub hôm nay
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                Khi đăng ký thành công, bạn sẽ được cấp quyền truy cập tài nguyên câu lạc bộ, tham gia các buổi Workshop chuyên sâu, dự thi Hackathon và tích lũy điểm rèn luyện sinh viên.
              </p>
            </div>

            {/* SECURITY & RULES BULLETS */}
            <div className="space-y-3 pt-3 border-t border-slate-700/60">
              <div className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <span>Chính sách Bảo mật & Phân quyền:</span>
              </div>
              <ul className="text-xs text-slate-300 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <span>Tài khoản mới đăng ký tự động được phân vai trò <strong>Hội viên</strong>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                  <span>Vai trò Ban Chủ nhiệm và Thủ quỹ chỉ được bổ nhiệm bởi Hội đồng quản trị.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  <span>Email và MSSV được kiểm tra duy nhất trên hệ thống Cloud Firestore.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* BACK TO LOGIN BUTTON ON THE SIDEBAR */}
          <div className="relative z-10 mt-8 pt-6 border-t border-slate-800">
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all border border-white/15 flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Đã có tài khoản? Quay lại Đăng nhập</span>
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: DEDICATED REGISTRATION FORM */}
        <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-center bg-white">
          <div className="max-w-md mx-auto w-full">
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-2">
                <UserPlus className="w-3.5 h-3.5" />
                <span>Trang Đăng Ký Tài Khoản</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Tạo tài khoản thành viên
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Điền đầy đủ thông tin bên dưới để đăng ký gia nhập câu lạc bộ
              </p>
            </div>

            {/* ERROR ALERT */}
            {errorMsg && (
              <div className="mb-5 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3 animate-shake">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-rose-900">Không thể đăng ký</div>
                  <div className="text-xs text-rose-700 mt-0.5">{errorMsg}</div>
                </div>
              </div>
            )}

            {/* SUCCESS ALERT */}
            {successMsg && (
              <div className="mb-5 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-bold text-emerald-900">Chúc mừng bạn!</div>
                  <div className="text-xs text-emerald-700 mt-0.5">{successMsg}</div>
                  <button
                    type="button"
                    onClick={onNavigateToLogin}
                    className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs"
                  >
                    <span>Chuyển sang trang Đăng nhập</span>
                    <ArrowLeft className="w-3 h-3 rotate-180" />
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* FULL NAME */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Họ và tên sinh viên <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="VD: Lê Hữu Phát"
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* MSSV & PHONE (2 COLUMNS) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Mã số sinh viên (MSSV) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.mssv}
                    onChange={(e) => setFormData({ ...formData, mssv: e.target.value })}
                    placeholder="VD: B24DCCN999"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-mono uppercase focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Số điện thoại / Zalo <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Phone className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="0912345678"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </div>

              {/* EMAIL */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Email sinh viên <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="VD: phat.le@university.edu.vn"
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* DEPARTMENT SELECTION */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Nguyện vọng Ban chuyên môn <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value as Department })}
                    className="w-full pl-10 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* PASSWORD & CONFIRM PASSWORD (2 COLUMNS) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Mật khẩu (≥ 6 ký tự) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Tối thiểu 6 ký tự"
                      className="w-full px-3 py-2 pr-9 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Xác nhận mật khẩu <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      placeholder="Nhập lại mật khẩu"
                      className="w-full px-3 py-2 pr-9 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700"
                    >
                      {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-3 py-3 px-4 rounded-xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang khởi tạo tài khoản...</span>
                  </span>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Hoàn tất Đăng ký Hội viên</span>
                  </>
                )}
              </button>
            </form>

            {/* SWITCH TO LOGIN LINK */}
            <div className="mt-6 pt-5 border-t border-slate-100 text-center">
              <p className="text-sm text-slate-600">
                Đã có tài khoản sinh viên?{' '}
                <button
                  type="button"
                  onClick={onNavigateToLogin}
                  className="font-bold text-indigo-600 hover:text-indigo-700 hover:underline inline-flex items-center gap-1 transition-colors ml-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Quay lại Đăng nhập</span>
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
