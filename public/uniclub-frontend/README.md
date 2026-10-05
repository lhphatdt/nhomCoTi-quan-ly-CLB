# UniClub Hub - Giao diện Web Quản lý Câu lạc bộ Sinh viên Toàn diện

Bộ giao diện web thuần Frontend hoàn chỉnh dành cho Hệ thống Quản trị & Kết nối Câu lạc bộ Sinh viên (UniClub Hub), xây dựng theo chuẩn HTML5, CSS3, JavaScript ES6 và Bootstrap 5.

---

## 🎯 Điểm nổi bật & Triết lý Thiết kế

1. **100% Thuần Frontend:** Chạy trực tiếp trên trình duyệt (`file:///` hoặc bất kỳ máy chủ tĩnh / Live Server / GitHub Pages). Không phụ thuộc backend, servlet hay cơ sở dữ liệu.
2. **Dữ liệu mẫu thực tế & Phong phú:** Hơn 10 hội viên, 5 sự kiện quy mô lớn, nhiều đơn đăng ký/gia nhập CLB, cấu trúc Ban/Bộ phận, Chức vụ, Nhiệm kỳ, Bài viết, Thông báo và Nhật ký Audit Log.
3. **Mô phỏng Nghiệp vụ Bảo mật Độc quyền (Single Active Admin Session):**
   * Chỉ duy trì duy nhất 1 thiết bị giữ vai trò Primary Active Admin.
   * Khi đăng nhập máy mới: Trạng thái máy mới chuyển thành `PENDING`.
   * Admin chính nhận thông báo ngay trên giao diện, có modal phê duyệt (`Approve`), từ chối (`Reject`) hoặc ngắt kết nối cưỡng chế (`Kickout`).
   * Quản lý danh sách Thiết bị tin cậy (Trusted Devices) trong 30 ngày.
4. **Tương tác Frontend Đầy đủ:**
   * Tìm kiếm tức thời (live search)
   * Bộ lọc đa tiêu chí (phân loại, trạng thái, phân hệ)
   * Phân trang frontend
   * Điểm danh QR giả lập với token động và camera scanner
   * Modal chi tiết, xác nhận duyệt/từ chối, thông báo Toast hiện đại
   * Biểu đồ thống kê Canvas/SVG không cần thư viện nặng

---

## 📁 Cấu trúc Thư mục

```text
/uniclub-frontend
│
├── index.html                   # Trang chủ hội viên (Hero, Thống kê, Sự kiện nổi bật)
├── login.html                   # Đăng nhập (Mật khẩu show/hide, ghi nhớ thiết bị tin cậy)
├── register.html                # Đăng ký tài khoản hội viên sinh viên
├── events.html                  # Danh sách sự kiện (Tìm kiếm, lọc danh mục, tiến độ số chỗ)
├── event-detail.html            # Chi tiết sự kiện & Modal đăng ký tham gia (Trực tiếp / Online)
├── my-registrations.html        # Lịch sử đăng ký & điểm danh (Tabs lọc trạng thái)
├── checkin.html                 # Điểm danh QR tự động (Mô phỏng Scanner, mã hóa token)
├── membership.html              # Nộp đơn xin gia nhập câu lạc bộ
├── profile.html                 # Hồ sơ sinh viên, thông tin liên lạc, lịch sử hoạt động
├── calendar.html                # Lịch hoạt động theo tháng / tuần
├── news.html                    # Tin tức, bài viết hoạt động câu lạc bộ
├── notifications.html           # Trung tâm thông báo hệ thống
├── feedback.html                # Đánh giá & Khảo sát chất lượng sự kiện
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
│   ├── reports.html             # Báo cáo thống kê chuyên cần, tài chính, phong trào
│   ├── audit-log.html           # Nhật ký thao tác hệ thống bất biến (Hash verified)
│   ├── admin-sessions.html      # Cơ chế kiểm soát phiên độc quyền (Single Active Admin)
│   └── trusted-devices.html     # Quản lý máy tính / điện thoại tin cậy
│
├── assets/
│   ├── css/
│   │   └── style.css            # Toàn bộ CSS chuẩn hóa, design system thống nhất
│   └── js/
│       ├── app.js               # Tiện ích chung, Toast, Form validation, Navbar
│       ├── events.js            # Xử lý tìm kiếm, lọc sự kiện, check-in QR mock
│       ├── admin.js             # Quản trị viên, Duyệt đơn, Kick session, Modal
│       ├── dashboard.js         # Vẽ biểu đồ thống kê, cập nhật KPIs
│       └── validation.js        # Kiểm tra tính hợp lệ dữ liệu biểu mẫu
│
└── README.md                    # Tài liệu hướng dẫn sử dụng và cấu trúc
```

---

## 🔑 Tài khoản Mẫu Demo

| Vai trò | Tài khoản (Email / MSSV) | Mật khẩu | Quyền hạn |
| :--- | :--- | :--- | :--- |
| **Admin Chính (Chủ nhiệm)** | `admin@uniclub.vn` | `Admin@68nguyenchithanh` | Toàn quyền kiểm soát, duyệt phiên, quản lý nhân sự |
| **Phó Chủ nhiệm / QL Sự kiện** | `event.lead@uniclub.vn` | `Event@123456` | Quản lý sự kiện, duyệt đăng ký, điểm danh QR |
| **Hội viên Sinh viên** | `2374820143` | `Student@123456` | Đăng ký sự kiện, điểm danh QR, xem lịch sử |

---

## 🚀 Hướng dẫn Chạy Thử (Demo)

1. Mở thư mục `/uniclub-frontend` trong trình duyệt web (Google Chrome, Firefox, Safari, Microsoft Edge).
2. Nhấp đúp vào tệp `index.html` để trải nghiệm giao diện người dùng.
3. Từ menu trên thanh điều hướng hoặc nút góc phải, nhấp vào **Trang Quản trị** hoặc mở `admin/dashboard.html` để vào hệ thống Admin.
4. Mọi tương tác như tìm kiếm, lọc, mở đóng modal, duyệt đơn, và quét QR đều hoạt động mượt mà bằng JavaScript thuần.
