import { describe, it, expect } from 'vitest';
import {
  validateStudentMember,
  calculateTreasuryBalance,
  canApproveExpense,
  checkEventScheduleConflict,
  calculateAttendanceRate,
  classifyMemberActivity,
  validateRegistration,
  authenticateUser,
  canPerformAction,
} from './clubLogic.ts';
import { ClubMember, ClubEvent, TreasuryTransaction, AuthUser } from '../types.ts';

describe('UniClub Hub - Domain Logic & Safety Rules Test Suite', () => {
  const existingMembers: ClubMember[] = [
    {
      id: 'm-01',
      mssv: 'B21DCCN001',
      fullName: 'Nguyễn Văn An',
      email: 'an.nguyen@university.edu.vn',
      phone: '0912345678',
      department: 'Ban Chủ nhiệm',
      role: 'Chủ nhiệm CLB',
      joinDate: '2023-09-01',
      status: 'official',
      activityScore: 95,
    },
    {
      id: 'm-02',
      mssv: 'B21DCCN002',
      fullName: 'Trần Thị Bình',
      email: 'binh.tran@university.edu.vn',
      phone: '0987654321',
      department: 'Ban Chuyên môn',
      role: 'Trưởng Ban',
      joinDate: '2023-10-15',
      status: 'official',
      activityScore: 88,
    },
  ];

  const sampleTransactions: TreasuryTransaction[] = [
    {
      id: 'tx-01',
      voucherCode: 'THU-2026-001',
      title: 'Hội phí sinh viên kỳ 1',
      type: 'income',
      amount: 5000000,
      category: 'Hội phí',
      requester: 'Ban Chủ nhiệm',
      date: '2026-01-10',
      status: 'approved',
    },
    {
      id: 'tx-02',
      voucherCode: 'THU-2026-002',
      title: 'Tài trợ doanh nghiệp TechCorp',
      type: 'income',
      amount: 10000000,
      category: 'Tài trợ',
      requester: 'Ban Đối ngoại',
      date: '2026-02-01',
      status: 'approved',
    },
    {
      id: 'tx-03',
      voucherCode: 'CHI-2026-001',
      title: 'Mua quà lưu niệm sinh hoạt',
      type: 'expense',
      amount: 2000000,
      category: 'Hậu cần',
      requester: 'Ban Hậu cần',
      date: '2026-02-15',
      status: 'approved',
    },
    {
      id: 'tx-04',
      voucherCode: 'CHI-2026-002',
      title: 'Chi phí truyền thông tuyển sinh',
      type: 'expense',
      amount: 1500000,
      category: 'Truyền thông',
      requester: 'Ban Truyền thông',
      date: '2026-03-01',
      status: 'pending',
    },
  ];

  const sampleEvents: ClubEvent[] = [
    {
      id: 'ev-01',
      title: 'Workshop Git & GitHub Actions Thực Chiến',
      category: 'Workshop',
      date: '2026-10-15',
      startTime: '08:00',
      endTime: '11:30',
      location: 'Hội trường A2-301',
      leadDepartment: 'Ban Chuyên môn',
      description: 'Hướng dẫn thiết lập CI/CD Pipeline',
      status: 'upcoming',
      attendees: ['m-01', 'm-02'],
      expectedAttendees: 50,
    },
  ];

  // Test Case 01
  it('TC-01: should validate successfully when student member data meets all constraints', () => {
    const res = validateStudentMember({
      mssv: 'B22DCCN999',
      fullName: 'Lê Hoàng Long',
      email: 'long.le@university.edu.vn',
      phone: '0934567890',
      existingMembers,
    });
    expect(res.isValid).toBe(true);
    expect(Object.keys(res.errors).length).toBe(0);
  });

  // Test Case 02
  it('TC-02: should reject MSSV with length shorter than 6 or longer than 10 characters', () => {
    const resShort = validateStudentMember({
      mssv: 'B21',
      fullName: 'Võ Minh Quân',
      email: 'quan.vo@university.edu.vn',
      phone: '0911223344',
      existingMembers,
    });
    expect(resShort.isValid).toBe(false);
    expect(resShort.errors.mssv).toBeDefined();

    const resLong = validateStudentMember({
      mssv: 'B21DCCN123456',
      fullName: 'Võ Minh Quân',
      email: 'quan.vo@university.edu.vn',
      phone: '0911223344',
      existingMembers,
    });
    expect(resLong.isValid).toBe(false);
    expect(resLong.errors.mssv).toBeDefined();
  });

  // Test Case 03
  it('TC-03: should reject duplicate MSSV that already exists in the club membership roster', () => {
    const res = validateStudentMember({
      mssv: 'b21dccn001', // Lowercase of existing B21DCCN001
      fullName: 'Trùng Mã Sinh Viên',
      email: 'duplicate@university.edu.vn',
      phone: '0912999888',
      existingMembers,
    });
    expect(res.isValid).toBe(false);
    expect(res.errors.mssv).toContain('đã tồn tại trong danh sách CLB');
  });

  // Test Case 04
  it('TC-04: should reject invalid email format and invalid phone number formats', () => {
    const res = validateStudentMember({
      mssv: 'B22DCCN101',
      fullName: 'Đoàn Nhật Minh',
      email: 'not-an-email',
      phone: '09123',
      existingMembers,
    });
    expect(res.isValid).toBe(false);
    expect(res.errors.email).toBeDefined();
    expect(res.errors.phone).toBeDefined();
  });

  // Test Case 05
  it('TC-05: should correctly calculate total approved income, total approved expense, and available balance', () => {
    const summary = calculateTreasuryBalance(sampleTransactions, false);
    expect(summary.totalIncome).toBe(15000000);
    expect(summary.totalExpense).toBe(2000000);
    expect(summary.availableBalance).toBe(13000000);
  });

  // Test Case 06
  it('TC-06: should keep pending expense isolated from current available balance', () => {
    const summary = calculateTreasuryBalance(sampleTransactions, false);
    expect(summary.pendingExpense).toBe(1500000);
    expect(summary.availableBalance).toBe(13000000);
  });

  // Test Case 07
  it('TC-07: should allow approving expense when requested amount is within available balance', () => {
    const check = canApproveExpense(3000000, 13000000);
    expect(check.allowed).toBe(true);
    expect(check.reason).toBeUndefined();
  });

  // Test Case 08
  it('TC-08: should reject expense approval when requested amount exceeds current available balance', () => {
    const check = canApproveExpense(15000000, 13000000);
    expect(check.allowed).toBe(false);
    expect(check.reason).toContain('vượt quá số dư khả dụng');
  });

  // Test Case 09
  it('TC-09: should detect schedule conflict when 2 events share the same date, room, and overlapping time', () => {
    const conflict = checkEventScheduleConflict(
      {
        date: '2026-10-15',
        location: 'Hội trường A2-301',
        startTime: '09:00',
        endTime: '11:00',
      },
      sampleEvents
    );
    expect(conflict.hasConflict).toBe(true);
    expect(conflict.conflictingEvent?.title).toBe('Workshop Git & GitHub Actions Thực Chiến');
  });

  // Test Case 10
  it('TC-10: should calculate accurate attendance percentage and safely handle 0 expected attendees', () => {
    const rateNormal = calculateAttendanceRate(34, 40);
    expect(rateNormal).toBe(85);

    const rateZero = calculateAttendanceRate(0, 0);
    expect(rateZero).toBe(0);

    const classification = classifyMemberActivity(88);
    expect(classification.level).toBe('Xuất sắc');
  });

  // Test Case 11: Authentication & Registration Validation
  it('TC-11: should correctly validate registration form and authenticate credentials', () => {
    const mockAuthUsers: AuthUser[] = [
      {
        id: 'u-01',
        mssv: 'B21DCCN001',
        fullName: 'Nguyễn Văn An',
        email: 'an.nguyen@university.edu.vn',
        department: 'Ban Chủ nhiệm',
        role: 'admin',
        roleTitle: 'Chủ nhiệm CLB',
        status: 'official',
        password: 'adminPassword123',
      },
    ];

    // Successful login by MSSV
    const loginByMssv = authenticateUser('B21DCCN001', 'adminPassword123', mockAuthUsers);
    expect(loginByMssv.success).toBe(true);
    expect(loginByMssv.user?.fullName).toBe('Nguyễn Văn An');

    // Successful login by Email
    const loginByEmail = authenticateUser('an.nguyen@university.edu.vn', 'adminPassword123', mockAuthUsers);
    expect(loginByEmail.success).toBe(true);

    // Failed login: Wrong password
    const loginFailPass = authenticateUser('B21DCCN001', 'wrongPass', mockAuthUsers);
    expect(loginFailPass.success).toBe(false);
    expect(loginFailPass.error).toContain('Mật khẩu không chính xác');

    // Registration validation rejection for duplicate email
    const regRes = validateRegistration(
      {
        fullName: 'Nguyễn Văn Mới',
        mssv: 'B23DCCN999',
        email: 'an.nguyen@university.edu.vn', // Duplicate email
        phone: '0912345678',
        department: 'Ban Chuyên môn',
        password: 'password123',
        confirmPassword: 'password123',
      },
      mockAuthUsers
    );
    expect(regRes.isValid).toBe(false);
    expect(regRes.errors.email).toContain('đã được sử dụng');
  });

  // Test Case 12: Role-Based Access Control (RBAC) Permission Gates
  it('TC-12: should enforce strict Role-Based Access Control (RBAC) permissions', () => {
    const admin: AuthUser = {
      id: 'u-1',
      mssv: 'B21DCCN001',
      fullName: 'Admin',
      email: 'a@uni.edu.vn',
      department: 'Ban Chủ nhiệm',
      role: 'admin',
      roleTitle: 'Chủ nhiệm',
      status: 'official',
    };
    const treasurer: AuthUser = {
      id: 'u-2',
      mssv: 'B21DCCN045',
      fullName: 'Treasurer',
      email: 't@uni.edu.vn',
      department: 'Ban Chủ nhiệm',
      role: 'treasurer',
      roleTitle: 'Thủ quỹ',
      status: 'official',
    };
    const regularMember: AuthUser = {
      id: 'u-3',
      mssv: 'B22DCCN215',
      fullName: 'Member',
      email: 'm@uni.edu.vn',
      department: 'Ban Chuyên môn',
      role: 'member',
      roleTitle: 'Thành viên',
      status: 'official',
    };

    // Admin can perform all actions
    expect(canPerformAction(admin, 'manage_members')).toBe(true);
    expect(canPerformAction(admin, 'approve_expense')).toBe(true);
    expect(canPerformAction(admin, 'create_event')).toBe(true);
    expect(canPerformAction(admin, 'run_cicd')).toBe(true);

    // Treasurer can approve expenses
    expect(canPerformAction(treasurer, 'approve_expense')).toBe(true);
    expect(canPerformAction(treasurer, 'manage_members')).toBe(false);

    // Regular member cannot approve expenses or manage members
    expect(canPerformAction(regularMember, 'approve_expense')).toBe(false);
    expect(canPerformAction(regularMember, 'manage_members')).toBe(false);
    expect(canPerformAction(regularMember, 'view_overview')).toBe(true);
  });
});
