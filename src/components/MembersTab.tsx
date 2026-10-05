import React, { useState, useMemo } from 'react';
import {
  Search,
  UserPlus,
  Trash2,
  CheckCircle,
  Award,
  Filter,
  AlertCircle,
  X,
  Sparkles,
  Phone,
  Mail,
  Building,
  Check,
} from 'lucide-react';
import { ClubMember, Department, MemberStatus } from '../types.ts';
import {
  validateStudentMember,
  classifyMemberActivity,
  formatDateTime,
} from '../domain/clubLogic.ts';

interface MembersTabProps {
  members: ClubMember[];
  onAddMember: (newMember: Omit<ClubMember, 'id'>) => void;
  onApproveMember: (id: string) => void;
  onAddScore: (id: string, points: number) => void;
  onDeleteMember: (id: string) => void;
}

const DEPARTMENTS: Department[] = [
  'Ban Chủ nhiệm',
  'Ban Chuyên môn',
  'Ban Truyền thông',
  'Ban Sự kiện',
  'Ban Đối ngoại - Hậu cần',
];

const DEPT_INITIALS: Record<Department, string> = {
  'Ban Chủ nhiệm': 'CN',
  'Ban Chuyên môn': 'CM',
  'Ban Truyền thông': 'TT',
  'Ban Sự kiện': 'SK',
  'Ban Đối ngoại - Hậu cần': 'ĐN',
};

const DEPT_COLORS: Record<Department, { bg: string; text: string }> = {
  'Ban Chủ nhiệm': { bg: 'bg-indigo-100', text: 'text-indigo-800' },
  'Ban Chuyên môn': { bg: 'bg-sky-100', text: 'text-sky-800' },
  'Ban Truyền thông': { bg: 'bg-purple-100', text: 'text-purple-800' },
  'Ban Sự kiện': { bg: 'bg-amber-100', text: 'text-amber-800' },
  'Ban Đối ngoại - Hậu cần': { bg: 'bg-emerald-100', text: 'text-emerald-800' },
};

export const MembersTab: React.FC<MembersTabProps> = ({
  members,
  onAddMember,
  onApproveMember,
  onAddScore,
  onDeleteMember,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    mssv: '',
    fullName: '',
    email: '',
    phone: '',
    department: 'Ban Chuyên môn' as Department,
    role: 'Ứng viên (Cộng tác viên)',
    status: 'pending' as MemberStatus,
  });

  const [formErrors, setFormErrors] = useState<{
    mssv?: string;
    fullName?: string;
    email?: string;
    phone?: string;
  }>({});

  const [submitFeedback, setSubmitFeedback] = useState<string | null>(null);

  // Filtered members list
  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        member.fullName.toLowerCase().includes(q) ||
        member.mssv.toLowerCase().includes(q) ||
        member.email.toLowerCase().includes(q);

      const matchDept = selectedDept === 'all' || member.department === selectedDept;
      const matchStatus = selectedStatus === 'all' || member.status === selectedStatus;

      return matchQuery && matchDept && matchStatus;
    });
  }, [members, searchQuery, selectedDept, selectedStatus]);

  // Demo presets
  const handleQuickFillValid = () => {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    setFormData({
      mssv: `B24DCCN${randomSuffix}`,
      fullName: 'Trịnh Quốc Bảo',
      email: `bao.trinh${randomSuffix}@university.edu.vn`,
      phone: '0978665544',
      department: 'Ban Chuyên môn',
      role: 'Ứng viên (Cộng tác viên)',
      status: 'pending',
    });
    setFormErrors({});
    setSubmitFeedback(null);
  };

  const handleTestDuplicateMssv = () => {
    const existing = members[0];
    setFormData({
      mssv: existing ? existing.mssv : 'B21DCCN001',
      fullName: 'Nguyễn Văn Thử Nghiệm',
      email: 'thunghiem@university.edu.vn',
      phone: '0912345678',
      department: 'Ban Sự kiện',
      role: 'Ứng viên (Cộng tác viên)',
      status: 'pending',
    });
    setFormErrors({});
    setSubmitFeedback(null);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateStudentMember({
      mssv: formData.mssv,
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      existingMembers: members,
    });

    if (!validation.isValid) {
      setFormErrors(validation.errors);
      setSubmitFeedback('Vui lòng sửa các lỗi ràng buộc dữ liệu được đánh dấu đỏ bên dưới.');
      return;
    }

    onAddMember({
      mssv: formData.mssv.trim().toUpperCase(),
      fullName: formData.fullName.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      department: formData.department,
      role: formData.role,
      joinDate: new Date().toISOString().split('T')[0],
      status: formData.status,
      activityScore: 50,
    });

    setShowAddModal(false);
    setFormData({
      mssv: '',
      fullName: '',
      email: '',
      phone: '',
      department: 'Ban Chuyên môn',
      role: 'Ứng viên (Cộng tác viên)',
      status: 'pending',
    });
    setFormErrors({});
    setSubmitFeedback(null);
  };

  return (
    <div className="space-y-5">
      {/* TOP CONTROLS & FILTER BAR */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* SEARCH INPUT */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo MSSV, Họ tên, Email sinh viên..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
            />
          </div>

          {/* DEPARTMENT FILTER */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 text-slate-700 font-medium"
            >
              <option value="all">Tất cả 5 Ban ({members.length})</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept} ({members.filter((m) => m.department === dept).length})
                </option>
              ))}
            </select>

            {/* STATUS FILTER */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 text-slate-700 font-medium"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="official">Chính thức</option>
              <option value="pending">Chờ duyệt hồ sơ</option>
            </select>
          </div>
        </div>

        {/* PRIMARY ACTION */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              setShowAddModal(true);
              setSubmitFeedback(null);
              setFormErrors({});
            }}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors shadow-xs"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Tiếp nhận Hồ sơ Mới</span>
          </button>
        </div>
      </div>

      {/* MEMBERS DATA GRID TABLE */}
      <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-xs">
        <div className="px-5 py-3.5 border-b border-slate-200/90 flex items-center justify-between text-xs text-slate-600 bg-slate-50/50">
          <div className="font-bold text-slate-900 flex items-center gap-2">
            <span>Danh sách Nhân sự CLB</span>
            <span className="font-mono text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
              {filteredMembers.length} hồ sơ
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
            <span>Chính thức: <strong>{members.filter((m) => m.status === 'official').length}</strong></span>
            <span>·</span>
            <span>Chờ duyệt: <strong className="text-amber-700">{members.filter((m) => m.status === 'pending').length}</strong></span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3 font-mono">MSSV</th>
                <th className="px-4 py-3">Sinh viên</th>
                <th className="px-4 py-3">Ban & Chức vụ</th>
                <th className="px-4 py-3">Liên hệ</th>
                <th className="px-4 py-3 text-center font-mono">Điểm cống hiến</th>
                <th className="px-4 py-3 text-center">Trạng thái</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                    Không tìm thấy thành viên nào phù hợp với bộ lọc tìm kiếm.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => {
                  const classification = classifyMemberActivity(member.activityScore);
                  const isOfficial = member.status === 'official';
                  const deptColor = DEPT_COLORS[member.department] || {
                    bg: 'bg-slate-100',
                    text: 'text-slate-800',
                  };

                  return (
                    <tr
                      key={member.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* MSSV */}
                      <td className="px-4 py-3 font-mono font-bold text-slate-900 tabular-nums">
                        {member.mssv}
                      </td>

                      {/* Full Name & Avatar Initial */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 ${deptColor.bg} ${deptColor.text}`}
                          >
                            {member.fullName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{member.fullName}</div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              Gia nhập: {formatDateTime(member.joinDate)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Department & Role */}
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800">{member.department}</div>
                        <div className="text-[11px] text-slate-500 font-medium">
                          {member.role}
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-600">
                        <div className="flex items-center gap-1.5 truncate max-w-[200px]">
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{member.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500 mt-0.5 tabular-nums">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{member.phone}</span>
                        </div>
                      </td>

                      {/* Activity Score & Classification */}
                      <td className="px-4 py-3 text-center">
                        <div className="font-mono tabular-nums font-extrabold text-slate-900">
                          {member.activityScore} pts
                        </div>
                        <div
                          className={`text-[10px] font-semibold ${
                            member.activityScore >= 85
                              ? 'text-emerald-700'
                              : member.activityScore >= 60
                              ? 'text-indigo-700'
                              : 'text-amber-700'
                          }`}
                        >
                          {classification.level}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 text-center">
                        {isOfficial ? (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            Chính thức
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                            Chờ duyệt
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Approve Pending */}
                          {!isOfficial && (
                            <button
                              onClick={() => onApproveMember(member.id)}
                              title="Duyệt ứng viên thành thành viên chính thức"
                              className="px-2.5 py-1 text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-md transition-colors"
                            >
                              Duyệt
                            </button>
                          )}

                          {/* +5 Score */}
                          <button
                            onClick={() => onAddScore(member.id, 5)}
                            title="Cộng 5 điểm cống hiến phong trào"
                            className="px-2 py-1 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors font-mono"
                          >
                            +5đ
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => {
                              if (
                                confirm(
                                  `Bạn có chắc chắn muốn xóa hồ sơ sinh viên ${member.fullName} (${member.mssv}) khỏi danh sách CLB?`
                                )
                              ) {
                                onDeleteMember(member.id);
                              }
                            }}
                            title="Xóa hồ sơ nhân sự"
                            className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors rounded hover:bg-rose-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: ADD NEW MEMBER */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Tiếp nhận Hồ sơ Đăng ký Thành viên CLB
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Kiểm tra toàn vẹn định dạng MSSV, Email trường và chống đăng ký trùng
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Demo Test Buttons */}
            <div className="mt-3.5 p-3 bg-slate-50 border border-slate-200/90 rounded-xl space-y-2">
              <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Dữ liệu mẫu thử nghiệm nhanh (Preset Scenarios):</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleQuickFillValid}
                  className="px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors"
                >
                  ✓ Điền nhanh hồ sơ hợp lệ
                </button>
                <button
                  type="button"
                  onClick={handleTestDuplicateMssv}
                  className="px-2.5 py-1 text-xs font-semibold text-rose-800 bg-rose-100 hover:bg-rose-200 rounded-lg transition-colors"
                >
                  ⚠ Test bắt lỗi trùng MSSV
                </button>
              </div>
            </div>

            {submitFeedback && (
              <div className="mt-3.5 p-2.5 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{submitFeedback}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleFormSubmit} className="mt-4 space-y-3.5 text-xs">
              {/* MSSV */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Mã số Sinh viên (MSSV) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.mssv}
                  onChange={(e) => {
                    setFormData({ ...formData, mssv: e.target.value.toUpperCase() });
                    if (formErrors.mssv) setFormErrors({ ...formErrors, mssv: undefined });
                  }}
                  placeholder="Ví dụ: B24DCCN999"
                  className={`w-full px-3 py-2 font-mono text-xs border rounded-lg focus:outline-none ${
                    formErrors.mssv
                      ? 'border-rose-300 bg-rose-50/50 text-rose-900 focus:border-rose-500'
                      : 'border-slate-200 bg-white focus:border-indigo-500'
                  }`}
                />
                {formErrors.mssv && (
                  <p className="mt-1 text-[11px] text-rose-600 font-semibold">{formErrors.mssv}</p>
                )}
                <p className="mt-0.5 text-[10px] text-slate-400 font-mono">
                  Yêu cầu: Từ 6 đến 10 ký tự chữ và số, không trùng lặp trong CLB.
                </p>
              </div>

              {/* Full Name */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Họ và Tên Sinh viên <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => {
                    setFormData({ ...formData, fullName: e.target.value });
                    if (formErrors.fullName) setFormErrors({ ...formErrors, fullName: undefined });
                  }}
                  placeholder="Ví dụ: Trịnh Quốc Bảo"
                  className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none ${
                    formErrors.fullName
                      ? 'border-rose-300 bg-rose-50/50 text-rose-900 focus:border-rose-500'
                      : 'border-slate-200 bg-white focus:border-indigo-500'
                  }`}
                />
                {formErrors.fullName && (
                  <p className="mt-1 text-[11px] text-rose-600 font-semibold">
                    {formErrors.fullName}
                  </p>
                )}
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Email Sinh viên <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      if (formErrors.email) setFormErrors({ ...formErrors, email: undefined });
                    }}
                    placeholder="email@university.edu.vn"
                    className={`w-full px-3 py-2 font-mono text-xs border rounded-lg focus:outline-none ${
                      formErrors.email
                        ? 'border-rose-300 bg-rose-50/50 text-rose-900 focus:border-rose-500'
                        : 'border-slate-200 bg-white focus:border-indigo-500'
                    }`}
                  />
                  {formErrors.email && (
                    <p className="mt-1 text-[11px] text-rose-600 font-semibold">
                      {formErrors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Số Điện thoại (10 số) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => {
                      setFormData({ ...formData, phone: e.target.value });
                      if (formErrors.phone) setFormErrors({ ...formErrors, phone: undefined });
                    }}
                    placeholder="0912345678"
                    className={`w-full px-3 py-2 font-mono text-xs border rounded-lg focus:outline-none ${
                      formErrors.phone
                        ? 'border-rose-300 bg-rose-50/50 text-rose-900 focus:border-rose-500'
                        : 'border-slate-200 bg-white focus:border-indigo-500'
                    }`}
                  />
                  {formErrors.phone && (
                    <p className="mt-1 text-[11px] text-rose-600 font-semibold">
                      {formErrors.phone}
                    </p>
                  )}
                </div>
              </div>

              {/* Department & Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Ban Nguyện vọng <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) =>
                      setFormData({ ...formData, department: e.target.value as Department })
                    }
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-medium"
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Trạng thái Hồ sơ
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as MemberStatus })
                    }
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-medium"
                  >
                    <option value="pending">Ứng viên chờ duyệt</option>
                    <option value="official">Thành viên chính thức</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3.5 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors shadow-xs"
                >
                  Lưu Hồ sơ Nhân sự
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
