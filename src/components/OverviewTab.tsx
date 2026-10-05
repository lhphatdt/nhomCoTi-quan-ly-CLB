import React from 'react';
import {
  Users,
  Calendar,
  Wallet,
  GitBranch,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Building,
  Sparkles,
  ChevronRight,
  PlusCircle,
  FileCheck,
} from 'lucide-react';
import { ClubMember, ClubEvent, TreasuryTransaction, Department } from '../types.ts';
import {
  formatVND,
  formatDateTime,
  calculateTreasuryBalance,
  calculateAttendanceRate,
} from '../domain/clubLogic.ts';

interface OverviewTabProps {
  members: ClubMember[];
  events: ClubEvent[];
  transactions: TreasuryTransaction[];
  pipelinePassed: boolean;
  onNavigateTab: (tabId: 'members' | 'events' | 'treasury' | 'cicd') => void;
}

const DEPT_CONFIG: Record<
  Department,
  { color: string; bg: string; border: string; bar: string }
> = {
  'Ban Chủ nhiệm': {
    color: 'text-indigo-700',
    bg: 'bg-indigo-50',
    border: 'border-indigo-100',
    bar: 'bg-indigo-600',
  },
  'Ban Chuyên môn': {
    color: 'text-sky-700',
    bg: 'bg-sky-50',
    border: 'border-sky-100',
    bar: 'bg-sky-600',
  },
  'Ban Truyền thông': {
    color: 'text-purple-700',
    bg: 'bg-purple-50',
    border: 'border-purple-100',
    bar: 'bg-purple-600',
  },
  'Ban Sự kiện': {
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
    bar: 'bg-amber-500',
  },
  'Ban Đối ngoại - Hậu cần': {
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
    bar: 'bg-emerald-600',
  },
};

export const OverviewTab: React.FC<OverviewTabProps> = ({
  members,
  events,
  transactions,
  pipelinePassed,
  onNavigateTab,
}) => {
  const officialMembers = members.filter((m) => m.status === 'official');
  const pendingMembers = members.filter((m) => m.status === 'pending');
  const treasury = calculateTreasuryBalance(transactions, false);

  const upcomingEvents = [...events]
    .filter((e) => e.status !== 'completed')
    .sort((a, b) => a.date.localeCompare(b.date));

  const recentTransactions = [...transactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  const departments: Department[] = [
    'Ban Chủ nhiệm',
    'Ban Chuyên môn',
    'Ban Truyền thông',
    'Ban Sự kiện',
    'Ban Đối ngoại - Hậu cần',
  ];

  return (
    <div className="space-y-6">
      {/* HERO EXECUTIVE CARD */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-slate-800/80 rounded-2xl p-6 text-white shadow-md">
        {/* Subtle ambient glow effect */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-300">
              <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-200 border border-indigo-500/30">
                Trung tâm Quản trị
              </span>
              <span>·</span>
              <span>Hệ thống Điều hành CLB Sinh viên</span>
              <span>·</span>
              <span className="text-emerald-400 font-mono">Phiên bản Sản phẩm v1.0</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              UniClub Hub — Quản lý Câu lạc bộ & Pipeline Tự động hóa CI/CD
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Giải pháp tích hợp toàn diện: Tự động hóa kiểm soát nhân sự, ngăn chặn xung đột lịch phòng học, bảo vệ ngân sách sổ quỹ minh bạch và thiết lập Quality Gate 5 giai đoạn bảo vệ nhánh Production.
            </p>

            {/* Quick status pill row */}
            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-mono text-slate-300">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>{members.length} Nhân sự</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-400" />
                <span>{events.length} Hoạt động</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>Quỹ: {formatVND(treasury.availableBalance)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    pipelinePassed ? 'bg-emerald-400' : 'bg-rose-500 animate-pulse'
                  }`}
                />
                <span>CI/CD: {pipelinePassed ? 'Pass 100%' : 'Bug Alert'}</span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigateTab('cicd')}
              className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all shadow-sm hover:shadow-md ring-1 ring-white/10"
            >
              <GitBranch className="w-4 h-4" />
              <span>Mở CI/CD Live Console</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 4 KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Members */}
        <div
          onClick={() => onNavigateTab('members')}
          className="group bg-white border border-slate-200/90 hover:border-indigo-400/80 rounded-xl p-4.5 transition-all cursor-pointer shadow-xs hover:shadow-sm"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Nhân sự CLB</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center transition-colors">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
              {officialMembers.length}
            </span>
            <span className="text-xs text-slate-500">chính thức</span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Ứng viên chờ duyệt:</span>
            <span className="font-mono tabular-nums font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
              {pendingMembers.length} hồ sơ
            </span>
          </div>
        </div>

        {/* KPI 2: Events */}
        <div
          onClick={() => onNavigateTab('events')}
          className="group bg-white border border-slate-200/90 hover:border-sky-400/80 rounded-xl p-4.5 transition-all cursor-pointer shadow-xs hover:shadow-sm"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Sự kiện học kỳ</span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 group-hover:bg-sky-600 group-hover:text-white flex items-center justify-center transition-colors">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
              {events.length}
            </span>
            <span className="text-xs text-slate-500">hoạt động</span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Sắp diễn ra:</span>
            <span className="font-mono tabular-nums font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded">
              {upcomingEvents.length} sự kiện
            </span>
          </div>
        </div>

        {/* KPI 3: Treasury Balance */}
        <div
          onClick={() => onNavigateTab('treasury')}
          className="group bg-white border border-slate-200/90 hover:border-emerald-400/80 rounded-xl p-4.5 transition-all cursor-pointer shadow-xs hover:shadow-sm"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Số dư Quỹ khả dụng</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center transition-colors">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold tracking-tight text-emerald-700 font-mono tabular-nums">
              {formatVND(treasury.availableBalance)}
            </span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Chi chờ duyệt:</span>
            <span className="font-mono tabular-nums font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
              {formatVND(treasury.pendingExpense)}
            </span>
          </div>
        </div>

        {/* KPI 4: CI/CD Quality Gate */}
        <div
          onClick={() => onNavigateTab('cicd')}
          className={`group bg-white border rounded-xl p-4.5 transition-all cursor-pointer shadow-xs hover:shadow-sm ${
            pipelinePassed
              ? 'border-slate-200/90 hover:border-emerald-400/80'
              : 'border-rose-300 ring-1 ring-rose-200 bg-rose-50/20'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Quality Gate CI/CD</span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                pipelinePassed
                  ? 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white'
                  : 'bg-rose-100 text-rose-700 animate-pulse'
              }`}
            >
              <GitBranch className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2">
            {pipelinePassed ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="text-xl font-bold tracking-tight text-emerald-800">
                  PASSED (10/10)
                </span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                <span className="text-xl font-bold tracking-tight text-rose-800">
                  BLOCKED (Bug)
                </span>
              </>
            )}
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Branch Protection:</span>
            <span
              className={`font-mono text-xs font-bold ${
                pipelinePassed ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {pipelinePassed ? 'Merge Allowed' : 'Blocked on main'}
            </span>
          </div>
        </div>
      </div>

      {/* 2 COLUMN GRID: DEPARTMENTS (LEFT) & UPCOMING EVENTS + TREASURY (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: 5 DEPARTMENTS BREAKDOWN (5 COLS) */}
        <div className="lg:col-span-4 bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Cơ cấu 5 Ban Chuyên trách</h3>
              <p className="text-xs text-slate-500 mt-0.5">Phân bổ nhân lực trong bộ máy CLB</p>
            </div>
            <Building className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-4">
            {departments.map((dept) => {
              const deptMembers = members.filter((m) => m.department === dept);
              const count = deptMembers.length;
              const percentage = members.length > 0 ? Math.round((count / members.length) * 100) : 0;
              const leader = deptMembers.find(
                (m) => m.role.includes('Trưởng') || m.role.includes('Chủ nhiệm')
              );
              const config = DEPT_CONFIG[dept];

              return (
                <div key={dept} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{dept}</span>
                    <span className="font-mono tabular-nums text-slate-600 font-bold">
                      {count} ({percentage}%)
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${config.bar}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>
                      Phụ trách:{' '}
                      <strong className="text-slate-700 font-medium">
                        {leader ? leader.fullName : 'Đang cập nhật'}
                      </strong>
                    </span>
                    <span className="font-mono text-slate-400">
                      {deptMembers.filter((m) => m.status === 'official').length} chính thức
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Tổng nhân sự quản lý:</span>
            <span className="font-mono font-bold text-slate-900 tabular-nums">
              {members.length} sinh viên
            </span>
          </div>

          <button
            onClick={() => onNavigateTab('members')}
            className="w-full py-2 text-xs font-semibold text-indigo-600 bg-indigo-50/70 hover:bg-indigo-100 rounded-lg transition-colors flex items-center justify-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Quản lý Danh sách Thành viên</span>
          </button>
        </div>

        {/* RIGHT COLUMN: EVENTS & CASHFLOW (7 COLS) */}
        <div className="lg:col-span-8 space-y-6">
          {/* UPCOMING EVENTS */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Lịch Hoạt động & Sự kiện Sắp tới
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Đồng bộ phòng ốc và theo dõi trực tiếp chuyên cần điểm danh
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('events')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
              >
                <span>Xem tất cả ({events.length})</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-3 divide-y divide-slate-100">
              {upcomingEvents.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  Không có sự kiện sắp diễn ra trong học kỳ này.
                </div>
              ) : (
                upcomingEvents.slice(0, 3).map((event) => {
                  const rate = calculateAttendanceRate(
                    event.attendees.length,
                    event.expectedAttendees
                  );
                  // parse day and month
                  const parts = event.date.split('-');
                  const day = parts[2] || '01';
                  const month = parts[1] || '10';

                  return (
                    <div
                      key={event.id}
                      className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                    >
                      {/* Left: Date badge + Info */}
                      <div className="flex items-start gap-3 min-w-0">
                        {/* Calendar Day box */}
                        <div className="w-11 h-11 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 flex flex-col items-center justify-center shrink-0">
                          <span className="text-[10px] uppercase font-bold text-indigo-500 leading-none">
                            T{month}
                          </span>
                          <span className="text-base font-extrabold font-mono tabular-nums leading-tight">
                            {day}
                          </span>
                        </div>

                        {/* Title and location */}
                        <div className="truncate">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 truncate">
                              {event.title}
                            </span>
                            <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded shrink-0">
                              {event.category}
                            </span>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500 font-mono tabular-nums">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {event.startTime} - {event.endTime}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              <span className="truncate">{event.location}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Attendance counter & Action */}
                      <div className="flex items-center gap-3 shrink-0 text-xs">
                        <div className="text-right">
                          <div className="font-mono tabular-nums font-bold text-slate-900">
                            {event.attendees.length} / {event.expectedAttendees} người
                          </div>
                          <div
                            className={`text-[11px] font-mono font-medium ${
                              rate >= 75 ? 'text-emerald-700' : 'text-amber-700'
                            }`}
                          >
                            Chuyên cần: {rate}%
                          </div>
                        </div>
                        <button
                          onClick={() => onNavigateTab('events')}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                        >
                          Điểm danh
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RECENT FINANCIAL VOUCHERS */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Sổ Quỹ Thu Chi Minh Bạch Mới Nhất
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Kiểm soát thu chi tự động & cơ chế an toàn chống duyệt chi âm quỹ
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('treasury')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
              >
                <span>Mở Sổ quỹ ({transactions.length})</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-3 divide-y divide-slate-100">
              {recentTransactions.map((tx) => {
                const isIncome = tx.type === 'income';
                return (
                  <div
                    key={tx.id}
                    className="py-2.5 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          isIncome
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            : 'bg-rose-50 text-rose-700 border border-rose-100'
                        }`}
                      >
                        {isIncome ? (
                          <ArrowDownRight className="w-4 h-4" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4" />
                        )}
                      </div>
                      <div className="truncate">
                        <div className="font-semibold text-slate-900 truncate">{tx.title}</div>
                        <div className="text-slate-500 font-mono text-[11px] flex items-center gap-1.5">
                          <span className="font-bold text-slate-700">{tx.voucherCode}</span>
                          <span>·</span>
                          <span>{formatDateTime(tx.date)}</span>
                          <span>·</span>
                          <span>{tx.requester}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div
                        className={`font-mono tabular-nums font-bold ${
                          isIncome ? 'text-emerald-700' : 'text-slate-900'
                        }`}
                      >
                        {isIncome ? '+' : '-'}
                        {formatVND(tx.amount)}
                      </div>
                      <div className="text-[11px] font-mono">
                        {tx.status === 'approved' ? (
                          <span className="text-emerald-700 font-medium">Đã duyệt</span>
                        ) : tx.status === 'pending' ? (
                          <span className="text-amber-700 font-medium">Chờ duyệt</span>
                        ) : (
                          <span className="text-rose-700 font-medium">Từ chối</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
