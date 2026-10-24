-- ==============================================================================
-- UNICLUB HUB - CƠ SỞ DỮ LIỆU CHUẨN HOÁ (MYSQL 8.0)
-- Tuân thủ Thiết kế ERD mở rộng (F.7), Quy ước tên bảng (J.5) & Bảo mật J.7/J.10
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS `uniclub_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `uniclub_db`;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `admin_control`;
DROP TABLE IF EXISTS `remember_tokens`;
DROP TABLE IF EXISTS `trusted_devices`;
DROP TABLE IF EXISTS `admin_sessions`;
DROP TABLE IF EXISTS `audit_logs`;
DROP TABLE IF EXISTS `feedback`;
DROP TABLE IF EXISTS `notification_recipients`;
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `posts`;
DROP TABLE IF EXISTS `qr_tokens`;
DROP TABLE IF EXISTS `attendance`;
DROP TABLE IF EXISTS `event_registrations`;
DROP TABLE IF EXISTS `events`;
DROP TABLE IF EXISTS `membership_requests`;
DROP TABLE IF EXISTS `member_assignments`;
DROP TABLE IF EXISTS `terms`;
DROP TABLE IF EXISTS `positions`;
DROP TABLE IF EXISTS `departments`;
DROP TABLE IF EXISTS `users`;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. BẢNG USERS (Tài khoản người dùng & phân quyền vai trò)
CREATE TABLE `users` (
  `user_id` INT AUTO_INCREMENT PRIMARY KEY,
  `mssv` VARCHAR(20) UNIQUE NOT NULL,
  `full_name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) UNIQUE NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(20),
  `class_name` VARCHAR(50),
  `faculty` VARCHAR(100),
  `role` ENUM('MEMBER', 'DEPARTMENT_LEADER', 'ADMIN', 'SUPER_ADMIN') NOT NULL DEFAULT 'MEMBER',
  `status` ENUM('ACTIVE', 'LOCKED', 'PENDING') NOT NULL DEFAULT 'ACTIVE',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_users_email` (`email`),
  INDEX `idx_users_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. BẢNG DEPARTMENTS (Ban / Bộ phận trong CLB)
CREATE TABLE `departments` (
  `department_id` INT AUTO_INCREMENT PRIMARY KEY,
  `department_name` VARCHAR(100) NOT NULL,
  `description` TEXT,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. BẢNG POSITIONS (Chức vụ trong tổ chức)
CREATE TABLE `positions` (
  `position_id` INT AUTO_INCREMENT PRIMARY KEY,
  `position_name` VARCHAR(100) NOT NULL,
  `description` TEXT,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. BẢNG TERMS (Nhiệm kỳ hoạt động)
CREATE TABLE `terms` (
  `term_id` INT AUTO_INCREMENT PRIMARY KEY,
  `term_name` VARCHAR(100) NOT NULL,
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `is_current` BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `chk_term_dates` CHECK (`end_date` >= `start_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. BẢNG MEMBER_ASSIGNMENTS (Lịch sử phân công hội viên theo Ban, Chức vụ & Nhiệm kỳ)
CREATE TABLE `member_assignments` (
  `assignment_id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `department_id` INT NOT NULL,
  `position_id` INT NOT NULL,
  `term_id` INT NOT NULL,
  `start_date` DATE NOT NULL,
  `end_date` DATE,
  `status` ENUM('ACTIVE', 'ENDED') NOT NULL DEFAULT 'ACTIVE',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE,
  FOREIGN KEY (`department_id`) REFERENCES `departments`(`department_id`),
  FOREIGN KEY (`position_id`) REFERENCES `positions`(`position_id`),
  FOREIGN KEY (`term_id`) REFERENCES `terms`(`term_id`),
  INDEX `idx_assignments_user` (`user_id`, `term_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. BẢNG MEMBERSHIP_REQUESTS (Đơn xin gia nhập CLB của ứng viên mới)
CREATE TABLE `membership_requests` (
  `request_id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `target_department_id` INT NOT NULL,
  `reason` TEXT NOT NULL,
  `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'WITHDRAWN') NOT NULL DEFAULT 'PENDING',
  `reviewed_by` INT,
  `reviewed_at` DATETIME,
  `rejection_reason` VARCHAR(255),
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE,
  FOREIGN KEY (`target_department_id`) REFERENCES `departments`(`department_id`),
  FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`user_id`),
  INDEX `idx_requests_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. BẢNG EVENTS (Hoạt động & Sự kiện CLB)
CREATE TABLE `events` (
  `event_id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(200) NOT NULL,
  `event_type` ENUM('Học thuật', 'Tình nguyện', 'Giải trí', 'Sinh hoạt', 'Kỹ năng') NOT NULL,
  `description` TEXT,
  `start_time` DATETIME NOT NULL,
  `end_time` DATETIME NOT NULL,
  `location` VARCHAR(150) NOT NULL,
  `max_capacity` INT NOT NULL,
  `remaining_seats` INT NOT NULL,
  `department_id` INT,
  `status` ENUM('DRAFT', 'OPEN', 'FULL', 'CLOSED', 'CANCELLED', 'COMPLETED') NOT NULL DEFAULT 'OPEN',
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`department_id`) REFERENCES `departments`(`department_id`),
  CONSTRAINT `chk_event_capacity` CHECK (`max_capacity` > 0 AND `remaining_seats` >= 0 AND `remaining_seats` <= `max_capacity`),
  CONSTRAINT `chk_event_time` CHECK (`end_time` > `start_time`),
  INDEX `idx_events_status` (`status`, `start_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. BẢNG EVENT_REGISTRATIONS (Đăng ký tham gia - Chống race condition & trùng lặp J.6.1)
CREATE TABLE `event_registrations` (
  `registration_id` INT AUTO_INCREMENT PRIMARY KEY,
  `event_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `participation_format` ENUM('Trực tiếp', 'Trực tuyến') NOT NULL DEFAULT 'Trực tiếp',
  `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'CHECKED_IN') NOT NULL DEFAULT 'PENDING',
  `reviewed_by` INT,
  `reviewed_at` DATETIME,
  `rejection_reason` VARCHAR(255),
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`event_id`) REFERENCES `events`(`event_id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE,
  FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`user_id`),
  -- Ràng buộc chặn 1 sinh viên gửi 2 đơn cho cùng 1 sự kiện (TC58)
  UNIQUE KEY `uk_event_user` (`event_id`, `user_id`),
  INDEX `idx_reg_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. BẢNG ATTENDANCE (Điểm danh QR động & Điểm danh thủ công)
CREATE TABLE `attendance` (
  `attendance_id` INT AUTO_INCREMENT PRIMARY KEY,
  `registration_id` INT NOT NULL UNIQUE,
  `checked_in_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `method` ENUM('QR_SCAN', 'MANUAL') NOT NULL DEFAULT 'QR_SCAN',
  `verifier_user_id` INT,
  FOREIGN KEY (`registration_id`) REFERENCES `event_registrations`(`registration_id`) ON DELETE CASCADE,
  FOREIGN KEY (`verifier_user_id`) REFERENCES `users`(`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. BẢNG QR_TOKENS (Token điểm danh QR động thay đổi mỗi 20-30s J.6)
CREATE TABLE `qr_tokens` (
  `token_id` INT AUTO_INCREMENT PRIMARY KEY,
  `event_id` INT NOT NULL,
  `token_hash` VARCHAR(64) NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`event_id`) REFERENCES `events`(`event_id`) ON DELETE CASCADE,
  INDEX `idx_qr_expiry` (`event_id`, `expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. BẢNG POSTS & NOTIFICATIONS & FEEDBACK
CREATE TABLE `posts` (
  `post_id` INT AUTO_INCREMENT PRIMARY KEY,
  `author_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `content` TEXT NOT NULL,
  `image_url` VARCHAR(255),
  `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'PUBLISHED',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`author_id`) REFERENCES `users`(`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `notifications` (
  `notification_id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(200) NOT NULL,
  `content` TEXT NOT NULL,
  `target_type` ENUM('ALL', 'DEPARTMENT', 'INDIVIDUAL') NOT NULL DEFAULT 'ALL',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `feedback` (
  `feedback_id` INT AUTO_INCREMENT PRIMARY KEY,
  `event_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `rating_stars` TINYINT NOT NULL,
  `comment` TEXT,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`event_id`) REFERENCES `events`(`event_id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_feedback_event_user` (`event_id`, `user_id`),
  CONSTRAINT `chk_rating_stars` CHECK (`rating_stars` BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. BẢNG TRUSTED_DEVICES (Thiết bị tin cậy 30 ngày J.7)
CREATE TABLE `trusted_devices` (
  `device_id` VARCHAR(50) PRIMARY KEY,
  `user_id` INT NOT NULL,
  `device_token_hash` VARCHAR(64) NOT NULL UNIQUE,
  `device_name` VARCHAR(150) NOT NULL,
  `ip_address` VARCHAR(45) NOT NULL,
  `status` ENUM('APPROVED', 'REVOKED') NOT NULL DEFAULT 'APPROVED',
  `last_used_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` DATETIME NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. BẢNG ADMIN_SESSIONS (Quản lý phiên độc quyền Single Active Admin J.7.1)
CREATE TABLE `admin_sessions` (
  `session_id` VARCHAR(64) PRIMARY KEY,
  `user_id` INT NOT NULL,
  `device_id` VARCHAR(50),
  `ip_address` VARCHAR(45) NOT NULL,
  `device_info` VARCHAR(255) NOT NULL,
  `is_primary` BOOLEAN NOT NULL DEFAULT FALSE,
  `status` ENUM('PENDING_APPROVAL', 'ACTIVE', 'KICKED', 'EXPIRED', 'REVOKED') NOT NULL DEFAULT 'PENDING_APPROVAL',
  `last_active` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE,
  FOREIGN KEY (`device_id`) REFERENCES `trusted_devices`(`device_id`) ON DELETE SET NULL,
  INDEX `idx_admin_sessions_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. BẢNG ADMIN_CONTROL (Khóa chốt DB đảm bảo DUY NHẤT 1 PRIMARY ADMIN đồng thời J.7.1)
CREATE TABLE `admin_control` (
  `id` INT PRIMARY KEY DEFAULT 1,
  `current_primary_session_id` VARCHAR(64),
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`current_primary_session_id`) REFERENCES `admin_sessions`(`session_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Khởi tạo hàng điều khiển duy nhất
INSERT INTO `admin_control` (`id`, `current_primary_session_id`) VALUES (1, NULL)
ON DUPLICATE KEY UPDATE `id` = 1;

-- 15. BẢNG AUDIT_LOGS (Nhật ký bất biến Immutable Audit Log J.7.3)
CREATE TABLE `audit_logs` (
  `log_id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT,
  `session_id` VARCHAR(64),
  `ip_address` VARCHAR(45) NOT NULL,
  `device_info` VARCHAR(255),
  `action` VARCHAR(100) NOT NULL,
  `object_type` VARCHAR(50) NOT NULL,
  `object_id` VARCHAR(100),
  `details_json` JSON,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_audit_created` (`created_at`),
  INDEX `idx_audit_action` (`action`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
