-- ============================================================
-- Migration 001 — New features
-- Run once: mysql -u root -p getjob < 001_new_features.sql
-- ============================================================

-- 1. Extend bmi_tenant with company profile + permissions
ALTER TABLE bmi_tenant
  ADD COLUMN IF NOT EXISTS about_company      TEXT          NULL AFTER company_tagline,
  ADD COLUMN IF NOT EXISTS culture_description TEXT         NULL AFTER about_company,
  ADD COLUMN IF NOT EXISTS achievements_json  JSON          NULL AFTER culture_description,
  ADD COLUMN IF NOT EXISTS permissions        JSON          NULL COMMENT 'Feature flags per client' AFTER achievements_json,
  ADD COLUMN IF NOT EXISTS location_city      VARCHAR(100)  NULL AFTER city;

-- 2. Company media (photos, achievements, project showcase)
CREATE TABLE IF NOT EXISTS bmi_company_media (
  id          VARCHAR(36)  PRIMARY KEY,
  tenant_id   VARCHAR(36)  NOT NULL,
  media_type  ENUM('photo','achievement','project','banner') NOT NULL DEFAULT 'photo',
  title       VARCHAR(300) NULL,
  description TEXT         NULL,
  file_url    VARCHAR(500) NOT NULL,
  sort_order  INT          DEFAULT 0,
  created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_tenant (tenant_id),
  INDEX idx_type   (tenant_id, media_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Candidate saved / bookmarked jobs
CREATE TABLE IF NOT EXISTS bmi_saved_job (
  id           VARCHAR(36) PRIMARY KEY,
  candidate_id VARCHAR(36) NOT NULL,
  job_id       VARCHAR(36) NOT NULL,
  saved_at     DATETIME    DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_candidate_job (candidate_id, job_id),
  INDEX idx_candidate (candidate_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Candidate feedback / suggestions
CREATE TABLE IF NOT EXISTS bmi_candidate_feedback (
  id              VARCHAR(36)  PRIMARY KEY,
  candidate_id    VARCHAR(36)  NOT NULL,
  candidate_name  VARCHAR(200) NULL,
  candidate_email VARCHAR(300) NULL,
  feedback_type   ENUM('bug','suggestion','complaint','praise','other') NOT NULL DEFAULT 'other',
  rating          TINYINT      NULL COMMENT '1-5 stars',
  message         TEXT         NOT NULL,
  sentiment       ENUM('positive','neutral','negative') NULL,
  page_context    VARCHAR(100) NULL,
  created_at      DATETIME     DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_candidate  (candidate_id),
  INDEX idx_sentiment  (sentiment),
  INDEX idx_created    (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Store submitted answers in assessment attempt for detailed client review
ALTER TABLE bmi_candidate_assessment
  ADD COLUMN IF NOT EXISTS answers_submitted_json JSON NULL COMMENT 'Per-question submitted answers with correctness';

-- 6. Ensure bmi_notification_log supports platform_admin recipient type
ALTER TABLE bmi_notification_log
  MODIFY COLUMN recipient_type VARCHAR(50) NOT NULL DEFAULT 'candidate';
