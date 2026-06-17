-- ============================================================
-- BOOK MY INTERVIEW
-- FILE 07: Interviews & Feedback
-- ============================================================

USE `suggest`;

-- ────────────────────────────────────────────────────────────
-- TABLE: bmi_interview
-- Scheduled interview sessions for an application
-- ────────────────────────────────────────────────────────────
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
