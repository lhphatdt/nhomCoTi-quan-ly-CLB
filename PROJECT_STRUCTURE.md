# UniClub Hub — Cấu trúc Thư mục & Vai trò Từng Tệp Tin (Đề tài 31)

Tài liệu chi tiết về cây thư mục và chức năng kỹ thuật của từng thành phần trong dự án:

```
uniclub-hub/
├── .github/
│   └── workflows/
│       └── ci-cd.yml                   # Cấu hình GitHub Actions CI/CD Pipeline 5 Stage tự động
│
├── src/                                # Toàn bộ mã nguồn ứng dụng (Source Code)
│   ├── components/                     # Phân hệ giao diện các Tab nghiệp vụ (UI Components)
│   │   ├── OverviewTab.tsx             # Tab 1: Dashboard KPIs, cơ cấu 5 ban, hoạt động gần đây
│   │   ├── MembersTab.tsx              # Tab 2: Quản lý nhân sự, lọc theo ban, xét duyệt, tính điểm
│   │   ├── EventsTab.tsx               # Tab 3: Quản lý sự kiện, thuật toán phát hiện trùng lịch, điểm danh
│   │   ├── TreasuryTab.tsx             # Tab 4: Quản lý quỹ CLB, phiếu thu/chi, kiểm duyệt ngân sách
│   │   └── CicdPipelineTab.tsx         # Tab 5: CI/CD Live Console, giả lập lỗi kiểm thử, thanh tra 10 tests
│   │
│   ├── domain/                         # Tầng nghiệp vụ cốt lõi (Domain Logic) & Bộ kiểm thử
│   │   ├── clubLogic.ts                # Pure Functions: Validate hồ sơ, tính số dư quỹ, kiểm tra trùng lịch
│   │   └── clubLogic.test.ts           # 10 test case Vitest chính thức chạy qua CLI `npm test` và CI/CD
│   │
│   ├── data/                           # Dữ liệu khởi tạo mẫu
│   │   └── initialClubData.ts          # Dữ liệu mẫu phong phú: 10 thành viên, sự kiện, phiếu thu chi
│   │
│   ├── types.ts                        # Khai báo hệ thống Type Definition & Interfaces chuẩn TypeScript
│   ├── App.tsx                         # Component trung tâm: Quản lý State toàn cục, Tab routing, LocalStorage
│   ├── main.tsx                        # Entry point khởi tạo React 19 và mount vào DOM
│   └── index.css                       # Styling toàn cục, import Tailwind CSS, cấu hình font chữ
│
├── .env.example                        # Cấu hình biến môi trường mẫu
├── .gitignore                          # Cấu hình các thư mục bỏ qua khi commit lên Git (node_modules, dist)
├── index.html                          # Entry point HTML của Single Page Application (SPA)
├── package.json                        # Khai báo dependencies, scripts (`dev`, `build`, `test`, `lint`)
├── tsconfig.json                       # Cấu hình trình biên dịch TypeScript (Strict Mode)
├── vite.config.ts                      # Cấu hình Vite bundler & plugin Tailwind CSS
├── README.md                           # Báo cáo kỹ thuật đồ án chi tiết phục vụ bảo vệ & chấm thi
└── PROJECT_STRUCTURE.md                # Bản đồ kiến trúc tệp tin (File này)
```

## Bảng Tra Cứu Vai Trò Kỹ Thuật

| Đường dẫn tệp | Vai trò kỹ thuật & Chức năng chính |
| :--- | :--- |
| `.github/workflows/ci-cd.yml` | Định nghĩa Pipeline CI/CD tự động trên GitHub Actions: chạy `npm run lint`, `npm test` (10 unit tests), `npm audit`, đóng gói `npm run build` và deploy lên GitHub Pages theo cơ chế Fail-Fast. |
| `src/domain/clubLogic.ts` | Tầng nghiệp vụ thuần túy (Pure Functions độc lập với React): Xác thực thông tin sinh viên, tính số dư quỹ khả dụng, thuật toán chống duyệt chi âm quỹ, thuật toán phát hiện trùng lịch phòng họp, và runner thanh tra test trên trình duyệt. |
| `src/domain/clubLogic.test.ts` | Bộ 10 kịch bản kiểm thử đơn vị viết bằng framework Vitest. Được GitHub Actions thực thi tự động ở Stage 02 mỗi khi sinh viên push code lên repository. |
| `src/components/OverviewTab.tsx` | Bảng điều khiển trung tâm (Dashboard): Hiển thị thống kê 4 thẻ KPIs quan trọng, biểu đồ nhân sự 5 ban chuyên môn, các hoạt động gần đây và lối tắt thao tác nhanh. |
| `src/components/MembersTab.tsx` | Quản lý danh sách thành viên: Tìm kiếm theo MSSV/Họ tên/Email, lọc theo từng ban, nút duyệt ứng viên chính thức, cộng điểm cống hiến (+5 điểm) và form thêm nhân sự mới có kiểm tra dữ liệu đầu vào. |
| `src/components/EventsTab.tsx` | Lên lịch sự kiện học kỳ: Cảnh báo trùng lịch phòng họp ngay khi nhập biểu mẫu, theo dõi trạng thái sự kiện và bảng điểm danh người tham gia. |
| `src/components/TreasuryTab.tsx` | Sổ quỹ minh bạch: Quản lý phiếu thu và phiếu chi. Tích hợp cơ chế tự động từ chối/cảnh báo khi phiếu chi vượt quá số dư khả dụng trong quỹ. |
| `src/components/CicdPipelineTab.tsx` | Trung tâm trực quan hóa CI/CD: Giả lập quy trình chạy 5 Stage trực quan, có nút giả lập lỗi (Bug Injection) để phục vụ thuyết trình bảo vệ trước giảng viên, kèm bảng chi tiết kết quả 10 test case và trình xem code `.github/workflows/ci-cd.yml`. |
| `src/data/initialClubData.ts` | Nạp dữ liệu mẫu thực tế của 10 sinh viên đại diện cho 5 ban (Chủ nhiệm, Chuyên môn, Truyền thông, Sự kiện, Đối ngoại - Hậu cần), các sự kiện và phiếu thu chi. |
| `src/types.ts` | Chứa toàn bộ định nghĩa TypeScript interfaces: `ClubMember`, `ClubEvent`, `TreasuryTransaction`, `PipelineStage`, `UnitTestCaseResult`. |
| `src/App.tsx` | Component gốc điều phối trạng thái, chuyển đổi giữa 5 tabs nghiệp vụ và tự động lưu/đồng bộ trạng thái hai chiều vào LocalStorage. |
| `package.json` | Khai báo các lệnh CLI tiêu chuẩn: `npm run dev`, `npm run build`, `npm run lint` (`tsc --noEmit`), và `npm test` (`vitest run`). |
| `README.md` | Bản báo cáo đồ án kỹ thuật hoàn chỉnh gồm 7 chương: Giới thiệu đề tài, kiến trúc hệ thống, hướng dẫn chạy lệnh, kịch bản thuyết trình bảo vệ và bộ câu hỏi vấn đáp thường gặp. |
