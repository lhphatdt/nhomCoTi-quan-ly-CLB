import React, { useState, useEffect } from 'react';
import {
  GitBranch,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Copy,
  Check,
  Terminal,
  Shield,
  Layers,
  FileCode,
  Flame,
  Clock,
  Sparkles,
  BookOpen,
  ArrowRight,
  ShieldAlert,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { PipelineStage, UnitTestCaseResult } from '../types.ts';
import { runBrowserUnitTests } from '../domain/clubLogic.ts';

interface CicdPipelineTabProps {
  simulateBug: boolean;
  onToggleSimulateBug: (enableBug: boolean) => void;
  onPipelineRunComplete: (passed: boolean) => void;
}

const GITHUB_WORKFLOW_YAML = `name: UniClub Hub - Enterprise CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: \${{ github.workflow }}-\${{ github.ref }}
  cancel-in-progress: true

jobs:
  # =========================================================================
  # STAGE 01: STATIC ANALYSIS & TYPE CHECKING
  # =========================================================================
  lint-and-typecheck:
    name: "Stage 01: Lint & TypeScript Verification"
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Setup Node.js Environment
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'

      - name: Install Project Dependencies
        run: npm ci

      - name: Execute Strict Type Checking (tsc --noEmit)
        run: npm run lint

  # =========================================================================
  # STAGE 02: AUTOMATED UNIT TESTING & QUALITY GATE
  # =========================================================================
  unit-tests:
    name: "Stage 02: Automated Unit Testing (Vitest 10/10 Tests)"
    needs: [lint-and-typecheck]
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Setup Node.js Environment
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install Project Dependencies
        run: npm ci

      - name: Run Domain Logic Test Suite (Vitest)
        run: npm test

  # =========================================================================
  # STAGE 03: SECURITY AUDIT & VULNERABILITY SCANNING
  # =========================================================================
  security-audit:
    name: "Stage 03: Security & Dependency Audit"
    needs: [unit-tests]
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Setup Node.js Environment
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Scan Dependencies for Critical Vulnerabilities
        run: npm audit --audit-level=critical || true

  # =========================================================================
  # STAGE 04: BUILD PRODUCTION BUNDLE & ARTIFACT GENERATION
  # =========================================================================
  build-bundle:
    name: "Stage 04: Production Build & Asset Packaging"
    needs: [unit-tests, security-audit]
    runs-on: ubuntu-latest
    timeout-minutes: 8
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Setup Node.js Environment
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install Project Dependencies
        run: npm ci

      - name: Build Optimized Production Bundle
        run: npm run build

      - name: Upload Production Artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'

  # =========================================================================
  # STAGE 05: CONTINUOUS DEPLOYMENT (PAGES GATES)
  # =========================================================================
  deploy-production:
    name: "Stage 05: Continuous Deployment (GitHub Pages)"
    needs: [build-bundle]
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Deploy Production Distribution to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4`;

export const CicdPipelineTab: React.FC<CicdPipelineTabProps> = ({
  simulateBug,
  onToggleSimulateBug,
  onPipelineRunComplete,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [activeStageIndex, setActiveStageIndex] = useState<number>(-1);
  const [copiedYaml, setCopiedYaml] = useState(false);
  const [showYamlViewer, setShowYamlViewer] = useState(false);
  const [selectedStageLogId, setSelectedStageLogId] = useState<string>('stage-2');

  const [stages, setStages] = useState<PipelineStage[]>([
    {
      id: 'stage-1',
      stageNumber: '01',
      name: 'Lint & Type Check',
      command: 'tsc --noEmit',
      status: 'idle',
      durationMs: 0,
      description: 'Kiểm tra cú pháp nghiêm ngặt, type safety và tính toàn vẹn mã nguồn TypeScript.',
      logs: [
        '$ tsc --noEmit',
        'Loaded tsconfig.json (Strict Mode, Target ES2022)',
        'Checking types across 18 source files...',
        '0 errors, 0 warnings found.',
        '✓ Static type check succeeded in 640ms.',
      ],
    },
    {
      id: 'stage-2',
      stageNumber: '02',
      name: 'Automated Unit Tests',
      command: 'vitest run clubLogic.test.ts',
      status: 'idle',
      durationMs: 0,
      description: 'Chạy 10 test case nghiệp vụ cốt lõi: MSSV, trùng lịch phòng, an toàn quỹ CLB.',
      logs: [],
    },
    {
      id: 'stage-3',
      stageNumber: '03',
      name: 'Security Audit',
      command: 'npm audit --audit-level=critical',
      status: 'idle',
      durationMs: 0,
      description: 'Quét các lỗ hổng bảo mật nghiêm trọng trong cây gói phụ thuộc dự án.',
      logs: [
        '$ npm audit --audit-level=critical',
        'Scanning 284 dependencies from npm registry...',
        'found 0 critical vulnerabilities in production packages.',
        '✓ Security baseline verification passed.',
      ],
    },
    {
      id: 'stage-4',
      stageNumber: '04',
      name: 'Build Bundle',
      command: 'vite build',
      status: 'idle',
      durationMs: 0,
      description: 'Đóng gói mã nguồn tối ưu (Minify, Tree-shaking, CSS bundling) thành thư mục dist.',
      logs: [
        '$ vite build',
        'vite v8.3.0 building for production...',
        '✓ 48 modules transformed.',
        'dist/index.html                   0.85 kB',
        'dist/assets/index-D7h.css        18.42 kB │ gzip: 4.81 kB',
        'dist/assets/index-BtY.js        192.14 kB │ gzip: 58.26 kB',
        '✓ Production bundle artifact packaged successfully.',
      ],
    },
    {
      id: 'stage-5',
      stageNumber: '05',
      name: 'Continuous Deploy',
      command: 'deploy-pages -> production',
      status: 'idle',
      durationMs: 0,
      description: 'Tự động phát hành phiên bản lên GitHub Pages khi merge vào nhánh chính main.',
      logs: [
        '$ actions/deploy-pages@v4',
        'Validating OpenID Connect token for environment: github-pages...',
        'Syncing production build artifact to CDN edge servers...',
        'Production URL: https://uniclub-hub.github.io/app/',
        '✓ Continuous Deployment completed successfully.',
      ],
    },
  ]);

  const [testResults, setTestResults] = useState<UnitTestCaseResult[]>(() =>
    runBrowserUnitTests(simulateBug)
  );

  useEffect(() => {
    const updated = runBrowserUnitTests(simulateBug);
    setTestResults(updated);
  }, [simulateBug]);

  const handleTriggerPipeline = async () => {
    if (isRunning) return;
    setIsRunning(true);

    setStages((prev) =>
      prev.map((s) => ({
        ...s,
        status: 'idle',
        durationMs: 0,
      }))
    );

    // Stage 01
    setActiveStageIndex(0);
    setStages((prev) =>
      prev.map((s, idx) => (idx === 0 ? { ...s, status: 'running' } : s))
    );
    await new Promise((r) => setTimeout(r, 600));
    setStages((prev) =>
      prev.map((s, idx) => (idx === 0 ? { ...s, status: 'passed', durationMs: 640 } : s))
    );

    // Stage 02
    setActiveStageIndex(1);
    setStages((prev) =>
      prev.map((s, idx) => (idx === 1 ? { ...s, status: 'running' } : s))
    );
    await new Promise((r) => setTimeout(r, 800));

    const currentTests = runBrowserUnitTests(simulateBug);
    setTestResults(currentTests);
    const hasFailedTest = currentTests.some((t) => !t.passed);

    if (hasFailedTest) {
      const failedTest = currentTests.find((t) => !t.passed)!;
      const failureLogs = [
        '$ vitest run src/domain/clubLogic.test.ts',
        'Running 10 unit test cases...',
        `✗ ${failedTest.id}: ${failedTest.title}`,
        `  AssertionError: ${failedTest.errorDetails || 'Expected value does not match actual.'}`,
        `  Target: ${failedTest.targetFunction}`,
        'FAIL  src/domain/clubLogic.test.ts > UniClub Hub Test Suite',
        'Tests: 1 failed, 9 passed (10 total)',
        '===========================================================',
        '🚨 QUALITY GATE TRIGGERED: Branch Protection blocked deployment!',
        'Pipeline terminated with exit code 1. Stages 04 & 05 skipped.',
      ];

      setStages((prev) =>
        prev.map((s, idx) => {
          if (idx === 1) {
            return {
              ...s,
              status: 'failed',
              durationMs: 820,
              logs: failureLogs,
            };
          }
          if (idx === 2) {
            return { ...s, status: 'skipped', durationMs: 0 };
          }
          if (idx === 3 || idx === 4) {
            return {
              ...s,
              status: 'skipped',
              durationMs: 0,
              logs: ['⛔ STAGE BLOCKED: Prerequisite Stage 02 (unit-tests) failed.'],
            };
          }
          return s;
        })
      );

      setIsRunning(false);
      setActiveStageIndex(1);
      setSelectedStageLogId('stage-2');
      onPipelineRunComplete(false);
      return;
    }

    const successLogs = [
      '$ vitest run src/domain/clubLogic.test.ts',
      'Running 10 unit test cases with Vitest runner...',
      '✓ TC-01: validateStudentMember valid data (MSSV, Email, Phone)',
      '✓ TC-02: validateStudentMember reject MSSV length outside 6-10',
      '✓ TC-03: validateStudentMember reject duplicate MSSV in roster',
      '✓ TC-04: validateStudentMember reject invalid email & phone',
      '✓ TC-05: calculateTreasuryBalance accurate approved balance',
      '✓ TC-06: calculateTreasuryBalance pending expense isolation',
      '✓ TC-07: canApproveExpense allows valid expense approval',
      '✓ TC-08: canApproveExpense blocks overdraft prevention',
      '✓ TC-09: checkEventScheduleConflict room & time collision',
      '✓ TC-10: calculateAttendanceRate accurate percentage & zero safe',
      'Tests: 10 passed (10 total)',
      'Time: 780ms',
      '✓ Quality Gate Satisfied: 100% assertions passed.',
    ];

    setStages((prev) =>
      prev.map((s, idx) =>
        idx === 1
          ? {
              ...s,
              status: 'passed',
              durationMs: 780,
              logs: successLogs,
            }
          : s
      )
    );

    // Stage 03
    setActiveStageIndex(2);
    setStages((prev) =>
      prev.map((s, idx) => (idx === 2 ? { ...s, status: 'running' } : s))
    );
    await new Promise((r) => setTimeout(r, 500));
    setStages((prev) =>
      prev.map((s, idx) => (idx === 2 ? { ...s, status: 'passed', durationMs: 510 } : s))
    );

    // Stage 04
    setActiveStageIndex(3);
    setStages((prev) =>
      prev.map((s, idx) => (idx === 3 ? { ...s, status: 'running' } : s))
    );
    await new Promise((r) => setTimeout(r, 900));
    setStages((prev) =>
      prev.map((s, idx) => (idx === 3 ? { ...s, status: 'passed', durationMs: 920 } : s))
    );

    // Stage 05
    setActiveStageIndex(4);
    setStages((prev) =>
      prev.map((s, idx) => (idx === 4 ? { ...s, status: 'running' } : s))
    );
    await new Promise((r) => setTimeout(r, 700));
    setStages((prev) =>
      prev.map((s, idx) => (idx === 4 ? { ...s, status: 'passed', durationMs: 710 } : s))
    );

    setIsRunning(false);
    onPipelineRunComplete(true);
  };

  const handleCopyYaml = () => {
    navigator.clipboard.writeText(GITHUB_WORKFLOW_YAML);
    setCopiedYaml(true);
    setTimeout(() => setCopiedYaml(false), 2000);
  };

  const selectedStage = stages.find((s) => s.id === selectedStageLogId) || stages[1];
  const passedTestsCount = testResults.filter((t) => t.passed).length;
  const failedTestsCount = testResults.length - passedTestsCount;

  return (
    <div className="space-y-6">
      {/* CONTROL HERO: BUG INJECTION TOGGLE & TRIGGER BUTTON */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-indigo-700">
              <GitBranch className="w-4 h-4 text-indigo-600" />
              <span>CI/CD Pipeline Orchestrator · GitHub Actions Simulation</span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Trung tâm Điều phối Pipeline CI/CD & Quality Gate Tự động
            </h2>
            <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
              Quy trình tự động hóa 5 giai đoạn: từ Static Type Check, Unit Testing, Security Audit đến Build Production và Deploy theo cơ chế Fail-Fast bảo vệ nhánh Production.
            </p>
          </div>

          {/* SIMULATE BUG TOGGLE & RUN BUTTON */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* BUG INJECTION TOGGLE */}
            <div
              onClick={() => onToggleSimulateBug(!simulateBug)}
              className={`flex items-center gap-3 px-3.5 py-2 border rounded-xl cursor-pointer transition-all ${
                simulateBug
                  ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-500/20 shadow-xs'
                  : 'bg-slate-50 border-slate-200 hover:border-slate-300'
              }`}
              title="Bật/Tắt chế độ thử nghiệm Quality Gate (Branch Protection)"
            >
              <div className="text-xs">
                {simulateBug ? (
                  <span className="text-rose-700 font-extrabold flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-rose-600 animate-pulse" />
                    <span>Giả lập Bug Quỹ CLB (Chặn CI)</span>
                  </span>
                ) : (
                  <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Chế độ Code Sạch (Pass 100%)</span>
                  </span>
                )}
              </div>

              {/* Toggle switch visual */}
              <div
                className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors duration-200 ease-in-out ${
                  simulateBug ? 'bg-rose-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out mt-0.5 ml-0.5 ${
                    simulateBug ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </div>
            </div>

            {/* TRIGGER BUTTON */}
            <button
              onClick={handleTriggerPipeline}
              disabled={isRunning}
              className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white rounded-xl transition-all shadow-sm ${
                isRunning
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-500 cursor-pointer shadow-indigo-200 hover:shadow-md'
              }`}
            >
              {isRunning ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  <span>Đang thực thi Pipeline...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Kích hoạt Pipeline Mới</span>
                </>
              )}
            </button>

            {/* VIEW YAML WORKFLOW CODE */}
            <button
              onClick={() => setShowYamlViewer(!showYamlViewer)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              <FileCode className="w-4 h-4 text-slate-600" />
              <span>{showYamlViewer ? 'Ẩn file YAML' : 'Xem ci-cd.yml'}</span>
            </button>
          </div>
        </div>

        {/* PROMPT NOTICE */}
        {simulateBug && (
          <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-xs text-rose-900 animate-in fade-in">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="font-bold">ĐANG BẬT CHẾ ĐỘ GIẢ LẬP BUG NGHIỆP VỤ QUỸ: </strong>
              <span>
                Hàm <code className="font-mono bg-rose-100 px-1 py-0.5 rounded font-bold">calculateTreasuryBalance</code> bị cố tình tiêm lỗi logic (trừ nhầm chi phí chưa duyệt và sai số dư khả dụng). Khi chạy Pipeline, <strong>Stage 02 sẽ BÁO ĐỎ ❌</strong> và <strong>Stage 04 & Stage 05 sẽ bị KHÓA HOÀN TOÀN</strong> nhằm bảo vệ môi trường Production!
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 5-STAGE PIPELINE VISUALIZATION (STEPPER CARDS) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3.5 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Quy trình Pipeline 5 Giai đoạn (GitHub Actions DAG Workflow)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Bấm vào từng Stage để kiểm tra chi tiết Terminal Logs tương ứng
            </p>
          </div>

          <div className="text-xs font-mono">
            Trạng thái:{' '}
            <span
              className={`font-bold px-2 py-0.5 rounded ${
                stages.some((s) => s.status === 'failed')
                  ? 'text-rose-700 bg-rose-50'
                  : stages.every((s) => s.status === 'passed')
                  ? 'text-emerald-700 bg-emerald-50'
                  : isRunning
                  ? 'text-indigo-700 bg-indigo-50 animate-pulse'
                  : 'text-slate-600 bg-slate-100'
              }`}
            >
              {stages.some((s) => s.status === 'failed')
                ? 'FAILED (Branch Protected)'
                : stages.every((s) => s.status === 'passed')
                ? 'ALL PASSED (Green)'
                : isRunning
                ? 'IN PROGRESS...'
                : 'IDLE (Sẵn sàng)'}
            </span>
          </div>
        </div>

        {/* THE 5 STAGE CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {stages.map((stage, idx) => {
            const isSelected = selectedStageLogId === stage.id;
            return (
              <div
                key={stage.id}
                onClick={() => setSelectedStageLogId(stage.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
                  isSelected
                    ? 'ring-2 ring-indigo-500 border-indigo-500 bg-indigo-50/20 shadow-xs'
                    : 'border-slate-200/90 bg-white hover:border-slate-300'
                }`}
              >
                {/* Stage Header */}
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-extrabold text-slate-400">
                    STAGE {stage.stageNumber}
                  </span>
                  <div>
                    {stage.status === 'running' && (
                      <RotateCcw className="w-4 h-4 text-indigo-600 animate-spin" />
                    )}
                    {stage.status === 'passed' && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    )}
                    {stage.status === 'failed' && (
                      <XCircle className="w-4 h-4 text-rose-600 animate-pulse" />
                    )}
                    {stage.status === 'skipped' && (
                      <span className="text-[10px] font-mono text-slate-400 font-bold bg-slate-100 px-1 py-0.5 rounded">
                        BLOCKED
                      </span>
                    )}
                    {stage.status === 'idle' && (
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-300 block" />
                    )}
                  </div>
                </div>

                {/* Stage Name */}
                <div className="mt-2 text-xs font-bold text-slate-900 line-clamp-1">
                  {stage.name}
                </div>

                {/* Command Pill */}
                <div className="mt-1 font-mono text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded truncate font-medium">
                  {stage.command}
                </div>

                {/* Duration & Status */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono tabular-nums">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {stage.durationMs ? `${stage.durationMs}ms` : '--'}
                  </span>
                  <span
                    className={`font-bold capitalize text-[10px] ${
                      stage.status === 'passed'
                        ? 'text-emerald-700'
                        : stage.status === 'failed'
                        ? 'text-rose-700'
                        : stage.status === 'running'
                        ? 'text-indigo-600'
                        : 'text-slate-400'
                    }`}
                  >
                    {stage.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* YAML FILE VIEWER (IF TOGGLED) */}
      {showYamlViewer && (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl animate-in fade-in">
          <div className="px-5 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-indigo-400" />
              <span className="font-mono text-slate-200 font-bold">
                .github/workflows/ci-cd.yml
              </span>
            </div>
            <button
              onClick={handleCopyYaml}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              {copiedYaml ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Đã sao chép!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Sao chép YAML</span>
                </>
              )}
            </button>
          </div>
          <pre className="p-5 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-96 leading-relaxed selection:bg-indigo-500 selection:text-white">
            {GITHUB_WORKFLOW_YAML}
          </pre>
        </div>
      )}

      {/* 2 PANELS: UNIT TEST SUITE INSPECTOR (LEFT 8 COLS) & STAGE TERMINAL LOGS (RIGHT 4 COLS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT PANEL: 10 UNIT TEST SCENARIOS TABLE */}
        <div className="lg:col-span-8 bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
          <div className="px-5 py-4 border-b border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/50">
            <div>
              <div className="font-extrabold text-slate-900 text-xs">
                Bảng Thanh tra 10 Kịch bản Unit Test (Vitest Runner)
              </div>
              <div className="text-[11px] text-slate-500">
                Thực thi trực tiếp mã kiểm thử đơn vị với kết quả so khớp Expected vs Actual
              </div>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                ✓ {passedTestsCount} Passed
              </span>
              {failedTestsCount > 0 && (
                <span className="text-rose-700 font-bold bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200 animate-pulse">
                  ✕ {failedTestsCount} Failed
                </span>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3 font-mono">Test ID</th>
                  <th className="px-4 py-3">Kịch bản & Hàm mục tiêu</th>
                  <th className="px-4 py-3">Kỳ vọng (Expected)</th>
                  <th className="px-4 py-3">Thực tế (Actual)</th>
                  <th className="px-4 py-3 text-right font-mono">Độ trễ</th>
                  <th className="px-4 py-3 text-center">Kết quả</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {testResults.map((test) => (
                  <tr
                    key={test.id}
                    className={`transition-colors ${
                      test.passed ? 'hover:bg-slate-50/80' : 'bg-rose-50/60'
                    }`}
                  >
                    {/* ID */}
                    <td className="px-4 py-3 font-mono font-bold text-slate-900 tabular-nums">
                      {test.id}
                    </td>

                    {/* Title & Target function */}
                    <td className="px-4 py-3 max-w-xs">
                      <div className="font-bold text-slate-900">{test.title}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        Target: <span className="text-indigo-600 font-semibold">{test.targetFunction}()</span>
                      </div>
                      {test.errorDetails && (
                        <div className="mt-1 text-[11px] text-rose-700 font-bold font-mono bg-rose-100/60 p-1 rounded">
                          {test.errorDetails}
                        </div>
                      )}
                    </td>

                    {/* Expected */}
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-600 max-w-[160px] truncate">
                      {test.expected}
                    </td>

                    {/* Actual */}
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-600 max-w-[160px] truncate">
                      {test.actual}
                    </td>

                    {/* Latency */}
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-500 text-[11px]">
                      {test.latencyMs}ms
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 text-center">
                      {test.passed ? (
                        <span className="inline-flex items-center gap-1 font-mono text-[11px] font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          PASS
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-mono text-[11px] font-extrabold text-rose-800 bg-rose-100 px-2.5 py-0.5 rounded-full border border-rose-300 animate-pulse">
                          FAIL ❌
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT PANEL: LIVE TERMINAL LOG VIEWER */}
        <div className="lg:col-span-4 bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-sm flex flex-col">
          {/* Terminal Window Bar (macOS style 3 dots) */}
          <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              </div>
              <span className="font-mono text-slate-300 font-semibold text-[11px] ml-1">
                runner · Stage {selectedStage.stageNumber}
              </span>
            </div>
            <span
              className={`font-mono text-[10px] px-2 py-0.5 rounded uppercase font-bold ${
                selectedStage.status === 'passed'
                  ? 'text-emerald-400 bg-emerald-950/80 border border-emerald-800'
                  : selectedStage.status === 'failed'
                  ? 'text-rose-400 bg-rose-950/80 border border-rose-800'
                  : 'text-slate-400 bg-slate-800'
              }`}
            >
              {selectedStage.status}
            </span>
          </div>

          <div className="p-4 font-mono text-[11px] text-slate-300 space-y-1.5 overflow-y-auto max-h-[400px] flex-1 leading-relaxed selection:bg-indigo-500 selection:text-white">
            <div className="text-slate-500 pb-1.5 border-b border-slate-800/80 text-[10px]">
              # Target: {selectedStage.name}
              <br /># Command: {selectedStage.command}
            </div>

            {selectedStage.logs.length === 0 ? (
              <div className="text-slate-500 italic py-6 text-center">
                Chưa có log. Bấm nút "Kích hoạt Pipeline Mới" để chạy.
              </div>
            ) : (
              selectedStage.logs.map((line, i) => (
                <div
                  key={i}
                  className={
                    line.startsWith('✓')
                      ? 'text-emerald-400 font-semibold'
                      : line.startsWith('✗') || line.includes('FAIL') || line.includes('🚨')
                      ? 'text-rose-400 font-extrabold'
                      : line.startsWith('$')
                      ? 'text-indigo-400 font-bold'
                      : 'text-slate-300'
                  }
                >
                  {line}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* QUY TRÌNH VẬN HÀNH CHUẨN DEVOPS (SOP) */}
      <div className="bg-gradient-to-br from-indigo-50 via-white to-indigo-50/40 border border-indigo-200/90 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center gap-2 text-indigo-950 font-extrabold text-sm">
          <BookOpen className="w-5 h-5 text-indigo-600" />
          <span>Kiến trúc Vận hành Chuẩn & Cơ chế Bảo vệ Nhánh Production (DevOps SOP)</span>
        </div>
        <p className="text-xs text-slate-600 mt-1">
          3 trụ cột bảo vệ tính toàn vẹn dữ liệu và độ tin cậy phần mềm trong môi trường phát triển phân tán:
        </p>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* STEP 1 */}
          <div className="bg-white border border-indigo-100 rounded-xl p-4 space-y-2 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-800">
              <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center text-xs font-mono font-bold">
                1
              </span>
              <span>Kiểm soát Ràng buộc Tầng Nghiệp vụ</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Ngay từ tầng xử lý dữ liệu (Domain Logic), các thuật toán tự động chặn trùng mã định danh (MSSV), phát hiện xung đột thời gian & địa điểm sự kiện, và chặn duyệt chi vượt số dư ngân sách.
            </p>
          </div>

          {/* STEP 2 */}
          <div className="bg-white border border-rose-100 rounded-xl p-4 space-y-2 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-bold text-rose-800">
              <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-800 flex items-center justify-center text-xs font-mono font-bold">
                2
              </span>
              <span>Cơ chế Fail-Fast & Branch Protection</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Khi phát sinh sai lệch toán học hoặc lỗi logic, bộ test suite tự động <strong>BÁO ĐỎ tại Stage 02</strong>, lập tức kích hoạt cơ chế <strong>hủy bỏ tiến trình và khóa toàn bộ khâu Build/Deploy</strong> để bảo vệ Production.
            </p>
          </div>

          {/* STEP 3 */}
          <div className="bg-white border border-emerald-100 rounded-xl p-4 space-y-2 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-mono font-bold">
                3
              </span>
              <span>Đóng gói & Phát hành Liên tục Tự động</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Khi tất cả 10/10 kiểm thử vượt qua tiêu chuẩn, pipeline tự động thực thi quét bảo mật, đóng gói bundle tối ưu hóa và xuất bản bản phát hành mới mà không cần can thiệp thủ công.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
