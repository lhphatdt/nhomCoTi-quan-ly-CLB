/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Wallet,
  GitBranch,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Flame,
  LogIn,
  LogOut,
  UserCheck,
  ChevronDown,
  ShieldCheck,
  UserPlus,
  Sparkles,
  Lock,
} from 'lucide-react';
import { ClubMember, ClubEvent, TreasuryTransaction, AuthUser, UserRole } from './types.ts';
import {
  INITIAL_MEMBERS,
  INITIAL_EVENTS,
  INITIAL_TRANSACTIONS,
  INITIAL_AUTH_USERS,
} from './data/initialClubData.ts';
import { calculateTreasuryBalance, canApproveExpense } from './domain/clubLogic.ts';
import { OverviewTab } from './components/OverviewTab.tsx';
import { MembersTab } from './components/MembersTab.tsx';
import { EventsTab } from './components/EventsTab.tsx';
import { TreasuryTab } from './components/TreasuryTab.tsx';
import { CicdPipelineTab } from './components/CicdPipelineTab.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { AuthGateView } from './components/AuthGateView.tsx';

type TabType = 'overview' | 'members' | 'events' | 'treasury' | 'cicd';

const STORAGE_KEY_MEMBERS = 'uniclub_members_v1';
const STORAGE_KEY_EVENTS = 'uniclub_events_v1';
const STORAGE_KEY_TRANSACTIONS = 'uniclub_transactions_v1';
const STORAGE_KEY_AUTH_USERS = 'uniclub_auth_users_v1';
const STORAGE_KEY_CURRENT_USER = 'uniclub_current_user_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Authentication State
  const [authUsers, setAuthUsers] = useState<AuthUser[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_AUTH_USERS);
      return saved ? JSON.parse(saved) : INITIAL_AUTH_USERS;
    } catch {
      return INITIAL_AUTH_USERS;
    }
  });

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Persistence via LocalStorage
  const [members, setMembers] = useState<ClubMember[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MEMBERS);
      return saved ? JSON.parse(saved) : INITIAL_MEMBERS;
    } catch {
      return INITIAL_MEMBERS;
    }
  });

  const [events, setEvents] = useState<ClubEvent[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_EVENTS);
      return saved ? JSON.parse(saved) : INITIAL_EVENTS;
    } catch {
      return INITIAL_EVENTS;
    }
  });

  const [transactions, setTransactions] = useState<TreasuryTransaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TRANSACTIONS);
      return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  });

  // Bug simulation for Stage 02 demonstration
  const [simulateBug, setSimulateBug] = useState<boolean>(false);
  const [pipelinePassed, setPipelinePassed] = useState<boolean>(true);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_MEMBERS, JSON.stringify(members));
  }, [members]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_AUTH_USERS, JSON.stringify(authUsers));
  }, [authUsers]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
    }
  }, [currentUser]);

  // Keep pipelinePassed in sync with simulateBug
  useEffect(() => {
    if (simulateBug) {
      setPipelinePassed(false);
    } else {
      setPipelinePassed(true);
    }
  }, [simulateBug]);

  // Reset to initial mock data
  const handleResetData = () => {
    if (confirm('Khôi phục toàn bộ dữ liệu mẫu (10 sinh viên 5 ban, sự kiện và chứng từ quỹ ban đầu)?')) {
      setMembers(INITIAL_MEMBERS);
      setEvents(INITIAL_EVENTS);
      setTransactions(INITIAL_TRANSACTIONS);
      setSimulateBug(false);
      setPipelinePassed(true);
      localStorage.removeItem(STORAGE_KEY_MEMBERS);
      localStorage.removeItem(STORAGE_KEY_EVENTS);
      localStorage.removeItem(STORAGE_KEY_TRANSACTIONS);
    }
  };

  // Member Handlers
  const handleAddMember = (newMemberData: Omit<ClubMember, 'id'>) => {
    const newMember: ClubMember = {
      ...newMemberData,
      id: `mem-${Date.now()}`,
    };
    setMembers((prev) => [newMember, ...prev]);
  };

  const handleApproveMember = (id: string) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: 'official', role: 'Thành viên chính thức' } : m))
    );
  };

  const handleAddScore = (id: string, points: number) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, activityScore: m.activityScore + points } : m))
    );
  };

  const handleDeleteMember = (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  // Event Handlers
  const handleAddEvent = (newEventData: Omit<ClubEvent, 'id'>) => {
    const newEvent: ClubEvent = {
      ...newEventData,
      id: `evt-${Date.now()}`,
    };
    setEvents((prev) => [newEvent, ...prev]);
  };

  const handleToggleAttendee = (eventId: string, memberId: string) => {
    setEvents((prev) =>
      prev.map((ev) => {
        if (ev.id !== eventId) return ev;
        const exists = ev.attendees.includes(memberId);
        const updated = exists
          ? ev.attendees.filter((id) => id !== memberId)
          : [...ev.attendees, memberId];
        return { ...ev, attendees: updated };
      })
    );
  };

  // Treasury Handlers
  const handleAddTransaction = (
    newTx: Omit<TreasuryTransaction, 'id' | 'voucherCode'>
  ) => {
    const prefix = newTx.type === 'income' ? 'THU' : 'CHI';
    const year = new Date().getFullYear();
    const count = transactions.filter((t) => t.type === newTx.type).length + 1;
    const voucherCode = `${prefix}-${year}-${String(count).padStart(3, '0')}`;

    const created: TreasuryTransaction = {
      ...newTx,
      id: `tx-${Date.now()}`,
      voucherCode,
    };
    setTransactions((prev) => [created, ...prev]);
  };

  const handleApproveTransaction = (id: string): { success: boolean; reason?: string } => {
    const tx = transactions.find((t) => t.id === id);
    if (!tx) return { success: false, reason: 'Không tìm thấy chứng từ' };

    // Calculate current available balance
    const currentTreasury = calculateTreasuryBalance(transactions, false);
    const safetyCheck = canApproveExpense(tx.amount, currentTreasury.availableBalance);

    if (!safetyCheck.allowed) {
      return { success: false, reason: safetyCheck.reason };
    }

    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'approved' } : t))
    );
    return { success: true };
  };

  const handleRejectTransaction = (id: string) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'rejected' } : t))
    );
  };

  // Auth & RBAC Handlers
  const handleRegisterNewUser = (newUser: AuthUser) => {
    setAuthUsers((prev) => [newUser, ...prev]);

    // Also register as a member in the club roster
    const newMember: ClubMember = {
      id: `mem-${Date.now()}`,
      mssv: newUser.mssv,
      fullName: newUser.fullName,
      email: newUser.email,
      phone: newUser.phone || '0912345678',
      department: newUser.department,
      role: newUser.roleTitle,
      joinDate: new Date().toISOString().split('T')[0],
      status: 'official',
      activityScore: 80,
    };
    setMembers((prev) => [newMember, ...prev]);
  };

  const handleSwitchRole = (targetRole: UserRole | 'guest') => {
    if (targetRole === 'guest') {
      setCurrentUser(null);
      localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
      setShowUserDropdown(false);
      return;
    }
    const existing = authUsers.find((u) => u.role === targetRole);
    if (existing) {
      setCurrentUser(existing);
    } else {
      const defaultUser = INITIAL_AUTH_USERS.find((u) => u.role === targetRole);
      if (defaultUser) {
        setCurrentUser(defaultUser);
      }
    }
    setShowUserDropdown(false);
  };

  const handleTabClick = (tab: TabType) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans selection:bg-indigo-500 selection:text-white">
      {/* TOP BAR CONTRACT: Zone 1 (Brand), Zone 2 (5 Nav Links), Zone 3 (Actions) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-15 flex items-center justify-between gap-4">
          {/* ZONE 1: SINGLE-ELEMENT BRAND WORDMARK */}
          <div className="flex items-center gap-3 shrink-0">
            <span
              onClick={() => handleTabClick('overview')}
              className="text-base font-extrabold tracking-tight text-slate-900 cursor-pointer flex items-center gap-2.5 group"
            >
              <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-700 via-indigo-600 to-indigo-500 text-white flex items-center justify-center text-xs font-black shadow-xs group-hover:scale-105 transition-transform">
                UC
              </span>
              <div className="flex flex-col">
                <span className="font-extrabold text-sm sm:text-base leading-none text-slate-900">
                  UniClub Hub
                </span>
                <span className="text-[10px] text-slate-400 font-mono leading-tight mt-0.5 hidden sm:inline">
                  Enterprise Platform · CI/CD
                </span>
              </div>
            </span>
          </div>

          {/* ZONE 2: 5 CLEAN NAVIGATION LINKS */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => handleTabClick('overview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                activeTab === 'overview' && currentUser
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Tổng quan</span>
              {!currentUser && <Lock className="w-3 h-3 text-slate-400 ml-0.5" />}
            </button>

            <button
              onClick={() => handleTabClick('members')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                activeTab === 'members' && currentUser
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Nhân sự</span>
              {!currentUser && <Lock className="w-3 h-3 text-slate-400 ml-0.5" />}
            </button>

            <button
              onClick={() => handleTabClick('events')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                activeTab === 'events' && currentUser
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Lịch Sự kiện</span>
              {!currentUser && <Lock className="w-3 h-3 text-slate-400 ml-0.5" />}
            </button>

            <button
              onClick={() => handleTabClick('treasury')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                activeTab === 'treasury' && currentUser
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>Sổ Quỹ</span>
              {!currentUser && <Lock className="w-3 h-3 text-slate-400 ml-0.5" />}
            </button>

            <button
              onClick={() => handleTabClick('cicd')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap relative ${
                activeTab === 'cicd' && currentUser
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>Pipeline CI/CD</span>
              {!currentUser ? (
                <Lock className="w-3 h-3 text-indigo-400 ml-0.5" />
              ) : simulateBug ? (
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse ml-0.5" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-emerald-400 ml-0.5" />
              )}
            </button>
          </nav>

          {/* ZONE 3: PRIMARY ACTIONS (Quality Gate Indicator + User Profile + Reset Data) */}
          <div className="flex items-center gap-2">
            {/* Quick status pill for CI/CD */}
            <button
              onClick={() => handleTabClick('cicd')}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono font-bold rounded-lg border transition-all ${
                pipelinePassed
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                  : 'bg-rose-50 border-rose-200 text-rose-800 hover:bg-rose-100 animate-pulse'
              }`}
            >
              {pipelinePassed ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>CI/CD: Passed (12/12)</span>
                </>
              ) : (
                <>
                  <Flame className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>CI/CD: Bug Blocked ❌</span>
                </>
              )}
            </button>

            {/* User Profile / Login Button */}
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-xl border border-slate-200 hover:border-slate-300 bg-white text-slate-800 hover:bg-slate-50 transition-all text-xs shadow-xs"
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs text-white ${
                      currentUser.role === 'admin'
                        ? 'bg-purple-600'
                        : currentUser.role === 'treasurer'
                        ? 'bg-emerald-600'
                        : currentUser.role === 'event_lead'
                        ? 'bg-amber-600'
                        : 'bg-blue-600'
                    }`}
                  >
                    {currentUser.fullName.split(' ').slice(-1)[0][0]}
                  </div>
                  <div className="flex flex-col text-left hidden sm:flex">
                    <span className="text-xs font-bold leading-tight text-slate-900 truncate max-w-[100px]">
                      {currentUser.fullName}
                    </span>
                    <span className="text-[10px] text-slate-500 leading-tight truncate max-w-[100px]">
                      {currentUser.roleTitle}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {showUserDropdown && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl border border-slate-200 shadow-xl p-3 z-50">
                    <div className="p-2 border-b border-slate-100 pb-3 mb-2">
                      <div className="text-xs font-bold text-slate-900">{currentUser.fullName}</div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        MSSV: {currentUser.mssv}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">{currentUser.email}</div>
                      <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                        <ShieldCheck className="w-3 h-3" />
                        <span>{currentUser.department}</span>
                      </div>
                    </div>

                    <div className="mb-2">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        <span>Chuyển vai trò nhanh (Demo RBAC)</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1 mt-1">
                        <button
                          onClick={() => handleSwitchRole('admin')}
                          className={`p-1.5 text-left rounded-lg text-[11px] transition-colors ${
                            currentUser.role === 'admin'
                              ? 'bg-purple-100 text-purple-900 font-bold'
                              : 'hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          👑 Chủ nhiệm
                        </button>
                        <button
                          onClick={() => handleSwitchRole('treasurer')}
                          className={`p-1.5 text-left rounded-lg text-[11px] transition-colors ${
                            currentUser.role === 'treasurer'
                              ? 'bg-emerald-100 text-emerald-900 font-bold'
                              : 'hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          💰 Thủ quỹ
                        </button>
                        <button
                          onClick={() => handleSwitchRole('event_lead')}
                          className={`p-1.5 text-left rounded-lg text-[11px] transition-colors ${
                            currentUser.role === 'event_lead'
                              ? 'bg-amber-100 text-amber-900 font-bold'
                              : 'hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          🎪 Sự kiện
                        </button>
                        <button
                          onClick={() => handleSwitchRole('member')}
                          className={`p-1.5 text-left rounded-lg text-[11px] transition-colors ${
                            currentUser.role === 'member'
                              ? 'bg-blue-100 text-blue-900 font-bold'
                              : 'hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          👤 Thành viên
                        </button>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-2 space-y-1">
                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          setIsAuthModalOpen(true);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100 rounded-lg transition-colors text-left"
                      >
                        <UserPlus className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Đăng ký thành viên mới</span>
                      </button>

                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          setCurrentUser(null);
                          setIsAuthModalOpen(true);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg transition-colors text-left font-semibold"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Đăng xuất tài khoản</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-xs transition-all"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Đăng nhập / Đăng ký</span>
              </button>
            )}

            {/* Reset Button */}
            <button
              onClick={handleResetData}
              title="Khôi phục dữ liệu mẫu ban đầu"
              className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* MOBILE BOTTOM NAVIGATION STRIP */}
        <div className="flex md:hidden border-t border-slate-100 px-2 py-1 overflow-x-auto gap-1">
          <button
            onClick={() => handleTabClick('overview')}
            className={`px-2.5 py-1 text-xs whitespace-nowrap rounded flex items-center gap-1 ${
              activeTab === 'overview' && currentUser ? 'bg-slate-200 font-semibold' : 'text-slate-600'
            }`}
          >
            <span>Tổng quan</span>
            {!currentUser && <Lock className="w-3 h-3 text-slate-400" />}
          </button>
          <button
            onClick={() => handleTabClick('members')}
            className={`px-2.5 py-1 text-xs whitespace-nowrap rounded flex items-center gap-1 ${
              activeTab === 'members' && currentUser ? 'bg-slate-200 font-semibold' : 'text-slate-600'
            }`}
          >
            <span>Nhân sự ({members.length})</span>
            {!currentUser && <Lock className="w-3 h-3 text-slate-400" />}
          </button>
          <button
            onClick={() => handleTabClick('events')}
            className={`px-2.5 py-1 text-xs whitespace-nowrap rounded flex items-center gap-1 ${
              activeTab === 'events' && currentUser ? 'bg-slate-200 font-semibold' : 'text-slate-600'
            }`}
          >
            <span>Sự kiện ({events.length})</span>
            {!currentUser && <Lock className="w-3 h-3 text-slate-400" />}
          </button>
          <button
            onClick={() => handleTabClick('treasury')}
            className={`px-2.5 py-1 text-xs whitespace-nowrap rounded flex items-center gap-1 ${
              activeTab === 'treasury' && currentUser ? 'bg-slate-200 font-semibold' : 'text-slate-600'
            }`}
          >
            <span>Sổ Quỹ</span>
            {!currentUser && <Lock className="w-3 h-3 text-slate-400" />}
          </button>
          <button
            onClick={() => handleTabClick('cicd')}
            className={`px-2.5 py-1 text-xs whitespace-nowrap rounded font-bold flex items-center gap-1 ${
              activeTab === 'cicd' && currentUser ? 'bg-indigo-600 text-white' : 'text-indigo-600'
            }`}
          >
            <span>CI/CD Pipeline</span>
            {!currentUser && <Lock className="w-3 h-3 text-indigo-400" />}
          </button>
        </div>
      </header>

      {/* RBAC ROLE DEMO & ACTIVE IDENTITY TESTING STRIP */}
      <section className="bg-slate-900 text-slate-200 border-b border-slate-800 text-xs py-2 px-4 shadow-inner">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white flex items-center gap-1.5 shrink-0">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>Chế độ Phân quyền (RBAC Testing):</span>
            </span>
            {currentUser ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{currentUser.fullName} ({currentUser.roleTitle})</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                <Lock className="w-3 h-3 text-rose-400" />
                <span>Chưa đăng nhập (Khách bắt buộc đăng nhập để xem thông tin)</span>
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-slate-400 font-medium hidden lg:inline mr-1">
              Chuyển vai trò thử nghiệm nhanh:
            </span>
            <button
              onClick={() => handleSwitchRole('admin')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                currentUser?.role === 'admin'
                  ? 'bg-purple-600 text-white shadow-xs font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
              title="Vào vai Chủ nhiệm CLB (Toàn quyền quản trị)"
            >
              <span>👑 Chủ nhiệm</span>
            </button>
            <button
              onClick={() => handleSwitchRole('treasurer')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                currentUser?.role === 'treasurer'
                  ? 'bg-emerald-600 text-white shadow-xs font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
              title="Vào vai Phó Chủ nhiệm / Thủ quỹ (Duyệt chi)"
            >
              <span>💰 Thủ quỹ</span>
            </button>
            <button
              onClick={() => handleSwitchRole('event_lead')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                currentUser?.role === 'event_lead'
                  ? 'bg-amber-600 text-white shadow-xs font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
              title="Vào vai Trưởng ban Sự kiện (Tổ chức & Điểm danh)"
            >
              <span>🎪 Sự kiện</span>
            </button>
            <button
              onClick={() => handleSwitchRole('member')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                currentUser?.role === 'member'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
              title="Vào vai Hội viên CLB (Chỉ xem & Tự đăng ký)"
            >
              <span>👤 Hội viên</span>
            </button>
            {currentUser ? (
              <button
                onClick={() => handleSwitchRole('guest')}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 transition-colors flex items-center gap-1"
                title="Đăng xuất về trạng thái Chưa đăng nhập (Khóa xem dữ liệu)"
              >
                <LogOut className="w-3 h-3" />
                <span>Thoát ra</span>
              </button>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors flex items-center gap-1"
              >
                <LogIn className="w-3 h-3" />
                <span>Đăng nhập</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* MAIN VIEWPORT */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {!currentUser ? (
          <AuthGateView
            authUsers={authUsers}
            onLoginSuccess={(user) => {
              setCurrentUser(user);
              setIsAuthModalOpen(false);
            }}
            onRegisterNewUser={handleRegisterNewUser}
          />
        ) : (
          <>
            {activeTab === 'overview' && (
              <OverviewTab
                members={members}
                events={events}
                transactions={transactions}
                pipelinePassed={pipelinePassed}
                onNavigateTab={(tab) => setActiveTab(tab)}
              />
            )}

            {activeTab === 'members' && (
              <MembersTab
                members={members}
                onAddMember={handleAddMember}
                onApproveMember={handleApproveMember}
                onAddScore={handleAddScore}
                onDeleteMember={handleDeleteMember}
                currentUser={currentUser}
                onRequireAuth={() => setIsAuthModalOpen(true)}
              />
            )}

            {activeTab === 'events' && (
              <EventsTab
                events={events}
                members={members}
                onAddEvent={handleAddEvent}
                onToggleAttendee={handleToggleAttendee}
                currentUser={currentUser}
                onRequireAuth={() => setIsAuthModalOpen(true)}
              />
            )}

            {activeTab === 'treasury' && (
              <TreasuryTab
                transactions={transactions}
                onAddTransaction={handleAddTransaction}
                onApproveTransaction={handleApproveTransaction}
                onRejectTransaction={handleRejectTransaction}
                currentUser={currentUser}
                onRequireAuth={() => setIsAuthModalOpen(true)}
              />
            )}

            {activeTab === 'cicd' && (
              <CicdPipelineTab
                simulateBug={simulateBug}
                onToggleSimulateBug={(bugState) => setSimulateBug(bugState)}
                onPipelineRunComplete={(passed) => setPipelinePassed(passed)}
                currentUser={currentUser}
                onRequireAuth={() => setIsAuthModalOpen(true)}
              />
            )}
          </>
        )}
      </main>

      {/* QUIET FOOTER */}
      <footer className="mt-auto border-t border-slate-200 py-4 text-center text-xs text-slate-500 bg-white">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="font-mono text-[11px] text-slate-500">
            UniClub Hub · Nền tảng Điều hành Câu lạc bộ & Pipeline CI/CD Doanh nghiệp · Bản quyền © 2026
          </div>
          <div className="flex items-center gap-3 text-slate-500 text-[11px]">
            <span>React 19</span>
            <span>·</span>
            <span>TypeScript Strict</span>
            <span>·</span>
            <span>Vitest Unit Testing</span>
            <span>·</span>
            <span>GitHub Actions CI/CD</span>
          </div>
        </div>
      </footer>

      {/* Authentication & Registration Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          if (currentUser) {
            setIsAuthModalOpen(false);
          }
        }}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setIsAuthModalOpen(false);
        }}
        authUsers={authUsers}
        onRegisterNewUser={handleRegisterNewUser}
        isMandatory={!currentUser}
      />
    </div>
  );
}
