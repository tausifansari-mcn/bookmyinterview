-- ============================================================
-- BOOK MY INTERVIEW
-- FILE 19: Application Screening Answers
-- ============================================================

USE `getjob`;

-- ────────────────────────────────────────────────────────────
-- TABLE: bmi_application_answer
-- Candidate answers to job-specific screening questions
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `bmi_application_answer` (
  `id`              CHAR(36)    NOT NULL DEFAULT (UUID()),
  `tenant_id`       CHAR(36)    NOT NULL,
  `application_id`  CHAR(36)    NOT NULL,
  `question_id`     CHAR(36)    NOT NULL COMMENT 'References bmi_job_question.id',
  `question_text`   TEXT        NOT NULL COMMENT 'Snapshot of question at time of answer',
  `answer_text`     TEXT        DEFAULT NULL COMMENT 'Text or JSON answer',
  `answer_file_url` VARCHAR(500) DEFAULT NULL COMMENT 'For file_upload type questions',
  `created_at`      DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_app_question` (`application_id`, `question_id`),
  INDEX `idx_application` (`application_id`),
  INDEX `idx_tenant`      (`tenant_id`),
  CONSTRAINT `fk_ans_tenant` FOREIGN KEY (`tenant_id`)      REFERENCES `bmi_tenant`(`id`)      ON DELETE CASCADE,
  CONSTRAINT `fk_ans_app`    FOREIGN KEY (`application_id`) REFERENCES `bmi_application`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Candidate answers to job-specific screening questions';

-- ────────────────────────────────────────────────────────────
-- TABLE: bmi_application_action_log
-- Admin actions on applications (shortlist, reject, hold, etc.)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `bmi_application_action_log` (
  `id`              CHAR(36)     NOT NULL DEFAULT (UUID()),
  `tenant_id`       CHAR(36)     NOT NULL,
  `application_id`  CHAR(36)     NOT NULL,
  `action`          ENUM(
                      'shortlist',
                      'reject',
                      'hold',
                      'schedule_interview',
                      'send_assessment',
                      'make_offer',
                      'hire',
                      'withdraw',
                      'note_added',
                      'stage_moved'
                    ) NOT NULL,
  `action_by`       CHAR(36)     NOT NULL COMMENT 'bmi_user.id',
  `from_stage`      VARCHAR(100) DEFAULT NULL,
  `to_stage`        VARCHAR(100) DEFAULT NULL,
  `from_status`     VARCHAR(50)  DEFAULT NULL,
  `to_status`       VARCHAR(50)  DEFAULT NULL,
  `notes`           TEXT         DEFAULT NULL,
  `created_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_application` (`application_id`),
  INDEX `idx_tenant`      (`tenant_id`),
  INDEX `idx_action_by`   (`action_by`),
  CONSTRAINT `fk_alog_tenant` FOREIGN KEY (`tenant_id`)      REFERENCES `bmi_tenant`(`id`)      ON DELETE CASCADE,
  CONSTRAINT `fk_alog_app`    FOREIGN KEY (`application_id`) REFERENCES `bmi_application`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Immutable log of all recruiter actions on an application';

SELECT 'File 19: Application answers and action log tables created.' AS status;
