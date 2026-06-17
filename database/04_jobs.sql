-- ============================================================
-- BOOK MY INTERVIEW
-- FILE 04: Jobs / Job Requisitions
-- ============================================================

USE `suggest`;

-- ────────────────────────────────────────────────────────────
-- TABLE: bmi_job
-- Job openings / requisitions posted by a tenant
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `bmi_job` (
  `id`                   CHAR(36)       NOT NULL DEFAULT (UUID()),
  `tenant_id`            CHAR(36)       NOT NULL,
  `job_code`             VARCHAR(50)    NOT NULL,
  `title`                VARCHAR(255)   NOT NULL,
  `department_id`        CHAR(36)       DEFAULT NULL,
  `location_id`          CHAR(36)       DEFAULT NULL,
  `job_type`             ENUM(
                           'full_time',
                           'part_time',
                           'contract',
                           'internship',
                           'temp'
                         ) NOT NULL DEFAULT 'full_time',
  `work_mode`            ENUM(
                           'onsite',
                           'remote',
                           'hybrid'
                         ) NOT NULL DEFAULT 'onsite',
  `experience_min_years` DECIMAL(4,1)   NOT NULL DEFAULT 0,
  `experience_max_years` DECIMAL(4,1)   DEFAULT NULL,
  `salary_min`           DECIMAL(12,2)  DEFAULT NULL,
  `salary_max`           DECIMAL(12,2)  DEFAULT NULL,
  `salary_currency`      VARCHAR(3)     NOT NULL DEFAULT 'INR',
  `headcount`            INT            NOT NULL DEFAULT 1,
  `filled_count`         INT            NOT NULL DEFAULT 0,
  `description`          TEXT           DEFAULT NULL,
  `requirements`         TEXT           DEFAULT NULL,
  `ai_jd`                TEXT           DEFAULT NULL COMMENT 'AI-generated job description',
  `skills_required`      JSON           DEFAULT NULL COMMENT 'Array of required skill strings',
  `pipeline_template_id` CHAR(36)       DEFAULT NULL,
  `status`               ENUM(
                           'draft',
                           'open',
                           'paused',
                           'closed',
                           'cancelled'
                         ) NOT NULL DEFAULT 'draft',
  `priority`             ENUM(
                           'low',
                           'medium',
                           'high',
                           'urgent'
                         ) NOT NULL DEFAULT 'medium',
  `posted_at`            DATETIME       DEFAULT NULL,
  `closes_at`            DATETIME       DEFAULT NULL,
  `created_by`           CHAR(36)       NOT NULL,
  `hiring_manager_id`    CHAR(36)       DEFAULT NULL,
  `created_at`           DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`           DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tenant_job_code` (`tenant_id`, `job_code`),
  INDEX `idx_status` (`status`),
  INDEX `idx_priority` (`priority`),
  INDEX `idx_tenant_status` (`tenant_id`, `status`),
  INDEX `idx_created_at` (`created_at`),
  CONSTRAINT `fk_job_tenant`     FOREIGN KEY (`tenant_id`)     REFERENCES `bmi_tenant`(`id`)              ON DELETE CASCADE,
  CONSTRAINT `fk_job_dept`       FOREIGN KEY (`department_id`) REFERENCES `bmi_department`(`id`)          ON DELETE SET NULL,
  CONSTRAINT `fk_job_location`   FOREIGN KEY (`location_id`)   REFERENCES `bmi_location`(`id`)            ON DELETE SET NULL,
  CONSTRAINT `fk_job_pipeline`   FOREIGN KEY (`pipeline_template_id`) REFERENCES `bmi_pipeline_template`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Job requisitions / open positions posted by a tenant';

-- ────────────────────────────────────────────────────────────
-- TABLE: bmi_job_board_post
-- Tracks where jobs have been posted (Naukri, LinkedIn etc.)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `bmi_job_board_post` (
  `id`                 CHAR(36)      NOT NULL DEFAULT (UUID()),
  `tenant_id`          CHAR(36)      NOT NULL,
  `job_id`             CHAR(36)      NOT NULL,
  `board`              ENUM(
                         'naukri',
                         'linkedin',
                         'indeed',
                         'shine',
                         'monster',
                         'glassdoor',
                         'internal',
                         'careers_page',
                         'other'
                       ) NOT NULL,
  `external_post_id`   VARCHAR(255)  DEFAULT NULL COMMENT 'ID returned by job board API',
  `post_url`           VARCHAR(500)  DEFAULT NULL,
  `status`             ENUM('pending','active','paused','closed','failed') NOT NULL DEFAULT 'pending',
  `posted_at`          DATETIME      DEFAULT NULL,
  `expires_at`         DATETIME      DEFAULT NULL,
  `applications_count` INT           NOT NULL DEFAULT 0,
  `cost`               DECIMAL(10,2) DEFAULT NULL COMMENT 'Cost of job posting',
  `error_message`      TEXT          DEFAULT NULL,
  `created_at`         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_job` (`job_id`),
  INDEX `idx_status` (`status`),
  CONSTRAINT `fk_jbpost_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `bmi_tenant`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_jbpost_job`    FOREIGN KEY (`job_id`)    REFERENCES `bmi_job`(`id`)    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Tracks which job boards a job has been posted to';

SELECT 'Tables bmi_job, bmi_job_board_post created.' AS status;
