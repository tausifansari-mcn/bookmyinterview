-- ============================================================
-- BOOK MY INTERVIEW
-- FILE 17: Candidate Profile Extended Tables
-- Run after: 16_candidate_portal.sql
-- ============================================================

USE `getjob`;

-- ── Extend bmi_candidate with new profile columns ─────────────
ALTER TABLE `bmi_candidate`
  ADD COLUMN IF NOT EXISTS `middle_name`          VARCHAR(100)  DEFAULT NULL AFTER `full_name`,
  ADD COLUMN IF NOT EXISTS `last_name`            VARCHAR(100)  DEFAULT NULL AFTER `middle_name`,
  ADD COLUMN IF NOT EXISTS `marital_status`       ENUM('single','married','divorced','widowed','prefer_not_to_say') DEFAULT NULL AFTER `gender`,
  ADD COLUMN IF NOT EXISTS `nationality`          VARCHAR(100)  DEFAULT NULL AFTER `marital_status`,
  ADD COLUMN IF NOT EXISTS `profile_photo_url`    VARCHAR(500)  DEFAULT NULL AFTER `nationality`,
  ADD COLUMN IF NOT EXISTS `alternate_mobile`     VARCHAR(20)   DEFAULT NULL AFTER `mobile`,
  ADD COLUMN IF NOT EXISTS `alternate_email`      VARCHAR(255)  DEFAULT NULL AFTER `email`,
  ADD COLUMN IF NOT EXISTS `linkedin_url`         VARCHAR(500)  DEFAULT NULL AFTER `alternate_email`,
  ADD COLUMN IF NOT EXISTS `github_url`           VARCHAR(500)  DEFAULT NULL AFTER `linkedin_url`,
  ADD COLUMN IF NOT EXISTS `portfolio_url`        VARCHAR(500)  DEFAULT NULL AFTER `github_url`,
  ADD COLUMN IF NOT EXISTS `current_address_line1` VARCHAR(255) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `current_address_line2` VARCHAR(255) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `current_city`         VARCHAR(100)  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `current_state`        VARCHAR(100)  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `current_country`      VARCHAR(100)  DEFAULT 'India',
  ADD COLUMN IF NOT EXISTS `current_pincode`      VARCHAR(20)   DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `permanent_same_as_current` TINYINT(1) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `permanent_address_line1` VARCHAR(255) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `permanent_address_line2` VARCHAR(255) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `permanent_city`       VARCHAR(100)  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `permanent_state`      VARCHAR(100)  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `permanent_country`    VARCHAR(100)  DEFAULT 'India',
  ADD COLUMN IF NOT EXISTS `permanent_pincode`    VARCHAR(20)   DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `total_experience_years` DECIMAL(4,1) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `relevant_experience_years` DECIMAL(4,1) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `current_ctc`          DECIMAL(12,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `expected_ctc`         DECIMAL(12,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `work_preference`      ENUM('remote','hybrid','onsite','any') DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `professional_summary` TEXT          DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `about_me`             TEXT          DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `career_objective`     TEXT          DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `voice_intro_url`      VARCHAR(500)  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `voice_intro_duration` INT           DEFAULT NULL COMMENT 'Duration in seconds',
  ADD COLUMN IF NOT EXISTS `profile_completion`   DECIMAL(5,2)  DEFAULT 0.00 COMMENT 'Profile completion percentage 0-100',
  ADD COLUMN IF NOT EXISTS `otp_attempts`         INT           DEFAULT 0;

-- ────────────────────────────────────────────────────────────
-- TABLE: bmi_candidate_education
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `bmi_candidate_education` (
  `id`              CHAR(36)     NOT NULL DEFAULT (UUID()),
  `tenant_id`       CHAR(36)     NOT NULL,
  `candidate_id`    CHAR(36)     NOT NULL,
  `qualification`   VARCHAR(100) NOT NULL COMMENT 'e.g. Graduate, Post Graduate, Diploma',
  `degree`          VARCHAR(200) NOT NULL COMMENT 'e.g. B.Tech, MBA, BCA',
  `specialization`  VARCHAR(200) DEFAULT NULL COMMENT 'e.g. Computer Science, Finance',
  `institute`       VARCHAR(300) NOT NULL,
  `university`      VARCHAR(300) DEFAULT NULL,
  `passing_year`    YEAR         DEFAULT NULL,
  `percentage`      DECIMAL(5,2) DEFAULT NULL,
  `cgpa`            DECIMAL(4,2) DEFAULT NULL,
  `sort_order`      INT          NOT NULL DEFAULT 0,
  `created_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_candidate` (`candidate_id`),
  INDEX `idx_tenant`    (`tenant_id`),
  CONSTRAINT `fk_edu_tenant`    FOREIGN KEY (`tenant_id`)    REFERENCES `bmi_tenant`(`id`)    ON DELETE CASCADE,
  CONSTRAINT `fk_edu_candidate` FOREIGN KEY (`candidate_id`) REFERENCES `bmi_candidate`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Candidate education history — multiple entries per candidate';

-- ────────────────────────────────────────────────────────────
-- TABLE: bmi_candidate_experience
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `bmi_candidate_experience` (
  `id`                  CHAR(36)     NOT NULL DEFAULT (UUID()),
  `tenant_id`           CHAR(36)     NOT NULL,
  `candidate_id`        CHAR(36)     NOT NULL,
  `company_name`        VARCHAR(300) NOT NULL,
  `designation`         VARCHAR(200) NOT NULL,
  `joining_date`        DATE         NOT NULL,
  `relieving_date`      DATE         DEFAULT NULL,
  `is_current`          TINYINT(1)   NOT NULL DEFAULT 0,
  `roles_responsibilities` TEXT      DEFAULT NULL,
  `sort_order`          INT          NOT NULL DEFAULT 0,
  `created_at`          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_candidate`  (`candidate_id`),
  INDEX `idx_tenant`     (`tenant_id`),
  CONSTRAINT `fk_exp_tenant`    FOREIGN KEY (`tenant_id`)    REFERENCES `bmi_tenant`(`id`)    ON DELETE CASCADE,
  CONSTRAINT `fk_exp_candidate` FOREIGN KEY (`candidate_id`) REFERENCES `bmi_candidate`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Candidate employment history — multiple entries per candidate';

-- ────────────────────────────────────────────────────────────
-- TABLE: bmi_candidate_skill
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `bmi_candidate_skill` (
  `id`            CHAR(36)     NOT NULL DEFAULT (UUID()),
  `tenant_id`     CHAR(36)     NOT NULL,
  `candidate_id`  CHAR(36)     NOT NULL,
  `skill_name`    VARCHAR(100) NOT NULL,
  `experience_years` DECIMAL(4,1) DEFAULT NULL,
  `skill_level`   ENUM('beginner','intermediate','advanced','expert') NOT NULL DEFAULT 'intermediate',
  `sort_order`    INT          NOT NULL DEFAULT 0,
  `created_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_candidate`  (`candidate_id`),
  INDEX `idx_skill_name` (`skill_name`),
  CONSTRAINT `fk_skill_tenant`    FOREIGN KEY (`tenant_id`)    REFERENCES `bmi_tenant`(`id`)    ON DELETE CASCADE,
  CONSTRAINT `fk_skill_candidate` FOREIGN KEY (`candidate_id`) REFERENCES `bmi_candidate`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Candidate skill set — multiple skills per candidate';

-- ────────────────────────────────────────────────────────────
-- TABLE: bmi_candidate_certification
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `bmi_candidate_certification` (
  `id`                  CHAR(36)     NOT NULL DEFAULT (UUID()),
  `tenant_id`           CHAR(36)     NOT NULL,
  `candidate_id`        CHAR(36)     NOT NULL,
  `certification_name`  VARCHAR(300) NOT NULL,
  `issuing_organization` VARCHAR(300) NOT NULL,
  `issue_date`          DATE         DEFAULT NULL,
  `expiry_date`         DATE         DEFAULT NULL,
  `certificate_url`     VARCHAR(500) DEFAULT NULL,
  `sort_order`          INT          NOT NULL DEFAULT 0,
  `created_at`          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_candidate` (`candidate_id`),
  CONSTRAINT `fk_cert_tenant`    FOREIGN KEY (`tenant_id`)    REFERENCES `bmi_tenant`(`id`)    ON DELETE CASCADE,
  CONSTRAINT `fk_cert_candidate` FOREIGN KEY (`candidate_id`) REFERENCES `bmi_candidate`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Candidate certifications — multiple entries';

-- ────────────────────────────────────────────────────────────
-- TABLE: bmi_candidate_language
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `bmi_candidate_language` (
  `id`            CHAR(36)     NOT NULL DEFAULT (UUID()),
  `tenant_id`     CHAR(36)     NOT NULL,
  `candidate_id`  CHAR(36)     NOT NULL,
  `language`      VARCHAR(100) NOT NULL,
  `can_read`      TINYINT(1)   NOT NULL DEFAULT 0,
  `can_write`     TINYINT(1)   NOT NULL DEFAULT 0,
  `can_speak`     TINYINT(1)   NOT NULL DEFAULT 1,
  `proficiency`   ENUM('basic','conversational','proficient','fluent','native') DEFAULT 'conversational',
  `sort_order`    INT          NOT NULL DEFAULT 0,
  `created_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_candidate` (`candidate_id`),
  CONSTRAINT `fk_lang_tenant`    FOREIGN KEY (`tenant_id`)    REFERENCES `bmi_tenant`(`id`)    ON DELETE CASCADE,
  CONSTRAINT `fk_lang_candidate` FOREIGN KEY (`candidate_id`) REFERENCES `bmi_candidate`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Languages known by candidate';

SELECT 'File 17: Candidate profile extended tables created.' AS status;
