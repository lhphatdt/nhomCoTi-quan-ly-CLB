export type Department =
  | 'Ban Chủ nhiệm'
  | 'Ban Chuyên môn'
  | 'Ban Truyền thông'
  | 'Ban Sự kiện'
  | 'Ban Đối ngoại - Hậu cần';

export type UserRole = 'admin' | 'treasurer' | 'event_lead' | 'member' | 'guest';

export interface AuthUser {
  id: string;
  mssv: string;
  fullName: string;
  email: string;
  phone?: string;
  department: Department;
  role: UserRole;
  roleTitle: string;
  avatar?: string;
  status: MemberStatus;
  password?: string;
}

export interface RegisterFormData {
  fullName: string;
  mssv: string;
  email: string;
  phone: string;
  department: Department;
  password: string;
  confirmPassword: string;
}

export type MemberStatus = 'official' | 'pending';

export interface ClubMember {
  id: string;
  mssv: string;
  fullName: string;
  email: string;
  phone: string;
  department: Department;
  role: string;
  joinDate: string;
  status: MemberStatus;
  activityScore: number;
}

export type EventCategory = 'Workshop' | 'Hackathon' | 'Sinh hoạt định kỳ' | 'Tuyển quân';

export interface ClubEvent {
  id: string;
  title: string;
  category: EventCategory;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  leadDepartment: Department;
  description: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  attendees: string[]; // member IDs who checked in
  expectedAttendees: number;
}

export type TransactionType = 'income' | 'expense';
export type TransactionStatus = 'approved' | 'pending' | 'rejected';

export interface TreasuryTransaction {
  id: string;
  voucherCode: string;
  title: string;
  type: TransactionType;
  amount: number;
  category: string;
  requester: string;
  date: string;
  status: TransactionStatus;
  note?: string;
}

export interface TreasurySummary {
  totalIncome: number;
  totalExpense: number;
  availableBalance: number;
  pendingExpense: number;
}

export type PipelineStageStatus = 'idle' | 'running' | 'passed' | 'failed' | 'skipped';

export interface PipelineStage {
  id: string;
  stageNumber: string;
  name: string;
  command: string;
  status: PipelineStageStatus;
  durationMs: number;
  logs: string[];
  description: string;
}

export interface UnitTestCaseResult {
  id: string;
  title: string;
  targetFunction: string;
  inputSummary: string;
  expected: string;
  actual: string;
  latencyMs: number;
  passed: boolean;
  errorDetails?: string;
}
