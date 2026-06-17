-- ============================================================
-- BOOK MY INTERVIEW
-- FILE 05: Candidates (Master Talent Pool)
-- ============================================================

USE `suggest`;

-- ────────────────────────────────────────────────────────────
-- TABLE: bmi_candidate
-- Master candidate record — not tied to a specific job.
-- One candidate can apply to multiple jobs (via bmi_application).
-- ────────────────────────────────────────────────────────────
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
