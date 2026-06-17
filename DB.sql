CREATE DATABASE IF NOT EXISTS `getjob`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
  
  
use getjob

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
  
select * from bmi_user

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

select * from bmi_refresh_token
select * from bmi_password_reset

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
  
  
  
  
  
  
  --------------------------------------------
  
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

------------------------------------------------
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
Select * from bmi_job_board_post

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

select * from bmi_job

-----------------------------------xa-----------------

CREATE TABLE IF NOT EXISTS `bmi_candidate` (
  `id`                   CHAR(36)       NOT NULL DEFAULT (UUID()),
  `tenant_id`            CHAR(36)       NOT NULL,
  `candidate_code`       VARCHAR(50)    NOT NULL,
  `full_name`            VARCHAR(255)   NOT NULL,
  `email`                VARCHAR(255)   DEFAULT NULL,
  `mobile`               VARCHAR(20)    NOT NULL,
  `mobile_hash`          VARCHAR(64)    DEFAULT NULL COMMENT 'SHA-256 of mobile for deduplication checks',
  `email_hash`           VARCHAR(64)    DEFAULT NULL COMMENT 'SHA-256 of email for deduplication checks',
  `gender`               ENUM('male','female','other','prefer_not_to_say') DEFAULT NULL,
  `date_of_birth`        DATE           DEFAULT NULL,
  `current_location`     VARCHAR(255)   DEFAULT NULL,
  `preferred_location`   VARCHAR(255)   DEFAULT NULL,
  `highest_education`    VARCHAR(100)   DEFAULT NULL,
  `current_company`      VARCHAR(255)   DEFAULT NULL,
  `current_designation`  VARCHAR(255)   DEFAULT NULL,
  `experience_years`     DECIMAL(4,1)   DEFAULT NULL,
  `notice_period_days`   INT            DEFAULT NULL,
  `current_salary`       DECIMAL(12,2)  DEFAULT NULL,
  `expected_salary`      DECIMAL(12,2)  DEFAULT NULL,
  `resume_url`           VARCHAR(500)   DEFAULT NULL,
  `resume_text`          LONGTEXT       DEFAULT NULL COMMENT 'Extracted text from resume — used by AI screening',
  `skills_summary`       TEXT           DEFAULT NULL COMMENT 'Comma-separated or JSON skills list',
  `source`               ENUM(
                           'job_board',
                           'referral',
                           'linkedin',
                           'walk_in',
                           'agency',
                           'campus',
                           'direct',
                           'other'
                         ) NOT NULL DEFAULT 'direct',
  `source_detail`        VARCHAR(255)   DEFAULT NULL COMMENT 'e.g. Naukri, Employee name for referral',
  `referred_by_user_id`  CHAR(36)       DEFAULT NULL,
  `ai_score`             DECIMAL(5,2)   DEFAULT NULL COMMENT 'Latest AI match score 0-100',
  `ai_summary`           TEXT           DEFAULT NULL COMMENT 'Latest AI-generated candidate summary',
  `tags`                 JSON           DEFAULT NULL COMMENT 'Array of custom tags',
  `is_blacklisted`       TINYINT(1)     NOT NULL DEFAULT 0,
  `blacklist_reason`     TEXT           DEFAULT NULL,
  `created_by`           CHAR(36)       DEFAULT NULL,
  `created_at`           DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`           DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tenant_candidate_code` (`tenant_id`, `candidate_code`),
  INDEX `idx_mobile_hash`    (`mobile_hash`),
  INDEX `idx_email_hash`     (`email_hash`),
  INDEX `idx_tenant`         (`tenant_id`),
  INDEX `idx_ai_score`       (`ai_score`),
  INDEX `idx_source`         (`source`),
  INDEX `idx_created_at`     (`created_at`),
  CONSTRAINT `fk_candidate_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `bmi_tenant`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Master talent pool — one record per unique candidate per tenant';

-- ────────────────────────────────────────────────────────────
-- TABLE: bmi_candidate_document
-- Documents uploaded by or for a candidate
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `bmi_candidate_document` (
  `id`            CHAR(36)     NOT NULL DEFAULT (UUID()),
  `tenant_id`     CHAR(36)     NOT NULL,
  `candidate_id`  CHAR(36)     NOT NULL,
  `document_type` ENUM(
                    'resume',
                    'aadhaar',
                    'pan',
                    'passport',
                    'mark_sheet',
                    'experience_letter',
                    'offer_letter',
                    'salary_slip',
                    'photo',
                    'other'
                  ) NOT NULL,
  `file_name`     VARCHAR(255) NOT NULL,
  `file_url`      VARCHAR(500) NOT NULL,
  `file_size_kb`  INT          DEFAULT NULL,
  `mime_type`     VARCHAR(100) DEFAULT NULL,
  `uploaded_by`   ENUM('candidate','recruiter','system') NOT NULL DEFAULT 'recruiter',
  `verified`      TINYINT(1)   NOT NULL DEFAULT 0,
  `verified_by`   CHAR(36)     DEFAULT NULL,
  `verified_at`   DATETIME     DEFAULT NULL,
  `created_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_candidate_type` (`candidate_id`, `document_type`),
  INDEX `idx_tenant`         (`tenant_id`),
  CONSTRAINT `fk_doc_tenant`    FOREIGN KEY (`tenant_id`)    REFERENCES `bmi_tenant`(`id`)    ON DELETE CASCADE,
  CONSTRAINT `fk_doc_candidate` FOREIGN KEY (`candidate_id`) REFERENCES `bmi_candidate`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Documents belonging to a candidate (resume, Aadhaar, PAN etc.)';

-- ────────────────────────────────────────────────────────────
-- TABLE: bmi_candidate_portal_session
-- OTP-based login sessions for candidate self-service portal
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `bmi_candidate_portal_session` (
  `id`                  CHAR(36)      NOT NULL DEFAULT (UUID()),
  `candidate_id`        CHAR(36)      NOT NULL,
  `tenant_id`           CHAR(36)      NOT NULL,
  `otp_hash`            VARCHAR(255)  DEFAULT NULL,
  `otp_expires_at`      DATETIME      DEFAULT NULL,
  `session_token`       VARCHAR(255)  DEFAULT NULL,
  `session_expires_at`  DATETIME      DEFAULT NULL,
  `ip_address`          VARCHAR(45)   DEFAULT NULL,
  `created_at`          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_session_token` (`session_token`),
  INDEX `idx_candidate`     (`candidate_id`),
  CONSTRAINT `fk_portal_candidate` FOREIGN KEY (`candidate_id`) REFERENCES `bmi_candidate`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='OTP-based login sessions for the candidate self-service portal';

SELECT 'Tables bmi_candidate, bmi_candidate_document, bmi_candidate_portal_session created.' AS status;
------------------daca-----------------------

CREATE TABLE IF NOT EXISTS `bmi_application` (
  `id`                  CHAR(36)      NOT NULL DEFAULT (UUID()),
  `tenant_id`           CHAR(36)      NOT NULL,
  `job_id`              CHAR(36)      NOT NULL,
  `candidate_id`        CHAR(36)      NOT NULL,
  `current_stage_id`    CHAR(36)      DEFAULT NULL,
  `current_stage_name`  VARCHAR(100)  NOT NULL DEFAULT 'Applied',
  `status`              ENUM(
                          'active',
                          'selected',
                          'rejected',
                          'withdrawn',
                          'on_hold',
                          'offer_extended',
                          'offer_accepted',
                          'offer_declined',
                          'joined',
                          'no_show'
                        ) NOT NULL DEFAULT 'active',
  `ai_match_score`      DECIMAL(5,2)  DEFAULT NULL COMMENT 'AI score 0-100 for this job',
  `ai_match_reason`     TEXT          DEFAULT NULL COMMENT 'AI summary for this job match',
  `recruiter_id`        CHAR(36)      DEFAULT NULL,
  `applied_at`          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_action_at`      DATETIME      DEFAULT NULL,
  `next_action_at`      DATETIME      DEFAULT NULL COMMENT 'Scheduled next follow-up date',
  `rejection_reason`    VARCHAR(255)  DEFAULT NULL,
  `withdrawal_reason`   VARCHAR(255)  DEFAULT NULL,
  `notes`               TEXT          DEFAULT NULL,
  `created_at`          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_job_candidate` (`job_id`, `candidate_id`),
  INDEX `idx_tenant_status`   (`tenant_id`, `status`),
  INDEX `idx_recruiter`       (`recruiter_id`),
  INDEX `idx_job`             (`job_id`),
  INDEX `idx_candidate`       (`candidate_id`),
  INDEX `idx_current_stage`   (`current_stage_name`),
  INDEX `idx_applied_at`      (`applied_at`),
  CONSTRAINT `fk_app_tenant`    FOREIGN KEY (`tenant_id`)    REFERENCES `bmi_tenant`(`id`)    ON DELETE CASCADE,
  CONSTRAINT `fk_app_job`       FOREIGN KEY (`job_id`)       REFERENCES `bmi_job`(`id`)       ON DELETE CASCADE,
  CONSTRAINT `fk_app_candidate` FOREIGN KEY (`candidate_id`) REFERENCES `bmi_candidate`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='A candidate applying to a specific job — core hiring record';

-- ────────────────────────────────────────────────────────────
-- TABLE: bmi_application_stage_log
-- Immutable history of every stage transition for an application
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `bmi_application_stage_log` (
  `id`                  CHAR(36)      NOT NULL DEFAULT (UUID()),
  `tenant_id`           CHAR(36)      NOT NULL,
  `application_id`      CHAR(36)      NOT NULL,
  `from_stage`          VARCHAR(100)  DEFAULT NULL,
  `to_stage`            VARCHAR(100)  NOT NULL,
  `from_status`         VARCHAR(100)  DEFAULT NULL,
  `to_status`           VARCHAR(100)  NOT NULL,
  `moved_by`            CHAR(36)      DEFAULT NULL COMMENT 'user_id who moved the stage',
  `reason`              TEXT          DEFAULT NULL,
  `time_in_prev_stage_hours` INT      DEFAULT NULL COMMENT 'Hours spent in the previous stage',
  `created_at`          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_application`   (`application_id`),
  INDEX `idx_tenant_date`   (`tenant_id`, `created_at`),
  CONSTRAINT `fk_stagelog_tenant` FOREIGN KEY (`tenant_id`)      REFERENCES `bmi_tenant`(`id`)      ON DELETE CASCADE,
  CONSTRAINT `fk_stagelog_app`    FOREIGN KEY (`application_id`) REFERENCES `bmi_application`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Immutable log of every stage/status transition per application';

SELECT 'Tables bmi_application, bmi_application_stage_log created.' AS status;



-------------dqdqs
CREATE TABLE IF NOT EXISTS `bmi_interview` (
  `id`              CHAR(36)      NOT NULL DEFAULT (UUID()),
  `tenant_id`       CHAR(36)      NOT NULL,
  `application_id`  CHAR(36)      NOT NULL,
  `interview_type`  ENUM(
                      'phone',
                      'video',
                      'in_person',
                      'panel',
                      'technical',
                      'hr',
                      'client',
                      'final',
                      'ai_screening'
                    ) NOT NULL,
  `round_number`    INT           NOT NULL DEFAULT 1,
  `scheduled_at`    DATETIME      NOT NULL,
  `duration_mins`   INT           NOT NULL DEFAULT 60,
  `location`        VARCHAR(255)  DEFAULT NULL COMMENT 'Physical location or room name',
  `meeting_link`    VARCHAR(500)  DEFAULT NULL COMMENT 'Zoom / Teams / Google Meet link',
  `status`          ENUM(
                      'scheduled',
                      'confirmed',
                      'in_progress',
                      'completed',
                      'cancelled',
                      'rescheduled',
                      'no_show'
                    ) NOT NULL DEFAULT 'scheduled',
  `interview_notes` TEXT          DEFAULT NULL,
  `ai_questions`    JSON          DEFAULT NULL COMMENT 'AI-generated questions for this round',
  `created_by`      CHAR(36)      NOT NULL,
  `created_at`      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_application`   (`application_id`),
  INDEX `idx_scheduled`     (`tenant_id`, `scheduled_at`),
  INDEX `idx_status`        (`status`),
  CONSTRAINT `fk_interview_tenant` FOREIGN KEY (`tenant_id`)      REFERENCES `bmi_tenant`(`id`)      ON DELETE CASCADE,
  CONSTRAINT `fk_interview_app`    FOREIGN KEY (`application_id`) REFERENCES `bmi_application`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Scheduled interview sessions per application';

-- ────────────────────────────────────────────────────────────
-- TABLE: bmi_interview_panelist
-- Interviewers assigned to a specific interview
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `bmi_interview_panelist` (
  `id`           CHAR(36)    NOT NULL DEFAULT (UUID()),
  `interview_id` CHAR(36)    NOT NULL,
  `user_id`      CHAR(36)    NOT NULL,
  `role`         ENUM('interviewer','co_interviewer','observer') NOT NULL DEFAULT 'interviewer',
  `confirmed`    TINYINT(1)  NOT NULL DEFAULT 0,
  `created_at`   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_interview_user` (`interview_id`, `user_id`),
  CONSTRAINT `fk_panelist_interview` FOREIGN KEY (`interview_id`) REFERENCES `bmi_interview`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Panelists / interviewers assigned to an interview session';

-- ────────────────────────────────────────────────────────────
-- TABLE: bmi_interview_feedback
-- Structured feedback submitted by each panelist
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `bmi_interview_feedback` (
  `id`             CHAR(36)    NOT NULL DEFAULT (UUID()),
  `tenant_id`      CHAR(36)    NOT NULL,
  `interview_id`   CHAR(36)    NOT NULL,
  `interviewer_id` CHAR(36)    NOT NULL,
  `overall_rating` TINYINT     NOT NULL COMMENT '1 = Poor, 5 = Excellent',
  `recommendation` ENUM(
                     'strong_yes',
                     'yes',
                     'maybe',
                     'no',
                     'strong_no'
                   ) NOT NULL,
  `skills_scores`  JSON        DEFAULT NULL COMMENT '{"communication": 4, "technical": 3, "attitude": 5}',
  `strengths`      TEXT        DEFAULT NULL,
  `concerns`       TEXT        DEFAULT NULL,
  `notes`          TEXT        DEFAULT NULL,
  `ai_analysis`    TEXT        DEFAULT NULL COMMENT 'AI analysis summary of this feedback',
  `submitted_at`   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_interview_interviewer` (`interview_id`, `interviewer_id`),
  INDEX `idx_tenant`      (`tenant_id`),
  INDEX `idx_interview`   (`interview_id`),
  CONSTRAINT `fk_feedback_tenant`      FOREIGN KEY (`tenant_id`)      REFERENCES `bmi_tenant`(`id`)    ON DELETE CASCADE,
  CONSTRAINT `fk_feedback_interview`   FOREIGN KEY (`interview_id`)   REFERENCES `bmi_interview`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Structured interview feedback submitted by each panelist';

SELECT 'Tables bmi_interview, bmi_interview_panelist, bmi_interview_feedback created.' AS status;

---------Da---------------
CREATE TABLE IF NOT EXISTS `bmi_offer` (
  `id`                     CHAR(36)       NOT NULL DEFAULT (UUID()),
  `tenant_id`              CHAR(36)       NOT NULL,
  `application_id`         CHAR(36)       NOT NULL,
  `offer_number`           VARCHAR(50)    NOT NULL,
  `designation`            VARCHAR(255)   NOT NULL,
  `department_id`          CHAR(36)       DEFAULT NULL,
  `location_id`            CHAR(36)       DEFAULT NULL,
  `joining_date`           DATE           DEFAULT NULL,
  `offer_expiry_date`      DATE           DEFAULT NULL,
  `ctc_annual`             DECIMAL(12,2)  NOT NULL COMMENT 'Total CTC per year in INR',
  `salary_components`      JSON           DEFAULT NULL COMMENT '{"basic":120000,"hra":60000,"special":60000,"pf":17280}',
  `offer_letter_url`       VARCHAR(500)   DEFAULT NULL COMMENT 'URL of generated offer letter PDF',
  `status`                 ENUM(
                             'draft',
                             'pending_approval',
                             'approved',
                             'sent',
                             'accepted',
                             'declined',
                             'revoked',
                             'expired'
                           ) NOT NULL DEFAULT 'draft',
  `approved_by`            CHAR(36)       DEFAULT NULL,
  `approved_at`            DATETIME       DEFAULT NULL,
  `sent_at`                DATETIME       DEFAULT NULL,
  `candidate_response_at`  DATETIME       DEFAULT NULL,
  `decline_reason`         TEXT           DEFAULT NULL,
  `revoke_reason`          TEXT           DEFAULT NULL,
  `created_by`             CHAR(36)       NOT NULL,
  `created_at`             DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`             DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tenant_offer_number` (`tenant_id`, `offer_number`),
  INDEX `idx_application` (`application_id`),
  INDEX `idx_status`      (`status`),
  INDEX `idx_tenant`      (`tenant_id`),
  CONSTRAINT `fk_offer_tenant` FOREIGN KEY (`tenant_id`)      REFERENCES `bmi_tenant`(`id`)      ON DELETE CASCADE,
  CONSTRAINT `fk_offer_app`    FOREIGN KEY (`application_id`) REFERENCES `bmi_application`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_offer_dept`   FOREIGN KEY (`department_id`)  REFERENCES `bmi_department`(`id`)  ON DELETE SET NULL,
  CONSTRAINT `fk_offer_loc`    FOREIGN KEY (`location_id`)    REFERENCES `bmi_location`(`id`)    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Offer letters issued to selected candidates';

-- ────────────────────────────────────────────────────────────
-- TABLE: bmi_offer_approval_log
-- Audit trail of all approval actions on an offer
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `bmi_offer_approval_log` (
  `id`          CHAR(36)      NOT NULL DEFAULT (UUID()),
  `offer_id`    CHAR(36)      NOT NULL,
  `tenant_id`   CHAR(36)      NOT NULL,
  `action`      ENUM('submitted','approved','rejected','revoked','sent','accepted','declined') NOT NULL,
  `action_by`   CHAR(36)      NOT NULL,
  `remarks`     TEXT          DEFAULT NULL,
  `created_at`  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_offer`  (`offer_id`),
  CONSTRAINT `fk_offerlog_offer`  FOREIGN KEY (`offer_id`)  REFERENCES `bmi_offer`(`id`)    ON DELETE CASCADE,
  CONSTRAINT `fk_offerlog_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `bmi_tenant`(`id`)   ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Audit trail of all approval actions on an offer letter';

SELECT 'Tables bmi_offer, bmi_offer_approval_log created.' AS status;

---------------------qsda---------------------------
CREATE TABLE IF NOT EXISTS `bmi_assessment` (
  `id`              CHAR(36)      NOT NULL DEFAULT (UUID()),
  `tenant_id`       CHAR(36)      NOT NULL,
  `title`           VARCHAR(255)  NOT NULL,
  `description`     TEXT          DEFAULT NULL,
  `type`            ENUM(
                      'mcq',
                      'coding',
                      'psychometric',
                      'video',
                      'case_study',
                      'assignment'
                    ) NOT NULL,
  `duration_mins`   INT           NOT NULL DEFAULT 30,
  `total_marks`     INT           NOT NULL DEFAULT 100,
  `passing_marks`   INT           NOT NULL DEFAULT 40,
  `questions`       JSON          DEFAULT NULL COMMENT 'Array of question objects with options and correct answers',
  `instructions`    TEXT          DEFAULT NULL,
  `is_ai_generated` TINYINT(1)    NOT NULL DEFAULT 0,
  `is_active`       TINYINT(1)    NOT NULL DEFAULT 1,
  `created_by`      CHAR(36)      NOT NULL,
  `created_at`      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_tenant_type` (`tenant_id`, `type`),
  INDEX `idx_is_active`   (`is_active`),
  CONSTRAINT `fk_assessment_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `bmi_tenant`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Assessment/test templates per tenant';

-- ────────────────────────────────────────────────────────────
-- TABLE: bmi_assessment_attempt
-- A candidate's attempt at an assessment for a specific application
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `bmi_assessment_attempt` (
  `id`              CHAR(36)      NOT NULL DEFAULT (UUID()),
  `tenant_id`       CHAR(36)      NOT NULL,
  `application_id`  CHAR(36)      NOT NULL,
  `assessment_id`   CHAR(36)      NOT NULL,
  `candidate_token` VARCHAR(255)  NOT NULL COMMENT 'Secure unique token sent to candidate to start test',
  `status`          ENUM(
                      'pending',
                      'in_progress',
                      'completed',
                      'expired',
                      'cancelled'
                    ) NOT NULL DEFAULT 'pending',
  `score`           DECIMAL(6,2)  DEFAULT NULL,
  `percentage`      DECIMAL(5,2)  DEFAULT NULL,
  `passed`          TINYINT(1)    DEFAULT NULL,
  `answers`         JSON          DEFAULT NULL COMMENT 'Candidate submitted answers',
  `ai_scoring`      JSON          DEFAULT NULL COMMENT 'AI scoring breakdown per question',
  `started_at`      DATETIME      DEFAULT NULL,
  `completed_at`    DATETIME      DEFAULT NULL,
  `expires_at`      DATETIME      NOT NULL,
  `ip_address`      VARCHAR(45)   DEFAULT NULL,
  `user_agent`      TEXT          DEFAULT NULL,
  `created_at`      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_candidate_token`       (`candidate_token`),
  INDEX `idx_application`               (`application_id`),
  INDEX `idx_assessment`                (`assessment_id`),
  INDEX `idx_status`                    (`status`),
  CONSTRAINT `fk_attempt_tenant`     FOREIGN KEY (`tenant_id`)      REFERENCES `bmi_tenant`(`id`)      ON DELETE CASCADE,
  CONSTRAINT `fk_attempt_app`        FOREIGN KEY (`application_id`) REFERENCES `bmi_application`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_attempt_assessment` FOREIGN KEY (`assessment_id`)  REFERENCES `bmi_assessment`(`id`)  ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='A candidate attempt at an assessment — one per application per assessment';

SELECT 'Tables bmi_assessment, bmi_assessment_attempt created.' AS status;


----------------DQS----------------
CREATE TABLE IF NOT EXISTS `bmi_bgv_request` (
  `id`               CHAR(36)      NOT NULL DEFAULT (UUID()),
  `tenant_id`        CHAR(36)      NOT NULL,
  `application_id`   CHAR(36)      NOT NULL,
  `provider`         ENUM(
                       'digio',
                       'infinity_ai',
                       'authbridge',
                       'hiregenie',
                       'springverify',
                       'manual'
                     ) NOT NULL,
  `provider_ref_id`  VARCHAR(255)  DEFAULT NULL COMMENT 'Reference ID returned by BGV provider API',
  `checks_requested` JSON          DEFAULT NULL COMMENT '["identity","address","employment","education","criminal","court"]',
  `status`           ENUM(
                       'initiated',
                       'in_progress',
                       'completed',
                       'failed',
                       'cancelled'
                     ) NOT NULL DEFAULT 'initiated',
  `result`           ENUM(
                       'clear',
                       'adverse',
                       'pending',
                       'inconclusive'
                     ) DEFAULT 'pending',
  `check_results`    JSON          DEFAULT NULL COMMENT 'Detailed per-check results from provider',
  `report_url`       VARCHAR(500)  DEFAULT NULL,
  `completed_at`     DATETIME      DEFAULT NULL,
  `notes`            TEXT          DEFAULT NULL,
  `initiated_by`     CHAR(36)      NOT NULL,
  `created_at`       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_application` (`application_id`),
  INDEX `idx_status`      (`status`),
  INDEX `idx_result`      (`result`),
  CONSTRAINT `fk_bgv_tenant` FOREIGN KEY (`tenant_id`)      REFERENCES `bmi_tenant`(`id`)      ON DELETE CASCADE,
  CONSTRAINT `fk_bgv_app`    FOREIGN KEY (`application_id`) REFERENCES `bmi_application`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Background verification requests for selected candidates';

-- ────────────────────────────────────────────────────────────
-- TABLE: bmi_bgv_webhook_log
-- Raw webhook events received from BGV providers
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `bmi_bgv_webhook_log` (
  `id`             CHAR(36)      NOT NULL DEFAULT (UUID()),
  `bgv_request_id` CHAR(36)      DEFAULT NULL,
  `provider`       VARCHAR(50)   NOT NULL,
  `event_type`     VARCHAR(100)  NOT NULL,
  `payload`        JSON          DEFAULT NULL,
  `signature_valid` TINYINT(1)   NOT NULL DEFAULT 0,
  `processed`      TINYINT(1)    NOT NULL DEFAULT 0,
  `error_message`  TEXT          DEFAULT NULL,
  `received_at`    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_bgv_request` (`bgv_request_id`),
  INDEX `idx_processed`   (`processed`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Raw webhook events received from BGV providers for audit';

SELECT 'Tables bmi_bgv_request, bmi_bgv_webhook_log created.' AS status;


-------------DASDX--------------------------
CREATE TABLE IF NOT EXISTS `bmi_ai_screening_result` (
  `id`               CHAR(36)      NOT NULL DEFAULT (UUID()),
  `tenant_id`        CHAR(36)      NOT NULL,
  `application_id`   CHAR(36)      NOT NULL,
  `job_id`           CHAR(36)      NOT NULL,
  `model_used`       VARCHAR(100)  NOT NULL DEFAULT 'claude-sonnet-4-6',
  `match_score`      DECIMAL(5,2)  NOT NULL COMMENT 'Overall match score 0-100',
  `skill_match`      JSON          DEFAULT NULL COMMENT '{"matched": ["Python","SQL"], "missing": ["React"]}',
  `experience_match` TINYINT(1)    NOT NULL DEFAULT 0,
  `salary_match`     TINYINT(1)    NOT NULL DEFAULT 0,
  `location_match`   TINYINT(1)    NOT NULL DEFAULT 0,
  `education_match`  TINYINT(1)    NOT NULL DEFAULT 0,
  `red_flags`        JSON          DEFAULT NULL COMMENT 'Array of red flag strings detected',
  `strengths`        JSON          DEFAULT NULL COMMENT 'Array of strength strings',
  `recommendation`   ENUM('shortlist','maybe','reject') NOT NULL,
  `summary`          TEXT          NOT NULL COMMENT 'AI-generated 2-3 sentence summary',
  `raw_response`     TEXT          DEFAULT NULL COMMENT 'Full raw AI response for debugging',
  `tokens_used`      INT           NOT NULL DEFAULT 0,
  `processing_ms`    INT           DEFAULT NULL,
  `created_at`       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_application` (`application_id`),
  INDEX `idx_score`        (`match_score`),
  INDEX `idx_recommendation` (`recommendation`),
  INDEX `idx_tenant`       (`tenant_id`),
  CONSTRAINT `fk_airesult_tenant` FOREIGN KEY (`tenant_id`)      REFERENCES `bmi_tenant`(`id`)      ON DELETE CASCADE,
  CONSTRAINT `fk_airesult_app`    FOREIGN KEY (`application_id`) REFERENCES `bmi_application`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_airesult_job`    FOREIGN KEY (`job_id`)         REFERENCES `bmi_job`(`id`)         ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='AI resume screening result per application (1 active result per application)';

-- ────────────────────────────────────────────────────────────
-- TABLE: bmi_ai_jd_history
-- AI-generated JD versions per job
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `bmi_ai_jd_history` (
  `id`           CHAR(36)      NOT NULL DEFAULT (UUID()),
  `tenant_id`    CHAR(36)      NOT NULL,
  `job_id`       CHAR(36)      NOT NULL,
  `model_used`   VARCHAR(100)  NOT NULL DEFAULT 'claude-sonnet-4-6',
  `prompt_used`  TEXT          DEFAULT NULL,
  `jd_text`      TEXT          NOT NULL,
  `tokens_used`  INT           NOT NULL DEFAULT 0,
  `created_by`   CHAR(36)      NOT NULL,
  `created_at`   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_job` (`job_id`),
  CONSTRAINT `fk_jdhistory_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `bmi_tenant`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_jdhistory_job`    FOREIGN KEY (`job_id`)    REFERENCES `bmi_job`(`id`)    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='History of AI-generated job descriptions per job';

-- ────────────────────────────────────────────────────────────
-- TABLE: bmi_ai_credit_ledger
-- All AI credit additions and deductions per tenant
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `bmi_ai_credit_ledger` (
  `id`            CHAR(36)      NOT NULL DEFAULT (UUID()),
  `tenant_id`     CHAR(36)      NOT NULL,
  `action`        ENUM(
                    'topup',
                    'plan_credit',
                    'resume_screen',
                    'jd_generate',
                    'interview_questions',
                    'assessment_generate',
                    'report_generate',
                    'refund'
                  ) NOT NULL,
  `credits_delta` INT           NOT NULL COMMENT 'Positive = added, Negative = consumed',
  `balance_after` INT           NOT NULL COMMENT 'Credit balance after this transaction',
  `reference_id`  CHAR(36)      DEFAULT NULL COMMENT 'ID of the object that triggered consumption',
  `reference_type` VARCHAR(50)  DEFAULT NULL COMMENT 'e.g. application, job, report',
  `notes`         VARCHAR(255)  DEFAULT NULL,
  `created_by`    CHAR(36)      DEFAULT NULL,
  `created_at`    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_tenant_date`   (`tenant_id`, `created_at`),
  INDEX `idx_action`        (`action`),
  CONSTRAINT `fk_credits_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `bmi_tenant`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='AI credit consumption and topup ledger per tenant';

SELECT 'Tables bmi_ai_screening_result, bmi_ai_jd_history, bmi_ai_credit_ledger created.' AS status;


------------------FHG





CREATE TABLE IF NOT EXISTS `bmi_email_template` (
  `id`           CHAR(36)      NOT NULL DEFAULT (UUID()),
  `tenant_id`    CHAR(36)      NOT NULL,
  `event_key`    VARCHAR(100)  NOT NULL COMMENT 'e.g. application_received, interview_invite, offer_sent',
  `name`         VARCHAR(255)  NOT NULL,
  `subject`      VARCHAR(500)  NOT NULL,
  `body_html`    TEXT          NOT NULL COMMENT 'HTML email body with {{variables}}',
  `body_text`    TEXT          DEFAULT NULL COMMENT 'Plain text fallback',
  `variables`    JSON          DEFAULT NULL COMMENT 'List of allowed variable names',
  `is_active`    TINYINT(1)    NOT NULL DEFAULT 1,
  `created_by`   CHAR(36)      DEFAULT NULL,
  `created_at`   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tenant_event` (`tenant_id`, `event_key`),
  INDEX `idx_is_active` (`is_active`),
  CONSTRAINT `fk_emailtpl_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `bmi_tenant`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Customisable email templates per tenant per event type';

-- ────────────────────────────────────────────────────────────
-- TABLE: bmi_notification_log
-- Record of every notification sent (email / SMS / in-app)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `bmi_notification_log` (
  `id`             CHAR(36)      NOT NULL DEFAULT (UUID()),
  `tenant_id`      CHAR(36)      NOT NULL,
  `channel`        ENUM('email','sms','whatsapp','in_app','push') NOT NULL,
  `recipient_type` ENUM('user','candidate') NOT NULL,
  `recipient_id`   CHAR(36)      DEFAULT NULL,
  `recipient_email` VARCHAR(320) DEFAULT NULL,
  `recipient_phone` VARCHAR(20)  DEFAULT NULL,
  `event_key`      VARCHAR(100)  DEFAULT NULL,
  `subject`        VARCHAR(500)  DEFAULT NULL,
  `body`           TEXT          DEFAULT NULL,
  `status`         ENUM('queued','sent','delivered','failed','bounced') NOT NULL DEFAULT 'queued',
  `provider_ref`   VARCHAR(255)  DEFAULT NULL COMMENT 'Message ID from email/SMS provider',
  `error_message`  TEXT          DEFAULT NULL,
  `reference_id`   CHAR(36)      DEFAULT NULL COMMENT 'ID of triggering object (application, interview, etc)',
  `reference_type` VARCHAR(50)   DEFAULT NULL,
  `sent_at`        DATETIME      DEFAULT NULL,
  `created_at`     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_tenant_channel`   (`tenant_id`, `channel`),
  INDEX `idx_status`           (`status`),
  INDEX `idx_recipient`        (`recipient_type`, `recipient_id`),
  INDEX `idx_reference`        (`reference_id`),
  CONSTRAINT `fk_notif_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `bmi_tenant`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Full log of every notification dispatched across all channels';

-- ────────────────────────────────────────────────────────────
-- TABLE: bmi_in_app_notification
-- In-app notifications shown in the UI bell icon
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `bmi_in_app_notification` (
  `id`             CHAR(36)      NOT NULL DEFAULT (UUID()),
  `tenant_id`      CHAR(36)      NOT NULL,
  `user_id`        CHAR(36)      NOT NULL,
  `type`           VARCHAR(50)   NOT NULL COMMENT 'e.g. new_application, interview_reminder, offer_approved',
  `title`          VARCHAR(255)  NOT NULL,
  `message`        TEXT          NOT NULL,
  `action_url`     VARCHAR(500)  DEFAULT NULL,
  `is_read`        TINYINT(1)    NOT NULL DEFAULT 0,
  `read_at`        DATETIME      DEFAULT NULL,
  `reference_id`   CHAR(36)      DEFAULT NULL,
  `reference_type` VARCHAR(50)   DEFAULT NULL,
  `created_at`     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_user_unread` (`user_id`, `is_read`),
  INDEX `idx_tenant`      (`tenant_id`),
  CONSTRAINT `fk_inapp_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `bmi_tenant`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='In-app bell-icon notifications for logged-in users';

SELECT 'Tables bmi_email_template, bmi_notification_log, bmi_in_app_notification created.' AS status;


-------ASD-------------------

CREATE TABLE IF NOT EXISTS `bmi_subscription` (
  `id`                 CHAR(36)       NOT NULL DEFAULT (UUID()),
  `tenant_id`          CHAR(36)       NOT NULL,
  `plan`               ENUM('starter','growth','enterprise','white_label') NOT NULL,
  `billing_cycle`      ENUM('monthly','annual') NOT NULL DEFAULT 'monthly',
  `price_monthly`      DECIMAL(10,2)  NOT NULL DEFAULT 0.00 COMMENT 'Effective monthly price in INR',
  `max_users`          INT            NOT NULL DEFAULT 5,
  `max_jobs`           INT            NOT NULL DEFAULT 10,
  `ai_credits_monthly` INT            NOT NULL DEFAULT 100 COMMENT 'Credits added on each billing cycle',
  `custom_domain`      TINYINT(1)     NOT NULL DEFAULT 0,
  `white_label`        TINYINT(1)     NOT NULL DEFAULT 0,
  `status`             ENUM('trial','active','suspended','cancelled','expired') NOT NULL DEFAULT 'trial',
  `trial_ends_at`      DATETIME       DEFAULT NULL,
  `current_period_start` DATETIME     DEFAULT NULL,
  `current_period_end`   DATETIME     DEFAULT NULL,
  `cancelled_at`       DATETIME       DEFAULT NULL,
  `cancel_reason`      TEXT           DEFAULT NULL,
  `payment_gateway`    VARCHAR(50)    DEFAULT NULL COMMENT 'razorpay / stripe / manual',
  `gateway_sub_id`     VARCHAR(255)   DEFAULT NULL COMMENT 'Subscription ID from payment gateway',
  `created_at`         DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`         DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_tenant`   (`tenant_id`),
  INDEX `idx_status`   (`status`),
  CONSTRAINT `fk_sub_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `bmi_tenant`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Subscription plan details per tenant';

-- ────────────────────────────────────────────────────────────
-- TABLE: bmi_invoice
-- Invoice record per billing period per tenant
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `bmi_invoice` (
  `id`              CHAR(36)       NOT NULL DEFAULT (UUID()),
  `tenant_id`       CHAR(36)       NOT NULL,
  `subscription_id` CHAR(36)       DEFAULT NULL,
  `invoice_number`  VARCHAR(50)    NOT NULL,
  `period_start`    DATE           NOT NULL,
  `period_end`      DATE           NOT NULL,
  `subtotal`        DECIMAL(12,2)  NOT NULL DEFAULT 0.00,
  `tax_amount`      DECIMAL(12,2)  NOT NULL DEFAULT 0.00 COMMENT '18% GST',
  `total_amount`    DECIMAL(12,2)  NOT NULL DEFAULT 0.00,
  `currency`        CHAR(3)        NOT NULL DEFAULT 'INR',
  `status`          ENUM('draft','issued','paid','void','overdue') NOT NULL DEFAULT 'draft',
  `paid_at`         DATETIME       DEFAULT NULL,
  `payment_method`  VARCHAR(50)    DEFAULT NULL,
  `gateway_txn_id`  VARCHAR(255)   DEFAULT NULL,
  `invoice_url`     VARCHAR(500)   DEFAULT NULL COMMENT 'URL of PDF invoice',
  `line_items`      JSON           DEFAULT NULL COMMENT '[{"description":"Growth Plan","qty":1,"amount":4999}]',
  `created_at`      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_invoice_number` (`invoice_number`),
  INDEX `idx_tenant`        (`tenant_id`),
  INDEX `idx_status`        (`status`),
  INDEX `idx_period`        (`period_start`, `period_end`),
  CONSTRAINT `fk_invoice_tenant` FOREIGN KEY (`tenant_id`)       REFERENCES `bmi_tenant`(`id`)       ON DELETE CASCADE,
  CONSTRAINT `fk_invoice_sub`    FOREIGN KEY (`subscription_id`) REFERENCES `bmi_subscription`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Monthly/annual invoices per tenant per billing period';

-- ────────────────────────────────────────────────────────────
-- TABLE: bmi_ai_credit_topup
-- AI credit top-up purchase records (ad-hoc, outside plan)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `bmi_ai_credit_topup` (
  `id`             CHAR(36)       NOT NULL DEFAULT (UUID()),
  `tenant_id`      CHAR(36)       NOT NULL,
  `credits_added`  INT            NOT NULL,
  `amount_paid`    DECIMAL(10,2)  NOT NULL,
  `gateway_txn_id` VARCHAR(255)   DEFAULT NULL,
  `status`         ENUM('pending','completed','failed','refunded') NOT NULL DEFAULT 'pending',
  `created_by`     CHAR(36)       DEFAULT NULL,
  `created_at`     DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_tenant` (`tenant_id`),
  CONSTRAINT `fk_topup_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `bmi_tenant`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Ad-hoc AI credit top-up purchases per tenant';

SELECT 'Tables bmi_subscription, bmi_invoice, bmi_ai_credit_topup created.' AS status;

--------------DA------------------

CREATE TABLE IF NOT EXISTS `bmi_audit_log` (
  `id`              CHAR(36)      NOT NULL DEFAULT (UUID()),
  `tenant_id`       CHAR(36)      NOT NULL,
  `actor_id`        CHAR(36)      DEFAULT NULL COMMENT 'NULL if system/cron action',
  `actor_email`     VARCHAR(320)  DEFAULT NULL COMMENT 'Snapshot at time of action',
  `actor_role`      VARCHAR(50)   DEFAULT NULL,
  `action`          VARCHAR(100)  NOT NULL COMMENT 'e.g. job.create, candidate.reject, offer.approve',
  `entity_type`     VARCHAR(50)   DEFAULT NULL COMMENT 'e.g. job, candidate, application, offer',
  `entity_id`       CHAR(36)      DEFAULT NULL,
  `old_value`       JSON          DEFAULT NULL COMMENT 'State before change (for updates/deletes)',
  `new_value`       JSON          DEFAULT NULL COMMENT 'State after change (for creates/updates)',
  `ip_address`      VARCHAR(45)   DEFAULT NULL,
  `user_agent`      VARCHAR(500)  DEFAULT NULL,
  `request_id`      VARCHAR(100)  DEFAULT NULL COMMENT 'Correlation ID from HTTP request',
  `created_at`      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_tenant_date`  (`tenant_id`, `created_at`),
  INDEX `idx_actor`        (`actor_id`),
  INDEX `idx_entity`       (`entity_type`, `entity_id`),
  INDEX `idx_action`       (`action`)
  -- No FK on tenant_id intentionally — audit log must persist even if tenant is soft-deleted
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Immutable audit trail of all user and system actions';

-- ────────────────────────────────────────────────────────────
-- TABLE: bmi_hiring_metric_daily
-- Pre-aggregated daily hiring funnel metrics per tenant
-- Used to power dashboards without hitting raw tables
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `bmi_hiring_metric_daily` (
  `id`                   CHAR(36)  NOT NULL DEFAULT (UUID()),
  `tenant_id`            CHAR(36)  NOT NULL,
  `metric_date`          DATE      NOT NULL,
  `total_open_jobs`      INT       NOT NULL DEFAULT 0,
  `new_applications`     INT       NOT NULL DEFAULT 0,
  `screened_by_ai`       INT       NOT NULL DEFAULT 0,
  `shortlisted`          INT       NOT NULL DEFAULT 0,
  `interviews_scheduled` INT       NOT NULL DEFAULT 0,
  `interviews_done`      INT       NOT NULL DEFAULT 0,
  `offers_issued`        INT       NOT NULL DEFAULT 0,
  `offers_accepted`      INT       NOT NULL DEFAULT 0,
  `offers_declined`      INT       NOT NULL DEFAULT 0,
  `hired`                INT       NOT NULL DEFAULT 0,
  `rejected`             INT       NOT NULL DEFAULT 0,
  `ai_credits_consumed`  INT       NOT NULL DEFAULT 0,
  `avg_ai_match_score`   DECIMAL(5,2) DEFAULT NULL,
  `avg_time_to_offer_days` DECIMAL(6,1) DEFAULT NULL,
  `created_at`           DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`           DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tenant_date` (`tenant_id`, `metric_date`),
  INDEX `idx_metric_date` (`metric_date`),
  CONSTRAINT `fk_metric_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `bmi_tenant`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Pre-aggregated daily hiring KPIs per tenant for dashboard performance';

-- ────────────────────────────────────────────────────────────
-- TABLE: bmi_source_metric_daily
-- Candidate source performance per day (for sourcing analytics)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `bmi_source_metric_daily` (
  `id`             CHAR(36)     NOT NULL DEFAULT (UUID()),
  `tenant_id`      CHAR(36)     NOT NULL,
  `metric_date`    DATE         NOT NULL,
  `source`         VARCHAR(50)  NOT NULL COMMENT 'naukri/linkedin/indeed/referral/walk_in etc.',
  `applications`   INT          NOT NULL DEFAULT 0,
  `shortlisted`    INT          NOT NULL DEFAULT 0,
  `hired`          INT          NOT NULL DEFAULT 0,
  `cost`           DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Ad spend for paid sources in INR',
  `created_at`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tenant_date_source` (`tenant_id`, `metric_date`, `source`),
  CONSTRAINT `fk_srcmetric_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `bmi_tenant`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Daily candidate source analytics for cost-per-hire and quality-of-hire reporting';

SELECT 'Tables bmi_audit_log, bmi_hiring_metric_daily, bmi_source_metric_daily created.' AS status;



---------DQSDA-------------


INSERT INTO `bmi_tenant` (
  `id`, `tenant_code`, `company_name`, `industry`, `company_size`,
  `country`, `timezone`, `plan`, `ai_credits`,
  `contact_email`, `contact_phone`, `website`, `is_active`
) VALUES (
  'bmi0-0000-0000-0000-000000000001',
  'DEMO',
  'Book My Interview Demo',
  'Technology',
  '51-200',
  'IN',
  'Asia/Kolkata',
  'enterprise',
  500,
  'admin@bookmyinterview.in',
  '+91-9000000000',
  'https://bookmyinterview.in',
  1
) ON DUPLICATE KEY UPDATE `company_name` = VALUES(`company_name`);

-- ────────────────────────────────────────────────────────────
-- 2. Super Admin User
-- Password: Admin@123
-- Hash generated with bcrypt saltRounds=12
-- ────────────────────────────────────────────────────────────
INSERT INTO `bmi_user` (
  `id`, `tenant_id`, `email`, `password_hash`, `full_name`,
  `role`, `is_active`, `is_blocked`, `must_change_password`
) VALUES (
  'bmi0-0000-0000-0000-000000000002',
  'bmi0-0000-0000-0000-000000000001',
  'admin@bookmyinterview.in',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCO4nFmVGFhGiqyMrO8m9tWGWCvH6qCmqy',
  'Super Admin',
  'super_admin',
  1,
  0,
  0
) ON DUPLICATE KEY UPDATE `full_name` = VALUES(`full_name`);

-- ────────────────────────────────────────────────────────────
-- 3. HR Manager user
-- Password: HrUser@123
-- ────────────────────────────────────────────────────────────
INSERT INTO `bmi_user` (
  `id`, `tenant_id`, `email`, `password_hash`, `full_name`,
  `role`, `is_active`, `is_blocked`, `must_change_password`
) VALUES (
  'bmi0-0000-0000-0000-000000000003',
  'bmi0-0000-0000-0000-000000000001',
  'hr@bookmyinterview.in',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCO4nFmVGFhGiqyMrO8m9tWGWCvH6qCmqy',
  'Priya Sharma',
  'hr_manager',
  1,
  0,
  1
) ON DUPLICATE KEY UPDATE `full_name` = VALUES(`full_name`);

-- Recruiter user
INSERT INTO `bmi_user` (
  `id`, `tenant_id`, `email`, `password_hash`, `full_name`,
  `role`, `is_active`, `is_blocked`, `must_change_password`
) VALUES (
  'bmi0-0000-0000-0000-000000000004',
  'bmi0-0000-0000-0000-000000000001',
  'recruiter@bookmyinterview.in',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCO4nFmVGFhGiqyMrO8m9tWGWCvH6qCmqy',
  'Rahul Mehta',
  'recruiter',
  1,
  0,
  1
) ON DUPLICATE KEY UPDATE `full_name` = VALUES(`full_name`);

-- ────────────────────────────────────────────────────────────
-- 4. Departments
-- ────────────────────────────────────────────────────────────
INSERT INTO `bmi_department` (`id`, `tenant_id`, `name`, `code`, `is_active`) VALUES
  ('bmi0-0000-0000-0001-000000000001', 'bmi0-0000-0000-0000-000000000001', 'Engineering',          'ENG',  1),
  ('bmi0-0000-0000-0001-000000000002', 'bmi0-0000-0000-0000-000000000001', 'Product Management',   'PM',   1),
  ('bmi0-0000-0000-0001-000000000003', 'bmi0-0000-0000-0000-000000000001', 'Sales',                'SALE', 1),
  ('bmi0-0000-0000-0001-000000000004', 'bmi0-0000-0000-0000-000000000001', 'Marketing',            'MKT',  1),
  ('bmi0-0000-0000-0001-000000000005', 'bmi0-0000-0000-0000-000000000001', 'Human Resources',      'HR',   1),
  ('bmi0-0000-0000-0001-000000000006', 'bmi0-0000-0000-0000-000000000001', 'Finance & Accounts',   'FIN',  1),
  ('bmi0-0000-0000-0001-000000000007', 'bmi0-0000-0000-0000-000000000001', 'Operations',           'OPS',  1),
  ('bmi0-0000-0000-0001-000000000008', 'bmi0-0000-0000-0000-000000000001', 'Customer Success',     'CS',   1)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- ────────────────────────────────────────────────────────────
-- 5. Locations
-- ────────────────────────────────────────────────────────────
INSERT INTO `bmi_location` (`id`, `tenant_id`, `name`, `city`, `state`, `country`, `is_active`) VALUES
  ('bmi0-0000-0000-0002-000000000001', 'bmi0-0000-0000-0000-000000000001', 'Pune HQ',      'Pune',     'Maharashtra', 'IN', 1),
  ('bmi0-0000-0000-0002-000000000002', 'bmi0-0000-0000-0000-000000000001', 'Mumbai Office','Mumbai',   'Maharashtra', 'IN', 1),
  ('bmi0-0000-0000-0002-000000000003', 'bmi0-0000-0000-0000-000000000001', 'Bangalore',    'Bangalore','Karnataka',   'IN', 1),
  ('bmi0-0000-0000-0002-000000000004', 'bmi0-0000-0000-0000-000000000001', 'Delhi NCR',    'Gurugram', 'Haryana',     'IN', 1),
  ('bmi0-0000-0000-0002-000000000005', 'bmi0-0000-0000-0000-000000000001', 'Remote India', 'Remote',   NULL,          'IN', 1)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- ────────────────────────────────────────────────────────────
-- 6. Default Pipeline Template + Stages
-- ────────────────────────────────────────────────────────────
INSERT INTO `bmi_pipeline_template` (`id`, `tenant_id`, `name`, `description`, `is_default`, `is_active`) VALUES (
  'bmi0-0000-0000-0003-000000000001',
  'bmi0-0000-0000-0000-000000000001',
  'Standard Tech Hiring',
  'Default 6-stage pipeline for technology roles',
  1,
  1
) ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `bmi_pipeline_stage` (`id`, `template_id`, `stage_name`, `stage_order`, `stage_type`, `sla_hours`, `is_active`) VALUES
  ('bmi0-0000-0000-0004-000000000001', 'bmi0-0000-0000-0003-000000000001', 'Application Received', 1, 'screening',    24,  1),
  ('bmi0-0000-0000-0004-000000000002', 'bmi0-0000-0000-0003-000000000001', 'AI Shortlisting',      2, 'screening',    12,  1),
  ('bmi0-0000-0000-0004-000000000003', 'bmi0-0000-0000-0003-000000000001', 'Technical Assessment', 3, 'assessment',   72,  1),
  ('bmi0-0000-0000-0004-000000000004', 'bmi0-0000-0000-0003-000000000001', 'Technical Interview',  4, 'interview',    72,  1),
  ('bmi0-0000-0000-0004-000000000005', 'bmi0-0000-0000-0003-000000000001', 'HR Interview',         5, 'interview',    48,  1),
  ('bmi0-0000-0000-0004-000000000006', 'bmi0-0000-0000-0003-000000000001', 'Offer & BGV',          6, 'offer',        96,  1)
ON DUPLICATE KEY UPDATE `stage_name` = VALUES(`stage_name`);

-- ────────────────────────────────────────────────────────────
-- 7. Sample Open Job
-- ────────────────────────────────────────────────────────────
INSERT INTO `bmi_job` (
  `id`, `tenant_id`, `title`, `department_id`, `location_id`,
  `job_type`, `work_mode`, `experience_min`, `experience_max`,
  `salary_min`, `salary_max`, `headcount`, `filled_count`,
  `skills_required`, `pipeline_id`, `status`, `priority`,
  `posted_by`, `created_by`
) VALUES (
  'bmi0-0000-0000-0005-000000000001',
  'bmi0-0000-0000-0000-000000000001',
  'Senior Full Stack Developer',
  'bmi0-0000-0000-0001-000000000001',
  'bmi0-0000-0000-0002-000000000003',
  'full_time',
  'hybrid',
  4, 8,
  1200000, 2000000,
  3, 0,
  '["React","Node.js","TypeScript","MySQL","Docker"]',
  'bmi0-0000-0000-0003-000000000001',
  'open',
  'high',
  'bmi0-0000-0000-0000-000000000002',
  'bmi0-0000-0000-0000-000000000002'
) ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);

-- ────────────────────────────────────────────────────────────
-- 8. AI Credits — initial plan credit entry for demo tenant
-- ────────────────────────────────────────────────────────────
INSERT INTO `bmi_ai_credit_ledger` (
  `id`, `tenant_id`, `action`, `credits_delta`, `balance_after`, `notes`
) VALUES (
  'bmi0-0000-0000-0006-000000000001',
  'bmi0-0000-0000-0000-000000000001',
  'plan_credit',
  500,
  500,
  'Enterprise plan — initial credits on sign-up'
) ON DUPLICATE KEY UPDATE `notes` = VALUES(`notes`);

-- ────────────────────────────────────────────────────────────
-- Done
-- ────────────────────────────────────────────────────────────
SELECT
  (SELECT COUNT(*) FROM bmi_tenant)            AS tenants,
  (SELECT COUNT(*) FROM bmi_user)              AS users,
  (SELECT COUNT(*) FROM bmi_department)        AS departments,
  (SELECT COUNT(*) FROM bmi_location)          AS locations,
  (SELECT COUNT(*) FROM bmi_pipeline_template) AS pipelines,
  (SELECT COUNT(*) FROM bmi_pipeline_stage)    AS stages,
  (SELECT COUNT(*) FROM bmi_job)               AS jobs;


