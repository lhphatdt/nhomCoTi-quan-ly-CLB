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
} from 'lucide-react';
import { ClubMember, ClubEvent, TreasuryTransaction } from './types.ts';
import {
  INITIAL_MEMBERS,
  INITIAL_EVENTS,
  INITIAL_TRANSACTIONS,
} from './data/initialClubData.ts';
import { calculateTreasuryBalance, canApproveExpense } from './domain/clubLogic.ts';
import { OverviewTab } from './components/OverviewTab.tsx';
import { MembersTab } from './components/MembersTab.tsx';
import { EventsTab } from './components/EventsTab.tsx';
import { TreasuryTab } from './components/TreasuryTab.tsx';
import { CicdPipelineTab } from './components/CicdPipelineTab.tsx';

type TabType = 'overview' | 'members' | 'events' | 'treasury' | 'cicd';

const STORAGE_KEY_MEMBERS = 'uniclub_members_v1';
const STORAGE_KEY_EVENTS = 'uniclub_events_v1';
const STORAGE_KEY_TRANSACTIONS = 'uniclub_transactions_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans selection:bg-indigo-500 selection:text-white">
      {/* TOP BAR CONTRACT: Zone 1 (Brand), Zone 2 (5 Nav Links), Zone 3 (Actions) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-15 flex items-center justify-between gap-4">
          {/* ZONE 1: SINGLE-ELEMENT BRAND WORDMARK */}
          <div className="flex items-center gap-3 shrink-0">
            <span
              onClick={() => setActiveTab('overview')}
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
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Tổng quan</span>
            </button>

            <button
              onClick={() => setActiveTab('members')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                activeTab === 'members'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Nhân sự</span>
            </button>

            <button
              onClick={() => setActiveTab('events')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                activeTab === 'events'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Lịch Sự kiện</span>
            </button>

            <button
              onClick={() => setActiveTab('treasury')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                activeTab === 'treasury'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>Sổ Quỹ</span>
            </button>

            <button
              onClick={() => setActiveTab('cicd')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap relative ${
                activeTab === 'cicd'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>Pipeline CI/CD</span>
              {simulateBug ? (
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse ml-0.5" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-emerald-400 ml-0.5" />
              )}
            </button>
          </nav>

          {/* ZONE 3: PRIMARY ACTIONS (Quality Gate Indicator + Reset Data) */}
          <div className="flex items-center gap-2">
            {/* Quick status pill for CI/CD */}
            <button
              onClick={() => setActiveTab('cicd')}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono font-bold rounded-lg border transition-all ${
                pipelinePassed
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                  : 'bg-rose-50 border-rose-200 text-rose-800 hover:bg-rose-100 animate-pulse'
              }`}
            >
              {pipelinePassed ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>CI/CD: Passed (10/10)</span>
                </>
              ) : (
                <>
                  <Flame className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>CI/CD: Bug Blocked ❌</span>
                </>
              )}
            </button>

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
            onClick={() => setActiveTab('overview')}
            className={`px-2.5 py-1 text-xs whitespace-nowrap rounded ${
              activeTab === 'overview' ? 'bg-slate-200 font-semibold' : 'text-slate-600'
            }`}
          >
            Tổng quan
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`px-2.5 py-1 text-xs whitespace-nowrap rounded ${
              activeTab === 'members' ? 'bg-slate-200 font-semibold' : 'text-slate-600'
            }`}
          >
            Nhân sự ({members.length})
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`px-2.5 py-1 text-xs whitespace-nowrap rounded ${
              activeTab === 'events' ? 'bg-slate-200 font-semibold' : 'text-slate-600'
            }`}
          >
            Sự kiện ({events.length})
          </button>
          <button
            onClick={() => setActiveTab('treasury')}
            className={`px-2.5 py-1 text-xs whitespace-nowrap rounded ${
              activeTab === 'treasury' ? 'bg-slate-200 font-semibold' : 'text-slate-600'
            }`}
          >
            Sổ Quỹ
          </button>
          <button
            onClick={() => setActiveTab('cicd')}
            className={`px-2.5 py-1 text-xs whitespace-nowrap rounded font-bold ${
              activeTab === 'cicd' ? 'bg-indigo-600 text-white' : 'text-indigo-600'
            }`}
          >
            CI/CD Pipeline
          </button>
        </div>
      </header>

      {/* MAIN VIEWPORT */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
          />
        )}

        {activeTab === 'events' && (
          <EventsTab
            events={events}
            members={members}
            onAddEvent={handleAddEvent}
            onToggleAttendee={handleToggleAttendee}
          />
        )}

        {activeTab === 'treasury' && (
          <TreasuryTab
            transactions={transactions}
            onAddTransaction={handleAddTransaction}
            onApproveTransaction={handleApproveTransaction}
            onRejectTransaction={handleRejectTransaction}
          />
        )}

        {activeTab === 'cicd' && (
          <CicdPipelineTab
            simulateBug={simulateBug}
            onToggleSimulateBug={(bugState) => setSimulateBug(bugState)}
            onPipelineRunComplete={(passed) => setPipelinePassed(passed)}
          />
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
    </div>
  );
}
