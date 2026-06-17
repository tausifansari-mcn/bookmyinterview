-- ============================================================
-- BOOK MY INTERVIEW
-- FILE 03: Organisation Masters (Department, Location, Pipeline)
-- ============================================================

USE `suggest`;

-- ────────────────────────────────────────────────────────────
-- TABLE: bmi_department
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `bmi_department` (
  `id`           CHAR(36)      NOT NULL DEFAULT (UUID()),
  `tenant_id`    CHAR(36)      NOT NULL,
  `name`         VARCHAR(255)  NOT NULL,
  `code`         VARCHAR(50)   DEFAULT NULL,
  `head_user_id` CHAR(36)      DEFAULT NULL,
  `is_active`    TINYINT(1)    NOT NULL DEFAULT 1,
  `created_at`   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tenant_dept_name` (`tenant_id`, `name`),
  INDEX `idx_tenant` (`tenant_id`),
  CONSTRAINT `fk_dept_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `bmi_tenant`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Company departments per tenant';

-- ────────────────────────────────────────────────────────────
-- TABLE: bmi_location
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `bmi_location` (
  `id`         CHAR(36)      NOT NULL DEFAULT (UUID()),
  `tenant_id`  CHAR(36)      NOT NULL,
  `city`       VARCHAR(100)  NOT NULL,
  `state`      VARCHAR(100)  DEFAULT NULL,
  `country`    VARCHAR(100)  NOT NULL DEFAULT 'India',
  `pincode`    VARCHAR(10)   DEFAULT NULL,
  `is_active`  TINYINT(1)    NOT NULL DEFAULT 1,
  `created_at` DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_tenant` (`tenant_id`),
  CONSTRAINT `fk_location_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `bmi_tenant`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Office/branch locations per tenant';

-- ────────────────────────────────────────────────────────────
-- TABLE: bmi_pipeline_template
-- Reusable hiring pipeline templates
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `bmi_pipeline_template` (
  `id`          CHAR(36)      NOT NULL DEFAULT (UUID()),
  `tenant_id`   CHAR(36)      NOT NULL,
  `name`        VARCHAR(255)  NOT NULL,
  `description` TEXT          DEFAULT NULL,
  `is_default`  TINYINT(1)    NOT NULL DEFAULT 0,
  `created_by`  CHAR(36)      NOT NULL,
  `created_at`  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_tenant` (`tenant_id`),
  CONSTRAINT `fk_pipeline_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `bmi_tenant`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Reusable hiring pipeline templates';

-- ────────────────────────────────────────────────────────────
-- TABLE: bmi_pipeline_stage
-- Ordered stages within a pipeline template
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `bmi_pipeline_stage` (
  `id`                   CHAR(36)      NOT NULL DEFAULT (UUID()),
  `pipeline_template_id` CHAR(36)      NOT NULL,
  `tenant_id`            CHAR(36)      NOT NULL,
  `stage_name`           VARCHAR(100)  NOT NULL,
  `stage_order`          INT           NOT NULL,
  `stage_type`           ENUM(
                           'screening',
                           'assessment',
                           'interview',
                           'offer',
                           'background_check',
                           'onboarding',
                           'rejected',
                           'withdrawn'
                         ) NOT NULL,
  `auto_advance`         TINYINT(1)    NOT NULL DEFAULT 0,
  `sla_hours`            INT           DEFAULT NULL COMMENT 'SLA hours to complete this stage',
  `email_template_key`   VARCHAR(100)  DEFAULT NULL,
  `created_at`           DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_template_order` (`pipeline_template_id`, `stage_order`),
  INDEX `idx_tenant` (`tenant_id`),
  CONSTRAINT `fk_stage_pipeline` FOREIGN KEY (`pipeline_template_id`) REFERENCES `bmi_pipeline_template`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Ordered stages within a pipeline template';

SELECT 'Tables bmi_department, bmi_location, bmi_pipeline_template, bmi_pipeline_stage created.' AS status;
