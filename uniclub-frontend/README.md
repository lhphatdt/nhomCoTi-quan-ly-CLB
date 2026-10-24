# UniClub Hub - Hệ Thống Quản Lý Câu Lạc Bộ Sinh Viên & Tự Động Hóa CI/CD

Hệ thống quản lý câu lạc bộ sinh viên toàn diện, tích hợp quy trình DevOps tự động hóa CI/CD bằng GitHub Actions. Tài liệu và mã nguồn tuân thủ 100% hồ sơ dự án DHIT20 và phụ lục rà soát chuyên gia (Mục J).

---

## 👥 Danh sách Phân công Thành viên (Bảng RACI Chuẩn hóa)

| Họ và tên | MSSV | Vai trò chính | Trách nhiệm cốt lõi |
| :--- | :---: | :--- | :--- |
| **Nguyễn Phương Linh** | 2374820116 | **Trưởng nhóm (PM)** | Quản lý tiến độ dự án, viết Project Charter, kiểm soát tài liệu, tổng duyệt kịch bản Demo Day |
| **Lưu Hữu Phát** | 2374820143 | **Dev kiêm DevOps** | Thiết kế CSDL MySQL, code Servlet/JSP, cấu hình workflow GitHub Actions CI/CD và Single Active Admin |
| **Nguyễn Ngọc Hoa** | 2374820065 | **Developer** | Thiết kế giao diện Admin Dashboard, module quản lý sự kiện, điểm danh QR và bài viết |
| **Đỗ Thị Thơ** | 2374820180 | **BA kiêm Tester** | Khảo sát nhu cầu, viết User Stories, thiết kế & thực thi 61 Test Cases, kiểm thử phân quyền |

---

## 🎯 Điểm nổi bật & Triết lý Thiết kế

1. **Giao diện người dùng thuần Frontend (HTML5, Bootstrap 5, JS ES6):**
   * Hoạt động độc lập, mở trực tiếp bằng trình duyệt (`file:///` hoặc qua GitHub Pages / Live Server).
   * Không có lỗi CORS hay phụ thuộc máy chủ backend cục bộ khi demo.
2. **Kiểm soát phiên độc quyền Single Active Admin Session (J.7):**
   * Tại 1 thời điểm chỉ duy nhất 1 thiết bị giữ vai trò Primary Admin.
   * Thiết bị mới đăng nhập tự động rơi vào trạng thái `PENDING`.
   * Primary Admin có toàn quyền: Phê duyệt (`Approve`), Từ chối (`Reject`) hoặc Cưỡng chế ngắt kết nối (`Kickout`).
3. **Tách biệt Trusted Device & Remember Me (J.7.1):**
   * `Trusted Device`: Thiết bị tin cậy (token băm SHA-256 lưu DB, cookie 30 ngày) giúp bỏ qua bước chờ duyệt máy.
   * `Remember Me`: Token ngẫu nhiên xoay vòng để tự động ghi nhớ tài khoản.
   * `Session Heartbeat`: Script chạy ngầm mỗi 5 phút giữ phiên làm việc an toàn, phát hiện trạng thái KICKED tức thời.
4. **Chống Race Condition & Quản lý Chỗ trống sự kiện (J.6.1):**
   * Ràng buộc `UNIQUE(event_id, user_id)` chặn sinh viên đăng ký trùng lặp.
   * Kiểm tra điều kiện `remaining_seats > 0` và trừ số chỗ đúng 1 lần khi tạo đơn, hoàn trả khi từ chối/hủy.
5. **Ma trận Kiểm thử Toàn diện 61 Test Cases (J.10):**
   * 44 Test Case chức năng cơ bản (G.1 - G.8)
   * 17 Test Case mở rộng về Concurrency, Single Active Session, Audit Log Immutability và Bảo mật (TC45 - TC61).

---

## 📁 Cấu trúc Thư mục Hệ thống

```text
/uniclub-frontend
│
├── index.html                   # Trang chủ hội viên (Hero, Thống kê, Sự kiện nổi bật)
├── login.html                   # Đăng nhập (Tách biệt Remember Me & Trusted Device)
├── register.html                # Đăng ký tài khoản hội viên sinh viên
├── forgot-password.html         # Quên mật khẩu qua mã OTP 6 số (15 phút)
├── change-password.html         # Đổi mật khẩu định kỳ với Password Strength Meter
├── events.html                  # Danh sách sự kiện (Tìm kiếm, lọc danh mục, tiến độ số chỗ)
├── event-detail.html            # Chi tiết sự kiện & Modal đăng ký tham gia (Trực tiếp / Online)
├── my-registrations.html        # Lịch sử đăng ký & điểm danh (Tabs lọc trạng thái)
├── checkin.html                 # Điểm danh QR tự động (Token động 30s)
├── membership.html              # Nộp đơn xin gia nhập câu lạc bộ
├── profile.html                 # Hồ sơ sinh viên, thông tin liên lạc, lịch sử hoạt động
├── calendar.html                # Lịch hoạt động theo tháng / tuần
├── news.html                    # Tin tức, bài viết hoạt động câu lạc bộ
├── notifications.html           # Trung tâm thông báo hệ thống
├── feedback.html                # Đánh giá & Khảo sát chất lượng sự kiện
├── health.html                  # Endpoint kiểm tra trạng thái sức khỏe hệ thống (/health)
├── 403.html                     # Màn hình lỗi 403 Forbidden (Không đủ thẩm quyền)
├── 404.html                     # Màn hình lỗi 404 Not Found (Không tìm thấy trang)
├── 500.html                     # Màn hình lỗi 500 Internal Server Error (Sự cố máy chủ)
│
├── admin/
│   ├── dashboard.html           # Bảng điều khiển Quản trị (KPIs, biểu đồ hoạt động, top hội viên)
│   ├── members.html             # Quản lý Hội viên (Bảng dữ liệu, tìm kiếm, phân quyền, khóa)
│   ├── member-detail.html       # Chi tiết hội viên, điểm rèn luyện, ban bộ phận
│   ├── events.html              # Quản lý danh sách sự kiện CLB
│   ├── event-form.html          # Biểu mẫu tạo mới / Chỉnh sửa sự kiện
│   ├── registrations.html       # Quản lý & Duyệt đơn đăng ký sự kiện (Lý do từ chối)
│   ├── checkin.html             # Quản lý điểm danh QR & Điểm danh thủ công
│   ├── departments.html         # Quản lý Ban / Bộ phận chuyên trách
│   ├── positions.html           # Quản lý Chức vụ trong tổ chức
│   ├── terms.html               # Quản lý Nhiệm kỳ hoạt động
│   ├── assignments.html         # Phân công nhân sự theo ban và nhiệm kỳ
│   ├── membership-requests.html # Xét duyệt đơn gia nhập CLB của ứng viên mới
│   ├── posts.html               # Quản lý bài viết & tin tức CLB
│   ├── notifications.html       # Soạn thảo & Gửi thông báo toàn CLB
│   ├── reports.html             # Báo cáo thống kê chuyên cần, phong trào (Công thức J.6.3)
│   ├── test-matrix.html         # Ma trận 61 Test Cases đầy đủ (J.10)
│   ├── audit-log.html           # Nhật ký thao tác hệ thống bất biến (Hash verified)
│   ├── admin-sessions.html      # Cơ chế kiểm soát phiên độc quyền (Single Active Admin)
│   └── trusted-devices.html     # Quản lý máy tính / điện thoại tin cậy
│
├── assets/
│   ├── css/
│   │   └── style.css            # CSS tinh tế theo chuẩn frontend-design (Plus Jakarta Sans)
│   └── js/
│       ├── app.js               # Tiện ích chung, Seed Data LocalStorage, Toast, Navbar
│       ├── events.js            # Xử lý tìm kiếm, lọc sự kiện, check-in QR mock, chống race condition
│       ├── admin.js             # Quản trị viên, Duyệt đơn, Kick session, Thu hồi thiết bị
│       ├── dashboard.js         # Vẽ biểu đồ thống kê Chart.js, cập nhật KPIs
│       ├── heartbeat.js         # Script Heartbeat ngầm ping mỗi 5 phút & ngắt realtime khi bị kickout
│       └── validation.js        # Kiểm tra tính hợp lệ dữ liệu biểu mẫu
│
└── README.md                    # Tài liệu hướng dẫn sử dụng và cấu trúc
```

---

## 🔑 Tài khoản Mẫu Demo

| Vai trò | Tài khoản (Email / MSSV) | Mật khẩu | Quyền hạn |
| :--- | :--- | :--- | :--- |
| **Admin Chính (Chủ nhiệm)** | `admin@uniclub.vn` | `Admin@68nguyenchithanh` | Toàn quyền kiểm soát, duyệt phiên, quản lý nhân sự |
| **Phó Chủ nhiệm / QL Sự kiện** | `banchunhiem@uniclub.vn` | `Admin@123456` | Quản lý sự kiện, duyệt đăng ký, điểm danh QR |
| **Hội viên Sinh viên** | `hoivien@gmail.com` | `Pass1234` | Đăng ký sự kiện, điểm danh QR, xem lịch sử |

---

## 🛠 Hướng dẫn Khởi chạy CSDL & Dự án Java Web Backend (Nếu cần)

1. Cài đặt **MySQL 8.0** và tạo CSDL:
   ```bash
   mysql -u root -p < database/schema.sql
   mysql -u root -p < database/data.sql
   ```
2. Mở dự án với **NetBeans / IntelliJ IDEA / Eclipse** hoặc build bằng dòng lệnh Maven:
   ```bash
   mvn clean verify
   mvn package
   ```
3. File `target/uniclub.war` sẽ được sinh ra để triển khai lên máy chủ **Apache Tomcat 10.1** tại đường dẫn `http://localhost:8080/uniclub`.
