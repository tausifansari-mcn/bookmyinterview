-- ============================================================
-- BOOK MY INTERVIEW
-- FILE 18: Job Question Bank & Per-Job Questions
-- ============================================================

USE `getjob`;

-- ────────────────────────────────────────────────────────────
-- TABLE: bmi_job_question_bank
-- Master question bank reused across jobs
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `bmi_job_question_bank` (
  `id`                CHAR(36)      NOT NULL DEFAULT (UUID()),
  `tenant_id`         CHAR(36)      NOT NULL,
  `job_category`      VARCHAR(100)  NOT NULL COMMENT 'e.g. Software Engineer, HR Executive, Sales',
  `job_role`          VARCHAR(200)  DEFAULT NULL COMMENT 'Specific role if applicable',
  `question`          TEXT          NOT NULL,
  `suggested_answer`  TEXT          DEFAULT NULL,
  `question_type`     ENUM(
                        'text',
                        'yes_no',
                        'multiple_choice',
                        'rating',
                        'file_upload'
                      ) NOT NULL DEFAULT 'text',
  `options`           JSON          DEFAULT NULL COMMENT 'For multiple_choice: array of option strings',
  `difficulty_level`  ENUM('easy','medium','hard') NOT NULL DEFAULT 'medium',
  `is_mandatory`      TINYINT(1)    NOT NULL DEFAULT 0,
  `created_by`        CHAR(36)      NOT NULL,
  `is_active`         TINYINT(1)    NOT NULL DEFAULT 1,
  `created_at`        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_tenant`       (`tenant_id`),
  INDEX `idx_category`     (`job_category`),
  INDEX `idx_role`         (`job_role`),
  INDEX `idx_active`       (`is_active`),
  CONSTRAINT `fk_qbank_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `bmi_tenant`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Master question bank — reused across job postings';

-- ────────────────────────────────────────────────────────────
-- TABLE: bmi_job_question
-- Questions assigned to a specific job (sourced from bank or custom)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `bmi_job_question` (
  `id`                CHAR(36)      NOT NULL DEFAULT (UUID()),
  `tenant_id`         CHAR(36)      NOT NULL,
  `job_id`            CHAR(36)      NOT NULL,
  `bank_question_id`  CHAR(36)      DEFAULT NULL COMMENT 'Source from question bank if applicable',
  `question`          TEXT          NOT NULL,
  `suggested_answer`  TEXT          DEFAULT NULL,
  `question_type`     ENUM(
                        'text',
                        'yes_no',
                        'multiple_choice',
                        'rating',
                        'file_upload'
                      ) NOT NULL DEFAULT 'text',
  `options`           JSON          DEFAULT NULL,
  `difficulty_level`  ENUM('easy','medium','hard') NOT NULL DEFAULT 'medium',
  `is_mandatory`      TINYINT(1)    NOT NULL DEFAULT 0,
  `sort_order`        INT           NOT NULL DEFAULT 0,
  `created_at`        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_job`     (`job_id`),
  INDEX `idx_tenant`  (`tenant_id`),
  CONSTRAINT `fk_jq_tenant`  FOREIGN KEY (`tenant_id`) REFERENCES `bmi_tenant`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_jq_job`     FOREIGN KEY (`job_id`)    REFERENCES `bmi_job`(`id`)    ON DELETE CASCADE,
  CONSTRAINT `fk_jq_bank`    FOREIGN KEY (`bank_question_id`) REFERENCES `bmi_job_question_bank`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Questions assigned to a specific job for candidate screening';

-- ────────────────────────────────────────────────────────────
-- Seed default question bank entries
-- ────────────────────────────────────────────────────────────
INSERT IGNORE INTO `bmi_job_question_bank`
  (id, tenant_id, job_category, job_role, question, suggested_answer, difficulty_level, is_mandatory, created_by)
VALUES
  (UUID(), 'bmi0-0000-0000-0000-000000000001', 'Software Engineer', NULL,
   'What is your total experience in software development?', 'Candidate should mention total years and key technologies.', 'easy', 1,
   (SELECT id FROM bmi_user WHERE tenant_id = 'bmi0-0000-0000-0000-000000000001' LIMIT 1)),

  (UUID(), 'bmi0-0000-0000-0000-000000000001', 'Software Engineer', NULL,
   'Are you comfortable working in an Agile/Scrum environment?', 'Yes/No with explanation of experience.', 'easy', 1,
   (SELECT id FROM bmi_user WHERE tenant_id = 'bmi0-0000-0000-0000-000000000001' LIMIT 1)),

  (UUID(), 'bmi0-0000-0000-0000-000000000001', 'Software Engineer', 'Full Stack Developer',
   'Which frontend and backend frameworks are you most proficient in?', 'e.g. React, Node.js, Angular, Django', 'medium', 1,
   (SELECT id FROM bmi_user WHERE tenant_id = 'bmi0-0000-0000-0000-000000000001' LIMIT 1)),

  (UUID(), 'bmi0-0000-0000-0000-000000000001', 'HR Executive', NULL,
   'How many years of HR experience do you have?', 'Candidate should mention years and specialization areas.', 'easy', 1,
   (SELECT id FROM bmi_user WHERE tenant_id = 'bmi0-0000-0000-0000-000000000001' LIMIT 1)),

  (UUID(), 'bmi0-0000-0000-0000-000000000001', 'Sales Executive', NULL,
   'What is your current monthly sales target and achievement percentage?', 'Candidate should provide specific numbers and percentage achieved.', 'medium', 1,
   (SELECT id FROM bmi_user WHERE tenant_id = 'bmi0-0000-0000-0000-000000000001' LIMIT 1)),

  (UUID(), 'bmi0-0000-0000-0000-000000000001', 'Data Analyst', NULL,
   'Which data analysis tools and languages are you proficient in?', 'e.g. Python, R, SQL, Tableau, Power BI', 'medium', 1,
   (SELECT id FROM bmi_user WHERE tenant_id = 'bmi0-0000-0000-0000-000000000001' LIMIT 1)),

  (UUID(), 'bmi0-0000-0000-0000-000000000001', 'General', NULL,
   'What is your notice period at your current employer?', 'Candidate should state notice period in days/weeks.', 'easy', 1,
   (SELECT id FROM bmi_user WHERE tenant_id = 'bmi0-0000-0000-0000-000000000001' LIMIT 1)),

  (UUID(), 'bmi0-0000-0000-0000-000000000001', 'General', NULL,
   'Are you open to relocate for this position?', 'Yes/No with preferred locations if any.', 'easy', 0,
   (SELECT id FROM bmi_user WHERE tenant_id = 'bmi0-0000-0000-0000-000000000001' LIMIT 1)),

  (UUID(), 'bmi0-0000-0000-0000-000000000001', 'General', NULL,
   'What are your salary expectations for this role?', 'Candidate should provide expected CTC range.', 'easy', 1,
   (SELECT id FROM bmi_user WHERE tenant_id = 'bmi0-0000-0000-0000-000000000001' LIMIT 1));

SELECT 'File 18: Job question bank and job questions tables created.' AS status;
