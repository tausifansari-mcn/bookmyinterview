-- ============================================================
-- Migration 003 — New Business Model v2
-- Client JD Submission → Super Admin Review → Candidate
-- Assessment (90% rule) → Candidate Schedules Interview →
-- Client Acknowledges → Mediated Interview on Platform
-- ============================================================

-- 1. JD Requests from clients (pending super admin approval)
CREATE TABLE IF NOT EXISTS bmi_jd_request (
  id                  CHAR(36)     NOT NULL PRIMARY KEY DEFAULT (UUID()),
  tenant_id           CHAR(36)     NOT NULL,
  title               VARCHAR(300) NOT NULL,
  description         TEXT         NULL,
  requirements        TEXT         NULL,
  responsibilities    TEXT         NULL,
  job_type            ENUM('full_time','part_time','contract','internship','temporary') DEFAULT 'full_time',
  work_mode           ENUM('onsite','remote','hybrid') DEFAULT 'onsite',
  experience_min_years DECIMAL(4,1) DEFAULT 0,
  experience_max_years DECIMAL(4,1) NULL,
  salary_min          DECIMAL(12,2) NULL,
  salary_max          DECIMAL(12,2) NULL,
  skills_required     JSON         NULL,
  location            VARCHAR(200) NULL,
  source_type         ENUM('upload','manual','existing') NOT NULL DEFAULT 'manual',
  uploaded_file_url   VARCHAR(500) NULL,
  existing_job_id     CHAR(36)     NULL,
  status              ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  admin_notes         TEXT         NULL,
  reviewed_by         CHAR(36)     NULL,
  reviewed_at         DATETIME     NULL,
  created_by          CHAR(36)     NOT NULL,
  created_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_tenant    (tenant_id),
  INDEX idx_status    (status),
  INDEX idx_created   (created_at),
  CONSTRAINT fk_jdreq_tenant FOREIGN KEY (tenant_id) REFERENCES bmi_tenant(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Client JD submissions awaiting super admin review';

-- 2. Extend bmi_interview for the mediator / scheduling flow
ALTER TABLE bmi_interview
  ADD COLUMN scheduling_status ENUM(
    'pending_candidate','candidate_scheduled','client_acknowledged',
    'meeting_shared','in_progress','completed','cancelled'
  ) NOT NULL DEFAULT 'pending_candidate' AFTER status,
  ADD COLUMN candidate_proposed_at DATETIME NULL AFTER scheduling_status,
  ADD COLUMN candidate_notes       TEXT     NULL AFTER candidate_proposed_at,
  ADD COLUMN client_acknowledged_at DATETIME NULL AFTER candidate_notes,
  ADD COLUMN client_acknowledged_by CHAR(36) NULL AFTER client_acknowledged_at,
  ADD COLUMN mediator_id           CHAR(36) NULL AFTER client_acknowledged_by,
  ADD COLUMN mediator_joined_at    DATETIME NULL AFTER mediator_id,
  ADD COLUMN mediator_notes        TEXT     NULL AFTER mediator_joined_at;

-- 3. Interview transcripts & recordings (mediator capture)
CREATE TABLE IF NOT EXISTS bmi_interview_transcript (
  id                CHAR(36)     NOT NULL PRIMARY KEY DEFAULT (UUID()),
  interview_id      CHAR(36)     NOT NULL,
  transcript_text   LONGTEXT     NULL COMMENT 'Full transcript text',
  transcript_json   JSON         NULL COMMENT 'Structured transcript with timestamps',
  recording_url     VARCHAR(500) NULL COMMENT 'Video/audio recording URL',
  recording_duration_secs INT    NULL,
  captured_by       CHAR(36)     NULL COMMENT 'Super admin who captured this',
  captured_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_interview (interview_id),
  CONSTRAINT fk_transcript_interview FOREIGN KEY (interview_id) REFERENCES bmi_interview(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Mediator-captured interview transcripts & recordings';

-- 4. Interview recording segments
CREATE TABLE IF NOT EXISTS bmi_interview_recording (
  id                CHAR(36)     NOT NULL PRIMARY KEY DEFAULT (UUID()),
  interview_id      CHAR(36)     NOT NULL,
  recording_url     VARCHAR(500) NOT NULL,
  segment_index     INT          NOT NULL DEFAULT 0,
  duration_seconds  INT          NULL,
  file_size_bytes   BIGINT       NULL,
  created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_interview (interview_id),
  CONSTRAINT fk_recording_interview FOREIGN KEY (interview_id) REFERENCES bmi_interview(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Individual recording segments for an interview';

-- 5. Profile-assessment match log (90% rule tracking)
CREATE TABLE IF NOT EXISTS bmi_match_result (
  id                CHAR(36)     NOT NULL PRIMARY KEY DEFAULT (UUID()),
  application_id    CHAR(36)     NOT NULL,
  profile_match_pct DECIMAL(5,2) NULL COMMENT 'Profile vs JD match percentage',
  assessment_pct    DECIMAL(5,2) NULL COMMENT 'Assessment score percentage',
  profile_passed    TINYINT(1)   DEFAULT 0 COMMENT 'profile_match_pct >= 90',
  assessment_passed TINYINT(1)   DEFAULT 0 COMMENT 'assessment_pct >= 90',
  both_passed       TINYINT(1)   DEFAULT 0 COMMENT 'Both thresholds met',
  checked_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_application (application_id),
  CONSTRAINT fk_match_app FOREIGN KEY (application_id) REFERENCES bmi_application(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Tracks 90% rule: profile match + assessment score check';
