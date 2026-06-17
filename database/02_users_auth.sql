-- ============================================================
-- BOOK MY INTERVIEW
-- FILE 02: Users & Authentication
-- ============================================================

USE `suggest`;

-- ────────────────────────────────────────────────────────────
-- TABLE: bmi_user
-- Platform users: admin, hr_manager, recruiter, interviewer etc.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `bmi_user` (
  `id`                   CHAR(36)      NOT NULL,
  `tenant_id`            CHAR(36)      NOT NULL,
  `email`                VARCHAR(255)  NOT NULL,
  `password_hash`        VARCHAR(255)  NOT NULL,
  `full_name`            VARCHAR(255)  NOT NULL,
  `mobile`               VARCHAR(20)   DEFAULT NULL,
  `avatar_url`           VARCHAR(500)  DEFAULT NULL,
  `role`                 ENUM(
                           'super_admin',
                           'admin',
                           'hr_manager',
                           'recruiter',
                           'interviewer',
                           'hiring_manager',
                           'viewer'
                         ) NOT NULL DEFAULT 'recruiter',
  `is_blocked`           TINYINT(1)    NOT NULL DEFAULT 0,
  `must_change_password` TINYINT(1)    NOT NULL DEFAULT 0,
  `last_login_at`        DATETIME      DEFAULT NULL,
  `created_at`           DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`           DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tenant_email` (`tenant_id`, `email`),
  INDEX `idx_email` (`email`),
  INDEX `idx_role` (`role`),
  CONSTRAINT `fk_user_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `bmi_tenant`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Platform users per tenant';

-- ────────────────────────────────────────────────────────────
-- TABLE: bmi_refresh_token
-- JWT refresh tokens for auth
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `bmi_refresh_token` (
  `id`           CHAR(36)      NOT NULL DEFAULT (UUID()),
  `user_id`      CHAR(36)      NOT NULL,
  `tenant_id`    CHAR(36)      NOT NULL,
  `token_hash`   VARCHAR(255)  NOT NULL,
  `expires_at`   DATETIME      NOT NULL,
  `revoked`      TINYINT(1)    NOT NULL DEFAULT 0,
  `ip_address`   VARCHAR(45)   DEFAULT NULL,
  `user_agent`   TEXT          DEFAULT NULL,
  `created_at`   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_token_hash` (`token_hash`),
  INDEX `idx_user_active` (`user_id`, `revoked`),
  INDEX `idx_expires` (`expires_at`),
  CONSTRAINT `fk_token_user` FOREIGN KEY (`user_id`) REFERENCES `bmi_user`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='JWT refresh tokens — one per active session';

-- ────────────────────────────────────────────────────────────
-- TABLE: bmi_password_reset
-- OTP-based password reset tokens
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `bmi_password_reset` (
  `id`         CHAR(36)      NOT NULL DEFAULT (UUID()),
  `user_id`    CHAR(36)      NOT NULL,
  `otp_hash`   VARCHAR(255)  NOT NULL,
  `expires_at` DATETIME      NOT NULL,
  `used`       TINYINT(1)    NOT NULL DEFAULT 0,
  `created_at` DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_user` (`user_id`),
  CONSTRAINT `fk_pwreset_user` FOREIGN KEY (`user_id`) REFERENCES `bmi_user`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Password reset OTP tokens';

SELECT 'Tables bmi_user, bmi_refresh_token, bmi_password_reset created.' AS status;
