import React, { useState, useMemo } from 'react';
import {
  Search,
  Users,
  CheckCircle2,
  Award,
  Filter,
  AlertCircle,
  Phone,
  Mail,
  Building,
  ShieldCheck,
  UserCheck,
  Clock,
  ChevronRight,
  Sparkles,
  Lock,
  Trash2,
  CheckSquare,
  Crown,
} from 'lucide-react';
import { ClubMember, Department, AuthUser } from '../types.ts';
import { classifyMemberActivity } from '../domain/clubLogic.ts';

interface MembersTabProps {
  members: ClubMember[];
  onApproveMember: (id: string, assignedDept?: Department, assignedRole?: string) => void;
  onAddScore: (id: string, points: number) => void;
  onDeleteMember: (id: string) => void;
  currentUser?: AuthUser | null;
  onRequireAuth?: () => void;
}

const DEPARTMENTS: Department[] = [
  'Ban Chủ nhiệm',
  'Ban Chuyên môn',
  'Ban Truyền thông',
  'Ban Sự kiện',
  'Ban Đối ngoại - Hậu cần',
];

const AVAILABLE_ROLES = [
  'Thành viên chính thức',
  'Cộng tác viên tiềm năng',
  'Phó Trưởng ban',
  'Trưởng ban Chuyên môn',
  'Trưởng ban Truyền thông',
  'Trưởng ban Sự kiện',
  'Trưởng ban Đối ngoại',
  'Thủ quỹ CLB (Duyệt chi)',
  'Phó Chủ nhiệm CLB',
];

const DEPT_COLORS: Record<Department, { bg: string; text: string; border: string }> = {
  'Ban Chủ nhiệm': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  'Ban Chuyên môn': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  'Ban Truyền thông': { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  'Ban Sự kiện': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  'Ban Đối ngoại - Hậu cần': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
};

export const MembersTab: React.FC<MembersTabProps> = ({
  members,
  onApproveMember,
  onAddScore,
  onDeleteMember,
  currentUser,
  onRequireAuth,
}) => {
  const isClubPresident = currentUser?.role === 'admin';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Assignment form state for pending members
  const [assigningData, setAssigningData] = useState<
    Record<string, { dept: Department; role: string }>
  >({});

  // Pending members waiting for President's role assignment
  const pendingMembers = useMemo(() => {
    return members.filter((m) => m.status === 'pending');
  }, [members]);

  // Official members
  const officialMembers = useMemo(() => {
    return members.filter((m) => m.status === 'official');
  }, [members]);

  // Filtered members list
  const filteredOfficialMembers = useMemo(() => {
    return officialMembers.filter((member) => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        member.fullName.toLowerCase().includes(q) ||
        member.mssv.toLowerCase().includes(q) ||
        member.email.toLowerCase().includes(q);

      const matchDept = selectedDept === 'all' || member.department === selectedDept;
      return matchQuery && matchDept;
    });
  }, [officialMembers, searchQuery, selectedDept]);

  // Initialize assignment default values
  const getAssignState = (member: ClubMember) => {
    return (
      assigningData[member.id] || {
        dept: member.department,
        role: 'Thành viên chính thức',
      }
    );
  };

  const handleSetAssignDept = (memberId: string, dept: Department) => {
    setAssigningData((prev) => ({
      ...prev,
      [memberId]: {
        ...(prev[memberId] || { dept, role: 'Thành viên chính thức' }),
        dept,
      },
    }));
  };

  const handleSetAssignRole = (memberId: string, role: string) => {
    setAssigningData((prev) => ({
      ...prev,
      [memberId]: {
        ...(prev[memberId] || { dept: 'Ban Chuyên môn', role }),
        role,
      },
    }));
  };

  const handleExecuteApproval = (member: ClubMember) => {
    if (!isClubPresident) {
      alert('Chỉ Chủ nhiệm Câu lạc bộ mới có thẩm quyền phân bổ ban và phê duyệt vai trò!');
      return;
    }
    const state = getAssignState(member);
    onApproveMember(member.id, state.dept, state.role);
  };

  const handleRejectMember = (memberId: string, fullName: string) => {
    if (!isClubPresident) return;
    if (confirm(`Bạn có chắc chắn muốn từ chối hồ sơ của sinh viên "${fullName}"?`)) {
      onDeleteMember(memberId);
    }
  };

  return (
    <div className="space-y-6">
      {/* TOP HEADER */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <Users className="w-4 h-4" />
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Quản Trị Nhân Sự & Phân Quyền
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Quy trình tự động hóa: Tài khoản mới tạo tại trang Đăng ký sẽ tự động xuất hiện tại hàng chờ để Chủ nhiệm phê duyệt và phân quyền
          </p>
        </div>

        {/* STATS BADGES */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <span className="text-slate-500 font-medium">Chính thức: </span>
            <span className="font-bold text-slate-900">{officialMembers.length}</span>
          </div>
          <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 ${
            pendingMembers.length > 0
              ? 'bg-amber-50 text-amber-800 border-amber-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}>
            <Clock className="w-3.5 h-3.5" />
            <span>Chờ phân quyền: {pendingMembers.length}</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: HÀNG CHỜ PHÊ DUYỆT & PHÂN QUYỀN TÀI KHOẢN MỚI */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
              {pendingMembers.length}
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Hồ sơ Sinh viên Mới Đăng ký (Chờ Chủ nhiệm Phân quyền)
              </h2>
              <p className="text-xs text-slate-500">
                Tự động tiếp nhận từ biểu mẫu Đăng ký tài khoản hệ thống (Không cần nhập hồ sơ thủ công)
              </p>
            </div>
          </div>

          {isClubPresident ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 shrink-0">
              <Crown className="w-3.5 h-3.5" />
              <span>Quyền Chủ nhiệm: Có thể phân bổ Ban & Vai trò</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Chỉ Chủ nhiệm có quyền phân bổ</span>
            </span>
          )}
        </div>

        {pendingMembers.length > 0 ? (
          <div className="space-y-3">
            {pendingMembers.map((member) => {
              const assignState = getAssignState(member);

              return (
                <div
                  key={member.id}
                  className="p-4 sm:p-5 rounded-2xl border border-amber-200 bg-amber-50/30 hover:border-amber-300 transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
                >
                  {/* MEMBER IDENTITY INFO */}
                  <div className="flex items-start gap-3.5 min-w-[280px]">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
                      {member.fullName.split(' ').slice(-1)[0][0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm sm:text-base text-slate-900">
                          {member.fullName}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          Mới tạo tài khoản
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
                        <span className="font-mono font-bold text-slate-800">MSSV: {member.mssv}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{member.email}</span>
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{member.phone}</span>
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                        <span>Nguyện vọng đăng ký: <strong>{member.department}</strong></span>
                        <span>·</span>
                        <span>Ngày gửi: {member.joinDate}</span>
                      </div>
                    </div>
                  </div>

                  {/* PRESIDENT ROLE ASSIGNMENT CONTROLS */}
                  {isClubPresident ? (
                    <div className="w-full lg:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-3 lg:pt-0 border-t lg:border-t-0 border-amber-200/60">
                      {/* ASSIGN DEPARTMENT SELECT */}
                      <div className="flex flex-col">
                        <label className="text-[10px] font-bold uppercase text-slate-500 mb-1">
                          Phân bổ Ban:
                        </label>
                        <select
                          value={assignState.dept}
                          onChange={(e) => handleSetAssignDept(member.id, e.target.value as Department)}
                          className="px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
                        >
                          {DEPARTMENTS.map((dept) => (
                            <option key={dept} value={dept}>
                              {dept}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* ASSIGN OFFICIAL ROLE SELECT */}
                      <div className="flex flex-col">
                        <label className="text-[10px] font-bold uppercase text-slate-500 mb-1">
                          Gán Vai trò / Chức vụ:
                        </label>
                        <select
                          value={assignState.role}
                          onChange={(e) => handleSetAssignRole(member.id, e.target.value)}
                          className="px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
                        >
                          {AVAILABLE_ROLES.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* APPROVAL & REJECT BUTTONS */}
                      <div className="flex items-center gap-1.5 sm:self-end pt-1 sm:pt-0">
                        <button
                          type="button"
                          onClick={() => handleExecuteApproval(member)}
                          className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                          title="Phê duyệt hồ sơ và phân quyền chính thức"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Duyệt & Gán quyền</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRejectMember(member.id, member.fullName)}
                          className="p-2 rounded-xl text-rose-600 hover:text-rose-800 hover:bg-rose-100/60 border border-rose-200 transition-colors"
                          title="Từ chối hồ sơ này"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-amber-800 bg-amber-100/60 px-3.5 py-2 rounded-xl border border-amber-200 flex items-center gap-2">
                      <Clock className="w-4 h-4 shrink-0 text-amber-600" />
                      <span>Đang chờ Chủ nhiệm duyệt và phân bổ Ban chuyên môn...</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-6 px-4 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200 space-y-1.5">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
            <div className="text-xs font-bold text-slate-800">
              Không có hồ sơ nào đang chờ duyệt
            </div>
            <div className="text-[11px] text-slate-500">
              Khi sinh viên đăng ký tài khoản mới trên hệ thống, thông tin sẽ tự động hiển thị tại đây để Chủ nhiệm phân ban và bổ nhiệm vai trò.
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: DANH SÁCH THÀNH VIÊN CHÍNH THỨC */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Danh Sách Thành Viên Chính Thức ({filteredOfficialMembers.length})
            </h2>
            <p className="text-xs text-slate-500">
              Đã được Chủ nhiệm phê duyệt và phân bổ vào 5 Ban chuyên môn
            </p>
          </div>

          {/* SEARCH & FILTER */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-60">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm tên, MSSV, email..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:bg-white focus:outline-none"
            >
              <option value="all">Tất cả ban</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* OFFICIAL MEMBERS TABLE */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Sinh viên / MSSV</th>
                <th className="py-3 px-4">Ban phụ trách</th>
                <th className="py-3 px-4">Chức vụ / Vai trò</th>
                <th className="py-3 px-4">Điểm rèn luyện</th>
                <th className="py-3 px-4">Ngày gia nhập</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOfficialMembers.map((member) => {
                const activity = classifyMemberActivity(member.activityScore);
                const deptStyle = DEPT_COLORS[member.department] || DEPT_COLORS['Ban Chuyên môn'];

                return (
                  <tr key={member.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* NAME & MSSV */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 font-extrabold flex items-center justify-center text-xs shrink-0">
                          {member.fullName.split(' ').slice(-1)[0][0]}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-xs">{member.fullName}</div>
                          <div className="font-mono text-[11px] text-slate-500">
                            {member.mssv} · {member.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* DEPARTMENT */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${deptStyle.bg} ${deptStyle.text} ${deptStyle.border}`}
                      >
                        {member.department}
                      </span>
                    </td>

                    {/* ROLE */}
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800 text-xs">
                        {member.role}
                      </span>
                    </td>

                    {/* SCORE */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">
                          {member.activityScore} đ
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                            activity.level === 'Xuất sắc'
                              ? 'bg-purple-100 text-purple-700'
                              : activity.level === 'Tích cực'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {activity.level}
                        </span>

                        {isClubPresident && (
                          <button
                            type="button"
                            onClick={() => onAddScore(member.id, 5)}
                            className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            title="Cộng 5 điểm rèn luyện"
                          >
                            +5đ
                          </button>
                        )}
                      </div>
                    </td>

                    {/* JOIN DATE */}
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {member.joinDate}
                    </td>

                    {/* ACTIONS */}
                    <td className="py-3 px-4 text-right">
                      {isClubPresident && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Xóa thành viên "${member.fullName}" khỏi danh sách?`)) {
                              onDeleteMember(member.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Xóa thành viên"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
