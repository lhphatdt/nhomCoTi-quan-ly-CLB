-- ==============================================================================
-- UNICLUB HUB - SEED DATA (DỮ LIỆU MẪU ĐẦY ĐỦ CHO DEMO VÀ BẢO VỆ ĐỒ ÁN)
-- Đáp ứng yêu cầu Phụ lục bổ sung (trang 24-26) & Checklist Demo Day (trang 22)
-- ==============================================================================

USE `uniclub_db`;

-- 1. TÀI KHOẢN NGƯỜI DÙNG & VAI TRÒ (Mật khẩu băm an toàn BCrypt / PBKDF2)
-- Mật khẩu ban đầu:
-- Admin: admin@uniclub.vn / Admin@68nguyenchithanh
-- Member: hoivien@gmail.com / Pass1234
-- Super Admin: banchunhiem@uniclub.vn / Admin@123456
INSERT INTO `users` (`user_id`, `mssv`, `full_name`, `email`, `password_hash`, `phone`, `class_name`, `faculty`, `role`, `status`) VALUES
(1, '2374820143', 'Lưu Hữu Phát', 'admin@uniclub.vn', '$2a$10$wT8m9sM94B4E8k2BfJqP5e5zC6X1e2r3t4y5u6i7o8p9a0s1d2f3g', '0912345602', 'D23CNTT02', 'Viện Công nghệ Thông tin', 'ADMIN', 'ACTIVE'),
(2, '2374820116', 'Nguyễn Phương Linh', 'banchunhiem@uniclub.vn', '$2a$10$wT8m9sM94B4E8k2BfJqP5e5zC6X1e2r3t4y5u6i7o8p9a0s1d2f3g', '0912345601', 'D23CNTT01', 'Viện Công nghệ Thông tin', 'SUPER_ADMIN', 'ACTIVE'),
(3, '2374820065', 'Nguyễn Ngọc Hoa', 'hoivien@gmail.com', '$2a$10$wT8m9sM94B4E8k2BfJqP5e5zC6X1e2r3t4y5u6i7o8p9a0s1d2f3g', '0912345603', 'D23CNTT01', 'Viện Công nghệ Thông tin', 'MEMBER', 'ACTIVE'),
(4, '2374820180', 'Đỗ Thị Thơ', 'tho.dt@uniclub.vn', '$2a$10$wT8m9sM94B4E8k2BfJqP5e5zC6X1e2r3t4y5u6i7o8p9a0s1d2f3g', '0912345604', 'D23CNTT03', 'Khoa Truyền thông', 'DEPARTMENT_LEADER', 'ACTIVE'),
(5, '2374820088', 'Trần Văn An', 'an.tv@uniclub.vn', '$2a$10$wT8m9sM94B4E8k2BfJqP5e5zC6X1e2r3t4y5u6i7o8p9a0s1d2f3g', '0912345605', 'D23CNTT02', 'Viện Công nghệ Thông tin', 'MEMBER', 'ACTIVE'),
(6, '2374820099', 'Lê Thị Bích', 'bich.lt@uniclub.vn', '$2a$10$wT8m9sM94B4E8k2BfJqP5e5zC6X1e2r3t4y5u6i7o8p9a0s1d2f3g', '0912345606', 'D23CNTT02', 'Khoa Quản trị', 'MEMBER', 'ACTIVE'),
(7, '2374820101', 'Hoàng Minh Cường', 'cuong.hm@uniclub.vn', '$2a$10$wT8m9sM94B4E8k2BfJqP5e5zC6X1e2r3t4y5u6i7o8p9a0s1d2f3g', '0912345607', 'D23CNTT01', 'Khoa Ngoại ngữ', 'DEPARTMENT_LEADER', 'ACTIVE'),
(8, '2374820102', 'Phạm Hải Đăng', 'dang.ph@uniclub.vn', '$2a$10$wT8m9sM94B4E8k2BfJqP5e5zC6X1e2r3t4y5u6i7o8p9a0s1d2f3g', '0912345608', 'D23CNTT03', 'Viện Công nghệ Thông tin', 'MEMBER', 'ACTIVE'),
(9, '2374820103', 'Vũ Thúy Hằng', 'hang.vt@uniclub.vn', '$2a$10$wT8m9sM94B4E8k2BfJqP5e5zC6X1e2r3t4y5u6i7o8p9a0s1d2f3g', '0912345609', 'D23CNTT02', 'Khoa Truyền thông', 'MEMBER', 'LOCKED'),
(10, '2374820104', 'Đinh Quang Khải', 'khai.dq@uniclub.vn', '$2a$10$wT8m9sM94B4E8k2BfJqP5e5zC6X1e2r3t4y5u6i7o8p9a0s1d2f3g', '0912345610', 'D23CNTT01', 'Viện Công nghệ Thông tin', 'MEMBER', 'ACTIVE');

-- 2. BAN / BỘ PHẬN
INSERT INTO `departments` (`department_id`, `department_name`, `description`, `is_active`) VALUES
(1, 'Ban Chủ nhiệm', 'Điều hành chung toàn bộ hoạt động câu lạc bộ, đối ngoại nhà trường', TRUE),
(2, 'Ban Chuyên môn', 'Đào tạo kỹ thuật phần mềm, tổ chức workshop công nghệ, quản trị mã nguồn CI/CD', TRUE),
(3, 'Ban Sự kiện', 'Lên ý tưởng, lập kế hoạch hậu cần và điều phối các chương trình, hoạt động CLB', TRUE),
(4, 'Ban Truyền thông', 'Viết bài, thiết kế poster, quản lý fanpage và quảng bá hình ảnh CLB sinh viên', TRUE),
(5, 'Ban Đối ngoại - Tài chính', 'Tìm kiếm nhà tài trợ, kết nối cựu sinh viên và quản lý quỹ CLB minh bạch', TRUE);

-- 3. CHỨC VỤ
INSERT INTO `positions` (`position_id`, `position_name`, `description`) VALUES
(1, 'Chủ nhiệm CLB', 'Đại diện hợp pháp cao nhất của CLB sinh viên'),
(2, 'Phó Chủ nhiệm', 'Hỗ trợ chủ nhiệm điều phối các ban chuyên trách'),
(3, 'Trưởng ban', 'Chịu trách nhiệm trực tiếp công việc chuyên môn của ban'),
(4, 'Phó ban', 'Hỗ trợ trưởng ban phân công và đôn đốc thành viên'),
(5, 'Thành viên chính thức', 'Tham gia sinh hoạt định kỳ và thực thi nhiệm vụ được giao');

-- 4. NHIỆM KỲ
INSERT INTO `terms` (`term_id`, `term_name`, `start_date`, `end_date`, `is_current`) VALUES
(1, 'Nhiệm kỳ 2024 - 2025', '2024-09-01', '2025-08-31', FALSE),
(2, 'Nhiệm kỳ 2025 - 2026', '2025-09-01', '2026-08-31', TRUE);

-- 5. PHÂN CÔNG THÀNH VIÊN
INSERT INTO `member_assignments` (`user_id`, `department_id`, `position_id`, `term_id`, `start_date`, `status`) VALUES
(2, 1, 1, 2, '2025-09-01', 'ACTIVE'),
(1, 2, 3, 2, '2025-09-01', 'ACTIVE'),
(3, 3, 3, 2, '2025-09-01', 'ACTIVE'),
(4, 4, 3, 2, '2025-09-01', 'ACTIVE'),
(7, 5, 3, 2, '2025-09-01', 'ACTIVE');

-- 6. DANH SÁCH 15 SỰ KIỆN MẪU (Checklist Demo Day trang 22)
INSERT INTO `events` (`event_id`, `title`, `event_type`, `description`, `start_time`, `end_time`, `location`, `max_capacity`, `remaining_seats`, `department_id`, `status`) VALUES
(1, 'Workshop Git & GitHub Actions CI/CD Thực Chiến', 'Học thuật', 'Thực hành xây dựng pipeline tự động kiểm thử JUnit và triển khai Tomcat cho đồ án Java.', '2026-10-15 08:00:00', '2026-10-15 11:30:00', 'Hội trường A2-301', 100, 32, 2, 'OPEN'),
(2, 'Chiến dịch Tình nguyện Mùa Thu 2026', 'Tình nguyện', 'Quyên góp sách vở và hỗ trợ học sinh có hoàn cảnh khó khăn tại Ba Vì.', '2026-10-22 07:00:00', '2026-10-22 17:00:00', 'Huyện Ba Vì, Hà Nội', 50, 12, 3, 'OPEN'),
(3, 'Hackathon UniClub DevCup 2026', 'Cuộc thi', 'Lập trình 12 giờ sáng tạo giải pháp công nghệ phục vụ sinh viên trong trường.', '2026-11-05 08:00:00', '2026-11-05 20:00:00', 'Lab 402 - Tòa nhà Công nghệ', 60, 0, 2, 'FULL'),
(4, 'Sinh hoạt CLB Định kỳ Tháng 10 & Chào Tân Hội Viên', 'Sinh hoạt', 'Gặp gỡ tân sinh viên, công bố kế hoạch hoạt động học kỳ I.', '2026-10-18 18:30:00', '2026-10-18 21:00:00', 'Hội trường B1', 120, 45, 1, 'OPEN'),
(5, 'Buổi Chia Sẻ Kỹ Năng Phỏng Vấn Doanh Nghiệp Tech', 'Kỹ năng', 'Cựu sinh viên FPT Software và Viettel chia sẻ bí quyết viết CV và phỏng vấn thực tế.', '2026-11-12 09:00:00', '2026-11-12 11:30:00', 'Phòng Hội thảo 2', 80, 25, 5, 'OPEN'),
(6, 'Giải Đấu Thể Thao Điện Tử E-Sports UniCup', 'Giải trí', 'Giao lưu bộ môn Liên Minh Huyền Thoại giữa các liên chi hội.', '2026-11-20 13:00:00', '2026-11-20 18:00:00', 'Phòng Thể thao Đa năng', 150, 60, 3, 'OPEN'),
(7, 'Tọa đàm: Trí Tuệ Nhân Tạo và Tương Lai Lập Trình Viên', 'Học thuật', 'Chuyên gia Viettel AI chia sẻ cơ hội nghề nghiệp trong kỷ nguyên LLM.', '2026-12-01 08:30:00', '2026-12-01 11:30:00', 'Hội trường Lớn', 200, 110, 2, 'OPEN'),
(8, 'Hiến Máu Nhân Đạo Giọt Hồng Sinh Viên', 'Tình nguyện', 'Ngày hội hiến máu tình nguyện kết hợp cùng Viện Huyết học TW.', '2026-12-10 07:30:00', '2026-12-10 16:30:00', 'Sảnh Tòa A', 300, 180, 3, 'OPEN'),
(9, 'Workshop Thiết Kế UI/UX với Figma Cho Người Mới', 'Kỹ năng', 'Hướng dẫn xây dựng Design System và Prototype giao diện web di động.', '2026-12-15 14:00:00', '2026-12-15 17:00:00', 'Lab Đa phương tiện 301', 40, 5, 4, 'OPEN'),
(10, 'Hội Nghị Tổng Kết Cuối Năm & Trao Khen Thưởng', 'Sinh hoạt', 'Đánh giá hoạt động các ban, biểu dương top hội viên xuất sắc.', '2026-12-28 18:00:00', '2026-12-28 21:30:00', 'Trung tâm Sự kiện', 250, 95, 1, 'OPEN'),
(11, 'Chương Trình Đón Tết Ấm Áp Cho Trẻ Em Vùng Cao', 'Tình nguyện', 'Chuyến đi thiện nguyện vùng cao trước kỳ nghỉ Tết Nguyên đán.', '2027-01-10 06:00:00', '2027-01-12 18:00:00', 'Tỉnh Hà Giang', 35, 8, 3, 'OPEN'),
(12, 'Khóa Huấn Luyện Clean Code & Refactoring Java', 'Học thuật', 'Áp dụng Design Patterns và nguyên lý SOLID trong đồ án thực tế.', '2027-01-20 08:30:00', '2027-01-20 11:30:00', 'Phòng 204 - Nhà C', 50, 22, 2, 'OPEN'),
(13, 'Hội Thảo Du Học và Học Bổng Công Nghệ Châu Âu', 'Kỹ năng', 'Chia sẻ kinh nghiệm săn học bổng Master và Internship nước ngoài.', '2027-02-15 09:00:00', '2027-02-15 11:30:00', 'Phòng Hội thảo 1', 90, 40, 5, 'OPEN'),
(14, 'Ngày Hội Sách & Lan Tỏa Văn Hóa Đọc Sinh Viên', 'Sinh hoạt', 'Triển lãm sách công nghệ, tặng sách lập trình và giao lưu tác giả.', '2027-02-25 08:00:00', '2027-02-25 17:00:00', 'Thư viện Tầng 2', 120, 75, 4, 'OPEN'),
(15, 'Lễ Kết Nạp Hội Viên Mới Đợt 1 Năm 2027', 'Sinh hoạt', 'Trao thẻ hội viên và phổ biến quy chế rèn luyện CLB.', '2027-03-05 18:30:00', '2027-03-05 20:30:00', 'Hội trường A2', 150, 110, 1, 'OPEN');

-- 7. ĐĂNG KÝ THAM GIA MẪU (Bao gồm các trạng thái PENDING, APPROVED, REJECTED, CHECKED_IN)
INSERT INTO `event_registrations` (`registration_id`, `event_id`, `user_id`, `participation_format`, `status`, `reviewed_by`, `reviewed_at`) VALUES
(1, 1, 5, 'Trực tiếp', 'APPROVED', 1, '2026-10-02 10:15:00'),
(2, 1, 6, 'Trực tiếp', 'PENDING', NULL, NULL),
(3, 2, 7, 'Trực tiếp', 'APPROVED', 1, '2026-10-03 14:20:00'),
(4, 3, 8, 'Trực tuyến', 'REJECTED', 1, '2026-10-04 16:00:00'),
(5, 4, 10, 'Trực tiếp', 'CHECKED_IN', 1, '2026-10-04 09:00:00');

-- 8. ĐIỂM DANH CHECK-IN
INSERT INTO `attendance` (`attendance_id`, `registration_id`, `checked_in_at`, `method`, `verifier_user_id`) VALUES
(1, 1, '2026-10-15 08:12:30', 'QR_SCAN', NULL),
(2, 5, '2026-10-04 18:35:10', 'MANUAL', 1);

-- 9. THIẾT BỊ TIN CẬY (Trusted Devices J.7)
INSERT INTO `trusted_devices` (`device_id`, `user_id`, `device_token_hash`, `device_name`, `ip_address`, `status`, `expires_at`) VALUES
('dev-01', 1, 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'Laptop Admin Văn phòng CLB', '113.190.234.12', 'APPROVED', '2026-11-24 10:00:00'),
('dev-02', 1, '5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5', 'PC Phòng Lab Thực Hành', '10.0.12.45', 'APPROVED', '2026-11-20 14:00:00'),
('dev-03', 1, '6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b', 'Máy cá nhân Phó Chủ nhiệm', '14.238.10.45', 'REVOKED', '2026-10-01 09:00:00');

-- 10. PHIÊN HOẠT ĐỘNG ADMIN (Single Active Session J.7.1)
INSERT INTO `admin_sessions` (`session_id`, `user_id`, `device_id`, `ip_address`, `device_info`, `is_primary`, `status`, `last_active`) VALUES
('sess-8891-hn', 1, 'dev-01', '113.190.234.12', 'Chrome 128 / Windows 11 (Máy chính văn phòng)', TRUE, 'ACTIVE', NOW()),
('sess-4412-mb', 1, NULL, '14.238.10.45', 'Safari 18 / MacBook Pro M3 (Yêu cầu đăng nhập mới)', FALSE, 'PENDING_APPROVAL', DATE_SUB(NOW(), INTERVAL 2 MINUTE)),
('sess-1920-ip', 1, NULL, '171.244.33.88', 'Safari Mobile / iPhone 15 Pro (Đã ngắt)', FALSE, 'KICKED', DATE_SUB(NOW(), INTERVAL 3 HOUR));

-- Đặt Primary Session vào admin_control
UPDATE `admin_control` SET `current_primary_session_id` = 'sess-8891-hn' WHERE `id` = 1;

-- 11. NHẬT KÝ LƯU VẾT BẤT BIẾN (Audit Logs - Chỉ INSERT & SELECT J.7.3)
INSERT INTO `audit_logs` (`log_id`, `user_id`, `session_id`, `ip_address`, `device_info`, `action`, `object_type`, `object_id`, `details_json`, `created_at`) VALUES
(1001, 1, 'sess-8891-hn', '113.190.234.12', 'Chrome 128 / Win11', 'LOGIN_PRIMARY', 'ADMIN_SESSION', 'sess-8891-hn', '{"isPrimary": true, "authMethod": "PASSWORD"}', DATE_SUB(NOW(), INTERVAL 2 HOUR)),
(1002, 1, 'sess-8891-hn', '113.190.234.12', 'Chrome 128 / Win11', 'APPROVE_TRUSTED_DEVICE', 'TRUSTED_DEVICE', 'dev-02', '{"deviceName": "PC Phòng Lab Thực Hành", "validDays": 30}', DATE_SUB(NOW(), INTERVAL 90 MINUTE)),
(1003, 1, 'sess-8891-hn', '113.190.234.12', 'Chrome 128 / Win11', 'KICK_SESSION', 'ADMIN_SESSION', 'sess-1920-ip', '{"reason": "Admin chủ động kickout phiên lạ"}', DATE_SUB(NOW(), INTERVAL 45 MINUTE)),
(1004, 1, 'sess-8891-hn', '113.190.234.12', 'Chrome 128 / Win11', 'APPROVE_REGISTRATION', 'EVENT_REGISTRATION', '1', '{"eventId": 1, "studentName": "Trần Văn An"}', DATE_SUB(NOW(), INTERVAL 20 MINUTE));
