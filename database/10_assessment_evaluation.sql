-- ============================================================
-- BookMyInterview 2.0 — Assessment & Evaluation Engine Schema
-- Migration 10: Run after all prior migrations
-- ============================================================

-- ── Assessment Question Bank (MCQ-capable, scored) ──────────
-- Separate from bmi_job_question_bank (interview screening).
-- This bank holds MCQ/text questions with correct-answer support.
CREATE TABLE IF NOT EXISTS bmi_aq_bank (
  id              VARCHAR(36)  NOT NULL DEFAULT (UUID()),
  tenant_id       VARCHAR(36)  NOT NULL,
  title           VARCHAR(500) NOT NULL,
  question_type   ENUM('single_choice','multi_choice','true_false','short_text','paragraph','scenario','technical','aptitude') NOT NULL DEFAULT 'single_choice',
  category        VARCHAR(100),
  difficulty      ENUM('easy','medium','hard') DEFAULT 'medium',
  options         JSON,
  correct_options JSON,
  explanation     TEXT,
  marks           INT          NOT NULL DEFAULT 1,
  negative_marks  DECIMAL(4,2) DEFAULT 0,
  tags            JSON,
  is_active       TINYINT(1)   DEFAULT 1,
  created_by      VARCHAR(36),
  created_at      DATETIME     DEFAULT NOW(),
  updated_at      DATETIME     DEFAULT NOW() ON UPDATE NOW(),
  PRIMARY KEY (id),
  INDEX idx_tenant   (tenant_id),
  INDEX idx_category (category),
  INDEX idx_type     (question_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Assessment (per-job configuration) ──────────────────────
CREATE TABLE IF NOT EXISTS bmi_assessment (
  id               VARCHAR(36)  NOT NULL DEFAULT (UUID()),
  tenant_id        VARCHAR(36)  NOT NULL,
  job_id           VARCHAR(36)  NOT NULL,
  title            VARCHAR(300) NOT NULL,
  description      TEXT,
  instructions     TEXT,
  time_limit_mins  INT          DEFAULT 30,
  passing_score    DECIMAL(5,2) DEFAULT 60.00,
  total_marks      INT          DEFAULT 0,
  shuffle_qs       TINYINT(1)   DEFAULT 0,
  show_result      TINYINT(1)   DEFAULT 1,
  is_active        TINYINT(1)   DEFAULT 1,
  created_by       VARCHAR(36),
  created_at       DATETIME     DEFAULT NOW(),
  updated_at       DATETIME     DEFAULT NOW() ON UPDATE NOW(),
  PRIMARY KEY (id),
  UNIQUE KEY uniq_job_assessment (job_id),
  INDEX idx_tenant (tenant_id),
  INDEX idx_job    (job_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Assessment Questions (links bank → assessment) ───────────
CREATE TABLE IF NOT EXISTS bmi_assessment_question (
  id             VARCHAR(36) NOT NULL DEFAULT (UUID()),
  assessment_id  VARCHAR(36) NOT NULL,
  aq_bank_id     VARCHAR(36) NOT NULL,
  order_no       INT         DEFAULT 0,
  marks_override INT,
  PRIMARY KEY (id),
  INDEX idx_assessment (assessment_id),
  INDEX idx_bank_q     (aq_bank_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Candidate Assessment Attempt ────────────────────────────
CREATE TABLE IF NOT EXISTS bmi_candidate_assessment (
  id               VARCHAR(36)  NOT NULL DEFAULT (UUID()),
  tenant_id        VARCHAR(36)  NOT NULL,
  assessment_id    VARCHAR(36)  NOT NULL,
  application_id   VARCHAR(36)  NOT NULL,
  candidate_id     VARCHAR(36)  NOT NULL,
  status           ENUM('invited','started','completed','expired') DEFAULT 'invited',
  invite_token     VARCHAR(64),
  invite_sent_at   DATETIME,
  started_at       DATETIME,
  completed_at     DATETIME,
  time_taken_secs  INT,
  total_marks      INT,
  scored_marks     DECIMAL(6,2),
  percentage       DECIMAL(5,2),
  passed           TINYINT(1),
  created_at       DATETIME DEFAULT NOW(),
  PRIMARY KEY (id),
  UNIQUE KEY uniq_app_assessment (application_id),
  UNIQUE KEY uniq_invite_token   (invite_token),
  INDEX idx_candidate  (candidate_id),
  INDEX idx_assessment (assessment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Candidate Answer per Question ───────────────────────────
CREATE TABLE IF NOT EXISTS bmi_candidate_assessment_answer (
  id               VARCHAR(36)   NOT NULL DEFAULT (UUID()),
  attempt_id       VARCHAR(36)   NOT NULL,
  aq_bank_id       VARCHAR(36)   NOT NULL,
  selected_options JSON,
  text_answer      TEXT,
  is_correct       TINYINT(1),
  marks_awarded    DECIMAL(5,2)  DEFAULT 0,
  PRIMARY KEY (id),
  INDEX idx_attempt (attempt_id),
  INDEX idx_q       (aq_bank_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Evaluation Score per Application ────────────────────────
-- Scores are weighted percentages; total_score is out of 100
CREATE TABLE IF NOT EXISTS bmi_evaluation_score (
  id                VARCHAR(36)  NOT NULL DEFAULT (UUID()),
  tenant_id         VARCHAR(36)  NOT NULL,
  application_id    VARCHAR(36)  NOT NULL,
  candidate_id      VARCHAR(36)  NOT NULL,
  job_id            VARCHAR(36)  NOT NULL,
  profile_score     DECIMAL(5,2) DEFAULT 0,    -- weight 25%
  education_score   DECIMAL(5,2) DEFAULT 0,    -- weight 15%
  experience_score  DECIMAL(5,2) DEFAULT 0,    -- weight 20%
  skill_score       DECIMAL(5,2) DEFAULT 0,    -- weight 20%
  resume_score      DECIMAL(5,2) DEFAULT 0,    -- weight 10%
  assessment_score  DECIMAL(5,2) DEFAULT 0,    -- weight 10%
  total_score       DECIMAL(5,2) DEFAULT 0,    -- sum of weighted contributions
  recommendation    ENUM('highly_recommended','recommended','review_required','not_recommended'),
  evaluated_at      DATETIME DEFAULT NOW(),
  updated_at        DATETIME DEFAULT NOW() ON UPDATE NOW(),
  PRIMARY KEY (id),
  UNIQUE KEY uniq_application (application_id),
  INDEX idx_candidate (candidate_id),
  INDEX idx_job       (job_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Interview table (ensure it exists) ──────────────────────
CREATE TABLE IF NOT EXISTS bmi_interview (
  id              VARCHAR(36)  NOT NULL DEFAULT (UUID()),
  tenant_id       VARCHAR(36)  NOT NULL,
  application_id  VARCHAR(36)  NOT NULL,
  candidate_id    VARCHAR(36),
  job_id          VARCHAR(36),
  round_name      VARCHAR(200),
  interview_type  ENUM('hr','technical','managerial','final') DEFAULT 'hr',
  mode            ENUM('online','offline','phone') DEFAULT 'online',
  scheduled_at    DATETIME,
  duration_mins   INT          DEFAULT 60,
  location        VARCHAR(500),
  meeting_link    VARCHAR(1000),
  interviewer_ids JSON,
  status          ENUM('scheduled','confirmed','completed','cancelled','no_show') DEFAULT 'scheduled',
  feedback        TEXT,
  rating          TINYINT,
  recommendation  ENUM('strong_yes','yes','maybe','no','strong_no'),
  created_by      VARCHAR(36),
  created_at      DATETIME DEFAULT NOW(),
  updated_at      DATETIME DEFAULT NOW() ON UPDATE NOW(),
  PRIMARY KEY (id),
  INDEX idx_tenant      (tenant_id),
  INDEX idx_application (application_id),
  INDEX idx_candidate   (candidate_id),
  INDEX idx_scheduled   (scheduled_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Offer table ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bmi_offer (
  id              VARCHAR(36)  NOT NULL DEFAULT (UUID()),
  tenant_id       VARCHAR(36)  NOT NULL,
  application_id  VARCHAR(36)  NOT NULL,
  candidate_id    VARCHAR(36),
  job_id          VARCHAR(36),
  offered_ctc     DECIMAL(12,2),
  joining_date    DATE,
  offer_letter_url VARCHAR(1000),
  status          ENUM('draft','sent','accepted','declined','revoked') DEFAULT 'draft',
  valid_till      DATE,
  remarks         TEXT,
  created_by      VARCHAR(36),
  created_at      DATETIME DEFAULT NOW(),
  updated_at      DATETIME DEFAULT NOW() ON UPDATE NOW(),
  PRIMARY KEY (id),
  INDEX idx_tenant      (tenant_id),
  INDEX idx_application (application_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
