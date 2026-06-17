-- ============================================================
-- BOOK MY INTERVIEW
-- FILE 09: Assessments & Attempts
-- ============================================================

USE `suggest`;

-- ────────────────────────────────────────────────────────────
-- TABLE: bmi_assessment
-- Assessment/test templates created by the tenant
-- ────────────────────────────────────────────────────────────
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
