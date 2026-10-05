/**
 * UniClub Hub - Core Frontend Application Engine
 * Seed Data & LocalStorage Management (No backend required)
 */

const SEED_DATA = {
  members: [
    { id: 1, mssv: "2374820116", name: "Nguyễn Phương Linh", email: "linh.np@uniclub.vn", phone: "0912345601", dept: "Ban Chủ nhiệm", role: "Chủ nhiệm CLB", status: "ACTIVE", points: 98 },
    { id: 2, mssv: "2374820143", name: "Lưu Hữu Phát", email: "phat.lh@uniclub.vn", phone: "0912345602", dept: "Ban Chuyên môn", role: "Trưởng ban Chuyên môn", status: "ACTIVE", points: 95 },
    { id: 3, mssv: "2374820065", name: "Nguyễn Ngọc Hoa", email: "hoa.nn@uniclub.vn", phone: "0912345603", dept: "Ban Sự kiện", role: "Trưởng ban Sự kiện", status: "ACTIVE", points: 92 },
    { id: 4, mssv: "2374820180", name: "Đỗ Thị Thơ", email: "tho.dt@uniclub.vn", phone: "0912345604", dept: "Ban Truyền thông", role: "Trưởng ban Truyền thông", status: "ACTIVE", points: 94 },
    { id: 5, mssv: "2374820088", name: "Trần Văn An", email: "an.tv@uniclub.vn", phone: "0912345605", dept: "Ban Chuyên môn", role: "Thành viên", status: "ACTIVE", points: 88 },
    { id: 6, mssv: "2374820099", name: "Lê Thị Bích", email: "bich.lt@uniclub.vn", phone: "0912345606", dept: "Ban Sự kiện", role: "Thành viên", status: "ACTIVE", points: 85 },
    { id: 7, mssv: "2374820101", name: "Hoàng Minh Cường", email: "cuong.hm@uniclub.vn", phone: "0912345607", dept: "Ban Đối ngoại", role: "Trưởng ban Đối ngoại", status: "ACTIVE", points: 90 },
    { id: 8, mssv: "2374820102", name: "Phạm Hải Đăng", email: "dang.ph@uniclub.vn", phone: "0912345608", dept: "Ban Đối ngoại", role: "Thành viên", status: "ACTIVE", points: 82 },
    { id: 9, mssv: "2374820103", name: "Vũ Thúy Hằng", email: "hang.vt@uniclub.vn", phone: "0912345609", dept: "Ban Truyền thông", role: "Thành viên", status: "LOCKED", points: 60 },
    { id: 10, mssv: "2374820104", name: "Đinh Quang Khải", email: "khai.dq@uniclub.vn", phone: "0912345610", dept: "Ban Chuyên môn", role: "Thành viên", status: "ACTIVE", points: 87 }
  ],
  events: [
    { id: 1, title: "Workshop Git & GitHub Actions CI/CD Thực Chiến", type: "Học thuật", date: "2026-10-15", time: "08:00 - 11:30", location: "Hội trường A2-301", maxSeats: 100, remainingSeats: 32, status: "OPEN", desc: "Hướng dẫn xây dựng pipeline CI/CD kiểm thử và triển khai tự động dành cho sinh viên CNTT." },
    { id: 2, title: "Chiến dịch Tình nguyện Mùa Thu 2026", type: "Tình nguyện", date: "2026-10-22", time: "07:00 - 17:00", location: "Huyện Ba Vì, Hà Nội", maxSeats: 50, remainingSeats: 12, status: "OPEN", desc: "Quyên góp sách vở và hỗ trợ các em học sinh có hoàn cảnh khó khăn tại vùng cao." },
    { id: 3, title: "Hackathon UniClub DevCup 2026", type: "Cuộc thi", date: "2026-11-05", time: "08:00 - 20:00", location: "Khu Công nghệ Cao Lab 402", maxSeats: 60, remainingSeats: 0, status: "FULL", desc: "Sân chơi lập trình 12 giờ sáng tạo giải pháp phần mềm quản lý cộng đồng trường học." },
    { id: 4, title: "Sinh hoạt CLB Định kỳ Tháng 10 & Chào Tân Hội Viên", type: "Sinh hoạt", date: "2026-10-18", time: "18:30 - 21:00", location: "Hội trường B1", maxSeats: 120, remainingSeats: 45, status: "OPEN", desc: "Gặp gỡ tân sinh viên, công bố cơ cấu nhiệm kỳ mới và kế hoạch học kỳ I." },
    { id: 5, title: "Buổi Chia Sẻ Kỹ Năng Phỏng Vấn Doanh Nghiệp Tech", type: "Kỹ năng", date: "2026-11-12", time: "09:00 - 11:00", location: "Phòng Hội thảo 2", maxSeats: 80, remainingSeats: 25, status: "OPEN", desc: "Khách mời cựu sinh viên từ FPT Software và Viettel chia sẻ bí quyết viết CV và phỏng vấn." }
  ],
  registrations: [
    { id: 1, memberName: "Trần Văn An", mssv: "2374820088", eventTitle: "Workshop Git & GitHub Actions CI/CD Thực Chiến", form: "Trực tiếp", regDate: "2026-10-01", status: "APPROVED", checkin: "ATTENDED" },
    { id: 2, memberName: "Lê Thị Bích", mssv: "2374820099", eventTitle: "Workshop Git & GitHub Actions CI/CD Thực Chiến", form: "Trực tiếp", regDate: "2026-10-02", status: "PENDING", checkin: "NONE" },
    { id: 3, memberName: "Hoàng Minh Cường", mssv: "2374820101", eventTitle: "Chiến dịch Tình nguyện Mùa Thu 2026", form: "Trực tiếp", regDate: "2026-10-03", status: "APPROVED", checkin: "NONE" },
    { id: 4, memberName: "Phạm Hải Đăng", mssv: "2374820102", eventTitle: "Hackathon UniClub DevCup 2026", form: "Trực tuyến", regDate: "2026-10-04", status: "REJECTED", reason: "Đã quá hạn đăng ký", checkin: "NONE" },
    { id: 5, memberName: "Đinh Quang Khải", mssv: "2374820104", eventTitle: "Sinh hoạt CLB Định kỳ Tháng 10", form: "Trực tiếp", regDate: "2026-10-04", status: "APPROVED", checkin: "ATTENDED" }
  ],
  membershipRequests: [
    { id: 101, name: "Nguyễn Tuấn Anh", mssv: "2474820012", email: "anh.nt@student.edu.vn", phone: "0981122334", dept: "Ban Chuyên môn", reason: "Muốn học hỏi kiến thức lập trình Web và DevOps", date: "2026-10-03", status: "PENDING" },
    { id: 102, name: "Vũ Mai Phương", mssv: "2474820055", email: "phuong.vm@student.edu.vn", phone: "0982233445", dept: "Ban Truyền thông", reason: "Đam mê thiết kế đồ họa Canva, Figma và viết bài", date: "2026-10-03", status: "PENDING" },
    { id: 103, name: "Trịnh Gia Bảo", mssv: "2474820090", email: "bao.tg@student.edu.vn", phone: "0983344556", dept: "Ban Sự kiện", reason: "Yêu thích tổ chức các chương trình teambuilding", date: "2026-10-02", status: "APPROVED" },
    { id: 104, name: "Lê Khánh Huyền", mssv: "2474820111", email: "huyen.lk@student.edu.vn", phone: "0984455667", dept: "Ban Đối ngoại", reason: "Muốn rèn luyện kỹ năng đàm phán tài trợ với doanh nghiệp", date: "2026-10-01", status: "REJECTED", note: "Không đủ thời gian cam kết sinh hoạt" },
    { id: 105, name: "Bùi Quốc Hưng", mssv: "2474820130", email: "hung.bq@student.edu.vn", phone: "0985566778", dept: "Ban Chuyên môn", reason: "Có kinh nghiệm lập trình Java và MySQL", date: "2026-10-04", status: "PENDING" }
  ],
  adminSessions: [
    { sessionId: "sess-8891-hn", ip: "113.190.234.12", device: "Chrome 128 / Windows 11 (Primary PC)", isPrimary: true, status: "ACTIVE", lastActive: "Vừa xong", location: "Hà Nội, VN" },
    { sessionId: "sess-4412-mb", ip: "14.238.10.45", device: "Safari 18 / MacBook Pro M3", isPrimary: false, status: "PENDING", lastActive: "1 phút trước", location: "Cầu Giấy, Hà Nội" },
    { sessionId: "sess-1920-ip", ip: "171.244.33.88", device: "Safari Mobile / iPhone 15 Pro", isPrimary: false, status: "KICKED", lastActive: "2 giờ trước", location: "Hà Nội, VN" }
  ],
  trustedDevices: [
    { deviceId: "dev-01", name: "Laptop Admin Văn phòng CLB", tokenHash: "e3b0c44298fc1c149afbf4c8996fb924", ip: "113.190.234.12", status: "APPROVED", registeredAt: "2026-09-01", lastUsed: "2026-10-05" },
    { deviceId: "dev-02", name: "PC Phòng Lab Thực Hành", tokenHash: "5994471abb01112afcc18159f6cc74b4", ip: "10.0.12.45", status: "APPROVED", registeredAt: "2026-09-15", lastUsed: "2026-10-04" },
    { deviceId: "dev-03", name: "Máy tính cá nhân Phó Chủ nhiệm", tokenHash: "6b86b273ff34fce19d6b804eff5a3f57", ip: "14.238.10.45", status: "REVOKED", registeredAt: "2026-08-20", lastUsed: "2026-09-28" }
  ],
  auditLogs: [
    { logId: "LOG-1092", user: "Lưu Hữu Phát (Admin)", action: "APPROVE_REGISTRATION", target: "Đăng ký #01 - Trần Văn An", time: "2026-10-05 08:30:15", ip: "113.190.234.12" },
    { logId: "LOG-1091", user: "Nguyễn Phương Linh (Super Admin)", action: "CREATE_EVENT", target: "Sự kiện #05 - Buổi Chia Sẻ Kỹ Năng", time: "2026-10-04 15:10:44", ip: "113.190.234.12" },
    { logId: "LOG-1090", user: "Nguyễn Phương Linh (Super Admin)", action: "APPROVE_TRUSTED_DEVICE", target: "PC Phòng Lab Thực Hành (dev-02)", time: "2026-10-04 11:05:00", ip: "113.190.234.12" },
    { logId: "LOG-1089", user: "Nguyễn Phương Linh (Super Admin)", action: "KICK_SESSION", target: "Session sess-1920-ip (iPhone 15 Pro)", time: "2026-10-04 10:20:12", ip: "113.190.234.12" },
    { logId: "LOG-1088", user: "Hệ thống CI/CD (GitHub Actions)", action: "DEPLOY_STAGING", target: "Build #37280810682 -> Apache Tomcat", time: "2026-10-04 09:00:00", ip: "140.82.112.4" }
  ]
};

// Initialize LocalStorage if not present
function initUniClubStorage() {
  if (!localStorage.getItem('uniclub_initialized')) {
    localStorage.setItem('uniclub_members', JSON.stringify(SEED_DATA.members));
    localStorage.setItem('uniclub_events', JSON.stringify(SEED_DATA.events));
    localStorage.setItem('uniclub_registrations', JSON.stringify(SEED_DATA.registrations));
    localStorage.setItem('uniclub_membership_requests', JSON.stringify(SEED_DATA.membershipRequests));
    localStorage.setItem('uniclub_admin_sessions', JSON.stringify(SEED_DATA.adminSessions));
    localStorage.setItem('uniclub_trusted_devices', JSON.stringify(SEED_DATA.trustedDevices));
    localStorage.setItem('uniclub_audit_logs', JSON.stringify(SEED_DATA.auditLogs));
    localStorage.setItem('uniclub_initialized', 'true');
  }
}

// Global Toast helper
function showToast(message, type = 'success') {
  let toastContainer = document.getElementById('uniclub-toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'uniclub-toast-container';
    toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    toastContainer.style.zIndex = '9999';
    document.body.appendChild(toastContainer);
  }

  const toastId = 'toast-' + Date.now();
  const bgClass = type === 'success' ? 'bg-success' : type === 'danger' ? 'bg-danger' : 'bg-primary';
  const icon = type === 'success' ? 'bi-check-circle-fill' : type === 'danger' ? 'bi-exclamation-triangle-fill' : 'bi-info-circle-fill';

  const toastHtml = `
    <div id="${toastId}" class="toast align-items-center text-white ${bgClass} border-0" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="d-flex">
        <div class="toast-body d-flex align-items-center gap-2">
          <i class="bi ${icon} fs-5"></i>
          <span>${message}</span>
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    </div>
  `;

  toastContainer.insertAdjacentHTML('beforeend', toastHtml);
  const toastElem = document.getElementById(toastId);
  const bsToast = new bootstrap.Toast(toastElem, { delay: 4000 });
  bsToast.show();
  toastElem.addEventListener('hidden.bs.toast', () => toastElem.remove());
}

// Run on load
document.addEventListener('DOMContentLoaded', () => {
  initUniClubStorage();
});
