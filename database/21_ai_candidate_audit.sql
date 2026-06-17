-- ============================================================
-- BOOK MY INTERVIEW
-- FILE 21: AI Candidate Audit & Enhanced Assessment
-- ============================================================

USE `getjob`;

-- ────────────────────────────────────────────────────────────
-- TABLE: bmi_ai_candidate_audit
-- Full AI audit report per application
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `bmi_ai_candidate_audit` (
  `id`                      CHAR(36)      NOT NULL DEFAULT (UUID()),
  `tenant_id`               CHAR(36)      NOT NULL,
  `application_id`          CHAR(36)      NOT NULL,
  `candidate_id`            CHAR(36)      NOT NULL,
  `job_id`                  CHAR(36)      NOT NULL,

  -- Scores (0-100)
  `overall_match_score`     DECIMAL(5,2)  DEFAULT NULL,
  `skills_match_pct`        DECIMAL(5,2)  DEFAULT NULL,
  `experience_match_pct`    DECIMAL(5,2)  DEFAULT NULL,
  `communication_score`     DECIMAL(5,2)  DEFAULT NULL,
  `resume_quality_score`    DECIMAL(5,2)  DEFAULT NULL,
  `job_fit_score`           DECIMAL(5,2)  DEFAULT NULL,
  `education_match_pct`     DECIMAL(5,2)  DEFAULT NULL,

  -- AI Recommendation
  `ai_recommendation`       ENUM(
                              'highly_recommended',
                              'recommended',
                              'average',
                              'not_recommended'
                            ) DEFAULT NULL,
  `recommendation_reason`   TEXT          DEFAULT NULL,

  -- Detailed analysis
  `strengths`               JSON          DEFAULT NULL COMMENT 'Array of strength strings',
  `concerns`                JSON          DEFAULT NULL COMMENT 'Array of concern strings',
  `skill_gaps`              JSON          DEFAULT NULL COMMENT 'Missing skills array',
  `key_highlights`          JSON          DEFAULT NULL COMMENT 'Top highlights for recruiter',
  `screening_answers_score` DECIMAL(5,2)  DEFAULT NULL COMMENT 'Score based on screening question answers',
  `voice_intro_score`       DECIMAL(5,2)  DEFAULT NULL COMMENT 'Communication from voice introduction',
  `full_report`             TEXT          DEFAULT NULL COMMENT 'Detailed recruiter report',
  `ai_model_used`           VARCHAR(100)  DEFAULT 'claude-sonnet-4-6',

  -- Meta
  `credits_consumed`        INT           NOT NULL DEFAULT 1,
  `screened_at`             DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at`              DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_application_audit` (`application_id`),
  INDEX `idx_tenant`        (`tenant_id`),
  INDEX `idx_candidate`     (`candidate_id`),
  INDEX `idx_job`           (`job_id`),
  INDEX `idx_recommendation` (`ai_recommendation`),
  CONSTRAINT `fk_audit_tenant`  FOREIGN KEY (`tenant_id`)      REFERENCES `bmi_tenant`(`id`)      ON DELETE CASCADE,
  CONSTRAINT `fk_audit_app`     FOREIGN KEY (`application_id`) REFERENCES `bmi_application`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_audit_cand`    FOREIGN KEY (`candidate_id`)   REFERENCES `bmi_candidate`(`id`)   ON DELETE CASCADE,
  CONSTRAINT `fk_audit_job`     FOREIGN KEY (`job_id`)         REFERENCES `bmi_job`(`id`)         ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Comprehensive AI audit report for each job application';

-- ────────────────────────────────────────────────────────────
-- Extend bmi_job with more fields for full job creation
-- ────────────────────────────────────────────────────────────
ALTER TABLE `bmi_job`
  ADD COLUMN IF NOT EXISTS `category`               VARCHAR(100) DEFAULT NULL AFTER `department_id`,
  ADD COLUMN IF NOT EXISTS `education_required`     VARCHAR(200) DEFAULT NULL COMMENT 'Minimum required qualification',
  ADD COLUMN IF NOT EXISTS `education_preferred`    VARCHAR(200) DEFAULT NULL COMMENT 'Preferred qualification',
  ADD COLUMN IF NOT EXISTS `skills_mandatory`       JSON         DEFAULT NULL COMMENT 'Mandatory skill strings array',
  ADD COLUMN IF NOT EXISTS `skills_preferred`       JSON         DEFAULT NULL COMMENT 'Preferred skill strings array',
  ADD COLUMN IF NOT EXISTS `about_job`              TEXT         DEFAULT NULL COMMENT 'About the job section',
  ADD COLUMN IF NOT EXISTS `roles`                  TEXT         DEFAULT NULL COMMENT 'Roles section',
  ADD COLUMN IF NOT EXISTS `responsibilities`       TEXT         DEFAULT NULL COMMENT 'Responsibilities section',
  ADD COLUMN IF NOT EXISTS `benefits`               TEXT         DEFAULT NULL COMMENT 'Benefits section',
  ADD COLUMN IF NOT EXISTS `application_start_date` DATE         DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `application_end_date`   DATE         DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `recruiter_id`           CHAR(36)     DEFAULT NULL COMMENT 'Assigned recruiter',
  ADD COLUMN IF NOT EXISTS `interview_rounds`       INT          DEFAULT 1;

SELECT 'File 21: AI candidate audit table and job extensions created.' AS status;
