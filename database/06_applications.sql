-- ============================================================
-- BOOK MY INTERVIEW
-- FILE 06: Applications & Stage History
-- ============================================================

USE `suggest`;

-- ────────────────────────────────────────────────────────────
-- TABLE: bmi_application
-- A candidate applying to a specific job.
-- One candidate can have one active application per job.
-- ────────────────────────────────────────────────────────────
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
