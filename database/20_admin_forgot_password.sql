-- ============================================================
-- BOOK MY INTERVIEW
-- FILE 20: Admin / HR Forgot Password OTP
-- ============================================================

USE `getjob`;

-- ────────────────────────────────────────────────────────────
-- TABLE: bmi_admin_otp
-- OTP-based password reset for admin/HR/recruiter users
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `bmi_admin_otp` (
  `id`            CHAR(36)    NOT NULL DEFAULT (UUID()),
  `user_id`       CHAR(36)    NOT NULL,
  `tenant_id`     CHAR(36)    NOT NULL,
  `otp_hash`      VARCHAR(255) NOT NULL COMMENT 'bcrypt hash of the 6-digit OTP',
  `attempts`      INT         NOT NULL DEFAULT 0 COMMENT 'Failed verification attempts',
  `expires_at`    DATETIME    NOT NULL,
  `used`          TINYINT(1)  NOT NULL DEFAULT 0,
  `created_at`    DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_user`    (`user_id`),
  INDEX `idx_tenant`  (`tenant_id`),
  INDEX `idx_expires` (`expires_at`),
  CONSTRAINT `fk_admin_otp_user`   FOREIGN KEY (`user_id`)   REFERENCES `bmi_user`(`id`)   ON DELETE CASCADE,
  CONSTRAINT `fk_admin_otp_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `bmi_tenant`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='OTP records for admin/recruiter password reset';

SELECT 'File 20: Admin OTP table created.' AS status;
