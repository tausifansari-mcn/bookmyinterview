-- ============================================================
-- BOOK MY INTERVIEW — NEW TABLES  (MySQL 8.0 compatible)
-- ============================================================

USE `getjob`;

-- ============================================================
-- Helper procedure: safely add a column only if it doesn't exist
-- ============================================================
DROP PROCEDURE IF EXISTS safe_add_col;

DELIMITER //
CREATE PROCEDURE safe_add_col(
    IN p_table  VARCHAR(64),
    IN p_col    VARCHAR(64),
    IN p_def    TEXT
)
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME   = p_table
          AND COLUMN_NAME  = p_col
    ) THEN
        SET @sql = CONCAT('ALTER TABLE `', p_table, '` ADD COLUMN `', p_col, '` ', p_def);
        PREPARE s FROM @sql;
        EXECUTE s;
        DEALLOCATE PREPARE s;
    END IF;
END //
DELIMITER ;

SELECT 'Helper procedure ready' AS status;

-- ============================================================
-- PART 1 : Extend bmi_candidate
-- ============================================================
CALL safe_add_col('bmi_candidate','password_hash',          'VARCHAR(255) DEFAULT NULL');
CALL safe_add_col('bmi_candidate','middle_name',            'VARCHAR(100) DEFAULT NULL');
CALL safe_add_col('bmi_candidate','last_name',              'VARCHAR(100) DEFAULT NULL');
CALL safe_add_col('bmi_candidate','marital_status',         'ENUM(''single'',''married'',''divorced'',''widowed'',''prefer_not_to_say'') DEFAULT NULL');
CALL safe_add_col('bmi_candidate','nationality',            'VARCHAR(100) DEFAULT NULL');
CALL safe_add_col('bmi_candidate','profile_photo_url',      'VARCHAR(500) DEFAULT NULL');
CALL safe_add_col('bmi_candidate','alternate_mobile',       'VARCHAR(20)  DEFAULT NULL');
CALL safe_add_col('bmi_candidate','alternate_email',        'VARCHAR(255) DEFAULT NULL');
CALL safe_add_col('bmi_candidate','linkedin_url',           'VARCHAR(500) DEFAULT NULL');
CALL safe_add_col('bmi_candidate','github_url',             'VARCHAR(500) DEFAULT NULL');
CALL safe_add_col('bmi_candidate','portfolio_url',          'VARCHAR(500) DEFAULT NULL');
CALL safe_add_col('bmi_candidate','current_address_line1',  'VARCHAR(255) DEFAULT NULL');
CALL safe_add_col('bmi_candidate','current_address_line2',  'VARCHAR(255) DEFAULT NULL');
CALL safe_add_col('bmi_candidate','current_city',           'VARCHAR(100) DEFAULT NULL');
CALL safe_add_col('bmi_candidate','current_state',          'VARCHAR(100) DEFAULT NULL');
CALL safe_add_col('bmi_candidate','current_country',        'VARCHAR(100) DEFAULT ''India''');
CALL safe_add_col('bmi_candidate','current_pincode',        'VARCHAR(20)  DEFAULT NULL');
CALL safe_add_col('bmi_candidate','permanent_same_as_current','TINYINT(1) DEFAULT 0');
CALL safe_add_col('bmi_candidate','permanent_address_line1','VARCHAR(255) DEFAULT NULL');
CALL safe_add_col('bmi_candidate','permanent_address_line2','VARCHAR(255) DEFAULT NULL');
CALL safe_add_col('bmi_candidate','permanent_city',         'VARCHAR(100) DEFAULT NULL');
CALL safe_add_col('bmi_candidate','permanent_state',        'VARCHAR(100) DEFAULT NULL');
CALL safe_add_col('bmi_candidate','permanent_country',      'VARCHAR(100) DEFAULT ''India''');
CALL safe_add_col('bmi_candidate','permanent_pincode',      'VARCHAR(20)  DEFAULT NULL');
CALL safe_add_col('bmi_candidate','total_experience_years', 'DECIMAL(4,1) DEFAULT NULL');
CALL safe_add_col('bmi_candidate','relevant_experience_years','DECIMAL(4,1) DEFAULT NULL');
CALL safe_add_col('bmi_candidate','current_ctc',            'DECIMAL(12,2) DEFAULT NULL');
CALL safe_add_col('bmi_candidate','expected_ctc',           'DECIMAL(12,2) DEFAULT NULL');
CALL safe_add_col('bmi_candidate','work_preference',        'ENUM(''remote'',''hybrid'',''onsite'',''any'') DEFAULT NULL');
CALL safe_add_col('bmi_candidate','professional_summary',   'TEXT DEFAULT NULL');
CALL safe_add_col('bmi_candidate','about_me',               'TEXT DEFAULT NULL');
CALL safe_add_col('bmi_candidate','career_objective',       'TEXT DEFAULT NULL');
CALL safe_add_col('bmi_candidate','voice_intro_url',        'VARCHAR(500) DEFAULT NULL');
CALL safe_add_col('bmi_candidate','voice_intro_duration',   'INT DEFAULT NULL');
CALL safe_add_col('bmi_candidate','profile_completion',     'DECIMAL(5,2) DEFAULT 0.00');
CALL safe_add_col('bmi_candidate','otp_attempts',           'INT DEFAULT 0');

SELECT 'Part 1 done: bmi_candidate columns added' AS status;

-- ============================================================
-- PART 2 : bmi_candidate_education
-- ============================================================
CREATE TABLE IF NOT EXISTS `bmi_candidate_education` (
  `id`             CHAR(36)     NOT NULL DEFAULT (UUID()),
  `tenant_id`      CHAR(36)     NOT NULL,
  `candidate_id`   CHAR(36)     NOT NULL,
  `qualification`  VARCHAR(100) NOT NULL,
  `degree`         VARCHAR(200) NOT NULL,
  `specialization` VARCHAR(200) DEFAULT NULL,
  `institute`      VARCHAR(300) NOT NULL,
  `university`     VARCHAR(300) DEFAULT NULL,
  `passing_year`   YEAR         DEFAULT NULL,
  `percentage`     DECIMAL(5,2) DEFAULT NULL,
  `cgpa`           DECIMAL(4,2) DEFAULT NULL,
  `sort_order`     INT          NOT NULL DEFAULT 0,
  `created_at`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_candidate` (`candidate_id`),
  INDEX `idx_tenant`    (`tenant_id`),
  CONSTRAINT `fk_edu_tenant`    FOREIGN KEY (`tenant_id`)    REFERENCES `bmi_tenant`(`id`)    ON DELETE CASCADE,
  CONSTRAINT `fk_edu_candidate` FOREIGN KEY (`candidate_id`) REFERENCES `bmi_candidate`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT 'Part 2 done: bmi_candidate_education created' AS status;

-- ============================================================
-- PART 3 : bmi_candidate_experience
-- ============================================================
CREATE TABLE IF NOT EXISTS `bmi_candidate_experience` (
  `id`                     CHAR(36)     NOT NULL DEFAULT (UUID()),
  `tenant_id`              CHAR(36)     NOT NULL,
  `candidate_id`           CHAR(36)     NOT NULL,
  `company_name`           VARCHAR(300) NOT NULL,
  `designation`            VARCHAR(200) NOT NULL,
  `joining_date`           DATE         NOT NULL,
  `relieving_date`         DATE         DEFAULT NULL,
  `is_current`             TINYINT(1)   NOT NULL DEFAULT 0,
  `roles_responsibilities` TEXT         DEFAULT NULL,
  `sort_order`             INT          NOT NULL DEFAULT 0,
  `created_at`             DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`             DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_candidate` (`candidate_id`),
  INDEX `idx_tenant`    (`tenant_id`),
  CONSTRAINT `fk_exp_tenant`    FOREIGN KEY (`tenant_id`)    REFERENCES `bmi_tenant`(`id`)    ON DELETE CASCADE,
  CONSTRAINT `fk_exp_candidate` FOREIGN KEY (`candidate_id`) REFERENCES `bmi_candidate`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT 'Part 3 done: bmi_candidate_experience created' AS status;

-- ============================================================
-- PART 4 : bmi_candidate_skill
-- ============================================================
CREATE TABLE IF NOT EXISTS `bmi_candidate_skill` (
  `id`               CHAR(36)     NOT NULL DEFAULT (UUID()),
  `tenant_id`        CHAR(36)     NOT NULL,
  `candidate_id`     CHAR(36)     NOT NULL,
  `skill_name`       VARCHAR(100) NOT NULL,
  `experience_years` DECIMAL(4,1) DEFAULT NULL,
  `skill_level`      ENUM('beginner','intermediate','advanced','expert') NOT NULL DEFAULT 'intermediate',
  `sort_order`       INT          NOT NULL DEFAULT 0,
  `created_at`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_candidate`  (`candidate_id`),
  INDEX `idx_skill_name` (`skill_name`),
  CONSTRAINT `fk_skill_tenant`    FOREIGN KEY (`tenant_id`)    REFERENCES `bmi_tenant`(`id`)    ON DELETE CASCADE,
  CONSTRAINT `fk_skill_candidate` FOREIGN KEY (`candidate_id`) REFERENCES `bmi_candidate`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT 'Part 4 done: bmi_candidate_skill created' AS status;

-- ============================================================
-- PART 5 : bmi_candidate_certification
-- ============================================================
CREATE TABLE IF NOT EXISTS `bmi_candidate_certification` (
  `id`                   CHAR(36)     NOT NULL DEFAULT (UUID()),
  `tenant_id`            CHAR(36)     NOT NULL,
  `candidate_id`         CHAR(36)     NOT NULL,
  `certification_name`   VARCHAR(300) NOT NULL,
  `issuing_organization` VARCHAR(300) NOT NULL,
  `issue_date`           DATE         DEFAULT NULL,
  `expiry_date`          DATE         DEFAULT NULL,
  `certificate_url`      VARCHAR(500) DEFAULT NULL,
  `sort_order`           INT          NOT NULL DEFAULT 0,
  `created_at`           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_candidate` (`candidate_id`),
  CONSTRAINT `fk_cert_tenant`    FOREIGN KEY (`tenant_id`)    REFERENCES `bmi_tenant`(`id`)    ON DELETE CASCADE,
  CONSTRAINT `fk_cert_candidate` FOREIGN KEY (`candidate_id`) REFERENCES `bmi_candidate`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT 'Part 5 done: bmi_candidate_certification created' AS status;

-- ============================================================
-- PART 6 : bmi_candidate_language
-- ============================================================
CREATE TABLE IF NOT EXISTS `bmi_candidate_language` (
  `id`           CHAR(36)     NOT NULL DEFAULT (UUID()),
  `tenant_id`    CHAR(36)     NOT NULL,
  `candidate_id` CHAR(36)     NOT NULL,
  `language`     VARCHAR(100) NOT NULL,
  `can_read`     TINYINT(1)   NOT NULL DEFAULT 0,
  `can_write`    TINYINT(1)   NOT NULL DEFAULT 0,
  `can_speak`    TINYINT(1)   NOT NULL DEFAULT 1,
  `proficiency`  ENUM('basic','conversational','proficient','fluent','native') DEFAULT 'conversational',
  `sort_order`   INT          NOT NULL DEFAULT 0,
  `created_at`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_candidate` (`candidate_id`),
  CONSTRAINT `fk_lang_tenant`    FOREIGN KEY (`tenant_id`)    REFERENCES `bmi_tenant`(`id`)    ON DELETE CASCADE,
  CONSTRAINT `fk_lang_candidate` FOREIGN KEY (`candidate_id`) REFERENCES `bmi_candidate`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT 'Part 6 done: bmi_candidate_language created' AS status;

-- ============================================================
-- PART 7 : bmi_job_question_bank
-- ============================================================
CREATE TABLE IF NOT EXISTS `bmi_job_question_bank` (
  `id`               CHAR(36)     NOT NULL DEFAULT (UUID()),
  `tenant_id`        CHAR(36)     NOT NULL,
  `job_category`     VARCHAR(100) NOT NULL,
  `job_role`         VARCHAR(200) DEFAULT NULL,
  `question`         TEXT         NOT NULL,
  `suggested_answer` TEXT         DEFAULT NULL,
  `question_type`    ENUM('text','yes_no','multiple_choice','rating','file_upload') NOT NULL DEFAULT 'text',
  `options`          JSON         DEFAULT NULL,
  `difficulty_level` ENUM('easy','medium','hard') NOT NULL DEFAULT 'medium',
  `is_mandatory`     TINYINT(1)   NOT NULL DEFAULT 0,
  `created_by`       CHAR(36)     NOT NULL,
  `is_active`        TINYINT(1)   NOT NULL DEFAULT 1,
  `created_at`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_tenant`   (`tenant_id`),
  INDEX `idx_category` (`job_category`),
  INDEX `idx_active`   (`is_active`),
  CONSTRAINT `fk_qbank_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `bmi_tenant`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT 'Part 7 done: bmi_job_question_bank created' AS status;

-- ============================================================
-- PART 8 : bmi_job_question  (per-job screening questions)
-- ============================================================
CREATE TABLE IF NOT EXISTS `bmi_job_question` (
  `id`               CHAR(36)     NOT NULL DEFAULT (UUID()),
  `tenant_id`        CHAR(36)     NOT NULL,
  `job_id`           CHAR(36)     NOT NULL,
  `bank_question_id` CHAR(36)     DEFAULT NULL,
  `question`         TEXT         NOT NULL,
  `suggested_answer` TEXT         DEFAULT NULL,
  `question_type`    ENUM('text','yes_no','multiple_choice','rating','file_upload') NOT NULL DEFAULT 'text',
  `options`          JSON         DEFAULT NULL,
  `difficulty_level` ENUM('easy','medium','hard') NOT NULL DEFAULT 'medium',
  `is_mandatory`     TINYINT(1)   NOT NULL DEFAULT 0,
  `sort_order`       INT          NOT NULL DEFAULT 0,
  `created_at`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_job`    (`job_id`),
  INDEX `idx_tenant` (`tenant_id`),
  CONSTRAINT `fk_jq_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `bmi_tenant`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_jq_job`    FOREIGN KEY (`job_id`)    REFERENCES `bmi_job`(`id`)    ON DELETE CASCADE,
  CONSTRAINT `fk_jq_bank`   FOREIGN KEY (`bank_question_id`) REFERENCES `bmi_job_question_bank`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT 'Part 8 done: bmi_job_question created' AS status;

-- ============================================================
-- PART 9 : bmi_application_answer
-- ============================================================
CREATE TABLE IF NOT EXISTS `bmi_application_answer` (
  `id`              CHAR(36)     NOT NULL DEFAULT (UUID()),
  `tenant_id`       CHAR(36)     NOT NULL,
  `application_id`  CHAR(36)     NOT NULL,
  `question_id`     CHAR(36)     NOT NULL,
  `question_text`   TEXT         NOT NULL,
  `answer_text`     TEXT         DEFAULT NULL,
  `answer_file_url` VARCHAR(500) DEFAULT NULL,
  `created_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_app_question` (`application_id`, `question_id`),
  INDEX `idx_application` (`application_id`),
  INDEX `idx_tenant`      (`tenant_id`),
  CONSTRAINT `fk_ans_tenant` FOREIGN KEY (`tenant_id`)      REFERENCES `bmi_tenant`(`id`)      ON DELETE CASCADE,
  CONSTRAINT `fk_ans_app`    FOREIGN KEY (`application_id`) REFERENCES `bmi_application`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT 'Part 9 done: bmi_application_answer created' AS status;

-- ============================================================
-- PART 10 : bmi_application_action_log
-- ============================================================
CREATE TABLE IF NOT EXISTS `bmi_application_action_log` (
  `id`             CHAR(36)     NOT NULL DEFAULT (UUID()),
  `tenant_id`      CHAR(36)     NOT NULL,
  `application_id` CHAR(36)     NOT NULL,
  `action`         ENUM('shortlist','reject','hold','schedule_interview',
                        'send_assessment','make_offer','hire',
                        'withdraw','note_added','stage_moved') NOT NULL,
  `action_by`      CHAR(36)     NOT NULL,
  `from_stage`     VARCHAR(100) DEFAULT NULL,
  `to_stage`       VARCHAR(100) DEFAULT NULL,
  `from_status`    VARCHAR(50)  DEFAULT NULL,
  `to_status`      VARCHAR(50)  DEFAULT NULL,
  `notes`          TEXT         DEFAULT NULL,
  `created_at`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_application` (`application_id`),
  INDEX `idx_tenant`      (`tenant_id`),
  CONSTRAINT `fk_alog_tenant` FOREIGN KEY (`tenant_id`)      REFERENCES `bmi_tenant`(`id`)      ON DELETE CASCADE,
  CONSTRAINT `fk_alog_app`    FOREIGN KEY (`application_id`) REFERENCES `bmi_application`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT 'Part 10 done: bmi_application_action_log created' AS status;

-- ============================================================
-- PART 11 : bmi_admin_otp  (admin/recruiter forgot-password)
-- ============================================================
CREATE TABLE IF NOT EXISTS `bmi_admin_otp` (
  `id`         CHAR(36)     NOT NULL DEFAULT (UUID()),
  `user_id`    CHAR(36)     NOT NULL,
  `tenant_id`  CHAR(36)     NOT NULL,
  `otp_hash`   VARCHAR(255) NOT NULL,
  `attempts`   INT          NOT NULL DEFAULT 0,
  `expires_at` DATETIME     NOT NULL,
  `used`       TINYINT(1)   NOT NULL DEFAULT 0,
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_user`    (`user_id`),
  INDEX `idx_tenant`  (`tenant_id`),
  INDEX `idx_expires` (`expires_at`),
  CONSTRAINT `fk_admin_otp_user`   FOREIGN KEY (`user_id`)   REFERENCES `bmi_user`(`id`)   ON DELETE CASCADE,
  CONSTRAINT `fk_admin_otp_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `bmi_tenant`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT 'Part 11 done: bmi_admin_otp created' AS status;

-- ============================================================
-- PART 12 : bmi_ai_candidate_audit
-- ============================================================
CREATE TABLE IF NOT EXISTS `bmi_ai_candidate_audit` (
  `id`                      CHAR(36)     NOT NULL DEFAULT (UUID()),
  `tenant_id`               CHAR(36)     NOT NULL,
  `application_id`          CHAR(36)     NOT NULL,
  `candidate_id`            CHAR(36)     NOT NULL,
  `job_id`                  CHAR(36)     NOT NULL,
  `overall_match_score`     DECIMAL(5,2) DEFAULT NULL,
  `skills_match_pct`        DECIMAL(5,2) DEFAULT NULL,
  `experience_match_pct`    DECIMAL(5,2) DEFAULT NULL,
  `communication_score`     DECIMAL(5,2) DEFAULT NULL,
  `resume_quality_score`    DECIMAL(5,2) DEFAULT NULL,
  `job_fit_score`           DECIMAL(5,2) DEFAULT NULL,
  `education_match_pct`     DECIMAL(5,2) DEFAULT NULL,
  `ai_recommendation`       ENUM('highly_recommended','recommended','average','not_recommended') DEFAULT NULL,
  `recommendation_reason`   TEXT         DEFAULT NULL,
  `strengths`               JSON         DEFAULT NULL,
  `concerns`                JSON         DEFAULT NULL,
  `skill_gaps`              JSON         DEFAULT NULL,
  `key_highlights`          JSON         DEFAULT NULL,
  `screening_answers_score` DECIMAL(5,2) DEFAULT NULL,
  `voice_intro_score`       DECIMAL(5,2) DEFAULT NULL,
  `full_report`             TEXT         DEFAULT NULL,
  `ai_model_used`           VARCHAR(100) DEFAULT 'claude-sonnet-4-6',
  `credits_consumed`        INT          NOT NULL DEFAULT 1,
  `screened_at`             DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at`              DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_application_audit` (`application_id`),
  INDEX `idx_tenant`         (`tenant_id`),
  INDEX `idx_candidate`      (`candidate_id`),
  INDEX `idx_job`            (`job_id`),
  INDEX `idx_recommendation` (`ai_recommendation`),
  CONSTRAINT `fk_audit_tenant` FOREIGN KEY (`tenant_id`)      REFERENCES `bmi_tenant`(`id`)      ON DELETE CASCADE,
  CONSTRAINT `fk_audit_app`    FOREIGN KEY (`application_id`) REFERENCES `bmi_application`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_audit_cand`   FOREIGN KEY (`candidate_id`)   REFERENCES `bmi_candidate`(`id`)   ON DELETE CASCADE,
  CONSTRAINT `fk_audit_job`    FOREIGN KEY (`job_id`)         REFERENCES `bmi_job`(`id`)          ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT 'Part 12 done: bmi_ai_candidate_audit created' AS status;

-- ============================================================
-- PART 13 : Extend bmi_job with extra fields
-- ============================================================
CALL safe_add_col('bmi_job','category',               'VARCHAR(100) DEFAULT NULL');
CALL safe_add_col('bmi_job','education_required',     'VARCHAR(200) DEFAULT NULL');
CALL safe_add_col('bmi_job','education_preferred',    'VARCHAR(200) DEFAULT NULL');
CALL safe_add_col('bmi_job','skills_mandatory',       'JSON DEFAULT NULL');
CALL safe_add_col('bmi_job','skills_preferred',       'JSON DEFAULT NULL');
CALL safe_add_col('bmi_job','about_job',              'TEXT DEFAULT NULL');
CALL safe_add_col('bmi_job','roles',                  'TEXT DEFAULT NULL');
CALL safe_add_col('bmi_job','responsibilities',       'TEXT DEFAULT NULL');
CALL safe_add_col('bmi_job','benefits',               'TEXT DEFAULT NULL');
CALL safe_add_col('bmi_job','application_start_date', 'DATE DEFAULT NULL');
CALL safe_add_col('bmi_job','application_end_date',   'DATE DEFAULT NULL');
CALL safe_add_col('bmi_job','recruiter_id',           'CHAR(36) DEFAULT NULL');
CALL safe_add_col('bmi_job','interview_rounds',       'INT DEFAULT 1');

SELECT 'Part 13 done: bmi_job columns added' AS status;

-- ============================================================
-- PART 14 : Seed question bank (sample questions)
-- ============================================================
SET @admin_id = (
    SELECT id FROM bmi_user
    WHERE tenant_id = 'bmi0-0000-0000-0000-000000000001'
    LIMIT 1
);

INSERT INTO `bmi_job_question_bank`
  (id, tenant_id, job_category, job_role, question, suggested_answer, difficulty_level, is_mandatory, created_by)
SELECT UUID(),'bmi0-0000-0000-0000-000000000001','Software Engineer',NULL,
  'What is your total experience in software development?',
  'Candidate should mention total years and key technologies.',
  'easy',1,@admin_id
WHERE @admin_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM bmi_job_question_bank WHERE tenant_id='bmi0-0000-0000-0000-000000000001' AND question='What is your total experience in software development?');

INSERT INTO `bmi_job_question_bank`
  (id, tenant_id, job_category, job_role, question, suggested_answer, difficulty_level, is_mandatory, created_by)
SELECT UUID(),'bmi0-0000-0000-0000-000000000001','Software Engineer',NULL,
  'Are you comfortable working in an Agile/Scrum environment?',
  'Yes with explanation of sprints, stand-ups, retrospectives.',
  'easy',1,@admin_id
WHERE @admin_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM bmi_job_question_bank WHERE tenant_id='bmi0-0000-0000-0000-000000000001' AND question='Are you comfortable working in an Agile/Scrum environment?');

INSERT INTO `bmi_job_question_bank`
  (id, tenant_id, job_category, job_role, question, suggested_answer, difficulty_level, is_mandatory, created_by)
SELECT UUID(),'bmi0-0000-0000-0000-000000000001','Software Engineer','Full Stack Developer',
  'Which frontend and backend frameworks are you most proficient in?',
  'e.g. React, Angular, Node.js, Django, Spring Boot.',
  'medium',1,@admin_id
WHERE @admin_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM bmi_job_question_bank WHERE tenant_id='bmi0-0000-0000-0000-000000000001' AND question='Which frontend and backend frameworks are you most proficient in?');

INSERT INTO `bmi_job_question_bank`
  (id, tenant_id, job_category, job_role, question, suggested_answer, difficulty_level, is_mandatory, created_by)
SELECT UUID(),'bmi0-0000-0000-0000-000000000001','HR Executive',NULL,
  'How many years of HR experience do you have and what are your key areas?',
  'Candidate should mention years and specialization: recruitment, payroll, compliance.',
  'easy',1,@admin_id
WHERE @admin_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM bmi_job_question_bank WHERE tenant_id='bmi0-0000-0000-0000-000000000001' AND question='How many years of HR experience do you have and what are your key areas?');

INSERT INTO `bmi_job_question_bank`
  (id, tenant_id, job_category, job_role, question, suggested_answer, difficulty_level, is_mandatory, created_by)
SELECT UUID(),'bmi0-0000-0000-0000-000000000001','Sales Executive',NULL,
  'What is your current monthly sales target and average achievement percentage?',
  'Candidate should provide specific numbers and consistent percentage achieved.',
  'medium',1,@admin_id
WHERE @admin_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM bmi_job_question_bank WHERE tenant_id='bmi0-0000-0000-0000-000000000001' AND question='What is your current monthly sales target and average achievement percentage?');

INSERT INTO `bmi_job_question_bank`
  (id, tenant_id, job_category, job_role, question, suggested_answer, difficulty_level, is_mandatory, created_by)
SELECT UUID(),'bmi0-0000-0000-0000-000000000001','General',NULL,
  'What is your current notice period?',
  'Candidate should state notice period in days or weeks.',
  'easy',1,@admin_id
WHERE @admin_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM bmi_job_question_bank WHERE tenant_id='bmi0-0000-0000-0000-000000000001' AND question='What is your current notice period?');

INSERT INTO `bmi_job_question_bank`
  (id, tenant_id, job_category, job_role, question, suggested_answer, difficulty_level, is_mandatory, created_by)
SELECT UUID(),'bmi0-0000-0000-0000-000000000001','General',NULL,
  'What are your salary expectations (CTC) for this role?',
  'Candidate should provide expected CTC in LPA.',
  'easy',1,@admin_id
WHERE @admin_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM bmi_job_question_bank WHERE tenant_id='bmi0-0000-0000-0000-000000000001' AND question='What are your salary expectations (CTC) for this role?');

INSERT INTO `bmi_job_question_bank`
  (id, tenant_id, job_category, job_role, question, suggested_answer, difficulty_level, is_mandatory, created_by)
SELECT UUID(),'bmi0-0000-0000-0000-000000000001','General',NULL,
  'Are you open to relocating for this position?',
  'Yes/No with preferred or acceptable locations.',
  'easy',0,@admin_id
WHERE @admin_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM bmi_job_question_bank WHERE tenant_id='bmi0-0000-0000-0000-000000000001' AND question='Are you open to relocating for this position?');

SELECT 'Part 14 done: Question bank seeded' AS status;

-- ============================================================
-- Cleanup helper procedure
-- ============================================================
DROP PROCEDURE IF EXISTS safe_add_col;

-- ============================================================
-- FINAL VERIFICATION
-- ============================================================
SELECT table_name AS `New Tables Created`
FROM information_schema.tables
WHERE table_schema = 'getjob'
  AND table_name IN (
    'bmi_candidate_education',
    'bmi_candidate_experience',
    'bmi_candidate_skill',
    'bmi_candidate_certification',
    'bmi_candidate_language',
    'bmi_job_question_bank',
    'bmi_job_question',
    'bmi_application_answer',
    'bmi_application_action_log',
    'bmi_admin_otp',
    'bmi_ai_candidate_audit'
  )
ORDER BY table_name;

SELECT 'ALL DONE — Run complete. Check table list above.' AS final_status;
