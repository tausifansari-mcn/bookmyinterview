-- ============================================================
-- BOOK MY INTERVIEW
-- FILE 11: AI Engine (Screening Results & Credits)
-- ============================================================

USE `suggest`;

-- ────────────────────────────────────────────────────────────
-- TABLE: bmi_ai_screening_result
-- AI resume screening result for one application
-- ────────────────────────────────────────────────────────────
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
