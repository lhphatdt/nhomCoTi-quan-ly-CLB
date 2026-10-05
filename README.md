# UniClub Hub — Hệ thống Quản lý Câu lạc bộ Sinh viên & Pipeline CI/CD với GitHub Actions

> **Báo cáo Đồ án Học phần:** Các vấn đề hiện đại của Công nghệ phần mềm  
> **Đề tài số:** 31  
> **Nền tảng công nghệ:** React 19, TypeScript (Strict Mode), Vite, Tailwind CSS 4, Vitest, GitHub Actions  

---

## MỤC LỤC BÁO CÁO KỸ THUẬT

1. [Chương 1: Đặt vấn đề & Mục tiêu Đề tài](#chương-1-đặt-vấn-đề--mục-tiêu-đề-tài)
2. [Chương 2: Kiến trúc Hệ thống & Ngăn xếp Công nghệ (Tech Stack)](#chương-2-kiến-trúc-hệ-thống--ngăn-xếp-công-nghệ)
3. [Chương 3: Thiết kế Tầng Nghiệp vụ Cốt lõi (Domain Logic)](#chương-3-thiết-kế-tầng-nghiệp-vụ-cốt-lõi)
4. [Chương 4: Thiết kế Pipeline CI/CD 5 Giai đoạn trên GitHub Actions](#chương-4-thiết-kế-pipeline-cicd-5-giai-đoạn)
5. [Chương 5: Hướng dẫn Cài đặt & Thực thi Lệnh CLI](#chương-5-hướng-dẫn-cài-đặt--thực-thi-lệnh-cli)
6. [Chương 6: Kịch bản Thuyết trình Bảo vệ Đồ án Đạt Điểm A+](#chương-6-kịch-bản-thuyết-trình-bảo-vệ-đồ-án)
7. [Chương 7: Bộ Câu hỏi Vấn đáp Thường gặp từ Hội đồng Chấm thi](#chương-7-bộ-câu-hỏi-vấn-đáp-thường-gặp)

---

## CHƯƠNG 1: ĐẶT VẤN ĐỀ & MỤC TIÊU ĐỀ TÀI

### 1.1. Bối cảnh thực tiễn
Trong môi trường đại học hiện đại, các câu lạc bộ (CLB) sinh viên hoạt động như một doanh nghiệp thu nhỏ với quy mô từ 50 đến hàng trăm thành viên, vận hành song song nhiều mảng: nhân sự, sự kiện học thuật, sổ quỹ tài chính và truyền thông. Tuy nhiên, phần lớn các CLB hiện nay vẫn quản lý thủ công qua Google Sheets rời rạc hoặc tin nhắn mạng xã hội dẫn đến:
- **Trùng lặp dữ liệu và xung đột lịch:** Hai ban chuyên môn cùng đặt một hội trường hoặc trùng giờ tổ chức.
- **Thất thoát ngân sách và âm quỹ:** Duyệt các khoản chi vượt quá số dư khả dụng thực tế.
- **Quy trình triển khai phần mềm thủ công:** Code được cập nhật trực tiếp lên server mà không qua kiểm thử tự động, dẫn đến lỗi runtime (Regression Bugs) ảnh hưởng trực tiếp đến người dùng.

### 1.2. Mục tiêu giải pháp của Đề tài 31
Xây dựng **UniClub Hub** — nền tảng quản trị câu lạc bộ sinh viên tích hợp toàn diện quy trình **DevOps / CI-CD** chuẩn công nghiệp:
1. **Nghiệp vụ chuyên sâu:** Quản lý nhân sự 5 ban chuyên môn, thuật toán phát hiện trùng lịch phòng họp, kiểm soát ngân sách chống âm quỹ, và điểm danh chuyên cần trực tiếp.
2. **Quality Gate tự động:** Triển khai GitHub Actions Pipeline 5 giai đoạn: Static Typing (`tsc --noEmit`), Automated Testing (10 test cases Vitest), Security Audit (`npm audit`), Production Build, và Continuous Deployment lên GitHub Pages theo cơ chế **Fail-Fast** và **Branch Protection**.
3. **Môi trường giả lập trực quan (Interactive Testing Sandbox):** Cho phép giảng viên và hội đồng chấm thi bật/tắt bug giả lập để chứng kiến tận mắt cách thức Quality Gate chặn đứng lỗi trước khi ra production.

---

## CHƯƠNG 2: KIẾN TRÚC HỆ THỐNG & NGĂN XẾP CÔNG NGHỆ

### 2.1. Ngăn xếp Công nghệ (Tech Stack)
- **UI Framework:** React 19 (Hooks, Functional Components, Strict Mode).
- **Ngôn ngữ:** TypeScript 5.8+ (Strict Type-checking, không dùng `any`, cấu hình `allowImportingTsExtensions`).
- **Build Tool:** Vite 6 / Vite 8 siêu tốc độ, hỗ trợ HMR và tối ưu hóa bundle.
- **Styling:** Tailwind CSS v4 với định dạng Font chữ chuyên dụng:
  - *Plus Jakarta Sans:* Font chữ giao diện chính, tinh gọn, hiện đại.
  - *JetBrains Mono:* Font chữ hiển thị số liệu tài chính (`tabular-nums`), MSSV, mã chứng từ, và terminal logs.
- **Icons:** `lucide-react`.
- **Testing Framework:** `vitest` thực thi kiểm thử đơn vị nhanh gấp nhiều lần Jest.
- **CI/CD Automation:** GitHub Actions Workflows (`.github/workflows/ci-cd.yml`).
- **Data Persistence:** Client-side LocalStorage đồng bộ hai chiều, không mất dữ liệu khi reload.

### 2.2. Kiến trúc Phân tầng (Layered Architecture)
```
uniclub-hub/
├── Presentation Layer (Giao diện React & Tailwind CSS 4)
│   ├── OverviewTab.tsx       (Dashboard KPI & Phân bổ 5 Ban)
│   ├── MembersTab.tsx        (Quản lý Hồ sơ, Tuyển quân, Điểm cống hiến)
│   ├── EventsTab.tsx         (Lịch sự kiện & Điểm danh chuyên cần)
│   ├── TreasuryTab.tsx       (Sổ quỹ minh bạch & Kiểm duyệt thu chi)
│   └── CicdPipelineTab.tsx   (Live Console điều phối CI/CD & Giả lập Bug)
│
├── Domain Logic Layer (Pure Business Functions & Unit Tests)
│   ├── src/domain/clubLogic.ts        (Toàn bộ Logic nghiệp vụ thuần túy)
│   └── src/domain/clubLogic.test.ts   (10 Test cases Vitest chuẩn)
│
└── Infrastructure & CI/CD Layer
    └── .github/workflows/ci-cd.yml    (Pipeline tự động 5 Stage của GitHub)
```

---

## CHƯƠNG 3: THIẾT KẾ TẦNG NGHIỆP VỤ CỐT LÕI (DOMAIN LOGIC)

Tầng `src/domain/clubLogic.ts` được thiết kế theo tư tưởng **Functional Programming** (các hàm thuần khiết - Pure Functions, không phụ thuộc vào React DOM), giúp việc kiểm thử tự động đạt độ tin cậy tuyệt đối:

### 3.1. Xác thực Hồ sơ Thành viên (`validateStudentMember`)
- **MSSV Constraint:** Chiều dài từ 6 đến 10 ký tự, định dạng ký tự chữ và số viết hoa (`B21DCCN001`, `20210001`).
- **Duplicate Prevention:** Duyệt mảng thành viên hiện có, chặn tuyệt đối việc đăng ký trùng MSSV đã có trong CLB.
- **Email & SĐT:** Kiểm tra regex email sinh viên hợp lệ và số điện thoại Việt Nam 10 chữ số bắt đầu bằng số 0.

### 3.2. Thuật toán Phát hiện Xung đột Lịch (`checkEventScheduleConflict`)
Hai sự kiện A và B bị coi là xung đột nếu thỏa mãn đồng thời 3 điều kiện:
1. `A.date === B.date` (Cùng ngày tổ chức).
2. `A.location.toLowerCase() === B.location.toLowerCase()` (Cùng phòng/hội trường).
3. `A.startTime < B.endTime && A.endTime > B.startTime` (Khoảng thời gian giao nhau).

### 3.3. Cơ chế Bảo vệ Ngân sách CLB (`canApproveExpense`)
- Phiếu thu tự động cộng dồn vào quỹ khi tạo.
- Phiếu chi đưa vào diện chờ duyệt (`pending`). Khi người quản lý bấm "Duyệt chi", hệ thống chạy hàm `canApproveExpense(amount, availableBalance)`:
  - Nếu `amount > availableBalance`: Báo lỗi và từ chối phê duyệt, ngăn chặn 100% tình trạng âm quỹ.

### 3.4. Điểm danh Chuyên cần & Phân loại Thành viên
- `calculateAttendanceRate(attended, totalExpected)` tính chính xác tỷ lệ % có mặt, xử lý an toàn ngoại lệ chia cho 0.
- `classifyMemberActivity(score)` phân loại 3 mức: Xuất sắc ($\ge 85$), Tích cực ($\ge 60$), Cần cố gắng ($< 60$).

---

## CHƯƠNG 4: THIẾT KẾ PIPELINE CI/CD 5 GIAI ĐOẠN TRÊN GITHUB ACTIONS

Pipeline định nghĩa tại `.github/workflows/ci-cd.yml` với cấu trúc đồ thị phụ thuộc (DAG - Directed Acyclic Graph):

```
[ Stage 01: Lint & TypeCheck ]
            │
            ▼
[ Stage 02: Unit Tests (Vitest) ]
            │
            ├──────────────────────────┐
            ▼                          ▼
[ Stage 03: Security Audit ]   [ Stage 04: Build Bundle ]
                                       │
                                       ▼
                               [ Stage 05: Continuous Deployment ]
```

### Chi tiết 5 Stage:
1. **Stage 01 (`lint-and-typecheck`):** Chạy `tsc --noEmit` để đảm bảo code không có lỗi kiểu dữ liệu TypeScript.
2. **Stage 02 (`unit-tests`):** Thực thi `npm test` (`vitest run`). Bắt buộc toàn bộ 10 unit test cases phải PASS.
3. **Stage 03 (`security-audit`):** Quét các lỗ hổng package thông qua `npm audit --audit-level=critical`.
4. **Stage 04 (`build-bundle`):** Chạy `npm run build` để đóng gói bundle production vào thư mục `dist/`.
5. **Stage 05 (`deploy-production`):** Tự động phát hành lên GitHub Pages khi commit được merge vào nhánh `main`.

---

## CHƯƠNG 5: HƯỚNG DẪN CÀI ĐẶT & THỰC THI LỆNH CLI

### 5.1. Khởi chạy Môi trường Phát triển (Local Dev)
```bash
# Cài đặt toàn bộ thư viện phụ thuộc
npm install

# Khởi chạy máy chủ phát triển Vite tại cổng 3000
npm run dev
```

### 5.2. Chạy Kiểm tra Cú pháp & Kiểu dữ liệu (Stage 01)
```bash
npm run lint
# Thực thi: tsc --noEmit
```

### 5.3. Chạy Toàn bộ Bộ Kiểm thử Đơn vị Vitest (Stage 02)
```bash
npm test
# Thực thi: vitest run
```
*Kết quả:* 10/10 test cases pass với thời gian thực thi dưới 1 giây.

### 5.4. Đóng gói Bản phát hành Production (Stage 04)
```bash
npm run build
# Đóng gói tối ưu mã nguồn vào thư mục ./dist
```

---

## CHƯƠNG 6: KỊCH BẢN THUYẾT TRÌNH BẢO VỆ ĐỒ ÁN ĐẠT ĐIỂM A+

### Bước 1: Giới thiệu Bài toán Nghiệp vụ & Ràng buộc (2 phút)
- Mở tab **Tổng quan CLB**, giới thiệu 4 chỉ số KPIs và cơ cấu 5 ban chuyên môn.
- Chuyển sang tab **Quản lý Nhân sự**, bấm nút *"Test bắt lỗi trùng MSSV"* để chứng minh tính năng Domain Validation chặn trùng mã sinh viên.
- Chuyển sang tab **Lịch Sự kiện**, bấm nút *"Test tạo sự kiện trùng phòng & giờ"* để chứng minh thuật toán phát hiện xung đột lịch.
- Chuyển sang tab **Sổ Quỹ CLB**, bấm nút *"Tạo phiếu chi vượt quỹ để test chặn lỗi"* rồi bấm *"Duyệt chi"*, màn hình sẽ kích hoạt cảnh báo chặn duyệt vì số tiền chi vượt quá số dư quỹ.

### Bước 2: Trình diễn Live Demo Bug Injection & Quality Gate (3 phút)
- Mở tab **CI/CD & Actions**.
- Bật công tắc gạt sang **"Giả lập Bug Quỹ CLB (CI Chặn lỗi)"**.
- Bấm nút **"Chạy Pipeline CI/CD Mới"**:
  - Stage 01 (Lint & Type Check): **Passed** (vì cú pháp code vẫn đúng kiểu).
  - Stage 02 (Unit Tests): **FAILED ❌** (Vitest bắt được sai lệch công thức tính số dư quỹ).
  - Stage 04 (Build) & Stage 05 (Deploy): **Bị khóa hoàn toàn (Blocked / Skipped)**.
- *Lời bình trước hội đồng:* "Thưa quý thầy cô, nếu không có CI/CD, đoạn code lỗi này sẽ được build và đẩy thẳng lên server, gây sai lệch hàng chục triệu đồng tiền quỹ CLB. Nhờ có Quality Gate tự động, pipeline đã fail-fast ngay tại Stage 02 và bảo vệ môi trường Production."

### Bước 3: Khẳng định Giá trị & Phân tích File Workflow (2 phút)
- Bật lại **"Chế độ Code Sạch"** và bấm chạy pipeline để 5 Stage đều chuyển màu xanh hoàn tất.
- Bấm **"Xem file ci-cd.yml"**, giải thích quan hệ `needs: [lint-and-typecheck]` và cơ chế Branch Protection của GitHub Actions.

---

## CHƯƠNG 7: BỘ CÂU HỎI VẤN ĐÁP THƯỜNG GẶP TỪ HỘI ĐỒNG CHẤM THI

**Câu hỏi 1: Tại sao nhóm tách riêng Stage 01 (Lint/Type Check) và Stage 02 (Unit Test) thay vì gộp chung?**  
*Trả lời:* Việc tách riêng tuân theo nguyên lý **Fail-Fast** trong DevOps. Lệnh kiểm tra kiểu (`tsc --noEmit`) tốn ít tài nguyên và chạy rất nhanh (~0.6s). Nếu code bị sai cú pháp hoặc thiếu type, pipeline sẽ dừng ngay lập tức mà không cần tốn thời gian khởi động runtime test suite của Vitest.

**Câu hỏi 2: Sự khác biệt lớn nhất giữa Vitest và Jest là gì?**  
*Trả lời:* Vitest chia sẻ chung cấu hình transform và pipeline của Vite, hỗ trợ native ESM và TypeScript mà không cần cấu hình phức tạp qua `babel-jest` hay `ts-jest`. Tốc độ thực thi của Vitest nhanh hơn Jest từ 3 đến 5 lần nhờ kiến trúc worker đa luồng hiện đại.

**Câu hỏi 3: Làm thế nào để đảm bảo không ai có thể push code lỗi trực tiếp lên nhánh main trên GitHub?**  
*Trả lời:* Nhóm thiết lập tính năng **Branch Protection Rules** trong repository settings:
1. Bật *"Require a pull request before merging"*.
2. Bật *"Require status checks to pass before merging"* và chọn bắt buộc job `unit-tests` và `build-bundle` phải Passed. Bất kỳ PR nào làm fail Stage 02 sẽ bị nút Merge khóa màu xám.

---
*UniClub Hub — Báo cáo hoàn tất phục vụ Đồ án Học phần Đề tài số 31.*
