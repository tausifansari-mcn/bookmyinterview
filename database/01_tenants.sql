-- ============================================================
-- BOOK MY INTERVIEW
-- FILE 01: Tenants (Multi-Tenant SaaS Foundation)
-- ============================================================

USE `suggest`;

-- ────────────────────────────────────────────────────────────
-- TABLE: bmi_tenant
-- One row per company using the platform
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `bmi_tenant` (
  `id`              CHAR(36)      NOT NULL DEFAULT (UUID()),
  `tenant_code`     VARCHAR(50)   NOT NULL,
  `company_name`    VARCHAR(255)  NOT NULL,
  `company_logo`    VARCHAR(500)  DEFAULT NULL,
  `industry`        VARCHAR(100)  DEFAULT NULL,
  `company_size`    ENUM('1-10','11-50','51-200','201-500','501-1000','1000+') DEFAULT '51-200',
  `country`         VARCHAR(100)  NOT NULL DEFAULT 'India',
  `timezone`        VARCHAR(50)   NOT NULL DEFAULT 'Asia/Kolkata',
  `plan`            ENUM('starter','growth','enterprise','white_label') NOT NULL DEFAULT 'starter',
  `plan_expires_at` DATETIME      DEFAULT NULL,
  `ai_credits`      INT           NOT NULL DEFAULT 100,
  `is_active`       TINYINT(1)    NOT NULL DEFAULT 1,
  `created_at`      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tenant_code` (`tenant_code`),
  INDEX `idx_plan` (`plan`),
  INDEX `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='SaaS tenant registry — one row per company using the platform';

SELECT 'Table bmi_tenant created.' AS status;
