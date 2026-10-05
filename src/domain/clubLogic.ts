import { ClubMember, ClubEvent, TreasuryTransaction, TreasurySummary, UnitTestCaseResult, AuthUser, RegisterFormData, UserRole } from '../types.ts';

// ============================================================================
// FORMATTERS & HELPERS
// ============================================================================
export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDateTime(isoString: string): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// ============================================================================
// 1. MEMBER VALIDATION & CLASSIFICATION (DOMAIN LOGIC)
// ============================================================================
export interface MemberValidationParams {
  mssv: string;
  fullName: string;
  email: string;
  phone: string;
  existingMembers: ClubMember[];
  excludeId?: string;
}

export interface MemberValidationResult {
  isValid: boolean;
  errors: {
    mssv?: string;
    fullName?: string;
    email?: string;
    phone?: string;
  };
}

export function validateStudentMember(params: MemberValidationParams): MemberValidationResult {
  const errors: MemberValidationResult['errors'] = {};
  const trimmedMssv = params.mssv.trim().toUpperCase();
  const trimmedName = params.fullName.trim();
  const trimmedEmail = params.email.trim();
  const trimmedPhone = params.phone.trim();

  // 1. Check Full Name
  if (!trimmedName || trimmedName.length < 3) {
    errors.fullName = 'Họ và tên sinh viên tối thiểu từ 3 ký tự trở lên.';
  }

  // 2. Check MSSV format (6 - 10 chars, alphanumeric)
  if (!trimmedMssv) {
    errors.mssv = 'Mã số sinh viên (MSSV) không được để trống.';
  } else if (trimmedMssv.length < 6 || trimmedMssv.length > 10) {
    errors.mssv = `Độ dài MSSV phải từ 6 đến 10 ký tự (Hiện tại: ${trimmedMssv.length} ký tự).`;
  } else if (!/^[A-Z0-9]+$/.test(trimmedMssv)) {
    errors.mssv = 'MSSV chỉ được chứa ký tự chữ và số (ví dụ: B21DCCN001, 20210001).';
  } else {
    // Check duplicate MSSV
    const isDuplicate = params.existingMembers.some(
      (m) => m.mssv.toUpperCase() === trimmedMssv && m.id !== params.excludeId
    );
    if (isDuplicate) {
      errors.mssv = `Mã sinh viên ${trimmedMssv} đã tồn tại trong danh sách CLB. Không thể đăng ký trùng!`;
    }
  }

  // 3. Check Email format
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!trimmedEmail) {
    errors.email = 'Email liên hệ không được để trống.';
  } else if (!emailRegex.test(trimmedEmail)) {
    errors.email = 'Định dạng email không hợp lệ (ví dụ: sinhvien@university.edu.vn).';
  }

  // 4. Check Phone format (10 digits starting with 0)
  const phoneRegex = /^0\d{9}$/;
  if (!trimmedPhone) {
    errors.phone = 'Số điện thoại liên hệ không được để trống.';
  } else if (!phoneRegex.test(trimmedPhone)) {
    errors.phone = 'Số điện thoại phải gồm đúng 10 chữ số và bắt đầu bằng số 0 (ví dụ: 0912345678).';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function classifyMemberActivity(score: number): {
  level: 'Xuất sắc' | 'Tích cực' | 'Cần cố gắng';
  description: string;
} {
  if (score >= 85) {
    return {
      level: 'Xuất sắc',
      description: 'Đóng góp nòng cốt, hoàn thành vượt chỉ tiêu ban',
    };
  }
  if (score >= 60) {
    return {
      level: 'Tích cực',
      description: 'Tham gia đầy đủ các sự kiện và phiên họp CLB',
    };
  }
  return {
    level: 'Cần cố gắng',
    description: 'Chuyên cần thấp, cần tăng cường tham gia phong trào',
  };
}

// ============================================================================
// 2. TREASURY DOMAIN LOGIC & BUDGET SAFETY GUARD
// ============================================================================
export function calculateTreasuryBalance(
  transactions: TreasuryTransaction[],
  simulateBug = false
): TreasurySummary {
  let totalIncome = 0;
  let totalExpense = 0;
  let pendingExpense = 0;

  for (const t of transactions) {
    if (t.type === 'income' && t.status === 'approved') {
      totalIncome += t.amount;
    } else if (t.type === 'expense' && t.status === 'approved') {
      totalExpense += t.amount;
    } else if (t.type === 'expense' && t.status === 'pending') {
      pendingExpense += t.amount;
    }
  }

  // In standard clean mode: Available Balance = Total Approved Income - Total Approved Expense
  let availableBalance = totalIncome - totalExpense;

  // DELIBERATE BUG INJECTION FOR FACULTY CI/CD QUALITY GATE DEMO
  if (simulateBug) {
    // Deliberate math bug: Subtracts unapproved pending expense and an arbitrary phantom offset
    availableBalance = totalIncome - totalExpense - pendingExpense - 750000;
  }

  return {
    totalIncome,
    totalExpense,
    availableBalance,
    pendingExpense,
  };
}

export function canApproveExpense(
  expenseAmount: number,
  currentBalance: number
): { allowed: boolean; reason?: string } {
  if (expenseAmount <= 0) {
    return {
      allowed: false,
      reason: 'Số tiền chi đề xuất phải lớn hơn 0 VNĐ.',
    };
  }

  if (expenseAmount > currentBalance) {
    return {
      allowed: false,
      reason: `Từ chối phê duyệt: Số tiền chi (${formatVND(
        expenseAmount
      )}) vượt quá số dư khả dụng (${formatVND(
        currentBalance
      )}) của Quỹ CLB. Cơ chế bảo vệ ngân sách ngăn chặn âm quỹ!`,
    };
  }

  return {
    allowed: true,
  };
}

// ============================================================================
// 3. EVENT SCHEDULE CONFLICT DETECTION & ATTENDANCE LOGIC
// ============================================================================
export interface EventConflictParams {
  id?: string;
  date: string; // YYYY-MM-DD
  location: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
}

export function checkEventScheduleConflict(
  newEvent: EventConflictParams,
  existingEvents: ClubEvent[]
): { hasConflict: boolean; conflictingEvent?: ClubEvent; reason?: string } {
  const newLoc = newEvent.location.trim().toLowerCase();
  const newDate = newEvent.date.trim();

  // Ensure start is before end
  if (newEvent.startTime >= newEvent.endTime) {
    return {
      hasConflict: true,
      reason: 'Giờ bắt đầu sự kiện phải diễn ra trước giờ kết thúc.',
    };
  }

  for (const event of existingEvents) {
    // Skip checking against itself if updating
    if (newEvent.id && event.id === newEvent.id) {
      continue;
    }

    const sameDate = event.date.trim() === newDate;
    const sameLocation = event.location.trim().toLowerCase() === newLoc;

    if (sameDate && sameLocation) {
      // Overlap condition:
      // Overlap if: newEvent.startTime < event.endTime AND newEvent.endTime > event.startTime
      const hasTimeOverlap =
        newEvent.startTime < event.endTime && newEvent.endTime > event.startTime;

      if (hasTimeOverlap) {
        return {
          hasConflict: true,
          conflictingEvent: event,
          reason: `Xung đột địa điểm: Phòng "${event.location}" đã có sự kiện "${event.title}" diễn ra từ ${event.startTime} đến ${event.endTime} ngày ${event.date}.`,
        };
      }
    }
  }

  return {
    hasConflict: false,
  };
}

export function calculateAttendanceRate(attendedCount: number, totalExpected: number): number {
  if (totalExpected <= 0 || attendedCount <= 0) {
    return 0;
  }
  const rate = (attendedCount / totalExpected) * 100;
  return Math.min(100, Math.round(rate * 10) / 10);
}

// ============================================================================
// 4. AUTHENTICATION & ROLE-BASED ACCESS CONTROL (RBAC) LOGIC
// ============================================================================
export interface AuthValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function validateRegistration(
  formData: RegisterFormData,
  existingUsers: AuthUser[]
): AuthValidationResult {
  const errors: Record<string, string> = {};
  const trimmedName = formData.fullName.trim();
  const trimmedMssv = formData.mssv.trim().toUpperCase();
  const trimmedEmail = formData.email.trim().toLowerCase();
  const trimmedPhone = formData.phone.trim();

  if (!trimmedName || trimmedName.length < 3) {
    errors.fullName = 'Họ và tên tối thiểu từ 3 ký tự trở lên.';
  }

  if (!trimmedMssv) {
    errors.mssv = 'Mã số sinh viên không được để trống.';
  } else if (trimmedMssv.length < 6 || trimmedMssv.length > 10) {
    errors.mssv = 'MSSV phải có độ dài từ 6 đến 10 ký tự.';
  } else if (!/^[A-Z0-9]+$/.test(trimmedMssv)) {
    errors.mssv = 'MSSV chỉ được chứa chữ cái và số.';
  } else if (existingUsers.some(u => u.mssv.toUpperCase() === trimmedMssv)) {
    errors.mssv = `MSSV ${trimmedMssv} đã được đăng ký tài khoản trong hệ thống.`;
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!trimmedEmail) {
    errors.email = 'Email không được để trống.';
  } else if (!emailRegex.test(trimmedEmail)) {
    errors.email = 'Định dạng email sinh viên không hợp lệ.';
  } else if (existingUsers.some(u => u.email.toLowerCase() === trimmedEmail)) {
    errors.email = 'Địa chỉ email này đã được sử dụng.';
  }

  const phoneRegex = /^0\d{9}$/;
  if (!trimmedPhone) {
    errors.phone = 'Số điện thoại không được để trống.';
  } else if (!phoneRegex.test(trimmedPhone)) {
    errors.phone = 'Số điện thoại phải gồm 10 chữ số và bắt đầu bằng số 0.';
  }

  if (!formData.password) {
    errors.password = 'Mật khẩu không được để trống.';
  } else if (formData.password.length < 6) {
    errors.password = 'Mật khẩu phải có ít nhất 6 ký tự bảo mật.';
  }

  if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = 'Mật khẩu xác nhận không trùng khớp.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function authenticateUser(
  identifier: string,
  password: string,
  users: AuthUser[]
): { success: boolean; user?: AuthUser; error?: string } {
  const cleanId = identifier.trim().toLowerCase();
  const cleanPass = password.trim();

  if (!cleanId || !cleanPass) {
    return {
      success: false,
      error: 'Vui lòng nhập đầy đủ Email/MSSV và Mật khẩu.',
    };
  }

  const matched = users.find(
    u => u.email.toLowerCase() === cleanId || u.mssv.toLowerCase() === cleanId
  );

  if (!matched) {
    return {
      success: false,
      error: 'Tài khoản không tồn tại. Vui lòng kiểm tra lại MSSV hoặc Email.',
    };
  }

  if (matched.password && matched.password !== cleanPass) {
    return {
      success: false,
      error: 'Mật khẩu không chính xác. Vui lòng thử lại!',
    };
  }

  return {
    success: true,
    user: matched,
  };
}

export function canPerformAction(
  user: AuthUser | null,
  action: 'manage_members' | 'approve_expense' | 'create_event' | 'run_cicd' | 'view_overview'
): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;

  switch (action) {
    case 'view_overview':
      return true;
    case 'approve_expense':
      return user.role === 'treasurer';
    case 'create_event':
      return user.role === 'event_lead' || user.role === 'treasurer';
    case 'manage_members':
      return false;
    case 'run_cicd':
      return user.role === 'event_lead';
    default:
      return false;
  }
}

// ============================================================================
// 5. IN-BROWSER UNIT TEST SUITE RUNNER (12 TEST CASES)
// ============================================================================
export function runBrowserUnitTests(simulateBug = false): UnitTestCaseResult[] {
  const results: UnitTestCaseResult[] = [];

  const mockMembers: ClubMember[] = [
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

  const mockTransactions: TreasuryTransaction[] = [
    {
      id: 'tx-01',
      voucherCode: 'THU-2026-001',
      title: 'Thu hội phí sinh viên kỳ 1',
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
      title: 'Mua bánh kẹo sinh hoạt định kỳ',
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
      title: 'In banner chào đón tân sinh viên',
      type: 'expense',
      amount: 1500000,
      category: 'Truyền thông',
      requester: 'Ban Truyền thông',
      date: '2026-03-01',
      status: 'pending',
    },
  ];

  const mockEvents: ClubEvent[] = [
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

  // Test 1: validateStudentMember valid data
  {
    const start = performance.now();
    const res = validateStudentMember({
      mssv: 'B22DCCN999',
      fullName: 'Lê Hoàng Long',
      email: 'long.le@university.edu.vn',
      phone: '0934567890',
      existingMembers: mockMembers,
    });
    const duration = Math.round((performance.now() - start) * 100) / 100;
    results.push({
      id: 'TC-01',
      title: 'Xác thực hồ sơ sinh viên hợp lệ (MSSV, Email, SĐT)',
      targetFunction: 'validateStudentMember',
      inputSummary: 'MSSV: B22DCCN999, Email: university.edu.vn, SĐT: 0934567890',
      expected: 'isValid: true, errors: {}',
      actual: `isValid: ${res.isValid}, errors: ${JSON.stringify(res.errors)}`,
      latencyMs: duration,
      passed: res.isValid === true && Object.keys(res.errors).length === 0,
    });
  }

  // Test 2: validateStudentMember reject MSSV length outside 6-10
  {
    const start = performance.now();
    const res = validateStudentMember({
      mssv: 'B21',
      fullName: 'Võ Minh Quân',
      email: 'quan.vo@university.edu.vn',
      phone: '0911223344',
      existingMembers: mockMembers,
    });
    const duration = Math.round((performance.now() - start) * 100) / 100;
    const passed = res.isValid === false && !!res.errors.mssv;
    results.push({
      id: 'TC-02',
      title: 'Chặn MSSV ngắn hơn 6 ký tự hoặc dài hơn 10 ký tự',
      targetFunction: 'validateStudentMember',
      inputSummary: 'MSSV: B21 (độ dài 3 ký tự)',
      expected: 'isValid: false, errors.mssv contains length constraint error',
      actual: `isValid: ${res.isValid}, errors.mssv: "${res.errors.mssv || 'none'}"`,
      latencyMs: duration,
      passed,
    });
  }

  // Test 3: validateStudentMember reject duplicate MSSV
  {
    const start = performance.now();
    const res = validateStudentMember({
      mssv: 'B21DCCN001', // Already in mockMembers
      fullName: 'Người Trùng Mã',
      email: 'trungma@university.edu.vn',
      phone: '0909090909',
      existingMembers: mockMembers,
    });
    const duration = Math.round((performance.now() - start) * 100) / 100;
    const passed = res.isValid === false && (res.errors.mssv?.includes('đã tồn tại') ?? false);
    results.push({
      id: 'TC-03',
      title: 'Chặn đăng ký trùng MSSV đã có trong danh sách CLB',
      targetFunction: 'validateStudentMember',
      inputSummary: 'MSSV: B21DCCN001 (đã có của Nguyễn Văn An)',
      expected: 'isValid: false, thông báo trùng MSSV trong CLB',
      actual: `isValid: ${res.isValid}, errors.mssv: "${res.errors.mssv || 'none'}"`,
      latencyMs: duration,
      passed,
    });
  }

  // Test 4: validateStudentMember reject invalid email & invalid phone
  {
    const start = performance.now();
    const res = validateStudentMember({
      mssv: 'B22DCCN101',
      fullName: 'Đoàn Nhật Minh',
      email: 'invalid-email-domain',
      phone: '12345',
      existingMembers: mockMembers,
    });
    const duration = Math.round((performance.now() - start) * 100) / 100;
    const passed = res.isValid === false && !!res.errors.email && !!res.errors.phone;
    results.push({
      id: 'TC-04',
      title: 'Bắt lỗi định dạng Email sai cú pháp và SĐT không đủ 10 số',
      targetFunction: 'validateStudentMember',
      inputSummary: 'Email: invalid-email-domain, SĐT: 12345 (5 số, không bắt đầu 0)',
      expected: 'errors.email and errors.phone are both defined',
      actual: `emailErr: "${res.errors.email}", phoneErr: "${res.errors.phone}"`,
      latencyMs: duration,
      passed,
    });
  }

  // Test 5: calculateTreasuryBalance with clean mode vs bug mode
  {
    const start = performance.now();
    const summary = calculateTreasuryBalance(mockTransactions, simulateBug);
    const duration = Math.round((performance.now() - start) * 100) / 100;

    // Expected: Income = 5tr + 10tr = 15tr; Expense = 2tr; Balance = 13tr; Pending = 1.5tr
    const expectedIncome = 15000000;
    const expectedExpense = 2000000;
    const expectedBalance = 13000000;

    const passed =
      summary.totalIncome === expectedIncome &&
      summary.totalExpense === expectedExpense &&
      summary.availableBalance === expectedBalance;

    results.push({
      id: 'TC-05',
      title: 'Tính toán chính xác Số dư Quỹ CLB khả dụng (Approved Balance)',
      targetFunction: 'calculateTreasuryBalance',
      inputSummary: 'Thu đã duyệt: 15tr, Chi đã duyệt: 2tr, Chi chờ duyệt: 1.5tr',
      expected: `availableBalance: ${formatVND(expectedBalance)} (15.000.000 - 2.000.000)`,
      actual: `availableBalance: ${formatVND(summary.availableBalance)}${
        simulateBug ? ' [BUG: Trừ nhầm chi chờ duyệt & âm lệch số liệu]' : ''
      }`,
      latencyMs: duration,
      passed,
      errorDetails: passed
        ? undefined
        : `LỖI TOÁN HỌC QUỸ: Kỳ vọng ${formatVND(expectedBalance)} nhưng tính ra ${formatVND(
            summary.availableBalance
          )}. Pipeline Stage 02 đã bắt được lỗi!`,
    });
  }

  // Test 6: calculateTreasuryBalance isolates pending expenses from available balance
  {
    const start = performance.now();
    const summary = calculateTreasuryBalance(mockTransactions, false);
    const duration = Math.round((performance.now() - start) * 100) / 100;
    const passed = summary.pendingExpense === 1500000 && summary.availableBalance === 13000000;
    results.push({
      id: 'TC-06',
      title: 'Phiếu chi chờ duyệt (Pending) không bị trừ sớm vào số dư khả dụng',
      targetFunction: 'calculateTreasuryBalance',
      inputSummary: 'Phiếu CHI-2026-002: 1.5tr ở trạng thái Pending',
      expected: 'pendingExpense: 1.500.000 ₫, availableBalance: 13.000.000 ₫',
      actual: `pendingExpense: ${formatVND(summary.pendingExpense)}, availableBalance: ${formatVND(
        summary.availableBalance
      )}`,
      latencyMs: duration,
      passed,
    });
  }

  // Test 7: canApproveExpense allows valid expense
  {
    const start = performance.now();
    const check = canApproveExpense(3000000, 13000000);
    const duration = Math.round((performance.now() - start) * 100) / 100;
    results.push({
      id: 'TC-07',
      title: 'Cho phép duyệt phiếu chi hợp lệ khi nằm trong hạn mức số dư quỹ',
      targetFunction: 'canApproveExpense',
      inputSummary: 'Số tiền chi: 3.000.000 ₫, Số dư quỹ hiện có: 13.000.000 ₫',
      expected: 'allowed: true',
      actual: `allowed: ${check.allowed}`,
      latencyMs: duration,
      passed: check.allowed === true,
    });
  }

  // Test 8: canApproveExpense blocks overdraft (preventing negative balance)
  {
    const start = performance.now();
    const check = canApproveExpense(15000000, 13000000); // 15tr > 13tr
    const duration = Math.round((performance.now() - start) * 100) / 100;
    const passed = check.allowed === false && !!check.reason;
    results.push({
      id: 'TC-08',
      title: 'Chặn duyệt chi khi số tiền chi vượt quá số dư Quỹ CLB hiện tại',
      targetFunction: 'canApproveExpense',
      inputSummary: 'Số tiền chi: 15.000.000 ₫, Số dư quỹ hiện có: 13.000.000 ₫ (vượt 2tr)',
      expected: 'allowed: false, reason contains overdraft warning',
      actual: `allowed: ${check.allowed}, reason: "${check.reason}"`,
      latencyMs: duration,
      passed,
    });
  }

  // Test 9: checkEventScheduleConflict detects room and time collision
  {
    const start = performance.now();
    const conflict = checkEventScheduleConflict(
      {
        date: '2026-10-15',
        location: 'Hội trường A2-301',
        startTime: '09:00', // 09:00 - 11:00 overlaps with 08:00 - 11:30
        endTime: '11:00',
      },
      mockEvents
    );
    const duration = Math.round((performance.now() - start) * 100) / 100;
    const passed = conflict.hasConflict === true && !!conflict.conflictingEvent;
    results.push({
      id: 'TC-09',
      title: 'Thuật toán phát hiện xung đột trùng phòng và giờ tổ chức sự kiện',
      targetFunction: 'checkEventScheduleConflict',
      inputSummary: 'Ngày: 2026-10-15, Phòng: Hội trường A2-301, Giờ: 09:00 - 11:00',
      expected: 'hasConflict: true, conflictingEvent: Workshop Git & GitHub Actions',
      actual: `hasConflict: ${conflict.hasConflict}, event: "${conflict.conflictingEvent?.title}"`,
      latencyMs: duration,
      passed,
    });
  }

  // Test 10: calculateAttendanceRate handles percentage & zero edge cases
  {
    const start = performance.now();
    const rate1 = calculateAttendanceRate(34, 40); // 34/40 = 85.0%
    const rate2 = calculateAttendanceRate(0, 0); // division by zero edge case
    const duration = Math.round((performance.now() - start) * 100) / 100;
    const passed = rate1 === 85 && rate2 === 0;
    results.push({
      id: 'TC-10',
      title: 'Tính tỷ lệ điểm danh chuyên cần (%) và xử lý an toàn phép chia cho 0',
      targetFunction: 'calculateAttendanceRate',
      inputSummary: 'Case A: 34/40 người (85%), Case B: 0/0 người dự kiến',
      expected: 'rate1: 85.0%, rate2: 0.0%',
      actual: `rate1: ${rate1}%, rate2: ${rate2}%`,
      latencyMs: duration,
      passed,
    });
  }

  // Test 11: authenticateUser verifies valid credentials vs invalid
  {
    const start = performance.now();
    const mockAuthUsers: AuthUser[] = [
      {
        id: 'u-1',
        mssv: 'B21DCCN001',
        fullName: 'Nguyễn Văn An',
        email: 'an.nguyen@university.edu.vn',
        department: 'Ban Chủ nhiệm',
        role: 'admin',
        roleTitle: 'Chủ nhiệm CLB',
        status: 'official',
        password: 'password123',
      },
    ];

    const authSuccess = authenticateUser('B21DCCN001', 'password123', mockAuthUsers);
    const authWrongPass = authenticateUser('B21DCCN001', 'wrongpass', mockAuthUsers);
    const duration = Math.round((performance.now() - start) * 100) / 100;
    const passed = authSuccess.success === true && authWrongPass.success === false;

    results.push({
      id: 'TC-11',
      title: 'Xác thực tài khoản đăng nhập (Hỗ trợ MSSV/Email và mật khẩu)',
      targetFunction: 'authenticateUser',
      inputSummary: 'Đúng pass: password123, Sai pass: wrongpass',
      expected: 'authSuccess: true, authWrongPass: false',
      actual: `authSuccess: ${authSuccess.success}, authWrongPass: ${authWrongPass.success}`,
      latencyMs: duration,
      passed,
    });
  }

  // Test 12: canPerformAction validates RBAC permissions correctly
  {
    const start = performance.now();
    const adminUser: AuthUser = {
      id: 'u-admin',
      mssv: 'B21DCCN001',
      fullName: 'Admin',
      email: 'admin@uni.edu.vn',
      department: 'Ban Chủ nhiệm',
      role: 'admin',
      roleTitle: 'Chủ nhiệm',
      status: 'official',
    };
    const memberUser: AuthUser = {
      id: 'u-mem',
      mssv: 'B22DCCN999',
      fullName: 'Thành viên',
      email: 'mem@uni.edu.vn',
      department: 'Ban Chuyên môn',
      role: 'member',
      roleTitle: 'Thành viên',
      status: 'official',
    };

    const adminCanApprove = canPerformAction(adminUser, 'approve_expense');
    const memberCannotApprove = canPerformAction(memberUser, 'approve_expense');
    const duration = Math.round((performance.now() - start) * 100) / 100;
    const passed = adminCanApprove === true && memberCannotApprove === false;

    results.push({
      id: 'TC-12',
      title: 'Kiểm tra phân quyền vai trò người dùng (RBAC Guard - Admin vs Member)',
      targetFunction: 'canPerformAction',
      inputSummary: 'Hành động: approve_expense (Admin được phép, Member bị chặn)',
      expected: 'adminCanApprove: true, memberCannotApprove: false',
      actual: `admin: ${adminCanApprove}, member: ${memberCannotApprove}`,
      latencyMs: duration,
      passed,
    });
  }

  return results;
}
